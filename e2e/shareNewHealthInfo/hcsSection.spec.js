// E2E for the Health Care System Update section (issue #1658): section states, the edit form,
// validation, the flat submit payload, and the Google Places validated-flag lifecycle (a fake
// google.maps.places.Autocomplete injected so the pick -> validated / edit -> invalidated
// behavior runs in a browser without the live API).

import { test, expect } from '@playwright/test';
import { setup, withdrawn, dk } from './support.js';
import fieldMapping from '../../js/fieldToConceptIdMapping.js';

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
    stateOrRegion: 'DC',
    zipOrPostal: '20016',
    isInternational: false,
    countryCid: '',
    changeMonthCode: 10,
    changeYear: '2025',
    additionalInfo: 'Additional information that was provided goes here.',
    submittedTimestamp: '2025-11-20T15:21:26.763Z',
    ...overrides,
});

const openEditForm = async (page, opts) => {
    await setup(page, opts);
    await page.click('#srcdxHcsUpdate');
    await expect(page.locator('#UPAddressHcsFacLine1')).toBeVisible();
};

const fillMinimumValid = async (page) => {
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

const pickGooglePlace = async (page) => {
    await page.focus('#UPAddressHcsFacLine1'); // autocomplete attaches on first focus
    await page.evaluate(() => {
        window.__GOOGLE_PLACE__ = {
            name: 'SIBLEY MEMORIAL HOSPITAL',
            address_components: [
                { types: ['street_number'], long_name: '5255' },
                { types: ['route'], long_name: 'Loughboro Rd NW' },
                { types: ['locality'], long_name: 'Washington' },
                { types: ['administrative_area_level_1'], long_name: 'DC' }, // stub allStates keys are abbreviations
                { types: ['postal_code'], long_name: '20016' },
            ],
        };
        const ac = window.__GOOGLE_ACS__.at(-1);
        ac.listeners.place_changed();
    });
};

test.describe('HCS section — resting states', () => {
    test('never-updated: IHCS affiliation sentence with the signup site name, expanded, Update button', async ({ page }) => {
        await setup(page);
        const section = page.locator('#srcdxHcsSection');
        await expect(section.locator('[data-srcdxhcs-card]')).not.toHaveClass(/srcdx-collapsed/);
        await expect(section).toContainText('You joined Connect with Sanford Health');
        await expect(section.locator('#srcdxHcsUpdate')).toBeVisible();
        await expect(section.locator('#UPAddressHcsFacLine1')).toHaveCount(0);
    });

    test('previously-updated: latest facility, bold last-updated line, additional info, no IHCS header', async ({ page }) => {
        await setup(page, { hcsLatest: latestRow() });
        const section = page.locator('#srcdxHcsSection');
        await expect(section).toContainText('SIBLEY MEMORIAL HOSPITAL');
        await expect(section).toContainText('November 2025');
        await expect(section).toContainText('Additional information that was provided goes here.');
        await expect(section).not.toContainText('You joined Connect with');
        await expect(section).not.toContainText('Current primary care facility:');
        // Empty Line 3 renders italic "None" (comp 18).
        await expect(section.locator('.fst-italic')).toContainText('None');
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

test.describe('HCS section — edit form and validation', () => {
    test('Update opens the form: required markers on Line 1/Line 2/Year, month dropdown, textarea, Submit + Clear', async ({ page }) => {
        await openEditForm(page);
        await expect(page.locator('label[for="UPAddressHcsFacLine1"] .required')).toBeVisible();
        await expect(page.locator('label[for="UPAddressHcsFacLine2"] .required')).toBeVisible();
        await expect(page.locator('label[for="srcdxHcsChangeYr"] .required')).toBeVisible();
        await expect(page.locator('#srcdxHcsChangeMo')).toBeVisible();
        await expect(page.locator('#srcdxHcsAddlInfo')).toBeVisible();
        await expect(page.locator('#srcdxHcsSubmit')).toBeVisible();
        await expect(page.locator('#srcdxHcsClear')).toBeVisible();
        // First-time updater: the current-facility blurb shows the signup site.
        await expect(page.locator('#srcdxHcsSection')).toContainText('Sanford Health is the place where you get your primary care.');
    });

    test('editing with a prior update pipes the reported facility name (verbatim casing) into the blurb', async ({ page }) => {
        await openEditForm(page, { hcsLatest: latestRow() });
        await expect(page.locator('#srcdxHcsSection')).toContainText('SIBLEY MEMORIAL HOSPITAL is the place where you get your primary care.');
        await expect(page.locator('#srcdxHcsSection')).not.toContainText('Sanford Health is the place');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue(''); // blank form = new record
    });

    test('blocks submit without required fields, then field-by-field', async ({ page }) => {
        await openEditForm(page);
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacLine1.invalid')).toBeVisible(); // Line 1 first
        expect(await hcsPayload(page)).toBeFalsy();

        await page.fill('#UPAddressHcsFacLine1', 'New Care Facility');
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacLine2.invalid')).toBeVisible();

        await page.fill('#UPAddressHcsFacLine2', '1 Care Way');
        await page.fill('#UPAddressHcsFacZip', '123'); // malformed domestic zip
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#UPAddressHcsFacZip.invalid')).toBeVisible();

        await page.fill('#UPAddressHcsFacZip', '20016');
        await page.fill('#srcdxHcsChangeYr', String(currentYear + 2)); // beyond the +1yr allowance
        await page.click('#srcdxHcsSubmit');
        await expect(page.locator('#srcdxHcsChangeYr.invalid')).toBeVisible();
        expect(await hcsPayload(page)).toBeFalsy();
    });

    test('Clear blanks the form', async ({ page }) => {
        await openEditForm(page);
        await fillMinimumValid(page);
        await page.click('#srcdxHcsClear');
        await expect(page.locator('#UPAddressHcsFacLine1')).toHaveValue('');
        await expect(page.locator('#srcdxHcsChangeYr')).toHaveValue('');
    });

    test('manual entry submits the flat payload with Google-validated No and shows the thank-you state', async ({ page }) => {
        await openEditForm(page);
        await fillMinimumValid(page);
        await page.fill('#UPAddressHcsFacCity', 'Washington');
        await page.selectOption('#UPAddressHcsFacState', 'DC');
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
        expect(payload[dk(h.facility.state)]).toBe('DC');
        expect(payload[dk(h.facility.zip)]).toBe('20016');
        expect(payload[dk(h.facility.intlFlag)]).toBe(N);
        expect(payload[dk(h.facility.googleValidated)]).toBe(N); // typed by hand -> not validated
        expect(payload[dk(h.changeMonth)]).toBe(String(h.monthValues[10]));
        expect(payload[dk(h.changeYear)]).toBe(String(currentYear));
        expect(payload[dk(h.additionalInfo)]).toBe('Moved across town.');
        expect(payload[dk(h.submittedTimestamp)]).toBeUndefined(); // server-owned
    });

    test('failed submit shows the error box and re-enables the button', async ({ page }) => {
        await page.addInitScript(() => { window.__HCS_SUBMIT_FAIL__ = true; });
        await openEditForm(page);
        await fillMinimumValid(page);
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
        await expect(page.locator('#UPAddressHcsFacState')).toHaveValue('DC');
        await expect(page.locator('#UPAddressHcsFacZip')).toHaveValue('20016');

        await page.fill('#srcdxHcsChangeYr', String(currentYear));
        await page.click('#srcdxHcsSubmit');
        const payload = await hcsPayload(page);
        expect(payload[dk(h.facility.googleValidated)]).toBe(Y);
        expect(payload[dk(h.facility.line1)]).toBe('SIBLEY MEMORIAL HOSPITAL'); // verbatim casing
    });

    test('editing any field after a Google pick invalidates the flag', async ({ page }) => {
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
