import { sites, allStates, allCountries, getMyData } from "../shared.js";
import { addEventMonthSelection, addEventUPSubmit, addEventCancerFollowUp, addYearsOptions, addEventChangeFocus, addEventPreferredContactType, addEventAddressAutoComplete, addEventAdditionalEmail, addEventCheckCanText } from "../event.js";
export const renderUserProfileActual = async () => {
    const mainContent = document.getElementById('root');
    mainContent.innerHTML = `
    <div class = "e-consent-body">
        <h2>Please fill out the sme personal information.</h2>
    </div>
    <div style="width:80%; margin:auto">
        <h4 style="margin-top:50px; text-align:center;">Download Informed Consent Form</h4>
        <div class="row"style="margin:auto"><div style="margin:auto"><a href="./consent_draft.pdf" title="Download consent form" data-toggle="tooltip" download="connect_consent.pdf">Download signed consent form:&nbsp<i class="fas fa-file-download"></i></a></div></div>
        
        <h4 style="margin-top:50px; text-align:center;">Download Electronic health records release form</h4>
        <div class="row" style="margin:auto"><div style="margin:auto"><a href="./consent_draft.pdf" title="Download health records release form" data-toggle="tooltip" download="connect_consent.pdf">Download signed health records release form:&nbsp<i class="fas fa-file-download"></i></a></div></div>
    </div>

    <div>
        <button class="btn btn-primary" type="button" id="toLeaving" style="float:right;margin-top:40px;margin-bottom:40px">Continue to Profile</button>
    </div>
    `;
    
};

