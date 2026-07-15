// Quest-like payload builder: source-question maps, string leaf D_ values, no server-owned fields.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import { SCREENING_ELIGIBLE_SITES, SCREENING_OPTIONS_BY_SITE } from './constants.js';
import { countryCidFromSelectValue } from './countryCid.js';
import { hasFacilityContent, hasPhysicianContent, isPresent } from './contentChecks.js';

const m = fieldMapping.selfReportCancerDx;
const DOC_LAST_UPDATED = fieldMapping.docLastUpdatedTimestamp;
const YES = String(fieldMapping.yes);
const NO = String(fieldMapping.no);

export const dKey = (cid, ...idx) => ['D_' + cid, ...idx].join('_');
const treatmentRowDKey = (childCid, row) => dKey(childCid, row, row);

export const TREATMENT_TYPE_ORDER = Object.freeze(['chemo', 'surgery', 'radiation', 'other']);

const setIf = (obj, key, value, cond = true) => {
    if (cond && isPresent(value)) obj[key] = String(value);
    return obj;
};
const isTodoCid = (cid) => typeof cid === 'string' && cid.startsWith('TODO');
const monthCid = (code) => (isPresent(code) && m.monthValues[code] !== undefined ? String(m.monthValues[code]) : undefined);

const buildFacility = (facCids, facility, keyFor) => {
    const out = {};
    if (!hasFacilityContent(facility)) return out;
    const intl = !!facility.isInternational;
    out[keyFor(facCids.intlFlag)] = intl ? YES : NO;
    out[keyFor(facCids.googleValidated)] = !intl && facility.googleAddressValidated ? YES : NO;
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

const addScreeningDetails = (target, scr) => {
    setIf(target, dKey(m.screening.month), monthCid(scr.month));
    setIf(target, dKey(m.screening.year), scr.year);
    if (scr.physician) {
        setIf(target, dKey(m.screening.physFirstName), scr.physician.firstName);
        setIf(target, dKey(m.screening.physLastName), scr.physician.lastName);
        if (!isTodoCid(m.screening.physNpi)) setIf(target, dKey(m.screening.physNpi), scr.physician.npi);
    }
    Object.assign(target, buildFacility(m.screening.facility, scr.facility, dKey));
};

export const buildDiagnosisPayload = (state = {}) => {
    const payload = {};

    if (state.primarySite && m.cancerSites[state.primarySite] !== undefined) {
        const siteGroup = {};
        siteGroup[dKey(m.primarySite)] = String(m.cancerSites[state.primarySite]);
        setIf(siteGroup, dKey(m.primarySiteOther), state.primarySiteOther, state.primarySite === 'other');
        payload[dKey(m.sourceQuestions.primarySite)] = siteGroup;
    }
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
        const txTypeGroup = {};
        for (const k of TREATMENT_TYPE_ORDER) {
            txTypeGroup[dKey(m.treatment[k])] = orderedTx.some((t) => t.type === k) ? YES : NO;
        }
        const other = orderedTx.find((t) => t.type === 'other');
        if (other) setIf(txTypeGroup, dKey(m.treatment.otherDescribe), other.otherDescribe);
        payload[dKey(m.sourceQuestions.treatmentType)] = txTypeGroup;
    }
    orderedTx.forEach((tx) => {
        const parentCid = m.treatment[tx.type];
        const txDetail = {};
        setIf(txDetail, dKey(m.treatment.startMonth), monthCid(tx.startMonth));
        setIf(txDetail, dKey(m.treatment.startYear), tx.startYear);
        const ongoingGroup = {};
        if (tx.ongoing) {
            ongoingGroup[dKey(m.treatment.ongoing)] = YES;
        } else {
            ongoingGroup[dKey(m.treatment.ongoing)] = NO;
            setIf(ongoingGroup, dKey(m.treatment.endMonth), monthCid(tx.endMonth));
            setIf(ongoingGroup, dKey(m.treatment.endYear), tx.endYear);
        }
        txDetail[dKey(m.sourceQuestions.treatmentOngoingEnd)] = ongoingGroup;
        (Array.isArray(tx.physicians) ? tx.physicians : []).filter(hasPhysicianContent).forEach((phys, j) => {
            const P = j + 1;
            setIf(txDetail, treatmentRowDKey(m.treatment.physFirstName, P), phys.firstName);
            setIf(txDetail, treatmentRowDKey(m.treatment.physLastName, P), phys.lastName);
            if (!isTodoCid(m.treatment.physNpi)) setIf(txDetail, treatmentRowDKey(m.treatment.physNpi, P), phys.npi);
        });
        (Array.isArray(tx.facilities) ? tx.facilities : []).filter(hasFacilityContent).forEach((f, j) => {
            const F = j + 1;
            Object.assign(txDetail, buildFacility(m.treatment.facility, f, (cid) => treatmentRowDKey(cid, F)));
        });
        payload[dKey(parentCid)] = txDetail;
    });

    if (SCREENING_ELIGIBLE_SITES.includes(state.primarySite) && typeof state.screeningDetected === 'boolean') {
        const siteOptions = SCREENING_OPTIONS_BY_SITE[state.primarySite] || [];
        const screenings = Array.isArray(state.screenings) ? state.screenings : [];
        const chosen = state.screeningDetected === true
            ? siteOptions.map((k) => screenings.find((s) => s && s.type === k)).filter(Boolean)
            : [];

        payload[dKey(m.screening.detected)] = state.screeningDetected ? YES : NO;
        if (state.screeningDetected === true) {
            const screeningTypeGroup = {};
            for (const k of siteOptions) {
                screeningTypeGroup[dKey(m.screening.optionValues[k])] = chosen.some((s) => s.type === k) ? YES : NO;
            }
            payload[dKey(m.sourceQuestions.screeningType)] = screeningTypeGroup;
        }
        chosen.forEach((scr) => {
            const parentCid = m.screening.optionValues[scr.type];
            const screeningDetail = {};
            addScreeningDetails(screeningDetail, scr);
            payload[dKey(parentCid)] = screeningDetail;
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
