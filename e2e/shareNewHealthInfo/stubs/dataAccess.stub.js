// E2E stub for the feature's dataAccess.js — served via page.route. Emulates the server-backed
// persistence with sessionStorage so page.reload() resume flows keep working, logs every save
// for write-semantics assertions, and captures the submitted snapshot.

import fieldMapping from '../../fieldToConceptIdMapping.js';
import { parseHcsRow } from './hcsPayload.js';

const KEY = 'srcdx_inprogress_e2e';
const HCS_KEY = 'srcdx_hcs_submitted_e2e';
const hcsMapping = fieldMapping.selfReportHCSUpdate;

const hcsRows = () => {
    try { return JSON.parse(sessionStorage.getItem(HCS_KEY) || '[]'); }
    catch (_) { return []; }
};

// Ordered event log (each save completion vs the submit start) for the submit/save race test.
// Default-off instrumentation: window.__SRCDX_SAVE_DELAY_MS__ holds a save "in flight" so a test
// can prove submit quiesces it (no save commits after the row is finalized).
const order = (e) => { window.__SRCDX_ORDER__ = (window.__SRCDX_ORDER__ || []).concat([e]); };

const parseStateBlob = (stateBlob) => {
    if (!stateBlob || typeof stateBlob !== 'object' || Array.isArray(stateBlob)) return null;
    const savedState = stateBlob.state;
    return savedState && typeof savedState === 'object' && !Array.isArray(savedState) ? savedState : null;
};

export const saveCancerDxProgress = async (snapshot) => {
    window.__SRCDX_SAVES__ = (window.__SRCDX_SAVES__ || []).concat([snapshot]);
    const delay = window.__SRCDX_SAVE_DELAY_MS__ || 0;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (window.__SRCDX_SAVE_FAIL__) { order('saveEnd'); return { code: 500 }; }
    sessionStorage.setItem(KEY, JSON.stringify(snapshot));
    order('saveEnd');
    return { code: 200 };
};

export const loadCancerDxProgress = async () => {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
        const snapshot = JSON.parse(raw);
        const state = parseStateBlob(JSON.parse(snapshot.stateJSON));
        const position = JSON.parse(snapshot.positionJSON);
        if (!state || !position || typeof position !== 'object' || Array.isArray(position)) return null;
        return { state, position };
    } catch (e) {
        return null;
    }
};

export const submitSelfReportCancerDx = async (snapshot) => {
    order('submitStart');
    window.__SRCDX_LAST_PAYLOAD__ = snapshot;
    sessionStorage.removeItem(KEY); // submit finalizes the row server-side
    return { code: 200, stubbed: true };
};

export const getPreviouslyReportedDx = async () => (window.__SRCDX_PRIOR__ || []);

// NPI typeahead transport: default = no matches. Specs that exercise the typeahead pass a
// custom dataAccessBody with a provider fixture instead.
export const searchNPIProviders = async () => [];

// --- Health Care System Update (issue #1658) ---
// Latest-update fixture is a parsed display row (the real getMostRecentHCSUpdate returns the
// parseHcsRow output, not the raw D_ document).
export const getMostRecentHCSUpdate = async () => {
    if (window.__HCS_FETCH_FAIL__) throw new Error('hcs fetch failed (stubbed)');
    if (window.__HCS_LATEST__ !== undefined) return window.__HCS_LATEST__;
    const rows = hcsRows();
    window.__HCS_STORED_ROWS__ = rows;
    return rows.length ? parseHcsRow(rows.at(-1)) : null;
};

export const submitSelfReportHCSUpdate = async (snapshot) => {
    window.__HCS_LAST_PAYLOAD__ = snapshot;
    if (window.__HCS_SUBMIT_FAIL__) return { code: 500 };
    window.__HCS_SUBMITTED__ = (window.__HCS_SUBMITTED__ || []).concat([snapshot]);
    const rows = hcsRows();
    rows.push({
        ...snapshot,
        [`D_${hcsMapping.submittedTimestamp}`]: new Date().toISOString(),
    });
    sessionStorage.setItem(HCS_KEY, JSON.stringify(rows));
    window.__HCS_STORED_ROWS__ = rows;
    return { code: 200 };
};
