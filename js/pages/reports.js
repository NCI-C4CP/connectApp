import { reportConfiguration, setReportAttributes, showAnimation, hideAnimation, translateHTML, translateText, translateDate, getMyData, storeResponse } from "../shared.js";
import fieldMapping from "../fieldToConceptIdMapping.js";
import { validateLoginPhone } from "../settingsHelpers.js";
const { PDFDocument, StandardFonts, rgb } = PDFLib;

let reports = reportConfiguration();
let myData;

export const renderReportsPage = async () => {
    document.title = translateText('reports.pageTitle');
    showAnimation();
    myData = await getMyData();
    myData = myData.data || myData;
    
    reports = await setReportAttributes(myData, reports, true);

    let template =  `
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <div class="row">
                    <h3 data-i18n="reports.pageTitle">My Reports</h3>
                </div>
    `; 

    let unread = [];
    let read = [];
    let declined = [];
    
    Object.keys(reports).forEach((key) => {
        if (reports[key].enabled) {
            switch (reports[key].status) {
                case fieldMapping.reports.unread: {
                    unread.push(reports[key]);
                    break;
                }
                case fieldMapping.reports.viewed: {
                    read.push(reports[key])
                    break;
                }
                case fieldMapping.reports.declined: {
                    declined.push(reports[key])
                    break;
                }
            }
        }
    });

    if (unread.length === 0 && read.length === 0 && declined.length === 0) {
        template += '<div data-i18n="reports.empty"></div>';
    } else {
        template += '<ul class="nav nav-tabs" style="border-bottom:none; margin-top:20px">';
        if (unread.length > 0) {
            template += `
                        <li class="nav-item">
                            <button class="nav-link navbar-btn messages-Active-Nav" id="unreadReports" data-i18n="reports.new">New</button>
                        </li>`;
        }
        template += `
                    <li class="nav-item" >
                        <button class=" nav-link navbar-btn ${(unread.length === 0) ? 'messages-Active-Nav' : 'messages-Inactive-Nav'}" id="viewedReports" data-i18n="reports.viewed">Viewed</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link navbar-btn messages-Inactive-Nav" id="declinedReports" data-i18n="reports.declined">Declined</button>
                    </li>
                </ul>`;
    
        
        template += `
            <div class="surveyMainBody" id="surveyMainBody">
        `;
        if (unread.length > 0) {
            template += renderMainBody(unread, 'Unread');
        } else {
            template += renderMainBody(read, 'Read');
        }
        
        template += `</div>`;
    }
    template += `
        </div>
        <div class="col-lg-2">
        </div>
    </div>
    `;
    
    const mainContent = document.getElementById('root');
    mainContent.innerHTML = translateHTML(template);
    if (unread.length > 0) {
        initializeUnreadButtons();
        document.getElementById('unreadReports').addEventListener('click', () => {
            document.getElementById('surveyMainBody').innerHTML = renderMainBody(unread, 'Unread');
            initializeUnreadButtons();
            if (!document.getElementById('unreadReports').classList.contains('messages-Active-Nav')) {
                let toActive = document.getElementById('unreadReports');   
                toActive.classList.remove('messages-Inactive-Nav');
                toActive.classList.add('messages-Active-Nav');

                let toInactive = document.getElementById('viewedReports');
                toInactive.classList.add('messages-Inactive-Nav');
                toInactive.classList.remove('messages-Active-Nav');

                toInactive = document.getElementById('declinedReports');
                toInactive.classList.add('messages-Inactive-Nav');
                toInactive.classList.remove('messages-Active-Nav');
            }
        });
    }
    if (unread.length || read.length || declined.length) {
        if (!unread.length) {
            initializeReadButtons();
        }
        document.getElementById('viewedReports').addEventListener('click', () => {
            document.getElementById('surveyMainBody').innerHTML = renderMainBody(read, 'Read');
            initializeReadButtons();
            if (!document.getElementById('viewedReports').classList.contains('messages-Active-Nav')) {
                let toActive = document.getElementById('viewedReports');   
                toActive.classList.remove('messages-Inactive-Nav');
                toActive.classList.add('messages-Active-Nav');

                let toInactive = document.getElementById('declinedReports');
                toInactive.classList.add('messages-Inactive-Nav');
                toInactive.classList.remove('messages-Active-Nav');
                
                toInactive = document.getElementById('unreadReports');
                if (toInactive) {
                    toInactive.classList.add('messages-Inactive-Nav');
                    toInactive.classList.remove('messages-Active-Nav');
                }
            }
        });

        document.getElementById('declinedReports').addEventListener('click', () => {
            document.getElementById('surveyMainBody').innerHTML = renderMainBody(declined, 'Declined');
            initializeDeclinedButtons();
            if (!document.getElementById('declinedReports').classList.contains('messages-Active-Nav')) {
                let toActive = document.getElementById('declinedReports');   
                toActive.classList.remove('messages-Inactive-Nav');
                toActive.classList.add('messages-Active-Nav');

                let toInactive = document.getElementById('viewedReports');
                toInactive.classList.add('messages-Inactive-Nav');
                toInactive.classList.remove('messages-Active-Nav');

                toInactive = document.getElementById('unreadReports');
                if (toInactive) {
                    toInactive.classList.add('messages-Inactive-Nav');
                    toInactive.classList.remove('messages-Active-Nav');
                }
            }
        });

    }
    hideAnimation();
};


