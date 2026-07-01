// Facility-address block for the Self-Report Cancer Diagnosis flow
// (treatment + screening facilities). Self-contained. Own markup + a small local domestic/
// international toggle + domestic-only Google Places autocomplete on the name line.
import { allStates, allCountries, translateHTML } from '../shared.js';

const stateOptions = () =>
    Object.keys(allStates)
        .map((s) => `<option class="option-dark-mode" value="${s}" data-i18n="shared.state${s.replace(/\s/g, '')}">${s}</option>`)
        .join('');

const countryOptions = () =>
    Object.keys(allCountries)
        // The country field only appears for international facilities, so "United States" is not a
        // valid option (per spec note: US is excluded from the international country list).
        .filter((c) => c !== 'United States')
        .map((c) => `<option class="option-dark-mode" value="${allCountries[c]}" data-i18n="shared.country${c.replace(/(\s|[-.])/g, '')}">${c}</option>`)
        .join('');

/**
 * Render a facility-address block. `idPrefix` must be unique per instance (e.g. "TxFac_chemo_1").
 * The block is a <form> with standard autocomplete tokens, which is the configuration Chrome's
 *  address fill is built around:
 *  - the form boundary fences the fill. The physician name fields (outside, autocomplete="off")
 *    and any sibling facility blocks (their own forms) are never co-filled;
 *  - bare tokens (address-line1 etc.) classify each field, so one autofill populates street/city/
 *    state/zip together (section-* tokens on form-less fields degraded Chrome to single-field fill).
 * The form never submits (no submit button + a preventDefault guard), so an Enter keypress can't reload the app.
 */
export const renderFacilityAddress = (idPrefix, { showName = true } = {}) => `
    <form class="srcdx-facility mb-3" data-facility="${idPrefix}" autocomplete="on" novalidate>
        ${showName ? `
        <div class="form-group mb-2">
            <label for="UPAddress${idPrefix}Line1" data-i18n="shareHealthInfo.facName">Line 1 (name of facility)</label>
            <input type="text" class="form-control" id="UPAddress${idPrefix}Line1" autocomplete="off" maxlength="70" data-i18n="shareHealthInfo.facNameInput" placeholder="Enter name of facility">
        </div>` : ''}
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="UPAddress${idPrefix}International">
            <label class="form-check-label" for="UPAddress${idPrefix}International" data-i18n="shareHealthInfo.facIntl">This facility is located outside the United States</label>
        </div>
        <div class="form-group mb-2">
            <label for="UPAddress${idPrefix}Line2" data-i18n="shareHealthInfo.facLine2">Line 2 (street, rural route)</label>
            <input type="text" class="form-control" id="UPAddress${idPrefix}Line2" autocomplete="address-line1" maxlength="70" data-i18n="shareHealthInfo.facLine2Input" placeholder="Enter street, rural route">
        </div>
        <div class="form-group mb-2">
            <label for="UPAddress${idPrefix}Line3" data-i18n="shareHealthInfo.facLine3">Line 3 (apartment, suite, unit, building)</label>
            <input type="text" class="form-control" id="UPAddress${idPrefix}Line3" autocomplete="address-line2" maxlength="70" data-i18n="shareHealthInfo.facLine3Input" placeholder="Enter apartment, suite, unit, building">
        </div>
        <!-- Line 4: international addresses only — shown/hidden + cleared by the International toggle. -->
        <div class="form-group mb-2 d-none" id="UPAddress${idPrefix}Line4Row">
            <label for="UPAddress${idPrefix}Line4" data-i18n="shareHealthInfo.facLine4">Line 4</label>
            <input type="text" class="form-control" id="UPAddress${idPrefix}Line4" autocomplete="address-line3" maxlength="70" data-i18n="shareHealthInfo.facLine4Input" placeholder="Enter address line 4">
        </div>
        <div class="form-group mb-2">
            <label for="UPAddress${idPrefix}City" data-i18n="shareHealthInfo.facCity">City</label>
            <input type="text" class="form-control" id="UPAddress${idPrefix}City" autocomplete="address-level2" maxlength="45" data-i18n="shareHealthInfo.facCityInput" placeholder="Enter City">
        </div>
        <div class="row">
            <div class="col-6 mb-2">
                <label id="UPAddress${idPrefix}StateLabel" for="UPAddress${idPrefix}State" data-i18n="shareHealthInfo.facState">State</label>
                <select class="form-control" id="UPAddress${idPrefix}State" autocomplete="address-level1">
                    <option class="option-dark-mode" value="" data-i18n="shareHealthInfo.selectOption">-- Select --</option>
                    ${stateOptions()}
                </select>
                <input type="text" class="form-control d-none" id="UPAddress${idPrefix}Region" autocomplete="address-level1" maxlength="45">
            </div>
            <div class="col-6 mb-2">
                <label id="UPAddress${idPrefix}ZipLabel" for="UPAddress${idPrefix}Zip" data-i18n="shareHealthInfo.facZip">Zip</label>
                <input type="text" inputmode="numeric" class="form-control" id="UPAddress${idPrefix}Zip" autocomplete="postal-code" maxlength="5" data-i18n="shareHealthInfo.facZipInput" placeholder="Enter Zip">
                <input type="text" class="form-control d-none" id="UPAddress${idPrefix}Postal" autocomplete="postal-code" maxlength="45" data-i18n="shareHealthInfo.facPostalInput" placeholder="Enter postal code">
            </div>
        </div>
        <div class="form-group mb-2 d-none" id="UPAddress${idPrefix}CountryRow">
            <label for="UPAddress${idPrefix}Country" data-i18n="shareHealthInfo.facCountry">Country</label>
            <select class="form-control" id="UPAddress${idPrefix}Country" autocomplete="country">
                <option class="option-dark-mode" value="" data-i18n="shareHealthInfo.selectOption">-- Select --</option>
                ${countryOptions()}
            </select>
        </div>
    </form>`;

