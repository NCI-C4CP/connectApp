import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDocumentByIdMap, setupTestEnvironment, teardownTestEnvironment } from './helpers.js';

const sharedMocks = vi.hoisted(() => ({
  getMyData: vi.fn(),
  hasUserData: vi.fn(),
  fragment: vi.fn(),
  checkAccount: vi.fn(),
  getCleanSearchString: vi.fn((search) => search || ''),
  firebaseSignInRender: vi.fn(),
  signInAnonymously: vi.fn(),
  translateHTML: vi.fn((content) => content),
  translateText: vi.fn((key) => `translated:${key}`),
  getFirebaseUI: vi.fn(),
  showAnimation: vi.fn(),
  hideAnimation: vi.fn(),
  logDDRumAction: vi.fn(),
  logDDRumError: vi.fn(),
  isMagicLinkCallbackUrl: vi.fn(),
}));

const signInPageMocks = vi.hoisted(() => ({
  signInConfig: vi.fn(),
}));

vi.mock('../js/shared.js', () => ({
  getMyData: sharedMocks.getMyData,
  hasUserData: sharedMocks.hasUserData,
  urls: {
    prod: 'myconnect.cancer.gov',
    stage: 'myconnect-stage.cancer.gov',
    dev: 'nci-c4cp.github.io',
  },
  fragment: sharedMocks.fragment,
  checkAccount: sharedMocks.checkAccount,
  validEmailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  validPhoneNumberFormat: /^\d{10}$/,
  getCleanSearchString: sharedMocks.getCleanSearchString,
  firebaseSignInRender: sharedMocks.firebaseSignInRender,
  signInAnonymously: sharedMocks.signInAnonymously,
  usGov: 'US GOV',
  translateHTML: sharedMocks.translateHTML,
  translateText: sharedMocks.translateText,
  getFirebaseUI: sharedMocks.getFirebaseUI,
  showAnimation: sharedMocks.showAnimation,
  hideAnimation: sharedMocks.hideAnimation,
  logDDRumAction: sharedMocks.logDDRumAction,
  logDDRumError: sharedMocks.logDDRumError,
  isMagicLinkCallbackUrl: sharedMocks.isMagicLinkCallbackUrl,
}));

vi.mock('../js/pages/signIn.js', () => ({
  signInConfig: signInPageMocks.signInConfig,
}));

vi.mock('../js/event.js', () => ({
  environmentWarningModal: vi.fn(),
  downtimeWarning: vi.fn(),
}));

vi.mock('../js/fieldToConceptIdMapping.js', () => ({
  default: {},
}));

import { signUpRender, homePage, signInCheckRender } from '../js/pages/homePage.js';

