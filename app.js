import { syncDHQ3RespondentInfo, getParameters, userLoggedIn, getMyData, hasUserData, getMyCollections, showAnimation, hideAnimation, storeResponse, isBrowserCompatible, inactivityTime, urls, appState, processAuthWithFirebaseAdmin, showErrorAlert, successResponse, logDDRumError, translateHTML, translateText, languageAcronyms, toggleNavbarMobileView, validateToken, retrieveNotifications } from "./js/shared.js";
import { userNavBar, homeNavBar, languageSelector, userHeaderNavBar, addMessageCounterToNavBar } from "./js/components/navbar.js";
import { homePage, joinNowBtn, whereAmIInDashboard, renderHomeAboutPage, renderHomeExpectationsPage, renderHomePrivacyPage } from "./js/pages/homePage.js";
import { addEventPinAutoUpperCase, addEventRequestPINForm, addEventRetrieveNotifications, toggleCurrentPage, toggleCurrentPageNoUser, addEventToggleSubmit, addEventLanguageSelection } from "./js/event.js";
import { requestPINTemplate, duplicateAccountReminderRender } from "./js/pages/healthCareProvider.js";
import { myToDoList } from "./js/pages/myToDoList.js";
import {renderNotificationsPage} from "./js/pages/notifications.js"
import { renderAgreements } from "./js/pages/agreements.js";
import { renderSettingsPage } from "./js/pages/settings.js";
import { renderReportsPage } from "./js/pages/reports.js";
import { renderSupportPage } from "./js/pages/support.js";
import { renderPaymentPage } from "./js/pages/payment.js";
import { renderSamplesPage } from "./js/pages/samples.js";
import { renderVerifiedPage } from "./js/pages/verifiedPage.js";
import { renderDashboard } from "./js/pages/dashboard.js";
import { firebaseConfig as devFirebaseConfig } from "./dev/config.js";
import { firebaseConfig as stageFirebaseConfig } from "./stage/config.js";
import { firebaseConfig as prodFirebaseConfig } from "./prod/config.js";
import conceptIdMap from "./js/fieldToConceptIdMapping.js";

let appVersion;

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./serviceWorker.js")
      .then((registration) => {
        registration.onupdatefound = () => {
          const sw = registration.installing;
          if (sw) {
            sw.onstatechange = () => sw.state === "activated" && sw.postMessage({ action: "getAppVersion" });
          }
        };
      })
      .catch((err) => {
        console.error("Service worker registration failed.", err);
      });
      
    navigator.serviceWorker.ready.then(() => {
      const sw = navigator.serviceWorker.controller;
      sw && sw.postMessage({ action: "getAppVersion" });
    });
  
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.action === "sendAppVersion") {
        document.getElementById("appVersion").textContent = event.data.payload;
        appVersion = event.data.payload;
      }
    });
  }

let auth = '';
let isDataDogUserSessionSet = false;

const datadogConfig = {
    clientToken: 'pubcb2a7770dcbc09aaf1da459c45ecff65',
    applicationId: '02ee9ee2-2197-4d6d-aff1-045d46fafa2c',
    site: 'ddog-gov.com',
    service: 'pwa',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input'
}

const isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

