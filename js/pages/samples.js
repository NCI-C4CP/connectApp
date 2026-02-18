import { getMyData, hasUserData, translateHTML, translateText, requestHomeKit, escapeHTML, getKitTrackingNumber, getTrackingNumberSource } from "../shared.js";
import { renderChangeMailingAddressGroup } from "./settings.js";
import { toggleElementVisibility, validateMailingAddress, changeMailingAddress } from "../settingsHelpers.js";
import { addEventAddressAutoComplete } from '../event.js';
import conceptId from '../fieldToConceptIdMapping.js';


export const renderSamplesPage = async () => {
    document.title = translateText('samples.title');
    getMyData().then(async res => {

        if (!hasUserData(res)) return;
        let participant = res.data;
        const kitId = participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.uniqueKitID];
        const kitStatus = participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.kitStatus];
        if (kitStatus === conceptId.kitStatusValues.shipped && participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.kitRequestEligible] === conceptId.yes) {
            // If the kit has been shipped and was user-requested, we're going to need its tracking number information
            const {code, data, message} = await getKitTrackingNumber(kitId);
            if (data?.supplyKitTrackingNum) {
                participant.supplyKitTrackingNum = data.supplyKitTrackingNum;
            } else {
                console.error('%s error retrieving kit information:', code, message);
            }

        }

        let site = locations.filter(location => location.concept == participant[conceptId.healthcareProvider])[0];
        let template = '';

        //Top Header
        template += translateHTML(`
            <div class="row" style="margin-top:18px">
                <div class="col-lg-2 col-xl-3"></div>
                <div class="col-lg-8 col-xl-6" >
                    <p class="consentHeadersFont" id="myProfileTextContainer" style="color:#606060;" data-i18n="navbar.samplesLink">
                    My Samples
                    </p>
                </div>
                <div class="col-lg-2 col-xl-3"></div>
            </div>
        `);

        //In page Navigation

        // Request a kit and kit request history eligibility information needed, so calculated here
         // More kit types will be added eventually
        const kitsForRequest = [{key: conceptId.bioKitMouthwash, kitType: "Mouthwash"}];
        const availableKits  = [], receivedKits = [];
        kitsForRequest.forEach(({key, kitType}) => {
            if (participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[key]?.[conceptId.kitStatus] === conceptId.kitStatusValues.received) {
                receivedKits.push({
                    key,
                    kitType,
                    dateRequested: participant[conceptId.collectionDetails][conceptId.baseline][key][conceptId.dateKitRequested],
                    dateReceived: participant[conceptId.collectionDetails][conceptId.baseline][key][conceptId.receivedDateTime]
                });
            } else {
                availableKits.push(key);
            }
        });

        // Display only if user is kit request eligible and has not requested all kit types
        const showRequestAKit = participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.kitRequestEligible] === conceptId.yes && availableKits.length;
        // Display if any home kits have been received
        const showKitRequestHistory = !!receivedKits.length;

        template += translateHTML(`<div class="row">
            <div class="col-lg-2 col-xl-3"></div>
            <div class="col-lg-8 col-xl-6">
                <p class="consentHeadersFont" style="color:#606060; font-size: 1.5em;" data-i18n="settings.pageNav">
                    On this page:
                </p>
                <ul class="onThisPage">
                <li><a href="javascript:document.getElementById('donatingInformation').scrollIntoView(true)"><span data-i18n="samples.donatingSamples">Donating Your Samples at</span> ${site.name}</a></li>
                ${showRequestAKit ? `<li><a href="javascript:document.getElementById('requestAKitRow').scrollIntoView(true);" data-i18n="samples.requestAKit.title">Home Collection Kit Request</a></li>` : ``}
                ${showKitRequestHistory ? `<li><a href="javascript:document.getElementById('kitRequestHistoryRow').scrollIntoView(true);" data-i18n="samples.kitRequestHistory.title">Home Collection Kit Request History</a></li>` : ``}
                <!-- <li><a href="javascript:document.getElementById('sampleInventory').scrollIntoView(true)" data-i18n="samples.sampleInventory">Sample Inventory</a></li> -->
                </ul>
            </div>
            <div class="col-lg-2 col-xl-3"></div>
        </div>`);
        if (site && 
            site !== kpga && 
            site !== kphi && 
            site !== kpco && 
            site !== kpnw && 
            site !== u_chicago && 
            site !== henry_ford
        ) {
            const locationTemplate = renderLocations(site);

            template += translateHTML(`
            <div class="row" id="donatingInformation">
                <div class="col-lg-2 col-xl-3"></div>
                <div class="col-lg-8 col-xl-6">
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div>
                                <span data-i18n="samples.donatingSamples"/></span> ${site.name}
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.donatingSamples}
                            </div>
                        </div>
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whenToDonate" aria-expanded="true" aria-controls="whenToDonate">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            ${site.whenToDonateHeader ? 
                                site.whenToDonateHeader :`
                                <div data-i18n="samples.whenToDonate">
                                    When Should I Donate My Samples?
                                </div>
                                `}
                        </div>
                        <div class="messagesBodyFont collapse show" style="width:100%" id="whenToDonate">
                            <div>
                                ${site.whenToDonate}
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#howToDonate" aria-expanded="false" aria-controls="howToDonate">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                <div data-i18n="samples.howToDonate">
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="howToDonate">
                            <div>
                                ${site.howToDonate}
                            </div>
                        </div>          
                    </div>
                    <hr>
                    <div class="row" style="width:100%;">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whereToDonate" aria-expanded="false" aria-controls="whereToDonate">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.whereToDonate">
                                Where Do I Donate My Samples?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="whereToDonate">
                        ${site.locationNotes ? `
                        <div style="width:100%; padding-top:0;">
                            <div class="messagesBodyFont">
                                ${site.locationNotes}
                            </div>
                        </div>`
                        : ''}

                        ${locationTemplate}

                        ${site.parkingInstructions ? `
                        <div style="width:100%">

                                <div class="messagesHeaderFont" data-i18n="samples.parkingInstructions">
                                </div>
                                <div class="messagesBodyFont removePaddingTop" data-i18n="samples.freeParkingAllCenters">
                                </div>

                        </div>`
                        : ''}

                        ${site.scheduling ? `
                        <div style="width:100%">

                                <div class="messagesHeaderFont" data-i18n="samples.schedule">
                                    Scheduling Information
                                </div>
                                <div class="messagesBodyFont removePaddingTop">
                                    ${site.scheduling}
                                </div>

                        </div>` : ''
                        }
                        </div>
                    </div>
                    <hr>
                    
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#howLongAppt" aria-expanded="false" aria-controls="howLongAppt">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.howLongAppt">
                                How Long Will My Appointment Take?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="howLongAppt">
                            <div>
                                ${site.howLong}
                            </div>
                        </div>
                    </div>
                    <hr>

                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#prepareAppt" aria-expanded="false" aria-controls="prepareAppt">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.prepareAppt">
                                How Should I Prepare On the Day of My Appointment?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="prepareAppt">
                            <div>
                                ${site.prepareInstructions}
                            </div>
                        </div>
                    </div>
                    <hr>

                    ${site.whatHappens ?  `
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#duringAppt" aria-expanded="false" aria-controls="duringAppt">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.duringAppt">
                                What Will Happen During My Appointment?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="duringAppt">
                            <div>
                                ${site.whatHappens}
                            </div>
                        </div>
                    </div>
                    <hr>` 
                    : '' 
                    }

                    ${site.payment ?  `
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whenPayment" aria-expanded="false" aria-controls="whenPayment">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.whenPayment">
                                When Will I Receive My $25 Payment?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="whenPayment">
                            <div>
                                ${site.payment}
                            </div>
                        </div>
                    </div>
                    <hr>` 
                    : '' 
                    }
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%"  data-bs-toggle="collapse" data-bs-target="#supportQuestions" aria-expanded="false" aria-controls="supportQuestions">
                          <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                         ${
                             site.questions
                                 ? site.questions
                                 : '<div data-i18n="samples.questions"> Questions? Contact the Connect Support Center </div>'
                         }
                        </div><br>
                        <div class="messagesBodyFont collapse" style="width:100%" id="supportQuestions">
                            <div>
                            ${
                                site.contact ||
                                '<a href="https://myconnect.cancer.gov/support" target="_blank">MyConnect.cancer.gov/support</a> <br><br> <a data-i18n="samples.emailSupport" href="mailto: ConnectSupport@norc.org">ConnectSupport@norc.org</a> <br>'
                            }
                                <br>
                                ${site.support}
                            </div>
                        </div>
                    </div>
                    <hr>
                </div>
                <div class="col-lg-2 col-xl-3">
                </div>
            </div>    
            `);
        }
        else if (site && 
            (site === kpga || 
                site ===  kphi || 
                site ===  kpco || 
                site ===  kpnw || 
                site === henry_ford
            )
        ) {
            template += translateHTML(`
            <div class="row"  id="donatingInformation">
            <div class="col-lg-2 col-xl-3">
                </div>
                <div class="col-lg-8 col-xl-6">
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div>
                                <span data-i18n="samples.donatingSamples">Donating Your Samples at </span>${site.name}
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.donatingSamples}
                            </div>
                        </div>
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whenToDonateSamples" aria-expanded="true" aria-controls="whenToDonateSamples">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            ${
                                (site === henry_ford)
                                    ? `<div data-i18n="samples.henry_ford.whenToDonateHeader">` 
                                    : `<div data-i18n="samples.whenToDonateSamples">`
                            }
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse show" style="width:100%" id="whenToDonateSamples">
                            <div>
                                ${site.whenToDonate}
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%;" data-bs-toggle="collapse" data-bs-target="#howToDonateSamples" aria-expanded="false" aria-controls="howToDonateSamples">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.howToDonateSamples">
                                How Do I Donate My Blood and Urine Samples?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="howToDonateSamples">
                            <div>
                                ${ 
                                    (site === henry_ford) 
                                        ? site.howToDonate
                                        : site.howToDonateBloodAndUrine
                                }
                            </div>
                        </div>          
                    </div>
                    <hr>
                    ${(site === henry_ford) ?
                        `<div class="row" style="width:100%;">
                            <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whereToDonate" aria-expanded="false" aria-controls="whereToDonate">
                                <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                <div data-i18n="samples.whereToDonate">
                                    Where Do I Donate My Samples?
                                </div>
                            </div>
                            <div class="messagesBodyFont collapse" style="width:100%" id="whereToDonate">
                            ${site.locationNotes 
                                ? `<div style="width:100%; padding-top:0;">
                                        <div class="messagesBodyFont">
                                            ${site.locationNotes}
                                        </div>
                                    </div>` 
                                : ``}
                            </div>
                        </div>`
                        : ``
                    }
                    
                    ${(site !== henry_ford)
                        ?   `<div class="row" style="width:100%">
                                <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#prepInstructions" aria-expanded="false" aria-controls="prepInstructions">
                                    <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                    <div>
                                        ${site.prepInstructionsHeader}
                                    </div>
                                </div>
                                <div class="messagesBodyFont collapse" style="width:100%" id="prepInstructions">
                                    <div>
                                        ${site.prepInstructionsText}
                                    </div>
                                </div>          
                            </div>`
                        : ``
                    }

                    <hr>          

                    ${ (site === henry_ford)
                        ?   `<div class="row" style="width:100%">
                                <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#howLongVisit" aria-expanded="false" aria-controls="howLongVisit">
                                    <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                    <div data-i18n="samples.howLongVisit">
                                        How Long Will My Visit Take?
                                    </div>
                                </div>
                                <div class="messagesBodyFont collapse" style="width:100%" id="howLongVisit">
                                    <div>
                                        ${site.howLong}
                                    </div>
                                </div>
                            </div>
                            <hr>`
                        : ''
                    }

                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whatHappensDuring" aria-expanded="false" aria-controls="whatHappensDuring">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            <div data-i18n="samples.duringVisit">
                                What Will Happen During My Visit?
                            </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="whatHappensDuring">
                            <div>
                                ${site.whatHappensDuring}
                            </div>
                        </div>          
                    </div> 
                    <hr>

                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whatHappensAfter" aria-expanded="false" aria-controls="whatHappensAfter">
                                <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                <div data-i18n="samples.afterVisit">
                                    What Will Happen After My Visit?
                                </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="whatHappensAfter">
                            <div>
                                ${site.whatHappensAfter}
                            </div>
                        </div>          
                    </div>
                    <hr>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#howToDonateMouthwash" aria-expanded="false" aria-controls="howToDonateMouthwash">
                                <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                <div data-i18n="samples.donatingMouthwashSample">
                                    How Do I Donate My Mouthwash Sample?
                                </div>
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="howToDonateMouthwash">
                            <div>
                                ${site.howToDonateMouthwash}
                            </div>
                        </div>
                    </div>
                    <hr>
                    ${(site === henry_ford) 
                        ? `
                        <div class="row" style="width:100%">
                                <div class="consentHeadersFont collapsed" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#whenPayment" aria-expanded="false" aria-controls="whenPayment">
                                <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                                <div data-i18n="samples.whenPayment">
                                    When Will I Receive My $25 Payment?
                                </div>
                            </div>
                            <div class="messagesBodyFont collapse" style="width:100%" id="whenPayment">
                                <div>
                                    ${site.payment}
                                </div>
                            </div>
                        </div>
                        <hr>` 
                        : '' 
                    }

                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%" data-bs-toggle="collapse" data-bs-target="#supportQuestions" aria-expanded="false" aria-controls="supportQuestions">
                            <span class="float-end"><i class="fa-solid fa-plus"></i><i class="fa-solid fa-minus"></i></span>
                            ${(site === henry_ford) 
                                ?  `<div data-i18n="samples.henry_ford.questionsHeader">
                                        Questions? Contact the Connect Study Team at Henry Ford Health 
                                    </div>`
                                :  `<div data-i18n="samples.questions">
                                        Questions? Contact the Connect Support Center 
                                    </div>`
                            }
                            
                        </div>
                        <div class="messagesBodyFont collapse" style="width:100%" id="supportQuestions">
                            <div>
                                ${site.support}
                            </div>
                        </div>
                    </div>
                    <hr>
                </div>
                <div class="col-lg-2 col-xl-3">
                </div>
            </div>     
            `);
        } else if (site && site === u_chicago) {
            template += translateHTML(`
                        <div class="row" style="width:100%"  id="donatingInformation">
                            <div class="col-lg-2 col-xl-3">
                            </div>
                            <div class="col-lg-8 col-xl-6">
                                <div class="consentHeadersFont" style="color:#606060;width:100%">
                                    <div>
                                        <span data-i18n="samples.donatingSamplesConnectMessage"/></span>
                                    </div>
                                </div>
                                <div class="messagesBodyFont" style="width:100%">
                                    <div data-i18n="samples.noSamplesCollection">
                                        ${site.noSamplesCollection}
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-2 col-xl-3">
                            </div>
                        </div>
            `);
        } else {
            template += translateHTML(`
            <div class="row"  id="donatingInformation">
                <div class="col-lg-2 col-xl-3">
                </div>
                <div class="col-lg-8 col-xl-6 NotoSansFont" data-i18n="samples.planCollecting">
                    We plan to begin collecting samples later this year. We will send you an email with instructions and next steps when it is time to donate samples. Thank you for being part of Connect!
                </div>
                <div class="col-lg-2 col-xl-3">
                </div>
            </div>    
            `);
        }

        //Request a kit

        if (showRequestAKit) {
            template += translateHTML(`
                    <div class="row">
                        <div class="col-lg-2 col-xl-3"></div>
                        <div class="col-lg-8 col-xl-6">
                            <div class="consentHeadersFont" style="color:#606060;width:100%" id="requestAKitRow">
                                <div data-i18n="samples.requestAKit.title">
                                    Home Collection Kit Request
                                </div>
                            </div>
                            <div class="row" id="requestAKit">
                                <div class="col-lg-12" id="requestAKitInner">
                                </div>
                            </div>
                            <hr />
                    </div>
                    <div class="col-lg-2 col-xl-3"></div>
                </div>
                `);
                template += renderAddPhysicalAddressInfo();
        }
        
        if (showKitRequestHistory) {
            // Home Collection Kit Request History
            template += translateHTML(`
                <div class="row">
                    <div class="col-lg-2 col-xl-3"></div>
                    <div class="col-lg-8 col-xl-6">
                        <div class="consentHeadersFont" style="color:#606060;width:100%" id="kitRequestHistoryRow">
                            <div data-i18n="samples.kitRequestHistory.title">
                                Home Collection Kit Request History
                            </div>
                        </div>
                        <div class="row" id="kitRequestHistory">
                            <div class="col-lg-12" id="kitRequestHistoryInner">
                                ${receivedKits.map(({kitType, dateRequested, dateReceived}) => {
                                    const dateOptions = {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric"
                                    };
                                    // Because the date received is always stored as midnight in UTC on the date that the kit is received
                                    // we have to specify UTC timezone for Date Received
                                    // otherwise, in the standard US timezones, it will display as the day before receipt
                                    return `
                                        <div class="messagesSubHeader"><span data-i18n="samples.kitRequestHistory.kitTypeLabel">Type of Kit</span>: <span data-i18n="samples.kitRequestHistory.${kitType}">${kitType}</span></div>
                                        <br />
                                        <div><span data-i18n="samples.kitRequestHistory.dateKitRequestedLabel">Date Requested</span>: <span data-i18n="date" data-timestamp="${dateRequested}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"></span></div>
                                        <div><span data-i18n="samples.kitRequestHistory.dateKitReceivedLabel">Date Received</span>: <span data-i18n="date" data-timestamp="${dateReceived}" data-date-options="${encodeURIComponent(JSON.stringify({...dateOptions, timeZone: "UTC"}))}"></span></div>
                                    `;
                                }).join('<hr />')}
                            </div>
                        </div>
                        <hr />
                    </div>
                    <div class="col-lg-2 col-xl-3"></div>
                </div>
            `);
        }

        //Sample Inventory
        /*
        let samples = [];
        if (participant[conceptId.collectionDetails]) {
            if (participant[conceptId.bloodFlag] === conceptId.yes) {
                samples.push({
                    type: "samples.blood",
                    date: getSampleDateTime(participant, conceptId.biospecimenBloodCollection, conceptId.bloodDateTime, conceptId.clinicalBloodDateTime)
                });
            }
            if (participant[conceptId.urineFlag] === conceptId.yes) {
                samples.push({
                    type: "samples.urine",
                    date: getSampleDateTime(participant, conceptId.biospecimenUrineCollection, conceptId.urineDateTime, conceptId.clinicalUrineDateTime)
                });
            }
            
            let mouthwashSample = getMouthWashSample(participant, conceptId.bioKitMouthwash, "samples.mouthwash");
            if (mouthwashSample) {
                samples.push(mouthwashSample);
            }
            let mouthwashSampleR1 = getMouthWashSample(participant, conceptId.bioKitMouthwashBL1, "samples.mouthwashR1");
            if (mouthwashSampleR1) {
                samples.push(mouthwashSampleR1);
            }
            let mouthwashSampleR2 = getMouthWashSample(participant, conceptId.bioKitMouthwashBL2, "samples.mouthwashR2");
            if (mouthwashSampleR2) {
                samples.push(mouthwashSampleR2);
            }
        }

        let samplesBody = `<div class="col-lg-2 col-xl-3"></div>
            <div class="col-lg-8 col-xl-6">`
        if (samples.length) {
            const dateOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };
            
            samplesBody += '<ul  class="list-unstyled samples-list"><li>';
            samplesBody += samples.sort((a, b) => a.date < b.date ? -1 : 1).map((sample) => {
                return '<div class="h5"><span data-i18n="samples.donationDate">Donation Date: </span>'+(sample.date ? `<span data-i18n="date" data-timestamp="${sample.date}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"></span>` : 'N/A') +'</div>'+
                '<span data-i18n="samples.typeOfSample">Type of Sample Donated: </span><span data-i18n="'+sample.type+'"></span>'
            }).join('</li><li>');
            samplesBody += '</li></ul>';
        } else {
            samplesBody += '<span data-i18n="samples.noInventory"></span>';
        }
        samplesBody += `
            <div class="col-lg-2 col-xl-3"></div>
        `

        template += translateHTML(`<div class="row gy-3"  id="sampleInventory">
            <div class="col-lg-2 col-xl-3"></div>
            <div class="col-lg-8 col-xl-6">
                <div class="consentHeadersFont" style="color:#606060;width:100%" data-i18n="samples.sampleInventory"></div>
            </div>
            <div class="col-lg-2 col-xl-3"></div>
            ${samplesBody}
        </div>
        `);
        */

        document.getElementById('root').innerHTML = template;

        renderRequestAKitDisplay(participant);
        bindEvents(participant);
    });
}

