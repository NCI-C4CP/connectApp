// Quest-flat payload builder: string D_ values, positional loops, no server-owned fields.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import { SCREENING_ELIGIBLE_SITES, SCREENING_OPTIONS_BY_SITE } from './constants.js';
import { countryCidFromSelectValue } from './countryCid.js';

const m = fieldMapping.selfReportCancerDx;
const DOC_LAST_UPDATED = fieldMapping.docLastUpdatedTimestamp;
const YES = String(fieldMapping.yes);
const NO = String(fieldMapping.no);

export const dKey = (cid, ...idx) => ['D_' + cid, ...idx].join('_');

export const TREATMENT_TYPE_ORDER = Object.freeze(['chemo', 'surgery', 'radiation', 'other']);

const isPresent = (v) => v !== undefined && v !== null && v !== '';
const setIf = (obj, key, value, cond = true) => {
    if (cond && isPresent(value)) obj[key] = String(value);
    return obj;
};
const isTodoCid = (cid) => typeof cid === 'string' && cid.startsWith('TODO');
const monthCid = (code) => (isPresent(code) && m.monthValues[code] !== undefined ? String(m.monthValues[code]) : undefined);

const FACILITY_CONTENT_FIELDS = ['line1', 'line2', 'line3', 'line4', 'city', 'state', 'region', 'zip', 'postal', 'country'];
const hasFacilityContent = (f) => !!f && FACILITY_CONTENT_FIELDS.some((k) => isPresent(f[k]));

const buildFacility = (facCids, facility, t, p) => {
    const out = {};
    if (!hasFacilityContent(facility)) return out;
    const intl = !!facility.isInternational;
    out[dKey(facCids.intlFlag, t, p)] = intl ? YES : NO;
    setIf(out, dKey(facCids.line1, t, p), facility.line1);
    setIf(out, dKey(facCids.line2, t, p), facility.line2);
    setIf(out, dKey(facCids.line3, t, p), facility.line3);
    setIf(out, dKey(facCids.city, t, p), facility.city);
    if (intl) {
        setIf(out, dKey(facCids.line4, t, p), facility.line4);
        setIf(out, dKey(facCids.state, t, p), facility.region);
        setIf(out, dKey(facCids.zip, t, p), facility.postal);
        setIf(out, dKey(facCids.country, t, p), countryCidFromSelectValue(facility.country));
    } else {
        setIf(out, dKey(facCids.state, t, p), facility.state);
        setIf(out, dKey(facCids.zip, t, p), facility.zip);
    }
    return out;
};

export const buildDiagnosisPayload = (state = {}) => {
    const payload = {};

    if (state.primarySite && m.cancerSites[state.primarySite] !== undefined) {
        payload[dKey(m.primarySite)] = String(m.cancerSites[state.primarySite]);
    }
    setIf(payload, dKey(m.primarySiteOther), state.primarySiteOther, state.primarySite === 'other');
    setIf(payload, dKey(m.dxMonth), monthCid(state.dxMonth));
    setIf(payload, dKey(m.dxYear), state.dxYear);
    if (typeof state.txReceived === 'boolean') {
        payload[dKey(m.txReceived)] = state.txReceived ? YES : NO;
    }

    const treatments = Array.isArray(state.treatments) ? state.treatments : [];
    const orderedTx = state.txReceived === true
        ? TREATMENT_TYPE_ORDER.map((k) => treatments.find((t) => t && t.type === k)).filter(Boolean)
        : [];
    if (state.txReceived === true) {
        for (const k of TREATMENT_TYPE_ORDER) {
            payload[dKey(m.treatment[k])] = orderedTx.some((t) => t.type === k) ? YES : NO;
        }
        const other = orderedTx.find((t) => t.type === 'other');
        if (other) setIf(payload, dKey(m.treatment.otherDescribe), other.otherDescribe);
    }
    orderedTx.forEach((tx, i) => {
        const T = i + 1;
        setIf(payload, dKey(m.treatment.startMonth, T, T), monthCid(tx.startMonth));
        setIf(payload, dKey(m.treatment.startYear, T, T), tx.startYear);
        if (tx.ongoing) {
            payload[dKey(m.treatment.ongoing, T, T)] = YES;
        } else {
            payload[dKey(m.treatment.ongoing, T, T)] = NO;
            setIf(payload, dKey(m.treatment.endMonth, T, T), monthCid(tx.endMonth));
            setIf(payload, dKey(m.treatment.endYear, T, T), tx.endYear);
        }
        (Array.isArray(tx.physicians) ? tx.physicians : []).forEach((phys, j) => {
            const P = j + 1;
            setIf(payload, dKey(m.treatment.physFirstName, T, P), phys.firstName);
            setIf(payload, dKey(m.treatment.physLastName, T, P), phys.lastName);
            if (!isTodoCid(m.treatment.physNpi)) setIf(payload, dKey(m.treatment.physNpi, T, P), phys.npi);
        });
        (Array.isArray(tx.facilities) ? tx.facilities : []).forEach((f, j) => {
            Object.assign(payload, buildFacility(m.treatment.facility, f, T, j + 1));
        });
    });

    if (SCREENING_ELIGIBLE_SITES.includes(state.primarySite) && typeof state.screeningDetected === 'boolean') {
        payload[dKey(m.screening.detected)] = state.screeningDetected ? YES : NO;
        const siteOptions = SCREENING_OPTIONS_BY_SITE[state.primarySite] || [];
        const screenings = Array.isArray(state.screenings) ? state.screenings : [];
        const chosen = state.screeningDetected === true
            ? siteOptions.map((k) => screenings.find((s) => s && s.type === k)).filter(Boolean)
            : [];
        if (state.screeningDetected === true) {
            for (const k of siteOptions) {
                payload[dKey(m.screening.optionValues[k])] = chosen.some((s) => s.type === k) ? YES : NO;
            }
        }
        chosen.forEach((scr, i) => {
            const S = i + 1;
            setIf(payload, dKey(m.screening.month, S, S), monthCid(scr.month));
            setIf(payload, dKey(m.screening.year, S, S), scr.year);
            if (scr.physician) {
                setIf(payload, dKey(m.screening.phyFirstName, S, S), scr.physician.firstName);
                setIf(payload, dKey(m.screening.phyLastName, S, S), scr.physician.lastName);
                if (!isTodoCid(m.screening.phyNpi)) setIf(payload, dKey(m.screening.phyNpi, S, S), scr.physician.npi);
            }
            Object.assign(payload, buildFacility(m.screening.facility, scr.facility, S, S));
        });
    }

    return payload;
};

// Same snapshot for every save and submit. stateJSON/positionJSON support resume and TODO-cid fields.
export const buildProgressSnapshot = (state, position, { lang, now = new Date() } = {}) => ({
    ...buildDiagnosisPayload(state),
    784119588: lang,
    [DOC_LAST_UPDATED]: now.toISOString(),
    stateJSON: JSON.stringify({ state }),
    positionJSON: JSON.stringify(position),
});

export const appendDiagnosis = (existing = [], diagnosisPayload) =>
    [...(Array.isArray(existing) ? existing : []), diagnosisPayload];
