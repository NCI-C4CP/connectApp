import { hideAnimation, questionnaireModules, storeResponse, isParticipantDataDestroyed, translateHTML, reportConfiguration, setReportAttributes, sitesNotEnrolling, setModuleAttributes, checkIfComplete } from "../shared.js";
import { blockParticipant } from "./questionnaire.js";
import { renderUserProfile } from "../components/form.js";
import { consentTemplate } from "./consent.js";
import { addEventHeardAboutStudy, addEventRequestPINForm, addEventHealthCareProviderSubmit, addEventPinAutoUpperCase, addEventHealthProviderModalSubmit, addEventToggleSubmit, storeParameters } from "../event.js";
import { heardAboutStudy, requestPINTemplate, healthCareProvider, noLongerEnrollingRender } from "./healthCareProvider.js";
import fieldMapping from '../fieldToConceptIdMapping.js';

export const renderDashboard = async (data, fromUserProfile, collections) => {
    const mainContent = document.getElementById('root');

    // Check for UTM parameters in sessionStorage and store them if not already present
    if (sessionStorage.getItem('utmSource') || sessionStorage.getItem('utmMedium') || sessionStorage.getItem('utmCampaign')) {
        if (!data[fieldMapping.utm.campaign] && !data[fieldMapping.utm.source] && !data[fieldMapping.utm.medium]) {
            await storeParameters();
        }
    }

    // Completed healthcareProvider and heardAboutStudy forms
    if (data[fieldMapping.healthcareProvider] && data[fieldMapping.heardAboutStudyForm]) {
        localStorage.eligibilityQuestionnaire = JSON.stringify({[fieldMapping.healthcareProvider]: data[fieldMapping.healthcareProvider]})
        if (data[fieldMapping.consentSubmitted] === fieldMapping.yes) {

            let topMessage = "";
            if (data[fieldMapping.userProfileSubmittedAutogen] && data[fieldMapping.userProfileSubmittedAutogen] === fieldMapping.yes) {

                let template = `
                    ${renderWelcomeHeader(data)}
                    <div class="row">
                        <div class="col-xl-2">
                        </div>
                        <div class="col-xl-8">
                     
                `;
                let finalMessage = "";
                const defaultMessage = '<p/><br><span data-i18n="mytodolist.withdrawnConnect">You have withdrawn from Connect. We will not collect any more data from you. If you have any questions, please contact the Connect Support Center by calling 1-877-505-0253 or by emailing <a href="mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a>.</span><br>';

                if (isParticipantDataDestroyed(data)) {
                    finalMessage += '<span data-i18n="mytodolist.deletedData">At your request, we have deleted your Connect data. If you have any questions, please contact the Connect Support Center by calling 1-877-505-0253 or by emailing  <a href="mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a>.</span>'
                }
                else if (data[fieldMapping.destroyData] === fieldMapping.yes) {
                    if (!data[fieldMapping.destroyDataSigned] || data[fieldMapping.destroyDataSigned] == fieldMapping.no) {
                        finalMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span>' + defaultMessage
                    }
                    else if ((data[fieldMapping.consentWithdrawn] && data[fieldMapping.consentWithdrawn] !== fieldMapping.no) && (!data[fieldMapping.hipaaRevocationSigned] || data[fieldMapping.hipaaRevocationSigned] == fieldMapping.no)) {
                        finalMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span>' + defaultMessage
                    }
                    else {
                        finalMessage += defaultMessage
                    }
                }
                else if ((data[fieldMapping.consentWithdrawn] && data[fieldMapping.consentWithdrawn] !== fieldMapping.no)) {

                    if (!data[fieldMapping.hipaaRevocationSigned] || data[fieldMapping.hipaaRevocationSigned] == fieldMapping.no) {
                        finalMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span>' + defaultMessage
                    }
                    else {
                        finalMessage += defaultMessage
                    }
                }
                else if (data[fieldMapping.recruitmentType] === fieldMapping.recruitmentTypePassive && data[fieldMapping.verification] === fieldMapping.notYetVerified) {
                    const healthcareProvider = data[fieldMapping.healthcareProvider] || '';
                    blockParticipant(healthcareProvider);
                    hideAnimation();
                    return;
                }
                if (finalMessage.trim() !== "") {
                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;">
                        ${finalMessage}
                    </div>
                    `
                    mainContent.innerHTML = translateHTML(template);
                    hideAnimation();
                    return;
                }

                if (!data[fieldMapping.verification] || data[fieldMapping.verification] == fieldMapping.notYetVerified) {
                    if (data['unverifiedSeen'] && data['unverifiedSeen'] === true) {
                        topMessage += '';
                    }
                    else {
                        topMessage = '';
                    }
                    topMessage += `
                        ${fromUserProfile ?
                            `<span data-i18n="mytodolist.completingProfile">Thank you for completing your profile for the Connect for Cancer Prevention Study. Next, the Connect team at your health care system will check that you are eligible to be part of the study. We will contact you within a few business days.
                            <br>
                            In the meantime, please begin by completing your first Connect survey.</span>`:
                            `<span data-i18n="mytodolist.checkEligibility">The Connect team at your health care system is working to check that you are eligible to be part of the study.</span> 
                            ${checkIfComplete(data) ? '<span data-i18n="mytodolist.thankYouCompleting">Thank you for completing your first Connect survey! We will be in touch with next steps.</span>' : '<span data-i18n="mytodolist.firstSurvey">In the meantime, please begin by completing your first Connect survey.</span>'}`}
                    `
                }
                else if (data[fieldMapping.verification] && data[fieldMapping.verification] == fieldMapping.verified) {
                    if (data['verifiedSeen'] && data['verifiedSeen'] === true) {
                        if (checkIfComplete(data)) {
                            if (!data['firstSurveyCompletedSeen']) {
                                topMessage += '<span data-i18n="mytodolist.thankYouCompleting">Thank you for completing your first Connect survey! We will be in touch with next steps.</span>'
                                let formData = {};
                                formData['firstSurveyCompletedSeen'] = true;
                                storeResponse(formData);
                            }
                            else {
                                topMessage += '';
                            }
                        }

                    }
                    else {
                        topMessage += `
                            <span data-i18n="mytodolist.confirmedEligibility">Great news! We have confirmed that you are eligible for the Connect for Cancer Prevention Study. You are now an official Connect participant.</span>
                            <br>
                            ${checkIfComplete(data) ? '<span data-i18n="mytodolist.thankYouCompleting">Thank you for completing your first Connect survey! We will be in touch with next steps.</span>' : '<span data-i18n="mytodolist.completeFirstSurvey">The next step is to complete your first Connect survey.</span>'}
                            <br>
                            <span data-i18n="mytodolist.thankYouBeingPart">Thank you for being a part of Connect and for your commitment to help us learn more about how to prevent cancer.</span>
                            <br>
                        `
                        let formData = {};
                        formData['verifiedSeen'] = true;
                        storeResponse(formData);
                    }
                }
                else if (data[fieldMapping.verification] && data[fieldMapping.verification] == fieldMapping.cannotBeVerified) {
                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;"  data-i18n="mytodolist.notEligibleMessage">
                        Based on our records you are not eligible for the Connect for Cancer Prevention Study. Thank you for your interest. Any information that you have already provided will remain private. We will not use any information you shared for our research.
                        <br>
                        If you think this is a mistake or if you have any questions, please contact the <a href="https://norcfedramp.servicenowservices.com/participant" target="_blank">Connect Support Center</a>.
                    </div>
                    </div>
                    <div class="col-xl-2">
                    </div>
                    </div>
                    `
                    mainContent.innerHTML = translateHTML(template);
                    hideAnimation();
                    return;
                }
                else if (data[fieldMapping.verification] && data[fieldMapping.verification] == fieldMapping.duplicate) {
                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;" data-i18n="mytodolist.alreadyHaveAccount">
                        Our records show that you already have another account with a different email or phone number. Please try signing in again. Contact the Connect Support Center by emailing <a href = "mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a> or calling <span style="white-space:nowrap;overflow:hidden">1-877-505-0253</span> if you need help accessing your account.
                    </div>
                    </div>
                    <div class="col-xl-2">
                    </div>
                    </div>
                    `
                    mainContent.innerHTML = translateHTML(template);
                    hideAnimation();
                    return;
                }
                else if (data[fieldMapping.verification] && data[fieldMapping.verification] == fieldMapping.outreachTimedOut) {
                    let site = data[fieldMapping.healthcareProvider]
                    let body = `<span data-i18n="mytodolist.bodyConnectSupport">the Connect Support Center by emailing <a href = "mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a> or calling 1-877-505-0253</span>`;
                    if (site === fieldMapping.healthPartners) {
                        body = `<span data-i18n="mytodolist.bodyHealthPartners">HealthPartners by emailing <a href = "mailto:ConnectStudy@healthpartners.com">ConnectStudy@healthpartners.com</a> or calling 952-967-5067</span>`
                    }
                    if (site === fieldMapping.henryFordHealth) {
                        body = `<span data-i18n="mytodolist.bodyHenryFord">Henry Ford Health by emailing <a href = "mailto:ConnectStudy@hfhs.org">ConnectStudy@hfhs.org</a></span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteCO) {
                        body = `<span data-i18n="mytodolist.bodyKPColorado">KP Colorado by emailing <a href = "mailto:Connect-Study-KPCO@kp.org">Connect-Study-KPCO@kp.org</a> or calling 833-630-0007</span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteGA) {
                        body = `<span data-i18n="mytodolist.bodyKPGeorgia">KP Georgia by emailing <a href = "mailto:Connect-Study-KPGA@kp.org">Connect-Study-KPGA@kp.org</a> or calling 404-504-5660</span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteHI) {
                        body = `<span data-i18n="mytodolist.bodyKPHawaii">KP Hawaii by emailing <a href = "mailto:Connect-Study-KPHI@kp.org">Connect-Study-KPHI@kp.org</a> or calling 833-417-0846</span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteNW) {
                        body = `<span data-i18n="mytodolist.bodyKPNorthwest">KP Northwest by emailing <a href = "mailto:Connect-Study-KPNW@kp.org">Connect-Study-KPNW@kp.org</a> or calling 1-866-554-6039 (toll-free) or 503-528-3985</span>`
                    }
                    if (site === fieldMapping.marshfieldClinical) {
                        body = `<span data-i18n="mytodolist.bodyMarshfieldClinic">Marshfield Clinic by emailing <a href = "mailto:connectstudy@marshfieldresearch.org">connectstudy@marshfieldresearch.org</a> or calling 715-898-9444</span>`
                    }
                    if (site === fieldMapping.sanfordHealth) {
                        body = `<span data-i18n="mytodolist.bodySanfordHealth">Sanford Health by emailing <a href = "mailto:ConnectStudy@sanfordhealth.org">ConnectStudy@sanfordhealth.org</a> or calling 605-312-6100</span>`
                    }
                    if (site === fieldMapping.uChicagoMedicine) {
                        body = `<span data-i18n="mytodolist.bodyConnectSupport">the Connect Support Center by emailing <a href = "mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a> or calling 1-877-505-0253</span>`
                    }
                    if (site === fieldMapping.baylorScottAndWhiteHealth) {
                        body = `<span data-i18n="mytodolist.bodyBaylorScottAndWhiteHealth">Baylor Scott & White Health by emailing <a href = "mailto:ConnectStudy@bswhealth.org">ConnectStudy@bswhealth.org</a> or calling 214-865-2427</span>`
                    }

                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;">
                        <span  data-i18n="mytodolist.tryingContact">Our study team has been trying to contact you about your eligibility for the Connect for Cancer Prevention Study. We need more information from you to check that you can be part of Connect. Please contact </span>${body}<span data-i18n="mytodolist.tryingContactEnd"> to confirm that you can take part in the study.</span>    
                    </div>
                    </div>
                    <div class="col-xl-2">
                    </div>
                    </div>
                    `;
                    mainContent.innerHTML = translateHTML(template);
                    window.scrollTo(0, 0)
                    hideAnimation();
                    return;
                }
                else if (data[fieldMapping.verification] && data[fieldMapping.verification] == fieldMapping.noLongerEnrolling) {
                    noLongerEnrollingRender(data[fieldMapping.healthcareProvider]);
                    return;
                }
                if ((!data['updatesSeen'] || data['updatesSeen'] !== true) && topMessage.trim() === "") {
                    topMessage += `
                            <span data-i18n="mytodolist.newUpdates"><span style="font-weight: bold">We've Updated MyConnect!</span><br>
                                You may notice things look a little different here. While nothing about the study has changed, we've made some design improvements to give MyConnect a fresh new look and make it easier navigate.
                                <br><br>
                                We’ll be rolling out other design updates over the next few months, so stay tuned for even more improvements! If you have any questions about the changes, feel free to contact our team at the Connect Support Center (hyperlink CSC with MyConnect.cancer.gov/support).
                                <br><br>
                                We hope you enjoy the new experience!
                            </span>
                        `
                        let formData = {};
                        formData['updatesSeen'] = true;
                        storeResponse(formData);
                }

                const surveyMessage = await checkForNewSurveys(data, collections);

                if (surveyMessage) {
                    template += surveyMessage;
                }

                if (topMessage.trim() !== "") {
                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;">
                        ${topMessage}
                    </div>
                    `
                }

                //Check for secondary Login options
                if (data[fieldMapping.verification] === fieldMapping.verified &&
                    sessionStorage.getItem('secondaryModalShown') !== "yes" &&
                    (data[fieldMapping.revokeHipaa] !== fieldMapping.yes  && data[fieldMapping.consentWithdrawn] !== fieldMapping.yes) && 
                    !isParticipantDataDestroyed(data) &&
                    !data['secondaryDismissed'] && 
                    (!data[fieldMapping.firebaseAuthEmail] || (data[fieldMapping.firebaseAuthEmail] && data[fieldMapping.firebaseAuthEmail].startsWith('noreply')) || !data[fieldMapping.firebaseAuthPhone]))
                {
                    showSecondaryLoginModal();
                }

                template += await renderMainBody(data, collections, 'todo');
                template += `
                    </div>
                    <div class="col-xl-2">
                    </div>
                </div>
                `

                mainContent.innerHTML = translateHTML(template);
                hideAnimation();
                return;
            }

            if (sitesNotEnrolling()[data[fieldMapping.healthcareProvider]]) {
                noLongerEnrollingRender(data[fieldMapping.healthcareProvider]);
            } else {
                renderUserProfile();
            }
            hideAnimation();
            return;
        }

        if (sitesNotEnrolling()[data[fieldMapping.healthcareProvider]]) {
            noLongerEnrollingRender(data[fieldMapping.healthcareProvider]);
        } else {
            consentTemplate();
        }
        hideAnimation();
        return;
    }
    // Completed healthcareProvider form. Did not complete heardAboutStudy form.
    else if (data[fieldMapping.healthcareProvider] && !data[fieldMapping.heardAboutStudyForm] && !isParticipantDataDestroyed(data)) {
        if (sitesNotEnrolling()[data[fieldMapping.healthcareProvider]]) {
            noLongerEnrollingRender(data[fieldMapping.healthcareProvider]);
        } else {
            mainContent.innerHTML = heardAboutStudy();
            addEventHeardAboutStudy();
            hideAnimation();
        }
    }
    // Completed PIN entry form by either entering a PIN number or specifying no PIN number (passive recruit).
    else if (data[fieldMapping.pinNumber] || data[fieldMapping.dontHavePinNumber] === fieldMapping.yes) {
        mainContent.innerHTML = healthCareProvider();
        addEventHealthCareProviderSubmit();
        addEventHealthProviderModalSubmit();
    }
    else {
        // Data Destroyed
        if (isParticipantDataDestroyed(data)) {
            mainContent.innerHTML = `
                <div class="alert alert-warning" id="verificationMessage" style="margin-top:10px;">
                    <div class="row">
                        <div class="col-xl-2"></div>
                        <div class="col-xl-8">
                            <p>
                            At your request, we have deleted your Connect data. If you have any questions, please contact the Connect Support Center by calling 1-877-505-0253 or by emailing  <a href='mailto:ConnectSupport@norc.org'>ConnectSupport@norc.org</a>.
                            </p>
                        </div>
                    </div>
                </div>
            `;
            // None of the above. Start at PIN entry form.
        } else {
            mainContent.innerHTML = requestPINTemplate();
            addEventPinAutoUpperCase();
            addEventRequestPINForm();
            addEventToggleSubmit();
            hideAnimation();
        }
        hideAnimation();
    }
}

