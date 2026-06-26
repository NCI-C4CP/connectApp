import { test, expect } from '@playwright/test';
import { setup, m, dk, ndk, Y, N, getPayload, toTreatmentGate, toTreatmentSummary } from './support.js';

test.describe('Navigation, changing answers, data flow, and resume', () => {
    test('Back discards the screen you leave (forward saves, back clears)', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');               // -> Q2
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');               // -> Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible();

        await page.click('#srcdxBack');               // -> Q2 (backing from Q3 leaves Q2 intact)
        await expect(page.locator('#srcdxDxYear')).toHaveValue('2020');
        await page.click('#srcdxBack');               // -> Q1 (backing OUT of Q2 clears it)
        await expect(page.locator('#site_breast')).toBeChecked();

        await page.click('#srcdxNext');               // -> Q2 (now blank — was cleared)
        await expect(page.locator('#srcdxDxYear')).toHaveValue('');
    });

    test('Other site write-in flows through to the payload', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_other');
        await page.fill('#srcdxPrimarySiteOther', 'Gallbladder');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');               // "other" is non-screening -> review
        await page.click('#srcdxNext');               // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.primarySite)]).toBe(String(m.cancerSites.other));
        expect(payload[dk(m.primarySiteOther)]).toBe('Gallbladder');
    });

    test('Changing the site to a non-screening site drops stale screening data', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');               // Q4 (breast eligible)
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');               // recap (chosen screenings)
        await page.click('#srcdxNext');               // screening detail
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');               // review

        // Edit the site from review -> change to a non-screening site
        await page.click('[data-edit="primarySite"]');
        await expect(page.locator('#site_prostate')).toBeVisible();
        await page.check('#site_prostate');
        await page.click('#srcdxNext');               // returnTo review

        await expect(page.locator('[data-edit="screeningGate"]')).toHaveCount(0); // screening card gone
        await page.click('#srcdxNext');               // submit

        const payload = await getPayload(page);
        expect(payload[dk(m.primarySite)]).toBe(String(m.cancerSites.prostate));
        expect(payload[dk(m.screening.detected)]).toBeUndefined();
        expect(payload[dk(m.screening.optionValues.breast2D)]).toBeUndefined();
        expect(payload[dk(m.dxSubmittedTimestamps.breast)]).toBeUndefined(); // server-stamped, never client-emitted
    });

    test('Changing treatment Yes -> No clears treatment data from the payload', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');               // treatment detail
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');               // treatment summary
        await expect(page.locator('#srcdxAddTreatment')).toBeVisible();
        await page.click('#srcdxNext');               // review

        await page.click('[data-edit="treatmentReceived"]');
        await expect(page.locator('#txReceivedNo')).toBeVisible();
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');               // returnTo review
        await page.click('#srcdxNext');               // submit

        const payload = await getPayload(page);
        expect(payload[dk(m.txReceived)]).toBe(N);
        expect(payload[dk(m.treatment.chemo)]).toBeUndefined(); // txReceived=No -> section omitted
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBeUndefined();
    });

    test('Unhappy: a future diagnosis year is rejected', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2999');
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toBeVisible();
        await expect(page.locator('#srcdxDxYear')).toBeVisible(); // still on Q2
    });

    test('Unhappy: treatment requires a start year', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');               // treatment detail
        await page.click('#srcdxNext');               // no start year entered
        await expect(page.locator('.form-error')).toBeVisible();
        await expect(page.locator('#srcdxTxStartYr')).toBeVisible(); // still on detail
    });

    test('Treatment dates: future (scheduled) start year is allowed; end-date XOR ongoing is bidirectional', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                       // treatment detail
        await page.fill('#srcdxTxStartYr', '2021');

        // Mutual exclusivity (comp note 3). Forgiving, symmetric, nothing disabled:
        // Checking "ongoing"
        await page.check('#srcdxTxOngoing');
        await expect(page.locator('#srcdxTxOngoing')).toBeChecked();
        // …then entering an end date unchecks it (and the field was never disabled)…
        await page.fill('#srcdxTxEndYr', '2023');
        await expect(page.locator('#srcdxTxOngoing')).not.toBeChecked();
        // …and re-checking "ongoing" clears the end date.
        await page.check('#srcdxTxOngoing');
        await expect(page.locator('#srcdxTxEndYr')).toHaveValue('');
        await page.uncheck('#srcdxTxOngoing');

        // Note: a future/scheduled start year is accepted (no past-only restriction).
        const futureYear = String(new Date().getFullYear() + 2);
        await page.fill('#srcdxTxStartYr', futureYear);
        await page.click('#srcdxNext');                       // -> summary, no validation error
        await expect(page.locator('#srcdxAddTreatment')).toBeVisible();
    });

    test('Treatment detail: selecting "No" clears treatment and takes the no-treatment path', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');                     // screening-eligible
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                       // treatment detail
        await expect(page.locator('#srcdxTxStartYr')).toBeVisible();
        // Click (not check): selecting "No" reroutes immediately, detaching the radio before
        // Playwright's check() could verify its state.
        await page.click('#txDetailNo');                      // "No" on the detail screen
        await expect(page.locator('#scrnDetectedYes')).toBeVisible(); // -> screening gate (breast eligible)
        await page.click('#srcdxBack');                       // Back returns to Q3…
        await expect(page.locator('#txReceivedNo')).toBeChecked(); // …now reflecting "No treatment"
    });

    test('Treatment summary: selecting "No" clears the treatments and takes the no-treatment path', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');                   // non-eligible -> review
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                       // detail
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');                       // summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#txSummaryNo');                     // "No" on the summary (click: reroutes immediately)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // -> review (prostate skips screening)
        // Treatment was cleared -> review shows Q3 = No, with no reported treatments.
        const q3Row = page.locator('[data-edit="treatmentReceived"]').locator('xpath=ancestor::div[contains(@class,"srcdx-review-item")]');
        await expect(q3Row).not.toContainText('Reported Treatments');
    });

    test('Reopen a started survey (reload) deep in the flow, values intact, then complete', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');               // treatment detail
        await page.fill('#srcdxTxStartYr', '2021');
        await page.fill('#srcdxPhysFirst_0', 'Ada');
        await page.fill('#srcdxPhysLast_0', 'Lovelace');
        await page.click('#srcdxNext');               // -> summary (persisted)
        await expect(page.locator('#srcdxAddTreatment')).toBeVisible();

        await page.reload();                          // reopen the 'started' survey
        await expect(page.locator('#srcdxAddTreatment')).toBeVisible(); // resumed to summary

        await page.click('[data-edit-tx="0"]');       // re-open the treatment detail
        await expect(page.locator('#srcdxPhysFirst_0')).toHaveValue('Ada'); // loop data survived
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2021');
        await page.click('#srcdxNext');               // -> summary (returnTo)
        await page.click('#srcdxNext');               // -> review
        await page.click('#srcdxNext');               // submit

        const payload = await getPayload(page);
        expect(payload[ndk(m.treatment.chemo, m.treatment.physFirstName, 1)]).toBe('Ada');
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
    });

    // The screening branch (Q4) is computed from the persisted primary-site answer. These two
    // reload before the branch point (on Q3), then cross it, proving the reloaded Q1 answer routes
    // an eligible site into the screening gate and a non-eligible site straight to review.
    test('Reload before the branch: an eligible site (breast) still routes to the screening gate', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');             // Q1: screening-eligible
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');               // -> Q3 (persisted; before the screening branch)
        await expect(page.locator('#txReceivedNo')).toBeVisible();

        await page.reload();                          // reopen the 'started' survey on Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible(); // resumed to Q3

        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');               // branch computed from the *reloaded* site
        await expect(page.locator('#scrnDetectedYes')).toBeVisible();        // -> screening gate (Q4)
        await expect(page.locator('[data-edit="primarySite"]')).toHaveCount(0); // not review
    });

    test('Reload before the branch: a non-eligible site (prostate) still skips screening to review', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');           // Q1: NOT screening-eligible
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');               // -> Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible();

        await page.reload();                          // reopen on Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible();

        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');               // branch computed from the *reloaded* site
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // -> review
        await expect(page.locator('#scrnDetectedYes')).toHaveCount(0);         // screening gate skipped
    });

    // Treatment-type loop re-entry (editingTreatmentIndex must not go stale).
    // Re-entering the loop from Q3 starts at the first incomplete treatment, not completed rows.
    // Each treatment is identified by its previously-entered start year (translation-independent).
    const walkTwoTypes = async (page) => {
        // non-screening site: detail -> summary -> review (shared walk in support.js)
        await toTreatmentSummary(page, { site: 'prostate', types: ['chemo', 'surgery'], years: ['2021', '2022'] });
        await expect(page.locator('[data-tx-chip]')).toHaveCount(2);
    };

    test('Add Another + add a type: loop starts at the first incomplete treatment', async ({ page }) => {
        await setup(page);
        await walkTwoTypes(page);

        await page.click('#srcdxAddTreatment');       // -> Q3 (cursor stale at idx1)
        await page.check('#tx_radiation');            // chemo + surgery + radiation
        await page.click('#srcdxNext');               // -> detail loop

        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('');     // radiation (new)
        await page.fill('#srcdxTxStartYr', '2023');
        await page.click('#srcdxNext');               // summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(3);

        await page.click('#srcdxNext');               // review
        await page.click('#srcdxNext');               // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[dk(m.treatment.surgery)]).toBe(Y);
        expect(payload[dk(m.treatment.radiation)]).toBe(Y);
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
        expect(payload[ndk(m.treatment.surgery, m.treatment.startYear)]).toBe('2022');
        expect(payload[ndk(m.treatment.radiation, m.treatment.startYear)]).toBe('2023');
    });

    test('Add Another after chemo: adding radiation and other skips completed chemo, then visits only incomplete details', async ({ page }) => {
        await setup(page);
        await toTreatmentSummary(page, { site: 'prostate', types: ['chemo'], years: ['2021'] });
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);

        await page.click('#srcdxAddTreatment');
        await page.check('#tx_radiation');
        await page.check('#tx_other');
        await page.fill('#srcdxTxOtherDescribe', 'Immunotherapy');
        await page.click('#srcdxNext');

        await expect(page.locator('[data-i18n="shareHealthInfo.tx_radiation"]')).toBeVisible();
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('');
        await page.fill('#srcdxTxStartYr', '2022');
        await page.click('#srcdxNext');

        await expect(page.locator('[data-i18n="shareHealthInfo.tx_other"]')).toBeVisible();
        await expect(page.locator('p').filter({ has: page.locator('[data-i18n="shareHealthInfo.tx_other"]') })).toContainText('Immunotherapy');
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('');
        await page.fill('#srcdxTxStartYr', '2023');
        await page.click('#srcdxNext');

        await expect(page.locator('[data-tx-chip]')).toHaveCount(3);
        await expect(page.locator('[data-tx-chip]').filter({ has: page.locator('[data-i18n="shareHealthInfo.tx_other"]') })).toContainText('Immunotherapy');
        await page.click('#srcdxNext');
        await expect(page.locator('[data-review-row="tx_2"]')).toContainText('Immunotherapy');
        await page.click('#srcdxNext');
        const payload = await getPayload(page);
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
        expect(payload[ndk(m.treatment.radiation, m.treatment.startYear)]).toBe('2022');
        expect(payload[ndk(m.treatment.other, m.treatment.startYear)]).toBe('2023');
        expect(payload[dk(m.treatment.otherDescribe)]).toBe('Immunotherapy');
    });

    test('Add Another, then uncheck a type leaving a complete one: returns cleanly to the summary (no stale-index bounce)', async ({ page }) => {
        await setup(page);
        await walkTwoTypes(page);                     // chemo(2021) + surgery(2022), on the summary

        await page.click('#srcdxAddTreatment');       // -> Q3 (cancellable edit)
        await page.uncheck('#tx_surgery');            // remove surgery; chemo remains and is COMPLETE
        await page.click('#srcdxNext');

        // The remaining treatment is complete, so there's nothing to re-collect -> straight back to
        // the summary with just chemo. No stale-index bounce to an empty detail, no stuck state.
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('#srcdxNext');               // review
        await page.click('#srcdxNext');               // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[dk(m.treatment.surgery)]).toBe(N);              // surgery removed -> explicit No
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021'); // chemo data intact
    });

    test('Remove a treatment, then Add Another: loop starts at the first incomplete treatment', async ({ page }) => {
        await setup(page);
        await walkTwoTypes(page);

        await page.click('[data-remove-tx="0"]');     // remove chemo (cursor stays stale at idx1)
        await page.click('[data-confirm-remove="0"]');
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // surgery remains

        await page.click('#srcdxAddTreatment');       // -> Q3
        await page.check('#tx_radiation');            // surgery + radiation
        await page.click('#srcdxNext');               // -> detail loop

        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('');     // radiation (new)
    });
});

