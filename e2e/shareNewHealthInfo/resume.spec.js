import { test, expect } from '@playwright/test';
import { setup, m, dk, N, getPayload } from './support.js';

// Restart (leave & return), reload-mid-flow, append-only re-start, and the "No" reroute. The harness
// re-runs renderShareNewHealthInfo() on every load, so page.reload() models leaving and returning.

const inProgressKey = (page) => page.evaluate(() => {
    for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('srcdx_inprogress_')) return k;
    }
    return null;
});

test.describe('Restart, resume & reroute', () => {
    test('after submit, leaving & returning shows the landing (not the confirmation) and clears the in-progress slot', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit -> confirmation
        await expect(page.locator('#srcdxAddAnother')).toBeVisible();
        expect(await inProgressKey(page)).toBeNull();   // submit cleared the slot (not re-persisted)

        await page.reload();                            // leave & return
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible();   // landing
        await expect(page.locator('#srcdxAddAnother')).toHaveCount(0);    // NOT the stale confirmation
    });

    test('append-only: a second diagnosis started from the confirmation does not inherit the first', async ({ page }) => {
        await setup(page);
        // Diagnosis 1: breast + chemo + screening.
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2018');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');
        await page.fill('#srcdxTxStartYr', '2020');
        await page.click('#srcdxNext');                 // summary
        await page.click('#srcdxNext');                 // Q4
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                 // recap (chosen screenings)
        await page.click('#srcdxNext');                 // screening detail
        await page.fill('#srcdxScrnYr', '2017');
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit

        // Diagnosis 2: prostate, no treatment, no screening.
        await page.click('#srcdxAddAnother');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2021');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.dxYear)]).toBe('2021');
        expect(payload[dk(m.txReceived)]).toBe(N);
        expect(dk(m.treatment.chemo) in payload).toBe(false);                // txReceived=No -> section omitted
        expect(dk(m.treatment.startYear, 1, 1) in payload).toBe(false);
        expect(dk(m.screening.optionValues.breast2D) in payload).toBe(false); // no leftover screening
        expect(dk(m.primarySiteOther) in payload).toBe(false);
    });

    test('reloading mid treatment-detail loop resumes the same item; the prior item stays saved', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.check('#tx_surgery');
        await page.click('#srcdxNext');                 // detail chemo (idx0)
        await page.fill('#srcdxTxStartYr', '2020');
        await page.click('#srcdxNext');                 // -> detail surgery (idx1); chemo now persisted

        await page.reload();                            // leave & return mid-loop on surgery
        await expect(page.locator('#srcdxTxStartYr')).toBeVisible();         // resumed onto a detail screen
        await page.click('#srcdxBack');                 // within-loop Back -> chemo (idx0)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2020');   // prior item's saved value intact
    });

    test('reloading mid single-item edit (summary chip) resumes the edit and returns to the summary', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');
        await page.fill('#srcdxTxStartYr', '2020');
        await page.click('#srcdxNext');                 // summary
        await page.click('[data-edit-tx="0"]');         // edit chemo (single-item edit)
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2020');

        await page.reload();                            // leave & return mid-edit
        await expect(page.locator('#srcdxTxStartYr')).toHaveValue('2020');  // resumed the edit, value intact
        await page.click('#srcdxNext');                 // single-item edit returns to the summary (no auto-walk)
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
    });

    test('treatment-detail "No" reroute survives a reload; Back returns to Q3 with "No" preserved', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');               // screening-eligible
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                 // treatment detail
        await page.click('#txDetailNo');                // "No" -> reroute to the screening gate (click, not check: reroute swaps the DOM)
        await expect(page.locator('#scrnDetectedYes')).toBeVisible();

        await page.reload();                            // leave & return mid-reroute
        await expect(page.locator('#scrnDetectedYes')).toBeVisible();   // resumes to the gate
        await page.click('#srcdxBack');                 // Back from the gate -> Q3
        await expect(page.locator('#txReceivedNo')).toBeVisible();
        await expect(page.locator('#txReceivedNo')).toBeChecked();      // txReceived=false preserved
    });
});
