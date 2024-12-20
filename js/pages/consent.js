import { todaysDate, storeResponse, dataSavingBtn, dateTime, errorMessageConsent, siteAcronyms, getMyData, hasUserData, isMobile, openNewTab, languageSuffix, getSelectedLanguage, translateHTML, translateText} from "../shared.js";
import { renderUserProfile } from "../components/form.js";
import { removeAllErrors } from "../event.js";
import { downloadSignedPdf } from "./agreements.js";
import { heardAboutStudy } from "./healthCareProvider.js";
import {addEventHeardAboutStudy} from "../event.js";
import fieldMapping from "../fieldToConceptIdMapping.js";
import formVersions from "../../forms/formVersions.js";
import { suffixToTextMap } from "../settingsHelpers.js";

export const consentTemplate = () => {
    consentWelcomePage();
}

const renderProgress = (progress) => {
    let progressBar = [];
    let textColor = [];
    let lineColor = [];
    let weight = [];
    let prog = progress - 1;
    for(let i = 0; i < 9; i++){
        if(i < prog){
            progressBar[i] = '#112f4e';
            textColor[i] = 'white';
            lineColor[i] = '#112f4e';
            weight[i]= ''
        }
        else if(i == prog){
            progressBar[i] = '#005ea2';
            textColor[i] = 'white';
            lineColor[i] = '#005ea2';
            weight[i]='font-weight:bold;'
        }
        else{
            progressBar[i] = 'white'
            textColor[i] = '#black';
            lineColor[i] = 'lightgrey';
            weight[i]=''
        }
    }
    let list = ['Welcome','About','Activities','Privacy','Leaving','Results','Benefits', 'Indigenous Peoples', 'Consent', '']
    let toReturn = translateHTML(`
    <br>
    <div class="row d-none d-md-flex" style="margin-bottom:30px">
        <div class="col-lg-1">
        </div>
        <div class="col-lg-10">
            <div class="row">
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[0]};border-radius:50%;border:5px solid ${lineColor[0]};line-height:19px;color:${textColor[0]}">1</div><div style="${weight[0]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list0">${list[0]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[0]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[1]};border-radius:50%;border:5px solid ${lineColor[1]};line-height:19px;color:${textColor[1]}">2</div><div style="${weight[1]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list1">${list[1]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[1]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[2]};border-radius:50%;border:5px solid ${lineColor[2]};line-height:19px;color:${textColor[2]}">3</div><div style="${weight[2]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list2">${list[2]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[2]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[3]};border-radius:50%;border:5px solid ${lineColor[3]};line-height:19px;color:${textColor[3]}">4</div><div style="${weight[3]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list3">${list[3]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[3]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[4]};border-radius:50%;border:5px solid ${lineColor[4]};line-height:19px;color:${textColor[4]}">5</div><div style="${weight[4]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list4">${list[4]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[4]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[5]};border-radius:50%;border:5px solid ${lineColor[5]};line-height:19px;color:${textColor[5]}">6</div><div style="${weight[5]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list5">${list[5]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[5]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[6]};border-radius:50%;border:5px solid ${lineColor[6]};line-height:19px;color:${textColor[6]}">7</div><div style="${weight[6]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list6">${list[6]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[6]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[7]};border-radius:50%;border:5px solid ${lineColor[7]};line-height:19px;color:${textColor[7]}">8</div><div style="${weight[7]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list7">${list[7]}</div></div>
            <div class="col" style="margin:0;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[7]};"></div></div>
            <div class="col" style="margin:0;padding:0;width:40px;"><div style="margin:auto;text-align:center;width:30px;height:30px;background:${progressBar[8]};border-radius:50%;border:5px solid ${lineColor[8]};line-height:19px;color:${textColor[8]}">9</div><div style="${weight[8]}text-align:center;font-family: 'Noto Sans', sans-serif;" data-i18n="consent.list8">${list[8]}</div></div>
            </div>
        </div>
        <div class="col-lg-1">
        </div>
    </div>
    <div class="row d-md-none" style="">
        <div class="col-lg-1">
        </div>
        <div class="col-lg-10">
            <div class="row">
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[0]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[1]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[2]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[3]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[4]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[5]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[6]};"></div></div>
            <div class="col" style="margin:2px;padding:0"><div style="width=100%;height:10px;margin-top:11px;margin-bottom:5px;background:${lineColor[7]};"></div></div>
            </div>
        </div>
        <div class="col-lg-1">
        </div>
    </div>
    <div class="row d-md-none" style="margin-top:-50px; padding-bottom:0px">
        <div class="col-lg-1">
        </div>
        <div class="col-lg-10">
            <div class="row" style"padding-bottom:0px;padding-top:0px;">
                <div class="consentBodyFont2" style="text-align:center;width:30px;height:30px;background:#2A72A5;border-radius:50%;border:5px solid #2A72A5;line-height:19px;color:white; display:inline;">${progress > 9?9:progress}</div>
                <p class="consentBodyFont2" style="margin-left:4px; color:#2A72A5;"><span data-i18n="consent.progressText"> of 9 </span><b style="color:#2E2E2E; font-family: 'Noto Sans', sans-serif; font-weight:bold;">${progress > 9?'':'<span data-i18n="consent.list'+(progress-1)+'">'+list[progress-1]+'</span>'}</b></p> 
            </div>
        </div>
        <div class="col-lg-1">
        </div>
    </div>`);
    return toReturn;
}

