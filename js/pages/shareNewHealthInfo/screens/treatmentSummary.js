import { renderQuestion, navButtons } from '../ui.js';
import { SCREENS } from '../constants.js';

let confirmingIndex = null;

export const renderTreatmentSummary = (content, ctx) => {
    const d = ctx.state.getState();

    const chips = d.treatments.map((t, i) => `
        <div class="d-flex align-items-center mb-2" data-tx-chip="${i}">
            <span class="srcdx-tx-card">
                <button type="button" class="srcdx-tx-remove" data-remove-tx="${i}">
                    <span class="visually-hidden" data-i18n="shareHealthInfo.remove">Remove</span>
                </button>
                <span class="srcdx-tx-name" data-i18n="shareHealthInfo.tx_${t.type}">${t.type}</span>
            </span>
            <button type="button" class="btn btn-link btn-sm ms-2" data-edit-tx="${i}" data-i18n="shareHealthInfo.edit">Edit</button>
        </div>`).join('');

    const removeModal = (confirmingIndex !== null && confirmingIndex < d.treatments.length) ? `
        <div class="srcdx-modal-backdrop" data-srcdx-removemodal>
            <div class="srcdx-modal" role="dialog" aria-modal="true" aria-labelledby="srcdxRemoveMsg">
                <button type="button" class="srcdx-modal-close" data-cancel-remove="${confirmingIndex}" aria-label="Close">&times;</button>
                <p id="srcdxRemoveMsg" class="mb-0" data-i18n="shareHealthInfo.removeConfirm">Are you sure you want to remove this treatment? The information you entered will be deleted.</p>
                <div class="srcdx-modal-actions">
                    <button type="button" class="btn btn-light" data-cancel-remove="${confirmingIndex}" data-i18n="shareHealthInfo.goBack">Go Back</button>
                    <button type="button" class="btn btn-primary" data-confirm-remove="${confirmingIndex}" data-i18n="shareHealthInfo.removeYes">Delete This Treatment</button>
                </div>
            </div>
        </div>` : '';

    renderQuestion(content, `
        <h2 class="srcdx-question srcdx-question--tight" data-screen-heading data-i18n="shareHealthInfo.q3Header">3. Have you received, are you currently receiving, or are you scheduled to receive treatment for this cancer?</h2>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxTxSummaryReceived" id="txSummaryYes" value="yes" checked>
            <label class="form-check-label" for="txSummaryYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxTxSummaryReceived" id="txSummaryNo" value="no">
            <label class="form-check-label" for="txSummaryNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>
        <p class="mb-2 mt-4"><strong data-i18n="shareHealthInfo.reportedTreatments">Reported Treatments:</strong></p>
        <div id="srcdxTxChips">${chips || '<p data-i18n="shareHealthInfo.noTreatments">No treatments reported.</p>'}</div>
        <button type="button" class="btn btn-primary mt-4" id="srcdxAddTreatment" data-i18n="shareHealthInfo.addTreatment">Add Another Treatment</button>
        <p class="mt-3" data-i18n="shareHealthInfo.txSummaryHint">If you have no other treatments to report, hit the Next button.</p>
        ${navButtons({ showBack: true })}
        ${removeModal}
    `);

    content.querySelectorAll('[data-edit-tx]').forEach((b) =>
        b.addEventListener('click', () => ctx.goTo(SCREENS.TREATMENT_DETAIL, {
            editingTreatmentIndex: Number(b.dataset.editTx),
            returnTo: SCREENS.TREATMENT_SUMMARY,
            editMode: 'item',
        })));

    content.querySelectorAll('[data-remove-tx]').forEach((b) =>
        b.addEventListener('click', () => { confirmingIndex = Number(b.dataset.removeTx); ctx.rerenderInPlace(); }));
    content.querySelectorAll('[data-confirm-remove]').forEach((b) =>
        b.addEventListener('click', () => {
            ctx.state.removeTreatment(Number(b.dataset.confirmRemove));
            confirmingIndex = null;
            // Removing the last treatment re-asks Q3 and drops dead detail/summary frames.
            if (ctx.state.getState().treatments.length === 0) {
                ctx.state.getState().txReceived = null;
                const pos = ctx.state.getPosition();
                const i = pos.history.indexOf(SCREENS.TREATMENT_RECEIVED);
                if (i >= 0) pos.history = pos.history.slice(0, i);
                pos.editingTreatmentIndex = 0;
                ctx.state.clearEditContext();
                ctx.reroute(SCREENS.TREATMENT_RECEIVED);
                return;
            }
            ctx.rerenderInPlace();
        }));
    content.querySelectorAll('[data-cancel-remove]').forEach((b) =>
        b.addEventListener('click', () => { confirmingIndex = null; ctx.rerenderInPlace(); }));

    // Trap focus while the modal is open.
    const modal = content.querySelector('.srcdx-modal');
    if (modal) {
        const safeBtn = modal.querySelector('.btn[data-cancel-remove]') || modal.querySelector('button');
        try { safeBtn?.focus(); } catch { /* jsdom no-op */ }
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { confirmingIndex = null; ctx.rerenderInPlace(); return; }
            if (e.key !== 'Tab') return;
            const focusables = [...modal.querySelectorAll('button')];
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = content.ownerDocument.activeElement;
            if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
        });
    }

    content.querySelector('#txSummaryNo').addEventListener('change', () => ctx.answerNoTreatment());

    // Add Another is a cancellable edit so Back preserves existing treatments.
    content.querySelector('#srcdxAddTreatment').addEventListener('click', () =>
        ctx.goTo(SCREENS.TREATMENT_RECEIVED, { returnTo: SCREENS.TREATMENT_SUMMARY }));
    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());
    content.querySelector('#srcdxNext').addEventListener('click', () => ctx.next());
};

export const resetConfirmState = () => { confirmingIndex = null; };
