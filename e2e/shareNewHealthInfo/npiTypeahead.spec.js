import { test, expect } from '@playwright/test';
import { setup, m, txRow, screeningDetail, getPayload, toTreatmentDetail, toTreatmentGate } from './support.js';

// NPI provider typeahead, end to end: suggestions while typing in the physician Last name,
// selection fills the names + captures the NPI into the payload, edits clear the match, and
// the whole thing degrades silently to manual entry.

const npiStubBody = `
export const submitSelfReportCancerDx = async (payload) => {
    window.__SRCDX_LAST_PAYLOAD__ = payload;
    return { code: 200, stubbed: true };
};
export const getPreviouslyReportedDx = async () => (window.__SRCDX_PRIOR__ || []);
export const saveCancerDxProgress = async () => ({ code: 200 });
export const loadCancerDxProgress = async () => null;
export const loadShareHealthInfoSettings = async () => ({ enableNPIRegistry: true });

const PROVIDERS = [
    { npi: '1234567890', firstName: 'MAYA', lastName: 'SANTOS', credential: 'M.D.', specialty: 'Medical Oncology', city: 'BETHESDA', state: 'MD' },
    { npi: '1098765432', firstName: 'JON', lastName: 'SANTOSO', credential: 'D.O.', specialty: 'Internal Medicine', city: 'ROCKVILLE', state: 'MD' },
];
export const searchNPIProviders = async ({ firstName = '', lastName = '' } = {}) => {
    window.__SRCDX_NPI_CALLS__ = (window.__SRCDX_NPI_CALLS__ || []).concat([{ firstName, lastName }]);
    if (window.__SRCDX_NPI_EMPTY__) return [];
    return PROVIDERS.filter((p) => p.lastName.toLowerCase().startsWith(lastName.toLowerCase()));
};
`;

const npiCalls = (page) => page.evaluate(() => window.__SRCDX_NPI_CALLS__ || []);

test('NPI feature flag off renders manual physician entry without provider search', async ({ page }) => {
    await setup(page);
    await toTreatmentDetail(page);
    await expect(page.locator('#srcdxPhysFirst_0')).toBeVisible();
    await expect(page.locator('#srcdxPhysLast_0')).toBeVisible();
    await expect(page.locator('#srcdxPhysNpi_0')).toHaveCount(0);
    await expect(page.locator('[data-npi-slot="Tx_0"]')).toHaveCount(0);
    await expect(page.locator('#srcdxPhysLast_0')).not.toHaveAttribute('role', 'combobox');

    await page.fill('#srcdxPhysLast_0', 'San');
    await page.waitForTimeout(500);
    await expect(page.locator('#srcdxNpiPop_Tx_0')).toHaveCount(0);
});