const consentWelcomePage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(1);
    template += translateHTML(` 
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.welcomePageHeader"><b>Welcome</b></p>
                <p class="consentBodyFont1" data-i18n="consent.welcomePageBody1">Thank you for your interest in the <b>Connect for Cancer Prevention Study!</b> In the following screens, we will tell you about Connect and what it means to take part in this research study.</p>
                <p class="consentBodyFont1" data-i18n="consent.welcomePageBody2">Then, you will view the full informed consent form and electronic health records release form. These forms provide more details about the study. After you view these forms, you can decide if you want to join Connect.</p>
                <div class="row" style="padding:0;">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToHeardAboutStudyForm" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toActivities" style="margin-top:10px; width:100%;"><b data-i18n="consent.nextButtonText">Next</b></button>
                    </div>
                </div>
            </div>
            <div class="col-lg-2">
            </div>
        </div>`);
    mainContent.innerHTML = template;

    document.getElementById('toActivities').addEventListener('click', () => {
        consentAboutPage();
    })
    document.getElementById('backToHeardAboutStudyForm').addEventListener('click', async () => {
        const myData = await getMyData();
        const formData = hasUserData(myData) && myData.data[fieldMapping.heardAboutStudyForm]
         ? myData.data[fieldMapping.heardAboutStudyForm] 
         : {}
        const mainContent = document.getElementById('root');
        mainContent.innerHTML = heardAboutStudy(formData);
        addEventHeardAboutStudy();
    })
}

const consentAboutPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(2);
    template += translateHTML(` 
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.aboutPageHeader"><b>What is the Connect for Cancer Prevention Study?</b></p>
                <p class="consentBodyFont1" data-i18n="consent.aboutPageBody1">This research study explores causes of cancer with the goal of learning about new ways to prevent cancer in adults. Since it takes time to understand what may cause cancer, Connect will go on for many years. The longer you participate, the more we may learn.</p>
                <p class="consentBodyFont1" data-i18n="consent.aboutPageBody2">Researchers will study things like habits, behaviors, and the environment where you and others live. By looking at these factors, researchers hope to learn new ways to stop cancer from forming in the first place.</p>
                <p class="consentBodyFont1" data-i18n="consent.aboutPageBody3">Connect will study cancer prevention. Researchers will not look for treatments for cancer, give medical care, or share medical advice. Instead, Connect will study the causes of cancer and new ways to prevent it.</p>
                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToAbout" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toActivities" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>
            </div>
            <div class="col-lg-2">
            </div>
        </div>`);
    mainContent.innerHTML = template;

    document.getElementById('toActivities').addEventListener('click', () => {
        consentActivitiesPage();
    })
    document.getElementById('backToAbout').addEventListener('click', () => {
        consentWelcomePage();
    })
}

const consentActivitiesPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(3);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.activitiesPageHeader">What Will I Do If I Join?</p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody1">Cancer can be caused by many things, so we will collect different kinds of information to give us a better picture of your overall health.</p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody2">If you join this study, we will ask you to:</p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody3">1. Share some information about yourself</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody4">To keep in touch, we ask for your contact information. We also ask for personal information such as your name, birth date, and address, to identify you. These details help us gather information about you—like whether you live close to a park, or how much pollution is in your neighborhood. We also ask you to share your social security number. This is optional. Sharing your social security number will help us collect information from other sources, such as state and national public health databases.</p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody5">2. Allow us to access your health records</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody6">We ask your permission to use information from your electronic health records. Your health records have information about your health history, health status, test results, medical procedures, images (such as x-rays), and any medicines you may take. Your health records may have sensitive information. For example, they may tell us about your use of medicines for depression and infections (including HIV status). If you sign the electronic health records release form, your health care system will safely give us access to your health records following the rules under the Health Insurance Portability and Accountability Act (HIPAA).</p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody7">3. Take surveys about your health</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody8">We will ask you to complete online surveys when you join the study and a few times each year. The surveys will cover information about you and about your health history, family, home, and work. The first survey may take one to two hours to complete. This survey is made of sections, which you can pause and complete at a later time. Follow up surveys will usually take 20 to 30 minutes or less to complete. You can choose to skip any survey questions that you do not want to answer. </p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody9">4. Donate samples</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody10"><b>Samples are like time capsules of information about your current health status.</b> We collect samples throughout your time in Connect to study how your health may change. Studying these changes is important to understanding how cancer and other health outcomes may develop.</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody11">We will ask you to donate blood, urine, and mouthwash samples when you join the study, and every two to three years after. Some samples will be collected at your health care system and others at home. We may also collect samples that are left over from health care visits and procedures, like tissue samples after a surgery, if they are available. You will not need to do anything for us to collect these leftover samples. Your samples will be stored at the Connect Central Repository, which is a secure storage facility with limited access.</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody12">We will save most of the samples for study in the future, as new tests become available for research over time. When new tests are available, researchers may study things like proteins or genetic material (DNA). Saving the samples for tests that have not been developed yet could help us understand more about cancer prevention and early detection.</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody13">Tests that we run as part of Connect do not take the place of routine medical care.</p>
                <p class="consentBodyFont1" data-i18n="consent.activitiesPageBody14">5. Take part in future activities</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody15">In the future, we may invite you to take part in other study activities. These other activities are not required, so you can skip them and still be in Connect.</p>
                <p class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody16">
                    These activities may include:
                </p>
                <ul class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.activitiesPageBody16List">
                    <li>Donating other samples (like nails and hair) or samples from your home (like dust or dryer lint)</li>
                    <li>Having measurements taken (like height, weight, and blood pressure)</li>
                    <li>Sharing information from wearable devices or phone apps that measure things like diet, sleep, or air quality in your environment</li>
                </ul>  
                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToAbout" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2" data-i18n="consent.activitiesPageNextButton">
                        <button class="btn btn-primary consentNextButton" type="button" id="toPrivacy" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>
            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToAbout').addEventListener('click', () => {
        consentAboutPage();
    })
    document.getElementById('toPrivacy').addEventListener('click', () => {
        consentPrivacyPage();
    })
}

const consentPrivacyPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(4);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.privacyPageHeader">Your Privacy is Important to Us</p>
                <p class="consentBodyFont1" data-i18n="consent.privacyPageBody1">As part of the study, we ask you to share information that can identify you, like your name, address, social security number, and health information. Our team values the important information you share with us, and will protect this information with the highest privacy standards.</p>
                <p class="consentBodyFont1" data-i18n="consent.privacyPageBody2">To protect your information, we:</p>
                <ul class="consentBodyFont1" style="margin-left:32px" data-i18n="consent.privacyPageBody2List">
                    <li>Follow federal privacy rules, including the <a target="_blank" href="https://www.justice.gov/archives/opcl/overview-privacy-act-1974-2015-edition">Privacy Act</a> and the <a target="_blank" href="https://grants.nih.gov/grants/guide/notice-files/NOT-OD-19-050.html">Common Rule</a>.</li>
                    <li>Maintain tight security controls. Our information systems, including MyConnect, are watched closely by security experts.</li>
                    <li>Remove information that can identify you, including your name and date of birth, from your survey answers and samples before we share them with researchers. This information is replaced with a unique number to protect your identity.</li>
                    <li>Limit and keep track of who can access the information and samples you share. Only approved researchers who agree to our privacy rules may use study information and samples for valid scientific research.</li>
                    <li>Maintain our <a target="_blank" href="https://grants.nih.gov/policy/humansubjects/coc.htm">Certificate of Confidentiality</a> from the United States government. This will help protect against any legal requests (such as a court order) to give out information that could identify you.</li>                
                </ul>   
                <p class="consentBodyFont1" data-i18n="consent.privacyPageBody3">If you have questions about privacy, please <a target="_blank" href="https://norcfedramp.servicenowservices.com/recruit">contact us</a>.</p>

                <div class="row" style="padding:0;">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToActivities" style="min-width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toBenefits" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML = template;
    document.getElementById('backToActivities').addEventListener('click', () => {
        consentActivitiesPage();
    })
    document.getElementById('toBenefits').addEventListener('click', () => {
        consentBenefitsPage();
    })
}

const consentBenefitsPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(5);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.benefitsPageHeader">If You Leave the Study or Change Health Systems</p>
                <p class="consentBodyFont1" data-i18n="consent.benefitsPageBody1">We hope that you will take part in Connect throughout your life. While we hope you stay involved in the study for years to come, you may choose to leave at any time. Choosing to leave the study will not change your health care or health benefits. If you shared any information or samples before you leave, we may still use them for research.</p>
                <p class="consentBodyFont1" data-i18n="consent.benefitsPageBody2">If you leave your health care system, you are allowed to continue your study participation and we hope you will stay in Connect. If you leave your current health care system and join a different system (even one that is not taking part in Connect), we will continue to work with you and value your study participation.</p>

                <div class="row" style="padding:0;">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToPrivacy" style="min-width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toResults" style="min-width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToPrivacy').addEventListener('click', () => {
        consentPrivacyPage();
    })
    document.getElementById('toResults').addEventListener('click', () => {
        consentResultsPage();
    })
}

const consentResultsPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(6);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.resultsPageHeader">When Will I Get Information and Results from Connect?</p>
                <p class="consentBodyFont1" data-i18n="consent.resultsPageBody1">From time to time, you will receive information grouped from all the people taking part in Connect. For example, you may receive information about the percentage of current Connect participants who report sleep difficulties, or who drink coffee.</p>
                <p class="consentBodyFont1" data-i18n="consent.resultsPageBody2">We will also offer to share with you some of the things that we learn specifically about you. The information we share may include results from your surveys or from tests of your samples. These tests may be run at different time points. Because of the types of research questions we will be asking through Connect, and since we are always going to be looking for new ideas to explore, it may be years before we run some tests and get information to share back with you. Other tests may be run sooner. We carefully save samples at the Connect lab for future studies to be sure we will be able to make the most out of every sample you donate as part of Connect.</p>
                <p class="consentBodyFont1" data-i18n="consent.resultsPageBody3">When we have information or results about you to share, we will let you know. At that time, we will share background information on the results and how they could be used. You may then decide if you want to receive them. If you choose to receive results, we will share them securely on MyConnect.</p>
                <p class="consentBodyFont1" data-i18n="consent.resultsPageBody4">We will never add results or information from Connect to your health record or share your information with your health care providers. You may choose to share any results or information you receive with your health care providers or others.</p>
                
                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToBenefits" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toLeaving" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToBenefits').addEventListener('click', () => {
        consentBenefitsPage();
    })
    document.getElementById('toLeaving').addEventListener('click', () => {
        consentLeavingPage();
    })
}

const consentLeavingPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(7);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.leavingPageHeader">Benefits and Payment</p>
                <p class="consentBodyFont1" data-i18n="consent.leavingPageBody1">Connect is a low-risk study. The main risk of joining is to your privacy. To minimize this risk, we follow federal privacy rules to protect your identity and the information you share. There is no health benefit to you for taking part in the study.</p>
                <p class="consentBodyFont1" data-i18n="consent.leavingPageBody2">You will receive $25 in cash or as a gift card after you complete all sections of the first online survey and donate your first blood sample.</p>
                
                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToResults" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toConsent" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>
                

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToResults').addEventListener('click', () => {
        consentResultsPage();
    })
    document.getElementById('toConsent').addEventListener('click', () => {
        consentIndigenousPage();
    })
}

const consentIndigenousPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(8);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.indigenousPageHeader">Why is Connect interested in engaging Indigenous Peoples?</p>
                <p class="consentBodyFont1" data-i18n="consent.indigenousPageBody1">Our goal as a Connect team is to be inclusive. We want to include people from many places and backgrounds throughout the United States so our findings may benefit all communities.
                Connect aims to include people and communities that have been left out of research in the past, such as Indigenous Peoples. Indigenous populations native to the U.S. may include people who identify as American Indian, Alaska Native, Native Hawaiian, and/or Pacific Islander and their communities. If people from many backgrounds, such as Indigenous Peoples, are left out of research, we cannot learn if research findings apply to them, their communities, or their future generations.</p>
                <p class="consentBodyFont1" data-i18n="consent.indigenousPageBody2">Would you like to learn more about what it means to take part in Connect for anyone who identifies as an Indigenous Person?</p>
                <form id="consentIndigenousInfo" method="POST">
                    <input type="radio" name="choice" value="yes" id="consentIndigenousYes"><span data-i18n="consent.indigenousPageYes"> Yes, tell me more</span></input>
                    <br>
                    <input type="radio" name="choice" value="no" id="consentIndigenousNo" required><span data-i18n="consent.indigenousPageNo"> No, continue to consent</span></input>
                    
                    <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                        <div class="col-md-2">
                            <button class="btn btn-primary consentPrevButton" type="button" id="backToResults" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                        </div>
                        <div class="col-md-8">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary consentNextButton" type="submit" id="toConsent" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                        </div>
                    </div>
                </form>

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToResults').addEventListener('click', () => {
        consentLeavingPage();
    })
    
    document.getElementById('consentIndigenousInfo').addEventListener('submit', (e) => {
        e.preventDefault();
        if(!document.getElementById("consentIndigenousYes").checked){
            consentConsentPage();
        }
        else{
            consentIndigenousAffectPage();
        }
    })
}

const consentIndigenousAffectPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(8);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.indigenousAffectPageHeader">How might my participation in Connect affect Indigenous communities?</p>
                <p class="consentBodyFont1" data-i18n="consent.indigenousAffectPageBody1">Some Indigenous Peoples and their communities have emphasized the need to learn more about certain risks and benefits to participating in research studies. Community members may be concerned that research practices will not follow traditional customs, or that conclusions made about Indigenous participants might harm Indigenous communities. However, learning about the health of Indigenous participants may help us make medical discoveries that benefit other people from these communities. Including all communities in research is an important part of advancing medicine and extending benefits to all people.</p>
                <p class="consentBodyFont1" data-i18n="consent.indigenousAffectPageBody2">We acknowledge past transgressions and abuses of Indigenous Peoples in research studies, and the harms these have caused Indigenous communities. We oppose any research that harms Indigenous Peoples and we do not support any research or researcher that has harmed any community. We respect and appreciate your willingness to work with us and know your trust must be earned. We are committed to protecting your privacy, keeping your information safe, and maintaining the integrity of our research. We want our research to respect the cultures and practices of all Indigenous Peoples.</p>
                <p class="consentBodyFont1" data-i18n="consent.indigenousAffectPageBody3">We may not understand the barriers that Indigenous Peoples face when it comes to participating in research studies. However, we hope to work with you to learn more about the considerations and concerns of your communities and advance our understanding of health and disease together. As a Connect team, we hope to make medical discoveries that will benefit all people.</p>

                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToResults" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toConsent" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>
                

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToResults').addEventListener('click', () => {
        consentIndigenousPage();
    })
    document.getElementById('toConsent').addEventListener('click', () => {
        consentIndigenousProtectPage();
    })
}

const consentIndigenousProtectPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(8);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.indigenousProtectPageHeader">How is my information protected?</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousProtectPageBody1">If you join the study, we will remove your personal information, like your name, date of birth, and health information, from your survey answers and samples before we share them with researchers. Only researchers who agree to our privacy rules may use your survey answers and samples for their research. These researchers will not have access to information that identifies you.</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousProtectPageBody2">As part of our research, we look for patterns to learn more about health and disease. Your self-identified race will be linked to your information and samples and can help us study these patterns.</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousProtectPageBody3">It is possible that when members of small populations (such as some Indigenous populations) take part in research, it may be easier to identify them from other information they share. This also means it may be easier to connect someone back to their community. Connect prohibits researchers from attempting to re-identify individual participants or link them to their communities.</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousProtectPageBody4">It is possible that research findings could be associated with people who share your race identity. Connect opposes publishing research findings that stigmatize Indigenous communities or any racial or ethnic group.</p>
                <p class="consentBodyFont1" data-i18n="consent.indigenousProtectPageBody5">Samples</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousProtectPageBody6">If you decide to leave the study, we will work with you to determine a plan for the return or destruction of your samples, if requested. We may not be able to return or destroy samples that have already been used for research.</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousProtectPageBody7">If a participant passes away during their time in the study, we will work with the participant’s family or other community members to determine a plan for return or destruction of their samples, if requested.</p>

                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToResults" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toConsent" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>
                

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToResults').addEventListener('click', () => {
        consentIndigenousAffectPage();
    })
    document.getElementById('toConsent').addEventListener('click', () => {
        consentIndigenousOtherPage();
    })
}

const consentIndigenousOtherPage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(8);
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.indigenousOtherPageHeader">What else should I know?</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousOtherPageBody1">If you identify as an Indigenous Person and want to join Connect, please consider:</p>
                <ul class="consentBodyFont2" style="margin-left:32px" data-i18n="consent.indigenousOtherPageBody1List">
                    <li>Reading more about participation and the details of what it means to take part in Connect <a target="__blank" href="https://www.cancer.gov/connect-prevention-study/what-to-expect">here</a>.</li>
                    <li>Speaking with your community members, leaders, and family about participating in Connect.</li>
                    <li>Contacting the Connect Support Center with any questions you have. Our team is happy to speak with you and discuss any concerns you may have about taking part in the study. (<a target="__blank" href="https://norcfedramp.servicenowservices.com/recruit">Cancer.gov/connectstudy/support</a>, or call 1-866-462-6621 8:00 a.m.-10:00 p.m. CT on weekdays, and 9:00 a.m.-6:00 p.m. CT on weekends).</li>
                </ul>
                <p class="consentBodyFont2" data-i18n="consent.indigenousOtherPageBody2">If you join now and later decide to leave the study, you can do so at any time, for any reason.</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousOtherPageBody3">The decision to join Connect is yours to make. Please choose what you are most comfortable with. We respect your decision and your privacy, and welcome any feedback that you would like to share with us. Please call us at 1-866-462-6621 8:00 a.m.-10:00 p.m. CT on weekdays, and 9:00 a.m.-6:00 p.m. CT on weekends, or write to us at ConnectStudy@norc.org.</p>
                <p class="consentBodyFont2" data-i18n="consent.indigenousOtherPageBody4">Thank you for learning about how Connect will engage with Indigenous Peoples. On the next screen, you can view the full consent form and electronic health records release form to continue the consent process.</p>

                <div class="row" style="padding:0; margin-top:40px;margin-bottom:40px">
                    <div class="col-md-2">
                        <button class="btn btn-primary consentPrevButton" type="button" id="backToResults" style="min-width:100%; margin-top:10px;margin-bottom:10px;" data-i18n="consent.prevButtonText">Previous</button>
                    </div>
                    <div class="col-md-8">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary consentNextButton" type="button" id="toConsent" style="width:100%; margin-top:10px;margin-bottom:10px" data-i18n="consent.nextButtonText">Next</button>
                    </div>
                </div>
                

            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    mainContent.innerHTML =  template;
    document.getElementById('backToResults').addEventListener('click', () => {
        consentIndigenousProtectPage();
    })
    document.getElementById('toConsent').addEventListener('click', () => {
        consentConsentPage();
    })
}

