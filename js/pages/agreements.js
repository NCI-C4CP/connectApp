import { getMyData, hasUserData, hideAnimation, showAnimation, siteAcronyms, dateTime, storeResponse, isMobile, openNewTab, languageSuffix, getSelectedLanguage, translateHTML, translateText, appState } from "../shared.js";
import { initializeCanvas } from './consent.js'
import fieldMapping from '../fieldToConceptIdMapping.js';
import {suffixToTextMap, suffixToTextMapDropdown} from '../settingsHelpers.js'
import consentVersions from "../../forms/formVersions.js";
import formVersions from "../../forms/formVersions.js";

const { PDFDocument, StandardFonts } = PDFLib;

const siteToHipaaSignPosMap = {   
    "HP": {
        "V0.03": {
            "Eng": {nameX:100,nameY:420,signatureX:100,signatureY:465,dateX:100,dateY:370},
            "Span": { nameX:188, nameY:424, signatureX:80, signatureY:470, dateX: 80, dateY: 375 },
        },
        "default": {nameX:100,nameY:420,signatureX:100,signatureY:465,dateX:100,dateY:370},
    },
    "HFHS": {
        "V0.02": {
            "Eng": {nameX:100,nameY:425,signatureX:100,signatureY:465,dateX:100,dateY:385},
            "Span": { nameX:188, nameY:429, signatureX:80, signatureY:467, dateX: 80, dateY: 387 },
        },
        "default": {nameX:110,nameY:440,signatureX:110,signatureY:480,dateX:110,dateY:400},
    },
    "KPCO": {
        "V0.03": {
            "Eng": {nameX:110,nameY:425,signatureX:110,signatureY:465,dateX:110,dateY:385},
            "Span": {nameX:188,nameY:425,signatureX:80,signatureY:465,dateX:80,dateY:385},
        },
        "V0.02": {
            "Eng": {nameX:110,nameY:410,signatureX:110,signatureY:450,dateX:110,dateY:370},
            "Span": {nameX:188,nameY:415,signatureX:80,signatureY:455,dateX:80,dateY:375},
        },
        "default": {nameX:110,nameY:410,signatureX:110,signatureY:450,dateX:110,dateY:370},
    },
    "KPGA": {
        "V0.03": {
            "Eng": {nameX:110,nameY:345,signatureX:110,signatureY:385,dateX:110,dateY:305},
            "Span": {nameX:188,nameY:198,signatureX:80,signatureY:238,dateX:80,dateY:158},
        },
        "default": {nameX:110,nameY:345,signatureX:110,signatureY:385,dateX:110,dateY:305},
    },
    "KPHI": {
        "V0.02": {
            "Eng": {nameX:110,nameY:410,signatureX:110,signatureY:450,dateX:110,dateY:370},
            "Span": {nameX:188,nameY:415,signatureX:80,signatureY:455,dateX:80,dateY:375},
        },
        "default": {nameX:110,nameY:410,signatureX:110,signatureY:450,dateX:110,dateY:370},
    },
    "KPNW": {
        "V0.02": {
            "Eng": {nameX:110,nameY:415,signatureX:110,signatureY:455,dateX:110,dateY:375},
            "Span": {nameX:188,nameY:415,signatureX:80,signatureY:455,dateX:80,dateY:375},
        },
        "default": {nameX:110,nameY:415,signatureX:110,signatureY:455,dateX:110,dateY:375},
    },
    "NCI": {
        "V0.02": {
            "Eng": {nameX:110,nameY:427,signatureX:110,signatureY:467,dateX:110,dateY:387},
            "Span": { nameX:188, nameY:419, signatureX:80, signatureY:457, dateX: 80, dateY: 377 },
        },
        "default": {nameX:110,nameY:427,signatureX:110,signatureY:467,dateX:110,dateY:387},
    },
    "Marshfield": {
        "V0.02": {
            "Eng": {nameX:100,nameY:425,signatureX:100,signatureY:465,dateX:100,dateY:385},
            "Span": { nameX:188, nameY:429, signatureX:80, signatureY:467, dateX: 80, dateY: 387 },
        },
        "default": {nameX:100,nameY:425,signatureX:100,signatureY:465,dateX:100,dateY:385},
    },
    "Sanford": {
        "V0.02": {
            "Eng": {nameX:100,nameY:415,signatureX:100,signatureY:455,dateX:100,dateY:375},
            "Span": { nameX:188, nameY:419, signatureX:80, signatureY:457, dateX: 80, dateY: 377 },
        },
        "default": {nameX:100,nameY:415,signatureX:100,signatureY:455,dateX:100,dateY:375},
    },
    "UChicago": {
        "V0.02": {
            "Eng": {nameX:110,nameY:425,signatureX:110,signatureY:465,dateX:110,dateY:385},
            "Span": { nameX:188, nameY:429, signatureX:80, signatureY:467, dateX: 80, dateY: 387 },
        },
        "default": {nameX:110,nameY:425,signatureX:110,signatureY:465,dateX:110,dateY:385},
    },
    "BSWH": {
        "V0.01": {
            "Eng": { nameX:100, nameY:440, signatureX:100, signatureY:479, dateX: 100, dateY: 399 },
            "Span": { nameX:188, nameY:414, signatureX:80, signatureY:452, dateX: 80, dateY: 372 },
        },
        "default": { nameX:100, nameY:440, signatureX:100, signatureY:479, dateX: 100, dateY: 399 },
    },
    "default": { nameX: 200, nameY: 275, signatureX: 200, signatureY: 225, dateX: 200, dateY: 325}
}

