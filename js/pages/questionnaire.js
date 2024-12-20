import { getModuleSHA, getModuleText, getMyData, getShaFromGitHubCommitData, hasUserData, getAppSettings, getMySurveys, logDDRumError, questionnaireModules, storeResponseQuest, storeResponseTree, showAnimation, hideAnimation, addEventReturnToDashboard, fetchDataWithRetry, updateStartSurveyParticipantData, translateHTML, translateText, getSelectedLanguage } from "../shared.js";
import fieldMapping from '../fieldToConceptIdMapping.js'; 
import { socialSecurityTemplate } from "./ssn.js";

let questVersion;                                       // The Quest version to fetch from the CDN. Stored and updated in Firestore.
let questConfig;                                        // The config object maps the current environment to the appropriate Quest version.
let quest;                                              // The Quest module.
let participantData;                                    // The participant's data.
let appSettingsData;                                    // The app settings data.
let modules;                                            // The survey modules data.
let isQuest2 = false;                                   // To identify the Quest versions < 2 and >= 2. Retain for gradual migration to Quest v2.0+.
const questDivID = "questionnaireRoot";                 // The div ID for loading surveys.
const appSettingsArray = [                              // The app settings parameters to fetch (Quest-related settings) from Firestore.
    'currentQuestVersion',
    'currentQuest2Version',
    'quest2ModuleActivatedTimestamp'
];

/**
 * Maps the current environment to the appropriate Quest version.
 * Determine whether to load Quest or Quest 2.0+ based on the participant's survey start timestamp and the module's activation timestamp.
 * If: Quest 2.0+ survey is active AND
 *     Either the participant is starting a new survey OR the participant's survey start timestamp is greater than the module's activation timestamp,
 *     Then: load Quest 2.0+.
 * Else: load Quest 1.
 * @param {string} moduleId - The ID of the survey module the participant clicked to start.
 * @returns {void} - Sets the global questVersion and questConfig variables for loading.
 * Fetch currentQuestVersion from Firestore: collection: appSettings, document:
 *      { "appName": <string>, "currentQuestVersion": <string>, "currentQuest2Version": <string>, "quest2ModuleActivatedTimestamp": <object>{ <moduleId>: <ISO 8601 timestamp> } }
 */

async function loadQuestConfig(moduleId) {
    const participantStartSurveyTimestamp = participantData[fieldMapping[moduleId].startTs] || '';
    const quest2ModuleActivatedTimestamp = appSettingsData.quest2ModuleActivatedTimestamp[moduleId] || '';
    const currentISOTimestamp = new Date().toISOString();

    if (quest2ModuleActivatedTimestamp && quest2ModuleActivatedTimestamp <= currentISOTimestamp && (!participantStartSurveyTimestamp || participantStartSurveyTimestamp >= quest2ModuleActivatedTimestamp)) {
        isQuest2 = true;
    }

    // TODO: Verify and update the CDN location for Quest 2.0+ when available.
    if (isQuest2) {
        questVersion = appSettingsData.currentQuest2Version;
        questConfig = {
            "myconnect.cancer.gov": `https://cdn.jsdelivr.net/gh/episphere/quest@v${questVersion}/main.js`, // TODO: verify
            "myconnect-stage.cancer.gov": `https://cdn.jsdelivr.net/gh/episphere/quest@v${questVersion}/main.js`, // TODO: verify
            "episphere.github.io": "https://episphere.github.io/quest-dev/main.js",
            "localhost:5000": "https://episphere.github.io/quest-dev/main.js", // TODO: update to CDN when available
        }
    } else {
        questVersion = appSettingsData.currentQuestVersion;
        questConfig = {
            "myconnect.cancer.gov": `https://cdn.jsdelivr.net/gh/episphere/quest@v${questVersion}/replace2.js`,
            "myconnect-stage.cancer.gov": `https://cdn.jsdelivr.net/gh/episphere/quest@v${questVersion}/replace2.js`,
            "episphere.github.io": "https://episphere.github.io/quest/replace2.js",
            "localhost:5000": `https://cdn.jsdelivr.net/gh/episphere/quest@v${questVersion}/replace2.js`
        };
    }
}

