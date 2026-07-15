import { renderQuestion, navButtons, q4HeaderFallback, q4HeaderI18nKey, treatmentTypeLabelHtml } from '../ui.js';
import { escapeHTML, translateHTML, allCountries } from '../../../shared.js';
import { SCREENS, PRIMARY_SITES, SCREENING_OPTIONS, MONTHS } from '../constants.js';
import { isScreeningEligible, isDiagnosisSubmittable, getScreeningOptionsForSite } from '../conditionalLogic.js';
import { hasFacilityContent } from '../contentChecks.js';

const siteI18n = (key) => PRIMARY_SITES.find((s) => s.key === key)?.i18nKey || '';
const scrnI18n = (key) => SCREENING_OPTIONS.find((o) => o.key === key)?.i18nKey || '';
const esc = (v) => escapeHTML(String(v ?? ''));
const editBtn = (target) => `<button type="button" class="btn btn-light btn-sm" data-edit="${target}" data-i18n="shareHealthInfo.edit">Edit</button>`;
const physLine = (p) => `${esc(p.firstName)} ${esc(p.lastName)}`.trim();

const monthAbbr = (month) => {
    if (month === '' || month == null) return '';
    const name = MONTHS[month].i18nKey.split('_')[1];
    const fallback = name.charAt(0).toUpperCase() + name.slice(1, 3);
    return `<span data-i18n="shareHealthInfo.monthAbbr_${name}">${fallback}</span>`;
};
const monthYear = (month, year) => {
    if (!year) return '—';
    const mo = monthAbbr(month);
    return `${mo ? mo + ' ' : ''}${esc(year)}`;
};

