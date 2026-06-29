import { describe, it, expect } from 'vitest';
import {
    isVerifiedNotWithdrawn,
    shouldShowSiteOther,
    canContinueFromPrimarySite,
    isScreeningEligible,
    getScreeningOptionsForSite,
    canAddPhysician,
    applyOngoingExclusivity,
    isTreatmentComplete,
    isScreeningComplete,
    isDiagnosisSubmittable,
} from '../js/pages/shareNewHealthInfo/conditionalLogic.js';
import {
    participantVerifiedNotWithdrawn,
    participantNotVerified,
    participantWithdrawn,
    participantDataDestroyRequested,
    participantDeceasedEmr,
    participantDeceasedNorc,
} from './fixtures/cancerDiagnosis.js';

const NOW = new Date('2026-06-03T12:00:00.000Z');

describe('isVerifiedNotWithdrawn', () => {
    it('true for verified, not-withdrawn participants', () => {
        expect(isVerifiedNotWithdrawn(participantVerifiedNotWithdrawn)).toBe(true);
        expect(isVerifiedNotWithdrawn(participantDataDestroyRequested)).toBe(true);
        expect(isVerifiedNotWithdrawn(participantDeceasedEmr)).toBe(true);
        expect(isVerifiedNotWithdrawn(participantDeceasedNorc)).toBe(true);
    });
    it('false for not-verified / withdrawn / empty', () => {
        expect(isVerifiedNotWithdrawn(participantNotVerified)).toBe(false);
        expect(isVerifiedNotWithdrawn(participantWithdrawn)).toBe(false);
        expect(isVerifiedNotWithdrawn({})).toBe(false);
    });
});

describe('primary site gating', () => {
    it('shows Other write-in only for "other"', () => {
        expect(shouldShowSiteOther('other')).toBe(true);
        expect(shouldShowSiteOther('breast')).toBe(false);
    });
    it('continues only when a site is selected', () => {
        expect(canContinueFromPrimarySite({ primarySite: 'breast' })).toBe(true);
        expect(canContinueFromPrimarySite({ primarySite: '' })).toBe(false);
        expect(canContinueFromPrimarySite({})).toBe(false);
    });
});

describe('screening eligibility & options', () => {
    it('only breast / colon / lung are screening-eligible', () => {
        expect(isScreeningEligible('breast')).toBe(true);
        expect(isScreeningEligible('colon')).toBe(true);
        expect(isScreeningEligible('lung')).toBe(true);
        expect(isScreeningEligible('prostate')).toBe(false);
        expect(isScreeningEligible('anal')).toBe(false);
    });
    it('returns the correct option set per site', () => {
        expect(getScreeningOptionsForSite('breast')).toEqual(
            ['breast2D', 'breastCEM', 'breastMRI', 'breastUS', 'breastCBE']);
        expect(getScreeningOptionsForSite('lung')).toEqual(['lungCT']);
        expect(getScreeningOptionsForSite('colon')).toEqual(
            ['colonCol', 'colonCT', 'colonSig', 'colonFecal']);
        expect(getScreeningOptionsForSite('prostate')).toEqual([]);
    });
    it('returns a fresh array (not the frozen source)', () => {
        const a = getScreeningOptionsForSite('lung');
        a.push('x');
        expect(getScreeningOptionsForSite('lung')).toEqual(['lungCT']);
    });
});

describe('canAddPhysician (max 10)', () => {
    it('allows up to 10', () => {
        expect(canAddPhysician(0)).toBe(true);
        expect(canAddPhysician(9)).toBe(true);
        expect(canAddPhysician(10)).toBe(false);
        expect(canAddPhysician(11)).toBe(false);
    });
});

describe('applyOngoingExclusivity', () => {
    it('clears end month/year when ongoing', () => {
        expect(applyOngoingExclusivity({ ongoing: true, endMonth: 5, endYear: '2020' }))
            .toEqual({ ongoing: true, endMonth: '', endYear: '' });
    });
    it('leaves end date intact when not ongoing', () => {
        expect(applyOngoingExclusivity({ ongoing: false, endMonth: 5, endYear: '2020' }))
            .toEqual({ ongoing: false, endMonth: 5, endYear: '2020' });
    });
    it('does not mutate the input', () => {
        const tx = { ongoing: true, endYear: '2020' };
        applyOngoingExclusivity(tx);
        expect(tx.endYear).toBe('2020');
    });
});

