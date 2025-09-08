import { storeSocial, storeResponse, hideAnimation, translateHTML } from '../shared.js';
import fieldMapping from '../fieldToConceptIdMapping.js';

const hardErrorNineFormat = '<span data-i18n="ssn.hardErrorNineFormat">Please enter a valid Social Security Number in this format: 999-99-9999.</span>';
const hardErrorFourFormat = '<span data-i18n="ssn.hardErrorFourFormat">Please enter the last four digits of a valid Social Security Number in this format: 9999.</span>';
const hardErrorMismatch = '<span data-i18n="ssn.hardErrorMismatch">The numbers entered do not match. Please try again.</span>';

let content;

let ssnNineDigits;
let ssnNineDigitsShow;
let ssnNineDigitsConfirm;
let ssnNineDigitsConfirmShow;

let ssnFourDigits;
let ssnFourDigitsShow;
let ssnFourDigitsConfirm;
let ssnFourDigitsConfirmShow;

let ignoreBlur = false;

export const socialSecurityTemplate = (data) => {
    content = document.getElementById('questionnaireRoot');
    content.style.visibility = 'visible';

    if (data[fieldMapping.ModuleSsn.statusFlag] === fieldMapping.moduleStatus.notStarted) {
        const formData = {
            [fieldMapping.ModuleSsn.startTs]: new Date().toISOString(),
            [fieldMapping.ModuleSsn.statusFlag]: fieldMapping.moduleStatus.started
        }
        
        storeResponse(formData);
    }

    window.scrollTo(0, 0);

    socialSecurityIntro();
    hideAnimation();
}

const socialSecurityIntro = () => {
    
    content.innerHTML = translateHTML(` 
        <div class="row ssn-content-header">
            <p data-i18n="ssn.introHeader"><b>Why Connect collects Social Security Numbers</b></p>
        </div>

        <div class="row ssn-content-body" data-i18n="ssn.introBody">
            <p>In this survey, we ask for your Social Security Number, a unique number used to identify people in the United States that is often recorded in state and national health databases. Social Security Numbers help us link to public health databases and ensure that the information we collect from these sources is correctly matched to you.</p>
            <p>Your privacy is important to us and there are protections in place to keep your Social Security Number safe. We store your Social Security Number in a secure database separate from other information you share, including survey answers, samples, and personal information such as your name. Only a small number of Connect staff will have access to Social Security Number information. These staff will not be researchers using the data for future studies, but will be responsible for protecting this information and only using it to match data from other public health sources to your Connect participant record. We never share information that can identify you, including your Social Security Number, with researchers.</p>
        </div>

        <div class="row ssn-content-buttons">
            <div class="col-md-3">
            </div>
            <div class="col-md-6">
            </div>
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityIntroNext" data-i18n="ssn.nextText">Next</button>
            </div>
        </div>
    `);

    document.getElementById('socialSecurityIntroNext').addEventListener('click', () => {
        socialSecurityIntroContinued();
    });
}

const socialSecurityIntroContinued = () => {

    content.innerHTML = translateHTML(` 
        <div class="row ssn-content-header">
            <p data-i18n="ssn.introContinuedHeader"><b>How Connect will use this information</b></p>
        </div>

        <div class="row ssn-content-body" data-i18n="ssn.introContinuedBody">
            <p>Using information from public health databases like cancer registries makes Connect a better resource to study cancer prevention. The information we get from cancer and other health registries may help us answer research questions and get more accurate study findings that could benefit all communities.</p>
            <p>You may share all 9 digits of your Social Security Number, the last 4 digits of your Social Security Number, or no digits at all. If you prefer not to share your full Social Security Number, please consider sharing the last 4 digits. This will help us match the information we collect in public health databases to you, which will increase the value of the data we have for research.</p>
        </div>

        <div class="row ssn-content-buttons">
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityIntroContinuedPrevious" data-i18n="ssn.backText">Back</button>
            </div>
            <div class="col-md-6">
            </div>
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityIntroContinuedNext" data-i18n="ssn.nextText">Next</button>
            </div>
        </div>
    `);

    document.getElementById('socialSecurityIntroContinuedPrevious').addEventListener('click', () => {
        socialSecurityIntro();
    });

    document.getElementById('socialSecurityIntroContinuedNext').addEventListener('click', () => {
        socialSecurityNineDigits();
    });
}