const consentConsentPage = async () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(9);
    
    const myData = await getMyData();
    if(!hasUserData(myData)) return;

    let siteDict = siteAcronyms();
    let participantSite = siteDict[myData.data['827220437']];

    let selectedLanguage = getSelectedLanguage();
    let langSuffix = languageSuffix();
    
    template += translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <p class="consentHeadersFont" data-i18n="consent.consentPageHeader">Informed Consent</p>
                <p class="consentBodyFont1" data-i18n="consent.consentPageBody1">To join Connect, we need you to review the full informed consent form and electronic health records release (HIPAA Authorization) form below. If you have any questions, contact the Connect Support Center at <a target="_blank" href="https://norcfedramp.servicenowservices.com/recruit">Cancer.gov/connectstudy/support</a> or call 1-866-462-6621. Once you are comfortable with the study and decide to join, please sign the forms electronically by scrolling to the bottom of this screen and clicking, “Yes, I agree to join Connect.” Then, please type your name into the fields that appear and click “Next” to view and download copies of your signed forms.</p>
            
                <div style="width:80%; margin:auto">
                    <h4 class="consentSubheader" style="margin-top:50px" data-i18n="consent.consentPageSubheader1">Informed Consent Form</h4>
                    <p class="consentBodyFont2" style="text-indent:40px" data-i18n="consent.consentPageBody2">This form explains in detail what it means to take part in Connect. To join the study, please scroll down to the bottom of this screen to electronically consent. You do not need to download and sign the form the join the study.</p>
                    <p class="consentBodyFont2" style="text-indent:40px" data-i18n="consent.consentPageBody3">If you have trouble viewing the consent form in the window at the bottom of this screen, you can download an unsigned copy by scrolling down and selecting that option below.</p>

                    <iframe id="pdfIframeContainer" class="border border-secondary rounded" data-i18n="consent.consentIframe${participantSite}" src="${'./forms/consent/' + participantSite + '_Consent_' + formVersions[participantSite]['Consent'] + (langSuffix[selectedLanguage] ? '_' + langSuffix[selectedLanguage] : '') + '.html'}" style="width:100%; height:500px; overflow:scroll;"><span class="loader">Please wait...</span></iframe>
                    <div class="row"style="margin:auto"><div style="margin:auto"><a data-i18n="consent.consentUnsigned${participantSite}" href="${'./forms/consent/'  + participantSite + '_Consent_' + formVersions[participantSite]['Consent'] + (langSuffix[selectedLanguage] ? '_' + langSuffix[selectedLanguage] : '') + '.pdf'}" title="Download consent form" data-bs-toggle="tooltip" download="connect_consent.pdf" class="consentBodyFont2" data-file="unsigned-form"> Download an unsigned copy of the informed consent form&nbsp<i class="fas fa-file-download"></i></a></div></div>
                    
                    <h4 class="consentSubheader" style="margin-top:50px" data-i18n="consent.consentPageSubheader2">Electronic health records release (HIPAA Authorization) form</h4>
                    <p class="consentBodyFont2" style="text-indent:40px" data-i18n="consent.consentPageBody4">This allows Connect to access your electronic health records. To join the study, please scroll down to the bottom of this screen to electronically consent. You do not need to download and sign the form to join the study.</p>
                    <p class="consentBodyFont2" style="text-indent:40px" data-i18n="consent.consentPageBody5">If you have trouble viewing the electronic health records release form in the window at the bottom of this screen, you can download an unsigned copy by scrolling down and selecting that option below.</p>
                    
                    <iframe id="pdfIframeContainer1" class="border border-secondary rounded" data-i18n="consent.hipaaIframe${participantSite}" src="${'./forms/HIPAA/' + participantSite + '_HIPAA_' + formVersions[participantSite]['HIPAA'] + '.html'}" style="width:100%; height:500px; overflow:scroll;"><span class="loader" data-i18n="consent.consentPageWait">Please wait...</span></iframe>
                    <div class="row" style="margin:auto"><div style="margin:auto"><a data-i18n="consent.hipaaUnsigned${participantSite}" href="${'./forms/HIPAA/'  + participantSite + '_HIPAA_' + formVersions[participantSite]['HIPAA'] + '.pdf'}" title="Download health records release form" data-bs-toggle="tooltip" download="connect_hipaa.pdf" class="consentBodyFont2" data-file="unsigned-form">Download an unsigned copy of the release form&nbsp<i class="fas fa-file-download"></i></a></div></div>
                    
                    <p class="consentBodyFont2" style="margin-top:50px" data-i18n="consent.consentPageBody6">By clicking “Yes, I agree to join Connect” and typing your name, you confirm the following:</p>
                    <ol class="consentBodyFont2" data-i18n="consent.consentPageBody6List">
                        <li>I have read these forms.</li>
                        <li>As  stated  in  the  consent  and  HIPAA  Authorization,  I  will allow  the  use,  storage, and  disclosure  (release) of  my  survey  answers, samples,  and  health  information for the research as described above.</li>
                        <li>If I have questions, I can contact the Connect Support Center at <a target="_blank" href="https://norcfedramp.servicenowservices.com/recruit">Cancer.gov/connectstudy/support</a> or by calling 1-866-462-6621</li>
                        <li>If I decide to leave the study, I can contact the Connect Support Center at <a target="_blank" href="https://norcfedramp.servicenowservices.com/recruit">Cancer.gov/connectstudy/support</a></li>
                    </ol>
                    <input type="checkbox" name="consentAnswer" value="consentYes" id="CSConsentYesCheck">
                    <label for="consentYes" style=" font-size:20px" id="CSConsentYes" data-i18n="consent.consentPageAgree">Yes, I agree to join Connect</label><br>
                </div>
            
                <form id="consentForm" class="mt-5" method="POST">
                    <div id="CSConsentNameSignContainer" style="display:none">
                        <div class="row g-0 mx-auto" style="width:80%;">
                            <div class="col-md-4 mb-4 pe-md-4">
                                <div style="min-height: 48px">
                                    <label class="consent-form-label consentSignHeader" data-i18n="consent.consentPageFormFirstName">
                                        First name<span class="required">*</span>
                                    </label>
                                </div>
                                <input type="text" autocomplete="off" id="CSFirstName" class="form-control" placeholder="">
                                <div class="invalid-feedback text-danger mt-1" style="font-size: 0.875rem;">
                                    Your first name should contain only uppercase and lowercase letters. Please do not use any numbers or special characters.
                                </div>
                            </div>
                            <div class="col-md-2 mb-4 px-md-2">
                                <div style="min-height: 48px">
                                    <label class="consent-form-label consentSignHeader" data-i18n="consent.consentPageFormMiddleName">
                                        Middle name<span></span>
                                    </label>
                                </div>
                                <input type="text" autocomplete="off" id="CSMiddleName" class="form-control" placeholder="">
                                <div class="invalid-feedback text-danger mt-1" style="font-size: 0.875rem;"></div>
                            </div>
                            <div class="col-md-4 mb-4 px-md-4">
                                <div style="min-height: 48px">
                                    <label class="consent-form-label consentSignHeader" data-i18n="consent.consentPageFormLastName">
                                        Last name<span class="required">*</span>
                                    </label>
                                </div>
                                <input type="text" autocomplete="off" id="CSLastName" class="form-control" placeholder="">
                                <div class="invalid-feedback text-danger mt-1" style="font-size: 0.875rem;"></div>
                            </div>
                            <div class="col-md-2 mb-4 ps-md-2">
                                <div style="min-height: 48px">
                                    <label class="consent-form-label consentSignHeader" data-i18n="consent.consentPageFormSuffixLabel">
                                        Suffix<span></span>
                                    </label>
                                </div>
                                <select name="NameSuffix" class="form-control" id="CSNameSuffix">
                                    <option value="" data-i18n="form.selectOption">-- Select --</option>
                                    <option value="${fieldMapping.suffixValue.jr}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.jr).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.jr).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.sr}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.sr).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.sr).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.first}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.first).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.first).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.second}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.second).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.second).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.third}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.third).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.third).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.fourth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.fourth).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.fourth).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.fifth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.fifth).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.fifth).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.sixth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.sixth).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.sixth).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.seventh}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.seventh).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.seventh).replace('.', ''))}</option>
                                    <option value="${fieldMapping.suffixValue.eighth}" data-i18n="${'settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.eighth).replace('.', '')}">${translateText('settingsHelpers.suffix'+suffixToTextMap.get(fieldMapping.suffixValue.eighth).replace('.', ''))}</option>
                                </select>
                                <div class="invalid-feedback text-danger mt-1" style="font-size: 0.875rem;"></div>
                            </div>
                        </div>
                        <div class="row mx-auto" style="width:80%;">
                            <p class="consentBodyFont2 text-secondary" data-i18n="consent.consentPageFormLegalName">
                                Please enter your legal name. If you are a member of Kaiser Permanente, please enter your first and last name exactly as it appears on your Kaiser Permanente ID card.
                            </p>
                        </div>
                    </div>
                    <div class="row my-1">
                        <div class="col-md-2">
                            <button class="btn btn-primary consentPrevButton w-100 my-2" type="button" id="backToConsent" data-i18n="consent.prevButtonText">Previous</button>
                        </div>
                        <div class="col-md-8">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary save-data consentNextButton w-100" type="submit" id="toConsent" data-i18n="consent.submitButtonText">Submit</button>
                        </div>
                    </div>
                </form>
            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    
    mainContent.innerHTML =  template;
    let checkbox = document.getElementById('CSConsentYesCheck')
    checkbox.addEventListener('change', ()=>{
        if(checkbox.checked) {
            document.getElementById('CSConsentNameSignContainer').style.display="block"
        } else {
            document.getElementById('CSConsentNameSignContainer').style.display="none"
        }
    });
    
    let frame1 = document.getElementById("pdfIframeContainer")
    frame1.onload = function(){
        frame1.contentWindow.document.body.style.padding = '10px'
        frame1.contentWindow.document.body.querySelectorAll('p').forEach( pItem => {
            if(pItem.style && pItem.style['text-align'] == 'justify'){
                pItem.style['text-align'] = 'left'
            }
        })
    };
    
    let frame2 = document.getElementById('pdfIframeContainer1')
    frame2.onload = function(){
        frame2.contentWindow.document.body.style.padding = '10px'
        frame2.contentWindow.document.body.querySelectorAll('p').forEach( pItem => {
            if(pItem.style && pItem.style['text-align'] == 'justify'){
                pItem.style['text-align'] = 'left'
            }
        })
    };

    document.getElementById('backToConsent').addEventListener('click', () => {
        consentIndigenousPage();
    })

    if (isMobile) {
        const anchorArray = document.querySelectorAll('a[data-file="unsigned-form"]');
        for (const anchor of anchorArray) {
          anchor.addEventListener(
            "click",
            (e) => {
              openNewTab(anchor.href);
              e.preventDefault();
            }
          );
        }
      }

    addEventConsentSubmit();
}