/**
 * Import the Quest module from the appropriate CDN location (or GitHub location for dev).
 */

const importQuest = async () => {
    const url = questConfig[location.host];
    
    try {
        const { transform } = await import(url);

        if (!transform) {
            throw new Error('Error loading transform module from Quest.');
        }

        quest = transform;
    } catch (e) {
        throw new Error(`Error importing quest from ${url}: ${e.message}`);
    }
}

/**
 * Questionnaire directs the survey module handling throughout the survey loading process.
 * Errors from the module loading process are caught here. The loading animation is shown and hidden here.
 * @param {string} moduleId - The ID of the survey module the participant clicked to start.
 */

export const questionnaire = async (moduleId) => {
    try {
        showAnimation();

        if (!moduleId) {
            throw new Error('No module ID on start survey click.');
        }

        const [participantResponse, appSettingsResponse] = await Promise.all([
            fetchDataWithRetry(() => getMyData()),
            fetchDataWithRetry(() => getAppSettings(appSettingsArray)),
        ]);

        if(!hasUserData(participantResponse)) {
            throw new Error('No user data found.');
        }

        if (!appSettingsResponse) {
            throw new Error('Error fetching app settings.');
        }

        participantData = participantResponse.data;
        appSettingsData = appSettingsResponse;

        loadQuestConfig(moduleId);

        displayQuestionnaire(moduleId !== 'ModuleSsn');

        if(moduleId === 'ModuleSsn') {
            socialSecurityTemplate(participantData);
        } else {
            const [responseModules] = await Promise.all([
                fetchDataWithRetry(() => getMySurveys([...new Set([
                    fieldMapping.Module1.conceptId,
                    fieldMapping.Module1_OLD.conceptId,
                    fieldMapping.Biospecimen.conceptId,
                    fieldMapping.ClinicalBiospecimen.conceptId,
                    fieldMapping[moduleId].conceptId
                ])])),
                fetchDataWithRetry(() => importQuest())
            ]);

            if (!quest) {
                throw new Error('Error importing Quest.');
            }
            
            modules = responseModules.data;

            if (!modules) {
                throw new Error('No modules found.');
            }

            await startModule(moduleId);
        }
    } catch (error) {
        const errorContext = {
            userAction: 'click start survey',
            timestamp: new Date().toISOString(),
            isQuest2: isQuest2,
            ...(participantData?.['Connect_ID'] && { connectID: participantData['Connect_ID'] }),
            ...(moduleId && { moduleId }),
            ...(modules && { modules }),
            ...(error.context && { ...error.context }),
        };

        logDDRumError(error, 'StartModuleError', errorContext);
        displayError();
    } finally {
        hideAnimation();
    }
}


/**
 * Fetch and load the survey module in Quest.
 * @param {string} moduleId - The ID of the survey module the participant clicked to start.
 */

