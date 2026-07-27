import { test, expect } from '@playwright/test';
import {
    setup, m, dk, txType, txDetail, txRow, screeningType, screeningDetail, Y, N, getPayload, toTreatmentDetail,
} from './support.js';

// Drive to the treatment-detail screen for a single Chemotherapy treatment (prostate = non-screening).
const toChemoDetail = (page) => toTreatmentDetail(page, { site: 'prostate' }); // shared walk in support.js
const toChemoSummary = async (page) => {
    await toChemoDetail(page);
    await page.fill('#srcdxTxStartYr', '2021');
    await page.click('#srcdxNext');
    await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
};

const installMockPlacesAutocomplete = async (page) => {
    await page.addInitScript(() => {
        const defaultPlace = {
            name: 'Johns Hopkins Hospital',
            address_components: [
                { long_name: '1800', types: ['street_number'] },
                { long_name: 'Orleans Street', types: ['route'] },
                { long_name: 'Baltimore', types: ['locality'] },
                { long_name: 'Maryland', types: ['administrative_area_level_1'] },
                { long_name: '21287', types: ['postal_code'] },
            ],
        };

        class FakeAutocomplete {
            constructor(input, options) {
                this.input = input;
                this.options = options;
                this.componentRestrictionCalls = [];
                this.place = defaultPlace;
                window.__SRCDX_PLACES_AUTOCOMPLETE_INSTANCES__ = window.__SRCDX_PLACES_AUTOCOMPLETE_INSTANCES__ || [];
                window.__SRCDX_PLACES_AUTOCOMPLETE_INSTANCES__.push(this);
                window.__SRCDX_LAST_PLACES_AUTOCOMPLETE__ = this;
            }
            setFields(fields) {
                this.fields = fields;
            }
            setComponentRestrictions(restrictions) {
                this.componentRestrictionCalls.push(restrictions);
                this.options.componentRestrictions = restrictions;
            }
            addListener(event, callback) {
                if (event === 'place_changed') this.callback = callback;
                return { remove() {} };
            }
            getPlace() {
                return this.place;
            }
        }

        window.__SRCDX_SELECT_MOCK_PLACE__ = (place = defaultPlace) => {
            const autocomplete = window.__SRCDX_LAST_PLACES_AUTOCOMPLETE__;
            if (!autocomplete) throw new Error('Focus a facility Line 1 field before selecting a mock place.');
            autocomplete.place = place;
            autocomplete.callback?.();
        };
        window.google = {
            maps: {
                places: { Autocomplete: FakeAutocomplete },
                event: { clearInstanceListeners() {} },
            },
        };
    });
};

