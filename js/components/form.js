import { allStates, allCountries, getMyData, hasUserData, translateHTML } from "../shared.js";
import { addEventMonthSelection, addEventMonthConfirmationSelection, addEventUPSubmit, addEventCancerFollowUp, addEventChangeFocus, addEventAddressAutoComplete, addEventAdditionalEmail, addEventCheckCanText, addEventFormerName, addMoreFormerName, addEventPhysicalAddressLine } from "../event.js";
import cId from '../fieldToConceptIdMapping.js';
import { suffixList, suffixToTextMapDropdown, suffixToTextMap, numberOfDefaultFormerNames } from "../settingsHelpers.js";

export const renderUserProfile = async () => {
    const myData = await getMyData();
    if(!hasUserData(myData)) return;
    
    const mainContent = document.getElementById('root');
    const consentSuffixKey = cId.consentSuffix.toString();
    mainContent.innerHTML = translateHTML(`
        </br>
        <div class="row">
        <div class="col-lg-2">
        </div>
        <div class=col-lg-8>
        <p class = "userProfileHeader" data-i18n="form.profileHeader">My Profile</p>        
        <form id="userProfileForm" method="POST" autocomplete="off">
            <p class="userProfileSubHeaders" data-i18n="form.nameSubheader">Name</p> 
            <p data-i18n="form.notCorrectMessage">If this is not correct, please contact the <a href="https://norcfedramp.servicenowservices.com/participant" target="_blank">Connect Support Center</a> or call 1-877-505-0253</p>
            <div class="row">
                <div class="col-md-4">
                    <label style="margin-left:-15px" data-i18n="form.firstName">First Name <span class="required">*</span></label>
                    <input data-i18n="form.firstNameField" type="text" value="${myData.data['471168198']}" class="form-control input-validation row" id="UPFirstName" placeholder="Enter first name" disabled style="max-width:215px; background-color:#e6e6e6 !important;">
                </div>
                <div class="col-md-4">
                    <label style="margin-left:-15px" data-i18n="form.middleName">Middle Name</label>
                    <input type="text"  data-i18n="form.middleNameField" value="${
                        myData.data["436680969"] ? myData.data["436680969"] : ""
                    }" class="form-control input-validation row" data-validation-pattern="alphabets" data-error-validation="Your middle name should contain only uppercase and lowercase letters. Please do not use any numbers or special characters." id="UPMiddleInitial" style="max-width:215px; background-color:#e6e6e6 !important;" disabled>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label data-i18n="form.lastName" style="margin-left:-15px">Last Name <span class="required">*</span></label>
                    <input data-i18n="form.lastNameField" type="text" value="${myData.data['736251808']}" class="form-control input-validation row" id="UPLastName" placeholder="Enter last name" disabled style="max-width:304px; background-color:#e6e6e6 !important;">
                </div>
            </div>
            <div class="form-group row">
                <div class="col-md-4">
                    <label class="col-form-label" data-i18n="form.suffixList">Suffix</label>
                    <select class="form-control" style="max-width:152px; background-color:#e6e6e6 !important; margin-left:0px;" id="UPSuffix" disabled>
                        <option value="" data-i18n="form.selectOption">-- Select --</option>
                        <option value="${cId.suffixValue.jr}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 0 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.jr).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.jr)}</option>
                        <option value="${cId.suffixValue.sr}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 1 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.sr).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.sr)}</option>
                        <option value="${cId.suffixValue.first}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 2 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.first).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.first)}</option>
                        <option value="${cId.suffixValue.second}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 3 || suffixList[myData.data[consentSuffixKey]] == 10 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.second).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.second)}</option>
                        <option value="${cId.suffixValue.third}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 4 || suffixList[myData.data[consentSuffixKey]] == 11 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.third).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.third)}</option>
                        <option value="${cId.suffixValue.fourth}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 5 ? 'selected':'') : ''}   data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.fourth).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.fourth)}</option>
                        <option value="${cId.suffixValue.fifth}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 6 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.fifth).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.fifth)}</option>
                        <option value="${cId.suffixValue.sixth}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 7 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.sixth).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.sixth)}</option>
                        <option value="${cId.suffixValue.seventh}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 8 ? 'selected':'') : ''}  data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.seventh).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.seventh)}</option>
                        <option value="${cId.suffixValue.eighth}" ${myData.data[consentSuffixKey] ? (suffixList[myData.data[consentSuffixKey]] == 9 ? 'selected':'') : ''}   data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(cId.suffixValue.eighth).replace('.', '')}">${suffixToTextMapDropdown.get(cId.suffixValue.eighth)}</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group row">
                <div class="col-md-4">
                    <label data-i18n="form.preferredName" class="col-form-label">Preferred First Name</label>
                    <input data-i18n="form.preferredNameField" style="max-width:215px; margin-left:0px;" type="text" class="form-control input-validation" id="UPPreferredName" placeholder="Enter preferred name">
                </div>
            </div>
            <br>
            <hr style="color:#A9AEB1;">

            <p class="userProfileSubHeaders" data-i18n="form.formerNameSubHeader">Former Names</p> 
            <span data-i18n="form.formerNameIntroduction">Former names are other name(s) you have used in the past for paperwork and administrative purposes (for example, legal name changes, unmarried or “maiden name”, married name). We collect this information so that we can match information we collect from other sources, like state health registries, to you.</span>
            <!--<div class="form-group row">
                <div class="col-md-3">
                    <label class="col-form-label" data-i18n="form.formerNameCategoryTitle">Name Category</label>
                </div>
                <div class="col-md-4">
                    <label class="col-form-label" data-i18n="form.formerNameValueTitle">Former Name</label>
                </div>
            </div> -->
            <div id="former-name-group">
               <!-- Use function addMoreFormerName to generate default content -->
            </div>
            <div class="form-group row" style="margin-bottom:20px !important;">
                <div class="col">
                    <button data-i18n="form.addMoreFormerName" type="button" class="btn btn-light" id="addMoreFormerName">Add more <i class="fas fa-plus"></i></button>
                </div>
            </div>
            <hr style="color:#A9AEB1;">
            
            <p class="userProfileSubHeaders" data-i18n="form.birthDateSubHeader">Date of Birth</p> 
            <div class="form-group row">
                <div class="col-md-3 col-lg-2">
                    <label class="col-form-label" data-i18n="form.monthListLabel">Month <span class="required">*</span></label>
                    <select style="margin-left:0px;" id="UPMonth" class="form-control required-field" data-i18n="form.monthListRequired" data-error-required='Please select your birth month.'>
                        <option class="option-dark-mode" value="" data-i18n="form.selectOption">-- Select --</option>
                        <option class="option-dark-mode" value="01" data-i18n="form.monthJanuary">January</option>
                        <option class="option-dark-mode" value="02" data-i18n="form.monthFebruary">February</option>
                        <option class="option-dark-mode" value="03" data-i18n="form.monthMarch">March</option>
                        <option class="option-dark-mode" value="04" data-i18n="form.monthApril">April</option>
                        <option class="option-dark-mode" value="05" data-i18n="form.monthMay">May</option>
                        <option class="option-dark-mode" value="06" data-i18n="form.monthJune">June</option>
                        <option class="option-dark-mode" value="07" data-i18n="form.monthJuly">July</option>
                        <option class="option-dark-mode" value="08" data-i18n="form.monthAugust">August</option>
                        <option class="option-dark-mode" value="09" data-i18n="form.monthSeptember">September</option>
                        <option class="option-dark-mode" value="10" data-i18n="form.monthOctober">October</option>
                        <option class="option-dark-mode" value="11" data-i18n="form.monthNovember">November</option>
                        <option class="option-dark-mode" value="12" data-i18n="form.monthDecember">December</option>
                    </select>
                </div>
                <div class="col-md-3 col-lg-2">
                    <label class="col-form-label" data-i18n="form.dayListLabel">Day <span class="required">*</span></label>
                    <select style="margin-left:0px;"class="form-control required-field" data-i18n="form.dayListRequired" id="UPDay"></select>
                </div>
                <div class="col-md-3 col-lg-2">
                    <label class="col-form-label" data-i18n="form.yearListLabel">Year <span class="required">*</span></label>
                    <input data-i18n="form.yearListField" style="margin-left:0px;" type="text" class="form-control required-field input-validation" data-error-required='Please select your birth year.' data-validation-pattern="year" data-error-validation="The year you entered is outside of our expected range. Please check your entry." maxlength="4" id="UPYear" title="Birth year, must be in 1900s" Placeholder="Enter birth year">
                    <!--<datalist id="yearsOption"></datalist>-->
                </div>

            </div>

             <div class="form-group row">
                <div data-i18n="form.dobConfirmation">
                    Please confirm your date of birth by re-entering your information.
                </div>
            </div>        
            <div class="form-group row" style="margin-top: -20px">
                <div class="col-md-3 col-lg-2">
                    <label class="col-form-label" data-i18n="form.monthListLabelNotRequired">Month</label>
                    <select style="margin-left:0px;" id="UPMonthConfirmation" class="form-control confirmation-field" target="UPMonth" data-i18n="form.monthFieldConfirmation" data-error-confirmation="Both the Month of Birth's do not match">
                        <option class="option-dark-mode" value="" data-i18n="form.selectOptionConfirmation">-- Select --</option>
                        <option class="option-dark-mode" value="01" data-i18n="form.monthJanuary">January</option>
                        <option class="option-dark-mode" value="02" data-i18n="form.monthFebruary">February</option>
                        <option class="option-dark-mode" value="03" data-i18n="form.monthMarch">March</option>
                        <option class="option-dark-mode" value="04" data-i18n="form.monthApril">April</option>
                        <option class="option-dark-mode" value="05" data-i18n="form.monthMay">May</option>
                        <option class="option-dark-mode" value="06" data-i18n="form.monthJune">June</option>
                        <option class="option-dark-mode" value="07" data-i18n="form.monthJuly">July</option>
                        <option class="option-dark-mode" value="08" data-i18n="form.monthAugust">August</option>
                        <option class="option-dark-mode" value="09" data-i18n="form.monthSeptember">September</option>
                        <option class="option-dark-mode" value="10" data-i18n="form.monthOctober">October</option>
                        <option class="option-dark-mode" value="11" data-i18n="form.monthNovember">November</option>
                        <option class="option-dark-mode" value="12" data-i18n="form.monthDecember">December</option>
                    </select>
                </div>
                <div class="col-md-3 col-lg-2">
                    <label class="col-form-label" data-i18n="form.dayListLabelNotRequired">Day</label>
                    <select style="margin-left:0px;" class="form-control confirmation-field" id="UPDayConfirmation" target="UPDay" data-i18n="form.dayFieldConfirmation" data-error-confirmation="Both the Day of Birth's do not match"></select>
                </div>
                    <div class="col-md-3 col-lg-2">
                     <label class="col-form-label" data-i18n="form.yearListLabelNotRequired">Year</label>
                    <input data-i18n="form.yearListFieldConfirmation" style="margin-left:0px;" type="text" class="form-control confirmation-field" id="UPYearConfirmation" Placeholder="Re-enter birth year" target="UPYear" data-error-confirmation="Both the Year of Birth's do not match">
                    <!--<datalist id="yearsOptionConfirmation"></datalist>-->
                </div>
            </div>
            <hr>
            <p class="userProfileSubHeaders" data-i18n="form.birthPlaceSubHeader">Place of birth</p>
            <span data-i18n="form.birthPlaceIntroduction">We collect this information so that we can match any information we collect from other sources, like state health registries, to you. </span>
            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.cityOfBirth.title">
                        City 
                    </label>
                    <br>
                    <input data-i18n="form.cityOfBirth" style="margin-left:0px; max-width:301px;" type=text id="cityOfBirth" class="form-control" placeholder="Enter City">
                </div>
            </div>
            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.stateOfBirth.title">
                        State 
                    </label>
                    <br>
                    <input data-i18n="form.stateOfBirth" style="margin-left:0px; max-width:301px;" type=text id="stateOfBirth" class="form-control" placeholder="Enter State">
                </div>
            </div>
            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.countryOfBirth.title">
                        Country 
                    </label>
                    <br>
                    <input data-i18n="form.countryOfBirth" style="margin-left:0px; max-width:301px;" type=text id="countryOfBirth" class="form-control" placeholder="Enter Country">
                </div>
            </div>

            <hr>
            <p class="userProfileSubHeaders" data-i18n="form.contactSubheader">Contact Information</p>
            
            <div class="form-group row" style="padding-bottom:0;">
                <div class="col">
                    <label data-i18n="form.preferredEmail" class="col-form-label">Preferred Email <span class="required">*</span></label>
                    <input data-i18n="form.preferredEmailField" style="margin-left:0px; max-width:382px;" type="text" class="form-control" id="UPEmail" title="Please enter an email address in this format: name@example.com." Placeholder="abc@mail.com">
                </div>
            </div>
            </br>
            <div class="form-group row" style="padding-top:0; padding-bottom:0;">
                <div class="col">
                    <label data-i18n="form.confirmPreferredEmail" class="col-form-label">Confirm Preferred Email <span class="required">*</span></label>
                    <input data-i18n="form.confirmPreferredEmailField" style="margin-left:0px; max-width:382px;" type="text" class="form-control" id="confirmUPEmail" title="Please enter an email address in this format: name@example.com." Placeholder="Retype preferred email">
                </div>
            </div>
            </br>
            <div class="form-group row" style="padding-top:0; padding-bottom:0;">
                <div class="col">
                    <label data-i18n="form.additionalEmail" class="col-form-label">Additional Email</label>
                    <input data-i18n="form.additionalEmailField" style="margin-left:0px; max-width:382px;" type="text" class="form-control col-md-4" id="UPEmail2" title="Please enter an email address in this format: name@example.com." Placeholder="Enter additional email">
                </div>
            </div>
            </br>
            <div id="multipleEmail1"></div>
            <br id="multipleEmail2Br" style="display:none;">
            <div id="multipleEmail2"></div>
            <div class="form-group row" style="margin-bottom:20px !important;">
                <div class="col" id="additionalEmailBtn">
                    <button data-i18n="form.addMoreEmail" type="button" class="btn btn-light" id="addMoreEmail" title="Add more email">Add more <i class="fas fa-plus"></i></button>
                </div>
            </div>

            
            <div class="form-group row" style="padding-bottom:0">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.phoneRequired">
                        <b>
                            One phone number is required.<span class="required">*</span>
                        </b>
                    </label>
                </div>
            </div>
            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.mobilePhone">
                        Mobile phone <span class="required"></span>
                    </label>
                    <br>
                    <div class="btn-group col-md-4" id="mainMobilePhone" style="margin-left:0px;">
                        <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[1-9]{1}[0-9]{2}" title="Only numbers are allowed." id="UPPhoneNumber11" data-error-validation="Only numbers are allowed." size="3" maxlength="3" Placeholder="999" style="margin-left:0px"> <span class="hyphen">-</span>
                        <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[0-9]{3}" title="Only numbers are allowed." id="UPPhoneNumber12" data-error-validation="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                        <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[0-9]{4}" title="Only numbers are allowed." id="UPPhoneNumber13" data-error-validation="Only numbers are allowed." size="4" maxlength="4" Placeholder="9999">
                    </div>
                </div>
            </div>

            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.leaveVoicemail">
                        Can we leave a voicemail at this number? 
                    </label>
                    <br>
                    <div class="btn-group btn-group-toggle col-md-4" style="margin-left:0px;">
                        <label><input type="radio" name="voiceMailPermission1" value="353358909"> <span data-i18n="settings.optYes">Yes</span></label>
                        <label style = "margin-left:20px;"><input type="radio" name="voiceMailPermission1" value="104430631"> <span data-i18n="settings.optNo">No</span></label>
                    </div>
                </div>
            </div>
            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.textNumber">
                        Can we text this number? 
                        <br>
                        Text message charges may apply
                    </label>
                    <br>
                    <div class="btn-group btn-group-toggle col-md-4"  style="margin-left:0px;">
                        <label id="textPermissionYes"><input type="radio" name="textPermission1"  value="353358909"> <span data-i18n="settings.optYes">Yes</span></label>
                        <label style = "margin-left:20px;" id="textPermissionNo"><input type="radio" name="textPermission1"  value="104430631"> <span data-i18n="settings.optNo">No</span></label>
                    </div>
                </div>
            </div>

            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.homePhone">
                        Home phone <span class="required"></span>
                    </label>
                    <br>
                    <div class="btn-group col-md-4" id="mainMobilePhone2" style="margin-left:0px">
                        <input data-i18n="form.onlyNumbers" type="text" class="form-control" id="UPPhoneNumber21" data-val-pattern="[1-9]{1}[0-9]{2}" title="Only numbers are allowed." size="3" maxlength="3" Placeholder="999" style="margin-left:0px"> <span class="hyphen">-</span>
                        <input data-i18n="form.onlyNumbers" type="text" class="form-control" id="UPPhoneNumber22" data-val-pattern="[0-9]{3}" title="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                        <input data-i18n="form.onlyNumbers" type="text" class="form-control" id="UPPhoneNumber23" data-val-pattern="[0-9]{4}" title="Only numbers are allowed." size="4" maxlength="4" Placeholder="9999">
                    </div>
                </div>
            </div>

            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.leaveVoicemail">
                        Can we leave a voicemail at this number? 
                    </label>
                    <br>
                    <div class="btn-group btn-group-toggle col-md-4" style="margin-left:0px;">
                        <label ><input type="radio" name="voiceMailPermission2" value="353358909"> <span data-i18n="settings.optYes">Yes</span></label>
                        <label style = "margin-left:20px;"><input type="radio" name="voiceMailPermission2" value="104430631"> <span data-i18n="settings.optNo">No</span></label>
                    </div>
                </div>
            </div>

            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.otherPhone">
                        Other phone <span class="required"></span>
                    </label>
                    <br>
                    <div class="btn-group col-md-4" id="mainMobilePhone3" style="margin-left:0px">
                        <input  data-i18n="form.onlyNumbers" type="text" class="form-control" id="UPPhoneNumber31" data-val-pattern="[1-9]{1}[0-9]{2}" title="Only numbers are allowed." size="3" maxlength="3" Placeholder="999" style="margin-left:0px"> <span class="hyphen">-</span>
                        <input  data-i18n="form.onlyNumbers" type="text" class="form-control" id="UPPhoneNumber32" data-val-pattern="[0-9]{3}" title="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                        <input  data-i18n="form.onlyNumbers" type="text" class="form-control" id="UPPhoneNumber33" data-val-pattern="[0-9]{4}" title="Only numbers are allowed." size="4" maxlength="4" Placeholder="9999">
                    </div>
                </div>
            </div>

            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.leaveVoicemail">
                        Can we leave a voicemail at this number? 
                    </label>
                    <br>
                    <div class="btn-group btn-group-toggle col-md-4" style="margin-left:0px;">
                        <label ><input type="radio" name="voiceMailPermission3" value="353358909"> <span data-i18n="settings.optYes">Yes</span></label>
                        <label style = "margin-left:20px;"><input type="radio" name="voiceMailPermission3" value="104430631"> <span data-i18n="settings.optNo">No</span></label>
                    </div>
                </div>
            </div>
            <hr>
            <div class="userProfileSubHeaders" data-i18n="form.addresses">Addresses</div>
            <br/>
            <div style="font-weight:bold" data-i18n="form.mailAddress">
                Mailing Address
            </div>
            ${renderMailingAddress('', 1, true)}

            <div class="checkbox">
                <label>
                    <input type="checkbox" id="poBoxCheckbox">
                    <span  data-i18n="form.isPOBoxChecked">Please check if mailing address is a P.O. Box</span>
                </label> 
            </div><br/>
            <div id="physicalAddressSection" style="display:block">
                <div style="font-weight:bold" data-i18n="form.physicalAddress">
                    Physical Address (if different from Mailing Address)
                </div><br/>
                <div data-i18n="form.physicalAddressDesc">
                    Physical address is needed so Connect can mail you packages via FedEx for some study activities. FedEx does not deliver to P.O. Boxes.
                </div>
                ${renderMailingAddress('', 2)}
            </div>
            <hr>
            <!-- Other Address Info -->
            ${renderAltAddressFields()}
            <!-- Alt Contact Info -->
            ${renderAltContactFields()}
            <br><hr>
            <div class="userProfileSubHeaders" data-i18n="form.cancerHistorySubheader">Cancer History</div>
            <div class="form-group row">
                <div class="col">
                    <label class="col-form-label" data-i18n="form.invasiveCancer">Have you ever had invasive cancer? <span class="required">*</span></label>
                    <br>
                    <i data-i18n="form.invasiveCancerMessage">If you have or once had non-melanoma skin cancer (like basal cell or squamous cell carcinoma), or a condition that raises cancer risk (such as DCIS, or stage 0 breast cancer), please respond “No” to this question. These conditions are not invasive cancer, and you can still join. We are interested in learning how these conditions may affect cancer risk and health outcomes in the future.</i>
                    <br>
                    <div class="btn-group btn-group-toggle col-md-4" style="margin-left:0px;">
                        <label id="UPCancer1Btn"><input type="radio" name="cancerHistory" id="UPCancer1" value="353358909"> <span data-i18n="settings.optYes">Yes</span></label>
                        <label id="UPCancer2Btn" style = "margin-left:20px;"><input type="radio" name="cancerHistory" id="UPCancer2" value="104430631"> <span data-i18n="settings.optNo">No</span></label>
                    </div>
                    <br>
                    <div style="padding-left:0px" id="UPCancerBtnGroup">
                    </div>
                </div>
            </div>

            <div id="cancerFollowUp"></div>

            </br></br>
            <div class="row">
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary save-data consentNextButton" data-i18n="form.submitText" id="userProfileSubmitButton">Submit</button>
                </div>
            </div>
        </form>
        </br></br>
        </div>
        <div class="col-lg-2">
        </div>
        </div>
    `);
    
    addEventNameConsistency(myData.data['471168198'], myData.data['736251808']);
    addEventChangeFocus();
    addEventCancerFollowUp();
    addEventMonthSelection();
    addEventMonthConfirmationSelection();
    addEventFormerName();
    addEventAdditionalEmail();
    addEventAddressAutoComplete(1);
    addEventAddressAutoComplete(2);
    addEventAddressAutoComplete(3);
    addEventCheckCanText();
    addEventUPSubmit();
    addEventPhysicalAddressLine(2);
    addEventToggleAltAddress();

    for (let i = 0; i < numberOfDefaultFormerNames; i++) {
        addMoreFormerName();
    }
};

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

