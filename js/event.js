import { allCountries, dataSavingBtn, storeResponse, validatePin, createParticipantRecord, showAnimation, hideAnimation, sites, errorMessage, BirthMonths, getAge, getMyData, 
    hasUserData, retrieveNotifications, toggleNavbarMobileView, appState, logDDRumError, showErrorAlert, translateHTML, translateText, firebaseSignInRender, emailAddressValidation, emailValidationStatus, emailValidationAnalysis, validEmailFormat, validNameFormat, addressValidation, statesWithAbbreviations, swapKeysAndValues } from "./shared.js";
import { consentTemplate } from "./pages/consent.js";
import { heardAboutStudy, healthCareProvider, duplicateAccountReminderRender, requestPINTemplate } from "./pages/healthCareProvider.js";
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

    const googlePlacesInitiation = () => {
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
        UPAddressLine1.removeEventListener('focus', googlePlacesInitiation)     
    }

    UPAddressLine1.addEventListener('focus', googlePlacesInitiation)      
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

    const altMobile1 = document.getElementById('altContactMobilePhone1');
    altMobile1.addEventListener('keyup', () => {
        if (altMobile1.value.trim().length === 3) {
            altMobile1.nextElementSibling.nextElementSibling.focus()
        }
    });

    const altMobile2 = document.getElementById('altContactMobilePhone2');
    altMobile2.addEventListener('keyup', () => {
        if (altMobile2.value.trim().length === 3) {
            altMobile2.nextElementSibling.nextElementSibling.focus()
        }
    });

    const altHome1 = document.getElementById('altContactHomePhone1');
    altHome1.addEventListener('keyup', () => {
        if (altHome1.value.trim().length === 3) {
            altHome1.nextElementSibling.nextElementSibling.focus()
        }
    });

    const altHome2 = document.getElementById('altContactHomePhone2');
    altHome2.addEventListener('keyup', () => {
        if (altHome2.value.trim().length === 3) {
            altHome2.nextElementSibling.nextElementSibling.focus()
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

const validateAddress = async (focus, addr1Id, addr2Id, cityId, stateId, zipId) => {
    let hasError = false
    const result = {}
    const streetAddress = document.getElementById(addr1Id).value
    const secondaryAddress = document.getElementById(addr2Id)?.value || ""
    const ct = document.getElementById(cityId).value
    const state = document.getElementById(stateId).value
    const zipCode = document.getElementById(zipId).value
    const addrValidationPayload = {
        streetAddress,
        secondaryAddress,
        city: ct,
        state: statesWithAbbreviations[state],
        zipCode
    }
    const _addressValidation = await addressValidation(addrValidationPayload);
    if (_addressValidation.error) {
        console.error('User Profile - Invalid Address', addrValidationPayload, _addressValidation.error)
        hasError = true;
        if (_addressValidation.error.errors.length) {
            _addressValidation.error.errors.forEach((item) => {
                if (item.code === "010005") {
                    errorMessage(
                        addr1Id,
                        '<span data-i18n="event.invalidAddress">' +
                        translateText("event.invalidAddress") +
                        "</span>",
                        focus
                    );
                    if (focus)
                        document.getElementById(addr1Id).focus();
                    focus = false;
                }
                if (item.code === "010002") {
                    errorMessage(
                        zipId,
                        '<span data-i18n="event.invalidZip">' +
                        translateText("event.invalidZip") +
                        "</span>",
                        focus
                    );
                    if (focus)
                        document.getElementById(zipId).focus();
                    focus = false;
                }
                if (item.code === "010004") {
                    errorMessage(
                        cityId,
                        '<span data-i18n="event.invalidCity">' +
                        translateText("event.invalidCity") +
                        "</span>",
                        focus
                    );
                    if (focus)
                        document.getElementById(zipId).focus();
                    focus = false;
                }
            });
        } else {
            errorMessage(
                addr1Id,
                '<span data-i18n="event.invalidAddress">' +
                translateText("event.invalidAddress") +
                "</span>",
                focus
            );
            if (focus) document.getElementById(addr1Id).focus();
            focus = false;
        }
    } else {
        const { address } = _addressValidation
        if (
            streetAddress.toLowerCase() !== address.streetAddress.toLowerCase() ||
            secondaryAddress.toLowerCase() !== address.secondaryAddress.toLowerCase() ||
            ct.toLowerCase() !== address.city.toLowerCase() ||
            statesWithAbbreviations[state].toLowerCase() !== address.state.toLowerCase() ||
            zipCode !== address.ZIPCode
        ) {
            result.original = { ...addrValidationPayload, state }
            result.suggestion = {
                ...address,
                state: swapKeysAndValues(statesWithAbbreviations)[address.state],
                zipCode: address.ZIPCode
            }
        }
    }
    return {
        hasError,
        result
    }
}
    
export const addEventUPSubmit = async () => {
    const userProfileForm = document.getElementById('userProfileForm');
    userProfileForm.addEventListener('submit', async e => {
        e.preventDefault();
        removeAllErrors();
        const riskyEmails = []
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
                const dataI18n = `${element.dataset.i18n}.data-error-validation`
                if(validationPattern && validationPattern === 'alphabets') {
                    if(!validNameFormat.test(element.value)) {
                        errorMessage(
                            element.id,
                            `<span data-i18n="${dataI18n}">${translateText(dataI18n)}</span>`,
                            focus
                        );
                        focus = false;
                        hasError = true;
                        console.error('User Profile - Invalid Name', element.id);
                    }
                }
                if(validationPattern && validationPattern === 'year') {
                    if(!/^(19|20)[0-9]{2}$/.test(element.value)) {
                        errorMessage(
                            element.id,
                            `<span data-i18n="${dataI18n}">${translateText(
                                dataI18n
                            )}</span>`,
                            focus
                        );
                        focus = false;
                        hasError = true;
                        console.error('User Profile - Invalid Year', element.id);
                    }
                    else {
                        if(element.value.length > 4) {
                            errorMessage(
                                element.id,
                                `<span data-i18n="${dataI18n}">${translateText(
                                    dataI18n
                                )}</span>`,
                                focus
                            );
                            focus = false;
                            hasError = true;
                            console.error('User Profile - Invalid Year', element.id);
                        }
                        else if (parseInt(element.value) > new Date().getFullYear()) {
                            errorMessage(
                                element.id,
                                `<span data-i18n="${dataI18n}">${translateText(
                                    dataI18n
                                )}</span>`,
                                focus
                            );
                            focus = false;
                            hasError = true;
                            console.error('User Profile - Invalid Year', element.id);
                        }
                    }
                }
                if(validationPattern && validationPattern === 'numbers') {
                    if(!/^[0-9]*$/.test(element.value)) {
                        errorMessage(
                            element.id,
                            `<span data-i18n="${dataI18n}">${translateText(
                                dataI18n
                            )}</span>`,
                            focus
                        );
                        focus = false;
                        hasError = true;
                        console.error('User Profile - Invalid Pattern', element.id);
                    }
                }
            }
        });
        Array.from(requiredFields).forEach(element => {
            const dataI18n = `${element.dataset.i18n}.data-error-required`
            if(!element.value){
                errorMessage(
                    element.id,
                    `<span data-i18n="${dataI18n}">${translateText(
                        dataI18n
                    )}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Required Field Value (Element)', element.id);
            }
            if(element.type === 'checkbox' && element.checked === false && element.hidden === false){
                errorMessage(
                    element.id,
                    `<span data-i18n="${dataI18n}">${translateText(
                        dataI18n
                    )}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Required Checked Input', element.id);
            }    
        });
        Array.from(confirmationFields).forEach(element => {
            const target = element.getAttribute('target')
            const targetElement= document.getElementById(target)
            const dataI18n = `${element.dataset.i18n}.data-error-confirmation`
            if(element.value !== targetElement.value){
                errorMessage(
                    element.id,
                    `<span data-i18n="${dataI18n}">${translateText(
                        dataI18n
                    )}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Confirmation Field Value', element.id);
            }
        });
        
        if(!(document.getElementById('UPCancer1').checked|| document.getElementById('UPCancer2').checked)){
            errorMessage('UPCancerBtnGroup', '<span data-i18n="event.provideResponse">'+translateText('event.provideResponse')+'</span>', focus);
            focus = false;
            hasError = true;
            console.error('User Profile - Required Checked Input', 'UPCancerBtnGroup');
        }
        let radioChecked = false;
        Array.from(radios).forEach(element => {
            if(element.checked) radioChecked = true;
        });

        const phoneNo = `${document.getElementById('UPPhoneNumber11').value}${document.getElementById('UPPhoneNumber12').value}${document.getElementById('UPPhoneNumber13').value}`;
        const phoneNo2 = `${document.getElementById('UPPhoneNumber21').value}${document.getElementById('UPPhoneNumber22').value}${document.getElementById('UPPhoneNumber23').value}`;
        const phoneNo3 = `${document.getElementById('UPPhoneNumber31').value}${document.getElementById('UPPhoneNumber32').value}${document.getElementById('UPPhoneNumber33').value}`;
        const altContactMobilePhone = `${document.getElementById('altContactMobilePhone1').value}${document.getElementById('altContactMobilePhone2').value}${document.getElementById('altContactMobilePhone3').value}`;
        const altContactHomePhone = `${document.getElementById('altContactHomePhone1').value}${document.getElementById('altContactHomePhone2').value}${document.getElementById('altContactHomePhone3').value}`;
        const email = document.getElementById('UPEmail').value;
        const email2 = document.getElementById('UPEmail2');
        const email3 = document.getElementById('UPAdditionalEmail2');
        const email4 = document.getElementById('UPAdditionalEmail3');
        const altContactEmail = document.getElementById('altContactEmail')?.value?.trim() || '';
        const zip = document.getElementById('UPAddress1Zip').value;
        const altAddressZip = document.getElementById('UPAddress3Zip').value || '';
        
        if(!email){
            errorMessage('UPEmail', '<span data-i18n="event.enterEmail">'+translateText('event.enterEmail')+'</span>', focus);
            focus = false;
            hasError = true;
            console.error('User Profile - Required Field Value', 'UPEmail');
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
            console.error('User Profile - Required Field Value', 'UPPhoneNumbers');
        }
        if(phoneNo && phoneNo.length < 10 ){
            errorMessage('UPPhoneNumber11');
            errorMessage('UPPhoneNumber12');
            errorMessage('UPPhoneNumber13');
            errorMessage('mainMobilePhone', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber11').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Length', 'UPPhoneNumber1');
        }
        if(phoneNo2 && phoneNo2.length < 10 ){
            errorMessage('UPPhoneNumber21');
            errorMessage('UPPhoneNumber22');
            errorMessage('UPPhoneNumber23');
            errorMessage('mainMobilePhone2', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber21').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Length', 'UPPhoneNumber2');
        }
        if(phoneNo3 && phoneNo3.length < 10 ){
            errorMessage('UPPhoneNumber31');
            errorMessage('UPPhoneNumber32');
            errorMessage('UPPhoneNumber33');
            errorMessage('mainMobilePhone3', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber31').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Length', 'UPPhoneNumber3');
        }
        if (altContactMobilePhone && altContactMobilePhone.length < 10) {
            errorMessage('altContactMobilePhone1');
            errorMessage('altContactMobilePhone2');
            errorMessage('altContactMobilePhone3');
            errorMessage('altContactMobilePhone', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('altContactMobilePhone1').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Length', 'altContactMobilePhone');
        }
        if (altContactHomePhone && altContactHomePhone.length < 10) {
            errorMessage('altContactHomePhone1');
            errorMessage('altContactHomePhone2');
            errorMessage('altContactHomePhone3');
            errorMessage('altContactHomePhone', '<span data-i18n="event.phoneFormat">'+translateText('event.phoneFormat')+'</span>');
            if(focus) document.getElementById('altContactHomePhone1').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Length', 'altContactHomePhone');
        }
        if(phoneNo && !/[1-9]{1}[0-9]{9}/.test(phoneNo) ){
            errorMessage('UPPhoneNumber11');
            errorMessage('UPPhoneNumber12');
            errorMessage('UPPhoneNumber13');
            errorMessage('mainMobilePhone', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber11').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Number', 'UPPhoneNumber1');
        }
        if(phoneNo2 && !/[1-9]{1}[0-9]{9}/.test(phoneNo2) ){
            errorMessage('UPPhoneNumber21');
            errorMessage('UPPhoneNumber22');
            errorMessage('UPPhoneNumber23');
            errorMessage('mainMobilePhone2', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber21').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Number', 'UPPhoneNumber2');
        }
        if(phoneNo3 && !/[1-9]{1}[0-9]{9}/.test(phoneNo3) ){
            errorMessage('UPPhoneNumber31');
            errorMessage('UPPhoneNumber32');
            errorMessage('UPPhoneNumber33');
            errorMessage('mainMobilePhone3', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPPhoneNumber31').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Number', 'UPPhoneNumber3');
        }
        if (altContactMobilePhone && !/[1-9]{1}[0-9]{9}/.test(altContactMobilePhone)) {
            errorMessage('altContactMobilePhone1');
            errorMessage('altContactMobilePhone2');
            errorMessage('altContactMobilePhone3');
            errorMessage('altContactMobilePhone', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('altContactMobilePhone1').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Number', 'altContactMobilePhone');
        }
        if (altContactHomePhone && !/[1-9]{1}[0-9]{9}/.test(altContactHomePhone)) {
            errorMessage('altContactHomePhone1');
            errorMessage('altContactHomePhone2');
            errorMessage('altContactHomePhone3');
            errorMessage('altContactHomePhone', '<span data-i18n="event.phoneOnlyNumbers">'+translateText('event.phoneOnlyNumbers')+'</span>');
            if(focus) document.getElementById('altContactHomePhone1').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Phone Number', 'altContactHomePhone');
        }
        if(zip && !/[0-9]{5}/.test(zip) ){
            errorMessage('UPAddress1Zip', '<span data-i18n="event.zipOnlyNumbers">'+translateText('event.zipOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPAddress1Zip').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Zip Code', 'UPAddress1Zip');

        }
        if (altAddressZip && !/[0-9]{5}/.test(altAddressZip)) {
            errorMessage('UPAddress3Zip', '<span data-i18n="event.zipOnlyNumbers">'+translateText('event.zipOnlyNumbers')+'</span>');
            if(focus) document.getElementById('UPAddress3Zip').focus();
            focus = false;
            hasError = true;
            console.error('User Profile - Invalid Zip Code', 'UPAddress3Zip');
        }
        
        if (email && !validEmailFormat.test(email)) {
            errorMessage('UPEmail', '<span data-i18n="event.emailFormat">'+translateText('event.emailFormat')+'</span>', focus);
            focus = false;
            hasError = true;
        }
        if (email2 && email2.value && !validEmailFormat.test(email2.value)) {
            errorMessage('UPEmail2', '<span data-i18n="event.emailFormat">'+translateText('event.emailFormat')+'</span>', focus);
            focus = false;
            hasError = true;
        }
        if (email3 && email3.value && !validEmailFormat.test(email3.value)) {
            errorMessage('UPAdditionalEmail2', '<span data-i18n="event.emailFormat">'+translateText('event.emailFormat')+'</span>', focus);
            focus = false;
            hasError = true;
        }
        if (email4 && email4.value && !validEmailFormat.test(email4.value)) {
            errorMessage('UPAdditionalEmail3', '<span data-i18n="event.emailFormat">'+translateText('event.emailFormat')+'</span>', focus);
            focus = false;
            hasError = true;
        }
        if (altContactEmail && !validEmailFormat.test(altContactEmail)) {
            errorMessage('altContactEmail', '<span data-i18n="event.emailFormat">'+translateText('event.emailFormat')+'</span>', focus);
            focus = false;
            hasError = true;
        }

        const confirmedEmail = document.getElementById('confirmUPEmail').value;
        if (!confirmedEmail) {
            errorMessage('confirmUPEmail', '<span data-i18n="event.confirmEmail">'+translateText('event.confirmEmail')+'</span>', focus);
            focus = false;
            hasError = true;
            console.error('User Profile - Required Field Value', 'confirmUPEmail');
            
        }
        else if (confirmedEmail !== document.getElementById('UPEmail').value) {
            errorMessage('confirmUPEmail', '<span data-i18n="event.emailsDoNotMatch">'+translateText('event.emailsDoNotMatch')+'</span>', focus);
            focus = false;
            hasError = true;
            console.error('User Profile - Confirmation Field Value', 'confirmUPEmail');
        }

        document.getElementById('userProfileSubmitButton').disabled = true
        if (!hasError) {
            const emailValidation = await emailAddressValidation({
                emails: {
                    upEmail: email.trim(),
                    upEmail2: email2 ? email2.value.trim() : null,
                    upAdditionalEmail2: email3 ? email3.value.trim() : null,
                    upAdditionalEmail3: email4 ? email4.value.trim() : null,
                    altContactEmail: altContactEmail || null,
                },
            });
            const upEmailValidationAnalysis = emailValidationAnalysis(emailValidation.upEmail)
            if (upEmailValidationAnalysis === emailValidationStatus.WARNING) riskyEmails.push(email)
            if (upEmailValidationAnalysis === emailValidationStatus.INVALID) {
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
    
            const upEmail2ValidationAnalysis = emailValidationAnalysis(emailValidation.upEmail2)
            if (upEmail2ValidationAnalysis === emailValidationStatus.WARNING) riskyEmails.push(email2.value)
            if (upEmail2ValidationAnalysis === emailValidationStatus.INVALID) {
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
    
            const upAdditionalEmail2ValidationAnalysis = emailValidationAnalysis(emailValidation.upAdditionalEmail2)
            if (upAdditionalEmail2ValidationAnalysis === emailValidationStatus.WARNING) riskyEmails.push(email3.value)
            if (upAdditionalEmail2ValidationAnalysis === emailValidationStatus.INVALID) {
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
            
            const upAdditionalEmail3ValidationAnalysis = emailValidationAnalysis(emailValidation.upAdditionalEmail3)
            if (upAdditionalEmail3ValidationAnalysis === emailValidationStatus.WARNING) riskyEmails.push(email4.value)
            if (upAdditionalEmail3ValidationAnalysis === emailValidationStatus.INVALID) {
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
    
            const altContactEmailValidationAnalysis = emailValidationAnalysis(emailValidation.altContactEmail);
            if (altContactEmailValidationAnalysis === emailValidationStatus.WARNING) riskyEmails.push(altContactEmail);
            if (altContactEmailValidationAnalysis === emailValidationStatus.INVALID) {
                errorMessage(
                    "altContactEmail",
                    '<span data-i18n="settingsHelpers.emailInvalid">' +
                    translateText("settingsHelpers.emailInvalid") +
                    "</span>",
                    focus
                );
                if (focus) document.getElementById("altContactEmail").focus();
                focus = false;
                hasError = true;
            }
        }

        /* Validate emailAddress/physicalAddress */
        const uspsSuggestion = {
            isMailAddressValid: true,
            isPhysicalAddressValid: true,
            isAlternateAddressValid: true,
            mailAddress: {},
            physicalAddress: {},
            alternateAddress: {},
        }
        if (!hasError) {
            const validateMailAddress = await validateAddress(focus, "UPAddress1Line1", "UPAddress1Line2", "UPAddress1City", "UPAddress1State", "UPAddress1Zip")
            uspsSuggestion.isMailAddressValid = !validateMailAddress.hasError
            uspsSuggestion.mailAddress = validateMailAddress.result

            if (document.getElementById('UPAddress2Line1').value &&
                document.getElementById('UPAddress2City').value &&
                document.getElementById('UPAddress2State').value &&
                document.getElementById('UPAddress2Zip').value) {

                const validatePhysicalAddress = await validateAddress(focus, "UPAddress2Line1", "UPAddress2Line2", "UPAddress2City", "UPAddress2State", "UPAddress2Zip")
                uspsSuggestion.isPhysicalAddressValid = !validatePhysicalAddress.hasError
                uspsSuggestion.physicalAddress = validatePhysicalAddress.result
            }
        }
        
        document.getElementById('userProfileSubmitButton').disabled = false

        // If any alt address field has a value, validate the required fields
        const altAddressFields = {
            line1: document.getElementById('UPAddress3Line1')?.value?.trim() || '',
            line2: document.getElementById('UPAddress3Line2')?.value?.trim() || '',
            city: document.getElementById('UPAddress3City')?.value?.trim() || '',
            state: document.getElementById('UPAddress3State')?.value || '',
            zip: document.getElementById('UPAddress3Zip')?.value?.trim() || ''
        };

        const hasAltAddressField = Object.values(altAddressFields).some(value => value !== '');

        if (hasAltAddressField) {
            if (!altAddressFields.line1) {
                errorMessage(
                    'UPAddress3Line1',
                    `<span data-i18n="form.altAddressLine1Field.data-error-required">${translateText('form.altAddressLine1Field.data-error-required')}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Required Field Value', 'UPAddress3Line1');
            }

            if (!altAddressFields.city) {
                errorMessage(
                    'UPAddress3City',
                    `<span data-i18n="form.altAddressCityField.data-error-required">${translateText('form.altAddressCityField.data-error-required')}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Required Field Value', 'UPAddress3City');
                console.error('User Profile - UPAddress3Line1', `|${altAddressFields.line1}|`);
            }

            if (!altAddressFields.state) {
                errorMessage(
                    'UPAddress3State',
                    `<span data-i18n="form.altAddressStateField.data-error-required">${translateText('form.altAddressStateField.data-error-required')}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Required Field Value', 'UPAddress3State');
                console.error('User Profile - UPAddress3Line1', `|${altAddressFields.line1}|`);
            }

            if (!altAddressFields.zip) {
                errorMessage(
                    'UPAddress3Zip',
                    `<span data-i18n="form.altAddressZipField.data-error-required">${translateText('form.altAddressZipField.data-error-required')}</span>`,
                    focus
                );
                focus = false;
                hasError = true;
                console.error('User Profile - Required Field Value', 'UPAddress3Zip');
                console.error('User Profile - UPAddress3Line1', `|${altAddressFields.line1}|`);
            }

            if (!hasError) {
                const validateAlternateAddress = await validateAddress(focus, "UPAddress3Line1", "UPAddress3Line2", "UPAddress3City", "UPAddress3State", "UPAddress3Zip");
                uspsSuggestion.isAlternateAddressValid = !validateAlternateAddress.hasError
                uspsSuggestion.alternateAddress = validateAlternateAddress.result;
            }
        }

        if (hasError) {
            showInvalidFormWarning()
            return false;
        }

        let formData = {};
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
        if(document.getElementById('UPAddress1Line2').value !== "") formData['442166669'] = document.getElementById('UPAddress1Line2').value;
        formData['703385619'] = document.getElementById('UPAddress1City').value;
        formData['634434746'] = document.getElementById('UPAddress1State').value;
        formData['892050548'] = document.getElementById('UPAddress1Zip').value;

        const poBoxCheckbox = document.getElementById("poBoxCheckbox");

        // Physical address
        formData[fieldMapping.isPOBox] = poBoxCheckbox && poBoxCheckbox.checked ?
            fieldMapping.yes :
            fieldMapping.no

        // Physical address info is saved regardless of whether PO Box is checked
        const physicalAddressLine1 = document.getElementById('UPAddress2Line1')?.value?.trim() || "";
        const physicalAddressLine2 = document.getElementById('UPAddress2Line2')?.value?.trim() || "";
        const physicalAddressCity = document.getElementById('UPAddress2City')?.value?.trim() || "";
        const physicalAddressState = document.getElementById('UPAddress2State')?.value || "";
        const physicalAddressZip = document.getElementById('UPAddress2Zip')?.value || "";

        // Update formData with physical address details
        if (physicalAddressLine1 !== "")  formData[fieldMapping.physicalAddress1] = physicalAddressLine1
        if (physicalAddressLine2 !== "")  formData[fieldMapping.physicalAddress2] = physicalAddressLine2
        if (physicalAddressCity !== "")  formData[fieldMapping.physicalCity] = physicalAddressCity
        if (physicalAddressState !== "")  formData[fieldMapping.physicalState] = physicalAddressState
        if (physicalAddressZip !== "")  formData[fieldMapping.physicalZip] = physicalAddressZip

        // Alternate address (altAddressZip is validated above)
        const altAddressLine1 = document.getElementById('UPAddress3Line1')?.value?.trim() || "";
        const altAddressLine2 = document.getElementById('UPAddress3Line2')?.value?.trim() || "";
        const altAddressCity = document.getElementById('UPAddress3City')?.value?.trim() || "";
        const altAddressState = document.getElementById('UPAddress3State')?.value || "";
        const altAddressPOBoxCheckbox = document.getElementById("poBoxCheckboxAltAddress");

        if (altAddressLine1 !== "") formData[fieldMapping.altAddress1] = altAddressLine1;
        if (altAddressLine2 !== "") formData[fieldMapping.altAddress2] = altAddressLine2;
        if (altAddressCity !== "") formData[fieldMapping.altCity] = altAddressCity;
        if (altAddressState) formData[fieldMapping.altState] = altAddressState;
        if (altAddressZip) formData[fieldMapping.altZip] = altAddressZip;

        // Add P.O. Box status if any address field is filled
        if (altAddressLine1 || altAddressLine2 || altAddressCity || altAddressState || altAddressZip) {
            formData[fieldMapping.doesAltAddressExist] = fieldMapping.yes;
        } else {
            formData[fieldMapping.doesAltAddressExist] = fieldMapping.no;
        }

        formData[fieldMapping.isPOBoxAltAddress] = altAddressPOBoxCheckbox && altAddressPOBoxCheckbox.checked
            ? fieldMapping.yes
            : fieldMapping.no;
        
        // Alternate contact (phone and email fields validated above)
        const altContactFirstName = document.getElementById('altContactFirstName')?.value?.trim() || "";
        const altContactLastName = document.getElementById('altContactLastName')?.value?.trim() || "";
        if (altContactFirstName !== "") formData[fieldMapping.altContactFirstName] = altContactFirstName;
        if (altContactLastName !== "") formData[fieldMapping.altContactLastName] = altContactLastName;
        if (altContactMobilePhone) formData[fieldMapping.altContactMobilePhone] = altContactMobilePhone;
        if (altContactHomePhone) formData[fieldMapping.altContactHomePhone] = altContactHomePhone;
        if (altContactEmail) formData[fieldMapping.altContactEmail] = altContactEmail;

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


        preVerifyUserDetails(uspsSuggestion, riskyEmails, formData)
    });
}

const preVerifyUserDetails = (uspsSuggestion, riskyEmails, formData) => {
    if (riskyEmails.length) {
        showRiskyEmailWarning(uspsSuggestion, riskyEmails, formData);
    } else if (!uspsSuggestion.isMailAddressValid) {
        showInvalidAddressWarning(uspsSuggestion, formData, "mail");
    } else if (!uspsSuggestion.isPhysicalAddressValid) {
        showInvalidAddressWarning(uspsSuggestion, formData, "physical");
    } else if (!uspsSuggestion.isAlternateAddressValid) {
        showInvalidAddressWarning(uspsSuggestion, formData, "alternate");
    } else if (uspsSuggestion.mailAddress.suggestion) {
        showMailAddressSuggestion(uspsSuggestion, riskyEmails, formData, "mail");
    } else if (uspsSuggestion.physicalAddress.suggestion) {
        showMailAddressSuggestion(uspsSuggestion, riskyEmails, formData, "physical");
    } else if (uspsSuggestion.alternateAddress.suggestion) {
        showMailAddressSuggestion(uspsSuggestion, riskyEmails, formData, "alternate");
    } else {
        verifyUserDetails(formData);
    }
};

const showInvalidAddressWarning = (uspsSuggestion, formData, type) => {
    if (!document.getElementById('connectMainModal').classList.contains('show')) openModal();
    let addressHtml = ``;
    if (type === "mail") {
        addressHtml += `
            <span data-i18n="event.l1">Line 1</span>: ${document.getElementById("UPAddress1Line1").value} </br>
            <span data-i18n="event.l2">Line 2</span>: ${document.getElementById("UPAddress1Line2").value} </br>
            <span data-i18n="event.city">City</span>: ${document.getElementById("UPAddress1City").value} </br>
            <span data-i18n="event.state">State</span>: ${document.getElementById("UPAddress1State").value} </br>
            <span data-i18n="event.zip">Zip</span>: ${document.getElementById("UPAddress1Zip").value} </br>
        `;
    }
    if (type === "physical") {
        addressHtml += `
            <span data-i18n="event.l1">Line 1</span>: ${document.getElementById("UPAddress2Line1").value} </br>
            <span data-i18n="event.l2">Line 2</span>: ${document.getElementById("UPAddress2Line2").value} </br>
            <span data-i18n="event.city">City</span>: ${document.getElementById("UPAddress2City").value} </br>
            <span data-i18n="event.state">State</span>: ${document.getElementById("UPAddress2State").value} </br>
            <span data-i18n="event.zip">Zip</span>: ${document.getElementById("UPAddress2Zip").value} </br>
        `;
    }
    if (type === "alternate") {
        addressHtml += `
            <span data-i18n="event.l1">Line 1</span>: ${document.getElementById("UPAddress3Line1").value} </br>
            <span data-i18n="event.l2">Line 2</span>: ${document.getElementById("UPAddress3Line2").value} </br>
            <span data-i18n="event.city">City</span>: ${document.getElementById("UPAddress3City").value} </br>
            <span data-i18n="event.state">State</span>: ${document.getElementById("UPAddress3State").value} </br>
            <span data-i18n="event.zip">Zip</span>: ${document.getElementById("UPAddress3Zip").value} </br>
        `;
    }

    let bodyHtml = `
        <span data-i18n="event.invalidAddressDescription">
            The address you entered may not be valid. Please check your entry below. If the address is not correct, please click ‘Go Back’ and correct the address. If the address is correct, please click ‘Continue with Address’. We are only able to send Connect communications and packages to valid addresses.
        </span>
        <div style="display: flex; justify-content: center; margin-top: 15px;"><div>${addressHtml}</div></div>
    `
    document.getElementById('connectModalHeader').style.display = 'none';
    document.getElementById('connectModalBody').innerHTML = translateHTML(bodyHtml);
    document.getElementById('connectModalFooter').innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Go Back" class="btn btn-dark" data-bs-dismiss="modal">Go Back</button>
        </div>
        <p style="margin-top: 20px; font-size: 12px" data-i18n="event.invalidAddressFooter">
            If you are having problems fixing these errors and can’t submit your profile, please reach out to the <a href="https://myconnect.cancer.gov/support" target="_blank">Connect Support Center</a>  for help or <a id="continueBtn" style="cursor: pointer; text-decoration: underline">Continue with Address</a> as shown.
        </p>
    `);
    document.getElementById('connectModalFooter').style.display = 'block';

    document.getElementById('continueBtn').addEventListener('click', () => {
        if (type === 'mail') {
            uspsSuggestion.isMailAddressValid = true
        } else if (type === 'physical') {
            uspsSuggestion.isPhysicalAddressValid = true
        } else {
            uspsSuggestion.isAlternateAddressValid = true
        }
        preVerifyUserDetails(uspsSuggestion, [], formData)
    })
}

const showMailAddressSuggestion = (uspsSuggestion, riskyEmails, formData, type) => {

    if (!document.getElementById('connectMainModal').classList.contains('show')) openModal();

    const addrSuggestion = type === 'mail'
        ? uspsSuggestion.mailAddress
        : type === 'physical'
            ? uspsSuggestion.physicalAddress
            : uspsSuggestion.alternateAddress

    const dataI18nString = type === 'mail'
        ? 'addressSuggestionDescription'
        : type === 'physical'
            ? 'addressSuggestionDescriptionPhysical'
            : 'addressSuggestionDescriptionAlternate'

    const headerHtml = `
        <h2 style="color: #333;" data-i18n="event.addressSuggestionTitle">Address Verification</h2>
    `
    const bodyHtml = `
        <div style="margin-bottom: 20px;" data-i18n="event.${dataI18nString}">
            We can’t verify your address but found a close match. Please confirm the correct address or enter a different address.
        </div>
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                <div style="margin-bottom: 15px;">
                    ${addrSuggestion.original.streetAddress} ${addrSuggestion.original.secondaryAddress} <br>
                    ${addrSuggestion.original.city} ${addrSuggestion.original.state} ${addrSuggestion.original.zipCode} 
                </div>
                <button style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%;" id="addressSuggestionKeepButton" data-i18n="event.addressSuggestionKeepButton">Keep address I entered</button>
            </div>
            <div style="flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                <div style="margin-bottom: 15px;">
                    ${addrSuggestion.suggestion.streetAddress} ${addrSuggestion.suggestion.secondaryAddress}<br>
                    ${addrSuggestion.suggestion.city} ${addrSuggestion.suggestion.state} ${addrSuggestion.suggestion.zipCode} 
                </div>
                <button style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%;" id="addressSuggestionUseButton" data-i18n="event.addressSuggestionUseButton">Use suggested address</button>
            </div>
        </div>
    `

    document.getElementById('connectModalHeader').innerHTML = translateHTML(headerHtml)
    document.getElementById('connectModalBody').innerHTML = translateHTML(bodyHtml);
    document.getElementById('connectModalFooter').innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Go Back" class="btn btn-dark" data-bs-dismiss="modal" id="goBackButton">Go Back</button>
        </div>
    `);

    document.getElementById('addressSuggestionKeepButton').addEventListener('click', async () => {
        if (type === 'mail') {
            uspsSuggestion.mailAddress = {}
        } else if (type === 'physical') {
            uspsSuggestion.physicalAddress = {}
        } else {
            uspsSuggestion.alternateAddress = {}
        }

        document.getElementById('goBackButton').click()
        preVerifyUserDetails(uspsSuggestion, riskyEmails, formData)
    })

    document.getElementById('addressSuggestionUseButton').addEventListener('click', () => {
        switch (type) {
            case 'mail': {
                document.getElementById("UPAddress1Line1").value = addrSuggestion.suggestion.streetAddress
                document.getElementById("UPAddress1Line2").value = addrSuggestion.suggestion.secondaryAddress
                document.getElementById("UPAddress1City").value = addrSuggestion.suggestion.city
                document.getElementById("UPAddress1State").value = addrSuggestion.suggestion.state
                document.getElementById("UPAddress1Zip").value = addrSuggestion.suggestion.zipCode

                formData[fieldMapping.address1] = addrSuggestion.suggestion.streetAddress
                if (addrSuggestion.suggestion.secondaryAddress !== "") {
                    formData[fieldMapping.address2] = addrSuggestion.suggestion.secondaryAddress
                } 
                formData[fieldMapping.city] = addrSuggestion.suggestion.city
                formData[fieldMapping.state] = addrSuggestion.suggestion.state
                formData[fieldMapping.zip] = addrSuggestion.suggestion.zipCode
                uspsSuggestion.mailAddress = {}
                break;
            }
            case 'physical': {
                document.getElementById("UPAddress2Line1").value = addrSuggestion.suggestion.streetAddress
                document.getElementById("UPAddress2Line2").value = addrSuggestion.suggestion.secondaryAddress
                document.getElementById("UPAddress2City").value = addrSuggestion.suggestion.city
                document.getElementById("UPAddress2State").value = addrSuggestion.suggestion.state
                document.getElementById("UPAddress2Zip").value = addrSuggestion.suggestion.zipCode

                formData[fieldMapping.physicalAddress1] = addrSuggestion.suggestion.streetAddress
                if (addrSuggestion.suggestion.secondaryAddress !== "") {
                    formData[fieldMapping.physicalAddress2] = addrSuggestion.suggestion.secondaryAddress
                } 
                formData[fieldMapping.physicalCity] = addrSuggestion.suggestion.city
                formData[fieldMapping.physicalState] = addrSuggestion.suggestion.state
                formData[fieldMapping.physicalZip] = addrSuggestion.suggestion.zipCode
                uspsSuggestion.physicalAddress = {}
                break;
            }
            default: {
                document.getElementById("UPAddress3Line1").value = addrSuggestion.suggestion.streetAddress
                document.getElementById("UPAddress3Line2").value = addrSuggestion.suggestion.secondaryAddress
                document.getElementById("UPAddress3City").value = addrSuggestion.suggestion.city
                document.getElementById("UPAddress3State").value = addrSuggestion.suggestion.state
                document.getElementById("UPAddress3Zip").value = addrSuggestion.suggestion.zipCode

                formData[fieldMapping.altAddress1] = addrSuggestion.suggestion.streetAddress
                if (addrSuggestion.suggestion.secondaryAddress !== "") {
                    formData[fieldMapping.altAddress2] = addrSuggestion.suggestion.secondaryAddress
                } 
                formData[fieldMapping.altCity] = addrSuggestion.suggestion.city
                formData[fieldMapping.altState] = addrSuggestion.suggestion.state
                formData[fieldMapping.altZip] = addrSuggestion.suggestion.zipCode
                uspsSuggestion.alternateAddress = {}
                break;
            }
        }

        document.getElementById('goBackButton').click()
        preVerifyUserDetails(uspsSuggestion, riskyEmails, formData)
    })
}

const showInvalidFormWarning = () => {
    if (!document.getElementById('connectMainModal').classList.contains('show')) openModal();
    let bodyHtml = `
        <span data-i18n="event.invalidFormWarning">
            Please fix the errors in the information you entered before continuing. If you are having problems fixing these errors and can’t submit your profile, please reach out to the <a href="https://myconnect.cancer.gov/support" target="_blank">Connect Support Center</a> for help.
        </span>
    `
    document.getElementById('connectModalHeader').innerHTML = translateHTML(`
        <h4 data-i18n="event.reviewProfile">Review your profile details</h4>
        <button type="button" class="btn-close" id="modalCloseBtn" aria-label="Close" data-bs-dismiss="modal"></button>
    `);
    document.getElementById('connectModalBody').innerHTML = translateHTML(bodyHtml);
    document.getElementById('connectModalFooter').innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Go Back" class="btn btn-dark" data-bs-dismiss="modal">Go Back</button>
        </div>
    `);
    document.getElementById('connectModalFooter').style.display = 'block';
}

const showRiskyEmailWarning = (uspsSuggestion, riskyEmails, formData) => {
    if(!document.getElementById('connectMainModal').classList.contains('show')) openModal();
    let bodyHtml = ''
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

    document.getElementById('connectModalHeader').innerHTML = translateHTML(`
        <button type="button" class="btn-close" id="modalCloseBtn" aria-label="Close"></button>
    `);

    // Add header close button listener
    document.getElementById('modalCloseBtn').addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('connectMainModal'));
        modal.hide();
    });

    riskyEmails.forEach(item=>{
        const escapedItem = escapeHTML(item);
        bodyHtml += `
            <div class="row">${escapedItem}</div>
            <div class="row">
                <i style="color:red" data-i18n="settingsHelpers.emailWarning">This email address may be invalid. Please double check your entry before continuing.</i>
            </div>
        </div>
        `
    })
    document.getElementById('connectModalHeader').style.display = 'none';
    document.getElementById('connectModalBody').innerHTML = translateHTML(bodyHtml);
    document.getElementById('connectModalFooter').innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Close" class="btn btn-dark" id="goBackBtn">Go Back</button>
            <button data-i18n="event.navButtonsConfirm" type="button" id="confirmRiskyEmail" title="Confirm details" class="btn btn-primary consentNextButton">Submit</button>
        </div>
    `);
    document.getElementById('connectModalFooter').style.display = 'block';

    document.getElementById('goBackBtn').addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('connectMainModal'));
        modal.hide();
    });

    document.getElementById('confirmRiskyEmail').addEventListener('click', () => {
        preVerifyUserDetails(uspsSuggestion, [], formData);
    })
}

