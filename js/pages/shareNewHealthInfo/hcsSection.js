// Health Care System Update section (issue #1658) (in the Share New Health Information page).
//
// Section states:
//   'view'      — no prior update: IHCS-affiliation sentence + Update button (comps: "Expanded Initial").
//                 prior update exists: read-only latest facility + last-updated date + additional info,
//                 with a single Update button (no piecemeal edits, per Ops).
//   'editing'   — the full form (facility address block, change date, additional info). Submit-only:
//                 unlike the cancer-dx flow there is no save/resume for this single-screen form.
//   'submitted' — thank-you callout for the rest of the visit. The next mount refetches and shows 'view'.

import { escapeHTML, translateHTML, getSelectedLanguage, sites } from '../../shared.js';
import fieldMapping from '../../fieldToConceptIdMapping.js';
import { getCountryNameByConceptId } from '../../countryMapping.js';
import { MONTHS } from './constants.js';
import { monthSelect, fieldError, clearFieldErrors } from './ui.js';
import { renderFacilityAddress, attachFacilityAddressEvents, harvestFacility, fillFacility } from '../../components/facilityAddress.js';
import { isNonEmpty, isValidYearWithAllowance } from './validation.js';
import { buildHcsSnapshot, makeHcsUpdate } from './hcsPayload.js';
import { submitSelfReportHCSUpdate, getMostRecentHCSUpdate } from './dataAccess.js';

export const HCS_SECTION_ID = 'srcdxHcsSection';
const FACILITY_ID_PREFIX = 'HcsFac';
// Prevent a change year more than 1 year in the future.
const CHANGE_YEAR_FUTURE_ALLOWANCE = 1;

let view = 'view';
let latest;          // undefined = not fetched. null = never updated. object = parsed latest row.
let loadFailed = false;
let collapsed = false; // comps 18-20 show the section expanded by default
// Staleness guard for the async mount: a reset or newer mount abandons
// any in-flight fetch continuation instead of mutating state or rendering into a replaced shell.
let epoch = 0;

export const resetHcsSection = () => {
    epoch += 1;
    view = 'view';
    latest = undefined;
    loadFailed = false;
    collapsed = false;
};

const ihcsName = (participant) => {
    const siteName = sites()[participant?.[fieldMapping.healthcareProvider]];
    return typeof siteName === 'string' && siteName ? siteName : '';
};

const introHtml = () => `
    <p data-i18n="shareHealthInfo.hcsIntro">Connect is a long-term study. We recognize the health system where you receive care may change over time.</p>
    <hr class="srcdx-hcs-divider">`;

const currentFacilityHeaderHtml = () => `
    <p class="mb-1"><strong data-i18n="shareHealthInfo.hcsCurrentFacility">Current primary care facility:</strong></p>`;

// Site names interpolate mid-sentence, so the copy is split around them (welcomeText precedent).
const joinedWithHtml = (siteName) => `
    <p><span data-i18n="shareHealthInfo.hcsJoinedWith">You joined Connect with</span> ${escapeHTML(siteName)}
    <span data-i18n="shareHealthInfo.hcsJoinedWithEnd">as your primary care facility. If this has changed, click the Update button.</span></p>`;

const isThePlaceHtml = (siteName) => `
    <p>${escapeHTML(siteName)} <span data-i18n="shareHealthInfo.hcsIsThePlace">is the place where you get your primary care.</span></p>`;

const updateButtonHtml = () => `
    <button type="button" class="btn btn-light" id="srcdxHcsUpdate" data-i18n="shareHealthInfo.hcsUpdateButton">Update</button>`;

const addrValueHtml = (value) => (isNonEmpty(value)
    ? `<div>${escapeHTML(value)}</div>`
    : `<div class="fst-italic" data-i18n="shareHealthInfo.hcsNone">None</div>`);

const addrFieldHtml = (labelKey, labelFallback, value) => `
    <div class="mb-2">
        <span class="srcdx-hcs-field-label" data-i18n="${labelKey}">${labelFallback}</span>
        ${addrValueHtml(value)}
    </div>`;

