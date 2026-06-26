// Facility-address component DOM tests (local JSDOM; shared.js + settingsHelpers.js mocked).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    translateHTML: (s) => s,
    allStates: { AL: 1, MD: 2, DC: 3 },
    allCountries: { 'United States': 1, 'United Kingdom': 2 },
}));

import {
    renderFacilityAddress,
    attachFacilityAddressEvents,
    teardownFacilityAddressEvents,
    harvestFacility,
    fillFacility,
} from '../js/components/facilityAddress.js';

const ID = 'TxFac_chemo_1';
let win, content;

beforeEach(() => {
    win = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>').window;
    content = win.document.getElementById('c');
    content.innerHTML = renderFacilityAddress(ID);
    attachFacilityAddressEvents(content, ID);
});

afterEach(() => {
    teardownFacilityAddressEvents();
});

const el = (suffix) => content.querySelector(`#UPAddress${ID}${suffix}`);
const hidden = (suffix) => el(suffix).classList.contains('d-none');

describe('renderFacilityAddress', () => {
    it('renders the expected fields with the id-prefix convention', () => {
        ['Line1', 'Line2', 'Line3', 'Line4', 'City', 'State', 'Region', 'Zip', 'Postal', 'Country', 'International']
            .forEach((suffix) => expect(el(suffix), suffix).not.toBeNull());
    });
    it('marks text inputs with translatable placeholder keys', () => {
        expect(el('Line1').dataset.i18n).toBe('shareHealthInfo.facNameInput');
        expect(el('Line2').dataset.i18n).toBe('shareHealthInfo.facLine2Input');
        expect(el('Line3').dataset.i18n).toBe('shareHealthInfo.facLine3Input');
        expect(el('Line4').dataset.i18n).toBe('shareHealthInfo.facLine4Input');
        expect(el('City').dataset.i18n).toBe('shareHealthInfo.facCityInput');
        expect(el('Zip').dataset.i18n).toBe('shareHealthInfo.facZipInput');
        expect(el('Postal').dataset.i18n).toBe('shareHealthInfo.facPostalInput');
    });
    it('defaults to domestic: State/Zip visible, Region/Postal/Country/Line4 hidden', () => {
        expect(hidden('State')).toBe(false);
        expect(hidden('Zip')).toBe(false);
        expect(hidden('Region')).toBe(true);
        expect(hidden('Postal')).toBe(true);
        expect(hidden('CountryRow')).toBe(true);
        expect(hidden('Line4Row')).toBe(true);
    });
    it('fences browser autofill: each block is its own <form> with standard address tokens; Line 1 stays off', () => {
        // The form boundary keeps the physician fields (outside it) and sibling facility blocks out
        // of a fill, while bare standard tokens give Chrome full MULTI-FIELD address fill — section-*
        // tokens on form-less fields degraded Chrome to single-field fill (found in manual testing).
        const formEl = content.querySelector(`form[data-facility="${ID}"]`);
        expect(formEl).not.toBeNull();
        expect(formEl.getAttribute('autocomplete')).toBe('on');
        // The form exists only for autofill scoping — submitting must be a no-op (Enter would otherwise reload the app mid-process).
        const submitEvt = new win.Event('submit', { cancelable: true });
        formEl.dispatchEvent(submitEvt);
        expect(submitEvt.defaultPrevented).toBe(true);
        expect(el('Line1').getAttribute('autocomplete')).toBe('off'); // Places owns Line 1
        expect(el('Line2').getAttribute('autocomplete')).toBe('address-line1'); // our Line 2 = street
        expect(el('Line3').getAttribute('autocomplete')).toBe('address-line2');
        expect(el('Line4').getAttribute('autocomplete')).toBe('address-line3');
        expect(el('City').getAttribute('autocomplete')).toBe('address-level2');
        expect(el('State').getAttribute('autocomplete')).toBe('address-level1');
        expect(el('Region').getAttribute('autocomplete')).toBe('address-level1');
        expect(el('Zip').getAttribute('autocomplete')).toBe('postal-code');
        expect(el('Postal').getAttribute('autocomplete')).toBe('postal-code');
        expect(el('Country').getAttribute('autocomplete')).toBe('country');
    });

    it('renders no required-field markers (addresses are optional)', () => {
        expect(content.querySelectorAll('.required-field')).toHaveLength(0);
    });
    it('excludes United States from the international country list', () => {
        const values = [...el('Country').options].map((o) => o.value);
        expect(values).not.toContain('1'); // United States (allCountries value 1) excluded
        expect(values).toContain('2');     // United Kingdom present
    });
});

