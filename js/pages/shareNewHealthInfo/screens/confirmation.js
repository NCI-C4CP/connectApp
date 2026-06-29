import { renderScreen, pageShell, card } from '../ui.js';
import { CONFIRMATION_LINKS } from '../constants.js';

export const renderConfirmation = (content, ctx) => {
    const thankYou = card('shareHealthInfo.reportCancerHeader', 'Report a Cancer Diagnosis', `
        <div class="srcdx-callout" data-screen-heading tabindex="-1">
            <p><span data-i18n="shareHealthInfo.confirmHeader">Thank you for sharing this information with us.</span> <span data-i18n="shareHealthInfo.confirmBody">We are sorry to hear of your diagnosis. If you're interested in additional resources, you may find it useful to review some information about <a href="${CONFIRMATION_LINKS.treatment}" target="_blank" rel="noopener">treatment</a> and <a href="${CONFIRMATION_LINKS.managingCare}" target="_blank" rel="noopener">managing care</a> from the National Cancer Institute. If you have any questions, please reach out to the <a href="${CONFIRMATION_LINKS.supportCenter}" target="_blank" rel="noopener">Connect Support Center</a>.</span></p>
            <p class="mb-0" data-i18n="shareHealthInfo.confirmThanks">Thank you for being an important part of Connect! Your continued participation will help us learn more about the causes of cancer and find new ways to prevent it.</p>
        </div>`);

    const addAnother = `
        <div class="card srcdx-card mb-3">
            <div class="srcdx-card-body">
                <p data-i18n="shareHealthInfo.confirmAnother">Have you received another cancer diagnosis recently? Please add information about your new diagnosis by clicking the button below.</p>
                <div>
                    <button type="button" class="btn btn-primary" id="srcdxAddAnother" data-i18n="shareHealthInfo.addADiagnosis">Add a Diagnosis</button>
                </div>
            </div>
        </div>`;

    renderScreen(content, pageShell(thankYou + addAnother));

    const btn = content.querySelector('#srcdxAddAnother');
    if (btn) btn.addEventListener('click', () => ctx.startAnother());
};
