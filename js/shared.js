import fieldMapping from './fieldToConceptIdMapping.js';
import { signInConfig } from "./pages/signIn.js";
import { signInCheckRender, signUpRender } from "./pages/homePage.js";
import { signOut } from "../app.js";
import en from "../i18n/en.js";
import es from "../i18n/es.js";
import { getFirstSignInISOTime } from "./event.js";

const i18n = {
    es, en
};

export const urls = {
    'prod': 'myconnect.cancer.gov',
    'stage': 'myconnect-stage.cancer.gov',
    'dev': 'nci-c4cp.github.io'
}

function createStore(initialState = {}) {
    let state = initialState;

    const setState = (update) => {
        const currSlice = typeof update === 'function' ? update(state) : update;

        if (currSlice !== state) {
            state = { ...state, ...currSlice };
        }
    };

    const getState = () => state;

    return { setState, getState };
}

const initialAppState = {
    idToken: '',
};

export const appState = createStore(initialAppState);

let api = '';

if (location.host === urls.prod) api = 'https://api-myconnect.cancer.gov/app';
else if (location.host === urls.stage) api = 'https://api-myconnect-stage.cancer.gov/app';
else api = 'https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net/app';

const afterEmailLinkRender = (email, type) => {
    const df = fragment`
    <div class="mx-4">
    <p class="loginTitleFont" style="text-align:center;" data-i18n="shared.signIn">Sign In</p>
    <div id="sign${type}Div" lang="en">
      <div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-link-sign-in-sent">
        <form onsubmit="return false;">
          <div class="firebaseui-card-header">
            <h1 class="firebaseui-title" data-i18n="shared.emailSent">Sign-in email sent</h1>
          </div>
          <div class="firebaseui-card-content">
            <div class="firebaseui-email-sent"></div>
            <p class="firebaseui-text"><span data-i18n="shared.emailSentMessageStart">We sent a verification email to </span><strong>${email}</strong><span data-i18n="shared.emailSentMessageEnd">. Please check your email and click the link we sent to finish signing in. Our email may take a few minutes to arrive in your inbox.</span></p>
          </div>
          <div class="firebaseui-card-actions">
            <div class="firebaseui-form-links">
              <a class="firebaseui-link firebaseui-id-trouble-getting-email-link" href="javascript:void(0)" data-i18n="shared.troubleGettingEmail">Trouble getting email?</a>
            </div>
            <div class="firebaseui-form-actions">
              <button class="firebaseui-id-secondary-link firebaseui-button mdl-button mdl-js-button mdl-button--primary" data-upgraded=",MaterialButton" data-i18n="shared.backText">Back</button>
            </div>
          </div>
          <div class="firebaseui-card-footer"></div>
        </form>
      </div>
    </div>
    <div style="font-size:8px" class="mt-3" data-i18n="shared.usGov"> ${usGov} </div>
    </div>
    `;
    // Added this code to properly translate the string
    translateHTML(df.children[0]);
    return df;
};

const troubleGettingEmailRender = (type) => {
    const df = fragment`
    <div class="mx-4">
    <p class="loginTitleFont" style="text-align:center;" data-i18n="shared.signIn">Sign In</p>
    <div id="sign${type}Div" lang="en">
        <div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-not-received">
        <form onsubmit="return false;">
            <div class="firebaseui-card-header">
            <h1 class="firebaseui-title" data-i18n="shared.troubleGettingEmail">Trouble getting email?</h1>
            </div>
            <div class="firebaseui-card-content">
            <p class="firebaseui-text" data-i18n="shared.tryFixes">Try these common fixes:</p>
            <ul data-i18n="shared.fixesList">
                <li>Check if the email was marked as spam or filtered.</li>
                <li>Check your internet connection.</li>
                <li>Check that you did not misspell your email.</li>
                <li>Check that your inbox space is not running out or other inbox settings related issues.</li>
            </ul>
            <p></p>
            <p class="firebaseui-text" data-i18n="shared.resendEmail">If the steps above didn't work, you can resend the email. Note that this will deactivate the link in the older email.</p>
            </div>
            <div class="firebaseui-card-actions">
            <div class="firebaseui-form-links">
                <a class="firebaseui-link firebaseui-id-resend-email-link" href="javascript:void(0)" data-i18n="shared.resendText">Resend</a>
            </div>
            <div class="firebaseui-form-actions">
                <button class="firebaseui-id-secondary-link firebaseui-button mdl-button mdl-js-button mdl-button--primary" data-upgraded=",MaterialButton" data-i18n="shared.backText">Back</button>
            </div>
            </div>
            <div class="firebaseui-card-footer"></div>
        </form>
        </div>
    </div>
    <div style="font-size:8px" class="mt-3" data-i18n="shared.usGov"> ${usGov} </div>
    </div>
    `;
    // Added this code to properly translate the string
    translateHTML(df.children[0]);
    return df;
}

const signInFlowRender = async (signInEmail) => {
    const type = document.getElementById("signInDiv") ? "In" : "Up";
    document.getElementById("signInWrapperDiv").replaceChildren(afterEmailLinkRender(signInEmail, type));

    document.querySelector('a[class~="firebaseui-id-trouble-getting-email-link"]').addEventListener("click", () => {
        document.getElementById("signInWrapperDiv").replaceChildren(troubleGettingEmailRender(type));

        document
            .querySelector('a[class~="firebaseui-id-resend-email-link"]')
            .addEventListener("click", () => sendEmailLink());

        document.querySelector('button[class~="firebaseui-id-secondary-link"]').addEventListener("click", async () => {
            if (type === "In") {
                signInCheckRender({});
            } else {
                await signUpRender({ signUpType: "email" });
            }
        });
    });

    document.querySelector('button[class~="firebaseui-id-secondary-link"]').addEventListener("click", (e) => {
        e.preventDefault();
        window.localStorage.setItem("signInUpdate", "yes");
        signInCheckRender();
    });
};

export const sendEmailLink = () => {
    const preferredLanguage = getSelectedLanguage();
    const wrapperDiv = document.getElementById("signInWrapperDiv");
    const signInEmail = wrapperDiv.getAttribute("data-account-value");
    const continueUrl = window.location.href;

    const continueUrlWithoutHash = continueUrl.endsWith("#")
        ? continueUrl.slice(0, -1)
        : continueUrl;

    fetch(`${api}?api=sendEmailLink`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: signInEmail,
            continueUrl: continueUrlWithoutHash,
            preferredLanguage
        })
    }).then(() => {
        signInFlowRender(signInEmail);
    });
};

/**
 * Validate the PIN entered by the new participant. Send the PIN for validation. Include the first sign in time. Both are added to Firestore on success.
 * PIN number and first sign in time are required.
 * @param {object} pinEntryFormData - The form data object containing the PIN and first sign in time.
 * @returns {object} - The response object from the API.
 */

export const validatePin = async (pinEntryFormData) => {

    if (!pinEntryFormData[fieldMapping.pinNumber] || typeof pinEntryFormData[fieldMapping.pinNumber] !== 'string') {
        return { code: 400, message: 'Invalid PIN format.' };
    }

    if (!pinEntryFormData[fieldMapping.firstSignInTime] || typeof pinEntryFormData[fieldMapping.firstSignInTime] !== 'string') {
        return { code: 400, message: 'Invalid first sign in time format.' };
    }

    try {
        const idToken = await getIdToken();
        const response = await fetch(api + '?api=validatePin', {
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + idToken
            },
            body: JSON.stringify(pinEntryFormData)
        });

        return await response.json();

    } catch (error) {
        throw new Error('An unexpected error occurred in validatePin(). Error: ' + error.message);
    }
}

/**
 * The participant clicked 'I do not have a PIN' OR submitted a PIN and validation failed.
 * That means there's no existing participant record and we need to create one.
 * Required fields: first sign in time.
 * Optional fields: PIN number (if participant entered a PIN that failed to validate) and 'don't have a PIN' flag if no PIN was entered.
 * @param {object} pinEntryFormData - The form data object containing first sign in time.
 */

export const createParticipantRecord = async (pinEntryFormData) => {
    try {
        if (!pinEntryFormData[fieldMapping.firstSignInTime] || typeof pinEntryFormData[fieldMapping.firstSignInTime] !== 'string') {
            return { code: 400, message: 'Invalid first sign in time format.' };
        }

        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=createParticipantRecord`, {
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + idToken
            },
            body: JSON.stringify(pinEntryFormData)
        });

        return await response.json();

    } catch (error) {
        throw new Error('An unexpected error occurred in createParticipantRecord(). Error: ' + error.message);
    }
}

//Store tree function being passed into quest
// @deprecated. Retain until migration to Quest2 is complete. Quest 2.0+ has tree storage integrated into response saving.
export const storeResponseTree = async (questName) => {

    let formData = { [questName]: { treeJSON: questionQueue.toJSON() } };

    await storeResponse(formData);
}

/**
 * Processes and stores questionnaire response data in the appropriate format for the backend.
 * It separates completion status data from regular response data, processes them separately,
 * and ensures proper storage of both types of data.
 * @param {object} formData - The raw form data object containing questionnaire responses with keys in the format "moduleId.conceptId".
 * @returns {Promise<object>} - The response from the storeResponse API call.
 */
export const storeResponseQuest = async (formData) => {

    let keys = Object.keys(formData);
    let first = keys[0];
    let moduleId = first.slice(0, first.indexOf("."));

    let transformedData = { [moduleId]: {} };
    let completedData = {};

    keys.forEach(key => {
        let id = key.slice(first.indexOf(".") + 1);
        if (formData[key] === undefined) {
            transformedData[moduleId][id] = null;
        }
        else if (["COMPLETED", "COMPLETED_TS"].includes(id)) {
            completedData[id] = formData[key];
        }
        else {
            transformedData[moduleId][id] = formData[key]
        }
    });

    if (Object.keys(completedData).length > 0) {
        return await completeSurvey(completedData, moduleId);
    }

    if (Object.keys(transformedData[moduleId]).length > 0) {
        return await storeResponse(transformedData);
    }
}

/**
 * This is only called if one of either COMPLETED or COMPLETED_TS is present in the formData.
 * Quest1 bug found where the COMPLETED status was not being stored in the Firestore.
 * This handles that case, updates the completed status, and logs an error if the COMPLETED status is missing.
 * It also handles the case where the COMPLETED_TS timestamp is missing. We haven't seen this case, but it's possible.
 * @param {object} data - The formData object with the COMPLETED and COMPLETED_TS properties.
 * @param {string} moduleId - The module ID of the survey (mapping found in fieldToConceptIdMapping.js).
 */

const completeSurvey = async (data, moduleId) => {

    const moduleName = fieldMapping.conceptToModule[moduleId];

    if (!data["COMPLETED"]) {
        logDDRumError(new Error('Submit Survey Error: Missing COMPLETED status'), 'CompleteSurveyError', {
            userAction: 'submit survey',
            timestamp: new Date().toISOString(),
            questionnaire: moduleId,
        });
    }

    if (!data['COMPLETED_TS']) {
        logDDRumError(new Error('Submit Survey Error: Missing COMPLETED_TS timestamp'), 'CompleteSurveyError', {
            userAction: 'submit survey',
            timestamp: new Date().toISOString(),
            questionnaire: moduleId,
        });

        data['COMPLETED_TS'] = new Date().toISOString();
    }

    const formData = {
        [fieldMapping[moduleName].statusFlag]: fieldMapping.moduleStatus.submitted,
        [fieldMapping[moduleName].completeTs]: data["COMPLETED_TS"],
    }

    // Return the response on failure.
    // The success response reloads the page, but the error response needs to be handled in Quest.
    let submitSurveyResponse;
    try {
        submitSurveyResponse = await storeResponse(formData);

        if (submitSurveyResponse.code === 200) {
            location.reload();
        } else {
            throw new Error(`Submit Survey Error: Failed to submit survey. Code: ${submitSurveyResponse.code}, Message: ${submitSurveyResponse.message}`);
        }
    } catch (error) {
        logDDRumError(error, 'SubmitSurveyError', {
            userAction: 'submit survey',
            timestamp: new Date().toISOString(),
            questionnaire: moduleId,
        });

        return submitSurveyResponse;
    }
}

export const storeResponse = async (formData) => {

    const idToken = await getIdToken();
    const response = await fetch(`${api}?api=submit`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + idToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    const responseObj = await response.json();

    return responseObj;
}

export const storeSocial = async (formData) => {

    const idToken = await getIdToken();
    const response = await fetch(`${api}?api=submitSocial`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + idToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    return await response.json();
}

export const getMyData = async () => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=getUserProfile`, {
            headers: {
                Authorization: "Bearer " + idToken,
            },
        });

        return await response.json();
    } catch (err) {
        logDDRumError(err, "getMyDataError", {
            userAction: "Get participant data",
            timestamp: new Date().toISOString(),
        });

        return { code: 500, data: null, message: "Error occurred when calling getMyData()" };
    }
};

