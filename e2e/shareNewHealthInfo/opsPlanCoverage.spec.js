import { test, expect } from '@playwright/test';
import { setup, m, dk, ndk, Y, N, getPayload } from './support.js';

const startNoTreatmentDiagnosis = async (page, site) => {
    await page.click('#srcdxAddDiagnosis');
    await page.check(`#site_${site}`);
    await page.click('#srcdxNext');
    await page.fill('#srcdxDxYear', '2020');
    await page.click('#srcdxNext');
    await page.check('#txReceivedNo');
    await page.click('#srcdxNext');
};

const submitFromReview = async (page) => {
    await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
    await page.click('#srcdxNext');
    return getPayload(page);
};

test.describe('Ops testing-plan coverage', () => {
    test('lung CT screening path captures screening date, physician, and domestic facility', async ({ page }) => {
        await setup(page);
        await startNoTreatmentDiagnosis(page, 'lung');

        await expect(page.locator('#scrnDetectedYes')).toBeVisible();
        await expect(page.locator('[data-i18n="shareHealthInfo.q4Header_lung"]')).toBeVisible();
        await page.check('#scrnDetectedYes');
        await expect(page.locator('#scrn_lungCT')).toHaveCount(0);
        await expect(page.locator('#srcdxScrnOptions')).toHaveCount(0);
        await expect(page.locator('#scrn_breast2D')).toHaveCount(0);
        await expect(page.locator('#scrn_colonCol')).toHaveCount(0);
        await page.click('#srcdxNext');
        await expect(page.locator('#srcdxScrnYr')).toBeVisible();

        await page.selectOption('#srcdxScrnMo', '0');
        await page.fill('#srcdxScrnYr', '2020');
        await page.fill('#srcdxScrnPhysFirst', 'Jane');
        await page.fill('#srcdxScrnPhysLast', 'Doe');
        await page.fill('#UPAddressScrn_0Line1', 'Lung Imaging Center');
        await page.fill('#UPAddressScrn_0City', 'Bethesda');
        await page.selectOption('#UPAddressScrn_0State', 'MD');
        await page.fill('#UPAddressScrn_0Zip', '20814');
        await page.click('#srcdxNext');

        const payload = await submitFromReview(page);
        expect(payload[dk(m.primarySite)]).toBe(String(m.cancerSites.lung));
        expect(payload[dk(m.screening.detected)]).toBe(Y);
        expect(payload[dk(m.screening.optionValues.lungCT)]).toBe(Y);
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.month)]).toBe('286592124');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.year)]).toBe('2020');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.phyFirstName)]).toBe('Jane');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.phyLastName)]).toBe('Doe');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.facility.line1)]).toBe('Lung Imaging Center');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.facility.city)]).toBe('Bethesda');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.facility.state)]).toBe('MD');
        expect(payload[ndk(m.screening.optionValues.lungCT, m.screening.facility.zip)]).toBe('20814');
    });

    test('international screening facility stores region/postal/country under merged facility CIDs', async ({ page }) => {
        await setup(page);
        await startNoTreatmentDiagnosis(page, 'breast');

        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');

        await page.fill('#srcdxScrnYr', '2020');
        await page.check('#UPAddressScrn_0International');
        await expect(page.locator('#UPAddressScrn_0Region')).toBeVisible();
        await expect(page.locator('#UPAddressScrn_0Postal')).toBeVisible();
        await page.fill('#UPAddressScrn_0Line1', 'Munich Screening Center');
        await page.fill('#UPAddressScrn_0Region', 'Bavaria');
        await page.fill('#UPAddressScrn_0Postal', '80331');
        await page.selectOption('#UPAddressScrn_0Country', '4');
        await page.click('#srcdxNext');

        const payload = await submitFromReview(page);
        const fac = m.screening.facility;
        expect(payload[ndk(m.screening.optionValues.breast2D, fac.intlFlag)]).toBe(Y);
        expect(payload[ndk(m.screening.optionValues.breast2D, fac.line1)]).toBe('Munich Screening Center');
        expect(payload[ndk(m.screening.optionValues.breast2D, fac.state)]).toBe('Bavaria');
        expect(payload[ndk(m.screening.optionValues.breast2D, fac.zip)]).toBe('80331');
        expect(payload[ndk(m.screening.optionValues.breast2D, fac.country)]).toBe('780612099');
    });

    test('all four treatment types plus Other description and nested physicians are captured', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        for (const type of ['chemo', 'surgery', 'radiation', 'other']) await page.check(`#tx_${type}`);
        await page.fill('#srcdxTxOtherDescribe', 'Immunotherapy');
        await page.click('#srcdxNext');

        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');

        await page.fill('#srcdxTxStartYr', '2022');
        await page.fill('#srcdxPhysFirst_0', 'Alice');
        await page.fill('#srcdxPhysLast_0', 'Jones');
        await page.click('#srcdxAddPhys');
        await page.fill('#srcdxPhysFirst_1', 'Bob');
        await page.fill('#srcdxPhysLast_1', 'Lee');
        await page.click('#srcdxAddPhys');
        await page.fill('#srcdxPhysFirst_2', 'Carol');
        await page.fill('#srcdxPhysLast_2', 'Patel');
        await page.click('#srcdxNext');

        await page.fill('#srcdxTxStartYr', '2023');
        await page.click('#srcdxNext');
        await page.fill('#srcdxTxStartYr', '2024');
        await page.click('#srcdxNext');

        await page.click('#srcdxNext');
        const payload = await submitFromReview(page);
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[dk(m.treatment.surgery)]).toBe(Y);
        expect(payload[dk(m.treatment.radiation)]).toBe(Y);
        expect(payload[dk(m.treatment.other)]).toBe(Y);
        expect(payload[dk(m.treatment.otherDescribe)]).toBe('Immunotherapy');
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
        expect(payload[ndk(m.treatment.surgery, m.treatment.startYear)]).toBe('2022');
        expect(payload[ndk(m.treatment.radiation, m.treatment.startYear)]).toBe('2023');
        expect(payload[ndk(m.treatment.other, m.treatment.startYear)]).toBe('2024');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physFirstName, 1)]).toBe('Alice');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physLastName, 1)]).toBe('Jones');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physFirstName, 2)]).toBe('Bob');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physLastName, 2)]).toBe('Lee');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physFirstName, 3)]).toBe('Carol');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physLastName, 3)]).toBe('Patel');
    });

    test('full breast path captures diagnosis, treatment, screening, and review-submit payload', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.selectOption('#srcdxDxMonth', '10');
        await page.fill('#srcdxDxYear', '2021');
        await page.click('#srcdxNext');

        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.check('#tx_surgery');
        await page.click('#srcdxNext');

        await page.selectOption('#srcdxTxStartMo', '2');
        await page.fill('#srcdxTxStartYr', '2021');
        await page.selectOption('#srcdxTxEndMo', '8');
        await page.fill('#srcdxTxEndYr', '2021');
        await page.fill('#srcdxPhysFirst_0', 'Maya');
        await page.fill('#srcdxPhysLast_0', 'Santos');
        await page.fill('#UPAddressTx_0_0Line1', 'Treatment Center A');
        await page.fill('#UPAddressTx_0_0City', 'Bethesda');
        await page.selectOption('#UPAddressTx_0_0State', 'MD');
        await page.fill('#UPAddressTx_0_0Zip', '20814');
        await page.click('#srcdxNext');

        await page.selectOption('#srcdxTxStartMo', '3');
        await page.fill('#srcdxTxStartYr', '2022');
        await page.selectOption('#srcdxTxEndMo', '4');
        await page.fill('#srcdxTxEndYr', '2022');
        await page.fill('#srcdxPhysFirst_0', 'Nora');
        await page.fill('#srcdxPhysLast_0', 'Reed');
        await page.fill('#UPAddressTx_1_0Line1', 'Treatment Center B');
        await page.fill('#UPAddressTx_1_0City', 'Washington');
        await page.selectOption('#UPAddressTx_1_0State', 'DC');
        await page.fill('#UPAddressTx_1_0Zip', '20016');
        await page.click('#srcdxNext');

        await page.click('#srcdxNext');
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        await page.selectOption('#srcdxScrnMo', '3');
        await page.fill('#srcdxScrnYr', '2020');
        await page.fill('#srcdxScrnPhysFirst', 'Grace');
        await page.fill('#srcdxScrnPhysLast', 'Hopper');
        await page.fill('#UPAddressScrn_0Line1', 'Breast Imaging Center');
        await page.fill('#UPAddressScrn_0City', 'Bethesda');
        await page.selectOption('#UPAddressScrn_0State', 'MD');
        await page.fill('#UPAddressScrn_0Zip', '20814');
        await page.click('#srcdxNext');

        const payload = await submitFromReview(page);
        expect(payload[dk(m.primarySite)]).toBe(String(m.cancerSites.breast));
        expect(payload[dk(m.dxMonth)]).toBe('615680906');
        expect(payload[dk(m.dxYear)]).toBe('2021');
        expect(payload[dk(m.treatment.chemo)]).toBe(Y);
        expect(payload[dk(m.treatment.surgery)]).toBe(Y);
        expect(payload[dk(m.treatment.radiation)]).toBe(N);
        expect(payload[ndk(m.treatment.chemo, m.treatment.startYear)]).toBe('2021');
        expect(payload[ndk(m.treatment.chemo, m.treatment.endYear)]).toBe('2021');
        expect(payload[ndk(m.treatment.surgery, m.treatment.physLastName, 1)]).toBe('Reed');
        expect(payload[ndk(m.treatment.surgery, m.treatment.facility.line1, 1)]).toBe('Treatment Center B');
        expect(payload[dk(m.screening.detected)]).toBe(Y);
        expect(payload[dk(m.screening.optionValues.breast2D)]).toBe(Y);
        expect(payload[ndk(m.screening.optionValues.breast2D, m.screening.month)]).toBe('463502254');
        expect(payload[ndk(m.screening.optionValues.breast2D, m.screening.year)]).toBe('2020');
        expect(payload[ndk(m.screening.optionValues.breast2D, m.screening.phyLastName)]).toBe('Hopper');
        expect(payload[ndk(m.screening.optionValues.breast2D, m.screening.facility.line1)]).toBe('Breast Imaging Center');
    });
});
