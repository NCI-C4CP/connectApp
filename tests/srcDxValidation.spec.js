import { describe, it, expect } from 'vitest';
import {
    isScreeningYearOnOrBeforeDiagnosis,
    isTreatmentYearOnOrAfterDiagnosis,
    isValidYearFormat,
    isValidPastYear,
    isValidScreeningYear,
    isNonEmpty,
} from '../js/pages/shareNewHealthInfo/validation.js';

// Pinned "now" so future-year checks are deterministic (current year = 2026).
const NOW = new Date('2026-06-03T12:00:00.000Z');

describe('isValidYearFormat', () => {
    it('accepts 1900s/2000s four-digit years', () => {
        expect(isValidYearFormat('1999')).toBe(true);
        expect(isValidYearFormat('2020')).toBe(true);
        expect(isValidYearFormat(' 2024 ')).toBe(true); // trimmed
    });
    it('rejects malformed years', () => {
        expect(isValidYearFormat('1899')).toBe(false);
        expect(isValidYearFormat('2100')).toBe(false);
        expect(isValidYearFormat('202')).toBe(false);
        expect(isValidYearFormat('20200')).toBe(false);
        expect(isValidYearFormat('2020a')).toBe(false);
        expect(isValidYearFormat('')).toBe(false);
        expect(isValidYearFormat(null)).toBe(false);
        expect(isValidYearFormat(undefined)).toBe(false);
    });
});

describe('isValidPastYear', () => {
    it('accepts valid years at or before the current year', () => {
        expect(isValidPastYear('2020', { now: NOW })).toBe(true);
        expect(isValidPastYear('2026', { now: NOW })).toBe(true);
    });
    it('rejects future years', () => {
        expect(isValidPastYear('2027', { now: NOW })).toBe(false);
        expect(isValidPastYear('2099', { now: NOW })).toBe(false);
    });
    it('rejects malformed years', () => {
        expect(isValidPastYear('abcd', { now: NOW })).toBe(false);
        expect(isValidPastYear('', { now: NOW })).toBe(false);
    });
});

describe('isValidScreeningYear', () => {
    it('allows up to current year + 5', () => {
        expect(isValidScreeningYear('2026', { now: NOW })).toBe(true);
        expect(isValidScreeningYear('2031', { now: NOW })).toBe(true);
    });
    it('rejects beyond the allowance and malformed', () => {
        expect(isValidScreeningYear('2032', { now: NOW })).toBe(false);
        expect(isValidScreeningYear('nope', { now: NOW })).toBe(false);
    });
});

describe('isScreeningYearOnOrBeforeDiagnosis', () => {
    it('accepts screening years in or before the diagnosis year', () => {
        expect(isScreeningYearOnOrBeforeDiagnosis('2020', '2020')).toBe(true);
        expect(isScreeningYearOnOrBeforeDiagnosis('2019', '2020')).toBe(true);
    });
    it('rejects screening years after diagnosis and malformed years', () => {
        expect(isScreeningYearOnOrBeforeDiagnosis('2021', '2020')).toBe(false);
        expect(isScreeningYearOnOrBeforeDiagnosis('nope', '2020')).toBe(false);
        expect(isScreeningYearOnOrBeforeDiagnosis('2019', '')).toBe(false);
    });
});

describe('isTreatmentYearOnOrAfterDiagnosis', () => {
    it('accepts treatment years in or after the diagnosis year', () => {
        expect(isTreatmentYearOnOrAfterDiagnosis('2020', '2020')).toBe(true);
        expect(isTreatmentYearOnOrAfterDiagnosis('2021', '2020')).toBe(true);
    });
    it('rejects treatment years before diagnosis and malformed years', () => {
        expect(isTreatmentYearOnOrAfterDiagnosis('2019', '2020')).toBe(false);
        expect(isTreatmentYearOnOrAfterDiagnosis('nope', '2020')).toBe(false);
        expect(isTreatmentYearOnOrAfterDiagnosis('2020', '')).toBe(false);
    });
});

describe('isNonEmpty', () => {
    it('treats trimmed non-empty strings as present', () => {
        expect(isNonEmpty('x')).toBe(true);
        expect(isNonEmpty('  ')).toBe(false);
        expect(isNonEmpty('')).toBe(false);
    });
    it('treats 0 (e.g. January month code) and other non-null values as present', () => {
        expect(isNonEmpty(0)).toBe(true);
        expect(isNonEmpty(5)).toBe(true);
    });
    it('treats null/undefined as absent', () => {
        expect(isNonEmpty(null)).toBe(false);
        expect(isNonEmpty(undefined)).toBe(false);
    });
});
