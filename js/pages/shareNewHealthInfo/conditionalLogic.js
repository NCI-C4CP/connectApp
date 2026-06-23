// Pure conditional-display & gating logic for the Self-Report Cancer Diagnosis flow.
// No DOM. Shared by the screens (display decisions) and the dashboard card / route guard,
// and exercised directly by unit tests.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import {
    SCREENING_ELIGIBLE_SITES,
    SCREENING_OPTIONS_BY_SITE,
    PRIMARY_SITE_OTHER_KEY,
    MAX_PHYSICIANS,
} from './constants.js';
import { isValidPastYear, isValidScreeningYear, isValidYearWithAllowance } from './validation.js';

/**
 * Card / route eligibility: verified, consenting, living, and not data-destruction-requested.
 * (Requirements: RcrtV_Verification_v1r0 = 1 AND HdWd_WdConsent_v1r0 = 0.)
 * The deceased checks mirror connectFaas write eligibility so an ineligible participant is not
 * walked through the process only to receive a submit-time 403.
 */
export const isVerifiedNotWithdrawn = (data = {}) => {
    const {
        verification, verified, consentWithdrawn, yes, destroyData,
        participantDeceased, participantDeceasedNORC,
    } = fieldMapping;
    return data[verification] === verified
        && data[consentWithdrawn] !== yes
        && data[destroyData] !== yes
        && data[participantDeceased] !== yes
        && data[participantDeceasedNORC] !== yes;
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

/**
 * End-date XOR "ongoing": if ongoing is checked, end month/year are cleared.
 * Returns a normalized copy (does not mutate). Neither is required.
 */
export const applyOngoingExclusivity = (tx = {}) =>
    tx.ongoing ? { ...tx, endMonth: '', endYear: '' } : { ...tx };

/** A treatment is "complete" when it has a type and a valid start year (future allowed up to +5). */
export const isTreatmentComplete = (tx = {}, opts) =>
    !!tx.type && isValidYearWithAllowance(tx.startYear, opts);

/** A screening is "complete" when a type is chosen and the screening year is valid. */
export const isScreeningComplete = (scr = {}, opts) =>
    !!scr.type && isValidScreeningYear(scr.year, opts);

/**
 * Whether the whole diagnosis may be submitted: primary site set, diagnosis year valid,
 * every present treatment has a valid start year, every present screening has a valid year.
 */
export const isDiagnosisSubmittable = (state = {}, opts) => {
    if (!state.primarySite) return false;
    if (!isValidPastYear(state.dxYear, opts)) return false;
    if (typeof state.txReceived !== 'boolean') return false; // Q3 must be answered (Yes/No)
    if (Array.isArray(state.treatments)) {
        for (const tx of state.treatments) {
            if (!isValidYearWithAllowance(tx.startYear, opts)) return false; // treatment may be scheduled (future +5 years)
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
            for (const scr of relevant) if (!isValidScreeningYear(scr.year, opts)) return false;
        }
    }
    return true;
};
