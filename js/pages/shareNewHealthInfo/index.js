// Controller for the Self-Report Cancer Diagnosis flow.

import { getMyData, hideAnimation, getSelectedLanguage } from '../../shared.js';
import { isVerifiedNotWithdrawn } from './conditionalLogic.js';
import {
    getPreviouslyReportedDx, submitSelfReportCancerDx, saveCancerDxProgress, loadCancerDxProgress,
    loadShareHealthInfoSettings,
} from './dataAccess.js';
import { mountContainer, renderProgressLoadError, suppressNextHeadingFocus, showSaveError } from './ui.js';
import { SCREENS } from './constants.js';
import * as state from './state.js';
import { nextRenderableScreen, pushHistory, popHistory, canRenderScreen, fallbackScreen } from './navigation.js';
import { buildProgressSnapshot } from './payload.js';
import { teardownFacilityAddressEvents } from '../../components/facilityAddress.js';
import { teardownNpiTypeaheads } from './npiTypeahead.js';
import { renderLanding } from './screens/landing.js';
import { renderPrimarySite } from './screens/primarySite.js';
import { renderDiagnosisDate } from './screens/diagnosisDate.js';
import { renderTreatmentReceived } from './screens/treatmentReceived.js';
import { renderTreatmentDetail } from './screens/treatmentDetail.js';
import { renderTreatmentSummary, resetConfirmState } from './screens/treatmentSummary.js';
import { renderScreeningGate } from './screens/screeningGate.js';
import { renderScreeningRecap } from './screens/screeningRecap.js';
import { renderScreeningStatus } from './screens/screeningStatus.js';
import { renderScreeningDetail } from './screens/screeningDetail.js';
import { renderReview } from './screens/review.js';
import { renderConfirmation } from './screens/confirmation.js';

let content;
let participant = {};
let currentParticipantKey = null;

let editStateSnapshot = null;
const takeEditSnapshot = () => { editStateSnapshot = JSON.parse(JSON.stringify(state.getState())); };
const discardEditSnapshot = () => { editStateSnapshot = null; };
const restoreEditSnapshot = () => {
    if (editStateSnapshot) state.setState(editStateSnapshot);
    editStateSnapshot = null;
};

const renderers = {
    [SCREENS.PRIMARY_SITE]: renderPrimarySite,
    [SCREENS.DIAGNOSIS_DATE]: renderDiagnosisDate,
    [SCREENS.TREATMENT_RECEIVED]: renderTreatmentReceived,
    [SCREENS.TREATMENT_DETAIL]: renderTreatmentDetail,
    [SCREENS.TREATMENT_SUMMARY]: renderTreatmentSummary,
    [SCREENS.SCREENING_GATE]: renderScreeningGate,
    [SCREENS.SCREENING_RECAP]: renderScreeningRecap,
    [SCREENS.SCREENING_STATUS]: renderScreeningStatus,
    [SCREENS.SCREENING_DETAIL]: renderScreeningDetail,
    [SCREENS.REVIEW]: renderReview,
    [SCREENS.CONFIRMATION]: renderConfirmation,
};

// Per-screen saves are serialized and coalesced. Latest full snapshot wins.
let lastSavedProgress = null;
let hasServerRow = false;
let isSaveInFlight = false;
let pendingSave = null;
let reverting = false;
let savesSuspended = false;
let inFlightSavePromise = null;
let featureFlags = { enableNPIRegistry: false };
let saveGeneration = 0;

const teardownScreenEventSources = () => {
    teardownNpiTypeaheads();
    teardownFacilityAddressEvents();
};

const participantKeyFor = (data = {}) => {
    if (data.Connect_ID != null && data.Connect_ID !== '') return `connect:${data.Connect_ID}`;
    if (data.token != null && data.token !== '') return `token:${data.token}`;
    return '';
};

const resetRuntime = ({ clearParticipant = false } = {}) => {
    saveGeneration += 1;
    pendingSave = null;
    isSaveInFlight = false;
    inFlightSavePromise = null;
    lastSavedProgress = null;
    hasServerRow = false;
    reverting = false;
    savesSuspended = false;
    featureFlags = { enableNPIRegistry: false };
    state.resetState();
    discardEditSnapshot();
    resetConfirmState();
    teardownScreenEventSources();
    if (clearParticipant) {
        participant = {};
        currentParticipantKey = null;
    }
};

export const teardownShareNewHealthInfo = () => {
    resetRuntime({ clearParticipant: true });
};

const captureProgress = () => {
    const progress = { state: state.getState(), position: state.getPosition() };
    return {
        snapshot: buildProgressSnapshot(progress.state, progress.position, { lang: getSelectedLanguage() }),
        progressJson: JSON.stringify(progress),
    };
};