// Show alternate address section if "Yes" (353358909) is selected. Otherwise hide it.
const addEventToggleAltAddress = () => {
    const altAddressRadioButtons = document.getElementsByName('altMailingAddress');
    const altAddressSection = document.getElementById('altAddressSection');

    altAddressRadioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value == cId.yes) {
                altAddressSection.style.display = 'block';
            } else {
                altAddressSection.style.display = 'none';
            }
        });
    });
}

const renderAltAddressFields = () => {
    return translateHTML(`
        <div class="userProfileSubHeaders" data-i18n="form.otherContactInformation">Other Contact Information</div>
        <span data-i18n="form.otherContactIntroduction">We would like to keep in touch with you during your time in the study. Please share more contact information to help us reach you in the future.</span>
        <br>

        <div class="form-group row">
            <div class="col">
                <label class="col-form-label" data-i18n="form.altAddressQuestion">Are there any other mailing addresses that you use?</label>
                <br>
                <div class="btn-group btn-group-toggle col-md-4" style="margin-left:0px;">
                    <label><input type="radio" name="altMailingAddress" value="353358909"> <span data-i18n="settings.optYes">Yes</span></label>
                    <label style = "margin-left:20px;"><input type="radio" name="altMailingAddress" value="104430631"> <span data-i18n="settings.optNo">No</span></label>
                </div>
            </div>
        </div>

        <div class="form-group row" id="altAddressSection">
            <div class="col">
                <span data-i18n="form.whatIsTheAltAddress">What is the address?</span>
                ${renderMailingAddress('', 3, false)}                    
                <label>
                    <input type="checkbox" id="poBoxCheckboxAltAddress">
                    <span  data-i18n="form.isPOBoxCheckboxAltAddress">Please check if alternate address is a P.O. Box</span>
                </label> 
            </div>
        </div>
        <br>`);
}

