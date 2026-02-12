export const isAuthenticatedNonAnonymousUser = (user) => !!(user && !user.isAnonymous);

export const applyUnauthenticatedRouteState = ({
  doc = document,
  win = window,
  translate = (key) => key,
} = {}) => {
  doc.title = translate('shared.homeTitle');
  win.location.hash = '#';
};

/**
 * Legacy verification interstitial eligibility for authenticated users.
 * Phone-auth and noreply-email users should not see this legacy email-only flow.
 * @param {Object|null|undefined} user
 * @returns {boolean}
 */
export const shouldShowLegacyEmailVerificationInterstitial = (user) => {
  if (!user || typeof user !== 'object') return false;
  if (!user.email || typeof user.email !== 'string') return false;
  if (user.emailVerified) return false;
  if (user.email.startsWith('noreply')) return false;
  if (user.phoneNumber) return false;
  return true;
};

/**
 * Render the legacy email verification interstitial.
 * Returns true when interstitial is rendered, false otherwise.
 */
export const showLegacyEmailVerificationInterstitial = ({
  user,
  shouldShow = shouldShowLegacyEmailVerificationInterstitial,
  hideAnimationFn = () => {},
} = {}) => {
  if (!shouldShow(user)) return false;

  const mainContent = document.getElementById('root');
  if (!mainContent) return false;

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
                        `;

  const verifyEmailElement = document.getElementById('verifyEmail');
  if (!verifyEmailElement) return false;

  verifyEmailElement.addEventListener('click', () => {
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
                    </div>`;
  });

  hideAnimationFn();

  verifyEmailElement.addEventListener('click', () => {
    user.sendEmailVerification().catch((error) => {
      console.error('Error sending email verification: ', error);
    });
  });

  return true;
};