const siteToConsentSignPosMap = {
    "HP": {
        "V0.02": {nameX:90,nameY:425,signatureX:110,signatureY:345,dateX:90,dateY:385},
        "V0.04": {nameX:90,nameY:402,signatureX:110,signatureY:322,dateX:90,dateY:362},
        "V0.05": {
            "Eng": {nameX:90,nameY:402,signatureX:110,signatureY:322,dateX:90,dateY:362},
            "Span": {nameX:105,nameY:392,signatureX:105,signatureY:312,dateX:105,dateY:352}
        },
        "default": {nameX:90,nameY:420,signatureX:110,signatureY:340,dateX:90,dateY:380},
    },
    
    "HFHS":{
        "V0.03":  {
            "Eng": {nameX:90,nameY:410,signatureX:110,signatureY:330,dateX:90,dateY:370},
            "Span": {nameX:105,nameY:410,signatureX:105,signatureY:330,dateX:105,dateY:370}
        },
        "default": {nameX:110,nameY:380,signatureX:115,signatureY:300,dateX:110,dateY:340},
    },
    
    "KPCO": {
        "V0.04": {
            "Eng": {nameX:110,nameY:395,signatureX:110,signatureY:315,dateX:110,dateY:355},
            "Span": {nameX:110,nameY:395,signatureX:110,signatureY:315,dateX:110,dateY:355},
        },
        "V0.03": {nameX:110,nameY:395,signatureX:110,signatureY:315,dateX:110,dateY:355},
        "default": {nameX:110,nameY:400,signatureX:110,signatureY:320,dateX:110,dateY:360},
    },
    "KPGA": {
        "V0.04": {nameX:110,nameY:375,signatureX:110,signatureY:295,dateX:110,dateY:335},
        "V0.03": {nameX:110,nameY:375,signatureX:110,signatureY:295,dateX:110,dateY:335},
        "default": {nameX:110,nameY:400,signatureX:110,signatureY:320,dateX:110,dateY:360},
    },
    "KPHI": {
        "V0.03": {nameX:110,nameY:395,signatureX:110,signatureY:315,dateX:110,dateY:355},
        "default": {nameX:110,nameY:370,signatureX:110,signatureY:290,dateX:110,dateY:330},
    },
    "KPNW": {
        "V0.02": {nameX:110,nameY:395,signatureX:110,signatureY:315,dateX:110,dateY:355},
        "default": {nameX:110,nameY:390,signatureX:110,signatureY:310,dateX:110,dateY:350},
    },
    "NCI": {
        "V0.05": {
            "Eng": {nameX:90,nameY:407,signatureX:110,signatureY:330,dateX:90,dateY:370},
            "Span": {nameX:105,nameY:407,signatureX:105,signatureY:330,dateX:105,dateY:370}
        },
        "default": {nameX:90,nameY:410,signatureX:110,signatureY:335,dateX:90,dateY:375},
    },
    "Marshfield": {
        "V0.02": {nameX:110,nameY:425,signatureX:115,signatureY:345,dateX:110,dateY:385},
        "V0.03": {
            "Eng": {nameX:110,nameY:405,signatureX:115,signatureY:325,dateX:110,dateY:365},
            "Span": {nameX:110,nameY:395,signatureX:110,signatureY:315,dateX:110,dateY:355}
        },
        "default": {nameX:110,nameY:420,signatureX:115,signatureY:345,dateX:110,dateY:380},
    },
    "Sanford": {
        "V0.03": {
            "Eng": {nameX:120,nameY:730,signatureX:120,signatureY:655,dateX:120,dateY:690},
            "Span": {nameX:120,nameY:200,signatureX:120,signatureY:125,dateX:120,dateY:160}
        },
        "default": {nameX:120,nameY:407,signatureX:120,signatureY:330,dateX:120,dateY:367},
    },
    "UChicago": {
        "V0.05": {nameX:110,nameY:410,signatureX:115,signatureY:330,dateX:110,dateY:370},
        "default": {nameX:110,nameY:380,signatureX:115,signatureY:305,dateX:110,dateY:342},
    },
    "BSWH": {
        "V0.02": {
            "Eng": { nameX: 105, nameY: 407, signatureX: 105, signatureY: 329, dateX: 105, dateY: 367 },
            "Span": { nameX: 105, nameY: 407, signatureX: 105, signatureY: 329, dateX: 105, dateY: 367 }
        },
        "default": { nameX: 105, nameY: 407, signatureX: 105, signatureY: 329, dateX: 105, dateY: 367 },
    },
    "default": {nameX: 110, nameY: 400, signatureX: 110, signatureY: 330, dateX: 110, dateY: 370}
}

