import { test, expect } from '@playwright/test';
import { setup, m, dk, ndk, Y, N, getPayload, toTreatmentSummary } from './support.js';

// Regression guards for the navigation audit. Each test
// reproduces a confirmed bug's trigger and asserts the fixed behavior: Back never loops/dead-ends,
// no silent data loss, no empty summary/detail, and resume can't restore a broken state.

const toChemoSummary = async (page, site = 'prostate') => {
    await toTreatmentSummary(page, { site });           // chemo 2021 (shared walk in support.js)
    await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
};

const toSummary = async (page, types = ['chemo'], years = ['2021'], site = 'prostate') => {
    await toTreatmentSummary(page, { site, types, years });
    await expect(page.locator('[data-tx-chip]')).toHaveCount(types.length);
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
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
    });

    // 'No' via Add Another must leave a clean stack. Every Back changes screen.
    test('Add Another then "No": each Back press changes screen', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('#srcdxAddTreatment');          // cancellable edit -> Q3
        await page.click('#txReceivedNo');
        await page.click('#srcdxNext');                  // -> review (treatments emptied; origin dead)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('#srcdxBack');                  // -> Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible();
        await page.click('#srcdxBack');                  // -> Q2 in one press (no duplicate-Q3 no-op)
        await expect(page.locator('#srcdxDxYear')).toBeVisible();
        await expect(page.locator('#srcdxDxYear')).toHaveValue('2020');
    });

    // Cancelling an Add Another after Q3 harvested a new type removes the detail-less treatment.
    test('cancelling Add Another after picking a new type leaves no phantom treatment', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('#srcdxAddTreatment');          // -> Q3
        await page.check('#tx_surgery');                 // new type
        await page.click('#srcdxNext');                  // -> first incomplete detail (surgery)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('');
        await page.click('#srcdxBack');                  // -> previous completed detail (chemo)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxBack');                  // -> gate
        await page.click('#srcdxBack');                  // cancel -> summary, edit rolled back
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit succeeds (nothing incomplete)
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[dk(m.treatment.surgery)]).toBe(N);
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
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
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
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
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021'); // not wiped
    });

    // After a chip edit returns, Back from summary must re-enter at the last item.
    test('chip edit, then Back from summary walks from the last treatment without wiping data', async ({ page }) => {
        await setup(page);
        await toSummary(page, ['chemo', 'surgery'], ['2021', '2022']);
        await page.click('[data-edit-tx="0"]');          // edit chemo (idx 0)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxNext');                  // commit -> summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(2);

        await page.click('#srcdxBack');                  // -> detail at the last item (surgery)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2022');
        await page.click('#srcdxBack');                  // within-loop -> chemo, value intact
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxBack');                  // -> Q3
        await expect(page.locator('#txReceivedYes')).toBeChecked();
    });

    // 'No' on the detail during a chip edit must take the no-treatment path, never an empty summary.
    test('answering "No" during a chip edit lands on review, not an empty summary', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('[data-edit-tx="0"]');
        await page.click('#txDetailNo');                 // empties treatments mid-edit
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // review; prostate skips screening
        await expect(page.locator('[data-tx-chip]')).toHaveCount(0);           // not the summary
        await page.click('#srcdxBack');                  // -> Q3, No reflected
        await expect(page.locator('#txReceivedNo')).toBeChecked();
    });

    // Add/remove clicks during item edit harvest values. Back must still roll them back.
    test('cancelling a chip edit after an add-physician click rolls field changes back', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('[data-edit-tx="0"]');
        await page.fill('#srcdxTxStartYr', '2030');      // change the year mid-edit
        await page.click('#srcdxAddPhys');               // then an add click harvests it into state
        await page.click('#srcdxBack');                  // cancel the edit
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
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

    // Cancelling a Q3 No->Yes edit from Review restores the original No answer.
    test('cancelling a Q3 No-to-Yes review edit restores the original No answer', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                  // review (Q3 = No)
        await page.click('[data-edit="treatmentReceived"]');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                  // -> detail (section re-collect)
        await page.click('#srcdxBack');                  // -> gate
        await page.click('#srcdxBack');                  // cancel -> review, snapshot restored
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('#srcdxNext');                  // submit succeeds with Q3 restored to No
        const payload = await getPayload(page);
        expect(payload[dk(m.txReceived)]).toBe(N);
        expect(dk(m.treatment.chemo) in payload).toBe(false);
    });
});
