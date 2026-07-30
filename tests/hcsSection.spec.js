// DOM state-machine tests for the Health Care System Update section (issue #1658).
// Uses a local JSDOM instance (srcDxScreens pattern); shared.js and the transport layer are mocked.
// States under test: initial IHCS view -> editing -> submitted, and the previously-updated view.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    translateHTML: (s) => s,
    translateText: (k) => k,
    errorMessage: vi.fn(),
    escapeHTML: (s) => String(s ?? ''),
    getSelectedLanguage: () => 409,
    sites: () => ({ 1: 'Sanford Health' }),
    allStates: { Alabama: 'AL', 'District of Columbia': 'DC', Maryland: 'MD' },
    allCountries: { 'United States': 1, 'United Kingdom': 2, Canada: 3 },
}));
vi.mock('../js/pages/shareNewHealthInfo/dataAccess.js', () => ({
    submitSelfReportHCSUpdate: vi.fn(),
    getMostRecentHCSUpdate: vi.fn(),
}));

import fieldMapping from '../js/fieldToConceptIdMapping.js';
import * as shared from '../js/shared.js';
import { submitSelfReportHCSUpdate, getMostRecentHCSUpdate } from '../js/pages/shareNewHealthInfo/dataAccess.js';
import { mountHcsSection, resetHcsSection, HCS_SECTION_ID } from '../js/pages/shareNewHealthInfo/hcsSection.js';

let win, content;
const participant = { [fieldMapping.healthcareProvider]: 1 };

const flush = () => new Promise((resolve) => setTimeout(resolve));