const openModal = () => {
    const modalElement = document.getElementById('connectMainModal');
    modalElement.querySelectorAll('[data-bs-dismiss="modal"]').forEach(el => {
        el.removeAttribute('data-bs-dismiss');
    });

    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });

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

const verifyUserDetails = (formData) => {
    if(!document.getElementById('connectMainModal').classList.contains('show')) openModal();

    document.getElementById('connectModalHeader').innerHTML = translateHTML(`
        <h4 data-i18n="event.reviewProfile">Review your profile details</h4>
        <button type="button" class="btn-close" id="modalCloseBtn" aria-label="Close"></button>
    `);

    // Add header close button listener
    document.getElementById('modalCloseBtn').addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('connectMainModal'));
        modal.hide();
    });

    const { formerdata } = formData[fieldMapping.userProfileHistory];
    const hasAltAddress = formData[fieldMapping.altAddress1] || formData[fieldMapping.altAddress2] || formData[fieldMapping.altCity] || formData[fieldMapping.altState] || formData[fieldMapping.altZip];

    let bodyHtml = `
        <div class="row">
            <div class="col" data-i18n="event.firstName">First Name</div>
            <div class="col">${formData['399159511']}</div>
        </div>
        ${formData['231676651'] ? `
        <div class="row">
            <div class="col" data-i18n="event.middleName">Middle Name</div>
            <div class="col">${formData['231676651']}</div>
        </div>
        `:``}
        <div class="row">
            <div class="col" data-i18n="event.lastName">Last Name</div>
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
                ${formData['869588347']}
            </div>
        </div>
        `:``}
        
        ${formData['849786503'] ? `
        <div class="row">
            <div class="col" data-i18n="event.additionalEmail">Additional Email</div>
            <div class="col">
                ${formData['849786503']}  
            </div>
        </div>
        `:``}

        ${formData['635101039'] ? `
        <div class="row">
            <div class="col" data-i18n="event.additionalEmail2">Additional Email 2</div>
            <div class="col">
                ${formData['635101039']}
            </div>
        </div>
        `:``}

        ${formData['714419972'] ? `
        <div class="row">
            <div class="col" data-i18n="event.additionalEmail3">Additional Email 3</div> 
            <div class="col">
                ${formData['714419972']}
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

        <div class="row">
            <div class="col" data-i18n="event.line2">Line 2 (apartment, suite, unit, building)</div>
            <div class="col">${formData['442166669'] || ''}</div>
        </div>

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
        
        <div class="row">
            <div class="col" data-i18n="event.poBox">Mailing address is PO Box</div>
            <div class="col" data-i18n="settings.${formData[fieldMapping.isPOBox] === fieldMapping.yes ? 'optYes': 'optNo'}">
            ${formData[fieldMapping.isPOBox] === fieldMapping.yes ? "Yes" : "No"}</div>
        </div>

        <div class="row">
            <div class="col"><strong data-i18n="settings.physicalMailAddress">Physical Mailing address</strong></div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.physicalLine1">Line 1 (street, rural route)</div>
            <div class="col">${formData[fieldMapping.physicalAddress1] || ''}</div>
        </div>
 
        <div class="row">
            <div class="col" data-i18n="event.line2">Line 2 (apartment, suite, unit, building)</div>
            <div class="col">${formData[fieldMapping.physicalAddress2] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.city">City</div>
            <div class="col">${formData[fieldMapping.physicalCity] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.state">State</div>
            <div class="col">${formData[fieldMapping.physicalState] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.zip">Zip</div>
            <div class="col">${formData[fieldMapping.physicalZip] || ''}</div>
        </div>

        <div class="row">
            <div class="col"><strong data-i18n="settings.altAddress">Alternate Address</strong></div>
        </div>
        
        <div class="row">
            <div class="col" data-i18n="event.line1">Line 1 (street, PO box, rural route)</div>
            <div class="col">${formData[fieldMapping.altAddress1] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.line2">Line 2 (apartment, suite, unit, building)</div>
            <div class="col">${formData[fieldMapping.altAddress2] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.city">City</div>
            <div class="col">${formData[fieldMapping.altCity] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.state">State</div>
            <div class="col">${formData[fieldMapping.altState] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="event.zip">Zip</div>
            <div class="col">${formData[fieldMapping.altZip] || ''}</div>
        </div>

        ${hasAltAddress ? `
            <div class="row">
                <div class="col" data-i18n="event.poBoxAltAddress">Alternate address is PO Box</div>
                <div class="col" data-i18n="settings.${formData[fieldMapping.isPOBoxAltAddress] === fieldMapping.yes ? 'optYes' : 'optNo'}">
                    ${formData[fieldMapping.isAltPOBox] === fieldMapping.yes ? "Yes" : "No"}
                </div>
            </div> 
        `: ``}

        <div class="row">
            <div class="col"><strong data-i18n="settings.altContactHeader">Alternate Contact Information</strong></div>
        </div>

        <div class="row">
            <div class="col" data-i18n="form.altContactFirstName">First Name</div>
            <div class="col">${formData[fieldMapping.altContactFirstName] || ''}</div>
        </div>
    
        <div class="row">
            <div class="col" data-i18n="form.altContactLastName">Last Name</div>
            <div class="col">${formData[fieldMapping.altContactLastName] || ''}</div>
        </div>

        <div class="row">
            <div class="col" data-i18n="form.altContactMobilePhone">Mobile phone</div>
            <div class="col">${formData[fieldMapping.altContactMobilePhone] ? `${formData[fieldMapping.altContactMobilePhone].substr(0, 3)} - ${formData[fieldMapping.altContactMobilePhone].substr(3, 3)} - ${formData[fieldMapping.altContactMobilePhone].substr(6, 4)}` : ''}</div>
        </div>
    
        <div class="row">
            <div class="col" data-i18n="form.altContactHomePhone">Home phone</div>
            <div class="col">${formData[fieldMapping.altContactHomePhone] ? `${formData[fieldMapping.altContactHomePhone].substr(0, 3)} - ${formData[fieldMapping.altContactHomePhone].substr(3, 3)} - ${formData[fieldMapping.altContactHomePhone].substr(6, 4)}` : ''}</div>
        </div>
    
        <div class="row">
            <div class="col" data-i18n="form.altContactEmail">Email</div>
            <div class="col">${formData[fieldMapping.altContactEmail] || ''}</div>
        </div>

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
            <button data-i18n="event.navButtonsClose" type="button" title="Close" class="btn btn-dark" id="goBackBtn">Go Back</button>
            <button data-i18n="event.navButtonsConfirm" type="button" id="confirmReview" title="Confirm details" class="btn btn-primary consentNextButton">Submit</button>
        </div>
    `);
    document.getElementById('connectModalFooter').style.display = 'block';

    document.getElementById('goBackBtn').addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('connectMainModal'));
        modal.hide();
    });

    document.getElementById('confirmReview').addEventListener('click', async () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('connectMainModal'));
        dataSavingBtn('save-data');
        formData['699625233'] = 353358909;
        formData['430551721'] = new Date().toISOString();

        const { formerdata } = formData[fieldMapping.userProfileHistory];
        formData[fieldMapping.userProfileHistory] = formerdata || [];

        showAnimation();

        try {
            const response = await storeResponse(formData);
            if (response.code === 200) {
                modal.hide(); // Close modal after successful response
                const myData = await getMyData();
                if (hasUserData(myData)) {
                    myToDoList(myData.data, true);
                }
            }
        } catch (error) {
            console.error('Error storing response:', error);
        } finally {
            hideAnimation();
        }
    });
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