describe('international toggle', () => {
    beforeEach(() => {
        el('International').checked = true;
        el('International').dispatchEvent(new win.Event('change'));
    });
    it('swaps to Region/Postal/Country, reveals Line 4, and hides State/Zip', () => {
        expect(hidden('State')).toBe(true);
        expect(hidden('Zip')).toBe(true);
        expect(hidden('Region')).toBe(false);
        expect(hidden('Postal')).toBe(false);
        expect(hidden('CountryRow')).toBe(false);
        expect(hidden('Line4Row')).toBe(false);
    });
    it('hides and clears Line 4 when switched back to domestic', () => {
        el('Line4').value = 'Building B, Chelsea';
        el('International').checked = false;
        el('International').dispatchEvent(new win.Event('change'));
        expect(hidden('Line4Row')).toBe(true);
        expect(el('Line4').value).toBe('');
    });
    it('relabels the State/Zip labels to Region/Postal', () => {
        expect(el('StateLabel').dataset.i18n).toBe('shareHealthInfo.facRegion');
        expect(el('ZipLabel').dataset.i18n).toBe('shareHealthInfo.facPostal');
    });
});

describe('harvestFacility', () => {
    it('captures domestic fields (state/zip), not region/postal/country', () => {
        el('Line1').value = 'Sibley Memorial Hospital';
        el('Line2').value = '5255 Loughboro Rd NW';
        el('City').value = 'Washington';
        el('State').value = 'DC';
        el('Zip').value = '20016';
        const f = harvestFacility(content, ID);
        expect(f).toMatchObject({
            line1: 'Sibley Memorial Hospital', line2: '5255 Loughboro Rd NW',
            city: 'Washington', state: 'DC', zip: '20016',
            isInternational: false, line4: '', region: '', postal: '', country: '',
        });
    });
    it('captures international fields (region/postal/country), not state/zip', () => {
        el('International').checked = true;
        el('International').dispatchEvent(new win.Event('change'));
        el('Line1').value = 'Royal Marsden';
        el('Line4').value = 'Building B, Chelsea';
        el('Region').value = 'Greater London';
        el('Postal').value = 'SW3 6JJ';
        el('Country').value = '2'; // United Kingdom (allCountries value)
        // even if a stale state value is present, harvest should drop it when international
        el('State').value = 'DC';
        const f = harvestFacility(content, ID);
        expect(f).toMatchObject({
            line1: 'Royal Marsden', isInternational: true,
            line4: 'Building B, Chelsea',
            region: 'Greater London', postal: 'SW3 6JJ', country: '2',
            state: '', zip: '',
        });
    });
});

describe('fillFacility', () => {
    it('repopulates fields and applies international display', () => {
        fillFacility(content, ID, {
            line1: 'Royal Marsden', line2: '203 Fulham Rd', city: 'London',
            region: 'Greater London', postal: 'SW3 6JJ', country: 'gbr', isInternational: true,
        });
        expect(el('Line1').value).toBe('Royal Marsden');
        expect(el('Region').value).toBe('Greater London');
        expect(el('International').checked).toBe(true);
        expect(hidden('Region')).toBe(false);
        expect(hidden('State')).toBe(true);
    });
});

