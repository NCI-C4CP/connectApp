import { reportConfiguration, retrieveDHQHEIReport, setReportAttributes, populateReportData, populateDHQHEIReportData, showAnimation, getNestedProperty, hideAnimation, translateHTML, translateText, getMyData, storeResponse, translateDate, updateDHQReportViewedStatus } from "../shared.js";
import fieldMapping from "../fieldToConceptIdMapping.js";
import { renderPhysicalActivityReport, renderPhysicalActivityReportPDF} from '../../reports/physicalActivity/physicalActivity.js';
const { PDFDocument, StandardFonts, rgb } = PDFLib;

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

    if (unread.length > 1) unread = sortReportsByAvailableDate(unread);
    if (read.length > 1) read = sortReportsByAvailableDate(read);
    if (declined.length > 1) declined = sortReportsByAvailableDate(declined);

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
            let reportTime = currentReport?.dateField && currentReport.data?.[currentReport.dateField] ? `<p class="report-generated"><span data-i18n="reports.generated">Report Generated On </span> <span data-i18n="date" data-timestamp="${currentReport.data[currentReport.dateField]}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"  class="report-generated"></span></p>` : '';
            let buttons = generateReportButtons(currentReport, tab);
            let collapser;
            if (tab === 'Read' || tab === 'Declined') {
                collapser = `<p><a href="#reports" id="${currentReport.reportId}Collapser" data-i18n="reports.collapserClosed"></a></p>`;
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

/**
 * Sorts the reports by their available date in descending order (most recent first).
 * @param {Array} reports - Array of report objects
 * @returns {Array} - Sorted array of report objects
 */

const sortReportsByAvailableDate = (reports) => {
    return reports.sort((a, b) => {

        // Get the date available field name/path from report config
        const dateA = getNestedProperty(a, a.dateAvailableField) || '';
        const dateB = getNestedProperty(b, b.dateAvailableField) || '';

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; 
        if (!dateB) return -1;

        return dateB.localeCompare(dateA);
    });
};

const generateReportButtons = (currentReport, tab) => {
    const reportId = currentReport.reportId;

    // Physical Activity Report ('Unread' routes to Informed Consent)
    if (reportId === 'physicalActivity') {
        switch (tab) {
            case 'Unread':
                return `<button id="${reportId}LearnMore" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.learnMore">Learn More</button>`;
            case 'Read':
                return `<button id="${reportId}ViewReport" style="display: none" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>
                        <button id="${reportId}DeclineReport" style="display: none" class="btn btn-primary save-data consentPrevButton px-3" data-i18n="reports.declineReport">Decline for now</button>`;
            case 'Declined':
                return `<button id="${reportId}ReinstateReport" style="display: none" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>`;
        }
    }

    // DHQ HEI Report ('Unread' routes to View/Decline buttons)
    if (reportId === 'dhqHEI') {
        switch (tab) {
            case 'Unread':
                return `<button id="${reportId}ViewReport" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>
                        <button id="${reportId}DeclineReport" class="btn btn-primary save-data consentPrevButton px-3" data-i18n="reports.declineReport">Decline for now</button>`;
            case 'Read':
                return `<button id="${reportId}ViewReport" style="display: none" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>
                        <button id="${reportId}DeclineReport" style="display: none" class="btn btn-primary save-data consentPrevButton px-3" data-i18n="reports.declineReport">Decline for now</button>`;
            case 'Declined':
                return `<button id="${reportId}ReinstateReport" style="display: none" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.viewReport">View my report</button>`;
        }
    }

    return '';
};

const initializeUnreadButtons = () => {
    // Physical Activity Report - Learn More button (Informed Consent)
    let physActLearn = document.getElementById('physicalActivityLearnMore');
    if (physActLearn) {
        physActLearn.addEventListener('click', () => {
            document.getElementById('physicalActivityContainer').innerHTML = translateHTML(renderPhysicalActivityInformedConsent());
            initializePhysicalActivityInformedConsent();
        });
    }

    // DHQ HEI Report - View button
    let dhqHEIView = document.getElementById('dhqHEIViewReport');
    if (dhqHEIView) {
        dhqHEIView.addEventListener('click', async () => {
            await handleDHQHEIViewReport();
        });
    }

    // DHQ HEI Report - Decline button
    let dhqHEIDecline = document.getElementById('dhqHEIDeclineReport');
    if (dhqHEIDecline) {
        dhqHEIDecline.addEventListener('click', () => {
            handleDHQHEIDeclineReport();
        });
    }
}

const initializeReadButtons = () => {
    let physActExpand = document.getElementById('physicalActivityCollapser');
    let declineButton = document.getElementById('physicalActivityDeclineReport');
    let viewButton = document.getElementById('physicalActivityViewReport');
    if (physActExpand) {
        handleReportCollapser('physicalActivity', ['physicalActivityViewReport', 'physicalActivityDeclineReport']);
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
                if (!myData[fieldMapping.reports.physicalActivityReport] || !myData[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.declinedTS]) {
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

    const dhqHEIExpand = document.getElementById('dhqHEICollapser');
    const dhqHEIViewButton = document.getElementById('dhqHEIViewReport');
    const dhqHEIDeclineButton = document.getElementById('dhqHEIDeclineReport');

    if (dhqHEIExpand) {
        handleReportCollapser('dhqHEI', ['dhqHEIViewReport', 'dhqHEIDeclineReport']);
    }

    if (dhqHEIViewButton) {
        dhqHEIViewButton.addEventListener('click', async () => {
            await handleDHQHEIViewReport();
        });
    }

    if (dhqHEIDeclineButton) {
        dhqHEIDeclineButton.addEventListener('click', () => {
            handleDHQHEIDeclineReport();
        });
    }
}

const initializeDeclinedButtons = () => {
    let physActExpand = document.getElementById('physicalActivityCollapser');
    let restoreButton = document.getElementById('physicalActivityReinstateReport');
    if (physActExpand) {
        handleReportCollapser('physicalActivity', ['physicalActivityReinstateReport']);
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
                if (!myData[fieldMapping.reports.physicalActivityReport] || !myData[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.viewedTS]) {
                    obj[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.viewedTS] = currentTime.toISOString();
                }
                await storeResponse(myData[fieldMapping.reports.physicalActivityReport] ? { [fieldMapping.reports.physicalActivityReport]: Object.assign({}, myData[fieldMapping.reports.physicalActivityReport], obj[fieldMapping.reports.physicalActivityReport]) } : obj);
                window.location.reload();
            });
            const softModal = new bootstrap.Modal(document.getElementById('reinstateModal'));
            softModal.show();
        });
    }

    const dhqHEIExpand = document.getElementById('dhqHEICollapser');
    const dhqHEIRestoreButton = document.getElementById('dhqHEIReinstateReport');

    if (dhqHEIExpand) {
        handleReportCollapser('dhqHEI', ['dhqHEIReinstateReport']);
    }

    if (dhqHEIRestoreButton) {
        dhqHEIRestoreButton.addEventListener('click', () => {
            handleDHQHEIReinstateReport();
        });
    }
}