/**
 * Pin submission is the first step in the sign up process.
 * The submit event creates the new participant record in Firestore with PIN data, firstSignInTime, and default variables.
 * Notes:
 *  - Not all participants will have a PIN. We accept and store invalid pin entries.
 *  - The previously generated PIN is stored in the .pin field. The entered pin is stored in 379080287 (fieldMapping.pinNumber).
 *  - If a participant enters a pin, we validate it. On match found, we attach the participant to the previously created shell record. See ConnectFaas -> getToken().
 *  - If an invalid pin is entered, we store it under 379080287 in a new participant record.
 *  - If a participant does not have a pin, we generate a new token and create a new participant record.
 */

export const addEventRequestPINForm = () => {
    const form = document.getElementById('requestPINForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const pin = document.getElementById('participantPIN').value?.trim();
        let pathAfterPINSubmission;
        let validatePinResponse;
        let createParticipantRecordResponse;

        try {
            showAnimation();
            
            // Get the first sign in time in ISO 8601 format.
            let pinEntryFormData = { [fieldMapping.firstSignInTime]: await getFirstSignInISOTime() };

            // Validate the pin if it's entered. If valid, a shell account already exists from the participant invitation stage (see getToken() API).
            if (pin !== "") {
                pinEntryFormData[fieldMapping.pinNumber] = pin;
                validatePinResponse = await validatePin(pinEntryFormData);
            } else {
                pinEntryFormData[fieldMapping.dontHavePinNumber] = fieldMapping.yes;
            }
            
            // Valid pin: Account exists. Add the form data. We stored the PIN and first sign in time during the validatePin operation.
            // We have the healthcare provider from the participant's invitation, so skip to the heardAboutStudy form.
             if (validatePinResponse && validatePinResponse.code === 200) {
                pathAfterPINSubmission = 'heardAboutStudy';

            // Duplicate account. Route participant to the duplicate account reminder form.
            } else if (validatePinResponse && validatePinResponse.code === 202) {
                pathAfterPINSubmission = 'duplicateAccountReminder';

            // Invalid PIN, no PIN entered, or error (validatePIN failed). Create a new participant record and store the entered PIN regardless of its validity.
            } else {
                createParticipantRecordResponse = await createParticipantRecord(pinEntryFormData);

                // Include 401 in case participant submitted PIN form with 'I do not have a PIN' but didn't yet select a healthcare provider.
                if (createParticipantRecordResponse?.code === 200 || createParticipantRecordResponse?.code === 401) {
                    pathAfterPINSubmission = 'healthcareProvider';

                } else if (createParticipantRecordResponse?.code === 500) {
                    pathAfterPINSubmission = 'error';
                    throw new Error('Failed to create participant record');

                } else {
                    pathAfterPINSubmission = 'error';
                    throw new Error('Unhandled path in addEventRequestPINForm()');
                }
            }

        } catch (error) {
            const myData = await getMyData();
            logDDRumError(error, 'PINEntryFormError', {
                userAction: 'PWA sign up',
                timestamp: new Date().toISOString(),
                pin: pin,
                pathAfterPINForm: pathAfterPINSubmission,
                connectID: myData?.data?.['Connect_ID'],
                function: 'addEventRequestPINForm',
                validatePinResponse: validatePinResponse,
                createParticipantRecordResponse: createParticipantRecordResponse,
            });

        } finally {
            await storeParameters();
            hideAnimation();
            loadPathFromPINForm(pathAfterPINSubmission);
        }
    });
}

