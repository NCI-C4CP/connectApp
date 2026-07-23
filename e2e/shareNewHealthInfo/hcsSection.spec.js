// E2E for the Health Care System Update section (issue #1658): section states, the edit form,
// validation, the flat submit payload, and the Google Places validated-flag lifecycle (a fake
// google.maps.places.Autocomplete injected so the pick -> validated / core-address edit -> invalidated
// behavior runs in a browser without the live API).

import { test, expect } from '@playwright/test';
import { setup, withdrawn, dk } from './support.js';
import fieldMapping from '../../js/fieldToConceptIdMapping.js';
import es from '../../i18n/es.js';

const h = fieldMapping.selfReportHCSUpdate;
const Y = String(fieldMapping.yes);
const N = String(fieldMapping.no);

const hcsPayload = (page) => page.evaluate(() => window.__HCS_LAST_PAYLOAD__);
const currentYear = new Date().getFullYear();

const latestRow = (overrides = {}) => ({
    line1: 'SIBLEY MEMORIAL HOSPITAL',
    line2: '5255 Loughboro Rd NW',
    line3: '',
    line4: '',
    city: 'Washington',
    stateOrRegion: 'District of Columbia',
    zipOrPostal: '20016',
    isInternational: false,
    countryCid: '',
    changeMonthCode: 10,
    changeYear: '2025',
    additionalInfo: 'Additional information that was provided goes here.',
    submittedTimestamp: '2025-11-20T15:21:26.763Z',
    ...overrides,
});

const yearOnlyRow = (overrides = {}) => latestRow({
    line1: '', line2: '', line3: '', line4: '', city: '', stateOrRegion: '', zipOrPostal: '',
    countryCid: '', isInternational: false, changeMonthCode: null, additionalInfo: '',
    ...overrides,
});

const openEditForm = async (page, opts) => {
    await setup(page, opts);
    await page.click('#srcdxHcsUpdate');
    await expect(page.locator('#UPAddressHcsFacLine1')).toBeVisible();
};

const fillDomesticUpdate = async (page) => {
    await page.fill('#UPAddressHcsFacLine1', 'New Care Facility');
    await page.fill('#UPAddressHcsFacLine2', '1 Care Way');
    await page.fill('#srcdxHcsChangeYr', String(currentYear));
};

// A minimal google.maps.places fake: records constructed Autocomplete instances so a test can
// fire place_changed with a canned establishment.
const injectFakeGooglePlaces = (page) => page.addInitScript(() => {
    window.__GOOGLE_ACS__ = [];
    class FakeAutocomplete {
        constructor(input) { this.input = input; this.listeners = {}; window.__GOOGLE_ACS__.push(this); }
        setFields() {}
        addListener(evt, cb) { this.listeners[evt] = cb; }
        getPlace() { return window.__GOOGLE_PLACE__; }
    }
    window.google = {
        maps: {
            places: { Autocomplete: FakeAutocomplete },
            event: { clearInstanceListeners() {} },
        },
    };
});

const pickGooglePlace = async (page, place = {
    name: 'SIBLEY MEMORIAL HOSPITAL',
    address_components: [
        { types: ['street_number'], long_name: '5255' },
        { types: ['route'], long_name: 'Loughboro Rd NW' },
        { types: ['locality'], long_name: 'Washington' },
        { types: ['administrative_area_level_1'], long_name: 'District of Columbia' },
        { types: ['postal_code'], long_name: '20016' },
    ],
}) => {
    await page.focus('#UPAddressHcsFacLine1'); // autocomplete attaches on first focus
    await page.evaluate((selectedPlace) => {
        window.__GOOGLE_PLACE__ = selectedPlace;
        const ac = window.__GOOGLE_ACS__.at(-1);
        ac.listeners.place_changed();
    }, place);
};

