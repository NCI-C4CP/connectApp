import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../js/fieldToConceptIdMapping.js', () => ({
  default: {
    yes: 353358909,
  },
}));

let validateAddressFields;
let applyConditionalAddressWrites;
let isPhysicalAddressYesSelected;
let isAltAddressYesSelected;
let addEventTogglePhysicalAddress;
let addEventToggleAltAddress;

beforeAll(async () => {
  ({
    validateAddressFields,
    applyConditionalAddressWrites,
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

  describe('applyConditionalAddressWrites', () => {
    const fieldMapping = {
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

    it('does not write when both flags are false', () => {
      const formData = {};
      applyConditionalAddressWrites({
        formData,
        fieldMapping,
        hasPhysicalAddressField: false,
        physicalAddress,
        hasAltAddressField: false,
        altAddress,
      });

      expect(Object.keys(formData)).toHaveLength(0);
    });

    it('writes mapped fields when both flags are true', () => {
      const formData = {};
      applyConditionalAddressWrites({
        formData,
        fieldMapping,
        hasPhysicalAddressField: true,
        physicalAddress,
        hasAltAddressField: true,
        altAddress,
      });

      expect(formData[fieldMapping.physicalAddress1]).toBe('100 Physical St');
      expect(formData[fieldMapping.physicalAddress2]).toBe('Unit 2');
      expect(formData[fieldMapping.physicalCity]).toBe('Bethesda');
      expect(formData[fieldMapping.physicalState]).toBe('MD');
      expect(formData[fieldMapping.physicalZip]).toBe('20892');
      expect(formData[fieldMapping.altAddress1]).toBe('200 Alt Ave');
      expect(formData[fieldMapping.altAddress2]).toBe('Apt 3');
      expect(formData[fieldMapping.altCity]).toBe('Rockville');
      expect(formData[fieldMapping.altState]).toBe('MD');
      expect(formData[fieldMapping.altZip]).toBe('20850');
    });
  });

  describe('radio selection helpers', () => {
    it('isPhysicalAddressYesSelected returns true only when yes radio is checked', () => {
      vi.spyOn(document, 'querySelector').mockReturnValueOnce({ checked: true });
      expect(isPhysicalAddressYesSelected()).toBe(true);

      vi.spyOn(document, 'querySelector').mockReturnValueOnce({ checked: false });
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
