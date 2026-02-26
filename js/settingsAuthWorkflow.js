export const buildSettingsAuthUpdateLogContext = ({
  email,
  phone,
  userData,
} = {}) => ({
  authMethod: email ? 'email' : 'phone',
  flow: 'settings_update',
  emailDomain: email ? email.split('@').pop().toLowerCase() : '',
  phoneLast4: phone ? phone.replace(/\D/g, '').slice(-4) : '',
  connectID: userData?.['Connect_ID'] || '',
});

export const getSettingsAuthUpdateErrorMessage = ({
  error,
  isEmailUpdate,
  translateText,
} = {}) => {
  if (!error?.code) return error?.message;

  switch (error.code) {
    case 'auth/credential-already-in-use':
    case 'auth/email-already-in-use':
      return translateText(`settings.error${isEmailUpdate ? 'Email' : 'Phone'}Used`);
    case 'auth/invalid-verification-code':
      return translateText('settings.errorInvalidCode');
    case 'auth/requires-recent-login':
      return translateText('settings.errorRequiresLogin');
    default:
      return translateText('settings.errorWhileSaving');
  }
};

export const canUnlinkAuthProvider = (firebaseUser) => !!(firebaseUser?.email && firebaseUser?.phoneNumber);