const socialSecurityNineDigits = () => {

    ssnNineDigits = '';
    ssnNineDigitsShow = false;

    ssnNineDigitsConfirm = '';
    ssnNineDigitsConfirmShow = false;

    content.innerHTML = translateHTML(` 
        <div class="row ssn-content-header">
        </div>

        <div class="row ssn-content-body">

            <p data-i18n="ssn.instructions">To provide all <b>9 digits</b> of your Social Security Number, please enter them here. If you prefer to provide only the last 4 digits or no digits, select the ‘Next’ button.</p>

            <div class="input-group">
                <label for="SSN_Nine" data-i18n="ssn.enterSSN">Please enter your Social Security Number:</label>
                <div class="input-with-icon">
                    <input type="text" id="SSN_Nine" class="SSN" inputmode="numeric" maxlength="11" />
                    <i class="fa fa-eye" id="togglePassword"></i>
                </div>
                <span class="ssn-error-message" id="errorSSN_Nine"></span>
            </div>
            <div class="input-group">
                <label for="SSN_Nine_Confirm" data-i18n="ssn.confirmSSN">Please confirm your Social Security Number:</label>
                <div class="input-with-icon">
                    <input type="text" id="SSN_Nine_Confirm" class="SSN" inputmode="numeric" maxlength="11" />
                    <i class="fa fa-eye" id="togglePasswordConfirm"></i>
                </div>
                <span class="ssn-error-message" id="errorSSN_Nine_Confirm"></span>
                </div>
            </div>
        </div>

        <div class="row ssn-content-buttons">
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityNineDigitsPrevious" data-i18n="ssn.backText">Back</button>
            </div>
            <div class="col-md-6">
            </div>
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityNineDigitsNext" data-i18n="ssn.nextText">Next</button>
            </div>
        </div>
    `);

    const ssnNineDigitsInput = document.getElementById('SSN_Nine');
    const ssnNineError = document.getElementById('errorSSN_Nine');
    const ssnNineDigitsConfirmInput = document.getElementById('SSN_Nine_Confirm');
    const ssnNineConfirmError = document.getElementById('errorSSN_Nine_Confirm');

    document.getElementById('togglePassword').addEventListener('mousedown', () => {

        ignoreBlur = true;

        ssnNineDigitsInput.value = togglePassword(addHyphens(ssnNineDigits), ssnNineDigitsInput, ssnNineDigitsShow);
        ssnNineDigitsShow = !ssnNineDigitsShow;
    });

    document.getElementById('togglePasswordConfirm').addEventListener('click', () => {
            
        ssnNineDigitsConfirmInput.value = togglePassword(addHyphens(ssnNineDigitsConfirm), ssnNineDigitsConfirmInput, ssnNineDigitsConfirmShow);
        ssnNineDigitsConfirmShow = !ssnNineDigitsConfirmShow;
    });

    ssnNineDigitsInput.addEventListener('focus', () => {
        ignoreBlur = false;
    });

    ssnNineDigitsInput.addEventListener('blur', () => {
        
        if (ignoreBlur) {
            ignoreBlur = false;
            return;
        }

        clearError(ssnNineError);

        if (ssnNineDigits.length > 0 && !checkNineDigitValid(ssnNineDigits)) displayError(ssnNineError, hardErrorNineFormat);
    });

    document.getElementById('socialSecurityNineDigitsPrevious').addEventListener('click', () => {
        socialSecurityIntroContinued();
    });

    document.getElementById('socialSecurityNineDigitsNext').addEventListener('click', () => {

        clearError(ssnNineConfirmError);

        if(!checkMatch(ssnNineDigits, ssnNineDigitsConfirm)) {
            displayError(ssnNineConfirmError, hardErrorMismatch);
            return;
        }

        if(ssnNineDigits.length === 0) {

            const onContinue = () => {
                socialSecurityFourDigits();
            }
            
            displayModal(onContinue);
            return;
        }

        if(ssnNineDigits.length > 0 && !checkNineDigitValid(ssnNineDigits)) {
            displayError(ssnNineError, hardErrorNineFormat);
            return;
        }

        endMessageOne();
    });
    
    ssnNineDigitsInput.addEventListener('input', (event) => {

        let inputUpdates = inputWorkflow(event, ssnNineDigits, ssnNineDigitsInput, ssnNineDigitsShow, true);

        ssnNineDigits = inputUpdates.rawInput;
        ssnNineDigitsInput.value = inputUpdates.inputElement.value;
    });

    ssnNineDigitsConfirmInput.addEventListener('input', (event) => {

        let inputUpdates = inputWorkflow(event, ssnNineDigitsConfirm, ssnNineDigitsConfirmInput, ssnNineDigitsConfirmShow, true);

        ssnNineDigitsConfirm = inputUpdates.rawInput;
        ssnNineDigitsConfirmInput.value = inputUpdates.inputElement.value;
    });
}