const getParticipantMailToAddress = (participant) => {
    const {
        physicalAddress1, physicalAddress2, physicalCity, physicalState, physicalZip,
        address1, address2, city, state, zip, isPOBox, isIntlAddr, physicalAddrIntl, yes
    } = conceptId;
    let invalidAddress = false;
    let isIntl = false;
    let addressType;

    const poBoxRegex = /^(?:P\.?\s*O\.?\s*(?:Box|B\.?)?|Post\s+Office\s+(?:Box|B\.?)?)\s*(\s*#?\s*\d*)((?:\s+(.+))?$)$/i;
    const physicalAddressVal = participant?.[conceptId.physicalAddress1];

    let addressObj;

    if (physicalAddressVal && !poBoxRegex.test(physicalAddressVal) && participant?.[physicalAddrIntl] !== yes) {
        addressObj = {
            address_1: participant[physicalAddress1],
            address_2: participant[physicalAddress2] || '',
            city: participant[physicalCity],
            state: participant[physicalState],
            zip_code: participant[physicalZip], 
        };
        addressType = 'physical';
    } else {
        const addressLineOne = participant?.[address1];
        const isPOBoxMatch = poBoxRegex.test(addressLineOne) || participant?.[isPOBox] === yes || participant?.[isIntlAddr] === yes;
        if (isPOBoxMatch) {
            invalidAddress = true;
        }
        if (participant?.[isIntlAddr] === yes) {
            isIntl = true;
        }
        addressType = 'mailing';
        addressObj = {
            address_1: participant[address1],
            address_2: participant[address2] || '',
            city: participant[city],
            state: participant[state],
            zip_code: participant[zip]
        };
    }

    let kitMailToAddress = `${addressObj.address_1 || ''}<br />
            ${addressObj.address_2 ? `${addressObj.address_2}<br />` : ''}
        ${addressObj.city || ''}${addressObj.state ? ',':''} ${addressObj.state || ''} ${addressObj.zip_code || ''}`;

    return {
        invalidAddress,
        isIntl,
        kitMailToAddress,
        addressType,
        addressObj
    }
}

const renderRequestAKitDisplay = (participant) => {
    const requestAKitInner = document.getElementById('requestAKitInner');
    if (!requestAKitInner || participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.kitRequestEligible] !== conceptId.yes) {
        return;
    }

    const {collectionDetails, baseline, bioKitMouthwash, kitStatus, shippedDateTime, kitStatusValues: {initialized, assigned, addressPrinted, shipped}} = conceptId;

    if ([initialized, addressPrinted, assigned].includes(participant[collectionDetails]?.[baseline]?.[bioKitMouthwash]?.[kitStatus])) {
        // Request has been sent, kit has not been shipped. Basically, check that kitStatus is initialized, address printed or assigned
        requestAKitInner.innerHTML = translateHTML(`<div class="callout callout-success">
                <div class="row">
                    <div class="col-1"><i class="fa-solid fa-circle-check" style="color: #4CAF50; font-size:2rem;"></i></div>
                    <div class="col-11"><strong><span data-i18n="samples.requestAKit.confirmedBold">Your mouthwash home collection request has been submitted!</span></strong> <span data-i18n="samples.requestAKit.confirmedShippingTimeframe">We will ship your kit soon, and you can expect it to arrive within one week.</span></div>
                </div>
            </div>`);
    } else if (participant[collectionDetails]?.[baseline]?.[bioKitMouthwash]?.[kitStatus] === shipped) {
        // Kit has been shipped
        const kitShippedDate = new Date(participant[collectionDetails]?.[baseline]?.[bioKitMouthwash]?.[shippedDateTime]);
        const kitArrivalDate = new Date(+kitShippedDate + (7 * 24 * 60 * 60 * 1000)); // Add 7 days
        const dateOptions = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        };
        const trackingUrls = {
            FedEx: `https://www.fedex.com/wtrk/track/?trknbr=${participant.supplyKitTrackingNum}`,
            USPS: `https://tools.usps.com/go/TrackConfirmAction`,
            UPS: `https://www.ups.com/track`,
            default: `https://www.ups.com/track`
        };
        const trackingNumberSource = getTrackingNumberSource(participant.supplyKitTrackingNum);
        const trackingNumberURL = trackingUrls[trackingNumberSource] || trackingUrls.default;

        requestAKitInner.innerHTML = translateHTML(`
            <div>
                <span data-i18n="samples.requestAKit.mouthwashKitShippedOn">Your mouthwash kit was shipped on </span>
                <span data-i18n="date" data-timestamp="${kitShippedDate}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"></span><span data-i18n="samples.requestAKit.mouthwashShouldArriveBy">. Expect it to arrive by </span>
                <span data-i18n="date" data-timestamp="${kitArrivalDate}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"></span><span data-i18n="samples.requestAKit.mouthwashArrivalPostfix">.</span>
            </div>
             <br />
            <div>
                ${participant.supplyKitTrackingNum ? `
                    <span data-i18n="samples.requestAKit.weShippedYourKitThrough">We shipped your kit through</span>
                        ${trackingNumberSource}. 
                        <span data-i18n="samples.requestAKit.kitTrackingInfo">You can track it using this number: </span><a href="${trackingNumberURL}" target="_blank">${participant.supplyKitTrackingNum}</a>.` 
                    : `<div class="alert alert-danger">
                            <span data-i18n="samples.requestAKit.somethingWentWrong">We're experiencing an issue retrieving your tracking information. Please contact the <a href=\"myconnect.cancer.gov/support\">Connect Support Center</a> for help.</span>
                        </div>`}
                
             </div>
             <br />
            <div data-i18n="samples.requestAKit.kitDelayMissingQuestionsContactInfo">If you don't receive your kit within one week of the above ship date, or have any questions about the kit or home collection process, please reach out to the <a href=\"#support\">Connect Support Center</a> for help.</div>`)
    } else {
        const {invalidAddress, isIntl, kitMailToAddress, addressType} = getParticipantMailToAddress(participant);

        if (invalidAddress) {
            const cannotShipFirstHalfText = isIntl ? "We can't ship home collection kits to P.O. Boxes or international addresses, and your current mailing address is an international address. Please " : "We can't ship home collection kits to P.O. Boxes or international addresses, and your current mailing address is a P.O. Box. Please ";
            requestAKitInner.innerHTML = translateHTML(`
                <div class="fw-bold" data-i18n="samples.requestAKit.eligibilityBlurb">We sent you a message recently to let you know you can now request a home collection kit for Connect.</div>
                <br />
                <div class="fw-bold"  data-i18n="samples.requestAKit.cannotShipKitHeader">We can\'t ship your kit because of a problem with your address.</div>
                <div>${kitMailToAddress}</div>
                <br />
                <div class="callout callout-danger">
                    <span data-i18n="samples.requestAKit.${isIntl ? 'cannotShipToIntlAddressesFirstHalf' : 'cannotShipToPOBoxesFirstHalf'}">${cannotShipFirstHalfText}</span><a href="#"id="updateMailingAddress"><span data-i18n="samples.requestAKit.updateMailingAddressLink">update your mailing address</span></a><span data-i18n="samples.requestAKit.cannotShipToPOBoxesSecondHalf"> or click the button below to add a new physical address where we should ship your kit.</span>
                </div>
                <div id="mailingAddressSuccess2"></div>
                <div id="mailingAddressFail2"></div>
                <div id="mailingAddressError2"></div>
                ${addressType === 'physical' ? '' : `<br /><div><button type="button" class="btn btn-primary" id="addPhysicalAddress" data-i18n="samples.requestAKit.addPhysicalAddress" data-bs-toggle="modal" data-bs-target="#addPhysicalAddressInfo">Add Physical Address</button></div>`}
            `);
            const addPhysicalAddressInfoModal = document.getElementById('addPhysicalAddressInfo');
            addPhysicalAddressInfoModal.outerHTML = renderAddPhysicalAddressInfo(true, isIntl);
        } else {
            requestAKitInner.innerHTML = translateHTML(`
                <div class="fw-bold" data-i18n="samples.requestAKit.eligibilityBlurb">We sent you a message recently to let you know you can now request a home collection kit for Connect!</div>
                <br />
                <div class="fw-bold" data-i18n="samples.requestAKit.willShipToThisAddress">We will ship your kit to this address:</div>
                <div>${kitMailToAddress}</div>
                <br />
                <div><a href="#" id="update${addressType === 'physical' ? 'Physical' : 'Mailing'}Address"><span data-i18n="samples.requestAKit.updateMy${addressType === 'physical' ? 'Physical' : 'Mailing'}Address">Update my ${addressType} address</span></a></div>
                ${addressType === 'mailing' ? `<div><a href="#" id="addPhysicalAddress"  data-i18n="samples.requestAKit.addPhysicalAddressLowercase" data-bs-toggle="modal" data-bs-target="#addPhysicalAddressInfo">Add physical address</a></div>` : ''}
                <br /><br />
                <div class="fst-italic" data-i18n="samples.requestAKit.cannotShipToPOBoxesNote">Note: we can't ship kits to P.O. Boxes or international addresses.</div>
                <div id="mailingAddressSuccess2"></div>
                <div id="mailingAddressFail2"></div>
                <div id="mailingAddressError2"></div>
                <label class="fw-bold col-form-label" data-i18n="samples.requestAKit.selectKitType" for="selectKitType"><strong>Select your kit type:</strong></label>
                <select class="form-control" name="kitType" id="selectKitType">
                    <option data-i18n="samples.requestAKit.chooseKitGhostValue" value="" disabled>Choose the kit you are requesting</option>
                    <option data-i18n="samples.requestAKit.mouthwashOption" value="mouthwash" default>Mouthwash</option>
                </select>
                <div data-i18n="samples.requestAKit.mwKitShipTimeframe">Mouthwash kits ship and arrive in about one week.</div>
                <br />
                <div><button type="button" class="btn btn-primary" id="requestHomeKit" data-i18n="samples.requestAKit.submitRequestText">Submit Request</button></div>
            `);

            const addPhysicalAddressInfoModal = document.getElementById('addPhysicalAddressInfo');
            addPhysicalAddressInfoModal.outerHTML = renderAddPhysicalAddressInfo(false);

        }
    }

}

const renderSomethingWentWrongError = () => {
    const requestAKitInner = document.getElementById('requestAKitInner');
    if (requestAKitInner) {
        requestAKitInner.innerHTML = translateHTML(`
            <div class="alert alert-danger">
                <span data-i18n="samples.requestAKit.somethingWentWrong">We're experiencing an issue with your request. Please contact the <a href=\"myconnect.cancer.gov/support\">Connect Support Center</a> for help.</span>
                </div>
            `)
    }
}

/**
 * This function has been largely copied from settings.js, but has modifications specific to this page
 * @param {*} id 
 * @param {*} addressLine1 
 * @param {*} addressLine2 
 * @param {*} city 
 * @param {*} state 
 * @param {*} zip 
 * @param {*} isPOBox 
 */
