import { renderScreen, pageShell, card } from '../ui.js';
import { escapeHTML } from '../../../shared.js';

export const renderLanding = (content, { onStart, prior = [] } = {}) => {
    const middle = prior.length
        ? card('shareHealthInfo.previouslyReportedHeader', 'Previously Reported Cancer Diagnoses', `
            ${prior.map((d) => `
            <div class="border-bottom py-2">
                <div><strong data-i18n="shareHealthInfo.previouslyReportedLocation">Location</strong>: ${escapeHTML(String(d.location ?? ''))}</div>
                <div><strong data-i18n="shareHealthInfo.previouslyReportedDate">Diagnosis date</strong>: ${escapeHTML(String(d.dxDate ?? ''))}</div>
            </div>`).join('')}
            <div class="srcdx-nav">
                <span></span>
                <button type="button" class="btn btn-primary" id="srcdxAddDiagnosis" data-i18n="shareHealthInfo.addADiagnosis">Add a Diagnosis</button>
            </div>`)
        : card('shareHealthInfo.reportCancerHeader', 'Report a Cancer Diagnosis', `
            <p data-i18n="shareHealthInfo.reportCancerIntro">We're interested in learning about cancer diagnoses you may receive after joining Connect. If you want to add details about a new cancer diagnosis, click the "Add Your Diagnosis" button to share information that we'll use to collect important data for research.</p>
            <div class="srcdx-nav">
                <span></span>
                <button type="button" class="btn btn-primary" id="srcdxAddDiagnosis" data-i18n="shareHealthInfo.addYourDiagnosis">Add Your Diagnosis</button>
            </div>`);

    renderScreen(content, pageShell(middle));

    const btn = content.querySelector('#srcdxAddDiagnosis');
    if (btn && onStart) btn.addEventListener('click', onStart);
};
