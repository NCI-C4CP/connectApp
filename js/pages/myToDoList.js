import { hideAnimation, questionnaireModules, storeResponse, isParticipantDataDestroyed, translateHTML, translateText, setModuleAttributes } from "../shared.js";
import { questionnaire } from "./questionnaire.js";
import { storeParameters, addDHQListener } from "../event.js";
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
    if (data[fieldMapping.healthcareProvider] && data[fieldMapping.heardAboutStudyForm]) {
        localStorage.eligibilityQuestionnaire = JSON.stringify({[fieldMapping.healthcareProvider]: data[fieldMapping.healthcareProvider]})
        if(data[fieldMapping.consentSubmitted] === fieldMapping.yes) {

            if(data[fieldMapping.userProfileSubmittedAutogen] && data[fieldMapping.userProfileSubmittedAutogen] === fieldMapping.yes){

                let template = `
                    <div class="row">
                        <div class="col-xl-2">
                        </div>
                        <div class="col-xl-8">
                     
                `;
                
                const surveyMessage = await checkForNewSurveys(data, collections);

                if(surveyMessage) {
                    template += surveyMessage;
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
            hideAnimation();
            return;
        }
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
    if (data[fieldMapping.verification] === fieldMapping.notYetVerified) {
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

    modules["2026 Return of Results Preference Survey"].enabled && toDisplaySystem.unshift({ body: ["2026 Return of Results Preference Survey"] });

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
                                            <b style="color:#327abb; font-size:18px;">
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
                                        <b style="color:#327abb; font-size:18px;">
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
                                        <b style="color:#327abb; font-size:18px;">
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
                                                        <b id="header-${thisKey}" style="color:#327abb; font-size:18px;">
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
                                    <b id="completed-header-${key} style="color:#327abb; font-size:18px;">
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