const showSecondaryLoginModal = (data) => {
    const modalElement = document.getElementById('connectMainModal');
    if (!modalElement) return;
    
    let modal;

    const hideModal = () => {
        if (modal) {
            modalElement.inert = true;
            modal.hide();
        }
    }

    const showModal = () => {
        if (modal) {
            modalElement.inert = false;
            modal.show();
        }
    }
    
    const attachModalEventListeners = (modalElement) => {
        const dismissalCheckbox = document.getElementById('dismissSecondaryLoginReminder');
        if (dismissalCheckbox) {
            dismissalCheckbox.addEventListener('change', async (event) => {
                let formData = {};
                if (event.target.checked) {
                    formData['secondaryDismissed'] = true;
                    await storeResponse(formData);
                } else {
                    formData['secondaryDismissed'] = null;
                    await storeResponse(formData);
                }
            });
        }

        //Go to profile button
        const continueButton = document.getElementById('secondaryLoginContinue');
        if (continueButton) {
            continueButton.addEventListener('click', () => {
                hideModal();
                window.location.href = "#myprofile";
            });
        }

        // Return focus to the navbar when the modal is hidden
        modalElement.addEventListener('hidden.bs.modal', (event) => {
            sessionStorage.setItem('secondaryModalShown', "yes"); 
            if (event.target === modalElement) {
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    navbar.focus();
                }
            }
        });
    };
    
    modal = new bootstrap.Modal(modalElement);
    showModal();

    const header = document.getElementById('connectModalHeader');
    const body = document.getElementById('connectModalBody');
    const footer = document.getElementById('connectModalFooter');

    if (header && body && footer) {
        header.innerHTML = translateHTML(`<h5 class="modal-title" data-i18n="dashboard.secondaryLoginTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`);
        body.innerHTML = translateHTML(`<span data-i18n="dashboard.secondaryWarning"></span><br><br><div class="d-flex justify-content-center"><input type="checkbox" class="m-1" id="dismissSecondaryLoginReminder"><label for="dismissSecondaryLoginReminder" data-i18n="dashboard.secondaryDismiss"></label></div>`);
        footer.innerHTML = translateHTML(`
            <div class="d-flex">
            <button data-i18n="dashboard.addSecondary" type="button" id="secondaryLoginContinue" title="Add Secondary Login" class="btn btn-primary m-2">Add Secondary Login</button>
            <button data-i18n="dashboard.closeButton" type="button" title="Close" class="btn btn-dark m-2" data-bs-dismiss="modal" aria-label="Close">Close</button>
            </div>
        `)
    }

    attachModalEventListeners(modalElement);
}