const dataDestructionSignPosMap = {
    "V1.0": {
        "Eng": {signatureX: 150, signatureY: 420, nameX: 150, nameY: 400, dateX: 155, dateY: 380},
        "Span": {signatureX: 88, signatureY: 410, nameX: 188, nameY: 385, dateX: 88, dateY: 365}
    }
}

const hipaaRevokeSignPosMap = {
    "V1.0": {
        "Eng": {signatureX: 150, signatureY: 400, nameX: 150, nameY: 420, dateX: 155, dateY: 380},
        "Span": {signatureX: 88, signatureY: 385, nameX: 188, nameY: 410, dateX: 88, dateY: 365}
    }
}

const defaultNameDateSignatureSize = {
  nameSize: 24,
  dateSize: 24,
  signatureSize: 20,
};

// Later, we may need to adjust font sizes based on each site
const siteToSignFontSizeMap = {
  Sanford: defaultNameDateSignatureSize,
  HP: defaultNameDateSignatureSize,
  Marshfield: defaultNameDateSignatureSize,
  HFHS: defaultNameDateSignatureSize,
  UChicago: defaultNameDateSignatureSize,
  KPCO: defaultNameDateSignatureSize,
  KPGA: defaultNameDateSignatureSize,
  KPHI: defaultNameDateSignatureSize,
  KPNW: defaultNameDateSignatureSize,
  BSWH: defaultNameDateSignatureSize,
  default: defaultNameDateSignatureSize,
};