const submitNewMailingAddress = async (id, addressLine1, addressLine2, city, state, zip, isPOBox = false, isValidatedByUSPS = false) => {
    const data = await getMyData();
    const userData = data.data;
    const isInternational = conceptId.no; // no international addresses here (kit shipments are for domestic, non-PO Box addresses only)
    const addressLine3 = '';
    const country = '';
    const isSuccess = await changeMailingAddress(id, addressLine1, addressLine2, city, state, zip, userData, isInternational, addressLine3, country, isPOBox, false, isValidatedByUSPS).catch(function (error) {
        console.error('Error', error);
        document.getElementById(`mailingAddressFail${id}`).style.display = 'block';
        document.getElementById(`mailingAddressError${id}`).innerHTML = translateText('settings.failMailUpdate');
    });
    if (isSuccess) {
        return true;
    }
};

const renderParticipantPhysicalAddress = (participant, displayCurrentPhysicalAddress) => {
    const requestAKitInner = document.getElementById('requestAKitInner');
    if (!requestAKitInner || participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.kitRequestEligible] !== conceptId.yes) {
        return;
    }

    let newInnerHTML = '<div class="messagesSubHeader" data-i18n="samples.requestAKit.newPhysicalAddress">New Physical Address</div>' + renderChangeMailingAddressGroup(2, true);

    if(displayCurrentPhysicalAddress) {
        const {
            physicalAddress1, physicalAddress2, physicalCity, physicalState, physicalZip,
        } = conceptId;
        const addressObj = {
            address_1: participant[physicalAddress1],
            address_2: participant[physicalAddress2] || '',
            city: participant[physicalCity],
            state: participant[physicalState],
            zip_code: participant[physicalZip]
        };
        const formattedAddress = `${addressObj.address_1 || ''}<br />
                ${addressObj.address_2 ? `${addressObj.address_2}<br />` : ''}
            ${addressObj.city || ''}${addressObj.state ? ',':''} ${addressObj.state || ''} ${addressObj.zip_code || ''}`;

        newInnerHTML = '<div class="messagesSubHeader" data-i18n="samples.requestAKit.currentPhysicalAddress">Current Physical Address</div>' 
        + `<div class="row"><div class="col-1"></div><div class="col-11">${formattedAddress}</div></div>` + newInnerHTML;
    }

    requestAKitInner.innerHTML = translateHTML(newInnerHTML);
    toggleElementVisibility([document.getElementById(`currentMailingAddressDiv2`), document.getElementById(`changeMailingAddressGroup2`)], false);
    addEventAddressAutoComplete(2);
    
    // We want to preserve the styling between the add physical address section here and the user profile page as much as possible,
    // hence the use of renderChangeMailingAddressGroup. However, our styling for this page
    // calls for the addition of the cancellation button, a style difference on the submit button, and added
    // warning text about being unable to ship to PO Boxes or international addresses
    // These changes are done below as DOM manipulation
    
    const cannotShipToPOIntDiv = document.createElement('div');
    const submitButton = document.getElementById('changeMailingAddressSubmit2');
    submitButton.setAttribute('class', 'btn btn-primary save-data');
    const buttonParentDiv = submitButton.parentElement;
    const buttonGrandparentDiv = buttonParentDiv.parentElement;
    buttonGrandparentDiv.insertBefore(cannotShipToPOIntDiv, buttonParentDiv);
    cannotShipToPOIntDiv.outerHTML = translateHTML(`<div class="fst-italic" data-i18n="samples.requestAKit.cannotShipToPOBoxesNote">Note: we can't ship kits to P.O. Boxes or international addresses.</div>`);
    buttonGrandparentDiv.insertBefore(document.createElement('br'), buttonParentDiv);
    buttonGrandparentDiv.insertBefore(document.createElement('br'), buttonParentDiv);

    const backButton = document.createElement('button');
    backButton.textContent = 'Cancel';
    backButton.setAttribute('class', 'btn btn-outline-primary');
    backButton.setAttribute("data-i18n", "samples.requestAKit.cancelText");
    // Go back if cancel is clicked
    backButton.addEventListener('click', () => {
        renderRequestAKitDisplay(participant);
        bindEvents(participant);
    });
    buttonParentDiv.appendChild(translateHTML(backButton));
    bindEvents(participant);
}

const renderParticipantMailingAddress = (participant) => {
    const requestAKitInner = document.getElementById('requestAKitInner');
    if (!requestAKitInner || participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[conceptId.kitRequestEligible] !== conceptId.yes) {
        return;
    }

    const {
        address1, address2, city, state, zip
    } = conceptId;
    const addressObj = {
        address_1: participant[address1],
        address_2: participant[address2] || '',
        city: participant[city],
        state: participant[state],
        zip_code: participant[zip]
    };
    const formattedAddress = `${addressObj.address_1 || ''}<br />
            ${addressObj.address_2 ? `${addressObj.address_2}<br />` : ''}
        ${addressObj.city || ''}${addressObj.state ? ',':''} ${addressObj.state || ''} ${addressObj.zip_code || ''}`;

    const newInnerHTML = '<div class="messagesSubHeader" data-i18n="samples.requestAKit.currentMailingAddress">Current Mailing Address</div>' 
        + `<div class="row"><div class="col-1"></div><div class="col-11">${formattedAddress}</div></div><div class="messagesSubHeader" data-i18n="samples.requestAKit.newMailingAddress">New Mailing Address</div>` 
        + renderChangeMailingAddressGroup(1, true);

    requestAKitInner.innerHTML = translateHTML(newInnerHTML);
    toggleElementVisibility([document.getElementById(`currentMailingAddressDiv1`), document.getElementById(`changeMailingAddressGroup1`)], false);
    addEventAddressAutoComplete(1);
    
    // We want to preserve the styling between the add physical address section here and the user profile page as much as possible,
    // hence the use of renderChangeMailingAddressGroup. However, our styling for this page
    // calls for the addition of the cancellation button, a style difference on the submit button, and added
    // warning text about being unable to ship to PO Boxes or international addresses
    // These changes are done below as DOM manipulation
    
    const cannotShipToPOIntDiv = document.createElement('div');
    const submitButton = document.getElementById('changeMailingAddressSubmit1');
    submitButton.setAttribute('class', 'btn btn-primary save-data');
    const buttonParentDiv = submitButton.parentElement;
    const buttonGrandparentDiv = buttonParentDiv.parentElement;
    buttonGrandparentDiv.insertBefore(cannotShipToPOIntDiv, buttonParentDiv);
    cannotShipToPOIntDiv.outerHTML = translateHTML(`<div class="fst-italic" data-i18n="samples.requestAKit.cannotShipToPOBoxesNote">Note: we can't ship kits to P.O. Boxes or international addresses.</div>`);
    buttonGrandparentDiv.insertBefore(document.createElement('br'), buttonParentDiv);
    buttonGrandparentDiv.insertBefore(document.createElement('br'), buttonParentDiv);

    const backButton = document.createElement('button');
    backButton.textContent = 'Cancel';
    backButton.setAttribute('class', 'btn btn-outline-primary');
    backButton.setAttribute("data-i18n", "samples.requestAKit.cancelText");
    // Go back if cancel is clicked
    backButton.addEventListener('click', () => {
        renderRequestAKitDisplay(participant);
        bindEvents(participant);
    });
    buttonParentDiv.appendChild(translateHTML(backButton));
    bindEvents(participant);
}

const bindRequestKitButton = (participant) => {
    const requestKitBtn = document.getElementById('requestHomeKit');
    requestKitBtn && requestKitBtn.addEventListener('click', async () => {
        requestKitBtn.disabled = true;
        const resJSON = await requestHomeKit(participant);
        const {code, message} = resJSON;
        if (code === 200) {
            // Update area with success message
            // Update the participant with the necessary information
            participant[conceptId.collectionDetails] = participant[conceptId.collectionDetails] || {};
            participant[conceptId.collectionDetails][conceptId.baseline] = participant[conceptId.collectionDetails][conceptId.baseline] || {};
            participant[conceptId.collectionDetails][conceptId.baseline][conceptId.bioKitMouthwash] = participant[conceptId.collectionDetails][conceptId.baseline][conceptId.bioKitMouthwash] || {};
            participant[conceptId.collectionDetails][conceptId.baseline][conceptId.bioKitMouthwash][conceptId.kitStatus] = conceptId.kitStatusValues.initialized;
            renderRequestAKitDisplay(participant);
        } else {
            // Error case -- message is error message
            console.error(`${code} error requesting kit: ${message}`);
            renderSomethingWentWrongError();
        }
    });
}

const bindAddPhysicalAddressBtn = (participant) => {
    const addPhysicalAddressBtn = document.getElementById('continueToAddPAddress');
    addPhysicalAddressBtn && addPhysicalAddressBtn.addEventListener('click', () => {
        renderParticipantPhysicalAddress(participant);
    });
}

const bindUpdatePhysicalAddressBtn = (participant) => {
    const updatePhysicalAddressBtn = document.getElementById('updatePhysicalAddress');
    updatePhysicalAddressBtn && updatePhysicalAddressBtn.addEventListener('click', (e) => {
        e.preventDefault();
        renderParticipantPhysicalAddress(participant, true);
    });
}

const bindUpdateMailingAddressBtn = (participant) => {
    const updateMailingAddressBtn = document.getElementById('updateMailingAddress');
    updateMailingAddressBtn && updateMailingAddressBtn.addEventListener('click', (e) => {
        e.preventDefault();
        renderParticipantMailingAddress(participant);
    });
}

const bindUpdatePAddressBtn = (participant) => {
    const updateAddressBtn = document.getElementById('changeMailingAddressSubmit2');
    updateAddressBtn && updateAddressBtn.addEventListener('click', async () => {
        const addressLine1 = escapeHTML(document.getElementById('UPAddress2Line1').value.trim());
        const addressLine2 = escapeHTML(document.getElementById('UPAddress2Line2').value.trim());
        const city = escapeHTML(document.getElementById('UPAddress2City').value.trim());
        const state = escapeHTML(document.getElementById('UPAddress2State').value.trim());
        const zip = escapeHTML(document.getElementById('UPAddress2Zip').value.trim());

        const { hasError, uspsSuggestion, isValidatedByUSPSApi, addressNotFound } = await validateMailingAddress(2, addressLine1, city, state, zip);

        const submitNewAddress = (addressLine1, addressLine2, city, state, zip, isValidatedByUSPS = isValidatedByUSPSApi) => submitNewMailingAddress(
                2,
                addressLine1,
                addressLine2,
                city,
                state,
                zip,
                participant[conceptId.isPOBox] === conceptId.yes,
                isValidatedByUSPS
            );
        
        if (addressNotFound) { // Manual participant confirmation if USPS cannot validate
            showMailAddressConfirmation(
                {streetAddress: addressLine1, secondaryAddress: addressLine2, city, state, zipCode: zip},
                'event.addressSuggestionDescriptionPhysical',
                async (streetAddress, secondaryAddress, city, state, zipCode) => {
                    const success = await submitNewAddress(streetAddress, secondaryAddress, city, state, zipCode, false);
                    if (success) {
                        participant[conceptId.physicalAddress1] = streetAddress;
                        if (secondaryAddress) {
                            participant[conceptId.physicalAddress2] = secondaryAddress;
                        }
                        participant[conceptId.physicalCity] = city;
                        participant[conceptId.physicalState] = state;
                        participant[conceptId.physicalZip] = zipCode;
                        
                        renderRequestAKitDisplay(participant);
                        renderUpdateAddressSuccess();
                    }
                }
            );
        } else if (!hasError) {
            

            if (uspsSuggestion.suggestion) {
                showMailAddressSuggestion(
                    uspsSuggestion,
                    'event.addressSuggestionDescriptionPhysical',
                    async (streetAddress, secondaryAddress, city, state, zipCode, isValidatedByUSPSSelectionModal) => {
                        const success = await submitNewAddress(
                            streetAddress,
                            secondaryAddress,
                            city,
                            state,
                            zipCode,
                            isValidatedByUSPSSelectionModal
                        );
                        if (success) {
                            participant[conceptId.physicalAddress1] = streetAddress;
                            if (secondaryAddress) {
                                participant[conceptId.physicalAddress2] = secondaryAddress;
                            }
                            participant[conceptId.physicalCity] = city;
                            participant[conceptId.physicalState] = state;
                            participant[conceptId.physicalZip] = zipCode;
                            
                            renderRequestAKitDisplay(participant);
                            renderUpdateAddressSuccess();
                        }
                    }
                );
            } else {
                const success = await submitNewAddress(addressLine1, addressLine2, city, state, zip, isValidatedByUSPSApi);
                if (success) {
                    participant[conceptId.physicalAddress1] = addressLine1;
                    if (addressLine2) {
                        participant[conceptId.physicalAddress2] = addressLine2;
                    }
                    participant[conceptId.physicalCity] = city;
                    participant[conceptId.physicalState] = state;
                    participant[conceptId.physicalZip] = zip
                    renderRequestAKitDisplay(participant);
                    renderUpdateAddressSuccess();
                }
            }
        }
    });
}

const bindUpdateMAddressBtn = (participant) => {
    const updateAddressBtn = document.getElementById('changeMailingAddressSubmit1');
    updateAddressBtn && updateAddressBtn.addEventListener('click', async () => {
        const addressLine1 = escapeHTML(document.getElementById('UPAddress1Line1').value.trim());
        const addressLine2 = escapeHTML(document.getElementById('UPAddress1Line2').value.trim());
        const city = escapeHTML(document.getElementById('UPAddress1City').value.trim());
        const state = escapeHTML(document.getElementById('UPAddress1State').value.trim());
        const zip = escapeHTML(document.getElementById('UPAddress1Zip').value.trim());

        const { hasError, uspsSuggestion, isValidatedByUSPSApi, addressNotFound } = await validateMailingAddress(1, addressLine1, city, state, zip);
        const submitNewAddress = (addressLine1, addressLine2, city, state, zip, isValidatedByUSPS = isValidatedByUSPSApi) => submitNewMailingAddress(
            1,
            addressLine1,
            addressLine2,
            city,
            state,
            zip,
            false,
            isValidatedByUSPS
        );
        
        if (addressNotFound) { // Manual participant confirmation if USPS cannot validate
            showMailAddressConfirmation(
                {streetAddress: addressLine1, secondaryAddress: addressLine2, city, state, zipCode: zip},
                'event.addressConfirmationDescription',
                async (streetAddress, secondaryAddress, city, state, zipCode) => {
                    const success = await submitNewAddress(streetAddress, secondaryAddress, city, state, zipCode, false);
                    if (success) {
                        participant[conceptId.address1] = streetAddress;
                        if (secondaryAddress) {
                            participant[conceptId.address2] = secondaryAddress;
                        }
                        participant[conceptId.city] = city;
                        participant[conceptId.state] = state;
                        participant[conceptId.zip] = zipCode;
                        participant[conceptId.isPOBox] = conceptId.no;
                        
                        renderRequestAKitDisplay(participant);
                        // renderUpdateAddressSuccess();
                    }
                }
            );
        } else if (!hasError) {

            if (uspsSuggestion.suggestion) {
                showMailAddressSuggestion(
                    uspsSuggestion,
                    'event.addressSuggestionDescriptionPhysical',
                    async (streetAddress, secondaryAddress, city, state, zipCode, isValidatedByUSPSSelectionModal) => {
                        const success = await submitNewAddress(
                            streetAddress,
                            secondaryAddress,
                            city,
                            state,
                            zipCode,
                            isValidatedByUSPSSelectionModal
                        );
                        if (success) {
                            participant[conceptId.address1] = streetAddress;
                            if (secondaryAddress) {
                                participant[conceptId.address2] = secondaryAddress;
                            }
                            participant[conceptId.city] = city;
                            participant[conceptId.state] = state;
                            participant[conceptId.zip] = zipCode;
                            participant[conceptId.isPOBox] = conceptId.no;
                            
                            renderRequestAKitDisplay(participant);
                            // renderUpdateAddressSuccess();
                        }
                    }
                );
            } else {
                const success = await submitNewAddress(addressLine1, addressLine2, city, state, zip, isValidatedByUSPSApi);
                if (success) {
                    participant[conceptId.address1] = addressLine1;
                    if (addressLine2) {
                        participant[conceptId.address2] = addressLine2;
                    }
                    participant[conceptId.city] = city;
                    participant[conceptId.state] = state;
                    participant[conceptId.zip] = zip;
                    participant[conceptId.isPOBox] = conceptId.no;
                    renderRequestAKitDisplay(participant);
                    // renderUpdateAddressSuccess();
                }
            }
        }
    });
}

