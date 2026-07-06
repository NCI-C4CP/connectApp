// Pure conditional-display & gating logic for the Self-Report Cancer Diagnosis flow.
// No DOM. Shared by the screens (display decisions) and the dashboard card / route guard,
// and exercised directly by unit tests.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import {
    SCREENING_ELIGIBLE_SITES,
    SCREENING_OPTIONS_BY_SITE,
    PRIMARY_SITE_OTHER_KEY,
    MAX_FACILITIES,
    MAX_PHYSICIANS,
} from './constants.js';
import {
    isScreeningYearOnOrBeforeDiagnosis,
    isTreatmentYearOnOrAfterDiagnosis,
    isValidPastYear,
    isValidScreeningYear,
    isValidYearWithAllowance,
} from './validation.js';

/**
 * Card / route eligibility: verified and not withdrawn.
 * (Requirements: RcrtV_Verification_v1r0 = 1 AND HdWd_WdConsent_v1r0 = 0.)
 */
export const isVerifiedNotWithdrawn = (data = {}) => {
    const {
        verification, verified, consentWithdrawn, yes,
    } = fieldMapping;
    return data[verification] === verified
        && data[consentWithdrawn] !== yes;
};

/** Q1: show the "Other — please describe" write-in only when site === other. */
export const shouldShowSiteOther = (primarySite) => primarySite === PRIMARY_SITE_OTHER_KEY;

/** Q1 gate: a primary site must be selected to continue (the write-in is optional). */
export const canContinueFromPrimarySite = (state = {}) => !!state.primarySite;

/** Q4 is shown only for breast / colon-rectal / lung. */
export const isScreeningEligible = (primarySite) => SCREENING_ELIGIBLE_SITES.includes(primarySite);

/** Screening options available for a given site (empty array if not screening-eligible). */
export const getScreeningOptionsForSite = (primarySite) =>
    SCREENING_OPTIONS_BY_SITE[primarySite] ? [...SCREENING_OPTIONS_BY_SITE[primarySite]] : [];

/** Up to MAX_PHYSICIANS (10) per treatment type. */
export const canAddPhysician = (count) => count < MAX_PHYSICIANS;

/** Up to MAX_FACILITIES (10) per treatment type. */
export const canAddFacility = (count) => count < MAX_FACILITIES;

/**
 * End-date XOR "ongoing": if ongoing is checked, end month/year are cleared.
 * Returns a normalized copy (does not mutate). Neither is required.
 */
export const applyOngoingExclusivity = (tx = {}) =>
    tx.ongoing ? { ...tx, endMonth: '', endYear: '' } : { ...tx };

/** A treatment is "complete" when it has a type and a valid start year for the diagnosis. */
export const isTreatmentComplete = (tx = {}, opts = {}) => {
    if (!tx.type || !isValidYearWithAllowance(tx.startYear, opts)) return false;
    if (opts.dxYear !== undefined && opts.dxYear !== null && String(opts.dxYear).trim() !== '') {
        return isTreatmentYearOnOrAfterDiagnosis(tx.startYear, opts.dxYear);
    }
    return true;
};

/** A screening is "complete" when a type is chosen and the screening year is valid for the diagnosis. */
export const isScreeningComplete = (scr = {}, opts = {}) => {
    if (!scr.type || !isValidScreeningYear(scr.year, opts)) return false;
    if (opts.dxYear !== undefined && opts.dxYear !== null && String(opts.dxYear).trim() !== '') {
        return isScreeningYearOnOrBeforeDiagnosis(scr.year, opts.dxYear);
    }
    return true;
};

/**
 * Whether the whole diagnosis may be submitted: primary site set, diagnosis year valid,
 * every present treatment has a valid start year on/after diagnosis, every present screening has a valid year.
 * Treatment received / treatment type are optional; selected treatments still need detail.
 */
export const isDiagnosisSubmittable = (state = {}, opts) => {
    if (!state.primarySite) return false;
    if (!isValidPastYear(state.dxYear, opts)) return false;
    if (state.txReceived === true && Array.isArray(state.treatments)) {
        for (const tx of state.treatments) {
            if (!isTreatmentComplete(tx, { ...opts, dxYear: state.dxYear })) return false; // treatment may be scheduled (future +5 years)
        }
    }
    // Screening applies only to screening-eligible sites. For those, Q4 must be answered. When "Yes",
    // at least one screening valid for the current site with a valid year is required. A primary-site
    // edit leaves screening data in place (not cleared), so we validate against the current site's
    // options. Any stale wrong-site screening is ignored here (and is never emitted to the payload).
    if (isScreeningEligible(state.primarySite)) {
        if (typeof state.screeningDetected !== 'boolean') return false; // Q4 must be answered
        if (state.screeningDetected) {
            const siteOptions = getScreeningOptionsForSite(state.primarySite);
            const relevant = (Array.isArray(state.screenings) ? state.screenings : [])
                .filter((s) => siteOptions.includes(s.type));
            if (relevant.length === 0) return false;
            for (const scr of relevant) if (!isScreeningComplete(scr, { ...opts, dxYear: state.dxYear })) return false;
        }
    }
    return true;
};