export const renderAgreements = async () => {
    document.title = translateText('agreements.formsTitle');
    showAnimation();
    const myData = await getMyData();
    let template = '';
    if(hasUserData(myData) && myData.data['919254129'] !== undefined && myData.data['919254129'] === 353358909){
        template += translateHTML(`
            <div class="row justify-content-center">
                <div class="col-lg-8">    
                    <div class="row">
                        <div class="col">
                            <p class="userProfileHeader" data-i18n="agreements.formsText">Forms</p>
                        </div>
                    </div>

                    ${((((myData.data.hasOwnProperty('773707518') && myData.data['773707518'] == 353358909)  || (myData.data['747006172'] && myData.data['747006172'] == 353358909)) && (!myData.data['153713899'] || myData.data['153713899'] == 104430631) || (myData.data.hasOwnProperty('831041022') && myData.data['831041022'] == 353358909 && (!myData.data['359404406'] || myData.data['359404406'] == 104430631)))) ?`
                    <div class="row">
                        <div class="userProfileBox w-100">
                            <div class="row">
                                <div class="col">
                                <span class="userProfileHeader" data-i18n="agreements.formsToSign">
                                    Forms To Sign
                                </span>
                                <br>
                                </div>
                            </div>
                            ${(myData.data.hasOwnProperty('831041022') && myData.data['831041022'] == 353358909 && (!myData.data['359404406'] || myData.data['359404406'] == 104430631)) ?`
                                <div class="row">
                                    <div class="col px-2">
                                        <div class="row"  style="border:1px solid lightgrey; border-radius:5px;">
                                            <div class="col-md-2" data-i18n="agreements.surveyIcon">
                                                <i class="fab fa-wpforms d-none d-md-block" title="Survey Icon" style="margin-left:10px; font-size:50px;color:#c2af7f;"></i>
                                            </div>
                                            <div class="col-md-10 cnnsentBodyFont2">
                                                <span class = "consentHeadersFont" style="color:#5c2d93">
                                                    <b data-i18n="agreements.destroyFormTitle">Sign data destruction request form</b>
                                                </span>
                                                <br>
                                                <span class = "consentBodyFont2" data-i18n="agreements.destroyFormDescription">
                                                    Your request for Connect to destroy the information and samples you donated to the study, when possible.
                                                </span>
                                                <br>
                                                <br>
                                                <button data-i18n="agreements.signForm" class="btn btn-agreement consentNextButton" style="" id="signDataDestroy">Sign Form</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `:''}
                            ${(((myData.data.hasOwnProperty('773707518') && myData.data['773707518'] == 353358909) || (myData.data['747006172'] && myData.data['747006172'] == 353358909)) && (!myData.data['153713899'] || myData.data['153713899'] == 104430631)) ?`
                                <div class="row">
                                    <div class="col px-2">
                                        <div class="row"  style="border:1px solid lightgrey; border-radius:5px;">
                                            <div class="col-md-2" data-i18n="agreements.surveyIcon">
                                                <i class="fab fa-wpforms d-none d-md-block" title="Survey Icon" style="margin-left:10px; font-size:50px;color:#c2af7f;"></i>
                                            </div>
                                            <div class="col-md-10 cnnsentBodyFont2" >
                                                <span class = "consentHeadersFont" style="color:#5c2d93">
                                                    <b data-i18n="agreements.revocateShareTitle">Sign revocation of electronic health records release (HIPAA Revocation) form</b>
                                                </span>
                                                <br>
                                                <span class = "consentBodyFont2" data-i18n="agreements.revocateShareDescription">
                                                    Your request for your health care provider to stop sharing your electronic health and medical records with Connect.
                                                </span>
                                                <br>
                                                <br>
                                                <button data-i18n="agreements.signForm" class="btn btn-agreement consentNextButton" style="" id="signHIPAARevoke">Sign Form</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>    
                            `:''}
                        </div>
                    </div>`:''
                    }
                    <div class="row">
                        <div class="userProfileBox w-100">
                            <div class="row">
                                <div class="col">
                                <span class="userProfileHeader" data-i18n="agreements.signedFormsText">
                                    Signed Forms
                                </span>
                                <br>
                                </div>
                            </div>
                            ${myData.data['119449326'] ?`
                                <div class="row">
                                        <div class="col px-2">
                                            <div class="row"  style="border:1px solid lightgrey; border-radius:5px;">
                                                <div class="col-md-2" data-i18n="agreements.surveyIcon">
                                                    <i class="fab fa-wpforms d-none d-md-block" title="Survey Icon" style="margin-left:10px; font-size:50px;color:#c2af7f;"></i>
                                                </div>
                                                <div class="col-md-10 cnnsentBodyFont2">
                                                    <span class = "consentHeadersFont" style="color:#5c2d93" data-i18n="agreements.samplesDestructionTitle">
                                                        <b>Data destruction request form</b>
                                                    </span>
                                                    <br>
                                                    <span class = "consentBodyFont2" data-i18n="agreements.samplesDestructionDescription">
                                                        Your request for Connect to destroy the information and samples you donated to the study, when possible       
                                                    </span>
                                                    <br>
                                                    <br>
                                                    <span data-i18n="agreements.signed">Signed: </span>${new Date(myData.data['119449326']).toDateString()}
                                                    <br>
                                                    <br>
                                                    <button data-i18n="agreements.downloadSigned" class="btn btn-agreement consentNextButton" style="" id="downloadDestroy"><i class="fas fa-file-download" ></i> Download Signed Form</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                
                            `:''}
                            
                            ${myData.data['613641698'] ?`
                                <div class="row">
                                    <div class="col px-2">
                                        <div class="row"  style="border:1px solid lightgrey; border-radius:5px;">
                                            <div class="col-md-2" data-i18n="agreements.surveyIcon">
                                                <i class="fab fa-wpforms d-none d-md-block" title="Survey Icon" style="margin-left:10px; font-size:50px;color:#c2af7f;"></i>
                                            </div>
                                            <div class="col-md-10 cnnsentBodyFont2">
                                                <span class = "consentHeadersFont" style="color:#5c2d93"  data-i18n="agreements.stopSharingRecordsTitle">
                                                    <b>Revocation of electronic health records release (HIPAA Revocation) form</b>
                                                </span>
                                                <br>
                                                <span class = "consentBodyFont2"  data-i18n="agreements.stopSharingRecordsDescription">
                                                    Your request for your health care provider to stop sharing your electronic health and medical records with Connect.                                                
                                                </span>
                                                <br>
                                                <br>
                                                <span data-i18n="agreements.signed">Signed: </span>${new Date(myData.data['613641698']).toDateString()}
                                                <br>
                                                <br>
                                                <button data-i18n="agreements.downloadSigned" class="btn btn-agreement consentNextButton" style="" id="downloadRevoke"><i class="fas fa-file-download" ></i> Download Signed Form</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            `:''}
                            
                            ${myData.data['454445267'] ?`
                                <div class="row">
                                    <div class="col px-2">
                                        <div class="row"  style="border:1px solid lightgrey; border-radius:5px;">
                                            <div class="col-md-2" data-i18n="agreements.surveyIcon">
                                                <i class="fab fa-wpforms d-none d-md-block" title="Survey Icon" style="margin-left:10px; font-size:50px;color:#c2af7f;"></i>
                                            </div>
                                            <div class="col-md-10 cnnsentBodyFont2">
                                                <span class = "consentHeadersFont" style="color:#5c2d93" data-i18n="agreements.consentFormTitle">
                                                    <b>Consent form to participate in Connect</b>
                                                </span>
                                                <br>
                                                <span class = "consentBodyFont2" data-i18n="agreements.consentFormDescription">
                                                    Your signed agreement to participate in the Connect for Cancer Prevention Study. This form has important information about your privacy and what you will be asked to do as a Connect participant
                                                </span>
                                                <br>
                                                <br>
                                                <span data-i18n="agreements.signed">Signed: </span>${new Date(myData.data['454445267']).toDateString()}
                                                <br>
                                                <br>
                                                <a data-i18n="agreements.downloadSigned" class="btn btn-agreement consentNextButton" id="downloadConsent" download="signed_consent.pdf" data-file="signed-consent"><i class="fas fa-file-download" ></i> Download Signed Form</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `:''}
                            
                            ${myData.data['262613359'] ? `
                                <div class="row">
                                    <div class="col px-2">
                                        <div class="row"  style="border:1px solid lightgrey; border-radius:5px;">
                                            <div class="col-md-2" data-i18n="agreements.surveyIcon">
                                                <i class="fab fa-wpforms d-none d-md-block" title="Survey Icon" style="margin-left:10px; font-size:50px;color:#c2af7f;"></i>
                                            </div>
                                            <div class="col-md-10 cnnsentBodyFont2">
                                                <span class = "consentHeadersFont" style="color:#5c2d93" data-i18n="agreements.releaseFormTitle">
                                                    <b>Electronic health records release (HIPAA Authorization) form </b>
                                                </span>
                                                <br>
                                                <span class = "consentBodyFont2" data-i18n="agreements.releaseFormDescription">
                                                    Your signed agreement to allow your health care provider to share your electronic health and medical records with Connect.                                                </span>
                                                <br>
                                                <br>
                                                <span data-i18n="agreements.signed">Signed: </span>${new Date(myData.data['262613359']).toDateString()}
                                                <br>
                                                <br>
                                                <a data-i18n="agreements.downloadSigned" class="btn btn-agreement consentNextButton" id="downloadHIPAA" download="signed_hipaa.pdf" data-file="signed-HIPAA"><i class="fas fa-file-download" ></i> Download Signed Form</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `:''}
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `);
    }
    else{
        template += translateHTML(`<div class="row align-center">
        <span class="consentBodyFont1 w-100" data-i18n="agreements.noFormsText">
            You have no forms available to view.
        </span>
    </div>`);
    }
    
    document.getElementById('root').innerHTML = template;
    addEventAgreementOptions(myData);
    hideAnimation();
}

