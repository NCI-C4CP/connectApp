import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDocumentByIdMap, setupTestEnvironment, teardownTestEnvironment } from './helpers.js';

// Set location.hostname before app.js evaluates isLocalDev at module load time.
// isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
// We need it to be non-local so DD_RUM code paths are reachable.
vi.hoisted(() => {
  globalThis.location = globalThis.location || {};
  globalThis.location.hostname = 'myconnect.cancer.gov';
  globalThis.location.host = 'myconnect.cancer.gov';
});

const sharedMocks = vi.hoisted(() => ({
  toggleNavbarMobileView: vi.fn(),
  translateText: vi.fn((key) => `translated:${key}`),
  showAnimation: vi.fn(),
  hideAnimation: vi.fn(),
  storeResponse: vi.fn(),
  processAuthWithFirebaseAdmin: vi.fn(),
  userLoggedIn: vi.fn(),
  getParameters: vi.fn(),
  isMagicLinkCallbackUrl: vi.fn(),
}));

vi.mock('../js/shared.js', () => ({
  syncDHQ3RespondentInfo: vi.fn(),
  getParameters: sharedMocks.getParameters,
  userLoggedIn: sharedMocks.userLoggedIn,
  getMyData: vi.fn(),
  hasUserData: vi.fn(),
  getMyCollections: vi.fn(),
  showAnimation: sharedMocks.showAnimation,
  hideAnimation: sharedMocks.hideAnimation,
  storeResponse: sharedMocks.storeResponse,
  isBrowserCompatible: vi.fn(),
  inactivityTime: vi.fn(),
  urls: { prod: 'myconnect.cancer.gov', stage: 'myconnect-stage.cancer.gov', dev: 'nci-c4cp.github.io' },
  appState: { setState: vi.fn(), getState: vi.fn() },
  processAuthWithFirebaseAdmin: sharedMocks.processAuthWithFirebaseAdmin,
  showErrorAlert: vi.fn(),
  successResponse: vi.fn(),
  logDDRumError: vi.fn(),
  translateHTML: vi.fn((c) => c),
  translateText: sharedMocks.translateText,
  languageAcronyms: vi.fn(() => ({})),
  toggleNavbarMobileView: sharedMocks.toggleNavbarMobileView,
  validateToken: vi.fn(),
  retrieveNotifications: vi.fn(),
  isMagicLinkCallbackUrl: sharedMocks.isMagicLinkCallbackUrl,
}));

vi.mock('../js/components/navbar.js', () => ({
  userNavBar: vi.fn(),
  homeNavBar: vi.fn(),
  languageSelector: vi.fn(() => ''),
  userHeaderNavBar: vi.fn(),
  addMessageCounterToNavBar: vi.fn(),
}));

vi.mock('../js/pages/homePage.js', () => ({
  homePage: vi.fn(),
  joinNowBtn: vi.fn(),
  whereAmIInDashboard: vi.fn(),
  renderHomeAboutPage: vi.fn(),
  renderHomeExpectationsPage: vi.fn(),
  renderHomePrivacyPage: vi.fn(),
}));

vi.mock('../js/event.js', () => ({
  addEventPinAutoUpperCase: vi.fn(),
  addEventRequestPINForm: vi.fn(),
  addEventRetrieveNotifications: vi.fn(),
  toggleCurrentPage: vi.fn(),
  toggleCurrentPageNoUser: vi.fn(),
  addEventToggleSubmit: vi.fn(),
  addEventLanguageSelection: vi.fn(),
}));

vi.mock('../js/pages/healthCareProvider.js', () => ({
  requestPINTemplate: vi.fn(),
  duplicateAccountReminderRender: vi.fn(),
}));

vi.mock('../js/pages/myToDoList.js', () => ({ myToDoList: vi.fn() }));
vi.mock('../js/pages/notifications.js', () => ({ renderNotificationsPage: vi.fn() }));
vi.mock('../js/pages/agreements.js', () => ({ renderAgreements: vi.fn() }));
vi.mock('../js/pages/settings.js', () => ({ renderSettingsPage: vi.fn() }));
vi.mock('../js/pages/reports.js', () => ({ renderReportsPage: vi.fn() }));
vi.mock('../js/pages/support.js', () => ({ renderSupportPage: vi.fn() }));
vi.mock('../js/pages/payment.js', () => ({ renderPaymentPage: vi.fn() }));
vi.mock('../js/pages/samples.js', () => ({ renderSamplesPage: vi.fn() }));
vi.mock('../js/pages/verifiedPage.js', () => ({ renderVerifiedPage: vi.fn() }));
vi.mock('../js/pages/dashboard.js', () => ({ renderDashboard: vi.fn() }));