const handleReportCollapser = (reportId, buttons = []) => {
    const collapser = document.getElementById(`${reportId}Collapser`);
    const description = document.getElementById(`${reportId}Description`);

    if (!collapser || !description) {
        console.warn(`Collapser elements not found for report: ${reportId}`);
        return;
    }

    collapser.addEventListener('click', (event) => {
        event.preventDefault();
        const isCurrentlyClosed = collapser.dataset.i18n === 'reports.collapserClosed';

        if (isCurrentlyClosed) {
            // Expand report
            collapser.setAttribute('data-i18n', 'reports.collapserOpen');
            translateHTML(collapser);
            description.style.display = 'block';

            // Show buttons
            buttons.forEach(buttonId => {
                const button = document.getElementById(buttonId);
                if (button) {
                    button.style.display = 'inline-block';
                }
            });
        } else {
            // Collapse report
            collapser.setAttribute('data-i18n', 'reports.collapserClosed');
            translateHTML(collapser);
            description.style.display = 'none';

            // Hide buttons
            buttons.forEach(buttonId => {
                const button = document.getElementById(buttonId);
                if (button) {
                    button.style.display = 'none';
                }
            });
        }
    });
};

const handleDHQHEIViewReport = async () => {
    try {
        showAnimation();

        const dhqData = {
            'studyID': myData[fieldMapping.DHQ3.studyID],
            'username': myData[fieldMapping.DHQ3.username],
        };

        // Fetch and render
        reports = await populateDHQHEIReportData(reports, dhqData);
        document.getElementById('dhqHEIContainer').innerHTML = translateHTML(await renderDHQHEIReport(reports));

        // Initialize download button
        const downloadButton = document.getElementById('dhqHEIDownloadReport');
        if (downloadButton) {
            downloadButton.addEventListener('click', async () => {
                await renderDHQHEIReportPDF(reports);
            });
        }

        // Update viewed status
        if (myData[fieldMapping.reports.dhq3.reportStatusInternal] !== fieldMapping.reports.viewed) {
            await updateDHQReportViewedStatus(myData[fieldMapping.DHQ3.studyID], myData[fieldMapping.DHQ3.username], false);
        }

    } catch (error) {
        console.error('Error in DHQ HEI View Report handler:', error);
        displayReportError('dhqHEI');

    } finally {
        hideAnimation();
    }
};