const addEventAgreementOptions = (myData) => {
    const anchorIdArray = ['downloadConsent', 'downloadHIPAA'];
    for (const anchorId of anchorIdArray) {
      const anchorElement = document.getElementById(anchorId);
      if (!anchorElement) continue;

      anchorElement.addEventListener('click', async (e) => {
        await downloadSignedPdf(myData.data, e);
      });

      // Handle touch events in iPhone/iPad
      anchorElement.addEventListener('touchend', () => {
        anchorElement.click();
      });
    }

    const downloadRevoke = document.getElementById('downloadRevoke');
    if(downloadRevoke){
        downloadRevoke.addEventListener('click', () => {
            renderDownloadRevoke(myData.data)
        })
    }

    const downloadDestroy = document.getElementById('downloadDestroy');
    if(downloadDestroy){
        downloadDestroy.addEventListener('click', () => {
            renderDownloadDestroy(myData.data)
        })
    }

    const signDataDestroy = document.getElementById('signDataDestroy');
    if(signDataDestroy) {
        signDataDestroy.addEventListener('click', () => {
            
            renderSignDataDestroy(myData.data);
        })
    }

    const signHIPAARevoke = document.getElementById('signHIPAARevoke');
    if(signHIPAARevoke) {
        signHIPAARevoke.addEventListener('click', () => {
            
            renderSignHIPAARevoke(myData.data);
        })
    }
}

const renderDownloadRevoke = async (data) => {
    const middleName = data[826240317] ? ` ${data[826240317]} ` : ' ';
    const suffix = data[693626233] ? suffixToTextMap.get(parseInt(data[693626233])) : '';
    const participantSignature = `${data[765336427]}${middleName}${data[479278368]} ${suffix}`.trim();
    const pdfLocation = `./forms/${data[fieldMapping.hipaaRevokeVersion]}.pdf`;
    const versionArray  = data[fieldMapping.hipaaRevokeVersion].split('_');
    const version = versionArray[2];
    const lang = versionArray[3] ? versionArray[3] : 'Eng';
    const currentTime = new Date(data[613641698]).toLocaleDateString();

    const coords = hipaaRevokeSignPosMap[version][lang];

    renderDownload(participantSignature, currentTime, pdfLocation, {x: coords.nameX ,y: coords.nameY}, {x:coords.signatureX,y: coords.signatureY}, {x:coords.dateX,y:coords.dateY},20,15,20);
}