test.describe('HCS section — resting states', () => {
    test('never-updated: IHCS affiliation sentence with a bold signup site name, expanded, Edit button', async ({ page }) => {
        await setup(page);
        const section = page.locator('#srcdxHcsSection');
        await expect(section.locator('[data-srcdxhcs-card]')).not.toHaveClass(/srcdx-collapsed/);
        await expect(section).toContainText('You joined Connect with Sanford Health');
        await expect(section.locator('.srcdx-hcs-facility-name')).toHaveText('Sanford Health');
        await expect(section.locator('.srcdx-hcs-facility-name')).toHaveCSS('font-weight', /^(700|bold)$/);
        await expect(section.locator('#srcdxHcsUpdate')).toHaveText('Edit');
        await expect(section.locator('#UPAddressHcsFacLine1')).toHaveCount(0);
    });

    test('previously-updated: latest facility, bold last-updated label, regular date on the next line', async ({ page }) => {
        await setup(page, { hcsLatest: latestRow() });
        const section = page.locator('#srcdxHcsSection');
        await expect(section).toContainText('SIBLEY MEMORIAL HOSPITAL');
        await expect(section).toContainText('SIBLEY MEMORIAL HOSPITAL is the place where you get your primary care.');
        await expect(section.locator('.srcdx-hcs-facility-name')).toHaveText('SIBLEY MEMORIAL HOSPITAL');
        await expect(section.locator('.srcdx-hcs-facility-name')).toHaveCSS('font-weight', /^(700|bold)$/);
        const updatedBlock = section.locator('[data-srcdxhcs-last-updated]');
        const updatedLabel = updatedBlock.locator('strong');
        const updatedValue = updatedBlock.locator('[data-srcdxhcs-last-updated-value]');
        await expect(updatedLabel).toHaveText('Primary care facility last updated:');
        await expect(updatedValue).toHaveText('November 2025');
        const [labelBox, valueBox] = await Promise.all([updatedLabel.boundingBox(), updatedValue.boundingBox()]);
        expect(valueBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height);
        expect(await updatedLabel.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700');
        expect(await updatedValue.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('400');
        await expect(section).toContainText('Additional information that was provided goes here.');
        await expect(section).not.toContainText('You joined Connect with');
        await expect(section).not.toContainText('Current primary care facility:');
        // Empty Line 3 renders italic "None" (comp 18).
        await expect(section.locator('.fst-italic')).toContainText('None');
    });

    test('year-only latest update shows the date without an empty address block or false current-facility fallback', async ({ page }) => {
        await setup(page, { hcsLatest: yearOnlyRow() });
        const section = page.locator('#srcdxHcsSection');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsFacAddressHeader"]')).toHaveCount(0);
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsNone"]')).toHaveCount(0);
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsLastUpdated"]')).toBeVisible();
        await expect(section).toContainText('2025');

        await page.click('#srcdxHcsUpdate');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsCurrentFacility"]')).toHaveCount(0);
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveCount(0);
        await expect(section).not.toContainText('Sanford Health');
    });

    test('section collapses and re-expands from the header chevron', async ({ page }) => {
        await setup(page);
        const card = page.locator('[data-srcdxhcs-card]');
        await page.click('[data-srcdxhcs-toggle]');
        await expect(card).toHaveClass(/srcdx-collapsed/);
        await page.click('[data-srcdxhcs-toggle]');
        await expect(card).not.toHaveClass(/srcdx-collapsed/);
    });

    test('fetch failure renders the load-error body instead of the form entry point', async ({ page }) => {
        await page.addInitScript(() => { window.__HCS_FETCH_FAIL__ = true; });
        await setup(page);
        const section = page.locator('#srcdxHcsSection');
        await expect(section.locator('.alert-danger')).toBeVisible();
        await expect(section.locator('#srcdxHcsUpdate')).toHaveCount(0);
    });
});

test.describe('HCS section — approved Spanish content', () => {
    test('renders the approved landing, edit-form, and confirmation copy', async ({ page }) => {
        await setup(page, { i18n: es });
        const section = page.locator('#srcdxHcsSection');

        await expect(section.locator('[data-i18n="shareHealthInfo.hcsHeader"]')).toHaveText('Cambio del sistema de atención médica');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsIntro"]')).toHaveText('Connect es un estudio a largo plazo. Sabemos que el sistema de salud en el que recibe atención puede cambiar con el tiempo.');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsCurrentFacility"]')).toHaveText('Centro de atención primaria actual:');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsJoinedWith"]')).toHaveText('Comenzó a participar en Connect con');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsJoinedWithEnd"]')).toHaveText('como su centro de atención primaria. Si eso ha cambiado, haga clic en el botón Editar.');
        await expect(section.locator('#srcdxHcsUpdate')).toHaveText('Editar');
        await expect(section.locator('.srcdx-hcs-facility-name')).toHaveText('Sanford Health');

        await page.click('#srcdxHcsUpdate');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveCount(0);
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsFacAddressHeader"]')).toHaveText('Dirección del centro de atención primaria:');
        await expect(page.locator('label[for="UPAddressHcsFacLine1"]')).toContainText('Línea 1 (nombre del centro de atención primaria)');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveAttribute('placeholder', 'Ingrese el nombre del centro de atención primaria');
        await expect(page.locator('label[for="UPAddressHcsFacLine2"]')).toHaveText('Línea 2 (calle, ruta rural)');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsChangeDateLabel"]')).toHaveText('Fecha en la que cambió de centro de atención primaria:');
        await expect(page.locator('#srcdxHcsChangeYr')).toHaveAttribute('placeholder', 'Ingrese el año');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAdditionalInfo"]')).toHaveText('Información adicional:');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAdditionalInfoPrompt"]')).toHaveText('Proporcione cualquier información adicional a continuación:');
        await expect(page.locator('#srcdxHcsSubmit')).toHaveText('Enviar cambio de atención médica');
        await expect(page.locator('#srcdxHcsClear')).toHaveText('Borrar');

        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacLine1').locator('xpath=..').locator('.form-error')).toHaveText('Ingrese el nombre del centro de atención primaria.');

        await page.fill('#UPAddressHcsFacLine1', 'Centro de prueba');
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#srcdxHcsChangeYr').locator('xpath=..').locator('.form-error')).toHaveText('Ingrese un año válido (AAAA) que no sea más de 1 año en el futuro.');

        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.fill('#UPAddressHcsFacZip', '123');
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacZip').locator('xpath=..').locator('.form-error')).toHaveText('Ingrese un código postal válido de 5 dígitos.');

        await page.fill('#UPAddressHcsFacZip', '');
        await page.click('#srcdxHcsSubmit');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsThankYou"]')).toHaveText('Gracias por mantenernos informados. Puede volver y poner al día esta información en cualquier momento.');
    });

    test('renders the approved saved-update labels', async ({ page }) => {
        await setup(page, { i18n: es, hcsLatest: latestRow() });
        const section = page.locator('#srcdxHcsSection');

        await expect(section.locator('.srcdx-hcs-facility-name')).toHaveText('SIBLEY MEMORIAL HOSPITAL');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveText('es el lugar donde recibe su atención primaria.');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsFacAddressHeader"]')).toHaveText('Dirección del centro de atención primaria:');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAddrLine1"]')).toHaveText('Línea 1 de Dirección del centro de atención primaria');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAddrLine2"]')).toHaveText('Línea 2 de Dirección del centro de atención primaria');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAddrLine3"]')).toHaveText('Línea 3 de Dirección del centro de atención primaria');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAddrCity"]')).toHaveText('Ciudad');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAddrState"]')).toHaveText('Estado');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAddrZip"]')).toHaveText('Código postal');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsNone"]')).toHaveText('No se proporcionó');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsLastUpdated"]')).toHaveText('Último cambio del centro de atención primaria:');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAdditionalInfo"]')).toHaveText('Información adicional:');
    });

    test('renders the extracted Line 4 label for a saved international address', async ({ page }) => {
        await setup(page, {
            i18n: es,
            hcsLatest: latestRow({ isInternational: true, line4: 'Building B' }),
        });

        await expect(page.locator('[data-i18n="shareHealthInfo.hcsAddrLine4"]')).toHaveText('Línea 4 de Dirección del centro de atención primaria');
    });
});