// Editing branching answers from the Review screen. A returnTo=REVIEW edit previously short-circuited
// the forward routing, which: (E1/E2) stranded detail-less treatments/screenings with no way to fill
// them in, and (E3/E4) let wrong-site screening data ride along or show a fabricated "No". These
// guard the surgical re-collect fix and the payload/display/submit hardening.
test.describe('Editing branching answers from Review', () => {
    const toReviewNoTreatment = async (page, site) => {
        await toTreatmentGate(page, { site }); // shared walk in support.js
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext'); // breast -> Q4; non-eligible -> review
    };

    test('E1: edit Q3 No->Yes at review walks the treatment detail loop, then returns to review', async ({ page }) => {
        await setup(page);
        await toReviewNoTreatment(page, 'prostate');     // review (no screening for prostate)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();

        await page.click('[data-edit="treatmentReceived"]');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                  // -> treatment detail (NOT straight to review)
        await expect(page.locator('#srcdxTxStartYr')).toBeVisible();
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');                  // section edit done -> back to review
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();

        await page.click('#srcdxNext');                  // submit now succeeds (detail was collected)
        const payload = await getPayload(page);
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
    });

    test('E2: edit Q4 No->Yes at review walks the screening detail loop, then returns to review', async ({ page }) => {
        await setup(page);
        await toReviewNoTreatment(page, 'breast');       // breast is eligible -> lands on Q4
        await page.check('#scrnDetectedNo');
        await page.click('#srcdxNext');                  // -> review (Q4 = No)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('[data-edit="screeningGate"]');
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                  // -> screening detail (NOT straight to review)
        await expect(page.locator('#srcdxScrnYr')).toBeVisible();
        await page.fill('#srcdxScrnYr', '2018');
        await page.click('#srcdxNext');                  // -> review
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();

        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.screening.optionValues.breast2D)]).toBe(Y);
        expect(payload[ndk(m.screening.optionValues.breast2D, m.screening.year)]).toBe('2018');
    });

    test('E2b: editing Q4 to add a screening opens the newly incomplete screening detail', async ({ page }) => {
        await setup(page);
        await toReviewNoTreatment(page, 'breast');
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                  // recap
        await page.click('#srcdxNext');                  // detail: breast2D
        await page.fill('#srcdxScrnYr', '2018');
        await page.click('#srcdxNext');                  // review

        await page.click('[data-edit="screeningGate"]');
        await page.check('#scrn_breastMRI');
        await page.click('#srcdxNext');

        await expect(page.locator('#srcdxScrnIntro [data-i18n="shareHealthInfo.scrn_breastMRI"]')).toBeVisible();
        await expect(page.locator('#srcdxScrnYr')).toHaveValue('');
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.screening.optionValues.breast2D)]).toBe(Y);
        expect(payload[dk(m.screening.optionValues.breastMRI)]).toBe(Y);
        expect(payload[ndk(m.screening.optionValues.breast2D, m.screening.year)]).toBe('2018');
        expect(payload[ndk(m.screening.optionValues.breastMRI, m.screening.year)]).toBe('2019');
    });

    test('E1b: editing Q3 with all detail already complete returns straight to review (no needless re-walk)', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');                  // summary
        await page.click('#srcdxNext');                  // review
        await page.click('[data-edit="treatmentReceived"]'); // edit Q3 but change nothing
        await page.click('#srcdxNext');                  // complete already -> straight back to review
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await expect(page.locator('#srcdxTxStartYr')).toHaveCount(0); // did NOT re-enter the detail loop
    });

    test('E3: editing primary site breast->colon does NOT leak breast screening into the colon payload', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
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
        await page.click('[data-edit="primarySite"]');
        await page.check('#site_colon');           // breast -> colon
        await page.click('#srcdxNext');                  // -> review (screening NOT cleared, but now invalid for colon)

        // Q4 row shows "Yes" with no valid colon screening listed -> submit is blocked until reconciled.
        await page.click('#srcdxNext');
        await expect(page.locator('#srcdxReviewError .form-error')).toHaveCount(1); // blocked (not corrupt)
        // Fix it: answer Q4 for colon.
        await page.click('[data-edit="screeningGate"]');
        await page.check('#scrn_colonCol');
        await page.click('#srcdxNext');                  // screening detail (colonCol)
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');                  // review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.primarySite)]).toBeTruthy();
        expect(dk(m.screening.optionValues.breast2D) in payload).toBe(false); // breast option never emitted for colon
        expect(payload[dk(m.screening.optionValues.colonCol)]).toBe(Y);       // colon screening present
        expect(payload[ndk(m.screening.optionValues.colonCol, m.screening.year)]).toBe('2019');
    });

    test('E4: editing primary site prostate->breast leaves Q4 blank and blocks submit', async ({ page }) => {
        await setup(page);
        await toReviewNoTreatment(page, 'prostate');     // review, no Q4 (prostate non-eligible)
        await expect(page.locator('[data-edit="screeningGate"]')).toHaveCount(0);

        await page.click('[data-edit="primarySite"]');
        await page.check('#site_breast');                // prostate -> breast (now eligible)
        await page.click('#srcdxNext');                  // -> review

        const q4Row = page.locator('[data-edit="screeningGate"]').locator('xpath=ancestor::div[contains(@class,"srcdx-review-item")]');
        await expect(q4Row.locator('[data-i18n="shareHealthInfo.q4NotAnswered"]')).toHaveText('');
        await page.click('#srcdxNext');
        await expect(page.locator('#srcdxReviewError .form-error')).toHaveCount(1); // submit blocked until answered

        await page.click('[data-edit="screeningGate"]');
        await page.check('#scrnDetectedNo');             // answer it
        await page.click('#srcdxNext');                  // -> review
        await page.click('#srcdxNext');                  // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.screening.detected)]).toBe(N);
    });
});