describe('completeness checks', () => {
    it('isTreatmentComplete requires a type and a valid start year (scheduled/future allowed up to +5)', () => {
        expect(isTreatmentComplete({ type: 'chemo', startYear: '2020' }, { now: NOW })).toBe(true);
        expect(isTreatmentComplete({ type: null, startYear: '2020' }, { now: NOW })).toBe(false);
        expect(isTreatmentComplete({ type: 'chemo', startYear: '' }, { now: NOW })).toBe(false);
        expect(isTreatmentComplete({ type: 'chemo', startYear: '2030' }, { now: NOW })).toBe(true);  // scheduled (future, within +5)
        expect(isTreatmentComplete({ type: 'chemo', startYear: '2099' }, { now: NOW })).toBe(false); // beyond +5
    });
    it('isTreatmentComplete rejects treatment years before the diagnosis year when dxYear is provided', () => {
        expect(isTreatmentComplete({ type: 'chemo', startYear: '2020' }, { now: NOW, dxYear: '2020' })).toBe(true);
        expect(isTreatmentComplete({ type: 'chemo', startYear: '2021' }, { now: NOW, dxYear: '2020' })).toBe(true);
        expect(isTreatmentComplete({ type: 'chemo', startYear: '2019' }, { now: NOW, dxYear: '2020' })).toBe(false);
    });
    it('isScreeningComplete requires a type and a valid screening year', () => {
        expect(isScreeningComplete({ type: 'breast2D', year: '2025' }, { now: NOW })).toBe(true);
        expect(isScreeningComplete({ type: null, year: '2025' }, { now: NOW })).toBe(false);
        expect(isScreeningComplete({ type: 'breast2D', year: '' }, { now: NOW })).toBe(false);
        expect(isScreeningComplete({ type: 'breast2D', year: '2030' }, { now: NOW })).toBe(true);
    });
    it('isScreeningComplete rejects screenings after the diagnosis year when dxYear is provided', () => {
        expect(isScreeningComplete({ type: 'breast2D', year: '2020' }, { now: NOW, dxYear: '2020' })).toBe(true);
        expect(isScreeningComplete({ type: 'breast2D', year: '2019' }, { now: NOW, dxYear: '2020' })).toBe(true);
        expect(isScreeningComplete({ type: 'breast2D', year: '2021' }, { now: NOW, dxYear: '2020' })).toBe(false);
    });
});

describe('isDiagnosisSubmittable', () => {
    it('true for a minimal valid diagnosis (Q3 answered No, no treatment/screening)', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: false, treatments: [], screenings: [] },
            { now: NOW })).toBe(true);
    });
    it('true when Q3 is answered Yes but no optional treatment type is selected', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: true, treatments: [], screenings: [] },
            { now: NOW })).toBe(true);
    });
    it('false without a primary site', () => {
        expect(isDiagnosisSubmittable({ dxYear: '2020' }, { now: NOW })).toBe(false);
    });
    it('false with an invalid diagnosis year', () => {
        expect(isDiagnosisSubmittable({ primarySite: 'breast', txReceived: false, dxYear: '2099' }, { now: NOW })).toBe(false);
    });
    it('true when optional Q3 (treatment received) is unanswered', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: null, treatments: [], screenings: [] },
            { now: NOW })).toBe(true);
    });
    it('ignores stale hidden treatment rows when optional Q3 is unanswered', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: null, treatments: [{ type: 'chemo', startYear: '' }], screenings: [] },
            { now: NOW })).toBe(true);
    });
    it('false if any treatment lacks a valid start year', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'breast', dxYear: '2020', txReceived: true, treatments: [{ type: 'chemo', startYear: '' }], screeningDetected: false },
            { now: NOW })).toBe(false);
    });
    it('false if any treatment start year is before the diagnosis year', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: true, treatments: [{ type: 'chemo', startYear: '2019' }], screenings: [] },
            { now: NOW })).toBe(false);
    });
    it('false if any screening lacks a valid year', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'breast', dxYear: '2020', txReceived: false, screeningDetected: true, screenings: [{ type: 'breast2D', year: '' }] },
            { now: NOW })).toBe(false);
    });
    it('false if any current-site screening year is after the diagnosis year', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'breast', dxYear: '2020', txReceived: false, screeningDetected: true, screenings: [{ type: 'breast2D', year: '2021' }] },
            { now: NOW })).toBe(false);
    });
    it('keeps treatment years after diagnosis accepted when otherwise valid', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: true, treatments: [{ type: 'chemo', startYear: '2021' }], screenings: [] },
            { now: NOW })).toBe(true);
    });
    it('true for a full valid diagnosis', () => {
        expect(isDiagnosisSubmittable({
            primarySite: 'breast', dxYear: '2020', txReceived: true,
            treatments: [{ type: 'chemo', startYear: '2021' }],
            screeningDetected: true,
            screenings: [{ type: 'breast2D', year: '2019' }],
        }, { now: NOW })).toBe(true);
    });

    // Screening-eligible sites must have Q4 answered, and "Yes" needs a valid, site-appropriate screening.
    it('false for a screening-eligible site when Q4 is unanswered (e.g. after editing the site to breast)', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'breast', dxYear: '2020', txReceived: false, screeningDetected: null, screenings: [] },
            { now: NOW })).toBe(false);
    });
    it('true for a screening-eligible site answered "No" (not screen-detected)', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'breast', dxYear: '2020', txReceived: false, screeningDetected: false, screenings: [] },
            { now: NOW })).toBe(true);
    });
    it('false when "Yes" but no screening is valid for the current site (stale wrong-site data only)', () => {
        // breast2D left over after switching the site to colon: not a colon option -> not enough.
        expect(isDiagnosisSubmittable(
            { primarySite: 'colon', dxYear: '2020', txReceived: false, screeningDetected: true, screenings: [{ type: 'breast2D', year: '2019' }] },
            { now: NOW })).toBe(false);
    });
    it('ignores stale wrong-site screenings on a non-eligible site (prostate)', () => {
        expect(isDiagnosisSubmittable(
            { primarySite: 'prostate', dxYear: '2020', txReceived: false, screeningDetected: true, screenings: [{ type: 'breast2D', year: '' }] },
            { now: NOW })).toBe(true);
    });
});