const handleDHQHEIDeclineReport = () => {
    let modalContainer = document.getElementById('declineModal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'declineModal';
        modalContainer.classList.add("modal");
        modalContainer.classList.add("fade");
        document.getElementById('root').parentNode.appendChild(modalContainer);
    }
    modalContainer.innerHTML = translateHTML(renderDeclineModal());
    const okButton = document.getElementById('reportDecline');
    okButton.addEventListener('click', async () => {
        try {
            showAnimation();
            await updateDHQReportViewedStatus(myData[fieldMapping.DHQ3.studyID], myData[fieldMapping.DHQ3.username], true);

        } catch (error) {
            console.error('Error updating DHQ report viewed status:', error);
            displayReportError('dhqHEI');

        } finally {
            hideAnimation();
        }
        
        window.location.reload();
    });
    const softModal = new bootstrap.Modal(document.getElementById('declineModal'));
    softModal.show();
};

const handleDHQHEIReinstateReport = () => {
    let modalContainer = document.getElementById('reinstateModal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'reinstateModal';
        modalContainer.classList.add("modal");
        modalContainer.classList.add("fade");
        document.getElementById('root').parentNode.appendChild(modalContainer);
    }
    modalContainer.innerHTML = translateHTML(renderReinstateModal());
    const okButton = document.getElementById('reportReinstate');
    okButton.addEventListener('click', async () => {
        try {
            showAnimation();
            await updateDHQReportViewedStatus(myData[fieldMapping.DHQ3.studyID], myData[fieldMapping.DHQ3.username], false);

        } catch (error) {
            console.error('Error updating DHQ report viewed status:', error);
            displayReportError('dhqHEI');

        } finally {
            hideAnimation();
        }

        window.location.reload();
    });
    const softModal = new bootstrap.Modal(document.getElementById('reinstateModal'));
    softModal.show();
};

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

