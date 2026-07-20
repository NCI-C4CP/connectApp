// Transport layer for Self-Report Cancer Diagnosis.

import { appState, getIdToken, getApiBaseUrl, getAppSettings, translateText } from '../../shared.js';
import fieldMapping from '../../fieldToConceptIdMapping.js';
import { parseHcsRow } from './hcsPayload.js';

const m = fieldMapping.selfReportCancerDx;
const selfReportMonthValues = fieldMapping.selfReportMonthValues;

// Localhost can opt into a connectFaas emulator via local-dev/config.js.
let apiBasePromise = null;
let localConfigLoader = () => import('../../../local-dev/config.js');

export const __setLocalConfigLoaderForTests = (loader) => {
    localConfigLoader = typeof loader === 'function' ? loader : () => import('../../../local-dev/config.js');
    apiBasePromise = null;
};

const getLocalApiBaseOverride = async () => {
    try {
        const cfg = await localConfigLoader();
        return typeof cfg.apiBaseOverride === 'string' && cfg.apiBaseOverride ? cfg.apiBaseOverride : '';
    } catch (e) {
        return '';
    }
};

const resolveApiBase = () => {
    if (!apiBasePromise) {
        apiBasePromise = (async () => {
            const isLocalDev = typeof location !== 'undefined'
                && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
            if (isLocalDev) {
                try {
                    const apiBaseOverride = await getLocalApiBaseOverride();
                    if (apiBaseOverride) return apiBaseOverride;
                } catch (e) { /* ignore optional local config failures */ }
            }
            return getApiBaseUrl();
        })();
    }
    return apiBasePromise;
};

