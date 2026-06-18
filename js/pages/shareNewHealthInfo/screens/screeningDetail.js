import { renderQuestion, navButtons, monthSelect, fieldError, clearFieldErrors } from '../ui.js';
import { SCREENING_OPTIONS, SCREENS } from '../constants.js';
import { isValidScreeningYear } from '../validation.js';
import { isScreeningComplete } from '../conditionalLogic.js';
import {
    renderFacilityAddress, attachFacilityAddressEvents, harvestFacility, fillFacility,
} from '../../../components/facilityAddress.js';
import { renderNpiSlots, attachNpiTypeahead, harvestNpi, fillNpi } from '../npiTypeahead.js';

const metaFor = (key) => SCREENING_OPTIONS.find((o) => o.key === key) || {};
const facilityId = (idx) => `Scrn_${idx}`;
const NPI_IDS = { key: 'Scrn', firstId: 'srcdxScrnPhysFirst', lastId: 'srcdxScrnPhysLast', npiId: 'srcdxScrnPhysNpi' };

export const renderScreeningDetail = (content, ctx) => {
    const d = ctx.state.getState();
    const pos = ctx.state.getPosition();
    const idx = Math.min(pos.editingScreeningIndex || 0, d.screenings.length - 1);
    const scr = d.screenings[idx];
    const npiEnabled = ctx.isNpiRegistryEnabled?.() === true;

    renderQuestion(content, `
        <div class="d-flex align-items-start">
            <h2 class="srcdx-question mb-0" data-screen-heading data-i18n="shareHealthInfo.q4Header">4. Was this cancer detected through routine screening?</h2>
            <span class="srcdx-info ms-2" data-tooltip-key="shareHealthInfo.scrnDef_routine" tabindex="0" role="img" aria-label="More information">i</span>
        </div>
        <div class="form-check form-check-inline mt-2">
            <input class="form-check-input" type="radio" name="srcdxScrnDetail" id="scrnDetailYes" value="yes" checked>
            <label class="form-check-label" for="scrnDetailYes" data-i18n="shareHealthInfo.optYes">Yes</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="srcdxScrnDetail" id="scrnDetailNo" value="no">
            <label class="form-check-label" for="scrnDetailNo" data-i18n="shareHealthInfo.optNo">No</label>
        </div>
        <p class="srcdx-strong mt-4" id="srcdxScrnIntro">
            <span data-i18n="shareHealthInfo.scrnDetailIntro1">Please fill out the following information about your</span>
            <u><span data-i18n="shareHealthInfo.scrnDetailSite_${d.primarySite}">${d.primarySite}</span> &gt; <span data-i18n="${metaFor(scr.type).i18nKey || ''}">${scr.type}</span></u><span data-i18n="shareHealthInfo.scrnDetailIntro2"> screening.</span>
        </p>
        <h3 class="srcdx-subheading" data-i18n="shareHealthInfo.scrnDateOfScreening">Date of screening:</h3>
        <div class="row">
            <div class="col-6 col-sm-4"><label for="srcdxScrnMo" data-i18n="shareHealthInfo.monthLabel">Month</label>${monthSelect('srcdxScrnMo')}</div>
            <div class="col-6 col-sm-4"><label for="srcdxScrnYr" data-i18n="shareHealthInfo.yearLabelRequired">Year <span class="required">*</span></label>
                <input type="text" inputmode="numeric" maxlength="4" class="form-control" id="srcdxScrnYr" placeholder="Enter year"></div>
        </div>
        <h3 class="srcdx-subheading" data-i18n="shareHealthInfo.scrnPhysSectionHeader">Name of your referring physician (e.g., primary care provider, OB/GYN):</h3>
        <div class="row">
            <div class="col-6 col-md-5"><label for="srcdxScrnPhysFirst" data-i18n="shareHealthInfo.physFirst">First name</label>
                <input type="text" class="form-control" id="srcdxScrnPhysFirst" autocomplete="off" maxlength="100" placeholder="Enter first name"></div>
            <div class="col-6 col-md-5"><label for="srcdxScrnPhysLast" data-i18n="shareHealthInfo.physLast">Last name</label>
                <input type="text" class="form-control" id="srcdxScrnPhysLast" autocomplete="off" maxlength="100" placeholder="Enter last name"></div>
            ${npiEnabled ? renderNpiSlots(NPI_IDS) : ''}
        </div>
        <h3 class="srcdx-subheading" data-i18n="shareHealthInfo.scrnFacilityHeader">Enter the facility or hospital address where you were screened:</h3>
        ${renderFacilityAddress(facilityId(idx))}
        ${navButtons({ showBack: true })}
    `);

    if (scr.month !== '' && scr.month != null) content.querySelector('#srcdxScrnMo').value = String(scr.month);
    content.querySelector('#srcdxScrnYr').value = scr.year || '';
    content.querySelector('#srcdxScrnPhysFirst').value = scr.physician.firstName || '';
    content.querySelector('#srcdxScrnPhysLast').value = scr.physician.lastName || '';
    if (npiEnabled) {
        attachNpiTypeahead(content, NPI_IDS);
        fillNpi(content, NPI_IDS, scr.physician);
    }
    attachFacilityAddressEvents(content, facilityId(idx));
    fillFacility(content, facilityId(idx), scr.facility);

    const harvest = () => {
        const mv = content.querySelector('#srcdxScrnMo').value;
        scr.month = mv === '' ? '' : Number(mv);
        scr.year = content.querySelector('#srcdxScrnYr').value.trim();
        scr.physician = {
            firstName: content.querySelector('#srcdxScrnPhysFirst').value.trim(),
            lastName: content.querySelector('#srcdxScrnPhysLast').value.trim(),
            npi: npiEnabled ? harvestNpi(content, NPI_IDS) : '',
        };
        scr.facility = harvestFacility(content, facilityId(idx));
    };

    content.querySelector('#scrnDetailNo').addEventListener('change', () => ctx.answerNoScreening());

    content.querySelector('#srcdxBack').addEventListener('click', () => {
        if (pos.returnTo && pos.editMode === 'item') { ctx.back(); return; }
        if (idx > 0) {
            ctx.state.clearScreenData(SCREENS.SCREENING_DETAIL);
            pos.editingScreeningIndex = idx - 1;
            ctx.rerender();
            return;
        }
        // Section re-collect starts over at Q4 rather than returning half-collected data.
        if (pos.editMode === 'section') { ctx.reroute(SCREENS.SCREENING_GATE); return; }
        ctx.back();
    });
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        harvest();
        if (!isValidScreeningYear(scr.year)) {
            fieldError(content, 'srcdxScrnYr', 'shareHealthInfo.scrnYearError', 'Please enter a valid year.');
            return;
        }
        // Interstitial status appears only while another selected screening needs detail.
        if (pos.editMode !== 'item' && d.screenings.some((s) => !isScreeningComplete(s))) {
            ctx.reroute(SCREENS.SCREENING_STATUS);
        } else {
            ctx.next();
        }
    });
};