const renderMainBody = (data, tab) => {
    let template = `<ul class="questionnaire-module-list report-list-${tab}">`;
    if (data.length === 0) {
        template += `<li style="width:100%; margin:auto; margin-bottom:20px; border:1px solid lightgrey; border-radius:5px;">
        <div class="row">
        <span class="messagesHeaderFont" style="text-align:center; margin:auto;" data-i18n="reports.no${tab}Reports">
        You have no Reports.
        </span>
        </div></li>
        `;
    } else {
        let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        Object.keys(data).forEach((key) => {
            let currentReport = data[key];
            let reportTitle = '<span data-i18n="reports.'+currentReport.reportId+'Title">'+translateText('reports.'+currentReport.reportId+'Title')+'</span>';
            let reportDescription = '<div id="'+currentReport.reportId+'Description" data-i18n="reports.'+currentReport.reportId+'Description"'+(tab !== 'Unread' ? ' style="display: none"' : '')+'>'+translateText('reports.'+currentReport.reportId+'Description')+'</div>';
            let reportTime = currentReport.dateField &&  currentReport.data[currentReport.dateField] ? `<p class="report-generated"><span data-i18n="reports.generated">Report Generated On </span> <span data-i18n="date" data-timestamp="${currentReport.data[currentReport.dateField]}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"  class="report-generated"></span></p>` : '';
            let buttons;
            let collapser;
            switch (tab) {
                case 'Unread':
                    buttons = `<button id="${currentReport.reportId}LearnMore" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.learnMore">Learn More</button>`;
                    break;
                case 'Read':
                    collapser = `<p><a href="#reports" id="${currentReport.reportId}Collapser" data-i18n="reports.collapserClosed"></a></p>`;
                    buttons = `<button id="${currentReport.reportId}ViewReport" style="display: none" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>
                    <button id="${currentReport.reportId}DeclineReport" style="display: none"  class="btn btn-primary save-data consentPrevButton px-3" data-i18n="reports.declineReport">Decline for now</button>`;
                    break;
                case 'Declined':
                    collapser = `<p><a href="#reports" id="${currentReport.reportId}Collapser" data-i18n="reports.collapserClosed"></a></p>`;
                    buttons = `<button id="${currentReport.reportId}ReinstateReport" style="display: none"  class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.reinstate">Reinstate this report</button>`;
                    break;
            }


            template += `<li style="width:100%; margin:auto; margin-bottom:20px; border:1px solid lightgrey; border-radius:5px;" id="${currentReport.reportId}Container">
                <div>
                    <div class="row">
                        <div class="col-md-12">
                            <p class="messagesHeaderFont">
                                ${reportTitle}
                            </p>
                            ${reportTime}
                            ${collapser || ''}
                            ${reportDescription}
                            ${buttons || ''}
                        </div>
                    </div>
                </div>
            </li>
            `;
        })
    }
    template += '</ul>';
    
    return translateHTML(template);
};

const initializeUnreadButtons = () => {
    let physActLearn = document.getElementById('physicalActivityLearnMore');
    if (physActLearn) {
        physActLearn.addEventListener('click', () => { 
            document.getElementById('physicalActivityContainer').innerHTML = translateHTML(renderPhysicalActivityInformedConsent());
            initializePhysicalActivityInformedConsent();
        });
    }
}

