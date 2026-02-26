import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFirebaseAuthStub,
  createWrapperDiv,
  installDocumentByIdMap,
} from './helpers.js';

const AUTH_CODES = {
  invalidEmail: 'auth/invalid-email',
  invalidPhoneNumber: 'auth/invalid-phone-number',
  tooManyRequests: 'auth/too-many-requests',
};

const sharedMocks = vi.hoisted(() => ({
  triggerEmailLinkSend: vi.fn(),
  logDDRumAction: vi.fn(),
  logAuthIssue: vi.fn(),
  getAuthErrorMessageKey: vi.fn(),
  showAuthErrorMessage: vi.fn(),
  clearAuthErrorMessage: vi.fn(),
  createTelemetryId: vi.fn(),
}));

vi.mock('../js/shared.js', () => ({
  triggerEmailLinkSend: sharedMocks.triggerEmailLinkSend,
  logDDRumAction: sharedMocks.logDDRumAction,
  logAuthIssue: sharedMocks.logAuthIssue,
  getAuthErrorMessageKey: sharedMocks.getAuthErrorMessageKey,
  showAuthErrorMessage: sharedMocks.showAuthErrorMessage,
  clearAuthErrorMessage: sharedMocks.clearAuthErrorMessage,
  createTelemetryId: sharedMocks.createTelemetryId,
}));

import { handleAuthFailure, handleAuthSuccess, signInConfig } from '../js/pages/signIn.js';

