import { test, expect } from '@playwright/test';
import { setup, m, dk, txType, txDetail, Y, N, getPayload } from './support.js';
import en from '../../i18n/en.js';
import es from '../../i18n/es.js';

test.describe('Returning-user landing (previously reported)', () => {
    test('lists each prior diagnosis; "Add a Diagnosis" starts a fresh flow', async ({ page }) => {
        await setup(page, {
            i18n: en,
            prior: [{ location: 'Lung', dxDate: '09/2025' }, { location: 'Breast', dxDate: '03/2023' }],
        });
        await page.waitForSelector('#srcdxAddDiagnosis');
        await expect(page.locator('body')).toContainText('Lung');
        await expect(page.locator('body')).toContainText('09/2025');
        await expect(page.locator('body')).toContainText('Breast');
        await expect(page.locator('body')).toContainText('03/2023');

        await page.click('#srcdxAddDiagnosis');
        await expect(page.locator('#site_breast')).toBeVisible();     // fresh Q1
        await expect(page.locator('#site_breast')).not.toBeChecked(); // nothing pre-selected
    });

    test('escapes HTML in prior fields (no XSS) and tolerates a missing date', async ({ page }) => {
        await setup(page, {
            prior: [{ location: '<img src=x onerror="window.__XSS__=1">Brain', dxDate: null }],
        });
        await page.waitForSelector('#srcdxAddDiagnosis');
        expect(await page.evaluate(() => window.__XSS__)).toBeUndefined(); // did not execute
        expect(await page.locator('#root img').count()).toBe(0);           // no injected element
    });

    test('keeps coded prior site labels translatable while preserving Other write-in text', async ({ page }) => {
        await setup(page, {
            i18n: en,
            prior: [{
                location: { i18nKey: 'shareHealthInfo.site_other', fallback: 'Other', otherText: 'test' },
                dxDate: '2015',
            }],
        });
        const site = page.locator('[data-i18n="shareHealthInfo.site_other"]');
        await expect(site).toHaveText('Other');
        await expect(page.locator('body')).toContainText('Other (test)');
    });

    test('still renders if the previously-reported fetch rejects (backend error)', async ({ page }) => {
        await setup(page, {
            dataAccessBody: `
                export const submitSelfReportCancerDx = async (p) => { window.__SRCDX_LAST_PAYLOAD__ = p; return { code: 200 }; };
                export const getPreviouslyReportedDx = async () => { throw new Error('backend 500'); };
                export const searchNPIProviders = async () => [];
                export const saveCancerDxProgress = async () => ({ code: 200 });
                export const loadCancerDxProgress = async () => null;
            `,
        });
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible(); // graceful: landing renders anyway
        expect(await page.evaluate(() => window.__SRCDX_ERROR__)).toBeFalsy();
    });

    test('blocks starting a fresh report if saved progress cannot be loaded, then retries', async ({ page }) => {
        await setup(page, {
            dataAccessBody: `
                let loadAttempts = 0;
                export const submitSelfReportCancerDx = async (p) => { window.__SRCDX_LAST_PAYLOAD__ = p; return { code: 200 }; };
                export const getPreviouslyReportedDx = async () => [];
                export const searchNPIProviders = async () => [];
                export const saveCancerDxProgress = async () => ({ code: 200 });
                export const loadCancerDxProgress = async () => {
                    loadAttempts += 1;
                    window.__SRCDX_LOAD_ATTEMPTS__ = loadAttempts;
                    if (loadAttempts === 1) throw new Error('backend 500');
                    return null;
                };
            `,
        });
        await expect(page.locator('#srcdxAddDiagnosis')).toHaveCount(0);
        await expect(page.locator('#srcdxRetryLoad')).toBeVisible();

        await page.click('#srcdxRetryLoad');
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible();
        expect(await page.evaluate(() => window.__SRCDX_LOAD_ATTEMPTS__)).toBe(2);
    });
});