async function startModule(moduleId) {
    let tJSON = undefined;                                                  // @deprecated. Retain until migration to Quest 2.0+ is complete. tJSON (treeJSON) is integrated into the question saving operation in Quest 2.0+
    let url = "https://raw.githubusercontent.com/episphere/questionnaire/"; // The base URL for the module's markdown text.
    let inputData;                                                          // Precalculated input data from the participant's previous surveys.
    let moduleConfig;                                                       // The module configuration object mapping survey paths.
    let path;                                                               // The path to the module's markdown text.
    let sha;                                                                // The SHA value (from the GitHub commit) for the module's markdown text.
    let key;                                                                // The moduleID key for the module's configuration object.
    let lang;                                                               // The participant's preferred language.
    let moduleText;                                                         // The fetched module's markdown text.

    await localforage.clear();

    try {
        inputData = setInputData(participantData, modules); 
        moduleConfig = questionnaireModules();

        key = Object.keys(moduleConfig).find(key => moduleConfig[key].moduleId === moduleId);

        if (!key) {
            throw new Error('Error: No path found for module (null key).');
        }

        // Module has not been started.
        if (participantData[fieldMapping[moduleId].statusFlag] === fieldMapping.moduleStatus.notStarted) {
            
            ({ path, lang } = getMarkdownPath(getSelectedLanguage(), moduleConfig[key]));
            
            try {
                sha = await fetchDataWithRetry(() => getModuleSHA(path, participantData['Connect_ID'], moduleId));
                url += sha + "/" + path;
            } catch {
                throw new Error('Error: No SHA found for module.');
            }
            
            try {
                moduleText = await updateStartSurveyParticipantData(sha, path, participantData['Connect_ID'], moduleId);
            } catch (error) {
                throw new Error(`Error: Storing questData and formData failed. ${error.message}`);
            }

        // Module has been started and has a SHA value. Note: Don't need to update participant for this case since record exists. Fetch module text directly.
        } else if (modules[fieldMapping[moduleId].conceptId]?.['sha']) {
            tJSON = await getTree(modules, moduleId); // @deprecated. Retain until migration to Quest 2.0+ is complete.
            ({ path, lang } = getMarkdownPath(modules[fieldMapping[moduleId].conceptId][fieldMapping.surveyLanguage], moduleConfig[key]));

            sha = modules[fieldMapping[moduleId].conceptId]['sha'];
            url += sha + "/" + path;

            try {
                const moduleFetchResult = await fetchDataWithRetry(() => getModuleText(sha, path, participantData['Connect_ID'], moduleId));
                moduleText = moduleFetchResult.moduleText;
            } catch (error) {
                throw new Error(`Error: Module text prefetch failed. ${error.message}`);
            }

        // Module has been started but SHA is not found. 'Fix' the case where the SHA is not found for the module.
        } else {
            console.error('Module started but SHA not found. Fixing the SHA not found case.');
            const startSurveyTimestamp = participantData[fieldMapping[moduleId].startTs] || '';

            tJSON = await getTree(modules, moduleId); // @deprecated. Retain until migration to Quest 2.0+ is complete.
            ({ path, lang } = getMarkdownPath(modules[fieldMapping[moduleId].conceptId][fieldMapping.surveyLanguage], moduleConfig[key]));

            // Get the SHA from the GitHub API. The correct SHA is the SHA for the active survey commit when the participant started the survey.
            let surveyVersion;
            try {
                [sha, surveyVersion] = await getShaFromGitHubCommitData(startSurveyTimestamp, path, participantData['Connect_ID'], moduleId);
                url += sha + "/" + path;

            } catch (error) {
                throw new Error(`Error: SHA not retrieved for module (API lookup). ${error.message}`);
            }

            // Repair the SHA value in the module data. Do not update the start timestamp (found in participant data) for the module.
            try {
                const repairShaValue = true;
                moduleText = await updateStartSurveyParticipantData(sha, path, participantData['Connect_ID'], moduleId, surveyVersion, repairShaValue);
            } catch (error) {
                throw new Error(`Error: Updating participant data failed after EXISTING MODULE: SHA not found. ${error.message}`);
            }   
        }

        const questParameters = {
            activate: true,                                                                         // Activate the stylesheets.
            asyncQuestionsMap: fieldMapping.questAsyncQuestionsMap[moduleId]?.asyncQuestions,       // Map of async question IDs, their fetch functions, and their related variables.
            delayedParameterArray: fieldMapping.delayedParameterArray,                              // @deprecated. Retain until Quest2 migration is complete. Delayed parameters (external questions that require extra processing time).
            errorLogger: (error) => {                                                               // Logger for in-survey errors.
                const additionalContext = {
                    userAction: 'In-survey error',
                    timestamp: new Date().toISOString(),
                    connectId: participantData['Connect_ID'],
                    questionnaire: moduleId,
                }
                questErrorLogger(error, 'QuestError', additionalContext);
            },
            fetchAsyncQuestion: fetchAsyncQuestion,                                                 // Fetch async questions within Quest.
            lang: lang,                                                                             // Participant's preferred language.
            questVersion: questVersion,                                                             // Quest version number, for loading stylesheets from the CDN.
            retrieve: () => getMySurveys([fieldMapping[moduleId].conceptId], true),                 // Retrieve the module data from Firestore.
            showProgressBarInQuest: isQuest2,                                                       // Show the progress bar.
            soccer: () => externalListeners(lang),                                                  // @deprecated. Retain until Quest2 migration is complete. External listeners for soccer questions.                                                                      // Existing treeJSON for the module. Tracks the participant's progress through the module.
            store: storeResponseQuest,                                                              // Store the participant's responses in Firestore.
            surveyDataPrefetch: modules[fieldMapping[moduleId].conceptId],                          // Prefetched survey data from Firestore: existing responses to continue mid-survey where the participant left off.
            text: moduleText,                                                                       // Markdown text for the module.
            treeJSON: tJSON,                                                                        // @deprecated. Retain until migration to Quest 2.0+ is complete. Existing treeJSON for the module. Tracks the participant's progress through the module. Handled in retrieve operation for versions 2.0+.
            updateTree: storeResponseTree,                                                          // @deprecated. Retain until migration to Quest 2.0+ is complete. Update the treeJSON in Firestore. Handled in storeResponseQuest for versions 2.0+.
            url: url,                                                                               // URL for the module's markdown text.
        }

        // Load the survey module in Quest and reset the window scroll position.
        await quest.render(questParameters, questDivID, inputData);
        window.scrollTo(0, 0);
            
        //Grid fix first
        Array.from(document.getElementsByClassName('d-lg-block')).forEach(element => {
            element.classList.replace('d-lg-block', 'd-xxl-block');
        });

        Array.from(document.getElementsByClassName('d-lg-none')).forEach(element => {
            element.classList.replace('d-lg-none', 'd-xxl-none');
        });

        if (!isQuest2) {
            updateProgressBar();
            setUpMutationObserver();
        }

        document.getElementById(questDivID).style.visibility = 'visible';

    } catch (error) {
        const errorContext = { moduleId, modules, inputData, moduleConfig, key, path, sha };
        error.context = errorContext;
        throw error;
    }
}

