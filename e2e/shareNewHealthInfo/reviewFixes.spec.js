import { test, expect } from '@playwright/test';
import { setup, m, dk, Y, N, getPayload, toTreatmentSummary } from './support.js';
import en from '../../i18n/en.js';
import es from '../../i18n/es.js';

// Regression guards. Each test reproduces a bug's trigger and asserts the fixed behavior: edit-returns restore the loop cursor and
// roll back cancelled data, the controller forward-skips dead screens on clean stacks, validation
// errors are translated/placed/focused, and the remove-confirm modal contains keyboard focus.

const toSummary = async (page, types = ['chemo'], years = ['2021'], site = 'prostate') => {
    await toTreatmentSummary(page, { site, types, years }); // shared walk in support.js
    await expect(page.locator('[data-tx-chip]')).toHaveCount(types.length);
};

test.describe('Review-pass regressions', () => {
    // After a chip edit returns, Back from the summary must re-enter the loop at the
    // last item (not the edited chip's index) and back-walk every item with data intact.
    test('chip edit, then Back from summary: walks back from the LAST treatment, no data wiped', async ({ page }) => {
        await setup(page);
        await toSummary(page, ['chemo', 'surgery'], ['2021', '2022']);
        await page.click('[data-edit-tx="0"]');        // edit chemo (idx 0)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxNext');                // commit -> summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(2);

        await page.click('#srcdxBack');                // -> detail at the LAST item (surgery)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2022');
        await page.click('#srcdxBack');                // within-loop -> chemo, value intact (not wiped)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxBack');                // -> Q3
        await expect(page.locator('#txReceivedYes')).toBeChecked();
    });

    // 'No' on the detail during a chip edit must take the no-treatment path, never the dead empty summary.
    test('answering "No" during a chip edit lands on review (no-treatment path), not an empty summary', async ({ page }) => {
        await setup(page);
        await toSummary(page);                          // prostate, 1 chemo
        await page.click('[data-edit-tx="0"]');
        await page.click('#txDetailNo');                // empties treatments mid-edit
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // review (prostate skips screening)
        await expect(page.locator('[data-tx-chip]')).toHaveCount(0);           // NOT the summary
        await page.click('#srcdxBack');                 // -> Q3, No reflected
        await expect(page.locator('#txReceivedNo')).toBeChecked();
    });

    // 'No' via Add-Another must leave a clean stack. Every Back changes screen (no duplicate-frame no-op press).
    test('Add Another then "No": each Back press changes screen (clean history, no no-op)', async ({ page }) => {
        await setup(page);
        await toSummary(page);                          // prostate, 1 chemo
        await page.click('#srcdxAddTreatment');         // cancellable edit -> Q3
        await page.click('#txReceivedNo');
        await page.click('#srcdxNext');                 // -> review (treatments emptied; origin dead)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('#srcdxBack');                 // -> Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible();
        await page.click('#srcdxBack');                 // -> Q2 in ONE press (no duplicate-Q3 no-op)
        await expect(page.locator('#srcdxDxYear')).toBeVisible();
        await expect(page.locator('#srcdxDxYear')).toHaveValue('2020');
    });

    // Cancelling an Add-Another after the gate harvested a new type removes the phantom detail-less treatment.
    test('cancelling Add-Another after picking a new type leaves no phantom treatment', async ({ page }) => {
        await setup(page);
        await toSummary(page);                          // prostate, chemo 2021
        await page.click('#srcdxAddTreatment');         // -> Q3
        await page.check('#tx_surgery');                // new type
        await page.click('#srcdxNext');                 // -> first incomplete detail (surgery)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('');
        await page.click('#srcdxBack');                 // -> previous completed detail (chemo)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxBack');                 // -> gate
        await page.click('#srcdxBack');                 // cancel -> summary, edit rolled back
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // chemo only — no phantom surgery
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit succeeds (nothing incomplete)
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[dk(m.treatment.surgery)]).toBe(N);
        expect(payload[dk(m.treatment.startYear, 1, 1)]).toBe('2021');
    });

    // Cancelling a Q3 No->Yes edit from Review restores the original "No" answer instead of stranding a half-collected treatment.
    test('cancelling a Q3 No->Yes review edit restores the original No answer', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                 // review (Q3 = No)
        await page.click('[data-edit="treatmentReceived"]');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                 // -> detail (section re-collect)
        await page.click('#srcdxBack');                 // -> gate
        await page.click('#srcdxBack');                 // cancel -> review, snapshot restored
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('#srcdxNext');                 // submit succeeds — Q3 is back to its answered "No"
        const payload = await getPayload(page);
        expect(payload[dk(m.txReceived)]).toBe(N);
        expect(dk(m.treatment.chemo) in payload).toBe(false); // txReceived=No -> section omitted
    });

    // Add/remove clicks mid-chip-edit commit harvests. Back must still cancel cleanly.
    test('cancelling a chip edit after an add-physician click rolls the field changes back', async ({ page }) => {
        await setup(page);
        await toSummary(page);                          // chemo 2021
        await page.click('[data-edit-tx="0"]');
        await page.fill('#srcdxTxStartYr', '2030');     // change the year mid-edit...
        await page.click('#srcdxAddPhys');              // ...then an add click harvests it into state
        await page.click('#srcdxBack');                 // cancel the edit
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.startYear, 1, 1)]).toBe('2021'); // rolled back, not 2030
    });

    // Validation errors are translated, placed next to the group (before the nav row), and move focus to the group's first control.
    test('Spanish session shows the translated Q1 error, placed before the nav row, with focus moved', async ({ page }) => {
        await setup(page, { i18n: es });
        await page.click('#srcdxAddDiagnosis');
        await page.click('#srcdxNext');                 // no site selected -> error
        const err = page.locator('.form-error');
        await expect(err).toHaveText('Seleccione un lugar de cáncer.'); // es.js copy, not the English fallback
        const placement = await page.evaluate(() => {
            const errEl = document.querySelector('.error-text');
            const nav = document.querySelector('.srcdx-nav');
            return {
                beforeNav: !!(errEl.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING),
                focusedId: document.activeElement && document.activeElement.id,
            };
        });
        expect(placement.beforeNav).toBe(true);                  // error sits above Back/Next
        expect(placement.focusedId).toMatch(/^site_/);           // focus on the first site radio
    });

    test('English Q3 type error appears below the type checkboxes (not after the buttons)', async ({ page }) => {
        await setup(page, { i18n: en });
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');             // Yes but no type selected
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveText('Please select at least one treatment.');
        const beforeNav = await page.evaluate(() => {
            const errEl = document.querySelector('.error-text');
            const nav = document.querySelector('.srcdx-nav');
            return !!(errEl.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING);
        });
        expect(beforeNav).toBe(true);
    });

    // The remove-confirm modal contains keyboard focus and Escape cancels.
    test('remove-confirm modal traps Tab within the dialog and Escape cancels it', async ({ page }) => {
        await setup(page);
        await toSummary(page);
        await page.click('[data-remove-tx="0"]');       // open the modal
        await expect(page.locator('.srcdx-modal')).toBeVisible();
        // Initial focus on the safe action (Go Back).
        await expect(page.locator('.srcdx-modal .btn[data-cancel-remove]')).toBeFocused();
        // Tab cycles within the dialog — focus never reaches the page behind it.
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            const inModal = await page.evaluate(() => !!document.activeElement.closest('.srcdx-modal'));
            expect(inModal).toBe(true);
        }
        await page.keyboard.press('Escape');            // cancel
        await expect(page.locator('.srcdx-modal')).toHaveCount(0);
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // nothing deleted
    });
});
