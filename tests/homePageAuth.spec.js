import { beforeEach, describe, expect, it, vi } from 'vitest';

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
}));

vi.mock('../js/pages/signIn.js', () => ({
  signInConfig: signInPageMocks.signInConfig,
}));

vi.mock('../js/event.js', () => ({
  environmentWarningModal: vi.fn(),
  downtimeWarning: vi.fn(),
}));

import { signUpRender } from '../js/pages/homePage.js';

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