export const getKitTrackingNumber = async (uniqueKitID) => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=getKitTrackingNumber&uniqueKitID=${uniqueKitID}`, {
            headers: {
                Authorization: "Bearer " + idToken,
            },
        });

        return await response.json();
    } catch (err) {
        logDDRumError(err, "getMyDataError", {
            userAction: "Get participant data",
            timestamp: new Date().toISOString(),
        });

        return { code: 500, data: null, message: "Error occurred when calling getMyData()" };
    }
}

/**
 * Determines the type of shipping used for a package and returns the information.
 * 
 * @param {*} trackingNum 
 * @returns 
 */
export const getTrackingNumberSource = (trackingNum = '') => {
    if (`${trackingNum}`.length === 22 || `${trackingNum}`.length === 20) {
        return 'USPS';
    } else if (`${trackingNum}`.length === 12 || `${trackingNum}`.length === 34) {
        return 'FedEx';
    }
    return '';
}

export const retrievePhysicalActivityReport = async () => {

    const idToken = await getIdToken();
    const response = await fetch(`${api}?api=retrievePhysicalActivityReport`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });

    return await response.json();
};

export const retrieveDHQHEIReport = async (dhqData) => {

    if (!dhqData || typeof dhqData !== 'object' || !dhqData.studyID || !dhqData.username) {
        return { code: 400, data: [], message: 'Invalid DHQ data' };
    }

    const studyID = dhqData.studyID;
    const respondentUsername = dhqData.username;

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=retrieveDHQHEIReport`, {
            method: "POST",
            headers: {
                Authorization: 'Bearer ' + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ studyID, respondentUsername })
        });

        if (!response.ok) {
            throw new Error(`Server responded with: ${response.status}`);
        }

        const jsonResponse = await response.json();

        if (jsonResponse.code === 200) {
            return jsonResponse;
        }

        throw new Error(`Retrieve DHQ HEI Report Error: ${jsonResponse.message}`);

    } catch (error) {
        console.error('Error in retrieveDHQHEIReport:', error);
        logDDRumError(error, 'RetrieveDHQHEIReportError', {
            userAction: 'retrieve DHQ HEI report',
            timestamp: new Date().toISOString(),
        });
        return { code: 500, data: [], message: 'An unexpected error occurred in retrieveDHQHEIReport()' };
    }
};

export const updateDHQReportViewedStatus = async (studyID, respondentUsername, isDeclined = false) => {

    if (!studyID || !respondentUsername) {
        console.error('DHQ3 Update criteria not met. Missing at least one of studyID, respondentUsername:', studyID, respondentUsername);
        return null;
    }

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=updateDHQReportViewedStatus`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ studyID, respondentUsername, isDeclined })
        });

        if (!response.ok) {
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }

        const reportData = await response.json();
        if (reportData.code === 200) {
            return;
        }

        throw new Error('Failed to update DHQ Report viewed status. Response code: ' + reportData.code);

    } catch (error) {
        console.error('Error in updateDHQReportViewedStatus:', error);
        throw error;
    }
}



export const hasUserData = (response) => {

    return response.code === 200 && Object.keys(response.data).length > 0;
}

export const successResponse = (response) => {
    return response.code === 200
}

export const getMySurveys = async (data, filter = false) => {

    const idToken = await getIdToken();
    const response = await fetch(`${api}?api=getUserSurveys`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + idToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    let surveyData = await response.json();

    if (surveyData.code === 200) {

        let versionNumbers = [];

        Object.keys(fieldMapping.conceptToModule).forEach(module => {

            let version = fieldMapping[fieldMapping.conceptToModule[module]].version;

            if (version) versionNumbers.push(version);
        });

        Object.keys(surveyData.data).forEach(survey => {
            versionNumbers.forEach(versionNumber => {
                if (surveyData.data[survey][versionNumber]) {
                    delete surveyData.data[survey][versionNumber];
                }
            });

            if (filter) {
                if (surveyData.data[survey][fieldMapping.surveyLanguage]) {
                    delete surveyData.data[survey][fieldMapping.surveyLanguage];
                }
            }
        })
    }

    return surveyData;
}

export const getMyCollections = async () => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=getUserCollections`, {
            headers: {
                Authorization: "Bearer " + idToken
            }
        });

        return await response.json();

    } catch (error) {
        logDDRumError(error, 'GetMyCollectionsError', {
            userAction: 'get user collections',
            timestamp: new Date().toISOString(),
        });
        return { code: 500, message: 'An unexpected error occurred in getMyCollections()' };
    }
}

const allIHCS = {
    531629870: 'HealthPartners',
    548392715: 'Henry Ford Health',
    125001209: 'Kaiser Permanente Colorado',
    327912200: 'Kaiser Permanente Georgia',
    300267574: 'Kaiser Permanente Hawaii',
    452412599: 'Kaiser Permanente Northwest',
    303349821: 'Marshfield Clinic Health System',
    657167265: 'Sanford Health',
    809703864: 'University of Chicago Medicine',
    472940358: 'Baylor Scott & White Health'
}

export const sites = () => {
    if (location.host === urls.prod) {
        return {
            657167265: 'Sanford Health',
            531629870: 'HealthPartners',
            548392715: 'Henry Ford Health',
            303349821: 'Marshfield Clinic Health System',
            809703864: 'University of Chicago Medicine',
            125001209: 'Kaiser Permanente Colorado',
            452412599: 'Kaiser Permanente Northwest',
            327912200: 'Kaiser Permanente Georgia',
            300267574: 'Kaiser Permanente Hawaii',
            472940358: 'Baylor Scott & White Health'
        }
    }
    else if (location.host === urls.stage) {
        return {
            657167265: 'Sanford Health',
            531629870: 'HealthPartners',
            548392715: 'Henry Ford Health',
            303349821: 'Marshfield Clinic Health System',
            809703864: 'University of Chicago Medicine',
            125001209: 'Kaiser Permanente Colorado',
            327912200: 'Kaiser Permanente Georgia',
            300267574: 'Kaiser Permanente Hawaii',
            452412599: 'Kaiser Permanente Northwest',
            472940358: 'Baylor Scott & White Health'
        }
        //return allIHCS
    }
    else {
        return { ...allIHCS, 13: 'National Cancer Institute' }
    }
}

export const sitesNotEnrolling = () => {
    if (location.host === urls.prod) {
        return {
            809703864: 'University of Chicago Medicine',
        }
    }
    else if (location.host === urls.stage) {
        return {
            809703864: 'University of Chicago Medicine',
        }
    }
    else {
        return {
            809703864: 'University of Chicago Medicine',
        }
    }
}

export const siteAcronyms = () => {
    return {
        531629870: 'HP',
        548392715: 'HFHS',
        125001209: 'KPCO',
        327912200: 'KPGA',
        300267574: 'KPHI',
        452412599: 'KPNW',
        303349821: 'Marshfield',
        657167265: 'Sanford',
        809703864: 'UChicago',
        472940358: 'BSWH',
        13: 'NCI'
    }
}


export const todaysDate = () => {
    const today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1;
    const yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }
    return mm + '/' + dd + '/' + yyyy;
}

export const dateTime = () => {
    return new Date().toISOString();
}

export const getIdToken = () => {
    return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            unsubscribe();
            if (user && !user.isAnonymous) {
                user.getIdToken().then((idToken) => {
                    resolve(idToken);
                }, () => {
                    resolve(null);
                });
            } else {
                resolve(null);
            }
        });
    });
};

export const userLoggedIn = () => {
    return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            unsubscribe();
            if (user && !user.isAnonymous) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

export const getParameters = (URL) => {
    const hash = decodeURIComponent(URL);
    const index = hash.indexOf('?');
    if (index !== -1) {
        let query = hash.slice(index + 1, hash.length);
        query = query.replace(/#\?/g, "&")
        if (query.indexOf('#') !== -1) query = query.slice(0, query.indexOf('#'))
        const array = query.split('&');
        let obj = {};
        array.forEach(value => {
            let split = value.split('=');

            if (!value || split[1] === undefined || split[1].trim() === "") return;
            obj[split[0]] = split[1];
        });
        return obj;
    }
    else {
        return null;
    }
}

export const dataSavingBtn = (className) => {
    const btn = document.getElementsByClassName(className)[0];
    btn.innerHTML = translateText('shared.savingSpin');
}

export const errorMessage = (id, msg, focus) => {
    const currentElement = document.getElementById(id);
    const parentElement = currentElement.parentNode;
    if (Array.from(parentElement.querySelectorAll('.form-error')).length > 0) return;
    if (msg) {
        const div = document.createElement('div');
        div.classList = ['error-text'];
        const span = document.createElement('span');
        span.classList = ['form-error']
        span.innerHTML = msg;
        div.append(span);
        parentElement.appendChild(div);
    }
    currentElement.classList.add('invalid');
    if (focus) currentElement.focus();
}

export const errorMessageNumbers = (id, msg, focus) => {
    const currentElement = document.getElementById(id);
    const parentElement = currentElement.parentNode;
    const parent1 = parentElement.parentNode
    if (Array.from(parentElement.querySelectorAll('.form-error')).length > 0) return;
    if (msg) {
        const br = document.createElement('br');
        const div = document.createElement('div');
        div.classList = ['error-text'];
        const span = document.createElement('span');
        span.classList = ['form-error']
        span.innerHTML = msg;
        div.append(span);
        parent1.appendChild(br)
        parent1.appendChild(div);
    }
    currentElement.classList.add('invalid');
    if (focus) currentElement.focus();
}


export const errorMessageConsent = (id, msg, focus) => {
    const currentElement = document.getElementById(id);
    const parentElement = currentElement.parentNode;
    if (Array.from(parentElement.querySelectorAll('.form-error')).length > 0) return;
    if (msg) {
        const div = document.createElement('div');
        div.classList = ['col-auto'];
        const span = document.createElement('span');
        span.classList = ['form-error']
        span.innerHTML = msg;
        div.append(span);
        parentElement.appendChild(div);
    }
    currentElement.classList.add('invalid');
    if (focus) currentElement.focus();
}


export const getAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return Math.max(age, 0);  // returns 0 if age is negative
}

export const allStates = {
    "Alabama": 1,
    "Alaska": 2,
    "Arizona": 3,
    "Arkansas": 4,
    "California": 5,
    "Colorado": 6,
    "Connecticut": 7,
    "Delaware": 8,
    "District of Columbia": 9,
    "Florida": 10,
    "Georgia": 11,
    "Hawaii": 12,
    "Idaho": 13,
    "Illinois": 14,
    "Indiana": 15,
    "Iowa": 16,
    "Kansas": 17,
    "Kentucky": 18,
    "Louisiana": 19,
    "Maine": 20,
    "Maryland": 21,
    "Massachusetts": 22,
    "Michigan": 23,
    "Minnesota": 24,
    "Mississippi": 25,
    "Missouri": 26,
    "Montana": 27,
    "Nebraska": 28,
    "Nevada": 29,
    "New Hampshire": 30,
    "New Jersey": 31,
    "New Mexico": 32,
    "New York": 33,
    "North Carolina": 34,
    "North Dakota": 35,
    "Ohio": 36,
    "Oklahoma": 37,
    "Oregon": 38,
    "Pennsylvania": 39,
    "Rhode Island": 40,
    "South Carolina": 41,
    "South Dakota": 42,
    "Tennessee": 43,
    "Texas": 44,
    "Utah": 45,
    "Vermont": 46,
    "Virginia": 47,
    "Washington": 48,
    "West Virginia": 49,
    "Wisconsin": 50,
    "Wyoming": 51,
    "NA": 52
}

export const statesWithAbbreviations = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    "District of Columbia": "DC",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
    NA: "NA", // Assuming NA should remain NA
};