const socialSecurityFourDigits = () => {

    ssnFourDigits = '';
    ssnFourDigitsShow = false;

    ssnFourDigitsConfirm = '';
    ssnFourDigitsConfirmShow = false;

    content.innerHTML = translateHTML(` 
        <div class="row ssn-content-header">
        </div>

        <div class="row ssn-content-body">
            <div class="input-group">
                <label for="SSN_Four" data-i18n="ssn.lastDigitsSSN">If you prefer to provide only the last <b>4 digits</b> of your Social Security Number, please enter the last <b>4 digits</b> here:</label>
                <div class="input-with-icon">
                    <input type="text" id="SSN_Four" class="SSN" inputmode="numeric" maxlength="4" />
                    <i class="fa fa-eye" id="togglePassword"></i>
                </div>
                <span class="ssn-error-message" id="errorSSN_Four"></span>
            </div>
            <div class="input-group">
                <label for="SSN_Four_Confirm" data-i18n="ssn.confirmLastDigitsSSN">Please confirm the last <b>4 digits</b> of your Social Security Number:</label>
                <div class="input-with-icon">
                    <input type="text" id="SSN_Four_Confirm" class="SSN" inputmode="numeric" maxlength="4" autocomplete="off" />
                    <i class="fa fa-eye" id="togglePasswordConfirm"></i>
                    </div>
                <span class="ssn-error-message" id="errorSSN_Four_Confirm"></span>
                </div>
            </div>
        </div>

        <div class="row ssn-content-buttons">
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityFourDigitsPrevious" data-i18n="ssn.backText">Back</button>
            </div>
            <div class="col-md-6">
            </div>
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="socialSecurityFourDigitsNext" data-i18n="ssn.nextText">Next</button>
            </div>
        </div>
    `);

    const ssnFourDigitsInput = document.getElementById('SSN_Four');
    const ssnFourError = document.getElementById('errorSSN_Four');
    const ssnFourDigitsConfirmInput = document.getElementById('SSN_Four_Confirm');
    const ssnFourConfirmError = document.getElementById('errorSSN_Four_Confirm');

    document.getElementById('togglePassword').addEventListener('click', () => {

        ignoreBlur = true;
        
        ssnFourDigitsInput.value = togglePassword(ssnFourDigits, ssnFourDigitsInput, ssnFourDigitsShow);
        ssnFourDigitsShow = !ssnFourDigitsShow;
    });

    document.getElementById('togglePasswordConfirm').addEventListener('click', () => {
            
        ssnFourDigitsConfirmInput.value = togglePassword(ssnFourDigitsConfirm, ssnFourDigitsConfirmInput, ssnFourDigitsConfirmShow);
        ssnFourDigitsConfirmShow = !ssnFourDigitsConfirmShow;
    });

    ssnFourDigitsInput.addEventListener('focus', () => {
        ignoreBlur = false;
    });

    ssnFourDigitsInput.addEventListener('blur', () => {
        
        if(ignoreBlur) {
            ignoreBlur = false;
            return;
        }

        clearError(ssnFourError);

        if(ssnFourDigits.length > 0 && !checkFourDigitValid(ssnFourDigits)) {
            displayError(ssnFourError, hardErrorFourFormat);
            return;
        }

    });

    document.getElementById('socialSecurityFourDigitsPrevious').addEventListener('click', () => {
        socialSecurityNineDigits();
    });

    document.getElementById('socialSecurityFourDigitsNext').addEventListener('click', () => {

        clearError(ssnFourConfirmError);

        if(!checkMatch(ssnFourDigits, ssnFourDigitsConfirm)) {
            displayError(ssnFourConfirmError, hardErrorMismatch);
            return;
        }

        if(ssnFourDigits.length === 0) {

            const onContinue = () => {
                endMessageTwo();
            }
            
            displayModal(onContinue);
            return;
        }

        if(ssnFourDigits.length > 0 && !checkFourDigitValid(ssnFourDigits)) displayError(ssnFourError, hardErrorFourFormat);

        endMessageOne();
    });

    ssnFourDigitsInput.addEventListener('input', (event) => {

        let inputUpdates = inputWorkflow(event, ssnFourDigits, ssnFourDigitsInput, ssnFourDigitsShow, false);

        ssnFourDigits = inputUpdates.rawInput;
        ssnFourDigitsInput.value = inputUpdates.inputElement.value;
    
    });

    ssnFourDigitsConfirmInput.addEventListener('input', (event) => {
        
        let inputUpdates = inputWorkflow(event, ssnFourDigitsConfirm, ssnFourDigitsConfirmInput, ssnFourDigitsConfirmShow, false);

        ssnFourDigitsConfirm = inputUpdates.rawInput;
        ssnFourDigitsConfirmInput.value = inputUpdates.inputElement.value;
    });
}

