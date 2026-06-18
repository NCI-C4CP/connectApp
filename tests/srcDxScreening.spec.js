// Screening gate + detail DOM tests (local JSDOM; shared.js mocked).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    translateHTML: (s) => s,
    translateText: (k) => k,
    errorMessage: vi.fn(),
    removeAllErrors: vi.fn(),
    escapeHTML: (s) => s,
    allStates: { AL: 1, MD: 2, DC: 3 },
    allCountries: { 'United States': 1, 'United Kingdom': 2 },
}));
// screeningDetail imports npiTypeahead -> dataAccess; mock the transport (typeahead behavior
// is covered in srcDxNpiTypeahead.spec.js — here we only assert the wiring).
vi.mock('../js/pages/shareNewHealthInfo/dataAccess.js', () => ({
    searchNPIProviders: vi.fn(async () => []),
}));

import * as shared from '../js/shared.js';
import * as state from '../js/pages/shareNewHealthInfo/state.js';
import { renderScreeningGate } from '../js/pages/shareNewHealthInfo/screens/screeningGate.js';
import { renderScreeningDetail } from '../js/pages/shareNewHealthInfo/screens/screeningDetail.js';
import { renderScreeningRecap } from '../js/pages/shareNewHealthInfo/screens/screeningRecap.js';
import { renderScreeningStatus } from '../js/pages/shareNewHealthInfo/screens/screeningStatus.js';

let win, content;
const makeCtx = (renderFn, { npiEnabled = true } = {}) => {
    const ctx = {
        state,
        isNpiRegistryEnabled: () => npiEnabled,
        next: vi.fn(),
        back: vi.fn(),
        goTo: vi.fn(),
        navigate: vi.fn(),
        reroute: vi.fn(),
        recollectSection: vi.fn(),
        answerNoScreening: vi.fn(),
    };
    ctx.rerender = vi.fn(() => renderFn(content, ctx));
    return ctx;
};

beforeEach(() => {
    win = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>').window;
    content = win.document.getElementById('c');
    state.resetState();
    vi.clearAllMocks();
});