/**
 * Store the UTM parameters in the participant record.
 * This method is called after the PIN entry form is submitted.
 * The UTM parameters are stored in the participant record if they exist in the session storage.
 */
const storeParameters = async () => {
    const utm = {};
    const acceptedParams = {
        utm_source: ['hfh', 'uc', 'hp'],
        utm_medium: ['sms', 'email', 'mychart'],
        utm_campaign: ['altruism-personal', 'altruism-general', 'cancer-personal', 'cancer-general', 'research-personal', 'research-general']
    }

    const utmSource = sessionStorage.getItem('utmSource')?.toLowerCase() || '';
    const utmMedium = sessionStorage.getItem('utmMedium')?.toLowerCase() || '';
    const utmCampaign = sessionStorage.getItem('utmCampaign')?.toLowerCase() || '';

    if (utmSource && acceptedParams.utm_source.includes(utmSource)) utm[fieldMapping.utm.source] = utmSource;
    if (utmMedium && acceptedParams.utm_medium.includes(utmMedium)) utm[fieldMapping.utm.medium] = utmMedium;
    if (utmCampaign && acceptedParams.utm_campaign.includes(utmCampaign)) utm[fieldMapping.utm.campaign] = utmCampaign;

    if (Object.keys(utm).length) storeResponse(utm);
}

