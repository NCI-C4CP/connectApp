import { allocateDHQ3Credential, hideAnimation, questionnaireModules, storeResponse, isParticipantDataDestroyed, translateHTML, translateText, getAdjustedTime, getAppSettings, logDDRumError, reportConfiguration, setReportAttributes, updateStartDHQParticipantData } from "../shared.js";
import { blockParticipant, questionnaire } from "./questionnaire.js";
import { renderUserProfile } from "../components/form.js";
import { consentTemplate } from "./consent.js";
import { addEventHeardAboutStudy, addEventRequestPINForm, addEventHealthCareProviderSubmit, addEventPinAutoUpperCase, addEventHealthProviderModalSubmit, addEventToggleSubmit, storeParameters } from "../event.js";
import { heardAboutStudy, requestPINTemplate, healthCareProvider } from "./healthCareProvider.js";
import fieldMapping from '../fieldToConceptIdMapping.js';

export const myToDoList = async (data, fromUserProfile, collections) => {    
    const mainContent = document.getElementById('root');

    // Check for UTM parameters in sessionStorage and store them if not already present
    if (sessionStorage.getItem('utmSource') || sessionStorage.getItem('utmMedium') || sessionStorage.getItem('utmCampaign')) {
        if (!data[fieldMapping.utm.campaign] && !data[fieldMapping.utm.source] && !data[fieldMapping.utm.medium]) {
            await storeParameters();
        }
    }

    // Completed healthcareProvider and heardAboutStudy forms
    if(data['827220437'] && data['142654897']){
        localStorage.eligibilityQuestionnaire = JSON.stringify({'827220437': data['827220437']})
        if(data['919254129'] === 353358909){

            if (data['699625233'] === 353358909 && data['512820379'] === 854703046 && data['821247024'] === 875007964) {
                blockParticipant();
                hideAnimation();
                return;
            }
            
            let topMessage = "";

            if(data['699625233'] && data['699625233'] === 353358909){
                let template = `
                    <div class="row">
                        <div class="col-xl-2">
                        </div>
                        <div class="col-xl-8">
                     
                `;
                let finalMessage = "";
                const defaultMessage = '<p/><br><span data-i18n="mytodolist.withdrawnConnect">You have withdrawn from Connect. We will not collect any more data from you. If you have any questions, please contact the Connect Support Center by calling 1-877-505-0253 or by emailing <a href="mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a>.</span><br>';

                if (isParticipantDataDestroyed(data)){
                    finalMessage += '<span data-i18n="mytodolist.deletedData">At your request, we have deleted your Connect data. If you have any questions, please contact the Connect Support Center by calling 1-877-505-0253 or by emailing  <a href="mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a>.</span>'
                }
                else if (data['831041022'] === 353358909){
                    if (!data['359404406'] || data['359404406'] == fieldMapping.no){
                        finalMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span>' + defaultMessage
                    }
                    else if((data[fieldMapping.consentWithdrawn] && data[fieldMapping.consentWithdrawn] !== fieldMapping.no) && (!data[fieldMapping.hipaaRevocationSigned] || data[fieldMapping.hipaaRevocationSigned] == fieldMapping.no)){
                        finalMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span>' + defaultMessage
                    }
                    else{
                        finalMessage += defaultMessage
                    }
                }
                else if ((data[fieldMapping.consentWithdrawn] && data[fieldMapping.consentWithdrawn] !== fieldMapping.no)){
                    
                    if (!data[fieldMapping.hipaaRevocationSigned] || data[fieldMapping.hipaaRevocationSigned] == fieldMapping.no){
                        finalMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span>' + defaultMessage
                    }
                    else{
                        finalMessage += defaultMessage
                    }
                }
                if(finalMessage.trim() !== ""){
                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;">
                        ${finalMessage}
                    </div>
                    `
                    mainContent.innerHTML = translateHTML(template);
                    hideAnimation();
                    return;
                }
                else if (((data[fieldMapping.revokeHipaa] === fieldMapping.yes)) && (!data[fieldMapping.hipaaRevocationSigned] || data[fieldMapping.hipaaRevocationSigned] === fieldMapping.no)){
                    topMessage += '<span data-i18n="mytodolist.newFormSign">You have a new <a href="#forms">form</a> to sign.</span><p/><br>';
                }
                if(!data['821247024'] || data['821247024'] == 875007964){
                    if(data['unverifiedSeen'] && data['unverifiedSeen'] === true){
                        topMessage += '';
                    }
                    else{
                        topMessage = '';
                    }
                    topMessage += `
                        ${fromUserProfile ? 
                            `<span data-i18n="mytodolist.completingProfile">Thank you for completing your profile for the Connect for Cancer Prevention Study. Next, the Connect team at your health care system will check that you are eligible to be part of the study. We will contact you within a few business days.
                            <br>
                            In the meantime, please begin by completing your first Connect survey.</span>`:
                            `<span data-i18n="mytodolist.checkEligibility">The Connect team at your health care system is working to check that you are eligible to be part of the study.</span> 
                            ${checkIfComplete(data) ? '<span data-i18n="mytodolist.thankYouCompleting">Thank you for completing your first Connect survey! We will be in touch with next steps.</span>': '<span data-i18n="mytodolist.firstSurvey">In the meantime, please begin by completing your first Connect survey.</span>'}`}
                    `
                }
                else if(data['821247024'] && data['821247024'] == 197316935) {
                    if(data['verifiedSeen'] && data['verifiedSeen'] === true){
                        if(checkIfComplete(data)) {
                            if(!data['firstSurveyCompletedSeen']) {
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
                    else{
                        topMessage += `
                            <span data-i18n="mytodolist.confirmedEligibility">Great news! We have confirmed that you are eligible for the Connect for Cancer Prevention Study. You are now an official Connect participant.</span>
                            <br>
                            ${checkIfComplete(data) ? '<span data-i18n="mytodolist.thankYouCompleting">Thank you for completing your first Connect survey! We will be in touch with next steps.</span>':'<span data-i18n="mytodolist.completeFirstSurvey">The next step is to complete your first Connect survey.</span>'}
                            <br>
                            <span data-i18n="mytodolist.thankYouBeingPart">Thank you for being a part of Connect and for your commitment to help us learn more about how to prevent cancer.</span>
                            <br>
                        `
                        let formData = {};
                        formData['verifiedSeen'] = true;
                        storeResponse(formData);
                    }
                }
                else if(data['821247024'] && data['821247024'] == 219863910) {
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
                else if(data['821247024'] && data['821247024'] == 922622075) {
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
                    if (site === fieldMapping.healthPartners){
                        body = `<span data-i18n="mytodolist.bodyHealthPartners">HealthPartners by emailing <a href = "mailto:ConnectStudy@healthpartners.com">ConnectStudy@healthpartners.com</a> or calling 952-967-5067</span>`
                    }
                    if (site === fieldMapping.henryFordHealth){
                        body = `<span data-i18n="mytodolist.bodyHenryFord">Henry Ford Health by emailing <a href = "mailto:ConnectStudy@hfhs.org">ConnectStudy@hfhs.org</a></span>`
                    }
                    if(site === fieldMapping.kaiserPermanenteCO){
                        body = `<span data-i18n="mytodolist.bodyKPColorado">KP Colorado by emailing <a href = "mailto:Connect-Study-KPCO@kp.org">Connect-Study-KPCO@kp.org</a> or calling 303-636-3126</span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteGA){
                        body = `<span data-i18n="mytodolist.bodyKPGeorgia">KP Georgia by emailing <a href = "mailto:Connect-Study-KPGA@kp.org">Connect-Study-KPGA@kp.org</a> or calling 404-745-5115</span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteHI){
                        body = `<span data-i18n="mytodolist.bodyKPHawaii">KP Hawaii by emailing <a href = "mailto:Connect-Study-KPHI@kp.org">Connect-Study-KPHI@kp.org</a> or calling 833-417-0846</span>`
                    }
                    if (site === fieldMapping.kaiserPermanenteNW){
                        body = `<span data-i18n="mytodolist.bodyKPNorthwest">KP Northwest by emailing <a href = "mailto:Connect-Study-KPNW@kp.org">Connect-Study-KPNW@kp.org</a> or calling 1-866-554-6039 (toll-free) or 503-528-3985</span>`
                    }
                    if (site === fieldMapping.marshfieldClinical){
                        body = `<span data-i18n="mytodolist.bodyConnectSupport">the Connect Support Center by emailing <a href = "mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a> or calling 1-877-505-0253</span>`
                    }
                    if (site === fieldMapping.sanfordHealth){
                        body = `<span data-i18n="mytodolist.bodySanfordHealth">Sanford Health by emailing <a href = "mailto:ConnectStudy@sanfordhealth.org">ConnectStudy@sanfordhealth.org</a> or calling 605-312-6100</span>`
                    }
                    if (site === fieldMapping.uChicagoMedicine){
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
                    window.scrollTo(0,0)
                    hideAnimation();
                    return;
                }
                
                const surveyMessage = await checkForNewSurveys(data, collections);

                if(surveyMessage) {
                    template += surveyMessage;
                }

                const reportMessage = await checkForNewReports(data);

                if(reportMessage) {
                    template += reportMessage;
                }
                
                if(topMessage.trim() !== ""){
                    template += `
                    <div class="alert alert-warning" role="alert" aria-live="polite" id="verificationMessage" style="margin-top:10px;">
                        ${topMessage}
                    </div>
                    `
                }

                template += `
                    <ul class="nav nav-tabs" role="tablist" style="border-bottom:none; margin-top:20px">
                        <li class="nav-item" style=:padding-left:10px>
                            <button class=" nav-link navbar-btn survey-Active-Nav" id="surveysToDoTab" role="tab" aria-selected="true" aria-controls="todoPanel" data-i18n="mytodolist.toDoButton">To Do</button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link navbar-btn survey-Inactive-Nav" id="surveysCompleted" role="tab" aria-selected="false" aria-controls="completedPanel"data-i18n="mytodolist.completed">Completed</button>
                        </li>
                    </ul>`
                template += `
                    <div class="surveyMainBody" id="surveyMainBody">
                `;
                
                template += await renderMainBody(data, collections, 'todo');
                template += `</ul>`
                template += `
                        </div>
                    </div>
                    <div class="col-xl-2">
                    </div>
                </div>
                `
                
                mainContent.innerHTML = translateHTML(template);
                document.getElementById('surveysToDoTab').addEventListener('click', async () => {
                    document.getElementById('surveyMainBody').innerHTML = await renderMainBody(data, collections, 'todo');
                    if(!document.getElementById('surveysToDoTab').classList.contains('survey-Active-Nav')){
                        let toActive = document.getElementById('surveysToDoTab');   
                        let toInactive = document.getElementById('surveysCompleted');
                        toActive.classList.remove('survey-Inactive-Nav')
                        toActive.classList.add('survey-Active-Nav')
                        toInactive.classList.add('survey-Inactive-Nav')
                        toInactive.classList.remove('survey-Active-Nav')
                        addEventToDoList();
                        addDHQListener(data[fieldMapping.DHQ3.statusFlag], data['Connect_ID']);
                    }
                })
                document.getElementById('surveysCompleted').addEventListener('click', async () => {
                    if(!document.getElementById('surveysCompleted').classList.contains('survey-Active-Nav')){
                        let toInactive = document.getElementById('surveysToDoTab');   
                        let toActive = document.getElementById('surveysCompleted');
                        toActive.classList.remove('survey-Inactive-Nav')
                        toActive.classList.add('survey-Active-Nav')
                        toInactive.classList.add('survey-Inactive-Nav')
                        toInactive.classList.remove('survey-Active-Nav')
                    }
                    document.getElementById('surveyMainBody').innerHTML = await renderMainBody(data, collections, 'completed');
                    addEventToDoList();
                })
                addEventToDoList();
                addDHQListener(data[fieldMapping.DHQ3.statusFlag], data['Connect_ID']);
                hideAnimation();
                return;
            }
            renderUserProfile();
            hideAnimation();
            return;
        }

        consentTemplate();
        hideAnimation();
        return;
    }
    // Completed healthcareProvider form. Did not complete heardAboutStudy form.
    else if(data['827220437'] && !data['142654897'] && !isParticipantDataDestroyed(data)){
        mainContent.innerHTML =  heardAboutStudy();
        addEventHeardAboutStudy();
        hideAnimation();
    }
    // Completed PIN entry form by either entering a PIN number or specifying no PIN number (passive recruit).
    else if (data[fieldMapping.pinNumber] || data[fieldMapping.dontHavePinNumber] === fieldMapping.yes){
        mainContent.innerHTML = healthCareProvider();
        addEventHealthCareProviderSubmit();
        addEventHealthProviderModalSubmit();
    }
    else{
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

const addEventToDoList = () => {
    const enabledButtons = document.querySelectorAll("button.questionnaire-module:not(.btn-disabled)");
    enabledButtons.forEach((btn) => {
      if (!btn.hasClickListener) {
        btn.addEventListener("click", () => questionnaire(btn.getAttribute("module_id")));
        btn.hasClickListener = true;
      }
    });
  };

const renderMainBody = async (data, collections, tab) => {
    let template = `<ul class="questionnaire-module-list" role="list">`;
    let modules = questionnaireModules();
    modules = await setModuleAttributes(data, modules, collections);
    
    let toDisplaySystem = [
        {
            header: "First Survey",
            body: [
                "Background and Overall Health",
                "Where You Live and Work",
                "Medications, Reproductive Health, Exercise, and Sleep",
                "Smoking, Alcohol, and Sun Exposure",
            ],
        },
        { body: ["Enter SSN"] },
    ];
    if (data["821247024"] === 875007964) {
        toDisplaySystem = [
            {
                header: "First Survey",
                body: [
                    "Background and Overall Health",
                    "Where You Live and Work",
                    "Medications, Reproductive Health, Exercise, and Sleep",
                    "Smoking, Alcohol, and Sun Exposure",
                ],
            },
        ];
    }

    if(modules['Covid-19'].enabled) {
        toDisplaySystem.unshift({'body':['Covid-19']});
    }

    if(modules['Biospecimen Survey'].enabled) {
        toDisplaySystem.unshift({'body':['Biospecimen Survey']});
    }

    if(modules['Clinical Biospecimen Survey'].enabled) {
        toDisplaySystem.unshift({'body':['Clinical Biospecimen Survey']});
    }

    if(modules['Menstrual Cycle'].enabled) {
        toDisplaySystem.unshift({'body':['Menstrual Cycle']});
    }
    
    if(modules['Mouthwash'].enabled) {
        toDisplaySystem.unshift({'body':['Mouthwash']});
    }

    if(modules['PROMIS'].enabled) {
        toDisplaySystem.unshift({'body':['PROMIS']});
    }

    if(modules['Connect Experience 2024'].enabled) {
        toDisplaySystem.unshift({'body':['Connect Experience 2024']});
    }

    modules["Cancer Screening History"].enabled && toDisplaySystem.unshift({ body: ["Cancer Screening History"] });

    modules["Diet History Questionnaire III (DHQ III)"].enabled && toDisplaySystem.unshift({ body: ["Diet History Questionnaire III (DHQ III)"] });

    if(tab === 'todo'){
        for(let obj of toDisplaySystem){
            let started = false;
            if(obj['body']){
                let anyFound = false;
                for(let key of obj['body']){
                    if(!modules[key].completed){
                        anyFound = true;
                        break;
                    }
                }
                
                if (!anyFound) continue;

                for(let key of obj['body']){
                    if (!started && obj['header']) {
                        const thisKey = obj['header'];
                        const moduleTitle = modules[thisKey]['header'] || thisKey;
                        const isEnabled = modules[thisKey].enabled && !modules[thisKey].unreleased;
                        const buttonAction = modules[thisKey].unreleased ? 'mytodolist.comingSoon' : data[fieldMapping[modules[thisKey].moduleId]?.statusFlag] === fieldMapping.moduleStatus.started ? 'mytodolist.continue' : 'mytodolist.start';
                        const strippedModuleTitle = moduleTitle?.replace(/(\s|[-._\(\),])/g, '') || '';
                        const ariaLabelButton = translateText(buttonAction) + ' ' + translateText(`shared.mod${strippedModuleTitle}`);

                        started = true;
                        template += `
                            <li class="w-95 mx-auto mb-3 border rounded" role="listitem" aria-label="${moduleTitle}">
                                <div class="row" role="region" aria-label="${moduleTitle} information">
                                    ${modules[thisKey]['hasIcon'] === false? `` : `
                                    <div class="col-md-1" aria-hidden="true">
                                        <i class="fas fa-clipboard-list d-none d-md-block ps-2 fs-1" data-i18n="mytodolist.surveyIcon" title="Survey Icon" style="color:#c2af7f;"></i>
                                    </div>
                                    `}
                                    <div class="${modules[thisKey]['hasIcon'] === false? 'col-9':'col-md-8'}">
                                        <p style="font-style:bold; font-size:24px; margin-left:10px">
                                            <b style="color:#5c2d93; font-size:18px;">
                                            <span data-i18n="${`shared.mod${strippedModuleTitle}`}">${moduleTitle}</span>
                                            </b>
                                            <br> 
                                            <span data-i18n="${modules[thisKey].description}"></span>
                                            ${modules[thisKey].estimatedTime ? `
                                            <em>
                                            <span data-i18n="mytodolist.estimatedTime">Estimated Time:</span> <span data-i18n="${modules[thisKey].estimatedTime}"></span>
                                            </em>
                                            ` : ''}
                                        </p>
                                    </div>
                                    ${modules[thisKey]['noButton'] === true? '' : `
                                    <div class="col-md-3">
                                        <button class="btn survey-list-active btn-agreement questionnaire-module ${isEnabled ? 'list-item-active' : 'btn-disabled survey-list-inactive disabled'}" ${isEnabled ? '': 'aria-disabled="true"'} title="${moduleTitle}" module_id="${modules[thisKey].moduleId}" aria-label="${ariaLabelButton}">
                                            <b data-i18n="${buttonAction}"></b>
                                        </button>
                                    </div>
                                    `}
                                </div>
                            `;
                    }

                    if (!modules[key].completed) {
                        const moduleTitle = modules[key]['header'] || key;
                        const isEnabled = modules[key].enabled && !modules[key].unreleased;
                        const buttonAction = modules[key].unreleased ? 'mytodolist.comingSoon' : (data[fieldMapping[modules[key].moduleId].statusFlag] === fieldMapping.moduleStatus.started ? 'mytodolist.continue' : 'mytodolist.start');
                        const strippedModuleTitle = moduleTitle?.replace(/(\s|[-._\(\),])/g, '') || '';
                        const ariaLabelButton = translateText(buttonAction) + ' ' + translateText(`shared.mod${strippedModuleTitle}`);
                        const tooltipText = translateText(`shared.mod${strippedModuleTitle}`);
                        const commonButtonClasses = "col-md-3 d-flex align-items-center justify-content-center";

                        let actionButtonHtml = ''; // Default to no button

                        if (modules[key]['noButton'] !== true) {
                            // Button for DHQ3 Survey (link to external site)
                            if (key === "Diet History Questionnaire III (DHQ III)") {
                                if (isEnabled) {
                                    let targetUrl;
                                    const respondentUUID = data?.[fieldMapping.DHQ3.uuid];
                                    if (respondentUUID) {
                                        targetUrl = `https://www.dhq3.org/respondent-login/?uuid=${respondentUUID}`;
                                        
                                        actionButtonHtml = `
                                            <div class="${commonButtonClasses}">
                                                <a href="${targetUrl}"
                                                    id="dhq3-survey-link"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="btn survey-list-active btn-agreement questionnaire-module d-flex align-items-center justify-content-center"
                                                    role="button"
                                                    title="${tooltipText}"
                                                    aria-label="${ariaLabelButton}">
                                                    <b data-i18n="${buttonAction}"></b>
                                                </a>
                                            </div>`;
                                    }
                                }

                            // Button for Quest modules
                            } else {
                                actionButtonHtml = `
                                    <div class="${commonButtonClasses}">
                                        <button class="btn survey-list-active btn-agreement questionnaire-module ${isEnabled ? 'list-item-active' : 'btn-disabled survey-list-inactive disabled'}" ${isEnabled ? '' : 'aria-disabled="true"'} title="${tooltipText}" module_id="${modules[key].moduleId}" aria-label="${ariaLabelButton}">
                                            <b data-i18n="${buttonAction}"></b>
                                        </button>
                                    </div>`;
                            }
                        }

                        template += `
                            <div class="w-95 mx-auto mb-3 border rounded" role="listitem" aria-label="${moduleTitle} details">
                                <div class="row">
                                    ${modules[key]['hasIcon'] === false ? `` : `
                                    <div class="col-md-1" aria-hidden="true">
                                        <i class="fas fa-clipboard-list d-none d-md-block ps-2 fs-1" data-i18n="mytodolist.surveyIcon" title="Survey Icon" style="color:#c2af7f;"></i>
                                    </div>
                                    `}
                                    <div class="${modules[key]['hasIcon'] === false ? 'col-9' : 'col-md-8'}">
                                    <p style="font-style:bold; font-size:24px; margin-left:10px">
                                        <b style="color:#5c2d93; font-size:18px;">
                                        <span data-i18n="${`shared.mod${strippedModuleTitle}`}">${moduleTitle}</span>
                                        </b>
                                        <br> 
                                        <span data-i18n="${modules[key].description}"></span>
                                        <br>
                                        <br>
                                        ${modules[key].estimatedTime ? `
                                        <em>
                                        <span data-i18n="mytodolist.estimatedTime">Estimated Time:</span> <span data-i18n="${modules[key].estimatedTime}"></span>
                                        </em>
                                        ` : ''}
                                    </p>
                                    </div>
                                    ${actionButtonHtml}
                                </div>
                            </div>`;
                    } else {
                        const moduleTitle = modules[key]['header'] || key; // Use the module's header or key as the title
                        const ariaLabelModule = `${moduleTitle} completed details`;
                        template += `
                            <div class="w-95 mx-auto mb-3 border rounded" role="listitem" aria-label="${ariaLabelModule}">
                                <div class="row">
                                    ${modules[key]['hasIcon'] === false? `` : `
                                    <div class="col-md-1" aria-hidden="true">
                                        <i class="fas fa-clipboard-list d-none d-md-block ps-2 fs-1" data-i18n="mytodolist.surveyIcon" title="Survey Icon" style="color:#c2af7f;"></i>
                                    </div>
                                    `}

                                    <div class="${modules[key]['hasIcon'] === false? 'col-9':'col-md-8'}">
                                    <p style="font-style:bold; font-size:24px; margin-left:10px">
                                        <b style="color:#5c2d93; font-size:18px;">
                                        <span data-i18n="${`shared.mod${moduleTitle.replace(/(\s|[-._\(\),])/g,'')}`}">${moduleTitle}</span>
                                        </b>
                                        <br> 
                                        <span data-i18n="${modules[key].description}"></span>
                                        <br>
                                        <br>
                                        ${modules[key].estimatedTime ? `
                                        <em>
                                        <span data-i18n="mytodolist.completedTime">Completed Time:</span> ${new Date(data[fieldMapping[modules[key].moduleId].completeTs]).toLocaleString()}
                                        </em>
                                        ` : ''}
                                    </p>
                                    </div>
                                </div>
                            </div>`;
                    }
                }

                if (started === true) {
                    template += '</li>';
                }
            }
        }
    } else {
        for(let obj of toDisplaySystem){
            let started = false;
            if(obj['body']){
                let anyFound = false;
                for(let key of obj['body']){
                    if(!modules[key].completed){
                        anyFound = true;
                        break;
                    }
                }

                for(let key of obj['body']){
                    if(!anyFound){
                        if(!started){
                            if(obj['header']){
                                let thisKey = obj['header'];
                                
                                started = true;
                                const moduleTitle = modules[thisKey]['header'] || thisKey; // Use the module's header or key as the title
                                template += `<li role="listitem" class="w-95 mx-auto mb-3 border rounded">
                                                <div class="row" aria-labelledby="header-${thisKey}">
                                                    ${modules[thisKey]['hasIcon'] === false? `` : `
                                                    <div class="col-md-1" aria-hidden="true">
                                                        <i class="fas fa-clipboard-list d-none d-md-block ps-2 fs-1" data-i18n="mytodolist.surveyIcon" title="Survey Icon" style="color:#c2af7f;"></i>
                                                    </div>
                                                    `}

                                                    <div class="${modules[thisKey]['hasIcon'] === false? 'col-9':'col-md-8'}">
                                                    <p style="font-style:bold; font-size:24px; margin-left:10px">
                                                        <b id="header-${thisKey}" style="color:#5c2d93; font-size:18px;">
                                                        <span data-i18n="${`shared.mod${moduleTitle.replace(/(\s|[-._\(\),])/g,'')}`}">${moduleTitle}</span>
                                                        </b>
                                                        <br> 
                                                        <span data-i18n="${modules[thisKey].description}"></span>
                                                        ${modules[thisKey].estimatedTime ? `
                                                        <em>
                                                        <span data-i18n="mytodolist.estimatedTime">Estimated Time:</span> <span data-i18n="${modules[thisKey].estimatedTime}"></span>
                                                        </em>
                                                        ` : ''}
                                                        
                                                    </p>
                                                    </div>
                                                
                                                    ${modules[thisKey]['noButton'] === true? '' : `
                                                    <div class="col-md-3">
                                                        <button class="btn survey-list-active btn-agreement questionnaire-module ${modules[thisKey].enabled ? 'list-item-active' : 'btn-disabled survey-list-inactive disabled'}" ${modules[thisKey].enabled ? '': 'aria-disabled="true"'} title="${thisKey}" module_id="${modules[thisKey].moduleId}"><b data-i18n="mytodolist.start">Start</b></button>    
                                                    </div>
                                                    `}
                                                </div>
                                            </li>
                                            `;
                            }
                        }
                        const moduleTitle = modules[key]['header'] || key;
                        template += `<div role="listitem" class="w-95 mx-auto mb-3 border rounded">
                            <div class="row" aria-labelledby="completed-header-${key}">
                                <div class="col-md-1" aria-hidden="true">
                                    <i class="fas fa-clipboard-list d-none d-md-block ps-2 fs-1" data-i18n="mytodolist.surveyIcon" title="Survey Icon" style="color:#c2af7f;"></i>
                                </div>
                                <div class="col-md-8">
                                <p style="font-style:bold; font-size:24px; margin-left:10px">
                                    <b id="completed-header-${key} style="color:#5c2d93; font-size:18px;">
                                    <span data-i18n="${`shared.mod${moduleTitle.replace(/(\s|[-._\(\),])/g,'')}`}">${moduleTitle}</span>
                                    </b>
                                    <br>
                                    <em>
                                       <span data-i18n="${modules[key].description}"></span>
                                        </em>
                                </p>
                                </div>
                            
                                <div class="col-md-3">
                                <span data-i18n="mytodolist.completedTime">Completed Time:</span> ${new Date(data[fieldMapping[modules[key].moduleId].completeTs]).toLocaleString()}
                                </div>
                            </div>
                        </div>`;
                    }
                }
                if (started === true) {
                    template += '</li>';
                }
            }
        }
    }

    return translateHTML(template);
};

const checkIfComplete = (data) => {
    
    let module1Complete = data[fieldMapping.Module1.statusFlag] === fieldMapping.moduleStatus.submitted;
    let module2Complete = data[fieldMapping.Module2.statusFlag] === fieldMapping.moduleStatus.submitted;
    let module3Complete = data[fieldMapping.Module3.statusFlag] === fieldMapping.moduleStatus.submitted;
    let module4Complete = data[fieldMapping.Module4.statusFlag] === fieldMapping.moduleStatus.submitted;

    return module1Complete && module2Complete && module3Complete && module4Complete;
};

const checkForNewSurveys = async (data, collections) => {
    let template = ``;
    let modules = questionnaireModules();
    modules = await setModuleAttributes(data, modules, collections);
    let enabledSurveys = 0;
    let newSurvey = false;
    let knownSurveys;
    let completedStandaloneSurveys = 0;
    let completedSurveys = 0;
    let knownCompletedStandaloneSurveys;

    Object.keys(modules).forEach(mod => {
        if(modules[mod].moduleId) {
            if(modules[mod].enabled && !modules[mod].unreleased) enabledSurveys++;
            if(modules[mod].enabled && !modules[mod].unreleased && modules[mod].completed === true) completedSurveys++;
            if(data[fieldMapping[modules[mod].moduleId].completeTs] && fieldMapping[modules[mod].moduleId].standaloneSurvey) completedStandaloneSurveys++;
        }
    });

    if(data[fieldMapping.enabledSurveys]) {
        knownSurveys = data[fieldMapping.enabledSurveys];
        if(knownSurveys < enabledSurveys) {
            newSurvey = true;
        }
    }
    else {
        newSurvey = true;
    }

    if(newSurvey) {
        template += `
            <div class="alert alert-warning" id="verificationMessage" style="margin-top:10px;" data-i18n="mytodolist.newSurvey">
                You have a new survey to complete.
            </div>
        `;
    }

    
    if(data[fieldMapping.completedStandaloneSurveys] || data[fieldMapping.completedStandaloneSurveys] === 0) {
        knownCompletedStandaloneSurveys = data[fieldMapping.completedStandaloneSurveys];
        if(knownCompletedStandaloneSurveys < completedStandaloneSurveys) {
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
    } else {
        template += `
            <div class="alert alert-warning" id="notesOnLanguage" style="margin-top:10px;" data-i18n="mytodolist.notesOnLanguage">
                If you'd like to take this survey in another language, simply click the button at the top of the page to switch to your preferred language before you start. Once you start this survey in one language, you'll need to finish it in that language.
            </div>
        `;
    }

    let obj = {};
    obj[fieldMapping.enabledSurveys] = enabledSurveys;
    obj[fieldMapping.completedStandaloneSurveys] = completedStandaloneSurveys;

    await storeResponse(obj);
    return template;
};

const checkForNewReports = async (data) => {
    let template = ``;
    let reports = reportConfiguration();
    reports = await setReportAttributes(data, reports);
    let availableReports = 0;
    let newReport = false;
    let knownReports;

    Object.keys(reports).forEach(rep => {
        if(reports[rep].reportId) {
            if(reports[rep].enabled) availableReports++;
        }
    });

    if(data[fieldMapping.reports.knownReports]) {
        knownReports = data[fieldMapping.reports.knownReports];
        if(knownReports < availableReports) {
            newReport = true;
        }
    }
    else if (availableReports > 0) {
        newReport = true;
    }

    if(newReport) {
        template += `
            <div class="alert alert-warning" id="verificationMessage" style="margin-top:10px;" data-i18n="reports.newReport">
                You have a new report available!
            </div>
        `;
    }

    let obj = {
        [fieldMapping.reports.knownReports]: availableReports
    };

    await storeResponse(obj);
    return template;
};

const setModuleAttributes = async (data, modules, collections) => {
    modules['First Survey'] = {};
    modules['First Survey'].description = 'mytodolist.mainHeaderFirstSurveyDescription';
    modules['First Survey'].hasIcon = false;
    modules['First Survey'].noButton = true;
    
    modules['Background and Overall Health'].header = 'Background and Overall Health'; 
    modules['Background and Overall Health'].description = 'mytodolist.mainBodyBackgroundDescription';
    modules['Background and Overall Health'].estimatedTime = 'mytodolist.20_30minutes';
    
    modules['Medications, Reproductive Health, Exercise, and Sleep'].header = 'Medications, Reproductive Health, Exercise, and Sleep'; 
    modules['Medications, Reproductive Health, Exercise, and Sleep'].description = 'mytodolist.mainBodyMedicationsDescription';
    modules['Medications, Reproductive Health, Exercise, and Sleep'].estimatedTime = 'mytodolist.20_30minutes';
    
    modules['Smoking, Alcohol, and Sun Exposure'].header = 'Smoking, Alcohol, and Sun Exposure'; 
    modules['Smoking, Alcohol, and Sun Exposure'].description = 'mytodolist.mainBodySmokingDescription';
    modules['Smoking, Alcohol, and Sun Exposure'].estimatedTime = 'mytodolist.20_30minutes';
    
    modules["Where You Live and Work"].header = 'Where You Live and Work';
    modules["Where You Live and Work"].description  = 'mytodolist.mainBodyLiveWorkDescription';
    modules["Where You Live and Work"].estimatedTime = 'mytodolist.20_30minutes';
    
    modules['Enter SSN'].header = 'Your Social Security Number (SSN)';
    modules['Enter SSN'].description = 'mytodolist.mainBodySSNDescription';
    modules['Enter SSN'].hasIcon = false;
    modules['Enter SSN'].noButton = false;
    modules['Enter SSN'].estimatedTime = 'mytodolist.less5minutes';
    
    modules['Covid-19'].header = 'COVID-19 Survey';
    modules['Covid-19'].description = 'mytodolist.mainBodyCovid19Description';
    modules['Covid-19'].hasIcon = false;
    modules['Covid-19'].noButton = false;
    modules['Covid-19'].estimatedTime = 'mytodolist.10minutes';

    modules['Biospecimen Survey'].header = 'Baseline Blood, Urine, and Mouthwash Sample Survey';
    modules['Biospecimen Survey'].description = 'mytodolist.mainBodyBiospecimenDescription';
    modules['Biospecimen Survey'].estimatedTime = 'mytodolist.5minutes';
    
    modules['Clinical Biospecimen Survey'].header = 'Baseline Blood and Urine Sample Survey';
    modules['Clinical Biospecimen Survey'].description = 'mytodolist.mainBodyClinicalBiospecimenDescription';
    modules['Clinical Biospecimen Survey'].estimatedTime = 'mytodolist.5minutes';

    modules['Menstrual Cycle'].header = 'Menstrual Cycle Survey';
    modules['Menstrual Cycle'].description = 'mytodolist.mainBodyMenstrualDescription';
    modules['Menstrual Cycle'].estimatedTime = 'mytodolist.5minutes';

    modules['Mouthwash'].header = 'At-Home Mouthwash Sample Survey';
    modules['Mouthwash'].description = 'mytodolist.mainBodyMouthwashDescription';
    modules['Mouthwash'].estimatedTime = 'mytodolist.5minutes';

    modules['PROMIS'].header = 'Quality of Life Survey';
    modules['PROMIS'].description = 'mytodolist.mainBodyPROMISDescription';
    modules['PROMIS'].estimatedTime = 'mytodolist.10_15minutes';

    modules['Connect Experience 2024'].header = '2024 Connect Experience Survey';
    modules['Connect Experience 2024'].description = 'mytodolist.mainBodyExperience2024Description';
    modules['Connect Experience 2024'].estimatedTime = 'mytodolist.15_20minutes';

    modules['Cancer Screening History'].header = 'Cancer Screening History Survey';
    modules['Cancer Screening History'].description = 'mytodolist.mainBodyCancerScreeningHistoryDescription';
    modules['Cancer Screening History'].estimatedTime = 'mytodolist.15_20minutes';

    modules['Diet History Questionnaire III (DHQ III)'].header = 'Diet History Questionnaire III (DHQ III)';
    modules['Diet History Questionnaire III (DHQ III)'].description = 'mytodolist.mainBodyDHQ3Description';
    modules['Diet History Questionnaire III (DHQ III)'].estimatedTime = 'mytodolist.45_60minutes';

    const currentTime = new Date();
    
    if(data['331584571']?.['266600170']?.['840048338']) {
        modules['Biospecimen Survey'].enabled = true;
        modules['Covid-19'].enabled = true;
    }

    if(collections && collections.filter(collection => collection['650516960'] === 664882224).length > 0) {
        modules['Clinical Biospecimen Survey'].enabled = true;
        modules['Covid-19'].enabled = true;
    }

    if (data[fieldMapping.menstrualSurveyEligible] === 353358909) {
        modules['Menstrual Cycle'].enabled = true;

        if (data[fieldMapping.MenstrualCycle.statusFlag] !== fieldMapping.moduleStatus.submitted) {

            // Survey will become available on dashboard 120 hours (5 days) after completion of bio survey if participant is menstrual survey eligible
            const firstCutoffDate = new Date();
            firstCutoffDate.setDate(firstCutoffDate.getDate() - 5);
            const dateBecomeAvailable = firstCutoffDate.toISOString()

            // Survey will be closed if it has been more than 45 days since the Biospec survey submission and the MC survey is not submitted yet.
            const secondCutoffDate = new Date();
            secondCutoffDate.setDate(secondCutoffDate.getDate() - 45);
            const dateBecomeUnavailable = secondCutoffDate.toISOString()

            if (data[fieldMapping.Biospecimen.statusFlag] === fieldMapping.moduleStatus.submitted) {
                if (data[fieldMapping.Biospecimen.completeTs] < dateBecomeUnavailable ||
                    data[fieldMapping.Biospecimen.completeTs] > dateBecomeAvailable
                ) {
                    modules['Menstrual Cycle'].enabled = false;
                }
            }
            else if (data[fieldMapping.ClinicalBiospecimen.statusFlag] === fieldMapping.moduleStatus.submitted) {
                if (data[fieldMapping.ClinicalBiospecimen.completeTs] < dateBecomeUnavailable ||
                    data[fieldMapping.ClinicalBiospecimen.completeTs] > dateBecomeAvailable
                ) {
                    modules['Menstrual Cycle'].enabled = false;
                }
            }
        }
    }

    if (
        data[fieldMapping.verification] === fieldMapping.verified &&
        data[fieldMapping.PROMIS.statusFlag] !==
            fieldMapping.moduleStatus.submitted
    ) {
        modules["PROMIS"].enabled = true;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        if (data[fieldMapping.verifiedDate] && data[fieldMapping.verifiedDate] > cutoffDate.toISOString()) {
            modules["PROMIS"].enabled = false;
        }
    }
    
    if (data[fieldMapping.Module1.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Background and Overall Health'].completed = true;
        
        modules["Smoking, Alcohol, and Sun Exposure"].enabled = true;
        modules["Where You Live and Work"].enabled = true;
        modules['Medications, Reproductive Health, Exercise, and Sleep'].enabled = true;
    }

    if (data[fieldMapping.Module2.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Medications, Reproductive Health, Exercise, and Sleep'].completed = true;
    }

    if (data[fieldMapping.Module3.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Smoking, Alcohol, and Sun Exposure'].completed = true;
    }

    if (data[fieldMapping.Module4.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules["Where You Live and Work"].completed  = true;
    }

    if ((data[fieldMapping.verification] && data[fieldMapping.verification] === fieldMapping.verified)) { 
        modules['Enter SSN'].enabled = true;
    }

    if (data[fieldMapping.ModuleSsn.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Enter SSN'].completed = true;
    }
    
    if (data[fieldMapping.ModuleCovid19.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Covid-19'].completed = true;
    }

    if (data[fieldMapping.Biospecimen.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Biospecimen Survey'].completed = true;
    }

    if (data[fieldMapping.MenstrualCycle.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Menstrual Cycle'].completed = true;
    }

    if (data[fieldMapping.ClinicalBiospecimen.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Clinical Biospecimen Survey'].completed = true;
    }

    const mouthwashData = data[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwash];
    if (
      mouthwashData?.[fieldMapping.kitType] === fieldMapping.kitTypeValues.mouthwash &&
      (mouthwashData?.[fieldMapping.kitStatus] === fieldMapping.kitStatusValues.shipped ||
        mouthwashData?.[fieldMapping.kitStatus] === fieldMapping.kitStatusValues.received)
    ) {
      modules.Mouthwash.enabled = true;
    }

    if (data[fieldMapping.Mouthwash.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Mouthwash'].completed = true;
    }

    if (data[fieldMapping.PROMIS.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['PROMIS'].enabled = true;
        modules['PROMIS'].completed = true;
    }

    if (data[fieldMapping.Experience2024.statusFlag]) {
        modules["Connect Experience 2024"].enabled = true;
    }
    if (data[fieldMapping.Experience2024.statusFlag] === fieldMapping.moduleStatus.submitted) { 
        modules['Connect Experience 2024'].completed = true;
    }

    if (
      data[fieldMapping.verification] === fieldMapping.verified &&
      data[fieldMapping.verifiedDate] &&
      currentTime > getAdjustedTime(data[fieldMapping.verifiedDate], 270)
    ) {
      if (data[fieldMapping.CancerScreeningHistory.statusFlag]) {
        modules["Cancer Screening History"].enabled = true;
      }
      
      if (data[fieldMapping.CancerScreeningHistory.statusFlag] === fieldMapping.moduleStatus.submitted) {
        modules["Cancer Screening History"].completed = true;
      }
    }

    if (
        data[fieldMapping.verification] === fieldMapping.verified &&
        data[fieldMapping.verifiedDate] &&
        currentTime > getAdjustedTime(data[fieldMapping.verifiedDate], 180)
    ) {
        if (data[fieldMapping.DHQ3.statusFlag] === fieldMapping.moduleStatus.notStarted || data[fieldMapping.DHQ3.statusFlag] === fieldMapping.moduleStatus.started) {
            // Participant is eligible. Make sure a DHQ3 credential is allocated. Allocation runs once per eligible participant.
            if (!data[fieldMapping.DHQ3.uuid]) {
                try {
                    const newUUID = await assignDHQ3Credential(data);
                    data[fieldMapping.DHQ3.uuid] = newUUID;

                } catch (error) {
                    console.error("Error assigning DHQ3 credential:", error);
                    return modules;
                }
            }
        }

        if (data[fieldMapping.DHQ3.statusFlag] && data[fieldMapping.DHQ3.statusFlag] !== fieldMapping.moduleStatus.notYetEligible && data[fieldMapping.DHQ3.uuid]) {
            modules["Diet History Questionnaire III (DHQ III)"].enabled = true;
        }

        if (data?.[fieldMapping.DHQ3.statusFlag] === fieldMapping.moduleStatus.submitted) {
            modules["Diet History Questionnaire III (DHQ III)"].completed = true;
        }
    }
    
    return modules;
};

const assignDHQ3Credential = async (participantData) => {
    try {
        const appSettingsData = await getAppSettings(['dhq']);
        if (!appSettingsData.dhq) {
            console.error("DHQ3 app settings not found");
            return;
        }

        const dhqStudyIDs = appSettingsData.dhq.dhqStudyIDs || [];                      // List of DHQ study IDs from appSettings.
        const depletedDHQStudyIDs = appSettingsData.dhq.dhqDepletedCredentials || [];   // List of DHQ study IDs without availableCredentials (skip these in credential search).
        const availableCredentialPools = dhqStudyIDs.filter(studyID => !depletedDHQStudyIDs.includes(studyID));

        const dhqCredential = await allocateDHQ3Credential(availableCredentialPools);
        return dhqCredential?.[fieldMapping.DHQ3.uuid];

    } catch (error) {
        const errorContext = {
            userAction: 'assignDHQ3Credential',
            timestamp: new Date().toISOString(),
            ...(participantData?.['Connect_ID'] && { connectID: participantData['Connect_ID'] }),
            moduleId: 'DHQ3 Credential Allocation',
            errorMessage: error.message,
        };

        logDDRumError(error, 'DHQ3LoadError', errorContext);
    }
}

/**
 * Attach a click listener to the DHQ3 survey link.
 * On click, open the link in a new tab and update the main content area.
 */

const addDHQListener = (currentDHQ3SurveyStatus, ConnectID) => {
    const dhq3Link = document.getElementById('dhq3-survey-link');
    if (dhq3Link && !dhq3Link.hasClickListener) {
        dhq3Link.addEventListener('click', async () => {
            const surveyUrlFromLink = dhq3Link.getAttribute('href');
            
            // If status is not started, update it to 'started' in Firestore.
            if (currentDHQ3SurveyStatus === fieldMapping.moduleStatus.notStarted) {
                try {
                    await updateStartDHQParticipantData();
                    
                } catch (error) {
                    console.error("Error calling updateStartDHQParticipantData:", error);
                    
                    logDDRumError(error, 'UpdateDHQStatusError', {
                        connectID: ConnectID,
                        moduleId: 'DHQ3',
                        userAction: 'Start DHQ3 Survey (updateStartDHQParticipantData)',
                        errorMessage: error.message,
                        timestamp: new Date().toISOString(),
                    });
                }
            }

            // Allows browser navigation before DOM update
            setTimeout(() => {
                const rootElement = document.getElementById('root');
                if (rootElement) {
                    const dhqScreenHTML = `
                        <div class="container mt-4">
                            <p><span data-i18n="dhq3Screen.openedInNewTab">The Diet History Questionnaire III (DHQ III) is open and in progress in a separate browser tab or window. Please complete the survey in that tab or window. When you finish it, you can exit the window and return here.</span></p>
                            <p>
                                <span data-i18n="dhq3Screen.youMayNeedTo">You may need to </span>
                                <strong onclick="location.reload()" style="cursor:pointer; color:blue; text-decoration: underline;"><span data-i18n="dhq3Screen.refreshThisPage">refresh this page</span></strong>
                                <span data-i18n="dhq3Screen.toSeeUpdatedStatus"> to see your updated survey status. The DHQ III may stay on your Dashboard for a short time after you submit it.</span>
                            </p>
                            <p>
                                <span data-i18n="dhq3Screen.ifSurveyDidntOpen">If the survey didn’t open, or if you closed it before submitting:</span>
                            </p>
                            <div class="row">
                                <div class="col-12 col-lg-6 mx-auto">
                                    <a href="${surveyUrlFromLink}" target="_blank" rel="noopener noreferrer"
                                        class="btn btn-expanding-height btn-agreement d-block w-100 mx-auto d-flex align-items-center justify-content-center mt-2"
                                        role="button">
                                        <b data-i18n="dhq3Screen.openAgainButton">Click here to open the survey again and pick up where you left off</b>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    rootElement.innerHTML = translateHTML(dhqScreenHTML);
                }
            }, 50);
        });
        dhq3Link.hasClickListener = true;
    }
};