import { renderQuestion, navButtons, monthSelect, fieldError, clearFieldErrors } from '../ui.js';
import { SCREENS } from '../constants.js';
import { isValidYearWithAllowance } from '../validation.js';
import { applyOngoingExclusivity, canAddPhysician, isTreatmentComplete } from '../conditionalLogic.js';
import { treatmentTypeLabelHtml } from '../labels.js';
import {
    renderFacilityAddress, attachFacilityAddressEvents, harvestFacility, fillFacility,
} from '../../../components/facilityAddress.js';
import { renderNpiSlots, attachNpiTypeahead, harvestNpi, fillNpi } from '../npiTypeahead.js';

const facilityId = (txIndex, facIndex) => `Tx_${txIndex}_${facIndex}`;
const npiIds = (j) => ({ key: `Tx_${j}`, firstId: `srcdxPhysFirst_${j}`, lastId: `srcdxPhysLast_${j}`, npiId: `srcdxPhysNpi_${j}` });
const nextIncompleteTreatmentIndex = (treatments, currentIndex) => {
    const afterCurrent = treatments.findIndex((t, i) => i > currentIndex && !isTreatmentComplete(t));
    if (afterCurrent >= 0) return afterCurrent;
    return treatments.findIndex((t, i) => i !== currentIndex && !isTreatmentComplete(t));
};