vi.mock('../dev/config.js', () => ({ firebaseConfig: {} }));
vi.mock('../stage/config.js', () => ({ firebaseConfig: {} }));
vi.mock('../prod/config.js', () => ({ firebaseConfig: {} }));

vi.mock('../js/fieldToConceptIdMapping.js', () => ({
  default: {
    firebaseAuthEmail: 421823980,
    firebaseAuthPhone: 348474836,
    yes: 353358909,
    consentSubmitted: 919254129,
    language: { en: 0 },
  },
}));

vi.mock('../js/authStateRouting.js', () => ({
  applyUnauthenticatedRouteState: vi.fn(),
  showLegacyEmailVerificationInterstitial: vi.fn(),
  shouldShowLegacyEmailVerificationInterstitial: vi.fn(),
}));

import {
  signOut,
  router,
  setAuth,
  checkAuthDataConsistency,
  handleVerifyEmail,
  updateFirebaseAuthPhoneTrigger,
} from '../app.js';
import { homePage, renderHomeAboutPage, renderHomeExpectationsPage, renderHomePrivacyPage } from '../js/pages/homePage.js';

// signOut

describe('signOut', () => {
  let env;
  let signOutMock;
  let localforageMock;

  beforeEach(() => {
    vi.clearAllMocks();
    env = setupTestEnvironment();

    signOutMock = vi.fn().mockResolvedValue();
    globalThis.firebase = {
      auth: () => ({
        signOut: signOutMock,
        onAuthStateChanged: vi.fn(),
        currentUser: null,
        setPersistence: vi.fn().mockResolvedValue(),
      }),
      apps: [{}],
    };

    localforageMock = { clear: vi.fn() };
    globalThis.localforage = localforageMock;
  });

  afterEach(() => {
    teardownTestEnvironment();
    delete globalThis.firebase;
    delete globalThis.localforage;
  });

  it('calls toggleNavbarMobileView', async () => {
    await signOut();
    expect(sharedMocks.toggleNavbarMobileView).toHaveBeenCalled();
  });

  it('non-local with DD_RUM: logs user_logout action with timestamp', async () => {
    globalThis.window.DD_RUM = {
      addAction: vi.fn(),
      stopSession: vi.fn(),
    };

    await signOut();

    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith('user_logout', {
      timestamp: expect.any(String),
    });
  });

  it('non-local with DD_RUM: calls DD_RUM.stopSession()', async () => {
    globalThis.window.DD_RUM = {
      addAction: vi.fn(),
      stopSession: vi.fn(),
    };

    await signOut();

    expect(globalThis.window.DD_RUM.stopSession).toHaveBeenCalled();
  });

  it('skips DataDog calls when DD_RUM is not present', async () => {
    delete globalThis.window.DD_RUM;

    await signOut();

    // No error thrown — DD_RUM calls are safely guarded
    expect(sharedMocks.toggleNavbarMobileView).toHaveBeenCalled();
  });

  it('calls localforage.clear()', async () => {
    await signOut();
    expect(localforageMock.clear).toHaveBeenCalled();
  });

  it('awaits firebase.auth().signOut()', async () => {
    await signOut();
    expect(signOutMock).toHaveBeenCalled();
  });

  it('sets window.location.hash and document.title to translated home title', async () => {
    await signOut();
    expect(env.location.hash).toBe('#');
    expect(document.title).toBe('translated:shared.homeTitle');
  });
});

// router (unauthenticated)