export const renderUserProfile = async () => {
    const myData = await getMyData();
    const siteId = myData.data ? myData.data['827220437'] : undefined;
    const mainContent = document.getElementById('root');
    let suffixList = {612166858: 0,255907182: 1,226924545: 2,270793412: 3,959021713: 4,643664527: 5,537892528: 6};
    mainContent.innerHTML = `
        </br>
        <p class = "userProfileHeader">Create User Profile</p>        
        <p class="userProfileBody">Thank you for joining the Connect for Cancer Prevention Study! Before you are officially enrolled, we will use this information to verify your eligibility. We respect your privacy and will treat all information as confidential.</p>
        <form id="userProfileForm" method="POST">
            <strong>Name</strong> 
            <p>If this is not correct, please contact the <a href="MyConnect.cancer.gov/support">Connect Support Center</a> or call XXX-XXX-XXXX.</p>
            <div class="form-group row">
                <label class="col-md-4 col-form-label">First name <span class="required">*</span></label>
                <input type="text" value="${myData.data['471168198']}" class="form-control input-validation col-md-4" id="UPFirstName" placeholder="Enter first name" disabled>
            </div>
            <div>
               
            </div>
            <!--<div class="form-group row" id="firstNameConsistency">
                <label class="col-md-4 col-form-label">Verify first name <span class="required">*</span></label>
                <input type="checkbox" class="form-control required-field col-custom custom-checkbox" data-error-required='Please verify your first name.' id="UPFirstNameVerify">
            </div>-->
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Middle name</label>
                    <input type="text" value="${myData.data['436680969'] ? myData.data['436680969'] : ''}" class="form-control input-validation col-md-4" data-validation-pattern="alphabets" data-error-validation="Your middle name should contain only uppercase and lowercase letters. Please do not use any numbers or special characters." id="UPMiddleInitial" placeholder="Enter middle name">
            </div>
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Last name <span class="required">*</span></label>
                <input type="text" value="${myData.data['736251808']}" class="form-control  col-md-4" id="UPLastName" placeholder="Enter last name" disabled>
            </div>
            <!--<div class="form-group row" id="lastNameConsistency">
                <label class="col-md-4 col-form-label">Verify last name <span class="required">*</span></label>
                <input type="checkbox" class="form-control required-field col-custom custom-checkbox" data-error-required='Please verify your last name.' id="UPLastNameVerify">
            </div>-->
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Suffix</label>
                <select class="form-control col-md-4" id="UPSuffix">
                    <option value="">-- Select suffix --</option>
                    <option value="612166858" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 0 ? 'selected':'') : ''}>Jr.</option>
                    <option value="255907182" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 1 ? 'selected':'') : ''}>Sr.</option>
                    <option value="226924545" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 2 ? 'selected':'') : ''}>I</option>
                    <option value="270793412" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 3 ? 'selected':'') : ''}>II</option>
                    <option value="959021713" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 4 ? 'selected':'') : ''}>III</option>
                    <option value="643664527" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 5 ? 'selected':'') : ''}>2nd</option>
                    <option value="537892528" ${myData.data['480305327'] ? (suffixList[myData.data['480305327']] == 6 ? 'selected':'') : ''}>3rd</option>
                </select>
            </div>
            
            <div class="form-group row">
                <label class="col-md-4 col-form-label">What is your preferred first name?</label>
                <input type="text" class="form-control input-validation col-md-4" data-validation-pattern="alphabets" data-error-validation="Your preferred name should contain only uppercase and lowercase letters. Please do not use any numbers or special characters." id="UPPreferredName" placeholder="Enter preferred name">
            </div>

            <strong>What is your date of birth?</strong>
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Month <span class="required">*</span></label>
                <select id="UPMonth" class="form-control required-field col-md-4" data-error-required='Please select your birth month.'>
                    <option class="option-dark-mode" value="">-- Select birth month -- </option>
                    <option class="option-dark-mode" value="01">January</option>
                    <option class="option-dark-mode" value="02">February</option>
                    <option class="option-dark-mode" value="03">March</option>
                    <option class="option-dark-mode" value="04">April</option>
                    <option class="option-dark-mode" value="05">May</option>
                    <option class="option-dark-mode" value="06">June</option>
                    <option class="option-dark-mode" value="07">July</option>
                    <option class="option-dark-mode" value="08">August</option>
                    <option class="option-dark-mode" value="09">September</option>
                    <option class="option-dark-mode" value="10">October</option>
                    <option class="option-dark-mode" value="11">November</option>
                    <option class="option-dark-mode" value="12">December</option>
                </select>
            </div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label">Day <span class="required">*</span></label>
                <select class="form-control required-field col-md-4" data-error-required='Please select your birth day.' id="UPDay"></select>
            </div>
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Year <span class="required">*</span></label>
                <input type="text" class="form-control required-field input-validation col-md-4" data-error-required='Please select your birth year.' data-validation-pattern="year" data-error-validation="Your birth year must contain four digits in the YYYY format." maxlength="4" id="UPYear" list="yearsOption" title="Birth year, must be in 1900s" Placeholder="Enter birth year">
                <datalist id="yearsOption"></datalist>
            </div>

            <strong>Contact Information</strong>
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Preferred Email <span class="required">*</span></label>
                <input type="text" class="form-control col-md-4" id="UPEmail" title="Please enter an email address in this format: name@example.com." Placeholder="abc@mail.com"></br>
            </div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label">Retype preferred Email <span class="required">*</span></label>
                <input type="text" class="form-control col-md-4" id="confirmUPEmail" title="Please enter an email address in this format: name@example.com." Placeholder="Retype preferred email"></br>
            </div>
            
            <div class="form-group row">
                <label class="col-md-4 col-form-label">Additional Email</label>
                <input type="text" class="form-control col-md-4" id="UPEmail2" title="Please enter an email address in this format: name@example.com." Placeholder="Enter additional email"></br>
            </div>
            <div id="multipleEmail1"></div>
            <div id="multipleEmail2"></div>
            <div class="form-group row">
                <div class="col-md-4 offset-md-4" id="additionalEmailBtn">
                    <button type="button" class="btn btn-light" id="addMoreEmail" title="Add more email">Add more <i class="fas fa-plus"></i></button>
                </div>
            </div>
            
            
            <div class="form-group row">
                <label class="col-md-4 col-form-label">
                    Mobile phone <span class="required">**</span>
                </label>
                <div class="btn-group col-md-4" id="mainMobilePhone">
                    <input type="text" class="form-control" id="UPPhoneNumber11" size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                    <input type="text" class="form-control" id="UPPhoneNumber12" size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                    <input type="text" class="form-control" id="UPPhoneNumber13" size="4" maxlength="4" Placeholder="9999">
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label">
                    Can we leave a voicemail at this number? 
                </label>
                <div class="btn-group btn-group-toggle col-md-4" data-toggle="buttons">
                    <label class="btn btn-light up-btns"><input type="radio" name="voiceMailPermission1" value="353358909">Yes</label>
                    <label class="btn btn-light up-btns"><input type="radio" name="voiceMailPermission1" value="104430631">No</label>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-4 col-form-label">
                    Can we text this number? 
                </label>
                <div class="btn-group btn-group-toggle col-md-4" data-toggle="buttons">
                    <label class="btn btn-light up-btns" id="textPermissionYes"><input type="radio" name="textPermission1"  value="353358909">Yes</label>
                    <label class="btn btn-light up-btns" id="textPermissionNo"><input type="radio" name="textPermission1"  value="104430631">No</label>
                </div>
            </div>

            <div id="preferredEmailPhone"></div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label">
                    Home phone <span class="required">**</span>
                </label>
                <div class="btn-group col-md-4" id="mainMobilePhone2">
                    <input type="text" class="form-control" id="UPPhoneNumber21" pattern="[1-9]{1}[0-9]{2}" title="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                    <input type="text" class="form-control" id="UPPhoneNumber22" pattern="[0-9]{3}" title="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                    <input type="text" class="form-control" id="UPPhoneNumber23" pattern="[0-9]{4}" title="Only numbers are allowed." size="4" maxlength="4" Placeholder="9999">
                </div>
            </div>

            <div class="form-group row">
                <label class="col-md-4 col-form-label">
                    Can we leave a voicemail at this number? 
                </label>
                <div class="btn-group btn-group-toggle col-md-4" data-toggle="buttons">
                    <label class="btn btn-light up-btns"><input type="radio" name="voiceMailPermission2" value="353358909">Yes</label>
                    <label class="btn btn-light up-btns"><input type="radio" name="voiceMailPermission2" value="104430631">No</label>
                </div>
            </div>

            ${renderMailingAddress('', 1, true)}

            <div class="form-group row">
                <label class="col-md-4 col-form-label">Have you ever been diagnosed with cancer (other than non-melanoma skin cancer)? <span class="required">*</span></label>
                <div class="btn-group btn-group-toggle col-md-4" data-toggle="buttons" id="UPCancerBtnGroup">
                    <label class="btn btn-light up-btns" id="UPCancer1Btn"><input type="radio" name="cancerHistory" id="UPCancer1" value="353358909">Yes</label>
                    <label class="btn btn-light up-btns" id="UPCancer2Btn"><input type="radio" name="cancerHistory" id="UPCancer2" value="104430631">No</label>
                </div>
            </div>

            <div id="cancerFollowUp"></div>

            </br></br>
            <div class="row">
                <div class="ml-auto">
                    <button type="submit" class="btn btn-primary save-data">Submit</button>
                </div>
            </div>
        </form>
        </br></br>
    `;
    addYearsOptions();
    addEventNameConsistency(myData.data['471168198'], myData.data['736251808']);
    addEventChangeFocus();
    addEventCancerFollowUp();
    addEventMonthSelection();
    addEventPreferredContactType();
    addEventAdditionalEmail();
    addEventAddressAutoComplete(1);
    addEventCheckCanText();
    //addEventCheckCantText();
    addEventUPSubmit();
};