const initializeReadButtons = () => {
    let physActExpand = document.getElementById('physicalActivityCollapser');
    let declineButton = document.getElementById('physicalActivityDeclineReport');
    let viewButton = document.getElementById('physicalActivityViewReport');
    if (physActExpand) {
        physActExpand.addEventListener('click', () => { 
            if (physActExpand.dataset.i18n === 'reports.collapserClosed') {
                physActExpand.setAttribute('data-i18n', 'reports.collapserOpen');
                translateHTML(physActExpand);
                document.getElementById('physicalActivityDescription').style.display = 'block';
                if (viewButton) {
                    viewButton.style.display = 'inline-block';
                }
                if (declineButton) {
                    declineButton.style.display = 'inline-block';
                }
            } else {
                physActExpand.setAttribute('data-i18n', 'reports.collapserClosed');
                translateHTML(physActExpand);
                document.getElementById('physicalActivityDescription').style.display = 'none';
                if (viewButton) {
                    viewButton.style.display = 'none';
                }
                if (declineButton) {
                    declineButton.style.display = 'none';
                }
            }
        });
    }
    if (declineButton) {
        declineButton.addEventListener('click', () => { 
            let modalContainer = document.getElementById('declineModal');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id =  'declineModal';
                modalContainer.classList.add("modal");
                modalContainer.classList.add("fade");
                document.getElementById('root').parentNode.appendChild(modalContainer);
            }
            modalContainer.innerHTML = translateHTML(renderDeclineModal());
            let okButton = document.getElementById('reportDecline');
            okButton.addEventListener('click', async () => {
                let currentTime = new Date();
                let obj = {
                    [fieldMapping.reports.physicalActivityReport]: {
                        [fieldMapping.reports.physicalActivity.status]: fieldMapping.reports.declined,
                        [fieldMapping.reports.physicalActivity.declinedTS]: currentTime.toISOString()
                    }
                };
                await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? {[fieldMapping.reports.physicalActivityReport]: Object.assign({},  myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport])} : obj);
                window.location.reload();
            });
            const softModal = new bootstrap.Modal(document.getElementById('declineModal'));
            softModal.show();
        });
    }
    if (viewButton) {
        viewButton.addEventListener('click', async () => { 
            document.getElementById('physicalActivityContainer').innerHTML = translateHTML(renderPhysicalActivityReport(true));
            document.getElementById('physicalActivityDownloadReport').addEventListener('click', async () => {
                renderPhysicalActivityReportPDF();
            });
        });
    }
}

const initializeDeclinedButtons = () => {
    let physActExpand = document.getElementById('physicalActivityCollapser');
    let restoreButton = document.getElementById('physicalActivityReinstateReport');
    if (physActExpand) {
        physActExpand.addEventListener('click', () => { 
            if (physActExpand.dataset.i18n === 'reports.collapserClosed') {
                physActExpand.setAttribute('data-i18n', 'reports.collapserOpen');
                translateHTML(physActExpand);
                document.getElementById('physicalActivityDescription').style.display = 'block';
                if (restoreButton) {
                    restoreButton.style.display = 'inline-block';
                }
            } else {
                physActExpand.setAttribute('data-i18n', 'reports.collapserClosed');
                translateHTML(physActExpand);
                document.getElementById('physicalActivityDescription').style.display = 'none';
                if (restoreButton) {
                    restoreButton.style.display = 'none';
                }
            }
        });
    }
    if (restoreButton) {
        restoreButton.addEventListener('click', () => { 
            let modalContainer = document.getElementById('reinstateModal');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id =  'reinstateModal';
                modalContainer.classList.add("modal");
                modalContainer.classList.add("fade");
                document.getElementById('root').parentNode.appendChild(modalContainer);
            }
            modalContainer.innerHTML = translateHTML(renderReinstateModal());
            let okButton = document.getElementById('reportReinstate');
            okButton.addEventListener('click', async () => {
                let currentTime = new Date();
                let obj = {
                    [fieldMapping.reports.physicalActivityReport]: {
                        [fieldMapping.reports.physicalActivity.status]: fieldMapping.reports.viewed
                    }
                };
                await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? {[fieldMapping.reports.physicalActivityReport]: Object.assign({},  myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport])} : obj);
                window.location.reload();
            });
            const softModal = new bootstrap.Modal(document.getElementById('reinstateModal'));
            softModal.show();
        });
    }
}

const renderPhysicalActivityInformedConsent = () => {
    let template = `<div>
        <div class="row">
            <div class="col-md-12">
                <p class="messagesHeaderFont">
                    <span data-i18n="reports.physicalActivityConsentTitle">${translateText('reports.physicalActivityConsentTitle')}</span>
                </p>
                <div data-i18n="reports.physicalActivityConsentBody"></div>
                <button id="physicalActivityViewReport" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>
                <button id="physicalActivityDeclineReport" class="btn btn-primary save-data consentPrevButton px-3" data-i18n="reports.declineReport">Decline for now</button>
            </div>
        </div>
    </div>`

    return template;
}

