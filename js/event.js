import { allCountries, dataSavingBtn, storeResponse, validatePin, generateNewToken, showAnimation, hideAnimation, sites, errorMessage, BirthMonths, getAge, getMyData, 
    hasUserData, retrieveNotifications, toggleNavbarMobileView, appState, logDDRumError, translateHTML, translateText, firebaseSignInRender, emailAddressValidation, emailValidationStatus, emailValidationAnalysis, validNameFormat } from "./shared.js";
import { consentTemplate } from "./pages/consent.js";
import { heardAboutStudy, healthCareProvider, duplicateAccountReminderRender } from "./pages/healthCareProvider.js";
import { myToDoList } from "./pages/myToDoList.js";
import { suffixToTextMap, getFormerNameData, formerNameOptions } from "./settingsHelpers.js";
import fieldMapping from "./fieldToConceptIdMapping.js";
import {signUpRender} from "./pages/homePage.js";

export const addEventsConsentSign = () => {
    document.getElementById('CSFirstName').addEventListener('keyup', () => {
        document.getElementById('CSSign').value = document.getElementById('CSFirstName').value.trim() +' '+document.getElementById('CSLastName').value.trim()
    });
    document.getElementById('CSLastName').addEventListener('keyup', () => {
        document.getElementById('CSSign').value = document.getElementById('CSFirstName').value.trim() +' '+document.getElementById('CSLastName').value.trim()
    });

    const CSWFirstName = document.getElementById('CSWFirstName');
    const CSWLastName = document.getElementById('CSWLastName');

    if(CSWFirstName && CSWLastName){
        CSWFirstName.addEventListener('keyup', () => {
            document.getElementById('CSWSign').value = CSWFirstName.value.trim() +' '+CSWLastName.value.trim()
        });
        CSWLastName.addEventListener('keyup', () => {
            document.getElementById('CSWSign').value = CSWFirstName.value.trim() +' '+CSWLastName.value.trim()
        });
    }
}

export const addEventAddressAutoComplete = (id, country) => {
    let autocomplete = {};
    const UPAddressLine1 = document.getElementById(`UPAddress${id}Line1`);
    const UPAddressCity = document.getElementById(`UPAddress${id}City`);
    const UPAddressState = document.getElementById(`UPAddress${id}State`);
    const UPAddressZip = document.getElementById(`UPAddress${id}Zip`);
    if(!UPAddressLine1) return;
    UPAddressLine1.addEventListener('focus', () => {
        autocomplete = new google.maps.places.Autocomplete(document.getElementById(`UPAddress${id}Line1`), {types: ['geocode']});
        autocomplete.setFields(['address_component']);
        let addressLine1 = '';
        let addressCity = '';
        let addressState = '';
        let addressZip = '';
        let addressCountry = '';
        autocomplete.addListener('place_changed', () => {
            const address = autocomplete.getPlace();
            const addressComponents = address['address_components']; // TODO: datadog error -- TypeError: undefined is not an object (evaluating 'address['address_components']')
            addressComponents.forEach(value => {
                if(value.types.indexOf('street_number') !== -1) addressLine1 = value.long_name;
                if(value.types.indexOf('route') !== -1) addressLine1 += ' '+value.long_name;
                if(value.types.indexOf('locality') !== -1) addressCity = value.long_name;
                if(value.types.indexOf('administrative_area_level_1') !== -1) addressState = value.long_name;
                if(value.types.indexOf('postal_code') !== -1) addressZip = value.long_name;
                if(value.types.indexOf('country') !== -1) addressCountry = value.long_name;
            });
            UPAddressLine1.value = addressLine1;
            UPAddressCity.value = addressCity;
            UPAddressState.value = addressState;
            UPAddressZip.value = addressZip;
            
            if(country){
                const UPAddress1Country = document.getElementById(`UPAddress${id}Country`);
                const lowerCaseCountries = Object.keys(allCountries).map(s => s.trim().toLowerCase());
                const stateValue = lowerCaseCountries.indexOf(addressCountry.trim().toLowerCase()) + 1;
                UPAddress1Country.value = stateValue;
            }
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                let geolocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                let circle = new google.maps.Circle({center: geolocation, radius: position.coords.accuracy});
                autocomplete.setBounds(circle.getBounds());
            });
        }
    });
}

const getDaysTemplate = (month) => {
    const monthLengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysInMonth = monthLengths[parseInt(month, 10) - 1];

    const options = [];

    for (let i = 1; i <= daysInMonth; i++) {
        options.push(
            `<option class="option-dark-mode" value=${i < 10 ? `0${i}` : i}>${i}</option>`
        );
    }

    return options.join('');
};

export const addEventMonthSelection = () => {
    const UPMonth = document.getElementById('UPMonth');
    UPMonth.addEventListener('change', () => {
        const value = UPMonth.value;
        let template = '<option class="option-dark-mode" value="" data-i18n="event.selectBirthDay">-- Select birth day --</option>';
        template += getDaysTemplate(value);
        document.getElementById('UPDay').innerHTML = translateHTML(template);
    });
}
export const addEventMonthConfirmationSelection = () => {
    const UPMonthConfirmation = document.getElementById('UPMonthConfirmation');
    UPMonthConfirmation.addEventListener('change', () => {
        const value = UPMonthConfirmation.value;
        let template = '<option class="option-dark-mode" value="" data-i18n="event.selectBirthDayConfirmation">Re-select birth day</option>';
        template += getDaysTemplate(value);
        document.getElementById('UPDayConfirmation').innerHTML = translateHTML(template);
    });
}

export const addYearsOptions = () => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 66;
    const minYear = currentYear - 40;
    let template = '';
    for(let i = maxYear; i<= minYear; i++) {
        template += `<option class="option-dark-mode" value="${i}">`
    }
    document.getElementById('yearsOption').innerHTML = template;
}

export const addEventChangeFocus = () => {
    const element11 = document.getElementById('UPPhoneNumber11');
    element11.addEventListener('keyup', () => {
        if(element11.value.trim().length === 3){
            element11.nextElementSibling.nextElementSibling.focus()
        }
    });

    const element12 = document.getElementById('UPPhoneNumber12');
    element12.addEventListener('keyup', () => {
        if(element12.value.trim().length === 3){
            element12.nextElementSibling.nextElementSibling.focus()
        }
    });

    const element21 = document.getElementById('UPPhoneNumber21');
    element21.addEventListener('keyup', () => {
        if(element21.value.trim().length === 3){
            element21.nextElementSibling.nextElementSibling.focus()
        }
    });

    const element22 = document.getElementById('UPPhoneNumber22');
    element22.addEventListener('keyup', () => {
        if(element22.value.trim().length === 3){
            element22.nextElementSibling.nextElementSibling.focus()
        }
    });

    const element31 = document.getElementById('UPPhoneNumber31');
    element31.addEventListener('keyup', () => {
        if(element31.value.trim().length === 3){
            element31.nextElementSibling.nextElementSibling.focus()
        }
    });
    
    const element32 = document.getElementById('UPPhoneNumber32');
    element32.addEventListener('keyup', () => {
        if(element32.value.trim().length === 3){
            element32.nextElementSibling.nextElementSibling.focus()
        }
    });
}

export const addEventHealthCareProviderSubmit = () => {
    const form = document.getElementById('eligibilityForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        
        const value = parseInt(document.getElementById('827220437').value);
        
        let modalBody = document.getElementById('HealthProviderModalBody');
        let modalButton = document.getElementById('openModal');
        modalBody.innerHTML = translateHTML(`<span data-i18n="event.sureAboutProvider">Are you sure </span>${sites()[value]}<span data-i18n="event.sureAboutProviderEnd"> is your healthcare provider?</span>`);
        modalButton.click();
    });
}

export const addEventHealthProviderModalSubmit = () => {
    const form = document.getElementById('modalConfirm');
    
    form.addEventListener('click', async e => {
        let disappear = document.getElementById('modalCancel');
        disappear.click();
        const value = parseInt(document.getElementById('827220437').value);
        dataSavingBtn('save-data');
        let formData = {};
        formData["827220437"] = value;
        localStorage.eligibilityQuestionnaire = JSON.stringify(formData);
        const response = await storeResponse(formData);
        if(response.code === 200) {
            const mainContent = document.getElementById('root');
            mainContent.innerHTML = heardAboutStudy();
            addEventHeardAboutStudy();
        }
    })
}