const bindCancelAddressUpdateBtn = (participant) => {
    const cancelAddressUpdateBtn = document.getElementById('cancelAddressUpdate');
    cancelAddressUpdateBtn && cancelAddressUpdateBtn.addEventListener('click', () => {
        renderRequestAKitDisplay(participant);
        bindAddPhysicalAddressBtn(participant);
        bindUpdateMailingAddressBtn(participant);
        bindUpdatePhysicalAddressBtn(participant);
    });
}

const bindEvents = (participant) => {
    bindRequestKitButton(participant);
    bindAddPhysicalAddressBtn(participant);
    bindUpdateMailingAddressBtn(participant);
    bindUpdatePhysicalAddressBtn(participant);

    bindUpdatePAddressBtn(participant);
    bindUpdateMAddressBtn(participant);

    bindCancelAddressUpdateBtn(participant);
}

const renderUpdateAddressSuccess = (addressType) => {
    const div = document.getElementById('mailingAddressSuccess2');
    if (!div) {
        return;
    }

    div.innerHTML = translateHTML(`<div class="callout callout-success">
            <div data-i18n="samples.requestAKit.addressUpdateSuccess">You have successfully updated your physical address and selected this address to receive your kit.</div>
            <div data-i18n="samples.requestAKit.addressUpdateEditInfo">Your new physical address can be found and edited on your <a href="#myprofile">Profile</a> page.</div>
        </div>`);
}

const renderAddPhysicalAddressInfo = (displayPOBoxInfo, displayIntlAddrInfo) => {

    return translateHTML(`
        <div class="modal fade" id="addPhysicalAddressInfo" tabindex="-1" aria-labelledby="addPhysicalAddressInfoLabel">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header"></div>
                    <div class="modal-body">
                        <div><span data-i18n="samples.requestAKit.pleaseNote" class="fw-bold">Please note:</span> <span data-i18n="samples.requestAKit.addPhysicalAddressExplanation">adding a physical address means that your kit will arrive there.</span>
                        ${displayIntlAddrInfo ? `<span data-i18n="samples.requestAKit.editMailingToNonIntlBox">If you want to edit your mailing address to a non-international address, your kit will ship to your mailing address.</span>` : 
                            displayPOBoxInfo ? `<span data-i18n="samples.requestAKit.editMailingToNonPOBox">If you want to edit your mailing address to a non-P.O. Box address, your kit will ship to your mailing address.</span>` : ''
                        }
                        </div>
                    </div>
                    <div class="modal-footer" style="justify-content: flex-start">
                        <button type="button" class="btn btn-primary" id="continueToAddPAddress" data-i18n="samples.requestAKit.continueButton" data-bs-dismiss="modal">Continue</button>
                        <button type="button" class="btn btn-outline-primary" id="closeAddPAddressConfirm" data-i18n="samples.requestAKit.goBackButton" data-bs-dismiss="modal">Go Back</button>
                    </div>
                </div>
            </div>
        </div>
        `);
}

export const showMailAddressConfirmation = (address, i18nTranslation, submit) => {
  const modalElement = document.getElementById("connectMainModal");
  let modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

    // TODO: Need to refactor
    const closeModal = () => {
        const instance = bootstrap.Modal.getInstance(modalElement);
        if (instance) instance.hide();
    };
   document.getElementById("connectModalHeader").innerHTML = translateHTML(`
        <h2 style="color: #333;" data-i18n="event.addressSuggestionTitle">Address Verification</h2>
    `);

  document.getElementById("connectModalBody").innerHTML = translateHTML(`
        <div style="margin-bottom: 20px;" data-i18n="${i18nTranslation}">
            We can’t verify your address with the USPS. Please confirm the address you entered is correct below or click the Go Back button to enter a different address.
        </div>
        <div style="display: flex; gap: 20px; margin-left: 25%; margin-right: 25%">
            <div style="flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                <div style="margin-bottom: 15px;">
                    ${escapeHTML(address.streetAddress)} ${escapeHTML(address.secondaryAddress)} <br>
                    ${escapeHTML(address.city)} ${escapeHTML(address.state)} ${escapeHTML(address.zipCode)} 
                </div>
                <button style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%;" id="addressKeepButton" data-i18n="event.addressSuggestionKeepButton">Keep address I entered</button>
            </div>
        </div>
    `);

  document.getElementById("connectModalFooter").innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Go Back" class="btn btn-dark" id="goBackButton">Go Back</button>
        </div>
    `);

  modalInstance.show();

  document.getElementById("addressKeepButton").addEventListener("click", async () => {
    const { streetAddress, secondaryAddress, city, state, zipCode } = address;
    await submit(streetAddress, secondaryAddress, city, state, zipCode);
    closeModal();
  });

  // Delay the 'goBackButton' since it's rendered dynamically
  setTimeout(() => {
    const goBackButton = document.getElementById("goBackButton");
    if (goBackButton) {
      goBackButton.addEventListener("click", () => {
        closeModal();
      });
    }
  }, 100);
};

export const showMailAddressSuggestion = (uspsSuggestion, i18nTranslation, submit) => {
  const modalElement = document.getElementById("connectMainModal");
  let modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

  // TODO: Need to refactor
  const closeModal = () => {
    const instance = bootstrap.Modal.getInstance(modalElement);
    if (instance) instance.hide();
  };

  document.getElementById("connectModalHeader").innerHTML = translateHTML(`
        <h2 style="color: #333;" data-i18n="event.addressSuggestionTitle">Address Verification</h2>
    `);

  document.getElementById("connectModalBody").innerHTML = translateHTML(`
        <div style="margin-bottom: 20px;" data-i18n="${i18nTranslation}">
            We can’t verify your address but found a close match. Please confirm the correct address or enter a different address.
        </div>
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                <div style="margin-bottom: 15px;">
                    ${uspsSuggestion.original.streetAddress} ${uspsSuggestion.original.secondaryAddress} <br>
                    ${uspsSuggestion.original.city} ${uspsSuggestion.original.state} ${uspsSuggestion.original.zipCode} 
                </div>
                <button style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%;" id="addressSuggestionKeepButton" data-i18n="event.addressSuggestionKeepButton">Keep address I entered</button>
            </div>
            <div style="flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                <div style="margin-bottom: 15px;">
                    ${uspsSuggestion.suggestion.streetAddress} ${uspsSuggestion.suggestion.secondaryAddress}<br>
                    ${uspsSuggestion.suggestion.city} ${uspsSuggestion.suggestion.state} ${uspsSuggestion.suggestion.zipCode} 
                </div>
                <button style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%;" id="addressSuggestionUseButton" data-i18n="event.addressSuggestionUseButton">Use suggested address</button>
            </div>
        </div>
    `);

  document.getElementById("connectModalFooter").innerHTML = translateHTML(`
        <div class="d-flex justify-content-between w-100">
            <button data-i18n="event.navButtonsClose" type="button" title="Go Back" class="btn btn-dark" id="goBackButton">Go Back</button>
        </div>
    `);

  modalInstance.show();

  document.getElementById("addressSuggestionKeepButton").addEventListener("click", async () => {
    const { streetAddress, secondaryAddress, city, state, zipCode } = uspsSuggestion.original;
    await submit(streetAddress, secondaryAddress, city, state, zipCode, false);
    closeModal();
  });

  document.getElementById("addressSuggestionUseButton").addEventListener("click", async () => {
    const isValidatedByUSPSSelectionModal = !(uspsSuggestion?.warnings?.length);
    const { streetAddress, secondaryAddress, city, state, zipCode } = uspsSuggestion.suggestion;
    await submit(streetAddress, secondaryAddress, city, state, zipCode, isValidatedByUSPSSelectionModal);
    closeModal();
  });

  // Delay the 'goBackButton' since it's rendered dynamically
  setTimeout(() => {
    const goBackButton = document.getElementById("goBackButton");
    if (goBackButton) {
      goBackButton.addEventListener("click", () => {
        closeModal();
      });
    }
  }, 100);
};

const getSampleDateTime = (participant, biospecimenFlag, researchDateTime, clinicalDateTime) => {
    let biospecimenSampleDateTime = ``;
    
    (participant[conceptId.collectionDetails] &&
        
         (participant[conceptId.collectionDetails][conceptId.baseline][biospecimenFlag]) === (conceptId.biospecimenResearch) ?  
            (   
                biospecimenSampleDateTime += participant[conceptId.collectionDetails][conceptId.baseline][researchDateTime]
            ) : 
        (participant[conceptId.collectionDetails][conceptId.baseline][biospecimenFlag]) === (conceptId.biospecimenClinical) ?
            (
                biospecimenSampleDateTime += participant[conceptId.collectionDetails][conceptId.baseline][clinicalDateTime]
            ) : ``
    )   
    return biospecimenSampleDateTime;
}

const getMouthWashSample = (participant, path, itemName) => {
    // Initial kits have some specific behavior vs. replacement kits
    const isInitialKit = path === conceptId.bioKitMouthwash;
    const homeMouthwashData =
        participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[path] || {};
    const collectionTime =
        (
            homeMouthwashData[conceptId.kitType] === conceptId.kitTypeValues.homeMouthwash || !isInitialKit ?
                // Home collection kits, including all replacement kits, use kit received time
                participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[path]?.[conceptId.kitReceivedTime] :
                // Research kits (initial kits with appropriate kit type) use kit collection time
                participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.mouthwashDateTime]
        )
        || "";

    const kitStatusCid = homeMouthwashData[conceptId.kitStatus];
    const isCollected = homeMouthwashData[conceptId.kitType] === conceptId.kitTypeValues.homeMouthwash ?
        kitStatusCid === conceptId.kitStatusValues.received :
        // Only initial kits can be research; replacement kits are by definition home collections,
        // so the participant result here only applies to initial kits
        participant[conceptId.mouthwash] === conceptId.yes && path === conceptId.bioKitMouthwash;

    return isCollected ? {type: itemName, date: collectionTime} : null;
}

const health_partners = {
    concept: '531629870',
    name: 'HealthPartners',
    donatingSamples: '<span data-i18n="samples.health_partners.donatingSamples">As a part of your Connect participation, we ask you to donate blood, urine, and saliva samples and complete a short survey related to the samples we are collecting.',
    whenToDonate: '<span data-i18n="samples.health_partners.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.',
    howToDonate: '<span data-i18n="samples.health_partners.howToDonate">Connect participants at HealthPartners have two options for donating samples. You can choose the most convenient option for you. There are no co-pays or charges associated with donating samples for Connect.<br><br><span class="site-info-bold">Option 1:</span> Make an appointment to come into our Connect research location, the Park Nicollet Clinic and Specialty Center, to donate your samples.<br><br><span class="site-info-bold">Option 2:</span> Make an appointment to come into one of the HealthPartners or Park Nicollet clinical collection locations.<br><br>When it is time to donate your samples, we will send you an email with a link for more information. If you are interested in donating samples at the Connect research location, simply click the link to schedule a time that works for you. If you prefer to donate samples at one of our HealthPartners clinical collection locations, please call the Connect team at HealthPartners at 952-967-5067.  The table below includes more information about these options.<br><br><table border="1" style="width: 100`%;"><tr><th class="site-info-align" style="width: 50%;"><span class="site-info-bold">Option 1: Connect Research Location</span><br><i>Park Nicollet Clinic and Specialty Center, St. Louis Park</i>  </th><th style="width: 50%;"><span class="site-info-bold">Option 2: HealthPartners Clinical Collection Locations </span><br><i>HealthPartners Riverway Clinic Elk River and <br>Park Nicollet Clinic Chanhassen and Park Nicollet Clinic Minneapolis </i><br><br></th></tr><tr><td style="width: 50%;">Connect team will greet you and walk you through your visit.</td><td style="width: 50%;">HealthPartners clinical lab staff will collect your Connect samples.</td></tr><tr><td style="width: 50%;">The team will draw blood, collect urine, and collect a saliva sample by asking you to swish with mouthwash.<br><br>You will also complete a survey related to the samples we are collecting in MyConnect using your mobile phone. If you do not have a mobile phone, we will provide you with a tablet to complete your survey. You will need your MyConnect login information to complete the survey.</td><td style="width: 50%;">Lab staff will collect blood and urine samples at your visit. You can donate Connect samples and complete any labs ordered by your provider in the same visit. <br><br>Within 48 hours of your sample donation, you will receive an email with a link to a survey to complete on MyConnect. The survey is related to the samples that we collected. <br><br> The Connect team will send you a mouthwash collection kit with instructions to complete your saliva sample at home.</td></tr><tr><td style="width: 50%;">When you receive the scheduling email from the Connect team, please use the link included to schedule an appointment to donate your samples at a time that is convenient for you. You may also call the Connect team at 952-967-5357 if you would prefer to schedule your appointment over the phone.</td><td style="width: 50%;">To schedule at one of these locations, please call our team at 952-967-5357 after you receive the scheduling email from the Connect team.</td></tr></table><br>For questions, please contact the Connect team at HealthPartners at 952-967-5357 or ConnectStudy@healthpartners.com.',
    scheduling: '',
    howLong: '<span data-i18n="samples.health_partners.howLong"><span class="site-info-bold">Connect Research Location:</span><br><br>Please expect to spend about 30 minutes at your appointment to donate your samples. During your appointment, we will ask you to complete a short survey related to the samples we are collecting.<br><br><span class="site-info-bold">Connect Clinical Collection Location:</span><br><br>Please expect to spend about 10-15 minutes at your appointment to donate your blood and urine samples.',
    prepareInstructions: '<span data-i18n="samples.health_partners.prepareInstructions"><span class="site-info-bold">Connect Research Location:</span><br><br>On the day of your appointment, please drink plenty of water, but <span class="site-info-bold">stop drinking water one hour before your appointment.</span><br><br><span class="site-info-bold">One hour before your appointment:</span> Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please bring a valid government-issued photo ID, such as a driver\'s license.</li><li>Make sure you know your login information for your <a href="https://myconnect.cancer.gov">MyConnect account.</a><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:</li><ul><li>The last time you ate or drank, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul><br><span class="site-info-bold">Connect Clinical Collection Locations:</span><br><br>On the day of your appointment, you do not need to fast. Please drink plenty of water to keep hydrated.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please bring a valid government-issued photo ID, such as a driver\'s license.</li><li>After your appointment:<br><ul><li>Be sure to check your email for a link to a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so it is important to complete it as soon as you can.</li><li>We will email you when we ship your mouthwash home collection kit. Please use this kit and included instructions to collect your mouthwash sample at home.</li></ul></li></ul>',
    payment: '<span data-i18n="samples.health_partners.payment">You will receive your $25 e-gift card  after you donate a blood sample and complete <span class="site-info-bold">all four sections</span> of your first Connect survey.<br><br>You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<ol><li>Background and Overall Health</li><li>Medications, Reproductive Health, Exercise, and Sleep</li><li>Smoking, Alcohol, and Sun Exposure</li><li>Where you Live and Work</li></ol></span>',
    support: '<span data-i18n="samples.health_partners.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)',
    locations: [
        [
            '<span data-i18n="samples.health_partners.locations.NicolletClinicName">Park Nicollet Clinic and Specialty Center</span>',
            '<span data-i18n="samples.health_partners.locations.NicolletClinicAddress">3850 Park Nicollet Blvd Suite 160<br>St Louis Park, MN 55416<br><br>Upon entering the building, follow the 3850 building signage and go to Suite 160, which is located behind the laboratory waiting room. Walk through door number 2 and check in at the front desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.NicolletClinicParking">Parking at the Park Nicollet Clinic and Specialty Center is free in the visitor parking ramp. <br><br><div class="messagesHeaderFont">Scheduling Information</div><br>You can self-schedule using the link included in the scheduling email sent from the Connect team. For questions or to schedule over the phone, please call 952-967-5067.</span>'
        ],
        [
            '<span data-i18n="samples.health_partners.locations.RiverwayElkName">HealthPartners Riverway Clinic Elk River</span>',
            '<span data-i18n="samples.health_partners.locations.RiverwayElkAddress">530 3rd St NW<br>Elk River, MN 55330<br><br>Upon arrival, proceed past the main check in desk and go directly to the lab check in desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.RiverwayElkParking">Parking is free in the Elk River Clinic parking lot.<br><br><div class="messagesHeaderFont">Scheduling Information</div><br>Self-scheduling is not currently available for the Elk River location. For questions and scheduling, please call 952-967-5067</span>'
        ],
        [
            '<span data-i18n="samples.health_partners.locations.NicolletName">Park Nicollet Clinic Chanhassen</span>',
            '<span data-i18n="samples.health_partners.locations.NicolletAddress">300 Lake Dr E<br>Chanhassen, MN 55317 <br><br>Upon arrival, please take the stairs or elevator to the 2nd floor and check in for your appointment at the lab check in desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.NicolletParking">Parking is free in the Chanhassen Clinic parking lot.<br><br><div class="messagesHeaderFont">Scheduling Information</div><br>Self-scheduling is not currently available for the Chanhassen location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.NicolletMinneapolisName">Park Nicollet Clinic Minneapolis</span>',
            '<span data-i18n="samples.health_partners.locations.NicolletMinneapolisAddress">2001 Blaisdell Ave <br>Minneapolis, MN 55404 <br><br>Upon entering the building, go to the left and take the stairs or elevator down to the lower-level lobby. In the lower-level lobby, please check in at the laboratory front desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.NicolletMinneapolisParking">Parking is free and available at the front entrance or across the street.<br><br><div class="messagesHeaderFont">Scheduling Information</div><br>Self-scheduling is not currently available for the Minneapolis location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.BrooklynCenterName">HealthPartners Clinic Brooklyn Center</span>',
            '<span data-i18n="samples.health_partners.locations.BrooklynCenterAddress">6845 Lee Ave N <br>Brooklyn Center, MN 55429 <br><br> Upon entering the building, go down the hallway located on the right side of the building and follow the sign that says “Lab”. On your left, please check in at the laboratory front desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.BrooklynCenterParking">"Free parking is available on-site at the front of the building.<br><br><div class=\"messagesSubHeader\">Scheduling Information</div><br>Self-scheduling is not currently available for the Brooklyn Center location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.ClinicalStillwaterName">HealthPartners Clinic Stillwater</span>',
            '<span data-i18n="samples.health_partners.locations.ClinicalStillwaterAddress">1500 Curve Crest Blvd<br>Stillwater, MN 55082 <br><br>Enter through “Entrance 1 – TRIA entrance”. Upon entering the building, please check in at the front desk of the clinic. You will be handed a lab slip to then check in at the lab desk to your right down the hall.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.ClinicalStillwaterParking">"Free parking is available on-site at the front of the building.<br><br><div class="messagesSubHeader">Scheduling Information</div><br>Self-scheduling is not currently available for the Stillwater location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.NewRichmondClinicName">New Richmond Clinic, Westfields Hospital & Clinic</span>',
            '<span data-i18n="samples.health_partners.locations.NewRichmondClinicAddress">535 Hospital Rd<br>New Richmond, WI 54017 <br><br>Upon entering the building by the rotunda entrance, check in with the information desk. Ask for the “Connect Study at the Clinic lab and you will be guided through the double doors to your right to check in at the \"clinic lab\".</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.NewRichmondClinicParking">"Free parking is available on-site at the front of the building.<br><br><div class="messagesSubHeader">Scheduling Information</div><br>Self-scheduling is not currently available for the New Richmond location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.ClinicStPaulWabashaName">HealthPartners Clinic St. Paul (Wabasha)</span>',
            '<span data-i18n="samples.health_partners.locations.ClinicalStPaulWabashaAddress">205 Wabasha St S <br> St Paul, MN 55107 <br><br> Upon arrival, enter the clinic main doors and turn left. Walk past the main clinic greet station and follow signs to the lab greet station, which is located on the main floor of the clinic.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.ClinicalStPaulWabashaParking">"Free parking is available on-site at the front of the building.<br><br><div class=\"messagesSubHeader\">Scheduling Information</div> Self-scheduling is not currently available for the St. Paul (Wabasha) location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.NicolletBurnsvilleName">Park Nicollet Clinic and Specialty Center, Burnsville</span>',
            '<span data-i18n="samples.health_partners.locations.NicolletBurnsvilleAddress">14000 Fairview Dr<br>Burnsville, MN 55337 <br><br>Upon entering the 14050 building, follow the 14000 building signage until you come to the elevators or stairs. The lab is on the second floor.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.NicolletBurnsvilleParking">Parking at the Park Nicollet Specialty Center is free in the visitor parking ramp.<br><br><div class=\"messagesSubHeader\">Scheduling Information</div>Self-scheduling is not currently available for the Burnsville location. For questions and scheduling, please call 952-967-5067.</span>',
        ],
        [
            '<span data-i18n="samples.health_partners.locations.RiverwayAndoverName">HealthPartners Riverway Clinic Andover</span>',
            '<span data-i18n="samples.health_partners.locations.RiverwayAndoverAddress">15245 Bluebird St NW <br> Andover, MN 55304 <br><br>Upon arrival, enter the clinic’s main doors and check in at the clinic front desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.RiverwayAndoverParking">Parking is free and available in the front of the clinic.<br><br><div class=\"messagesSubHeader\">Scheduling Information</div>Self-scheduling is not currently available for the Andover location. For questions and scheduling, please call 952-967-5067.</span>',
        ]
    ]
};