const initializePhysicalActivityInformedConsent = () => {
    let declineButton = document.getElementById('physicalActivityDeclineReport');
    declineButton.addEventListener('click', () => { 
        let modalContainer = document.getElementById('declineModal');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id =  'declineModal';
            modalContainer.classList.add("modal");
            modalContainer.classList.add("fade");
            document.getElementById('root').parentNode.appendChild(modalContainer);
        }
        modalContainer.innerHTML = translateHTML(renderDeclineModal());
        let okButton = document.getElementById('reportDecline');
        okButton.addEventListener('click', async () => {
            let currentTime = new Date();
            let obj = {
                [fieldMapping.reports.physicalActivityReport]: {
                    [fieldMapping.reports.physicalActivity.status]: fieldMapping.reports.declined,
                    [fieldMapping.reports.physicalActivity.declinedTS]: currentTime.toISOString()
                }
            };
            await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? {[fieldMapping.reports.physicalActivityReport]: Object.assign({},  myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport])} : obj);
            window.location.reload();
        });
        const softModal = new bootstrap.Modal(document.getElementById('declineModal'));
        softModal.show();
    });

    let viewButton = document.getElementById('physicalActivityViewReport');
    viewButton.addEventListener('click', async () => { 
        let currentTime = new Date();
        let obj = {
            [fieldMapping.reports.physicalActivityReport]: {
                [fieldMapping.reports.physicalActivity.status]: fieldMapping.reports.viewed,
                [fieldMapping.reports.physicalActivity.viewedTS]: currentTime.toISOString()
            }
        };
        await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? {[fieldMapping.reports.physicalActivityReport]: Object.assign({},  myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport])} : obj);
        document.getElementById('physicalActivityContainer').innerHTML = translateHTML(renderPhysicalActivityReport(true));
        document.getElementById('physicalActivityDownloadReport').addEventListener('click', async () => {
            renderPhysicalActivityReportPDF();
        });
    });
}