/**
 * This method is only used from the PIN entry form on sign up. It is not used elsewhere because we don't risk updating an existing first sign in time.
 * First sign in time (ISO 8601 format) should be stored in the participantData object in the app state.
 * If it was lost due to a page refresh or similar, the firebase user metadata is the source of truth. Get it there and convert to ISO 8601.
 * If it is still not available, log an error.
 * @returns { string } - The first sign in time in ISO 8601 format.
 */

const getFirstSignInISOTime = async () => {
    // Check appState first.
    let firstSignInISOTime = appState.getState().participantData.firstSignInTime;

    // Fall back to firebase user metadata.
    if (!firstSignInISOTime) {
        const user = firebase.auth().currentUser;
        if (user && user.metadata && user.metadata?.creationTime) {
            firstSignInISOTime = new Date(user.metadata.creationTime).toISOString();
            
            if (firstSignInISOTime) {
                appState.setState({
                    participantData: {
                        ...appState.getState().participantData,
                        firstSignInTime: firstSignInISOTime
                    }
                });
            }
        }
    }

    // Shouldn't hit this block. Fall back to participant profile (sanity check), then use current time at PIN entry submission (the first sign-up step).
    if (!firstSignInISOTime) {
        const myData = await getMyData();
        firstSignInISOTime = myData?.data?.[fieldMapping.firstSignInTime];
        
        if (!firstSignInISOTime) {
            
            // Sanity check, expected to be null.
            const hipaaAuthorizationTimestamp = myData?.data?.[fieldMapping.hipaaAuthorizationDateSigned];
            
            if (!hipaaAuthorizationTimestamp) {
                firstSignInISOTime = new Date().toISOString();
                console.error('Error: First Sign in time is not available from Firebase Auth. Using current time.', firstSignInISOTime);
            }
        }
    }
    
    return firstSignInISOTime;
}