export const renderUserProfileAfter = async () => {
    
}

const addEventNameConsistency = (cfn, cln) => {
    const input1 = document.getElementById('UPFirstName');
    input1.addEventListener('keyup', () => {
        if(input1.value !== cfn) {
            const checkboxDiv = document.getElementById('firstNameConsistency');
            checkboxDiv.hidden = true;
            document.getElementById('UPFirstNameVerify').hidden = true;
            document.getElementById('UPFirstNameVerify').checked = false;
        }
        else {
            document.getElementById('firstNameConsistency').hidden = false;
            document.getElementById('UPFirstNameVerify').hidden = false;
        }
    });

    const input2 = document.getElementById('UPLastName');
    input2.addEventListener('keyup', () => {
        if(input2.value !== cln) {
            const checkboxDiv = document.getElementById('lastNameConsistency');
            checkboxDiv.hidden = true;
            document.getElementById('UPLastNameVerify').hidden = true;
            document.getElementById('UPLastNameVerify').checked = false;
        }
        else {
            document.getElementById('lastNameConsistency').hidden = false;
            document.getElementById('UPLastNameVerify').hidden = false;
        }
    });
}

export const renderAlternateContact = (id, required) => {
    return `
        <div class="form-group">
            <label>
                First name ${required ? '<span class="required">*</span>': ''}
                <input type="text" class="form-control" ${required ? 'required' : ''} id="UPFirstName${id}" placeholder="Enter first name">
            </label><br>
            <label>
                Middle initial
                <input type="text" class="form-control" id="UPMiddleInitial${id}" placeholder="Enter middle initial">
            </label><br>
            <label>
                Last name ${required ? '<span class="required">*</span>': ''}
                <input type="text" class="form-control" ${required ? 'required' : ''} id="UPLastName${id}" placeholder="Enter last name">
            </label><br>
            <label>
                Phone number ${required ? '<span class="required">*</span>': ''}
                <input type="text" class="form-control" id="UPPhoneNumber${id}" ${required ? 'required' : ''} pattern="[1-9]{1}[0-9]{9}" size="10" maxlength="10" Placeholder="Enter phone number">
            </label><br>
        </div>
        ${renderMailingAddress('', id, required, true)}
    `;
}

