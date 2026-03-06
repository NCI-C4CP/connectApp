import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../js/fieldToConceptIdMapping.js', () => ({
  default: {
    yes: 353358909,
  },
}));

let validateAddressFields;
let applyAddressWrites;
let isPhysicalAddressYesSelected;
let isAltAddressYesSelected;
let addEventTogglePhysicalAddress;
let addEventToggleAltAddress;

beforeAll(async () => {
  ({
    validateAddressFields,
    applyAddressWrites,
    isPhysicalAddressYesSelected,
    isAltAddressYesSelected,
    addEventTogglePhysicalAddress,
    addEventToggleAltAddress,
  } = await import('../js/pages/userProfile.js'));
});

const validFields = {
  line1: '123 Main St',
  line2: '',
  city: 'Bethesda',
  state: 'MD',
  zip: '20892',
};

describe('userProfile helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('validateAddressFields', () => {
    it('returns no errors for valid physical address fields', () => {
      const result = validateAddressFields(validFields, 'physical');
      expect(result.hasError).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it('returns required errors for missing fields', () => {
      const result = validateAddressFields({ ...validFields, line1: '', city: '', state: '' }, 'physical');
      expect(result.hasError).toBe(true);
      expect(result.errors).toContainEqual({
        field: 'line1',
        errorKey: 'form.physicalAddressLine1Field.data-error-required',
      });
      expect(result.errors).toContainEqual({
        field: 'city',
        errorKey: 'form.physicalAddressCityField.data-error-required',
      });
      expect(result.errors).toContainEqual({
        field: 'state',
        errorKey: 'form.physicalAddressStateField.data-error-required',
      });
    });

    it('returns zip format error when zip is not 5 numeric chars', () => {
      const result = validateAddressFields({ ...validFields, zip: '12a' }, 'alt');
      expect(result.errors).toContainEqual({ field: 'zip', errorKey: 'event.zipOnlyNumbers' });
    });

    it('uses alt key namespace for alt addresses', () => {
      const result = validateAddressFields({ ...validFields, line1: '', city: '', state: '', zip: '' }, 'alt');
      const keys = result.errors.map(e => e.errorKey);
      expect(keys).toContain('form.altAddressLine1Field.data-error-required');
      expect(keys).toContain('form.altAddressCityField.data-error-required');
      expect(keys).toContain('form.altAddressStateField.data-error-required');
      expect(keys).toContain('form.altAddressZipField.data-error-required');
    });
  });

  describe('applyAddressWrites', () => {
    const fieldMapping = {
      address1: 'address1',
      address2: 'address2',
      city: 'city',
      state: 'state',
      zip: 'zip',
      isPOBox: 'isPOBox',
      physicalAddress1: 'physicalAddress1',
      physicalAddress2: 'physicalAddress2',
      physicalCity: 'physicalCity',
      physicalState: 'physicalState',
      physicalZip: 'physicalZip',
      altAddress1: 'altAddress1',
      altAddress2: 'altAddress2',
      altCity: 'altCity',
      altState: 'altState',
      altZip: 'altZip',
      doesAltAddressExist: 'doesAltAddressExist',
      isPOBoxAltAddress: 'isPOBoxAltAddress',
      yes: 353358909,
      no: 104430631,
    };

    const mailingAddress = {
      line1: '50 Mailing Ln',
      line2: 'Suite 10',
      city: 'Bethesda',
      state: 'MD',
      zip: '20892',
    };

    const physicalAddress = {
      line1: '100 Physical St',
      line2: 'Unit 2',
      city: 'Bethesda',
      state: 'MD',
      zip: '20892',
    };

    const altAddress = {
      line1: '200 Alt Ave',
      line2: 'Apt 3',
      city: 'Rockville',
      state: 'MD',
      zip: '20850',
    };

    it('always writes mailing address and PO box flags', () => {
      const formData = {};
      applyAddressWrites({
        formData,
        fieldMapping,
        mailingAddress,
        hasPhysicalAddressField: false,
        physicalAddress,
        hasAltAddressField: false,
        altAddress,
        isPOBoxChecked: true,
        isAltPOBoxChecked: false,
      });

      expect(formData[fieldMapping.address1]).toBe('50 Mailing Ln');
      expect(formData[fieldMapping.address2]).toBe('Suite 10');
      expect(formData[fieldMapping.city]).toBe('Bethesda');
      expect(formData[fieldMapping.state]).toBe('MD');
      expect(formData[fieldMapping.zip]).toBe('20892');
      expect(formData[fieldMapping.isPOBox]).toBe(fieldMapping.yes);
      expect(formData[fieldMapping.isPOBoxAltAddress]).toBe(fieldMapping.no);
      // Physical and alt fields should not be written
      expect(formData[fieldMapping.physicalAddress1]).toBeUndefined();
      expect(formData[fieldMapping.altAddress1]).toBeUndefined();
      // Alt does not exist
      expect(formData[fieldMapping.doesAltAddressExist]).toBe(fieldMapping.no);
    });

    it('writes all address types when both flags are true', () => {
      const formData = {};
      applyAddressWrites({
        formData,
        fieldMapping,
        mailingAddress,
        hasPhysicalAddressField: true,
        physicalAddress,
        hasAltAddressField: true,
        altAddress,
        isPOBoxChecked: false,
        isAltPOBoxChecked: true,
      });

      // Mailing
      expect(formData[fieldMapping.address1]).toBe('50 Mailing Ln');
      expect(formData[fieldMapping.isPOBox]).toBe(fieldMapping.no);

      // Physical
      expect(formData[fieldMapping.physicalAddress1]).toBe('100 Physical St');
      expect(formData[fieldMapping.physicalAddress2]).toBe('Unit 2');
      expect(formData[fieldMapping.physicalCity]).toBe('Bethesda');
      expect(formData[fieldMapping.physicalState]).toBe('MD');
      expect(formData[fieldMapping.physicalZip]).toBe('20892');

      // Alternate
      expect(formData[fieldMapping.altAddress1]).toBe('200 Alt Ave');
      expect(formData[fieldMapping.altAddress2]).toBe('Apt 3');
      expect(formData[fieldMapping.altCity]).toBe('Rockville');
      expect(formData[fieldMapping.altState]).toBe('MD');
      expect(formData[fieldMapping.altZip]).toBe('20850');

      // Alt exists and PO box flags
      expect(formData[fieldMapping.doesAltAddressExist]).toBe(fieldMapping.yes);
      expect(formData[fieldMapping.isPOBoxAltAddress]).toBe(fieldMapping.yes);
    });

    it('sets doesAltAddressExist to no when alt fields are empty', () => {
      const formData = {};
      applyAddressWrites({
        formData,
        fieldMapping,
        mailingAddress,
        hasPhysicalAddressField: false,
        physicalAddress,
        hasAltAddressField: true,
        altAddress: { line1: '', line2: '', city: '', state: '', zip: '' },
        isPOBoxChecked: false,
        isAltPOBoxChecked: false,
      });

      expect(formData[fieldMapping.doesAltAddressExist]).toBe(fieldMapping.no);
    });
  });

  describe('radio selection helpers', () => {
    it('isPhysicalAddressYesSelected returns true only when yes radio is checked', () => {
      vi.spyOn(document, 'querySelector')
        .mockReturnValueOnce({ checked: true })
        .mockReturnValueOnce({ checked: false });

      expect(isPhysicalAddressYesSelected()).toBe(true);
      expect(isPhysicalAddressYesSelected()).toBe(false);
    });

    it('isAltAddressYesSelected returns false when radio is missing', () => {
      vi.spyOn(document, 'querySelector').mockReturnValueOnce(null);
      expect(isAltAddressYesSelected()).toBe(false);
    });
  });

  describe('toggle handlers', () => {
    it('addEventTogglePhysicalAddress syncs initial checked state to visible', () => {
      const yesRadioListeners = {};
      const noRadioListeners = {};
      const yesRadio = {
        value: '353358909',
        checked: true,
        addEventListener: (event, callback) => { yesRadioListeners[event] = callback; },
      };
      const noRadio = {
        value: '104430631',
        checked: false,
        addEventListener: (event, callback) => { noRadioListeners[event] = callback; },
      };
      const section = { style: { display: 'none' } };
      const mockDocument = {
        getElementsByName: (name) => (name === 'physicalMailingAddress' ? [yesRadio, noRadio] : []),
        getElementById: (id) => {
          if (id === 'physicalAddressSection') return section;
          return { value: '' };
        },
      };

      vi.stubGlobal('document', mockDocument);

      addEventTogglePhysicalAddress();

      expect(section.style.display).toBe('block');
      expect(typeof yesRadioListeners.change).toBe('function');
      expect(typeof noRadioListeners.change).toBe('function');
    });

    it('addEventToggleAltAddress hides and clears fields when switched to no', () => {
      const yesRadioListeners = {};
      const noRadioListeners = {};
      const yesRadio = {
        value: '353358909',
        checked: true,
        addEventListener: (event, callback) => { yesRadioListeners[event] = callback; },
      };
      const noRadio = {
        value: '104430631',
        checked: false,
        addEventListener: (event, callback) => { noRadioListeners[event] = callback; },
      };

      const section = { style: { display: 'none' } };
      const line1 = { value: '123 Alt St' };
      const line2 = { value: 'Suite 5' };
      const city = { value: 'Rockville' };
      const state = { value: 'MD' };
      const zip = { value: '20850' };
      const poBox = { checked: true };
      const mockDocument = {
        getElementsByName: (name) => (name === 'altMailingAddress' ? [yesRadio, noRadio] : []),
        getElementById: (id) => {
          if (id === 'altAddressSection') return section;
          if (id === 'UPAddress3Line1') return line1;
          if (id === 'UPAddress3Line2') return line2;
          if (id === 'UPAddress3City') return city;
          if (id === 'UPAddress3State') return state;
          if (id === 'UPAddress3Zip') return zip;
          if (id === 'poBoxCheckboxAltAddress') return poBox;
          return null;
        },
      };

      vi.stubGlobal('document', mockDocument);

      addEventToggleAltAddress();
      noRadioListeners.change.call(noRadio);

      expect(section.style.display).toBe('none');
      expect(line1.value).toBe('');
      expect(line2.value).toBe('');
      expect(city.value).toBe('');
      expect(state.value).toBe('');
      expect(zip.value).toBe('');
      expect(poBox.checked).toBe(false);
    });
  });
});