window.onload = async () => {
    const isCompatible = isBrowserCompatible();
    if(!isCompatible) {
        const mainContent = document.getElementById('root');
        mainContent.innerHTML = `<span class="not-compatible">MyConnect is not supported on your browser. Please use Chrome, Edge, Safari or Firefox.</span>`;
        return;
    }

    //Check for language storage
    let preferredLanguage = window.localStorage.getItem('preferredLanguage');
    if (!preferredLanguage) {
        preferredLanguage = conceptIdMap.language.en;
    }

    // Grab UTM parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Check for a continueUrl parameter
    const continueUrlParam = urlParams.get('continueUrl');

    if (urlParams) sessionStorage.setItem('urlParams', urlParams);
    if (continueUrlParam) sessionStorage.setItem('continueUrlParam', continueUrlParam); 

    let utmSource, utmMedium, utmCampaign;

    if (continueUrlParam) {
        // If we have a continueUrl, decode & parse the nested URL
        const decodedContinueUrl = decodeURIComponent(continueUrlParam);
        const continueUrlObj = new URL(decodedContinueUrl);

        // Extract UTM parameters from the nested URL
        utmSource   = continueUrlObj.searchParams.get('utm_source');
        utmMedium   = continueUrlObj.searchParams.get('utm_medium');
        utmCampaign = continueUrlObj.searchParams.get('utm_campaign');
    } 
    else {
        // Otherwise, parse the top-level URL params
        utmSource   = urlParams.get('utm_source');
        utmMedium   = urlParams.get('utm_medium');
        utmCampaign = urlParams.get('utm_campaign');
    }

    // Store UTM parameters in session storage (only if they exist)
    if (utmSource)   sessionStorage.setItem('utmSource',   utmSource);
    if (utmMedium)   sessionStorage.setItem('utmMedium',   utmMedium);
    if (utmCampaign) sessionStorage.setItem('utmCampaign', utmCampaign);

    document.documentElement.setAttribute('lang', languageAcronyms()[parseInt(preferredLanguage, 10)]);
    appState.setState({"language": parseInt(preferredLanguage, 10)});
    translateHTML(document.body);

    const script = document.createElement('script');
    
    if(location.host === urls.prod) {
        script.src = `https://maps.googleapis.com/maps/api/js?key=${prodFirebaseConfig.apiKey}&libraries=places&callback=Function.prototype`
        !firebase.apps.length ? firebase.initializeApp(prodFirebaseConfig) : firebase.app();

        window.DD_RUM && window.DD_RUM.init({ ...datadogConfig, env: 'prod', version: appVersion });
    }
    else if(location.host === urls.stage) {
        script.src = `https://maps.googleapis.com/maps/api/js?key=${stageFirebaseConfig.apiKey}&libraries=places&callback=Function.prototype`
        !firebase.apps.length ? firebase.initializeApp(stageFirebaseConfig) : firebase.app();

        window.DD_RUM && window.DD_RUM.init({ ...datadogConfig, env: 'stage', version: appVersion });
    }
    else if (isLocalDev) {
        const { firebaseConfig: localDevFirebaseConfig } = await import("./local-dev/config.js");
        if (!localDevFirebaseConfig) {
            console.error('Local development requires a firebaseConfig variable defined in ./local-dev/config.js.');
            return;
        }
        !firebase.apps.length ? firebase.initializeApp(localDevFirebaseConfig) : firebase.app();
    } else {
        script.src = `https://maps.googleapis.com/maps/api/js?key=${devFirebaseConfig.apiKey}&libraries=places&callback=Function.prototype`
        !firebase.apps.length ? firebase.initializeApp(devFirebaseConfig) : firebase.app();
        !isLocalDev && window.DD_RUM && window.DD_RUM.init({ ...datadogConfig, env: 'dev', version: appVersion });
    }

    !isLocalDev && window.DD_RUM && window.DD_RUM.startSessionReplayRecording();
    
    document.body.appendChild(script)

    auth = firebase.auth();

    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION); // SESSION persistence signs out when browser/tab closes
    } catch (error) {
        console.error('Error setting auth persistence:', error);
        showErrorAlert();
        return;
    }

    let inactivityCleanupFunction = null;

    auth.onAuthStateChanged(async (user) => {
        let idToken = '';
        if (user) {
            idToken = await user.getIdToken();
            if (!user.isAnonymous) {
                localforage.clear();
                const firstSignInTime = new Date(user.metadata.creationTime).toISOString();
                appState.setState({ participantData: { firstSignInTime } });

                // Reset to a clean activity state on auth update
                localStorage.setItem('myConnectInactivityWarning', 'false');
                localStorage.setItem('lastMyConnectActivityTimestamp', Date.now().toString());

                // Clean up the old timer if it exists
                if (inactivityCleanupFunction && typeof inactivityCleanupFunction === 'function') {
                    inactivityCleanupFunction();
                }

                // Start the inactivity timer and store the cleanup function
                inactivityCleanupFunction = inactivityTime();
            } else {
                // User is anonymous or logged out, stop the timer if it exists
                if (inactivityCleanupFunction && typeof inactivityCleanupFunction === 'function') {
                    inactivityCleanupFunction();
                    inactivityCleanupFunction = null;
                }
                localStorage.setItem('myConnectInactivityWarning', 'false');
            }
        } else {
            // No user logged in (or user just logged out)
            if (inactivityCleanupFunction && typeof inactivityCleanupFunction === 'function') {
                inactivityCleanupFunction();
                inactivityCleanupFunction = null;
            }
            localStorage.setItem('myConnectInactivityWarning', 'false');
        }

        appState.setState({ idToken });
    });

    await router();
}

