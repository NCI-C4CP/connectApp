// In-progress diagnosis state. Plain data only. payload.js applies concept IDs.

import { MAX_PHYSICIANS, SCREENS } from './constants.js';

export const makePhysician = () => ({ firstName: '', lastName: '', npi: '' });

export const makeFacility = () => ({
    line1: '', line2: '', line3: '', line4: '',
    city: '', state: '', region: '', zip: '', postal: '',
    isInternational: false, country: '',
});

export const makeTreatment = (type = null) => ({
    type,
    otherDescribe: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '', ongoing: false,
    physicians: [makePhysician()],
    facilities: [makeFacility()],
});

export const makeScreening = (type = null) => ({
    type,
    month: '', year: '',
    physician: makePhysician(),
    facility: makeFacility(),
});

export const makeDiagnosis = () => ({
    primarySite: null,
    primarySiteOther: '',
    dxMonth: '', dxYear: '',
    txReceived: null,
    treatments: [],
    screeningDetected: null,
    screenings: [],
});

const makePosition = () => ({
    screenId: null,
    history: [],
    editingTreatmentIndex: 0,
    editingScreeningIndex: 0,
    returnTo: null,
    // Item mode edits one detail row. Section mode re-walks a full detail loop after a gate edit.
    editMode: null,
    editBaseHistory: null,
});

let diagnosis = makeDiagnosis();
let position = makePosition();

export const getState = () => diagnosis;
export const getPosition = () => position;
export const setState = (next) => { diagnosis = next; };

// returnTo/editMode/editBaseHistory must be cleared together.
export const clearEditContext = () => {
    position.returnTo = null;
    position.editMode = null;
    position.editBaseHistory = null;
};

export const resetState = () => { diagnosis = makeDiagnosis(); position = makePosition(); };

export const hydrate = ({ state, position: pos } = {}) => {
    if (state) diagnosis = state;
    if (pos) position = pos;
};

export const addTreatment = (type = null) => {
    diagnosis.treatments.push(makeTreatment(type));
    return diagnosis.treatments.length - 1;
};
export const removeTreatment = (i) => {
    diagnosis.treatments.splice(i, 1);
    if (position.editingTreatmentIndex >= diagnosis.treatments.length) {
        position.editingTreatmentIndex = Math.max(0, diagnosis.treatments.length - 1);
    }
};

export const addPhysician = (txIndex) => {
    const tx = diagnosis.treatments[txIndex];
    if (tx && tx.physicians.length < MAX_PHYSICIANS) {
        tx.physicians.push(makePhysician());
        return true;
    }
    return false;
};
export const removePhysician = (txIndex, pIndex) => {
    const tx = diagnosis.treatments[txIndex];
    if (tx && tx.physicians.length > 1) tx.physicians.splice(pIndex, 1);
};

export const addFacility = (txIndex) => {
    const tx = diagnosis.treatments[txIndex];
    if (tx) tx.facilities.push(makeFacility());
};
export const removeFacility = (txIndex, fIndex) => {
    const tx = diagnosis.treatments[txIndex];
    if (tx && tx.facilities.length > 1) tx.facilities.splice(fIndex, 1);
};

export const addScreening = (type = null) => {
    diagnosis.screenings.push(makeScreening(type));
    return diagnosis.screenings.length - 1;
};
export const removeScreening = (i) => {
    diagnosis.screenings.splice(i, 1);
    if (position.editingScreeningIndex >= diagnosis.screenings.length) {
        position.editingScreeningIndex = Math.max(0, diagnosis.screenings.length - 1);
    }
};

// Back clears the data owned by the screen being left.
export const clearScreenData = (screenId) => {
    switch (screenId) {
        case SCREENS.PRIMARY_SITE:
            diagnosis.primarySite = null;
            diagnosis.primarySiteOther = '';
            break;
        case SCREENS.DIAGNOSIS_DATE:
            diagnosis.dxMonth = '';
            diagnosis.dxYear = '';
            break;
        case SCREENS.TREATMENT_RECEIVED:
            diagnosis.txReceived = null;
            diagnosis.treatments = [];
            break;
        case SCREENS.TREATMENT_DETAIL: {
            const tx = diagnosis.treatments[position.editingTreatmentIndex];
            if (tx) Object.assign(tx, makeTreatment(tx.type));
            break;
        }
        case SCREENS.SCREENING_GATE:
            diagnosis.screeningDetected = null;
            diagnosis.screenings = [];
            break;
        case SCREENS.SCREENING_DETAIL: {
            const scr = diagnosis.screenings[position.editingScreeningIndex];
            if (scr) Object.assign(scr, makeScreening(scr.type));
            break;
        }
        default:
            break;
    }
};
