// Shared DOM render helpers for the Self-Report Cancer Diagnosis process.

import { translateHTML, translateText, errorMessage } from '../../shared.js';
import { MONTHS } from './constants.js';

export const ROOT_ID = 'root';
export const CONTAINER_ID = 'shareHealthInfoRoot';
export const LIVE_REGION_ID = 'srcdxLiveError';

// One-shot skip for in-screen rerenders that should not scroll to the heading.
let suppressHeadingFocus = false;
export const suppressNextHeadingFocus = () => { suppressHeadingFocus = true; };

export const mountContainer = () => {
    const root = document.getElementById(ROOT_ID);
    root.innerHTML = `<div class="row gy-3">
        <div class="col-lg-1"></div>
        <div class="col-lg-10" id="${CONTAINER_ID}"></div>
        <div class="col-lg-1"></div>
    </div>`;
    return document.getElementById(CONTAINER_ID);
};

export const card = (titleKey, titleFallback, bodyHtml) => `
    <div class="card srcdx-card mb-3">
        <div class="srcdx-card-header">
            <span class="srcdx-card-title" data-i18n="${titleKey}">${titleFallback}</span>
            <span class="srcdx-card-chevron" aria-hidden="true"></span>
        </div>
        <div class="srcdx-card-body">${bodyHtml}</div>
    </div>`;

const hcsCard = () => `
    <div class="card srcdx-card srcdx-collapsible srcdx-collapsed mb-3" data-srcdx-card>
        <div class="srcdx-card-header" role="button" tabindex="0" data-srcdx-toggle>
            <span class="srcdx-card-title" data-i18n="shareHealthInfo.hcsHeader">Health Care System Update</span>
            <span class="srcdx-card-chevron" aria-hidden="true"></span>
        </div>
        <div class="srcdx-card-body">
            <p class="mb-0" data-i18n="shareHealthInfo.hcsComingSoon">Coming soon</p>
        </div>
    </div>`;

export const pageShell = (middleHtml) => `
    <h1 class="srcdx-page-header" data-i18n="shareHealthInfo.pageHeader">Share New Health Information</h1>
    <p class="srcdx-page-intro" data-i18n="shareHealthInfo.pageIntro">Throughout your time in Connect, we want to hear about any changes to your health. On this page, you can share updates with us. Check back here occasionally, as we'll add new options to report information over time.</p>
    ${middleHtml}
    ${hcsCard()}`;

export const renderScreen = (content, html) => {
    content.innerHTML = translateHTML(html);

    const live = content.ownerDocument.createElement('div');
    live.id = LIVE_REGION_ID;
    live.className = 'visually-hidden';
    live.setAttribute('role', 'alert');
    live.setAttribute('aria-live', 'assertive');
    content.appendChild(live);

    content.querySelectorAll('[data-srcdx-toggle]').forEach((header) => {
        const cardEl = header.closest('[data-srcdx-card]');
        if (!cardEl) return;
        const toggle = () => cardEl.classList.toggle('srcdx-collapsed');
        header.addEventListener('click', toggle);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });

    // Keep tooltip text on data-i18n so language switches can retranslate it.
    content.querySelectorAll('[data-tooltip-key]').forEach((trigger, i) => {
        if (trigger.querySelector('.srcdx-tooltip')) return;
        const key = trigger.getAttribute('data-tooltip-key');
        const tip = content.ownerDocument.createElement('span');
        tip.className = 'srcdx-tooltip';
        tip.setAttribute('role', 'tooltip');
        tip.id = `srcdx-tt-${i}`;
        tip.setAttribute('data-i18n', key);
        trigger.appendChild(tip);
        translateHTML(tip);
        if (!tip.textContent.trim()) { tip.remove(); return; }
        trigger.setAttribute('aria-describedby', tip.id);
    });

    const heading = content.querySelector('[data-screen-heading]') || content.querySelector('h1, h2');
    if (heading && !suppressHeadingFocus) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        try { heading.focus(); } catch { /* jsdom/no-op */ }
    }
    suppressHeadingFocus = false;
};

export const renderQuestion = (content, bodyHtml) =>
    renderScreen(content, pageShell(card('shareHealthInfo.reportCancerHeader', 'Report a Cancer Diagnosis', bodyHtml)));

export const renderProgressLoadError = (content, onRetry) => {
    renderQuestion(content, `
        <div class="alert alert-danger" role="alert">
            <p class="mb-0" data-i18n="shareHealthInfo.resumeLoadError">A network error has occurred. Try again later.</p>
        </div>
        <button type="button" class="btn btn-primary" id="srcdxRetryLoad" data-i18n="shareHealthInfo.retryButton">refresh this page</button>
    `);
    content.querySelector('#srcdxRetryLoad')?.addEventListener('click', onRetry);
};

export const monthSelect = (id) => `
    <select class="form-control" id="${id}">
        <option value="" data-i18n="shareHealthInfo.selectOption">-- Select --</option>
        ${MONTHS.map((m) => `<option value="${m.value}" data-i18n="${m.i18nKey}">${m.value}</option>`).join('')}
    </select>`;

export const fieldError = (content, fieldId, i18nKey, fallback) => {
    errorMessage(fieldId, `<span data-i18n="${i18nKey}">${fallback}</span>`, false);
    const field = content.querySelector(`#${fieldId}`);
    if (field) {
        // Re-home group errors and translate errorMessage's inserted data-i18n span.
        const inserted = field.parentNode && field.parentNode.lastElementChild;
        if (inserted && inserted.classList.contains('error-text')) {
            if (!field.matches('input, select, textarea')) field.insertAdjacentElement('afterend', inserted);
            translateHTML(inserted);
        }
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', LIVE_REGION_ID);
        const focusTarget = field.matches('input, select, textarea')
            ? field
            : (field.querySelector('input, select, textarea') || field);
        if (focusTarget === field && !field.matches('input, select, textarea') && !field.hasAttribute('tabindex')) {
            field.setAttribute('tabindex', '-1');
        }
        try { focusTarget.focus(); } catch { /* jsdom/no-op */ }
    }
    const live = content.querySelector(`#${LIVE_REGION_ID}`);
    if (live) live.textContent = (translateText && translateText(i18nKey)) || fallback;
};

export const clearFieldErrors = (content) => {
    content.querySelectorAll('.form-error').forEach((el) => {
        const wrapper = el.parentNode;
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    });
    content.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
    content.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
        el.removeAttribute('aria-invalid');
        el.removeAttribute('aria-describedby');
    });
    const live = content.querySelector(`#${LIVE_REGION_ID}`);
    if (live) live.textContent = '';
};

export const navButtons = ({ showBack = true, nextKey = 'shareHealthInfo.nextButton', nextText = 'Next' } = {}) => `
    <div class="srcdx-nav">
        ${showBack
        ? `<button type="button" class="btn btn-light" id="srcdxBack" data-i18n="shareHealthInfo.backButton">Back</button>`
        : `<span></span>`}
        <button type="button" class="btn btn-primary" id="srcdxNext" data-i18n="${nextKey}">${nextText}</button>
    </div>`;

export const showSaveError = (content) => {
    if (!content) return;
    content.querySelector('.srcdx-save-error')?.remove();
    const div = document.createElement('div');
    div.className = 'alert alert-danger srcdx-save-error';
    div.setAttribute('role', 'alert');
    div.innerHTML = '<span data-i18n="shareHealthInfo.saveError">Your progress could not be saved. Please check your connection and try again.</span>';
    translateHTML(div);
    content.prepend(div);
    setTimeout(() => div.remove(), 6000);
};