const addressBlock = (f) => {
    const regionish = f.isInternational ? f.region : f.state;
    const postalish = f.isInternational ? f.postal : f.zip;
    const cityLine = [f.city, [regionish, postalish].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const countryName = f.isInternational && f.country
        ? Object.keys(allCountries).find((k) => String(allCountries[k]) === String(f.country)) : '';
    const lines = [f.line1, f.line2, f.line3, f.isInternational ? f.line4 : '', cityLine, countryName].filter(Boolean);
    return lines.map((l) => `<div>${esc(l)}</div>`).join('');
};

const expandableRow = (rowId, labelHtml, bodyHtml) => `
    <div class="srcdx-review-row" data-review-row="${rowId}">
        <div class="d-flex justify-content-between align-items-center">
            <span>${labelHtml}</span>
            <button type="button" class="srcdx-expander" data-expander="${rowId}" aria-expanded="false" aria-controls="srcdxRow_${rowId}">
                <span aria-hidden="true">+</span>
                <span class="visually-hidden" data-i18n="shareHealthInfo.toggleDetails">Toggle details</span>
            </button>
        </div>
        <div class="srcdx-review-row-body d-none" id="srcdxRow_${rowId}">${bodyHtml}</div>
    </div>`;

const labeled = (i18nKey, fallback, valueHtml) =>
    valueHtml ? `<p class="mb-1 mt-3"><strong data-i18n="${i18nKey}">${fallback}</strong></p><div>${valueHtml}</div>` : '';

const item = (questionKey, questionFallback, target, answerHtml) => `
    <div class="srcdx-review-item border-bottom py-3">
        <div class="d-flex justify-content-between align-items-start">
            <h3 class="srcdx-question mb-0" data-i18n="${questionKey}">${questionFallback}</h3>
            ${editBtn(target)}
        </div>
        <div class="mt-2">${answerHtml}</div>
    </div>`;

const yesNo = (v) => `<div data-i18n="shareHealthInfo.${v ? 'optYes' : 'optNo'}">${v ? 'Yes' : 'No'}</div>`;

const dateAnswer = (d) => (d.dxYear ? monthYear(d.dxMonth, d.dxYear) : '—');

const treatmentRow = (t, i) => {
    const dates = `${monthYear(t.startMonth, t.startYear)}${t.ongoing
        ? ' (<span data-i18n="shareHealthInfo.txOngoingShort">ongoing</span>)'
        : (t.endYear ? ` &ndash; ${monthYear(t.endMonth, t.endYear)}` : '')}`;
    const phys = t.physicians.filter((p) => p.firstName || p.lastName).map((p) => `<div>${physLine(p)}</div>`).join('');
    const facs = t.facilities.filter(hasFacilityContent)
        .map((f) => `<div class="mb-2">${addressBlock(f)}</div>`).join('');
    const body = `
        ${labeled('shareHealthInfo.txDates', 'Dates of treatment:', dates)}
        ${labeled('shareHealthInfo.physSectionHeader', 'Name of your physician or oncologist:', phys)}
        ${labeled('shareHealthInfo.reviewTxFacility', 'Facility or hospital address where you received, are currently receiving, or are scheduled to receive treatment:', facs)}`;
    return expandableRow(`tx_${i}`, treatmentTypeLabelHtml(t), body);
};

const screeningRow = (s, i) => {
    const phys = (s.physician.firstName || s.physician.lastName) ? `<div>${physLine(s.physician)}</div>` : '';
    const fac = hasFacilityContent(s.facility) ? addressBlock(s.facility) : '';
    const body = `
        ${labeled('shareHealthInfo.scrnDateOfScreening', 'Date of screening:', monthYear(s.month, s.year))}
        ${labeled('shareHealthInfo.scrnPhysSectionHeader', 'Name of your referring physician (e.g., primary care provider, OB/GYN):', phys)}
        ${labeled('shareHealthInfo.reviewScrnFacility', 'Facility or hospital address where you were screened:', fac)}`;
    return expandableRow(`scrn_${i}`, `<span data-i18n="${scrnI18n(s.type)}">${s.type}</span>`, body);
};

export const renderReview = (content, ctx) => {
    const d = ctx.state.getState();
    const showScreening = isScreeningEligible(d.primarySite);

    const siteAnswer = `<span data-i18n="${siteI18n(d.primarySite)}">${esc(d.primarySite) || '—'}</span>${d.primarySite === 'other' && d.primarySiteOther ? ` (${esc(d.primarySiteOther)})` : ''}`;
    const unansweredAnswer = '<div class="text-muted" data-i18n="shareHealthInfo.q4NotAnswered"></div>';
    const txAnswer = (d.txReceived === null || d.txReceived === undefined)
        ? unansweredAnswer
        : `${yesNo(d.txReceived)}${d.txReceived && d.treatments.length
            ? `<p class="srcdx-strong mt-3 mb-1" data-i18n="shareHealthInfo.reportedTreatments">Reported Treatments:</p>${d.treatments.map(treatmentRow).join('')}` : ''}`;
    // Ignore stale wrong-site screenings after a site edit.
    const siteScreenings = d.screenings.filter((s) => getScreeningOptionsForSite(d.primarySite).includes(s.type));
    const groupLabel = `<p class="srcdx-strong mt-3 mb-1"><span data-i18n="shareHealthInfo.scrnDetailSite_${d.primarySite}">${esc(d.primarySite)}</span>:</p>`;
    const scrnAnswer = (d.screeningDetected === null || d.screeningDetected === undefined
            || (d.screeningDetected === true && siteScreenings.length === 0))
        ? unansweredAnswer
        : `${yesNo(d.screeningDetected)}${d.screeningDetected && siteScreenings.length
            ? `<p class="srcdx-strong mt-3 mb-1" data-i18n="shareHealthInfo.reportedScreenings">Reported Screenings:</p>${groupLabel}${siteScreenings.map(screeningRow).join('')}` : ''}`;

    renderQuestion(content, `
        <p class="mb-3" data-screen-heading tabindex="-1"><span data-i18n="shareHealthInfo.reviewHeader">Please review the information below.</span> <span data-i18n="shareHealthInfo.reviewIntro">If anything looks incorrect, click the "Edit" button to go back to that section.</span></p>
        ${item('shareHealthInfo.q1Header', '1. What is the primary site of your cancer diagnosis?', SCREENS.PRIMARY_SITE, siteAnswer)}
        ${item('shareHealthInfo.q2Header', '2. What was the date of your diagnosis?', SCREENS.DIAGNOSIS_DATE, dateAnswer(d))}
        ${item('shareHealthInfo.q3Header', '3. Have you received, are you currently receiving, or are you scheduled to receive treatment for this cancer?', SCREENS.TREATMENT_RECEIVED, txAnswer)}
        ${showScreening ? item(q4HeaderI18nKey(d.primarySite), q4HeaderFallback(d.primarySite), SCREENS.SCREENING_GATE, scrnAnswer) : ''}
        <p class="srcdx-strong mt-4" data-i18n="shareHealthInfo.reviewSubmitHint">If all this information is correct, please click the Submit button.</p>
        <div id="srcdxReviewError" class="error-text" role="alert" aria-live="assertive" tabindex="-1"></div>
        ${navButtons({ showBack: true, nextKey: 'shareHealthInfo.submitButton', nextText: 'Submit' })}
    `);

    content.querySelectorAll('[data-expander]').forEach((btn) =>
        btn.addEventListener('click', () => {
            const body = content.querySelector(`#srcdxRow_${btn.dataset.expander}`);
            const expanded = body.classList.toggle('d-none') === false;
            btn.setAttribute('aria-expanded', String(expanded));
            btn.querySelector('[aria-hidden]').textContent = expanded ? '−' : '+';
        }));

    content.querySelectorAll('[data-edit]').forEach((b) =>
        b.addEventListener('click', () => ctx.goTo(b.dataset.edit, { returnTo: SCREENS.REVIEW })));
    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());

    const submitBtn = content.querySelector('#srcdxNext');
    const errorBox = content.querySelector('#srcdxReviewError');
    const showError = (key) => {
        errorBox.innerHTML = `<span class="form-error" data-i18n="${key}"></span>`;
        translateHTML(errorBox);
        try { errorBox.focus(); } catch { /* no-op */ }
    };
    submitBtn.addEventListener('click', () => {
        if (submitBtn.disabled) return;
        errorBox.innerHTML = '';
        if (!isDiagnosisSubmittable(ctx.state.getState())) {
            showError('shareHealthInfo.reviewIncomplete');
            return;
        }
        submitBtn.disabled = true;
        Promise.resolve(ctx.submit()).catch(() => {
            submitBtn.disabled = false;
            showError('shareHealthInfo.submitError');
        });
    });
};