const endMessageOne = () => {

    content.innerHTML = translateHTML(`   
        <div class="row ssn-content-header">   
        </div>

        <div class="row ssn-content-body">
            <p data-i18n="ssn.endMessage">You have answered all of the questions in this survey. To submit your answers, select the “Submit Survey” button.</p>
        </div>

        <div class="row ssn-content-buttons">
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="endMessageOnePrevious" data-i18n="ssn.backText">Back</button>
            </div>
            <div class="col-md-6">
            </div>
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="endMessageOneNext" data-i18n="ssn.submitSurveyText">Submit Survey</button>
            </div>
        </div>
    `);

    document.getElementById('endMessageOnePrevious').addEventListener('click', () => {
        if (ssnNineDigits) socialSecurityNineDigits();
        if (ssnFourDigits) socialSecurityFourDigits();
    });

    document.getElementById('endMessageOneNext').addEventListener('click', async () => {
        
        const formData = ssnNineDigits ? { ssnNineDigits } : { ssnFourDigits };

        await storeSocial(formData);
        location.reload();
    });
}

const endMessageTwo = () => {

    content.innerHTML = translateHTML(`   
        <div class="row ssn-content-header">    
        </div>

        <div class="row ssn-content-body">
            <p data-i18n="ssn.thankYouMessage">Thank you. This survey will remain available on your MyConnect dashboard in case you decide to provide this information in the future. To exit this survey, select the “Close Survey" button.</p>
        </div>

        <div class="row ssn-content-buttons">
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="endMessageTwoPrevious" data-i18n="ssn.backText">Back</button>
            </div>
            <div class="col-md-6">
            </div>
            <div class="col-md-3">
                <button class="ssn-button" type="button" id="endMessageTwoNext" data-i18n="ssn.closeSurveyText">Close Survey</button>
            </div>
        </div>
    `);

    document.getElementById('endMessageTwoPrevious').addEventListener('click', () => {
        socialSecurityFourDigits();
    });

    document.getElementById('endMessageTwoNext').addEventListener('click', () => {
        location.reload();
    });
}

