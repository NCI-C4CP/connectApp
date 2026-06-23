// Pure process navigation: forward map plus Back history. No DOM.

import { SCREENS } from './constants.js';
import { isScreeningEligible } from './conditionalLogic.js';

const nextAfterTreatment = (state) =>
    isScreeningEligible(state.primarySite) ? SCREENS.SCREENING_GATE : SCREENS.REVIEW;

export const getNextScreen = (currentScreen, state = {}) => {
    switch (currentScreen) {
        case SCREENS.LANDING: return SCREENS.PRIMARY_SITE;
        case SCREENS.PRIMARY_SITE: return SCREENS.DIAGNOSIS_DATE;
        case SCREENS.DIAGNOSIS_DATE: return SCREENS.TREATMENT_RECEIVED;
        case SCREENS.TREATMENT_RECEIVED:
            return state.txReceived ? SCREENS.TREATMENT_DETAIL : nextAfterTreatment(state);
        case SCREENS.TREATMENT_DETAIL: return SCREENS.TREATMENT_SUMMARY;
        case SCREENS.TREATMENT_SUMMARY: return nextAfterTreatment(state);
        case SCREENS.SCREENING_GATE:
            return state.screeningDetected ? SCREENS.SCREENING_RECAP : SCREENS.REVIEW;
        case SCREENS.SCREENING_RECAP: return SCREENS.SCREENING_DETAIL;
        case SCREENS.SCREENING_DETAIL: return SCREENS.REVIEW;
        case SCREENS.SCREENING_STATUS: return SCREENS.REVIEW;
        case SCREENS.REVIEW: return SCREENS.CONFIRMATION;
        default: return null;
    }
};

// Prevents Back/resume from landing on self-redirecting empty loop screens.
export const canRenderScreen = (screenId, state = {}) => {
    const treatments = Array.isArray(state.treatments) ? state.treatments : [];
    const screenings = Array.isArray(state.screenings) ? state.screenings : [];
    switch (screenId) {
        case SCREENS.TREATMENT_DETAIL:
        case SCREENS.TREATMENT_SUMMARY:
            return treatments.length > 0;
        case SCREENS.SCREENING_RECAP:
        case SCREENS.SCREENING_STATUS:
        case SCREENS.SCREENING_DETAIL:
            return screenings.length > 0;
        case SCREENS.SCREENING_GATE:
            return isScreeningEligible(state.primarySite);
        default:
            return true;
    }
};

export const fallbackScreen = (screenId) => {
    switch (screenId) {
        case SCREENS.TREATMENT_DETAIL:
        case SCREENS.TREATMENT_SUMMARY:
            return SCREENS.TREATMENT_RECEIVED;
        case SCREENS.SCREENING_RECAP:
        case SCREENS.SCREENING_STATUS:
        case SCREENS.SCREENING_DETAIL:
            return SCREENS.SCREENING_GATE;
        case SCREENS.SCREENING_GATE:
            return SCREENS.REVIEW;
        default:
            return SCREENS.LANDING;
    }
};

export const nextRenderableScreen = (currentScreen, state = {}) => {
    let target = getNextScreen(currentScreen, state);
    while (target && !canRenderScreen(target, state)) target = getNextScreen(target, state);
    return target;
};

export const pushHistory = (history = [], screen) => [...history, screen];

export const popHistory = (history = []) => {
    if (!history.length) return { screen: null, history: [] };
    return { screen: history[history.length - 1], history: history.slice(0, -1) };
};
