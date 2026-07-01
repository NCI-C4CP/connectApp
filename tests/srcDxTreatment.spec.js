// Treatment detail loop + summary DOM tests (local JSDOM; shared.js + settingsHelpers.js mocked).

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
// The screen imports npiTypeahead -> dataAccess. Mock the transport so no real module
// (and no missing-export error) is ever in play. Typeahead behavior is covered in
// srcDxNpiTypeahead.spec.js. Here we only care about wiring (slots, harvest, refill).
vi.mock('../js/pages/shareNewHealthInfo/dataAccess.js', () => ({
    searchNPIProviders: vi.fn(async () => []),
}));

import * as shared from '../js/shared.js';
import * as state from '../js/pages/shareNewHealthInfo/state.js';
import { renderTreatmentDetail } from '../js/pages/shareNewHealthInfo/screens/treatmentDetail.js';
import { renderTreatmentSummary, resetConfirmState } from '../js/pages/shareNewHealthInfo/screens/treatmentSummary.js';

let win, content;

const makeCtx = (renderFn, { npiEnabled = true } = {}) => {
    const ctx = {
        state,
        isNpiRegistryEnabled: () => npiEnabled,
        next: vi.fn(),
        back: vi.fn(),
        goTo: vi.fn(),
        navigate: vi.fn(),
    };
    ctx.rerender = vi.fn(() => renderFn(content, ctx)); // real re-render so loop ops are observable
    ctx.rerenderInPlace = vi.fn(() => renderFn(content, ctx)); // same, but skips heading focus in the app
    ctx.reroute = vi.fn(); // replace-in-place nav
    ctx.answerNoTreatment = vi.fn(); // controller-owned "No treatment after all" policy (e2e-covered)
    ctx.recollectSection = vi.fn();  // controller-owned gate section re-collect (e2e-covered)
    return ctx;
};

beforeEach(() => {
    win = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>').window;
    content = win.document.getElementById('c');
    state.resetState();
    resetConfirmState();
    vi.clearAllMocks();
});

