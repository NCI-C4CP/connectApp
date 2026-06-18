import { renderQuestion, navButtons, monthSelect, fieldError, clearFieldErrors } from '../ui.js';
import { isValidPastYear } from '../validation.js';

export const renderDiagnosisDate = (content, ctx) => {
    const d = ctx.state.getState();

    renderQuestion(content, `
        <h2 class="srcdx-question" data-screen-heading data-i18n="shareHealthInfo.q2Header">2. What was the date of your diagnosis?</h2>
        <div class="form-group row">
            <div class="col-6 col-sm-4">
                <label for="srcdxDxMonth" data-i18n="shareHealthInfo.monthLabel">Month</label>
                ${monthSelect('srcdxDxMonth')}
            </div>
            <div class="col-6 col-sm-4">
                <label for="srcdxDxYear" data-i18n="shareHealthInfo.yearLabelRequired">Year <span class="required">*</span></label>
                <input type="text" inputmode="numeric" maxlength="4" class="form-control" id="srcdxDxYear" placeholder="Enter year of diagnosis">
            </div>
        </div>
        ${navButtons({ showBack: true })}
    `);

    const monthSel = content.querySelector('#srcdxDxMonth');
    if (d.dxMonth !== '' && d.dxMonth !== null && d.dxMonth !== undefined) monthSel.value = String(d.dxMonth);
    content.querySelector('#srcdxDxYear').value = d.dxYear || '';

    const harvest = () => {
        const mv = monthSel.value;
        d.dxMonth = mv === '' ? '' : Number(mv);
        d.dxYear = content.querySelector('#srcdxDxYear').value.trim();
    };

    content.querySelector('#srcdxBack').addEventListener('click', () => ctx.back());
    content.querySelector('#srcdxNext').addEventListener('click', () => {
        clearFieldErrors(content);
        harvest();
        if (!isValidPastYear(d.dxYear)) {
            fieldError(content, 'srcdxDxYear', 'shareHealthInfo.yearRequired', 'Please enter a valid year (YYYY) that is not in the future.');
            return;
        }
        ctx.next();
    });
};
