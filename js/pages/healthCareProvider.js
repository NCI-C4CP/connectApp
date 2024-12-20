import { sites, translateHTML } from "../shared.js";
import fieldMapping from "../fieldToConceptIdMapping.js"; 

export const duplicateAccountReminderRender = () => {
  document.getElementById('root').innerHTML = translateHTML(`
    <div class="row justify-content-center mt-3">
      <div class="col-lg-8 alert alert-warning" data-i18n="provider.alertWarning">
        Our records show that you already have another account with a different email or phone number. Please try signing in again. Contact the Connect Support Center by emailing <a href="mailto:ConnectSupport@norc.org">ConnectSupport@norc.org</a> or calling <span style="white-space:nowrap;overflow:hidden">1-877-505-0253</span> if you need help accessing your account.
      </div>
    </div>
  `);
};

export const requestPINTemplate = () => {
    return translateHTML(`
        <br>
        <div class="row">
        <div class="col-lg-2">
        </div>
        <div class="col-lg-8 eligibility-form">
            <form method="POST" id="requestPINForm">
                <div class="mb-3">
                    <label class="form-label" data-i18n="provider.receivedPin">
                        <strong>If you received a PIN as part of your study invitation, please enter it here.<br>
                        Your PIN should be 6 characters and will include only numbers and uppercase letters.<br></strong>
                    </label>
                    <input data-i18n="provider.enterPin" type="text" maxlength="6" id="participantPIN" class="form-control" placeholder="Enter PIN">
                </div>

                <div class="d-flex justify-content-between align-items-center mt-4">
                    <button type="submit" class="btn btn-primary save-data" id="noPinSubmit" data-i18n="provider.noPin">I do not have a PIN</button>
                    <button type="submit" disabled class="btn btn-primary save-data consentNextButton" id="pinSubmit" data-i18n="provider.submitText">Submit</button>
                </div>
            </form>
        </div>
        <div class="col-lg-2">
        </div>
        </div>
    `);
}

export const healthCareProvider = (siteId) => {
    let template = '';
    template += `
    <br>
    <!-- Modal -->
    <div class="modal fade" id="HealthProviderModal" tabindex="-1" role="dialog" aria-labelledby="HealthProviderModalLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title" id="HealthProviderModalLabel"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
            
            </button>
        </div>
        <div class="modal-body" id="HealthProviderModalBody">
            ...
        </div>
        <div class="modal-footer">
            <button type="button" id="modalCancel" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="provider.modalCancel">No</button>
            <button type="button" id="modalConfirm" class="btn btn-primary consentNextButton" data-i18n="provider.modalConfirm">Yes</button>
        </div>
        </div>
    </div>
    </div>
    <div class = "row">
    <div class="col-lg-2">
    </div>
    <div class="col eligibility-form">
        <form method="POST" id="eligibilityForm">
            <div class="form-group">
                <label for="827220437"><strong data-i18n="provider.whoProvider">Who is your healthcare provider?<span class="required hovertext" data-hover-text="Healthcare provider is required"> *</span></strong>
                    <select ${siteId ? `disabled` : ``} class="form-control" style="margin-left:0px;" id="827220437" required>
                        <option value="" data-i18n="provider.selectProvider">-- Select healthcare provider --</option>
    `;

    for (let siteCode in sites()){
        template += `<option ${siteId && siteId === parseInt(siteCode) ? `selected`: `` } value=${siteCode}>${sites()[siteCode]}</option>`;
    }

    template += `
                    </select>
                </label>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-4">
                <span class="required" data-i18n="provider.required">*Required</span>
                <div>
                    <button style="display:none;" id="openModal" class="btn btn-primary save-data consentNextButton" data-bs-toggle="modal" data-bs-target="#HealthProviderModal" data-i18n="provider.submitText">Submit</button>
                    <button type="submit" class="btn btn-primary save-data consentNextButton" data-i18n="provider.submitText">Submit</button>
                </div>
            </div>
            </br></br>
        </form>
    </div>
    <div class="col-lg-2">
    </div>
    `;
    return translateHTML(template);
}

export const heardAboutStudy = (formData = {}) => {
    const getChecked = (value) =>  value === fieldMapping.yes ? "checked" : "";
    const { heardAboutStudyCheckBoxes } = fieldMapping;
    return translateHTML(`
        <br>
        <div class="row">
        <div class="col-lg-2">
        </div>
        <div class="col">
        <form method="POST" id="heardAboutStudyForm">
            <label data-i18n="provider.heardAboutStudy"><strong>How did you hear about this study? (Select all that apply)</strong></label>
            <div class="form-group">
                <div class="checkbox">
                    <label data-i18n="provider.anotherParticipant"><input type="checkbox" id="checkbox8" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox8])}> Another Connect participant</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.connectResearch"><input type="checkbox" id="checkbox13" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox13])}> Connect research staff at my health care system</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.connectTable"><input type="checkbox" id="checkbox10" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox10])}> Connect table at public event</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.connectWebsite"><input type="checkbox" id="checkbox16" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox16])}> Connect website on Cancer.gov</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.emailInvitation"><input type="checkbox" id="checkbox2" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox2])}> Email or text invitation</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.familyFriend"><input type="checkbox" id="checkbox7" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox7])}> Family or friend</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.newsletter"><input type="checkbox" id="checkbox14" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox14])}> Health care system newsletter</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.website"><input type="checkbox" id="checkbox15" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox15])}> Health care system website</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.invitationPortal"><input type="checkbox" id="checkbox6" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox6])}> Invitation through my patient portal (such as MyChart)</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.letterMail"><input type="checkbox" id="checkbox3" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox3])}> Letter or brochure in mail</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.newsTvRadio"><input type="checkbox" id="checkbox17" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox17])}> Local news, television, or radio station</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.article"><input type="checkbox" id="checkbox4" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox4])}> News article or press release about Connect </label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.phoneCall"><input type="checkbox" id="checkbox12" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox12])}> Phone call invitation</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.physician"><input type="checkbox" id="checkbox1" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox1])}> Physician or other health care staff</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.poster"><input type="checkbox" id="checkbox9" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox9])}> Poster, flyer, or sign at my health care system</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.recordedMessage"><input type="checkbox" id="checkbox19" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox19])}> Recorded message</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.socialMedia"><input type="checkbox" id="checkbox5" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox5])}> Social media post (on Facebook, Twitter, Instagram, or other channels)</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.video"><input type="checkbox" id="checkbox18" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox18])}> Video</label>
                </div>
                <div class="checkbox">
                    <label data-i18n="provider.other"><input type="checkbox"  id="checkbox11" ${getChecked(formData[heardAboutStudyCheckBoxes.checkbox11])}> Other</label>
                </div>
            </div>
            <div class="row" data-i18n="provider.consentProcess">
                The next screens will take you through the informed consent process. They explain more about the study and what it means to take part in Connect. At the end, you can read the full informed consent form and electronic health records release form before you decide if you want to join.
            </div>
            <div class="row justify-content-end">
                <div class="col-auto">
                    <button type="submit" class="btn btn-primary save-data consentNextButton" data-i18n="provider.submitText">Submit</button>
                </div>
            </div>
        </form>
        </div>
        <div class="col-lg-2">
        </div>
        </div>
    `);
}