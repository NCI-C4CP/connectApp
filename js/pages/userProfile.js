import cId from '../fieldToConceptIdMapping.js';

/**
 * User Profile page helpers.
 *
 * This module centralizes profile-specific helpers for:
 * - Address field validation and error rendering
 * - Conditional address payload writes
 * - Physical/alternate address radio-state checks
 * - Physical/alternate address section toggle behaviors
 */

/**
 * Validates address fields and returns any errors found.
 * Pure function — no DOM access, fully unit-testable.
 *
 * @param {Object} fields - { line1, line2, city, state, zip }
 * @param {string} addressType - 'physical' | 'alt'
 * @returns {{ hasError: boolean, errors: Array<{ field: string, errorKey: string }> }}
 */
export const validateAddressFields = (fields, addressType) => {
    const errors = [];

    if (!fields.line1) errors.push({ field: 'line1', errorKey: `form.${addressType}AddressLine1Field.data-error-required` });
    if (!fields.city)  errors.push({ field: 'city',  errorKey: `form.${addressType}AddressCityField.data-error-required` });
    if (!fields.state) errors.push({ field: 'state', errorKey: `form.${addressType}AddressStateField.data-error-required` });
    if (!fields.zip)   errors.push({ field: 'zip',   errorKey: `form.${addressType}AddressZipField.data-error-required` });

    if (fields.zip && !/^[0-9]{5}$/.test(fields.zip)) {
        errors.push({ field: 'zip', errorKey: 'event.zipOnlyNumbers' });
    }

    return { hasError: errors.length > 0, errors };
};

/**
 * Validates address fields and renders mapped field-level errors to the UI.
 *
 * @param {Object} params
 * @param {string} params.idPrefix - Address element prefix (e.g. `UPAddress2`).
 * @param {string} params.addressType - Address type (`physical` | `alt`).
 * @param {{line1:string, line2:string, city:string, state:string, zip:string}} params.fields - Address values to validate.
 * @param {boolean} params.focus - Current focus flag used by caller validation flow.
 * @param {(id:string, message:string, focus:boolean)=>void} params.errorMessage - Error renderer function.
 * @param {(key:string)=>string} params.translateText - I18n lookup function.
 * @returns {{ result: { hasError: boolean, errors: Array<{ field: string, errorKey: string }> }, focus: boolean, hasError: boolean }}
 */
export const runAddressValidation = ({
    idPrefix,
    addressType,
    fields,
    focus,
    errorMessage,
    translateText,
}) => {
    const fieldSuffixMap = { line1: 'Line1', line2: 'Line2', city: 'City', state: 'State', zip: 'Zip' };
    const result = validateAddressFields(fields, addressType);

    let nextFocus = focus;
    let hasError = false;

    for (const err of result.errors) {
        const elementId = `${idPrefix}${fieldSuffixMap[err.field]}`;
        errorMessage(elementId, `<span data-i18n="${err.errorKey}">${translateText(err.errorKey)}</span>`, nextFocus);
        nextFocus = false;
        hasError = true;
        if (typeof err.errorKey === 'string' && err.errorKey.indexOf('data-error-required') !== -1) {
            console.error('User Profile - Required Field Value', elementId);
        } else {
            console.error('User Profile - Address Validation Error', elementId, err.errorKey);
        }
    }

    return { result, focus: nextFocus, hasError };
};

/**
 * Writes physical and alternate address values to formData only when enabled.
 *
 * @param {Object} params
 * @param {Object} params.formData - Outgoing payload object to mutate.
 * @param {Object} params.fieldMapping - Field mapping object containing address keys.
 * @param {boolean} params.hasPhysicalAddressField - Whether physical address should be persisted.
 * @param {{line1:string, line2:string, city:string, state:string, zip:string}} params.physicalAddress - Physical address values.
 * @param {boolean} params.hasAltAddressField - Whether alternate address should be persisted.
 * @param {{line1:string, line2:string, city:string, state:string, zip:string}} params.altAddress - Alternate address values.
 */
