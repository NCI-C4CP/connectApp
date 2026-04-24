import { getMyData, translateHTML, translateText, requestHomeKit, escapeHTML, getKitTrackingNumber, getTrackingNumberSource, appState, getSelectedLanguageAcronym, getMySamples, siteAcronyms, mySamplesSiteNames  } from "../shared.js";
import { renderChangeMailingAddressGroup } from "./settings.js";
import { toggleElementVisibility, validateMailingAddress, changeMailingAddress } from "../settingsHelpers.js";
import { addEventAddressAutoComplete } from '../event.js';
import conceptId from '../fieldToConceptIdMapping.js';

const isCollectingSamples = {
    HP: true,
    HFHS: true,
    KPCO: true,
    KPGA: true,
    KPHI: true,
    KPNW: true,
    Marshfield: true,
    Sanford: true,
    BSWH: true,
    NCI: true,
    UChicago: false,
};

const noMatchHtmlObj = {
    en: `
        <div class="col-lg-2 col-xl-3">
        </div>
        <div class="col-lg-8 col-xl-6 NotoSansFont" data-i18n="samples.planCollecting">
            We plan to begin collecting samples later this year. We will send you an email with instructions and next steps when it is time to donate samples. Thank you for being part of Connect!
        </div>
        <div class="col-lg-2 col-xl-3">
        </div>
        `,
    es: `
        <div class="col-lg-2 col-xl-3">
        </div>
        <div class="col-lg-8 col-xl-6 NotoSansFont" data-i18n="samples.planCollecting">
            Planeamos comenzar a recolectar muestras este mismo año. Cuando llegue el momento de donar muestras, le enviaremos por correo electrónico las instrucciones y los pasos a seguir. ¡Gracias por formar parte de Connect!
        </div>
        <div class="col-lg-2 col-xl-3">
        </div>
        `,
};

const errorHtmlObj = {
    en: `
        <div class="col-lg-2 col-xl-3">
        </div>
        <div class="col-lg-8 col-xl-6 NotoSansFont">
            <div class="alert alert-danger">
                There was an error when loading data. Please try again later.
            </div>
        </div>
        <div class="col-lg-2 col-xl-3">
        </div>
        `,
    es: `
        <div class="col-lg-2 col-xl-3">
        </div>
        <div class="col-lg-8 col-xl-6 NotoSansFont">
            <div class="alert alert-danger">
                Hubo un error al cargar los datos. Por favor, inténtelo de nuevo más tarde.
            </div>
        </div>
        <div class="col-lg-2 col-xl-3">
        </div>
        `,
};

const getMySamplesHtmlObj = async (siteAcronym) => {
  let siteHtmlObj = appState.get().mySamples[siteAcronym];
  if (!siteHtmlObj) {
    try {
      siteHtmlObj = await getMySamples(siteAcronym);
    } catch {
      console.error(`Error fetching my samples for site ${siteAcronym}`);
      return errorHtmlObj;
    }

    if (siteHtmlObj) {
      appState.set({
        mySamples: { ...appState.get().mySamples, [siteAcronym]: siteHtmlObj },
      });
    }
  }

  return siteHtmlObj || noMatchHtmlObj;
};