export const consentFinishedPage = async () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = renderProgress(10);
    const myData = await getMyData();
    if(!hasUserData(myData)) return;

    let data = myData.data;

    template += translateHTML(`
    <div class="row">
        <div class="col-md-2">
        </div>
        <div class="col-md-8">
            <div>
                <h2 data-i18n="consent.finishedPageHeader">You have completed the consent process</h2>
            </div>
            <div style="margin-left:20px">
                <div class="row"><div style="margin-left:20px"><i class="fas fa-file-download"></i> <a data-i18n="consent.finishedPageDownloadConsentForm" style="margin-left:10px" title="Download consent form" data-bs-toggle="tooltip" id="consentDownload" download="signed_consent.pdf" data-file="signed-consent" >Download a copy of your signed consent form&nbsp</a></div></div>
                <div class="row"><div style="margin-left:20px"><i class="fas fa-file-download"></i> <a data-i18n="consent.finishedPageDownloadReleaseForm" style="margin-left:10px" title="Download health records release form" data-bs-toggle="tooltip" id="healthRecordsDownload" download="signed_hipaa.pdf" data-file="signed-HIPAA" >Download a copy of your signed health records release form&nbsp</a></div></div>
            </div>
            <div class="row">
            <div class="col-md-2">  
            </div>
            <div class="col-md-8">  
            </div>
            <div class="col-md-2">  
            <button class="btn btn-primary consentNextButton" type="button" id="toLeaving" style="width:100%;margin-top:40px;margin-bottom:40px; padding:12px" data-i18n="consent.nextButtonText">Next</button>
            </div>
            </div>
        </div>
        <div class="col-md-2">
        </div> 
        
    `);
    
    mainContent.innerHTML =  template;
    document.getElementById('toLeaving').addEventListener('click', () => {
        consentToProfilePage();
    })

    const anchorIdArray= ['consentDownload', 'healthRecordsDownload'];
    for (const anchorId of anchorIdArray) {
      const anchorElement = document.getElementById(anchorId);
      if (!anchorElement) continue;

      anchorElement.addEventListener('click', async (e) => {
        await downloadSignedPdf(data, e);
      });

      // Handle touch events in iPhone/iPad
      anchorElement.addEventListener('touchend', (e) => {
        anchorElement.click();
      });
    }
}