describe('screeningGate (Q4)', () => {
    it('renders the bold choose-line, regular help text, and the site label (per comp)', () => {
        state.getState().primarySite = 'breast';
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        const choose = content.querySelector('[data-i18n="shareHealthInfo.q4Choose"]');
        expect(choose.classList.contains('srcdx-strong')).toBe(true); // bold lead-in
        const help = content.querySelector('[data-i18n="shareHealthInfo.q4ChooseHelp"]');
        expect(help.classList.contains('text-muted')).toBe(false);    // regular body color
        const siteLabel = content.querySelector('h3.srcdx-subheading');
        expect(siteLabel).not.toBeNull();                              // site group label
        // Trailing colon lives in markup outside the data-i18n span (the span reuses the colon-free
        // Q1 site string, and translateHTML would wipe an in-span colon on language switch).
        expect(siteLabel.textContent.trim().endsWith(':')).toBe(true);
        expect(siteLabel.querySelector('[data-i18n]').textContent).not.toContain(':');
    });

    beforeEach(() => { state.getState().primarySite = 'breast'; });

    it('renders the 5 breast screening options, hidden until Yes', () => {
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        expect(content.querySelectorAll('#srcdxScrnOptions .form-check')).toHaveLength(5);
        expect(content.querySelector('#srcdxScrnOptions').classList.contains('d-none')).toBe(true);
        const yes = content.querySelector('#scrnDetectedYes');
        yes.checked = true; yes.dispatchEvent(new win.Event('change'));
        expect(content.querySelector('#srcdxScrnOptions').classList.contains('d-none')).toBe(false);
    });

    it('requires a Yes/No selection', () => {
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('No clears screenings and advances', () => {
        state.addScreening('breast2D');
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        content.querySelector('#scrnDetectedNo').checked = true;
        content.querySelector('#srcdxNext').click();
        expect(state.getState().screeningDetected).toBe(false);
        expect(state.getState().screenings).toEqual([]);
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('Yes requires at least one screening option', () => {
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        content.querySelector('#scrnDetectedYes').checked = true;
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('Yes + option creates one screening per option and advances', () => {
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        content.querySelector('#scrnDetectedYes').checked = true;
        content.querySelector('#scrn_breast2D').checked = true;
        content.querySelector('#srcdxNext').click();
        expect(state.getState().screenings.map((s) => s.type)).toEqual(['breast2D']);
        expect(state.getPosition().editingScreeningIndex).toBe(0);
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('review edit re-enters detail at the first incomplete screening after adding another option', () => {
        state.getState().screeningDetected = true;
        state.addScreening('breast2D');
        state.getState().screenings[0].year = '2018';
        state.getPosition().returnTo = 'review';
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);

        content.querySelector('#scrn_breastMRI').checked = true;
        content.querySelector('#srcdxNext').click();

        expect(state.getState().screenings.map((s) => s.type)).toEqual(['breast2D', 'breastMRI']);
        expect(state.getPosition().editingScreeningIndex).toBe(1);
        expect(ctx.recollectSection).toHaveBeenCalledWith('screeningDetail');
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('shows only the colon options for a colon/rectal site', () => {
        state.getState().primarySite = 'colon';
        const ctx = makeCtx(renderScreeningGate);
        renderScreeningGate(content, ctx);
        expect(content.querySelectorAll('#srcdxScrnOptions .form-check')).toHaveLength(4);
        expect(content.querySelector('#scrn_colonCol')).not.toBeNull();
        expect(content.querySelector('#scrn_breast2D')).toBeNull();
    });
});

describe('screeningDetail', () => {
    const setup = (types = ['breast2D']) => {
        state.getState().primarySite = 'breast';
        state.getState().screeningDetected = true;
        types.forEach((t) => state.addScreening(t));
        state.getPosition().editingScreeningIndex = 0;
    };

    it('renders the year field, physician, and facility', () => {
        setup();
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);
        expect(content.querySelector('#srcdxScrnYr')).not.toBeNull();
        expect(content.querySelector('#srcdxScrnPhysFirst')).not.toBeNull();
        expect(content.querySelector('#srcdxScrnPhysFirst').getAttribute('autocomplete')).toBe('off');
        expect(content.querySelector('#srcdxScrnPhysLast').getAttribute('autocomplete')).toBe('off');
        expect(content.querySelector('#UPAddressScrn_0Line1')).not.toBeNull();
        // NPI typeahead slot: hidden carrier + listbox, combobox on Last name.
        expect(content.querySelector('#srcdxScrnPhysNpi')).not.toBeNull();
        expect(content.querySelector('[data-npi-slot="Scrn"] [role="listbox"]')).not.toBeNull();
        expect(content.querySelector('#srcdxScrnPhysLast').getAttribute('role')).toBe('combobox');
    });

    it('renders manual physician fields without NPI typeahead when the registry flag is off', () => {
        setup();
        const ctx = makeCtx(renderScreeningDetail, { npiEnabled: false });
        renderScreeningDetail(content, ctx);
        expect(content.querySelector('#srcdxScrnPhysFirst')).not.toBeNull();
        expect(content.querySelector('#srcdxScrnPhysLast')).not.toBeNull();
        expect(content.querySelector('#srcdxScrnPhysNpi')).toBeNull();
        expect(content.querySelector('[data-npi-slot="Scrn"]')).toBeNull();
        expect(content.querySelector('#srcdxScrnPhysLast').getAttribute('role')).toBeNull();

        content.querySelector('#srcdxScrnYr').value = '2024';
        content.querySelector('#srcdxScrnPhysFirst').value = 'Grace';
        content.querySelector('#srcdxScrnPhysLast').value = 'Hopper';
        content.querySelector('#srcdxNext').click();
        expect(state.getState().screenings[0].physician).toEqual({ firstName: 'Grace', lastName: 'Hopper', npi: '' });
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('requires a valid screening year', () => {
        setup();
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);
        content.querySelector('#srcdxScrnYr').value = '99';
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('harvests year/physician and advances (single screening)', () => {
        setup();
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);
        content.querySelector('#srcdxScrnYr').value = '2024';
        content.querySelector('#srcdxScrnPhysFirst').value = 'Grace';
        content.querySelector('#srcdxScrnPhysNpi').value = '1098765432'; // as the typeahead would set it
        content.querySelector('#srcdxNext').click();
        expect(state.getState().screenings[0].year).toBe('2024');
        expect(state.getState().screenings[0].physician.firstName).toBe('Grace');
        expect(state.getState().screenings[0].physician.npi).toBe('1098765432');
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('routes to the between-items STATUS screen while screenings remain, review when done', () => {
        setup(['breast2D', 'breastMRI']);
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);
        content.querySelector('#srcdxScrnYr').value = '2024';
        content.querySelector('#srcdxNext').click();
        // breastMRI still incomplete -> status interstitial (Comp 14), cursor untouched (status owns the advance)
        expect(ctx.reroute).toHaveBeenCalledWith('screeningStatus');
        expect(state.getPosition().editingScreeningIndex).toBe(0);
        expect(ctx.next).not.toHaveBeenCalled();
        // last remaining item completed -> straight on (never a status after the final one)
        state.getPosition().editingScreeningIndex = 1;
        renderScreeningDetail(content, ctx);
        content.querySelector('#srcdxScrnYr').value = '2025';
        content.querySelector('#srcdxNext').click();
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('skips completed screenings after filling a middle incomplete screening', () => {
        setup(['breast2D', 'breastMRI', 'breastUS']);
        state.getState().screenings[0].year = '2021';
        state.getState().screenings[2].year = '2023';
        state.getPosition().editingScreeningIndex = 1;
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);

        expect(content.querySelector('[data-i18n="shareHealthInfo.scrn_breastMRI"]')).not.toBeNull();
        content.querySelector('#srcdxScrnYr').value = '2022';
        content.querySelector('#srcdxNext').click();

        expect(state.getState().screenings[1].year).toBe('2022');
        expect(ctx.reroute).not.toHaveBeenCalled();
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('renders the mirrored Q4 (Yes selected) and the dynamic "{Site} Cancer > {Screening}" intro (per comp)', () => {
        setup(['breastMRI']);
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);
        expect(content.querySelector('#scrnDetailYes').checked).toBe(true); // mirrored Q4, Yes selected
        const intro = content.querySelector('#srcdxScrnIntro');
        expect(intro.classList.contains('srcdx-strong')).toBe(true); // bold sentence
        const dynamic = intro.querySelector('u');
        expect(dynamic.querySelector('[data-i18n="shareHealthInfo.scrnDetailSite_breast"]')).not.toBeNull();
        expect(dynamic.querySelector('[data-i18n="shareHealthInfo.scrn_breastMRI"]')).not.toBeNull();
        expect(content.querySelector('#srcdxScrnProgress')).toBeNull(); // comp shows no progress list
    });

    it('selecting "No" delegates to the controller\'s answerNoScreening policy', () => {
        setup(['breast2D']);
        const ctx = makeCtx(renderScreeningDetail);
        renderScreeningDetail(content, ctx);
        const no = content.querySelector('#scrnDetailNo');
        no.checked = true;
        no.dispatchEvent(new win.Event('change'));
        expect(ctx.answerNoScreening).toHaveBeenCalledTimes(1);
    });
});


describe('screeningRecap', () => {
    const setupTwoScreenings = () => {
        state.getState().primarySite = 'breast';
        state.getState().screeningDetected = true;
        state.addScreening('breastMRI');
        state.addScreening('breastUS');
    };

    it('lists ONLY the chosen screenings, pre-checked, with (i) tooltips and the site label + colon', () => {
        setupTwoScreenings();
        const ctx = makeCtx(renderScreeningRecap);
        renderScreeningRecap(content, ctx);
        const boxes = content.querySelectorAll('#srcdxRecapList input[type="checkbox"]');
        expect(boxes).toHaveLength(2); // chosen only — NOT all 5 breast options
        boxes.forEach((b) => expect(b.checked).toBe(true));
        expect(content.querySelectorAll('#srcdxRecapList [data-tooltip-key]')).toHaveLength(2);
        const siteLabel = content.querySelector('h3.srcdx-subheading');
        expect(siteLabel.textContent.trim().endsWith(':')).toBe(true);
        expect(content.querySelector('#scrnRecapYes').checked).toBe(true); // mirrored Q4, Yes selected
    });

    it('unchecking a screening drops it on Next (remaining detail preserved) and resets the loop cursor', () => {
        setupTwoScreenings();
        state.getState().screenings[1].year = '2019'; // pre-entered detail on the kept one
        state.getPosition().editingScreeningIndex = 1; // stale cursor from a prior walk
        const ctx = makeCtx(renderScreeningRecap);
        renderScreeningRecap(content, ctx);
        content.querySelector('#recap_breastMRI').checked = false;
        content.querySelector('#srcdxNext').click();
        expect(state.getState().screenings.map((s) => s.type)).toEqual(['breastUS']);
        expect(state.getState().screenings[0].year).toBe('2019'); // kept item's detail preserved
        expect(state.getPosition().editingScreeningIndex).toBe(0);
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('starts detail at the first incomplete selected screening', () => {
        setupTwoScreenings();
        state.getState().screenings[0].year = '2018';
        const ctx = makeCtx(renderScreeningRecap);
        renderScreeningRecap(content, ctx);
        content.querySelector('#srcdxNext').click();

        expect(state.getPosition().editingScreeningIndex).toBe(1);
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('blocks Next when every screening is unchecked', () => {
        setupTwoScreenings();
        const ctx = makeCtx(renderScreeningRecap);
        renderScreeningRecap(content, ctx);
        content.querySelector('#recap_breastMRI').checked = false;
        content.querySelector('#recap_breastUS').checked = false;
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('selecting "No" delegates to the controller\'s answerNoScreening policy', () => {
        setupTwoScreenings();
        const ctx = makeCtx(renderScreeningRecap);
        renderScreeningRecap(content, ctx);
        const no = content.querySelector('#scrnRecapNo');
        no.checked = true;
        no.dispatchEvent(new win.Event('change'));
        expect(ctx.answerNoScreening).toHaveBeenCalledTimes(1);
    });
});


describe('screeningStatus (Comp 14)', () => {
    const setupOneDone = () => {
        state.getState().primarySite = 'breast';
        state.getState().screeningDetected = true;
        state.addScreening('breastMRI');
        state.addScreening('breastUS');
        state.getState().screenings[0].year = '2024'; // breastMRI complete; breastUS pending
        state.getPosition().editingScreeningIndex = 0; // cursor still on the just-completed item
    };

    it('badges complete (no checkbox) vs pending (checked box); "Almost done!" names the first incomplete', () => {
        setupOneDone();
        const ctx = makeCtx(renderScreeningStatus);
        renderScreeningStatus(content, ctx);
        const doneRow = content.querySelector('[data-status-row="breastMRI"]');
        expect(doneRow.querySelector('.srcdx-status-badge.complete')).not.toBeNull();
        expect(doneRow.querySelector('input[type="checkbox"]')).toBeNull(); // completed: not droppable here
        const pendingRow = content.querySelector('[data-status-row="breastUS"]');
        expect(pendingRow.querySelector('.srcdx-status-badge.pending')).not.toBeNull();
        expect(pendingRow.querySelector('input[type="checkbox"]').checked).toBe(true);
        // The "Almost done!" sentence points at breastUS (the first incomplete in sequence).
        expect(content.querySelector('#srcdxStatusNext u [data-i18n="shareHealthInfo.scrn_breastUS"]')).not.toBeNull();
        expect(content.querySelector('#scrnStatusYes').checked).toBe(true); // mirrored Q4
    });

    it('Next opens the first incomplete screening (cursor jump + replace-in-place)', () => {
        setupOneDone();
        const ctx = makeCtx(renderScreeningStatus);
        renderScreeningStatus(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(state.getPosition().editingScreeningIndex).toBe(1);
        expect(ctx.reroute).toHaveBeenCalledWith('screeningDetail');
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('unchecking the pending screening drops it; with everything complete, Next goes onward', () => {
        setupOneDone();
        const ctx = makeCtx(renderScreeningStatus);
        renderScreeningStatus(content, ctx);
        content.querySelector('#status_breastUS').checked = false;
        content.querySelector('#srcdxNext').click();
        expect(state.getState().screenings.map((s) => s.type)).toEqual(['breastMRI']); // pending one dropped
        expect(ctx.next).toHaveBeenCalledTimes(1); // nothing incomplete remains -> review
        expect(ctx.reroute).not.toHaveBeenCalled();
    });

    it('Back returns to the just-completed entry (cursor unchanged, replace-in-place)', () => {
        setupOneDone();
        const ctx = makeCtx(renderScreeningStatus);
        renderScreeningStatus(content, ctx);
        content.querySelector('#srcdxBack').click();
        expect(state.getPosition().editingScreeningIndex).toBe(0);
        expect(ctx.reroute).toHaveBeenCalledWith('screeningDetail');
    });

    it('selecting "No" delegates to the controller\'s answerNoScreening policy', () => {
        setupOneDone();
        const ctx = makeCtx(renderScreeningStatus);
        renderScreeningStatus(content, ctx);
        const no = content.querySelector('#scrnStatusNo');
        no.checked = true;
        no.dispatchEvent(new win.Event('change'));
        expect(ctx.answerNoScreening).toHaveBeenCalledTimes(1);
    });
});
