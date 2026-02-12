import { triggerEmailLinkSend, logDDRumAction, logAuthIssue, getAuthErrorMessageKey, showAuthErrorMessage, clearAuthErrorMessage, createTelemetryId } from "../shared.js";

/**
 * Build normalized auth context for FirebaseUI callbacks and auth telemetry.
 * Pulls UI state from `#signInWrapperDiv` and de-identifies account values
 * into `emailDomain` / `phoneLast4` for logging.
 * @param {string} signInType - Current FirebaseUI mode (`phone`, `email`, or `all`).
 * @param {Object} [authResult] - Firebase auth result from success callback.
 * @returns {{
 *   uiType: string,
 *   flow: string,
 *   accountType: string,
 *   authMethod: string,
 *   signInType: string,
 *   authFlowId: string,
 *   authAttemptId: string,
 *   attemptStartTs: number,
 *   emailDomain: string,
 *   phoneLast4: string
 * }} Context object for auth event logging.
 */
const buildAuthUiContext = (signInType, authResult) => {
  const wrapperDiv = document.getElementById("signInWrapperDiv");
  const uiType = wrapperDiv?.dataset?.uiType || '';
  const accountType = wrapperDiv?.dataset?.accountType || wrapperDiv?.dataset?.signupType || signInType || '';
  const authMethod = accountType === 'phone' ? 'phone' : 'email';
  const flow = uiType === 'signUp' ? 'sign_up' : 'sign_in';
  const authFlowId = wrapperDiv?.dataset?.authFlowId || '';
  const authAttemptId = wrapperDiv?.dataset?.authAttemptId || '';
  const attemptStartTs = parseInt(wrapperDiv?.dataset?.authAttemptStartTs || '0', 10) || 0;
  const accountValue = wrapperDiv?.dataset?.accountValue || '';
  const email = authResult?.user?.email || (accountValue.includes('@') ? accountValue : '');
  const phone = authResult?.user?.phoneNumber || (!email ? accountValue : '');
  const emailDomain = email ? email.split('@').pop().toLowerCase() : ''; // de-identify email domain
  const phoneLast4 = phone ? phone.replace(/\D/g, '').slice(-4) : ''; // de-identify phone number

  return {
    uiType,
    flow,
    accountType,
    authMethod,
    signInType,
    authFlowId,
    authAttemptId,
    attemptStartTs,
    emailDomain,
    phoneLast4,
  };
};

const beginAuthAttempt = (signInType) => {
  const wrapperDiv = document.getElementById("signInWrapperDiv");
  if (!wrapperDiv) return buildAuthUiContext(signInType);

  if (!wrapperDiv.dataset.authFlowId) {
    wrapperDiv.dataset.authFlowId = createTelemetryId('auth_flow');
  }
  wrapperDiv.dataset.authAttemptId = createTelemetryId('auth_attempt');
  wrapperDiv.dataset.authAttemptStartTs = String(Date.now());

  return buildAuthUiContext(signInType);
};

/**
 * Auth failure handler: logs the error and displays a message.
 * @param {Error|Object} error - The error object from Firebase.
 * @param {Object} context - The UI context (sign-in type, flow, etc.).
 * @returns {Promise} - Resolves if handled, rejects if critical.
 */
export const handleAuthFailure = (error, context) => {
  const eventName = context.accountType === 'phone'
    ? 'phone_auth_failure'
    : 'email_link_auth_failure';

  const { errorCode, errorCategory } = logAuthIssue({
    error,
    errorType: 'FirebaseUiSignInFailure',
    action: eventName,
    context,
    fallbackMessage: 'Firebase UI sign-in failure.',
  });

  const errorKey = getAuthErrorMessageKey(errorCode);
  showAuthErrorMessage(errorKey);
  const durationMs = context.attemptStartTs ? Date.now() - context.attemptStartTs : null;
  logDDRumAction('auth_attempt_completed', {
    ...context,
    outcome: 'failure',
    errorCode,
    errorCategory,
    durationMs,
  });

  if (errorCode !== 'firebaseui/anonymous-upgrade-merge-conflict') {
    return Promise.resolve();
  }

  return Promise.reject(error);
};

/**
 * Auth success handler: logs the event and clears errors.
 * @param {Object} authResult - The result object from Firebase.
 * @param {Object} context - The UI context.
 * @returns {boolean} - Always returns true to allow redirect.
 */
export const handleAuthSuccess = (authResult, context) => {
  const providerId = authResult?.credential?.providerId
    || authResult?.additionalUserInfo?.providerId
    || authResult?.user?.providerData?.[0]?.providerId;
  const isPhone = providerId === firebase.auth.PhoneAuthProvider.PROVIDER_ID;
  const eventName = isPhone ? 'phone_auth_success' : 'email_link_auth_success';

  clearAuthErrorMessage();
  logDDRumAction(eventName, {
    ...context,
    providerId,
    isNewUser: authResult?.additionalUserInfo?.isNewUser || false,
  });
  const durationMs = context.attemptStartTs ? Date.now() - context.attemptStartTs : null;
  logDDRumAction('auth_attempt_completed', {
    ...context,
    outcome: 'success',
    durationMs,
  });

  return true;
};

/**
 * Configures the Firebase UI for sign-in/sign-up
 * Docs: https://firebase.google.com/docs/auth/web/firebaseui
 * @param {string} signInType - The type of sign-in to configure. Can be "phone", "email", or "all". Unrecognized values fall back to "all".
 * @returns {Object} - The Firebase UI configuration object.
 */
export const signInConfig = (signInType = "all") => {
  const emailLinkProvider = {
    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
    emailLinkSignIn: triggerEmailLinkSend,
  };

  const options = {
    phone: [firebase.auth.PhoneAuthProvider.PROVIDER_ID],
    email: [emailLinkProvider],
    all: [firebase.auth.PhoneAuthProvider.PROVIDER_ID, emailLinkProvider],
  };

  return {
    signInSuccessUrl: "#dashboard",
    signInOptions: options[signInType] || options.all,
    credentialHelper: "none",
    callbacks: {
      uiShown: () => {
        const context = beginAuthAttempt(signInType);
        clearAuthErrorMessage();
        logDDRumAction('auth_ui_shown', context);
        logDDRumAction('auth_attempt_started', context);
      },
      signInSuccessWithAuthResult: (authResult) => {
        const context = buildAuthUiContext(signInType, authResult);
        return handleAuthSuccess(authResult, context);
      },
      signInFailure: (error) => {
        const context = buildAuthUiContext(signInType);
        return handleAuthFailure(error, context);
      }
    },
  };
};
