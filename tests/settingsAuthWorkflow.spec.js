import { describe, expect, it, vi } from 'vitest';
import {
  buildSettingsAuthUpdateLogContext,
  canUnlinkAuthProvider,
  getSettingsAuthUpdateErrorMessage,
} from '../js/settingsAuthWorkflow.js';

describe('settingsAuthWorkflow', () => {
  it('buildSettingsAuthUpdateLogContext builds email auth metadata', () => {
    const context = buildSettingsAuthUpdateLogContext({
      email: 'Person@Example.ORG',
      phone: null,
      userData: { Connect_ID: 'CONNECT-100' },
    });

    expect(context).toEqual({
      authMethod: 'email',
      flow: 'settings_update',
      emailDomain: 'example.org',
      phoneLast4: '',
      connectID: 'CONNECT-100',
    });
  });

  it('buildSettingsAuthUpdateLogContext builds phone auth metadata', () => {
    const context = buildSettingsAuthUpdateLogContext({
      email: null,
      phone: '(303) 555-9876',
      userData: { Connect_ID: 'CONNECT-200' },
    });

    expect(context).toEqual({
      authMethod: 'phone',
      flow: 'settings_update',
      emailDomain: '',
      phoneLast4: '9876',
      connectID: 'CONNECT-200',
    });
  });

  it('getSettingsAuthUpdateErrorMessage maps provider-in-use errors', () => {
    const translateText = vi.fn((key) => `translated:${key}`);

    const emailMessage = getSettingsAuthUpdateErrorMessage({
      error: { code: 'auth/email-already-in-use', message: 'duplicate' },
      isEmailUpdate: true,
      translateText,
    });
    const phoneMessage = getSettingsAuthUpdateErrorMessage({
      error: { code: 'auth/credential-already-in-use', message: 'duplicate' },
      isEmailUpdate: false,
      translateText,
    });

    expect(emailMessage).toBe('translated:settings.errorEmailUsed');
    expect(phoneMessage).toBe('translated:settings.errorPhoneUsed');
  });

  it('getSettingsAuthUpdateErrorMessage maps verification/recent-login/default errors', () => {
    const translateText = vi.fn((key) => `translated:${key}`);

    const verificationMessage = getSettingsAuthUpdateErrorMessage({
      error: { code: 'auth/invalid-verification-code', message: 'bad code' },
      isEmailUpdate: false,
      translateText,
    });
    const recentLoginMessage = getSettingsAuthUpdateErrorMessage({
      error: { code: 'auth/requires-recent-login', message: 'reauth' },
      isEmailUpdate: false,
      translateText,
    });
    const defaultMessage = getSettingsAuthUpdateErrorMessage({
      error: { code: 'auth/other', message: 'other' },
      isEmailUpdate: false,
      translateText,
    });
    const noCodeMessage = getSettingsAuthUpdateErrorMessage({
      error: { message: 'raw error' },
      isEmailUpdate: false,
      translateText,
    });

    expect(verificationMessage).toBe('translated:settings.errorInvalidCode');
    expect(recentLoginMessage).toBe('translated:settings.errorRequiresLogin');
    expect(defaultMessage).toBe('translated:settings.errorWhileSaving');
    expect(noCodeMessage).toBe('raw error');
  });

  it('canUnlinkAuthProvider requires both email and phone auth methods', () => {
    expect(canUnlinkAuthProvider(null)).toBe(false);
    expect(canUnlinkAuthProvider({ email: 'person@example.com', phoneNumber: null })).toBe(false);
    expect(canUnlinkAuthProvider({ email: null, phoneNumber: '+13035550000' })).toBe(false);
    expect(canUnlinkAuthProvider({ email: 'person@example.com', phoneNumber: '+13035550000' })).toBe(true);
  });
});