describe('signIn auth handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.firebase = createFirebaseAuthStub();
    installDocumentByIdMap();

    sharedMocks.logAuthIssue.mockReturnValue({
      errorCode: AUTH_CODES.tooManyRequests,
      errorCategory: 'rate_limit',
    });
    sharedMocks.getAuthErrorMessageKey.mockImplementation((code) => `mapped:${code}`);
  });

  it('logs and resolves for non-critical auth failures', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5000);

    const context = {
      accountType: 'phone',
      attemptStartTs: 1000,
      authFlowId: 'flow-1',
      authAttemptId: 'attempt-1',
    };

    await expect(handleAuthFailure(new Error('boom'), context)).resolves.toBeUndefined();

    expect(sharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'phone_auth_failure',
        errorType: 'FirebaseUiSignInFailure',
        context,
      }),
    );
    expect(sharedMocks.showAuthErrorMessage).toHaveBeenCalledWith(
      `mapped:${AUTH_CODES.tooManyRequests}`,
    );
    expect(sharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'auth_attempt_completed',
      expect.objectContaining({
        outcome: 'failure',
        errorCode: AUTH_CODES.tooManyRequests,
        errorCategory: 'rate_limit',
        durationMs: 4000,
      }),
    );
  });

  it('rejects for anonymous-upgrade merge conflict errors', async () => {
    sharedMocks.logAuthIssue.mockReturnValue({
      errorCode: 'firebaseui/anonymous-upgrade-merge-conflict',
      errorCategory: 'merge_conflict',
    });

    const error = new Error('merge conflict');

    await expect(handleAuthFailure(error, { accountType: 'email' })).rejects.toBe(error);
  });

  it('logs phone auth success and completion telemetry', () => {
    vi.spyOn(Date, 'now').mockReturnValue(9000);

    const result = handleAuthSuccess(
      {
        credential: { providerId: 'mock-phone-provider' },
        additionalUserInfo: { isNewUser: true },
      },
      { accountType: 'phone', attemptStartTs: 2000 },
    );

    expect(result).toBe(true);
    expect(sharedMocks.clearAuthErrorMessage).toHaveBeenCalledTimes(1);
    expect(sharedMocks.logDDRumAction).toHaveBeenNthCalledWith(
      1,
      'phone_auth_success',
      expect.objectContaining({
        providerId: 'mock-phone-provider',
        isNewUser: true,
      }),
    );
    expect(sharedMocks.logDDRumAction).toHaveBeenNthCalledWith(
      2,
      'auth_attempt_completed',
      expect.objectContaining({
        outcome: 'success',
        durationMs: 7000,
      }),
    );
  });

  it('logs email-link auth success when provider is email', () => {
    const result = handleAuthSuccess(
      {
        credential: { providerId: 'mock-email-provider' },
        additionalUserInfo: { isNewUser: false },
      },
      { accountType: 'email', attemptStartTs: 10 },
    );

    expect(result).toBe(true);
    expect(sharedMocks.logDDRumAction).toHaveBeenNthCalledWith(
      1,
      'email_link_auth_success',
      expect.objectContaining({
        providerId: 'mock-email-provider',
        isNewUser: false,
      }),
    );
  });

  it('uses providerData fallback to classify phone auth success', () => {
    const result = handleAuthSuccess(
      {
        user: {
          providerData: [{ providerId: 'mock-phone-provider' }],
        },
      },
      { accountType: 'phone', attemptStartTs: 100 },
    );

    expect(result).toBe(true);
    expect(sharedMocks.logDDRumAction).toHaveBeenNthCalledWith(
      1,
      'phone_auth_success',
      expect.objectContaining({
        providerId: 'mock-phone-provider',
      }),
    );
  });

  it('builds sign-in config options by type and falls back to all', () => {
    const phoneConfig = signInConfig('phone');
    const emailConfig = signInConfig('email');
    const fallbackConfig = signInConfig('unknown');

    expect(phoneConfig.signInOptions).toEqual(['mock-phone-provider']);
    expect(emailConfig.signInOptions).toHaveLength(1);
    expect(emailConfig.signInOptions[0]).toMatchObject({
      provider: 'mock-email-provider',
      signInMethod: 'mock-email-link-sign-in',
      emailLinkSignIn: sharedMocks.triggerEmailLinkSend,
    });
    expect(fallbackConfig.signInOptions).toHaveLength(2);
  });

  it('uiShown callback seeds telemetry ids and logs attempt start', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12000);

    const wrapperDiv = createWrapperDiv({
      uiType: 'signUp',
      accountType: 'email',
      accountValue: 'person@example.org',
    });
    installDocumentByIdMap({ signInWrapperDiv: wrapperDiv });

    sharedMocks.createTelemetryId
      .mockReturnValueOnce('auth-flow-1')
      .mockReturnValueOnce('auth-attempt-1');

    const config = signInConfig('email');
    config.callbacks.uiShown();

    expect(wrapperDiv.dataset.authFlowId).toBe('auth-flow-1');
    expect(wrapperDiv.dataset.authAttemptId).toBe('auth-attempt-1');
    expect(wrapperDiv.dataset.authAttemptStartTs).toBe('12000');
    expect(sharedMocks.clearAuthErrorMessage).toHaveBeenCalledTimes(1);
    expect(sharedMocks.logDDRumAction).toHaveBeenNthCalledWith(
      1,
      'auth_ui_shown',
      expect.objectContaining({
        flow: 'sign_up',
        authFlowId: 'auth-flow-1',
        authAttemptId: 'auth-attempt-1',
        emailDomain: 'example.org',
      }),
    );
    expect(sharedMocks.logDDRumAction).toHaveBeenNthCalledWith(
      2,
      'auth_attempt_started',
      expect.objectContaining({
        signInType: 'email',
      }),
    );
  });

  it('uiShown preserves existing authFlowId and only creates attempt id', () => {
    vi.spyOn(Date, 'now').mockReturnValue(22000);
    const wrapperDiv = createWrapperDiv({
      uiType: 'signIn',
      accountType: 'phone',
      accountValue: '3035551212',
      authFlowId: 'existing-flow',
    });
    installDocumentByIdMap({ signInWrapperDiv: wrapperDiv });
    sharedMocks.createTelemetryId.mockReturnValue('auth-attempt-2');

    signInConfig('phone').callbacks.uiShown();

    expect(wrapperDiv.dataset.authFlowId).toBe('existing-flow');
    expect(wrapperDiv.dataset.authAttemptId).toBe('auth-attempt-2');
    expect(sharedMocks.createTelemetryId).toHaveBeenCalledTimes(1);
    expect(sharedMocks.createTelemetryId).toHaveBeenCalledWith('auth_attempt');
  });

  it('signInFailure callback routes email account failures to email-link event name', async () => {
    const wrapperDiv = createWrapperDiv({
      accountType: 'email',
      uiType: 'signIn',
    });
    installDocumentByIdMap({ signInWrapperDiv: wrapperDiv });
    sharedMocks.logAuthIssue.mockReturnValue({
      errorCode: AUTH_CODES.invalidEmail,
      errorCategory: 'validation',
    });

    const config = signInConfig('email');
    await expect(config.callbacks.signInFailure(new Error('invalid'))).resolves.toBeUndefined();

    expect(sharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email_link_auth_failure',
      }),
    );
  });

  it('signInFailure callback routes phone account failures to phone event name', async () => {
    const wrapperDiv = createWrapperDiv({
      accountType: 'phone',
      uiType: 'signIn',
    });
    installDocumentByIdMap({ signInWrapperDiv: wrapperDiv });
    sharedMocks.logAuthIssue.mockReturnValue({
      errorCode: AUTH_CODES.invalidPhoneNumber,
      errorCategory: 'validation',
    });

    const config = signInConfig('phone');
    await expect(config.callbacks.signInFailure(new Error('invalid phone'))).resolves.toBeUndefined();

    expect(sharedMocks.logAuthIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'phone_auth_failure',
      }),
    );
  });

  it('records null duration when failure context has no attempt start timestamp', async () => {
    await expect(handleAuthFailure(new Error('boom'), { accountType: 'email' })).resolves.toBeUndefined();

    expect(sharedMocks.logDDRumAction).toHaveBeenCalledWith(
      'auth_attempt_completed',
      expect.objectContaining({
        outcome: 'failure',
        durationMs: null,
      }),
    );
  });
});