describe('treatmentDetail', () => {
    const setupOneTreatment = () => {
        state.getState().txReceived = true;
        state.addTreatment('chemo');
        state.getPosition().editingTreatmentIndex = 0;
    };

    it('renders the type, date fields, one physician and one facility', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        expect(content.querySelector('#srcdxTxStartYr')).not.toBeNull();
        expect(content.querySelector('#srcdxTxStartYr').dataset.i18n).toBe('shareHealthInfo.txYearInput');
        expect(content.querySelector('#srcdxTxEndYr').dataset.i18n).toBe('shareHealthInfo.txYearInput');
        // Physician names are the physician's, never the participant's saved contact — and they must
        // not be co-filled when the participant autofills the facility address below them.
        expect(content.querySelector('#srcdxPhysFirst_0').dataset.i18n).toBe('shareHealthInfo.physFirstInput');
        expect(content.querySelector('#srcdxPhysLast_0').dataset.i18n).toBe('shareHealthInfo.physLastInput');
        expect(content.querySelector('#srcdxPhysFirst_0').getAttribute('autocomplete')).toBe('off');
        expect(content.querySelector('#srcdxPhysLast_0').getAttribute('autocomplete')).toBe('off');
        expect(content.querySelectorAll('[data-phys]')).toHaveLength(1);
        expect(content.querySelectorAll('[data-fac-wrap]')).toHaveLength(1);
        expect(content.querySelector('#UPAddressTx_0_0Line1')).not.toBeNull();
        // NPI typeahead slot per physician row: hidden carrier + listbox, combobox on Last name.
        expect(content.querySelector('#srcdxPhysNpi_0')).not.toBeNull();
        expect(content.querySelector('[data-npi-slot="Tx_0"] [role="listbox"]')).not.toBeNull();
        expect(content.querySelector('#srcdxPhysLast_0').getAttribute('role')).toBe('combobox');
    });

    it('renders the Other write-in with the treatment type', () => {
        state.getState().txReceived = true;
        state.addTreatment('other');
        state.getState().treatments[0].otherDescribe = 'Immunotherapy';
        state.getPosition().editingTreatmentIndex = 0;
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);

        expect(content.querySelector('[data-i18n="shareHealthInfo.tx_other"]')).not.toBeNull();
        expect(content.textContent).toContain('other (Immunotherapy)');
    });

    it('renders manual physician fields without NPI typeahead when the registry flag is off', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail, { npiEnabled: false });
        renderTreatmentDetail(content, ctx);
        expect(content.querySelector('#srcdxPhysFirst_0')).not.toBeNull();
        expect(content.querySelector('#srcdxPhysLast_0')).not.toBeNull();
        expect(content.querySelector('#srcdxPhysNpi_0')).toBeNull();
        expect(content.querySelector('[data-npi-slot="Tx_0"]')).toBeNull();
        expect(content.querySelector('#srcdxPhysLast_0').getAttribute('role')).toBeNull();

        content.querySelector('#srcdxTxStartYr').value = '2021';
        content.querySelector('#srcdxPhysFirst_0').value = 'Maya';
        content.querySelector('#srcdxPhysLast_0').value = 'Santos';
        content.querySelector('#srcdxNext').click();
        expect(state.getState().treatments[0].physicians[0]).toEqual({ firstName: 'Maya', lastName: 'Santos', npi: '' });
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('harvests a registry-matched NPI and preserves it across the add-physician rerender', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxPhysFirst_0').value = 'Maya';
        content.querySelector('#srcdxPhysLast_0').value = 'Santos';
        content.querySelector('#srcdxPhysNpi_0').value = '1234567890'; // as the typeahead would set it
        content.querySelector('#srcdxAddPhys').click();                // harvest -> add -> rerenderInPlace
        expect(state.getState().treatments[0].physicians[0].npi).toBe('1234567890');
        expect(content.querySelector('#srcdxPhysNpi_0').value).toBe('1234567890');  // refilled
        expect(content.querySelector('#srcdxNpiChip_Tx_0').classList.contains('d-none')).toBe(false);
        expect(content.querySelector('#srcdxPhysNpi_1').value).toBe('');             // new row unmatched
    });

    it('Next harvests the npi with the physician', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxTxStartYr').value = '2021';
        content.querySelector('#srcdxPhysNpi_0').value = '1234567890';
        content.querySelector('#srcdxNext').click();
        expect(state.getState().treatments[0].physicians[0].npi).toBe('1234567890');
    });

    it('requires a valid start year', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('rejects a treatment start year before the diagnosis year', () => {
        setupOneTreatment();
        state.getState().dxYear = '2020';
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxTxStartYr').value = '2019';
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage.mock.calls[0][1]).toContain('shareHealthInfo.txYearBeforeDxError');
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('advances (single treatment) once a valid start year is entered', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxTxStartYr').value = '2021';
        content.querySelector('#srcdxNext').click();
        expect(state.getState().treatments[0].startYear).toBe('2021');
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('enforces end-date XOR ongoing (ongoing clears the end date)', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxTxStartYr').value = '2020';
        content.querySelector('#srcdxTxEndYr').value = '2023';
        const ongoing = content.querySelector('#srcdxTxOngoing');
        ongoing.checked = true;
        ongoing.dispatchEvent(new win.Event('change'));
        content.querySelector('#srcdxNext').click();
        const tx = state.getState().treatments[0];
        expect(tx.ongoing).toBe(true);
        expect(tx.endYear).toBe('');
    });

    it('rejects an end year before the start year', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxTxStartYr').value = '2021';
        content.querySelector('#srcdxTxEndYr').value = '2019';
        content.querySelector('#srcdxNext').click();
        expect(shared.errorMessage).toHaveBeenCalled();
        expect(ctx.next).not.toHaveBeenCalled();
    });

    it('adds/removes physicians (and preserves typed input across add)', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxPhysFirst_0').value = 'Ada';
        content.querySelector('#srcdxAddPhys').click();
        expect(state.getState().treatments[0].physicians).toHaveLength(2);
        expect(content.querySelector('#srcdxPhysFirst_0').value).toBe('Ada'); // preserved
        content.querySelector('[data-remove-phys="1"]').click();
        expect(state.getState().treatments[0].physicians).toHaveLength(1);
    });

    it('caps the add-physician button at 10', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        for (let i = 0; i < 9; i++) state.addPhysician(0); // now 10
        renderTreatmentDetail(content, ctx);
        expect(content.querySelector('#srcdxAddPhys').disabled).toBe(true);
    });

    it('adds a facility', () => {
        setupOneTreatment();
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxAddFac').click();
        expect(state.getState().treatments[0].facilities).toHaveLength(2);
        expect(content.querySelectorAll('[data-fac-wrap]')).toHaveLength(2);
    });

    it('auto-sequences through multiple treatment types before advancing', () => {
        state.getState().txReceived = true;
        state.addTreatment('chemo');
        state.addTreatment('surgery');
        state.getPosition().editingTreatmentIndex = 0;
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);
        content.querySelector('#srcdxTxStartYr').value = '2020';
        content.querySelector('#srcdxNext').click();
        // moved to the second treatment, not yet to summary
        expect(state.getPosition().editingTreatmentIndex).toBe(1);
        expect(ctx.next).not.toHaveBeenCalled();
        content.querySelector('#srcdxTxStartYr').value = '2021';
        content.querySelector('#srcdxNext').click();
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('skips completed treatments after filling a middle incomplete treatment', () => {
        state.getState().txReceived = true;
        state.addTreatment('chemo');
        state.addTreatment('radiation');
        state.addTreatment('other');
        state.getState().treatments[0].startYear = '2021';
        state.getState().treatments[2].startYear = '2023';
        state.getPosition().editingTreatmentIndex = 1;
        const ctx = makeCtx(renderTreatmentDetail);
        renderTreatmentDetail(content, ctx);

        expect(content.querySelector('[data-i18n="shareHealthInfo.tx_radiation"]')).not.toBeNull();
        content.querySelector('#srcdxTxStartYr').value = '2022';
        content.querySelector('#srcdxNext').click();

        expect(state.getState().treatments[1].startYear).toBe('2022');
        expect(ctx.rerender).not.toHaveBeenCalled();
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });
});