const revertToLastSaved = () => {
    showSaveError(content);
    // First save failed: keep the only in-memory copy until a later full-snapshot save succeeds.
    if (!lastSavedProgress) return;
    reverting = true;
    try {
        state.hydrate(JSON.parse(lastSavedProgress));
        renderScreenId(state.getPosition().screenId);
        showSaveError(content);
    } finally {
        reverting = false;
    }
};

const pumpSaves = () => {
    if (isSaveInFlight || !pendingSave || savesSuspended) return;
    const generation = saveGeneration;
    isSaveInFlight = true;
    const current = pendingSave;
    pendingSave = null;
    inFlightSavePromise = (async () => {
        let ok = false;
        try {
            const res = await saveCancerDxProgress(current.snapshot);
            ok = !!res && res.code === 200;
        } catch (e) {
            ok = false;
        }
        if (generation !== saveGeneration) return;
        isSaveInFlight = false;
        inFlightSavePromise = null;
        if (ok) {
            lastSavedProgress = current.progressJson;
            hasServerRow = true;
        } else if (!pendingSave && !savesSuspended) {
            revertToLastSaved();
        }
        pumpSaves();
    })();
};

const persist = () => {
    if (reverting || savesSuspended) return;
    pendingSave = captureProgress();
    pumpSaves();
};

const quiesceSaves = async () => {
    savesSuspended = true;
    pendingSave = null;
    const inflight = inFlightSavePromise;
    if (inflight) { try { await inflight; } catch (e) { /* only need it settled */ } }
};

const ctx = {
    state,
    isNpiRegistryEnabled: () => featureFlags.enableNPIRegistry === true,
    next() {
        const pos = state.getPosition();
        const wasReturning = !!pos.returnTo;
        const returnTarget = pos.returnTo;
        pos.returnTo = null;
        pos.editMode = null;
        // Commit an edit and restore the pre-edit history exactly.
        if (wasReturning && canRenderScreen(returnTarget, state.getState())) {
            discardEditSnapshot();
            if (pos.editBaseHistory) { pos.history = pos.editBaseHistory; pos.editBaseHistory = null; }
            renderScreenId(returnTarget);
            return;
        }
        if (wasReturning) {
            // If the edit killed its origin, rejoin forward flow on a clean history.
            discardEditSnapshot();
            let history = pos.editBaseHistory || pos.history;
            pos.editBaseHistory = null;
            while (history.length) {
                const top = history[history.length - 1];
                if (top !== pos.screenId && canRenderScreen(top, state.getState())) break;
                history = history.slice(0, -1);
            }
            pos.history = history;
        }
        pos.editBaseHistory = null;
        const target = nextRenderableScreen(pos.screenId, state.getState());
        if (!target) return;
        if (canRenderScreen(pos.screenId, state.getState())) pos.history = pushHistory(pos.history, pos.screenId);
        renderScreenId(target);
    },
    back() {
        const pos = state.getPosition();
        // Edit Back cancels both data and navigation.
        if (pos.returnTo) {
            const target = pos.returnTo;
            pos.returnTo = null;
            pos.editMode = null;
            pos.history = pos.editBaseHistory || popHistory(pos.history).history;
            pos.editBaseHistory = null;
            restoreEditSnapshot();
            renderScreenId(target);
            return;
        }
        pos.editMode = null;
        state.clearScreenData(pos.screenId);
        let screen = null;
        let history = pos.history;
        do {
            const popped = popHistory(history);
            screen = popped.screen;
            history = popped.history;
        } while (screen && screen !== SCREENS.LANDING && !canRenderScreen(screen, state.getState()));
        pos.history = history;
        // Re-enter loop detail from the last item so Back walks through the section correctly.
        if (screen === SCREENS.TREATMENT_DETAIL) pos.editingTreatmentIndex = state.getState().treatments.length - 1;
        if (screen === SCREENS.SCREENING_DETAIL) pos.editingScreeningIndex = state.getState().screenings.length - 1;
        if (!screen || screen === SCREENS.LANDING) showLanding();
        else renderScreenId(screen);
    },
    goTo(screenId, { editingTreatmentIndex, editingScreeningIndex, returnTo = SCREENS.REVIEW, editMode = null } = {}) {
        const pos = state.getPosition();
        if (editingTreatmentIndex != null) pos.editingTreatmentIndex = editingTreatmentIndex;
        if (editingScreeningIndex != null) pos.editingScreeningIndex = editingScreeningIndex;
        pos.returnTo = returnTo;
        pos.editMode = editMode;
        pos.editBaseHistory = [...pos.history];
        takeEditSnapshot();
        pos.history = pushHistory(pos.history, pos.screenId);
        renderScreenId(screenId);
    },
    rerender() {
        renderScreenId(state.getPosition().screenId);
    },
    rerenderInPlace() {
        suppressNextHeadingFocus();
        renderScreenId(state.getPosition().screenId);
    },
    reroute(screenId) {
        renderScreenId(screenId);
    },
    navigate(screenId) {
        const pos = state.getPosition();
        pos.history = pushHistory(pos.history, pos.screenId);
        renderScreenId(screenId);
    },
    answerNoTreatment() {
        const d = state.getState();
        const pos = state.getPosition();
        d.txReceived = false;
        d.treatments = [];
        pos.editingTreatmentIndex = 0;
        if (pos.returnTo) {
            pos.editMode = null;
            this.next();
            return;
        }
        state.clearEditContext();
        renderScreenId(nextRenderableScreen(SCREENS.TREATMENT_RECEIVED, d));
    },
    answerNoScreening() {
        const d = state.getState();
        const pos = state.getPosition();
        d.screeningDetected = false;
        d.screenings = [];
        pos.editingScreeningIndex = 0;
        if (pos.returnTo) {
            pos.editMode = null;
            this.next();
            return;
        }
        state.clearEditContext();
        renderScreenId(nextRenderableScreen(SCREENS.SCREENING_GATE, d));
    },
    recollectSection(detailScreenId) {
        state.getPosition().editMode = 'section';
        this.navigate(detailScreenId);
    },
    async submit() {
        // Prevent a late save from landing after the submit finalizes the row.
        await quiesceSaves();
        const snapshot = buildProgressSnapshot(state.getState(), state.getPosition(), { lang: getSelectedLanguage() });
        const res = await submitSelfReportCancerDx(snapshot);
        if (!res || res.code !== 200) {
            savesSuspended = false;
            throw new Error('Self-report cancer dx submit failed');
        }
        lastSavedProgress = null;
        hasServerRow = false;
        pendingSave = null;
        state.resetState();
        discardEditSnapshot();
        resetConfirmState();
        renderScreenId(SCREENS.CONFIRMATION);
    },
    startAnother() {
        startDiagnosis();
    },
};