const renderDownloadDestroy = async (data) => {
    const middleName = data[268665918] ? ` ${data[268665918]} ` : ' ';
    const suffix = data[592227431] ? suffixToTextMap.get(parseInt(data[592227431])) : '';
    const participantSignature = `${data[104278817]}${middleName}${data[744604255]} ${suffix}`.trim();
    const langSuffix = languageSuffix();
    const selectedLanguage = getSelectedLanguage();
    const pdfLocation = `./forms/${data[fieldMapping.dataDestructionVersion]}.pdf`;
    const versionArray  = data[fieldMapping.dataDestructionVersion].split('_');
    const version = versionArray[2];
    const lang = versionArray[3] ? versionArray[3] : 'Eng';
    const currentTime = new Date(data[119449326]).toLocaleDateString();

    const coords = dataDestructionSignPosMap[version][lang];

    renderDownload(participantSignature, currentTime, pdfLocation, {x: coords.nameX ,y: coords.nameY}, {x:coords.signatureX,y: coords.signatureY}, {x:coords.dateX,y:coords.dateY},20,15,20);
}

const renderSignDataDestroy = async () =>{
    document.getElementById('root').innerHTML = translateHTML(`
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div style="width:80%; margin:auto">
            <h4 class="consentSubheader" style="margin-top:50px" data-i18n="agreements.destructionFormTitle">Data destruction request form</h4>
            <div id="canvasContainer"></div>
            <div class="row" style="margin:auto"><div style="margin:auto"><a data-i18n="agreements.downloadDestructionForm" href="./forms/Data_Destruction_${consentVersions['DataDestruction']}.pdf" title="Download Data destruction request form" data-bs-toggle="tooltip" download="DataDestruction_${consentVersions['DataDestruction']}.pdf" class="consentBodyFont2"> Download an unsigned copy of the Data destruction request form&nbsp<i class="fas fa-file-download"></i></a></div></div>
            </div>` + consentSignTemplate() + 
        `</div>
    </div>
    `);
    
    const selectedLanguage = appState.getState().language;
    const langSuffix = languageSuffix()[selectedLanguage];
    initializeCanvas(`./forms/Data_Destruction_${consentVersions['DataDestruction']}${(langSuffix ? '_'+langSuffix : '')}.pdf`, 1, 'canvasContainer');
    document.getElementById('backToAgreements').addEventListener('click', async () =>{
        showAnimation();
        await renderAgreements();
        hideAnimation();
    })
    const consentForm = document.getElementById('consentForm');
    consentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAnimation();
        const selectedLanguage = appState.getState().language;
        const langSuffix = languageSuffix()[selectedLanguage];
        let formData = {};
        formData['359404406'] = 353358909;
        formData['119449326'] = dateTime();      
        formData['883668444'] = 704529432;
        formData['304438543'] = `Data_Destruction_${consentVersions['DataDestruction']}${(langSuffix ? '_'+langSuffix : '')}`;  
        formData['104278817'] = document.getElementById('CSFirstName').value;
        formData['268665918'] = document.getElementById('CSMiddleName').value;
        formData['744604255'] = document.getElementById('CSLastName').value;
        formData['592227431'] = document.getElementById('CSNameSuffix').value;

        const response = await storeResponse(formData);
        if(response.code === 200) {
            await renderAgreements();
        }
        hideAnimation();
    })
}

const renderSignHIPAARevoke = async () =>{
    document.getElementById('root').innerHTML = translateHTML(`
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div style="width:80%; margin:auto">
            <h4 class="consentSubheader" style="margin-top:50px" data-i18n="agreements.revocationFormTitle">HIPAA Revocation Form</h4>
            <div id="canvasContainer"></div>
            <div class="row" style="margin:auto"><div style="margin:auto"><a data-i18n="agreements.downloadRevocationForm" href="./forms/HIPAA_Revocation_${consentVersions['Revocation']}.pdf" title="Download HIPAA Revocation form" data-bs-toggle="tooltip" download="Revocation_${consentVersions['Revocation']}.pdf" class="consentBodyFont2"> Download an unsigned copy of the HIPAA Revocation form&nbsp<i class="fas fa-file-download"></i></a></div></div>
            </div>` + consentSignTemplate() + 
        `</div>
    </div>
    `);

    const selectedLanguage = appState.getState().language;
    const langSuffix = languageSuffix()[selectedLanguage];
    
    initializeCanvas('./forms/HIPAA_Revocation_V1.0'+(langSuffix ? '_'+langSuffix : '')+'.pdf', 1, 'canvasContainer');
    document.getElementById('backToAgreements').addEventListener('click', async () =>{
        showAnimation();
        await renderAgreements();
        hideAnimation();
    })
    const consentForm = document.getElementById('consentForm');
    consentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAnimation();
        let formData = {};
        const selectedLanguage = appState.getState().language;
        const langSuffix = languageSuffix()[selectedLanguage];
        formData['153713899'] = 353358909;
        formData['613641698'] = dateTime();
        formData['577794331'] = 121454001;
        formData['407743866'] = `HIPAA_Revocation_${consentVersions['Revocation']}${(langSuffix ? '_'+langSuffix : '')}`;  
        formData['765336427'] = document.getElementById('CSFirstName').value;
        formData['826240317'] = document.getElementById('CSMiddleName').value;
        formData['479278368'] = document.getElementById('CSLastName').value;
        formData['693626233'] = document.getElementById('CSNameSuffix').value;

        const response = await storeResponse(formData);
        if(response.code === 200) {
            await renderAgreements();
        }
        hideAnimation();
    })
}