export const allCountries = {
    "United States": 1,
    "Afghanistan": 2,
    "Albania": 3,
    "Algeria": 4,
    "American Samoa": 5,
    "Andorra": 6,
    "Angola": 7,
    "Anguilla": 8,
    "Antarctica": 9,
    "Antigua and Barbuda": 10,
    "Argentina": 11,
    "Armenia": 12,
    "Aruba": 13,
    "Australia": 14,
    "Austria": 15,
    "Azerbaijan": 16,
    "Bahamas": 17,
    "Bahrain": 18,
    "Bangladesh": 19,
    "Barbados": 20,
    "Belarus": 21,
    "Belgium": 22,
    "Belize": 23,
    "Benin": 24,
    "Bermuda": 25,
    "Bhutan": 26,
    "Bolivia": 27,
    "Bosnia and Herzegovina": 28,
    "Botswana": 29,
    "Brazil": 30,
    "British Indian Ocean Territory": 31,
    "British Virgin Islands": 32,
    "Brunei": 33,
    "Bulgaria": 34,
    "Burkina Faso": 35,
    "Burundi": 36,
    "Cambodia": 37,
    "Cameroon": 38,
    "Canada": 39,
    "Cape Verde": 40,
    "Cayman Islands": 41,
    "Central African Republic": 42,
    "Chad": 43,
    "Chile": 44,
    "China": 45,
    "Christmas Island": 46,
    "Cocos Islands": 47,
    "Colombia": 48,
    "Comoros": 49,
    "Cook Island": 50,
    "Costa Rica": 51,
    "Croatia": 52,
    "Cuba": 53,
    "Curacao": 54,
    "Cyprus": 55,
    "Czech Republic": 56,
    "Democratic Republic of the Congo": 57,
    "Denmark": 58,
    "Djibouti": 59,
    "Dominica": 60,
    "Dominican Republic": 61,
    "East Timor": 62,
    "Ecuador": 63,
    "Egypt": 64,
    "El Salvador": 65,
    "Equatorial Guinea": 66,
    "Eritrea": 67,
    "Estonia": 68,
    "Ethiopia": 69,
    "Falkland Islands": 70,
    "Faroe Islands": 71,
    "Fiji": 72,
    "Finland": 73,
    "France": 74,
    "French Polynesia": 75,
    "Gabon": 76,
    "Gambia": 77,
    "Georgia": 78,
    "Germany": 79,
    "Ghana": 80,
    "Gibraltar": 81,
    "Greece": 82,
    "Greenland": 83,
    "Grenada": 84,
    "Guam": 85,
    "Guatemala": 86,
    "Guernsey": 87,
    "Guinea": 88,
    "Guinea-Bissau": 89,
    "Guyana": 90,
    "Haiti": 91,
    "Honduras": 92,
    "Hong Kong": 93,
    "Hungary": 94,
    "Iceland": 95,
    "India": 96,
    "Indonesia": 97,
    "Iran": 98,
    "Iraq": 99,
    "Ireland": 100,
    "Isle of Man": 101,
    "Israel": 102,
    "Italy": 103,
    "Ivory Coast": 104,
    "Jamaica": 105,
    "Japan": 106,
    "Jersey": 107,
    "Jordan": 108,
    "Kazakhstan": 109,
    "Kenya": 110,
    "Kiribati": 111,
    "Kosovo": 112,
    "Kuwait": 113,
    "Kyrgyzstan": 114,
    "Laos": 115,
    "Latvia": 116,
    "Lebanon": 117,
    "Lesotho": 118,
    "Liberia": 119,
    "Libya": 120,
    "Liechtenstein": 121,
    "Lithuania": 122,
    "Luxembourg": 123,
    "Macao": 124,
    "Macedonia": 125,
    "Madagascar": 126,
    "Malawi": 127,
    "Malaysia": 128,
    "Maldives": 129,
    "Mali": 130,
    "Malta": 131,
    "Marshall Islands": 132,
    "Mauritania": 133,
    "Mauritius": 134,
    "Mayotte": 135,
    "Mexico": 136,
    "Micronesia": 137,
    "Moldova": 138,
    "Monaco": 139,
    "Mongolia": 140,
    "Montenegro": 141,
    "Montserrat": 142,
    "Morocco": 143,
    "Mozambique": 144,
    "Myanmar": 145,
    "Namibia": 146,
    "Nauru": 147,
    "Nepal": 148,
    "Netherlands": 149,
    "Netherlands Antilles": 150,
    "New Caledonia": 151,
    "New Zealand": 152,
    "Nicaragua": 153,
    "Niger": 154,
    "Nigeria": 155,
    "Niue": 156,
    "North Korea": 157,
    "Northern Mariana Islands": 158,
    "Norway": 159,
    "Oman": 160,
    "Pakistan": 161,
    "Palau": 162,
    "Palestine": 163,
    "Panama": 164,
    "Papua New Guinea": 165,
    "Paraguay": 166,
    "Peru": 167,
    "Philippines": 168,
    "Pitcairn": 169,
    "Poland": 170,
    "Portugal": 171,
    "Puerto Rico": 172,
    "Qatar": 173,
    "Republic of the Congo": 174,
    "Reunion": 175,
    "Romania": 176,
    "Russia": 177,
    "Rwanda": 178,
    "Saint Barthelemy": 179,
    "Saint Helena": 180,
    "Saint Kitts and Nevis": 181,
    "Saint Lucia": 182,
    "Saint Martin": 183,
    "Saint Pierre and Miquelon": 184,
    "Saint Vincent and the Grenadines": 185,
    "Samoa": 186,
    "San Marino": 187,
    "Sao Tome and Principe": 188,
    "Saudi Arabia": 189,
    "Senegal": 190,
    "Serbia": 191,
    "Seychelles": 192,
    "Sierra Leone": 193,
    "Singapore": 194,
    "Sint Maarten": 195,
    "Slovakia": 196,
    "Slovenia": 197,
    "Solomon Islands": 198,
    "Somalia": 199,
    "South Africa": 200,
    "South Korea": 201,
    "South Sudan": 202,
    "Spain": 203,
    "Sri Lanka": 204,
    "Sudan": 205,
    "Suriname": 206,
    "Svalbard and Jan Mayen": 207,
    "Swaziland": 208,
    "Sweden": 209,
    "Switzerland": 210,
    "Syria": 211,
    "Taiwan": 212,
    "Tajikistan": 213,
    "Tanzania": 214,
    "Thailand": 215,
    "Togo": 216,
    "Tokelau": 217,
    "Tonga": 218,
    "Trinidad and Tobago": 219,
    "Tunisia": 220,
    "Turkey": 221,
    "Turkmenistan": 222,
    "Turks and Caicos Islands": 223,
    "Tuvalu": 224,
    "U.S. Virgin Islands": 225,
    "Uganda": 226,
    "Ukraine": 227,
    "United Arab Emirates": 228,
    "United Kingdom": 229,
    "Uruguay": 230,
    "Uzbekistan": 231,
    "Vanuatu": 232,
    "Vatican": 233,
    "Venezuela": 234,
    "Vietnam": 235,
    "Wallis and Futuna": 236,
    "Western Sahara": 237,
    "Yemen": 238,
    "Zambia": 239,
    "Zimbabwe": 240
}

export const country3Codes = [
    "usa",
    "ala",
    "afg",
    "alb",
    "dza",
    "asm",
    "and",
    "ago",
    "aia",
    "ata",
    "atg",
    "arg",
    "arm",
    "abw",
    "aus",
    "aut",
    "aze",
    "bhs",
    "bhr",
    "bgd",
    "brb",
    "blr",
    "bel",
    "blz",
    "ben",
    "bmu",
    "btn",
    "bol",
    "bes",
    "bih",
    "bwa",
    "bvt",
    "bra",
    "atb",
    "iot",
    "brn",
    "bgr",
    "bfa",
    "bdi",
    "bys",
    "civ",
    "cpv",
    "khm",
    "cmr",
    "can",
    "cte",
    "cym",
    "caf",
    "tcd",
    "chl",
    "chn",
    "cxr",
    "cck",
    "col",
    "com",
    "cog",
    "cod",
    "cok",
    "cri",
    "hrv",
    "cub",
    "cuw",
    "cyp",
    "cze",
    "csk",
    "dhy",
    "dnk",
    "dji",
    "dma",
    "dom",
    "atn",
    "ecu",
    "egy",
    "slv",
    "gnq",
    "eri",
    "est",
    "swz",
    "eth",
    "flk",
    "fro",
    "fji",
    "fin",
    "fra",
    "afi",
    "guf",
    "pyf",
    "atf",
    "gab",
    "gmb",
    "geo",
    "ddr",
    "deu",
    "gha",
    "gib",
    "gel",
    "grc",
    "grl",
    "grd",
    "glp",
    "gum",
    "gtm",
    "ggy",
    "gin",
    "gnb",
    "guy",
    "hti",
    "hmd",
    "vat",
    "hnd",
    "hkg",
    "hun",
    "isl",
    "ind",
    "idn",
    "irn",
    "irq",
    "irl",
    "imn",
    "isr",
    "ita",
    "jam",
    "jpn",
    "jey",
    "jtn",
    "jor",
    "kaz",
    "ken",
    "kir",
    "prk",
    "kor",
    "kwt",
    "kgz",
    "lao",
    "lva",
    "lbn",
    "lso",
    "lbr",
    "lby",
    "lie",
    "ltu",
    "lux",
    "mac",
    "mdg",
    "mwi",
    "mys",
    "mdv",
    "mli",
    "mlt",
    "mhl",
    "mtq",
    "mrt",
    "mus",
    "myt",
    "mex",
    "fsm",
    "mid",
    "mda",
    "mco",
    "mng",
    "mne",
    "msr",
    "mar",
    "moz",
    "mmr",
    "nam",
    "nru",
    "npl",
    "nld",
    "ncl",
    "nhb",
    "nzl",
    "nic",
    "ner",
    "nga",
    "niu",
    "nfk",
    "mkd",
    "mnp",
    "nor",
    "omn",
    "pci",
    "pak",
    "plw",
    "pse",
    "pan",
    "pcz",
    "png",
    "pry",
    "per",
    "phl",
    "pcn",
    "pol",
    "prt",
    "pri",
    "qat",
    "reu",
    "rou",
    "rus",
    "rwa",
    "blm",
    "shn",
    "kna",
    "lca",
    "maf",
    "spm",
    "vct",
    "wsm",
    "smr",
    "stp",
    "sau",
    "sen",
    "srb",
    "syc",
    "sle",
    "skm",
    "sgp",
    "sxm",
    "svk",
    "svn",
    "slb",
    "som",
    "zaf",
    "sgs",
    "ssd",
    "rho",
    "esp",
    "lka",
    "sdn",
    "sur",
    "sjm",
    "swe",
    "che",
    "syr",
    "twn",
    "tjk",
    "tza",
    "tha",
    "tls",
    "tgo",
    "tkl",
    "ton",
    "tto",
    "tun",
    "tur",
    "tkm",
    "tca",
    "tuv",
    "uga",
    "ukr",
    "are",
    "gbr",
    "umi",
    "pus",
    "hvo",
    "ury",
    "uzb",
    "vut",
    "ven",
    "vnm",
    "vdr",
    "vgb",
    "vir",
    "wak",
    "wlf",
    "esh",
    "yem",
    "ymd",
    "zmb",
    "zwe"
];

export const BirthMonths = {
    "01": "1 - January",
    "02": "2 - February",
    "03": "3 - March",
    "04": "4 - April",
    "05": "5 - May",
    "06": "6 - June",
    "07": "7 - July",
    "08": "8 - August",
    "09": "9 - September",
    "10": "10 - October",
    "11": "11 - November",
    "12": "12 - December"
}

export const swapKeysAndValues = (obj) => {
    const swapped = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            swapped[obj[key]] = key; // Direct swap (no duplicate check)
        }
    }

    return swapped;
};

export const showAnimation = () => {
    if (document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = '';
}

export const hideAnimation = () => {
    if (document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = 'none';
}

export const subscribeForNotifications = async (data) => {
    const idToken = await getIdToken();
    const response = await fetch(`${api}?api=subscribeToNotification`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + idToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return await response;
}

let processingRetrieveNotifications = false;
const retrieveNotificationsEventTarget = new EventTarget();
export const retrieveNotifications = async (markAsRead) => {
    if (processingRetrieveNotifications) {
        await waitForRetrieveNotifications();
    }
    
    processingRetrieveNotifications = true;
    let resultJson = { data: [] };
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=retrieveNotifications&markasread=${markAsRead ? 'true' : 'false'}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + idToken
            },
        });
        
        resultJson = await response.json();

    } catch (error) {
        console.error(error);
    } finally {
        processingRetrieveNotifications = false;
        retrieveNotificationsEventTarget.dispatchEvent(new CustomEvent('done'));
    }
    return resultJson;
};

const waitForRetrieveNotifications = () => {
    return new Promise((resolve) => {
        retrieveNotificationsEventTarget.addEventListener('done', () => {
            resolve();
        }, {once: true});
    })
}

/**
 * Check if account exists
 * @param {{accountType:'email' | 'phone', accountValue: string}} data 
 * @returns {Promise<{data:{accountExists:boolean}, code:number}>}
 */
export const checkAccount = async (data) => {
    const idToken = appState.getState().idToken;
    const response = await fetch(`${api}?api=validateEmailOrPhone&${data.accountType}=${data.accountValue}`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + idToken
        },
    });

    const jsonResponse = await response.json();
    return jsonResponse;
}

export const toggleNavbarMobileView = () => {
    const navbarCollapse = document.querySelector('#navbarContent.show');
    const navbarToggler = document.querySelector('.navbar-toggler');

    if (navbarCollapse) {
        navbarCollapse.classList.remove('show');
        if (navbarToggler) {
            navbarToggler.classList.add('collapsed');
            navbarToggler.setAttribute('aria-expanded', 'false');
        }
    }
};