const addressDisplayHtml = (row) => {
    const countryName = row.isInternational ? (getCountryNameByConceptId(Number(row.countryCid)) || '') : '';
    return `
    ${addrFieldHtml('shareHealthInfo.hcsAddrLine1', 'Primary Care Facility Address Line 1', row.line1)}
    <div class="row">
        <div class="col-sm-6">${addrFieldHtml('shareHealthInfo.hcsAddrLine2', 'Primary Care Facility Address Line 2', row.line2)}</div>
        <div class="col-sm-6">${addrFieldHtml('shareHealthInfo.hcsAddrLine3', 'Primary Care Facility Address Line 3', row.line3)}</div>
    </div>
    ${row.isInternational ? addrFieldHtml('shareHealthInfo.hcsAddrLine4', 'Primary Care Facility Address Line 4', row.line4) : ''}
    <div class="row">
        <div class="col-sm-4">${addrFieldHtml('shareHealthInfo.hcsAddrCity', 'City', row.city)}</div>
        <div class="col-sm-4">${row.isInternational
            ? addrFieldHtml('shareHealthInfo.facRegion', 'Region', row.stateOrRegion)
            : addrFieldHtml('shareHealthInfo.hcsAddrState', 'State', row.stateOrRegion)}</div>
        <div class="col-sm-4">${row.isInternational
            ? addrFieldHtml('shareHealthInfo.facPostal', 'Postal code', row.zipOrPostal)
            : addrFieldHtml('shareHealthInfo.hcsAddrZip', 'Zip Code', row.zipOrPostal)}</div>
    </div>
    ${row.isInternational ? addrFieldHtml('shareHealthInfo.facCountry', 'Country', countryName) : ''}`;
};

const lastUpdatedHtml = (row) => {
    const month = MONTHS.find((m) => m.value === row.changeMonthCode);
    const monthHtml = month ? `<span data-i18n="${month.i18nKey}">${month.label}</span> ` : '';
    return `${monthHtml}${escapeHTML(row.changeYear)}`;
};

// 'view', no prior update (per Ops note on comp 18: affiliation sentence + Update button only).
const initialBodyHtml = (siteName) => `
    ${introHtml()}
    ${currentFacilityHeaderHtml()}
    ${joinedWithHtml(siteName)}
    <div class="mt-3">${updateButtonHtml()}</div>`;

// 'view', prior update exists (per Ops note on comp 18: no IHCS header; one Update button for everything).
const latestBodyHtml = (row) => `
    ${introHtml()}
    <div class="d-flex justify-content-between align-items-start mb-2">
        <strong data-i18n="shareHealthInfo.hcsFacAddressHeader">Primary care facility address:</strong>
        ${updateButtonHtml()}
    </div>
    ${addressDisplayHtml(row)}
    <p class="mt-3 mb-2"><strong><span data-i18n="shareHealthInfo.hcsLastUpdated">Primary care facility last updated:</span> ${lastUpdatedHtml(row)}</strong></p>
    ${isNonEmpty(row.additionalInfo) ? `
    <p class="mb-0"><strong data-i18n="shareHealthInfo.hcsAdditionalInfo">Additional information:</strong><br>${escapeHTML(row.additionalInfo)}</p>` : ''}`;