const sanford = {
    concept: '657167265',
    name: 'Sanford',
    donatingSamples: '<span data-i18n="samples.sanford.donatingSamples">As part of Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.sanford.whenToDonate">The Connect team will send a MyChart message when it is time to donate your samples. If you do not have a MyChart account, we will send you an email. Be sure to check your spam or junk folder. After you receive the MyChart message or email, it is important to donate your samples as soon as you can.<br><br><span style="font-weight:900; text-decoration:underline">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonate: '<span data-i18n="samples.sanford.howToDonate">Connect participants at Sanford Health have two options for donating samples. You can choose the most convenient option for you.<br><br> Option 1: Sanford Health Lab Location <br><br> Once you receive our message, you may walk in to donate samples at any participating <span class="site-info-bold">Sanford Health Lab Location</span> during normal hours of operation*. <span class="site-info-bold">You do not need to schedule an appointment</span>. You are welcome to donate your samples for Connect at the same time as any prescheduled medical appointments to save you a trip to the lab. <br><br> <span style="font-weight:900; text-decoration:underline">*Note:</span>  If you live in the Bismarck region, the Sanford lab team prefers you pre-schedule an appointment. You can do this within your MyChart or by calling the lab directly.<br><br> Option 2: Connect Research Lab <br><br>  <span class="site-info-bold">Make an appointment</span> to come into one of our <span class="site-info-bold">Connect Research Labs</span> to donate your samples. <br><br> The table below includes more information about these options. <br><br>' +
        '<table style="border: 1px solid">' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; text-align: center"></td>' +
        '<td style="border: 1px solid; text-align: center">Option 1: Sanford Health Lab Location </td>' +
        '<td style="border: 1px solid; text-align: center">Option 2: Connect Research Lab </td>' +
        '</tr>' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; text-align: center">Will I see a Connect staff member at the clinic?</td>' +
        '<td style="border: 1px solid; text-align: center">No</td>' +
        '<td style="border: 1px solid; text-align: center">Yes</td>' +
        '</tr>' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; text-align: center">Connect samples collected </td>' +
        '<td style="border: 1px solid; text-align: center">Blood <br> Urine <br> Mouthwash home collection kit <br> mailed to you to complete your saliva sample at home </td>' + 
        '<td style="border: 1px solid; text-align: center">Blood<br>Urine<br>Saliva</td>' +
        '</tr>' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; text-align: center">Do I need to schedule an appointment ahead of time?</td>' +
        '<td style="border: 1px solid; text-align: center">Fargo, Sioux Falls, and Bemidji regions: No <br><br>Bismarck region: Preferred, but not required</td>' +
        '<td style="border: 1px solid; text-align: center">Yes</td>' +
        '</tr>' +
        '</table>' +
        '</span>',
    scheduling: '<span data-i18n="samples.sanford.scheduling">We will send scheduling information through your MyChart or by email.<br><br>For questions, please call 605-312-6100 or email <a href="mailto: connectstudy@sanfordhealth.org">ConnectStudy@sanfordhealth.org</a>.</span>',
    howLong: '<span data-i18n="samples.sanford.howLong">Option 1: Sanford Health Lab Location<br><br> Wait times to donate samples may vary by location. You may walk in any time the lab is open; however, please note that walking in outside of normal business hours (Monday – Friday 8:00am to 5:00pm) may lead to longer wait times.<br><br> Please expect to spend about 10-15 minutes at your visit to donate your blood and urine samples. <br><br> Option 2: Connect Research Lab<br><br> Please expect to spend about 30 minutes at your appointment to donate your samples and complete a short survey.  </span>',
    prepareInstructions: '<span data-i18n="samples.sanford.prepareInstructions">Option 1: Sanford Health Lab Location <br><br> On the day of your appointment, you do not need to fast. Please drink plenty of water to keep hydrated.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please bring a valid government-issued photo ID, such as a driver\'s license. </li><li>After your appointment: <ul><li>Be sure to check your email for a link to a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so it is important to complete it as soon as you can. </li><li>We will email you when we ship your mouthwash home collection kit. Please use this kit and included instructions to collect your mouthwash sample at home. </li></ul></li></ul><br> Option 2: Connect Research Lab <br><br> On the day of your appointment, you do not need to fast. <span class="site-info-bold"> One hour before your appointment</span>: Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth. <br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Make sure you know your login information for MyConnect. </li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:  <ul><li>The last time you ate or drank before your appointment, and the times you went to sleep the night before your appointment and woke up on the day of your appointment. </li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.  </li></ul></li></ul></span>',
    whatHappens: '<span data-i18n="samples.sanford.whatHappens">Option 1: Sanford Health Lab Location <br><br> Check in at the registration desk when you arrive. Lab staff will collect blood and urine samples during your visit.<br><br> After your visit, please remember to check your email for a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so please complete it as soon as you can. <br><br> Option 2: Connect Research Lab <br><br> Check in at the registration desk. The registration team will direct you where to go next to get your samples collected. At the end of your visit, the Connect team will check you out of your appointment. <br><br> We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br> We will also ask you to complete a short survey on MyConnect using your mobile phone. You will need your MyConnect login information to complete the survey. If you do not have a mobile phone, we may be able to provide you with a tablet to complete your survey.<br><br> We strongly encourage you to complete your survey at your appointment. If you choose to complete it after you leave your appointment, it is important to do so as soon as possible.</span>',
    payment: '<span data-i18n="samples.sanford.payment">You will receive your $25 gift card  after you donate a blood sample and complete <span class="site-info-bold">all four sections</span> of your first Connect survey.<br><br>You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<ol><li>Background and Overall Health</li><li>Medications, Reproductive Health, Exercise, and Sleep</li><li>Smoking, Alcohol, and Sun Exposure</li><li>Where you Live and Work</li></ol></span>',
    support: '<span data-i18n="samples.sanford.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)</span>',
    locations: [
        [
            '<span data-i18n="samples.sanford.locations.Option1"><span>Option 1: Sanford Health Lab Location</span><br><br><span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; font-weight: 400; line-height: 27px; color: #2E2E2E; margin-top: 20px;"> To find a Sanford Health Lab Location  and its operating hours, please visit <a href="https://www.sanfordhealth.org/locations" target="_blank">https://www.sanfordhealth.org/locations</a> <br><br>  Exact hours may vary by location. Walking in outside of normal business hours may lead to longer wait times. <br><br> Note: If you live in the Bismarck region, the Sanford lab team prefers you pre-schedule an appointment. You can do this within your MyChart or by calling the lab directly.</span> </span>',
            '',
            '',
            ''
        ],
        [
            '<span data-i18n="samples.sanford.locations.Option2"><span>Option 2: Connect Research Lab</span> <br><br> <span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; font-weight: 400; color: #2E2E2E; margin-top: 20px;">Use the link in the message we send to your MyChart or email to schedule an appointment at one of the below locations. You may also schedule an appointment by calling the Connect team at 605-312-6100. <br><br>  Connect Research Lab appointments are available Monday – Thursday 7:00am – 4:00pm and Friday 7:00am – 2:00pm. If you would like to schedule outside of these hours, please contact the Connect team at 605-312-6100 or ConnectStudy@sanfordhealth.org. <span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; line-height: 27px; color: #2E2E2E; margin-top: 20px;"></span></span> </span>',
            '',
            '',
            ''
        ],
        [
            '<span data-i18n="samples.sanford.locations.SiouxFallsName">Sioux Falls, SD: Edith Sanford Breast Center</span>',
            '<span data-i18n="samples.sanford.locations.SiouxFallsAddress">1210 W. 18th St.<br>Sioux Falls, SD 57104<br><i>Enter through door BB</i></span>',
            '',
            '<span data-i18n="samples.sanford.locations.SiouxFallsParking">Free valet parking is available near the front entrance of the Edith Sanford Breast Center. Free patient parking is also available in the lot on the corner of S Grange Ave and W 18th Street. Enter through door BB. No parking validation is needed.</span>'
        ],
        [
            '<span data-i18n="samples.sanford.locations.FargoName">Fargo, ND: Sanford Amber Valley</span>',
            '<span data-i18n="samples.sanford.locations.FargoAddress">4840 23<sup>rd</sup> Ave S<br>Fargo, ND 58104<br><i>Enter through door 4840. Upon entering, follow the signs to “Sanford Research” on Floor 2.</i></span>',
            '',
            '<span data-i18n="samples.sanford.locations.FargoParking">Free patient parking is available in the lot near door 4840. No parking validation needed.</span>',
        ],
        [
            '<span data-i18n="samples.sanford.locations.BemidjiName">Bemidji, MN: 1705 Anne St Clinic (Audiology)</span>',
            '<span data-i18n="samples.sanford.locations.BemidjiAddress">1705 Anne St N.W.<br>Bemidji, MN 56601<br><i>Enter through door 1 of the Audiology building.</i></span>',
            '',
            '<span data-i18n="samples.sanford.locations.BemidjiParking">Free patient parking is available in front of the Audiology building. No parking validation is needed.</span>'
        ]
      ]
};