export const questionnaireModules = () => {

    if (location.host === urls.prod) {
        return {
            'Connect Experience 2024': {
                path: {
                    en: 'prod/module2024ConnectExperience.txt',
                    es: 'prod/module2024ConnectExperienceSpanish.txt'
                },
                moduleId: "Experience2024",
                enabled: false
            },
            'Background and Overall Health': {
                path: {
                    en: 'prod/module1.txt',
                    es: 'prod/module1Spanish.txt'
                },
                moduleId: "Module1",
                enabled: true
            },
            'Medications, Reproductive Health, Exercise, and Sleep': {
                path: {
                    en: 'prod/module2.txt',
                    es: 'prod/module2Spanish.txt'
                },
                moduleId: "Module2",
                enabled: false
            },
            'Smoking, Alcohol, and Sun Exposure': {
                path: {
                    en: 'prod/module3.txt',
                    es: 'prod/module3Spanish.txt'
                },
                moduleId: "Module3",
                enabled: false
            },
            'Where You Live and Work': {
                path: {
                    en: 'prod/module4.txt',
                    es: 'prod/module4Spanish.txt'
                },
                moduleId: "Module4",
                enabled: false
            },
            'Enter SSN': {
                moduleId: "ModuleSsn",
                enabled: false
            },
            'Covid-19': {
                path: {
                    en: 'prod/moduleCOVID19.txt',
                    es: 'prod/moduleCOVID19Spanish.txt'
                },
                moduleId: "ModuleCovid19",
                enabled: false
            },
            'Biospecimen Survey': {
                path: {
                    en: 'prod/moduleBiospecimen.txt',
                    es: 'prod/moduleBiospecimenSpanish.txt'
                },
                moduleId: "Biospecimen",
                enabled: false
            },
            'Clinical Biospecimen Survey': {
                path: {
                    en: 'prod/moduleClinicalBloodUrine.txt',
                    es: 'prod/moduleClinicalBloodUrineSpanish.txt'
                },
                moduleId: "ClinicalBiospecimen",
                enabled: false
            },
            'Menstrual Cycle': {
                path: {
                    en: 'prod/moduleMenstrual.txt',
                    es: 'prod/moduleMenstrualSpanish.txt'
                },
                moduleId: "MenstrualCycle",
                enabled: false
            },
            'Mouthwash': {
                path: {
                    en: 'prod/moduleMouthwash.txt',
                    es: 'prod/moduleMouthwashSpanish.txt'
                },
                moduleId: "Mouthwash",
                enabled: false
            },
            'PROMIS': {
                path: {
                    en: 'prod/moduleQoL.txt',
                    es: 'prod/moduleQoLSpanish.txt'
                },
                moduleId: "PROMIS",
                enabled: false
            },
            'Cancer Screening History': {
                path: {
                    en: 'prod/moduleCancerScreeningHistory.txt',
                    es: 'prod/moduleCancerScreeningHistorySpanish.txt'
                },
                moduleId: "CancerScreeningHistory",
                enabled: false
            },
            // External module (unrelated to Quest)
            'Diet History Questionnaire III (DHQ III)': {
                path: {
                    en: 'https://www.dhq3.org/respondent-login/',
                    es: 'https://www.dhq3.org/respondent-login/'
                },
                moduleId: "DHQ3",
                enabled: false,
            },
            '2026 Return of Results Preference Survey': {
                path: {
                    en: 'prod/module2026ROIPreferencesStage.txt',
                    es: 'prod/module2026ROIPreferencesStageSpanish.txt'
                },
                moduleId: "ROIPreference2026",
                enabled: false
            },
        }
    }

    return {
        'Connect Experience 2024': {
            path: {
                en: 'module2024ConnectExperienceStage.txt',
                es: 'module2024ConnectExperienceStageSpanish.txt'
            },
            moduleId: "Experience2024",
            enabled: false
        },
        'Background and Overall Health': {
            path: {
                en: 'module1Stage.txt',
                es: 'module1StageSpanish.txt'
            },
            moduleId: "Module1",
            enabled: true
        },
        'Medications, Reproductive Health, Exercise, and Sleep': {
            path: {
                en: 'module2Stage.txt',
                es: 'module2StageSpanish.txt'
            },
            moduleId: "Module2",
            enabled: false
        },
        'Smoking, Alcohol, and Sun Exposure': {
            path: {
                en: 'module3Stage.txt',
                es: 'module3StageSpanish.txt'
            },
            moduleId: "Module3",
            enabled: false
        },
        'Where You Live and Work': {
            path: {
                en: 'module4Stage.txt',
                es: 'module4StageSpanish.txt'
            },
            moduleId: "Module4",
            enabled: false
        },
        'Enter SSN': {
            moduleId: "ModuleSsn",
            enabled: false
        },
        'Covid-19': {
            path: {
                en: 'moduleCOVID19Stage.txt',
                es: 'moduleCOVID19StageSpanish.txt'
            },
            moduleId: "ModuleCovid19",
            enabled: false
        },
        'Biospecimen Survey': {
            path: {
                en: 'moduleBiospecimenStage.txt',
                es: 'moduleBiospecimenStageSpanish.txt'
            },
            moduleId: "Biospecimen",
            enabled: false
        },
        'Clinical Biospecimen Survey': {
            path: {
                en: 'moduleClinicalBloodUrineStage.txt',
                es: 'moduleClinicalBloodUrineStageSpanish.txt'
            },
            moduleId: "ClinicalBiospecimen",
            enabled: false
        },
        'Menstrual Cycle': {
            path: {
                en: 'moduleMenstrualStage.txt',
                es: 'moduleMenstrualStageSpanish.txt'
            },
            moduleId: "MenstrualCycle",
            enabled: false
        },
        'Mouthwash': {
            path: {
                en: 'moduleMouthwash.txt',
                es: 'moduleMouthwashSpanish.txt'
            },
            moduleId: "Mouthwash",
            enabled: false
        },
        'PROMIS': {
            path: {
                en: 'moduleQoL.txt',
                es: 'moduleQoLSpanish.txt'
            },
            moduleId: "PROMIS",
            enabled: false
        },
        'Cancer Screening History': {
            path: {
                en: 'moduleCancerScreeningHistoryStage.txt',
                es: 'moduleCancerScreeningHistoryStageSpanish.txt'
            },
            moduleId: "CancerScreeningHistory",
            enabled: false
        },
        // External module (unrelated to Quest)
        'Diet History Questionnaire III (DHQ III)': {
            path: {
                en: 'https://www.dhq3.org/respondent-login/',
                es: 'https://www.dhq3.org/respondent-login/'
            },
            moduleId: "DHQ3",
            enabled: false,
        },
        '2026 Return of Results Preference Survey': {
            path: {
                en: 'module2026ROIPreferencesStage.txt',
                es: 'module2026ROIPreferencesStageSpanish.txt'
            },
            moduleId: "ROIPreference2026",
            enabled: false
        },
    };
}

export const reportConfiguration = () => {

    if (location.host === urls.prod) {
        return {
            'Physical Activity Report': {
                dateAvailableField: 'data.d_416831581', // Report generated in BQ
                path: {
                    en: 'prod/module2024ConnectExperience.txt',
                    es: 'prod/module2024ConnectExperienceSpanish.txt'
                },
                reportId: "physicalActivity",
                enabled: false
            },
            // External report (not stored on our servers)
            'DHQ HEI Report': {
                dateAvailableField: 'surveyDate', // Report generated on survey completion
                path: {
                    en: 'https://www.dhq3.org/respondent-login/',
                    es: 'https://www.dhq3.org/respondent-login/'
                },
                reportId: "dhqHEI",
                enabled: false
            }
        }
    }

    return {
        'Physical Activity Report': {
            dateAvailableField: 'data.d_416831581', // Report generated in BQ
            reportId: "physicalActivity",
            enabled: false
        },
        // External report (not stored on our servers)
        'DHQ HEI Report': {
            dateAvailableField: 'surveyDate', // Report generated on survey completion
            reportId: "dhqHEI",
            enabled: false
        }
    }
}

/**
 * Sets various flags of the reports based on the user data
 * 
 * @param {Object} data 
 * @param {Object[]} reports 
 * @returns 
 */
export const setReportAttributes = async (data, reports) => {
    //Does the user have a physical activity report
    if (data[fieldMapping.reports.physicalActivityReport] && data[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status] &&
        (data[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status] == fieldMapping.reports.unread ||
            data[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status] == fieldMapping.reports.viewed ||
            data[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status] == fieldMapping.reports.declined
        )
    ) {
        reports['Physical Activity Report'].enabled = true;
        reports['Physical Activity Report'].status = data[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status];
        reports['Physical Activity Report'].dateField = 'd_416831581';
        reports['Physical Activity Report'].surveyDate = data[fieldMapping.Module2.completeTs];
    }

    // DHQ HEI Report is available once the DHQ3 survey is submitted
    // Align data structure with BQ-related mapping from Physical Activity Report
    if (data[fieldMapping.DHQ3.statusFlag] === fieldMapping.moduleStatus.submitted) {
        reports['DHQ HEI Report'].enabled = true;
        reports['DHQ HEI Report'].status = data[fieldMapping.reports.dhq3.reportStatusInternal] || fieldMapping.reports.unread;
        reports['DHQ HEI Report'].dateField = 'dateField';
        reports['DHQ HEI Report'].surveyDate = data[fieldMapping.DHQ3.completeTs];
        reports['DHQ HEI Report'].data = {
            'dateField': data[fieldMapping.DHQ3.completeTs],
            'pdfData': '',
        };
    }

    return reports;
}

/**
 * Populates the report data from the backend
 * 
 * @param {Object[]} reports
 * @param {Object} dhqData - Optional data for DHQ HEI report
 */

export const populateReportData = async (reports) => {
    let reportData = await retrievePhysicalActivityReport();
    if (reportData.code === 200) {
        if (reportData.data && reportData.data[0]) {
            reports['Physical Activity Report'].data = reportData.data[0];
        } else {
            reports['Physical Activity Report'].data = {};
        }
    }

    return reports;
}

export const populateDHQHEIReportData = async (reports, dhqData) => {
    try {
        const dhqHEIReportData = await retrieveDHQHEIReport(dhqData);

        if (dhqHEIReportData?.code === 200) {
            reports['DHQ HEI Report'].data.pdfData = dhqHEIReportData.data || '';

        } else {
            throw new Error(`Failed to retrieve DHQ HEI report data: ${dhqHEIReportData?.message || 'Unknown error'}`);
        }

    } catch (error) {
        logDDRumError(error, 'populateDHQHEIReportDataError', {
            userAction: 'get DHQ HEI report data',
            timestamp: new Date().toISOString(),
        });
        reports['DHQ HEI Report'].data.pdfData = '';

    } finally {
        return reports;
    }
}

export const isBrowserCompatible = () => {
    const userAgent = navigator.userAgent;
    let browserName;
    // else if(userAgent.match(/firefox|fxios/i)){
    //     browserName = "firefox";
    // }
    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "chrome";
    } else if (userAgent.match(/firefox/i)) {
        browserName = "firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "safari";
    } else if (userAgent.match(/edg/i)) {
        browserName = "edge";
    } else browserName = 'Not supported'
    const isValidBrowser = /Chrome/i.test(browserName) || /Firefox/i.test(browserName) || /Safari/i.test(browserName) || /Edge/i.test(browserName);
    return isValidBrowser;
}

/**
 * Track user inactivity with `lastActivityTimestamp` and log out the user after a period of inactivity.
 * Show a warning modal 20 minutes after the last user activity.
 * Log out the user 5 minutes after the warning if there's no response.
 * Reset the inactivity timer on user activity.
 */