describe('name autocomplete (Google Places)', () => {
    // Fake enough of the Places API to capture the instance + its place_changed callback.
    const instances = [];
    class FakeAutocomplete {
        constructor(input, options) {
            this.input = input;
            this.options = options;
            this.componentRestrictionCalls = [];
            instances.push(this);
        }
        setFields(fields) { this.fields = fields; }
        setComponentRestrictions(restrictions) {
            this.componentRestrictionCalls.push(restrictions);
        }
        addListener(evt, cb) { if (evt === 'place_changed') this.cb = cb; }
        getPlace() { return this.place; }
    }
    let clearInstanceListeners;

    beforeEach(() => {
        instances.length = 0;
        clearInstanceListeners = vi.fn();
        globalThis.google = {
            maps: { places: { Autocomplete: FakeAutocomplete }, event: { clearInstanceListeners } },
        };
    });
    afterEach(() => {
        teardownFacilityAddressEvents();
        delete globalThis.google;
    });

    const focusLine1 = () => el('Line1').dispatchEvent(new win.Event('focus'));

    it('restricts domestic Places predictions to U.S. establishments', () => {
        focusLine1();
        expect(instances[0].options).toMatchObject({
            types: ['establishment'],
            componentRestrictions: { country: 'us' },
        });
        expect(instances[0].fields).toEqual(['name', 'address_components']);
    });

    it('does not create Places autocomplete when already international', () => {
        el('International').checked = true;
        el('International').dispatchEvent(new win.Event('change'));
        focusLine1();
        expect(instances).toHaveLength(0);
    });

    it('tears down active Places autocomplete while international, then restores it for domestic', () => {
        focusLine1();
        const ac = instances[0];
        const input = ac.input;
        el('International').checked = true;
        el('International').dispatchEvent(new win.Event('change'));
        let clearedArgs = clearInstanceListeners.mock.calls.map((c) => c[0]);
        expect(clearedArgs.includes(ac)).toBe(true);
        expect(clearedArgs.includes(input)).toBe(true);

        focusLine1();
        expect(instances).toHaveLength(1);

        el('International').checked = false;
        el('International').dispatchEvent(new win.Event('change'));
        focusLine1();
        expect(instances).toHaveLength(2);
        expect(instances[1].options).toMatchObject({
            types: ['establishment'],
            componentRestrictions: { country: 'us' },
        });
    });

    it('fills State from the LONG name (matches the full-name select options), not the 2-letter code', () => {
        focusLine1();
        const ac = instances[instances.length - 1];
        ac.place = {
            name: 'Johns Hopkins Hospital',
            address_components: [
                { types: ['street_number'], long_name: '1800', short_name: '1800' },
                { types: ['route'], long_name: 'Orleans St', short_name: 'Orleans St' },
                { types: ['locality'], long_name: 'Baltimore', short_name: 'Baltimore' },
                // short_name is the 2-letter code; the select's option values are the full names
                { types: ['administrative_area_level_1'], long_name: 'MD', short_name: 'XX' },
                { types: ['postal_code'], long_name: '21287', short_name: '21287' },
            ],
        };
        ac.cb();
        expect(el('Line1').value).toBe('Johns Hopkins Hospital');
        expect(el('Line2').value).toBe('1800 Orleans St');
        expect(el('City').value).toBe('Baltimore');
        expect(el('State').value).toBe('MD'); // long_name selected; short_name ('XX') would no-op to ''
        expect(el('Zip').value).toBe('21287');
    });

    it('ignores a stale Places callback after switching to international', () => {
        focusLine1();
        const ac = instances[instances.length - 1];
        ac.place = {
            name: 'Johns Hopkins Hospital',
            address_components: [
                { types: ['street_number'], long_name: '1800' },
                { types: ['route'], long_name: 'Orleans St' },
                { types: ['locality'], long_name: 'Baltimore' },
                { types: ['administrative_area_level_1'], long_name: 'MD' },
                { types: ['postal_code'], long_name: '21287' },
            ],
        };
        el('International').checked = true;
        el('International').dispatchEvent(new win.Event('change'));
        ac.cb();
        expect(el('Line1').value).toBe('');
        expect(el('Line2').value).toBe('');
        expect(el('City').value).toBe('');
        expect(el('State').value).toBe('');
        expect(el('Zip').value).toBe('');
    });

    it('tears down the previous instance on re-attach (rerender), so listeners/closures are released', () => {
        focusLine1();
        const firstInstance = instances[0];
        const firstInput = el('Line1');

        // Simulate a screen rerender: the markup (and inputs) are rebuilt, events re-attached.
        content.innerHTML = renderFacilityAddress(ID);
        attachFacilityAddressEvents(content, ID);
        focusLine1();

        // Assert on primitives only: matchers that inspect arrays of DOM nodes walk node getters
        // (ownerDocument -> window.localStorage), which throws on JSDOM's opaque origin.
        expect(instances.length).toBe(2);
        const clearedArgs = clearInstanceListeners.mock.calls.map((c) => c[0]);
        expect(clearedArgs.includes(firstInstance)).toBe(true);
        expect(clearedArgs.includes(firstInput)).toBe(true);
    });

    it('does not stack duplicate focus listeners when attached twice to the same input', () => {
        attachFacilityAddressEvents(content, ID);
        focusLine1();
        expect(instances).toHaveLength(1);
    });

    it('tears down active Places listeners when the screen is replaced', () => {
        focusLine1();
        const instance = instances[0];
        const input = el('Line1');

        teardownFacilityAddressEvents();

        const clearedArgs = clearInstanceListeners.mock.calls.map((c) => c[0]);
        expect(clearedArgs.includes(instance)).toBe(true);
        expect(clearedArgs.includes(input)).toBe(true);
    });
});
