// Screen-level DOM tests. Uses a local JSDOM instance (env stays node; the repo's global
// testSetup stubs globalThis.document, so we render into a jsdom element we control). shared.js
// helpers are mocked. Full-flow + auth are covered separately by Playwright.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    translateHTML: (s) => s,
    translateText: (k) => k,
    errorMessage: vi.fn(),
    removeAllErrors: vi.fn(),
    escapeHTML: (s) => s,
}));

import * as shared from '../js/shared.js';
import * as state from '../js/pages/shareNewHealthInfo/state.js';
import { renderPrimarySite } from '../js/pages/shareNewHealthInfo/screens/primarySite.js';
import { renderDiagnosisDate } from '../js/pages/shareNewHealthInfo/screens/diagnosisDate.js';
import { renderTreatmentReceived } from '../js/pages/shareNewHealthInfo/screens/treatmentReceived.js';

let win, content, ctx;

beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>');
    win = dom.window;
    content = win.document.getElementById('c');
    state.resetState();
    ctx = { state, next: vi.fn(), back: vi.fn(), recollectSection: vi.fn(), answerNoTreatment: vi.fn() };
    vi.clearAllMocks();
});

const changeEvent = () => new win.Event('change');

describe('primarySite (Q1)', () => {
    it('renders 24 site options with the Other write-in hidden', () => {
        renderPrimarySite(content, ctx);
        expect(content.querySelectorAll('input[name="srcdxPrimarySite"]')).toHaveLength(24);
        expect(content.querySelector('#srcdxOtherWrap').classList.contains('d-none')).toBe(true);
    });

    it('reveals the Other write-in when Other is selected', () => {
        renderPrimarySite(content, ctx);
        const other = content.querySelector('#site_other');
        other.checked = true;
        other.dispatchEvent(changeEvent());
        expect(content.querySelector('#srcdxOtherWrap').classList.contains('d-none')).toBe(false);
    });

    it('blocks Next without a selection and does not advance', () => {
        renderPrimarySite(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('harvests the selection (incl. Other write-in) and advances on Next', () => {
        renderPrimarySite(content, ctx);
        content.querySelector('#site_other').checked = true;
        content.querySelector('#srcdxPrimarySiteOther').value = 'Gallbladder';
        content.querySelector('#srcdxNext').click();
        expect(state.getState().primarySite).toBe('other');
        expect(state.getState().primarySiteOther).toBe('Gallbladder');
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('repopulates a previously chosen site on re-render', () => {
        state.getState().primarySite = 'breast';
        renderPrimarySite(content, ctx);
        expect(content.querySelector('#site_breast').checked).toBe(true);
    });

    it('wraps the question in the persistent page shell (header + Report card + collapsed HCS) and numbers it', () => {
        renderPrimarySite(content, ctx);
        // Persistent "Share New Health Information" page header.
        expect(content.querySelector('.srcdx-page-header')).not.toBeNull();
        // "Report a Cancer Diagnosis" card wraps the question.
        const cardTitle = content.querySelector('.srcdx-card-title');
        expect(cardTitle?.getAttribute('data-i18n')).toBe('shareHealthInfo.reportCancerHeader');
        // Collapsible "Health Care System Update" card is present.
        expect(content.querySelector('[data-srcdx-toggle]')).not.toBeNull();
        // The question heading is numbered "1.".
        expect(content.querySelector('.srcdx-question').textContent.trim()).toMatch(/^1\./);
    });
});

describe('diagnosisDate (Q2)', () => {
    it('uses English month names as option fallback text while preserving 0-11 values', () => {
        renderDiagnosisDate(content, ctx);
        const options = [...content.querySelectorAll('#srcdxDxMonth option')];
        expect(options[1].value).toBe('0');
        expect(options[1].textContent).toBe('January');
        expect(options[12].value).toBe('11');
        expect(options[12].textContent).toBe('December');
    });

    it('requires a valid (non-future) year', () => {
        renderDiagnosisDate(content, ctx);
        content.querySelector('#srcdxDxYear').value = '99';
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('harvests month code + year and advances', () => {
        renderDiagnosisDate(content, ctx);
        content.querySelector('#srcdxDxMonth').value = '5';
        content.querySelector('#srcdxDxYear').value = '2020';
        content.querySelector('#srcdxNext').click();
        expect(state.getState().dxMonth).toBe(5);
        expect(state.getState().dxYear).toBe('2020');
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('Back does not harvest input (the controller clears on back); it just navigates', () => {
        renderDiagnosisDate(content, ctx);
        content.querySelector('#srcdxDxYear').value = '2019';
        content.querySelector('#srcdxBack').click();
        expect(state.getState().dxYear).toBe(''); // not harvested into state
        expect(ctx.back).toHaveBeenCalledTimes(1);
    });

    it('marks the field aria-invalid and announces the error via the live region', () => {
        renderDiagnosisDate(content, ctx);
        content.querySelector('#srcdxDxYear').value = '99';
        content.querySelector('#srcdxNext').click();
        expect(content.querySelector('#srcdxDxYear').getAttribute('aria-invalid')).toBe('true');
        const live = content.querySelector('#srcdxLiveError');
        expect(live).not.toBeNull();
        expect(live.getAttribute('aria-live')).toBe('assertive');
        expect(live.textContent.length).toBeGreaterThan(0);
    });
});

describe('treatmentReceived (Q3)', () => {
    it('hides treatment types until Yes is selected', () => {
        renderTreatmentReceived(content, ctx);
        expect(content.querySelector('#srcdxTxTypes').classList.contains('d-none')).toBe(true);
        const yes = content.querySelector('#txReceivedYes');
        yes.checked = true;
        yes.dispatchEvent(changeEvent());
        expect(content.querySelector('#srcdxTxTypes').classList.contains('d-none')).toBe(false);
    });

    it('requires a Yes/No selection', () => {
        renderTreatmentReceived(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('Yes requires at least one treatment type', () => {
        renderTreatmentReceived(content, ctx);
        content.querySelector('#txReceivedYes').checked = true;
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('Yes + a type creates one treatment per type and advances', () => {
        renderTreatmentReceived(content, ctx);
        content.querySelector('#txReceivedYes').checked = true;
        content.querySelector('#tx_chemo').checked = true;
        content.querySelector('#srcdxNext').click();
        expect(state.getState().txReceived).toBe(true);
        expect(state.getState().treatments.map((t) => t.type)).toEqual(['chemo']);
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('No clears treatments and advances', () => {
        renderTreatmentReceived(content, ctx);
        content.querySelector('#txReceivedNo').checked = true;
        content.querySelector('#srcdxNext').click();
        expect(state.getState().txReceived).toBe(false);
        expect(state.getState().treatments).toEqual([]);
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });
});