const renderPhysicalActivityReport = (includeHeader) => {
    let template = `<div>
                    <div class="row">
                        <div class="col-md-12">`;
    let currentReport = reports['Physical Activity Report'];
    if (includeHeader) {
        let reportTitle = '<span data-i18n="reports.'+currentReport.reportId+'ResultsTitle">'+translateText('reports.'+currentReport.reportId+'Title')+'</span>';
        let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        let reportTime = currentReport.dateField &&  currentReport.data[currentReport.dateField] ? `<p class="report-generated"><span data-i18n="reports.generated">Report Generated On </span> <span data-i18n="date" data-timestamp="${currentReport.data[currentReport.dateField]}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"  class="report-generated"></span></p>` : '';

        template += `<p class="messagesHeaderFont">
                ${reportTitle}
            </p>
            ${reportTime}`;
    }
    let monthDateOptions = {  month: '2-digit' };
    let yearDateOptions = { year: 'numeric' };
    let aerobicImage;
    let aerobicTitle;
    let aerobicBody;
    switch (parseInt(currentReport.data['d_449038410'], 10)) {
        case 104593854:
            aerobicImage = './reports/physicalActivity/report-dial-low.svg';
            aerobicTitle = "physicalActivityNotMeetingTitle";
            aerobicBody = 'physicalActivityNotMeeting';
            break;
        case 682636404:
            aerobicImage = './reports/physicalActivity/report-dial-med.svg';
            aerobicTitle = "physicalActivityMeetingTitle";
            aerobicBody = 'physicalActivityMeeting';
            break;
        case 948593796:
            aerobicImage = './reports/physicalActivity/report-dial-high.svg';
            aerobicTitle = "physicalActivityExceedingTitle";
            aerobicBody = 'physicalActivityExceeding';
            break;
    }
    let muscleImage;
    let muscleTitle;
    let muscleBody;
    switch (parseInt(currentReport.data['d_205380968'], 10)) {
        case fieldMapping.yes:
            muscleImage = './reports/physicalActivity/smile.svg';
            muscleTitle = "physicalActivityMuscleYesTitle";
            muscleBody = 'physicalActivityMuscleYes';
            break;
        case fieldMapping.no:
            muscleImage = './reports/physicalActivity/flat.svg';
            muscleTitle = "physicalActivityMuscleNoTitle";
            muscleBody = 'physicalActivityMuscleNo';
            break;
    }
    template += `<p><span data-i18n="reports.physicalActivityIntroStart"></span> <span data-i18n="date" data-timestamp="${currentReport.surveyDate}" data-date-options="${encodeURIComponent(JSON.stringify(monthDateOptions))}"></span><span data-i18n="reports.physicalActivityIntroOf"></span><span data-i18n="date" data-timestamp="${currentReport.surveyDate}" data-date-options="${encodeURIComponent(JSON.stringify(yearDateOptions))}"></span><span data-i18n="reports.physicalActivityIntroEnd"></span></p>
        <p><button id="physicalActivityDownloadReport" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.downloadReport">Download a PDF of my report</button></p>
        <div style="flex-direction: column; justify-content: flex-start; align-items: flex-start; display: inline-flex">
            <div
                style="align-self: stretch; height: 3700px; padding: 32px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 36px; display: flex">
                <div
                    style="align-self: stretch; height: 315px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 24px; display: flex">
                    <div data-i18n="reports.physicalActivityDefinition" 
                        style="align-self: stretch; color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                        Physical activity includes the ways people move their bodies and use energy. Two broad
                        categories are important for health: aerobic activity (such as brisk walking or dancing), and
                        muscle strengthening activity (such as lifting weights or using resistance bands).</div>
                    <div
                        style="align-self: stretch; padding-top: 24px; padding-bottom: 24px; padding-left: 32px; padding-right: 24px; background: #E9F6F8; border-radius: 3px; border-left: 8px #2973A5 solid; justify-content: flex-start; align-items: flex-start; gap: 24px; display: inline-flex">
                        <div style="width: 24px; height: 24px; position: relative">
                            <div style="width: 23.56px; height: 23.56px; left: 0px; top: 0.44px; position: absolute">
                                <div style="width: 23.56px; height: 23.56px; left: 0px; top: 0px; position: absolute">

                                    <div
                                        style="width: 23.56px;height: 23.56px;left: 0px;top: 0px;position: absolute;background: #2973A5;border-radius: 12px;">
                                    </div>
                                </div>
                                <div
                                    style="width: 3.27px;height: 13.09px;left: 9.82px;top: 3.02px;position: absolute;color: white;font-weight: bold">
                                    i</div>
                            </div>
                        </div>
                        <div data-i18n="reports.physicalActivityGuidelines" 
                            style="flex: 1 1 0; color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                            The national guidelines recommend that adults get at least 150 minutes per week of
                            moderate-intensity aerobic activity, and at least 2 days per week of muscle strengthening
                            activity.</div>
                    </div>
                </div>
                <div
                    style="align-self: stretch; justify-content: flex-start; align-items: flex-start; gap: 36px; display: inline-flex">
                    <div
                        style="flex: 1 1 0; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 36px; display: inline-flex">
                        <div
                            style="align-self: stretch; height: 284.90px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                            <div
                                style="width: 364px; color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                                Your aerobic activity</div>
                            <div
                                style="height: 249.90px; padding: 24px; background: #164C71; border-radius: 3px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 18px; display: flex">
                                <div
                                    style="align-self: stretch; height: 141px; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; display: flex">
                                    <div
                                        style="height: 43px;line-height: 50px;background-image: url('${aerobicImage}');background-repeat: no-repeat;color: white;font-size: 18px;font-family: Montserrat;font-weight: 700;word-wrap: break-word;padding-left: 100px;">
                                        <span data-i18n="reports.${aerobicTitle}">Achieving</span></div>
                                    <div
                                        style="align-self: stretch; color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        <span data-i18n="reports.${aerobicBody}">Congratulations, you're engaging in the recommended amount of weekly aerobic
                                        physical activity based on national guidelines. Keep it up!</span></div>
                                </div>
                            </div>
                        </div>
                        <div
                            style="align-self: stretch; height: 311.90px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                            <div
                                style="width: 364px; color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                                Your muscle strengthening activity</div>
                            <div
                                style="align-self: stretch; height: 276.90px; padding: 24px; background: #164C71; border-radius: 3px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 18px; display: flex">
                                <div
                                    style="align-self: stretch; height: 168px; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; display: flex">
                                    <div
                                        style="height: 43px;line-height: 50px;background-image: url('${muscleImage}');background-repeat: no-repeat;color: white;font-size: 18px;font-family: Montserrat;font-weight: 700;word-wrap: break-word;padding-left: 60px;">
                                        <span data-i18n="reports.${muscleTitle}">Performing</span> </div>
                                    <div
                                        style="align-self: stretch; color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        <span data-i18n="reports.${muscleBody}">Keep up the great work! You're engaging in muscle strengthening activity.
                                        National guidelines suggest doing muscle strengthening activities 2 or more days
                                        per week.</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        style="width: 198px; padding: 24px; border-radius: 3px; border: 1px #A9AEB1 solid; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: inline-flex">
                        <div
                            style="align-self: stretch; color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                            How did we calculate your activity?</div>
                        <div
                            style="align-self: stretch; color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">
                            We added up the time per week you reported doing different exercise and recreational
                            activities and calculated the average number of minutes of aerobic activity per week you
                            engaged in. We also looked at your answers to questions about doing muscle strengthening
                            activities, like weight training.</div>
                    </div>
                </div>
                <div style="width: 598px; height: 0px; border: 1px #A9AEB1 solid"></div>
                <div
                    style="align-self: stretch; height: 1545px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 24px; display: flex">
                    <div
                        style="align-self: stretch; height: 100px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                        <div
                            style="width: 598px; color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                            Key guidelines for adults</div>
                        <div
                            style="align-self: stretch; color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                            The national physical activity guidelines were developed by experts based on more than 60
                            years of research showing how physical activity affects our health.</div>
                    </div>
                    <div style="justify-content: flex-start; align-items: flex-start; gap: 24px; display: inline-flex">
                        <div
                            style="width: 376px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: inline-flex">
                            <div
                                style="align-self: stretch; color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                                Adults need a mix of activity to be healthy</div>
                            <div style="align-self: stretch">
                                <ul>
                                    <li
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        Aim for at least 150 minutes a week of moderate-intensity aerobic activity
                                        (anything that gets your heart beating faster counts!). Try to spread aerobic
                                        activity throughout the week. If you prefer vigorous-intensity aerobic activity
                                        (like running), aim for at least 75 minutes a week.</li>
                                    <li
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        Aim for at least 2 days a week of muscle-strengthening activity (activities that
                                        make your muscles work harder than usual). For the most health benefits, do
                                        strengthening activities that involve all major muscle groups.</li>
                                </ul>
                            </div>
                        </div>
                        <div
                            style="padding: 24px; background: #FDBE19; border-radius: 3px; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                            <div style="width: 150px"><span
                                    style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 700; line-height: 20px; word-wrap: break-word">What
                                    counts as “moderate” and “vigorous” aerobic activity? </span><span
                                    style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">Use
                                    the talk test to find out. When you’re doing an activity, try
                                    talking:<br /></span>
                                <ul>
                                    <li
                                        style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">
                                        Breathing
                                        hard but still able to have a conversation easily? That’s moderate-intensity
                                        activity.
                                    </li>
                                    <li
                                        style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">
                                        Only able to say a few words before having to take a breath? That’s
                                        vigorous-intensity activity. </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div
                        style="align-self: stretch; padding-top: 24px; padding-bottom: 24px; padding-left: 32px; padding-right: 24px; background: #E9F6F8; border-radius: 3px; border-left: 8px #2973A5 solid; justify-content: flex-start; align-items: flex-start; gap: 24px; display: inline-flex">
                        <div style="width: 24px; height: 24px; position: relative">
                            <div style="width: 23.56px; height: 23.56px; left: 0px; top: 0.44px; position: absolute">
                                <div style="width: 23.56px; height: 23.56px; left: 0px; top: 0px; position: absolute">

                                    <div
                                        style="width: 23.56px;height: 23.56px;left: 0px;top: 0px;position: absolute;background: #2973A5;border-radius: 12px;">
                                    </div>
                                </div>
                                <div
                                    style="width: 3.27px;height: 13.09px;left: 9.82px;top: 3.02px;position: absolute;color: white;font-weight: bold">
                                    i</div>
                            </div>
                        </div>
                        <div style="flex: 1 1 0"><span
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">The
                                activity guidelines are for most adults. In general, healthy people who slowly increase
                                their weekly physical activity don’t need to consult their health care provider before
                                engaging in activity.
                                <br /><br /></span><span
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 700; line-height: 20px; word-wrap: break-word">There
                                are key considerations for certain people, including people with chronic conditions,
                                people with disabilities, people who are pregnant or postpartum, and adults over
                                65</span><span
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">.
                                It’s important for these groups of people to talk to a health care provider before
                                continuing or starting a new exercise program. For more information, please visit
                            </span><a
                                href="https://odphp.health.gov/sites/default/files/2019-10/PAG_ExecutiveSummary.pdf"
                                style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word">this
                                page</a><span
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">.
                                <br /><br />Adults over 65 need the same amount of physical activity as all adults —but
                                if meeting the guidelines is tough, do what you can! Adults over 65 should aim to mix in
                                activities that improve balance and lower risk of falls. For example, <a
                                    href="https://www.nccih.nih.gov/health/tai-chi-what-you-need-to-know"
                                    style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word">tai
                                    chi</a> or
                                swimming.

                            </span></div>
                    </div>
                    <div
                        style="flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                        <div
                            style="width: 598px; color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                            Tips for maintaining or improving your activity</div>
                        <div style="width: 598px">
                            <ol>
                                <li
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    Break up activity over the week. Switch things up and get creative! There’s no wrong
                                    way to get in your aerobic and muscle strengthening activity.
                                </li>
                                <li
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    It all adds up. If you don’t meet the guidelines for activity this week, don’t sweat
                                    it. Even a little bit of activity can have health benefits.
                                </li>
                                <li
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    Try adding more movement into your day, like going for a short walk during a lunch
                                    break, taking the stairs to your office, or sneaking in some muscle strengthening
                                    exercises during commercial breaks. Check out some tips for fitting more activity
                                    into your day: <a href="https://youtu.be/61p1OIO20wk"
                                        style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word">
                                        [YouTube – 1:59]</a><span
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">.
                                    </span></li>
                                <li
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    You can find the right activity for you! The key is to make activity fun and
                                    sustainable so you can continue being active over the long term. Use tips like these
                                    for getting motivated:
                                    <a href="https://youtu.be/0i1lCNHaxhs"
                                        style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word">[YouTube
                                        – 2:04]</a>
                                <li
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    Use the handy
                                    </span><a href="https://odphp.health.gov/moveyourway/activity-planner"
                                        style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word">activity
                                        planner</a><span
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        to create a plan that works for you. Choose the types of activity that are right
                                        for your current fitness level and health goals. If you have questions, talk
                                        with your health care provider.</span>
                                </li>
                            </ol>
                            <span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word"><br />Visit
                            </span>
                            <a style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word"
                                href="https://health.gov/moveyourway">https://health.gov/moveyourway</a><span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                for more tools, tips, and resources.</span>
                        </div>
                    </div>
                </div>
                <div
                    style="flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                    <div
                        style="width: 598px; color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                        Studied benefits of physical activity:</div>
                    <div style="width: 598px"><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">Long
                            term</span><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">:
                            Helps prevent <a
                                href="https://www.cancer.gov/about-cancer/causes-prevention/risk/obesity/physical-activity-fact-sheet"
                                style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word">certain
                                cancers</a>; reduces risk of dementia, heart disease, and type 2 diabetes;
                            improves bone health; and helps ease anxiety and depression.<br /><br /></span><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">Short
                            term:</span><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                            Reduces stress, lowers blood pressure, sharpens focus, improves sleep, and boosts
                            mood.</span></div>
                </div>
                <div style="width: 598px; height: 0px; border: 1px #A9AEB1 solid"></div>
                <div
                    style="align-self: stretch; height: 351px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 24px; display: flex">
                    <div
                        style="align-self: stretch; height: 247px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                        <div
                            style="width: 598px; color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                            National Data: How many adults are meeting the physical activity guidelines?</div>
                        <div style="width: 598px"><span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">A
                                recent nationwide survey found that about </span><span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">39%
                                of adults in the U.S.</span><span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                reported engaging in recommended amounts of aerobic physical activity through leisure
                                activities, such as sports, fitness, or recreational activities.¹<br /><br />
                            </span><span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">31%</span><span
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                of adults met the guidelines for muscle strengthening activity, with or without meeting
                                the aerobic activity guidelines.²</span></div>
                    </div>
                    <div style="align-self: stretch"><span
                            style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">1.
                            National
                            Center for Health Statistics. National health and nutrition examination survey. 2020;
                        </span><a
                            style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word"
                            href="https://www.cdc.gov/nchs/nhanes/index.htm">https://www.cdc.gov/nchs/nhanes/index.htm</a><span
                            style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">.<br />2.
                            National
                            Center for Health Statistics, National Health Interview Survey, 2020; </span><a
                            style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word"
                            href="https://www.cdc.gov/nchs/nhis/documentation/2020-nhis.html">https://www.cdc.gov/nchs/nhis/documentation/2020-nhis.html</a><span
                            style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">.</span>
                    </div>
                </div>
                <div
                    style="width: 598px; padding: 24px; background: #164C71; border-radius: 3px; justify-content: flex-start; align-items: flex-start; gap: 18px; display: inline-flex">
                    <div
                        style="flex: 1 1 0; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; display: inline-flex">
                        <div
                            style="align-self: stretch; color: white; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                            Get in touch</div>
                        <div style="align-self: stretch"><span
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">Thanks
                                for reading! We hope you're inspired to move for your health.<br /><br />Questions about
                                your report or the resources we shared? Reach out to the </span><span
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">Connect
                                Support Center</span><span
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                at </span><a
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word"
                                href="https://MyConnect.cancer.gov/support">MyConnect.cancer.gov/support</a><span
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">.<br /><br />Questions
                                about your current health or about changing your physical activity plan? Reach out to
                                your health care provider.</span></div>
                    </div>
                </div>
            </div>
        </div>`;
    template += `</div>
    </div>
    </div>`
    return template;
}

