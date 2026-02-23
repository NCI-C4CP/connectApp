import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDocumentByIdMap, setupTestEnvironment, teardownTestEnvironment } from './helpers.js';
import { registerSharedRuntimeModuleMocks, sharedRuntimeMocks } from './moduleMocks.js';

registerSharedRuntimeModuleMocks();

let shared;

const createAuthDomNodes = (email = 'person@example.com') => {
  const wrapper = {
    dataset: {
      uiType: 'signIn',
      accountType: 'email',
      accountValue: email,
    },
    getAttribute: vi.fn((key) => (key === 'data-account-value' ? email : '')),
    prepend: vi.fn(),
    replaceChildren: vi.fn(),
  };
  const banner = {
    style: { display: 'none' },
    innerHTML: '',
    setAttribute: vi.fn(),
  };

  return { wrapper, banner };
};

const createFragmentNodeStub = () => ({
  dataset: {},
  querySelectorAll: () => [],
  setAttribute: () => {},
  innerHTML: '',
  innerText: '',
});

const AUTH_ERROR_CASES = [
  { code: 'auth/invalid-email', category: 'validation', messageKey: 'shared.authErrors.invalidEmail' },
  { code: 'auth/missing-email', category: 'validation', messageKey: 'shared.authErrors.missingEmail' },
  { code: 'missing_email', category: 'validation', messageKey: 'shared.authErrors.missingEmail' },
  { code: 'auth/invalid-continue-uri', category: 'validation', messageKey: 'shared.authErrors.default' },
  { code: 'auth/missing-continue-uri', category: 'validation', messageKey: 'shared.authErrors.default' },
  { code: 'auth/unauthorized-continue-uri', category: 'validation', messageKey: 'shared.authErrors.default' },
  { code: 'auth/operation-not-allowed', category: 'provider', messageKey: 'shared.authErrors.default' },
  { code: 'auth/invalid-phone-number', category: 'validation', messageKey: 'shared.authErrors.invalidPhoneNumber' },
  { code: 'auth/user-disabled', category: 'provider', messageKey: 'shared.authErrors.userDisabled' },
  { code: 'auth/network-request-failed', category: 'network', messageKey: 'shared.authErrors.networkRequestFailed' },
  { code: 'auth/too-many-requests', category: 'rate_limit', messageKey: 'shared.authErrors.tooManyRequests' },
  { code: 'auth/quota-exceeded', category: 'rate_limit', messageKey: 'shared.authErrors.default' },
];

beforeAll(async () => {
  vi.resetModules();
  vi.doUnmock('../js/shared.js');
  shared = await import('../js/shared.js');
});