/**
 * Log quest errors to Datadog RUM.
 * @param {object} error - The error object.
 * @param {string} errorType - The type of error.
 * @param {object} additionalContext - Additional survey context to log with the error.
 */

const questErrorLogger = (error, errorType = 'QuestError', additionalContext = {}) => {
    const activeQuestionID = getActiveQuestionID();

    const context = {
        ...additionalContext,
        errorName: errorType,
        errorMessage: error.message || 'An error occurred',
        errorStack: error.stack || 'No stack trace available',
        isQuest2: isQuest2,
        ...activeQuestionID && { activeQuestionID: activeQuestionID },
    };

    logDDRumError(error, errorType, context);
}

const getActiveQuestionID = () => {
    const activeQuestion = document.querySelector('form.active');
    return activeQuestion?.id;
}

// @deprecated. This function is used in Quest versions pre-2.0. Retain until migration is complete.
function externalListeners(language){
    
    const work3 = document.getElementById("D_627122657");
    const work3b = document.getElementById("D_796828094");

    const work7 = document.getElementById("D_118061122");
    const work7b = document.getElementById("D_518387017");

    const occuptn1 = document.getElementById("D_761310265");
    const occuptn2 = document.getElementById("D_279637054");

    const menstrualCycle = document.getElementById("D_951357171");

    let module1 = modules[fieldMapping.Module1.conceptId];

    let title3 = module1?.['D_627122657'] ?? '';
    let task3 = module1?.['D_796828094'] ?? '';
    let title7 = module1?.['D_118061122'] ?? '';
    let task7 = module1?.['D_518387017'] ?? '';
    
    if (work3){
        if (work3b) {
            work3.addEventListener("submit", (e) => {
                e.preventDefault();
                
                title3 = e.target[1].value;
            });

            work3b.addEventListener("submit", async (e) => {
                e.preventDefault();
    
                task3 = e.target[1].value;
                const soccerResults = await buildSoccerResults(title3, task3, language);
    
                buildHTML(soccerResults, occuptn1);
            });
        }
        else {
            work3.addEventListener("submit", async (e) => {
                e.preventDefault();
                
                title3 = e.target[1].value;
                const soccerResults = await buildSoccerResults(title3, '', language);
    
                buildHTML(soccerResults, occuptn1);
            });
        }
    }

    if (work7){
        if (work7b) {
            work7.addEventListener("submit", (e) => {
                e.preventDefault();
                
                title7 = e.target[1].value;
            });

            work7b.addEventListener("submit", async (e) => {
                e.preventDefault();
    
                task7 = e.target[1].value;
                const soccerResults = await buildSoccerResults(title7, task7, language);
    
                buildHTML(soccerResults, occuptn2);
            });
        }
        else {
            work7.addEventListener("submit", async (e) => {
                e.preventDefault();
                
                title7 = e.target[1].value;
                const soccerResults = await buildSoccerResults(title7, '', language);
    
                buildHTML(soccerResults, occuptn2);
            });
        }
    }

    if (menstrualCycle) {
        menstrualCycle.addEventListener("submit", async (e) => {
            if(e.target.value == 104430631) {
                let rootElement = document.getElementById('root');
                rootElement.innerHTML = translateHTML(`
                
                <div class="row" style="margin-top:50px">
                    <div class = "col-md-1">
                    </div>
                    <div class = "col-md-10">
                        ${!isQuest2 ? `<div class="progress">
                            <div id="questProgBar" class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                <span class="visually-hidden" id="progressText">0% Complete</span>
                            </div>
                        </div>` : ''}
                    </div>
                    <div class = "col-md-1">
                    </div>
                </div>
                <div class="row">
                    <div class = "col-md-1">
                    </div>
                    <div class = "col-md-10" id="questionnaireRoot">
                        <span data-i18n="questionnaire.nextMenstrual">Thank you. When your next menstrual period starts, please return to complete this survey.</span>
                        <br>
                        <br>
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-5 col-md-3 col-sm-3">
                                </div>
                                <div class="col-lg-6 col-md-6 col-sm-6">
                                </div>
                                <div class="col-lg-1 col-md-3 col-sm-3">
                                    <button type="button" id="returnToDashboard" class="next" data-i18n="questionnaire.okButton">OK</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class = "col-md-1">
                    </div>
                </div>
                
                `);

                addEventReturnToDashboard();
            }         
        });
    }
}