const renderPhysicalActivityReportPDF = async () => {

    let currentReport = reports['Physical Activity Report'];
    let aerobicImage;
    let aerobicTitle;
    let aerobicBody;
    switch (parseInt(currentReport.data['d_449038410'], 10)) {
        case 104593854:
            aerobicImage = './reports/physicalActivity/report-dial-low.png';
            aerobicTitle = "physicalActivityNotMeetingTitle";
            aerobicBody = 'physicalActivityNotMeeting';
            break;
        case 682636404:
            aerobicImage = './reports/physicalActivity/report-dial-med.png';
            aerobicTitle = "physicalActivityMeetingTitle";
            aerobicBody = 'physicalActivityMeeting';
            break;
        case 948593796:
            aerobicImage = './reports/physicalActivity/report-dial-high.png';
            aerobicTitle = "physicalActivityExceedingTitle";
            aerobicBody = 'physicalActivityExceeding';
            break;
    }
    let muscleImage;
    let muscleTitle;
    let muscleBody;
    switch (parseInt(currentReport.data['d_205380968'], 10)) {
        case fieldMapping.yes:
            muscleImage = './reports/physicalActivity/smile.png';
            muscleTitle = "physicalActivityMuscleYesTitle";
            muscleBody = 'physicalActivityMuscleYes';
            break;
        case fieldMapping.no:
            muscleImage = './reports/physicalActivity/flat.png';
            muscleTitle = "physicalActivityMuscleNoTitle";
            muscleBody = 'physicalActivityMuscleNo';
            break;
    }

    const pdfLocation = './reports/physicalActivity/report_en.pdf';
    const existingPdfBytes = await fetch(pdfLocation).then(res => res.arrayBuffer());
    const pngAerobicImageBytes = await fetch(aerobicImage).then((res) => res.arrayBuffer());
    const pngMuscleImageBytes = await fetch(muscleImage).then((res) => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pngAerobicImage = await pdfDoc.embedPng(pngAerobicImageBytes);
    const pngMuscleImage = await pdfDoc.embedPng(pngMuscleImageBytes);
    const helveticaFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const editPage = pdfDoc.getPages().at(0);

    editPage.drawImage(pngAerobicImage, {
                x: 50,
                y: 415,
                width: 83,
                height: 43,
      });
    editPage.drawImage(pngMuscleImage, {
                x: 55,
                y: 175,
                width: 43,
                height: 43,
      });
    editPage.drawText(replaceUnsupportedCharacters(translateText(['reports', aerobicTitle]), helveticaFontBold), {
        x: 150,
        y: 425,
        size: 15,
        font: helveticaFontBold,
        color: rgb(1,1,1)
      });
    editPage.drawText(replaceUnsupportedCharacters(translateText(['reports', aerobicBody]), helveticaFont), {
        x: 50,
        y: 390,
        size: 12,
        font: helveticaFont,
        color: rgb(1,1,1),
        maxWidth: 320,
        lineHeight: 15
      });
    editPage.drawText(replaceUnsupportedCharacters(translateText(['reports', muscleTitle]), helveticaFontBold), {
        x: 115,
        y: 185,
        size: 15,
        font: helveticaFontBold,
        color: rgb(1,1,1)
      });
    editPage.drawText(replaceUnsupportedCharacters(translateText(['reports', muscleBody]), helveticaFont), {
        x: 50,
        y: 150,
        size: 12,
        font: helveticaFont,
        color: rgb(1,1,1),
        maxWidth: 315,
        lineHeight: 15
      });
      if (currentReport.dateField &&  currentReport.data[currentReport.dateField]) {
          let reportTime =  currentReport.data[currentReport.dateField];
          let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
          editPage.drawText(replaceUnsupportedCharacters(translateDate(reportTime, null, dateOptions), helveticaFont), {
            x: 107,
            y: 725,
            size: 9,
            font: helveticaFont,
            color: rgb(0.18,0.18,0.18),
            maxWidth: 315,
            lineHeight: 15
          });
      }
    
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, 'Physical_Activity_Report.pdf', "application/pdf");
}