export const inactivityTime = () => {
    const activityKey = 'lastMyConnectActivityTimestamp';
    const warningKey = 'myConnectInactivityWarning';
    const inactivityTimeout = 1200000; // 20 minutes (show inactivity warning after 20 minutes)
    const maxResponseTime = 300000;    // 5 minutes (additional time after warning)
    const checkInterval = 60000;       // 1 minute checks

    let responseTimeout;
    let modal;
    let isInactiveModalShown = false;
    let intervalId;
    let loadListener;

    const modalElement = document.getElementById('connectMainModal');
    if (!modalElement) return;

    // Update the global last activity timestamp in localStorage
    const updateLastActivity = () => {
        localStorage.setItem(activityKey, Date.now().toString());
    };

    // Reset the timer only if the modal is not shown. This represents user activity.
    const resetTimer = () => {
        if (!isInactiveModalShown) {
            updateLastActivity();
        }
    };

    const checkInactivity = () => {
        const lastActivity = parseInt(localStorage.getItem(activityKey), 10) || Date.now();
        const now = Date.now();

        const isWarningShownGlobally = localStorage.getItem(warningKey) === 'true';

        // Only show warning if none is currently shown globally (for management with multiple tabs open)
        // Ensure it's shown in the active tab if a tab is active.
        if (
            document.visibilityState === 'visible' &&
            document.hasFocus() &&
            !isInactiveModalShown &&
            !isWarningShownGlobally &&
            now - lastActivity > inactivityTimeout
        ) {
            showInactivityWarning();
        }
    };

    const hideModal = () => {
        if (modal) {
            modalElement.inert = true;
            modal.hide();
        }
        isInactiveModalShown = false;
    }

    const showModal = () => {
        if (modal) {
            modalElement.inert = false;
            modal.show();
        }
    }

    const cleanUpAndLogOut = async () => {
        clearTimeout(responseTimeout);
        clearInterval(intervalId);
        hideModal();
        detachDocumentEventListeners();

        localStorage.setItem(warningKey, 'false');

        await signOut();
    }

    const attachModalEventListeners = (modalElement) => {
        // Log out button
        const logOutButton = modalElement.querySelector('.log-out-user');
        if (logOutButton) {
            logOutButton.addEventListener('click', async () => {
                await cleanUpAndLogOut();
            });
        }

        // Continue session button
        const continueButton = modalElement.querySelector('.extend-user-session');
        if (continueButton) {
            continueButton.addEventListener('click', () => {
                clearTimeout(responseTimeout);

                // Reset activity on continue
                updateLastActivity();

                // Clear the warning state on continue click
                localStorage.setItem(warningKey, 'false');
                hideModal();
            });
        }

        // Return focus to the navbar when the modal is hidden
        modalElement.addEventListener('hidden.bs.modal', (event) => {
            if (event.target === modalElement) {
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    navbar.focus();
                }
            }
        });
    };

    const attachDocumentEventListeners = () => {
        const signOutButton = document.querySelector('#signOut');
        if (signOutButton) {
            signOutButton.addEventListener('click', async () => {
                await cleanUpAndLogOut();
            });
        }

        // Reset the inactivity timer on user activity
        document.addEventListener('mousemove', resetTimer);
        document.addEventListener('keydown', resetTimer);

        window.addEventListener('storage', handleLocalStorageStateChange);
    }

    const detachDocumentEventListeners = () => {
        document.removeEventListener('mousemove', resetTimer);
        document.removeEventListener('keydown', resetTimer);

        const signOutButton = document.querySelector('#signOut');
        if (signOutButton) {
            signOutButton.replaceWith(signOutButton.cloneNode(true));
        }

        window.removeEventListener('storage', handleLocalStorageStateChange);
    };

    const handleLocalStorageStateChange = (event) => {
        if (event.key === warningKey) {
            const warningState = localStorage.getItem(warningKey);
            if (warningState === 'false' && isInactiveModalShown) {
                // Another tab cleared the warning, hide modal if it's visible
                hideModal();
            }
        }

        if (event.key === activityKey) {
            const lastActivity = parseInt(localStorage.getItem(activityKey), 10) || Date.now();
            const now = Date.now();
            if ((now - lastActivity < inactivityTimeout) && isInactiveModalShown) {
                // The user became active again in another tab. Hide this modal and clear the warning
                hideModal();
                localStorage.setItem(warningKey, 'false');
            }
        }
    };

    // Show inactivity warning modal and start response timeout
    const showInactivityWarning = async () => {
        if (!firebase.auth().currentUser) return;

        // Set the global warning state so other tabs know not to show it
        localStorage.setItem(warningKey, 'true');

        isInactiveModalShown = true;

        responseTimeout = setTimeout(async () => {
            console.log("responseTimeout has been reached!");
            await cleanUpAndLogOut();
        }, maxResponseTime);

        modal = new bootstrap.Modal(modalElement);
        showModal();

        const header = document.getElementById('connectModalHeader');
        const body = document.getElementById('connectModalBody');
        const footer = document.getElementById('connectModalFooter');

        if (header && body && footer) {
            footer.style.display = 'none';
            header.innerHTML = `<h5 class="modal-title" data-i18n="shared.sessionInactiveTitle">${translateText('shared.sessionInactiveTitle')}</h5>`;
            body.innerHTML = `<span data-i18n="shared.sessionInactive">${translateText('shared.sessionInactive')}</span>`;
        }

        console.log("initial timeout has been reached!");
        attachModalEventListeners(modalElement);
    };

    // Start inactivity checks
    intervalId = setInterval(checkInactivity, checkInterval);

    // Update on initial load so we have a baseline timestamp
    if (!localStorage.getItem(activityKey)) {
        updateLastActivity();
    }

    // Reset the warning key on load
    localStorage.setItem(warningKey, 'false');

    // Handle window load event
    if (document.readyState !== 'complete') {
        loadListener = () => resetTimer();
        window.addEventListener('load', loadListener);
    }

    // Attach event listeners when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachDocumentEventListeners);
    } else {
        attachDocumentEventListeners();
    }

    // Cleanup function to stop checks and clear timeouts.
    return () => {
        if (intervalId) clearInterval(intervalId);
        if (responseTimeout) clearTimeout(responseTimeout);
        if (loadListener) window.removeEventListener('load', loadListener);
        detachDocumentEventListeners();
        hideModal();
        localStorage.setItem(warningKey, 'false');
    };
};

export const renderSyndicate = (url, element, page) => {
    const mainContent = document.getElementById(element);

    fetch(url)
        .then(response => response.body)
        .then(rb => {
            const reader = rb.getReader();

            return new ReadableStream({
                start(controller) {
                    // The following function handles each data chunk
                    function push() {
                        // "done" is a Boolean and value a "Uint8Array"
                        reader.read().then(({ done, value }) => {
                            // If there is no more data to read
                            if (done) {
                                controller.close();
                                return;
                            }
                            // Get the data and send it to the browser via the controller
                            controller.enqueue(value);
                            // Check chunks by logging to the console
                            push();
                        })
                    }

                    push();
                }
            });
        })
        .then(stream => {
            // Respond with our stream
            return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
        })
        .then(result => {
            // Do things with result
            let parsed = JSON.parse(result);
            mainContent.innerHTML = parsed.results[0].content;
            let toHide = document.getElementsByClassName('syndicate');
            toHide[1].style.display = "none"
            if (page == "expectations") {
                let ids = ['joining-connect', 'after-you-join', 'long-term-study-activities', 'what-connect-will-do', 'how-your-information-will-help-prevent-cancer']
                let sections = document.getElementsByTagName('section');
                for (let i = 0; i < sections.length; i++) {
                    let section = sections[i];
                    section.id = ids[i];
                }
            }
            if (page == "about") {
                let ids = ['why-connect-is-important', 'what-to-expect-if-you-decide-to-join', 'where-this-study-takes-place', 'about-our-researchers', 'a-resource-for-science']
                let sections = document.getElementsByTagName('section');
                for (let i = 0; i < sections.length; i++) {
                    let section = sections[i];
                    section.id = ids[i];
                }
            }
            let aLinks = document.getElementsByTagName('a');
            let allIds = ['#', '#about', '#expectations', '#privacy', 'joining-connect', 'after-you-join', 'long-term-study-activities', 'what-connect-will-do', 'how-your-information-will-help-prevent-cancer', 'why-connect-is-important', 'what-to-expect-if-you-decide-to-join', 'where-this-study-takes-place', 'about-our-researchers', 'a-resource-for-science']
            for (let i = 0; i < aLinks.length; i++) {
                let section = aLinks[i];
                let found = false;
                for (let j = 0; j < allIds.length; j++) {
                    if (section.href.includes(allIds[j])) {
                        found = true;
                    }
                }
                if (!found) {
                    section.target = "_blank";
                    console.log(section.href);
                }

            }
            hideAnimation();

        });
}

export function fragment(strings, ...values) {
    const N = values.length;
    const transformedStringList = [];
    const elementAndDocumentFragmentList = [];

    for (let i = 0; i < N; i++) {
        if (
            values[i] instanceof HTMLElement ||
            values[i] instanceof DocumentFragment
        ) {
            transformedStringList.push(strings[i], `<div id="placeholder"></div>`);
            elementAndDocumentFragmentList.push(values[i]);
        } else {
            transformedStringList.push(strings[i], values[i]);
        }
    }

    transformedStringList.push(strings[N]);
    const doc = new DOMParser().parseFromString(transformedStringList.join(""), "text/html");
    const documentFragment = new DocumentFragment();
    documentFragment.append(...doc.body.children);

    if (elementAndDocumentFragmentList.length > 0) {
        const phEleList = documentFragment.querySelectorAll("#placeholder");
        for (let i = 0; i < phEleList.length; i++) {
            phEleList[i].replaceWith(elementAndDocumentFragmentList[i]);
        }
    }

    return documentFragment;
}

export const delay = async (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const validEmailFormat = /^[a-zA-Z0-9.!#$%&'*+"\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/;

export const validNameFormat = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/i;

// valid phone number examples: +1 123-456-789, 1-123-456-7890, 123-456-7890, 1234567890, 123.456 7890, (123)456-7890, (123) 456-7890, 123 456.7890, 123 456-7890, 123-456.7890, etc.
export const validPhoneNumberFormat =
    /^[\+]?(?:1|1-|1\.|1\s+)?[(]?[0-9]{3}[)]?(?:-|\s+|\.)?[0-9]{3}(?:-|\s+|\.)?[0-9]{4}$/;

/**
 * Recover special characters in search string of URL
 * @param {string} urlSearchStr 
 * @returns {string}
 */
export function getCleanSearchString(urlSearchStr) {
    let prevStr = urlSearchStr;
    let currStr = decodeURIComponent(urlSearchStr);

    while (prevStr !== currStr) {
        prevStr = currStr;
        currStr = decodeURIComponent(currStr);
    }

    return currStr.replace(/&amp;/g, "&");
}

/**
 * Wait for an element to be loaded, with a default timeout.
 * @param {string} selector
 * @param {number} timeout
 * @returns {Promise<HTMLElement | null>} 
 */
export async function elementIsLoaded(selector, timeout = 1000) {
    const startTime = Date.now();

    while (document.querySelector(selector) === null) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (Date.now() - startTime > timeout) break;
    }

    return document.querySelector(selector);
}

/**
 * Check if current device is a mobile device (smartphone, tablet, or others with touch screen)
 * @returns {boolean}
 */
function checkDeviceMobile() {
    let isMobile = false;

    if ('maxTouchPoints' in navigator) {
        isMobile = navigator.maxTouchPoints > 0;
    } else if ('msMaxTouchPoints' in navigator) {
        isMobile = navigator.msMaxTouchPoints > 0;
    } else {
        const mediaQuery = matchMedia?.('(pointer:coarse)');
        if (mediaQuery?.media === '(pointer:coarse)') {
            isMobile = !!mediaQuery.matches;
        } else if ('orientation' in window) {
            isMobile = true;
        } else {
            isMobile = /Mobi|Android|Tablet|iPad|iPhone|iPod|webOS/i.test(
                navigator.userAgent
            );
        }
    }

    return isMobile;
}

export const isMobile = checkDeviceMobile();

let urlToNewTabMap = {};

/**
 * Open file in new tab
 * @param {string} url 
 */
export function openNewTab(url) {
    if (!urlToNewTabMap[url] || urlToNewTabMap[url].closed) {
        urlToNewTabMap[url] = window.open(url);
    } else {
        urlToNewTabMap[url].focus();
    }
}

export const usGov = `
You are accessing a U.S. Government web site which may contain information that must be protected under the U.S. Privacy Act or other sensitive information and is intended for Government authorized use only. Unauthorized attempts to upload information, change information, or use of this web site may result in disciplinary action, civil, and/or criminal penalties. Unauthorized users of this web site should have no expectation of privacy regarding any communications or data processed by this web site. Anyone accessing this web site expressly consents to monitoring of their actions and all communication or data transitioning or stored on or related to this web site and is advised that if such monitoring reveals possible evidence of criminal activity, NIH may provide that evidence to law enforcement officials.
`;

export const firebaseSignInRender = async ({ account = {}, displayFlag = true }) => {
    const df = fragment`
    <div class="mx-4">
      <p class="loginTitleFont" style="text-align:center;" data-i18n="shared.signIn">Sign In</p>
      <div id="signInDiv"></div>
      <div style="font-size:8px" class="mt-3" ${displayFlag ? 'data-i18n="shared.usGov"' : ''}>
      </div>
    </div>`;

    translateHTML(df.children[0]);

    const wrapperDiv = document.getElementById("signInWrapperDiv");
    wrapperDiv.replaceChildren(df);
    wrapperDiv.setAttribute('data-ui-type', 'signIn');
    wrapperDiv.setAttribute('data-account-type', account.type);
    if (account.value) {
        wrapperDiv.setAttribute('data-account-value', account.value);
    } else {
        wrapperDiv.removeAttribute('data-account-value');
    }
    let ui = await getFirebaseUI();
    ui.start("#signInDiv", signInConfig(account.type));

    if (account.type === "email") {

        document.querySelector('input[class~="firebaseui-id-email"]').value = account.value;
        document.querySelector('label[class~="firebaseui-label"]').remove();

        const submitButton = document.querySelector('button[class~="firebaseui-id-submit"]');
        submitButton.addEventListener('click', (e) => e.preventDefault());
        submitButton.click();

    } else if (account.type === "phone") {
        document.querySelector('input[class~="firebaseui-id-phone-number"]').value = account.value;
        document.querySelector('label[class~="firebaseui-label"]').remove();
        document.querySelector('h1[class~="firebaseui-title"]').innerText = translateText('shared.signInPhone');
        document.querySelector('h1[class~="firebaseui-title"]').setAttribute('data-i18n', 'shared.signInPhone');
    }
};

/**
 *  Sign in anonymously, and set idToken in appState
 * @returns {Promise<firebase.User>}
 */
export const signInAnonymously = async () => {
    const { user } = await firebase.auth().signInAnonymously();

    if (user) {
        const idToken = await user.getIdToken();
        appState.setState({ idToken });
    }

    return user;
}

export const processAuthWithFirebaseAdmin = async (newAuthData) => {

    const authenticationDataPayload = {
        "data": newAuthData
    }

    const idToken = await getIdToken();

    try {
        const response = await fetch(`${api}?api=updateParticipantFirebaseAuthentication`, {
            method: 'POST',
            body: JSON.stringify(authenticationDataPayload),
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            }
        });

        return await response.json();
    } catch (error) {
        console.error('An error occurred in processAuthWithFirebaseAdmin():', error);
        return { message: error.message, status: 'error' };
    }
};