describe('router — unauthenticated routing', () => {
  let env;

  beforeEach(() => {
    vi.clearAllMocks();
    env = setupTestEnvironment();

    const authStub = {
      onAuthStateChanged: vi.fn(),
    };
    setAuth(authStub);

    globalThis.firebase = {
      auth: () => ({
        currentUser: null,
        onAuthStateChanged: vi.fn(),
      }),
    };

    // Install DOM elements needed by renderLanguageSelector and toggleNavBar
    const makeEl = () => ({
      innerHTML: '',
      style: { display: '' },
      classList: { add: vi.fn(), remove: vi.fn() },
      parentNode: {
        insertBefore: vi.fn(),
        parentNode: { classList: { add: vi.fn(), remove: vi.fn() } },
      },
    });
    installDocumentByIdMap({
      languageSelectorContainer: makeEl(),
      userNavBarContainer: makeEl(),
      headerNavBarContainer: makeEl(),
      headerNavBarToggler: makeEl(),
      userNavBarToggler: makeEl(),
      joinNow: null,
      signInWrapperDiv: null,
      nextStepWarning: null,
    });

    // Default: user is not logged in
    sharedMocks.userLoggedIn.mockResolvedValue(false);
    sharedMocks.getParameters.mockReturnValue(null);
    sharedMocks.isMagicLinkCallbackUrl.mockReturnValue(false);
    homePage.mockResolvedValue();
  });

  afterEach(() => {
    teardownTestEnvironment();
    delete globalThis.firebase;
  });

  it('calls homePage when isMagicLinkCallbackUrl returns true', async () => {
    sharedMocks.isMagicLinkCallbackUrl.mockReturnValue(true);
    env.location.hash = '#';

    await router();

    expect(homePage).toHaveBeenCalled();
  });

  it('calls homePage when route is "#"', async () => {
    sharedMocks.isMagicLinkCallbackUrl.mockReturnValue(false);
    env.location.hash = '#';

    await router();

    expect(homePage).toHaveBeenCalled();
  });

  it('calls homePage when isMagicLinkCallbackUrl is true even with non-"#" hash', async () => {
    sharedMocks.isMagicLinkCallbackUrl.mockReturnValue(true);
    env.location.hash = '#about';

    await router();

    expect(homePage).toHaveBeenCalled();
    expect(renderHomeAboutPage).not.toHaveBeenCalled();
  });

  it('calls renderHomeAboutPage for "#about"', async () => {
    env.location.hash = '#about';

    await router();

    expect(renderHomeAboutPage).toHaveBeenCalled();
    expect(homePage).not.toHaveBeenCalled();
  });

  it('calls renderHomeExpectationsPage for "#expectations"', async () => {
    env.location.hash = '#expectations';

    await router();

    expect(renderHomeExpectationsPage).toHaveBeenCalled();
  });

  it('calls renderHomePrivacyPage for "#privacy"', async () => {
    env.location.hash = '#privacy';

    await router();

    expect(renderHomePrivacyPage).toHaveBeenCalled();
  });

  it('redirects unknown routes to "#"', async () => {
    env.location.hash = '#nonexistent';

    await router();

    expect(env.location.hash).toBe('#');
  });
});

// checkAuthDataConsistency