const renderWelcomeHeader = (data) => {
    const displayName = data[fieldMapping.prefName] || data[fieldMapping.fName] || '';
    let template = `<div class="row welcome-header">
        <div class="col text-center">
        <span data-i18n="shared.welcomeText">Welcome</span>${displayName ? ', ' + displayName : ''} 
        </div>
    </div>`;

    return translateHTML(template);
}

const renderMainBody = async (data, collections) => {
    let template = `<div class="container connect-container">
        <div class="row gy-3">
            ${await renderSurveysCard(data, collections)}
            ${renderSamplesCard(data)}
            ${await renderReportsCard(data)}
            ${renderPaymentCard(data)}
        </div>
    </div>`;

    return translateHTML(template);
};

const renderSurveysCard = async (data, collections) => {
    const newSurvey = await hasNewSurvey(data, collections);
    let icon = './images/surveys-icon.svg';
    let href = '#surveys';
    let type = 'survey';
    return renderCard(icon, type, href, newSurvey);
}

const renderFormsCard = (data) => {
    let newForm = false;
    //If hippa is revoked or consent is revoked
    if ((data[fieldMapping.revokeHipaa] === fieldMapping.yes  || data[fieldMapping.consentWithdrawn] === fieldMapping.yes) &&
        (!data[fieldMapping.hipaaRevocationSigned] || data[fieldMapping.hipaaRevocationSigned] === fieldMapping.no)) {
        newForm = true;
    }
       
    //If data destroy is requested
    if ((data[fieldMapping.destroyData] === fieldMapping.yes) && 
        (!data[fieldMapping.destroyDataSigned] || data[fieldMapping.destroyDataSigned] == fieldMapping.no)) {
        newForm = true;
    }

    let icon = './images/agreements-icon.svg';
    let href = "#forms"
    let type = "form";
    return renderCard(icon, type, href, newForm);
}