const handleVerifyEmail = (auth, actionCode) => {
    auth.applyActionCode(actionCode).then(function() {
        window.location.hash = '#verified';
        location.reload();
    }).catch(function(error) {
        console.log(error);
    });
}

window.onhashchange = async () => {
    await router();
}

const router = async () => {

    // Clean URL if it has UTM parameters and user is authenticated
    const user = firebase.auth().currentUser;
    if (user && !user.isAnonymous && window.location.search) {
        const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    const parameters = getParameters(window.location.href);
    if(parameters && parameters['mode']){
        const mode = parameters['mode'];
        const actionCode = parameters['oobCode'];
        switch (mode) {
            case 'verifyEmail':
                handleVerifyEmail(auth, actionCode);
            break;
            default:
            // Error: invalid mode.
        }
        if(['verifyEmail'].includes(parameters['mode'])) return;
    }

    let loggedIn = await userLoggedIn();
    const route =  window.location.hash || '#';
    let exceptions = ['#joining-connect','#after-you-join','#long-term-study-activities','#what-connect-will-do','#how-your-information-will-help-prevent-cancer','#why-connect-is-important','#what-to-expect-if-you-decide-to-join','#where-this-study-takes-place','#about-our-researchers','#a-resource-for-science']
    if (loggedIn === false) {
        toggleNavBar(route, {}); // If not logged in, pass no data to toggleNavBar

        renderLanguageSelector();

        if (route === '#') {
            await homePage();
        } else if (route === '#about') {
            renderHomeAboutPage();
        } else if (route === '#expectations') {
            renderHomeExpectationsPage();
        } else if(route === '#privacy') {
            renderHomePrivacyPage();
        } else if(route === '#support'){
            location.href = "https://norcfedramp.servicenowservices.com/participant";
        } else if (exceptions.includes(route)){
            if(!document.getElementById(route.substring(1))){
                window.location.hash = '#'
            }
        } else {
            window.location.hash = '#';
        }
    }
    else{
        const data = await getMyData();

        renderLanguageSelector()
        
        if(successResponse(data)) {
            const firebaseAuthUser = firebase.auth().currentUser;

            // Skip at sign-up (no Firestore profile yet)
            if (Object.keys(data.data).length > 0) {
                await checkAuthDataConsistency(firebaseAuthUser.email ?? '', firebaseAuthUser.phoneNumber ?? '', data.data[conceptIdMap.firebaseAuthEmail] ?? '', data.data[conceptIdMap.firebaseAuthPhone] ?? '');
            }

            // Set Connect_ID for the current DataDog session
            if (!isLocalDev && window.DD_RUM && data?.data?.['Connect_ID'] && !isDataDogUserSessionSet) {
                window.DD_RUM.setUser({id: data.data['Connect_ID']});
                isDataDogUserSessionSet = true;
            }
            
            toggleNavBar(route, data);  // If logged in, pass data to toggleNavBar

            if (route === '#') userProfile();
            else if (route === '#dashboard') userProfile();
            else if (route === '#messages') renderNotificationsPage();
            else if (route === '#sign_out') await signOut();
            else if (route === '#forms') renderAgreements();
            else if (route === '#myprofile') renderSettingsPage();
            else if (route === '#reports') renderReportsPage();
            else if (route === '#support') renderSupportPage();
            else if (route === '#samples') renderSamplesPage();
            else if (route === '#payment') renderPaymentPage();
            else if (route === '#verified') renderVerifiedPage();
            else if (route === '#surveys') renderSurveys();
            else window.location.hash = '#';   
        }
    }
}

const renderLanguageSelector = () => {
    let languageSelectorContainer = document.getElementById('languageSelectorContainer');
    if (!languageSelectorContainer) {
       //Add the language Selector Container
       languageSelectorContainer = document.createElement('div');
       languageSelectorContainer.id = 'languageSelectorContainer';
       let userNavBar = document.getElementById('userNavBarContainer');
       userNavBar.parentNode.insertBefore(languageSelectorContainer, userNavBar);
    }

    languageSelectorContainer.innerHTML = languageSelector();
    translateHTML(languageSelectorContainer);
    addEventLanguageSelection();
}

const userProfile = () => {
    auth.onAuthStateChanged(async user => {
        if (user && !user.isAnonymous){

            let firestoreUserData;
            try {
                showAnimation();
                document.title = translateText('shared.dashboardTitle');

                let token = '';

                const continueUrlParam = sessionStorage.getItem('continueUrlParam');

                if (continueUrlParam) {
                    const decodedContinueUrl = decodeURIComponent(continueUrlParam);
                    const continueUrlObj = new URL(decodedContinueUrl);
                    
                    token = continueUrlObj.searchParams.get('token');
                }
                else {
                    // Get saved URL parameters from session storage
                    const savedUrlParams = sessionStorage.getItem('urlParams');
                    if (savedUrlParams) {
                        const urlParams = new URLSearchParams(savedUrlParams);
                        token = urlParams.get('token');
                    } else {
                        // Fallback to current location if no saved params
                        const href = location.href;
                        const parameters = getParameters(href);
                        token = parameters?.token;
                    }
                } 

                if (token) {
                    const response = await validateToken(token);

                    if (response.code === 202) {
                        const myErrorData = await getMyData();

                        logDDRumError(new Error(`Duplicate Account Found`), 'duplicateAccountError', {
                            userAction: 'PWA sign in',
                            timestamp: new Date().toISOString(),
                            connectID: myErrorData.data['Connect_ID'],
                        });

                        duplicateAccountReminderRender();
                        hideAnimation();
                        return;
                    }
                }

                userProfileAuthStateUIHandler(user);
            
                firestoreUserData = await getMyData();
                if (hasUserData(firestoreUserData)) {
                    // Authenticated user. Firestore profile exists.
                    const participantData = firestoreUserData.data;

                    // Need token and healthcare provider to get collections. These exist after the user has signed in and completed the healthcare provider form.
                    const myCollectionsPromise = participantData?.['token'] && participantData?.[conceptIdMap.healthcareProvider]
                        ? getMyCollections()
                        : { data: [] };

                    // Check whether the first sign in timestamp and flag are set. Repair if needed.
                    const checkFirstSignInPromise = checkFirstSignInTimestamp(
                        participantData?.[conceptIdMap.firstSignInFlag],
                        participantData?.[conceptIdMap.firstSignInTime],
                        user.metadata?.creationTime,
                        participantData?.[conceptIdMap.hipaaTimestamp],
                        participantData?.['Connect_ID']
                    );

                    // Check for DHQ3 completion status if it has been started.
                    const dhqStatusPromise = participantData?.[conceptIdMap.DHQ3.statusFlag] === conceptIdMap.moduleStatus.started 
                        ? syncDHQ3RespondentInfo(participantData[conceptIdMap.DHQ3.studyID], participantData[conceptIdMap.DHQ3.username], participantData[conceptIdMap.DHQ3.statusFlag], participantData[conceptIdMap.DHQ3.statusFlagExternal])
                        : Promise.resolve(null);

                    const [collectionsData] = await Promise.allSettled([myCollectionsPromise, checkFirstSignInPromise, dhqStatusPromise]);
                    await renderDashboard(participantData, false, collectionsData.value?.data || []);

                } else {
                    // Authenticated user. Firestore profile does not exist (initial sign-up). Show the PIN entry form.
                    const mainContent = document.getElementById('root');
                    mainContent.innerHTML = requestPINTemplate();
                    addEventPinAutoUpperCase();
                    addEventRequestPINForm();
                    addEventToggleSubmit();
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                logDDRumError(error, 'FirestoreError', {
                    userAction: 'PWA sign in',
                    timestamp: new Date().toISOString(),
                    function: 'userProfile',
                    token: firestoreUserData?.data?.['token'] ?? '',
                });

                showErrorAlert();
                
            } finally {
                hideAnimation();
            }
        }
        else{
            document.title = translateText('shared.homeTitle');
            window.location.hash = '#';
        }
    });
}

const renderSurveys = function () {
    auth.onAuthStateChanged(async user => {
        if (user && !user.isAnonymous){

            let firestoreUserData;
            try {
                showAnimation();
                document.title = translateText('shared.surveyTitle');
            
                firestoreUserData = await getMyData();
                if (hasUserData(firestoreUserData)) {
                    // Authenticated user. Firestore profile exists.
                    const participantData = firestoreUserData.data;

                    // Need token and healthcare provider to get collections. These exist after the user has signed in and completed the healthcare provider form.
                    const myCollectionsPromise = participantData?.['token'] && participantData?.[conceptIdMap.healthcareProvider]
                        ? getMyCollections()
                        : { data: [] };

                    const [collectionsData] = await Promise.allSettled([myCollectionsPromise]);
                    await myToDoList(participantData, false, collectionsData.value?.data || []);

                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                logDDRumError(error, 'FirestoreError', {
                    userAction: 'PWA sign in',
                    timestamp: new Date().toISOString(),
                    function: 'userProfile',
                    token: firestoreUserData?.data?.['token'] ?? '',
                });

                showErrorAlert();
                
            } finally {
                hideAnimation();
            }
        }
        else{
            document.title = translateText('shared.homeTitle');
            window.location.hash = '#';
        }
    });
}

/**
 * Route the user to the dashboard and show the verification email message if the user's email is not verified.
 * This is an older process, primarily.
 * @param {firebase.User} user - The current user.
 */
const userProfileAuthStateUIHandler = async (user) => {

    if (user.email && !user.emailVerified && !user.email.startsWith('noreply')) {
        const mainContent = document.getElementById('root');
        mainContent.innerHTML = `
                    <br>
                    <div class="row">
                        <div class="col-md-2">
                        </div>
                        <div class="col-md-8">
                            <div class="verifyEmailText">Please verify your email by clicking <a id="verifyEmail">
                            <br>
                            <br>
                            <button class="btn btn-primary consentNextButton" style="font-weight:bold;">Verify Email</button></a></div>
                        </div>
                        <div class="col-md-2">
                        </div>
                    </div>
                        `

        document.getElementById('verifyEmail').addEventListener('click', () => {
            mainContent.innerHTML = `
                    <br>
                    <div class="row">
                        <div class="col-md-2">
                        </div>
                        <div class="col-md-8">
                            <div class="verifyEmailText">Please click the link we sent to your email to verify your contact information.<br>Be sure to check your spam folder.</div>
                        </div>
                        <div class="col-md-2">
                        </div>
                    </div>`
        });
        hideAnimation();
        document.getElementById('verifyEmail').addEventListener('click', () => {
            user.sendEmailVerification().then(function () {

            }).catch(function (error) {
                console.error('Error sending email verification: ', error);
            });
        });
        return;
    }
};

export const signOut = async () => {
    toggleNavbarMobileView();

    // Record a logout action and stop the DataDog session. This or 15 mins of inactivity will create a new session when the next action is taken.
    if (!isLocalDev && window.DD_RUM) {
        window.DD_RUM.addAction('user_logout', {
            timestamp: new Date().toISOString()
        });
        window.DD_RUM.stopSession();
        isDataDogUserSessionSet = false;
    }
    localforage.clear();

    await firebase.auth().signOut();

    window.location.hash = '#';
    document.title = translateText('shared.homeTitle');
}

/**
 * Render navbar based on user login status
 * @param {string} route The route to be rendered
 * @param {*} data User data
 */
const toggleNavBar = (route, data) => {
    auth.onAuthStateChanged(async user => {
        if (user && !user.isAnonymous){
            showAnimation();
            document.getElementById('userNavBarContainer').innerHTML = userNavBar(data);
            document.getElementById('headerNavBarContainer').innerHTML = userHeaderNavBar(data);
            document.getElementById('headerNavBarToggler').classList.remove("d-none");
            document.getElementById('userNavBarToggler').classList.add("d-none");
            document.getElementById('userNavBarToggler').parentNode.parentNode.classList.add("navbar-expand");
            document.getElementById('userNavBarToggler').parentNode.parentNode.classList.remove("navbar-expand-md");
            addMessageCounterToNavBar();
            document.getElementById('joinNow') ? document.getElementById('joinNow').innerHTML = joinNowBtn(false) : ``; 
            document.getElementById('signInWrapperDiv') ? document.getElementById('signInWrapperDiv').style.display = "none" :'';
            document.getElementById('nextStepWarning') ? document.getElementById('nextStepWarning').innerHTML = await whereAmIInDashboard() : '';
            document.getElementById('nextStepWarning') ? document.getElementById('nextStepWarning').style.display="block": '';
            addEventRetrieveNotifications();
            await toggleCurrentPage(route);
            hideAnimation();
        }
        else{
            showAnimation();
            document.getElementById('userNavBarContainer').innerHTML = homeNavBar();
            document.getElementById('headerNavBarContainer').innerHTML = '';
            document.getElementById('headerNavBarToggler').classList.add("d-none");
            document.getElementById('userNavBarToggler').classList.remove("d-none");
            document.getElementById('userNavBarToggler').parentNode.parentNode.classList.add("navbar-expand-md");
            document.getElementById('userNavBarToggler').parentNode.parentNode.classList.remove("navbar-expand");
            document.getElementById('joinNow') ? document.getElementById('joinNow').innerHTML = joinNowBtn(true) : ``;
            document.getElementById('nextStepWarning') ? document.getElementById('nextStepWarning').style.display="none": '';
            await toggleCurrentPageNoUser(route);
            hideAnimation();
        }
    });
}

/**
 * confirm the user's Firebase Auth email and phone data match the user's Firestore email and phone data.
 * There's a 'gotcha' with magic links -the firebase auth profile is stripped of the phone number auth when a magic link is used for email login.
 * The 'if' case below handles this. We check the firebase auth && firestore participant profiles for a phone match. If no match, and a phone number exists in the firestore participant profile, we write update the auth phone number to the firebase auth profile.
 * The 'else if' case handles the following: We write firebase auth and firestore participant data separately, one after another. There's a chance the first write (Firebase Auth) succeeds and the second write (Firestore) fails.
 * This only costs an API call if the data is inconsistent since we hava access to both datapoints from app init. It otherwise only costs the time to run the check.
 */
const checkAuthDataConsistency = async (firebaseAuthEmail, firebaseAuthPhoneNumber, firestoreParticipantEmail, firestoreParticipantPhoneNumber) => {
    const isAuthEmailConsistent = firebaseAuthEmail === firestoreParticipantEmail;
    const isAuthPhoneConsistent = firebaseAuthPhoneNumber === firestoreParticipantPhoneNumber;
  
    if (firestoreParticipantPhoneNumber && !firebaseAuthPhoneNumber) {
      await updateFirebaseAuthPhoneTrigger(firestoreParticipantPhoneNumber);
      return false;
    } else if (!isAuthEmailConsistent || !isAuthPhoneConsistent) {
      const authDataToSync = {
        [conceptIdMap.firebaseAuthEmail]: firebaseAuthEmail,
      };

      if (firebaseAuthPhoneNumber || firestoreParticipantPhoneNumber) {
        authDataToSync[conceptIdMap.firebaseAuthPhone] = firebaseAuthPhoneNumber ?? firestoreParticipantPhoneNumber;
      }
  
      try {
        await storeResponse(authDataToSync);
      } catch (error) {
        console.error('Error updating document (storeResponse): ', error);
        return false;
      }      
      return false;
    }
    return true;
};

/**
 * Check the first sign in timestamp and flag. If the flag is set to 'yes' and the timestamp is missing, we need to update the timestamp.
 * This function repairs first sign in timestamp errors. storeResponse can fire in the background. No need to await.
 * @param {string} firstSignInFlag - The first sign in flag from Firestore.
 * @param {string} firstSignInTimestamp - The first sign in timestamp from Firestore.
 * @param {string} firebaseAccountCreationTimestamp - The timestamp of the Firebase account creation.
 * @param {string} hipaaTimestamp - The timestamp of the participant's HIPAA consent.
 * @param {string} connectID - The participant's Connect ID.
 */

const checkFirstSignInTimestamp = async (firstSignInFlag, firstSignInTimestamp, firebaseAccountCreationTimestamp, hipaaTimestamp, connectID) => {
    
    // Return early if the first sign in flag is set to 'yes' and the timestamp is already set. This is the expected state.
    if (firstSignInFlag && firstSignInFlag === conceptIdMap.yes && firstSignInTimestamp) {
        return;
    }

    // Log an error if the firstSignInTime hasn't been extracted from the Firebase Auth account.
    if (!firebaseAccountCreationTimestamp) {
        console.log('Invalid account creation timestamp');
        logDDRumError(new Error(`Invalid Account Creation Timestamp`), 'InvalidFirstSignInTimeError', {
            userAction: 'PWA sign in',
            timestamp: new Date().toISOString(),
            connectID: connectID || '',
            function: 'checkFirstSignInTimestamp'
        });
        return;
    }

    // Validate firebaseAccountCreationTimestamp.
    const accountCreationDate = new Date(firebaseAccountCreationTimestamp);
    if (isNaN(accountCreationDate.getTime())) {
        console.log('Invalid account creation timestamp format');
        logDDRumError(new Error(`Invalid Account Creation Timestamp Format`), 'InvalidFirstSignInTimeError', {
            userAction: 'PWA sign in',
            timestamp: new Date().toISOString(),
            connectID: connectID || '',
            function: 'checkFirstSignInTimestamp',
        });
        return;
    }

    // Convert the Firebase account creation timestamp to an ISO string.
    firebaseAccountCreationTimestamp = new Date(firebaseAccountCreationTimestamp).toISOString();

    // Log an error if the account creation timestamp is after the consent timestamp. This is an unexpected data integrity issue.
    if (hipaaTimestamp && firebaseAccountCreationTimestamp > hipaaTimestamp) {
        console.log('Account creation timestamp failed consent timestamp QC');
        logDDRumError(new Error(`Account Creation Timestamp Failed Consent Timestamp QC`), 'InvalidFirstSignInTimeError', {
            userAction: 'PWA sign in',
            timestamp: new Date().toISOString(),
            connectID: connectID || '',
            function: 'checkFirstSignInTimestamp'
        });
        return;
    }

    // If everything checks out, repair the missed first sign in timestamp and ensure the flag is set to 'yes' when the timestamp is missing. Hippa timestamp is just a safeguard.
    if (hipaaTimestamp) {
        try {
            await storeResponse({
                [conceptIdMap.firstSignInFlag]: conceptIdMap.yes,
                [conceptIdMap.firstSignInTime]: firebaseAccountCreationTimestamp,
            });
        } catch (error) {
            console.error('Error updating document (storeResponse): ', error);
            logDDRumError(error, 'FirestoreUpdateError', {
                userAction: 'PWA sign in',
                timestamp: new Date().toISOString(),
                connectID: connectID || '',
                function: 'checkFirstSignInTimestamp'
            });
        }
    }
}

const updateFirebaseAuthPhoneTrigger = async (phone) =>  {
    showAnimation();
    const uid = firebase.auth().currentUser.uid;
    if (phone && phone.startsWith('+1')) phone = phone.substring(2);
    let newAuthData = {};
    newAuthData['uid'] = uid;
    newAuthData['flag'] = 'replaceSignin';
    newAuthData['phone'] = phone;
  
    try {
      await processAuthWithFirebaseAdmin(newAuthData);
      hideAnimation();
      const firebaseAuthUser = firebase.auth().currentUser;
      await firebaseAuthUser.reload();
      return;
    } catch (error) {
      console.error('An error occurred:', error);
      hideAnimation();
      throw error;
    }
};