const renderDHQHEIReport = async (reports) => {
    const report = reports['DHQ HEI Report'];

    let template = `<div>
                    <div class="row" style="max-width: 1200px">
                        <div class="col-md-12">`;
    
    const reportTitle = '<span data-i18n="reports.' + report.reportId + 'ResultsTitle">' + translateText('reports.' + report.reportId + 'Title') + '</span>';
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const reportTime = report.dateField && report.data[report.dateField]
        ? `<p class="report-generated"><span data-i18n="reports.generated">Report generated </span><span data-i18n="date" data-timestamp="${report.data[report.dateField]}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}" class="report-generated"></span></p>`
        : '';

    template += `<p class="messagesHeaderFont">
            ${reportTitle}
        </p>
        ${reportTime}`;

    if (report.data?.pdfData) {

        // Convert base64 to blob for iframe display
        const binaryString = atob(report.data.pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = await generateDHQHEIPDF(report.data[report.dateField], report.data.pdfData);
        let pdfUrl = URL.createObjectURL(blob);
        pdfUrl = `${pdfUrl}#toolbar=0&navpanes=0`;
        template += renderDHQHEIReportContainer(pdfUrl);
    }

    template += `</div></div></div>`;
    return template;
};

const generateDHQHEIPDF = async (dhqCompletedDate, reportData) => {
    const binaryString = atob(reportData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const pdfDoc = await PDFDocument.load(bytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const dateString = translateDate(dhqCompletedDate, null, dateOptions);
    const fontSize = 16;

    const textWidth = helveticaFont.widthOfTextAtSize(dateString, fontSize);
    const x = (width - textWidth) / 2;  // Horizontally center the text
    const y = height - 245;             // Under the 'Healthy Eating Index' title

    firstPage.drawText(dateString, {
        x: x,
        y: y,
        font: helveticaFont,
        size: fontSize,
    });

    const pdfBytes = await pdfDoc.save();

    return new Blob([pdfBytes], { type: 'application/pdf' });
}

const renderDHQHEIReportPDF = async (reportData) => {
    try {
        showAnimation();
        const report = reportData['DHQ HEI Report'];
        if (!report || !report.data || !report.data.pdfData) {
            console.error('DHQ HEI Report data is missing or incomplete');
            return;
        }

        const blob = await generateDHQHEIPDF(report.data[report.dateField], report.data.pdfData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Add current date to filename
        const currentDate = new Date().toISOString().split('T')[0];
        const baseFilename = report.data.filename || 'dhq_hei_report.pdf';
        const nameWithoutExt = baseFilename.replace('.pdf', '');
        a.download = `${nameWithoutExt}_${currentDate}.pdf`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error generating DHQ HEI Report PDF:', error);
        displayReportError('dhqHEI');

    } finally {
        hideAnimation();
    }
};

const displayReportError = (reportID) => {
    const reportContainer = document.getElementById(`${reportID}Container`);
    if (reportContainer) {
        reportContainer.innerHTML = translateHTML(`
            <div role="alert" aria-live="assertive" style="margin-top:25px">
                <h2 class="visually-hidden">Error Message. Something went wrong. Please try again. Contact the Connect Support Center at 1-877-505-0253 if you continue to experience this problem.</h2>
                <p data-i18n="questionnaire.somethingWrong">Something went wrong. Please try again. Contact the 
                    <a href="https://norcfedramp.servicenowservices.com/participant" target="_blank" rel="noopener noreferrer">Connect Support Center</a> 
                    if you continue to experience this problem.
                </p>
            </div>
        `);
    }
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

const renderDHQHEIReportContainer = (pdfUrl) => {
    return translateHTML(`
        <p><button id="dhqHEIDownloadReport" class="btn btn-primary save-data consentNextButton px-3" data-i18n="reports.downloadReport">Download a PDF of my report</button></p>

        <div style="flex-direction: column; justify-content: flex-start; align-items: flex-start; display: flex">
            <div style="align-self: stretch; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">

                <!-- PDF Container with zoom wrapper -->
                <div style="width: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #E5E7EB;">

                    <!-- PDF Controls Bar -->
                    <div style="background: #F9FAFB; padding: 12px 20px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: center; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <!-- Zoom Controls -->
                            <button onclick="zoomPDF('out')" style="background: #6B7280; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: bold; line-height: 1;" title="Zoom Out">
                                −
                            </button>
                            <span id="zoomLevel" style="color: #374151; font-size: 12px; font-family: Noto Sans; min-width: 45px; text-align: center; font-weight: 500;">
                                100%
                            </span>
                            <button onclick="zoomPDF('in')" style="background: #6B7280; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: bold; line-height: 1;" title="Zoom In">
                                +
                            </button>
                        </div>
                    </div>

                    <!-- PDF Viewer -->
                    <div id="pdfContainer" style="width: 100%; height: 900px; overflow: auto; background: white; position: relative;">
                        <iframe id="dhqPdfFrame" src="${pdfUrl}" style="width: 100%; height: 100%; border: none; display: block; background: white; transform-origin: top left; transition: transform 0.2s ease;" title="DHQ HEI Report PDF"></iframe>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// Zoom using CSS transforms
let currentZoom = 100;
const zoomStep = 10;
const minZoom = 50;
const maxZoom = 200;

window.zoomPDF = function (action) {
    const iframe = document.getElementById('dhqPdfFrame');
    const container = document.getElementById('pdfContainer');
    const zoomDisplay = document.getElementById('zoomLevel');

    if (!iframe || !container || !zoomDisplay) {
        console.error('PDF zoom elements not found');
        return;
    }

    let newZoom = currentZoom;

    switch (action) {
        case 'in':
            newZoom = Math.min(currentZoom + zoomStep, maxZoom);
            break;
        case 'out':
            newZoom = Math.max(currentZoom - zoomStep, minZoom);
            break;
    }

    // Apply zoom transform
    const scale = newZoom / 100;
    iframe.style.transform = `scale(${scale})`;

    // Container dims
    if (scale !== 1) {
        iframe.style.width = `${100 / scale}%`;
        iframe.style.height = `${100 / scale}%`;
    } else {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
    }

    currentZoom = newZoom;
    zoomDisplay.textContent = `${currentZoom}%`;
};