// NPI provider typeahead component tests (local JSDOM; shared.js + dataAccess.js mocked).
// The transport contract (resolves [] on any failure, never rejects) is tested in
// srcDxNpiSearch.spec.js — here the mock returns controlled promises per test.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    translateHTML: (s) => s,
    translateText: (k) => k,
    // Real escaping (not the identity function): the XSS test must prove the component routes registry
    // data through escapeHTML.
    escapeHTML: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'),
}));
vi.mock('../js/pages/shareNewHealthInfo/dataAccess.js', () => ({
    searchNPIProviders: vi.fn(async () => []),
}));

import { searchNPIProviders } from '../js/pages/shareNewHealthInfo/dataAccess.js';
import {
    NPI_DEBOUNCE_MS, NPI_MIN_CHARS,
    renderNpiSlots, attachNpiTypeahead, harvestNpi, fillNpi, teardownNpiTypeaheads,
} from '../js/pages/shareNewHealthInfo/npiTypeahead.js';

const IDS = { key: 'Tx_0', firstId: 'srcdxPhysFirst_0', lastId: 'srcdxPhysLast_0', npiId: 'srcdxPhysNpi_0' };

const providers = [
    { npi: '1234567890', firstName: 'MAYA', lastName: 'SANTOS', credential: 'M.D.', specialty: 'Medical Oncology', city: 'BETHESDA', state: 'MD' },
    { npi: '1098765432', firstName: 'JON', lastName: 'SANTOSO', credential: '', specialty: '', city: '', state: '' },
];

const deferred = () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};

let win, content;

const el = {
    first: () => content.querySelector(`#${IDS.firstId}`),
    last: () => content.querySelector(`#${IDS.lastId}`),
    hidden: () => content.querySelector(`#${IDS.npiId}`),
    pop: () => content.querySelector(`#srcdxNpiPop_${IDS.key}`),
    list: () => content.querySelector(`#srcdxNpiList_${IDS.key}`),
    status: () => content.querySelector(`#srcdxNpiStatus_${IDS.key}`),
    chip: () => content.querySelector(`#srcdxNpiChip_${IDS.key}`),
};

const renderRow = () => {
    content.innerHTML = `
        <div class="row" data-phys="0">
            <div class="col-6"><input type="text" id="${IDS.firstId}" autocomplete="off"></div>
            <div class="col-6"><input type="text" id="${IDS.lastId}" autocomplete="off"></div>
            ${renderNpiSlots(IDS)}
        </div>`;
    attachNpiTypeahead(content, IDS);
};

const type = (input, value) => {
    input.value = value;
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
};

// type + debounce elapse (microtasks flushed)
const search = async (value) => {
    type(el.last(), value);
    await vi.advanceTimersByTimeAsync(NPI_DEBOUNCE_MS);
};

const keydown = (key) => {
    const evt = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.last().dispatchEvent(evt);
    return evt;
};

const popOpen = () => !el.pop().classList.contains('d-none');

beforeEach(() => {
    vi.useFakeTimers();
    win = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>').window;
    content = win.document.getElementById('c');
    vi.mocked(searchNPIProviders).mockReset().mockResolvedValue([]);
    renderRow();
});

afterEach(() => {
    teardownNpiTypeaheads();
    vi.useRealTimers();
});

describe('renderNpiSlots / attach', () => {
    it('renders the hidden npi input, closed popup with ARIA listbox + status, and hidden chip', () => {
        expect(el.hidden()).not.toBeNull();
        expect(el.hidden().type).toBe('hidden');
        expect(popOpen()).toBe(false);
        expect(el.list().getAttribute('role')).toBe('listbox');
        expect(el.list().dataset.i18n).toBe('shareHealthInfo.npiListLabel');
        expect(el.status().getAttribute('role')).toBe('status');
        expect(el.chip().classList.contains('d-none')).toBe(true);
    });

    it('decorates ONLY the last-name input as the combobox', () => {
        const last = el.last();
        expect(last.getAttribute('role')).toBe('combobox');
        expect(last.getAttribute('aria-autocomplete')).toBe('list');
        expect(last.getAttribute('aria-expanded')).toBe('false');
        expect(last.getAttribute('aria-controls')).toBe(`srcdxNpiList_${IDS.key}`);
        expect(el.first().getAttribute('role')).toBeNull();
    });
});

