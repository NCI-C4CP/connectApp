// Health Care System Update (issue #1658) payload builder.
// Every key is a top-level D_<cid> string value. Facility semantics (intl merge, googleValidated
// forced No when international) are shared with the cancer-dx builder via buildFacility.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import { dKey, buildFacility } from './payload.js';
import { isPresent } from './contentChecks.js';

const h = fieldMapping.selfReportHCSUpdate;
const DOC_LAST_UPDATED = fieldMapping.docLastUpdatedTimestamp;
const SURVEY_LANGUAGE = 784119588;

const setIf = (obj, key, value, cond = true) => {
    if (cond && isPresent(value)) obj[key] = String(value);
    return obj;
};
const monthCid = (code) => (isPresent(code) && h.monthValues[code] !== undefined ? String(h.monthValues[code]) : undefined);

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
    Object.assign(payload, buildFacility(h.facility, state.facility, dKey));
    setIf(payload, dKey(h.changeMonth), monthCid(state.changeMonth));
    setIf(payload, dKey(h.changeYear), state.changeYear);
    setIf(payload, dKey(h.additionalInfo), state.additionalInfo);
    return payload;
};

// Submit-only module (no stateJSON/positionJSON) resume fields needed here.
export const buildHcsSnapshot = (state, { lang, now = new Date() } = {}) => ({
    ...buildHcsPayload(state),
    [SURVEY_LANGUAGE]: lang,
    [DOC_LAST_UPDATED]: now.toISOString(),
});

const monthCodeFromCid = (cid) => {
    const code = Object.keys(h.monthValues).find((c) => String(h.monthValues[c]) === cid);
    return code === undefined ? null : Number(code);
};

// Parse one submitted row back into display fields. Inverse of buildHcsPayload.
export const parseHcsRow = (row = {}) => {
    const v = (cid) => {
        const value = row[dKey(cid)];
        return typeof value === 'string' ? value : '';
    };
    const isInternational = v(h.facility.intlFlag) === String(fieldMapping.yes);
    return {
        line1: v(h.facility.line1),
        line2: v(h.facility.line2),
        line3: v(h.facility.line3),
        line4: v(h.facility.line4),
        city: v(h.facility.city),
        stateOrRegion: v(h.facility.state),
        zipOrPostal: v(h.facility.zip),
        isInternational,
        countryCid: v(h.facility.country),
        changeMonthCode: monthCodeFromCid(v(h.changeMonth)),
        changeYear: v(h.changeYear),
        additionalInfo: v(h.additionalInfo),
        submittedTimestamp: v(h.submittedTimestamp),
    };
};
