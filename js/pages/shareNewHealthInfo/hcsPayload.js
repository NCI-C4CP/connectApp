// Health Care System Update (issue #1658) payload builder.
// Every key is a top-level D_<cid> string value. Facility semantics (intl merge, googleValidated
// forced No when international) are shared with the cancer-dx builder via buildFacility.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import { dKey, buildFacility } from './payload.js';
import { isPresent } from './contentChecks.js';

const hcsMapping = fieldMapping.selfReportHCSUpdate;
const selfReportMonthValues = fieldMapping.selfReportMonthValues;
const DOC_LAST_UPDATED = fieldMapping.docLastUpdatedTimestamp;

const setIf = (obj, key, value, cond = true) => {
    if (cond && isPresent(value)) obj[key] = String(value);
    return obj;
};
const monthCid = (code) => (isPresent(code) && selfReportMonthValues[code] !== undefined ? String(selfReportMonthValues[code]) : undefined);

export const makeHcsUpdate = () => ({
    facility: {
        line1: '', line2: '', line3: '', line4: '',
        city: '', state: '', region: '', zip: '', postal: '',
        isInternational: false, country: '', googleAddressValidated: false,
    },
    changeMonth: '', changeYear: '',
    additionalInfo: '',
});

export const buildHcsPayload = (state = {}) => {
    const payload = {};
    Object.assign(payload, buildFacility(hcsMapping.facility, state.facility, dKey, { includeExplicitInternational: true }));
    setIf(payload, dKey(hcsMapping.changeMonth), monthCid(state.changeMonth));
    setIf(payload, dKey(hcsMapping.changeYear), state.changeYear);
    setIf(payload, dKey(hcsMapping.additionalInfo), state.additionalInfo);
    return payload;
};

// Submit-only module (no stateJSON/positionJSON) resume fields needed here.
export const buildHcsSnapshot = (state, { lang, now = new Date() } = {}) => ({
    ...buildHcsPayload(state),
    [fieldMapping.surveyLanguage]: lang,
    [DOC_LAST_UPDATED]: now.toISOString(),
});

const monthCodeFromCid = (cid) => {
    const code = Object.keys(selfReportMonthValues).find((c) => String(selfReportMonthValues[c]) === cid);
    return code === undefined ? null : Number(code);
};

// Parse one submitted row back into display fields. Inverse of buildHcsPayload.
export const parseHcsRow = (row = {}) => {
    const v = (cid) => {
        const value = row[dKey(cid)];
        return typeof value === 'string' ? value : '';
    };
    const isInternational = v(hcsMapping.facility.intlFlag) === String(fieldMapping.yes);
    return {
        line1: v(hcsMapping.facility.line1),
        line2: v(hcsMapping.facility.line2),
        line3: v(hcsMapping.facility.line3),
        line4: v(hcsMapping.facility.line4),
        city: v(hcsMapping.facility.city),
        stateOrRegion: v(hcsMapping.facility.state),
        zipOrPostal: v(hcsMapping.facility.zip),
        isInternational,
        countryCid: v(hcsMapping.facility.country),
        changeMonthCode: monthCodeFromCid(v(hcsMapping.changeMonth)),
        changeYear: v(hcsMapping.changeYear),
        additionalInfo: v(hcsMapping.additionalInfo),
        submittedTimestamp: v(hcsMapping.submittedTimestamp),
    };
};
