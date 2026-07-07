// E2E stub for js/shared.js — served in place of the real module via page.route, so the feature
// runs in a real browser without pulling in Firebase/Datadog/etc. Provides only the named exports
// the Self-Report Cancer Diagnosis feature imports from shared.js.

// i18n resolution from an injected dictionary (window.__I18N__). If none is injected, this is a
// no-op and the inline English fallbacks in the templates remain (keeps non-visual tests simple).
const i18nLookup = (key) => {
    const dict = (typeof window !== 'undefined' && window.__I18N__) || {};
    return String(key).split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), dict);
};
const translateNode = (root) => {
    if (!root || !root.querySelectorAll) return root;
    const apply = (node) => {
        const key = node.getAttribute && node.getAttribute('data-i18n');
        if (!key) return;
        const t = i18nLookup(key);
        if (typeof t === 'string') node.innerHTML = t;
    };
    if (root.getAttribute && root.getAttribute('data-i18n')) apply(root);
    root.querySelectorAll('[data-i18n]').forEach(apply);
    return root;
};
export const translateHTML = (source) => {
    if (typeof source === 'string') {
        const tpl = document.createElement('div');
        tpl.innerHTML = source;
        translateNode(tpl);
        return tpl.innerHTML;
    }
    return translateNode(source);
};
export const translateText = (key) => {
    const t = i18nLookup(key);
    return typeof t === 'string' ? t : key;
};
export const escapeHTML = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const hideAnimation = () => {};
export const getMyData = async () => (window.__SRCDX_FIXTURE__ || { code: 200, data: {} });
export const getSelectedLanguage = () => 163149180; // English language cid (surveyLanguage stamp)

export const errorMessage = (id, msg, focus) => {
    const el = document.getElementById(id);
    if (!el || !el.parentNode) return;
    const div = document.createElement('div');
    div.className = 'error-text';
    const span = document.createElement('span');
    span.className = 'form-error';
    span.innerHTML = msg || '';
    div.appendChild(span);
    el.parentNode.appendChild(div);
    el.classList.add('invalid');
    if (focus && typeof el.focus === 'function') el.focus();
};

export const removeAllErrors = () => {
    document.querySelectorAll('.error-text').forEach((e) => e.remove());
    document.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
};

export const allStates = { AL: 1, AK: 2, AZ: 3, CA: 4, DC: 5, MD: 6, NY: 7 };
export const allCountries = { 'United States': 1, 'United Kingdom': 2, Canada: 3, Germany: 4 };

// IHCS site-code -> display-name map (Health Care System Update section reads the signup site).
export const sites = () => (window.__SRCDX_SITES__ || { 1: 'Sanford Health' });