export const consentToProfilePage = () => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('root');
    let template = '';
    
    template += translateHTML(`
    <div class="row pt-5">
        <div class="col-md-2">
        </div>
        <div class="col-md-8">
            <h2 data-i18n="consent.profilePageHeader">Thank you for your interest in the Connect for Cancer Prevention Study</h2>
            <div>
                <p data-i18n="consent.profilePageBody">
                    Thank you for completing the consent process. We need some more information about you to confirm that you can be part of the study. After you complete this step, we will use the information 
                    you share to check your eligibility and contact you within a few business days. We respect your privacy and protect the personal information you share with us.
                    <br>
                    If you have any questions, please contact the <a href="https://norcfedramp.servicenowservices.com/recruit" target="_blank">Connect Support Center</a>.
                </p>
            </div>   
            <div class="row">
            <div class="col-md-2">  
            </div>
            <div class="col-md-8">  
            </div>
            <div class="col-md-2">  
            <button class="btn btn-primary consentNextButton" type="button" id="toLeaving" style="width:100%;margin-top:40px;margin-bottom:40px; padding:12px" data-i18n="consent.nextButtonText">Next</button>
            </div>
            </div>
        </div>
        <div class="col-md-2">
        </div> 
        
    </div>

    `);
    
    mainContent.innerHTML =  template;
    document.getElementById('toLeaving').addEventListener('click', () => {
        renderUserProfile();
    })

}

export const initializeCanvas = async (file, customScale, canvasContainer) => {
    let scale = 1;
    if(window.innerWidth > 1000) scale = 1.3;
    if(window.innerWidth < 700) scale = 0.7;
    if(customScale) scale = customScale

    drawCanvas(file, scale, canvasContainer);
}

const drawCanvas = (file, scale, canvasContainer) => {
    let thePdf = null;
    pdfjsLib.getDocument(file).promise.then(function(pdf) {
        thePdf = pdf;
        let viewer = document.getElementById(canvasContainer);
        if(!viewer) return;
        viewer.innerHTML = '';
        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const canvas = document.createElement("canvas");    
            canvas.className = 'pdf-page-canvas';         
            viewer.appendChild(canvas);
            thePdf.getPage(pageNumber).then(function(page) {
                let viewport = page.getViewport(scale);
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                page.render({canvasContext: canvas.getContext('2d'), viewport: viewport});
            });
        }
    });
}

function renderPage(num, pageIndicator, pdfDoc, viewer) {
    
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function(page) {
        while (viewer.firstChild) {
            viewer.removeChild(viewer.firstChild);
        }
        let canvas = document.createElement("canvas");
        canvas.className = 'pdf-page-canvas';         
        viewer.appendChild(canvas);

        var viewport = page.getViewport(viewer.clientWidth / page.getViewport(1.0).width);

        canvas.style.height = viewport.height + 'px';
        canvas.style.width = viewport.width + 'px';
        canvas.height = 3*viewport.height;
        canvas.width = 3*viewport.width;

        viewer.style = `min-height:${Math.min(viewport.height, 500)}px;max-height:${Math.min(viewport.height+10, 500)}px;`

        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport,
            transform: [3,0,0,3,0,0]
        };
        var renderTask = page.render(renderContext);

    });
  
    // Update page counters
    document.getElementById(pageIndicator).textContent = num;
  }

function queueRenderPage(num, pageIndicator, pdfDoc, canvas) {
      renderPage(num, pageIndicator, pdfDoc, canvas);
  }
  
/**
 * Displays previous page.
 */
function onPrevPage(pageIndicator, pdfDoc, canvas) {
    if(document.getElementById(pageIndicator)){
        let pageNum = parseInt(document.getElementById(pageIndicator).textContent);
        if(isNaN(pageNum)){
            return;
        }
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum, pageIndicator, pdfDoc, canvas);

    }
}
  
  /**
   * Displays next page.
   */
function onNextPage(pageIndicator, pdfDoc, canvas) {
    if(document.getElementById(pageIndicator)){
        let pageNum = parseInt(document.getElementById(pageIndicator).textContent);
        if(isNaN(pageNum)){
            return;
        }
        if (pageNum >= pdfDoc.numPages) {
        return;
        }
        
        pageNum++;
        queueRenderPage(pageNum, pageIndicator, pdfDoc, canvas);
    }
}

  /**
   * Asynchronously downloads PDF.
   */