/**
 * Load the next form after the PIN form based on the path provided.
 * @param { string } path - The path to load after the PIN form.
 */

const loadPathFromPINForm = (path) => {
    const mainContent = document.getElementById('root');
    if (!mainContent) {
        console.error('loadPathFromPINForm(): Could not find mainContent element');
        return;
    }

    switch (path) {
        case 'error':
            mainContent.innerHTML = requestPINTemplate();
            addEventPinAutoUpperCase();
            addEventRequestPINForm();
            addEventToggleSubmit();
            showErrorAlert();
            break;

        case 'duplicateAccountReminder':
            duplicateAccountReminderRender();
            break;

        case 'heardAboutStudy':
            mainContent.innerHTML = heardAboutStudy();
            addEventHeardAboutStudy();
            break;

        case 'healthcareProvider':
            mainContent.innerHTML = healthCareProvider();
            addEventHealthCareProviderSubmit();
            addEventHealthProviderModalSubmit();
            break;

        default:
            console.error(`loadPathFromPINForm(): Invalid path provided: ${path}`);
            loadPathFromPINForm('healthcareProvider');
            break;
    }
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
    const IDs = ['userDashboard', 'Notifications', 'userAgreements', 'userSettings', 'reports', 'connectSamples', 'connectSupport', 'connectPayment'];
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
    if(route === '#reports') document.getElementById('reports').click();
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