const renderReportsCard = async (data) => {
    const newReport = await checkForNewReports(data);
    let icon = './images/results-data-icon.svg';
    let href = "#reports";
    let type = "report";
    return renderCard(icon, type, href, newReport);
}

const renderSamplesCard = (data) => {
    let template = ``;
    if (data[fieldMapping.userProfileSubmittedAutogen] === fieldMapping.yes &&
        data[fieldMapping.consentSubmitted] === fieldMapping.yes) {
        let icon = './images/samples-icon.svg';
        let href = '#samples';
        let type = 'samples';
        template = renderCard(icon, type, href, false);
    }

    return template;
}

const renderPaymentCard = (data) => {
    let icon = './images/payments-icon.svg';
    let href = "#payment";
    let type = "payment";
    return renderCard(icon, type, href, false);
}

const renderCard = (icon, type, href, newFlag) => {
    let template = `<div class=" col-sm-6 col-lg-4 col-xs-12">
        <div class="card${newFlag ? ' new' : ''} h-100 text-center" id="${type}Card" onClick="javascript:window.location.href='${href}'">
            <div class="new-banner text-start">
                <div class="new-text" data-i18n="dashboard.newText">New</div>
            </div>
            <div class="card-body">
                <div>
                    <img class="card-icon" src="${icon}" alt="" />
                </div>
                <div class="card-title" data-i18n="dashboard.${type}Title">
                    Card Header Here!
                </div>
                <div class="text-start" data-i18n="dashboard.${type}Text">
                    Card Text Here!
                </div>
            </div>
        </div>
    </div>`;

    return template;
}