export const renderTreatmentDetail = (content, ctx) => {
    const d = ctx.state.getState();
    const pos = ctx.state.getPosition();
    const idx = Math.min(pos.editingTreatmentIndex || 0, d.treatments.length - 1);
    const tx = d.treatments[idx];
    const npiEnabled = ctx.isNpiRegistryEnabled?.() === true;

    const physiciansHtml = tx.physicians.map((p, j) => `
        <div class="row align-items-end mb-2" data-phys="${j}">
            <div class="col-6 col-md-5">
                <label for="srcdxPhysFirst_${j}" data-i18n="shareHealthInfo.physFirst">First name</label>
                <input type="text" class="form-control" id="srcdxPhysFirst_${j}" autocomplete="off" maxlength="100" placeholder="Enter first name">
            </div>
            <div class="col-6 col-md-5">
                <label for="srcdxPhysLast_${j}" data-i18n="shareHealthInfo.physLast">Last name</label>
                <input type="text" class="form-control" id="srcdxPhysLast_${j}" autocomplete="off" maxlength="100" placeholder="Enter last name">
            </div>
            <div class="col-12 col-md-2">
                ${tx.physicians.length > 1 ? `<button type="button" class="btn btn-light btn-sm" data-remove-phys="${j}" data-i18n="shareHealthInfo.remove">Remove</button>` : ''}
            </div>
            ${npiEnabled ? renderNpiSlots(npiIds(j)) : ''}
        </div>`).join('');

    const facilitiesHtml = tx.facilities.map((f, j) => `
        <div data-fac-wrap="${j}">
            ${renderFacilityAddress(facilityId(idx, j))}
            ${tx.facilities.length > 1 ? `<button type="button" class="btn btn-light btn-sm mb-3" data-remove-fac="${j}" data-i18n="shareHealthInfo.removeFacility">Remove facility</button>` : ''}
        </div>`).join('');

    renderQuestion(content, `
        <h2 class="srcdx-question srcdx-question--tight" data-screen-heading data-i18n="shareHealthInfo.q3Header">3. Have you received, are you currently receiving, or are you scheduled to receive treatment for this cancer?</h2>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxTxDetailReceived" id="txDetailYes" value="yes" checked>
            <label class="form-check-label" for="txDetailYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxTxDetailReceived" id="txDetailNo" value="no">
            <label class="form-check-label" for="txDetailNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>

        <p class="srcdx-subheading mb-1" data-i18n="shareHealthInfo.txType">Type of treatment:</p>
        <p class="mb-0">${treatmentTypeLabelHtml(tx)}</p>

        <h3 class="srcdx-subheading" data-i18n="shareHealthInfo.txDates">Dates of treatment:</h3>
        <div class="row">
            <div class="col-6 col-sm-3"><label for="srcdxTxStartMo" data-i18n="shareHealthInfo.startMonth">Start month</label>${monthSelect('srcdxTxStartMo')}</div>
            <div class="col-6 col-sm-3"><label for="srcdxTxStartYr" data-i18n="shareHealthInfo.startYearRequired">Start year <span class="required">*</span></label>
                <input type="text" inputmode="numeric" maxlength="4" class="form-control" id="srcdxTxStartYr" placeholder="Enter year"></div>
            <div class="col-6 col-sm-3"><label for="srcdxTxEndMo" data-i18n="shareHealthInfo.endMonth">End month</label>${monthSelect('srcdxTxEndMo')}</div>
            <div class="col-6 col-sm-3"><label for="srcdxTxEndYr" data-i18n="shareHealthInfo.endYear">End year</label>
                <input type="text" inputmode="numeric" maxlength="4" class="form-control" id="srcdxTxEndYr" placeholder="Enter year"></div>
        </div>
        <div class="row">
            <div class="col-sm-6 offset-sm-6">
                <div class="form-check mt-2">
                    <input class="form-check-input srcdx-radio-checkbox" type="checkbox" id="srcdxTxOngoing">
                    <label class="form-check-label" for="srcdxTxOngoing" data-i18n="shareHealthInfo.txOngoing">My treatment is ongoing</label>
                </div>
            </div>
        </div>

        <h3 class="srcdx-subheading" data-i18n="shareHealthInfo.physSectionHeader">Name of your physician or oncologist</h3>
        <div id="srcdxPhysicians">${physiciansHtml}</div>
        <button type="button" class="btn srcdx-add-link btn-sm" id="srcdxAddPhys" data-i18n="shareHealthInfo.addPhysician" ${canAddPhysician(tx.physicians.length) ? '' : 'disabled'}>+ Add another physician or oncologist</button>

        <h3 class="srcdx-subheading" data-i18n="shareHealthInfo.txFacilityIntro">Enter the facility or hospital address where you received, are currently receiving, or are scheduled to receive treatment:</h3>
        <div id="srcdxFacilities">${facilitiesHtml}</div>
        <button type="button" class="btn srcdx-add-link btn-sm" id="srcdxAddFac" data-i18n="shareHealthInfo.addFacility">+ Add another facility or hospital</button>

        ${navButtons({ showBack: true })}
    `);

    const setVal = (sel, v) => { const e = content.querySelector(sel); if (e && v !== '' && v != null) e.value = String(v); };
    setVal('#srcdxTxStartMo', tx.startMonth);
    setVal('#srcdxTxStartYr', tx.startYear);
    setVal('#srcdxTxEndMo', tx.endMonth);
    setVal('#srcdxTxEndYr', tx.endYear);
    content.querySelector('#srcdxTxOngoing').checked = !!tx.ongoing;

    tx.physicians.forEach((p, j) => {
        content.querySelector(`#srcdxPhysFirst_${j}`).value = p.firstName || '';
        content.querySelector(`#srcdxPhysLast_${j}`).value = p.lastName || '';
        if (npiEnabled) {
            attachNpiTypeahead(content, npiIds(j));
            fillNpi(content, npiIds(j), p);
        }
    });

    tx.facilities.forEach((f, j) => {
        const fid = facilityId(idx, j);
        attachFacilityAddressEvents(content, fid);
        fillFacility(content, fid, f);
    });

    const readMonth = (sel) => { const v = content.querySelector(sel).value; return v === '' ? '' : Number(v); };
    const harvest = () => {
        tx.startMonth = readMonth('#srcdxTxStartMo');
        tx.startYear = content.querySelector('#srcdxTxStartYr').value.trim();
        tx.endMonth = readMonth('#srcdxTxEndMo');
        tx.endYear = content.querySelector('#srcdxTxEndYr').value.trim();
        tx.ongoing = content.querySelector('#srcdxTxOngoing').checked;
        const norm = applyOngoingExclusivity(tx);
        tx.endMonth = norm.endMonth;
        tx.endYear = norm.endYear;
        tx.physicians = tx.physicians.map((p, j) => ({
            firstName: content.querySelector(`#srcdxPhysFirst_${j}`)?.value.trim() || '',
            lastName: content.querySelector(`#srcdxPhysLast_${j}`)?.value.trim() || '',
            npi: npiEnabled ? harvestNpi(content, npiIds(j)) : '',
        }));
        tx.facilities = tx.facilities.map((f, j) => harvestFacility(content, facilityId(idx, j)));
    };

    // Keep optional end date and "ongoing" mutually exclusive.
    const ongoingCb = content.querySelector('#srcdxTxOngoing');
    const endMoEl = content.querySelector('#srcdxTxEndMo');
    const endYrEl = content.querySelector('#srcdxTxEndYr');
    ongoingCb.addEventListener('change', () => {
        if (ongoingCb.checked) { endMoEl.value = ''; endYrEl.value = ''; }
    });
    const onEndDateInput = () => {
        if (endMoEl.value !== '' || endYrEl.value.trim() !== '') ongoingCb.checked = false;
    };
    endMoEl.addEventListener('change', onEndDateInput);
    endYrEl.addEventListener('input', onEndDateInput);

    content.querySelector('#txDetailNo').addEventListener('change', () => ctx.answerNoTreatment());

    content.querySelector('#srcdxAddPhys').addEventListener('click', () => { harvest(); ctx.state.addPhysician(idx); ctx.rerenderInPlace(); });
    content.querySelectorAll('[data-remove-phys]').forEach((b) =>
        b.addEventListener('click', () => { harvest(); ctx.state.removePhysician(idx, Number(b.dataset.removePhys)); ctx.rerenderInPlace(); }));
    content.querySelector('#srcdxAddFac').addEventListener('click', () => { harvest(); ctx.state.addFacility(idx); ctx.rerenderInPlace(); });
    content.querySelectorAll('[data-remove-fac]').forEach((b) =>
        b.addEventListener('click', () => { harvest(); ctx.state.removeFacility(idx, Number(b.dataset.removeFac)); ctx.rerenderInPlace(); }));

    content.querySelector('#srcdxBack').addEventListener('click', () => {
        if (pos.returnTo && pos.editMode === 'item') { ctx.back(); return; }
        if (idx > 0) {
            ctx.state.clearScreenData(SCREENS.TREATMENT_DETAIL);
            pos.editingTreatmentIndex = idx - 1;
            ctx.rerender();
            return;
        }
        // Section re-collect starts over at Q3 rather than returning half-collected data.
        if (pos.editMode === 'section') { ctx.reroute(SCREENS.TREATMENT_RECEIVED); return; }
        ctx.back();
    });
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        harvest();
        if (!isValidYearWithAllowance(tx.startYear)) {
            fieldError(content, 'srcdxTxStartYr', 'shareHealthInfo.startYearError', 'Please enter a valid start year.');
            return;
        }
        if (!tx.ongoing && tx.endYear && (!isValidYearWithAllowance(tx.endYear) || Number(tx.endYear) < Number(tx.startYear))) {
            fieldError(content, 'srcdxTxEndYr', 'shareHealthInfo.txEndYearError', 'Please enter a valid end year on or after the start year.');
            return;
        }
        const nextIncomplete = nextIncompleteTreatmentIndex(d.treatments, idx);
        if (pos.editMode !== 'item' && nextIncomplete >= 0) {
            pos.editingTreatmentIndex = nextIncomplete;
            ctx.rerender();
        } else {
            ctx.next();
        }
    });
};