/**
 * Handles the input event workflow for an input element. It updates the raw input based on user actions,
 * applies any necessary transformations (like adding hyphens), masks or unmasks the value, and
 * calculates and sets the new cursor position.
 *
 * @param {Event} event - The input event triggered by the user's interaction with the input field.
 * @param {string} rawInput - The current raw input string before the event's changes.
 * @param {HTMLElement} inputElement - The input element being interacted with.
 * @param {boolean} showFlag - Determines whether to show or mask the input value.
 * @param {boolean} hyphens - Determines whether to consider hyphens in the input.
 * 
 * @return {{ rawInput: string, inputElement: HTMLElement }} An object containing the updated raw input and input element.
 */
const inputWorkflow = (event, rawInput, inputElement, showFlag, hyphens) => {
    
    let originalPosition = event.target.selectionStart;
    let isAddingCharacter = event.inputType === 'insertText';
    let isDeletingCharacter = event.inputType === 'deleteContentBackward';

    rawInput = setRawInput(event, rawInput);

    inputElement.value = hyphens ? addHyphens(rawInput) : rawInput;
    
    inputElement.value = digitMask(inputElement.value, showFlag);

    let newPosition = calculateNewPosition(originalPosition, isAddingCharacter, isDeletingCharacter, hyphens);

    inputElement.setSelectionRange(newPosition, newPosition);

    return { rawInput, inputElement };
}

/**
 * Toggles the masking of the given value in an input element. If the show flag is true, it masks the value by
 * replacing all characters except hyphens with asterisks. Otherwise, it shows the original value.
 *
 * @param {string} value - The value to be masked or unmasked.
 * @param {HTMLElement} inputElement - The input element whose value is to be toggled.
 * @param {boolean} showFlag - Determines whether to mask or unmask the value.
 * 
 * @return {string} The new value of the input element after applying the mask or unmask operation.
 */
const togglePassword = (value, inputElement, showFlag) => {

    if(showFlag) {
        inputElement.value = value.replace(/[^-]/g, '*');
    }
    else {
        inputElement.value = value;
    }

    return inputElement.value;
}

/**
 * Clears the content of the specified div and hides it.
 *
 * @param {HTMLElement} div - The div element whose content is to be cleared and hidden.
 */
const clearError = (div) => {
    div.innerHTML = '';
    div.style.visibility = 'hidden';
}

/**
 * Displays an error message inside the specified div and makes it visible.
 *
 * @param {HTMLElement} div - The div element where the error message will be displayed.
 * @param {string} message - The error message to display.
 */
const displayError = (div, message) => {
    div.innerHTML = translateHTML(message);
    div.style.visibility = 'visible';
}

/**
 * Checks if the provided SSN input is a valid 9-digit number based on specific criteria.
 *
 * @param {string} input - The SSN input string to validate.
 * 
 * @return {boolean} True if the input is a valid 9-digit SSN, otherwise false.
 */
const checkNineDigitValid = (input) => {

    if (input.length !== 9) return false;

    // Cannot start with 000, 666 or 900-999
    if (input[0] === '9' || input.slice(0, 3) === '666' || input.slice(0, 3) === '000') return false;
    // Cannot be 111111111, 333333333, 078-05-1120, 219-09-9999
    if (input === '111111111' || input === '333333333' || input === '078051120' || input === '219099999') return false;
    // Middle digits cannot be 00 OR Last digits cannot be 0000
    if (input.slice(3, 5) === '00' || input.slice(-4) === '0000') return false;

    return true;
}

/**
 * Checks if the provided input is a valid 4-digit number, ensuring it is not '0000'.
 *
 * @param {string} input - The 4-digit input string to validate.
 * 
 * @return {boolean} True if the input is a valid 4-digit number and not '0000', otherwise false.
 */
const checkFourDigitValid = (input) => {

    return input.length === 4 && input !== '0000';
}

/**
 * Checks if two input strings match.
 *
 * @param {string} inputOne - The first input string to compare.
 * @param {string} inputTwo - The second input string to compare.
 * 
 * @return {boolean} True if both inputs match, otherwise false.
 */