export const renderAltContactFields = () => {
    return translateHTML(`
        <div style="font-weight:bold" data-i18n="form.altContactHeader">
                    Alternate Contact
                </div>
        <span data-i18n="form.altContactQuestion">Sometimes we find that people have moved when we try to contact them again. It would be helpful if you could give us contact details of someone close to you (such as a relative or friend) who would be willing for us to contact them if we are unable to reach you. Please leave this section blank if you do not want to share these extra contact details.</span>
        <br>

        <div class="form-group row">
            <div class="col">
                <label>
                    <span data-i18n="form.altContactFirstName">Alternate Contact First Name</span>
                    <input data-i18n="form.altContactFirstNameField" type="text" class="form-control input-validation" data-validation-pattern="alphabets" id="altContactFirstName" placeholder="Enter first name">
                </label>
            </div>
        </div>
        <div class="form-group row">
            <div class="col">
                <label>
                    <span data-i18n="form.altContactLastName">Alternate Contact Last Name</span>
                    <input data-i18n="form.altContactLastNameField" type="text" class="form-control input-validation" data-validation-pattern="alphabets" id="altContactLastName" placeholder="Enter last name">
                </label><br>
            </div>
        </div>

        <div class="form-group row">
            <div class="col">
                <span data-i18n="form.altContactHowCanWeReach">How can we reach this person?</span>
            </div>
        </div>

        <div class="form-group row">
            <div class="col">
                <label class="col-form-label" data-i18n="form.altContactMobilePhone">Mobile phone</label>
                <br>
                <div class="btn-group col-md-4" id="altContactMobilePhone" style="margin-left:0px;">
                    <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[1-9]{1}[0-9]{2}" title="Only numbers are allowed." id="altContactMobilePhone1" data-error-validation="Only numbers are allowed." size="3" maxlength="3" Placeholder="999" style="margin-left:0px"> <span class="hyphen">-</span>
                    <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[0-9]{3}" title="Only numbers are allowed." id="altContactMobilePhone2" data-error-validation="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                    <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[0-9]{4}" title="Only numbers are allowed." id="altContactMobilePhone3" data-error-validation="Only numbers are allowed." size="4" maxlength="4" Placeholder="9999">
                </div>
            </div>
        </div>
        <div class="form-group row">
            <div class="col">
                <label class="col-form-label" data-i18n="form.altContactHomePhone">Home phone</label>
                <br>
                <div class="btn-group col-md-4" id="altContactHomePhone" style="margin-left:0px;">
                    <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[1-9]{1}[0-9]{2}" title="Only numbers are allowed." id="altContactHomePhone1" data-error-validation="Only numbers are allowed." size="3" maxlength="3" Placeholder="999" style="margin-left:0px"> <span class="hyphen">-</span>
                    <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[0-9]{3}" title="Only numbers are allowed." id="altContactHomePhone2" data-error-validation="Only numbers are allowed." size="3" maxlength="3" Placeholder="999"> <span class="hyphen">-</span>
                    <input data-i18n="settings.onlyNumbersField" type="text" class="form-control num-val" data-val-pattern="[0-9]{4}" title="Only numbers are allowed." id="altContactHomePhone3" data-error-validation="Only numbers are allowed." size="4" maxlength="4" Placeholder="9999">
                </div>
            </div>
        </div>

        <div class="form-group row" style="padding-top:0; padding-bottom:0;">
            <div class="col">
                <label data-i18n="form.altContactEmail" class="col-form-label">Email</label>
                <input data-i18n="form.altContactEmailField" style="margin-left:0px; max-width:382px;" type="text" class="form-control col-md-4" id="altContactEmail" title="Please enter an email address in this format: name@example.com." Placeholder="Enter a valid email address">
            </div>
        </div>
    `);
}