/**
 * Build the HTML for the SOCcer results and insert them in the Quest div.
 * @param {Array} soccerResults - The array of SOCcer results, returned from the API.
 * @param {HTMLElement} questionID - The active question in Quest.
 */
function buildSoccerHTML(soccerResults, question) {
    let fieldset = question.querySelector('fieldset');
    fieldset.innerHTML = translateHTML('<span data-i18n="questionnaire.identifyOccupation">Please identify the occupation category that best describes this job.</span><br aria-hidden="true">');

    soccerResults.forEach((soc, indx) => {
        // Create a div.response for each radio button
        let responseDiv = document.createElement('div');
        responseDiv.classList.add('response');

        let resp = document.createElement('input');
        resp.type = "radio";
        resp.id = `${question.id}_${indx}`;
        resp.value = soc.code;
        resp.name = "SOCcerResults";
        resp.onclick = quest.rbAndCbClick;

        let label = document.createElement('label');
        label.setAttribute('for', `${question.id}_${indx}`);
        label.innerText = soc.label;

        responseDiv.appendChild(resp);
        responseDiv.appendChild(label);
        fieldset.appendChild(responseDiv);
    });

    // Add the NONE OF THE ABOVE option
    let notaDiv = document.createElement('div');
    notaDiv.classList.add('response');

    let notaResp = document.createElement('input');
    notaResp.type = "radio";
    notaResp.id = `${question.id}_NOTA`;
    notaResp.value = "NONE_OF_THE_ABOVE";
    notaResp.name = "SOCcerResults";
    notaResp.onclick = quest.rbAndCbClick;

    let notaLabel = document.createElement('label');
    notaLabel.setAttribute('for', `${question.id}_NOTA`);
    notaLabel.setAttribute('data-i18n', 'questionnaire.noneAbove');
    notaLabel.innerText = translateText('questionnaire.noneAbove');

    notaDiv.appendChild(notaResp);
    notaDiv.appendChild(notaLabel);
    fieldset.appendChild(notaDiv);
}