const marshfield = {
    concept: '303349821',
    name: 'Marshfield',
    donatingSamples: '<span data-i18n="samples.marshfield.donatingSamples">As part of Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.marshfield.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonate: '<span data-i18n="samples.marshfield.howToDonate">The email we send you will contain a link to schedule an appointment. Simply click the link to schedule a time that is convenient for you to donate your samples. You can also call Marshfield Clinic Research Institute at 715-898-9444 to schedule an appointment, or a Connect team member will call you to schedule an appointment to donate your samples at a time that is convenient for you.</span>',
    scheduling: '<span data-i18n="samples.marshfield.scheduling">For questions and scheduling please call: 715-898-9444 or email <a href="mailto: connectstudy@marshfieldresearch.org">connectstudy@marshfieldresearch.org</a>.</span>',
    howLong: '<span data-i18n="samples.marshfield.howLong">Please expect to spend an average of one hour at your appointment to donate your samples and complete a short survey.</span>',
    prepareInstructions: '<span data-i18n="samples.marshfield.prepareInstructions">On the day of your appointment, please drink plenty of water, but <span style="font-weight:900; text-decoration:underline">stop drinking water one hour before your appointment.</span><br><br><span style="font-weight:900; text-decoration:underline">One hour before your appointment:</span> Please <span style="font-weight:900; text-decoration:underline">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span style="font-weight:900; text-decoration:underline">Things to bring and remember:</span><br><br><ul><li>Make sure you know your login information for MyConnect.</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:<ul><li>The last time you ate or drank, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul></span>',
    whatHappens: '<span data-i18n="samples.marshfield.whatHappens">The Connect team will check you in for your appointment and then collect your samples. At the end of your visit, the Connect team will check you out of your appointment.<br><br>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br>We will also ask you to complete <span style="font-weight:900; text-decoration:underline">a short survey</span> on MyConnect using your mobile phone. If you do not have a mobile phone, we will provide a tablet for you to use complete your survey. You will need your MyConnect login information to complete the survey.</span>',
    support: '<span data-i18n="samples.marshfield.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)</span>',
    parkingInstructions: `<span data-i18n="freeParkingAllCenters"></span>`,
    locations: [
        [
            '<span data-i18n="samples.marshfield.locations.MarshfieldName">Marshfield Clinic, Marshfield Center</span>',
            '<span data-i18n="samples.marshfield.locations.MarshfieldAddress">1000 N. Oak Ave<br>Marshfield, WI 54449</span>',
        ],
        [
            '<span data-i18n="samples.marshfield.locations.LakeHallieName">Lake Hallie Center</span>',
            '<span data-i18n="samples.marshfield.locations.LakeHallieAddress">12961 27th Ave<br>Chippewa Falls, WI 54729</span>',
        ],
        [
            '<span data-i18n="samples.marshfield.locations.MinocquaName">Minocqua Center</span>',
            '<span data-i18n="samples.marshfield.locations.MinocquaAddress">9576 WI-70 Trunk<br>Minocqua, WI 54548</span>',
        ],
        [
            '<span data-i18n="samples.marshfield.locations.RiceLakeName"></span>',
            '<span data-i18n="samples.marshfield.locations.RiceLakeAddress"></span>',
        ],
        [
            '<span data-i18n="samples.marshfield.locations.StevensPointName"></span>',
            '<span data-i18n="samples.marshfield.locations.StevensPointAddress"></span>',
        ],
        [
            '<span data-i18n="samples.marshfield.locations.WestonName">Weston Center</span>',
            '<span data-i18n="samples.marshfield.locations.WestonAddress">3400 Ministry Pkwy<br>Weston, WI 54476</span>',
        ],
        [
            '<span data-i18n="samples.marshfield.locations.WisconsinRapidsName">Wisconsin Rapids Center</span>',
            '<span data-i18n="samples.marshfield.locations.WisconsinRapidsAddress">220 24th St S <br>Wisconsin Rapids, WI 54494</span>',
        ]
    ],
};

const henry_ford = {
    concept: '548392715',
    name: 'Henry Ford Health',
    donatingSamples: '<span data-i18n="samples.henry_ford.donatingSamples">Thank you for being part of the Connect for Cancer Prevention Study. As part of the study, we ask you to donate blood, urine, and mouthwash samples and complete two short surveys.</span>',
    whenToDonateHeader: '<span data-i18n="samples.henry_ford.whenToDonateHeader">When Should I Donate My Samples?</span>',
    whenToDonate: '<span data-i18n="samples.henry_ford.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Important Notes:</span><br><br><ol><li> If you have had a blood transfusion or donated blood recently:<br> Please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect.</li><br><li> If you have recently donated plasma:<br> Please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect.</li><br><li>If you have recently donated platelets:<br>Please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect.</li><br><li> If you have an upcoming colonoscopy:<br> Please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</li></ol></span>',
    howToDonateHeader: '<span data-i18n="samples.henry_ford.howToDonateHeader">How Do I Donate My Blood and Urine Samples?</span>',
    howToDonate: '<p data-i18n="samples.henry_ford.howToDonate"> After you receive notification that we placed your Connect lab order, please visit any HFH Lab Services location listed in the "Where Do I Donate My Samples" section below. We are not able to collect samples for Connect at other HFH locations not currently listed, or outside of HFH (like LabCorp or Quest).' 
        + '<br><br> You can donate Connect samples and complete any labs ordered by your provider in the same visit. You do not need an appointment.' 
        + '<br><br> You do not need to fast before you donate samples for Connect, so you may eat and drink before your visit.</p>',
    howLong: '<span data-i18n="samples.henry_ford.howLong">'
        +       '<br>Wait times to donate samples may vary by location. To better serve HFH patients, Henry Ford Lab Services have started using “Save My Spot".'
        +       '<br><br><span class="site-info-bold">“Save My Spot"</span> is an optional service to reserve your spot in line at one of the participating HFH locations (see table of locations above). All lab orders must be placed before using “Save My Spot,” including your lab order for Connect.'
        +       '<br><br>To use this optional service, click this link only after receiving order confirmation from Connect staff: <a href= "https://www.henryford.com/locations/henry-ford-hospital/lab-services">https://www.henryford.com/locations/henry-ford-hospital/lab-services</a>'
        +    '</span>',
    whatHappensDuring: '<span data-i18n="samples.henry_ford.whatHappensDuring">Donating your research blood and urine samples is just like providing samples requested by your health care provider. When you arrive at the clinic, you may go directly to the lab and check in with front desk staff. When it is your turn, the lab will call you back and collect your samples. The lab techs will be able to see your blood and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.henry_ford.whatHappensAfter"> Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions such as:'
        +             '<br><br>'
        +             '<ul style="margin: 0; padding-left: 2.5rem;">'
        +               '<li>The last time you ate or drank before your lab visit, the time you went to sleep the night before your lab visit, and the time you woke up on the day or your visit. </li>'
        +               '<li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li>'
        +              '</ul>'
        +              '<br>'
        +              'When you receive our email, it is important that you complete the survey as soon as possible.'
        +              '</span>',
    howToDonateMouthwash: '<span data-i18n="samples.henry_ford.howToDonateMouthwash">'
        +    'We will send you an email as soon as your mouthwash home collection kit is on the way. Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items needed to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.'
        +    '<br><br>'
        +    'When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect. It is important to complete this survey on the same day that you collect your mouthwash sample.'
        +    '</span>',
    prepareInstructions: '<span data-i18n="samples.henry_ford.prepareInstructions">On the day of your visit to donate samples for Connect, you do not need to fast unless told to do so by your provider for any other lab work they’ve ordered. We request you drink plenty of water to keep hydrated but <span class="site-info-bold">stop drinking water one hour before your visit.</span><br><br><span class="site-info-bold">One hour before your visit:</span> Please <span class="site-info-bold">do not</span> eat, drink, chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span class="site-info-bold">Things to bring and remember:</span> We will ask you to complete a short survey on MyConnect after you donate samples. You will need your login method for MyConnect and a personal device to complete the survey. <br><br>You will be asked questions related to:<ul><li>The last time you ate or drank before your appointment, and the time you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></span>',
    payment: '<span data-i18n="samples.henry_ford.payment">You will receive your $25 gift card after you donate a blood sample and complete <span class="site-info-bold">all four sections</span> of your first Connect survey.<br><br>You can find the four sections of your first survey within the Surveys card on your MyConnect Dashboard. These sections are:<ol><li>Background and Overall Health</li><li>Medications, Reproductive Health, Exercise, and Sleep</li><li>Smoking, Alcohol, and Sun Exposure</li><li>Where you Live and Work</li></ol></span>',
    support: '<span data-i18n="samples.henry_ford.support">Call 855-574-7540 (9:00 a.m. – 7:00 p.m. on weekdays. On weekends and after business hours please leave a message with your name and a good time to call you back).</span>',
    locationNotes: '<span data-i18n="samples.henry_ford.locationNotes">The table below lists the HFH Lab Services locations where you can donate samples for the study.'
        + '<br><br> Please <a href="https://www.henryford.com/locations/search-results?|#services=&locationtype={6892DD84-8634-4F32-A6C0-8DC0F2E45486}&locationname=&&g=0|0" target="_blank" rel="noopener noreferrer">click here</a> to find address, business hours, and parking information for participating HFH Lab Services locations shown in the table below.'
        + '<br><br><table style="width: 100%;border: 1px solid">'
        + '<tr style="border: 1px solid">'
        + '<td style="padding: 10px;vertical-align:top;border: 1px solid; text-align:center;"><span class="site-info-bold">HFH Lab Services Locations</span> </td></tr>'
        + '<tr style="border: 1px solid">'
        +     '<td style="padding: 10px;vertical-align:top;border: 1px solid">'
        +         '<ol style="margin: 0; padding-left: 20px;">'
        +             '<li>HFH Medical Center Brownstown</li>'
        +             '<li>HFH Medical Center Columbus</li>'
        +             '<li>HFH Detroit Main- K1</li>'
        +             '<li>HFH Medical Center Fairlane</li>'
        +             '<li>HFH Medical Center Ford Road</li>'
        +             '<li>HFH Jackson Professional Building (Suite 104)</li>'
        +             '<li>HFH Macomb Hospital</li>'
        +             '<li>HFH Medical Center New Center One</li>'
        +             '<li>HFH Medical Center Plymouth</li>'
        +             '<li>HFH Medical Center Royal Oak</li>'
        +             '<li>HFH Medical Center Sterling Heights</li>'
        +             '<li>HFH Medical Center Troy</li>'
        +             '<li>HFH West Bloomfield Hospital</li>'
        +             '<li>HFH Wyandotte Hospital</li>'
        +         '</ol>'
        +     '</td>'
        + '</tr>'
        + '</table></span>',
    locations: [],
    questionsHeader: '<div data-i18n="samples.henry_ford.questionsHeader">Questions? Contact the Connect Study Team at Henry Ford Health</div>',
    contact: '<a href="mailto: connectstudy@hfhs.org">ConnectStudy@hfhs.org</a>'
};