const checkForNewSurveys = async (data, collections) => {
    let template = ``;
    let modules = questionnaireModules();
    modules = await setModuleAttributes(data, modules, collections);
    let enabledSurveys = 0;
    let completedStandaloneSurveys = 0;
    let completedSurveys = 0;
    let knownCompletedStandaloneSurveys;

    Object.keys(modules).forEach(mod => {
        if (modules[mod].moduleId) {
            if (modules[mod].enabled && !modules[mod].unreleased) enabledSurveys++;
            if (modules[mod].enabled && !modules[mod].unreleased && modules[mod].completed === true) completedSurveys++;
            if (data[fieldMapping[modules[mod].moduleId].completeTs] && fieldMapping[modules[mod].moduleId].standaloneSurvey) completedStandaloneSurveys++;
        }
    });

    if (data[fieldMapping.completedStandaloneSurveys] || data[fieldMapping.completedStandaloneSurveys] === 0) {
        knownCompletedStandaloneSurveys = data[fieldMapping.completedStandaloneSurveys];
        if (knownCompletedStandaloneSurveys < completedStandaloneSurveys) {
            template += `
            <div class="alert alert-warning" id="verificationMessage" style="margin-top:10px;" data-i18n="mytodolist.submittedSurvey">
            Thank you for submitting your survey. If you are using a shared device, please remember to sign out of MyConnect and any email accounts you used to sign into MyConnect.
            </div>
            `;
        }
    }
    else {
        completedStandaloneSurveys = 0;
    }

    if (enabledSurveys > 0 && enabledSurveys === completedSurveys) {
        template += `
            <div class="alert alert-warning" id="verificationMessage" style="margin-top:10px;" data-i18n="mytodolist.surveysCompleted">
                You've finished all available Connect surveys. We will reach out to you when there are new surveys and study activities to complete. Thank you for your contributions to the study!
            </div>
        `;
    }

    return template;
};