export const addEventHeardAboutStudy = () => {
    const form = document.getElementById('heardAboutStudyForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        dataSavingBtn('save-data');

        const getValue = (id) => document.getElementById(id).checked ? fieldMapping.yes : fieldMapping.no;
        const { heardAboutStudyCheckBoxes } = fieldMapping;
        const inputData = {};
        inputData[heardAboutStudyCheckBoxes.checkbox1]= getValue('checkbox1');
        inputData[heardAboutStudyCheckBoxes.checkbox2] = getValue('checkbox2');
        inputData[heardAboutStudyCheckBoxes.checkbox3] = getValue('checkbox3');
        inputData[heardAboutStudyCheckBoxes.checkbox4] = getValue('checkbox4');
        inputData[heardAboutStudyCheckBoxes.checkbox5] = getValue('checkbox5');
        inputData[heardAboutStudyCheckBoxes.checkbox6] = getValue('checkbox6');
        inputData[heardAboutStudyCheckBoxes.checkbox7] = getValue('checkbox7');
        inputData[heardAboutStudyCheckBoxes.checkbox8] = getValue('checkbox8');
        inputData[heardAboutStudyCheckBoxes.checkbox9] = getValue('checkbox9');
        inputData[heardAboutStudyCheckBoxes.checkbox10] = getValue('checkbox10');
        inputData[heardAboutStudyCheckBoxes.checkbox11] = getValue('checkbox11');
        inputData[heardAboutStudyCheckBoxes.checkbox12] = getValue('checkbox12');
        inputData[heardAboutStudyCheckBoxes.checkbox13] = getValue('checkbox13');
        inputData[heardAboutStudyCheckBoxes.checkbox14] = getValue('checkbox14');
        inputData[heardAboutStudyCheckBoxes.checkbox15] = getValue('checkbox15');
        inputData[heardAboutStudyCheckBoxes.checkbox16] = getValue('checkbox16');
        inputData[heardAboutStudyCheckBoxes.checkbox17] = getValue('checkbox17');
        inputData[heardAboutStudyCheckBoxes.checkbox18] = getValue('checkbox18');
        inputData[heardAboutStudyCheckBoxes.checkbox19] = getValue('checkbox19');
        

        const formData = {};
        formData[fieldMapping.heardAboutStudyForm] = inputData;
        
        const response = await storeResponse(formData);
        if(response.code === 200) {
            consentTemplate();
        }
    });
}

export const addEventSaveConsentBtn = () => {
    const btn = document.getElementById('saveConsentBtn');
    btn.addEventListener('click', () => {
        html2canvas(document.getElementById('canvasContainer')).then(function(canvas) {
            document.getElementById("consentImg").src= canvas.toDataURL();
        });
    })
}

const onBlurPhysicalAddressLine = (event, id) => {
    const UPAddressCity = document.getElementById(`UPAddress${id}City`);
    const UPAddressState = document.getElementById(
        `UPAddress${id}State`
    );
    const UPAddressZip = document.getElementById(`UPAddress${id}Zip`);

    const UPAddressCityLabel = document.getElementById(
        `UPAddress${id}CityLabel`
    );
    const UPAddressStateLabel = document.getElementById(
        `UPAddress${id}StateLabel`
    );
    const UPAddressZipLabel = document.getElementById(
        `UPAddress${id}ZipLabel`
    );

    UPAddressCity.classList.remove("required-field");
    UPAddressState.classList.remove("required-field");
    UPAddressZip.classList.remove("required-field");
    UPAddressCityLabel.setAttribute(
        "data-i18n",
        "form.mailAddressCityLabel"
    );
    UPAddressStateLabel.setAttribute(
        "data-i18n",
        "form.mailAddressStateLabel"
    );
    UPAddressZipLabel.setAttribute(
        "data-i18n",
        "form.mailAddressZipLabel"
    );

    if (event.target.value) {
        UPAddressCity.classList.add("required-field");
        UPAddressState.classList.add("required-field");
        UPAddressZip.classList.add("required-field");
        UPAddressCityLabel.setAttribute(
            "data-i18n",
            "form.mailAddressCityLabelRequired"
        );
        UPAddressStateLabel.setAttribute(
            "data-i18n",
            "form.mailAddressStateLabelRequired"
        );
        UPAddressZipLabel.setAttribute(
            "data-i18n",
            "form.mailAddressZipLabelRequired"
        );
    }
};

export const addEventPhysicalAddressLine = (id) => {
    const UPAddressLine1 = document.getElementById(
        `UPAddress${id}Line1`
    );

    UPAddressLine1.addEventListener("blur", (event) => onBlurPhysicalAddressLine(event, id));
};

export const addEventFormerName = () => {
    const addMoreFormerNameDiv = document.getElementById("addMoreFormerName");
    addMoreFormerNameDiv.addEventListener("click", addMoreFormerName);
};

const getFormerNameCategoryTitleElement = () => {
    const label = document.createElement('label');	
    label.classList.add('col-form-label', 'col-md-3')
    label.setAttribute('data-i18n', "form.formerNameCategoryTitle");
    return label
}
const getFormerNameValueTitleElement = () => {
    const label = document.createElement('label');	
    label.classList.add('col-form-label', 'col-md-3')
    label.setAttribute('data-i18n', "form.formerNameValueTitle");
    return label
}

export const addMoreFormerName = () => {
    const div = document.getElementById("former-name-group");
    const formerNameItems = document.getElementsByClassName("former-name-item");
    const inputId = `former-name-value-${formerNameItems.length + 1}`;
    const selectId = `former-name-category-${formerNameItems.length + 1}`;

    const div1 = document.createElement('div');	
    div1.classList.add('former-name-item')

    const div1_1 = document.createElement('div');
    div1_1.classList.add('form-group', 'row')
	
    const select = document.createElement('select');	
    select.classList.add('form-control', 'col-md-3');
    select.setAttribute('data-i18n', "form.formerNameCategory");
    select.setAttribute('data-error-required', translateText('form.formerNameCategory'));
    select.style = "max-width:190px"
    select.id = selectId;	

    formerNameOptions.forEach((option) => {
        const opt = document.createElement("option");
        opt.classList.add("option-dark-mode");
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute("data-i18n", option.i18n);
        select.appendChild(translateHTML(opt));
    });

    div1_1.appendChild(translateHTML(getFormerNameCategoryTitleElement()));
    div1_1.appendChild(translateHTML(select));
    div1.appendChild(div1_1);

    const div1_2 = document.createElement('div');	
    div1_2.classList.add('form-group', 'row')

    const input = document.createElement('input');	
    input.classList.add('form-control', 'col-md-3', 'input-validation');
    input.setAttribute('data-i18n', "form.formerNameValue");
    input.setAttribute('data-validation-pattern', "alphabets");
    input.setAttribute('data-error-validation', "Your former name should contain only uppercase and lowercase letters. Please do not use any numbers or special characters.");
    input.placeholder = 'Enter former name';	
    input.style = "max-width:190px"
    input.type = 'text';	
    input.id = inputId;	

    div1_2.appendChild(translateHTML(getFormerNameValueTitleElement()));
    div1_2.appendChild(translateHTML(input));
    div1.appendChild(div1_2);

    div.appendChild(div1);
    const inputElement = document.getElementById(inputId);
    inputElement.addEventListener("blur", () => {
        const selectElement = document.getElementById(selectId);
        selectElement.classList.remove("required-field");
        if (inputElement.value) {
            selectElement.classList.add("required-field");
        }
    });
};

export const addEventAdditionalEmail = () => {	
    const addMoreEmail = document.getElementById('addMoreEmail');	
    addMoreEmail.addEventListener('click', addEmailFields);	
}

