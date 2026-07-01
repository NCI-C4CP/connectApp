import { renderQuestion, navButtons, fieldError, clearFieldErrors } from '../ui.js';
import { PRIMARY_SITES } from '../constants.js';
import { shouldShowSiteOther, canContinueFromPrimarySite, isScreeningEligible } from '../conditionalLogic.js';

export const renderPrimarySite = (content, ctx) => {
    const d = ctx.state.getState();

    const options = PRIMARY_SITES.map((s) => `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="srcdxPrimarySite" id="site_${s.key}" value="${s.key}">
            <label class="form-check-label" for="site_${s.key}" data-i18n="${s.i18nKey}">${s.key}</label>
        </div>`).join('');

    renderQuestion(content, `
        <h2 class="srcdx-question" data-screen-heading data-i18n="shareHealthInfo.q1Header">1. What is the primary site of your cancer diagnosis?</h2>
        <form id="srcdxPrimarySiteForm" novalidate>
            <div id="srcdxPrimarySiteOptions">${options}</div>
            <div class="form-group mt-2 ${shouldShowSiteOther(d.primarySite) ? '' : 'd-none'}" id="srcdxOtherWrap">
                <label for="srcdxPrimarySiteOther" class="visually-hidden" data-i18n="shareHealthInfo.q1OtherLabel">Other &ndash; please describe</label>
                <input type="text" class="form-control" id="srcdxPrimarySiteOther" maxlength="800">
            </div>
        </form>
        ${navButtons({ showBack: true })}
    `);

    if (d.primarySite) {
        const r = content.querySelector(`#site_${d.primarySite}`);
        if (r) r.checked = true;
    }
    const otherInput = content.querySelector('#srcdxPrimarySiteOther');
    if (otherInput) otherInput.value = d.primarySiteOther || '';

    content.querySelectorAll('input[name="srcdxPrimarySite"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            content.querySelector('#srcdxOtherWrap').classList.toggle('d-none', !shouldShowSiteOther(radio.value));
        });
    });

    const harvest = () => {
        const checked = content.querySelector('input[name="srcdxPrimarySite"]:checked');
        d.primarySite = checked ? checked.value : null;
        d.primarySiteOther = otherInput ? otherInput.value.trim() : '';
    };

    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        harvest();
        if (!canContinueFromPrimarySite(d)) {
            fieldError(content, 'srcdxPrimarySiteOptions', 'shareHealthInfo.q1Required', 'Please select a cancer site.');
            return;
        }
        if (!isScreeningEligible(d.primarySite)) {
            d.screenings = [];
            d.screeningDetected = null;
        }
        ctx.next();
    });
};