//BUILDING SOCCER 
// @deprecated. This function is used in Quest versions pre-2.0. Retain until migration is complete.
function buildHTML(soccerResults, question) {
    let fieldset = question.querySelector('fieldset');
    let responseElement = fieldset.querySelector("div[class='response']");
    
    // Ensure responseElement exists
    if (!responseElement) {
        responseElement = document.createElement("div");
        responseElement.classList.add("response");
        fieldset.insertBefore(responseElement, fieldset.firstChild);
    }

    responseElement.innerHTML = translateHTML('<span data-i18n="questionnaire.identifyOccupation">Please identify the occupation category that best describes this job.</span>');
  
    soccerResults.forEach((soc, indx) => {
      let resp = document.createElement("input");
      resp.type = "radio";
      resp.id = `${question.id}_${indx}`;
      resp.value = soc.code;
      resp.name = "SOCcerResults";
      resp.onclick = quest.rbAndCbClick;
      let label = document.createElement("label");
      label.setAttribute("for", `${question.id}_${indx}`);
      label.innerText = soc.label;
      responseElement.append(resp, label);
    });
    let resp = document.createElement("input");
    resp.type = "radio";
    resp.id = `${question.id}_NOTA`;
    resp.value = "NONE_OF_THE_ABOVE";
    resp.name = "SOCcerResults";
    resp.onclick = quest.rbAndCbClick;
    let label = document.createElement("label");
    label.setAttribute("for", `${question.id}_NOTA`);
    label.setAttribute("data-i18n", 'questionnaire.noneAbove');
    label.innerText = translateText('questionnaire.noneAbove');
  
    responseElement.append(resp, label);
}

export const blockParticipant = () => {
    
    const mainContent = document.getElementById('root');
    mainContent.innerHTML = translateHTML(`
    <div class = "row" style="margin-top:25px">
        <div class = "col-lg-2">
        </div>
        <div class = "col" data-i18n="questionnaire.thankYouCompleting">
            Thank you for completing your profile for the Connect for Cancer Prevention Study. Next, the Connect team at your health care system will check that you are eligible to be part of the study. We will contact you within a few business days to share information about next steps.
            </br>Questions? Please contact the <a href= "https://norcfedramp.servicenowservices.com/participant" target="_blank">Connect Support Center.</a>
        </div>
        <div class="col-lg-2">
        </div>
    `);
    window.scrollTo(0, 0);

}

/**
 * Generalized handler for async questions in Quest. Currently only used for SOCcer questions.
 * @param {Function} func - The function to fetch and process async questions in Quest.
 * @param {Array} args - The related arguments for the async function.
 * @returns {any} - The results of the async function.
 */
const fetchAsyncQuestion = async (func, args) => {

    let results = [];

    try {
        const asyncFunctions = {

            soccer: async (args) => {
                const [title, task, language] = args;
                
                const response = await fetch(`https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net/connect-soccer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, task, language })
                });

                const soccerResponse = await response.json();
                results = soccerResponse.results;

                if (!results || !Array.isArray(results) || results.length === 0) {
                    throw new Error('Error: No soccer results found.');
                }

                for (let i = 0; i < results.length; i++) {
                    results[i]['code'] += '-' + i;
                }

                const activeQuestion = document.querySelector('form.question.active');
                buildSoccerHTML(results, activeQuestion);
            },
        }

        if (!asyncFunctions[func]) {
            throw new Error(`Error: No async function found for ${func}.`);
        }

        return await asyncFunctions[func](args);

    } catch (error) {
        logDDRumError(error, 'QuestFetchAsyncQuestionError', {
            userAction: 'click start survey',
            timestamp: new Date().toISOString(),
            func: func,
            args: args,
            results: results,
            isQuest2: isQuest2,
            ...(participantData?.['Connect_ID'] && { connectID: participantData['Connect_ID'] }),
        });
        return [];
    }
}

// @deprecated. This function is used in Quest versions pre-2.0. Retain until migration is complete.
const buildSoccerResults = async (title, task, language) => {

    let soccerResults = [];
    try {
        const response = await fetch(`https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net/connect-soccer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, task, language })
        });

        const soccerResponse = await response.json();
        soccerResults = soccerResponse.results;
        
        for (let i = 0; i < soccerResults.length; i++){
            soccerResults[i]['code'] += '-' + i;
        }
    
        return soccerResults;
    } catch (error) {
        logDDRumError(error, 'SOCcerError', {
            userAction: 'click start survey',
            timestamp: new Date().toISOString(),
            title: title,
            task: task,
            soccerResults: soccerResults,
            isQuest2: isQuest2,
            ...(participantData?.['Connect_ID'] && { connectID: participantData['Connect_ID'] }),
        });
        return [];
    }  
}

