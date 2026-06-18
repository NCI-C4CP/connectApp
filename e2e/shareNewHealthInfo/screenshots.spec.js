// Visual harness pass: walks the whole process (real i18n labels via injected en.js, real Bootstrap
// CSS) and captures a screenshot of each screen to test-results/screens/<project>/. Doubles as a full-flow
// smoke test. (Auth/data are stubbed; this is the no-login visual check.)

import { test } from '@playwright/test';
import { mkdirSync } from 'fs';
import en from '../../i18n/en.js';
import es from '../../i18n/es.js';
import { setup } from './support.js';

const DIR = 'test-results/screens';

const projectDir = (testInfo) => `${DIR}/${testInfo.project.name}`;

const captureFullProcessFlow = async (page, testInfo, i18n, prefix) => {
    const dir = projectDir(testInfo);
    mkdirSync(dir, { recursive: true });
    const shot = (name) => page.screenshot({ path: `${dir}/${prefix}-${name}.png`, fullPage: true });

    await setup(page, { i18n });
    await page.waitForSelector('#srcdxAddDiagnosis');
    await shot('01-landing');

    await page.click('#srcdxAddDiagnosis');
    await page.waitForSelector('#site_breast');
    await shot('02-primary-site');

    await page.check('#site_breast');
    await page.click('#srcdxNext');
    await page.waitForSelector('#srcdxDxYear');
    await shot('03-diagnosis-date');

    await page.fill('#srcdxDxYear', '2020');
    await page.click('#srcdxNext');
    await page.waitForSelector('#txReceivedYes');
    await page.check('#txReceivedYes');
    await page.check('#tx_chemo');
    await shot('04-treatment-received');

    await page.click('#srcdxNext');
    await page.waitForSelector('#srcdxTxStartYr');
    await page.fill('#srcdxTxStartYr', '2021');
    await page.fill('#srcdxPhysFirst_0', 'Ada');
    await page.fill('#srcdxPhysLast_0', 'Lovelace');
    await shot('05-treatment-detail');

    // International facility variant (distinct UI state).
    await page.check('#UPAddressTx_0_0International');
    await page.waitForSelector('#UPAddressTx_0_0Region:visible');
    await shot('05b-treatment-detail-international');
    await page.uncheck('#UPAddressTx_0_0International');

    await page.click('#srcdxNext');
    await page.waitForSelector('#srcdxAddTreatment');
    await shot('06-treatment-summary');

    await page.click('#srcdxNext');
    await page.waitForSelector('#scrnDetectedYes');
    await page.check('#scrnDetectedYes');
    await page.check('#scrn_breast2D');
    await shot('07-screening-gate');

    await page.click('#srcdxNext');
    await page.waitForSelector('#srcdxRecapList');
    await shot('07b-screening-recap');

    await page.click('#srcdxNext');
    await page.waitForSelector('#srcdxScrnYr');
    await page.fill('#srcdxScrnYr', '2019');
    await shot('08-screening-detail');

    await page.click('#srcdxNext');
    await page.waitForSelector('[data-edit="primarySite"]'); // a visible review element
    await shot('09-review');

    await page.click('#srcdxNext');
    await page.waitForSelector('#srcdxAddAnother');
    await shot('10-confirmation');
};

test('capture the full process flow', async ({ page }, testInfo) => {
    await captureFullProcessFlow(page, testInfo, en, 'en');
});

test('capture the full process flow in Spanish', async ({ page }, testInfo) => {
    await captureFullProcessFlow(page, testInfo, es, 'es');
});

test('capture the returning-user landing (previously reported)', async ({ page }, testInfo) => {
    const dir = projectDir(testInfo);
    mkdirSync(dir, { recursive: true });
    await setup(page, {
        i18n: en,
        prior: [{ location: 'Lung', dxDate: '09/2025' }, { location: 'Breast', dxDate: '03/2023' }],
    });
    await page.waitForSelector('#srcdxAddDiagnosis');
    await page.screenshot({ path: `${dir}/en-00-landing-returning.png`, fullPage: true });
});

test('capture a validation-error state', async ({ page }, testInfo) => {
    const dir = projectDir(testInfo);
    mkdirSync(dir, { recursive: true });
    await setup(page, { i18n: en });
    await page.click('#srcdxAddDiagnosis');
    await page.waitForSelector('#site_breast');
    await page.click('#srcdxNext'); // no selection -> error
    await page.waitForSelector('.form-error');
    await page.screenshot({ path: `${dir}/en-11-validation-error.png`, fullPage: true });
});
