import { test, expect } from '@playwright/test';
import { setup, m, dk, getPayload, toTreatmentSummary } from './support.js';

// Regression guards for the navigation audit. Each test
// reproduces a confirmed bug's trigger and asserts the fixed behavior: Back never loops/dead-ends,
// no silent data loss, no empty summary/detail, and resume can't restore a broken state.

const toChemoSummary = async (page, site = 'prostate') => {
    await toTreatmentSummary(page, { site });           // chemo 2021 (shared walk in support.js)
    await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
};

test.describe('Navigation audit regressions', () => {
    // Remove the last treatment, then Back must not loop on an
    // empty summary. It reaches the pre-treatment screen.
    test('nav-01: removing the last treatment then pressing Back is not stuck (reaches Q2)', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('[data-remove-tx="0"]');
        await page.click('[data-confirm-remove="0"]');   // last treatment removed -> bounces to Q3
        await expect(page.locator('#txReceivedYes')).toBeVisible();
        await expect(page.locator('#txReceivedYes')).not.toBeChecked();

        await page.click('#srcdxBack');                  // <- previously looped on the empty summary
        await expect(page.locator('#srcdxDxYear')).toBeVisible();   // reached Q2 (diagnosis date)
        await expect(page.locator('#srcdxDxYear')).toHaveValue('2020');
    });

    // "Add Another" then Back must preserve the existing treatments (a forward
    // navigation previously let Back's clearScreenData wipe them).
    test('cancelling "Add Another Treatment" with Back keeps the existing treatment', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('#srcdxAddTreatment');          // -> Q3 (cancellable edit)
        await expect(page.locator('#txReceivedYes')).toBeChecked();
        await page.click('#srcdxBack');                  // cancel the add
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // chemo still here, not wiped
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.startYear, 1, 1)]).toBe('2021');
    });

    // Removing one of several treatments leaves a valid loop cursor. Back from the summary
    // reaches the remaining treatment's detail, not a stale-index bounce/loop.
    test('nav-02: after removing one of two treatments, Back from the summary reaches the remaining detail', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.check('#tx_surgery');
        await page.click('#srcdxNext');                  // detail chemo
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');                  // detail surgery
        await page.fill('#srcdxTxStartYr', '2022');
        await page.click('#srcdxNext');                  // summary (2 chips, cursor at idx1)
        await page.click('[data-remove-tx="1"]');        // remove surgery -> 1 remains (idx now stale=1)
        await page.click('[data-confirm-remove="1"]');
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);

        await page.click('#srcdxBack');                  // <- previously a no-op loop (idx out of range)
        await expect(page.locator('#srcdxTxStartYr')).toBeVisible();        // reached a detail screen
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');  // the remaining (chemo) detail
    });

    // Editing Q4 (screening) Yes->No from Review then Back must not trap a Review<->empty
    // screeningDetail loop. Back walks cleanly back through the gate.
    test('nav-03: editing Q4 to No from Review, then Back, is not stuck', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');                // eligible
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                  // Q4
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                  // recap (chosen screenings)
        await page.click('#srcdxNext');                  // screening detail
        await page.fill('#srcdxScrnYr', '2018');
        await page.click('#srcdxNext');                  // review
        await page.click('[data-edit="screeningGate"]'); // edit Q4
        await page.check('#scrnDetectedNo');             // Yes -> No (clears screenings)
        await page.click('#srcdxNext');                  // -> review
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();

        await page.click('#srcdxBack');                  // <- previously looped Review<->empty screeningDetail
        await expect(page.locator('#scrnDetectedNo')).toBeVisible();  // reached the gate (No)
        await page.click('#srcdxBack');                  // and keeps going back
        await expect(page.locator('#txReceivedNo')).toBeVisible();    // Q3
    });

    // Editing a section from Review and returning, then a second Back, must not re-enter the
    // edited screen and silently wipe that section.
    test('nav-04: editing Q3 from Review then Back does not wipe the treatment', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('#srcdxNext');                  // review
        await page.click('[data-edit="treatmentReceived"]'); // edit Q3 (no change)
        await page.click('#srcdxNext');                  // -> review
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('#srcdxBack');                  // back from review (pre-edit stack restored)
        // We should not be sitting on an editable Q3 whose next Back wipes treatments. The treatment
        // survives. Drive forward and confirm chemo is intact in the payload.
        // (Back from review lands on the summary for a non-screening site.)
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.startYear, 1, 1)]).toBe('2021');
    });

    // Editing one treatment from the summary chip, next, then back must not duplicate the
    // detail frame and wipe the completed treatment.
    test('nav-06: editing a treatment from the summary chip preserves its data', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('[data-edit-tx="0"]');          // item edit chemo
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxNext');                  // -> summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.startYear, 1, 1)]).toBe('2021'); // not wiped
    });

    // Resume must refuse to restore a (pre-fix) persisted broken state: an empty-treatments
    // summary. It falls back to the landing instead of a self-redirecting dead screen.
    test('Resume guard rejects a persisted empty-treatments summary (falls back to landing)', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');          // ensure the in-progress key exists for connectId E2E
        await page.evaluate(() => {
            const snapshot = {
                stateJSON: JSON.stringify({ state: { primarySite: 'prostate', dxYear: '2020', txReceived: true, treatments: [], screenings: [] } }),
                positionJSON: JSON.stringify({ screenId: 'treatmentSummary', history: ['landing', 'primarySite', 'diagnosisDate', 'treatmentReceived', 'treatmentDetail'], editingTreatmentIndex: 0, editingScreeningIndex: 0, returnTo: null, editMode: null, editBaseHistory: null }),
            };
            sessionStorage.setItem('srcdx_inprogress_e2e', JSON.stringify(snapshot));
        });
        await page.reload();                             // <- previously resumed onto the dead empty summary (loop)
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible();  // safe fallback: the landing
        await expect(page.locator('[data-tx-chip]')).toHaveCount(0);
    });

    // A section re-collect (Q3 edited No->Yes from Review) Back at the first item returns to
    // the gate to re-choose (not forward to Review with a half-collected item).
    test('nav-05: section re-collect Back at the first item returns to the gate, not Review', async ({ page }) => {
        await setup(page);
        // prostate, Q3=No -> review
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                  // review
        await page.click('[data-edit="treatmentReceived"]'); // edit Q3
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');                   // incomplete -> section re-collect
        await page.click('#srcdxNext');                  // -> treatment detail (idx0)
        await expect(page.locator('#srcdxTxStartYr')).toBeVisible();
        await page.click('#srcdxBack');                  // back at first item -> GATE (Q3), not Review
        await expect(page.locator('#txReceivedYes')).toBeVisible();
        await expect(page.locator('[data-edit="primarySite"]')).toHaveCount(0); // NOT review
    });
});