const u_chicago = {
    concept: '809703864',
    name: 'UChicago Medicine',
    donatingSamples: '<span data-i18n="samples.u_chicago.donatingSamples">As part of  Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    noSamplesCollection: '<span data-i18n="samples.u_chicago.noSamplesCollection">Thank you for being part of Connect! UChicago Medicine is currently not collecting samples from Connect participants. There is nothing you need to do right now. <br><br> We hope to offer Connect participants from UChicago opportunities to donate samples in the future and will let you know when those options become available. <br><br> In the meantime, please check to see if you have any surveys left to complete. <br><br> If you have any questions, please contact our team at the Connect Support Center at MyConnect.cancer.gov/support, <a href=\"mailto:ConnectSupport@NORC.org\">ConnectSupport@NORC.org</a>, or 1-877-505-0253.</p><br><br>We look forward to your continued participation!</span>',
    whenToDonate: '<span data-i18n="samples.u_chicago.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood please wait at least <span class="site-info-bold">eight weeks</span> from your transfusion or donation before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonate: '<span data-i18n="samples.u_chicago.howToDonate">Connect participants at UChicago have two options for donating samples. You can choose the most convenient option for you. For questions and assistance with transportation, please call UChicago at (773) 834-5804 or email Connect@bsd.uchicago.edu.<br><br> <span class="site-info-bold">Option 1:</span> Make an appointment to come into one of our Connect Research Labs to donate your samples.<br><br> <span class="site-info-bold">Option 2:</span> A study team member can request a lab order be placed for you. After you receive the order confirmation email, you can donate samples by visiting a participating UChicago Medicine (UCM) Outpatient Clinical Lab Location during normal hours of operation.<br><br> The table below includes more information about these options.<br><br> ' +
        '<table style="border: 1px solid">' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; padding-left: 10px" class="site-info-bold">Option 1: Connect Research Lab</td>' +
        '<td style="border: 1px solid; padding-left: 10px" class="site-info-bold">Option 2: UCM Outpatient Clinical Lab Location</td>' +
        '</tr>' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; padding-left: 10px">Connect team will greet you and walk you through your visit. </td>' +
        '<td style="border: 1px solid; padding-left: 10px">More hours and more locations, no need to schedule an appointment.</td>' +
        '</tr>' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; padding-left: 10px">The team will draw blood, collect urine, and collect a saliva sample by asking you to swish with mouthwash.  </td>' +
        '<td style="border: 1px solid; padding-left: 10px">Lab staff will collect blood and urine samples at your visit. \n' +
        'We will send a mouthwash collection kit and instructions to you to complete your saliva sample at home.\n</td>' +
        '</tr>' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; padding-left: 10px">Schedule your appointment using the link in the email we send or schedule with Connect staff by calling 773-834-5804.</td>' +
        '<td style="border: 1px solid; padding-left: 10px">Request a lab order using the link in the email we send.  \n' +
        'The order will be placed by Connect staff. <span class="site-info-bold">Please allow up to 48 hours to receive order confirmation via email</span>.  Once you receive the confirmation email, visit a participating UCM Outpatient Clinical Lab Location.\n' +
        'Orders expire after 180 days.\n</td>' +
        '</tr>' +
        '</table></span>',
    howLong: '<span data-i18n="samples.u_chicago.howLong"><span class="site-info-bold">Option 1: UChicago Connect Research Lab Location:</span><br> Please expect to spend about 30-45 minutes at your appointment to donate your samples. During your appointment, we will ask you to complete a short survey related to the samples we collect.<br><br> <span class="site-info-bold">Option 2: UCM Outpatient Clinical Lab  Location:</span><br> Wait times to donate samples may vary by location. Please expect to spend about 10-15 minutes at your appointment to donate your blood and urine samples.</span>',
    prepareInstructions: '<span data-i18n="samples.u_chicago.prepareInstructions">"<span class="site-info-bold">Option 1: UChicago Connect Research Lab Location:</span><br><br>On the day of your visit, you do not need to fast. Please drink plenty of water to keep hydrated, but <span class="site-info-bold">stop drinking water one hour before your visit</span>. Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please remember to bring a valid photo ID that is not expired (driver\'s license, passport, Chicago CityKey, school photo ID, or other photo ID)</li><li>Make sure you know your login information for MyConnect</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:<ul><li>The last time you ate or drank before your appointment, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul> <span class="site-info-bold">Option 2: UCM Outpatient Clinical Lab Location:</span><br><br> On the day of your appointment, you do not need to fast. Please drink plenty of water to keep hydrated.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please remember to bring a valid photo ID that is not expired (driver\'s license, passport, Chicago CityKey, school photo ID, or other photo ID)</li><li>After your appointment:<ul><li>Be sure to check your email for a link to a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so it is important to complete it as soon as you can.</li><li>We will email you when we ship your mouthwash home collection kit. Please use this kit and included instructions to collect your mouthwash sample at home.</li></ul></li></ul></span>',
    whatHappens: '<span data-i18n="samples.u_chicago.whatHappens">"<span class="site-info-bold">Option 1: UChicago Connect Research Lab Location</span><br><br> The research team will check you in for your appointment and then collect your samples. At the end of your visit, the research team will check you out of your appointment.<br><br>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br> <span class="site-info-underline">To save time at your appointment, please complete your first Connect survey on MyConnect before donating samples.</span>If you are not able to complete the survey before your appointment, we will ask you to complete the survey during your appointment.<br><br> We will also ask you to complete a short survey about your samples on MyConnect using your mobile phone. You will need your MyConnect login information to complete the survey. If you do not have a mobile phone, we will provide you with a tablet to complete your survey. We strongly encourage you to complete your survey at your appointment. If you choose to complete it after you leave your appointment, it is important to do so as soon as possible.<br><br> <span class="site-info-bold">Option 2: UCM Outpatient Clinical Services Lab Location</span><br><br> Lab staff will collect blood and urine samples at your visit. You may donate Connect samples and complete any labs ordered by your provider in the same visit. After your visit, please remember to check your email for a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so please complete it as soon as you can.</span>',
    payment: '<span data-i18n="samples.u_chicago.payment"> You will receive your $25 payment after you donate a blood sample and complete all four sections of your first Connect survey.<br><br> You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<br> 1. Background and Overall Health<br>2. Medications, Reproductive Health, Exercise, and Sleep<br>3. Smoking, Alcohol, and Sun Exposure<br>4. Where you Live and Work</span>',
    support: '<span data-i18n="samples.u_chicago.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)</span>',
    locationNotes: '',
    locations: 
    [
        [
            '<span data-i18n="samples.u_chicago.locations.Option1"><span>Option 1: UChicago Connect Research Lab Locations:<br><br></span><span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; line-height: 27px; color: #2E2E2E; margin-top: 20px;">Use the link in the email we send to schedule an appointment at one of the below locations, or schedule an appointment with Connect staff by calling 773-834-5804.</span></span>',
            '',
            '',
            '',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.DuchossoisName" class="site-info-underline">UChicago Duchossois Center for Advanced Medicine (DCAM) Research Clinic in Hyde Park</span>',
            '<span data-i18n="samples.u_chicago.locations.DuchossoisAddress">University of Chicago Medicine <br>Duchossois Center for Advanced Medicine (DCAM) #2A </br>5758 S. Maryland Avenue <br>Chicago, IL 60637</br><br>After entering the DCAM building from the main entrance, look for us at the top of the stairs on the 2nd floor.</br></p></span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.DuchossoisParking">The University of Chicago Medicine offers valet and self-parking. We will validate your parking pass. Please show your self-parking ticket to research staff.</span>',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.IngallsName"><span class="site-info-underline">UChicago Ingalls Memorial Hospital in Harvey, IL</span></span>',
            '<span data-i18n="samples.u_chicago.locations.IngallsAddress">Ingalls Outpatient Center, Suite #212</br>71 W. 156th St.<br>Harvey, IL 60426</br></span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.IngallsParking">Ingalls Memorial Hospital offers free valet and self-parking.</span>',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.Option2"><span>Option 2: UCM Outpatient Clinical Lab Locations:<br><br></span><span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; line-height: 27px; color: #2E2E2E; margin-top: 20px;">You may walk into any of the following lab locations to donate samples for Connect during normal hours of operation (check the links below for location and hour information):</span></span>',
            '',
            '',
            '',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.DuchossoisOutpatientLabsName" class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-duchossois-center-for-advanced-medicine-hyde-park" target="_blank">UChicago, Duchossois Center for Advanced Medicine (DCAM) Outpatient Labs</a></span>',
            '<span data-i18n="samples.u_chicago.locations.DuchossoisOutpatientLabsAddress">University of Chicago Medicine<br> Duchossois Center for Advanced Medicine (DCAM), 3F or 4F<br> 5758 S. Maryland Avenue<br> Chicago, IL 60637<br></span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.DuchossoisOutpatientLabsParking">The University of Chicago Medicine offers valet and self-parking. The outpatient labs are located on both the 3<sup>rd</sup> and 4<sup>th</sup> floors.</span>',            
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.RiverEastName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-river-east" target="_blank">UChicago Medicine River East</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.RiverEastAddress">Located in Lucky Strike Downtown Chicago <br>355 E. Grand Ave <br>Chicago, IL 60611</span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.RiverEastParking">From Lake Shore Drive: Exit at Grand Ave. and proceed west towards McClurg Ct.  An entrance to the parking garage is located past that intersection on your left at 321 E. Grand.<br><br>From the West: Take Illinois St. east towards Columbus Dr. An entrance to the parking garage is located past that intersection on your left at 300 E. Illinois.<br><br>Once inside the parking garage, follow the signs to LL3 (Fall) for designated UChicago Medicine patient parking.  We will validate your parking pass from the parking garage. Please show your self-parking ticket to lab staff. We are unable to validate street parking.</span>',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.SouthLoopName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-south-loop" target="_blank">UChicago Medicine – South Loop, in Downtown Chicago</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.SouthLoopAddress">Southgate Market P1 <br> 1101 S Canal St<br>Chicago, IL 60607</span></span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.SouthLoopParking">The clinic is located on the P1 level next to the DSW. Entrances are located off of Canal St right beside the Panera Bread and on the P1 level of the parking garage. We will validate your parking pass from the parking garage. Please show your self-parking ticket to lab staff. We are unable to validate street parking.</span></span>',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.OrlandParkName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-orland-park" target="_blank">UChicago Medicine Orland Park</a></span></span></span>',
            '<span data-i18n="samples.u_chicago.locations.OrlandParkAddress">14290 S. La Grange Rd.<br> Orland Park, IL 60462</span>',
            '',
            '',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.DearbornName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-dearborn-station" target="_blank">UChicago Medicine Dearborn Station</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.DearbornAddress">47 W. Polk St., Suite G1<br> Chicago, IL 60605</span>',
            '',
            '',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.KenwoodName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-kenwood" target="_blank">UChicago Medicine Kenwood</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.KenwoodAddress">4646 S. Drexel Blvd<br> Chicago, IL 60653</span>',
            '',
            '',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.CrownPointName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-crown-point" target="_blank">UChicago Medicine Crown Point</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.CrownPointAddress">10855 Virginia St<br>Crown Point, IN 46307</span>',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.IngallsMemorialHospitalHarveyName"><span>UChicago Ingalls Memorial Hospital in Harvey, IL</span>',
            '<span data-i18n="samples.u_chicago.locations.IngallsMemorialHospitalHarveyAddress">Ingalls Outpatient Center <br> 1<sup>st</sup> floor <br> 1 Ingalls Dr <br> Harvey, IL 60426</span>',
        ],
    ]
};

const bswh = {
    concept: '472940358',
    name: 'Baylor Scott & White Health (BSWH)',
    donatingSamples: '<span data-i18n="samples.bswh.donatingSamples">As part of Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.bswh.whenToDonate"><p>The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<p/><p> <span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.<p/></span>',
    howToDonate: '<span data-i18n="samples.bswh.howToDonate"><p>Contact the BSWH Connect team at 214-865-2427 or by email at <a href="mailto:ConnectStudy@bswhealth.org">ConnectStudy@bswhealth.org</a> to schedule your appointment.</p></span>',
    prepInstructionsHeader: '<span data-i18n="samples.bswh.prepInstructionsHeader">What Should I Bring to the Visit?</span>',
    prepInstructionsText: '<span data-i18n="samples.bswh.prepInstructionsText"><ul><li>Please bring your Kaiser Permanente member ID card and a picture ID.</li><li>KPNW Infectious Disease and Infection Prevention & Control recommends members, patients, and visitors wear a mask in ambulatory care including labs and hospital settings. </li></ul><span class="site-info-bold-italic">Note: Hand sanitizer will be available for your use.</span></span>',
    whatHappensDuring: '<span data-i18n="samples.bswh.whatHappensDuring">Donating your research blood and urine samples is just like providing a clinical sample requested by your health care provider. When you arrive at the clinic, you may go directly to the lab, get a ticket with a number, and follow the instructions. When it is your turn, the lab staff will call your number and collect your samples similarly to a clinical sample collection for medical care. Tell the lab techs that you are donating samples for NCI Connect. The techs will be able to see your blood draw and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.bswh.whatHappensAfter">Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions, such as:<br></br><ul  style="list-style-type:circle;"><li>The last time you ate or drank before your lab visit, and the times you went to sleep the night before your visit and woke up on the day of your visit.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><span class="site-info-bold-italic">When you receive our email, it is important that you complete the survey as soon as possible.</span></span>',
    howToDonateMouthwash: '<span data-i18n="samples.bswh.howToDonateMouthwash">We will send you an email as soon as your mouthwash home collection kit is on its way.  Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items you need to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.<br></br>When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect. <span class="site-info-bold-italic">It is important to complete this survey on the same day that you collect your mouthwash sample.</span></span>',
    support: '<p><span data-i18n="samples.bswh.support">Call 1-877-505-0253 (8:00 a.m. - 10:00 p.m. CT on weekdays and 9:00 a.m. - 6:00 p.m. CT on weekends).</span></p>',
    locationNotes: `<div data-i18n="samples.bswh.locationNotes"><div style="margin-bottom:2rem;"> 
                        <div>
                            <span class="site-info-bold">Baylor Scott & White Health and Wellness Center - Dallas</span>
                            <p>4500 Spring Ave.<br>
                                Dallas, TX 75210<br><br>
                                Parking Instructions: The site offers free surface level parking.
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White Community Care (BCC) - Fort Worth*</span>
                            <p >1307 8th Ave., Suite 305<br>
                                Fort Worth, TX 76104<br><br>
                                Parking Instructions: The site offers free surface level parking.<br>
                                <span style="font-size:1rem" class="site-info-underline-italic">*Note: Only patients of Baylor Scott & White Health Community Care - Fort Worth clinic can schedule an appointment at this location.</span>
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White All Saints Hospital - Fort Worth</span>
                            <p>1400 8th Ave.<br>
                                Fort Worth, TX 76104<br>
                                6th Floor, C Building<br><br>
                                Parking Instructions: Park in self-parking garage located on the corner of 8th Avenue and Enderly Place. Parking is free for the first hour. Once parked, look for main hospital entrance and navigate to Building C.
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White Community Care (BCC) - Worth Street Clinic*</span>
                            <p>4001 Worth St.<br>
                                Dallas, TX 75246<br>
                                Parking Instructions: The site offers free surface level parking.<br>
                                <span style="font-size:1rem" class="site-info-underline-italic">*Note: Only patients of Baylor Scott & White Health Community Care - Worth Street clinic can schedule an appointment at this location.</span>
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White Sammons Cancer Center</span>
                            <p>3410 Worth St., Suite 530<br>
                                Dallas, TX 75246<br><br>
                                Parking Instructions: Drive to the back of the Sammons Cancer Center Building and park in the underground garage. You will get a ticket from the machine as you enter the garage. Please keep the ticket. During your visit, the Connect team will give you a voucher for free parking. 
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White North Garland Clinic</span>
                            <p>7217 Telecom Pkwy., Suite 100<br>
                                Garland, TX 75044<br><br>
                                Parking Instructions: The site offers free surface level parking.
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White Medical Center - Irving</span>
                            <p>1901 N. MacArthur Blvd., Suite 115<br>
                                Irving, TX 75061<br><br>
                                Parking Instructions: The site offers free surface level parking<br>
                                Suite 115 is located within the Irving Hospital in the PAT lab.
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White Center for Diagnostic Medicine – Temple CDM</span>
                            <p>1605 S. 31st St.<br>
                                Temple, TX 76508<br><br>
                                Parking Instructions: The site offers free surface level parking.
                            </p>
                        </div>
                        <div>
                            <span class="site-info-bold">Baylor Scott & White, Temple Roney Bone & Joint – Temple Roney</span>
                            <p>2401 S. 31st St., Bldg 35<br>
                                Temple, TX 76508<br><br>
                                Parking Instructions: The site offers free surface level parking.
                            </p>
                        </div>
                        <div>
                            <span class=\"site-info-bold\">Baylor Scott & White Temple Westfield Clinic</span>
                            <p>7556 Honeysuckle<br>
                                Temple, TX 76502<br><br>
                                Parking Instructions: The site offers free surface level parking.
                            </p>
                        </div>
                        <div>
                            <span class=\"site-info-bold\">Baylor Scott & White - Waco Fish Pond</span>
                            <p>7700 Fish Pond Rd.<br>
                                Waco, TX 76710<br><br>
                                Parking Instructions: The site offers free surface level parking.
                            </p>
                        </div>
                    </div>`,
    howLong: '<span data-i18n="samples.bswh.howLong">If you complete your first Connect survey before your appointment, please expect to spend about 45 minutes at your appointment to donate your samples and complete a short sample survey.</span>',
    prepareInstructions: '<span data-i18n="samples.bswh.prepareInstructions"><p>On the day of your appointment, you do not need to fast. Drink plenty of water to keep hydrated, but <span class="site-info-bold">stop drinking water one hour before your appointment.</span></p> <p><span class="site-info-bold">One hour before your appointment:</span> Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.</p> <p class="site-info-bold">Things to bring and remember</p><ul><li>Please remember to bring a valid photo ID that is not expired (driver’s license, passport, school photo ID, or other photo ID)</li><li>Make sure you know your login information for MyConnect</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:</li><ul><li>The last time you ate or drank before your appointment, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul></span>',
    whatHappens: `<span data-i18n="samples.bswh.whatHappens"><p>The research team will check you in for your appointment and then collect your samples. At the end of your visit, the research team will check you out of your appointment.</p>
                  <p>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.</p>
                  <p>We will also ask you to complete a short survey about your samples on MyConnect using your mobile phone. You will need your MyConnect login information to complete the survey. If you do not have a mobile phone, we will provide you with a tablet to complete your survey. We strongly encourage you to complete your survey at your appointment. If you choose to complete it after you leave your appointment, it is important to do so as soon as possible.</p>
                  </span>`,
    payment: `<span data-i18n="samples.bswh.payment">
                You will receive your $25 payment after you donate a blood sample and complete all four sections of your first Connect survey.<br><br>
                You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<br><br>
                <ol><li class="site-list-item-spacing">Background and Overall Health</li><li class="site-list-item-spacing">Medications, Reproductive Health, Exercise, and Sleep</li><li class="site-list-item-spacing">Smoking, Alcohol, and Sun Exposure</li><li class="site-list-item-spacing">Where you Live and Work</li></ol>
                </span>`,
}

const nci = {
    concept: '13',
    name: 'NCI',
    donatingSamples: '<span data-i18n="samples.nci.donatingSamples">As part of Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.nci.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<br><br><span style="font-weight:900; text-decoration:underline">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span style="font-weight:900; text-decoration:underline">eight weeks</span> from your donation or transfusion before donating your samples for Connect.</span>',
    howToDonate: '<span data-i18n="samples.nci.howToDonate">When you receive the email, please call us at 123-456-7891 to schedule an appointment to donate your samples at a time that is convenient for you.</span>',
    scheduling: '<span data-i18n="samples.nci.scheduling">For questions and scheduling please call us at 123-456-7891.<br><br>All patients and visitors are required to wear a mask. If you enter the building without a mask, one will be provided to you, if you are unable to wear a mask for the duration of the visit, we ask that you do not schedule your visit at this time.</span>',
    howLong: '<span data-i18n="samples.nci.howLong">Please expect to spend an average of one hour at your appointment to donate your samples and complete a short survey.</span>',
    prepareInstructions: '<span data-i18n="samples.nci.prepareInstructions">One the day of your appointment, please drink plenty of water, but <span style="font-weight:900; text-decoration:underline">stop drinking water one hour before your appointment.</span><br><br><span style="font-weight:900; text-decoration:underline">One hour before your appointment:</span> Please <span style="font-weight:900; text-decoration:underline">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span style="font-weight:900; text-decoration:underline">Things to bring and remember:</span><br><br><ul><li>Make sure you know your login information for MyConnect</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information:<ul><li>The last time you ate or drank before your appointment, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li><li>Information and dates regarding COVID-19 testing, symptoms, recovery information (including any hospital stay and treatment), and vaccination status.</li></ul></li></ul></span>',
    whatHappens: '<span data-i18n="samples.nci.whatHappens">The connect team will check you in for your appointment and then collect your samples. At the end of your visit, the Connect team will check you out of your appointment.<br><br>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br>We will also ask you to complete a <span style="font-weight:900; text-decoration:underline">short survey</span> on MyConnect using your mobile phone. If you do not have a mobile phone, we will provide a device for you to use to complete your survey. You will need your MyConnect log-in information to complete the survey.</span>',
    support: '<span data-i18n="samples.nci.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)</span>',
    locations: [
        [
            '<span data-i18n="samples.nci.locations.NCIName">National Cancer Institute Sample Location</span>',
            '<span data-i18n="samples.nci.locations.NCIAddress">Rockville, MD</span>',
            '<span data-i18n="samples.nci.locations.NCISchedule">Monday - Friday: 8:00 a.m.- 2:00 p.m.</span>',
            '<span data-i18n="samples.nci.locations.NCIParking">General parking available.</span>'
        ]
    ]
};