test.describe('HCS section — edit form and validation', () => {
    test('Edit opens a blank form with facility name and Year required, while Line 2 remains optional', async ({ page }) => {
        await openEditForm(page);
        await expect(page.locator('label[for="UPAddressHcsFacLine1"] .required')).toBeVisible();
        await expect(page.locator('label[for="UPAddressHcsFacLine2"] .required')).toHaveCount(0);
        await expect(page.locator('label[for="srcdxHcsChangeYr"] .required')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveAttribute('required', '');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveAttribute('aria-required', 'true');
        await expect(page.locator('#UPAddressHcsFacRegion')).toHaveAttribute('maxlength', '48');
        await expect(page.locator('#srcdxHcsChangeMo')).toBeVisible();
        await expect(page.locator('#srcdxHcsAddlInfo')).toBeVisible();
        await expect(page.locator('#srcdxHcsSubmit')).toBeVisible();
        await expect(page.locator('#srcdxHcsClear')).toBeVisible();
        await expect(page.locator('#srcdxHcsSection [data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveCount(0);
        await expect(page.locator('#srcdxHcsSection')).not.toContainText('Sanford Health');
    });

    test('editing with a prior update hides the resting facility statement and starts a blank record', async ({ page }) => {
        await openEditForm(page, { hcsLatest: latestRow() });
        await expect(page.locator('#srcdxHcsSection [data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveCount(0);
        await expect(page.locator('#srcdxHcsSection')).not.toContainText('SIBLEY MEMORIAL HOSPITAL');
        await expect(page.locator('#srcdxHcsSection')).not.toContainText('Sanford Health is the place');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue(''); // blank form = new record
    });

    test('blocks on required facility name and Year, and on invalid optional values', async ({ page }) => {
        await openEditForm(page);
        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacLine1.invalid')).toBeVisible();
        expect(await hcsPayload(page)).toBeFalsy();

        await page.fill('#UPAddressHcsFacLine1', 'New Care Facility');
        await page.fill('#srcdxHcsChangeYr', '');
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#srcdxHcsChangeYr.invalid')).toBeVisible();
        expect(await hcsPayload(page)).toBeFalsy();

        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.fill('#UPAddressHcsFacZip', '123'); // malformed domestic zip
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacZip.invalid')).toBeVisible();

        await page.fill('#UPAddressHcsFacZip', '20016');
        await page.fill('#srcdxHcsChangeYr', String(currentYear + 2)); // beyond the +1yr allowance
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#srcdxHcsChangeYr.invalid')).toBeVisible();
        expect(await hcsPayload(page)).toBeFalsy();
    });

    test('facility-name-and-year submission succeeds while optional address fields remain omitted', async ({ page }) => {
        await openEditForm(page);
        await page.fill('#UPAddressHcsFacLine1', 'New Care Facility');
        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');

        await expect(page.locator('#srcdxHcsSection .srcdx-callout')).toContainText('Thank you for keeping us up to date');
        const payload = await hcsPayload(page);
        expect(payload[dk(h.changeYear)]).toBe(String(currentYear));
        expect(payload[dk(h.facility.line1)]).toBe('New Care Facility');
        expect(payload[dk(h.facility.line2)]).toBeUndefined();
        expect(payload[dk(h.facility.intlFlag)]).toBe(N);
        expect(payload[dk(h.facility.googleValidated)]).toBe(N);
    });

    test('Clear blanks the form', async ({ page }) => {
        await openEditForm(page);
        await fillDomesticUpdate(page);
        await page.click('#srcdxHcsClear');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue('');
        await expect(page.locator('#srcdxHcsChangeYr')).toHaveValue('');
    });

    test('manual entry submits the flat payload with Google-validated No and shows the thank-you state', async ({ page }) => {
        await openEditForm(page);
        await fillDomesticUpdate(page);
        await page.fill('#UPAddressHcsFacCity', 'Washington');
        await page.selectOption('#UPAddressHcsFacState', 'District of Columbia');
        await page.fill('#UPAddressHcsFacZip', '20016');
        await page.selectOption('#srcdxHcsChangeMo', '10'); // November
        await page.fill('#srcdxHcsAddlInfo', 'Moved across town.');
        await page.click('#srcdxHcsSubmit');

        await expect(page.locator('#srcdxHcsSection .srcdx-callout')).toContainText('Thank you for keeping us up to date');
        await expect(page.locator('#srcdxHcsSubmit')).toHaveCount(0);

        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.line1)]).toBe('New Care Facility');
        expect(payload[dk(h.facility.line2)]).toBe('1 Care Way');
        expect(payload[dk(h.facility.city)]).toBe('Washington');
        expect(payload[dk(h.facility.state)]).toBe('District of Columbia');
        expect(payload[dk(h.facility.zip)]).toBe('20016');
        expect(payload[dk(h.facility.intlFlag)]).toBe(N);
        expect(payload[dk(h.facility.googleValidated)]).toBe(N); // typed by hand -> not validated
        expect(payload[dk(h.changeMonth)]).toBe(String(fieldMapping.selfReportMonthValues[10]));
        expect(payload[dk(h.changeYear)]).toBe(String(currentYear));
        expect(payload[dk(h.additionalInfo)]).toBe('Moved across town.');
        expect(payload[dk(h.submittedTimestamp)]).toBeUndefined(); // server-owned
    });

    test('failed submit shows the error box and re-enables the button', async ({ page }) => {
        await page.addInitScript(() => { window.__HCS_SUBMIT_FAIL__ = true; });
        await openEditForm(page);
        await fillDomesticUpdate(page);
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#srcdxHcsError .alert-danger')).toBeVisible();
        await expect(page.locator('#srcdxHcsSubmit')).toBeEnabled();
    });
});

test.describe('HCS section — Google Places validated-flag lifecycle', () => {
    test('picking a Google establishment fills the form and submits Google-validated Yes', async ({ page }) => {
        await injectFakeGooglePlaces(page);
        await openEditForm(page);
        await pickGooglePlace(page);

        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue('SIBLEY MEMORIAL HOSPITAL');
        await expect(page.locator('#UPAddressHcsFacLine2')).toHaveValue('5255 Loughboro Rd NW');
        await expect(page.locator('#UPAddressHcsFacCity')).toHaveValue('Washington');
        await expect(page.locator('#UPAddressHcsFacState')).toHaveValue('District of Columbia');
        await expect(page.locator('#UPAddressHcsFacZip')).toHaveValue('20016');

        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');
        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.googleValidated)]).toBe(Y);
        expect(payload[dk(h.facility.line1)]).toBe('SIBLEY MEMORIAL HOSPITAL'); // verbatim casing
    });

    test('editing a Google-matched core field after a pick invalidates the flag', async ({ page }) => {
        await injectFakeGooglePlaces(page);
        await openEditForm(page);
        await pickGooglePlace(page);
        await page.fill('#UPAddressHcsFacCity', 'Bethesda'); // manual correction
        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');
        expect((await hcsPayload(page))[dk(h.facility.googleValidated)]).toBe(N);
    });

    test('the international toggle swaps to Region/Postal/Country and submits intl fields with Google-validated No', async ({ page }) => {
        await injectFakeGooglePlaces(page);
        await openEditForm(page);
        await pickGooglePlace(page); // validated first, must be forced off by the intl toggle
        await page.check('#UPAddressHcsFacInternational');

        await expect(page.locator('#UPAddressHcsFacState')).toBeHidden();
        await expect(page.locator('#UPAddressHcsFacZip')).toBeHidden();
        await expect(page.locator('#UPAddressHcsFacRegion')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacPostal')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacLine4Row')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacCountryRow')).toBeVisible();

        await page.fill('#UPAddressHcsFacLine1', 'Royal Marsden');
        await page.fill('#UPAddressHcsFacLine2', '203 Fulham Rd');
        await page.fill('#UPAddressHcsFacLine4', 'Building B, Chelsea');
        await page.fill('#UPAddressHcsFacCity', 'London');
        await page.fill('#UPAddressHcsFacRegion', 'Greater London');
        await page.fill('#UPAddressHcsFacPostal', 'SW3 6JJ');
        await page.selectOption('#UPAddressHcsFacCountry', '2'); // United Kingdom (stub allCountries)
        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');

        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.intlFlag)]).toBe(Y);
        expect(payload[dk(h.facility.googleValidated)]).toBe(N); // forced off for international
        expect(payload[dk(h.facility.line4)]).toBe('Building B, Chelsea');
        expect(payload[dk(h.facility.state)]).toBe('Greater London'); // merged state/region cid
        expect(payload[dk(h.facility.zip)]).toBe('SW3 6JJ');          // merged zip/postal cid
        expect(payload[dk(h.facility.country)]).toBe('156628245');    // United Kingdom response cid
    });

    test('an explicit international Yes is preserved with only the required facility name', async ({ page }) => {
        await openEditForm(page);
        await page.check('#UPAddressHcsFacInternational');
        await page.fill('#UPAddressHcsFacLine1', 'Royal Marsden');
        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');

        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.intlFlag)]).toBe(Y);
        expect(payload[dk(h.facility.googleValidated)]).toBe(N);
        expect(payload[dk(h.facility.line1)]).toBe('Royal Marsden');
        expect(payload[dk(h.facility.line2)]).toBeUndefined();
    });
});

