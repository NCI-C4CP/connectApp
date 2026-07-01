import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDocumentByIdMap } from './helpers.js';
import { registerSharedRuntimeModuleMocks } from './moduleMocks.js';

registerSharedRuntimeModuleMocks();

const USPS_TEST_CASES = {
  success: {
    address: {
      ZIPCode: '80112',
      city: 'DENVER',
      secondaryAddress: '',
      state: 'CO',
      streetAddress: '123 FAKE ST',
    },
    additionalInfo: {
      DPVConfirmation: 'Y',
      business: 'N',
      vacant: 'N',
    },
    matches: [{ code: '31', text: 'Single Response - exact match' }],
  },
  successWithCorrections: {
    address: {
      ZIPCode: '10001',
      city: 'NEW YORK',
      secondaryAddress: '',
      state: 'NY',
      streetAddress: '123 MAIN ST',
    },
    additionalInfo: {
      DPVConfirmation: 'Y',
      business: 'N',
      vacant: 'N',
    },
    matches: [{ code: '31', text: 'Single Response - exact match' }],
  },
  successWithCorrectionCode22: {
    address: {
      streetAddress: '6061 SOUTH BROAD STREET',
      streetAddressAbbreviation: '6061 SOUTH BROAD STREET',
      secondaryAddress: '',
      cityAbbreviation: 'PHILADELPHIA',
      city: 'PHILADELPHIA',
      state: 'PA',
      ZIPCode: '19142',
      ZIPPlus4: '',
      urbanization: '',
    },
    additionalInfo: {
      deliveryPoint: '',
      carrierRoute: '',
      DPVConfirmation: ' ',
      DPVCMRA: '',
      business: '',
      centralDeliveryPoint: '',
      vacant: '',
    },
    corrections: [
      {
        code: '22',
        text: 'Multiple addresses were found for the information you entered, and no default exists.',
      },
    ],
    matches: [
      {
        code: '',
        text: '',
      },
    ],
  },
  successWithSecondaryAddress: {
    address: {
      ZIPCode: '90210',
      city: 'BEVERLY HILLS',
      secondaryAddress: 'APT 5B',
      state: 'CA',
      streetAddress: '123 SUNSET BLVD',
    },
    additionalInfo: {
      DPVConfirmation: 'Y',
      business: 'N',
      vacant: 'N',
    },
    matches: [{ code: '31', text: 'Single Response - exact match' }],
  },
  invalidAddress: {
    error: {
      errors: [{ code: '010005', text: 'Invalid Address' }],
    },
  },
  invalidZipCode: {
    error: {
      errors: [{ code: '010002', text: 'Invalid ZIP Code' }],
    },
  },
  invalidCity: {
    error: {
      errors: [{ code: '010004', text: 'Invalid City' }],
    },
  },
  addressNotFound: {
    error: {
      errors: [{ code: '010001', text: 'Address Not Found' }],
    },
  },
  multipleAddresses: {
    address: {
      ZIPCode: '10001',
      city: 'NEW YORK',
      secondaryAddress: '',
      state: 'NY',
      streetAddress: '123 MAIN ST',
    },
    additionalInfo: {
      DPVConfirmation: 'N',
      business: 'N',
      vacant: 'N',
    },
    matches: [{ code: '32', text: 'Multiple responses found' }],
  },
  missingSecondaryAddress: {
    address: {
      ZIPCode: '10001',
      city: 'NEW YORK',
      secondaryAddress: 'Unit 3A',
      state: 'NY',
      streetAddress: '123 MAIN ST',
    },
    additionalInfo: {
      DPVConfirmation: 'N',
      business: 'N',
      vacant: 'N',
    },
    matches: [{ code: '33', text: 'Default address found, more information needed' }],
  },
  vacantAddress: {
    address: {
      ZIPCode: '10001',
      city: 'NEW YORK',
      secondaryAddress: '',
      state: 'NY',
      streetAddress: '123 MAIN ST',
    },
    additionalInfo: {
      DPVConfirmation: 'Y',
      business: 'N',
      vacant: 'Y',
    },
    matches: [{ code: '31', text: 'Single Response - exact match' }],
  },
  businessAddress: {
    address: {
      ZIPCode: '10001',
      city: 'NEW YORK',
      secondaryAddress: '',
      state: 'NY',
      streetAddress: '123 MAIN ST',
    },
    additionalInfo: {
      DPVConfirmation: 'Y',
      business: 'Y',
      vacant: 'N',
    },
    matches: [{ code: '31', text: 'Single Response - exact match' }],
  },
  dpvConfirmationFailed: {
    address: {
      ZIPCode: '10001',
      city: 'NEW YORK',
      secondaryAddress: '',
      state: 'NY',
      streetAddress: '123 MAIN ST',
    },
    additionalInfo: {
      DPVConfirmation: 'N',
      business: 'N',
      vacant: 'N',
    },
    matches: [{ code: '34', text: 'Address found but not confirmed' }],
  },
  serverError: {
    error: {
      status: 500,
      message: 'Internal Server Error',
    },
  },
  networkError: {
    error: {
      status: 0,
      message: 'Network Error',
    },
  },
  multipleErrors: {
    error: {
      errors: [
        { code: '010002', text: 'Invalid ZIP Code' },
        { code: '010004', text: 'Invalid City' },
      ],
    },
  },
};