describe('shared auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    if (!globalThis.HTMLElement) {
      globalThis.HTMLElement = class HTMLElement {};
    }
    if (!globalThis.DocumentFragment) {
      globalThis.DocumentFragment = class DocumentFragment {
        constructor() {
          this.children = [];
        }

        append(...nodes) {
          this.children.push(...nodes);
        }

        querySelectorAll() {
          return [];
        }
      };
    }
    if (!globalThis.DOMParser) {
      globalThis.DOMParser = class DOMParser {
        parseFromString() {
          return { body: { children: [createFragmentNodeStub()] } };
        }
      };
    }
    globalThis.window.DD_RUM = {
      addAction: vi.fn(),
      addError: vi.fn(),
    };
    globalThis.window.location.search = '';
    globalThis.window.location.href = 'http://localhost:3000/#';
    sharedRuntimeMocks.signInConfig.mockReturnValue({ callbacks: {} });
  });

  it('categorizes auth error codes for telemetry', () => {
    for (const testCase of AUTH_ERROR_CASES) {
      expect(shared.getAuthErrorCategory(testCase.code)).toBe(testCase.category);
    }
    expect(shared.getAuthErrorCategory('unknown')).toBe('unknown');
  });

  it('maps auth error codes to expected translation keys', () => {
    for (const testCase of AUTH_ERROR_CASES) {
      expect(shared.getAuthErrorMessageKey(testCase.code)).toBe(testCase.messageKey);
    }
  });

  it('logAuthIssue logs allowlisted errors to DD_RUM.addError with category', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('network down'), { code: 'auth/network-request-failed' });

    const result = shared.logAuthIssue({
      error,
      errorType: 'EmailLinkSendError',
      action: 'email_link_send_failure',
      context: { authMethod: 'email_link' },
    });

    expect(result).toEqual({
      errorCode: 'auth/network-request-failed',
      errorCategory: 'network',
    });
    expect(globalThis.window.DD_RUM.addError).toHaveBeenCalledTimes(1);
    expect(globalThis.window.DD_RUM.addAction).not.toHaveBeenCalledWith(
      'email_link_send_failure',
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('logAuthIssue logs non-allowlisted errors as actions', () => {
    const result = shared.logAuthIssue({
      error: Object.assign(new Error('invalid email'), { code: 'auth/invalid-email' }),
      errorType: 'EmailLinkSendError',
      action: 'email_link_send_failure',
      context: { flow: 'sign_in' },
    });

    expect(result).toEqual({
      errorCode: 'auth/invalid-email',
      errorCategory: 'validation',
    });
    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_failure',
      expect.objectContaining({
        flow: 'sign_in',
        errorCode: 'auth/invalid-email',
        errorCategory: 'validation',
      }),
    );
    expect(globalThis.window.DD_RUM.addError).not.toHaveBeenCalled();
  });

  it('sendEmailLink skips API call on magic-link callback URLs', async () => {
    const { wrapper, banner } = createAuthDomNodes();
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });
    globalThis.window.location.search = '?mode=signIn&oobCode=abc123&apiKey=firebase-key';
    globalThis.fetch = vi.fn();

    const result = await shared.sendEmailLink();

    expect(result).toEqual({
      skipped: true,
      reason: 'magic_link_callback_url',
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_skipped',
      expect.objectContaining({
        reason: 'magic_link_callback_url',
      }),
    );
  });

  it('sendEmailLink records auth ids, sends payload metadata, and logs failure context', async () => {
    const { wrapper, banner } = createAuthDomNodes();
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          errorCode: 'auth/invalid-email',
          graphRequestId: 'graph-request-1',
          graphClientRequestId: 'graph-client-1',
          graphErrorCode: 'bad_address',
        }),
    }));

    await expect(shared.sendEmailLink()).rejects.toThrow('sendEmailLink failed with status 400');

    const [, requestOptions] = globalThis.fetch.mock.calls[0];
    const requestPayload = JSON.parse(requestOptions.body);
    expect(requestPayload.email).toBe('person@example.com');
    expect(requestPayload.continueUrl).toBe('http://localhost:3000/');
    expect(requestPayload.authFlowId).toMatch(/^auth_flow_/);
    expect(requestPayload.authAttemptId).toMatch(/^auth_attempt_/);
    expect(requestPayload.clientSendTs).toMatch(/T/);
    expect(wrapper.dataset.authFlowId).toBe(requestPayload.authFlowId);
    expect(wrapper.dataset.authAttemptId).toBe(requestPayload.authAttemptId);
    expect(wrapper.dataset.authAttemptStartTs).toMatch(/^\d+$/);

    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_failure',
      expect.objectContaining({
        errorCode: 'auth/invalid-email',
        errorCategory: 'validation',
        providerRequestId: 'graph-request-1',
        providerClientRequestId: 'graph-client-1',
        providerErrorCode: 'bad_address',
      }),
    );
  });

  it('sendEmailLink logs success and renders post-send flow on 200 response', async () => {
    const { wrapper, banner } = createAuthDomNodes('person@example.com');
    banner.style.display = 'block';
    installDocumentByIdMap({
      signInDiv: {},
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });
    document.querySelector = vi.fn(() => ({ addEventListener: vi.fn() }));

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          messageId: 'message-1',
          provider: 'graph',
          graphRequestId: 'request-1',
          graphClientRequestId: 'client-1',
        }),
    }));

    const result = await shared.sendEmailLink();

    expect(result).toEqual({
      messageId: 'message-1',
      provider: 'graph',
      graphRequestId: 'request-1',
      graphClientRequestId: 'client-1',
    });
    expect(wrapper.replaceChildren).toHaveBeenCalledTimes(1);
    expect(banner.style.display).toBe('none');
    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_success',
      expect.objectContaining({
        authMethod: 'email_link',
        status: 200,
        messageId: 'message-1',
        providerRequestId: 'request-1',
        providerClientRequestId: 'client-1',
      }),
    );
  });

  it('sendEmailLink treats invalid JSON success payload as empty object', async () => {
    const { wrapper, banner } = createAuthDomNodes('json@example.com');
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
      signInDiv: {},
    });
    document.querySelector = vi.fn(() => ({ addEventListener: vi.fn() }));
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'not-json',
    }));

    const result = await shared.sendEmailLink();

    expect(result).toEqual({});
    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_success',
      expect.objectContaining({
        status: 200,
      }),
    );
  });

  it('sendEmailLink logs server-error failures from 500 responses', async () => {
    const { wrapper, banner } = createAuthDomNodes('servererror@example.com');
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () =>
        JSON.stringify({
          errorCode: 'auth/operation-not-allowed',
          message: 'Internal Server Error',
        }),
    }));

    await expect(shared.sendEmailLink()).rejects.toThrow('sendEmailLink failed with status 500');
    expect(globalThis.window.DD_RUM.addError).toHaveBeenCalledWith(
      'sendEmailLink failed with status 500',
      expect.objectContaining({
        error: expect.objectContaining({
          errorCode: 'auth/operation-not-allowed',
          errorCategory: 'provider',
          status: 500,
        }),
      }),
      'EmailLinkSendError',
    );
  });

  it('sendEmailLink logs network failures when fetch rejects', async () => {
    const { wrapper, banner } = createAuthDomNodes('networkerror@example.com');
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });
    const networkError = Object.assign(new Error('Simulated network error.'), {
      code: 'auth/network-request-failed',
      status: 0,
    });
    globalThis.fetch = vi.fn(async () => {
      throw networkError;
    });

    await expect(shared.sendEmailLink()).rejects.toThrow('Simulated network error.');
    expect(globalThis.window.DD_RUM.addError).toHaveBeenCalledTimes(1);
  });

  it('sendEmailLink rejects missing email and surfaces mapped auth error', async () => {
    const { wrapper, banner } = createAuthDomNodes('');
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });
    globalThis.fetch = vi.fn();

    await expect(shared.sendEmailLink()).rejects.toThrow('Missing sign-in email for magic link.');

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(banner.style.display).toBe('block');
    expect(banner.setAttribute).toHaveBeenCalledWith('data-i18n', 'shared.authErrors.missingEmail');
    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_failure',
      expect.objectContaining({
        errorCode: 'missing_email',
        errorCategory: 'validation',
      }),
    );
  });

  it('sendEmailLink suppresses duplicate in-flight requests for same email/url key', async () => {
    const { wrapper, banner } = createAuthDomNodes('duplicate@example.com');
    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      authErrorBanner: banner,
    });

    let resolveFetch;
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const firstRequest = shared.sendEmailLink();
    await Promise.resolve();

    const secondResult = await shared.sendEmailLink();
    expect(secondResult).toEqual({
      skipped: true,
      reason: 'duplicate_request_in_flight',
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    resolveFetch({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ errorCode: 'auth/too-many-requests' }),
    });
    await expect(firstRequest).rejects.toThrow('sendEmailLink failed with status 429');
  });

  it('sendEmailLink rejects with missing-email when wrapper div is unavailable', async () => {
    installDocumentByIdMap({
      authErrorBanner: {
        style: { display: 'none' },
        innerHTML: '',
        setAttribute: vi.fn(),
      },
    });
    globalThis.fetch = vi.fn();

    await expect(shared.sendEmailLink()).rejects.toThrow('Missing sign-in email for magic link.');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(globalThis.window.DD_RUM.addAction).toHaveBeenCalledWith(
      'email_link_send_failure',
      expect.objectContaining({
        errorCode: 'missing_email',
      }),
    );
  });

  it('getFirebaseUI loads localized script and returns AuthUI instance when absent', async () => {
    let scriptElement;
    const uiInstance = { start: vi.fn(), delete: vi.fn() };
    const AuthUI = vi.fn(() => uiInstance);
    AuthUI.getInstance = vi.fn(() => null);

    globalThis.firebase = { auth: vi.fn(() => ({ app: 'auth-app' })) };
    globalThis.firebaseui = {
      lang: '',
      auth: { AuthUI },
    };

    const doc = globalThis.document;
    doc.getElementById = vi.fn(() => null);
    doc.createElement = vi.fn(() => {
      scriptElement = {
        dataset: {},
        parentNode: { removeChild: vi.fn() },
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') {
            handler({ target: scriptElement });
          }
        }),
        setAttribute: vi.fn((key, value) => {
          if (key === 'data-i18n') scriptElement.dataset.i18n = value;
        }),
        getAttribute: vi.fn((key) => (key === 'src' ? scriptElement.src : '')),
      };
      return scriptElement;
    });
    doc.body = { appendChild: vi.fn() };

    const ui = await shared.getFirebaseUI();

    expect(doc.body.appendChild).toHaveBeenCalledTimes(1);
    expect(scriptElement.src).toContain('firebase-ui-auth__en.js');
    expect(scriptElement.dataset.i18n).toBe('en');
    expect(globalThis.firebaseui.lang).toBe('en');
    expect(AuthUI).toHaveBeenCalledTimes(1);
    expect(AuthUI).toHaveBeenCalledWith(expect.objectContaining({ app: 'auth-app' }));
    expect(ui).toBe(uiInstance);
  });

  it('getFirebaseUI replaces stale-language script and deletes existing AuthUI instance', async () => {
    let activeScript = {
      dataset: { i18n: 'es' },
      parentNode: {
        removeChild: vi.fn(() => {
          activeScript = null;
        }),
      },
      addEventListener: vi.fn(),
      getAttribute: vi.fn(() => ''),
    };
    const oldUi = { delete: vi.fn() };
    const freshUi = { start: vi.fn() };
    const AuthUI = vi.fn(() => freshUi);
    AuthUI.getInstance = vi
      .fn()
      .mockReturnValueOnce(oldUi)
      .mockReturnValueOnce(freshUi);
    globalThis.firebase = { auth: vi.fn(() => ({ app: 'auth-app' })) };
    globalThis.firebaseui = { lang: '', auth: { AuthUI } };

    const doc = globalThis.document;
    doc.getElementById = vi.fn((id) => (id === 'firebaseui-script' ? activeScript : null));
    doc.createElement = vi.fn(() => {
      const script = {
        dataset: {},
        parentNode: { removeChild: vi.fn() },
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') handler({ target: script });
        }),
        setAttribute: vi.fn((key, value) => {
          if (key === 'data-i18n') script.dataset.i18n = value;
        }),
        getAttribute: vi.fn((key) => (key === 'src' ? script.src : '')),
      };
      return script;
    });
    doc.body = { appendChild: vi.fn() };

    const ui = await shared.getFirebaseUI();

    expect(oldUi.delete).toHaveBeenCalledTimes(1);
    expect(doc.body.appendChild).toHaveBeenCalledTimes(1);
    expect(ui).toBe(freshUi);
  });

  it('getFirebaseUI rejects when script loading fails', async () => {
    let scriptElement;
    const AuthUI = vi.fn(() => ({ start: vi.fn() }));
    AuthUI.getInstance = vi.fn(() => null);
    globalThis.firebase = { auth: vi.fn(() => ({ app: 'auth-app' })) };
    globalThis.firebaseui = { lang: '', auth: { AuthUI } };

    const doc = globalThis.document;
    doc.getElementById = vi.fn(() => null);
    doc.createElement = vi.fn(() => {
      scriptElement = {
        dataset: {},
        addEventListener: vi.fn((event, handler) => {
          if (event === 'error') handler({ target: { getAttribute: () => scriptElement.src } });
        }),
        setAttribute: vi.fn((key, value) => {
          if (key === 'data-i18n') scriptElement.dataset.i18n = value;
        }),
        getAttribute: vi.fn((key) => (key === 'src' ? scriptElement.src : '')),
      };
      return scriptElement;
    });
    doc.body = { appendChild: vi.fn() };

    await expect(shared.getFirebaseUI()).rejects.toThrow('Error loading FirebaseUI script');
  });

  it('firebaseSignInRender wires email account values and autostarts submit', async () => {
    const wrapper = {
      replaceChildren: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    };
    const scriptTag = {
      dataset: { i18n: 'en' },
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') handler();
      }),
      parentNode: { removeChild: vi.fn() },
    };
    const emailInput = { value: '' };
    const emailLabel = { remove: vi.fn() };
    const submitButton = {
      addEventListener: vi.fn(),
      click: vi.fn(),
    };
    const uiInstance = { start: vi.fn() };
    const AuthUI = vi.fn(() => uiInstance);
    AuthUI.getInstance = vi.fn(() => uiInstance);
    globalThis.firebase = { auth: vi.fn(() => ({ app: 'auth-app' })) };
    globalThis.firebaseui = { lang: '', auth: { AuthUI } };

    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      'firebaseui-script': scriptTag,
    });
    document.querySelector = vi.fn((selector) => {
      if (selector === 'input[class~="firebaseui-id-email"]') return emailInput;
      if (selector === 'label[class~="firebaseui-label"]') return emailLabel;
      if (selector === 'button[class~="firebaseui-id-submit"]') return submitButton;
      return null;
    });

    await shared.firebaseSignInRender({ account: { type: 'email', value: 'person@example.com' } });

    expect(sharedRuntimeMocks.signInConfig).toHaveBeenCalledWith('email');
    expect(uiInstance.start).toHaveBeenCalledWith('#signInDiv', expect.any(Object));
    expect(wrapper.setAttribute).toHaveBeenCalledWith('data-ui-type', 'signIn');
    expect(wrapper.setAttribute).toHaveBeenCalledWith('data-account-type', 'email');
    expect(wrapper.setAttribute).toHaveBeenCalledWith('data-account-value', 'person@example.com');
    expect(emailInput.value).toBe('person@example.com');
    expect(emailLabel.remove).toHaveBeenCalledTimes(1);
    expect(submitButton.click).toHaveBeenCalledTimes(1);
  });

  it('firebaseSignInRender wires phone account values and title localization', async () => {
    const wrapper = {
      replaceChildren: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    };
    const scriptTag = {
      dataset: { i18n: 'en' },
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') handler();
      }),
      parentNode: { removeChild: vi.fn() },
    };
    const phoneInput = { value: '' };
    const phoneLabel = { remove: vi.fn() };
    const title = { innerText: '', setAttribute: vi.fn() };
    const uiInstance = { start: vi.fn() };
    const AuthUI = vi.fn(() => uiInstance);
    AuthUI.getInstance = vi.fn(() => uiInstance);
    globalThis.firebase = { auth: vi.fn(() => ({ app: 'auth-app' })) };
    globalThis.firebaseui = { lang: '', auth: { AuthUI } };

    installDocumentByIdMap({
      signInWrapperDiv: wrapper,
      'firebaseui-script': scriptTag,
    });
    document.querySelector = vi.fn((selector) => {
      if (selector === 'input[class~="firebaseui-id-phone-number"]') return phoneInput;
      if (selector === 'label[class~="firebaseui-label"]') return phoneLabel;
      if (selector === 'h1[class~="firebaseui-title"]') return title;
      return null;
    });

    await shared.firebaseSignInRender({ account: { type: 'phone', value: '3035551212' } });

    expect(sharedRuntimeMocks.signInConfig).toHaveBeenCalledWith('phone');
    expect(uiInstance.start).toHaveBeenCalledWith('#signInDiv', expect.any(Object));
    expect(phoneInput.value).toBe('3035551212');
    expect(phoneLabel.remove).toHaveBeenCalledTimes(1);
    expect(title.innerText).toBe(shared.translateText('shared.signInPhone'));
    expect(title.setAttribute).toHaveBeenCalledWith('data-i18n', 'shared.signInPhone');
  });
});