test.describe('Validation & encoding edge cases', () => {
    const toDate = async (page, site = 'prostate') => {
        await page.click('#srcdxAddDiagnosis');
        await page.check(`#site_${site}`);
        await page.click('#srcdxNext'); // -> Q2 date
    };

    test('Spanish session shows the translated Q1 error, placed before nav, with focus moved', async ({ page }) => {
        await setup(page, { i18n: es });
        await page.click('#srcdxAddDiagnosis');
        await page.click('#srcdxNext');                 // no site selected -> error
        const err = page.locator('.form-error');
        await expect(err).toHaveText('Seleccione un lugar de cáncer.');
        const placement = await page.evaluate(() => {
            const errEl = document.querySelector('.error-text');
            const nav = document.querySelector('.srcdx-nav');
            return {
                beforeNav: !!(errEl.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING),
                focusedId: document.activeElement && document.activeElement.id,
            };
        });
        expect(placement.beforeNav).toBe(true);
        expect(placement.focusedId).toMatch(/^site_/);
    });

    test('January (month code 0) survives diagnosis-date -> review -> payload (not dropped as empty)', async ({ page }) => {
        await setup(page, { i18n: en });
        await toDate(page);
        await page.selectOption('#srcdxDxMonth', '0'); // January = 0
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                // review
        await expect(page.locator('body')).toContainText('Jan 2020'); // abbreviated month (per comp)
        await page.click('#srcdxNext');                // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.dxMonth)]).toBe('286592124'); // January month RESPONSE cid
        expect(payload[dk(m.dxYear)]).toBe('2020');
    });

    // Q2 Month/Year must share one line at every width — sub-md (where col-md-* used to stack) and
    // narrow phones (where a too-tight column wrapped the "Year *" label and misaligned the inputs).
    for (const width of [700, 360, 320]) {
        test(`Q2 Month and Year stay on one line, single-line label, at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await setup(page, { i18n: en });
            await page.click('#srcdxAddDiagnosis');
            await page.check('#site_prostate');
            await page.click('#srcdxNext'); // -> Q2
            const r = await page.evaluate(() => {
                const m = document.querySelector('#srcdxDxMonth').getBoundingClientRect();
                const y = document.querySelector('#srcdxDxYear').getBoundingClientRect();
                const yLabel = document.querySelector('label[for="srcdxDxYear"]').getBoundingClientRect();
                return { sameLine: Math.abs(m.top - y.top) < 4 && y.left > m.left, labelH: yLabel.height };
            });
            expect(r.sameLine).toBe(true);          // same row, Year right of Month
            expect(r.labelH).toBeLessThan(36);      // "Year *" stays on one line (no wrap -> no misalignment)
        });
    }

    test('a selected January is retained across Back navigation (not reset to "-- Select --")', async ({ page }) => {
        await setup(page, { i18n: en });
        await toDate(page);
        await page.selectOption('#srcdxDxMonth', '0');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');                // -> Q3
        await page.check('#txReceivedNo');
        await page.click('#srcdxBack');                // back -> Q2
        await expect(page.locator('#srcdxDxMonth')).toHaveValue('0');
    });

    test('diagnosis year cannot be in the future (past-only)', async ({ page }) => {
        await setup(page, { i18n: en });
        await toDate(page);
        await page.fill('#srcdxDxYear', '2027');       // now = 2026 -> future
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveCount(1); // rejected
        await page.fill('#srcdxDxYear', '2026');       // current year ok
        await page.click('#srcdxNext');
        await expect(page.locator('#txReceivedNo')).toBeVisible(); // advanced
    });

    test('Q3 treatment received answer is optional', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');                // Q3
        await expect(page.locator('#txReceivedYes')).not.toBeChecked();
        await expect(page.locator('#txReceivedNo')).not.toBeChecked();
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveCount(0);
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // review; prostate skips screening

        const q3Row = page.locator('[data-edit="treatmentReceived"]').locator('xpath=ancestor::div[contains(@class,"srcdx-review-item")]');
        await expect(q3Row.locator('[data-i18n="shareHealthInfo.q4NotAnswered"]')).toHaveText('');

        await page.click('#srcdxNext');                // submit
        const payload = await getPayload(page);
        expect(dk(m.txReceived) in payload).toBe(false);
        expect(txType(payload, m.treatment.chemo)).toBeUndefined();
        expect(txDetail(payload, m.treatment.chemo, m.treatment.startYear)).toBeUndefined();
    });

    test('Q3 treatment type selection is optional when treatment was received', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');            // Yes but no type selected
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveCount(0);
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // review; prostate skips screening

        const q3Row = page.locator('[data-edit="treatmentReceived"]').locator('xpath=ancestor::div[contains(@class,"srcdx-review-item")]');
        await expect(q3Row).toContainText('Yes');
        await expect(q3Row).not.toContainText('Reported Treatments');

        await page.click('#srcdxNext');                // submit
        const payload = await getPayload(page);
        expect(payload[dk(m.txReceived)]).toBe(Y);
        expect(txType(payload, m.treatment.chemo)).toBe(N);
        expect(txType(payload, m.treatment.surgery)).toBe(N);
        expect(txType(payload, m.treatment.radiation)).toBe(N);
        expect(txType(payload, m.treatment.other)).toBe(N);
        expect(txDetail(payload, m.treatment.chemo, m.treatment.startYear)).toBeUndefined();
    });

    test('treatment start year before diagnosis is rejected; a +5 future scheduled year is allowed', async ({ page }) => {
        await setup(page, { i18n: en });
        await toDate(page);
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                // detail
        await page.fill('#srcdxTxStartYr', '2019');    // before diagnosis -> rejected
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveCount(1);
        await page.fill('#srcdxTxStartYr', '2031');    // now 2026 -> +5 = 2031 (scheduled) allowed
        await page.fill('#srcdxTxEndYr', '2030');      // end before start -> rejected
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveCount(1);
        await page.fill('#srcdxTxEndYr', '2031');      // end == start -> ok
        await page.click('#srcdxNext');
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // advanced to summary
    });

    test('screening year after diagnosis is rejected; same diagnosis year is accepted', async ({ page }) => {
        await setup(page, { i18n: en });
        await toDate(page, 'breast');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                // Q4 (breast eligible)
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                // recap (chosen screenings)
        await page.click('#srcdxNext');                // screening detail
        await page.fill('#srcdxScrnYr', '2021');       // after diagnosis -> rejected
        await page.click('#srcdxNext');
        await expect(page.locator('.form-error')).toHaveCount(1);
        await page.fill('#srcdxScrnYr', '2020');       // same as diagnosis -> ok
        await page.click('#srcdxNext');
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // advanced to review
    });
});

// Paired form fields must stay side-by-side (not full-width-stacked) on narrow/phone screens.
test.describe('Responsive field layout (narrow screens)', () => {
    test('treatment-detail dates are 2×2 and name/State+Zip pairs share a line at 360px', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'This test owns its viewport; phone/tablet projects cover their native viewports.');
        await page.setViewportSize({ width: 360, height: 1200 });
        await setup(page, { i18n: en });
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.click('#srcdxNext');                // treatment detail
        await page.waitForSelector('#srcdxTxStartYr');
        const r = await page.evaluate(() => {
            const top = (id) => Math.round(document.querySelector(id).getBoundingClientRect().top);
            return {
                startPair: top('#srcdxTxStartMo') === top('#srcdxTxStartYr'),
                endPair: top('#srcdxTxEndMo') === top('#srcdxTxEndYr'),
                endBelowStart: top('#srcdxTxEndMo') > top('#srcdxTxStartMo'),
                names: top('#srcdxPhysFirst_0') === top('#srcdxPhysLast_0'),
                stateZip: top('#UPAddressTx_0_0State') === top('#UPAddressTx_0_0Zip'),
                startYrLabelH: Math.round(document.querySelector('label[for="srcdxTxStartYr"]').getBoundingClientRect().height),
            };
        });
        expect(r.startPair).toBe(true);     // Start month + Start year share a line
        expect(r.endPair).toBe(true);       // End month + End year share a line
        expect(r.endBelowStart).toBe(true); // 2×2 (End row below Start row)
        expect(r.names).toBe(true);         // First + Last name share a line
        expect(r.stateZip).toBe(true);      // State + Zip share a line
        expect(r.startYrLabelH).toBeLessThan(36); // "Start year *" stays single-line
    });
});