/* Checks for each code point whether the given font supports it.
   If not, tries to remove diacritics from said code point.
   If that doesn't work either, replaces the unsupported character with '?'. */
function replaceUnsupportedCharacters(string, font) {
    const charSet = font.getCharacterSet()
    const codePoints = []
    for (const codePointStr of string) {
        const codePoint = codePointStr.codePointAt(0);
        if (!charSet.includes(codePoint)) {
            const withoutDiacriticsStr = codePointStr.normalize('NFD').replace(/\p{Diacritic}/gu, '');
            const withoutDiacritics = withoutDiacriticsStr.charCodeAt(0);
            if (charSet.includes(withoutDiacritics)) {
                codePoints.push(withoutDiacritics);
            } else {
                codePoints.push('?'.codePointAt(0));
            }
        } else {
            codePoints.push(codePoint)
        }
    }
    return String.fromCodePoint(...codePoints);
}

/**
 * Renders the decline modal
 * 
 * @returns string
 */
const renderDeclineModal = () => {
    return  translateHTML(`
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body">
                    <p data-i18n="reports.declineModalBody">We understand you don’t want to see this report right now. The report will be saved in the “Declined” tab on this page so you can choose to revisit it later if you change your mind.</p>
                    <button class="btn btn-primary save-data consentNextButton px-3"
                        id="reportDecline" data-i18n="questionnaire.okButton">
                        Ok
                    </button>
                </div>
            </div>
        </div>
    `);
}

/**
 * Renders the decline modal
 * 
 * @returns string
 */
const renderReinstateModal = () => {
    return  translateHTML(`
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body">
                    <p data-i18n="reports.reinstateModalBody">Are you sure you want to view this report again? It will move to the Viewed tab so you can see it again.</p>
                    <button class="btn btn-primary save-data consentNextButton px-3"
                        id="reportReinstate" data-i18n="questionnaire.okButton">
                        Ok
                    </button>
                </div>
            </div>
        </div>
    `);
}