const latestRow = (overrides = {}) => ({
    line1: 'Sibley Memorial Hospital',
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

const mount = async () => {
    await mountHcsSection(content, { participant });
    return content;
};

const enterEditing = async () => {
    await mount();
    content.querySelector('#srcdxHcsUpdate').click();
};

const fillValidForm = () => {
    content.querySelector('#UPAddressHcsFacLine1').value = 'New Facility';
    content.querySelector('#UPAddressHcsFacLine2').value = '1 Care Way';
    content.querySelector('#srcdxHcsChangeYr').value = '2026';
};

beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="c"><div id="${HCS_SECTION_ID}"></div></div></body>`);
    win = dom.window;
    content = win.document.getElementById('c');
    resetHcsSection();
    vi.clearAllMocks();
    getMostRecentHCSUpdate.mockResolvedValue(null);
});

describe('initial view (no prior update)', () => {
    it('renders the IHCS affiliation sentence with a bold site name and an Edit button, expanded', async () => {
        await mount();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsJoinedWith"]')).not.toBeNull();
        expect(content.textContent).toContain('Sanford Health');
        expect(content.querySelector('.srcdx-hcs-facility-name').textContent).toBe('Sanford Health');
        expect(content.querySelector('.srcdx-hcs-facility-name').tagName).toBe('STRONG');
        const editButton = content.querySelector('#srcdxHcsUpdate');
        expect(editButton.textContent).toBe('Edit');
        expect(editButton.parentElement.classList.contains('d-flex')).toBe(true);
        expect(editButton.parentElement.classList.contains('justify-content-end')).toBe(true);
        expect(content.querySelector('[data-srcdxhcs-card]').classList.contains('srcdx-collapsed')).toBe(false);
        // No address form or facility display in the resting view.
        expect(content.querySelector('#UPAddressHcsFacLine1')).toBeNull();
    });

    it('renders a load error body when the latest-update fetch fails', async () => {
        getMostRecentHCSUpdate.mockRejectedValue(new Error('network down'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await mount();
        expect(content.querySelector('[data-i18n="shareHealthInfo.resumeLoadError"]')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsUpdate')).toBeNull();
    });
});

describe('editing state', () => {
    it('shows the blank facility form without the resting current-facility statement', async () => {
        await enterEditing();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toBeNull();
        expect(content.textContent).not.toContain('Sanford Health');
        expect(content.querySelector('#UPAddressHcsFacLine1')).not.toBeNull();
        expect(content.querySelector('#UPAddressHcsFacInternational')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsChangeMo')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsChangeYr')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsAddlInfo')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsSubmit')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsClear')).not.toBeNull();
        expect(content.querySelector('label[for="UPAddressHcsFacLine1"] .required')).not.toBeNull();
        expect(content.querySelector('label[for="UPAddressHcsFacLine2"] .required')).toBeNull();
        expect(content.querySelector('label[for="srcdxHcsChangeYr"] .required')).not.toBeNull();
        expect(content.querySelector('#UPAddressHcsFacLine1').required).toBe(true);
        expect(content.querySelector('#UPAddressHcsFacLine1').getAttribute('aria-required')).toBe('true');
        expect(content.querySelector('#UPAddressHcsFacRegion').maxLength).toBe(48);
    });

    it('blocks submit when the required facility name is blank or whitespace', async () => {
        await enterEditing();
        content.querySelector('#srcdxHcsChangeYr').value = '2026';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(shared.errorMessage).toHaveBeenCalledWith(
            'UPAddressHcsFacLine1',
            expect.stringContaining('shareHealthInfo.hcsFacNameRequired'),
            false,
        );
        expect(content.querySelector('#UPAddressHcsFacLine1').getAttribute('aria-invalid')).toBe('true');
        expect(submitSelfReportHCSUpdate).not.toHaveBeenCalled();

        content.querySelector('#UPAddressHcsFacLine1').value = '   ';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(submitSelfReportHCSUpdate).not.toHaveBeenCalled();
    });

    it('submits with the required facility name and change year while omitting optional address fields', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 200 });
        await enterEditing();
        content.querySelector('#UPAddressHcsFacLine1').value = 'New Facility';
        content.querySelector('#srcdxHcsChangeYr').value = '2026';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(submitSelfReportHCSUpdate).toHaveBeenCalledTimes(1);
        const snapshot = submitSelfReportHCSUpdate.mock.calls[0][0];
        expect(snapshot.D_353158944).toBe('2026');
        expect(snapshot.D_624974556).toBe('New Facility');
        expect(snapshot.D_655907949).toBeUndefined();
        expect(snapshot.D_892107008).toBe('104430631');
        expect(snapshot.D_771921322).toBe('104430631');
    });

    it('blocks submit on a change year too far in the future', async () => {
        await enterEditing();
        fillValidForm();
        content.querySelector('#srcdxHcsChangeYr').value = String(new Date().getFullYear() + 2);
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(submitSelfReportHCSUpdate).not.toHaveBeenCalled();
    });

    it('blocks submit on a malformed domestic zip', async () => {
        await enterEditing();
        fillValidForm();
        content.querySelector('#UPAddressHcsFacZip').value = '123';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(submitSelfReportHCSUpdate).not.toHaveBeenCalled();
    });

    it('Clear re-renders a blank form', async () => {
        await enterEditing();
        fillValidForm();
        content.querySelector('#srcdxHcsClear').click();
        expect(content.querySelector('#UPAddressHcsFacLine1').value).toBe('');
        expect(content.querySelector('#srcdxHcsChangeYr').value).toBe('');
    });

    it('submits the flat payload and shows the thank-you callout on success', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 200 });
        await enterEditing();
        fillValidForm();
        content.querySelector('#srcdxHcsChangeMo').value = '10';
        content.querySelector('#srcdxHcsAddlInfo').value = 'Moved.';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();

        expect(submitSelfReportHCSUpdate).toHaveBeenCalledTimes(1);
        const snapshot = submitSelfReportHCSUpdate.mock.calls[0][0];
        expect(snapshot.D_624974556).toBe('New Facility');
        expect(snapshot.D_655907949).toBe('1 Care Way');
        expect(snapshot.D_353158944).toBe('2026');
        expect(snapshot.D_994200497).toBe('615680906'); // November response cid
        expect(snapshot.D_519981637).toBe('Moved.');
        expect(snapshot.D_223569179).toBeUndefined();   // server-owned timestamp never client-emitted

        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsThankYou"]')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsSubmit')).toBeNull();
    });

    it('re-enables submit and shows an error box on a failed submit', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 0 });
        await enterEditing();
        fillValidForm();
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(content.querySelector('#srcdxHcsError [data-i18n="shareHealthInfo.submitError"]')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsSubmit').disabled).toBe(false);
    });

    it('clears a stale submit error on the next submit attempt (even a validation failure)', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 0 });
        await enterEditing();
        fillValidForm();
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(content.querySelector('#srcdxHcsError').innerHTML).not.toBe('');
        content.querySelector('#srcdxHcsChangeYr').value = ''; // fails validation
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(content.querySelector('#srcdxHcsError').innerHTML).toBe('');
    });

    it('a re-mount discards an in-progress edit and returns to the resting view', async () => {
        await enterEditing();
        expect(content.querySelector('#srcdxHcsSubmit')).not.toBeNull();
        await mount();
        expect(content.querySelector('#srcdxHcsSubmit')).toBeNull();
        expect(content.querySelector('#srcdxHcsUpdate')).not.toBeNull();
    });
});

describe('Google-validated flag and international path', () => {
    it('submits Google-validated Yes when the hidden flag is set and untouched', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 200 });
        await enterEditing();
        fillValidForm();
        content.querySelector('#UPAddressHcsFacGoogleValidated').value = 'true'; // as the place_changed handler does
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(submitSelfReportHCSUpdate.mock.calls[0][0].D_771921322).toBe('353358909');
    });

    it('any manual edit after a Google pick resets the flag to No', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 200 });
        await enterEditing();
        fillValidForm();
        content.querySelector('#UPAddressHcsFacGoogleValidated').value = 'true';
        const city = content.querySelector('#UPAddressHcsFacCity');
        city.value = 'Bethesda';
        city.dispatchEvent(new win.Event('input')); // component's invalidation listener
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();
        expect(submitSelfReportHCSUpdate.mock.calls[0][0].D_771921322).toBe('104430631');
    });

    it('the international toggle produces the intl payload: merged region/postal, country cid, Google forced No', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 200 });
        await enterEditing();
        const intl = content.querySelector('#UPAddressHcsFacInternational');
        intl.checked = true;
        intl.dispatchEvent(new win.Event('change'));
        content.querySelector('#UPAddressHcsFacLine1').value = 'Royal Marsden';
        content.querySelector('#UPAddressHcsFacLine2').value = '203 Fulham Rd';
        content.querySelector('#UPAddressHcsFacLine4').value = 'Building B';
        content.querySelector('#UPAddressHcsFacCity').value = 'London';
        content.querySelector('#UPAddressHcsFacRegion').value = 'Greater London';
        content.querySelector('#UPAddressHcsFacPostal').value = 'SW3 6JJ';
        content.querySelector('#UPAddressHcsFacCountry').value = '2'; // United Kingdom (mocked allCountries)
        content.querySelector('#srcdxHcsChangeYr').value = '2026';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();

        const snapshot = submitSelfReportHCSUpdate.mock.calls[0][0];
        expect(snapshot.D_892107008).toBe('353358909'); // intl Yes
        expect(snapshot.D_771921322).toBe('104430631'); // Google-validated forced No
        expect(snapshot.D_134439170).toBe('Building B');
        expect(snapshot.D_783801971).toBe('Greater London'); // merged state/region
        expect(snapshot.D_734087990).toBe('SW3 6JJ');        // merged zip/postal
        expect(snapshot.D_111301575).toBe('156628245');      // United Kingdom response cid
    });

    it('preserves international Yes when only the required facility name is entered', async () => {
        submitSelfReportHCSUpdate.mockResolvedValue({ code: 200 });
        await enterEditing();
        const intl = content.querySelector('#UPAddressHcsFacInternational');
        intl.checked = true;
        intl.dispatchEvent(new win.Event('change'));
        content.querySelector('#UPAddressHcsFacLine1').value = 'Royal Marsden';
        content.querySelector('#srcdxHcsChangeYr').value = '2026';
        content.querySelector('#srcdxHcsSubmit').click();
        await flush();

        const snapshot = submitSelfReportHCSUpdate.mock.calls[0][0];
        expect(snapshot.D_892107008).toBe('353358909');
        expect(snapshot.D_771921322).toBe('104430631');
        expect(snapshot.D_624974556).toBe('Royal Marsden');
        expect(snapshot.D_655907949).toBeUndefined();
    });

    it('collapse toggle flips the card and survives a state re-render', async () => {
        await mount();
        const header = content.querySelector('[data-srcdxhcs-toggle]');
        header.click();
        expect(content.querySelector('[data-srcdxhcs-card]').classList.contains('srcdx-collapsed')).toBe(true);
        header.click();
        expect(content.querySelector('[data-srcdxhcs-card]').classList.contains('srcdx-collapsed')).toBe(false);
        content.querySelector('#srcdxHcsUpdate').click(); // re-render into editing
        expect(content.querySelector('[data-srcdxhcs-card]').classList.contains('srcdx-collapsed')).toBe(false);
    });
});

describe('mount staleness guard', () => {
    it('abandons a late fetch when the section shell was replaced mid-flight (flow entry)', async () => {
        let resolveFetch;
        getMostRecentHCSUpdate.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
        const pending = mountHcsSection(content, { participant });
        // Simulate a flow screen render replacing the page (and its static HCS shell).
        content.innerHTML = `<div id="${HCS_SECTION_ID}"><div class="static-shell"></div></div>`;
        resolveFetch(null);
        await pending;
        // The late continuation must not replace the flow's static shell with the interactive section.
        expect(content.querySelector('.static-shell')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsUpdate')).toBeNull();
    });

    it('a reset during the fetch leaves state clean so the next mount refetches', async () => {
        let resolveFetch;
        getMostRecentHCSUpdate.mockReturnValueOnce(new Promise((resolve) => { resolveFetch = resolve; }));
        const pending = mountHcsSection(content, { participant });
        resetHcsSection(); // e.g. teardown on navigation away
        resolveFetch(latestRow());
        await pending;
        // Next mount must refetch rather than render the stale pre-reset row.
        getMostRecentHCSUpdate.mockResolvedValueOnce(null);
        await mount();
        expect(getMostRecentHCSUpdate).toHaveBeenCalledTimes(2);
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsJoinedWith"]')).not.toBeNull();
        expect(content.textContent).not.toContain('Sibley Memorial Hospital');
    });
});

describe('previously-updated view', () => {
    it('shows the latest facility as current, a bold last-updated label, regular date, and additional info', async () => {
        getMostRecentHCSUpdate.mockResolvedValue(latestRow());
        await mount();
        expect(content.textContent).toContain('Sibley Memorial Hospital');
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).not.toBeNull();
        expect(content.querySelector('.srcdx-hcs-facility-name').textContent).toBe('Sibley Memorial Hospital');
        expect(content.querySelector('.srcdx-hcs-facility-name').tagName).toBe('STRONG');
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsLastUpdated"]')).not.toBeNull();
        expect(content.querySelector('[data-i18n="shareHealthInfo.month_november"]')).not.toBeNull();
        expect(content.textContent).toContain('2025');
        const updatedBlock = content.querySelector('[data-srcdxhcs-last-updated]');
        expect(updatedBlock.querySelector('strong').textContent.trim()).toBe('Primary care facility last updated:');
        expect(updatedBlock.querySelector('strong').classList.contains('d-block')).toBe(true);
        expect(updatedBlock.querySelector('[data-srcdxhcs-last-updated-value]').textContent.trim()).toBe('November 2025');
        expect(content.textContent).toContain('Additional information that was provided goes here.');
        // The current-facility sentence is shown without repeating the section header.
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsCurrentFacility"]')).toBeNull();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsJoinedWith"]')).toBeNull();
        // Empty Line 3 renders italic "None" (per comp).
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsNone"]')).not.toBeNull();
        expect(content.querySelector('#srcdxHcsUpdate')).not.toBeNull();
    });

    it('editing from the previously-updated view opens a blank form without the resting facility statement', async () => {
        getMostRecentHCSUpdate.mockResolvedValue(latestRow({ line1: 'SIBLEY MEMORIAL HOSPITAL' }));
        await enterEditing();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toBeNull();
        expect(content.textContent).not.toContain('SIBLEY MEMORIAL HOSPITAL');
        expect(content.textContent).not.toContain('Sanford Health');
        expect(content.querySelector('#UPAddressHcsFacLine1').value).toBe('');
    });

    it('year-only last-updated renders without a month name', async () => {
        getMostRecentHCSUpdate.mockResolvedValue(latestRow({ changeMonthCode: null }));
        await mount();
        expect(content.querySelector('[data-i18n="shareHealthInfo.month_november"]')).toBeNull();
        expect(content.textContent).toContain('2025');
    });

    it('a year-only latest record omits the empty address block and does not assert a current facility on edit', async () => {
        getMostRecentHCSUpdate.mockResolvedValue(yearOnlyRow());
        await mount();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsFacAddressHeader"]')).toBeNull();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsNone"]')).toBeNull();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsLastUpdated"]')).not.toBeNull();
        expect(content.textContent).toContain('2025');
        expect(content.querySelector('#srcdxHcsUpdate')).not.toBeNull();

        content.querySelector('#srcdxHcsUpdate').click();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsCurrentFacility"]')).toBeNull();
        expect(content.querySelector('[data-i18n="shareHealthInfo.hcsIsThePlace"]')).toBeNull();
        expect(content.textContent).not.toContain('Sanford Health');
    });
});
