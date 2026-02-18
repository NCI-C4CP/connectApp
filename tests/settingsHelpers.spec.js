import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import cId from '../js/fieldToConceptIdMapping.js';
import { installDocumentByIdMap } from './helpers.js';
import { eventModuleMocks, registerSettingsHelpersModuleMocks, settingsSharedMocks } from './moduleMocks.js';

registerSettingsHelpersModuleMocks();

let settingsHelpers;

beforeAll(async () => {
  settingsHelpers = await import('../js/settingsHelpers.js');
});

describe('settingsHelpers', () => {
  const buildBaseUserData = (overrides = {}) => ({
    [cId.userProfileHistory]: [],
    [cId.prefEmail]: 'existing@example.com',
    [cId.firebaseAuthEmail]: 'existing@example.com',
    [cId.firebaseAuthPhone]: '',
    Connect_ID: 'CONNECT-1',
    ...overrides,
  });

  const buildLoginUpdateDom = () => ({
    loginUpdateFail: { style: { display: 'initial' } },
    loginUpdateSuccess: { style: { display: 'initial' } },
    changeLoginGroup: { style: { display: 'initial' } },
    changePhoneSubmit: { style: { display: 'initial' } },
    loginUpdateError: { innerHTML: '' },
  });

  const buildFirebasePhoneUpdateStubs = ({ existingPhone = null } = {}) => {
    const recaptcha = { clear: vi.fn() };
    const verifyPhoneNumber = vi.fn(async () => 'verification-id');
    const phoneAuthProviderCtor = vi.fn(function PhoneAuthProvider() {
      return {
        verifyPhoneNumber,
      };
    });
    phoneAuthProviderCtor.credential = vi.fn((verificationId, verificationCode) => ({
      verificationId,
      verificationCode,
    }));

    const currentUser = {
      uid: 'uid-123',
      email: 'existing@example.com',
      phoneNumber: existingPhone,
      linkWithCredential: vi.fn(async () => {}),
      updateEmail: vi.fn(async () => {}),
    };

    const authFn = vi.fn(() => ({ currentUser }));
    authFn.RecaptchaVerifier = vi.fn(() => recaptcha);
    authFn.PhoneAuthProvider = phoneAuthProviderCtor;

    globalThis.firebase = {
      auth: authFn,
    };

    return { currentUser, recaptcha, verifyPhoneNumber, phoneAuthProviderCtor };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    settingsSharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue({ code: 200 });
    settingsSharedMocks.getAuthErrorMessageKey.mockReturnValue('shared.authErrors.default');
    settingsSharedMocks.logAuthIssue.mockReturnValue({
      errorCode: 'mock/error',
      errorCategory: 'unknown',
    });
    settingsSharedMocks.createTelemetryId
      .mockReturnValueOnce('auth_flow_test')
      .mockReturnValueOnce('auth_attempt_test');
  });

  it('toggleElementVisibility toggles display values and returns toggled form state', () => {
    const first = { style: { display: 'none' } };
    const second = { style: { display: 'block' } };

    const isFormDisplayed = settingsHelpers.toggleElementVisibility([first, second, null], false);

    expect(isFormDisplayed).toBe(true);
    expect(first.style.display).toBe('block');
    expect(second.style.display).toBe('none');
  });

  it('formatFirebaseAuthPhoneNumber returns formatted value when profile number matches auth number', () => {
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          phoneNumber: '+13035551234',
        },
      }),
    };

    expect(settingsHelpers.formatFirebaseAuthPhoneNumber('+13035551234')).toBe('303-555-1234');
    expect(settingsHelpers.formatFirebaseAuthPhoneNumber('3035551234')).toBe('');
    expect(settingsHelpers.formatFirebaseAuthPhoneNumber('1111111111')).toBe('');
  });

  it('getCheckedRadioButtonValue maps checked state to cId yes/no values', () => {
    installDocumentByIdMap({ radioYes: { checked: true } });
    expect(settingsHelpers.getCheckedRadioButtonValue('radioYes')).toBe(cId.yes);

    installDocumentByIdMap({ radioYes: { checked: false } });
    expect(settingsHelpers.getCheckedRadioButtonValue('radioYes')).toBe(cId.no);
  });

  it('validateLoginEmail returns false and alerts when emails do not match', () => {
    globalThis.alert = vi.fn();

    const isValid = settingsHelpers.validateLoginEmail('person@example.com', 'person2@example.com');

    expect(isValid).toBe(false);
    expect(globalThis.alert).toHaveBeenCalledWith('translated:settingsHelpers.errorEmailsDoNotMatch');
  });

  it('validateLoginPhone validates phone format and alerts on invalid input', () => {
    globalThis.alert = vi.fn();

    expect(settingsHelpers.validateLoginPhone('3035551234', '3035551234')).toBe(true);
    expect(settingsHelpers.validateLoginPhone('30355', '30355')).toBe(false);
    expect(globalThis.alert).toHaveBeenCalledWith('translated:settingsHelpers.errorPhoneFormat');
  });

  it('validateName reports required first name errors', () => {
    const firstNameField = {
      id: 'newFirstNameField',
      value: '',
      dataset: {
        validationPattern: 'alphabets',
        errorValidation: 'Name validation failed',
      },
    };
    const lastNameField = {
      id: 'newLastNameField',
      value: 'Doe',
      dataset: {
        validationPattern: 'alphabets',
        errorValidation: 'Name validation failed',
      },
    };

    const isValid = settingsHelpers.validateName(firstNameField, lastNameField);

    expect(isValid).toBe(false);
    expect(eventModuleMocks.removeAllErrors).toHaveBeenCalledTimes(1);
    expect(settingsSharedMocks.errorMessage).toHaveBeenCalledWith(
      'newFirstNameField',
      'translated:settingsHelpers.enterFirstName',
      true,
    );
  });

  it('addOrUpdateAuthenticationMethod logs successful phone auth credential updates', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const { currentUser, recaptcha, phoneAuthProviderCtor } = buildFirebasePhoneUpdateStubs({ existingPhone: null });
    globalThis.window.prompt = vi.fn(() => '654321');
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const userData = {
      [cId.userProfileHistory]: [],
      [cId.prefEmail]: 'existing@example.com',
      [cId.firebaseAuthEmail]: 'existing@example.com',
      [cId.firebaseAuthPhone]: '',
    };

    const isSuccess = await settingsHelpers.addOrUpdateAuthenticationMethod(null, '303-555-1234', userData);

    expect(isSuccess).toBe(true);
    expect(phoneAuthProviderCtor.credential).toHaveBeenCalledWith('verification-id', '654321');
    expect(currentUser.linkWithCredential).toHaveBeenCalledWith({
      verificationId: 'verification-id',
      verificationCode: '654321',
    });
    expect(recaptcha.clear).toHaveBeenCalledTimes(1);
    expect(settingsSharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'phone_auth_settings_success',
      expect.objectContaining({
        authFlowId: 'auth_flow_test',
        authAttemptId: 'auth_attempt_test',
        phoneLast4: '1234',
      }),
    );
    expect(settingsSharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'auth_attempt_completed',
      expect.objectContaining({
        outcome: 'success',
      }),
    );
    expect(settingsSharedMocks.storeResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        [cId.firebaseAuthPhone]: '+13035551234',
        [cId.firebaseSignInMechanism]: 'passwordAndPhone',
      }),
    );
    expect(dom.changePhoneSubmit.style.display).toBe('none');
  });

  it('addOrUpdateAuthenticationMethod logs and rethrows phone verification cancellation', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const { recaptcha } = buildFirebasePhoneUpdateStubs({ existingPhone: null });
    globalThis.window.prompt = vi.fn(() => '');
    settingsSharedMocks.logAuthIssue.mockReturnValue({
      errorCode: 'auth/missing-verification-code',
      errorCategory: 'validation',
    });
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const userData = {
      [cId.userProfileHistory]: [],
      [cId.prefEmail]: 'existing@example.com',
      [cId.firebaseAuthEmail]: 'existing@example.com',
    };

    await expect(
      settingsHelpers.addOrUpdateAuthenticationMethod(null, '3035551234', userData),
    ).rejects.toThrow('Verification code not provided');

    expect(settingsSharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'phone_auth_cancelled',
      expect.objectContaining({
        errorCode: 'auth/missing-verification-code',
        errorCategory: 'validation',
      }),
    );
    expect(settingsSharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'PhoneAuthSettingsError',
        action: 'phone_auth_settings_failure',
      }),
    );
    expect(settingsSharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'auth_attempt_completed',
      expect.objectContaining({
        outcome: 'failure',
        errorCode: 'auth/missing-verification-code',
        errorCategory: 'validation',
      }),
    );
    expect(dom.changePhoneSubmit.style.display).toBe('block');
    expect(recaptcha.clear).toHaveBeenCalledTimes(1);
  });

  it('unlinkFirebaseAuthProvider maps provider errors to translated UI message', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    settingsSharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue({
      code: 400,
      errorCode: 'auth/user-disabled',
      message: 'Raw service message',
    });
    settingsSharedMocks.getAuthErrorMessageKey.mockReturnValue('shared.authErrors.userDisabled');

    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'uid-abc',
          email: 'existing@example.com',
          phoneNumber: '+13035550123',
        },
      }),
    };

    const result = await settingsHelpers.unlinkFirebaseAuthProvider(
      'phone',
      { [cId.firebaseAuthEmail]: 'existing@example.com' },
      '+13035550123',
      false,
    );

    expect(result).toBe('translated:shared.authErrors.userDisabled');
    expect(dom.loginUpdateFail.style.display).toBe('block');
    expect(dom.loginUpdateError.innerHTML).toBe('translated:shared.authErrors.userDisabled');
    expect(settingsSharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'phone_auth_unlink_failure',
      expect.objectContaining({
        errorCode: 'auth/user-disabled',
      }),
    );
  });

  it('addOrUpdateAuthenticationMethod unlinks existing phone before linking new credential', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const { currentUser } = buildFirebasePhoneUpdateStubs({ existingPhone: '+13035559999' });
    globalThis.window.prompt = vi.fn(() => '777777');

    const userData = {
      [cId.userProfileHistory]: [],
      [cId.prefEmail]: 'existing@example.com',
      [cId.firebaseAuthEmail]: 'existing@example.com',
      [cId.firebaseAuthPhone]: '+13035559999',
      Connect_ID: 'CONNECT-42',
    };

    const isSuccess = await settingsHelpers.addOrUpdateAuthenticationMethod(null, '303-555-1234', userData);

    expect(isSuccess).toBe(true);
    expect(settingsSharedMocks.processAuthWithFirebaseAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'uid-123',
        flag: 'replaceSignin',
        email: 'existing@example.com',
      }),
    );
    expect(settingsSharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'phone_auth_unlink_success',
      expect.objectContaining({
        authMethod: 'phone',
        flow: 'settings_unlink',
      }),
    );
    expect(currentUser.linkWithCredential).toHaveBeenCalledTimes(1);
  });

  it('addOrUpdateAuthenticationMethod lowercases login email and stores password mechanism', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const currentUser = {
      uid: 'uid-321',
      email: 'existing@example.com',
      phoneNumber: null,
      updateEmail: vi.fn(async () => {}),
    };
    globalThis.firebase = {
      auth: () => ({ currentUser }),
    };

    const isSuccess = await settingsHelpers.addOrUpdateAuthenticationMethod('User@Example.COM', null, buildBaseUserData());

    expect(isSuccess).toBe(true);
    expect(currentUser.updateEmail).toHaveBeenCalledWith('user@example.com');
    expect(settingsSharedMocks.storeResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        [cId.firebaseAuthEmail]: 'user@example.com',
        [cId.firebaseSignInMechanism]: 'password',
      }),
    );
    expect(dom.changeLoginGroup.style.display).toBe('none');
  });

  it('addOrUpdateAuthenticationMethod stores passwordAndPhone when email is added and phone already exists', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const currentUser = {
      uid: 'uid-555',
      email: 'existing@example.com',
      phoneNumber: '+13035551234',
      updateEmail: vi.fn(async () => {}),
    };
    globalThis.firebase = {
      auth: () => ({ currentUser }),
    };

    const isSuccess = await settingsHelpers.addOrUpdateAuthenticationMethod(
      'next@example.com',
      null,
      buildBaseUserData({ [cId.firebaseAuthPhone]: '+13035551234' }),
    );

    expect(isSuccess).toBe(true);
    expect(settingsSharedMocks.storeResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        [cId.firebaseSignInMechanism]: 'passwordAndPhone',
      }),
    );
  });

  it('addOrUpdateAuthenticationMethod keeps phone mechanism for noreply login email', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const currentUser = {
      uid: 'uid-888',
      email: 'noreplyuid@nci-c4cp.github.io',
      phoneNumber: '+13035551234',
      updateEmail: vi.fn(async () => {}),
    };
    globalThis.firebase = {
      auth: () => ({ currentUser }),
    };

    const isSuccess = await settingsHelpers.addOrUpdateAuthenticationMethod(
      'NoReplyUID@nci-c4cp.github.io',
      null,
      buildBaseUserData({ [cId.firebaseAuthPhone]: '+13035551234' }),
    );

    expect(isSuccess).toBe(true);
    expect(settingsSharedMocks.storeResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        [cId.firebaseAuthEmail]: 'noreplyuid@nci-c4cp.github.io',
        [cId.firebaseSignInMechanism]: 'phone',
      }),
    );
  });

  it('addOrUpdateAuthenticationMethod rethrows verifyPhoneNumber failures and restores submit state', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const { currentUser, recaptcha, verifyPhoneNumber } = buildFirebasePhoneUpdateStubs({ existingPhone: null });
    const verifyError = Object.assign(new Error('invalid phone'), { code: 'auth/invalid-phone-number' });
    verifyPhoneNumber.mockRejectedValueOnce(verifyError);
    globalThis.window.prompt = vi.fn(() => '123456');

    await expect(
      settingsHelpers.addOrUpdateAuthenticationMethod(null, '3035551212', buildBaseUserData()),
    ).rejects.toBe(verifyError);

    expect(verifyPhoneNumber).toHaveBeenCalledTimes(1);
    expect(currentUser.linkWithCredential).not.toHaveBeenCalled();
    expect(dom.changePhoneSubmit.style.display).toBe('block');
    expect(recaptcha.clear).toHaveBeenCalledTimes(1);
    expect(settingsSharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'PhoneAuthSettingsError',
      }),
    );
  });

  it('addOrUpdateAuthenticationMethod rethrows linkWithCredential failures', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const { currentUser, recaptcha } = buildFirebasePhoneUpdateStubs({ existingPhone: null });
    const linkError = Object.assign(new Error('already in use'), { code: 'auth/credential-already-in-use' });
    currentUser.linkWithCredential.mockRejectedValueOnce(linkError);
    globalThis.window.prompt = vi.fn(() => '111111');

    await expect(
      settingsHelpers.addOrUpdateAuthenticationMethod(null, '303-555-1212', buildBaseUserData()),
    ).rejects.toBe(linkError);

    expect(currentUser.linkWithCredential).toHaveBeenCalledTimes(1);
    expect(dom.changePhoneSubmit.style.display).toBe('block');
    expect(recaptcha.clear).toHaveBeenCalledTimes(1);
  });

  it('addOrUpdateAuthenticationMethod throws when existing phone unlink does not succeed', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const { currentUser, recaptcha } = buildFirebasePhoneUpdateStubs({ existingPhone: '+13035550000' });
    settingsSharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue({
      code: 400,
      errorCode: 'auth/user-disabled',
      message: 'provider denied request',
    });
    settingsSharedMocks.getAuthErrorMessageKey.mockReturnValue('shared.authErrors.userDisabled');
    globalThis.window.prompt = vi.fn(() => '222222');

    await expect(
      settingsHelpers.addOrUpdateAuthenticationMethod(null, '3035551222', buildBaseUserData({ [cId.firebaseAuthPhone]: '+13035550000' })),
    ).rejects.toThrow('Failed to unlink existing phone number');

    expect(currentUser.linkWithCredential).not.toHaveBeenCalled();
    expect(dom.loginUpdateError.innerHTML).toBe('translated:shared.authErrors.userDisabled');
    expect(recaptcha.clear).toHaveBeenCalledTimes(1);
  });

  it('unlinkFirebaseAuthProvider handles invalid provider type via translated fallback', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'uid-abc',
          email: 'existing@example.com',
          phoneNumber: '+13035550123',
        },
      }),
    };

    const result = await settingsHelpers.unlinkFirebaseAuthProvider('sms', buildBaseUserData(), null, false);

    expect(result).toBe('translated:shared.authErrors.default');
    expect(settingsSharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'UnlinkProviderError',
      }),
    );
    expect(settingsSharedMocks.hideAnimation).toHaveBeenCalledTimes(1);
  });

  it('unlinkFirebaseAuthProvider handles missing authenticated user', async () => {
    installDocumentByIdMap(buildLoginUpdateDom());
    globalThis.firebase = {
      auth: () => ({
        currentUser: null,
      }),
    };

    const result = await settingsHelpers.unlinkFirebaseAuthProvider('phone', buildBaseUserData(), null, false);

    expect(result).toBe('translated:shared.authErrors.default');
    expect(settingsSharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'UnlinkProviderError',
      }),
    );
  });

  it('updateToNoReplyEmail updates auth email and resets login status banners', async () => {
    const dom = buildLoginUpdateDom();
    installDocumentByIdMap(dom);
    const currentUser = {
      uid: 'uid-noreply',
      email: 'existing@example.com',
      phoneNumber: '+13035551111',
      updateEmail: vi.fn(async () => {}),
    };
    globalThis.firebase = {
      auth: () => ({ currentUser }),
    };

    const result = await settingsHelpers.updateToNoReplyEmail('uid-noreply', 'NoReplyUID@nci-c4cp.github.io');

    expect(result).toBe(true);
    expect(currentUser.updateEmail).toHaveBeenCalledWith('noreplyuid@nci-c4cp.github.io');
    expect(dom.loginUpdateFail.style.display).toBe('none');
    expect(dom.loginUpdateSuccess.style.display).toBe('none');
  });

  it('updateToNoReplyEmail rethrows update errors', async () => {
    installDocumentByIdMap(buildLoginUpdateDom());
    const updateError = Object.assign(new Error('requires recent login'), { code: 'auth/requires-recent-login' });
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          updateEmail: vi.fn(async () => {
            throw updateError;
          }),
        },
      }),
    };

    await expect(
      settingsHelpers.updateToNoReplyEmail('uid-err', 'noreplyuid@nci-c4cp.github.io'),
    ).rejects.toBe(updateError);
  });

  it('unlinkFirebaseAuthenticationTrigger sends replaceSignin payload for phone unlink', async () => {
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'uid-trigger-phone',
          email: 'person@example.com',
          phoneNumber: '+13035554444',
        },
      }),
    };
    settingsSharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue({ code: 200 });

    const result = await settingsHelpers.unlinkFirebaseAuthenticationTrigger('phone');

    expect(result).toBe(true);
    expect(settingsSharedMocks.processAuthWithFirebaseAdmin).toHaveBeenCalledWith({
      uid: 'uid-trigger-phone',
      flag: 'replaceSignin',
      email: 'person@example.com',
    });
    expect(settingsSharedMocks.showAnimation).toHaveBeenCalledTimes(1);
    expect(settingsSharedMocks.hideAnimation).toHaveBeenCalledTimes(1);
  });

  it('unlinkFirebaseAuthenticationTrigger sends normalized phone payload for email unlink', async () => {
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'uid-trigger-email',
          email: 'person@example.com',
          phoneNumber: '+13035554444',
        },
      }),
    };
    settingsSharedMocks.processAuthWithFirebaseAdmin.mockResolvedValue({ code: 409, message: 'conflict' });

    const result = await settingsHelpers.unlinkFirebaseAuthenticationTrigger('email');

    expect(result).toEqual({ code: 409, message: 'conflict' });
    expect(settingsSharedMocks.processAuthWithFirebaseAdmin).toHaveBeenCalledWith({
      uid: 'uid-trigger-email',
      flag: 'replaceSignin',
      phone: '3035554444',
    });
    expect(settingsSharedMocks.hideAnimation).toHaveBeenCalledTimes(1);
  });

  it('unlinkFirebaseAuthenticationTrigger hides animation and rethrows on trigger failure', async () => {
    const triggerError = new Error('trigger down');
    globalThis.firebase = {
      auth: () => ({
        currentUser: {
          uid: 'uid-trigger-fail',
          email: 'person@example.com',
          phoneNumber: null,
        },
      }),
    };
    settingsSharedMocks.processAuthWithFirebaseAdmin.mockRejectedValue(triggerError);

    await expect(
      settingsHelpers.unlinkFirebaseAuthenticationTrigger('phone'),
    ).rejects.toBe(triggerError);

    expect(settingsSharedMocks.showAnimation).toHaveBeenCalledTimes(1);
    expect(settingsSharedMocks.hideAnimation).toHaveBeenCalledTimes(1);
  });
});