const renderDownload = async (participant, timeStamp, fileLocation, nameCoordinates, signatureCoordinates, timeCoordinates, nameSize, timeSize, signSize) => {
    let fileLocationDownload = fileLocation.slice(2)
    const participantPrintName = participant
    const participantSignature = participant
    const pdfLocation = fileLocation;
    const existingPdfBytes = await fetch(pdfLocation).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const editPage = pdfDoc.getPages().at(-1);

    editPage.drawText(`
    ${participantPrintName}`, {
                x: nameCoordinates.x,
                y: nameCoordinates.y,
                size: nameSize,
      });
    editPage.drawText(`
    ${timeStamp}`, {
                x: timeCoordinates.x,
                y: timeCoordinates.y,
                size: timeSize,
      });
    editPage.drawText(`
    ${participantSignature}`, {
        x: signatureCoordinates.x,
        y: signatureCoordinates.y,
        size: signSize,
        font: helveticaFont,
      });
    
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, fileLocationDownload, "application/pdf");
}

const consentSignTemplate = () => {
    return translateHTML(`
    <form id="consentForm" class="mt-5" method="POST">
        <div id="CSConsentNameSignContainer">
            <div class="row g-0 mx-auto" style="width:80%;">
                <div class="col-md-4 mb-4 pe-md-4">
                    <div style="min-height: 48px">
                        <label class="consent-form-label" data-i18n="agreements.firstName">
                            First name<span class="required">*</span>
                        </label>
                    </div>
                    <input required type="text" autocomplete="off" id="CSFirstName" class="form-control col-md-10" placeholder="" style="margin-left:0px;">
                    <br>
                </div>
                <div class="col-md-2 mb-4 px-md-2">
                    <div style="min-height: 48px">
                        <label class="consent-form-label" data-i18n="agreements.middleName">
                            Middle name<span></span>
                        </label>
                    </div>
                    <input type="text" autocomplete="off" id="CSMiddleName" class="form-control col-md-10" placeholder="" style="margin-left:0px;">
                    <br>
                </div>
                <div class="col-md-4 mb-4 px-md-4">
                    <div style="min-height: 48px">
                        <label class="consent-form-label" data-i18n="agreements.lastName">
                            Last name<span class="required">*</span>
                        </label>
                    </div>
                    <input required type="text" autocomplete="off" id="CSLastName" class="form-control col-md-10" placeholder="" style="margin-left:0px;">
                    <br>
                </div>
                <div class="col-md-2 mb-4 ps-md-2">
                    <div style="min-height: 48px">
                        <label class="consent-form-label" data-i18n="form.suffixList">
                            Suffix<span></span>
                        </label>
                    </div>
                    <select name="NameSuffix" class="form-control" id="CSNameSuffix">
                        <option value="" data-i18n="form.selectOption">-Select-</option>
                        <option value="${fieldMapping.suffixValue.jr}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.jr).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.jr)}</option>
                        <option value="${fieldMapping.suffixValue.sr}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.sr).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.sr)}</option>
                        <option value="${fieldMapping.suffixValue.first}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.first).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.first)}</option>
                        <option value="${fieldMapping.suffixValue.second}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.second).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.second)}</option>
                        <option value="${fieldMapping.suffixValue.third}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.third).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.third)}</option>
                        <option value="${fieldMapping.suffixValue.fourth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.fourth).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.fourth)}</option>
                        <option value="${fieldMapping.suffixValue.fifth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.fifth).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.fifth)}</option>
                        <option value="${fieldMapping.suffixValue.sixth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.sixth).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.sixth)}</option>
                        <option value="${fieldMapping.suffixValue.seventh}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.seventh).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.seventh)}</option>
                        <option value="${fieldMapping.suffixValue.eighth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.eighth).replace('.', '')}">${suffixToTextMapDropdown.get(fieldMapping.suffixValue.eighth)}</option>
                    </select>
                    <br>
                </div>
            </div>
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-12">
                        <div class="d-flex flex-column flex-sm-row justify-content-between gap-3" data-i18n="agreements.navButtons">
                            <button class="btn btn-primary consentPrevButton w-100 w-sm-auto me-sm-5" type="button" id="backToAgreements">Back</button>
                            <button type="submit" class="btn btn-primary save-data consentNextButton w-100 w-sm-auto ms-sm-5">Sign and Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
    `);
}