const isIsoDate = (str) => {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    const d = new Date(str);
    return d instanceof Date && !isNaN(d) && d.toISOString() === str; // valid date
};

export const isParticipantDataDestroyed = (data) => {
    if (!data) return
    const millisecondsWait = 5184000000; // 60days
    const timeDiff = data.hasOwnProperty(fieldMapping.dateRequestedDataDestroy) && isIsoDate(data[fieldMapping.dateRequestedDataDestroy])
        ? new Date().getTime() -
        new Date(data[fieldMapping.dateRequestedDataDestroy]).getTime()
        : 0;
    return (
        (data.hasOwnProperty(fieldMapping.dataDestroyCategorical) &&
            data[fieldMapping.dataDestroyCategorical] ===
            fieldMapping.requestedDataDestroySigned) ||
        timeDiff > millisecondsWait
    );
};

/**
 * Generic function to fetch data with retry & backoff.
 * @param {function} fetchFunction - function to fetch data.
 * @param {number} maxRetries - maximum number of retries.
 * @param {number} retryInterval - interval between retries.
 * @param {number} backoffFactor - for exponential backoff.
 */
export const fetchDataWithRetry = async (fetchFunction, maxRetries = 5, retryInterval = 250, backoffFactor = 2) => {
    let fetchAttempt = 0;

    while (fetchAttempt < maxRetries) {
        try {
            return await fetchFunction();
        } catch (e) {
            fetchAttempt++;
            if (fetchAttempt < maxRetries) {
                console.error(`Error fetching data, attempt ${fetchAttempt}: ${e.message}`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
                retryInterval *= backoffFactor;
            } else {
                throw e;
            }
        }
    }
};

/**
 * Fetch module sha from GitHub.
 * @param {string} path - Path to the module file in the GitHub repository.
 * @param {string} connectID - Connect ID of the logged in participant.
 * @param {string} moduleID - Module ID of the module the participant is accessing.
 * @returns {string} - sha value.
 */
export const getModuleSHA = async (path, connectID, moduleID) => {
    let sha;

    try {
        const idToken = await getIdToken();
        const encodedPath = encodeURIComponent(path);
        const response = await fetch(`${api}?api=getModuleSHA&path=${encodedPath}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + idToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with: ${response.status}`);
        }

        const jsonResponse = await response.json();
        sha = jsonResponse.data;

        if (jsonResponse.code === 200 && sha) {
            return sha;
        } else {
            throw new Error('Failed to retrieve SHA', jsonResponse.message);
        }
    } catch (error) {
        logDDRumError(new Error(`SHA Fetch Error: + ${error.message}`), 'StartModuleError', {
            userAction: 'click start survey',
            timestamp: new Date().toISOString(),
            connectID: connectID,
            questionnaire: moduleID,
            fetchedSHA: sha || 'Failed to fetch SHA',
        });

        throw new Error('Error: getModuleSHA():', error);
    }
};

/**
 * Determine module sha from GitHub commit history on the module's file (compare startSurveyTimestamp with commit history timestamps).
 * @param {string} surveyStartTimestamp - Timestamp of when the participant started the survey module.
 * @param {string} path - Path to the module file in the GitHub repository.
 * @param {string} connectID - Connect ID of the logged in participant.
 * @param {string} moduleID - Module ID of the module the participant is accessing.
 * @returns {string} - sha value.
 */
export const getShaFromGitHubCommitData = async (surveyStartTimestamp, path, connectID, moduleID) => {
    let sha;
    let surveyVersion;

    try {
        const idToken = await getIdToken();
        const encodedPath = encodeURIComponent(path);
        const encodedTimestamp = encodeURIComponent(surveyStartTimestamp);
        const response = await fetch(`${api}?api=getSHAFromGitHubCommitData&path=${encodedPath}&surveyStartTimestamp=${encodedTimestamp}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + idToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with: ${response.status}`);
        }

        const jsonResponse = await response.json();
        sha = jsonResponse.data.sha;
        surveyVersion = jsonResponse.data.surveyVersion || '1.0';

        if (jsonResponse.code === 200 && sha) {
            return [sha, surveyVersion];
        } else {
            throw new Error('Failed to retrieve SHA based on surveyStartTimestamp ' + jsonResponse.message);
        }
    } catch (error) {
        logDDRumError(new Error(`SHA Retrieval Error (fetch by timestamp): + ${error.message}`), 'StartModuleError', {
            userAction: 'click start survey',
            timestamp: new Date().toISOString(),
            connectID: connectID,
            startSurveyTimestamp: surveyStartTimestamp,
            questionnaire: moduleID,
            fetchedSHA: sha || 'Failed to fetch SHA by timestamp',
            fetchedVersion: surveyVersion || 'Failed to fetch version by timestamp',
        });

        throw new Error('Error: getShaFromGitHubCommitData. ' + error.message);
    }
};

/**
 * Update participant and survey data when the participant starts a survey module.
 * Also used to repair the SHA value when the participant continues a survey and the SHA value is missing.
 * @param {string} sha - SHA value of the module file.
 * @param {string} path - Path to the module file in the GitHub repository.
 * @param {string} connectId - Connect ID of the logged in participant.
 * @param {string} moduleId - Module ID of the module the participant is accessing.
 * @param {string} repairShaVersionString - Version string to use when repairing the SHA value (fetched from GitHub raw API).
 * @param {Boolean} repairShaValue - Flag to indicate if the SHA is being repaired (retain the original survey start timestamp when true).
 * @returns {string} - Module text for Quest.
 */
export const updateStartSurveyParticipantData = async (sha, path, connectId, moduleId, repairShaVersionString, repairShaValue = false) => {

    try {
        const { moduleText, surveyVersion } = await fetchDataWithRetry(() => getModuleText(sha, path, connectId, moduleId));

        // If the SHA value is being repaired (rare case), sanity check the version string.
        if (repairShaValue && repairShaVersionString !== surveyVersion) {
            console.error('updateStartSurveyParticipantData', 'SHA repair failed. Version mismatch:', repairShaVersionString, surveyVersion);
            throw new Error('SHA repair failed in updateStartSurveyParticipantData. Version mismatch:', repairShaVersionString, surveyVersion);
        }

        let questData = {};
        let formData = {};

        questData[fieldMapping[moduleId].conceptId + ".sha"] = sha;
        questData[fieldMapping[moduleId].conceptId + "." + fieldMapping[moduleId].version] = surveyVersion;
        questData[fieldMapping[moduleId].conceptId + "." + fieldMapping.surveyLanguage] = getSelectedLanguage();

        // Do not update startTs if the sha is being repaired. Retain the original startTs, which coincides with the fetched survey.
        if (!repairShaValue) formData[fieldMapping[moduleId].startTs] = new Date().toISOString();
        formData[fieldMapping[moduleId].statusFlag] = fieldMapping.moduleStatus.started;

        // TODO: turn this into a single call or a transaction to ensure db consistency.
        // Caution on refactor: both calls are complex. Both transform the data objects.
        await storeResponseQuest(questData);
        await storeResponse(formData);

        return moduleText;
    } catch (error) {
        throw new Error('Error: updateStartSurveyParticipantData():', error);
    }
}

/**
 * Fetch module text and version number from GitHub.
 * @param {string} sha - SHA value of the module file.
 * @param {string} path - Path to the module file in the GitHub repository.
 * @param {string} connectID - Connect ID of the logged in participant.
 * @param {string} moduleID - Module ID of the module the participant is accessing.
 * @returns {Promise<{moduleText: string, surveyVersion: string}>} Module text and version number.
 */
export const getModuleText = async (sha, path, connectID, moduleID) => {
    try {
        const idToken = await getIdToken();
        const encodedSHA = encodeURIComponent(sha);
        const encodedPath = encodeURIComponent(path);
        const response = await fetch(`${api}?api=getQuestSurveyFromGitHub&path=${encodedPath}&sha=${encodedSHA}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + idToken,
            },
        });

        const jsonResponse = await response.json();

        if (jsonResponse.code === 200) {
            return jsonResponse.data;
        } else {
            throw new Error('Failed to retrieve Module text', jsonResponse.message);
        }
    } catch (error) {
        logDDRumError(new Error(`Module Text Fetch Error: + ${error.message}`), 'GetModuleTextError', {
            userAction: 'click start survey',
            timestamp: new Date().toISOString(),
            connectID: connectID,
            questionnaire: moduleID,
            sha: sha || 'Unknown SHA',
            path: path || 'Unknown path',
        });

        throw new Error('Error: getModuleText():', error);
    }
}

/**
 * Get the participant's started/completed status from the DHQ3 API.
 * @param {string} studyID - The study ID for the DHQ3 survey.
 * @param {string} respondentUsername - The DHQ3 username of the respondent.
 * @param {string} dhqSurveyStatus - The status of the participant's DHQ3 survey in Firestore.
 * @param {string} dhqSurveyStatusExternal - The status of the participant's DHQ3 survey in the DHQ system (will lag at times).
 * @returns {Promise<Object>} - The DHQ3 respondent info from the API.
 */

export const syncDHQ3RespondentInfo = async (studyID, respondentUsername, dhqSurveyStatus, dhqSurveyStatusExternal) => {
    if (!studyID || !respondentUsername) {
        throw new Error('syncDHQ3RespondentInfo: Missing required parameters');
    }

    try {
        const url = `${api}?api=syncDHQ3RespondentInfo`;
        const idToken = await getIdToken();
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken,
            },
            body: JSON.stringify({ studyID, respondentUsername, dhqSurveyStatus, dhqSurveyStatusExternal }),
        });

        const jsonResponse = await response.json();

        if (jsonResponse.code !== 200) {
            throw new Error(`Failed to check DHQ3 status: ${jsonResponse.message}`);
        }

        return jsonResponse.data;

    } catch (error) {
        logDDRumError(new Error(`Sync DHQ3 Respondent Info Error: + ${error.message}`), 'syncDHQ3RespondentInfoError', {
            userAction: 'sync DHQ3 Respondent Info',
            timestamp: new Date().toISOString(),
        });

        throw new Error(`Error: syncDHQ3RespondentInfo(): ${error.message}`);
    }
}

/**
 * Atomically allocate a DHQ3 credential from the available credential pools.
 * This also sets the survey's started flag and timestamp in the Firestore profile.
 * @param {Array<string>} availableCredentialPools - Array of available credential pools to allocate from (Firestore appSettings collection).
 * @returns {Promise<Object>} - The participant's DHQ3 credential data.
 */

export const allocateDHQ3Credential = async (availableCredentialPools) => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${api}?api=allocateDHQ3Credential`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken,
            },
            body: JSON.stringify(availableCredentialPools),
        });

        const jsonResponse = await response.json();
        if (jsonResponse.code === 200) {
            return jsonResponse.data;
        } else {
            throw new Error('Failed to retrieve DHQ Credential', jsonResponse.message);
        }
    } catch (error) {
        logDDRumError(new Error(`Get DHQ Credential Error: + ${error.message}`), 'getDHQCredentialError', {
            userAction: 'fetch DHQ Credential',
            timestamp: new Date().toISOString(),
        });

        throw new Error(`Error: getDHQCredential(): ${error.message}`);
    }
}

/**
 * Update participant data when the participant starts the DHQ module.
 * @returns {Promise<Object>} - Response from the storeResponse function.
 */

