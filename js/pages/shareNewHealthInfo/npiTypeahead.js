// NPI provider typeahead for physician name fields.

import { translateHTML, escapeHTML } from '../../shared.js';
import { searchNPIProviders } from './dataAccess.js';

export const NPI_DEBOUNCE_MS = 300;
export const NPI_MIN_CHARS = 2;

const npiRegistry = new Map();

const cleanupInstance = (inst) => {
    if (!inst) return;
    clearTimeout(inst.timer);
    inst.requestSeq += 1;
    inst.abortController?.abort();
    inst.abortController = null;
};

export const teardownNpiTypeaheads = () => {
    npiRegistry.forEach(cleanupInstance);
    npiRegistry.clear();
};

export const renderNpiSlots = (ids) => `
    <div class="col-12 srcdx-suggest" data-npi-slot="${ids.key}">
        <input type="hidden" id="${ids.npiId}">
        <div class="srcdx-suggest-pop d-none" id="srcdxNpiPop_${ids.key}">
            <ul class="srcdx-suggest-list" id="srcdxNpiList_${ids.key}" role="listbox"
                aria-label="Provider suggestions" data-i18n="shareHealthInfo.npiListLabel"></ul>
            <div class="srcdx-suggest-status d-none" id="srcdxNpiStatus_${ids.key}" role="status"></div>
        </div>
        <div class="srcdx-suggest-chip d-none" id="srcdxNpiChip_${ids.key}"></div>
    </div>`;

const q = (content, id) => content.querySelector(`#${id}`);

export const harvestNpi = (content, ids) => q(content, ids.npiId)?.value.trim() || '';

const setChip = (content, ids, html) => {
    const chip = q(content, `srcdxNpiChip_${ids.key}`);
    if (!chip) return;
    if (!html) {
        chip.classList.add('d-none');
        chip.innerHTML = '';
        return;
    }
    chip.innerHTML = html;
    translateHTML(chip);
    chip.classList.remove('d-none');
    chip.querySelector('[data-npi-clear]').addEventListener('click', () => {
        const hidden = q(content, ids.npiId);
        if (hidden) hidden.value = '';
        setChip(content, ids, null);
    });
};

const chipHtml = (parts) => `
    <span><span data-i18n="shareHealthInfo.npiMatched">Matched to provider directory</span>
        &middot; <span data-i18n="shareHealthInfo.npiLabel">NPI</span> ${parts.map(escapeHTML).join(' &middot; ')}</span>
    <button type="button" class="srcdx-suggest-chip-clear" data-npi-clear aria-label="Clear provider match"
        data-i18n="shareHealthInfo.npiChipClear">&times;</button>`;

export const fillNpi = (content, ids, physician) => {
    const hidden = q(content, ids.npiId);
    if (!hidden) return;
    const npi = (physician && physician.npi) || '';
    hidden.value = npi;
    setChip(content, ids, npi ? chipHtml([npi]) : null);
};

