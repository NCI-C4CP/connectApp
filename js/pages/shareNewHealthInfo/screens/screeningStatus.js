import { renderQuestion, navButtons } from '../ui.js';
import { SCREENING_OPTIONS, PRIMARY_SITES, SCREENS } from '../constants.js';
import { isScreeningComplete } from '../conditionalLogic.js';

const optionMeta = (key) => SCREENING_OPTIONS.find((o) => o.key === key) || {};

export const renderScreeningStatus = (content, ctx) => {
    const d = ctx.state.getState();
    const pos = ctx.state.getPosition();
    const siteMeta = PRIMARY_SITES.find((s) => s.key === d.primarySite) || {};
    const nextIncomplete = d.screenings.find((s) => !isScreeningComplete(s));

    const rows = d.screenings.map((scr) => {
        const meta = optionMeta(scr.type);
        const info = `<span class="srcdx-info ms-1" data-tooltip-key="${meta.tooltipKey}" tabindex="0" role="img" aria-label="More information">i</span>`;
        if (isScreeningComplete(scr)) {
            return `
            <div class="mb-2" data-status-row="${scr.type}">
                <span data-i18n="${meta.i18nKey}">${scr.type}</span>${info}
                <span class="srcdx-status-badge complete" data-i18n="shareHealthInfo.statusComplete">Complete</span>
            </div>`;
        }
        return `
            <div class="form-check" data-status-row="${scr.type}">
                <input class="form-check-input" type="checkbox" id="status_${scr.type}" value="${scr.type}" checked>
                <label class="form-check-label" for="status_${scr.type}" data-i18n="${meta.i18nKey}">${scr.type}</label>${info}
                <span class="srcdx-status-badge pending" data-i18n="shareHealthInfo.statusPending">Pending</span>
            </div>`;
    }).join('');

    renderQuestion(content, `
        <div class="d-flex align-items-start">
            <h2 class="srcdx-question mb-0" data-screen-heading data-i18n="shareHealthInfo.q4Header">4. Was this cancer detected through routine screening?</h2>
            <span class="srcdx-info ms-2" data-tooltip-key="shareHealthInfo.scrnDef_routine" tabindex="0" role="img" aria-label="More information">i</span>
        </div>
        <div class="form-check form-check-inline mt-2">
            <input class="form-check-input" type="radio" name="srcdxScrnStatus" id="scrnStatusYes" value="yes" checked>
            <label class="form-check-label" for="scrnStatusYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxScrnStatus" id="scrnStatusNo" value="no">
            <label class="form-check-label" for="scrnStatusNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>
        <div class="mt-4">
            <p class="mb-1"><span class="srcdx-strong" data-i18n="shareHealthInfo.recapChosen">You've chosen the following screenings.</span></p>
            ${nextIncomplete ? `
            <p id="srcdxStatusNext">
                <span data-i18n="shareHealthInfo.statusAlmostDone">Almost done! Please complete information about your</span>
                <u class="srcdx-strong"><span data-i18n="shareHealthInfo.scrnDetailSite_${d.primarySite}">${d.primarySite}</span> &gt; <span data-i18n="${optionMeta(nextIncomplete.type).i18nKey || ''}">${nextIncomplete.type}</span></u><span data-i18n="shareHealthInfo.scrnDetailIntro2"> screening.</span>
            </p>` : ''}
            ${siteMeta.i18nKey ? `<h3 class="srcdx-subheading mt-4"><span data-i18n="${siteMeta.i18nKey}">${siteMeta.key || ''}</span>:</h3>` : ''}
            <div id="srcdxStatusList">${rows}</div>
        </div>
        ${navButtons({ showBack: true })}
    `);

    content.querySelector('#scrnStatusNo').addEventListener('change', () => ctx.answerNoScreening());
    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.reroute(SCREENS.SCREENING_DETAIL));
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        d.screenings = d.screenings.filter((scr) =>
            isScreeningComplete(scr) || content.querySelector(`#status_${scr.type}`)?.checked);
        const nextIdx = d.screenings.findIndex((s) => !isScreeningComplete(s));
        if (nextIdx === -1) { ctx.next(); return; }
        pos.editingScreeningIndex = nextIdx;
        ctx.reroute(SCREENS.SCREENING_DETAIL);
    });
};