const addEmailFields = () => {
    const div = document.getElementById('multipleEmail1');	
    div.innerHTML = '';	
    div.classList = ['form-group row'];
    div.style = "padding-top:0; padding-bottom:0;";
    
    const div1 = document.createElement('div');	
    div1.innerHTML = '';	
    div1.classList = ['col'];

    const input = document.createElement('input');	
    input.classList = ['form-control col-md-4'];
    input.setAttribute('data-i18n', "event.emailPlaceholder2");
    input.placeholder = 'Enter additional email 2';	
    input.style = "margin-left:0px; max-width:382px;"
    input.type = 'text';	
    input.id = 'UPAdditionalEmail2';	
    input.title = ' Please enter an email address in this format: name@example.com.';

    div1.appendChild(translateHTML(input));
    div.appendChild(div1);
    
    document.getElementById('additionalEmailBtn').innerHTML = translateHTML(`<button type="button" data-i18n="form.addMoreEmail" class="btn btn-light" id="addMoreEmail2" title="Add more email">Add more <i class="fas fa-plus"></i></button>`);
    
    const addMoreEmail2 = document.getElementById('addMoreEmail2');	
    addMoreEmail2.addEventListener('click', addAnotherEmailField)	
}

const addAnotherEmailField = () => {	
    const div = document.getElementById('multipleEmail2');	
    div.innerHTML = '';	
    div.classList = ['form-group row'];
    div.style = "padding-top:0; padding-bottom:0;";
    
    const div1 = document.createElement('div');	
    div1.innerHTML = '';	
    div1.classList = ['col']; 	

    const input2 = document.createElement('input');	
    input2.classList = ['form-control col-md-4'];
    input2.setAttribute('data-i18n', 'event.emailPlaceholder3');	
    input2.style = "margin-left:0px; max-width:382px;"
    input2.placeholder = 'Enter additional email 3';	
    input2.type = 'text';	
    input2.id = 'UPAdditionalEmail3';	
    input2.title = ' Please enter an email address in this format: name@example.com.';
    
    div1.appendChild(translateHTML(input2));
    div.appendChild(div1);

    const br = document.getElementById('multipleEmail2Br');	
    br.style=""

    document.getElementById('additionalEmailBtn').innerHTML = '';
}

