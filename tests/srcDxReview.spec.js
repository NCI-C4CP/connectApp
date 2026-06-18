// Review (edit-from-review) + landing returning-view DOM tests (local JSDOM; shared.js mocked).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    translateHTML: (s) => s,
    escapeHTML: (s) => s,
    allCountries: { 'United States': 1, 'United Kingdom': 2 },
}));

import * as state from '../js/pages/shareNewHealthInfo/state.js';
import { renderReview } from '../js/pages/shareNewHealthInfo/screens/review.js';
import { renderLanding } from '../js/pages/shareNewHealthInfo/screens/landing.js';

let win, content;
beforeEach(() => {
    win = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>').window;
    content = win.document.getElementById('c');
    state.resetState();
    vi.clearAllMocks();
});

const seedBreastDiagnosis = () => {
    const d = state.getState();
    d.primarySite = 'breast';
    d.dxYear = '2020';
    d.txReceived = true;
    d.treatments = [{
        type: 'chemo', startYear: '2021', ongoing: false, endYear: '2022', otherDescribe: '',
        physicians: [{ firstName: 'Ada', lastName: 'Lovelace' }],
        facilities: [{ line1: 'Sibley', city: 'Washington', state: 'DC', isInternational: false, region: '', zip: '20016', line2: '', line3: '', postal: '', country: '' }],
    }];
    d.screeningDetected = true;
    d.screenings = [{ type: 'breast2D', year: '2019', month: '', physician: { firstName: '', lastName: '' }, facility: { line1: '', city: '' } }];
};

describe('review (edit-from-review)', () => {
    it('renders a card + Edit per section (incl. screening for an eligible site)', () => {
        seedBreastDiagnosis();
        const ctx = { state, goTo: vi.fn(), back: vi.fn(), submit: vi.fn() };
        renderReview(content, ctx);
        expect(content.querySelectorAll('[data-edit]')).toHaveLength(4); // site, date, treatment, screening
        expect(content.textContent).toContain('chemo'); // treatment detail summarized
    });

    it('renders expandable rows (collapsed by default) whose toggles reveal the labeled detail (Comp 15)', () => {
        seedBreastDiagnosis();
        state.getState().dxMonth = 10; // November
        const ctx = { state, goTo: vi.fn(), back: vi.fn(), submit: vi.fn() };
        renderReview(content, ctx);
        // Q2 date uses the abbreviated month per comp ("Nov 2020").
        expect(content.textContent).toContain('Nov');
        expect(content.textContent).not.toContain('November');
        // Treatment + screening rows render collapsed with a + toggle.
        const txBody = content.querySelector('#srcdxRow_tx_0');
        expect(txBody.classList.contains('d-none')).toBe(true);
        const toggle = content.querySelector('[data-expander="tx_0"]');
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        toggle.click();
        expect(txBody.classList.contains('d-none')).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        // Expanded body shows the labeled blocks + multi-line address.
        expect(txBody.textContent).toContain('Dates of treatment:');
        expect(txBody.textContent).toContain('Ada Lovelace');
        expect(txBody.textContent).toContain('Washington, DC 20016');
        // Screening group label per comp: "{Site} Cancer:".
        expect(content.querySelector('[data-i18n="shareHealthInfo.scrnDetailSite_breast"]')).not.toBeNull();
        // Bottom submit hint per comp.
        expect(content.querySelector('[data-i18n="shareHealthInfo.reviewSubmitHint"]')).not.toBeNull();
    });

    it('omits the screening card for a non-screening site', () => {
        state.getState().primarySite = 'prostate';
        state.getState().dxYear = '2020';
        const ctx = { state, goTo: vi.fn(), back: vi.fn(), submit: vi.fn() };
        renderReview(content, ctx);
        expect(content.querySelectorAll('[data-edit]')).toHaveLength(3); // no screening section
    });

    it('Edit jumps to the section with returnTo=review', () => {
        seedBreastDiagnosis();
        const ctx = { state, goTo: vi.fn(), back: vi.fn(), submit: vi.fn() };
        renderReview(content, ctx);
        content.querySelector('[data-edit="primarySite"]').click();
        expect(ctx.goTo).toHaveBeenCalledWith('primarySite', { returnTo: 'review' });
    });

    it('Submit triggers the submit action; Back goes back', () => {
        seedBreastDiagnosis();
        const ctx = { state, goTo: vi.fn(), back: vi.fn(), submit: vi.fn() };
        renderReview(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(ctx.submit).toHaveBeenCalledTimes(1);
        content.querySelector('#srcdxBack').click();
        expect(ctx.back).toHaveBeenCalledTimes(1);
    });

    it('blocks Submit (and shows an error) when required fields are incomplete', () => {
        state.getState().primarySite = 'breast'; // no diagnosis year -> not submittable
        const ctx = { state, goTo: vi.fn(), back: vi.fn(), submit: vi.fn() };
        renderReview(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(ctx.submit).not.toHaveBeenCalled();
        expect(content.querySelector('#srcdxReviewError .form-error')).not.toBeNull();
    });
});

describe('landing — previously reported (returning user)', () => {
    it('first-time: shows Add Your Diagnosis and wires onStart', () => {
        const onStart = vi.fn();
        renderLanding(content, { onStart, prior: [] });
        const btn = content.querySelector('#srcdxAddDiagnosis');
        expect(btn).not.toBeNull();
        btn.click();
        expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('returning: lists prior diagnoses (read-only) + Add a Diagnosis', () => {
        const onStart = vi.fn();
        renderLanding(content, { onStart, prior: [{ location: 'Lung', dxDate: '09/2025' }] });
        expect(content.textContent).toContain('Lung');
        expect(content.textContent).toContain('09/2025');
        expect(content.querySelector('#srcdxAddDiagnosis')).not.toBeNull();
    });
});
