import {
    renderQuestion,
    navButtons,
    fieldError,
    clearFieldErrors,
    q4HeaderFallback,
    q4HeaderI18nKey,
} from '../ui.js';
import { SCREENING_OPTIONS, PRIMARY_SITES } from '../constants.js';
import { isScreeningComplete } from '../conditionalLogic.js';

const optionMeta = (key) => SCREENING_OPTIONS.find((o) => o.key === key) || {};

export const renderScreeningRecap = (content, ctx) => {
    const d = ctx.state.getState();
    const siteMeta = PRIMARY_SITES.find((s) => s.key === d.primarySite) || {};

    const chosenChecks = d.screenings.map((scr) => {
        const meta = optionMeta(scr.type);
        return `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="recap_${scr.type}" value="${scr.type}" checked>
                <label class="form-check-label" for="recap_${scr.type}" data-i18n="${meta.i18nKey}">${scr.type}</label>
                <span class="srcdx-info ms-1" data-tooltip-key="${meta.tooltipKey}" tabindex="0" role="img" aria-label="More information">i</span>
            </div>`;
    }).join('');

    renderQuestion(content, `
        <div class="d-flex align-items-start">
            <h2 class="srcdx-question mb-0" data-screen-heading data-i18n="${q4HeaderI18nKey(d.primarySite)}">${q4HeaderFallback(d.primarySite)}</h2>
            <span class="srcdx-info ms-2" data-tooltip-key="shareHealthInfo.scrnDef_routine" tabindex="0" role="img" aria-label="More information">i</span>
        </div>
        <div class="form-check form-check-inline mt-2">
            <input class="form-check-input" type="radio" name="srcdxScrnRecap" id="scrnRecapYes" value="yes" checked>
            <label class="form-check-label" for="scrnRecapYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxScrnRecap" id="scrnRecapNo" value="no">
            <label class="form-check-label" for="scrnRecapNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>
        <div class="mt-4">
            <p class="mb-1"><span class="srcdx-strong" data-i18n="shareHealthInfo.recapChosen">You've chosen the following screenings.</span></p>
            <p data-i18n="shareHealthInfo.recapHelp">We will now ask you for more information about each screening.</p>
            ${siteMeta.i18nKey ? `<h3 class="srcdx-subheading mt-4"><span data-i18n="${siteMeta.i18nKey}">${siteMeta.key || ''}</span>:</h3>` : ''}
            <div id="srcdxRecapList">${chosenChecks}</div>
        </div>
        ${navButtons({ showBack: true })}
    `);

    content.querySelector('#scrnRecapNo').addEventListener('change', () => ctx.answerNoScreening());
    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        d.screenings = d.screenings.filter((scr) => content.querySelector(`#recap_${scr.type}`)?.checked);
        if (d.screenings.length === 0) {
            fieldError(content, 'srcdxRecapList', 'shareHealthInfo.q4TypeRequired', 'Please select at least one screening.');
            return;
        }
        const firstIncompleteIndex = d.screenings.findIndex((s) => !isScreeningComplete(s, { dxYear: d.dxYear }));
        ctx.state.getPosition().editingScreeningIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
        ctx.next();
    });
};
