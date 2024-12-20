import { hideAnimation, errorMessage, processAuthWithFirebaseAdmin, showAnimation, storeResponse, validEmailFormat, validNameFormat, validPhoneNumberFormat, translateText, languageTranslations , emailAddressValidation, emailValidationStatus , emailValidationAnalysis} from './shared.js';
import { removeAllErrors } from './event.js';
import cId from './fieldToConceptIdMapping.js';

export const showEditButtonsOnUserVerified = () => {
  document.getElementById('changeNameButton').style.display = 'block';
  document.getElementById('changeContactInformationButton').style.display = 'block';
  document.getElementById('changeMailingAddressButton').style.display = 'block';
  document.getElementById('changePhysicalMailingAddressButton').style.display = 'block';
  document.getElementById('changeLoginButton').style.display = 'block';
};

export const toggleElementVisibility = (elementArray, isFormdisplayed) => {
  isFormdisplayed = !isFormdisplayed;
  elementArray.forEach(element => {
    if (element !== null) {
      element.style.display === 'none' ? (element.style.display = 'block') : (element.style.display = 'none');
    }
  });

  return isFormdisplayed;
};

export const suffixList = { 
  [cId.suffixValue.jr]: 0, 
  [cId.suffixValue.sr]: 1, 
  [cId.suffixValue.first]: 2, 
  [cId.suffixValue.second]: 3, 
  [cId.suffixValue.third]: 4,
  [cId.suffixValue.fourth]: 5,
  [cId.suffixValue.fifth]: 6,
  [cId.suffixValue.sixth]: 7,
  [cId.suffixValue.seventh]: 8,
  [cId.suffixValue.eighth]: 9, 
  [cId.suffixValue.secondDepricated]: 10, 
  [cId.suffixValue.thirdDepricated]: 11 };

export const suffixToTextMap = new Map([
    [cId.suffixValue.jr, 'Jr.'],
    [cId.suffixValue.sr, 'Sr.'],
    [cId.suffixValue.first, 'I'],
    [cId.suffixValue.second, 'II'],
    [cId.suffixValue.third, 'III'],
    [cId.suffixValue.fourth, 'IV'],
    [cId.suffixValue.fifth, 'V'],
    [cId.suffixValue.sixth, 'VI'],
    [cId.suffixValue.seventh, 'VII'],
    [cId.suffixValue.eighth, 'VIII'],
    [cId.suffixValue.secondDepricated, '2nd'],
    [cId.suffixValue.thirdDepricated, '3rd'],
  ]);

export const suffixToTextMapDropdown = new Map([
    [cId.suffixValue.jr, 'Jr.'],
    [cId.suffixValue.sr, 'Sr.'],
    [cId.suffixValue.first, 'I, 1st'],
    [cId.suffixValue.second, 'II, 2nd'],
    [cId.suffixValue.third, 'III, 3rd'],
    [cId.suffixValue.fourth, 'IV, 4th'],
    [cId.suffixValue.fifth, 'V, 5th'],
    [cId.suffixValue.sixth, 'VI, 6th'],
    [cId.suffixValue.seventh, 'VII, 7th'],
    [cId.suffixValue.eighth, 'VIII, 8th'],
    [cId.suffixValue.secondDepricated, '2nd'],
    [cId.suffixValue.thirdDepricated, '3rd'],
  ]);

export const togglePendingVerificationMessage = userData => {
  if (userData) {
    const isUserSubmitted = userData[cId.userProfileSubmittedAutogen] === cId.yes;
    const isUserVerified = userData[cId.verified] === cId.yes;
    const verificationMessage = document.getElementById('pendingVerification');
    isUserSubmitted && !isUserVerified ? (verificationMessage.style.display = 'block') : (verificationMessage.style.display = 'none');
  }
};

export const hideSuccessMessage = successMessageElement => {
  if (successMessageElement) {
    successMessageElement.style.display = 'none';
  }
  return null;
};

export const handleOptionalFieldVisibility = (value, text, element, matcher, type, isRadioParentTruthy) => {
  if (value) {
    const displayValue = matcher.style.display;
    if (type === 'text') {
      updateElementContentAndDisplay(element, text, value, displayValue);
    } else if (type === 'suffix') {
      updateElementContentAndDisplay(element, text, translateText(`settingsHelpers.suffix${suffixToTextMap.get(parseInt(value)).replace('.','')}`), displayValue);
    }  else if (type === 'languageSelector') {
      updateElementContentAndDisplay(element, text, translateText(languageTranslations()[parseInt(value)]), displayValue);
    } else if (type === 'phone') {
      const formattedPhone = `${value.substring(0, 3)} - ${value.substring(3, 6)} - ${value.substring(6, 10)}`;
      updateElementContentAndDisplay(element, text, formattedPhone, displayValue);
    } else if (type === 'radio') {
      if (isRadioParentTruthy) {
        const radioText = value === cId.yes ? 'Yes' : 'No';
        updateElementContentAndDisplay(element, text, radioText, displayValue);
      } else {
        element.style.display = 'none';
      }
    } else {
      console.error('ERROR: bad type expression in handleOptionalFieldVisibility');
    }
  } else {
    element.style.display = 'none';
  }
  return value;
};

const updateElementContentAndDisplay = (element, text, content, display) => {
  document.getElementById(text).textContent = content;
  element.style.display = display;
};

export const showAndPushElementToArrayIfExists = (value, element, isParentTruthy, array) => {
  if (value != null && value !== '' && element && isParentTruthy) {
    element.style.display = 'block';
    array.push(element);
  }
};

