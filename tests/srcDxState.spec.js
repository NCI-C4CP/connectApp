import { describe, it, expect, beforeEach } from 'vitest';
import * as state from '../js/pages/shareNewHealthInfo/state.js';
import { SCREENS } from '../js/pages/shareNewHealthInfo/constants.js';

beforeEach(() => state.resetState());

describe('factories', () => {
    it('makeDiagnosis has the expected empty shape', () => {
        expect(state.makeDiagnosis()).toEqual({
            primarySite: null, primarySiteOther: '', dxMonth: '', dxYear: '',
            txReceived: null, treatments: [], screeningDetected: null, screenings: [],
        });
    });
    it('makeTreatment seeds one physician and one facility', () => {
        const tx = state.makeTreatment('chemo');
        expect(tx.type).toBe('chemo');
        expect(tx.physicians).toHaveLength(1);
        expect(tx.facilities).toHaveLength(1);
        expect(tx.ongoing).toBe(false);
    });
    it('makeScreening / makeFacility / makePhysician shapes', () => {
        expect(state.makeScreening('breast2D').type).toBe('breast2D');
        expect(state.makeFacility().isInternational).toBe(false);
        expect(state.makePhysician()).toEqual({ firstName: '', lastName: '', npi: '' });
    });
});

describe('treatment loop mutators', () => {
    it('addTreatment returns its index and appends', () => {
        expect(state.addTreatment('chemo')).toBe(0);
        expect(state.addTreatment('surgery')).toBe(1);
        expect(state.getState().treatments.map((t) => t.type)).toEqual(['chemo', 'surgery']);
    });
    it('removeTreatment splices', () => {
        state.addTreatment('chemo'); state.addTreatment('surgery');
        state.removeTreatment(0);
        expect(state.getState().treatments.map((t) => t.type)).toEqual(['surgery']);
    });
});

describe('physician cap (max 10)', () => {
    it('addPhysician caps at 10 and reports success/failure', () => {
        state.addTreatment('chemo');
        // starts with 1; add up to 10
        for (let i = 0; i < 9; i++) expect(state.addPhysician(0)).toBe(true);
        expect(state.getState().treatments[0].physicians).toHaveLength(10);
        expect(state.addPhysician(0)).toBe(false); // 11th blocked
        expect(state.getState().treatments[0].physicians).toHaveLength(10);
    });
    it('removePhysician keeps at least one', () => {
        state.addTreatment('chemo');
        state.addPhysician(0);
        state.removePhysician(0, 1);
        expect(state.getState().treatments[0].physicians).toHaveLength(1);
        state.removePhysician(0, 0); // cannot drop below 1
        expect(state.getState().treatments[0].physicians).toHaveLength(1);
    });
});

describe('facility + screening mutators', () => {
    it('addFacility / removeFacility keep at least one', () => {
        state.addTreatment('chemo');
        state.addFacility(0);
        expect(state.getState().treatments[0].facilities).toHaveLength(2);
        state.removeFacility(0, 1);
        expect(state.getState().treatments[0].facilities).toHaveLength(1);
        state.removeFacility(0, 0);
        expect(state.getState().treatments[0].facilities).toHaveLength(1);
    });
    it('addScreening / removeScreening', () => {
        expect(state.addScreening('breast2D')).toBe(0);
        state.addScreening('breastMRI');
        expect(state.getState().screenings.map((s) => s.type)).toEqual(['breast2D', 'breastMRI']);
        state.removeScreening(0);
        expect(state.getState().screenings.map((s) => s.type)).toEqual(['breastMRI']);
    });
});

describe('reset + hydrate', () => {
    it('resetState clears state and position', () => {
        state.addTreatment('chemo');
        state.getPosition().screenId = 'primarySite';
        state.resetState();
        expect(state.getState().treatments).toHaveLength(0);
        expect(state.getPosition().screenId).toBeNull();
    });
    it('hydrate loads saved state + position', () => {
        state.hydrate({
            state: { ...state.makeDiagnosis(), primarySite: 'lung', dxYear: '2024' },
            position: { screenId: 'diagnosisDate', history: ['landing', 'primarySite'], editingTreatmentIndex: 0, editingScreeningIndex: 0, returnToReview: false },
        });
        expect(state.getState().primarySite).toBe('lung');
        expect(state.getPosition().screenId).toBe('diagnosisDate');
        expect(state.getPosition().history).toEqual(['landing', 'primarySite']);
    });
});