const q = (content, idPrefix, suffix) => content.querySelector(`#UPAddress${idPrefix}${suffix}`);

const domesticAutocompleteOptions = () => ({
    types: ['establishment'],
    componentRestrictions: { country: 'us' },
});

// Live Autocomplete instance per idPrefix, cleared on rerender or teardown.
const autocompleteRegistry = new Map();
const focusRegistry = new Map();

const clearGoogleAutocomplete = (idPrefix) => {
    const active = autocompleteRegistry.get(idPrefix);
    if (!active) return;
    if (typeof google !== 'undefined' && google.maps?.event?.clearInstanceListeners) {
        google.maps.event.clearInstanceListeners(active.instance);
        google.maps.event.clearInstanceListeners(active.input);
    }
    autocompleteRegistry.delete(idPrefix);
};

const disableNameAutocomplete = (content, idPrefix) => {
    const priorFocus = focusRegistry.get(idPrefix);
    if (priorFocus) {
        priorFocus.input.removeEventListener('focus', priorFocus.handler);
        focusRegistry.delete(idPrefix);
    }
    const active = autocompleteRegistry.get(idPrefix);
    clearGoogleAutocomplete(idPrefix);
    if (active?.input?.isConnected) {
        const clone = active.input.cloneNode(true);
        clone.value = active.input.value;
        active.input.replaceWith(clone);
    }
};

/** Apply domestic/international display: swap State/Zip ↔ Region/Postal, reveal Country + Line 4. */
const applyInternational = (content, idPrefix, intl) => {
    q(content, idPrefix, 'State').classList.toggle('d-none', intl);
    q(content, idPrefix, 'Region').classList.toggle('d-none', !intl);
    q(content, idPrefix, 'Zip').classList.toggle('d-none', intl);
    q(content, idPrefix, 'Postal').classList.toggle('d-none', !intl);
    q(content, idPrefix, 'CountryRow').classList.toggle('d-none', !intl);
    // Line 4 is international-only. Reveal it when intl, hide + clear it when domestic.
    const line4Row = q(content, idPrefix, 'Line4Row');
    if (line4Row) line4Row.classList.toggle('d-none', !intl);
    if (!intl) { const l4 = q(content, idPrefix, 'Line4'); if (l4) l4.value = ''; }

    const stateLabel = q(content, idPrefix, 'StateLabel');
    if (stateLabel) {
        stateLabel.dataset.i18n = intl ? 'shareHealthInfo.facRegion' : 'shareHealthInfo.facState';
        stateLabel.setAttribute('for', `UPAddress${idPrefix}${intl ? 'Region' : 'State'}`);
        translateHTML(stateLabel);
    }
    const zipLabel = q(content, idPrefix, 'ZipLabel');
    if (zipLabel) {
        zipLabel.dataset.i18n = intl ? 'shareHealthInfo.facPostal' : 'shareHealthInfo.facZip';
        zipLabel.setAttribute('for', `UPAddress${idPrefix}${intl ? 'Postal' : 'Zip'}`);
        translateHTML(zipLabel);
    }
    if (intl) disableNameAutocomplete(content, idPrefix);
    else attachNameAutocomplete(content, idPrefix);
};

export const teardownFacilityAddressEvents = () => {
    focusRegistry.forEach(({ input, handler }) => input.removeEventListener('focus', handler));
    focusRegistry.clear();
    [...autocompleteRegistry.keys()].forEach(clearGoogleAutocomplete);
};