/**
 * Use previous survey responses to precalculate input data for the participant's current survey.
 * @param {object} data - The participant's data.
 * @param {object} modules - The survey modules data from the participant's previously taken surveys.
 * @returns {object} - The precalculated input data for the participant's current survey.
 */

const setInputData = (data, modules) => {

    let inputData = {};

    inputData["firstName"] = data[fieldMapping.fName];

    let module1_v1 = modules[fieldMapping.Module1.conceptId];
    let module1_v2 = modules[fieldMapping.Module1_OLD.conceptId];
    let moduleBiospecimen = modules[fieldMapping.Biospecimen.conceptId];
    let moduleClinical = modules[fieldMapping.ClinicalBiospecimen.conceptId];

    if (module1_v1) {
        if (module1_v1["D_407056417"]) inputData["D_407056417"] = module1_v1["D_407056417"];
        if (module1_v1["D_613744428"]) inputData["D_613744428"] = module1_v1["D_613744428"];
        if (module1_v1["D_750420077"]) inputData["D_750420077"] = module1_v1["D_750420077"];
        if (module1_v1["D_784967158"]) inputData["D_784967158"] = module1_v1["D_784967158"];
        if (module1_v1["D_150344905"]) inputData["D_150344905"] = module1_v1["D_150344905"];

        if (module1_v1["D_289664241"]) {
            if (module1_v1["D_289664241"]["D_289664241"]) inputData["D_289664241"] = module1_v1["D_289664241"]["D_289664241"];
            else inputData["D_289664241"] = module1_v1["D_289664241"];
        }
    }
    else if (module1_v2) {
        if (module1_v2["D_407056417"]) inputData["D_407056417"] = module1_v2["D_407056417"];
        if (module1_v2["D_613744428"]) inputData["D_613744428"] = module1_v2["D_613744428"];
        if (module1_v2["D_750420077"]) inputData["D_750420077"] = module1_v2["D_750420077"];
        if (module1_v2["D_784967158"]) inputData["D_784967158"] = module1_v2["D_784967158"];
        if (module1_v2["D_150344905"]) inputData["D_150344905"] = module1_v2["D_150344905"];
        
        if (module1_v2["D_289664241"]) {
            if (module1_v2["D_289664241"]["D_289664241"]) inputData["D_289664241"] = module1_v2["D_289664241"]["D_289664241"];
            else inputData["D_289664241"] = module1_v2["D_289664241"];
        }
    }

    if (moduleBiospecimen) {
        if (moduleBiospecimen["D_644459734"]) inputData["D_644459734"] = moduleBiospecimen["D_644459734"];
    }

    if (moduleClinical) {
        if (moduleClinical["D_644459734"]) inputData["D_644459734"] = moduleClinical["D_644459734"];
    }
    
    const birthMonth = parseInt(data[fieldMapping.birthMonth], 10);
    const birthDay = parseInt(data[fieldMapping.birthDay], 10);
    const birthYear = parseInt(data[fieldMapping.birthYear], 10);

    // Note: Date() in JS vs our Firestore data model - Our Firestore model has 1-indexed months and days.
    // In JS: months are 0-indexed and days are 1-indexed. So, we need to align the month values for the off-by-one issue.
    if (birthMonth && birthDay && birthYear) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // adjust for Firestore's 1-indexed value
        const currentDay = today.getDate();

        // If the participant's birthday hasn't happened yet this year, subtract 1 from the age.
        const isBirthDayAfterToday = currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay);
        const ageAdjustment = isBirthDayAfterToday ? -1 : 0;
        const age = currentYear - birthYear + ageAdjustment;
    
        inputData["age"] = age;
        inputData["yob"] = birthYear;
    }

    return inputData;
}