describe('checkAuthDataConsistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when email and phone both match', async () => {
    const result = await checkAuthDataConsistency(
      'user@example.com', '+15551234567',
      'user@example.com', '+15551234567',
      true
    );
    expect(result).toBe(true);
    expect(sharedMocks.storeResponse).not.toHaveBeenCalled();
  });

  it('calls updateFirebaseAuthPhoneFn when Firestore has phone but Firebase Auth does not; returns false', async () => {
    const updatePhoneFn = vi.fn();
    const result = await checkAuthDataConsistency(
      'user@example.com', '',
      'user@example.com', '+15551234567',
      true,
      updatePhoneFn
    );
    expect(result).toBe(false);
    expect(updatePhoneFn).toHaveBeenCalledWith('+15551234567');
  });

  it('returns false without storeResponse when inconsistent but shouldSaveLogin is false', async () => {
    const result = await checkAuthDataConsistency(
      'new@example.com', '',
      'old@example.com', '',
      false
    );
    expect(result).toBe(false);
    expect(sharedMocks.storeResponse).not.toHaveBeenCalled();
  });

  it('calls storeResponse with email key when email differs and shouldSaveLogin is true', async () => {
    sharedMocks.storeResponse.mockResolvedValue(true);
    const result = await checkAuthDataConsistency(
      'new@example.com', '+15551234567',
      'old@example.com', '+15551234567',
      true
    );
    expect(result).toBe(false);
    expect(sharedMocks.storeResponse).toHaveBeenCalledWith({
      421823980: 'new@example.com',
    });
  });

  it('calls storeResponse with phone key when phone differs and shouldSaveLogin is true', async () => {
    sharedMocks.storeResponse.mockResolvedValue(true);
    const result = await checkAuthDataConsistency(
      'user@example.com', '+15559999999',
      'user@example.com', '+15551234567',
      true
    );
    expect(result).toBe(false);
    expect(sharedMocks.storeResponse).toHaveBeenCalledWith({
      348474836: '+15559999999',
    });
  });

  it('calls storeResponse with both keys when both differ and shouldSaveLogin is true', async () => {
    sharedMocks.storeResponse.mockResolvedValue(true);
    const result = await checkAuthDataConsistency(
      'new@example.com', '+15559999999',
      'old@example.com', '+15551234567',
      true
    );
    expect(result).toBe(false);
    expect(sharedMocks.storeResponse).toHaveBeenCalledWith({
      421823980: 'new@example.com',
      348474836: '+15559999999',
    });
  });

  it('skips storeResponse when Firebase Auth values are empty strings', async () => {
    // Both firebaseAuth values are empty, firestore values differ.
    // firestoreParticipantPhoneNumber is also empty to avoid the phone-trigger path.
    const result = await checkAuthDataConsistency(
      '', '',
      'old@example.com', '',
      true
    );
    expect(result).toBe(false);
    expect(sharedMocks.storeResponse).not.toHaveBeenCalled();
  });

  it('catches storeResponse rejection gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sharedMocks.storeResponse.mockRejectedValue(new Error('network error'));
    const result = await checkAuthDataConsistency(
      'new@example.com', '',
      'old@example.com', '',
      true
    );
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error updating document (storeResponse): ',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});

// handleVerifyEmail

describe('handleVerifyEmail', () => {
  let env;

  beforeEach(() => {
    vi.clearAllMocks();
    env = setupTestEnvironment();
    env.location.reload = vi.fn();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('calls auth.applyActionCode(actionCode)', async () => {
    const authStub = { applyActionCode: vi.fn().mockResolvedValue() };
    handleVerifyEmail(authStub, 'abc123');
    await vi.waitFor(() => {
      expect(authStub.applyActionCode).toHaveBeenCalledWith('abc123');
    });
  });

  it('on success: sets window.location.hash and calls location.reload()', async () => {
    const authStub = { applyActionCode: vi.fn().mockResolvedValue() };
    handleVerifyEmail(authStub, 'abc123');
    await vi.waitFor(() => {
      expect(env.location.hash).toBe('#verified');
      expect(env.location.reload).toHaveBeenCalled();
    });
  });

  it('on failure: logs error, does not set hash or reload', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = new Error('bad code');
    const authStub = { applyActionCode: vi.fn().mockRejectedValue(error) };
    handleVerifyEmail(authStub, 'bad');
    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });
    expect(env.location.hash).toBe('#');
    expect(env.location.reload).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// updateFirebaseAuthPhoneTrigger

describe('updateFirebaseAuthPhoneTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'test-uid-123',
          reload: vi.fn().mockResolvedValue(),
        },
      }),
    };
  });

  afterEach(() => {
    delete globalThis.firebase;
  });

  it('sends correct payload to processAuthWithFirebaseAdmin', async () => {
    sharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue();
    await updateFirebaseAuthPhoneTrigger('5551234567');
    expect(sharedMocks.processAuthWithFirebaseAdmin).toHaveBeenCalledWith({
      uid: 'test-uid-123',
      flag: 'replaceSignin',
      phone: '5551234567',
    });
  });

  it('strips +1 prefix from phone before sending', async () => {
    sharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue();
    await updateFirebaseAuthPhoneTrigger('+15551234567');
    expect(sharedMocks.processAuthWithFirebaseAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '5551234567' })
    );
  });

  it('shows animation before, hides after success', async () => {
    sharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue();
    await updateFirebaseAuthPhoneTrigger('5551234567');
    expect(sharedMocks.showAnimation).toHaveBeenCalled();
    expect(sharedMocks.hideAnimation).toHaveBeenCalled();
    const showOrder = sharedMocks.showAnimation.mock.invocationCallOrder[0];
    const hideOrder = sharedMocks.hideAnimation.mock.invocationCallOrder[0];
    expect(showOrder).toBeLessThan(hideOrder);
  });

  it('hides animation and re-throws on error', async () => {
    const error = new Error('process failed');
    sharedMocks.processAuthWithFirebaseAdmin.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(updateFirebaseAuthPhoneTrigger('5551234567')).rejects.toThrow('process failed');
    expect(sharedMocks.hideAnimation).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('calls firebaseAuthUser.reload() after success', async () => {
    sharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue();
    const reloadMock = vi.fn().mockResolvedValue();
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'test-uid-123',
          reload: reloadMock,
        },
      }),
    };
    await updateFirebaseAuthPhoneTrigger('5551234567');
    expect(reloadMock).toHaveBeenCalled();
  });
});
