import fieldMapping from '../../js/fieldToConceptIdMapping.js';

const sharedStub = `
const SEEN_FLAGS_KEY = 'dashboard_seen_flags_e2e';
const lookup = (key) => String(key).split('.').reduce((value, part) =>
    value && value[part] != null ? value[part] : undefined, window.__I18N__ || {});

export const translateHTML = (source) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = source;
    wrapper.querySelectorAll('[data-i18n]').forEach((node) => {
        const value = lookup(node.getAttribute('data-i18n'));
        if (typeof value === 'string') node.innerHTML = value;
    });
    return wrapper.innerHTML;
};
export const hideAnimation = () => {};
export const questionnaireModules = () => ({});
export const storeResponse = async (patch) => {
    window.__DASHBOARD_STORES__ = (window.__DASHBOARD_STORES__ || []).concat([patch]);
    Object.assign(window.__DASHBOARD_DATA__, patch);
    const persisted = JSON.parse(sessionStorage.getItem(SEEN_FLAGS_KEY) || '{}');
    sessionStorage.setItem(SEEN_FLAGS_KEY, JSON.stringify({ ...persisted, ...patch }));
};
export const isParticipantDataDestroyed = () => false;
export const reportConfiguration = () => ({});
export const setReportAttributes = async (_data, reports) => reports;
export const sitesNotEnrolling = () => ({});
export const setModuleAttributes = async (_data, modules) => modules;
export const checkIfComplete = () => false;
export const escapeHTML = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const logDDRumError = () => {};
`;

const moduleStubs = new Map([
    ['**/js/pages/questionnaire.js', 'export const blockParticipant = () => {};'],
    ['**/js/components/form.js', 'export const renderUserProfile = () => {};'],
    ['**/js/pages/consent.js', 'export const consentTemplate = () => {};'],
    ['**/js/event.js', `
        export const addEventHeardAboutStudy = () => {};
        export const addEventRequestPINForm = () => {};
        export const addEventHealthCareProviderSubmit = () => {};
        export const addEventPinAutoUpperCase = () => {};
        export const addEventHealthProviderModalSubmit = () => {};
        export const addEventToggleSubmit = () => {};
        export const storeParameters = async () => {};
    `],
    ['**/js/pages/healthCareProvider.js', `
        export const heardAboutStudy = () => '';
        export const requestPINTemplate = () => '';
        export const healthCareProvider = () => '';
        export const noLongerEnrollingRender = () => {};
    `],
]);

export const F = fieldMapping;

export const dashboardParticipant = (overrides = {}) => ({
    [F.healthcareProvider]: 1,
    [F.heardAboutStudyForm]: F.yes,
    [F.consentSubmitted]: F.yes,
    [F.userProfileSubmittedAutogen]: F.yes,
    [F.verification]: F.verified,
    [F.consentWithdrawn]: F.no,
    [F.destroyData]: F.no,
    [F.enabledSurveys]: 0,
    verifiedSeen: true,
    updatesSeen: true,
    secondaryDismissed: true,
    newHealthInfoBannerSeen: true,
    ...overrides,
});

export const setupDashboard = async (page, { participant, i18n } = {}) => {
    await page.route('**/js/shared.js', (route) =>
        route.fulfill({ contentType: 'application/javascript', body: sharedStub }));
    for (const [pattern, body] of moduleStubs) {
        await page.route(pattern, (route) =>
            route.fulfill({ contentType: 'application/javascript', body }));
    }
    await page.addInitScript(([data, dictionary]) => {
        let persisted = {};
        try { persisted = JSON.parse(sessionStorage.getItem('dashboard_seen_flags_e2e') || '{}'); }
        catch (_) { persisted = {}; }
        window.__DASHBOARD_DATA__ = { ...data, ...persisted };
        window.__DASHBOARD_STORES__ = [];
        window.__I18N__ = dictionary || {};
        window.bootstrap = { Modal: class Modal { show() {} hide() {} } };
    }, [participant || dashboardParticipant(), i18n || null]);
    await page.goto('/e2e/shareNewHealthInfo/dashboard.harness.html');
    await page.waitForFunction(() => window.__DASHBOARD_RENDERED__ || window.__DASHBOARD_ERROR__);
    const error = await page.evaluate(() => window.__DASHBOARD_ERROR__);
    if (error) throw new Error(error);
};
