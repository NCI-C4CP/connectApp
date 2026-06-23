import { describe, it, expect } from 'vitest';
import { getNextScreen, pushHistory, popHistory } from '../js/pages/shareNewHealthInfo/navigation.js';
import { SCREENS } from '../js/pages/shareNewHealthInfo/constants.js';

describe('getNextScreen — linear spine', () => {
    it('walks landing → primary site → date → treatment-received', () => {
        expect(getNextScreen(SCREENS.LANDING, {})).toBe(SCREENS.PRIMARY_SITE);
        expect(getNextScreen(SCREENS.PRIMARY_SITE, {})).toBe(SCREENS.DIAGNOSIS_DATE);
        expect(getNextScreen(SCREENS.DIAGNOSIS_DATE, {})).toBe(SCREENS.TREATMENT_RECEIVED);
    });
});

describe('getNextScreen — treatment branch', () => {
    it('Yes → treatment detail', () => {
        expect(getNextScreen(SCREENS.TREATMENT_RECEIVED, { txReceived: true, primarySite: 'breast' }))
            .toBe(SCREENS.TREATMENT_DETAIL);
    });
    it('No + screening-eligible site → screening gate', () => {
        expect(getNextScreen(SCREENS.TREATMENT_RECEIVED, { txReceived: false, primarySite: 'breast' }))
            .toBe(SCREENS.SCREENING_GATE);
    });
    it('No + non-eligible site → review', () => {
        expect(getNextScreen(SCREENS.TREATMENT_RECEIVED, { txReceived: false, primarySite: 'prostate' }))
            .toBe(SCREENS.REVIEW);
    });
    it('detail → summary; summary → gate/review by site eligibility', () => {
        expect(getNextScreen(SCREENS.TREATMENT_DETAIL, {})).toBe(SCREENS.TREATMENT_SUMMARY);
        expect(getNextScreen(SCREENS.TREATMENT_SUMMARY, { primarySite: 'lung' })).toBe(SCREENS.SCREENING_GATE);
        expect(getNextScreen(SCREENS.TREATMENT_SUMMARY, { primarySite: 'anal' })).toBe(SCREENS.REVIEW);
    });
});

describe('getNextScreen — screening branch', () => {
    it('detected Yes → detail; No → review; detail → review; review → confirmation', () => {
        expect(getNextScreen(SCREENS.SCREENING_GATE, { screeningDetected: true })).toBe(SCREENS.SCREENING_RECAP);
        expect(getNextScreen(SCREENS.SCREENING_RECAP, {})).toBe(SCREENS.SCREENING_DETAIL);
        expect(getNextScreen(SCREENS.SCREENING_GATE, { screeningDetected: false })).toBe(SCREENS.REVIEW);
        expect(getNextScreen(SCREENS.SCREENING_DETAIL, {})).toBe(SCREENS.REVIEW);
        expect(getNextScreen(SCREENS.REVIEW, {})).toBe(SCREENS.CONFIRMATION);
    });
});

describe('history stack', () => {
    it('push appends without mutating', () => {
        const h0 = [SCREENS.LANDING];
        const h1 = pushHistory(h0, SCREENS.PRIMARY_SITE);
        expect(h1).toEqual([SCREENS.LANDING, SCREENS.PRIMARY_SITE]);
        expect(h0).toEqual([SCREENS.LANDING]); // unchanged
    });
    it('pop returns the previous screen and trimmed stack', () => {
        const { screen, history } = popHistory([SCREENS.LANDING, SCREENS.PRIMARY_SITE, SCREENS.DIAGNOSIS_DATE]);
        expect(screen).toBe(SCREENS.DIAGNOSIS_DATE);
        expect(history).toEqual([SCREENS.LANDING, SCREENS.PRIMARY_SITE]);
    });
    it('pop on empty stack returns null', () => {
        expect(popHistory([])).toEqual({ screen: null, history: [] });
    });
});

// nextRenderableScreen: forward navigation that skips screens whose data is missing. The
// controller uses it so detail -> summary with no treatments left continues to the
// no-treatment path instead of rendering a dead summary (review-pass finding).
describe('nextRenderableScreen', () => {
    it('matches getNextScreen when every downstream screen has its data', async () => {
        const { nextRenderableScreen } = await import('../js/pages/shareNewHealthInfo/navigation.js');
        const state = { txReceived: true, primarySite: 'prostate', treatments: [{ type: 'chemo' }], screenings: [] };
        expect(nextRenderableScreen(SCREENS.TREATMENT_DETAIL, state)).toBe(SCREENS.TREATMENT_SUMMARY);
    });
    it('skips the empty treatment summary and lands on the no-treatment path', async () => {
        const { nextRenderableScreen } = await import('../js/pages/shareNewHealthInfo/navigation.js');
        const noTx = { txReceived: false, treatments: [], screenings: [] };
        expect(nextRenderableScreen(SCREENS.TREATMENT_DETAIL, { ...noTx, primarySite: 'prostate' }))
            .toBe(SCREENS.REVIEW); // summary skipped (no treatments), prostate skips screening
        expect(nextRenderableScreen(SCREENS.TREATMENT_DETAIL, { ...noTx, primarySite: 'breast' }))
            .toBe(SCREENS.SCREENING_GATE); // summary skipped, breast is screening-eligible
    });
});