export const hideOptionalElementsOnShowForm = elementsArray => {
  elementsArray.forEach(element => {
    if (element !== null) {
      element.style.display = 'none';
    }
  });
};

export const handleContactInformationRadioButtonPresets = (mobilePhoneNumberComplete, canWeVoicemailMobile, canWeText, homePhoneNumberComplete, canWeVoicemailHome, otherPhoneNumberComplete, canWeVoicemailOther) => {
  if (mobilePhoneNumberComplete) {
    document.getElementById('mobileVoicemailPermissionYesRadio').checked = canWeVoicemailMobile;
    document.getElementById('mobileVoicemailPermissionNoRadio').checked = !canWeVoicemailMobile;
    document.getElementById('textPermissionYesRadio').checked = canWeText;
    document.getElementById('textPermissionNoRadio').checked = !canWeText;
  }
  if (homePhoneNumberComplete) {
    document.getElementById('homeVoicemailPermissionYesRadio').checked = canWeVoicemailHome;
    document.getElementById('homeVoicemailPermissionNoRadio').checked = !canWeVoicemailHome;
  }
  if (otherPhoneNumberComplete) {
    document.getElementById('otherVoicemailPermissionYesRadio').checked = canWeVoicemailOther;
    document.getElementById('otherVoicemailPermissionNoRadio').checked = !canWeVoicemailOther;
  }
};

export const FormTypes = {
  NAME: 'nameForm',
  CONTACT: 'contactForm',
  MAILING: 'mailingForm',
  PHYSICAL_MAILING: 'physicalMailingForm',
  LOGIN: 'loginForm',
};

export const openUpdateLoginForm = (event, formName) => {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }
  document.getElementById(formName).style.display = "block";
  event.currentTarget.classList.add("active")
}

export const attachTabEventListeners = () => {
  const tabs = document.querySelectorAll('.tablinks');

  tabs.forEach((tabLink, index) => {
      tabLink.addEventListener("click", function(event) {
          openUpdateLoginForm(event, `form${index + 1}`);
      });
  });
};

export const formatFirebaseAuthPhoneNumber = (phoneNumber) => {
  const firebaseAuthPhoneNumber = firebase.auth().currentUser.phoneNumber;
  const isMatch = cleanPhoneNumber(firebaseAuthPhoneNumber) === cleanPhoneNumber(phoneNumber);

  if (phoneNumber && isMatch) {
      if (phoneNumber.startsWith('+1')) {
          return `${phoneNumber.substring(2, 5)}-${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8, 12)}`;
      } else {
          return `${phoneNumber.substring(0, 3)}-${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6, 10)}`;
      };
  } else {
      return '';
  };
};

export const updatePhoneNumberInputFocus = () => {
  const phoneElementIds = ['mobilePhoneNumber1', 'mobilePhoneNumber2', 'homePhoneNumber1', 'homePhoneNumber2', 'otherPhoneNumber1', 'otherPhoneNumber2'];

  const initFocusHandler = elementId => {
    const element = document.getElementById(elementId);
    element.addEventListener('keyup', () => {
      if (element.value.trim().length === 3) {
        element.nextElementSibling.nextElementSibling.focus();
      }
    });
  };

  phoneElementIds.forEach(initFocusHandler);
};

export const validateName = (firstNameField, lastNameField, middleNameField) => {
  removeAllErrors();
  let hasError = false;
  let focus = true;
  let nameFieldArray;
  if (middleNameField) {
    nameFieldArray = [firstNameField, lastNameField, middleNameField];
  } else {
    nameFieldArray = [firstNameField, lastNameField];
  }

  nameFieldArray.forEach(item => {
    if (item.value) {
      const validationPattern = item.dataset.validationPattern;
      if (validationPattern && validationPattern === 'alphabets') {
        if (!validNameFormat.test(item.value)) {
          errorMessage(item.id, item.dataset.errorValidation, focus);
          focus = false;
          hasError = true;
        }
      }
    }
  });

  if (!firstNameField.value) {
    errorMessage('newFirstNameField', translateText('settingsHelpers.enterFirstName'), focus);
    focus = false;
    hasError = true;
  }

  if (!lastNameField.value) {
    errorMessage('newLastNameField', translateText('settingsHelpers.enterLastName'), focus);
    focus = false;
    hasError = true;
  }

  if (hasError) return false;

  return true;
};

export const getCheckedRadioButtonValue = radioYes => {
  return document.getElementById(radioYes).checked ? cId.yes : cId.no;
};