const hasNewSurvey = async (data, collections) => {
    let modules = questionnaireModules();
    modules = await setModuleAttributes(data, modules, collections);
    let enabledSurveys = 0;
    let newSurvey = false;
    let knownSurveys;

    Object.keys(modules).forEach(mod => {
        if (modules[mod].moduleId) {
            if (modules[mod].enabled && !modules[mod].unreleased) enabledSurveys++;
        }
    });


    if (data[fieldMapping.enabledSurveys]) {
        knownSurveys = data[fieldMapping.enabledSurveys];
        if (knownSurveys < enabledSurveys) {
            newSurvey = true;
        }
    }
    else {
        newSurvey = true;
    }

    return newSurvey;
}

const checkForNewReports = async (data) => {
    let reports = reportConfiguration();
    reports = await setReportAttributes(data, reports);
    let availableReports = 0;
    let newReport = false;
    let knownReports;

    Object.keys(reports).forEach(rep => {
        if (reports[rep].reportId) {
            if (reports[rep].enabled) availableReports++;
        }
    });

    if (data[fieldMapping.reports.knownReports]) {
        knownReports = data[fieldMapping.reports.knownReports];
        if (knownReports < availableReports) {
            newReport = true;
        }
    }
    else if (availableReports > 0) {
        newReport = true;
    }

    return newReport;
};