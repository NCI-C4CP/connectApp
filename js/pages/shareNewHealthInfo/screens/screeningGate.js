import {
    renderQuestion,
    navButtons,
    fieldError,
    clearFieldErrors,
    q4HeaderFallback,
    q4HeaderI18nKey,
} from '../ui.js';
import { getScreeningOptionsForSite, isScreeningComplete } from '../conditionalLogic.js';
import { SCREENING_OPTIONS, PRIMARY_SITES, SCREENS } from '../constants.js';
import { makeScreening } from '../state.js';

const optionMeta = (key) => SCREENING_OPTIONS.find((o) => o.key === key) || {};

export const renderScreeningGate = (content, ctx) => {
    const d = ctx.state.getState();
    const options = getScreeningOptionsForSite(d.primarySite);
    const selected = new Set(d.screenings.map((s) => s.type));
    const siteMeta = PRIMARY_SITES.find((s) => s.key === d.primarySite) || {};
    const isLung = d.primarySite === 'lung';

    const optionChecks = options.map((key) => {
        const meta = optionMeta(key);
        return `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="scrn_${key}" value="${key}">
                <label class="form-check-label" for="scrn_${key}" data-i18n="${meta.i18nKey}">${key}</label>
                <span class="srcdx-info ms-1" data-tooltip-key="${meta.tooltipKey}" tabindex="0" role="img" aria-label="More information">i</span>
            </div>`;
    }).join('');

    renderQuestion(content, `
        <div class="d-flex align-items-start">
            <h2 class="srcdx-question mb-0" data-screen-heading data-i18n="${q4HeaderI18nKey(d.primarySite)}">${q4HeaderFallback(d.primarySite)}</h2>
            <span class="srcdx-info ms-2" data-tooltip-key="shareHealthInfo.scrnDef_routine" tabindex="0" role="img" aria-label="More information">i</span>
        </div>
        <div class="form-check form-check-inline mt-2">
            <input class="form-check-input" type="radio" name="srcdxScrnDetected" id="scrnDetectedYes" value="yes">
            <label class="form-check-label" for="scrnDetectedYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxScrnDetected" id="scrnDetectedNo" value="no">
            <label class="form-check-label" for="scrnDetectedNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>
        ${isLung ? '' : `<div id="srcdxScrnOptions" class="mt-4 ${d.screeningDetected ? '' : 'd-none'}">
            <p class="mb-1"><span class="srcdx-strong" data-i18n="shareHealthInfo.q4Choose">Choose the screenings that detected your cancer:</span></p>
            <p data-i18n="shareHealthInfo.q4ChooseHelp">You can choose as many screenings as you need. You will be asked for more information about each screening you choose.</p>
            ${siteMeta.i18nKey ? `<h3 class="srcdx-subheading mt-4"><span data-i18n="${siteMeta.i18nKey}">${siteMeta.key || ''}</span>:</h3>` : ''}
            ${optionChecks}
        </div>`}
        ${navButtons({ showBack: true })}
    `);

    if (d.screeningDetected === true) content.querySelector('#scrnDetectedYes').checked = true;
    else if (d.screeningDetected === false) content.querySelector('#scrnDetectedNo').checked = true;
    selected.forEach((type) => { const cb = content.querySelector(`#scrn_${type}`); if (cb) cb.checked = true; });

    const optionsWrap = content.querySelector('#srcdxScrnOptions');
    content.querySelectorAll('input[name="srcdxScrnDetected"]').forEach((r) =>
        r.addEventListener('change', () => optionsWrap?.classList.toggle('d-none', r.value !== 'yes')));

    const harvest = () => {
        const det = content.querySelector('input[name="srcdxScrnDetected"]:checked');
        d.screeningDetected = det ? det.value === 'yes' : null;
        if (d.screeningDetected) {
            const existing = new Map(d.screenings.map((s) => [s.type, s]));
            const sel = isLung ? ['lungCT'] : options.filter((key) => content.querySelector(`#scrn_${key}`)?.checked);
            d.screenings = sel.map((type) => existing.get(type) || makeScreening(type));
        } else {
            d.screenings = [];
        }
    };

    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        harvest();
        if (d.screeningDetected === null) {
            fieldError(content, 'scrnDetectedYes', 'shareHealthInfo.q4Required', 'Please select Yes or No.');
            return;
        }
        if (d.screeningDetected && d.screenings.length === 0) {
            fieldError(content, 'srcdxScrnOptions', 'shareHealthInfo.q4TypeRequired', 'Please select at least one screening.');
            return;
        }
        const pos = ctx.state.getPosition();
        const firstIncompleteIndex = d.screenings.findIndex((s) => !isScreeningComplete(s, { dxYear: d.dxYear }));
        pos.editingScreeningIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
        // Review edits must collect detail before returning.
        if (pos.returnTo && d.screeningDetected && firstIncompleteIndex >= 0) {
            ctx.recollectSection(SCREENS.SCREENING_DETAIL);
            return;
        }
        ctx.next();
    });
};