describe('querying', () => {
    it(`does not search under ${NPI_MIN_CHARS} characters`, async () => {
        type(el.last(), 'S');
        await vi.advanceTimersByTimeAsync(NPI_DEBOUNCE_MS * 2);
        expect(searchNPIProviders).not.toHaveBeenCalled();
        expect(popOpen()).toBe(false);
    });

    it('debounces: rapid keystrokes produce ONE search with the final value', async () => {
        type(el.last(), 'Sa');
        await vi.advanceTimersByTimeAsync(100);
        type(el.last(), 'San');
        await vi.advanceTimersByTimeAsync(NPI_DEBOUNCE_MS - 1);
        expect(searchNPIProviders).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(searchNPIProviders).toHaveBeenCalledTimes(1);
        const [names, options] = vi.mocked(searchNPIProviders).mock.calls[0];
        expect(names).toEqual({ firstName: '', lastName: 'San' });
        expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('passes the first name as a refinement when present', async () => {
        el.first().value = 'Maya';
        await search('San');
        expect(vi.mocked(searchNPIProviders).mock.calls[0][0]).toEqual({ firstName: 'Maya', lastName: 'San' });
    });

    it('shows the searching status while in flight', async () => {
        const d = deferred();
        vi.mocked(searchNPIProviders).mockReturnValue(d.promise);
        await search('San');
        expect(popOpen()).toBe(true);
        expect(el.status().dataset.i18n).toBe('shareHealthInfo.npiSearching');
        expect(el.last().getAttribute('aria-expanded')).toBe('true');
        d.resolve([]);
    });

    it('aborts the stale request and never renders its late result', async () => {
        const a = deferred();
        const b = deferred();
        vi.mocked(searchNPIProviders).mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
        await search('San');
        await search('Sant');
        expect(searchNPIProviders).toHaveBeenCalledTimes(2);
        expect(vi.mocked(searchNPIProviders).mock.calls[0][1].signal.aborted).toBe(true);

        a.resolve([providers[0]]); // stale result arrives late
        await vi.advanceTimersByTimeAsync(0);
        expect(el.list().querySelectorAll('[role="option"]')).toHaveLength(0);

        b.resolve(providers);
        await vi.advanceTimersByTimeAsync(0);
        expect(el.list().querySelectorAll('[role="option"]')).toHaveLength(2);
    });
});

describe('results', () => {
    it('renders one option per provider with id, text, and aria-selected', async () => {
        vi.mocked(searchNPIProviders).mockResolvedValue(providers);
        await search('San');
        const options = el.list().querySelectorAll('[role="option"]');
        expect(options).toHaveLength(2);
        expect(options[0].id).toBe(`srcdxNpiOpt_${IDS.key}_0`);
        expect(options[0].textContent).toContain('SANTOS, MAYA, M.D.');
        expect(options[0].textContent).toContain('Medical Oncology');
        expect(options[0].textContent).toContain('BETHESDA, MD');
        expect(options[0].getAttribute('aria-selected')).toBe('false');
        expect(options[1].textContent).toContain('SANTOSO, JON'); // empty segments collapse
    });

    it('escapes registry data (XSS surface)', async () => {
        vi.mocked(searchNPIProviders).mockResolvedValue([
            { ...providers[0], lastName: '<img src=x onerror="window.__pwned=1">' },
        ]);
        await search('San');
        expect(el.list().querySelector('img')).toBeNull();
        expect(el.list().textContent).toContain('<img');
    });

    it('shows the no-matches status (popup stays open) on empty results', async () => {
        vi.mocked(searchNPIProviders).mockResolvedValue([]);
        await search('Zz');
        expect(popOpen()).toBe(true);
        expect(el.status().dataset.i18n).toBe('shareHealthInfo.npiNoMatches');
        expect(el.list().querySelectorAll('[role="option"]')).toHaveLength(0);
    });

    it('closes silently if the transport rejects (defensive; contract resolves [])', async () => {
        vi.mocked(searchNPIProviders).mockRejectedValue(new Error('boom'));
        await search('San');
        expect(popOpen()).toBe(false);
        expect(el.status().classList.contains('d-none')).toBe(true);
    });
});

describe('keyboard', () => {
    beforeEach(async () => {
        vi.mocked(searchNPIProviders).mockResolvedValue(providers);
        await search('San');
    });

    it('ArrowDown/ArrowUp move the active option with wrap + aria-activedescendant', () => {
        keydown('ArrowDown');
        expect(el.last().getAttribute('aria-activedescendant')).toBe(`srcdxNpiOpt_${IDS.key}_0`);
        expect(el.list().children[0].getAttribute('aria-selected')).toBe('true');
        keydown('ArrowDown');
        expect(el.last().getAttribute('aria-activedescendant')).toBe(`srcdxNpiOpt_${IDS.key}_1`);
        keydown('ArrowDown'); // wraps to first
        expect(el.last().getAttribute('aria-activedescendant')).toBe(`srcdxNpiOpt_${IDS.key}_0`);
        expect(el.list().children[1].getAttribute('aria-selected')).toBe('false');
        keydown('ArrowUp');   // wraps back to last
        expect(el.last().getAttribute('aria-activedescendant')).toBe(`srcdxNpiOpt_${IDS.key}_1`);
    });

    it('Enter selects the active option: fills names + npi, closes, shows the chip', () => {
        keydown('ArrowDown');
        const evt = keydown('Enter');
        expect(evt.defaultPrevented).toBe(true);
        expect(el.first().value).toBe('MAYA');
        expect(el.last().value).toBe('SANTOS');
        expect(el.hidden().value).toBe('1234567890');
        expect(popOpen()).toBe(false);
        expect(el.last().getAttribute('aria-expanded')).toBe('false');
        expect(el.last().hasAttribute('aria-activedescendant')).toBe(false);
        expect(el.chip().classList.contains('d-none')).toBe(false);
        expect(el.chip().textContent).toContain('1234567890');
        expect(el.chip().textContent).toContain('Medical Oncology'); // full detail at selection time
    });

    it('Escape closes without selecting; the typed value is retained', () => {
        keydown('Escape');
        expect(popOpen()).toBe(false);
        expect(el.last().value).toBe('San');
        expect(el.hidden().value).toBe('');
    });

    it('Tab closes without selecting', () => {
        keydown('Tab');
        expect(popOpen()).toBe(false);
    });

    it('blur closes the popup', () => {
        el.last().dispatchEvent(new win.Event('blur'));
        expect(popOpen()).toBe(false);
    });
});

describe('selection, chip & clearing', () => {
    beforeEach(async () => {
        vi.mocked(searchNPIProviders).mockResolvedValue(providers);
        await search('San');
    });

    const selectSecondByMouse = () => {
        const item = el.list().children[1];
        const evt = new win.Event('mousedown', { bubbles: true, cancelable: true });
        item.dispatchEvent(evt);
        return evt;
    };

    it('mousedown selects (preventDefault keeps focus on the input — no blur race)', () => {
        const evt = selectSecondByMouse();
        expect(evt.defaultPrevented).toBe(true);
        expect(el.first().value).toBe('JON');
        expect(el.last().value).toBe('SANTOSO');
        expect(el.hidden().value).toBe('1098765432');
        expect(popOpen()).toBe(false);
    });

    it('manual edit of EITHER name clears the match (npi + chip)', async () => {
        selectSecondByMouse();
        expect(el.hidden().value).toBe('1098765432');
        type(el.first(), 'Jonathan');
        expect(el.hidden().value).toBe('');
        expect(el.chip().classList.contains('d-none')).toBe(true);

        // re-match, then edit the last name
        await search('San');
        selectSecondByMouse();
        type(el.last(), 'Santosa');
        expect(el.hidden().value).toBe('');
        expect(el.chip().classList.contains('d-none')).toBe(true);
    });

    it("the chip's clear button drops the npi but keeps the names", () => {
        selectSecondByMouse();
        el.chip().querySelector('[data-npi-clear]').click();
        expect(el.hidden().value).toBe('');
        expect(el.chip().classList.contains('d-none')).toBe(true);
        expect(el.first().value).toBe('JON');
        expect(el.last().value).toBe('SANTOSO');
    });
});

describe('fillNpi / harvestNpi', () => {
    it('round-trips a matched npi and renders the NPI-only chip after re-render/resume', () => {
        fillNpi(content, IDS, { firstName: 'MAYA', lastName: 'SANTOS', npi: '1234567890' });
        expect(el.hidden().value).toBe('1234567890');
        expect(el.chip().classList.contains('d-none')).toBe(false);
        expect(el.chip().textContent).toContain('1234567890');
        expect(el.chip().textContent).not.toContain('Medical Oncology'); // specialty is ephemeral
        expect(harvestNpi(content, IDS)).toBe('1234567890');
    });

    it('tolerates unmatched physicians without an NPI', () => {
        fillNpi(content, IDS, { firstName: 'Ada', lastName: 'Lovelace' });
        expect(el.hidden().value).toBe('');
        expect(el.chip().classList.contains('d-none')).toBe(true);
        expect(harvestNpi(content, IDS)).toBe('');
    });
});

describe('teardown on re-attach (rerenderInPlace)', () => {
    it('does not double-bind the same rendered inputs', async () => {
        attachNpiTypeahead(content, IDS);
        vi.mocked(searchNPIProviders).mockResolvedValue(providers);
        await search('San');
        expect(searchNPIProviders).toHaveBeenCalledTimes(1);
    });

    it('cancels the pending debounce and aborts the in-flight request of the replaced instance', async () => {
        // In-flight request at re-attach time -> aborted
        const d = deferred();
        vi.mocked(searchNPIProviders).mockReturnValue(d.promise);
        await search('San');
        const firstSignal = vi.mocked(searchNPIProviders).mock.calls[0][1].signal;

        // Pending debounce at re-attach time -> never fires
        type(el.last(), 'Sant');
        renderRow(); // rebuild markup + re-attach the same key (add/remove physician path)
        expect(firstSignal.aborted).toBe(true);
        await vi.advanceTimersByTimeAsync(NPI_DEBOUNCE_MS * 2);
        expect(searchNPIProviders).toHaveBeenCalledTimes(1); // no second call from the dead timer

        // The replacement instance works
        vi.mocked(searchNPIProviders).mockResolvedValue(providers);
        await search('San');
        expect(el.list().querySelectorAll('[role="option"]')).toHaveLength(2);
        d.resolve([]);
    });

    it('tears down pending work when the screen is replaced', async () => {
        const d = deferred();
        vi.mocked(searchNPIProviders).mockReturnValue(d.promise);
        await search('San');
        const firstSignal = vi.mocked(searchNPIProviders).mock.calls[0][1].signal;

        type(el.last(), 'Sant');
        teardownNpiTypeaheads();
        content.innerHTML = '';

        expect(firstSignal.aborted).toBe(true);
        await vi.advanceTimersByTimeAsync(NPI_DEBOUNCE_MS * 2);
        expect(searchNPIProviders).toHaveBeenCalledTimes(1);
        d.resolve(providers);
    });
});