// The [IHCS] slot in "… is the place where you get your primary care" (comps 18/19) shows the
// most recently reported facility name when one exists and falls back to the signup IHCS site name for first-time updaters.
const editingBodyHtml = (currentFacilityName) => `
    ${introHtml()}
    ${currentFacilityHeaderHtml()}${isThePlaceHtml(currentFacilityName)}
    <p class="mb-2"><strong data-i18n="shareHealthInfo.hcsFacAddressHeader">Primary care facility address:</strong></p>
    ${renderFacilityAddress(FACILITY_ID_PREFIX, {
        nameLabelKey: 'shareHealthInfo.hcsFacName',
        nameLabelFallback: 'Line 1 (name of primary care facility) <span class="required">*</span>',
        namePlaceholderKey: 'shareHealthInfo.hcsFacNameInput',
        namePlaceholderFallback: 'Enter primary care facility',
        line2LabelKey: 'shareHealthInfo.hcsFacLine2',
        line2LabelFallback: 'Line 2 (street, rural route) <span class="required">*</span>',
    })}
    <p class="mt-3 mb-2"><strong data-i18n="shareHealthInfo.hcsChangeDateLabel">Date you changed your primary care facility:</strong></p>
    <div class="row">
        <div class="col-6 col-sm-4 mb-2">
            <label for="srcdxHcsChangeMo" data-i18n="shareHealthInfo.monthLabel">Month</label>
            ${monthSelect('srcdxHcsChangeMo')}
        </div>
        <div class="col-6 col-sm-4 mb-2">
            <label for="srcdxHcsChangeYr" data-i18n="shareHealthInfo.yearLabelRequired">Year <span class="required">*</span></label>
            <input type="text" inputmode="numeric" maxlength="4" class="form-control" id="srcdxHcsChangeYr" data-i18n="shareHealthInfo.hcsYearInput" placeholder="Enter year of change">
        </div>
    </div>
    <p class="mt-2 mb-2"><strong data-i18n="shareHealthInfo.hcsAdditionalInfo">Additional information:</strong></p>
    <div class="form-group mb-2">
        <label for="srcdxHcsAddlInfo" data-i18n="shareHealthInfo.hcsAdditionalInfoPrompt">Please provide any additional information below.</label>
        <textarea class="form-control" id="srcdxHcsAddlInfo" rows="4" maxlength="800"></textarea>
    </div>
    <div id="srcdxHcsError"></div>
    <div class="mt-3">
        <button type="button" class="btn btn-primary" id="srcdxHcsSubmit" data-i18n="shareHealthInfo.hcsSubmitButton">Submit Health Care Update</button>
        <button type="button" class="btn btn-light ms-2" id="srcdxHcsClear" data-i18n="shareHealthInfo.hcsClearButton">Clear</button>
    </div>`;

// 'submitted' (comp 20).
const submittedBodyHtml = () => `
    <div class="srcdx-callout">
        <p class="mb-0" data-i18n="shareHealthInfo.hcsThankYou">Thank you for keeping us up to date. You can come back and update this information at any time.</p>
    </div>`;

const loadErrorBodyHtml = () => `
    ${introHtml()}
    <div class="alert alert-danger" role="alert">
        <p class="mb-0" data-i18n="shareHealthInfo.resumeLoadError">A network error has occurred. Try again later.</p>
    </div>`;

const sectionHtml = (bodyHtml) => `
    <div class="card srcdx-card srcdx-collapsible ${collapsed ? 'srcdx-collapsed' : ''} mb-3" data-srcdxhcs-card>
        <div class="srcdx-card-header" role="button" tabindex="0" data-srcdxhcs-toggle>
            <span class="srcdx-card-title" data-i18n="shareHealthInfo.hcsHeader">Health Care System Update</span>
            <span class="srcdx-card-chevron" aria-hidden="true"></span>
        </div>
        <div class="srcdx-card-body">${bodyHtml}</div>
    </div>`;

const bodyHtmlForState = (participant) => {
    if (view === 'submitted') return submittedBodyHtml();
    if (view === 'editing') {
        const reportedName = latest && isNonEmpty(latest.line1) ? latest.line1 : '';
        return editingBodyHtml(reportedName || ihcsName(participant));
    }
    if (loadFailed) return loadErrorBodyHtml();
    return latest ? latestBodyHtml(latest) : initialBodyHtml(ihcsName(participant));
};

const harvestDraft = (content) => {
    const draft = makeHcsUpdate();
    draft.facility = harvestFacility(content, FACILITY_ID_PREFIX);
    draft.changeMonth = content.querySelector('#srcdxHcsChangeMo')?.value ?? '';
    draft.changeYear = (content.querySelector('#srcdxHcsChangeYr')?.value || '').trim();
    draft.additionalInfo = (content.querySelector('#srcdxHcsAddlInfo')?.value || '').trim();
    return draft;
};

// First failure wins. FieldError focuses and announces.
const validateDraft = (content, draft) => {
    if (!isNonEmpty(draft.facility.line1)) {
        fieldError(content, `UPAddress${FACILITY_ID_PREFIX}Line1`, 'shareHealthInfo.hcsFacNameRequired', 'Please enter the name of your primary care facility.');
        return false;
    }
    if (!isNonEmpty(draft.facility.line2)) {
        fieldError(content, `UPAddress${FACILITY_ID_PREFIX}Line2`, 'shareHealthInfo.hcsFacLine2Required', 'Please enter the street address of your primary care facility.');
        return false;
    }
    if (!draft.facility.isInternational && isNonEmpty(draft.facility.zip) && !/^\d{5}$/.test(draft.facility.zip)) {
        fieldError(content, `UPAddress${FACILITY_ID_PREFIX}Zip`, 'shareHealthInfo.hcsZipError', 'Please enter a valid 5-digit zip code.');
        return false;
    }
    if (!isValidYearWithAllowance(draft.changeYear, { futureAllowance: CHANGE_YEAR_FUTURE_ALLOWANCE })) {
        fieldError(content, 'srcdxHcsChangeYr', 'shareHealthInfo.hcsYearError', 'Please enter a valid year (YYYY) no more than 1 year in the future.');
        return false;
    }
    return true;
};

