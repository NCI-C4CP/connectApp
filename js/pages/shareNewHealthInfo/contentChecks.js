export const isPresent = (value) => value !== undefined && value !== null && value !== '';

export const FACILITY_CONTENT_FIELDS = Object.freeze([
    'line1', 'line2', 'line3', 'line4', 'city', 'state', 'region', 'zip', 'postal', 'country',
]);

export const hasFacilityContent = (facility) =>
    !!facility && FACILITY_CONTENT_FIELDS.some((key) => isPresent(facility[key]));

export const hasPhysicianContent = (physician) =>
    !!physician && ['firstName', 'lastName', 'npi'].some((key) => isPresent(physician[key]));