const kpga = {
    concept: '327912200',
    name: 'KP Georgia',
    donatingSamples: '<span data-i18n="samples.kpga.donatingSamples">As part of Connect, we ask you to donate blood, urine, and mouthwash samples and complete two short surveys.</span></span>',
    whenToDonate: '<span data-i18n="samples.kpga.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonateBloodAndUrine: '<span data-i18n="samples.kpga.howToDonateBloodAndUrine">You may visit any KP medical office with lab near you to donate samples. We are not able to collect samples for Connect at any of KP’s affiliated locations (such as LabCorp and Quest). For locations, hours and directions, please visit <a style="text-decoration:underline" href="https://healthy.kaiserpermanente.org/georgia/doctors-locations?kp_shortcut_referrer=kp.org/locations#/search-form">kp.org/locations</a> or call 1-888-413-0601.<br></br><span class="site-info-bold">You do not need an appointment</span> and there is no co-pay involved. You do not need to fast before you donate samples for Connect, so you may eat and drink before your visit.<br></br>When you arrive at the Kaiser Permanente lab, please use the lab kiosk to check in according to the steps below:<br></br><ol><li> Touch the screen to get started.</li><li> Enter your Medical Record Number (MRN).</li><li> Enter your Date of Birth.</li><li> Choose “Walk-in.”</li><li> Select “Other Lab Services.”</li><li> Answer COVID-19 symptoms questions if displayed.</li><li> Select “No” to answer questions regarding additional coverage, payment, or text messaging.</li><li> You will see a message on the kiosk screen that reads, “You are checked-in" when you have finished the check-in process.</li><li> Have a seat and lab staff will call you back when they are ready.</li><li> When called back, please communicate with the lab staff you are there for a “Research draw for Connect” and the KP lab staff will take it from there.</li></ol></span>',
    prepInstructionsHeader: '<span data-i18n="samples.kpga.prepInstructionsHeader">What Should I Bring to the Visit?</span>',
    prepInstructionsText: '<span data-i18n="samples.kpga.prepInstructionsText"><span class="site-info-bold-italic">You may be required to wear a mask. If you don’t have a mask, we will provide one to you. If you are unable to wear a mask for the duration of the visit, we ask that you do not plan to visit at this time.</span> <br></br>A visitor may accompany you in the lab waiting area but they will not be permitted back to the lab area with you. Hand sanitizer will be available for your use. Please follow any physical distancing guidelines provided in the facility.<br></br><span class="site-info-bold">Things to bring and remember:</span><br></br><ul><li>Please bring your Kaiser Permanente ID card and a picture ID.</li><ul></span>',
    whatHappensDuring: '<span data-i18n="samples.kpga.whatHappensDuring">Donating your research blood and urine samples is just like providing samples requested by your health care provider. When you arrive at the facility, you may go directly to the lab to check in according to the steps above.<br></br>When it is your turn, the lab will call you back, confirm your ID, and collect your samples. Tell the lab techs that you are donating samples for NCI Connect. The techs will be able to see your blood and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.kpga.whatHappensAfter">Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions, such as:<br></br><ul style="list-style-type:circle;"><li>The last time you ate or drank before your visit, and the times you went to sleep the night before your visit and woke up on the day of your visit.</li><li> If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><span class="site-info-bold-italic">When you receive our email, it is important that you complete the survey as soon as possible.</span></span>',
    howToDonateMouthwash: '<span data-i18n="samples.kpga.howToDonateMouthwash">We will send you an email as soon as your mouthwash home collection kit is on its way.  Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items needed to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.<br></br>When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect.<span class="site-info-bold-italic"> It is important to complete this survey on the same day that you collect your mouthwash sample.</span></span>',
    support: '<span data-i18n="samples.kpga.support">Call 1-877-505-0253 (9:00 a.m-11:00 p.m. ET on weekdays and 10:00 a.m.-7:00 p.m. ET on weekends)</span>'
};

const kphi = {
    concept: '300267574',
    name: 'KP Hawaii',
    donatingSamples: '<span data-i18n="samples.kphi.donatingSamples">As part of Connect, we ask you to donate blood, urine, and mouthwash samples and complete two short surveys.</span>',
    whenToDonate: '<span data-i18n="samples.kphi.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonateBloodAndUrine: '<span data-i18n="samples.kphi.howToDonateBloodAndUrine">You may visit any KP medical office with lab near you to donate samples. We are not able to collect samples for Connect at any of KP’s affiliated locations (such as LabCorp and Quest). For locations, hours, and directions, please go to <a style="text-decoration:underline" href="https://healthy.kaiserpermanente.org/hawaii/doctors-locations?kp_shortcut_referrer=kp.org/locations#/search-form">kp.org/locations</a> or call <span class="site-info-bold">toll-free 833-417-0846. <br></br><span class="site-info-bold">You do not need an appointment</span> and there is no co-pay involved. You do not need to fast before you donate samples for Connect, so you may eat and drink before your visit.</span>',
    prepInstructionsHeader: '<span data-i18n="samples.kphi.prepInstructionsHeader">What Should I Bring to the Visit?</span>',
    prepInstructionsText: '<span data-i18n="samples.kphi.prepInstructionsText"><ul><li>Please bring your Kaiser Permanente member ID card and a picture ID.</li></ul></span>',
    whatHappensDuring: '<span data-i18n="samples.kphi.whatHappensDuring">Donating your research blood and urine samples is just like providing samples requested by your health care provider. When you arrive at the clinic, you may go directly to the lab. When it is your turn, the lab will call you back, check your ID, and collect your samples. Tell the lab techs that you are donating samples for NCI Connect. The techs will be able to see your blood and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.kphi.whatHappensAfter">Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions, such as:<br><br><ul style="list-style-type:circle;"><li>The last time you ate or drank before your lab visit, and the times you went to sleep the night before your visit and woke up on the day of your visit.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><span class="site-info-bold-italic">When you receive our email, it is important that you complete the survey as soon as possible.</span></span>',
    howToDonateMouthwash: '<span data-i18n="samples.kphi.howToDonateMouthwash">We will send you an email as soon as your mouthwash home collection kit is on its way.  Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items needed to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.<br><br> When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect. <span class="site-info-bold-italic">It is important to complete this survey on the same day that you collect your mouthwash sample.</span></span>',
    support: '<span data-i18n="samples.kphi.support">Call 1-877-505-0253 (3:00 a.m-5:00 p.m. HT on weekdays and 4:00 a.m.-1:00 p.m. HT on weekends)</span>'
};

const kpco = {
    concept: '125001209',
    name: 'KP Colorado',
    donatingSamples: '<span data-i18n="samples.kpco.donatingSamples">As part of Connect, we ask you to donate blood, urine, and mouthwash samples and complete two short surveys.</span>',
    whenToDonate: `<span data-i18n="samples.kpco.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy. </span>`,
    howToDonateBloodAndUrine: '<span data-i18n="samples.kpco.howToDonateBloodAndUrine">You may visit any KP medical office with a lab near you to donate samples. We are not able to collect samples for Connect at any of KP’s affiliated locations (such as LabCorp and Quest). For locations, hours and directions, please visit <a style="text-decoration:underline" href="https://healthy.kaiserpermanente.org/colorado/doctors-locations?kp_shortcut_referrer=kp.org/locations#/search-form">kp.org/locations</a> or call 303-338-3800.<br></br><span class="site-info-bold">You do not need an appointment</span> and there is no co-pay involved. You do not need to fast before you donate samples for Connect, so you may eat and drink before your visit.</span>',
    prepInstructionsHeader: '<span data-i18n="samples.kpco.prepInstructionsHeader">What Should I Bring to the Visit?</span>',
    prepInstructionsText: '<span data-i18n="samples.kpco.prepInstructionsText"><span class="site-info-bold">Things to bring and remember:<br></br></span><ul><li>Please bring your Kaiser Permanente member ID card and a picture ID.</li></ul></span>',
    whatHappensDuring: '<span data-i18n="samples.kpco.whatHappensDuring">Donating your research blood and urine samples is just like providing samples requested by your health care provider. When you arrive at the clinic, you may go directly to the lab. When it is your turn, the lab will call you back, check your ID, and collect your samples. Tell the lab techs that you are donating samples for NCI Connect. The techs will be able to see your blood and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.kpco.whatHappensAfter">Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions, such as:<br></br><ul style="list-style-type:circle;"><li>The last time you ate or drank before your lab visit, and the times you went to sleep the night before your visit and woke up on the day of your visit.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><span class="site-info-bold-italic">When you receive our email, it is important that you complete the survey as soon as possible.</span></span>',
    howToDonateMouthwash: '<span data-i18n="samples.kpco.howToDonateMouthwash">We will send you an email as soon as your mouthwash home collection kit is on its way.  Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items needed to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.<br></br>When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect.<span class="site-info-bold-italic"> It is important to complete this survey on the same day that you collect your mouthwash sample.</span></span>',
    support: '<span data-i18n="samples.kpco.support">Call 1-877-505-0253 (6:00 a.m-8:00 p.m. MT on weekdays and 7:00 a.m.-4:00 p.m. MT on weekends)</span>'
};

const kpnw = {
    concept: '452412599',
    name: 'KP Northwest',
    donatingSamples: '<span data-i18n="samples.kpnw.donatingSamples">As part of Connect, we ask you to donate blood, urine, and mouthwash samples and complete two short surveys.</span>',
    whenToDonate: '<span data-i18n="samples.kpnw.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br> <span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">four weeks</span> from your plasma donation before donating samples for Connect. If you have recently donated platelets, please wait at least <span class="site-info-bold">one week</span> from your platelet donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonateBloodAndUrine: '<span data-i18n="samples.kpnw.howToDonateBloodAndUrine">You may visit any KP medical office with lab near you to donate samples. We are not able to collect samples for Connect at any of KP’s affiliated locations (such as LabCorp and Quest). For locations, hours and directions, please visit <a style="text-decoration:underline" href="https://healthy.kaiserpermanente.org/oregon-washington/community-providers/laboratory">kp.org/locations.</a> <br></br><span class="site-info-bold">You do not need an appointment</span> and there is no co-pay involved. You do not need to fast before you donate samples for Connect, so you may eat and drink before your visit.</span>',
    prepInstructionsHeader: '<span data-i18n="samples.kpnw.prepInstructionsHeader">What Should I Bring to the Visit?</span>',
    prepInstructionsText: '<span data-i18n="samples.kpnw.prepInstructionsText"><ul><li>Please bring your Kaiser Permanente member ID card and a picture ID.</li><li>KPNW Infectious Disease and Infection Prevention & Control recommends members, patients, and visitors wear a mask in ambulatory care including labs and hospital settings. </li></ul><span class="site-info-bold-italic">Note: Hand sanitizer will be available for your use.</span></span>',
    whatHappensDuring: '<span data-i18n="samples.kpnw.whatHappensDuring">Donating your research blood and urine samples is just like providing a clinical sample requested by your health care provider. When you arrive at the clinic, you may go directly to the lab, get a ticket with a number, and follow the instructions. When it is your turn, the lab staff will call your number and collect your samples similarly to a clinical sample collection for medical care. Tell the lab techs that you are donating samples for NCI Connect. The techs will be able to see your blood draw and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.kpnw.whatHappensAfter">Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions, such as:<br></br><ul  style="list-style-type:circle;"><li>The last time you ate or drank before your lab visit, and the times you went to sleep the night before your visit and woke up on the day of your visit.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><span class="site-info-bold-italic">When you receive our email, it is important that you complete the survey as soon as possible.</span></span>',
    howToDonateMouthwash: '<span data-i18n="samples.kpnw.howToDonateMouthwash">We will send you an email as soon as your mouthwash home collection kit is on its way.  Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items you need to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.<br></br>When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect. <span class="site-info-bold-italic">It is important to complete this survey on the same day that you collect your mouthwash sample.</span></span>',
    support: '<span data-i18n="samples.kpnw.support">Call 1-877-505-0253 (6:00 a.m-8:00 p.m. PT on weekdays and 7:00 a.m.-4:00 p.m. PT on weekends)</span>'
};



const locations = [
    health_partners,
    sanford,
    marshfield,
    henry_ford,
    u_chicago,
    nci,
    kpga,
    kphi,
    kpco,
    kpnw,
    bswh,
];

const renderLocations = (site) => {
    let template = '';
    if (site.locations){
        site.locations.forEach(location => {
            template += `
                <div style="width:100%; margin-bottom:1rem;">
                    <div class="messagesHeaderFont">
                        ${location[0]}
                    </div>
                </div>
                `
            if (site === henry_ford) {
                template += `
                <div class="row" style="width:100%">
                    <div style="width:100%">
                        <div class="messagesHeaderFont" data-i18n="samples.addressText">
                            Address
                        </div>
                        <div class="messagesBodyFont">
                            ${location[1]}
                        </div>
                    </div>
                </div>`
            } else if (site === marshfield) {
                template += `
                <div class="row removePaddingTop" style="width:100%">
                    <div style="width:100%; margin-left:2rem;">
                        <div class="messagesHeaderFont " data-i18n="samples.addressText">
                            Address
                        </div>
                        <div class="messagesBodyFont messagesBodyFontAddress">
                            ${location[1]}
                        </div>
                    </div>
                </div>`
            } else if (site === sanford) {
                template += !location[1] ? '' : `
                <div class="row" style="width:100%">
                    <div style="width:100%">
                        <div class="messagesHeaderFont" data-i18n="samples.directionsText">
                            Address and Directions
                        </div>
                        <div class="messagesBodyFont">
                            ${location[1]}
                        </div>
                    </div>
                </div>`
            } else if (site === u_chicago){
                if (location[1]) {
                    template += `<div class="row removePaddingTop" style="width:100%">
                                    <div style="width:100%">
                                        <div class="messagesSubHeader" data-i18n="samples.addressText">
                                            Address
                                        </div>
                                        <div class="messagesBodyFont messagesBodyFontAddress">
                                            ${location[1]}
                                        </div>
                                    </div>
                                </div>
                                `;
                }
            } else {
                template += `
                <div style="width:100%">
                    <div style="width:100%">
                        <div class="messagesSubHeader" data-i18n="samples.directionsText">
                            Address and Directions
                        </div>
                        <div class="messagesBodyFont" style="padding: 0 0 1rem;">
                            ${location[1]}
                        </div>
                    </div>
                </div>`
            }
            if (location[2])  {
                template+=`    
                <div style="width:100%;padding:5px 15px;">
                    <div style="width:100%">
                        <div class="messagesHeaderFont" data-i18n="samples.hoursText">
                            Hours
                        </div>
                        <div class="messagesBodyFont">
                            ${location[2]}
                        </div>
                    </div>
                </div>`
            }
            
            if (location[3])  {
            template+=` 
                <div style="width:100%">
                    <div style="width:100%">
                        <div class="messagesSubHeader" data-i18n="samples.parkingInstructions">
                            Parking Instructions
                        </div>
                        <div class="messagesBodyFont messagesBodyFontParking">
                            ${location[3]}
                        </div>
                    </div>
                </div>`
            }

            template+=`
                <br>
                <br>
            `;
        });
    }

    return template;
}