export const renderMailingAddress = (type, id, required, showCountry) => {
    return `
        <strong>What is your mailing address?</strong>
        <div class="form-group row">
            <label class="col-md-4 col-form-label">
                Line 1 (street, PO box, rural route) ${required ? '<span class="required">*</span>': ''}
            </label>
            <input type=text id="UPAddress${id}Line1" autocomplete="off" class="form-control col-md-4 required-field" data-error-required='Please enter the first line of mailing address.' placeholder="Enter street, PO box, rural route">
        </div>
        <div class="form-group row">
            <label class="col-md-4 col-form-label">
                Line 2 (apartment, suite, unit, building)
            </label>
            <input type=text id="UPAddress${id}Line2" autocomplete="off" class="form-control col-md-4" placeholder="Enter apartment, suite, unit, building">
        </div>
        <div class="form-group row">
            <label class="col-md-4 col-form-label">
                City ${required ? '<span class="required">*</span>': ''}
            </label>
            <input type=text id="UPAddress${id}City" class="form-control col-md-4 required-field" data-error-required='Please enter the city field of your mailing address.' placeholder="Enter City">
        </div>
        <div class="form-group row">
            <label class="col-md-4 col-form-label">
                State ${required ? '<span class="required">*</span>': ''}
            </label>
            <select class="form-control col-md-4 required-field" data-error-required='Please select the state field of your mailing address.' id="UPAddress${id}State">
                <option class="option-dark-mode" value="">-- Select State --</option>
                ${renderStates()}
            </select>
        </div>
        <div class="form-group row">
            <label class="col-md-4 col-form-label">
                Zip ${required ? '<span class="required">*</span>': ''}
            </label>
            <input type=text id="UPAddress${id}Zip" pattern="[0-9]{5}" title="5 characters long, numeric-only value." class="form-control col-md-4 required-field" data-error-required='Please enter the zip field of your mailing address.' size="5" maxlength="5" placeholder="99999">
        </div>
        ${showCountry ? `<br>
        <div class="form-group row">
            <label class="col-md-4 col-form-label">
                Country ${required ? '<span class="required">*</span>': ''}
            </label>
            <select class="form-control col-md-4" ${required ? 'required' : ''} id="UPAddress${id}Country">
                <option class="option-dark-mode" value="">-- Select Country --</option>
                ${renderCountries()}
            </select>
            
        </div>
        `:``}
    `
};

export const renderPhoneNumber = (number) => {
    return `
    <div class="form-group row">
        <label class="col-md-4 col-form-label">
            Phone number ${number}
        </label>
        <input type="text" class="form-control col-md-4" id="UPPhoneNumber${number}" pattern="[1-9]{1}[0-9]{9}" size="10" maxlength="10" Placeholder="Enter phone number ${number}">
    </div>
    <div class="form-group row">
        <label class="col-md-4 col-form-label">
            Phone number ${number} type
        </label>
        <div class="btn-group btn-group-toggle col-md-4" data-toggle="buttons">
            <label class="btn btn-light"><input type="radio" name="phoneNumberType${number}" id="UPPhoneType${number}1" value="1">Mobile</label>
            <label class="btn btn-light"><input type="radio" name="phoneNumberType${number}" id="UPPhoneType${number}2" value="2">Home</label>
            <label class="btn btn-light"><input type="radio" name="phoneNumberType${number}" id="UPPhoneType${number}3" value="3">Work</label>
            <label class="btn btn-light"><input type="radio" name="phoneNumberType${number}" id="UPPhoneType${number}4" value="4">Other</label>
        </div>
    </div>
    `;
}

const renderStates = () => {
    let options = '';
    for(const state in allStates){
        options += `<option class="option-dark-mode" value="${state}">${state}</option>`
    }
    return options;
}

const renderCountries = () => {
    let options = '';
    for(const country in allCountries){
        options += `<option class="option-dark-mode" value="${allCountries[country]}">${country}</option>`
    }
    return options;
}