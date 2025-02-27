import { reportConfiguration, setReportAttributes, populateReportData, showAnimation, hideAnimation, translateHTML, translateText, getMyData, storeResponse } from "../shared.js";
import fieldMapping from "../fieldToConceptIdMapping.js";
import { renderPhysicalActivityReport, renderPhysicalActivityReportPDF} from '../../reports/physicalActivity/physicalActivity.js';

let reports = reportConfiguration();
let myData;

export const renderReportsPage = async () => {
    document.title = translateText('reports.pageTitle');
    showAnimation();
    myData = await getMyData();
    myData = myData.data || myData;

    reports = await setReportAttributes(myData, reports);
    reports = await populateReportData(reports);

    let template = `
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
        if (myData[fieldMapping.consentWithdrawn] && myData[fieldMapping.consentWithdrawn] === fieldMapping.yes) {
            template += '<div data-i18n="reports.withdrawn"></div>';
        } else {
            template += '<div data-i18n="reports.empty"></div>';
        }
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
            let reportTitle = '<span data-i18n="reports.' + currentReport.reportId + 'Title">' + translateText('reports.' + currentReport.reportId + 'Title') + '</span>';
            let reportDescription = '<div id="' + currentReport.reportId + 'Description" data-i18n="reports.' + currentReport.reportId + 'Description"' + (tab !== 'Unread' ? ' style="display: none"' : '') + '>' + translateText('reports.' + currentReport.reportId + 'Description') + '</div>';
            let reportTime = currentReport.dateField && currentReport.data[currentReport.dateField] ? `<p class="report-generated"><span data-i18n="reports.generated">Report Generated On </span> <span data-i18n="date" data-timestamp="${currentReport.data[currentReport.dateField]}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"  class="report-generated"></span></p>` : '';
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
                    buttons = `<button id="${currentReport.reportId}ReinstateReport" style="display: none"  class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>`;
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
                modalContainer.id = 'declineModal';
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
                        [fieldMapping.reports.physicalActivity.status]: fieldMapping.reports.declined
                    }
                };
                if (!myData[fieldMapping.reports.physicalActivityReport] || (myData[fieldMapping.reports.physicalActivityReport] && !myData[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.declinedTS])) {
                    obj[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.declinedTS] = currentTime.toISOString();
                }
                await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? { [fieldMapping.reports.physicalActivityReport]: Object.assign({}, myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport]) } : obj);
                window.location.reload();
            });
            const softModal = new bootstrap.Modal(document.getElementById('declineModal'));
            softModal.show();
        });
    }
    if (viewButton) {
        viewButton.addEventListener('click', async () => {
            document.getElementById('physicalActivityContainer').innerHTML = translateHTML(renderPhysicalActivityReport(reports, true));
            document.getElementById('physicalActivityDownloadReport').addEventListener('click', async () => {
                renderPhysicalActivityReportPDF(reports);
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
                modalContainer.id = 'reinstateModal';
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
                if (!myData[fieldMapping.reports.physicalActivityReport] || (myData[fieldMapping.reports.physicalActivityReport] && !myData[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.viewedTS])) {
                    obj[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.viewedTS] = currentTime.toISOString();
                }
                await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? { [fieldMapping.reports.physicalActivityReport]: Object.assign({}, myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport]) } : obj);
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
            modalContainer.id = 'declineModal';
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
            await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? { [fieldMapping.reports.physicalActivityReport]: Object.assign({}, myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport]) } : obj);
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
        await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? { [fieldMapping.reports.physicalActivityReport]: Object.assign({}, myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport]) } : obj);
        document.getElementById('physicalActivityContainer').innerHTML = translateHTML(renderPhysicalActivityReport(reports, true));
        document.getElementById('physicalActivityDownloadReport').addEventListener('click', async () => {
            renderPhysicalActivityReportPDF(reports);
        });
    });
}

/**
 * Renders the decline modal
 * 
 * @returns string
 */
const renderDeclineModal = () => {
    return translateHTML(`
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
    return translateHTML(`
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