export const validateContactInformation = async (mobilePhoneNumberComplete, homePhoneNumberComplete, preferredEmail, otherPhoneNumberComplete, additionalEmail1, additionalEmail2) => {
  removeAllErrors();
  let hasError = false;
  let focus = true;

  if (!mobilePhoneNumberComplete && !homePhoneNumberComplete && !otherPhoneNumberComplete) {
    errorMessage('editMobilePhone', translateText('settingsHelpers.phoneRequired'));
    errorMessage('editHomePhone', translateText('settingsHelpers.phoneRequired'));
    errorMessage('editOtherPhone', translateText('settingsHelpers.phoneRequired'));
    if (focus) document.getElementById('editMobilePhone').focus();
    focus = false;
    hasError = true;
  }

  if (mobilePhoneNumberComplete && !validPhoneNumberFormat.test(mobilePhoneNumberComplete)) {
    errorMessage('editMobilePhone', translateText('settingsHelpers.phoneFormat'));
    if (focus) document.getElementById('editMobilePhone').focus();
    focus = false;
    hasError = true;
  }

  if (homePhoneNumberComplete && !validPhoneNumberFormat.test(homePhoneNumberComplete)) {
    errorMessage('editHomePhone', translateText('settingsHelpers.phoneFormat'));
    if (focus) document.getElementById('editHomePhone').focus();
    focus = false;
    hasError = true;
  }

  if (otherPhoneNumberComplete && !validPhoneNumberFormat.test(otherPhoneNumberComplete)) {
    errorMessage('editOtherPhone', translateText('settingsHelpers.phoneFormat'));
    if (focus) document.getElementById('editOtherPhone').focus();
    focus = false;
    hasError = true;
  }

  const emailValidation = await emailAddressValidation({
      emails: {
          upEmail: preferredEmail,
          upEmail2: additionalEmail1 ? additionalEmail1 : undefined,
          upAdditionalEmail2: additionalEmail2 ? additionalEmail2 : undefined,
      },
  });

  if (emailValidationAnalysis(emailValidation.upEmail) === emailValidationStatus.INVALID) {
    errorMessage('newPreferredEmail', translateText('settingsHelpers.emailInvalid'), focus);
    if (focus) document.getElementById('newPreferredEmail').focus();
    focus = false;
    hasError = true;
  }

  if (emailValidationAnalysis(emailValidation.upEmail2) === emailValidationStatus.INVALID) {
    errorMessage('newadditionalEmail1', translateText('settingsHelpers.emailInvalid'), focus);
    if (focus) document.getElementById('newadditionalEmail1').focus();
    focus = false;
    hasError = true;
  }

  if (emailValidationAnalysis(emailValidation.upAdditionalEmail2) === emailValidationStatus.INVALID) {
    errorMessage('newadditionalEmail2', translateText('settingsHelpers.emailInvalid'), focus);
    if (focus) document.getElementById('newadditionalEmail2').focus();
    focus = false;
    hasError = true;
  }

  if (hasError) {
    console.error('Error(s) found.');
    return false;
  }

  return true;
};

export const validateMailingAddress = (id, addressLine1, city, state, zip) => {
  removeAllErrors();
  let hasError = false;
  let focus = true;
  const zipRegExp = /[0-9]{5}/;

  if (!addressLine1) {
    errorMessage(`UPAddress${id}Line1`, translateText('settingsHelpers.addressNotEmpty'));
    if (focus) document.getElementById(`UPAddress${id}Line1`).focus();
    focus = false;
    hasError = true;
  }

  if (!city) {
    errorMessage(`UPAddress${id}City`, translateText('settingsHelpers.cityNotEmpty'));
    if (focus) document.getElementById(`UPAddress${id}City`).focus();
    focus = false;
    hasError = true;
  }

  if (!state) {
    errorMessage(`UPAddress${id}State`, translateText('settingsHelpers.stateNotEmpty'));
    if (focus) document.getElementById(`UPAddress${id}State`).focus();
    focus = false;
    hasError = true;
  }

  if (!zip || !zipRegExp.test(zip)) {
    errorMessage(`UPAddress${id}Zip`, translateText('settingsHelpers.zipNotEmpty'));
    if (focus) document.getElementById(`UPAddress${id}Zip`).focus();
    focus = false;
    hasError = true;
  }

  if (hasError) {
    console.error('Error(s) found.');
    return false;
  }

  return true;
};

export const validateLoginEmail = (email, emailConfirm) => {
  if (email === emailConfirm) {
    if (validEmailFormat.test(email)) {
      return true;
    } else {
      alert(translateText('settingsHelpers.errorEmailFormat'));
      return false;
    }
  } else {
    alert(translateText('settingsHelpers.errorEmailsDoNotMatch'));
    return false;
  }
};

export const validateLoginPhone = (phone, phoneConfirm) => {
  if (phone === phoneConfirm) {
    if (validPhoneNumberFormat.test(phone)) {
      return true;
    } else {
      alert(translateText('settingsHelpers.errorPhoneFormat'));
      return false;
    }
  } else {
    alert(translateText('settingsHelpers.errorPhonesDoNotMatch'));
    return false;
  }
};

export const changeName = async (firstName, lastName, middleName, suffix, preferredFirstName, userData) => {
  document.getElementById('changeNameFail').style.display = 'none';
  document.getElementById('changeNameGroup').style.display = 'none';

  const newValues = {
    [cId.fName]: firstName,
    [cId.mName]: middleName,
    [cId.lName]: lastName,
    [cId.suffix]: parseInt(suffix),
    [cId.prefName]: preferredFirstName,
  };
  
  let { changedUserDataForProfile, changedUserDataForHistory } = findChangedUserDataValues(newValues, userData, 'changeName');
  changedUserDataForProfile = handleNameField(firstNameTypes, 'firstName', changedUserDataForProfile, userData);
  changedUserDataForProfile = handleNameField(lastNameTypes, 'lastName', changedUserDataForProfile, userData);
  const isSuccess = processUserDataUpdate(changedUserDataForProfile, changedUserDataForHistory, userData[cId.userProfileHistory], userData[cId.prefEmail], 'changeName');
  return isSuccess;
};

