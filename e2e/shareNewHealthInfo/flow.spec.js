import { test, expect } from '@playwright/test';
import { setup, withdrawn, deceased, m, dk, primary, screeningType, Y, N, getPayload } from './support.js';
import en from '../../i18n/en.js';

test.describe('Share New Health Information — E2E', () => {
    test('Q3 instruction is bold + (i) tooltip resolves the official copy and shows on hover', async ({ page }) => {
        await setup(page, { i18n: en });
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');                          // -> Q3
        await page.check('#txReceivedYes');
        // The "Select each treatment…" instruction is bolded via the feature stylesheet (.srcdx-strong),
        // not Bootstrap's .fw-bold (which an app-only CDN stylesheet clobbers).
        const weight = await page.locator('.srcdx-strong').evaluate((el) => getComputedStyle(el).fontWeight);
        expect(['700', 'bold']).toContain(weight);
        await expect(page.locator('[data-i18n="shareHealthInfo.q3NextHint"]')).toBeVisible(); // next-screen hint (Yes branch)
        const icon = page.locator('[data-tooltip-key="shareHealthInfo.q3TxInfo"]');
        const tip = icon.locator('.srcdx-tooltip');
        await expect(tip).toContainText('treatment records');    // resolved i18n text injected
        await expect(tip).toHaveAttribute('data-i18n', 'shareHealthInfo.q3TxInfo'); // re-translates on language switch
        await expect(tip).toBeHidden();                          // hidden until hover/focus
        await icon.hover();
        await expect(tip).toBeVisible();
    });

    test('phone-width info tooltip stays inside the viewport', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'This test owns its viewport.');
        await page.setViewportSize({ width: 390, height: 844 });
        await setup(page, { i18n: en });
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');

        const icon = page.locator('[data-tooltip-key="shareHealthInfo.q3TxInfo"]');
        const tip = icon.locator('.srcdx-tooltip');
        await icon.focus();
        await expect(tip).toBeVisible();
        const box = await tip.boundingBox();
        const viewport = page.viewportSize();

        if (!box || !viewport) throw new Error('Tooltip bounds or viewport were not available.');
        expect(box.x).toBeGreaterThanOrEqual(14);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 14);
    });

    test('happy path (non-screening site, no treatment) → captured submit payload', async ({ page }) => {
        await setup(page);
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible();
        await page.click('#srcdxAddDiagnosis');

        await page.check('#site_prostate');
        await page.click('#srcdxNext');

        await expect(page.locator('#srcdxDxYear')).toBeVisible();
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');

        await expect(page.locator('#txReceivedNo')).toBeVisible();
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');

        // Review → Submit
        await expect(page.locator('#srcdxNext')).toBeVisible();
        await page.click('#srcdxNext');

        const payload = await getPayload(page);
        expect(primary(payload, m.primarySite)).toBe(String(m.cancerSites.prostate));
        expect(payload[dk(m.dxYear)]).toBe('2020');
        expect(payload[dk(m.txReceived)]).toBe(N);
    });

    test('required validation blocks advancing past Q1 with no selection', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.click('#srcdxNext'); // nothing selected
        await expect(page.locator('.form-error')).toBeVisible();
        await expect(page.locator('#site_breast')).toBeVisible(); // still on Q1
    });

    test('resume: reload mid-flow returns to the same screen, values intact', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext'); // now on Q3

        await expect(page.locator('#txReceivedNo')).toBeVisible();
        await page.reload();

        await expect(page.locator('#txReceivedNo')).toBeVisible();          // resumed to Q3
        await expect(page.locator('#srcdxAddDiagnosis')).toHaveCount(0);     // not the landing
        await page.click('#srcdxBack');
        await expect(page.locator('#srcdxDxYear')).toHaveValue('2020');      // value persisted
    });

    test('resume: refreshing on the landing returns to the landing (regression: no under-construction)', async ({ page }) => {
        await setup(page);
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible(); // on the Share New Health Information landing
        await page.reload();
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible(); // still the landing, not a dead-end screen
        await expect(page.getByText('Under construction')).toHaveCount(0);
    });

    test('breast site: screening branch is captured in the payload', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');

        await expect(page.locator('#scrnDetectedYes')).toBeVisible(); // Q4 reached (breast eligible)
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                // -> recap (chosen screenings)
        await page.click('#srcdxNext');                // -> screening detail

        await expect(page.locator('#srcdxScrnYr')).toBeVisible();
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');

        await page.click('#srcdxNext'); // review → submit
        const payload = await getPayload(page);
        expect(primary(payload, m.primarySite)).toBe(String(m.cancerSites.breast));
        expect(payload[dk(m.screening.detected)]).toBe(Y);
        expect(screeningType(payload, m.screening.optionValues.breast2D)).toBe(Y);
        // DxDt + DxNumber are SERVER-stamped at submit — the client snapshot must never carry them.
        expect(dk(m.dxSubmittedTimestamps.breast) in payload).toBe(false);
        expect(dk(m.dxNumber) in payload).toBe(false);
        expect(typeof payload.stateJSON).toBe('string'); // resume blob rides every snapshot
    });

    test('ineligible (withdrawn) participant: route guard renders nothing', async ({ page }) => {
        await setup(page, { fixture: withdrawn });
        await page.waitForFunction(() => window.__SRCDX_RENDERED__ === true || window.__SRCDX_ERROR__);
        await expect(page.locator('#srcdxAddDiagnosis')).toHaveCount(0);
        await expect(page.locator('#shareHealthInfoRoot')).toHaveCount(0);
    });

    test('disabled self-report flag blocks direct route access', async ({ page }) => {
        await setup(page, { selfReportActive: false });
        await page.waitForFunction(() => window.__SRCDX_RENDERED__ === true || window.__SRCDX_ERROR__);
        await expect(page.locator('#srcdxAddDiagnosis')).toHaveCount(0);
        await expect(page.locator('#shareHealthInfoRoot')).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#dashboard');
    });

    test('deceased verified participant can access the self-report flow', async ({ page }) => {
        await setup(page, { fixture: deceased });
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible();
        await expect(page.locator('#shareHealthInfoRoot')).toBeVisible();
    });
});