test.describe('HCS section — date and address submission scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-07-09T12:00:00.000Z'));
    });

    test('blank required year blocks submission', async ({ page }) => {
        await openEditForm(page);
        await page.fill('#UPAddressHcsFacLine1', 'Test Primary Care Facility');
        await page.click('#srcdxHcsSubmit');

        await expect(page.locator('#srcdxHcsChangeYr.invalid')).toBeVisible();
        await expect(page.locator('#srcdxHcsChangeYr').locator('xpath=..').locator('.error-text')).toBeVisible();
        expect(await hcsPayload(page)).toBeFalsy();
    });

    test('year beyond the one-year future allowance is rejected', async ({ page }) => {
        await openEditForm(page);
        await page.fill('#UPAddressHcsFacLine1', 'Test Primary Care Facility');
        await page.fill('#srcdxHcsChangeYr', '2028');
        await page.click('#srcdxHcsSubmit');

        await expect(page.locator('#srcdxHcsChangeYr.invalid')).toBeVisible();
        expect(await hcsPayload(page)).toBeFalsy();
    });

    test('January 2025 submits the authoritative month and year CIDs', async ({ page }) => {
        await openEditForm(page);
        await page.fill('#UPAddressHcsFacLine1', 'Test Primary Care Facility');
        await page.selectOption('#srcdxHcsChangeMo', '0');
        await page.fill('#srcdxHcsChangeYr', '2025');
        await page.click('#srcdxHcsSubmit');

        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.line1)]).toBe('Test Primary Care Facility');
        expect(payload[dk(h.changeMonth)]).toBe('286592124');
        expect(payload[dk(h.changeYear)]).toBe('2025');
        expect(payload[dk(h.submittedTimestamp)]).toBeUndefined(); // FaaS owns D_223569179.
        expect(payload[String(fieldMapping.docLastUpdatedTimestamp)]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('international fields and Netherlands CID submit with required facility name and no Line 2', async ({ page }) => {
        await openEditForm(page);
        await page.check('#UPAddressHcsFacInternational');

        await expect(page.locator('#UPAddressHcsFacLine4Row')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacState')).toBeHidden();
        await expect(page.locator('#UPAddressHcsFacRegion')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacZip')).toBeHidden();
        await expect(page.locator('#UPAddressHcsFacPostal')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacCountryRow')).toBeVisible();
        await expect(page.locator('#UPAddressHcsFacStateLabel')).toHaveAttribute('data-i18n', 'shareHealthInfo.facRegion');
        await expect(page.locator('#UPAddressHcsFacZipLabel')).toHaveAttribute('data-i18n', 'shareHealthInfo.facPostal');

        await page.fill('#UPAddressHcsFacLine1', 'Amsterdam Medical Center');
        await page.fill('#UPAddressHcsFacLine4', 'Line 4');
        await page.fill('#UPAddressHcsFacCity', 'Amsterdam');
        await page.fill('#UPAddressHcsFacRegion', 'Holland');
        await page.fill('#UPAddressHcsFacPostal', '1012 AW');
        await page.selectOption('#UPAddressHcsFacCountry', '149');
        await page.fill('#srcdxHcsChangeYr', '2025'); // Change year is required independently of address fields.
        await page.click('#srcdxHcsSubmit');

        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.intlFlag)]).toBe(Y);
        expect(payload[dk(h.facility.googleValidated)]).toBe(N);
        expect(payload[dk(h.facility.line1)]).toBe('Amsterdam Medical Center');
        expect(payload[dk(h.facility.line2)]).toBeUndefined();
        expect(payload[dk(h.facility.line4)]).toBe('Line 4');
        expect(payload[dk(h.facility.city)]).toBe('Amsterdam');
        expect(payload[dk(h.facility.state)]).toBe('Holland');
        expect(payload[dk(h.facility.zip)]).toBe('1012 AW');
        expect(payload[dk(h.facility.country)]).toBe('786642491');
    });

    test('Google-selected Emory address retains Yes when supplemental Line 3 is entered', async ({ page }) => {
        await injectFakeGooglePlaces(page);
        await openEditForm(page);
        await pickGooglePlace(page, {
            name: 'Emory University Hospital Midtown',
            address_components: [
                { types: ['street_number'], long_name: '550' },
                { types: ['route'], long_name: 'Peachtree Street Northeast' },
                { types: ['locality'], long_name: 'Atlanta' },
                { types: ['administrative_area_level_1'], long_name: 'Georgia' },
                { types: ['postal_code'], long_name: '30308' },
            ],
        });
        await page.fill('#UPAddressHcsFacLine3', 'XXXX');
        await expect(page.locator('#UPAddressHcsFacGoogleValidated')).toHaveValue('true');
        await page.fill('#srcdxHcsAddlInfo', 'Primary care team moved to Midtown.');
        await page.fill('#srcdxHcsChangeYr', '2025'); // Change year is required independently of address fields.
        await page.click('#srcdxHcsSubmit');

        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.line1)]).toBe('Emory University Hospital Midtown');
        expect(payload[dk(h.facility.line2)]).toBe('550 Peachtree Street Northeast');
        expect(payload[dk(h.facility.line3)]).toBe('XXXX');
        expect(payload[dk(h.facility.city)]).toBe('Atlanta');
        expect(payload[dk(h.facility.state)]).toBe('Georgia');
        expect(payload[dk(h.facility.zip)]).toBe('30308');
        expect(payload[dk(h.facility.googleValidated)]).toBe(Y);
        expect(payload[dk(h.additionalInfo)]).toBe('Primary care team moved to Midtown.');
    });
});

