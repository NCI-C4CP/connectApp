import { renderQuestion, navButtons, fieldError, clearFieldErrors } from '../ui.js';
import { TREATMENT_TYPES, SCREENS } from '../constants.js';
import { isTreatmentComplete } from '../conditionalLogic.js';
import { makeTreatment } from '../state.js';

export const renderTreatmentReceived = (content, ctx) => {
    const d = ctx.state.getState();
    const selectedTypes = new Set(d.treatments.map((t) => t.type));

    const typeChecks = TREATMENT_TYPES.map((t) => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="tx_${t.key}" value="${t.key}">
            <label class="form-check-label" for="tx_${t.key}" data-i18n="${t.i18nKey}">${t.key}</label>
        </div>`).join('');

    renderQuestion(content, `
        <h2 class="srcdx-question srcdx-question--tight" data-screen-heading data-i18n="shareHealthInfo.q3Header">3. Have you received, are you currently receiving, or are you scheduled to receive treatment for this cancer?</h2>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxTxReceived" id="txReceivedYes" value="yes">
            <label class="form-check-label" for="txReceivedYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxTxReceived" id="txReceivedNo" value="no">
            <label class="form-check-label" for="txReceivedNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>
        <div id="srcdxTxTypes" class="mt-3 ${d.txReceived ? '' : 'd-none'}">
            <p class="mb-1">
                <span class="srcdx-strong" data-i18n="shareHealthInfo.q3SelectTypes">Select each treatment you have received, are currently receiving, or are scheduled to receive.</span>
                <span class="srcdx-info ms-1" data-tooltip-key="shareHealthInfo.q3TxInfo" tabindex="0" role="img" aria-label="More information">i</span>
            </p>
            ${typeChecks}
            <div class="form-group mt-2 ${selectedTypes.has('other') ? '' : 'd-none'}" id="srcdxTxOtherWrap">
                <label for="srcdxTxOtherDescribe" class="visually-hidden" data-i18n="shareHealthInfo.q3OtherDescribe">Other &ndash; describe</label>
                <textarea class="form-control" id="srcdxTxOtherDescribe" rows="3" maxlength="800"></textarea>
            </div>
            <p class="text-muted mt-3 mb-0" data-i18n="shareHealthInfo.q3NextHint">Please fill out information related to this treatment on the next screen. You can add more treatments after this one.</p>
        </div>
        ${navButtons({ showBack: true })}
    `);

    if (d.txReceived === true) content.querySelector('#txReceivedYes').checked = true;
    else if (d.txReceived === false) content.querySelector('#txReceivedNo').checked = true;
    selectedTypes.forEach((type) => {
        const cb = content.querySelector(`#tx_${type}`);
        if (cb) cb.checked = true;
    });
    const otherInput = content.querySelector('#srcdxTxOtherDescribe');
    const existingOther = d.treatments.find((t) => t.type === 'other');
    if (otherInput && existingOther) otherInput.value = existingOther.otherDescribe || '';

    const typesWrap = content.querySelector('#srcdxTxTypes');
    content.querySelectorAll('input[name="srcdxTxReceived"]').forEach((r) =>
        r.addEventListener('change', () => typesWrap.classList.toggle('d-none', r.value !== 'yes')));
    content.querySelector('#tx_other').addEventListener('change', (e) =>
        content.querySelector('#srcdxTxOtherWrap').classList.toggle('d-none', !e.target.checked));

    const harvest = () => {
        const received = content.querySelector('input[name="srcdxTxReceived"]:checked');
        d.txReceived = received ? received.value === 'yes' : null;
        if (d.txReceived) {
            const existing = new Map(d.treatments.map((t) => [t.type, t]));
            const selected = TREATMENT_TYPES
                .filter((t) => content.querySelector(`#tx_${t.key}`).checked)
                .map((t) => t.key);
            d.treatments = selected.map((type) => existing.get(type) || makeTreatment(type));
            const other = d.treatments.find((t) => t.type === 'other');
            if (other && otherInput) other.otherDescribe = otherInput.value.trim();
        } else {
            d.treatments = [];
        }
    };

    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        harvest();
        if (d.txReceived === null) {
            fieldError(content, 'txReceivedYes', 'shareHealthInfo.q3Required', 'Please select Yes or No.');
            return;
        }
        if (d.txReceived && d.treatments.length === 0) {
            fieldError(content, 'srcdxTxTypes', 'shareHealthInfo.q3TypeRequired', 'Please select at least one treatment.');
            return;
        }
        const pos = ctx.state.getPosition();
        pos.editingTreatmentIndex = 0;
        // Review edits must collect detail before returning.
        if (pos.returnTo && d.txReceived && d.treatments.some((t) => !isTreatmentComplete(t))) {
            ctx.recollectSection(SCREENS.TREATMENT_DETAIL);
            return;
        }
        ctx.next();
    });
};