/** Domestic establishment autocomplete on the name line: fills Line1 = name, Line2 = street, City/State/Zip. */
const attachNameAutocomplete = (content, idPrefix) => {
    const line1 = q(content, idPrefix, 'Line1');
    if (!line1) return;
    if (q(content, idPrefix, 'International')?.checked) return;
    const active = autocompleteRegistry.get(idPrefix);
    if (active?.input === line1) return;
    const priorFocus = focusRegistry.get(idPrefix);
    if (priorFocus?.input === line1) return;
    if (priorFocus) priorFocus.input.removeEventListener('focus', priorFocus.handler);
    const init = () => {
        if (q(content, idPrefix, 'International')?.checked) return;
        if (typeof google === 'undefined' || !google.maps?.places?.Autocomplete) return; // graceful degradation
        const prev = autocompleteRegistry.get(idPrefix);
        if (prev && google.maps.event?.clearInstanceListeners) {
            google.maps.event.clearInstanceListeners(prev.instance);
            google.maps.event.clearInstanceListeners(prev.input);
        }
        const ac = new google.maps.places.Autocomplete(line1, domesticAutocompleteOptions());
        autocompleteRegistry.set(idPrefix, { instance: ac, input: line1 });
        ac.setFields(['name', 'address_components']);
        ac.addListener('place_changed', () => {
            if (q(content, idPrefix, 'International')?.checked) return;
            const place = ac.getPlace();
            if (place?.name) line1.value = place.name;
            const comps = place?.address_components;
            if (!Array.isArray(comps)) return;
            let num = '', route = '', city = '', state = '', zip = '';
            comps.forEach((c) => {
                if (c.types.includes('street_number')) num = c.long_name;
                if (c.types.includes('route')) route = c.long_name;
                if (c.types.includes('locality')) city = c.long_name;
                // long_name ("Maryland"), NOT short_name ("MD"): the State <select>'s option values
                // are the full names from allStates keys, so a short code silently fails to select.
                // (Same choice as the app's address autocomplete in event.js.)
                if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                if (c.types.includes('postal_code')) zip = c.long_name;
            });
            const set = (suffix, val) => { const el = q(content, idPrefix, suffix); if (el && val) el.value = val; };
            set('Line2', [num, route].filter(Boolean).join(' '));
            set('City', city);
            set('State', state);
            set('Zip', zip);
        });
        line1.removeEventListener('focus', init);
        focusRegistry.delete(idPrefix);
    };
    focusRegistry.set(idPrefix, { input: line1, handler: init });
    line1.addEventListener('focus', init);
};

/** Wire the international toggle + name autocomplete for one rendered instance. */
export const attachFacilityAddressEvents = (content, idPrefix) => {
    // The block is a <form> purely for autofill scoping — it must never actually submit (an Enter
    // keypress submitting would reload the app mid-process).
    const formEl = content.querySelector(`form[data-facility="${idPrefix}"]`);
    if (formEl && !formEl.dataset.srcdxSubmitGuard) {
        formEl.addEventListener('submit', (e) => e.preventDefault());
        formEl.dataset.srcdxSubmitGuard = 'true';
    }
    const intlCb = q(content, idPrefix, 'International');
    if (intlCb && !intlCb.dataset.srcdxIntlListener) {
        intlCb.addEventListener('change', (e) => applyInternational(content, idPrefix, e.target.checked));
        intlCb.dataset.srcdxIntlListener = 'true';
    }
    attachNameAutocomplete(content, idPrefix);
};

/** Read the facility back into a plain object (region/postal/country only when international). */
export const harvestFacility = (content, idPrefix) => {
    const v = (suffix) => (q(content, idPrefix, suffix)?.value || '').trim();
    const intl = q(content, idPrefix, 'International')?.checked || false;
    return {
        line1: v('Line1'), line2: v('Line2'), line3: v('Line3'), city: v('City'),
        isInternational: intl,
        line4: intl ? v('Line4') : '', // Line 4 is international-only
        state: intl ? '' : v('State'),
        zip: intl ? '' : v('Zip'),
        region: intl ? v('Region') : '',
        postal: intl ? v('Postal') : '',
        country: intl ? v('Country') : '',
    };
};

/** Repopulate a rendered instance from a facility object (and apply its intl display). */
export const fillFacility = (content, idPrefix, f = {}) => {
    const set = (suffix, val) => { const el = q(content, idPrefix, suffix); if (el && val != null) el.value = val; };
    set('Line1', f.line1); set('Line2', f.line2); set('Line3', f.line3); set('Line4', f.line4); set('City', f.city);
    set('State', f.state); set('Zip', f.zip); set('Region', f.region); set('Postal', f.postal); set('Country', f.country);
    const cb = q(content, idPrefix, 'International');
    if (cb) {
        cb.checked = !!f.isInternational;
        applyInternational(content, idPrefix, !!f.isInternational);
    }
};
