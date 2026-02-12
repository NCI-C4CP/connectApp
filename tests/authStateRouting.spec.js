import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyUnauthenticatedRouteState,
  isAuthenticatedNonAnonymousUser,
  shouldShowLegacyEmailVerificationInterstitial,
  showLegacyEmailVerificationInterstitial,
} from '../js/authStateRouting.js';

describe('authStateRouting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isAuthenticatedNonAnonymousUser returns true only for non-anonymous users', () => {
    expect(isAuthenticatedNonAnonymousUser(null)).toBe(false);
    expect(isAuthenticatedNonAnonymousUser({ isAnonymous: true })).toBe(false);
    expect(isAuthenticatedNonAnonymousUser({ isAnonymous: false })).toBe(true);
  });

  it('applyUnauthenticatedRouteState sets home title and # hash', () => {
    const doc = { title: '' };
    const win = { location: { hash: '#dashboard' } };
    const translate = vi.fn((key) => `translated:${key}`);

    applyUnauthenticatedRouteState({ doc, win, translate });

    expect(doc.title).toBe('translated:shared.homeTitle');
    expect(win.location.hash).toBe('#');
  });

  it('shouldShowLegacyEmailVerificationInterstitial returns true only for non-phone unverified standard-email users', () => {
    expect(
      shouldShowLegacyEmailVerificationInterstitial({
        email: 'participant@example.com',
        emailVerified: false,
        phoneNumber: null,
      }),
    ).toBe(true);

    expect(
      shouldShowLegacyEmailVerificationInterstitial({
        email: 'participant@example.com',
        emailVerified: false,
        phoneNumber: '+13035551234',
      }),
    ).toBe(false);

    expect(
      shouldShowLegacyEmailVerificationInterstitial({
        email: 'noreplyabc@nci-c4cp.github.io',
        emailVerified: false,
        phoneNumber: null,
      }),
    ).toBe(false);

    expect(
      shouldShowLegacyEmailVerificationInterstitial({
        email: 'participant@example.com',
        emailVerified: true,
        phoneNumber: null,
      }),
    ).toBe(false);

    expect(shouldShowLegacyEmailVerificationInterstitial(null)).toBe(false);
    expect(shouldShowLegacyEmailVerificationInterstitial({})).toBe(false);
    expect(
      shouldShowLegacyEmailVerificationInterstitial({
        emailVerified: false,
        phoneNumber: null,
      }),
    ).toBe(false);
  });

  // Legacy email verification route rendering. These should be analyzed for removal alongside userProfileAuthStateUIHandler().
  it('showLegacyEmailVerificationInterstitial returns false when policy excludes user', () => {
    const shouldShow = vi.fn(() => false);
    const hideAnimationFn = vi.fn();
    document.getElementById = vi.fn(() => null);

    const isRendered = showLegacyEmailVerificationInterstitial({
      user: { email: 'noreplyuid@example.com' },
      shouldShow,
      hideAnimationFn,
    });

    expect(isRendered).toBe(false);
    expect(shouldShow).toHaveBeenCalledTimes(1);
    expect(hideAnimationFn).not.toHaveBeenCalled();
  });

  it('showLegacyEmailVerificationInterstitial renders legacy verification UI and sends verification on click', async () => {
    const clickHandlers = [];
    const verifyEmailElement = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'click') clickHandlers.push(handler);
      }),
    };
    const mainContent = {
      innerHTML: '',
    };
    const sendEmailVerification = vi.fn(async () => {});
    const user = { sendEmailVerification };

    document.getElementById = vi.fn((id) => {
      if (id === 'root') return mainContent;
      if (id === 'verifyEmail') return verifyEmailElement;
      return null;
    });

    const isRendered = showLegacyEmailVerificationInterstitial({
      user,
      shouldShow: vi.fn(() => true),
      hideAnimationFn: vi.fn(),
    });

    expect(isRendered).toBe(true);
    expect(mainContent.innerHTML).toContain('Please verify your email by clicking');
    expect(verifyEmailElement.addEventListener).toHaveBeenCalledTimes(1);

    // Trigger click handler to validate both UI update and side-effect.
    clickHandlers.forEach((handler) => handler());
    await Promise.resolve();

    expect(mainContent.innerHTML).toContain('Please click the link we sent to your email');
    expect(sendEmailVerification).toHaveBeenCalledTimes(1);
  });
});