// userLoggedIn

describe('userLoggedIn', () => {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = vi.fn();
    globalThis.firebase = {
      auth: () => ({
        onAuthStateChanged: vi.fn((callback) => {
          globalThis._authCallback = callback;
          return unsubscribe;
        }),
      }),
    };
  });

  afterAll(() => {
    delete globalThis.firebase;
    delete globalThis._authCallback;
  });

  it('resolves true for non-anonymous user', async () => {
    const promise = shared.userLoggedIn();
    globalThis._authCallback({ isAnonymous: false });
    const result = await promise;
    expect(result).toBe(true);
  });

  it('resolves false for anonymous user', async () => {
    const promise = shared.userLoggedIn();
    globalThis._authCallback({ isAnonymous: true });
    const result = await promise;
    expect(result).toBe(false);
  });

  it('resolves false for null user', async () => {
    const promise = shared.userLoggedIn();
    globalThis._authCallback(null);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('calls unsubscribe after first callback (one-shot behavior)', async () => {
    const promise = shared.userLoggedIn();
    globalThis._authCallback({ isAnonymous: false });
    await promise;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

// isMagicLinkCallbackUrl

describe('isMagicLinkCallbackUrl', () => {
  afterEach(() => {
    teardownTestEnvironment();
  });

  it('returns true when mode=signIn, oobCode, and apiKey are all present', () => {
    setupTestEnvironment({
      location: { search: '?mode=signIn&oobCode=abc123&apiKey=key456' },
    });

    expect(shared.isMagicLinkCallbackUrl()).toBe(true);
  });

  it('returns false when oobCode is missing', () => {
    setupTestEnvironment({
      location: { search: '?mode=signIn&apiKey=key456' },
    });

    expect(shared.isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false when apiKey is missing', () => {
    setupTestEnvironment({
      location: { search: '?mode=signIn&oobCode=abc123' },
    });

    expect(shared.isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false when mode is missing', () => {
    setupTestEnvironment({
      location: { search: '?oobCode=abc123&apiKey=key456' },
    });

    expect(shared.isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false for mode=verifyEmail (email verification, not magic link)', () => {
    setupTestEnvironment({
      location: { search: '?mode=verifyEmail&oobCode=abc123&apiKey=key456' },
    });

    expect(shared.isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false when search is empty', () => {
    setupTestEnvironment({
      location: { search: '' },
    });

    expect(shared.isMagicLinkCallbackUrl()).toBe(false);
  });
});
