// Quest-flat payload builder: string D_ values, dictionary-nested keys, no server-owned fields.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import { SCREENING_ELIGIBLE_SITES, SCREENING_OPTIONS_BY_SITE } from './constants.js';
import { countryCidFromSelectValue } from './countryCid.js';

const m = fieldMapping.selfReportCancerDx;
const DOC_LAST_UPDATED = fieldMapping.docLastUpdatedTimestamp;
const YES = String(fieldMapping.yes);
const NO = String(fieldMapping.no);

export const dKey = (cid, ...idx) => ['D_' + cid, ...idx].join('_');
export const nestedDKey = (parentCid, childCid, ...idx) => ['D_' + parentCid, 'D_' + childCid, ...idx].join('_');
const treatmentRowDKey = (parentCid, childCid, row) => nestedDKey(parentCid, childCid, row, row);

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
const hasPhysicianContent = (p) => !!p && ['firstName', 'lastName', 'npi'].some((k) => isPresent(p[k]));

const buildFacility = (facCids, facility, keyFor) => {
    const out = {};
    if (!hasFacilityContent(facility)) return out;
    const intl = !!facility.isInternational;
    out[keyFor(facCids.intlFlag)] = intl ? YES : NO;
    setIf(out, keyFor(facCids.line1), facility.line1);
    setIf(out, keyFor(facCids.line2), facility.line2);
    setIf(out, keyFor(facCids.line3), facility.line3);
    setIf(out, keyFor(facCids.city), facility.city);
    if (intl) {
        setIf(out, keyFor(facCids.line4), facility.line4);
        setIf(out, keyFor(facCids.state), facility.region);
        setIf(out, keyFor(facCids.zip), facility.postal);
        setIf(out, keyFor(facCids.country), countryCidFromSelectValue(facility.country));
    } else {
        setIf(out, keyFor(facCids.state), facility.state);
        setIf(out, keyFor(facCids.zip), facility.zip);
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
    orderedTx.forEach((tx) => {
        const parentCid = m.treatment[tx.type];
        setIf(payload, nestedDKey(parentCid, m.treatment.startMonth), monthCid(tx.startMonth));
        setIf(payload, nestedDKey(parentCid, m.treatment.startYear), tx.startYear);
        if (tx.ongoing) {
            payload[nestedDKey(parentCid, m.treatment.ongoing)] = YES;
        } else {
            payload[nestedDKey(parentCid, m.treatment.ongoing)] = NO;
            setIf(payload, nestedDKey(parentCid, m.treatment.endMonth), monthCid(tx.endMonth));
            setIf(payload, nestedDKey(parentCid, m.treatment.endYear), tx.endYear);
        }
        (Array.isArray(tx.physicians) ? tx.physicians : []).filter(hasPhysicianContent).forEach((phys, j) => {
            const P = j + 1;
            setIf(payload, treatmentRowDKey(parentCid, m.treatment.physFirstName, P), phys.firstName);
            setIf(payload, treatmentRowDKey(parentCid, m.treatment.physLastName, P), phys.lastName);
            if (!isTodoCid(m.treatment.physNpi)) setIf(payload, treatmentRowDKey(parentCid, m.treatment.physNpi, P), phys.npi);
        });
        (Array.isArray(tx.facilities) ? tx.facilities : []).filter(hasFacilityContent).forEach((f, j) => {
            const F = j + 1;
            Object.assign(payload, buildFacility(m.treatment.facility, f, (cid) => treatmentRowDKey(parentCid, cid, F)));
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
        chosen.forEach((scr) => {
            const parentCid = m.screening.optionValues[scr.type];
            setIf(payload, nestedDKey(parentCid, m.screening.month), monthCid(scr.month));
            setIf(payload, nestedDKey(parentCid, m.screening.year), scr.year);
            if (scr.physician) {
                setIf(payload, nestedDKey(parentCid, m.screening.phyFirstName), scr.physician.firstName);
                setIf(payload, nestedDKey(parentCid, m.screening.phyLastName), scr.physician.lastName);
                if (!isTodoCid(m.screening.phyNpi)) setIf(payload, nestedDKey(parentCid, m.screening.phyNpi), scr.physician.npi);
            }
            Object.assign(payload, buildFacility(m.screening.facility, scr.facility, (cid) => nestedDKey(parentCid, cid)));
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