let analyzeUSPSAddressSuggestion;
let getUSPSDeliverabilityWarnings;
let mapUSPSErrorsToFieldTargets;
let addressValidation;
let validateAddress;
let appState;

const createFieldElement = (value = '') => ({
  value,
  parentNode: {
    querySelectorAll: vi.fn(() => []),
    appendChild: vi.fn(),
  },
  classList: {
    add: vi.fn(),
  },
  focus: vi.fn(),
});

const installAddressValidationFields = (overrides = {}) => {
  const elements = {
    address1: createFieldElement('123 fake street'),
    address2: createFieldElement(''),
    city: createFieldElement('denver'),
    state: createFieldElement('Colorado'),
    zip: createFieldElement('80112'),
    ...overrides,
  };

  const documentStub = installDocumentByIdMap(elements);
  documentStub.createElement = vi.fn(() => ({
    children: [],
    append(child) {
      this.children.push(child);
    },
    appendChild(child) {
      this.children.push(child);
      if (child?.textContent) this.innerHTML += child.textContent;
    },
    classList: [],
    innerHTML: '',
  }));
  documentStub.createTextNode = vi.fn((textContent) => ({ textContent }));

  return elements;
};

beforeAll(async () => {
  vi.resetModules();
  vi.doUnmock('../js/shared.js');
  const sharedModule = await import('../js/shared.js');
  analyzeUSPSAddressSuggestion = sharedModule.analyzeUSPSAddressSuggestion;
  getUSPSDeliverabilityWarnings = sharedModule.getUSPSDeliverabilityWarnings;
  mapUSPSErrorsToFieldTargets = sharedModule.mapUSPSErrorsToFieldTargets;
  addressValidation = sharedModule.addressValidation;
  validateAddress = sharedModule.validateAddress;
  appState = sharedModule.appState;
});

beforeEach(() => {
  appState.setState({ idToken: 'test-id-token' });
  vi.restoreAllMocks();
});

