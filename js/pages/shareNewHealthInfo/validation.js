// Pure validators. The `now` option is injectable for deterministic tests.

const YEAR_RE = /^(19|20)\d{2}$/;

export const isValidYearFormat = (value) => YEAR_RE.test(String(value ?? '').trim());

export const isValidPastYear = (value, { now = new Date() } = {}) => {
    const v = String(value ?? '').trim();
    if (!isValidYearFormat(v)) return false;
    return Number(v) <= now.getFullYear();
};

// Treatment/screening may be scheduled up to +futureAllowance years.
export const isValidYearWithAllowance = (value, { now = new Date(), futureAllowance = 5 } = {}) => {
    const v = String(value ?? '').trim();
    if (!isValidYearFormat(v)) return false;
    return Number(v) <= now.getFullYear() + futureAllowance;
};

export const isValidScreeningYear = isValidYearWithAllowance;

export const isScreeningYearOnOrBeforeDiagnosis = (screeningYear, diagnosisYear) => {
    const screening = String(screeningYear ?? '').trim();
    const diagnosis = String(diagnosisYear ?? '').trim();
    if (!isValidYearFormat(screening) || !isValidYearFormat(diagnosis)) return false;
    return Number(screening) <= Number(diagnosis);
};

export const isTreatmentYearOnOrAfterDiagnosis = (treatmentYear, diagnosisYear) => {
    const treatment = String(treatmentYear ?? '').trim();
    const diagnosis = String(diagnosisYear ?? '').trim();
    if (!isValidYearFormat(treatment) || !isValidYearFormat(diagnosis)) return false;
    return Number(treatment) >= Number(diagnosis);
};

export const isNonEmpty = (value) =>
    typeof value === 'string' ? value.trim().length > 0 : value != null;