export const changeContactInformation = async (mobilePhoneNumberComplete, homePhoneNumberComplete, canWeVoicemailMobile, canWeText, canWeVoicemailHome, preferredEmail, otherPhoneNumberComplete, canWeVoicemailOther, additionalEmail1, additionalEmail2, preferredLanguage, userData) => {

  document.getElementById('changeContactInformationFail').style.display = 'none';
  document.getElementById('changeContactInformationGroup').style.display = 'none';

  if (mobilePhoneNumberComplete) {
    canWeVoicemailMobile = canWeVoicemailMobile ?? cId.no;
    canWeText = canWeText ?? cId.no;
  }
  if (homePhoneNumberComplete) {
    canWeVoicemailHome = canWeVoicemailHome ?? cId.no;
  }
  if (otherPhoneNumberComplete) {
    canWeVoicemailOther = canWeVoicemailOther ?? cId.no;
  }

  const newValues = {
    [cId.cellPhone]: mobilePhoneNumberComplete,
    [cId.canWeVoicemailMobile]: parseInt(canWeVoicemailMobile),
    [cId.canWeText]: parseInt(canWeText),
    [cId.homePhone]: homePhoneNumberComplete,
    [cId.canWeVoicemailHome]: parseInt(canWeVoicemailHome),
    [cId.prefEmail]: preferredEmail,
    [cId.otherPhone]: otherPhoneNumberComplete,
    [cId.canWeVoicemailOther]: parseInt(canWeVoicemailOther),
    [cId.additionalEmail1]: additionalEmail1,
    [cId.additionalEmail2]: additionalEmail2,
    [cId.preferredLanguage]: parseInt(preferredLanguage)
  };

  let { changedUserDataForProfile, changedUserDataForHistory } = findChangedUserDataValues(newValues, userData, 'changeContactInformation');
  changedUserDataForProfile = handleAllPhoneNoField(changedUserDataForProfile, userData);
  changedUserDataForProfile = handleAllEmailField(changedUserDataForProfile, userData);
  const isSuccess = processUserDataUpdate(changedUserDataForProfile, changedUserDataForHistory, userData[cId.userProfileHistory], userData[cId.prefEmail], 'changeContactInformation');
  return isSuccess;
};

const firstNameTypes = [cId.consentFirstName, cId.fName, cId.prefName];
const lastNameTypes = [cId.consentLastName, cId.lName];

/**
 * Handle the query.frstName and query.lastName fields in the participant profile.
 * Check the changedUserDataForProfile object and then the participant profile for all name types. If a name is in changedUserDataForProfile, that's the up-to-date version. Add it to the queryNameArray.
 * If a nameType isn't in changedUserData, check the existing participant profile and add that to the queryNameArray.
 * If a nameType is an empty string in changedUserData, don't add it to the queryNameArray even if it exists in the participant profile. The empty string means the participant wants the name removed.
 * Lastly, remove duplicates. This can happen when the participant has a consent name that matches the first or last name.
 * @param {array} nameTypes - array of name types to check.
 * @param {string} fieldName - the name of the field to update.
 * @param {object} changedUserDataForProfile - the changed user data.
 * @param {object} userData - the existing participant object.
 */
const handleNameField = (nameTypes, fieldName, changedUserDataForProfile, userData) => {
  const queryNameArray = [];
  nameTypes.forEach(nameType => {
      if (changedUserDataForProfile[nameType]) {
          queryNameArray.push(changedUserDataForProfile[nameType].toLowerCase());
      } else if (userData[nameType] && changedUserDataForProfile[nameType] !== '') {
          queryNameArray.push(userData[nameType].toLowerCase());
      }
  });

  changedUserDataForProfile[`query.${fieldName}`] = Array.from(new Set(queryNameArray));

  return changedUserDataForProfile;
};

/**
 * Handle the allPhoneNo field in the user profile
 * If a number is in the changedUserDataForProfile, the participant has added this phone number. Add it to the allPhoneNo field.
 * Then check the userData profile for an existing value at the field being updated. The participant is updating this phone number. Remove it from the allPhoneNo field.
 * If an empty string is in the changedUserDataForProfile, the participant has removed this phone number. Remove it from the allPhoneNo field.
 */
const handleAllPhoneNoField = (changedUserDataForProfile, userData) => {
  const allPhoneNo = userData.query.allPhoneNo ?? [];
  const phoneTypes = [cId.cellPhone, cId.homePhone, cId.otherPhone];

  phoneTypes.forEach(phoneType => {
    if (changedUserDataForProfile[phoneType] && !allPhoneNo.includes(changedUserDataForProfile[phoneType])) {
      allPhoneNo.push(changedUserDataForProfile[phoneType]);
    }

    if (changedUserDataForProfile[phoneType] || changedUserDataForProfile[phoneType] === '') {
      const indexToRemove = allPhoneNo.indexOf(userData[phoneType]);  
      if (indexToRemove !== -1) {
        allPhoneNo.splice(indexToRemove, 1);
      }  
    }
  });

  changedUserDataForProfile['query.allPhoneNo'] = allPhoneNo;
  
  return changedUserDataForProfile;
};

/**
 * Handle the allEmails field in the user profile
 * If an email is in the changedUserDataForProfile, the participant has added this email. Add it to the allEmails field.
 * If an email is in the changedUserDataForHistory, the participant has removed this email. Remove it from the allEmails field.
 */
const handleAllEmailField = (changedUserDataForProfile, userData) => {
  const allEmails = userData.query.allEmails ?? [];
  const emailTypes = [cId.prefEmail, cId.additionalEmail1, cId.additionalEmail2];

  emailTypes.forEach(emailType => {
    if (changedUserDataForProfile[emailType] && !allEmails.includes(changedUserDataForProfile[emailType])) {
      allEmails.push(changedUserDataForProfile[emailType].toLowerCase());
    }

    if (changedUserDataForProfile[emailType] || changedUserDataForProfile[emailType] === '') {
      const indexToRemove = allEmails.indexOf(userData[emailType]);  
      if (indexToRemove !== -1) {
        allEmails.splice(indexToRemove, 1);
      }  
    }
  });

  changedUserDataForProfile['query.allEmails'] = allEmails;
  
  return changedUserDataForProfile;
};