export const renderSamplesPage = async () => {
    document.title = translateText('samples.title');
    const langAcronym = getSelectedLanguageAcronym();
    const participant = { ...appState.get().myData };
    const siteName = mySamplesSiteNames[participant[conceptId.healthcareProvider]];
    const siteAcronym = siteAcronyms()[participant[conceptId.healthcareProvider]];
    const siteHtmlObj = await getMySamplesHtmlObj(siteAcronym);
    const donationInfoHtml = siteHtmlObj[langAcronym] || noMatchHtmlObj.en;

    const kitId =
        participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[
            conceptId.uniqueKitID
        ];
    const kitStatus =
        participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[
            conceptId.kitStatus
        ];
    if (
        kitStatus === conceptId.kitStatusValues.shipped &&
        participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[
            conceptId.kitRequestEligible
        ] === conceptId.yes
    ) {
        // If the kit has been shipped and was user-requested, we're going to need its tracking number information
        const { code, data, message } = await getKitTrackingNumber(kitId);
        if (data?.supplyKitTrackingNum) {
            participant.supplyKitTrackingNum = data.supplyKitTrackingNum;
        } else {
            console.error('%s error retrieving kit information:', code, message);
        }
    }

    // Request a kit and kit request history eligibility information needed, so calculated here
    // More kit types will be added eventually
    const kitsForRequest = [{ key: conceptId.bioKitMouthwash, kitType: 'Mouthwash' }];
    const availableKits = [],
        receivedKits = [];
    kitsForRequest.forEach(({ key, kitType }) => {
        if (
            participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[key]?.[conceptId.kitStatus] ===
            conceptId.kitStatusValues.received
        ) {
            receivedKits.push({
                key,
                kitType,
                dateRequested:
                    participant[conceptId.collectionDetails][conceptId.baseline][key][conceptId.dateKitRequested],
                dateReceived:
                    participant[conceptId.collectionDetails][conceptId.baseline][key][conceptId.receivedDateTime],
            });
        } else {
            availableKits.push(key);
        }
    });

    // Display only if user is kit request eligible and has not requested all kit types
    const showRequestAKit =
        participant[conceptId.collectionDetails]?.[conceptId.baseline]?.[conceptId.bioKitMouthwash]?.[
            conceptId.kitRequestEligible
        ] === conceptId.yes && availableKits.length;
    let requestAKitHtml = '';
    if (showRequestAKit) {
        requestAKitHtml = `
            <div class="row">
                <div class="col-lg-2 col-xl-3"></div>
                    <div class="col-lg-8 col-xl-6">
                        <div class="consentHeadersFont" style="color:#606060;width:100%" id="requestAKitRow" tabindex="-1">
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
            ${renderAddPhysicalAddressInfo()}
            `;
    }
    // Display if any home kits have been received
    const showKitRequestHistory = receivedKits.length > 0;
    let kitRequestHistoryHtml = '';
    if (showKitRequestHistory) {
        kitRequestHistoryHtml = `
            <div class="row">
                <div class="col-lg-2 col-xl-3"></div>
                <div class="col-lg-8 col-xl-6">
                    <div class="consentHeadersFont" style="color:#606060;width:100%" id="kitRequestHistoryRow" tabindex="-1">
                        <div data-i18n="samples.kitRequestHistory.title">
                            Home Collection Kit Request History
                        </div>
                    </div>
                    <div class="row" id="kitRequestHistory">
                        <div class="col-lg-12" id="kitRequestHistoryInner">
                            ${receivedKits
                                .map(({ kitType, dateRequested, dateReceived }) => {
                                    const dateOptions = {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    };
                                    // Because the date received is always stored as midnight in UTC on the date that the kit is received
                                    // we have to specify UTC timezone for Date Received
                                    // otherwise, in the standard US timezones, it will display as the day before receipt
                                    return `
                                    <div class="messagesSubHeader"><span data-i18n="samples.kitRequestHistory.kitTypeLabel">Type of Kit</span>: <span data-i18n="samples.kitRequestHistory.${kitType}">${kitType}</span></div>
                                    <br />
                                    <div><span data-i18n="samples.kitRequestHistory.dateKitRequestedLabel">Date Requested</span>: <span data-i18n="date" data-timestamp="${dateRequested}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"></span></div>
                                    <div><span data-i18n="samples.kitRequestHistory.dateKitReceivedLabel">Date Received</span>: <span data-i18n="date" data-timestamp="${dateReceived}" data-date-options="${encodeURIComponent(JSON.stringify({ ...dateOptions, timeZone: 'UTC' }))}"></span></div>
                                `;
                                })
                                .join('<hr />')}
                        </div>
                    </div>
                    <hr />
                </div>
                <div class="col-lg-2 col-xl-3"></div>
            </div>
            `;
    }

    let onThisPageHtml = '';
    if (siteName && isCollectingSamples[siteAcronym] && siteHtmlObj !== errorHtmlObj && siteHtmlObj !== noMatchHtmlObj) {
        onThisPageHtml = `
            <div class="row">
                <div class="col-lg-2 col-xl-3"></div>
                <div class="col-lg-8 col-xl-6">
                    <p class="consentHeadersFont" style="color:#606060; font-size: 1.5em;" data-i18n="settings.pageNav">
                        On this page:
                    </p>
                    <ul class="onThisPage">
                    <li><a href="javascript:document.getElementById('donatingInformation').scrollIntoView(true); document.getElementById('donatingInformation').focus()"><span data-i18n="samples.donatingSamples">Donating Your Samples at</span> ${siteName}</a></li>
                    ${showRequestAKit ? `<li><a href="javascript:document.getElementById('requestAKitRow').scrollIntoView(true); document.getElementById('requestAKitRow').focus()" data-i18n="samples.requestAKit.title">Home Collection Kit Request</a></li>` : ``}
                    ${showKitRequestHistory ? `<li><a href="javascript:document.getElementById('kitRequestHistoryRow').scrollIntoView(true); document.getElementById('kitRequestHistoryRow').focus()" data-i18n="samples.kitRequestHistory.title">Home Collection Kit Request History</a></li>` : ``}
                    <!-- <li><a href="javascript:document.getElementById('sampleInventory').scrollIntoView(true); document.getElementById('sampleInventory').focus()" data-i18n="samples.sampleInventory">Sample Inventory</a></li> -->
                    </ul>
                </div>
                <div class="col-lg-2 col-xl-3"></div>
            </div>`;
    }

    const template = `
        <div class="row" style="margin-top:18px">
            <div class="col-lg-2 col-xl-3"></div>
            <div class="col-lg-8 col-xl-6" >
                <p class="consentHeadersFont" id="myProfileTextContainer" style="color:#606060;" data-i18n="navbar.samplesLink">
                My Samples
                </p>
            </div>
            <div class="col-lg-2 col-xl-3"></div>
        </div>
        ${onThisPageHtml}
        <div class="row" id="donatingInformation" tabindex="-1">
            <div class="col-lg-2 col-xl-3"></div>
            <div class="col-lg-8 col-xl-6">
                ${donationInfoHtml}
            </div>
            <div class="col-lg-2 col-xl-3"></div>
        </div>
    ${requestAKitHtml}
    ${kitRequestHistoryHtml}
    `;

    document.getElementById('root').innerHTML = translateHTML(template);
    document.querySelectorAll('[data-bs-toggle="collapse"]').forEach((element) => {
        /**The collapser elements are generated in the smdb and the page does
         * not have control of the html.  The existing markup does not use buttons or links
         * for the collapser so we need to make the markup tabbable and accessable via the 
         * enter and space buttons.
        */
        if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
            element.setAttribute('tabindex', '0');
            element.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                }
            });
            element.addEventListener("keyup", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    element.click();
                }
            });
            element.addEventListener("click", () => {
                element.click();
            });
        }
    });
    renderRequestAKitDisplay(participant);
    bindEvents(participant);
};

appState.subscribe(state => state.language, () => {
        if (location.hash === '#samples' && appState.get().myData) {
            renderSamplesPage();
        }
    });

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
    document.getElementById('UPAddress2Line1').focus();
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
                'event.addressConfirmationDescriptionPhysical',
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
                    'event.addressSuggestionDescription',
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