test.describe('NPI provider typeahead', () => {
    test.beforeEach(async ({ page }) => {
        await setup(page, { dataAccessBody: npiStubBody });
    });

    test('stays closed under 2 characters (no search fired)', async ({ page }) => {
        await toTreatmentDetail(page);
        await page.fill('#srcdxPhysLast_0', 'S');
        await page.waitForTimeout(500); // past the debounce — a negative needs real time
        await expect(page.locator('#srcdxNpiPop_Tx_0')).toBeHidden();
        expect(await npiCalls(page)).toHaveLength(0);
    });

    test('typing 2+ characters shows one suggestion row per match', async ({ page }) => {
        await toTreatmentDetail(page);
        await page.fill('#srcdxPhysLast_0', 'San');
        await expect(page.locator('#srcdxNpiList_Tx_0 [role="option"]')).toHaveCount(2);
        await expect(page.locator('#srcdxNpiList_Tx_0 [role="option"]').first()).toContainText('SANTOS, MAYA, M.D.');
        const calls = await npiCalls(page);
        expect(calls[calls.length - 1]).toEqual({ firstName: '', lastName: 'San' });
    });

    test('selecting a suggestion fills the names, shows the matched chip, and the payload carries the NPI', async ({ page }) => {
        await toTreatmentDetail(page);
        await page.fill('#srcdxPhysLast_0', 'San');
        await page.locator('#srcdxNpiList_Tx_0 [role="option"]').first().click();
        await expect(page.locator('#srcdxPhysFirst_0')).toHaveValue('MAYA');
        await expect(page.locator('#srcdxPhysLast_0')).toHaveValue('SANTOS');
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toBeVisible();
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toContainText('1234567890');
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toContainText('Medical Oncology');

        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');                 // summary
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit
        const payload = await getPayload(page);
        expect(txRow(payload, m.treatment.chemo, m.treatment.physNpi, 1)).toBe('1234567890');
        expect(txRow(payload, m.treatment.chemo, m.treatment.physFirstName, 1)).toBe('MAYA');
        expect(txRow(payload, m.treatment.chemo, m.treatment.physLastName, 1)).toBe('SANTOS');
    });

    test('editing a name after matching clears the chip and the payload omits the NPI', async ({ page }) => {
        await toTreatmentDetail(page);
        await page.fill('#srcdxPhysLast_0', 'San');
        await page.locator('#srcdxNpiList_Tx_0 [role="option"]').first().click();
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toBeVisible();

        await page.fill('#srcdxPhysLast_0', 'Santosa'); // manual edit — no longer registry-verified
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toBeHidden();

        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        const payload = await getPayload(page);
        expect(txRow(payload, m.treatment.chemo, m.treatment.physNpi, 1)).toBeUndefined();
        expect(txRow(payload, m.treatment.chemo, m.treatment.physLastName, 1)).toBe('Santosa');
        expect(txRow(payload, m.treatment.chemo, m.treatment.physFirstName, 1)).toBe('MAYA'); // typed names persist
    });

    test('no matches shows the manual-entry hint and never blocks the flow', async ({ page }) => {
        await toTreatmentDetail(page);
        await page.evaluate(() => { window.__SRCDX_NPI_EMPTY__ = true; });
        await page.fill('#srcdxPhysLast_0', 'Zzz');
        await expect(page.locator('#srcdxNpiStatus_Tx_0')).toBeVisible();
        await expect(page.locator('#srcdxNpiStatus_Tx_0')).toContainText('No matches');
        await expect(page.locator('#srcdxNpiList_Tx_0 [role="option"]')).toHaveCount(0);

        await page.fill('#srcdxPhysFirst_0', 'Zed');    // manual entry continues unaffected
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        const payload = await getPayload(page);
        expect(txRow(payload, m.treatment.chemo, m.treatment.physLastName, 1)).toBe('Zzz');
        expect(txRow(payload, m.treatment.chemo, m.treatment.physNpi, 1)).toBeUndefined();
    });

    test('a match survives the add-another-physician rerender; only matched rows emit an NPI', async ({ page }) => {
        await toTreatmentDetail(page);
        await page.fill('#srcdxPhysLast_0', 'San');
        await page.locator('#srcdxNpiList_Tx_0 [role="option"]').first().click();
        await page.click('#srcdxAddPhys');              // harvest -> rerenderInPlace
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toBeVisible(); // NPI-only chip refilled
        await expect(page.locator('#srcdxNpiChip_Tx_0')).toContainText('1234567890');
        await expect(page.locator('#srcdxNpiChip_Tx_1')).toBeHidden();  // new row unmatched

        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        const payload = await getPayload(page);
        expect(txRow(payload, m.treatment.chemo, m.treatment.physNpi, 1)).toBe('1234567890');
        expect(txRow(payload, m.treatment.chemo, m.treatment.physNpi, 2)).toBeUndefined();
    });

    test('the screening referring physician gets the same typeahead; payload carries physNpi', async ({ page }) => {
        await toTreatmentGate(page, { site: 'breast' }); // screening-eligible site
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                 // -> screening gate (Q4)
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');                 // recap
        await page.click('#srcdxNext');                 // screening detail
        await page.fill('#srcdxScrnPhysLast', 'Santos');
        await expect(page.locator('#srcdxNpiList_Scrn [role="option"]')).toHaveCount(2);
        await page.locator('#srcdxNpiList_Scrn [role="option"]').first().click();
        await expect(page.locator('#srcdxScrnPhysFirst')).toHaveValue('MAYA');
        await expect(page.locator('#srcdxNpiChip_Scrn')).toBeVisible();

        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');                 // review
        await page.click('#srcdxNext');                 // submit
        const payload = await getPayload(page);
        expect(screeningDetail(payload, m.screening.optionValues.breast2D, m.screening.physNpi)).toBe('1234567890');
        expect(screeningDetail(payload, m.screening.optionValues.breast2D, m.screening.physFirstName)).toBe('MAYA');
    });
});