export const updateStartDHQParticipantData = async () => {
    try {
        const formData = {
            [fieldMapping.DHQ3.startTs]: new Date().toISOString(),
            [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.started,
        };

        return await storeResponse(formData);

    } catch (error) {
        const combinedError = new Error(`Error: updateStartDHQParticipantData(): ${error.message}`);
        combinedError.stack = `${combinedError.stack}\nCaused by: ${error.stack}`;
        throw combinedError;
    }
}

/**
 * Force-Log detailed error to Datadog RUM (and console).
 * @param {Error} error - The error object to log.
 * @param {string} errorType - Categorize the type of the error for datadog.
 * @param {Object} additionalContext - Optional. Additional context to include with the error. Example: { userAction: 'click', timestamp: new Date().toISOString(), connectID: '1234567890' }
 */
export const logDDRumError = (error, errorType = 'CustomError', additionalContext = {}) => {

    console.error(`${errorType}: ${error.message}. Additional context: ${JSON.stringify(additionalContext, null, 2)}`);

    if (window.DD_RUM) {
        window.DD_RUM.addError(
            error.message || 'An error occurred',
            {
                error: {
                    stack: error.stack,
                    ...additionalContext,
                }
            },
            errorType,
        );
    }
};

export const translateHTML = (source, language) => {
    if (!language) {
        language = appState.getState().language;
        if (!language) {
            language = 'en';
        } else {
            language = languageAcronyms()[language];
        }
    }

    let sourceElement;
    if (typeof source === "string") {
        const sourceDOM = new DocumentFragment;
        sourceDOM.append(document.createElement('div'));
        sourceElement = sourceDOM.children[0];
        sourceElement.innerHTML = source;
    } else {
        sourceElement = source;
    }

    if (sourceElement.dataset.i18n) {
        let keys = sourceElement.dataset.i18n.split('.');
        let translation;
        if (keys.length === 1 && keys[0] === 'date' && sourceElement.dataset.timestamp) {
            let options;
            if (sourceElement.dataset.dateOptions) {
                try {
                    options = JSON.parse(decodeURIComponent(sourceElement.dataset.dateOptions));
                } catch (error) {
                    console.error(error);
                }
            }
            translation = translateDate(sourceElement.dataset.timestamp, language, options);
        } else {
            translation = translateText(keys, language);
        }
        if (translation) {
            if (typeof translation === 'object') {
                Object.keys(translation).forEach((key) => {
                    if (key === 'innerHTML') {
                        sourceElement.innerHTML = translation[key];
                    } else if (key === 'innerText') {
                        sourceElement.innerText = translation[key];
                    } else {
                        sourceElement.setAttribute(key, translation[key]);
                    }
                });
            } else {
                sourceElement.innerHTML = translation ? translation : '';
            }
        }
    } else {
        const translationNodes = sourceElement.querySelectorAll("[data-i18n]");
        translationNodes.forEach(node => {
            translateHTML(node, language);
        })
    }

    if (typeof source === "string") {
        return sourceElement.innerHTML;
    } else {
        return sourceElement;
    }
}

/**
 * Returns a formatted Date based on the language and options
 * 
 * @param {string} timestamp
 * @param {string} language
 * @param {Object} options - Same as Intl.DateTimeFormat() constructor
 */
export const translateDate = (timestamp, language, options) => {
    if (!language) {
        language = appState.getState().language;
        if (!language) {
            language = 'en';
        } else {
            language = languageAcronyms()[language];
        }
    }

    let date;
    if (typeof timestamp === 'string' && /^[0-9]+$/.test(timestamp)) {
        date = new Date(parseInt(timestamp, 10));
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        date = new Date(Date.parse(timestamp));
    }
    return date.toLocaleDateString(language, options);
}

/**
 * Returns the translation for a given language or the fall back language of english
 * 
 * @param {String[]} keys 
 * @param {String} language 
 * @param {int} keyIndex 
 * @param {Object} translationObj 
 * @returns String
 */
export const translateText = (keys, language, keyIndex, translationObj) => {
    if (!language) {
        language = appState.getState().language;
        if (!language) {
            language = 'en';
        } else {
            language = languageAcronyms()[language];
        }
    }
    if (typeof keys === 'string') {
        keys = keys.split('.');
    }

    if (!keyIndex) {
        keyIndex = 0;
    }

    if (!translationObj) {
        //Fallback to english if the language doesn't exist
        translationObj = i18n[language] ? i18n[language] : i18n['en'];
    }
    if ((keyIndex + 1) === keys.length) {
        if (!translationObj[keys[keyIndex]]) {
            if (language !== 'en') {
                //If the languange is not English then return english as the fallback
                return translateText(keys, 'en');
            } else {
                return null;
            }
        } else {
            return translationObj[keys[keyIndex]];
        }
    } else {
        if (translationObj[keys[keyIndex]]) {
            let nextIndexKey = keyIndex + 1;
            return translateText(keys, language, nextIndexKey, translationObj[keys[keyIndex]]);
        } else {
            if (language !== 'en') {
                //If the language is not english then return english as the fallback
                return translateText(keys, 'en');
            } else {
                //IF the langauge is already english then retun null because there is no matching translation  
                return null;
            }
        }
    }
}

export const languageAcronyms = () => {
    return {
        [fieldMapping.language.en]: 'en',
        [fieldMapping.language.es]: 'es'
    }

}

export const languageSuffix = () => {
    return {
        [fieldMapping.language.en]: '',
        [fieldMapping.language.es]: 'Span'
    }

}

export const languageTranslations = () => {
    return {
        [fieldMapping.language.en]: 'languageSelector.englishOption',
        [fieldMapping.language.es]: 'languageSelector.spanishOption'
    }
}

export const getSelectedLanguage = () => {
    let selectedLanguage = appState.getState().language;
    if (!selectedLanguage) {
        selectedLanguage = fieldMapping.language.en;
    }

    return selectedLanguage;
}

/**
 * Get the custom settings for ConnectApp. Initial use: Quest versioning. See loadQuestConfig().
 * @param {Array<string>} paramsToFetchArray - Array of parameters to fetch. E.g. ['param1', 'param2', 'param3'].
 * @returns {Object} - App settings object.
 */
export const getAppSettings = async (paramsToFetchArray) => {
    const queryParams = `&selectedParamsArray=${encodeURIComponent(paramsToFetchArray.map(param => param.trim()).join(','))}`;
    const url = `${api}?api=getAppSettings${queryParams}`;

    try {
        const idToken = await getIdToken();
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + idToken,
            },
        });

        const jsonResponse = await response.json();

        if (jsonResponse.code !== 200) {
            throw new Error(`Failed to retrieve app settings: ${jsonResponse.message}`);
        }

        return jsonResponse.data;

    } catch (error) {
        throw new Error(`Error: getAppSettings(): ${error.message || error}`);
    }
}

let firebaseLoaded = false;

export const getFirebaseUI = async () => {
    let lang = languageAcronyms()[getSelectedLanguage()];
    let scriptTag = document.getElementById('firebaseui-script');
    //If we have a script tag but it is for the wrong language then we need to 
    //tear down the existing UI and reload the new one
    if (scriptTag && scriptTag.dataset.i18n !== lang) {
        let ui = firebaseui.auth.AuthUI.getInstance();
        if (ui) {
            ui.delete();
        }
        scriptTag.parentNode.removeChild(scriptTag);
        scriptTag = null;

    }

    //If the scriptTag is falsey then load it
    if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.src = 'https://www.gstatic.com/firebasejs/ui/6.1.0/firebase-ui-auth__' + lang + '.js';
        scriptTag.async = true;
        scriptTag.id = 'firebaseui-script';
        scriptTag.setAttribute('data-i18n', lang);
        document.body.appendChild(scriptTag);

        await new Promise((resolve, reject) => {
            scriptTag.addEventListener('load', () => {
                firebaseLoaded = true;
                firebaseui.lang = lang;
                resolve(true);
            });
            scriptTag.addEventListener('error', (event) => {
                reject(new Error('Error loading FirebaseUI script from ' + event.target.getAttribute('src')));
            });
        });
        return firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
    } else {
        if (firebaseLoaded) {
            return firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
        } else {
            try {
                await new Promise((resolve, reject) => {
                    scriptTag.addEventListener('load', () => {
                        firebaseLoaded = true;
                        resolve(true);
                    });
                    scriptTag.addEventListener('error', (event) => {
                        reject(new Error('Error loading FirebaseUI script from ' + event.target.getAttribute('src')));
                    });
                });
                return firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
            } catch (e) {
                console.error('Error Loading FirebaseUI', e);
                return null;
            }
        }
    }
}

export const emailAddressValidation = async (data) => {
    const idToken = appState.getState().idToken || await getIdToken();

    const response = await fetch(`${api}?api=emailAddressValidation`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + idToken
        },
        body: JSON.stringify(data)
    });

    const jsonResponse = await response.json();
    return jsonResponse;
}

const summarizeAddressValidationPayload = (payload = {}) => {
    if (!payload || typeof payload !== "object") {
        return { hasPayload: !!payload, payloadType: typeof payload };
    }

    const streetAddress = payload.streetAddress?.toString().trim() || "";
    const secondaryAddress = payload.secondaryAddress?.toString().trim() || "";
    const city = payload.city?.toString().trim() || "";
    const state = payload.state?.toString().trim() || "";
    const zip = payload.zipCode?.toString().trim() || "";

    return {
        hasStreetAddress: !!streetAddress,
        streetAddressLength: streetAddress.length,
        hasSecondaryAddress: !!secondaryAddress,
        secondaryAddressLength: secondaryAddress.length,
        hasCity: !!city,
        cityLength: city.length,
        hasState: !!state,
        stateLength: state.length,
        hasZip: !!zip,
        zipLength: zip.length,
    };
};

export const addressValidation = async (data) => {
    const idToken = appState.getState().idToken || await getIdToken();
    
    // To test different response scenarios (from tests/usps.spec.js) until automated testing is implemented:
    // import { USPS_TEST_RESPONSES } from '../tests/usps.spec.js';
    // return USPS_TEST_RESPONSES?.__METHOD_NAME__
    // METHOD_NAME options: success, successWithCorrections, successWithSecondaryAddress, invalidAddress, invalidZipCode, invalidCity, multipleErrors,
    // addressNotFound, multipleAddresses, missingSecondaryAddress, vacantAddress, businessAddress, dpvConfirmationFailed, serverError, networkError.
    // Example: return USPS_TEST_RESPONSES?.success; ... return USPS_TEST_RESPONSES?.successWithSecondaryAddress;

    try {
        const response = await fetch(`${api}?api=addressValidation`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken
            },
            body: JSON.stringify(data)
        });

        const status = response.status;
        let jsonResponse = null;
        try {
            jsonResponse = await response.json();
        } catch (jsonErr) {
            console.error('addressValidation: failed to parse JSON', jsonErr);
            logDDRumError(jsonErr, 'AddressValidationParseError', {
                status,
                ...summarizeAddressValidationPayload(data),
            });
            return {
                error: {
                    status,
                    message: 'Invalid response from USPS'
                }
            };
        }

        if (!response.ok) {
            console.error('addressValidation: non-OK response', status, jsonResponse);
            if (status === 0 || status >= 500) {
                const error = new Error(`addressValidation non-OK response (${status})`);
                logDDRumError(error, 'AddressValidationError', {
                    status,
                    ...summarizeAddressValidationPayload(data),
                });
            }
            return jsonResponse.error
                ? jsonResponse
                : {
                      error: {
                          status,
                          message: jsonResponse?.message || 'USPS request failed'
                      }
                  };
        }

        return jsonResponse;

    } catch (err) {
        console.error('addressValidation: fetch failed', err);
        logDDRumError(err, 'AddressValidationFetchError', {
            status: err?.status || 0,
            ...summarizeAddressValidationPayload(data),
        });
        return {
            error: {
                status: err?.status || 0,
                message: err?.message || 'Network Error'
            }
        };
    }
}

/**
 * Derive deliverability warnings from USPS validation response metadata.
 * This provides signals used to compute "USPS validated" flags and display warnings.
 * Note: Retained for future use, but USPS DPV/Vacant/Business address validation is currently ignored (Jan 2026 release).
 *
 * @param {Object} additionalInfo - USPS additionalInfo object
 * @param {Array<{code: string, text: string}>} matches - USPS matches array
 * @returns {Array<{code: string, text: string}>}
 */

export const getUSPSDeliverabilityWarnings = (additionalInfo = {}, matches = []) => {
    // Return early. Decision was made to ignore USPS DPV/Vacant/Business address validation. Remove this return statement to enable additional verification detail (Jan 2026 release).
    return [];

    // Additional verification detail provided by USPS is currently ignored.
    const warnings = [];

    const dpv = additionalInfo?.DPVConfirmation;
    
    // DPVConfirmation: 'Y' indicates USPS confirmed deliverability.
    if (dpv && dpv.toUpperCase() !== 'Y') {
        warnings.push({ code: 'DPV', text: 'USPS could not confirm delivery' });
    }

    const matchCode = matches?.[0]?.code;
    if (matchCode === '32') {
        warnings.push({ code: 'MULTIPLE', text: 'Multiple responses found' });
    } else if (matchCode === '33') {
        warnings.push({ code: 'MISSING_SECONDARY', text: 'Missing apartment or suite number' });
    } else if (matchCode === '34') {
        warnings.push({ code: 'NOT_CONFIRMED', text: 'Address found but not confirmed' });
    }

    if (additionalInfo?.vacant === 'Y') {
        warnings.push({ code: 'VACANT', text: 'USPS marks this address as vacant' });
    }

    if (additionalInfo?.business === 'Y') {
        warnings.push({ code: 'BUSINESS', text: 'Business address' });
    }

    return warnings;
};

/**
 * USPS address validation "success" logic used by Sign-up, My Profile, and Samples flows.
 * Given the user's entered address and the USPS address validation response, decide:
 * - whether we should show a suggestion modal (original vs suggestion)
 * - what warnings (if any) to carry forward
 * - whether the address is considered validated by USPS without user intervention
 *
 * Note: If a suggestion is returned, the final `isValidatedByUSPS` must be decided by
 * the UI choice (keep original => false, use suggested => warnings.length === 0).
 */