describe('USPS address validation behavior', () => {
  it('derives deliverability warnings from USPS match metadata', () => {
    const warnings = getUSPSDeliverabilityWarnings(USPS_TEST_CASES.multipleAddresses);

    expect(warnings).toEqual([{ code: 'MULTIPLE', text: 'Multiple responses found' }]);
  });

  it.each(['success', 'successWithCorrections', 'vacantAddress', 'businessAddress'])(
    'marks %s as USPS validated when normalized data exactly matches',
    (caseName) => {
      const response = USPS_TEST_CASES[caseName];
      const result = analyzeUSPSAddressSuggestion({
        streetAddress: response.address.streetAddress.toLowerCase(),
        secondaryAddress: response.address.secondaryAddress,
        city: response.address.city.toLowerCase(),
        state: response.address.state,
        zipCode: response.address.ZIPCode,
        uspsValidationResult: response,
      });

      expect(result.suggestion).toBeNull();
      expect(result.original).toBeNull();
      expect(result.warnings).toEqual([]);
      expect(result.isValidatedByUSPS).toBe(true);
      expect(result.isExactMatch).toBe(true);
    },
  );

  it.each([
    ['successWithSecondaryAddress', { street: '123 Sunset Blvd', city: 'Beverly Hills', state: 'CA', zip: '90210', secondary: '' }],
    ['multipleAddresses', { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', secondary: '' }],
    ['missingSecondaryAddress', { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', secondary: '' }],
    ['dpvConfirmationFailed', { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', secondary: '' }],
  ])('returns unvalidated suggestion flow for %s', (caseName, input) => {
    const response = USPS_TEST_CASES[caseName];
    const result = analyzeUSPSAddressSuggestion({
      streetAddress: input.street,
      secondaryAddress: input.secondary,
      city: input.city,
      state: input.state,
      zipCode: input.zip,
      uspsValidationResult: response,
    });

    expect(result.suggestion).toBeDefined();
    expect(result.original).toBeDefined();
    expect(result.isValidatedByUSPS).toBe(false);
    expect(result.isExactMatch).toBe(false);
  });

  it('maps single USPS error codes to expected field targets', () => {
    const ids = {
      addr1Id: 'address1',
      cityId: 'city',
      stateId: 'state',
      zipId: 'zip',
    };

    const invalidAddress = mapUSPSErrorsToFieldTargets(USPS_TEST_CASES.invalidAddress.error.errors, ids);
    const invalidZip = mapUSPSErrorsToFieldTargets(USPS_TEST_CASES.invalidZipCode.error.errors, ids);
    const invalidCity = mapUSPSErrorsToFieldTargets(USPS_TEST_CASES.invalidCity.error.errors, ids);
    const addressNotFound = mapUSPSErrorsToFieldTargets(USPS_TEST_CASES.addressNotFound.error.errors, ids);

    expect(invalidAddress).toEqual({
      handled: true,
      targets: [{ id: 'address1', i18nKey: 'event.invalidAddress' }],
    });
    expect(invalidZip).toEqual({
      handled: true,
      targets: [{ id: 'zip', i18nKey: 'event.invalidZip' }],
    });
    expect(invalidCity).toEqual({
      handled: true,
      targets: [{ id: 'city', i18nKey: 'event.invalidCity' }],
    });
    expect(addressNotFound).toEqual({
      handled: true,
      targets: [{ id: 'address1', i18nKey: 'event.invalidAddress' }],
    });
  });

  it('maps multi-error USPS responses to multiple field targets', () => {
    const result = mapUSPSErrorsToFieldTargets(USPS_TEST_CASES.multipleErrors.error.errors, {
      addr1Id: 'address1',
      cityId: 'city',
      stateId: 'state',
      zipId: 'zip',
    });

    expect(result.handled).toBe(true);
    expect(result.targets).toEqual([
      { id: 'zip', i18nKey: 'event.invalidZip' },
      { id: 'city', i18nKey: 'event.invalidCity' },
    ]);
  });

  it('validateAddress reads DOM fields and returns the canonical exact-match result', async () => {
    installAddressValidationFields();
    globalThis.fetch = vi.fn(async (_url, options) => ({
      ok: true,
      status: 200,
      json: async () => {
        expect(JSON.parse(options.body)).toEqual({
          streetAddress: '123 fake street',
          secondaryAddress: '',
          city: 'denver',
          state: 'CO',
          zipCode: '80112',
        });
        return USPS_TEST_CASES.success;
      },
    }));

    const result = await validateAddress({
      addr1Id: 'address1',
      addr2Id: 'address2',
      cityId: 'city',
      stateId: 'state',
      zipId: 'zip',
    });

    expect(result).toEqual({
      hasError: false,
      addressComparison: { warnings: [] },
      addressNotFound: false,
      isValidatedByUSPS: true,
    });
  });

  it('validateAddress returns an unverified address warning when USPS is unavailable', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    installAddressValidationFields();
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => USPS_TEST_CASES.serverError,
    }));

    const result = await validateAddress({
      addr1Id: 'address1',
      addr2Id: 'address2',
      cityId: 'city',
      stateId: 'state',
      zipId: 'zip',
    });

    expect(result).toEqual({
      hasError: false,
      addressComparison: {
        warnings: [{
          code: 'SERVICE_UNAVAILABLE',
          text: 'USPS validation unavailable; address not verified',
        }],
      },
      addressNotFound: true,
      isValidatedByUSPS: false,
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('validateAddress marks USPS correction code 22 as address not found', async () => {
    const address = USPS_TEST_CASES.successWithCorrectionCode22.address;
    installAddressValidationFields({
      address1: createFieldElement(address.streetAddress),
      city: createFieldElement(address.city),
      state: createFieldElement(address.state),
      zip: createFieldElement(address.ZIPCode),
    });
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ...USPS_TEST_CASES.successWithCorrectionCode22,
      }),
    }));

    const result = await validateAddress({
      addr1Id: 'address1',
      addr2Id: 'address2',
      cityId: 'city',
      stateId: 'state',
      zipId: 'zip',
    });

    expect(result).toEqual({
      hasError: false,
      addressComparison: { warnings: [] },
      addressNotFound: true,
      isValidatedByUSPS: false,
    });
  });

  it('validateAddress bypasses USPS for international addresses', async () => {
    globalThis.fetch = vi.fn();

    const result = await validateAddress({
      isInternational: true,
      addr1Id: 'address1',
      addr2Id: 'address2',
      cityId: 'city',
      stateId: 'state',
      zipId: 'zip',
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      hasError: false,
      addressComparison: { warnings: [] },
      addressNotFound: false,
      isValidatedByUSPS: false,
    });
  });

  it('addressValidation returns USPS server errors unchanged', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => USPS_TEST_CASES.serverError,
    }));

    const result = await addressValidation({
      streetAddress: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    });

    expect(result).toEqual(USPS_TEST_CASES.serverError);
  });

  it('addressValidation returns network error payload on fetch failures', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw Object.assign(new Error('Network Error'), { status: 0 });
    });

    const result = await addressValidation({
      streetAddress: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    });

    expect(result).toEqual(USPS_TEST_CASES.networkError);
  });
});