export const changeMailingAddress = async (id, addressLine1, addressLine2, city, state, zip, userData, isPOBox) => {
  document.getElementById(`mailingAddressFail${id}`).style.display = 'none';
  document.getElementById(`changeMailingAddressGroup${id}`).style.display = 'none';

  const newValues =
      id === 1
          ? {
                [cId.address1]: addressLine1,
                [cId.address2]: addressLine2 ?? "",
                [cId.city]: city,
                [cId.state]: state,
                [cId.zip]: zip.toString(),
                [cId.isPOBox]: isPOBox ? cId.yes: cId.no,
            }
          : {
                [cId.physicalAddress1]: addressLine1,
                [cId.physicalAddress2]: addressLine2 ?? "",
                [cId.physicalCity]: city,
                [cId.physicalState]: state,
                [cId.physicalZip]: zip.toString(),
            };

  const { changedUserDataForProfile, changedUserDataForHistory } = findChangedUserDataValues(newValues, userData);
  const isSuccess = processUserDataUpdate(changedUserDataForProfile, changedUserDataForHistory, userData[cId.userProfileHistory], userData[cId.prefEmail], 'mailingAddress');
  return isSuccess;
};

/**
 * Changing email and/or phone must write to two places: firebase auth and the user profile.
 * Only continue if the firebase auth email or auth phone number change is successful (determined by the value of isAuthUpdateSuccess).
 * If both email and phone auth methods exist becuase of this update, use 'passwordAndPhone' as the value for the firebaseSignInMechanism field in the user profile.
 * @param {string} email - the new email address
 * @param {*} userData - the user profile data
 * @returns {boolean} - true if the email change was successful, false otherwise
 * Login phone exists if: (the user is updating the phone number or it is in the user's firestoreAuth record) && the user isn't actively removing the phone number.
 * Login email exists if: (the user is updating the email address && it doesn't start with noreply) or (it is in the user's firestoreAuth record && it doesn't start with noreply.
 */
export const addOrUpdateAuthenticationMethod = async (email, phone, userData) => {
  document.getElementById('loginUpdateFail').style.display = 'none';
  document.getElementById('loginUpdateSuccess').style.display = 'none';
  
  const firebaseAuthUser = firebase.auth().currentUser;
  const valuesForFirebaseAuth = {};
  const newValuesForFirestore = {};

  if (email) {
    email = email.toLowerCase();
    newValuesForFirestore[cId.firebaseAuthEmail] = email;
    newValuesForFirestore[cId.firebaseSignInMechanism] = email.startsWith('noreply') ? 'phone' : 'password';
    valuesForFirebaseAuth['email'] = email;
    valuesForFirebaseAuth['uid'] = firebaseAuthUser.uid;
    try {
      await updateFirebaseAuthEmail(email);
    } catch (error) {
      console.error(`Error: updateFirebaseAuthEmail().`, error);
      throw error;
    }
  }

  if (phone) {
    phone = cleanPhoneNumber(phone);
    phone = `+1${phone}`;
    newValuesForFirestore[cId.firebaseAuthPhone] = phone;
    newValuesForFirestore[cId.firebaseSignInMechanism] = 'phone';
    valuesForFirebaseAuth['phoneNumber'] = phone;
    valuesForFirebaseAuth['uid'] = firebaseAuthUser.uid;
    try {
      await updateFirebaseAuthPhone(phone, userData);
    } catch (error) {
      console.error(`Error: updateFirebaseAuthPhone(): ${error}`);
      throw error;
    }
  }

  const isPhoneRemoved = phone === '';
  const doesLoginPhoneExist = (phone || firebaseAuthUser.phoneNumber) && !isPhoneRemoved;
  const doesLoginEmailExist = (email && !email.startsWith('noreply')) || (firebaseAuthUser.email && !firebaseAuthUser.email.startsWith('noreply'));

  if (doesLoginPhoneExist && doesLoginEmailExist) {
    newValuesForFirestore[cId.firebaseSignInMechanism] = 'passwordAndPhone';
  }

  document.getElementById('changeLoginGroup').style.display = 'none';
  const { changedUserDataForProfile, changedUserDataForHistory } = findChangedUserDataValues(newValuesForFirestore, userData);
  const isSuccess = processUserDataUpdate(changedUserDataForProfile, changedUserDataForHistory, userData[cId.userProfileHistory], userData[cId.prefEmail], 'loginUpdate');
  return isSuccess;
};

/**
 * Update the user's email address in Firebase Auth.
 * @param {String} email - the new email address 
 * @returns {boolean} - true if the update was successful, false otherwise.
 */