test.describe('HCS section — repeated update lifecycle', () => {
    test('first update, refresh, blank second form, year-only update, and newest-row display', async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-07-14T12:00:00.000Z'));
        await setup(page);

        const section = page.locator('#srcdxHcsSection');
        await expect(section).toContainText('You joined Connect with Sanford Health');
        await expect(section.locator('#UPAddressHcsFacLine1')).toHaveCount(0);

        await page.click('#srcdxHcsUpdate');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveCount(0);
        await expect(section).not.toContainText('Sanford Health');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue('');
        await expect(page.locator('#srcdxHcsChangeYr')).toHaveValue('');

        await page.fill('#UPAddressHcsFacLine1', 'First Primary Care Facility');
        await page.fill('#UPAddressHcsFacLine2', '100 First Avenue');
        await page.fill('#UPAddressHcsFacCity', 'Atlanta');
        await page.selectOption('#UPAddressHcsFacState', 'Georgia');
        await page.fill('#UPAddressHcsFacZip', '30308');
        await page.selectOption('#srcdxHcsChangeMo', '0');
        await page.fill('#srcdxHcsChangeYr', '2025');
        await page.fill('#srcdxHcsAddlInfo', 'First update notes.');
        await page.click('#srcdxHcsSubmit');

        await expect(section.locator('.srcdx-callout')).toContainText('Thank you for keeping us up to date');
        expect((await hcsPayload(page))[dk(h.changeMonth)]).toBe('286592124');

        await page.reload();
        await expect(section).toContainText('First Primary Care Facility is the place where you get your primary care.');
        await expect(section).toContainText('First Primary Care Facility');
        await expect(section).toContainText('January 2025');
        await expect(section).toContainText('First update notes.');
        await expect(section).not.toContainText('You joined Connect with');

        await page.click('#srcdxHcsUpdate');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toHaveCount(0);
        await expect(section).not.toContainText('First Primary Care Facility');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue('');
        await expect(page.locator('#UPAddressHcsFacLine2')).toHaveValue('');
        await expect(page.locator('#srcdxHcsChangeMo')).toHaveValue('');
        await expect(page.locator('#srcdxHcsChangeYr')).toHaveValue('');
        await expect(page.locator('#srcdxHcsAddlInfo')).toHaveValue('');

        await page.fill('#UPAddressHcsFacLine1', 'Second Primary Care Facility');
        await page.fill('#srcdxHcsChangeYr', '2026');
        await page.click('#srcdxHcsSubmit');

        await expect(section.locator('.srcdx-callout')).toContainText('Thank you for keeping us up to date');
        const secondPayload = await hcsPayload(page);
        expect(secondPayload[dk(h.facility.line1)]).toBe('Second Primary Care Facility');
        expect(secondPayload[dk(h.changeYear)]).toBe('2026');
        expect(secondPayload[dk(h.changeMonth)]).toBeUndefined();
        expect(secondPayload[dk(h.additionalInfo)]).toBeUndefined();

        await page.reload();
        await expect(section).toContainText('Second Primary Care Facility is the place where you get your primary care.');
        await expect(section).toContainText('Second Primary Care Facility');
        await expect(section).toContainText('2026');
        await expect(section).not.toContainText('First Primary Care Facility');
        await expect(section.locator('[data-i18n="shareHealthInfo.hcsAdditionalInfo"]')).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => window.__HCS_STORED_ROWS__?.length)).toBe(2);
    });
});

test.describe('HCS section — coexistence with the cancer-dx flow', () => {
    test('mid-process screens keep the static collapsed HCS card; returning to the landing restores the interactive section', async ({ page }) => {
        await setup(page);
        await expect(page.locator('#srcdxHcsUpdate')).toBeVisible();
        await page.click('#srcdxAddDiagnosis'); // enter the cancer-dx flow
        await expect(page.locator('#srcdxHcsSection [data-srcdx-card]')).toHaveClass(/srcdx-collapsed/);
        await expect(page.locator('#srcdxHcsUpdate')).toHaveCount(0);
        await page.click('#srcdxBack'); // back to the landing
        await expect(page.locator('#srcdxHcsUpdate')).toBeVisible();
    });

    test('withdrawn participants are routed away (no HCS section reachable)', async ({ page }) => {
        await setup(page, { fixture: withdrawn });
        await expect(page.locator('#srcdxHcsSection')).toHaveCount(0);
    });
});