const showSubmitError = (content) => {
    const errorBox = content.querySelector('#srcdxHcsError');
    if (!errorBox) return;
    errorBox.innerHTML = translateHTML(`
        <div class="alert alert-danger" role="alert">
            <p class="mb-0" data-i18n="shareHealthInfo.submitError">Something went wrong submitting your information. Please try again.</p>
        </div>`);
};

const wireSection = (content, participant) => {
    const cardEl = content.querySelector('[data-srcdxhcs-card]');
    const header = content.querySelector('[data-srcdxhcs-toggle]');
    if (header && cardEl) {
        const toggle = () => {
            collapsed = !collapsed;
            cardEl.classList.toggle('srcdx-collapsed', collapsed);
        };
        header.addEventListener('click', toggle);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    }

    content.querySelector('#srcdxHcsUpdate')?.addEventListener('click', () => {
        view = 'editing';
        renderSection(content, participant);
    });

    if (view === 'editing') {
        attachFacilityAddressEvents(content, FACILITY_ID_PREFIX);

        content.querySelector('#srcdxHcsClear')?.addEventListener('click', () => {
            clearFieldErrors(content);
            renderSection(content, participant); // fresh blank form
        });

        content.querySelector('#srcdxHcsSubmit')?.addEventListener('click', async (e) => {
            const submitBtn = e.currentTarget;
            if (submitBtn.disabled) return;
            clearFieldErrors(content);
            const errorBox = content.querySelector('#srcdxHcsError');
            if (errorBox) errorBox.innerHTML = '';
            const draft = harvestDraft(content);
            if (!validateDraft(content, draft)) return;
            submitBtn.disabled = true;
            const res = await submitSelfReportHCSUpdate(buildHcsSnapshot(draft, { lang: getSelectedLanguage() }));
            if (!res || res.code !== 200) {
                submitBtn.disabled = false;
                showSubmitError(content);
                return;
            }
            view = 'submitted';
            latest = undefined; // the next mount refetches the new latest row
            renderSection(content, participant);
        });
    }
};

const renderSection = (content, participant) => {
    const container = content.querySelector(`#${HCS_SECTION_ID}`);
    if (!container) return;
    container.innerHTML = translateHTML(sectionHtml(bodyHtmlForState(participant)));
    wireSection(content, participant);
    if (view === 'editing') fillFacility(content, FACILITY_ID_PREFIX, makeHcsUpdate().facility);
};

/**
 * Mount the HCS section.
 * Fetches the latest submitted update once per page entry. resetHcsSection clears the cache.
 * Never throws. A failed fetch renders the load-error body.
 */
export const mountHcsSection = async (content, { participant } = {}) => {
    const container = content?.querySelector?.(`#${HCS_SECTION_ID}`);
    if (!container) return;
    // Mounts happen only on resting screens. The thank-you body and any in-progress edit belong to the interaction that rendered them.
    // So re-mounts always start from the resting view.
    view = 'view';
    const startEpoch = epoch;
    if (latest === undefined) {
        let fetched, failed = false;
        try {
            fetched = await getMostRecentHCSUpdate();
        } catch (err) {
            console.error('[SelfReportHCSUpdate] latest-update fetch failed; rendering load error.', err);
            failed = true;
        }
        if (epoch !== startEpoch) return; // reset while fetching — leave state for the next mount
        latest = failed ? undefined : fetched;
        loadFailed = failed;
    }
    // A newer render replaced the shell (e.g. the user entered the workflow mid-fetch).
    if (epoch !== startEpoch || content.querySelector(`#${HCS_SECTION_ID}`) !== container) return;
    renderSection(content, participant);
};
