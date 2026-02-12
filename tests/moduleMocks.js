import { vi } from 'vitest';

export const sharedRuntimeMocks = {
  signInConfig: vi.fn(),
  signInCheckRender: vi.fn(),
  signUpRender: vi.fn(),
  signOut: vi.fn(),
  getFirstSignInISOTime: vi.fn(() => ''),
};

export const eventModuleMocks = {
  removeAllErrors: vi.fn(),
};

export const settingsSharedMocks = {
  hideAnimation: vi.fn(),
  errorMessage: vi.fn(),
  processAuthWithFirebaseAdmin: vi.fn(),
  showAnimation: vi.fn(),
  storeResponse: vi.fn(async () => true),
  translateText: vi.fn((key) => `translated:${key}`),
  languageTranslations: vi.fn(() => ({ 0: 'shared.en', 1: 'shared.es' })),
  emailAddressValidation: vi.fn(async () => ({})),
  emailValidationAnalysis: vi.fn(() => 'VALID'),
  addressValidation: vi.fn(async () => ({})),
  translateHTML: vi.fn((content) => content),
  closeModal: vi.fn(),
  escapeHTML: vi.fn((content) => content),
  analyzeUSPSAddressSuggestion: vi.fn(() => ({
    warnings: [],
    original: undefined,
    suggestion: undefined,
    isValidatedByUSPS: true,
  })),
  mapUSPSErrorsToFieldTargets: vi.fn(() => ({ handled: false, targets: [] })),
  applyUSPSFieldErrors: vi.fn((targets, focus) => focus),
  getUSPSUnvalidatedValue: vi.fn((isValidatedByUSPS, yes, no) => (isValidatedByUSPS ? no : yes)),
  logDDRumAction: vi.fn(),
  logAuthIssue: vi.fn(() => ({ errorCode: 'mock/error', errorCategory: 'unknown' })),
  getAuthErrorMessageKey: vi.fn(() => 'shared.authErrors.default'),
  createTelemetryId: vi.fn(() => 'mock-telemetry-id'),
};

export const registerSharedRuntimeModuleMocks = () => {
  vi.mock('../js/pages/signIn.js', () => ({ signInConfig: sharedRuntimeMocks.signInConfig }));
  vi.mock('../js/pages/homePage.js', () => ({
    signInCheckRender: sharedRuntimeMocks.signInCheckRender,
    signUpRender: sharedRuntimeMocks.signUpRender,
  }));
  vi.mock('../app.js', () => ({ signOut: sharedRuntimeMocks.signOut }));
  vi.mock('../i18n/en.js', () => ({ default: {} }));
  vi.mock('../i18n/es.js', () => ({ default: {} }));
  vi.mock('../js/event.js', () => ({ getFirstSignInISOTime: sharedRuntimeMocks.getFirstSignInISOTime }));
};

export const registerSettingsHelpersModuleMocks = () => {
  vi.mock('../js/shared.js', () => ({
    hideAnimation: settingsSharedMocks.hideAnimation,
    errorMessage: settingsSharedMocks.errorMessage,
    processAuthWithFirebaseAdmin: settingsSharedMocks.processAuthWithFirebaseAdmin,
    showAnimation: settingsSharedMocks.showAnimation,
    storeResponse: settingsSharedMocks.storeResponse,
    validEmailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validNameFormat: /^[A-Za-z .'-]+$/,
    validPhoneNumberFormat: /^\d{10}$/,
    translateText: settingsSharedMocks.translateText,
    languageTranslations: settingsSharedMocks.languageTranslations,
    emailAddressValidation: settingsSharedMocks.emailAddressValidation,
    emailValidationStatus: {
      VALID: 'VALID',
      WARNING: 'WARNING',
      INVALID: 'INVALID',
    },
    emailValidationAnalysis: settingsSharedMocks.emailValidationAnalysis,
    addressValidation: settingsSharedMocks.addressValidation,
    statesWithAbbreviations: {
      CO: 'CO',
      NY: 'NY',
      California: 'CA',
    },
    translateHTML: settingsSharedMocks.translateHTML,
    closeModal: settingsSharedMocks.closeModal,
    escapeHTML: settingsSharedMocks.escapeHTML,
    country3Codes: {},
    analyzeUSPSAddressSuggestion: settingsSharedMocks.analyzeUSPSAddressSuggestion,
    mapUSPSErrorsToFieldTargets: settingsSharedMocks.mapUSPSErrorsToFieldTargets,
    applyUSPSFieldErrors: settingsSharedMocks.applyUSPSFieldErrors,
    getUSPSUnvalidatedValue: settingsSharedMocks.getUSPSUnvalidatedValue,
    logDDRumAction: settingsSharedMocks.logDDRumAction,
    logAuthIssue: settingsSharedMocks.logAuthIssue,
    getAuthErrorMessageKey: settingsSharedMocks.getAuthErrorMessageKey,
    createTelemetryId: settingsSharedMocks.createTelemetryId,
  }));

  vi.mock('../js/event.js', () => ({
    removeAllErrors: eventModuleMocks.removeAllErrors,
  }));
};