const renderScreenId = (screenId) => {
    const renderer = renderers[screenId];
    if (!renderer) { showLanding(); return; }
    if (!canRenderScreen(screenId, state.getState())) {
        renderScreenId(fallbackScreen(screenId));
        return;
    }
    state.getPosition().screenId = screenId;
    if (screenId !== SCREENS.CONFIRMATION) persist();
    teardownScreenEventSources();
    renderer(content, ctx);
};

const startDiagnosis = () => {
    savesSuspended = false;
    state.resetState();
    discardEditSnapshot();
    resetConfirmState();
    const pos = state.getPosition();
    pos.history = [SCREENS.LANDING];
    renderScreenId(SCREENS.PRIMARY_SITE);
};

const showLanding = async () => {
    teardownScreenEventSources();
    let prior = [];
    try {
        prior = (await getPreviouslyReportedDx()) || [];
    } catch (err) {
        console.error('[SelfReportCancerDx] previously-reported fetch failed; rendering landing without the list.', err);
    }
    state.getPosition().screenId = SCREENS.LANDING;
    if (hasServerRow) persist();
    renderLanding(content, { onStart: startDiagnosis, prior });
};

const showProgressLoadError = () => {
    teardownScreenEventSources();
    state.getPosition().screenId = SCREENS.LANDING;
    renderProgressLoadError(content, () => renderShareNewHealthInfo({ data: participant }));
};

export const renderShareNewHealthInfo = async (dataResponse) => {
    const response = dataResponse && dataResponse.data ? dataResponse : await getMyData();
    participant = (response && response.data) || {};
    const nextParticipantKey = participantKeyFor(participant);
    if (currentParticipantKey !== null && nextParticipantKey !== currentParticipantKey) {
        resetRuntime();
    }
    currentParticipantKey = nextParticipantKey;

    if (!isVerifiedNotWithdrawn(participant)) {
        resetRuntime();
        window.location.hash = '#dashboard';
        return;
    }

    content = mountContainer();
    savesSuspended = false;
    featureFlags = await loadShareHealthInfoSettings();

    let saved = null;
    try {
        saved = await loadCancerDxProgress();
    } catch (err) {
        console.error('[SelfReportCancerDx] progress fetch failed; blocking start to avoid replacing an in-progress row.', err);
        showProgressLoadError();
        hideAnimation();
        return;
    }
    const resumeId = saved && saved.state && saved.position && saved.position.screenId;
    if (saved) {
        lastSavedProgress = JSON.stringify(saved);
        hasServerRow = true;
    } else {
        lastSavedProgress = null;
        hasServerRow = false;
        pendingSave = null;
        state.resetState();
        discardEditSnapshot();
        resetConfirmState();
    }
    if (resumeId && renderers[resumeId] && resumeId !== SCREENS.CONFIRMATION && canRenderScreen(resumeId, saved.state)) {
        state.hydrate(saved);
        renderScreenId(resumeId);
    } else {
        await showLanding();
    }
    hideAnimation();
};
