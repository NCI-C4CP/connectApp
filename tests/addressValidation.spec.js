import { describe, expect, it, vi } from 'vitest';

// Mock event.js dependencies so the module can load
vi.mock('../js/shared.js', () => ({
    allCountries: {},
    dataSavingBtn: vi.fn(),
    storeResponse: vi.fn(),
    validatePin: vi.fn(),
    createParticipantRecord: vi.fn(),
    showAnimation: vi.fn(),
    hideAnimation: vi.fn(),
    sites: {},
    sitesNotEnrolling: [],
    errorMessage: vi.fn(),
    BirthMonths: {},
    getAge: vi.fn(),
    getMyData: vi.fn(),
    hasUserData: vi.fn(),
    retrieveNotifications: vi.fn(),
    toggleNavbarMobileView: vi.fn(),
    appState: {},
    logDDRumError: vi.fn(),
    showErrorAlert: vi.fn(),
    translateHTML: vi.fn((c) => c),
    translateText: vi.fn((k) => k),
    firebaseSignInRender: vi.fn(),
    emailAddressValidation: vi.fn(),
    emailValidationStatus: {},
    emailValidationAnalysis: vi.fn(),
    validEmailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validNameFormat: /^[A-Za-z .'-]+$/,
    addressValidation: vi.fn(),
    statesWithAbbreviations: {},
    escapeHTML: vi.fn((c) => c),
    updateStartDHQParticipantData: vi.fn(),
    mergeAndDeduplicateArrays: vi.fn(),
    analyzeUSPSAddressSuggestion: vi.fn(),
    mapUSPSErrorsToFieldTargets: vi.fn(),
    applyUSPSFieldErrors: vi.fn(),
    getUSPSUnvalidatedValue: vi.fn(),
}));
vi.mock('../js/pages/consent.js', () => ({ consentTemplate: vi.fn() }));
vi.mock('../js/pages/healthCareProvider.js', () => ({
    heardAboutStudy: vi.fn(),
    healthCareProvider: vi.fn(),
    duplicateAccountReminderRender: vi.fn(),
    noLongerEnrollingRender: vi.fn(),
    requestPINTemplate: vi.fn(),
}));
vi.mock('../js/pages/dashboard.js', () => ({ renderDashboard: vi.fn() }));
vi.mock('../js/settingsHelpers.js', () => ({
    suffixToTextMap: {},
    getFormerNameData: vi.fn(),
    formerNameOptions: [],
}));
vi.mock('../js/fieldToConceptIdMapping.js', () => ({ default: {} }));
vi.mock('../js/pages/homePage.js', () => ({ signUpRender: vi.fn() }));

const { validateAddressFields } = await import('../js/event.js');

const validFields = {
    line1: '123 Main St',
    line2: '',
    city: 'Bethesda',
    state: 'MD',
    zip: '20892',
};

describe('validateAddressFields', () => {
    describe('required field checks', () => {
        it('returns no errors when all required fields are present', () => {
            const result = validateAddressFields(validFields, 'physical');
            expect(result.hasError).toBe(false);
            expect(result.errors).toHaveLength(0);
        });

        it('returns error when line1 is missing', () => {
            const result = validateAddressFields({ ...validFields, line1: '' }, 'physical');
            expect(result.hasError).toBe(true);
            expect(result.errors).toContainEqual({
                field: 'line1',
                errorKey: 'form.physicalAddressLine1Field.data-error-required',
            });
        });

        it('returns error when city is missing', () => {
            const result = validateAddressFields({ ...validFields, city: '' }, 'physical');
            expect(result.hasError).toBe(true);
            expect(result.errors).toContainEqual({
                field: 'city',
                errorKey: 'form.physicalAddressCityField.data-error-required',
            });
        });

        it('returns error when state is missing', () => {
            const result = validateAddressFields({ ...validFields, state: '' }, 'physical');
            expect(result.hasError).toBe(true);
            expect(result.errors).toContainEqual({
                field: 'state',
                errorKey: 'form.physicalAddressStateField.data-error-required',
            });
        });

        it('returns error when zip is missing', () => {
            const result = validateAddressFields({ ...validFields, zip: '' }, 'physical');
            expect(result.hasError).toBe(true);
            expect(result.errors).toContainEqual({
                field: 'zip',
                errorKey: 'form.physicalAddressZipField.data-error-required',
            });
        });

        it('returns multiple errors when multiple fields are missing', () => {
            const result = validateAddressFields({ ...validFields, line1: '', city: '', state: '' }, 'physical');
            expect(result.hasError).toBe(true);
            expect(result.errors).toHaveLength(3);
            const errorFields = result.errors.map(e => e.field);
            expect(errorFields).toContain('line1');
            expect(errorFields).toContain('city');
            expect(errorFields).toContain('state');
        });

        it('does not require line2', () => {
            const result = validateAddressFields({ ...validFields, line2: '' }, 'physical');
            expect(result.hasError).toBe(false);
        });
    });

    describe('zip format checks', () => {
        it('accepts a valid 5-digit zip', () => {
            const result = validateAddressFields(validFields, 'physical');
            expect(result.errors.filter(e => e.errorKey === 'event.zipOnlyNumbers')).toHaveLength(0);
        });

        it('returns format error for non-numeric zip', () => {
            const result = validateAddressFields({ ...validFields, zip: 'abcde' }, 'physical');
            expect(result.errors).toContainEqual({
                field: 'zip',
                errorKey: 'event.zipOnlyNumbers',
            });
        });

        it('returns format error for too-short zip', () => {
            const result = validateAddressFields({ ...validFields, zip: '123' }, 'physical');
            expect(result.errors).toContainEqual({
                field: 'zip',
                errorKey: 'event.zipOnlyNumbers',
            });
        });

        it('returns format error for too-long zip', () => {
            const result = validateAddressFields({ ...validFields, zip: '123456' }, 'physical');
            expect(result.errors).toContainEqual({
                field: 'zip',
                errorKey: 'event.zipOnlyNumbers',
            });
        });

        it('does not return format error when zip is empty (only required error)', () => {
            const result = validateAddressFields({ ...validFields, zip: '' }, 'physical');
            const zipErrors = result.errors.filter(e => e.field === 'zip');
            expect(zipErrors).toHaveLength(1);
            expect(zipErrors[0].errorKey).toBe('form.physicalAddressZipField.data-error-required');
        });
    });

    describe('address type i18n key generation', () => {
        it('generates physical address error keys', () => {
            const result = validateAddressFields({ line1: '', line2: '', city: '', state: '', zip: '' }, 'physical');
            const keys = result.errors.map(e => e.errorKey);
            expect(keys).toContain('form.physicalAddressLine1Field.data-error-required');
            expect(keys).toContain('form.physicalAddressCityField.data-error-required');
            expect(keys).toContain('form.physicalAddressStateField.data-error-required');
            expect(keys).toContain('form.physicalAddressZipField.data-error-required');
        });

        it('generates alt address error keys', () => {
            const result = validateAddressFields({ line1: '', line2: '', city: '', state: '', zip: '' }, 'alt');
            const keys = result.errors.map(e => e.errorKey);
            expect(keys).toContain('form.altAddressLine1Field.data-error-required');
            expect(keys).toContain('form.altAddressCityField.data-error-required');
            expect(keys).toContain('form.altAddressStateField.data-error-required');
            expect(keys).toContain('form.altAddressZipField.data-error-required');
        });
    });
});