/**
 * Generates a signed PDF file, and returns the URL of the file
 * @param {object} data
 * @param {'signed-consent'| 'signed-HIPAA'} file
 * @returns Promise<string>
 */
async function generateSignedPdf(data, file) {
  let sourcePdfLocation;
  let coords;
  let dateStr;
  const siteDict = siteAcronyms();
  const participantSite = siteDict[data['827220437']];
  const middleName = data[436680969] ? ` ${data[436680969]} ` : ' ';
  const suffix = data[480305327] ? suffixToTextMap.get(parseInt(data[480305327])) : '';
  const participantFullName = `${data[471168198]}${middleName}${data[736251808]} ${suffix}`.trim();
  const fontSize = siteToSignFontSizeMap[participantSite] ?? siteToSignFontSizeMap['default'];
  
  if (file === 'signed-consent') {
    sourcePdfLocation = './forms/consent/' + data[fieldMapping.consentVersion] + '.pdf';
    dateStr = new Date(data[454445267]).toLocaleDateString();
    const versionArray = data[fieldMapping.consentVersion].split('_');
    const version = versionArray[2];
    const lang = versionArray[3] ? versionArray[3] : 'Eng';
    if (siteToConsentSignPosMap[participantSite] && siteToConsentSignPosMap[participantSite][version] && siteToConsentSignPosMap[participantSite][version][lang]) {
        coords = siteToConsentSignPosMap[participantSite][version][lang];
    } else if (siteToConsentSignPosMap[participantSite] && siteToConsentSignPosMap[participantSite][version] && siteToConsentSignPosMap[participantSite][version].nameX) {
        coords = siteToConsentSignPosMap[participantSite][version];
    } else if (siteToConsentSignPosMap[participantSite] && siteToConsentSignPosMap[participantSite]['default']) {
        coords = siteToConsentSignPosMap[participantSite]['default'];
    } else {
        coords = siteToConsentSignPosMap['default'];
    }
  } 
  else if (file === 'signed-HIPAA') {
    sourcePdfLocation = './forms/HIPAA/' + data[fieldMapping.hipaaVersion] + '.pdf';
    dateStr = new Date(data[262613359]).toLocaleDateString();
    const versionArray  = data[fieldMapping.hipaaVersion].split('_');
    const version = versionArray[2];
    const lang = versionArray[3] ? versionArray[3] : 'Eng';
    if (siteToHipaaSignPosMap[participantSite] && siteToHipaaSignPosMap[participantSite][version] && siteToHipaaSignPosMap[participantSite][version][lang]) {
        coords = siteToHipaaSignPosMap[participantSite][version][lang];
    } else if (siteToHipaaSignPosMap[participantSite] && siteToHipaaSignPosMap[participantSite]['default']) {
        coords = siteToHipaaSignPosMap[participantSite]['default'];
    } else {
        coords = siteToHipaaSignPosMap['default'];
    }
  }

  // adjust existing position data becaused of position shift
  coords = {
    nameX: coords.nameX + 25,
    nameY: coords.nameY - 25,
    signatureX: coords.signatureX + 25,
    signatureY: coords.signatureY - 25,
    dateX: coords.dateX + 25,
    dateY: coords.dateY - 25,
  };

  const sourcePdfBytes = await fetch(sourcePdfLocation).then((res) =>
    res.arrayBuffer()
  );
  const pdfDoc = await PDFDocument.load(sourcePdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const pageToEdit = pdfDoc.getPages().at(-1);

  pageToEdit.drawText(participantFullName, {
    x: coords.nameX,
    y: coords.nameY,
    size: fontSize.nameSize,
  });
  pageToEdit.drawText(dateStr, {
    x: coords.dateX,
    y: coords.dateY,
    size: fontSize.dateSize,
  });
  pageToEdit.drawText(participantFullName, {
    x: coords.signatureX,
    y: coords.signatureY,
    size: fontSize.signatureSize,
    font: helveticaFont,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(blob);

  return pdfUrl;
}
  
/**
 * 
 * @param {object} data 
 * @param {MouseEvent} evt mouse click event
 * @returns 
 */
export async function downloadSignedPdf(data, evt) {
  if (!evt.target.href) {
    evt.preventDefault();
    evt.target.href = await generateSignedPdf(data, evt.target.dataset.file);
    evt.target.click();
    return;
  }

  if (isMobile && evt.target.href) {
    evt.preventDefault();
    openNewTab(evt.target.href);
    return;
  }
}