const updateFirebaseAuthEmail = async (email) => {
  try {
    const firebaseAuthUser = firebase.auth().currentUser;
    await firebaseAuthUser.updateEmail(email.toLowerCase());
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Update the user's phone number in Firebase Auth.
 * This walks the user through two verification processes:
 *  (1) recaptcha verification in the browser.
 *  (2) phone number verification with a texted code.
 * @param {String} phone - the new cleaned phone number.
 * @returns {boolean} - true if the update was successful, false otherwise.
 * Note: '+1' has already been prepended to the phone number (format required by Firebase Auth).
 * Note: The user's existing phone number must be unlinked from the user's Firebase Auth account before writing the new phone number.
 * Note: If firebaseAuthUser.phoneNumber exists, unlink it from the user's Firebase Auth account and return the result. If it doesn't exist, the api call isn't needed. Continue with the success case (true).
 * 
 */
const updateFirebaseAuthPhone = async (phone, userData) => {
  const changePhoneSubmit = document.getElementById('changePhoneSubmit');
  try {
      const firebaseAuthUser = firebase.auth().currentUser;
      if (changePhoneSubmit) changePhoneSubmit.style.display = 'none';
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
      const recaptchaVerifier = window.recaptchaVerifier;
      const provider = new firebase.auth.PhoneAuthProvider;

      const verificationId = await provider.verifyPhoneNumber(phone, recaptchaVerifier);
      const verificationCode = window.prompt(translateText('settingsHelpers.mobileVerificationCode'));
      if (!verificationCode) {
          throw new Error("Verification code not provided");
      }
      
      const phoneCredential = firebase.auth.PhoneAuthProvider.credential(verificationId, verificationCode);
      const unlinkResult = firebaseAuthUser.phoneNumber ? await unlinkFirebaseAuthProvider('phone', userData, phone, false) : true;
      if (unlinkResult === true) {
        await firebaseAuthUser.linkWithCredential(phoneCredential);
        if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
        return true;
      } else {
        throw new Error(`Failed to unlink existing phone number`);
      }
  } catch (error) {
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      if (changePhoneSubmit) changePhoneSubmit.style.display = 'block';
      console.error('Error updating phone number: ', error);
      hideAnimation();
      throw error;
  }
};

/**
 * Unlink a provider from the current user's Firebase account.
 * On Success, update the user's signInMechanism and (firebaseAuthEmail or firebaseAuthPhone) in the user's Firestore profile.
 * Important: FirebaseAuth phone number can be unlinked. FirebaseAuth email cannot be unlinked.
 * Workaround: If the user wants to unlink their email, we write a 'noreply' email to the user's auth profile and firestore profile, which effectively disables the prior email login.
 * @param {String} providerType - 'email' or 'phone' 
 * @param {Object} userData - the user's current userData object
 * @param {String} newPhone - the new phone number (if applicable)
 * @param {boolean} isPhoneRemoval - true if the phone number is being removed, false otherwise
 * @returns {boolean} - true if the unlink was successful, false otherwise
 */
export const unlinkFirebaseAuthProvider = async (providerType, userData, newPhone, isPhoneRemoval) => {
  try {
    const firebaseAuthUser = firebase.auth().currentUser;

    if (!firebaseAuthUser) {
      throw new Error('No user is currently authenticated');
    }

    if (!(providerType === 'email' || providerType === 'phone')) {
      throw new Error('Invalid providerType. Expected "email" or "phone"');
    }

    let updateResult;
    let noReplyEmail;
    
    if (providerType === 'phone') {
      updateResult = await unlinkFirebaseAuthenticationTrigger(providerType);
    } else if (providerType === 'email') {
      noReplyEmail = `noreply${firebaseAuthUser.uid}@episphere.github.io`.toLowerCase();
      updateResult = await updateToNoReplyEmail(firebaseAuthUser.uid, noReplyEmail);
    } else {
      console.error('bad providerType arg in unlinkFirebaseAuthProvider()');
    }
    if (updateResult === true) {
      const changedUserDataForProfile = {};

      if (providerType === 'email') {
        changedUserDataForProfile[cId.firebaseAuthEmail] = noReplyEmail;
        changedUserDataForProfile[cId.firebaseSignInMechanism] = 'phone';
      } else if (providerType === 'phone' && isPhoneRemoval){
        changedUserDataForProfile[cId.firebaseAuthPhone] = '';
        changedUserDataForProfile[cId.firebaseSignInMechanism] = 'password';
      } else {
        if (newPhone?.startsWith('+1')) newPhone = newPhone.substring(2);
        changedUserDataForProfile[cId.firebaseAuthPhone] = newPhone;
        userData[cId.firebaseAuthEmail] && !userData[cId.firebaseAuthEmail].startsWith('noreply') ? changedUserDataForProfile[cId.firebaseSignInMechanism] = 'passwordAndPhone' : changedUserDataForProfile[cId.firebaseSignInMechanism] = 'phone';
      }  

      await storeResponse(changedUserDataForProfile)
        .catch(function (error) {
          console.error('Error writing document (storeResponse): ', error);
          document.getElementById('loginUpdateFail').style.display = 'block';
          document.getElementById('loginUpdateError').innerHTML = error.message;
          return false;
      });

      return true;
    } else {
      handleUpdatePhoneEmailErrorInUI('unlinkFirebaseAuthProvider', updateResult);
      return updateResult.message;
    };
  } catch (error) {
    console.error('Failed to unlink provider:', error.message);
    hideAnimation();
    return error.message;
  }
};

export const updateToNoReplyEmail = async (uid, noReplyEmail) => {
    document.getElementById('loginUpdateFail').style.display = 'none';
    document.getElementById('loginUpdateSuccess').style.display = 'none';
    
    try {
      await updateFirebaseAuthEmail(noReplyEmail);
      return true;
    } catch (error) {
      console.error(`Error: updateFirebaseAuthEmail(): ${error}`);
      throw error;
    }
};

const handleUpdatePhoneEmailErrorInUI = (functionName, error) => {
  document.getElementById('loginUpdateFail').style.display = 'block';
  document.getElementById('loginUpdateError').innerHTML = error.message;
};

const cleanPhoneNumber = (phoneNumber) => {
  return phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
};

/**
 * Iterate the new values, compare them to existing values, and return the changed values.
 * write an empty string to firestore if the history value is null/undefined/empty --per spec on 05-09-2023
 * write an empty string to firestore if the profile value is null/undefined/empty --per spec on 05-09-2023
 * @param {object} newUserData - the newly entered form fields
 * @param {object} existingUserData - the existing user profile data
 * @returns {changedUserDataForProfile, changedUserDataForHistory} - parallel objects containing the changed values
 * Contact information requires special handling because of the radio buttons
 *   if the user is changing their cell phone number, we need to update the canWeVoicemailMobile and canWeText values
 *   the same is true for homePhone and otherPhone (canWeVoicemailHome and canWeVoicemailOther)
 *   if user deletes a number, set canWeVoicemail and canWeText to '' (empty string) --per spec on 05-09-2023
 *   if user updates a number, ensure the canWeVoicemail and canWeText values are set
 *   Update: 05-26-2023 do not include email addresses in user profile archiving. Exclude those keys from the history object.
 * RE: !excludeHistoryKeys.includes(key) -> if the key is not in the excludeHistoryKeys array, then include it in the history object.
 * RE: existingUserData[key] ?? '' -> if the existingUserData[key] is null/undefined/empty, then write an empty string to the history object. This marks the change as requested by the data team.
 * Update: 06-27-2023
 *   (1) Do not tie empty text and voicemail permissions to profile history.
 *   (2) Use cId.noneOfTheseApply for suffix that had a value and now has no value
 *   (3) Default phone permissions to cId.no instead of using an empty string.
*/
const findChangedUserDataValues = (newUserData, existingUserData, type) => {
  const changedUserDataForProfile = {};
  const changedUserDataForHistory = {};
  const excludeHistoryKeys = [cId.prefEmail, cId.additionalEmail1, cId.additionalEmail2, cId.firebaseAuthEmail];
  const keysToSkipIfNull = [cId.canWeText, cId.canWeVoicemailMobile, cId.canWeVoicemailHome, cId.canWeVoicemailOther];

  Object.keys(newUserData).forEach(key => {
    if (newUserData[key] !== existingUserData[key]) {
      changedUserDataForProfile[key] = newUserData[key];
      if (!excludeHistoryKeys.includes(key)) {
          changedUserDataForHistory[key] = existingUserData[key] ?? '';
      }
    }
  });
  
  if (type === 'changeContactInformation') {

    if (cId.cellPhone in changedUserDataForProfile) {
        if (!newUserData[cId.cellPhone]) {
          changedUserDataForProfile[cId.canWeVoicemailMobile] = cId.no;
          changedUserDataForProfile[cId.canWeText] = cId.no;
        } else {
          changedUserDataForProfile[cId.canWeVoicemailMobile] = newUserData[cId.canWeVoicemailMobile] ?? existingUserData[cId.canWeVoicemailMobile] ?? cId.no;
          changedUserDataForProfile[cId.canWeText] = newUserData[cId.canWeText] ?? existingUserData[cId.canWeText] ?? cId.no;
        }

        if (existingUserData[cId.canWeVoicemailMobile]) changedUserDataForHistory[cId.canWeVoicemailMobile] = existingUserData[cId.canWeVoicemailMobile];
        if (existingUserData[cId.canWeText]) changedUserDataForHistory[cId.canWeText] = existingUserData[cId.canWeText];
    }

    if (cId.homePhone in changedUserDataForProfile) {
      if (!newUserData[cId.homePhone]) {
        changedUserDataForProfile[cId.canWeVoicemailHome] = cId.no;
      } else {
        changedUserDataForProfile[cId.canWeVoicemailHome] = newUserData[cId.canWeVoicemailHome] ?? existingUserData[cId.canWeVoicemailMobile] ?? cId.no;
      }

      if (existingUserData[cId.canWeVoicemailHome]) changedUserDataForHistory[cId.canWeVoicemailHome] = existingUserData[cId.canWeVoicemailHome];
    }

    if (cId.otherPhone in changedUserDataForProfile) {
      if (!newUserData[cId.otherPhone]) {
        changedUserDataForProfile[cId.canWeVoicemailOther] = cId.no;
      } else {
        changedUserDataForProfile[cId.canWeVoicemailOther] = newUserData[cId.canWeVoicemailOther] ?? existingUserData[cId.canWeVoicemailOther] ?? cId.no;
      }
      
      if (existingUserData[cId.canWeVoicemailOther]) changedUserDataForHistory[cId.canWeVoicemailOther] = existingUserData[cId.canWeVoicemailOther];
    }
  }  

  if (type === 'changeName') {
    if (cId.suffix in changedUserDataForProfile) {
      if (!newUserData[cId.suffix]) {
        changedUserDataForProfile[cId.suffix] = cId.noneOfTheseApply;
      }
    }
  }

  keysToSkipIfNull.forEach(key => {
    if (changedUserDataForHistory[key] === '') changedUserDataForHistory[key] = null;
  });

  return { changedUserDataForProfile, changedUserDataForHistory };
};

/**
 * Update the user profile and history.
 * @param {object} changedUserDataForProfile - the changed values to be written to the user profile
 * @param {object} changedUserDataForHistory  - the previous values to be written to history.
 * @param {object} userHistory - the user's existing history.
 * @param {string} type - the type of data being changed (e.g. name, contact info, mailing address, log-in email).
 * @returns {boolean} - whether the write operation was successful to control the UI messaging.
 */
const processUserDataUpdate = async (changedUserDataForProfile, changedUserDataForHistory, userHistory, preferredEmailExisting, type) => {
  const preferredEmail = changedUserDataForProfile[cId.preferredEmail] ?? preferredEmailExisting ?? '';
  if (changedUserDataForProfile && Object.keys(changedUserDataForProfile).length !== 0) {
    changedUserDataForProfile[cId.userProfileHistory] = updateUserHistory(changedUserDataForHistory, userHistory, preferredEmail, changedUserDataForProfile[cId.suffix]);
    await storeResponse(changedUserDataForProfile)
    .catch(function (error) {
      console.error('Error writing document (storeResponse): ', error);
      document.getElementById(`${type}Fail`).style.display = 'block';
      document.getElementById(`${type}Error`).innerHTML = error.message;
      return false;
    });
    return true;
  } else {
    document.getElementById(`${type}Fail`).style.display = 'block';
    document.getElementById(`${type}Error`).innerHTML = translateText('settingsHelpers.makeChangesToUpdate');
    return false;
  }
};

/**
 * Update the user's history based on new data entered by the user. Prepare it for POST to user's proifle in firestore
 * This routine runs once per form submission.
 * First, check for user history and add it to the userProfileHistoryArray
 * Next, create a new map of the user's changes and add it to the userProfileHistoryArray with a timestamp
 * Updated requirement 05/25/2023: do not write emails (prefEmail, additionalEmail1, additionalEmail2) to user history
 * @param {array of objects} existingDataToUpdate - the existingData to write to history (parallel data structure to newDataToWrite)
 * @param {array of objects} userHistory - the user's existing history
 * @returns {userProfileHistoryArray} -the array of objects to write to user profile history, with the new data added to the end of the array
 */
const updateUserHistory = (existingDataToUpdate, userHistory, preferredEmail, newSuffix) => {
  const userProfileHistoryArray = [];
  if (userHistory && Object.keys(userHistory).length > 0) userProfileHistoryArray.push(...userHistory);
  
  const newUserHistoryMap = populateUserHistoryMap(existingDataToUpdate, preferredEmail, newSuffix);
  if (newUserHistoryMap && Object.keys(newUserHistoryMap).length > 0) userProfileHistoryArray.push(newUserHistoryMap);

  return userProfileHistoryArray;
};

const populateUserHistoryMap = (existingData, preferredEmail, newSuffix) => {
  const userHistoryMap = {};
  const keys = [
    cId.fName,
    cId.mName,
    cId.lName,
    cId.suffix,
    cId.prefName,
    cId.cellPhone,
    cId.canWeVoicemailMobile,
    cId.canWeText,
    cId.homePhone,
    cId.canWeVoicemailHome,
    cId.otherPhone,
    cId.canWeVoicemailOther,
    cId.address1,
    cId.address2,
    cId.city,
    cId.state,
    cId.zip,
  ];

  keys.forEach((key) => {
    existingData[key] != null && (userHistoryMap[key] = existingData[key]);
  });

  if (existingData[cId.cellPhone]) {
    userHistoryMap[cId.canWeVoicemailMobile] = existingData[cId.canWeVoicemailMobile] ?? cId.no;
    userHistoryMap[cId.canWeText] = existingData[cId.canWeText] ?? cId.no;
  }

  if (existingData[cId.homePhone]) {
    userHistoryMap[cId.canWeVoicemailHome] = existingData[cId.canWeVoicemailHome] ?? cId.no;
  }

  if (existingData[cId.otherPhone]) {
    userHistoryMap[cId.canWeVoicemailOther] = existingData[cId.canWeVoicemailOther] ?? cId.no;
  }

  if (newSuffix && !existingData[cId.suffix]) {
    userHistoryMap[cId.suffix] = cId.noneOfTheseApply;
  }

  if (Object.keys(userHistoryMap).length > 0) {
    userHistoryMap[cId.userProfileUpdateTimestamp] = new Date().toISOString();
    userHistoryMap[cId.profileChangeRequestedBy] = preferredEmail;
    return userHistoryMap;
  } else {
    return null;
  }
};

export const unlinkFirebaseAuthenticationTrigger = async (authToUnlink) =>  {
    showAnimation();

    const currentUser = firebase.auth().currentUser;
    const email = currentUser.email;
    let phoneNumber = currentUser.phoneNumber;
    
    if (phoneNumber && phoneNumber.startsWith('+1')) phoneNumber = phoneNumber.substring(2);
    
    const newAuthData = {};
    newAuthData['uid'] = currentUser.uid;
    newAuthData['flag'] = 'replaceSignin';
    if (authToUnlink === 'email') newAuthData['phone'] = phoneNumber;
    if (authToUnlink === 'phone') newAuthData['email'] = email;

    try {
      const response = await processAuthWithFirebaseAdmin(newAuthData);
      hideAnimation();
      return response.code === 200 ? true : response;
    } catch (error) {
      console.error('An error occurred:', error);
      hideAnimation();
      throw error;
  }
}

export const formerNameOptions = [
  { value: "", text: "-- Select --" , i18n: 'form.formerNameCategoryDefaultOption'},
  { value: "first", text: "First" , i18n: 'form.formerNameCategoryOption.first'},
  { value: "middle", text: "Middle" ,i18n: 'form.formerNameCategoryOption.middle'},
  { value: "last", text: "Last" ,i18n: 'form.formerNameCategoryOption.last'},
];
export const numberOfDefaultFormerNames = 1
export const getFormerNameData = () => {
    const result = [];
    const upEmail = document.getElementById("UPEmail");
    const formerNameItems = document.getElementsByClassName("former-name-item");
    Array.from(formerNameItems).forEach((_, index) => {
        const inputElement = document.getElementById(
            `former-name-value-${index + 1}`
        );
        const selectElement = document.getElementById(
            `former-name-category-${index + 1}`
        );
        if (inputElement.value) {
            const object = {
                [cId.profileChangeRequestedBy]: upEmail.value,
                [cId.userProfileUpdateTimestamp]: new Date().toISOString(),
            };
            switch (selectElement.value) {
                case "first":
                    object[cId.fName] = inputElement.value;
                    break;
                case "middle":
                    object[cId.mName] = inputElement.value;
                    break;
                case "last":
                    object[cId.lName] = inputElement.value;
                    break;
            }
            result.push(object);
        }
    });
    return result;
};
