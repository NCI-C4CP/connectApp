// Canonical option data for the Self-Report Cancer Diagnosis flow. Frozen / pure data.
// Concept IDs live in js/fieldToConceptIdMapping.js (selfReportCancerDx.*). This file holds
// display ordering, option keys, screening-eligibility, screen ids, and i18n key references.
// Imported by both production modules and tests (single source of truth).

export const SCREENING_ELIGIBLE_SITES = Object.freeze(['breast', 'colon', 'lung']);

// Primary cancer sites, in display order (spreadsheet response codes 0..22, 55).
export const PRIMARY_SITES = Object.freeze(
    [
        { key: 'anal', code: 0 }, { key: 'bladder', code: 1 }, { key: 'brain', code: 2 },
        { key: 'breast', code: 3 }, { key: 'cervical', code: 4 }, { key: 'colon', code: 5 },
        { key: 'esophageal', code: 6 }, { key: 'headAndNeck', code: 7 }, { key: 'kidney', code: 8 },
        { key: 'leukemia', code: 9 }, { key: 'liver', code: 10 }, { key: 'lung', code: 11 },
        { key: 'nonHodgkinsLymphoma', code: 12 }, { key: 'lymphoma', code: 13 }, { key: 'skinMelanoma', code: 14 },
        { key: 'nonMelanomaSkin', code: 15 }, { key: 'ovarian', code: 16 }, { key: 'pancreatic', code: 17 },
        { key: 'prostate', code: 18 }, { key: 'stomach', code: 19 }, { key: 'testicular', code: 20 },
        { key: 'thyroid', code: 21 }, { key: 'uterine', code: 22 }, { key: 'other', code: 55 },
    ].map((s) => Object.freeze({
        ...s,
        i18nKey: `shareHealthInfo.site_${s.key}`,
        screeningEligible: SCREENING_ELIGIBLE_SITES.includes(s.key),
    }))
);

export const PRIMARY_SITE_OTHER_KEY = 'other';

// Treatment types (multi-select). "other" reveals a free-text describe field.
export const TREATMENT_TYPES = Object.freeze(
    ['chemo', 'surgery', 'radiation', 'other'].map((key) =>
        Object.freeze({ key, i18nKey: `shareHealthInfo.tx_${key}` }))
);

// Screening options available per primary site (only the 3 eligible sites).
export const SCREENING_OPTIONS_BY_SITE = Object.freeze({
    breast: Object.freeze(['breast2D', 'breastCEM', 'breastMRI', 'breastUS', 'breastCBE']),
    lung: Object.freeze(['lungCT']),
    colon: Object.freeze(['colonCol', 'colonCT', 'colonSig', 'colonFecal']),
});

// Flattened screening option metadata: { key, site, i18nKey, tooltipKey }.
export const SCREENING_OPTIONS = Object.freeze(
    Object.entries(SCREENING_OPTIONS_BY_SITE).flatMap(([site, keys]) =>
        keys.map((key) => Object.freeze({
            key,
            site,
            i18nKey: `shareHealthInfo.scrn_${key}`,
            tooltipKey: `shareHealthInfo.scrnDef_${key}`,
        })))
);

export const MONTHS = Object.freeze(
    ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
        .map((label, i) => Object.freeze({
        value: i,
        label,
        i18nKey: `shareHealthInfo.month_${label.toLowerCase()}`,
    }))
);

// Process screen ids (navigation).
export const SCREENS = Object.freeze({
    LANDING: 'landing',
    PRIMARY_SITE: 'primarySite',
    DIAGNOSIS_DATE: 'diagnosisDate',
    TREATMENT_RECEIVED: 'treatmentReceived',
    TREATMENT_DETAIL: 'treatmentDetail',
    TREATMENT_SUMMARY: 'treatmentSummary',
    SCREENING_GATE: 'screeningGate',
    SCREENING_RECAP: 'screeningRecap',
    SCREENING_STATUS: 'screeningStatus',
    SCREENING_DETAIL: 'screeningDetail',
    REVIEW: 'review',
    CONFIRMATION: 'confirmation',
});

// Max physicians per treatment type.
export const MAX_PHYSICIANS = 10;

// Confirmation page outbound links.
export const CONFIRMATION_LINKS = Object.freeze({
    treatment: 'https://www.cancer.gov/about-cancer/treatment',
    managingCare: 'https://www.cancer.gov/about-cancer/managing-care',
    supportCenter: 'https://norcfedramp.servicenowservices.com/participant',
});