export const applyConditionalAddressWrites = ({
    formData,
    fieldMapping,
    hasPhysicalAddressField,
    physicalAddress,
    hasAltAddressField,
    altAddress,
}) => {
    if (hasPhysicalAddressField) {
        if (physicalAddress.line1 !== "") formData[fieldMapping.physicalAddress1] = physicalAddress.line1;
        if (physicalAddress.line2 !== "") formData[fieldMapping.physicalAddress2] = physicalAddress.line2;
        if (physicalAddress.city !== "") formData[fieldMapping.physicalCity] = physicalAddress.city;
        if (physicalAddress.state !== "") formData[fieldMapping.physicalState] = physicalAddress.state;
        if (physicalAddress.zip !== "") formData[fieldMapping.physicalZip] = physicalAddress.zip;
    }

    if (hasAltAddressField) {
        if (altAddress.line1 !== "") formData[fieldMapping.altAddress1] = altAddress.line1;
        if (altAddress.line2 !== "") formData[fieldMapping.altAddress2] = altAddress.line2;
        if (altAddress.city !== "") formData[fieldMapping.altCity] = altAddress.city;
        if (altAddress.state) formData[fieldMapping.altState] = altAddress.state;
        if (altAddress.zip) formData[fieldMapping.altZip] = altAddress.zip;
    }
};

/**
 * Returns whether the physical address radio selection is currently "Yes".
 *
 * @returns {boolean}
 */
export const isPhysicalAddressYesSelected = () => {
    return document.querySelector(`input[name="physicalMailingAddress"][value="${cId.yes}"]`)?.checked || false;
};

/**
 * Returns whether the alternate address radio selection is currently "Yes".
 *
 * @returns {boolean}
 */
export const isAltAddressYesSelected = () => {
    return document.querySelector(`input[name="altMailingAddress"][value="${cId.yes}"]`)?.checked || false;
};

/**
 * Wires physical address radio toggle behavior and synchronizes initial visibility.
 *
 * Shows physical address section when "Yes" is selected; hides and clears it otherwise.
 */
export const addEventTogglePhysicalAddress = () => {
    const radioButtons = document.getElementsByName('physicalMailingAddress');
    const section = document.getElementById('physicalAddressSection');

    const updatePhysicalAddressSection = (value) => {
        if (value == cId.yes) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';

            const line1 = document.getElementById('UPAddress2Line1');
            const line2 = document.getElementById('UPAddress2Line2');
            const city = document.getElementById('UPAddress2City');
            const state = document.getElementById('UPAddress2State');
            const zip = document.getElementById('UPAddress2Zip');

            if (line1) line1.value = '';
            if (line2) line2.value = '';
            if (city) city.value = '';
            if (state) state.value = '';
            if (zip) zip.value = '';
        }
    };

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            updatePhysicalAddressSection(this.value);
        });
    });

    const selectedRadio = Array.from(radioButtons).find(radio => radio.checked);
    updatePhysicalAddressSection(selectedRadio?.value);
};

/**
 * Wires alternate address radio toggle behavior and synchronizes initial visibility.
 *
 * Shows alternate address section when "Yes" is selected; hides, clears fields,
 * and unchecks alternate PO Box when not selected.
 */
export const addEventToggleAltAddress = () => {
    const altAddressRadioButtons = document.getElementsByName('altMailingAddress');
    const altAddressSection = document.getElementById('altAddressSection');

    const updateAltAddressSection = (value) => {
        if (value == cId.yes) {
            altAddressSection.style.display = 'block';
        } else {
            altAddressSection.style.display = 'none';

            const line1 = document.getElementById('UPAddress3Line1');
            const line2 = document.getElementById('UPAddress3Line2');
            const city = document.getElementById('UPAddress3City');
            const state = document.getElementById('UPAddress3State');
            const zip = document.getElementById('UPAddress3Zip');

            if (line1) line1.value = '';
            if (line2) line2.value = '';
            if (city) city.value = '';
            if (state) state.value = '';
            if (zip) zip.value = '';

            const poBox = document.getElementById('poBoxCheckboxAltAddress');
            if (poBox) poBox.checked = false;
        }
    };

    altAddressRadioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            updateAltAddressSection(this.value);
        });
    });

    const selectedRadio = Array.from(altAddressRadioButtons).find(radio => radio.checked);
    updateAltAddressSection(selectedRadio?.value);
}