// @deprecated: This function is used in Quest versions pre-2.0. Retain until migration is complete.
function updateProgressBar() {
    const forms = Array.from(document.getElementsByTagName('form'));
    const activeFormIndex = forms.findIndex(form => form.classList.contains('active'));
    const progressPercentage = activeFormIndex >= 0 ? Math.round((activeFormIndex / (forms.length - 1)) * 100) : 0;

    const progressBar = document.getElementById('questProgBar');
    const progressText = document.getElementById('progressText');
    if (progressBar && progressText) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);
        progressText.textContent = `${progressPercentage}% Complete`;
    }
}

// @deprecated: This function is used in Quest versions pre-2.0. Retain until migration is complete.
function setUpMutationObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === "class" && mutation.target.classList.contains('active')) {
                updateProgressBar();
            }
        });
    });

    const elemId = document.getElementById('questionnaireRoot');
    if (elemId) {
        observer.observe(elemId, {
            childList: true,
            subtree: true,
            attributes: true,
        });
    }
}

/**
 * Page layout for Quest surveys.
 * Quest versions < 2.0 have an external progress bar.
 * The progress bar is integrated into Quest versions 2.0+.
 * @param {boolean} progressBar - Boolean whether to show the progress bar. 
 */

const displayQuestionnaire = (progressBar) => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `
            ${progressBar && !isQuest2 ? `
            <div class="row" style="margin-top:50px">
                <div class="col-md-1">
                </div>
                <div class="col-md-10">
                    <div class="progress">
                        <div id="questProgBar" class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                            <span class="visually-hidden" id="progressText">0% Complete</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-1">
                </div>
            </div>` : ''}
            <div class="row">
                <div class = "col-md-1">
                </div>
                <div class = "col-md-10" id="${questDivID}">
                </div>
                <div class = "col-md-1">
                </div>
            </div>
        `;
    }
    
    const questDivElement = document.getElementById(questDivID);
    if (questDivElement) {
        questDivElement.style.visibility = 'hidden';
    }
}

const displayError = () => {
    const mainContent = document.getElementById('root');
    if (mainContent) {
        mainContent.innerHTML = translateHTML(`
            <div class="row" role="alert" aria-live="assertive" style="margin-top:25px">
                <div class = "col-lg-2">
                </div>
                <div class = "col">
                    <h2 class="visually-hidden">Error Message. Something went wrong. Please try again. Contact the Connect Support Center at 1-877-505-0253 if you continue to experience this problem.</h2>
                    <p data-i18n="questionnaire.somethingWrong">Something went wrong. Please try again. Contact the 
                        <a href="https://norcfedramp.servicenowservices.com/participant" target="_blank" rel="noopener noreferrer">Connect Support Center</a> 
                        if you continue to experience this problem.
                    </p>
                </div>
            </div>
        `);
    }
    window.scrollTo(0, 0);

    hideAnimation();
}

const getMarkdownPath = (value, config) => {
    
    let path;
    let lang;
    
    switch (value) {
        case fieldMapping.language.en:
            path = config.path.en;
            lang = 'en';
            break;
        case fieldMapping.language.es:
            path = config.path.es;
            lang = 'es';
            break;
        default:
            throw new Error('Error: Language not defined in App State.');
    }

    return { path, lang };
}

// @deprecated: This function is used in Quest versions pre-2.0. Retain until migration is complete.
const getTree = async (modules, moduleId) => {

    return modules[fieldMapping[moduleId].conceptId]?.['treeJSON'];
}