test.describe('Loops & repeatable inputs', () => {
    test('physicians: add up to the cap of 10, then the Add button disables', async ({ page }) => {
        await setup(page);
        await toChemoDetail(page);
        await expect(page.locator('[data-phys]')).toHaveCount(1);
        for (let i = 0; i < 9; i++) await page.click('#srcdxAddPhys');
        await expect(page.locator('[data-phys]')).toHaveCount(10);
        await expect(page.locator('#srcdxAddPhys')).toBeDisabled();
        await page.click('[data-remove-phys="9"]');
        await expect(page.locator('[data-phys]')).toHaveCount(9);
        await expect(page.locator('#srcdxAddPhys')).toBeEnabled();
    });

    test('removing a list item keeps the scroll position (no jump to top)', async ({ page }) => {
        const viewport = page.viewportSize();
        await page.setViewportSize({ width: viewport?.width || 390, height: 420 });
        await setup(page);
        await toChemoDetail(page);
        await page.fill('#srcdxTxStartYr', '2021');
        for (let i = 0; i < 9; i++) await page.click('#srcdxAddPhys'); // 10 physicians -> tall, scrollable page
        const removeBtn = page.locator('[data-remove-phys="9"]');
        await removeBtn.scrollIntoViewIfNeeded();
        const before = await page.evaluate(() => window.scrollY);
        expect(before).toBeGreaterThan(50);                  // we're scrolled down
        await removeBtn.click();
        const after = await page.evaluate(() => window.scrollY);
        expect(after).toBeGreaterThan(50);                   // stayed put — did NOT scroll to the top
        await expect(page.locator('[data-phys]')).toHaveCount(9);
    });

    test('international facility: toggle swaps State/Zip -> Region/Postal/Country, reveals Line 4, and is captured', async ({ page }) => {
        await setup(page);
        await toChemoDetail(page);
        await page.fill('#srcdxTxStartYr', '2021');
        await expect(page.locator('#UPAddressTx_0_0State')).toBeVisible();
        await expect(page.locator('#UPAddressTx_0_0Line4Row')).toBeHidden(); // Line 4 hidden when domestic
        await page.check('#UPAddressTx_0_0International');
        await expect(page.locator('#UPAddressTx_0_0Region')).toBeVisible();
        await expect(page.locator('#UPAddressTx_0_0Line4Row')).toBeVisible(); // Line 4 appears for international
        await expect(page.locator('#UPAddressTx_0_0State')).toBeHidden();
        await page.fill('#UPAddressTx_0_0Line1', 'Royal Marsden');
        await page.fill('#UPAddressTx_0_0Line4', 'Building B, Chelsea');
        await page.fill('#UPAddressTx_0_0Region', 'Greater London');
        await page.fill('#UPAddressTx_0_0Postal', 'SW3 6JJ');
        await page.selectOption('#UPAddressTx_0_0Country', '2'); // United Kingdom (stub allCountries)
        await page.click('#srcdxNext'); // -> summary
        await page.click('#srcdxNext'); // -> review
        await page.click('#srcdxNext'); // submit
        const payload = await getPayload(page);
        const fac = m.treatment.facility;
        expect(txRow(payload, m.treatment.chemo, fac.intlFlag, 1)).toBe(Y);
        expect(txRow(payload, m.treatment.chemo, fac.googleValidated, 1)).toBe(N);
        expect(txRow(payload, m.treatment.chemo, fac.state, 1)).toBe('Greater London'); // merged state/region <- region
        expect(txRow(payload, m.treatment.chemo, fac.zip, 1)).toBe('SW3 6JJ');          // merged zip/postal <- postal
        expect(txRow(payload, m.treatment.chemo, fac.country, 1)).toBe('156628245');    // select value '2' (UK) -> country response cid
        expect(txRow(payload, m.treatment.chemo, fac.line4, 1)).toBe('Building B, Chelsea');
    });

    test('mocked Google Places autocomplete fills a domestic facility and is captured', async ({ page }) => {
        await installMockPlacesAutocomplete(page);
        await setup(page);
        await toChemoDetail(page);
        await page.fill('#srcdxTxStartYr', '2021');

        await page.focus('#UPAddressTx_0_0Line1');
        const options = await page.evaluate(() => window.__SRCDX_LAST_PLACES_AUTOCOMPLETE__.options);
        expect(options).toMatchObject({
            types: ['establishment'],
            componentRestrictions: { country: 'us' },
        });
        await page.evaluate(() => window.__SRCDX_SELECT_MOCK_PLACE__());

        await expect(page.locator('#UPAddressTx_0_0Line1')).toHaveValue('Johns Hopkins Hospital');
        await expect(page.locator('#UPAddressTx_0_0Line2')).toHaveValue('1800 Orleans Street');
        await expect(page.locator('#UPAddressTx_0_0City')).toHaveValue('Baltimore');
        await expect(page.locator('#UPAddressTx_0_0State')).toHaveValue('Maryland');
        await expect(page.locator('#UPAddressTx_0_0Zip')).toHaveValue('21287');

        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        await page.click('#srcdxNext');
        const payload = await getPayload(page);
        const fac = m.treatment.facility;
        expect(txRow(payload, m.treatment.chemo, fac.intlFlag, 1)).toBe(N);
        expect(txRow(payload, m.treatment.chemo, fac.googleValidated, 1)).toBe(Y);
        expect(txRow(payload, m.treatment.chemo, fac.line1, 1)).toBe('Johns Hopkins Hospital');
        expect(txRow(payload, m.treatment.chemo, fac.line2, 1)).toBe('1800 Orleans Street');
        expect(txRow(payload, m.treatment.chemo, fac.city, 1)).toBe('Baltimore');
        expect(txRow(payload, m.treatment.chemo, fac.state, 1)).toBe('Maryland');
        expect(txRow(payload, m.treatment.chemo, fac.zip, 1)).toBe('21287');
    });

    test('mocked Google Places autocomplete stays disabled for an added international facility', async ({ page }) => {
        await installMockPlacesAutocomplete(page);
        await setup(page);
        await toChemoDetail(page);
        await page.fill('#srcdxTxStartYr', '2021');

        await page.focus('#UPAddressTx_0_0Line1');
        await page.evaluate(() => window.__SRCDX_SELECT_MOCK_PLACE__());
        await expect(page.locator('#UPAddressTx_0_0Line1')).toHaveValue('Johns Hopkins Hospital');
        await expect(page.locator('[data-fac-wrap]')).toHaveCount(1);
        expect(await page.evaluate(() => window.__SRCDX_PLACES_AUTOCOMPLETE_INSTANCES__.length)).toBe(1);

        await page.click('#srcdxAddFac');
        await expect(page.locator('[data-fac-wrap]')).toHaveCount(2);
        await page.check('#UPAddressTx_0_1International');
        await page.focus('#UPAddressTx_0_1Line1');
        expect(await page.evaluate(() => window.__SRCDX_PLACES_AUTOCOMPLETE_INSTANCES__.length)).toBe(1);
    });

    test('multiple treatment types: details auto-sequence and both are captured', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.check('#tx_surgery');
        await page.click('#srcdxNext');          // detail (chemo)
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');          // detail (surgery)
        await page.fill('#srcdxTxStartYr', '2022');
        await page.click('#srcdxNext');          // summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(2);
        await page.click('#srcdxNext');          // review
        await page.click('#srcdxNext');          // submit
        const payload = await getPayload(page);
        expect(txType(payload, m.treatment.chemo)).toBe(Y);
        expect(txType(payload, m.treatment.surgery)).toBe(Y);
        expect(txDetail(payload, m.treatment.chemo, m.treatment.startYear)).toBe('2021');
        expect(txDetail(payload, m.treatment.surgery, m.treatment.startYear)).toBe('2022');
    });

    test('remove a treatment via the confirmation dialog', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedYes');
        await page.check('#tx_chemo');
        await page.check('#tx_surgery');
        await page.click('#srcdxNext');          // detail (chemo)
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');          // detail (surgery)
        await page.fill('#srcdxTxStartYr', '2022');
        await page.click('#srcdxNext');          // summary
        await expect(page.locator('[data-tx-chip]')).toHaveCount(2);

        await page.click('[data-remove-tx="0"]'); // remove chemo
        await expect(page.locator('[data-confirm-remove="0"]')).toBeVisible();
        await page.click('[data-confirm-remove="0"]');
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // surgery remains

        await page.click('#srcdxNext');          // review
        await page.click('#srcdxNext');          // submit
        const payload = await getPayload(page);
        expect(txType(payload, m.treatment.surgery)).toBe(Y);
        expect(txType(payload, m.treatment.chemo)).toBe(N);
        expect(txDetail(payload, m.treatment.surgery, m.treatment.startYear)).toBe('2022');
        expect(txDetail(payload, m.treatment.chemo, m.treatment.startYear)).toBeUndefined();
    });

    test('remove-confirm modal traps Tab within the dialog and Escape cancels it', async ({ page }) => {
        await setup(page);
        await toChemoSummary(page);
        await page.click('[data-remove-tx="0"]');       // open the modal
        await expect(page.locator('.srcdx-modal')).toBeVisible();
        await expect(page.locator('.srcdx-modal .btn[data-cancel-remove]')).toBeFocused();

        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            const inModal = await page.evaluate(() => !!document.activeElement.closest('.srcdx-modal'));
            expect(inModal).toBe(true);
        }
        await page.keyboard.press('Escape');            // cancel
        await expect(page.locator('.srcdx-modal')).toHaveCount(0);
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1); // nothing deleted
    });

    test('removing the LAST treatment bounces back to Q3 to re-answer', async ({ page }) => {
        await setup(page);
        await toChemoDetail(page);
        await page.fill('#srcdxTxStartYr', '2021');
        await page.click('#srcdxNext');          // summary (1 chip)
        await expect(page.locator('[data-tx-chip]')).toHaveCount(1);
        await page.click('[data-remove-tx="0"]');
        await page.click('[data-confirm-remove="0"]');
        // last treatment removed -> back on Q3 with nothing selected
        await expect(page.locator('#txReceivedYes')).toBeVisible();
        await expect(page.locator('#txReceivedYes')).not.toBeChecked();
        await expect(page.locator('#txReceivedNo')).not.toBeChecked();
    });

    test('multiple facilities per treatment are captured', async ({ page }) => {
        await setup(page);
        await toChemoDetail(page);
        await page.fill('#srcdxTxStartYr', '2021');
        await page.fill('#UPAddressTx_0_0Line1', 'Hospital A');
        await page.click('#srcdxAddFac');
        await expect(page.locator('[data-fac-wrap]')).toHaveCount(2);
        await page.fill('#UPAddressTx_0_1Line1', 'Hospital B'); // first facility (A) preserved across re-render
        await page.click('#srcdxNext'); // summary
        await page.click('#srcdxNext'); // review
        await page.click('#srcdxNext'); // submit
        const payload = await getPayload(page);
        const fac = m.treatment.facility;
        expect(txRow(payload, m.treatment.chemo, fac.line1, 1)).toBe('Hospital A');
        expect(txRow(payload, m.treatment.chemo, fac.line1, 2)).toBe('Hospital B');
    });

    test('screening recap: unchecking a chosen screening drops it from the loop and the payload', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');          // Q4
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.check('#scrn_breastMRI');
        await page.click('#srcdxNext');          // recap: both listed, checked
        await expect(page.locator('#srcdxRecapList input[type="checkbox"]')).toHaveCount(2);
        await page.uncheck('#recap_breast2D');   // drop one on the recap
        await page.click('#srcdxNext');          // detail (breastMRI only)
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');          // review (single screening -> no second detail)
        await page.click('#srcdxNext');          // submit
        const payload = await getPayload(page);
        expect(screeningType(payload, m.screening.optionValues.breastMRI)).toBe(Y);
        expect(screeningType(payload, m.screening.optionValues.breast2D)).toBe(N);     // dropped on the recap -> explicit No
        expect(screeningDetail(payload, m.screening.optionValues.breastMRI, m.screening.year)).toBe('2019');
        expect(screeningDetail(payload, m.screening.optionValues.breast2D, m.screening.year)).toBeUndefined();
    });

    test('screening recap: "No" takes the no-screening path; Back from the recap returns to the gate with selections intact', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');          // Q4
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.click('#srcdxNext');          // recap
        await page.click('#srcdxBack');          // back to the gate: selections preserved
        await expect(page.locator('#scrnDetectedYes')).toBeChecked();
        await expect(page.locator('#scrn_breast2D')).toBeChecked();
        await page.click('#srcdxNext');          // recap again
        await page.click('#scrnRecapNo');        // "No" on the recap (click: reroute swaps the DOM)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // -> review
        const q4Row = page.locator('[data-edit="screeningGate"]').locator('xpath=ancestor::div[contains(@class,"srcdx-review-item")]');
        await expect(q4Row).toContainText('No'); // screeningDetected = false reflected
    });

    test('screening detail: "No" mid-loop clears all screenings and routes to review', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');          // Q4
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.check('#scrn_breastMRI');
        await page.click('#srcdxNext');          // recap
        await page.click('#srcdxNext');          // detail (breast2D)
        await page.fill('#srcdxScrnYr', '2018');
        await page.click('#srcdxNext');          // status interstitial
        await page.click('#srcdxNext');          // detail (breastMRI)
        await page.click('#scrnDetailNo');       // changed their mind mid-loop (click: reroute swaps DOM)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible(); // -> review
        await page.click('#srcdxNext');          // submit (Q4 answered No)
        const payload = await getPayload(page);
        expect(payload[dk(m.screening.detected)]).toBe(N);
        expect(screeningType(payload, m.screening.optionValues.breast2D)).toBeUndefined(); // detected=No -> section omitted
        expect(screeningDetail(payload, m.screening.optionValues.breast2D, m.screening.year)).toBeUndefined();
    });

    test('screening status: "Almost done!" names the next incomplete; Back revisits the completed entry', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');          // Q4
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breastMRI');
        await page.check('#scrn_breastUS');
        await page.click('#srcdxNext');          // recap
        await page.click('#srcdxNext');          // detail (breastMRI)
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');          // status: MRI complete, Ultrasound pending
        await expect(page.locator('#srcdxStatusNext u')).toContainText('breastUS'); // next incomplete named
        await page.click('#srcdxBack');          // back to the JUST-COMPLETED entry
        await expect(page.locator('#srcdxScrnYr')).toHaveValue('2019');             // breastMRI, data intact
        await page.click('#srcdxNext');          // -> status again
        await page.click('#srcdxNext');          // -> detail (breastUS)
        await page.fill('#srcdxScrnYr', '2020');
        await page.click('#srcdxNext');          // all complete -> review (no trailing status)
        await expect(page.locator('[data-edit="primarySite"]')).toBeVisible();
        await page.click('#srcdxNext');          // submit
        const payload = await getPayload(page);
        expect(screeningDetail(payload, m.screening.optionValues.breastMRI, m.screening.year)).toBe('2019');
        expect(screeningDetail(payload, m.screening.optionValues.breastUS, m.screening.year)).toBe('2020');
    });

    test('multiple screenings auto-sequence and are captured', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_breast');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');          // Q4 (breast eligible)
        await page.check('#scrnDetectedYes');
        await page.check('#scrn_breast2D');
        await page.check('#scrn_breastMRI');
        await page.click('#srcdxNext');          // recap (chosen screenings)
        await page.click('#srcdxNext');          // detail (breast2D)
        await page.fill('#srcdxScrnYr', '2018');
        await page.click('#srcdxNext');          // status interstitial (breast2D COMPLETE, breastMRI PENDING)
        await expect(page.locator('[data-status-row="breast2D"] .srcdx-status-badge.complete')).toBeVisible();
        await expect(page.locator('[data-status-row="breastMRI"] .srcdx-status-badge.pending')).toBeVisible();
        await page.click('#srcdxNext');          // detail (breastMRI)
        await page.fill('#srcdxScrnYr', '2019');
        await page.click('#srcdxNext');          // review
        await page.click('#srcdxNext');          // submit
        const payload = await getPayload(page);
        expect(screeningType(payload, m.screening.optionValues.breast2D)).toBe(Y);
        expect(screeningType(payload, m.screening.optionValues.breastMRI)).toBe(Y);
        expect(screeningDetail(payload, m.screening.optionValues.breast2D, m.screening.year)).toBe('2018');
        expect(screeningDetail(payload, m.screening.optionValues.breastMRI, m.screening.year)).toBe('2019');
    });

    test('submit failure shows an error and stays on review (button re-enabled)', async ({ page }) => {
        await setup(page, {
            dataAccessBody: `
                export const submitSelfReportCancerDx = async () => ({ code: 500 });
                export const getPreviouslyReportedDx = async () => [];
                export const searchNPIProviders = async () => [];
                export const saveCancerDxProgress = async () => ({ code: 200 });
                export const loadCancerDxProgress = async () => null;
            `,
        });
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');          // review
        await page.click('#srcdxNext');          // submit -> fails
        await expect(page.locator('#srcdxReviewError .form-error')).toHaveCount(1);
        await expect(page.locator('#srcdxNext')).toBeEnabled();        // re-enabled for retry
        await expect(page.locator('#srcdxAddAnother')).toHaveCount(0); // NOT on the confirmation screen
    });
});