const drawCanvasPage = (file, scale, canvasContainer, nextButton, prevButton, pageIndicator, pageMax) => {
    pdfjsLib.getDocument(file).promise.then(function(pdfDoc) {
        let viewer = document.getElementById(canvasContainer);
        if(!viewer) return;
        document.getElementById(pageMax).textContent = pdfDoc.numPages;
        
        // Initial/first page rendering
        let pageNum = 1
        if (document.getElementById(pageIndicator) && !isNaN(document.getElementById(pageIndicator))){
            pageNum = parseInt(document.getElementById(pageIndicator).textContent)
        }
            renderPage(pageNum, pageIndicator, pdfDoc, viewer);
        document.getElementById(prevButton).addEventListener('click', () => {onPrevPage(pageIndicator, pdfDoc, viewer)} );
        document.getElementById(nextButton).addEventListener('click', () => {onNextPage(pageIndicator, pdfDoc, viewer)});
    });
    
}

export const addEventConsentSubmit = () => {
    const consentForm = document.getElementById('consentForm');
    consentForm.addEventListener('submit', consentSubmit)
}

const consentSubmit = async e => {
    e.preventDefault();
    removeAllErrors();
    let formData = {};
    const CSFirstName = document.getElementById('CSFirstName');
    const CSMiddleName = document.getElementById('CSMiddleName');
    const CSLastName = document.getElementById('CSLastName');
    const CSNameSuffix = document.getElementById('CSNameSuffix');
    let hasError = false;
    let focus = true;
    var radios = document.getElementsByName('consentAnswer');
    let selectedLanguage = getSelectedLanguage();
    if(!radios[0].checked){
        
        const msg = '<span data-i18n="consent.checkYes">'+translateText('consent.checkYes')+'</span>';
        errorMessageConsent('CSConsentYes', msg, focus)
        focus = false;
        hasError = true;
    }
    if(!hasError){
        if(CSFirstName.value.trim() == "") {
            const msg = '<span data-i18n="consent.firstNameRequired">'+translateText('consent.firstNameRequired')+'</span>';
            errorMessageConsent('CSFirstName', msg, focus)
            focus = false;
            hasError = true;
        }
        if(CSLastName.value.trim() == "") {
            const msg = '<span data-i18n="consent.lastNameRequired">'+translateText('consent.lastNameRequired')+'</span>';
            errorMessageConsent('CSLastName', msg, focus)
            focus = false;
            hasError = true;
        }
        if(/[0-9,\.<>:;!@#\$%\^&\*\+=\[\]\{\}\\\|]/.test(CSFirstName.value)) {
            const msg = '<span data-i18n="consent.firstNameCheck">'+translateText('consent.firstNameCheck')+'</span>';
            errorMessageConsent('CSFirstName', msg, focus)
            focus = false;
            hasError = true;
        }
        if(/[0-9,\.<>:;!@#\$%\^&\*\+=\[\]\{\}\\\|]/.test(CSLastName.value)) {
            const msg = '<span data-i18n="consent.lastNameCheck">'+translateText('consent.lastNameCheck')+'</span>';
            errorMessageConsent('CSLastName', msg, focus)
            focus = false;
            hasError = true;
        }
}
    if(hasError) return false;
    dataSavingBtn('save-data');
    const CSDate = todaysDate();

    
    formData['471168198'] = CSFirstName.value.trim();
    formData['436680969'] = CSMiddleName.value.trim() === '' ? undefined : CSMiddleName.value.trim();
    formData['736251808'] = CSLastName.value.trim();
    formData['480305327'] = CSNameSuffix.value === '' ? undefined : parseInt(CSNameSuffix.value);
    formData['982402227'] = CSDate.split('/')[2]+CSDate.split('/')[0]+CSDate.split('/')[1];
    formData['query.firstName'] = [CSFirstName.value.trim().toLowerCase()];
    formData['query.lastName'] = [CSLastName.value.trim().toLowerCase()];
    formData['919254129'] = 353358909;
    formData['454445267'] = dateTime();
    formData['262613359'] = dateTime();
    formData['558435199'] = 353358909;
    //consent and hipaa forms
    let siteDict = siteAcronyms();
    let langSuffix = languageSuffix();
    
    const myData = await getMyData();
    if(!hasUserData(myData)) return;

    let participantSite = siteDict[myData.data['827220437']];
    formData['454205108'] = participantSite + '_Consent_' + formVersions[participantSite]['Consent'] + (langSuffix[selectedLanguage] ? '_' + langSuffix[selectedLanguage] : '');
    formData['412000022'] = participantSite + '_HIPAA_' + formVersions[participantSite]['HIPAA'] + (langSuffix[selectedLanguage] ? '_' + langSuffix[selectedLanguage] : '');

    // Adding sign in info provided by firebase
    if(firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        if(user.email) formData['421823980'] = user.email;
        if(user.displayName) formData['756862764'] = user.displayName;
        if(user.phoneNumber) formData['348474836'] = user.phoneNumber;
        if(user.providerData) formData['995036844'] = user.providerData[0].providerId; // TODO: datadog Error: TypeError: undefined is not an object (evaluating 'user.providerData[0].providerId')
    }
    
    const CSWFirstName = document.getElementById('CSWFirstName');
    const CSWLastName = document.getElementById('CSWLastName');
    
    if(CSWFirstName && CSWLastName){
        const CSWDate = document.getElementById('CSWDate').innerHTML;

        formData['983784715'] = CSWFirstName.value;
        formData['700668490'] = CSWLastName.value;
        formData['430184574'] = CSWDate.split('/')[2] + CSWDate.split('/')[1] + CSWDate.split('/')[0]
    }
    formData['507120821'] = 596523216;

    //set the prefered language
    formData[fieldMapping.preferredLanguage] = selectedLanguage;
    
    const response = await storeResponse(formData);
    if(response.code === 200) consentFinishedPage ();
}