const authedFetch = async (api, { method = 'GET', body, params = {} } = {}) => {
    const idToken = appState.getState().idToken || await getIdToken();
    if (!idToken) return null;
    const base = await resolveApiBase();
    const query = new URLSearchParams({ api, ...params });
    return fetch(`${base}?${query.toString()}`, {
        method,
        headers: {
            Authorization: 'Bearer ' + idToken,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
};

// Never throws. The controller handles revert/retry.
export const saveCancerDxProgress = async (snapshot) => {
    try {
        const response = await authedFetch('storeSelfReportCancerDx', { method: 'POST', body: snapshot, params: { action: 'save' } });
        if (!response) return { code: 0 };
        return await response.json();
    } catch (e) {
        return { code: 0, message: String(e && e.message) };
    }
};

export const submitSelfReportCancerDx = async (snapshot) => {
    try {
        const response = await authedFetch('storeSelfReportCancerDx', { method: 'POST', body: snapshot, params: { action: 'submit' } });
        if (!response) return { code: 0 };
        return await response.json();
    } catch (e) {
        return { code: 0, message: String(e && e.message) };
    }
};

const fetchRows = async () => {
    const response = await authedFetch('getSelfReportCancerDx');
    if (!response) throw new Error('Unable to load self-report cancer diagnosis rows');
    if (!response.ok) throw new Error(`Unable to load self-report cancer diagnosis rows: ${response.status}`);
    const json = await response.json();
    return (json && json.data) || null;
};

const parseStateBlob = (stateBlob) => {
    if (!stateBlob || typeof stateBlob !== 'object' || Array.isArray(stateBlob)) return null;
    const savedState = stateBlob.state;
    return savedState && typeof savedState === 'object' && !Array.isArray(savedState) ? savedState : null;
};

// Parse server-backed resume state. Reject corrupt blobs.
export const loadCancerDxProgress = async () => {
    const rows = await fetchRows();
    const doc = rows && rows.inProgress;
    if (!doc || typeof doc.stateJSON !== 'string' || typeof doc.positionJSON !== 'string') return null;
    try {
        const state = parseStateBlob(JSON.parse(doc.stateJSON));
        if (!state) return null;
        const position = JSON.parse(doc.positionJSON);
        if (!position || typeof position !== 'object' || Array.isArray(position)) return null;
        return { state, position };
    } catch (e) {
        return null;
    }
};

const siteLabelFromCid = (siteCid) => {
    const key = Object.keys(m.cancerSites).find((k) => String(m.cancerSites[k]) === siteCid);
    if (!key) return { i18nKey: '', fallback: '', otherText: '' };
    const i18nKey = `shareHealthInfo.site_${key}`;
    return { i18nKey, fallback: translateText(i18nKey), otherText: '' };
};
const siteLabelFromRow = (row) => {
    const siteGroup = row[`D_${m.sourceQuestions.primarySite}`];
    const siteCid = siteGroup && typeof siteGroup === 'object' && !Array.isArray(siteGroup)
        ? siteGroup[`D_${m.primarySite}`]
        : undefined;
    const label = siteLabelFromCid(siteCid);
    const otherText = String(siteGroup?.[`D_${m.primarySiteOther}`] ?? '').trim();
    return String(siteCid) === String(m.cancerSites.other) ? { ...label, otherText } : label;
};
const monthCodeFromCid = (monthCid) => {
    const code = Object.keys(selfReportMonthValues).find((c) => String(selfReportMonthValues[c]) === monthCid);
    return code === undefined ? null : Number(code);
};

// Best-effort. [] on any failure.
export const getPreviouslyReportedDx = async () => {
    let rows = null;
    try {
        rows = await fetchRows();
    } catch (e) {
        return [];
    }
    if (!rows || !Array.isArray(rows.submitted)) return [];
    return rows.submitted.map((row) => {
        const year = row[`D_${m.dxYear}`] || '';
        const monthCode = monthCodeFromCid(row[`D_${m.dxMonth}`]);
        return {
            location: siteLabelFromRow(row),
            dxDate: monthCode === null ? year : `${String(monthCode + 1).padStart(2, '0')}/${year}`,
        };
    });
};

// Health Care System Update (issue #1658)

// Never throws. The section handles revert/retry.
export const submitSelfReportHCSUpdate = async (snapshot) => {
    try {
        const response = await authedFetch('storeSelfReportHCSUpdate', { method: 'POST', body: snapshot });
        if (!response) return { code: 0 };
        return await response.json();
    } catch (e) {
        return { code: 0, message: String(e && e.message) };
    }
};

/**
 * Most recent submitted HCS update, parsed for display, or null when the participant
 * has never reported a change. Throws on network failure to distinguish "never updated" from "could not load".
 */
export const getMostRecentHCSUpdate = async () => {
    const response = await authedFetch('getSelfReportHCSUpdate');
    if (!response) throw new Error('Unable to load health care system updates');
    if (!response.ok) throw new Error(`Unable to load health care system updates: ${response.status}`);
    const json = await response.json();
    const submitted = json?.data?.submitted;
    if (!Array.isArray(submitted) || !submitted.length) return null;
    // Server returns rows ascending by submitted timestamp; display only the latest.
    return parseHcsRow(submitted[submitted.length - 1]);
};

export const loadShareHealthInfoSettings = async () => {
    try {
        const settings = await getAppSettings(['enableNPIRegistry']);
        return { enableNPIRegistry: settings?.enableNPIRegistry === true };
    } catch (e) {
        return { enableNPIRegistry: false };
    }
};

// NPI typeahead search. Never rejects.
export const searchNPIProviders = async ({ firstName = '', lastName = '' } = {}, { signal } = {}) => {
    try {
        if (!lastName || lastName.trim().length < 2) return [];
        const idToken = appState.getState().idToken || await getIdToken();
        if (!idToken) return [];
        const base = await resolveApiBase();
        const params = new URLSearchParams({ api: 'searchNPIRegistry', lastName: lastName.trim() });
        if (firstName.trim()) params.set('firstName', firstName.trim());
        const response = await fetch(`${base}?${params.toString()}`, {
            headers: { Authorization: 'Bearer ' + idToken },
            signal,
        });
        if (!response.ok) return [];
        const json = await response.json();
        return Array.isArray(json?.data) ? json.data : [];
    } catch (e) {
        return [];
    }
};