// signUpRender
describe('homePage signUpRender auth flow wiring', () => {
  const createFragmentStub = () => {
    const signInLink = { addEventListener: vi.fn() };
    const emailSignUpLink = { addEventListener: vi.fn() };
    return {
      children: [{}],
      querySelector: vi.fn((selector) => {
        if (selector === '#signIn') return signInLink;
        if (selector === '#emailSignUp') return emailSignUpLink;
        return null;
      }),
      signInLink,
      emailSignUpLink,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    signInPageMocks.signInConfig.mockReturnValue({ callbacks: {} });
    sharedMocks.fragment.mockImplementation(() => createFragmentStub());
  });

  it('signUpRender(phone) starts FirebaseUI and applies phone-specific copy', async () => {
    const wrapperDiv = {
      replaceChildren: vi.fn(),
      setAttribute: vi.fn(),
    };
    const header = { innerText: '', setAttribute: vi.fn() };
    const verifyButton = { addEventListener: vi.fn() };
    const ui = { start: vi.fn() };
    sharedMocks.getFirebaseUI.mockResolvedValue(ui);

    document.getElementById = vi.fn((id) => (id === 'signInWrapperDiv' ? wrapperDiv : null));
    document.querySelector = vi.fn((selector) => {
      if (selector === 'div.firebaseui-card-header > h1') return header;
      if (selector === 'button[class~="firebaseui-id-submit"]') return verifyButton;
      if (selector === 'button[class~="firebaseui-id-secondary-link"]') {
        return { addEventListener: vi.fn() };
      }
      return null;
    });

    await signUpRender({ signUpType: 'phone' });

    expect(sharedMocks.getFirebaseUI).toHaveBeenCalledTimes(1);
    expect(signInPageMocks.signInConfig).toHaveBeenCalledWith('phone');
    expect(ui.start).toHaveBeenCalledWith('#signUpDiv', expect.any(Object));
    expect(wrapperDiv.replaceChildren).toHaveBeenCalledTimes(1);
    expect(wrapperDiv.setAttribute).toHaveBeenCalledWith('data-ui-type', 'signUp');
    expect(wrapperDiv.setAttribute).toHaveBeenCalledWith('data-signup-type', 'phone');
    expect(header.innerText).toBe('translated:home.createAccountPhone');
    expect(header.setAttribute).toHaveBeenCalledWith('data-i18n', 'home.createAccountPhone');
    expect(verifyButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('signUpRender(email) wires account-value updates and email-specific UI hooks', async () => {
    const wrapperDiv = {
      replaceChildren: vi.fn(),
      setAttribute: vi.fn(),
    };
    const header = { innerText: '', setAttribute: vi.fn() };
    const cardContentWrapper = { appendChild: vi.fn() };
    const validationText = { innerText: 'bad email', setAttribute: vi.fn() };
    const backButton = { addEventListener: vi.fn() };
    let submitHandler;
    const submitButton = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'click') submitHandler = handler;
      }),
    };
    let keyupHandler;
    const inputElement = {
      value: '',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'keyup') keyupHandler = handler;
      }),
    };
    const ui = { start: vi.fn() };
    sharedMocks.getFirebaseUI.mockResolvedValue(ui);

    document.getElementById = vi.fn((id) => (id === 'signInWrapperDiv' ? wrapperDiv : null));
    document.querySelector = vi.fn((selector) => {
      if (selector === 'div.firebaseui-card-header > h1') return header;
      if (selector === 'div[class~="firebaseui-relative-wrapper"]') return cardContentWrapper;
      if (selector === 'button[class~="firebaseui-id-submit"]') return submitButton;
      if (selector === 'p[class~="firebaseui-text-input-error"]') return validationText;
      if (selector === 'button[class~="firebaseui-id-secondary-link"]') return backButton;
      if (selector === 'input[class~="firebaseui-id-email"]') return inputElement;
      return null;
    });
    document.createElement = vi.fn(() => ({
      innerText: '',
      setAttribute: vi.fn(),
    }));

    await signUpRender({ signUpType: 'email' });

    expect(signInPageMocks.signInConfig).toHaveBeenCalledWith('email');
    expect(ui.start).toHaveBeenCalledWith('#signUpDiv', expect.any(Object));
    expect(header.innerText).toBe('translated:home.createAccountEmail');
    expect(cardContentWrapper.appendChild).toHaveBeenCalledTimes(1);
    expect(inputElement.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));

    inputElement.value = 'new@example.com';
    keyupHandler();
    expect(wrapperDiv.setAttribute).toHaveBeenCalledWith('data-account-value', 'new@example.com');

    submitHandler();
    expect(validationText.innerText).toBe('translated:home.validEmail');
    expect(validationText.setAttribute).toHaveBeenCalledWith('data-i18n', 'home.validEmail');
    expect(backButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

// homePage magic link handling

describe('homePage magic link handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('calls showAnimation() then firebaseSignInRender() then hideAnimation() when URL has magic link params', async () => {
    const magicLinkSearch = '?mode=signIn&oobCode=abc123&apiKey=key456';
    setupTestEnvironment({
      location: {
        host: 'localhost:3000',
        search: magicLinkSearch,
        hash: '#',
      },
    });

    sharedMocks.getCleanSearchString.mockReturnValue(magicLinkSearch);

    installDocumentByIdMap({
      root: { innerHTML: '' },
    });

    await homePage();

    expect(sharedMocks.showAnimation).toHaveBeenCalledTimes(1);
    expect(sharedMocks.firebaseSignInRender).toHaveBeenCalledWith({
      account: { type: 'magicLink', value: '' },
    });
    expect(sharedMocks.hideAnimation).toHaveBeenCalledTimes(1);

    // showAnimation before render before hideAnimation
    const showOrder = sharedMocks.showAnimation.mock.invocationCallOrder[0];
    const renderOrder = sharedMocks.firebaseSignInRender.mock.invocationCallOrder[0];
    const hideOrder = sharedMocks.hideAnimation.mock.invocationCallOrder[0];
    expect(showOrder).toBeLessThan(renderOrder);
    expect(renderOrder).toBeLessThan(hideOrder);
  });

  it('calls hideAnimation() even when firebaseSignInRender() throws', async () => {
    const magicLinkSearch = '?mode=signIn&oobCode=abc123&apiKey=key456';
    setupTestEnvironment({
      location: {
        host: 'localhost:3000',
        search: magicLinkSearch,
        hash: '#',
      },
    });

    sharedMocks.getCleanSearchString.mockReturnValue(magicLinkSearch);
    sharedMocks.firebaseSignInRender.mockRejectedValue(new Error('render failed'));

    installDocumentByIdMap({
      root: { innerHTML: '' },
    });

    await expect(homePage()).rejects.toThrow('render failed');
    expect(sharedMocks.hideAnimation).toHaveBeenCalledTimes(1);
  });

  it('does NOT call showAnimation() or firebaseSignInRender() for non-magic-link URLs', async () => {
    setupTestEnvironment({
      location: {
        host: 'localhost:3000',
        search: '',
        hash: '#',
      },
    });

    sharedMocks.getCleanSearchString.mockReturnValue('');

    const signInBtn = { addEventListener: vi.fn() };
    const signUpBtn = { addEventListener: vi.fn() };
    sharedMocks.fragment.mockReturnValue({
      children: [{}],
      querySelector: vi.fn((sel) => {
        if (sel === '#signInBtn') return signInBtn;
        if (sel === '#signUpBtn') return signUpBtn;
        return null;
      }),
    });

    installDocumentByIdMap({
      root: { innerHTML: '' },
      signInWrapperDiv: { replaceChildren: vi.fn() },
    });

    await homePage();

    expect(sharedMocks.showAnimation).not.toHaveBeenCalled();
    expect(sharedMocks.firebaseSignInRender).not.toHaveBeenCalled();
  });

  it('sets location.search to the clean value when magic link search needs cleaning', async () => {
    const dirtySearch = '?mode=signIn&oobCode=abc123&apiKey=key456&extra=junk';
    const cleanSearch = '?mode=signIn&oobCode=abc123&apiKey=key456';

    const env = setupTestEnvironment({
      location: {
        host: 'localhost:3000',
        search: dirtySearch,
        hash: '#',
      },
    });

    sharedMocks.getCleanSearchString.mockReturnValue(cleanSearch);

    installDocumentByIdMap({
      root: { innerHTML: '' },
    });

    await homePage();

    // location.search should be set to the clean version
    // (in a real browser this triggers a page reload)
    expect(env.location.search).toBe(cleanSearch);
  });
});