export const attachNpiTypeahead = (content, ids) => {
    const first = q(content, ids.firstId);
    const last = q(content, ids.lastId);
    const hidden = q(content, ids.npiId);
    const pop = q(content, `srcdxNpiPop_${ids.key}`);
    const list = q(content, `srcdxNpiList_${ids.key}`);
    const status = q(content, `srcdxNpiStatus_${ids.key}`);
    if (!first || !last || !hidden || !pop || !list || !status) return;

    const prev = npiRegistry.get(ids.key);
    if (prev && prev.first === first && prev.last === last && prev.hidden === hidden && prev.list === list) return;
    cleanupInstance(prev);
    const inst = { timer: null, abortController: null, requestSeq: 0, first, last, hidden, list };
    npiRegistry.set(ids.key, inst);

    let results = [];
    let activeIndex = -1;

    last.setAttribute('role', 'combobox');
    last.setAttribute('aria-autocomplete', 'list');
    last.setAttribute('aria-expanded', 'false');
    last.setAttribute('aria-controls', `srcdxNpiList_${ids.key}`);

    const abortInFlight = () => {
        inst.abortController?.abort();
        inst.abortController = null;
    };

    const setExpanded = (open) => {
        pop.classList.toggle('d-none', !open);
        last.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) {
            pop.classList.remove('srcdx-suggest-pop--status');
            last.removeAttribute('aria-activedescendant');
            activeIndex = -1;
        }
    };

    const close = ({ abort = true } = {}) => {
        clearTimeout(inst.timer);
        if (abort) abortInFlight();
        status.classList.add('d-none');
        setExpanded(false);
    };

    const setStatus = (key, english) => {
        list.innerHTML = '';
        status.dataset.i18n = key;
        status.textContent = english;
        translateHTML(status);
        pop.classList.add('srcdx-suggest-pop--status');
        status.classList.remove('d-none');
        setExpanded(true);
    };

    const optionId = (i) => `srcdxNpiOpt_${ids.key}_${i}`;

    const rowHtml = (p, i) => {
        const name = [p.lastName, p.firstName, p.credential].filter(Boolean).join(', ');
        const sub = [p.specialty, [p.city, p.state].filter(Boolean).join(', ')].filter(Boolean).join(' — ');
        return `<li class="srcdx-suggest-item" id="${optionId(i)}" role="option" aria-selected="false" data-npi-opt="${i}">
            <span class="srcdx-suggest-name">${escapeHTML(name)}</span>${sub ? `<span class="srcdx-suggest-sub"> — ${escapeHTML(sub)}</span>` : ''}
        </li>`;
    };

    const renderResults = () => {
        pop.classList.remove('srcdx-suggest-pop--status');
        status.classList.add('d-none');
        list.innerHTML = results.map(rowHtml).join('');
        activeIndex = -1;
        last.removeAttribute('aria-activedescendant');
        setExpanded(true);
    };

    const setActive = (i) => {
        if (!results.length) return;
        activeIndex = ((i % results.length) + results.length) % results.length; // wrap both ways
        [...list.children].forEach((li, j) => li.setAttribute('aria-selected', j === activeIndex ? 'true' : 'false'));
        last.setAttribute('aria-activedescendant', optionId(activeIndex));
        const item = list.children[activeIndex];
        try { item.scrollIntoView({ block: 'nearest' }); } catch (e) { /* JSDOM */ }
    };

    const select = (i) => {
        const p = results[i];
        if (!p) return;
        first.value = p.firstName;
        last.value = p.lastName;
        hidden.value = p.npi;
        close({ abort: true });
        const details = [p.npi, p.specialty, [p.city, p.state].filter(Boolean).join(', ')].filter(Boolean);
        setChip(content, ids, chipHtml(details));
    };

    const runSearch = async () => {
        abortInFlight();
        const controller = new AbortController();
        inst.abortController = controller;
        const seq = ++inst.requestSeq;
        setStatus('shareHealthInfo.npiSearching', 'Searching provider directory…');
        let found;
        try {
            found = await searchNPIProviders(
                { firstName: first.value.trim(), lastName: last.value.trim() },
                { signal: controller.signal },
            );
        } catch (e) {
            found = null; // defensive: the transport's contract is to resolve [] instead
        }
        // Abort also resolves []. Sequence guards stale responses.
        if (seq !== inst.requestSeq) return;
        if (found === null) { close({ abort: false }); return; }
        results = found.slice(0, 10);
        if (!results.length) {
            setStatus('shareHealthInfo.npiNoMatches', 'No matches found — you can enter the name manually.');
            return;
        }
        renderResults();
    };

    const schedule = () => {
        clearTimeout(inst.timer);
        if (last.value.trim().length < NPI_MIN_CHARS) {
            close();
            return;
        }
        inst.timer = setTimeout(runSearch, NPI_DEBOUNCE_MS);
    };

    const clearMatch = () => {
        if (!hidden.value) return;
        hidden.value = '';
        setChip(content, ids, null);
    };

    last.addEventListener('input', () => { clearMatch(); schedule(); });
    first.addEventListener('input', () => clearMatch());

    last.addEventListener('keydown', (e) => {
        const open = !pop.classList.contains('d-none') && results.length > 0 && list.children.length > 0;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (open) setActive(activeIndex + 1);
            else schedule();
        } else if (e.key === 'ArrowUp') {
            if (open) { e.preventDefault(); setActive(activeIndex - 1); }
        } else if (e.key === 'Enter') {
            if (open && activeIndex >= 0) { e.preventDefault(); select(activeIndex); }
        } else if (e.key === 'Escape') {
            close();
        } else if (e.key === 'Tab') {
            close();
        }
    });

    list.addEventListener('mousedown', (e) => {
        const item = e.target.closest('[data-npi-opt]');
        if (!item) return;
        e.preventDefault();
        select(Number(item.dataset.npiOpt));
    });

    last.addEventListener('blur', () => close());
};