describe('clearScreenData (back-clears-data)', () => {
    it('clears the primary site', () => {
        state.getState().primarySite = 'breast';
        state.getState().primarySiteOther = 'x';
        state.clearScreenData(SCREENS.PRIMARY_SITE);
        expect(state.getState().primarySite).toBeNull();
        expect(state.getState().primarySiteOther).toBe('');
    });
    it('clears the diagnosis date', () => {
        state.getState().dxMonth = 3;
        state.getState().dxYear = '2020';
        state.clearScreenData(SCREENS.DIAGNOSIS_DATE);
        expect(state.getState().dxMonth).toBe('');
        expect(state.getState().dxYear).toBe('');
    });
    it('clears treatment-received (flag + all treatments)', () => {
        state.getState().txReceived = true;
        state.addTreatment('chemo');
        state.clearScreenData(SCREENS.TREATMENT_RECEIVED);
        expect(state.getState().txReceived).toBeNull();
        expect(state.getState().treatments).toEqual([]);
    });
    it('resets the current treatment detail but keeps its type', () => {
        state.addTreatment('chemo');
        const tx = state.getState().treatments[0];
        tx.startYear = '2021';
        tx.physicians[0].firstName = 'Ada';
        tx.physicians[0].npi = '1234567890';
        state.getPosition().editingTreatmentIndex = 0;
        state.clearScreenData(SCREENS.TREATMENT_DETAIL);
        expect(state.getState().treatments[0].type).toBe('chemo');
        expect(state.getState().treatments[0].startYear).toBe('');
        expect(state.getState().treatments[0].physicians[0].firstName).toBe('');
        expect(state.getState().treatments[0].physicians[0].npi).toBe('');
    });
    it('clears screening-gate (flag + all screenings)', () => {
        state.getState().screeningDetected = true;
        state.addScreening('breast2D');
        state.clearScreenData(SCREENS.SCREENING_GATE);
        expect(state.getState().screeningDetected).toBeNull();
        expect(state.getState().screenings).toEqual([]);
    });
    it('resets the current screening detail but keeps its type', () => {
        state.addScreening('breast2D');
        state.getState().screenings[0].year = '2019';
        state.getPosition().editingScreeningIndex = 0;
        state.clearScreenData(SCREENS.SCREENING_DETAIL);
        expect(state.getState().screenings[0].type).toBe('breast2D');
        expect(state.getState().screenings[0].year).toBe('');
    });
    it('is a no-op for screens that own no data (review/summary)', () => {
        state.getState().primarySite = 'breast';
        state.clearScreenData(SCREENS.REVIEW);
        state.clearScreenData(SCREENS.TREATMENT_SUMMARY);
        expect(state.getState().primarySite).toBe('breast');
    });
});

// Cursor clamps: removing an item must never leave the loop cursor pointing past the end
// (a stale index makes the detail screens' empty guards fire and Back misbehave).
describe('remove* cursor clamps', () => {
    it('removeTreatment clamps editingTreatmentIndex to the new last item', () => {
        state.addTreatment('chemo');
        state.addTreatment('surgery');
        state.getPosition().editingTreatmentIndex = 1; // forward flow leaves the cursor at the last index
        state.removeTreatment(1);
        expect(state.getPosition().editingTreatmentIndex).toBe(0);
    });
    it('removeScreening clamps editingScreeningIndex to the new last item', () => {
        state.addScreening('breast2D');
        state.addScreening('breastMRI');
        state.getPosition().editingScreeningIndex = 1;
        state.removeScreening(1);
        expect(state.getPosition().editingScreeningIndex).toBe(0);
    });
});