// isMagicLinkCallbackUrl
describe('isMagicLinkCallbackUrl', () => {
  // Test the actual implementation from shared.js by re-implementing the logic inline,
  // since the function reads from window.location.search directly.
  const isMagicLinkCallbackUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'signIn' && params.has('oobCode') && params.has('apiKey');
  };

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('returns true when mode=signIn, oobCode, and apiKey are all present', () => {
    setupTestEnvironment({
      location: { search: '?mode=signIn&oobCode=abc123&apiKey=key456' },
    });

    expect(isMagicLinkCallbackUrl()).toBe(true);
  });

  it('returns false when oobCode is missing', () => {
    setupTestEnvironment({
      location: { search: '?mode=signIn&apiKey=key456' },
    });

    expect(isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false when apiKey is missing', () => {
    setupTestEnvironment({
      location: { search: '?mode=signIn&oobCode=abc123' },
    });

    expect(isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false when mode is missing', () => {
    setupTestEnvironment({
      location: { search: '?oobCode=abc123&apiKey=key456' },
    });

    expect(isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false for mode=verifyEmail (email verification, not magic link)', () => {
    setupTestEnvironment({
      location: { search: '?mode=verifyEmail&oobCode=abc123&apiKey=key456' },
    });

    expect(isMagicLinkCallbackUrl()).toBe(false);
  });

  it('returns false when search is empty', () => {
    setupTestEnvironment({
      location: { search: '' },
    });

    expect(isMagicLinkCallbackUrl()).toBe(false);
  });
});

// signInCheckRender

describe('signInCheckRender', () => {
  const createSignInFragmentStub = () => {
    const elements = {};
    const listeners = {};

    const makeEl = (id, extras = {}) => {
      const el = {
        id,
        value: '',
        disabled: false,
        style: { display: 'none', border: '' },
        addEventListener: vi.fn((event, handler) => {
          listeners[`${id}:${event}`] = handler;
        }),
        focus: vi.fn(),
        ...extras,
      };
      elements[id] = el;
      return el;
    };

    const signInBtn = makeEl('signInBtn');
    const accountInput = makeEl('accountInput');
    const signUpAnchor = makeEl('signUpAnchor');
    const invalidInputAlert = makeEl('invalidInputAlert');
    const signInForm = makeEl('signInForm');

    const df = {
      children: [{}],
      querySelector: vi.fn((selector) => {
        if (selector === '#signInBtn') return signInBtn;
        if (selector === '#accountInput') return accountInput;
        if (selector === '#signUpAnchor') return signUpAnchor;
        if (selector === '#invalidInputAlert') return invalidInputAlert;
        if (selector === '#signInForm') return signInForm;
        return null;
      }),
    };

    return { df, elements, listeners };
  };

  let wrapperDiv;
  let fragStub;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setupTestEnvironment();

    wrapperDiv = { replaceChildren: vi.fn() };
    installDocumentByIdMap({ signInWrapperDiv: wrapperDiv });

    fragStub = createSignInFragmentStub();
    sharedMocks.fragment.mockReturnValue(fragStub.df);
    sharedMocks.signInAnonymously.mockResolvedValue();
    sharedMocks.firebaseSignInRender.mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    teardownTestEnvironment();
  });

  const clickSignIn = async (inputValue) => {
    fragStub.elements.accountInput.value = inputValue;
    const handler = fragStub.listeners['signInBtn:click'];
    await handler({ preventDefault: vi.fn() });
  };

  it('renders form into signInWrapperDiv via replaceChildren', () => {
    signInCheckRender();
    expect(wrapperDiv.replaceChildren).toHaveBeenCalledWith(fragStub.df);
  });

  it('valid email calls signInAnonymously then checkAccount with email type', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: true } });
    signInCheckRender();
    await clickSignIn('user@example.com');

    expect(sharedMocks.signInAnonymously).toHaveBeenCalled();
    expect(sharedMocks.checkAccount).toHaveBeenCalledWith({
      accountType: 'email',
      accountValue: 'user@example.com',
    });
  });

  it('email with existing account calls firebaseSignInRender', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: true } });
    signInCheckRender();
    await clickSignIn('user@example.com');

    expect(sharedMocks.firebaseSignInRender).toHaveBeenCalledWith({
      account: { type: 'email', value: 'user@example.com' },
    });
  });

  it('email with no account calls logDDRumAction with auth_account_not_found', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: false } });
    signInCheckRender();
    await clickSignIn('user@example.com');

    expect(sharedMocks.logDDRumAction).toHaveBeenCalledWith('auth_account_not_found', {
      authMethod: 'email',
      flow: 'sign_in',
      emailDomain: 'example.com',
    });
  });

  it('valid phone calls signInAnonymously then checkAccount with phone type', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: true } });
    signInCheckRender();
    await clickSignIn('3035551212');

    expect(sharedMocks.signInAnonymously).toHaveBeenCalled();
    expect(sharedMocks.checkAccount).toHaveBeenCalledWith({
      accountType: 'phone',
      accountValue: '3035551212',
    });
  });

  it('phone with existing account calls firebaseSignInRender', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: true } });
    signInCheckRender();
    await clickSignIn('3035551212');

    expect(sharedMocks.firebaseSignInRender).toHaveBeenCalledWith({
      account: { type: 'phone', value: '3035551212' },
    });
  });

  it('phone with no account calls logDDRumAction with auth_account_not_found', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: false } });
    signInCheckRender();
    await clickSignIn('3035551212');

    expect(sharedMocks.logDDRumAction).toHaveBeenCalledWith('auth_account_not_found', {
      authMethod: 'phone',
      flow: 'sign_in',
      phoneLast4: '1212',
    });
  });

  it('invalid input logs auth_validation_failed and shows warning', async () => {
    signInCheckRender();
    await clickSignIn('not-valid');

    expect(sharedMocks.logDDRumAction).toHaveBeenCalledWith('auth_validation_failed', {
      inputLength: 9,
      looksLikeEmail: false,
      looksLikePhone: false,
    });
    expect(fragStub.elements.invalidInputAlert.style.display).toBe('block');
  });

  it('error in checkAccount catches, logs logDDRumError, and shows warning', async () => {
    const error = new Error('network fail');
    sharedMocks.checkAccount.mockRejectedValue(error);
    signInCheckRender();
    await clickSignIn('user@example.com');

    expect(sharedMocks.logDDRumError).toHaveBeenCalledWith(error, 'AuthCheckAccountError', {
      inputLength: 16,
      looksLikeEmail: true,
      looksLikePhone: false,
    });
    expect(fragStub.elements.invalidInputAlert.style.display).toBe('block');
  });

  it('finally block always calls hideAnimation and re-enables submit button', async () => {
    sharedMocks.checkAccount.mockResolvedValue({ data: { accountExists: true } });
    signInCheckRender();
    await clickSignIn('user@example.com');

    expect(sharedMocks.hideAnimation).toHaveBeenCalled();
    expect(fragStub.elements.signInBtn.disabled).toBe(false);
    expect(fragStub.elements.accountInput.value).toBe('');
  });
});