export const analyzeUSPSAddressSuggestion = ({ streetAddress, secondaryAddress = "", city, state, zipCode, uspsAddress, matches = [], additionalInfo = {} }) => {
    const warnings = getUSPSDeliverabilityWarnings(additionalInfo, matches);

    const directionalMap = {
        n: "n",
        north: "n",
        s: "s",
        south: "s",
        e: "e",
        east: "e",
        w: "w",
        west: "w",
        ne: "ne",
        northeast: "ne",
        nw: "nw",
        northwest: "nw",
        se: "se",
        southeast: "se",
        sw: "sw",
        southwest: "sw",
    };

    const streetTypeMap = {
        street: "st",
        st: "st",
        road: "rd",
        rd: "rd",
        avenue: "ave",
        ave: "ave",
        boulevard: "blvd",
        blvd: "blvd",
        drive: "dr",
        dr: "dr",
        lane: "ln",
        ln: "ln",
        court: "ct",
        ct: "ct",
        circle: "cir",
        cir: "cir",
        place: "pl",
        pl: "pl",
        parkway: "pkwy",
        pkwy: "pkwy",
        highway: "hwy",
        hwy: "hwy",
        terrace: "ter",
        ter: "ter",
        trail: "trl",
        trl: "trl",
        way: "way",
        alley: "aly",
        aly: "aly",
        square: "sq",
        sq: "sq",
        center: "ctr",
        ctr: "ctr",
        expressway: "expy",
        expy: "expy",
        junction: "jct",
        jct: "jct",
        mountain: "mtn",
        mtn: "mtn",
        plaza: "plz",
        plz: "plz",
        route: "rte",
        rte: "rte",
        apartment: "apt",
        apt: "apt",
        suite: "ste",
        ste: "ste",
        unit: "unit",
    };

    const normalizeTokens = (v) =>
        (v || "")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[.,]/g, "")
            .replace(/\s+/g, " ")
            .split(" ")
            .filter(Boolean)
            .map((token) => directionalMap[token] || streetTypeMap[token] || token);

    const normalizeStreetText = (v) => normalizeTokens(v).join(" ");

    const normalizeCityText = (v) =>
        (v || "")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[.,]/g, "")
            .replace(/\s+/g, " ");

    const normalizeZip5 = (v) => (v || "").toString().replace(/\D/g, "").slice(0, 5);

    const inputStateAbbr = statesWithAbbreviations[state] || state;
    const hasMatchCode = Array.isArray(matches) && matches.length > 0;
    const uspsSaysExactMatch = matches?.[0]?.code === "31"; // "31" indicates an exact match.

    const normalizedMatches =
        normalizeStreetText(streetAddress) === normalizeStreetText(uspsAddress?.streetAddress) &&
        normalizeStreetText(secondaryAddress) === normalizeStreetText(uspsAddress?.secondaryAddress) &&
        normalizeCityText(city) === normalizeCityText(uspsAddress?.city) &&
        normalizeCityText(inputStateAbbr) === normalizeCityText(uspsAddress?.state) &&
        normalizeZip5(zipCode) === normalizeZip5(uspsAddress?.ZIPCode);

    // Only accept USPS "exact match" if our normalized comparison agrees. USPS code "31" (match) lacks precision.
    const isExactMatch = normalizedMatches && (!hasMatchCode || uspsSaysExactMatch);

    const suggestion = isExactMatch
        ? undefined
        : {
              ...uspsAddress,
              state: swapKeysAndValues(statesWithAbbreviations)[uspsAddress?.state] || uspsAddress?.state,
              zipCode: uspsAddress?.ZIPCode,
          };

    const original = suggestion
        ? {
              streetAddress,
              secondaryAddress,
              city,
              state,
              zipCode,
          }
        : undefined;

    // "Validated by USPS" is only true when USPS confirmed deliverability and the entered address is an exact match (no suggestion needed).
    // Otherwise, the final value depends on the user's choice in the UI modal.
    const isValidatedByUSPS = warnings.length === 0 && !suggestion;

    return {
        warnings,
        original,
        suggestion,
        isValidatedByUSPS,
        isExactMatch,
    };
};

// USPS "unvalidated" flags are inverted relative to isValidatedByUSPS. This was a data dictionary decision.
export const getUSPSUnvalidatedValue = (isValidatedByUSPS, yesValue, noValue) =>
    isValidatedByUSPS ? noValue : yesValue;

/**
 * Map USPS address validation errors to UI field targets and i18n keys.
 * - 010001: Address Not Found
 * - 010002: Invalid ZIP Code
 * - 010003: Invalid State
 * - 010004: Invalid City
 * - 010005: Invalid Address
 *
 * @param {Array<{code, text}>} errors
 * @param {{addr1Id, cityId, stateId, zipId}} ids
 * @returns {{targets: Array<{id, i18nKey}>, handled: boolean}}
 */
export const mapUSPSErrorsToFieldTargets = (errors = [], ids) => {
    const targets = [];

    // Add a target (prevent duplicate errors on the same field).
    const pushUniqueTarget = (id, i18nKey) => {
        if (!id) return;
        // de-dupe by id+i18nKey
        if (!targets.some((t) => t.id === id && t.i18nKey === i18nKey)) {
            targets.push({ id, i18nKey });
        }
    };

    let handled = false;
    errors.forEach((item) => {
        const code = item?.code;

        if (code === "010005" || code === "010001") {
            handled = true;
            pushUniqueTarget(ids.addr1Id, "event.invalidAddress");

        } else if (code === "010002") {

            handled = true;
            pushUniqueTarget(ids.zipId, "event.invalidZip");

        } else if (code === "010004") {
            handled = true;
            pushUniqueTarget(ids.cityId, "event.invalidCity");

        } else if (code === "010003") {
            handled = true;
            pushUniqueTarget(ids.stateId, "event.invalidAddress");
        }
    });

    return { targets, handled };
};

/**
 * Apply USPS field errors to the UI using the standard `errorMessage()`.
 * Returns whether we focused an element (focus was true and at least one error target existed).
 *
 * @param {Array<{id, i18nKey}>} targets
 * @param {boolean} focus
 * @returns {boolean} nextFocus
 */
export const applyUSPSFieldErrors = (targets = [], focus = true) => {
    let nextFocus = focus;
    targets.forEach((t) => {
        const translated = escapeHTML(translateText(t.i18nKey));
        const msg = `<span data-i18n="${t.i18nKey}">${translated}</span>`;
        errorMessage(t.id, msg, nextFocus);
        if (nextFocus) nextFocus = false;
    });
    return nextFocus;
};

export const requestHomeKit = async (participant) => {
    const idToken = await getIdToken();

    const res = await fetch(`${api}?api=requestHomeKit`, {
            method: 'POST',
            headers:{
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({connectId: participant.Connect_ID})
        });
    const resJSON = await res.json();
    return resJSON;
}

/**
 * Create a new Date object with adjusted time
 * @param {number | string | Date} inputTime - Input time to adjust
 * @param {number} [days = 0] - Number of days to adjust
 * @param {number} [hours = 0] - Number of hours to adjust
 * @param {number} [minutes = 0] - Number of minutes to adjust
 * @returns {Date} Adjusted time
 */
export const getAdjustedTime = (inputTime, days = 0, hours = 0, minutes = 0) => {
    let adjustedTime = new Date(inputTime);
    adjustedTime.setDate(adjustedTime.getDate() + days);
    adjustedTime.setHours(adjustedTime.getHours() + hours);
    adjustedTime.setMinutes(adjustedTime.getMinutes() + minutes);

    return adjustedTime;
};


export const emailValidationStatus = {
    VALID: "Valid",
    INVALID: "Invalid",
    WARNING: "Warning",
};

export const emailValidationAnalysis = (validation) => {
    if (!validation) return;

    const { verdict, checks, score } = validation;
    const { INVALID, VALID, WARNING } = emailValidationStatus;

    const isInvalid =
        verdict === INVALID ||
        !checks.domain.has_valid_address_syntax ||
        !checks.domain.has_mx_or_a_record ||
        score < 0.01;

    if (isInvalid) {
        // it's for testing with the test email such as *.mailinator
        if (location.host !== urls.prod) {
            console.error("Invalid Email", validation);
            return VALID;
        }
        return INVALID;
    }

    const isWarning =
        checks.domain.is_suspected_disposable_address ||
        checks.local_part.is_suspected_role_address ||
        checks.additional.has_known_bounces ||
        checks.additional.has_suspected_bounces ||
        score < 0.8;

    if (isWarning) return WARNING;

    return VALID;
};

export const showErrorAlert = (messageTranslationKey = 'questionnaire.somethingWrong') => {
    const language = appState.getState().language || 'en';

    // Get the translation. Use a generic fallback.
    let errorMessage = translateText(messageTranslationKey.split('.'), language);
    if (!errorMessage) {
        errorMessage = 'Something went wrong. Please try again. Contact the Connect Support Center at 1-877-505-0253 if you continue to experience this problem.';
    }

    // Alert doesn't support HTML. Remove markdown links.
    const plainMessage = errorMessage.replace(/<\/?[^>]+(>|$)/g, '');

    // Display the alert
    alert(plainMessage);
};

/* Checks for each code point whether the given font supports it.
If not, tries to remove diacritics from said code point.
If that doesn't work either, replaces the unsupported character with '?'. */
export function replaceUnsupportedPDFCharacters(string, font) {
    if (!string) return;
    const charSet = font.getCharacterSet()
    const codePoints = []
    for (const codePointStr of string) {
        const codePoint = codePointStr.codePointAt(0);
        if (!charSet.includes(codePoint)) {
            const withoutDiacriticsStr = codePointStr.normalize('NFD').replace(/\p{Diacritic}/gu, '');
            const withoutDiacritics = withoutDiacriticsStr.charCodeAt(0);
            if (charSet.includes(withoutDiacritics)) {
                codePoints.push(withoutDiacritics);
            } else {
                codePoints.push('?'.codePointAt(0));
            }
        } else {
            codePoints.push(codePoint)
        }
    }
    return String.fromCodePoint(...codePoints);
}

/**
 * Escape HTML characters (useful for github-advanced-security bot warnings)
 * @param {string} str - String to escape 
 * @returns {string} - Escaped string
 */
export const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};

export const closeModal = () => {
    const modal = bootstrap.Modal.getInstance(
        document.getElementById("connectMainModal")
    );
    modal.hide();
};

/**
 * Validate the token used in URL by the new participant. Send the token for validation. Include the first sign in time. Both are added to Firestore on success.
 * @param {object} token - The token used in the tokenized URL by participant. This token comes from sites in a URL sent to participants on invitation.
 * @returns {object} - The response object from the API.
 */
export const validateToken = async (token) => {
    const idToken = await getIdToken();
    const time = await getFirstSignInISOTime();

    const response = await fetch(api + `?api=validateToken`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + idToken
        },
        body: JSON.stringify({ token, time })
    });

    const data = await response.json();
    return data;
}

/**
 * Get a nested property from an object using a dot-separated path.
 * @param {Object} obj - The object to search.
 * @param {string} path - The dot-separated path to the property.
 * @returns {any} - The value at the specified path, or undefined if not found.
 */

export const getNestedProperty = (obj, path) => {
    if (!path) return undefined;

    // If it's not a path (no dots), return the direct property
    if (!path.includes('.')) {
        return obj[path];
    }

    // Split the path and traverse the object
    return path.split('.').reduce((current, key) => {
        return current?.[key];
    }, obj);
};

/**
 * Set module attributes for the modules object based on participant data and collections.
 * @param {*} data - Participant data object.
 * @param {*} modules - Modules object to update.
 * @param {*} collections - Collections object for additional data.
 * @returns 
 */
export const setModuleAttributes = async (data, modules, collections) => {
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

    modules['2026 Return of Results Preference Survey'].header = '2026 Return of Results Preference Survey';
    modules['2026 Return of Results Preference Survey'].description = 'mytodolist.mainBodyReturnOfResults2026Description';
    modules['2026 Return of Results Preference Survey'].estimatedTime = 'mytodolist.10_15minutes';

    const currentTime = new Date();
    
    if(data['331584571']?.['266600170']?.['840048338']) {
        modules['Biospecimen Survey'].enabled = true;
        modules['Covid-19'].enabled = true;
    }

    if(collections && collections.filter(collection => collection['650516960'] === 664882224).length > 0) {
        modules['Clinical Biospecimen Survey'].enabled = true;
        modules['Covid-19'].enabled = true;
    }

    if (data[fieldMapping.menstrualSurveyEligible] === fieldMapping.yes) {
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
      mouthwashData?.[fieldMapping.kitType] === fieldMapping.kitTypeValues.homeMouthwash &&
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

    // The 2026 Return of Results Preference Survey is available for participants verified on or before August 1, 2026
    if (data[fieldMapping.ROIPreference2026.statusFlag]) {
        modules['2026 Return of Results Preference Survey'].enabled = true;
    }

    if (data[fieldMapping.ROIPreference2026.statusFlag] === fieldMapping.moduleStatus.submitted) {
        modules['2026 Return of Results Preference Survey'].completed = true;
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

export const checkIfComplete = (data) => {

    let module1Complete = data[fieldMapping.Module1.statusFlag] === fieldMapping.moduleStatus.submitted;
    let module2Complete = data[fieldMapping.Module2.statusFlag] === fieldMapping.moduleStatus.submitted;
    let module3Complete = data[fieldMapping.Module3.statusFlag] === fieldMapping.moduleStatus.submitted;
    let module4Complete = data[fieldMapping.Module4.statusFlag] === fieldMapping.moduleStatus.submitted;

    return module1Complete && module2Complete && module3Complete && module4Complete;
};

/**
 * Merges and deduplicates an arbitrary number of arrays
 * @param {...Array} arrays - Arrays to merge and deduplicate
 * @returns {Array} - The merged and deduplicated array
 */
export const mergeAndDeduplicateArrays = (...arrays) => {
    return [...new Set(arrays.flat())];
};