export const renderMailingAddress = (type, id, required, showCountry) => {
    let idText;
    if (id === 1) {
        idText = 'mail';
    } else if (id === 2) {
        idText = 'physical';
    } else {
        idText = 'alt';
    }
    return translateHTML(`
        <div class="form-group row">
            <div class="col">
                <label class="col-form-label" data-i18n="form.${idText}AddressLine1Label${required ? 'Required': ''}">
                    Line 1 (street, ${id === 1 || id === 3 ? 'PO box, ': '' }rural route) ${required ? '<span class="required">*</span>': ''}
                </label>
                <br>
                <input data-i18n="form.${idText}AddressLine1Field" style="margin-left:0px; max-width:301px;" type=text id="UPAddress${id}Line1" autocomplete="off" class="form-control ${required ? 'required-field': ''}" data-error-required='Please enter the first line of your mailing address.' placeholder="Enter street, PO box, rural route" maxlength="70">
            </div>
        </div>
        <div class="form-group row">
            <div class="col">
                <label class="col-form-label" data-i18n="form.mailAddressLine2Label">
                    Line 2 (apartment, suite, unit, building)
                </label>
                <br>
                <input data-i18n="form.mailAddressLine2Field" style="margin-left:0px; max-width:301px;" type=text id="UPAddress${id}Line2" autocomplete="off" class="form-control" placeholder="Enter apartment, suite, unit, building" maxlength="70">
            </div>
        </div>
        <div class="form-group row">
            <div class="col">
                <label class="col-form-label" id="UPAddress${id}CityLabel" data-i18n="form.mailAddressCityLabel${required ? 'Required': ''}">
                    City  ${required ? '<span class="required">*</span>': ''}
                </label>
                <br>
                <input data-i18n="form.mailAddressCityField" style="margin-left:0px; max-width:301px;" type=text id="UPAddress${id}City" class="form-control ${required ? 'required-field': ''}" data-error-required='Please enter the city field of your mailing address.' placeholder="Enter City">
            </div>
        </div>
        <div class="form-group row">
            <div class="col-lg-2">
                <label class="col-form-label" id="UPAddress${id}StateLabel" data-i18n="form.mailAddressStateLabel${required ? 'Required': ''}">
                    State ${required ? '<span class="required">*</span>': ''}
                </label>
                <br>
                <select style="margin-left:0px; max-width:301px;" class="form-control ${required ? 'required-field': ''}" data-error-required='Please select the state field of your mailing address.' id="UPAddress${id}State" data-i18n="form.mailAddressState">
                    <option class="option-dark-mode" value="" data-i18n="form.selectOption">-- Select --</option>
                    ${renderStates()}
                </select><br>
            </div>
            <div class="col-lg-2">
                <label class="col-form-label" id="UPAddress${id}ZipLabel" data-i18n="form.mailAddressZipLabel${required ? 'Required': ''}">
                    Zip ${required ? '<span class="required">*</span>': ''}
                </label>
                <input data-i18n="form.mailAddressZipField" style="margin-left:0px; max-width:301px;" type="text" id="UPAddress${id}Zip" data-error-validation="Please enter a 5 digit zip code in this format: 12345." data-val-pattern="[0-9]{5}" title="5 characters long, numeric-only value." class="form-control ${required ? 'required-field': ''} num-val" data-error-required='Please enter the zip field of your mailing address.' size="5" maxlength="5" placeholder="99999">
            </div>
        </div>
        <div class="form-group row">
            
        </div>
        ${showCountry ? `<br>
        <div class="form-group row">
            <label class="col-md-4 col-form-label" data-i18n="form.mailAddressCountry${required ? 'Required': ''}">
                Country ${required ? '<span class="required">*</span>': ''}
            </label>
            <select class="form-control col-md-4" ${required ? 'required' : ''} id="UPAddress${id}Country">
                <option class="option-dark-mode" value="">-- Select Country --</option>
                ${renderCountries()}
            </select>
        </div>
        `:``}
    `);
};

const renderStates = () => {
    let options = '';
    for(const state in allStates){
        options += `<option class="option-dark-mode" value="${state}" data-i18n="shared.state${state.replace(/\s/g,'')}">${state}</option>`;
    }
    return options;
}

const renderCountries = () => {
    let options = '';
    for(const country in allCountries){
        options += `<option class="option-dark-mode" value="${allCountries[country]}" data-i18n="shared.country${country.replace(/(\s|[-.])/g,'')}">${country}</option>`
    }
    return options;
}