export const addEventUPSubmit = async () => {
    const userProfileForm = document.getElementById('userProfileForm');
    userProfileForm.addEventListener('submit', async e => {
        e.preventDefault();
        removeAllErrors();
        const requiredFields = document.getElementsByClassName('required-field');
        const confirmationFields = document.getElementsByClassName('confirmation-field');
        const validations = document.getElementsByClassName('input-validation');
        const numberValidations = document.getElementsByClassName('num-val');
        const radios = document.getElementsByName('UPRadio');
        let hasError = false;
        let focus = true;
        Array.from(validations).forEach(element => {
            if(element.value){
                const validationPattern = element.dataset.validationPattern;
                if(validationPattern && validationPattern === 'alphabets') {
                    if(!validNameFormat.test(element.value)) {
                        errorMessage(element.id, element.dataset.errorValidation, focus)
                        focus = false;
                        hasError = true;
                    }
                }
                if(validationPattern && validationPattern === 'year') {
                    if(!/^(19|20)[0-9]{2}$/.test(element.value)) {
                        errorMessage(element.id, element.dataset.errorValidation, focus)
                        focus = false;
                        hasError = true;
                    }
                    else {
                        if(element.value.length > 4) {
                            errorMessage(element.id, element.dataset.errorValidation, focus)
                            focus = false;
                            hasError = true;
                        }
                        else if (parseInt(element.value) > new Date().getFullYear()) {
                            errorMessage(element.id, element.dataset.errorValidation, focus)
                            focus = false;
                            hasError = true;
                        }
                    }
                }
                if(validationPattern && validationPattern === 'numbers') {
                    if(!/^[0-9]*$/.test(element.value)) {
                        errorMessage(element.id, element.dataset.errorValidation, focus)
                        focus = false;
                        hasError = true;
                    }
                }
            }
        });
        Array.from(requiredFields).forEach(element => {
            if(!element.value){
                errorMessage(element.id, `${element.dataset.errorRequired}`, focus);
                focus = false;
                hasError = true;
            }
            if(element.type === 'checkbox' && element.checked === false && element.hidden === false){
                errorMessage(element.id, `${element.dataset.errorRequired}`, focus);
                focus = false;
                hasError = true;
            }    
        });
        Array.from(confirmationFields).forEach(element => {
            const target = element.getAttribute('target')
            const targetElement= document.getElementById(target)

            if(element.value !== targetElement.value){
                errorMessage(element.id, `${element.dataset.errorConfirmation}`, focus);
                focus = false;
                hasError = true;
            }
        });
        
        if(!(document.getElementById('UPCancer1').checked|| document.getElementById('UPCancer2').checked)){
            errorMessage('UPCancerBtnGroup', '<span data-i18n="event.provideResponse">'+translateText('event.provideResponse')+'</span>', focus);
            focus = false;
            hasError = true;
        }
        let radioChecked = false;
        Array.from(radios).forEach(element => {
            if(element.checked) radioChecked = true;
        });

        const phoneNo = `${document.getElementById('UPPhoneNumber11').value}${document.getElementById('UPPhoneNumber12').value}${document.getElementById('UPPhoneNumber13').value}`;
        const phoneNo2 = `${document.getElementById('UPPhoneNumber21').value}${document.getElementById('UPPhoneNumber22').value}${document.getElementById('UPPhoneNumber23').value}`;
        const phoneNo3 = `${document.getElementById('UPPhoneNumber31').value}${document.getElementById('UPPhoneNumber32').value}${document.getElementById('UPPhoneNumber33').value}`;
        const email = document.getElementById('UPEmail').value;
        const email2 = document.getElementById('UPEmail2');
        const email3 = document.getElementById('UPAdditionalEmail2');
        const email4 = document.getElementById('UPAdditionalEmail3');
        let zip = document.getElementById('UPAddress1Zip').value;
        let city = document.getElementById('UPAddress1City');
        if(!email){
            errorMessage('UPEmail', '<span data-i18n="event.enterEmail">'+translateText('event.enterEmail')+'</span>', focus);
            focus = false;
            hasError = true;
        }
        if(!phoneNo && !phoneNo2 && !phoneNo3){
            errorMessage('UPPhoneNumber11');
            errorMessage('UPPhoneNumber12');
            errorMessage('UPPhoneNumber13');
            errorMessage('mainMobilePhone', '<span data-i18n="event.phoneRequired">'+translateText('event.phoneRequired')+'</span>', focus);
            errorMessage('UPPhoneNumber21');
            errorMessage('UPPhoneNumber22');
            errorMessage('UPPhoneNumber23');
            errorMessage('mainMobilePhone2', '<span data-i18n="event.phoneRequired">'+translateText('event.phoneRequired')+'</span>');
            errorMessage('UPPhoneNumber31');
            errorMessage('UPPhoneNumber32');
            errorMessage('UPPhoneNumber33');
            errorMessage('mainMobilePhone3', '<span data-i18n="event.phoneRequired">'+translateText('event.phoneRequired')+'</span>');
            focus = false;
            hasError = true;
        }
        if(phoneNo && phoneNo.length < 10 ){
            errorMessage('UPPhoneNumber11');
            errorMessage('UPPhoneNumber12');
            errorMessage('UPPhoneNumber13');
            errorMessage('mainMobilePhone', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber11').focus();
            focus = false;
            hasError = true;
        }
        if(phoneNo2 && phoneNo2.length < 10 ){
            errorMessage('UPPhoneNumber21');
            errorMessage('UPPhoneNumber22');
            errorMessage('UPPhoneNumber23');
            errorMessage('mainMobilePhone2', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber21').focus();
            focus = false;
            hasError = true;
        }
        if(phoneNo3 && phoneNo3.length < 10 ){
            errorMessage('UPPhoneNumber31');
            errorMessage('UPPhoneNumber32');
            errorMessage('UPPhoneNumber33');
            errorMessage('mainMobilePhone3', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber31').focus();
            focus = false;
            hasError = true;
        }
        if(phoneNo && !/[1-9]{1}[0-9]{9}/.test(phoneNo) ){
            errorMessage('UPPhoneNumber11');
            errorMessage('UPPhoneNumber12');
            errorMessage('UPPhoneNumber13');
            errorMessage('mainMobilePhone', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber11').focus();
            focus = false;
            hasError = true;
        }
        if(phoneNo2 && !/[1-9]{1}[0-9]{9}/.test(phoneNo2) ){
            errorMessage('UPPhoneNumber21');
            errorMessage('UPPhoneNumber22');
            errorMessage('UPPhoneNumber23');
            errorMessage('mainMobilePhone2', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber21').focus();
            focus = false;
            hasError = true;
        }
        if(phoneNo3 && !/[1-9]{1}[0-9]{9}/.test(phoneNo3) ){
            errorMessage('UPPhoneNumber31');
            errorMessage('UPPhoneNumber32');
            errorMessage('UPPhoneNumber33');
            errorMessage('mainMobilePhone3', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber31').focus();
            focus = false;
            hasError = true;
        }
        if(zip && !/[0-9]{5}/.test(zip) ){
            errorMessage('UPAddress1Zip', '<span data-i18n="event.zipOnlyNumbers">'+translateText('event.zipOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPAddress1Zip').focus();
            focus = false;
            hasError = true;
        }
        
        /*if(city && !/^[a-zA-Z]+$/.test(city) ){
            errorMessage('UPAddress1City', 'City name may only contain letters.');
            if(focus) document.getElementById('UPAddress1City').focus();
            focus = false;
            hasError = true;
        }*/
        const emailValidation = await emailAddressValidation({
            emails: {
                upEmail:email,
                upEmail2: email2 ? email2.value : undefined,
                upAdditionalEmail2: email3 ? email3.value : undefined,
                upAdditionalEmail3: email4 ? email4.value : undefined,
            },
        });
        
        if (emailValidationAnalysis(emailValidation.upEmail) === emailValidationStatus.INVALID) {
            errorMessage(
                "UPEmail",
                '<span data-i18n="settingsHelpers.emailInvalid">' +
                    translateText("settingsHelpers.emailInvalid") +
                    "</span>",
                focus
            );
            // Clear the "Confirm Preferred Email" field here
            document.getElementById('confirmUPEmail').value = '';
            if (focus) document.getElementById("UPEmail").focus();
            focus = false;
            hasError = true;
        }

        if (emailValidationAnalysis(emailValidation.upEmail2) === emailValidationStatus.INVALID) {
            errorMessage(
                "UPEmail2",
                '<span data-i18n="settingsHelpers.emailInvalid">' +
                    translateText("settingsHelpers.emailInvalid") +
                    "</span>",
                focus
            );
            if (focus) document.getElementById("UPEmail2").focus();
            focus = false;
            hasError = true;
        }

        if (emailValidationAnalysis(emailValidation.upAdditionalEmail2) === emailValidationStatus.INVALID) {
            errorMessage(
                "UPAdditionalEmail2",
                '<span data-i18n="settingsHelpers.emailInvalid">' +
                    translateText("settingsHelpers.emailInvalid") +
                    "</span>",
                focus
            );
            if (focus) document.getElementById("UPAdditionalEmail2").focus();
            focus = false;
            hasError = true;
        }
        
        if (emailValidationAnalysis(emailValidation.upAdditionalEmail3) === emailValidationStatus.INVALID) {
            errorMessage(
                "UPAdditionalEmail3",
                '<span data-i18n="settingsHelpers.emailInvalid">' +
                    translateText("settingsHelpers.emailInvalid") +
                    "</span>",
                focus
            );
            if (focus) document.getElementById("UPAdditionalEmail3").focus();
            focus = false;
            hasError = true;
        }

        const confirmedEmail = document.getElementById('confirmUPEmail').value;
        if(!confirmedEmail){
            errorMessage('confirmUPEmail', '<span data-i18n="event.confirmEmail">'+translateText('event.confirmEmail')+'</span>', focus);
            if(focus) document.getElementById('confirmUPEmail').focus();
            focus = false;
            hasError = true;
            
        }
        else if(confirmedEmail !== document.getElementById('UPEmail').value){
            errorMessage('confirmUPEmail', '<span data-i18n="event.emailsDoNotMatch">'+translateText('event.emailsDoNotMatch')+'</span>', focus);
            if(focus) document.getElementById('confirmUPEmail').focus();
            focus = false;
            hasError = true;
            
        }

        if(hasError) return false;
        let formData = {};
        formData['507120821'] = 602439976;
        formData['399159511'] = document.getElementById('UPFirstName').value.trim();
        formData['231676651'] = document.getElementById('UPMiddleInitial').value.trim();
        formData['996038075'] = document.getElementById('UPLastName').value.trim();
        formData['query.lastName'] = [document.getElementById('UPLastName').value.trim().toLowerCase()];
        
        let prefName = document.getElementById('UPPreferredName').value.trim();
        formData['153211406'] = prefName;

        const queryFirstNameArray = [];
        if (formData['399159511']) queryFirstNameArray.push(formData['399159511'].toLowerCase());
        if (formData['153211406'] && formData['399159511'] !== formData['153211406']) queryFirstNameArray.push(formData['153211406'].toLowerCase());
        formData['query.firstName'] = queryFirstNameArray;

        if(document.getElementById('UPSuffix').value) formData['506826178'] = parseInt(document.getElementById('UPSuffix').value);
        let month = document.getElementById('UPMonth').value;

        formData['564964481'] = month;
        formData['795827569'] = document.getElementById('UPDay').value;
        formData['544150384'] = document.getElementById('UPYear').value;
        formData['371067537'] = formData['544150384'] + formData['564964481'] + formData['795827569'];

        if(parseInt(formData['564964481']) === 2 && parseInt(formData['795827569']) === 29){
            const year = parseInt(formData['544150384']);
            const isLeapYear = ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
            if(!isLeapYear){
                errorMessage('UPDay', '<span data-i18n="event.invalidDay">'+translateText('event.invalidDay')+'</span>', true);
                return false;
            }
        }

        formData[fieldMapping.userProfileHistory] = {};
        // User Profile Former Name
        const formerNameData = getFormerNameData();
        if (formerNameData)
            formData[fieldMapping.userProfileHistory].formerdata =
                formerNameData;

        // User Profile Place of Birth
        formData['876546260'] = document.getElementById('cityOfBirth').value;
        formData['337485417'] = document.getElementById('stateOfBirth').value;
        formData['384576626'] = document.getElementById('countryOfBirth').value;

        const gender = document.getElementsByName('UPRadio');
        Array.from(gender).forEach(radioBtn => {
            if(radioBtn.checked) formData['383945929'] = parseInt(radioBtn.value);
        });

        // Contact Information
        const allPhoneNo = [];
        // Mobile phone
        if(document.getElementById('UPPhoneNumber11').value && document.getElementById('UPPhoneNumber12').value && document.getElementById('UPPhoneNumber13').value) {
            formData['388711124'] = `${document.getElementById('UPPhoneNumber11').value}${document.getElementById('UPPhoneNumber12').value}${document.getElementById('UPPhoneNumber13').value}`;
            allPhoneNo.push(`${document.getElementById('UPPhoneNumber11').value}${document.getElementById('UPPhoneNumber12').value}${document.getElementById('UPPhoneNumber13').value}`);
        }
        const voiceMailPermission = document.getElementsByName('voiceMailPermission1');
        Array.from(voiceMailPermission).forEach(radioBtn => {
            if(radioBtn.checked) formData['271757434'] = parseInt(radioBtn.value);
        });
        const textPermission1 = document.getElementsByName('textPermission1');
        Array.from(textPermission1).forEach(radioBtn => {
            if(radioBtn.checked) formData['646873644'] = parseInt(radioBtn.value);
        });

        // Home phone
        if(document.getElementById('UPPhoneNumber21').value && document.getElementById('UPPhoneNumber22').value && document.getElementById('UPPhoneNumber23').value) {
            formData['438643922'] = `${document.getElementById('UPPhoneNumber21').value}${document.getElementById('UPPhoneNumber22').value}${document.getElementById('UPPhoneNumber23').value}`;
            allPhoneNo.push(`${document.getElementById('UPPhoneNumber21').value}${document.getElementById('UPPhoneNumber22').value}${document.getElementById('UPPhoneNumber23').value}`)
        }
        const voiceMailPermission2 = document.getElementsByName('voiceMailPermission2');
        Array.from(voiceMailPermission2).forEach(radioBtn => {
            if(radioBtn.checked) formData['187894482'] = parseInt(radioBtn.value);
        });
        if(allPhoneNo.length > 0) formData['query.allPhoneNo'] = allPhoneNo

         // Other phone
        if(document.getElementById('UPPhoneNumber31').value && document.getElementById('UPPhoneNumber32').value && document.getElementById('UPPhoneNumber33').value) {
            formData['793072415'] = `${document.getElementById('UPPhoneNumber31').value}${document.getElementById('UPPhoneNumber32').value}${document.getElementById('UPPhoneNumber33').value}`;
            allPhoneNo.push(`${document.getElementById('UPPhoneNumber31').value}${document.getElementById('UPPhoneNumber32').value}${document.getElementById('UPPhoneNumber33').value}`)
        }
        const voiceMailPermission3 = document.getElementsByName('voiceMailPermission3');
        Array.from(voiceMailPermission3).forEach(radioBtn => {
            if(radioBtn.checked) formData['983278853'] = parseInt(radioBtn.value);
        });
        if(allPhoneNo.length > 0) formData['query.allPhoneNo'] = allPhoneNo

        // Email
        const allEmails = [];
        if(document.getElementById('UPEmail').value) {
            formData['869588347'] = document.getElementById('UPEmail').value.trim();
            allEmails.push(document.getElementById('UPEmail').value.toLowerCase().trim());
        }

        if(document.getElementById('UPEmail2').value) {
            formData['849786503'] = document.getElementById('UPEmail2').value.trim();
            allEmails.push(document.getElementById('UPEmail2').value.toLowerCase().trim());
        }
        if(document.getElementById('UPAdditionalEmail2') && document.getElementById('UPAdditionalEmail2').value) {
            formData['635101039'] = document.getElementById('UPAdditionalEmail2').value.trim();
            allEmails.push(document.getElementById('UPAdditionalEmail2').value.toLowerCase().trim());
        }
        if(document.getElementById('UPAdditionalEmail3') && document.getElementById('UPAdditionalEmail3').value) {
            formData['714419972'] = document.getElementById('UPAdditionalEmail3').value.trim();
            allEmails.push(document.getElementById('UPAdditionalEmail3').value.toLowerCase().trim());
        }
        if(allEmails.length > 0) formData['query.allEmails'] = allEmails;

        // Preferred method of contact
        if(document.getElementsByName('methodOfContact')){
            Array.from(document.getElementsByName('methodOfContact')).forEach(radioBtn => {
                if(radioBtn.checked){
                    formData['524461170'] = parseInt(radioBtn.value);
                }
            })
        }

        // Mailing address
        formData['521824358'] = document.getElementById('UPAddress1Line1').value;
        if(document.getElementById('UPAddress1Line2').value) formData['442166669'] = document.getElementById('UPAddress1Line2').value;
        formData['703385619'] = document.getElementById('UPAddress1City').value;
        formData['634434746'] = document.getElementById('UPAddress1State').value;
        formData['892050548'] = document.getElementById('UPAddress1Zip').value;

        // const poBoxCheckbox = document.getElementById("poBoxCheckbox");

        // // Physical address
        // formData[fieldMapping.isPOBox] = poBoxCheckbox && poBoxCheckbox.checked ?
        //     fieldMapping.yes :
        //     fieldMapping.no

        // // Physical address info is saved regardless of whether PO Box is checked
        
        // const getFieldValue = (id) =>
        //     document.getElementById(id)?.value || "";

        // // Update formData with physical address details
        // formData[fieldMapping.physicalAddress1] = getFieldValue(
        //     "UPAddress2Line1"
        // );
        // formData[fieldMapping.physicalAddress2] = getFieldValue(
        //     "UPAddress2Line2"
        // );
        // formData[fieldMapping.physicalCity] = getFieldValue(
        //     "UPAddress2City"
        // );
        // formData[fieldMapping.physicalState] = getFieldValue(
        //     "UPAddress2State"
        // );
        // formData[fieldMapping.physicalZip] =
        //     getFieldValue("UPAddress2Zip");

        const cancer = document.getElementsByName('cancerHistory');
        Array.from(cancer).forEach(radioBtn => {
            if(radioBtn.checked) formData['452166062'] = parseInt(radioBtn.value);
        });

        if(document.getElementById('UPCancerYear') && document.getElementById('UPCancerYear').value) {
            if(parseInt(document.getElementById('UPCancerYear').value) >= parseInt(formData['544150384'])){
                formData['650597106'] = parseInt(document.getElementById('UPCancerYear').value);
            }
            else {
                errorMessage('UPCancerYear', '<span data-i18n="event.yearCancerDiagnosed">'+translateText('event.yearCancerDiagnosed')+'</span>', true);
                return false;
            }
        }
        if(document.getElementById('UPCancerType') && document.getElementById('UPCancerType').value) formData['266952173'] = document.getElementById('UPCancerType').value;
        if(document.getElementById('UPCancerDiagnosis') && document.getElementById('UPCancerDiagnosis').value) formData['494982282'] = document.getElementById('UPCancerDiagnosis').value;


        
        const ageToday = getAge(`${formData['544150384']}-${formData['564964481']}-${formData['795827569']}`);

        formData['117249500'] = ageToday;
        verifyUserDetails(formData, emailValidation);
    });
}

const openModal = () => {
    const modalElement = document.getElementById('connectMainModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
};

export const downtimeWarning = () => {
    document.getElementById('connectWarningModalHeader').style.display = 'block'; 
    document.getElementById('connectWarningModalHeader').innerHTML = `
        <h4 style="text-align:center; color:red">ATTENTION</h4>
    `;

    document.getElementById('connectWarningModalBody').innerHTML = `
        <div style="text-align:center; color:red">
            We are currently undergoing maintenance, please check back later.
        </div>
    `;

    let footer = document.getElementById('connectWarningModalFooter');
    let footerBtn = document.getElementById('warningCloseBtn');

    footer.removeChild(footerBtn);

    const tmpBtn = document.createElement('button');
    tmpBtn.dataset.target = "#connectWarningModal";
    tmpBtn.dataset.toggle = "modal";
    tmpBtn.hidden = true;
    document.body.appendChild(tmpBtn);
    tmpBtn.click();
    document.body.removeChild(tmpBtn);
}

export const environmentWarningModal = () => {
    // Ensure the warning modal is only shown once per login cycle (dev)
    const devWarningShown = appState.getState()?.isDevWarningShown;
    if (devWarningShown === true) return;

    appState.setState({ isDevWarningShown: true });

    document.getElementById('connectWarningModalHeader').style.display = 'block'; 
    document.getElementById('connectWarningModalHeader').innerHTML = `
        <h4 style="text-align:center; color:red">WARNING</h4>
    `;

    document.getElementById('connectWarningModalBody').innerHTML = `
        <div style="text-align:center; color:red">
            This is a <b>testing environment</b> where no Personal Identifiable Information (PII) or other sensitive personal information should be used.
        </div>

        </br>
        </br>

        <div style="text-align:center; color:red">
        If you are a Connect Participant, or would like to join the Connect study, please go to this site to sign up: <a href="https://myconnect.cancer.gov">https://myconnect.cancer.gov</a>
        </div>

        </br>
        </br>

        <div style="text-align:center; color:red">
            For Study Staff: I acknowledge that this is a <b>testing environment</b> and will not use personal information.
        </div>

        </br>

        <div class="col-md-4 mx-auto text-center">
            <label style="text-align:center;">Enter staff access code</label>
            <input type="text" style="text-align:center; margin:0 auto;" class="form-control input-validation row" id="testingAccessCode" name="testingAccessCode">
        </div>
    `;

    const signInBtn = document.getElementById('signInBtn');
    const modalElement = document.getElementById('connectWarningModal');
    const modal = new bootstrap.Modal(modalElement);
    modalElement.inert = false;
    modal.show();

    const testingAccessCode = document.getElementById('testingAccessCode');
    const warningCloseBtn = document.getElementById('warningCloseBtn');

    if(testingAccessCode) {
        testingAccessCode.addEventListener('keyup', () => {
            if(warningCloseBtn) warningCloseBtn.disabled = !(testingAccessCode.value == 'agree')
        });

        // allow enter key if warningCloseBtn is enabled
        testingAccessCode.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' && !warningCloseBtn.disabled) {
                e.preventDefault();
                warningCloseBtn.click();
            }
        });

        setTimeout(() => {
            testingAccessCode.focus();
        }, 500);
         
    }

    warningCloseBtn.addEventListener('click', () => {
        modalElement.inert = true;
        modal.hide();

        if (signInBtn) {
            signInBtn.focus();
        }
    });

    modalElement.addEventListener('hidden.bs.modal', (event) => {
        if (event.target === modal && signInBtn) {
            signInBtn.focus();
        }
    });
}

export const removeAllErrors = () => {
    const elements = document.getElementsByClassName('form-error');
    Array.from(elements).forEach(element => {
        const errorMsg = element.parentNode;
        const parent = element.parentNode.parentNode;
        parent.removeChild(errorMsg);
    });
    const invalids = document.getElementsByClassName('invalid');
    Array.from(invalids).forEach(element => {
        element.classList.remove('invalid');
    })
}

const verifyUserDetails = (formData, emailValidation) => {
    if(!document.getElementById('connectMainModal').classList.contains('show')) openModal();
    document.getElementById('connectModalHeader').innerHTML = translateHTML(`
    <h4 data-i18n="event.reviewProfile">Review your profile details</h4>
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    `);
    const { formerdata, physicalAddress } = formData[fieldMapping.userProfileHistory];
    let bodyHtml = `
        <div class="row">
            <div class="col" data-i18n="event.firstName">First name</div>
            <div class="col">${formData['399159511']}</div>
        </div>
        ${formData['231676651'] ? `
        <div class="row">
            <div class="col" data-i18n="event.middleName">Middle name</div>
            <div class="col">${formData['231676651']}</div>
        </div>
        `:``}
        <div class="row">
            <div class="col" data-i18n="event.lastName">Last name</div>
            <div class="col">${formData['996038075']}</div>
        </div>
        ${formData['506826178'] ? `
        <div class="row">
            <div class="col">Suffix</div>
            <div class="col" ${formData['506826178'] ? 'data-i18n="settingsHelpers.suffix'+suffixToTextMap.get(parseInt(formData['506826178'], 10)).replace('.', '')+'"' : ''}">
                ${formData['506826178'] ? translateText('settingsHelpers.suffix'+suffixToTextMap.get(parseInt(formData['506826178'], 10)).replace('.', '')) : ''}
            </div>
        </div>
        `: ``}
        ${formData['153211406'] ? `
        <div class="row">
            <div class="col" data-i18n="event.preferredName">Preferred Name</div>
            <div class="col">${formData['153211406']}</div>
        </div>
        `: ``}
        ${formerdata && formerdata.length ? `
            <div class="row">
                <div class="col"><strong data-i18n="form.formerNameSubHeader">Former Names</strong></div>
            </div>
                `: ``}`;
        if (formerdata && formerdata.length) {
            formerdata.forEach((item) => {
                bodyHtml += `<div class="row">
                                    <div class="col">
                                        ${
                                            item[fieldMapping.fName]
                                                ? translateText("settings.firstName")
                                                : item[fieldMapping.mName]
                                                ? translateText("settings.middleName")
                                                : translateText("settings.lastName")
                                        }
                                    </div>
                                    <div class="col">${
                                        item[fieldMapping.fName] ||
                                        item[fieldMapping.mName] ||
                                        item[fieldMapping.lName || ""]
                                    }</div>
                                </div>`;
            });
        }
                
    bodyHtml += `
        <div class="row">   
            <div class="col"><strong data-i18n="event.birthDate">Date of birth</strong></div>
        </div>
        <div class="row">
            <div class="col" data-i18n="event.month">Month</div>
            <div class="col" ${formData['564964481'] ? `data-i18n="shared.month${BirthMonths[formData['564964481']].replace(/^\d+\s-\s/s,'')}"` : ''}>${formData['564964481'] ? translateText(`shared.month${BirthMonths[formData['564964481']].replace(/^\d+\s-\s/s,'')}`) : ''}</div>
        </div>
        <div class="row">
            <div class="col" data-i18n="event.day">Day</div>
            <div class="col">${formData['795827569']}</div>
        </div>
        <div class="row">
            <div class="col" data-i18n="event.year">Year</div>
            <div class="col">${formData['544150384']}</div>
        </div>
        <div class="row">
            <div class="col"><strong data-i18n="form.birthPlaceSubHeader">Place of birth</strong></div>
        </div>
         <div class="row">
            <div class="col" data-i18n="form.cityOfBirth.title">City</div>
            <div class="col">${formData['876546260']}</div>
        </div>
         <div class="row">
            <div class="col" data-i18n="form.stateOfBirth.title">State</div>
            <div class="col">${formData['337485417']}</div>
        </div>
         <div class="row">
            <div class="col" data-i18n="form.countryOfBirth.title">Country</div>
            <div class="col">${formData['384576626']}</div>
        </div>
        <div class="row">
            <div class="col"><strong data-i18n="event.contactInfo">Contact Information</strong></div>
        </div>
        ${formData['388711124'] ? `
        <div class="row">
            <div class="col" data-i18n="event.mobilePhone">Mobile phone</div>
            <div class="col">${formData['388711124'].substr(0,3)} - ${formData['388711124'].substr(3,3)} - ${formData['388711124'].substr(6,4)}</div>
        </div>
        `:``}
        
        ${formData['271757434'] ? `
        <div class="row">
            <div class="col" data-i18n="event.leaveVoicemail">Can we leave a voicemail at this number?</div>
            <div class="col" data-i18n="${parseInt(formData['271757434']) === 353358909 ? 'event.optYes' : 'event.optNo'}">${parseInt(formData['271757434']) === 353358909 ? translateText('event.optYes'): translateText('event.optNo')}</div>
        </div>
        `:``}
        
        ${formData['646873644'] ? `
        <div class="row">
            <div class="col" data-i18n="event.textNumber">Can we text this number?</div>
            <div class="col" data-i18n="${parseInt(formData['646873644']) === 353358909 ? 'event.optYes' : 'event.optNo'}">${parseInt(formData['646873644']) === 353358909 ? translateText('event.optYes'): translateText('event.optNo')}</div>
        </div>
        `:``}
        
        ${formData['438643922'] ? `
        <div class="row">
            <div class="col" data-i18n="event.homePhone">Home phone</div>
            <div class="col">${formData['438643922'].substr(0,3)} - ${formData['438643922'].substr(3,3)} - ${formData['438643922'].substr(6,4)}</div>
        </div>
        `:``}
        
        ${formData['187894482'] ? `
        <div class="row">
            <div class="col" data-i18n="event.leaveVoicemail">Can we leave a voicemail at this number?</div>
            <div class="col" data-i18n="${parseInt(formData['187894482']) === 353358909 ? 'event.optYes' : 'event.optNo'}">${parseInt(formData['187894482']) === 353358909 ? translateText('event.optYes'): translateText('event.optNo')}</div>
        </div>
        `: ``}

        ${formData['793072415'] ? `
        <div class="row">
            <div class="col" data-i18n="event.otherPhone">Other phone</div>
            <div class="col">${formData['793072415'].substr(0,3)} - ${formData['793072415'].substr(3,3)} - ${formData['793072415'].substr(6,4)}</div>
        </div>
        `:``}
        
        ${formData['983278853'] ? `
        <div class="row">
            <div class="col" data-i18n="event.leaveVoicemail">Can we leave a voicemail at this number?</div>
            <div class="col" data-i18n="${parseInt(formData['983278853']) === 353358909 ? 'event.optYes' : 'event.optNo'}">${parseInt(formData['983278853']) === 353358909 ? translateText('event.optYes'): translateText('event.optNo')}</div>
        </div>
        `: ``}
        
        ${formData['869588347'] ? `
        <div class="row">
            <div class="col" data-i18n="event.preferredEmail">Preferred Email</div>
            <div class="col">
                ${formData['869588347']} <br />
                 ${emailValidationAnalysis(emailValidation.upEmail) === emailValidationStatus.WARNING ? `
                <i style="color:red" data-i18n="settingsHelpers.emailWarning">Warning- this email address may be invalid. Please double check your entry before continuing.</i>
                `:``}
            </div>
        </div>
        `:``}
        
        ${formData['849786503'] ? `
        <div class="row">
            <div class="col" data-i18n="event.additionalEmail">Additional Email</div>
            <div class="col">
                ${formData['849786503']}<br />
                 ${emailValidationAnalysis(emailValidation.upEmail2) === emailValidationStatus.WARNING ? `
                <i style="color:red" data-i18n="settingsHelpers.emailWarning">Warning- this email address may be invalid. Please double check your entry before continuing.</i>
                `:``}    
            </div>
        </div>
        `:``}

        ${formData['635101039'] ? `
        <div class="row">
            <div class="col" data-i18n="event.additionalEmail2">Additional Email 2</div>
            <div class="col">
                ${formData['635101039']}<br />
                ${emailValidationAnalysis(emailValidation.upAdditionalEmail2) === emailValidationStatus.WARNING ? `
                <i style="color:red" data-i18n="settingsHelpers.emailWarning">Warning- this email address may be invalid. Please double check your entry before continuing.</i>
                `:``}
            </div>
        </div>
        `:``}

        ${formData['714419972'] ? `
        <div class="row">
            <div class="col" data-i18n="event.additionalEmail3">Additional Email 3</div> 
            <div class="col">
                ${formData['714419972']}<br />
                ${emailValidationAnalysis(emailValidation.upAdditionalEmail3) === emailValidationStatus.WARNING ? `
                <i style="color:red" data-i18n="settingsHelpers.emailWarning">Warning- this email address may be invalid. Please double check your entry before continuing.</i>
                `:``}
            </div>
        </div>
        `:``}

        ${formData['524461170'] ? `
        <div class="row">
            <div class="col" data-i18n="event.howToReach">How do you prefer that we reach you?</div>
            <div class="col">${formData['524461170'] === 127547625 ? translateHTML('event.optSMS'): translateHTML('event.optEmail')}</div>
            <div class="col" data-i18n="${parseInt(formData['524461170']) === 127547625 ? 'event.optSMS' : 'event.optEmail'}">${parseInt(formData['524461170']) === 127547625 ? translateText('event.optSMS'): translateText('event.optEmail')}</div>
        </div>
        `:``}

        <div class="row">
            <div class="col"><strong data-i18n="event.mailAddress">Mailing address</strong></div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.line1">Line 1 (street, PO box, rural route)</div>
            <div class="col">${formData['521824358']}</div>
        </div>

        ${formData['442166669'] ? `
        <div class="row">
            <div class="col" data-i18n="event.line2">Line 2 (apartment, suite, unit, building)</div>
            <div class="col">${formData['442166669']}</div>
        </div>
        `:``}

        <div class="row">
            <div class="col" data-i18n="event.city">City</div>
            <div class="col">${formData['703385619']}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.state">State</div>
            <div class="col">${formData['634434746']}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.zip">Zip</div>
            <div class="col">${formData['892050548']}</div>
        </div>
        
        <!--${formData[fieldMapping.isPOBox] === fieldMapping.yes ? `
        <div class="row">
            <div class="col"><strong data-i18n="settings.physicalMailAddress">Physical Mailing address</strong></div>
        </div>
        `:``}

        <div class="row">
            <div class="col" data-i18n="event.poBox">Mailing address is PO Box</div>
            <div class="col" data-i18n="settings.${formData[fieldMapping.isPOBox] === fieldMapping.yes ? 'optYes': 'optNo'}">
            ${formData[fieldMapping.isPOBox] === fieldMapping.yes ? "Yes" : "No"}</div>
        </div>

        ${formData[fieldMapping.isPOBox] === fieldMapping.yes && physicalAddress[fieldMapping.physicalAddress1] ? `
        <div class="row">
            <div class="col" data-i18n="event.line1">Line 1 (street, PO box, rural route)</div>
            <div class="col">${physicalAddress[fieldMapping.physicalAddress1]}</div>
        </div>
        `:``}
 
        ${formData[fieldMapping.isPOBox] === fieldMapping.yes && physicalAddress[fieldMapping.physicalAddress2] ? `
        <div class="row">
            <div class="col" data-i18n="event.line2">Line 2 (apartment, suite, unit, building)</div>
            <div class="col">${physicalAddress[fieldMapping.physicalAddress2]}</div>
        </div>
        `:``}

        ${formData[fieldMapping.isPOBox] === fieldMapping.yes && physicalAddress[fieldMapping.physicalCity] ? `
        <div class="row">
            <div class="col" data-i18n="event.city">City</div>
            <div class="col">${physicalAddress[fieldMapping.physicalCity]}</div>
        </div>
        `:``}

        ${formData[fieldMapping.isPOBox] === fieldMapping.yes && physicalAddress[fieldMapping.physicalState] ? `
        <div class="row">
            <div class="col" data-i18n="event.state">State</div>
            <div class="col">${physicalAddress[fieldMapping.physicalState]}</div>
        </div>
        `:``}

        ${formData[fieldMapping.isPOBox] === fieldMapping.yes && physicalAddress[fieldMapping.physicalZip] ? `
        <div class="row">
            <div class="col" data-i18n="event.zip">Zip</div>
            <div class="col">${physicalAddress[fieldMapping.physicalZip]}</div>
        </div>
        `:``} -->

        ${formData['452166062'] ? `
        <div class="row">
            <div class="col" data-i18n="event.invasiveCancer">Have you ever had invasive cancer?</div>
            <div class="col" data-i18n="${parseInt(formData['452166062']) === 353358909 ? 'event.optYes' : 'event.optNo'}">${parseInt(formData['452166062']) === 353358909 ? translateText('event.optYes'): translateText('event.optNo')}</div>
        </div>
        `:``}
        
        ${formData['650597106'] ? `
        <div class="row">
            <div class="col" data-i18n="event.yearDiagnosed">What year were you diagnosed?</div>
            <div class="col">${formData['650597106']}</div>
        </div>
        `:``}

        ${formData['266952173'] ? `
        <div class="row">
            <div class="col" data-i18n="event.typeOfCancer">What type of cancer did you have?</div>
            <div class="col">${formData['266952173']}</div>
        </div>
        `:``}

        ${formData['494982282'] ? `
        <div class="row">
            <div class="col" data-i18n="event.tellAboutDiagnosis">Please tell us anything you would like us to know about your cancer diagnosis</div>
            <div class="col">${formData['494982282']}</div>
        </div>
        `:``}
    `
    document.getElementById('connectModalBody').innerHTML = translateHTML(bodyHtml);

    document.getElementById('connectModalFooter').innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Close" class="btn btn-dark" data-bs-dismiss="modal">Go Back</button>
            <button data-i18n="event.navButtonsConfirm" type="button" id="confirmReview" title="Confirm details" class="btn btn-primary consentNextButton" data-bs-dismiss="modal">Submit</button>
        </div>
    `);
    document.getElementById('connectModalFooter').style.display = 'block';

    //make sure this is not hidden


    document.getElementById('confirmReview').addEventListener('click', async () => {
        dataSavingBtn('save-data');
        formData['699625233'] = 353358909;
        formData['430551721'] = new Date().toISOString();

        const { formerdata, physicalAddress } =
            formData[fieldMapping.userProfileHistory];
        formData[fieldMapping.userProfileHistory] = formerdata || [];
        if (physicalAddress)
            formData[fieldMapping.userProfileHistory].push(physicalAddress);
        
        showAnimation();
        const response = await storeResponse(formData);
        if(response.code === 200) {
            const myData = await getMyData();
            hideAnimation();
            if(hasUserData(myData)){
                myToDoList(myData.data, true);
            }
        }
    })

}

export const addEventPinAutoUpperCase = () => {
    const pin = document.getElementById('participantPIN')
    pin.addEventListener('input', () => {
        if(pin.value) pin.value = pin.value.toUpperCase();
    })
}

export const addEventToggleSubmit = () => {
    const pin = document.getElementById('participantPIN');
    const submitButton = document.getElementById('pinSubmit');
    pin.addEventListener('input', () => {
        const pinValue = pin.value;
        submitButton.disabled = (!pinValue || pinValue == "");
    })
}

export const addEventRequestPINForm = () => {
    const form = document.getElementById('requestPINForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        showAnimation();
        const pin = document.getElementById('participantPIN').value?.trim();
        const mainContent = document.getElementById('root');
        let formData = {};
        formData[fieldMapping.firstSignInTime] = appState.getState().participantData.firstSignInTime;
        if (!formData[fieldMapping.firstSignInTime]) {
            const myData = await getMyData();
            logDDRumError(new Error(`Invalid firstSignInTime`), 'InvalidFirstSignInTimeError', {
                userAction: 'PWA sign in',
                timestamp: new Date().toISOString(),
                connectID: myData.data['Connect_ID'],
                function: 'addEventRequestPINForm'
            });
        }

        if (pin !== "") {
            const response = await validatePin(pin);
            if (response.code === 202) {
                duplicateAccountReminderRender();
            } else if (response.code === 200) {
                formData[fieldMapping.pinNumber] = pin;
                await storeResponse(formData);
                hideAnimation();
                mainContent.innerHTML =  heardAboutStudy();
                addEventHeardAboutStudy();
            } else {
                await generateNewToken();
                formData[fieldMapping.pinNumber] = pin;
                await storeResponse(formData);
                hideAnimation();
                mainContent.innerHTML = healthCareProvider();
                addEventHealthCareProviderSubmit();
                addEventHealthProviderModalSubmit();
            }

        }else{
            await generateNewToken();
            formData["828729648"] = 353358909;
            await storeResponse(formData);
            hideAnimation();
            mainContent.innerHTML = healthCareProvider();
            addEventHealthCareProviderSubmit();
            addEventHealthProviderModalSubmit();
        }
        hideAnimation();
    })
}

export const addEventCancerFollowUp = () => {
    const UPCancer1 = document.getElementById('UPCancer1Btn');
    UPCancer1.addEventListener('click', () => {
        document.getElementById('cancerFollowUp').innerHTML = translateHTML(`
            <div class="form-group row">
                <label class="col-md-4 col-form-label" data-i18n="event.yearDiagnosed">What year were you diagnosed?</label>
                <input data-i18n="event.birthField" type="text" class="form-control input-validation col-md-4" maxlength="4" id="UPCancerYear" data-validation-pattern="year" data-error-validation="Your birth year must contain four digits in the YYYY format." Placeholder="YYYY">
            </div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label" data-i18n="event.typeOfCancer">What type of cancer did you have?</label>
                <input data-i18n="event.enterTypeCancer" type="text" class="form-control col-md-4" id="UPCancerType" Placeholder="Please enter type of cancer">
            </div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label" data-i18n="event.tellAboutDiagnosis">Please tell us anything you would like us to know about your cancer diagnosis</label>
                <textarea class="form-control col-md-4" id="UPCancerDiagnosis"></textarea>
            </div>
        `);
    });

    const UPCancer2 = document.getElementById('UPCancer2Btn');
    UPCancer2.addEventListener('click', () => {
        document.getElementById('cancerFollowUp').innerHTML = ``;
    });
}

export const addEventRetrieveNotifications = () => {
    const btn = document.getElementById('retrieveNotifications');
    if(!btn) return;
    btn.addEventListener('click', () => {
        const bellIcon = document.querySelectorAll('.fa-bell')[0];
        if (bellIcon.style.color) bellIcon.style.color = '';
        if (bellIcon.classList.contains('far')){
            bellIcon.classList.remove('far');
            bellIcon.classList.add('fas');
        }
        if(document.getElementById('notificationBody')) {
            document.getElementById('notificationBody').innerHTML = `<div id="loadingAnimation" role="status" style="display: block;"></div>`;
        }
        retrieveNotificationsInBackgroound();
    });
};

export const retrieveNotificationsInBackgroound = async () => {
    const response = await retrieveNotifications();
    if(document.getElementById('notificationBody')) {
        document.getElementById('notificationBody').innerHTML = ``;
    }
    if(response.data.length > 0){
        const panelToday = document.createElement('div');
        panelToday.classList = ["card card-info notification-time-card"];

        const panelTodayHeader = document.createElement('div');
        panelTodayHeader.classList = ["card-header notification-time-header"];
        panelTodayHeader.innerHTML = 'Today'

        const panelTodayBody = document.createElement('div');
        panelTodayBody.classList = ["card-body notification-time-body"];

        const panelOld = document.createElement('div');
        panelOld.classList = ["card card-info notification-time-card"];

        const panelOldHeader = document.createElement('div');
        panelOldHeader.classList = ["card-header notification-time-header"];
        panelOldHeader.innerHTML = 'Old'

        const panelOldBody = document.createElement('div');
        panelOldBody.classList = ["card-body notification-time-body"];

        
        for(let msg of response.data){
            if(new Date(msg.notification.time).toLocaleDateString() === new Date().toLocaleDateString()){
                const div = document.createElement('div');
                div.classList = ["card notification-card"];
                const header = document.createElement('div');
                header.classList = ["card-header"];
                header.innerHTML = `${new Date(msg.notification.time).toLocaleTimeString()}`;
                const body = document.createElement('div');
                body.classList = ["card-body"];
                body.innerHTML = `${msg.notification.body}`;
                div.appendChild(header);
                div.appendChild(body);
                panelTodayBody.appendChild(div);
            }else{
                const div = document.createElement('div');
                div.classList = ["card notification-card"];
                const header = document.createElement('div');
                header.classList = ["card-header"];
                header.innerHTML = `${new Date(msg.notification.time).toLocaleString()}`;
                const body = document.createElement('div');
                body.classList = ["card-body"];
                body.innerHTML = `${msg.notification.body}`;
                div.appendChild(header);
                div.appendChild(body);
                panelOldBody.appendChild(div);
            }
        }
        if(panelTodayBody.innerText){
            panelToday.appendChild(panelTodayHeader);
            panelToday.appendChild(panelTodayBody);
            document.getElementById('notificationBody').appendChild(panelToday);
        }
        
        if(panelOldBody.innerText){
            panelOld.appendChild(panelOldHeader);
            panelOld.appendChild(panelOldBody);
            document.getElementById('notificationBody').appendChild(panelOld);
        }
    }
    else {
        document.getElementById('notificationBody').innerHTML = 'No notifications found!'
    }
}

export const toggleCurrentPage = async (route) => {
    const IDs = ['userDashboard', 'Notifications', 'userAgreements', 'userSettings', 'connectSamples', 'connectSupport', 'connectPayment'];
    IDs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const clonedElement = element.cloneNode(true);
            element.parentNode.replaceChild(clonedElement, element);

            clonedElement.addEventListener('click', () => {
                updateActiveNavItem(clonedElement);
                toggleNavbarMobileView();
            });
        }
    });
    if(route === '#' && document.getElementById('home')) document.getElementById('home').click();
    if(route === '#dashboard') document.getElementById('userDashboard').click();
    if(route === '#messages') document.getElementById('Notifications').click();
    if(route === '#forms') document.getElementById('userAgreements').click();
    if(route === '#myprofile') document.getElementById('userSettings').click();
    if(route === '#support') document.getElementById('connectSupport').click();
    if(route === '#samples') document.getElementById('connectSamples').click();
    if(route === '#payment') document.getElementById('connectPayment').click();
}

export const toggleCurrentPageNoUser = async () => {
    const IDs = ['home', 'about', 'expectations', 'privacy'];
    IDs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const clonedElement = element.cloneNode(true);
            element.parentNode.replaceChild(clonedElement, element);

            clonedElement.addEventListener('click', () => {
                updateActiveNavItem(clonedElement);
                toggleNavbarMobileView();
            });
        }
    });
}

export const updateActiveNavItem = (clonedElement) => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('current-page');
    });

    clonedElement.closest('.nav-item').classList.add('current-page');
}

export const addEventCheckCanText = () => {
} 

export const addEventLanguageSelection = () => {
    const selector = document.getElementById('languageSelector');
    if(!selector) {
        console.warn('Language Selector Not Found');
        return;
    }
    selector.addEventListener('change', async (e) => { 
        const selectedLanguage = parseInt(e.target.value, 10);
        window.localStorage.setItem('preferredLanguage', selectedLanguage);
        appState.setState({"language": selectedLanguage});
        translateHTML(document.body);
        const wrapperDiv = document.getElementById("signInWrapperDiv");
        if (wrapperDiv && wrapperDiv.dataset.uiType === 'signIn' && 
            (wrapperDiv.dataset.accountType === 'phone' || wrapperDiv.dataset.accountType === 'email')) {
            const account = {type: wrapperDiv.dataset.accountType, value: wrapperDiv.dataset.accountValue};
            await firebaseSignInRender({account});
        } else if (wrapperDiv && wrapperDiv.dataset.uiType === 'signUp') {
            await signUpRender({signUpType: wrapperDiv.dataset.signupType})
        }
    });
}