const checkMatch = (inputOne, inputTwo) => {
    return inputOne === inputTwo;
}

/**
 * Displays a modal and sets up a callback function to be executed when the modal's continue button is clicked.
 * It initializes and shows a bootstrap modal, and attaches an event listener to the modal's continue button.
 * When the continue button is clicked, it checks if `onContinue` is a function and calls it.
 *
 * @param {Function} onContinue - A callback function to be executed when the modal's continue button is clicked.
 */
const displayModal = (onContinue) => {
    translateHTML(document.getElementById('ssnSoftModal'));
    const softModal = new bootstrap.Modal(document.getElementById('ssnSoftModal'));
    softModal.show();

    const continueButton = document.getElementById('ssnSoftModalContinueButton');

    continueButton.removeEventListener('click', handleModalContinue);
    continueButton.addEventListener('click', handleModalContinue);

    function handleModalContinue() {
        if (typeof onContinue === 'function') {
            onContinue();
        }
        softModal.hide();
    }
}

/**
 * Updates the raw input string based on the user's interaction with an input field.
 * This function adjusts the raw input by adding or removing characters based on the user's input
 * and manages the positioning of characters considering any hyphens present in the value.
 *
 * @param {Event} event - The input event triggered by the user's interaction with the input field.
 * @param {string} rawInput - The current raw input string before the event's changes.
 * 
 * @return {string} The updated raw input string after applying the changes from the input event.
 */
const setRawInput = (event, rawInput) => {
    
    const input = event.data;
    const value = event.target.value;
    let position = event.target.selectionStart;
    
    for (let i = 0; i < event.target.selectionStart; i++) {
        if (value[i] === '-') {
            position--;
        }
    }

    if (input !== null && /\d/.test(input)) {
        rawInput = rawInput.slice(0, position - 1) + input + rawInput.slice(position - 1);
    } else {
        rawInput = rawInput.slice(0, position) + rawInput.slice(position + 1);
    }

    return rawInput;
}

/**
 * Inserts hyphens into a string at specific positions.
 * Hyphens are inserted after the third and fifth characters of the input string.
 *
 * @param {string} rawInput - The original string where hyphens are to be added.
 * 
 * @return {string} The modified string with hyphens inserted after the third and fifth characters.
 */
const addHyphens = (rawInput) => {

    let value = '';

    for(let i = 0; i < rawInput.length; i++) {
        if(i === 3 || i === 5) {
            value += '-';
        }
        value += rawInput[i];
    }

    return value;
}

/**
 * Masks the given value by replacing all characters except hyphens with asterisks, based on the specified condition.
 *
 * @param {string} value - The string value to be masked.
 * @param {boolean} show - Determines whether to show the original value or the masked value.
 *                         If true, the original value is returned. If false, all characters
 *                         except hyphens are replaced with asterisks.
 * 
 * @return {string} The original value if `show` is true; otherwise, a masked string with 
 *                  all characters except hyphens replaced by asterisks.
 */
const digitMask = (value, show) => {
    return show ? value : value.replace(/[^-]/g, '*');
}

/**
 * Calculates the new cursor position within an input field, considering the addition or deletion
 * of characters and the presence of hyphens.
 *
 * @param {number} originalPosition - The original position of the cursor before the input change.
 * @param {boolean} isAdding - Indicates whether a character is being added to the input.
 * @param {boolean} isDeleting - Indicates whether a character is being deleted from the input.
 * @param {boolean} considerHyphens - Indicates whether hyphens in the input should affect the calculation.
 * 
 * @return {number} The new position of the cursor after the input change.
 */
const calculateNewPosition = (originalPosition, isAdding, isDeleting, considerHyphens) => {

    let newPosition = originalPosition;

    if(considerHyphens) {
        if (isAdding && (originalPosition === 4 || originalPosition === 7)) {
            newPosition++;
        } 
        else if (isDeleting && (originalPosition === 4 || originalPosition === 7)) {
            newPosition--;
        }
    }

    return newPosition;
}