describe('treatmentSummary', () => {
    beforeEach(() => {
        state.getState().txReceived = true;
        state.addTreatment('chemo');
        state.addTreatment('surgery');
    });

    it('renders a chip per treatment', () => {
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        expect(content.querySelectorAll('[data-tx-chip]')).toHaveLength(2);
    });

    it('renders the Other write-in on the summary chip', () => {
        state.getState().treatments = [];
        state.addTreatment('other');
        state.getState().treatments[0].otherDescribe = 'Immunotherapy';
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);

        expect(content.querySelector('[data-tx-chip="0"] [data-i18n="shareHealthInfo.tx_other"]')).not.toBeNull();
        expect(content.querySelector('[data-tx-chip="0"]').textContent).toContain('other (Immunotherapy)');
    });

    it('Remove shows a confirmation, Delete removes the treatment', () => {
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        content.querySelector('[data-remove-tx="0"]').click();
        expect(content.querySelector('[data-confirm-remove="0"]')).not.toBeNull(); // confirm UI shown
        content.querySelector('[data-confirm-remove="0"]').click();
        expect(state.getState().treatments.map((t) => t.type)).toEqual(['surgery']);
    });

    it('Go Back cancels the removal', () => {
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        content.querySelector('[data-remove-tx="1"]').click();
        content.querySelector('[data-cancel-remove="1"]').click();
        expect(state.getState().treatments).toHaveLength(2);
        expect(content.querySelector('[data-confirm-remove="1"]')).toBeNull();
    });

    it('Edit jumps to that treatment detail, returning to the summary', () => {
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        content.querySelector('[data-edit-tx="1"]').click();
        expect(ctx.goTo).toHaveBeenCalledWith('treatmentDetail', { editingTreatmentIndex: 1, returnTo: 'treatmentSummary', editMode: 'item' });
    });

    it('Add Another Treatment returns to the type selection as a cancellable edit', () => {
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        content.querySelector('#srcdxAddTreatment').click();
        expect(ctx.goTo).toHaveBeenCalledWith('treatmentReceived', { returnTo: 'treatmentSummary' });
    });

    it('Next advances', () => {
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        content.querySelector('#srcdxNext').click();
        expect(ctx.next).toHaveBeenCalledTimes(1);
    });

    it('selecting "No" delegates to the controller\'s answerNoTreatment policy', () => {
        // The clearing + routing (ctx.answerNoTreatment, e2e-covered);
        // the screen's job is only to delegate.
        const ctx = makeCtx(renderTreatmentSummary);
        renderTreatmentSummary(content, ctx);
        const no = content.querySelector('#txSummaryNo');
        no.checked = true;
        no.dispatchEvent(new win.Event('change'));
        expect(ctx.answerNoTreatment).toHaveBeenCalledTimes(1);
    });
});
