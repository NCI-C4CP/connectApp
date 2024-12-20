import { getMyData, hasUserData, urls, fragment, checkAccount, validEmailFormat, validPhoneNumberFormat, getCleanSearchString, firebaseSignInRender, signInAnonymously, usGov, translateHTML, translateText, getFirebaseUI, showAnimation, hideAnimation } from "../shared.js";
import { signInConfig } from "./signIn.js";
import { environmentWarningModal, downtimeWarning } from "../event.js";

/**
 * Renders homepage for sign-in/sign-up 
 */
export const homePage = async () => {

  let downtime = false;

    const mainContent = document.getElementById('root');
    mainContent.innerHTML = translateHTML(`
        <div class="container-fluid">
          <div class="row connectBody1">
              <div class="col-lg-2">
              </div>
              <div class="col-lg-4 d-none d-sm-flex text-lg-start text-center" style="text-align:center;">
                  <p class = "homeTitleText" style="text-align:left; font-family: 'Montserrat', sans-serif;" data-i18n="home.titleText">
                    Connect <em>today.</em>
                    <br>Prevent cancer
                    <br><em>tomorrow.</em>
                    <br>
                    <br>
                    <img src="./images/newImages/ConnectLogo.png" alt="Connect logo">
                    <br><br>
                    
                  </p>
              </div>
              <div class="col-lg-4 d-sm-none text-lg-start text-center" style="text-align:center;">
                  <p class = "homeTitleTextMobile" style="text-align:center; font-family: 'Montserrat', sans-serif;" data-i18n="home.titleText">
                  
                      Connect <em>today.</em>
                      <br>Prevent cancer
                      <br><em>tomorrow.</em>
                      <br>
                      <br>
                      <img src="./images/newImages/ConnectLogo.png" alt="Connect logo">
                      <br><br>
                      
                  </p>
              </div>
              <div class="col-md-8 col-lg-4">
                  <div class="signInWrapper" id="signInWrapperDiv">
                    <p class="loginTitleFont" style="text-align:center;" data-i18n="home.loginTitle">Sign In</p>
                    <div id="signInDiv">
                    </div>
                    <p data-i18n="home.haveAccount">
                        <div style="font-size:12px;padding-left:24px; padding-right:24px;margin:auto;.">
                            If you have an account, please sign in with the email or phone number you used to create your account.
                        </div>
                    </p>
                    <div style="font-size:8px;padding-left:24px; padding-right:24px;margin:auto;." data-i18n="shared.usGov">
                        ${usGov}
                    </div>
                  </div>
              </div>
              <div class="col-lg-2 order-4">
              </div>
          </div>
        </div>
        <div class="container-fluid">
          <div class="row connectBody">
              <div class="col-lg-2 ">
              </div>
              <div class="col-lg-4 .d-none text-lg-start text-center connectBodyPicture" data-i18n="home.connectBodyPicture">
                  <img src="./images/newImages/Tiles2.png" alt="Connect logo" width="95%" style="float:left; max-width:380px">
              </div>
              <div class="col-lg-4">
              </div>
              <div class="col-lg-2 order-4">
              </div>
          </div>
        </div>
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-4" style="text-align:left;">
                <p class="MonteserratFont" style = "color:#606060; font-size: 28px;" data-i18n="home.ageQuestion">
                  <b>
                  Are you age 30 to 70 with no history of certain cancers?*    
                  </b>
                </p>
                <p class="NotoSansFont" style="color:#606060; font-size: 18px;" data-i18n="home.joinStudy">
                    We need your help. We invite you to join a research study from the National Cancer Institute, part of the National Institutes of Health, to help understand what causes cancer and how to prevent it.
                </p>
                <p class="NotoSansFont" style="color:#606060; font-size: 15px;" data-i18n="home.joinConnect">
                    *If you have or once had non-melanoma skin cancer (like basal cell or squamous cell carcinoma), or a condition that raises the risk of getting cancer (like DCIS, or stage 0 breast cancer), you can still join Connect.
                </p>
                
            </div>
            <div class="col-lg-4">
                <img src="./images/newImages/Group2.png" alt="Group Picture" style="width:100%" data-i18n="home.groupPicture">
            </div>
            <div class="col-lg-1">
            </div>
        </div>
    `);
    
    const cleanSearchStr = getCleanSearchString(location.search);
    const params = new URLSearchParams(cleanSearchStr);
    const isMagicLinkSignIn = params.get('apiKey') !== null && params.get('mode') === 'signIn';

    if (isMagicLinkSignIn) {
      if ( location.search !== cleanSearchStr ) {
        location.search = cleanSearchStr; // Page reload with clean url
      }
      
        await firebaseSignInRender({account:{type:'magicLink', value:''}});
    } else {
        signInSignUpEntryRender();
    }
    
    location.host !== urls.prod && !isMagicLinkSignIn && environmentWarningModal();
    downtime && downtimeWarning();
}

export const joinNowBtn = (bool) => {
  if (bool) {
    return translateText('home.joinNowTrue')
    }
    else {
    return translateText('home.joinNowFalse')
    }
}

export const whereAmIInDashboard = async () => {
    let myData = await getMyData();
    if(!hasUserData(myData)) return '';
    
    let data = myData.data;
    if(data['827220437'] && data['142654897']){
        if(data['919254129'] === 353358909){
            if(data['699625233'] && data['699625233'] === 353358909 && data['821247024'] && data['821247024'] !== 197316935){
                //Awaiting verification
              return translateText('home.awaitVerification');
            }
            if(data['699625233'] && data['699625233'] === 353358909){
                
                //go do your surveys
              return translateText('home.doSurveys');
            }
            //fill out your user profile
            return translateText('home.fillProfile');
        }
        //sign e-consent
        return translateText('home.signConsent');
    }
    else if(data['827220437'] && !data['142654897']){
        //heard about study
        return translateText('home.heardStudy')
    }
    else if(data['379080287']){
        //pin
        return translateText('home.havePin')
    }
    else{
        //Choose health care provider
        return translateText('home.chooseProvider')
    }
}

export const renderHomeAboutPage =  () => {
    const mainContent = document.getElementById('root');
  mainContent.innerHTML = translateHTML(`
    <div class="row">
       <div class="col-1">
       </div>
       <div class="col-10" id="connectBody">
          <article>
             <div class="resize-content">
                <h1 data-i18n="home.aboutStudyTitle">
                   About the Study
                </h1>
                <div id="cgvBody">
                   <div class="blog-intro-text" data-i18n="home.aboutStudyIntro">
                      <h2 id="why-connect-is-important">Working Together to Prevent Cancer</h2>
                      <img loading="lazy" src=" https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_image/media_image/2021-06/about-the-study-lead.jpg?h=becdecf7&amp;itok=03qT_e3y" width="330" height="320" style="float:right; padding-left: 5px;" alt="A group of diverse older adults standing together with their arms around each other looking to camera" />
                      <p>The Connect for Cancer Prevention Study is a research study that wants to better understand the causes of cancer and how to prevent it. We are asking you to join Connect so that we can study the health and behavior patterns that may affect cancer risk.</p>
                      <p>Together, we can change the future of cancer prevention.</p>
                   </div>
                   <div class="accordion">
                      <nav class="on-this-page hide-otp-on-collapse" role="navigation">
                         <h6 data-i18n="home.onThisPage">On This Page</h6>
                         <ul>
                            <li class="list-style">
                               <a href="#why-connect-is-important">
                                  <p data-i18n="home.whyImportant">Why Connect Is Important</p>
                               </a>
                            </li>
                            <li class="list-style">
                               <a href="#what-to-expect-if-you-decide-to-join">
                                  <p data-i18n="home.whatExpect">What to Expect If You Decide to Join</p>
                               </a>
                            </li>
                            <li class="list-style">
                               <a href="#where-this-study-takes-place">
                                  <p data-i18n="home.wherePlace">Where This Study Takes Place</p>
                               </a>
                            </li>
                            <li class="list-style">
                               <a href="#about-our-researchers">
                                  <p data-i18n="home.aboutResearchers">About Our Researchers</p>
                               </a>
                            </li>
                            <li class="list-style">
                               <a href="#a-resource-for-science">
                                  <p data-i18n="home.resourceScience">A Resource for Science</p>
                               </a>
                            </li>
                         </ul>
                      </nav>
                      <section data-i18n="home.whyImportantSection">
                         <h2 id="why-connect-is-important">
                            <p>Why Connect Is Important</p>
                         </h2>
                         <p>If we learn how to prevent cancer, we can lower the number of people who get it. Cancer is the second-leading cause of death in the United States. While treatments are improving, the number of people who get cancer is expected to rise in the next 10 years as the population ages and lifestyles and behaviors continue to change.</p>
                         <p>To study the causes of cancer and learn how to prevent it, we can follow groups of people over a long period of time. In research, we call these groups cohorts. The Connect for Cancer Prevention Study will follow a new cohort of 200,000 adults throughout the United States.</p>
                         <div class="blog-intro-text">
                         <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_image/media_image/2021-06/biracial-family.jpg?h=10690783&amp;itok=UknIZyNT" width="300" height="210" style="float:left; padding-right:10px;" alt="A couple with two women are swinging a child held between them and smiling" />
                         <p>We are looking for people who have never had cancer to join Connect, but there are some exceptions. If you have or once had non-melanoma skin cancer, or a condition that raises the risk of getting cancer, such as ductal carcinoma <i>in situ</i> (DCIS) of the breast (stage 0 breast cancer), you <u>can still join Connect</u>. If you have any of these conditions, we hope you join Connect. We are interested in learning how these conditions may relate to cancer risk.</p>
                         </div>
                         <p>Patterns that affect cancer risk may vary based on where people live, their race and ethnicity, their age, and other factors. It is important for Connect to include many types of people so that new discoveries can benefit everybody.</p>
                         <p>We are launching Connect today because modern cohorts are needed to study new and future exposures that may affect cancer risk. We are using new technology and research methods that can lead to key discoveries to prevent cancer.</p>
                      </section>
                      <section data-i18n="home.whatExpectSection">
                         <h2 id="what-to-expect-if-you-decide-to-join">
                            <br>
                            <p>What to Expect If You Decide to Join</p>
                         </h2>
                         <p>We will reach out to you when you join the study and then a few times each year to ask for updates about your health and information about things like your habits, diet, exercise, and use of alcohol or tobacco.</p>
                         <p>We will also ask you to donate samples of blood, urine, and saliva (biological specimens) when you join the study and every two or three years after. These samples provide information about what is going on in your body. Information from different types of samples can help us find health and behavior patterns that may affect cancer risk. Learn more from our <a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="6a5a3e24-4247-4b79-b3ab-d5ec782e6d75" href="#expectations">What to Expect</a> page.</p>
                         <p>Connect will go on for many years because events that may affect cancer risk happen over a lifetime, and most cancers develop later in life. If you join, we hope you take part for many years. The longer you participate, the more we may learn.</p>
                      </section>
                      <section data-i18n="home.wherePlaceSection">
                         <h2 id="where-this-study-takes-place">
                            <p>Where This Study Takes Place</p>
                         </h2>
                         <p>For a study of this size and importance, we partnered with health care systems throughout the United States. People who get their health care through these systems tend to stay for a long time. This is an important quality for cohort studies like ours that need to follow people over the course of their lives.</p>
                         <p>Health care systems store private, protected information about their patients’ health from all aspects of care in the form of electronic health records (EHRs). By agreeing to share the information in your EHRs with Connect, researchers can get a full picture of your health. We can also coordinate with your health care system to collect leftover samples from your regular health care visits, like stool or urine, or tissue from people who develop a cancer or precancer.</p>
                      </section>
                      <section data-i18n="home.aboutResearchersSection">
                         <h2 id="about-our-researchers">
                            <p>About Our Researchers</p>
                         </h2>
                         <div class="blog-intro-text">
                         <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_image/media_image/2021-06/female-reseracher-tablet.jpg?h=b4427edb&amp;itok=aK3gzwZv" width="320" style="float:right; padding-left:15px;" height="200" st alt="Woman wearing a lab coat looking at a tablet computer" />
                         <p style="margin-bottom: 0.5rem">The Connect for Cancer Prevention Study is being led by our team of federal government researchers at the National Cancer Institute (NCI), part of the National Institutes of Health (NIH), and researchers at partner health care systems. Study teams at partner health care systems have experience conducting research studies like Connect, and many have particular expertise in research related to cancer.</p>
                         </div>
                         <p style="margin-bottom: 0.5rem">Our team at NCI is part of the largest cancer research group in the world that studies the causes of disease, or epidemiology. Our team and other researchers at NCI have long histories of studying cancer and have made important discoveries. For example, in another cohort study, we found that drinking coffee was associated with lower risk of death from cancer and other causes. This was good news for coffee drinkers! NCI research informs public health policy in the United States and around the world. Connect will contribute evidence that can impact public health policy far into the future.</p>
                         <p style="margin-bottom: 0.5rem">See the full <a href="https://dceg.cancer.gov/research/who-we-study/cohorts/connect#study-team" >Connect team</a> information page to learn about the people leading this research.</p>
                      </section>
                      <section data-i18n="home.resourceScienceSection">
                         <h2 id="a-resource-for-science">
                            <p>A Resource for Science</p>
                         </h2>
                         <p>Our team and others at NCI develop research resources and partnerships for the broader research community. We will safely store information from Connect online so researchers around the world can work together to study the causes of cancer and learn how to prevent it. Scientists in cancer research and other areas who are not part of Connect can ask to use the information we collect for their research. We protect your privacy by removing information that can identify you from your survey answers and samples before we share them with other researchers. The more scientists who study the information we collect, the more we can discover. To learn more about how we safely store and share information, visit the <a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="88d25dc4-9a83-4394-ac97-c45e460173b3" href="#privacy">Your Privacy</a> section of this site.</p>
                         <p>Researchers interested in studying information collected through the Connect for Cancer Prevention Study can <a href="https://dceg.cancer.gov/research/who-we-study/cohorts/connect">learn more about the cohort</a> and how to request access to shared resources.</p>
                      </section>
                   </div>
                </div>
             </div>
             <footer class="article-footer">
                <div id="nvcgSlSyndication">
                   <div class="contentid-911760 slot-item only-SI">
                      <div class="syndication">
                      </div>
                   </div>
                </div>
             </footer>
          </article>
       </div>
       <div class="col-1">
       </div>
    </div>     `);
    window.scrollTo(0, 0);
}

export const renderHomeExpectationsPage = () => {
    const mainContent = document.getElementById('root');
  mainContent.innerHTML = translateHTML(`
    <div class="row">
       <div class="col-1">
       </div>
       <div class="col-10" id="connectBody">
          <article>
        <div class="resize-content">
          <h1 data-i18n="home.whatExpectTitle">
              What to Expect
          </h1>
          <div id="cgvBody">
              <div class="blog-intro-text" data-i18n="home.whatExpectIntro">
                <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_image/media_image/2021-06/what-to-expect-lead.jpg?h=becdecf7&amp;itok=Xqd0--45" width="350" height="320" style="float:right; padding-left:15px;" alt="Two women smiling. One woman has her arm leaning on her partner."/>
                <p>If you are interested in joining the Connect for Cancer Prevention Study and think you are eligible, it is easy to sign up. If you choose to join Connect, we will ask you to take part in study activities from time to time. Most study activities are easy to complete online a few times each year.</p>
              </div>
              <div class="accordion">
                <nav class="on-this-page hide-otp-on-collapse" role="navigation">
                    <h6 data-i18n="home.onThisPage">On This Page</h6>
                    <ul>
                      <li class = "list-style">
                          <a href="#joining-connect">
                            <p data-i18n="home.joiningConnect">Joining Connect</p>
                          </a>
                      </li>
                      <li class = "list-style">
                          <a href="#after-you-join">
                            <p data-i18n="home.afterJoin">After You Join</p>
                          </a>
                      </li>
                      <li class="list-style">
                          <a href="#long-term-study-activities">
                            <p data-i18n="home.studyActivities">Long-term Study Activities</p>
                          </a>
                      </li>
                      <li class="list-style">
                          <a href="#what-connect-will-do">
                            <p data-i18n="home.whatWillDo">What Connect Will Do</p>
                          </a>
                      </li>
                      <li class="list-style">
                          <a href="#how-your-information-will-help-prevent-cancer">
                            <p data-i18n="home.preventCancer">How Your Information Will Help Prevent Cancer</p>
                          </a>
                      </li>
                    </ul>
                </nav>
                <section data-i18n="home.joiningConnectSection">
                    <h2 id="joining-connect">
                      <p>Joining Connect</p>
                    </h2>
                    <p class="paragraph">You can sign up for Connect through MyConnect, where you can complete the online informed consent process, agree to share your electronic health records, and create a profile. Then, the Connect team at your health care system will check that you are eligible to join the study.</p>
                    <p>To sign up for Connect:</p>
                    <h3>1.	Visit MyConnect</h3>
                    <p>Click the Home button at the top of this page to sign up for Connect. MyConnect is supported on Google Chrome, Safari, Microsoft Edge, and Firefox internet browsers.</p>
                    <h3>2. Complete the Online Informed Consent Process</h3>
                    <p>
                      The online informed consent process will tell you what it means to take part in Connect and how we will protect your privacy. We will guide you through a series of web pages about the study. Please read the full 
                      <a data-entity-substitution="canonical" data-entity-type="media" data-entity-uuid="78c89167-2c80-46e8-945c-953229718faf" href="https://www.cancer.gov/connect-prevention-study/what-to-expect/sample-consent">informed consent form</a>. 
                      <a href="https://norcfedramp.servicenowservices.com/recruit">Connect Support Center</a>
                      staff can answer any questions you have about the study before you decide to join.
                    </p>
                    <h3>3. Agree to Share Your Electronic Health Records (EHRs)</h3>
                    <div class="blog-intro-text">
                    <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_image/media_image/2021-06/man-on-ipad.jpg?h=6fb3b3f4&amp;itok=UnPBIuSF" width="350" height="230" style="float:right; padding-left:15px" alt="A man is sitting on the couch and looking at information on a tablet"/>
                    <p>These records include information about your past, current, or future health status, test results, medical procedures, images (such as x-rays), and medicines you take.</p>
                    </div>
                    <p>Sharing your health records gives researchers a full picture of your health. Seeing the full picture can help us learn what may make some people more likely to get cancer than others.</p>
                    <p>
                      Please read the full HIPAA Authorization form. Signing this form will allow Connect to access your health records. 
                      <a href="https://norcfedramp.servicenowservices.com/recruit">Connect Support Center</a>
                      staff can answer any questions about the study and sharing your health records before you decide to join.
                    </p>
                    <h3>4. Create a Profile</h3>
                    <p>We will ask you to fill in information like your name, date of birth, address, and how you prefer that we contact you.</p>
                    <p>The Connect team at your health care system will use this information to check that you are eligible for the study. We will contact you within a few business days to let you know if you are able to join Connect.</p>
                    <div class="callout-box">
                      <p>
                          <a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="88d25dc4-9a83-4394-ac97-c45e460173b3" href="#privacy">Your privacy</a>
                          is important to us. We follow security rules to protect your information.
                      </p>
                    </div>
                    <p>Joining Connect will not affect your health care or health benefits. If you join, you can stop at any time. There is no monetary cost tied to taking part in Connect.</p>
                </section>
                <section data-i18n="home.afterJoinSection">
                    <h2 id="after-you-join">
                      <p>After You Join</p>
                    </h2>
                    <p>If you join Connect, we will ask you to complete online surveys and donate blood, urine, and saliva samples (biological specimens).</p>
                    <p>We will share some results from your surveys and samples with you privately, if you choose to receive them. We will not add information from the study to your health record or share information with your health care providers, but you are free to share any results you receive with your health care providers and anyone else. We will also share updates about Connect and group level results from all the people taking part in the study online over time.</p>
                    <div data-embed-button="cgov_image_button" data-entity-embed-display="view_mode:media.image_display_article_small" data-entity-type="media" data-entity-uuid="ad936b40-5dad-48fb-a55a-eab139bae8dc" data-langcode="en" class="embedded-entity align-right">
                      <figure class="image-small centered-set">
                          <div class="centered-element">
                            <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_contextual_image/2021-06/Surveys-icon.png?h=83bea889&amp;itok=PmiznnRF" width="100" height="100" style="float:right; padding-left:15px" alt="Online survey icon"/>
                          </div>
                      </figure>
                    </div>
                    <h3>Answer Online Surveys</h3>
                    <p>Connect surveys will ask about your health, habits, family, home, and work. We will send you surveys to complete when you join the study and then a few times each year. The first survey can take one to two hours to complete. This survey is broken into sections, so you can pause and return to complete it at any time. Most follow up surveys will take 20 to 30 minutes to complete. Surveys can be completed on any computer, tablet, or smartphone that connects to the internet. You can skip any questions that you are not comfortable answering.</p>
                    <div data-embed-button="cgov_image_button" data-entity-embed-display="view_mode:media.image_display_article_small" data-entity-type="media" data-entity-uuid="991aae93-b84a-4890-af37-563a83abc48b" data-langcode="en" class="embedded-entity align-right">
                      <figure class="image-small centered-set">
                          <div class="centered-element">
                            <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_contextual_image/2021-06/samples-icon.png?h=ab0ab1c4&amp;itok=efuNvI64" width="100" height="100" style="float:right; padding-left:15px" alt="Icon of a small cup of a sample"/>
                          </div>
                      </figure>
                    </div>
                    <h3>Donate Samples</h3>
                    <p>We will ask you to donate blood, urine, and saliva samples (biological specimens) when you join the study and then every two to three years after. Samples are like time capsules of information about your current health status. We collect samples throughout your time in Connect to study how your health may change. Studying these changes is important to understanding how cancer and other health outcomes may develop.</p>
                    <p>When you donate each sample, we will ask you to answer a short survey about your recent actions (like medicines you took or foods you ate).</p>
                    <p>Some samples may be collected where you get your health care. Others are easy for you to collect at home. There is no monetary cost tied to donating samples.</p>
                    <p>After you complete the first set of surveys and donate your first blood sample, you will receive $25 in cash or as a gift card, depending on your health care system.</p>
                </section>
                <section data-i18n="home.studyActivitiesSection">
                    <h2 id="long-term-study-activities">
                      <p>Long-term Study Activities</p>
                    </h2>
                    <p>It takes time to understand the causes of cancer. Changes in your life, habits, behaviors, and the things we can measure in your samples give us important information that we can use to understand how cancer and other diseases may develop. If you join, we hope you will be an active part of Connect for years to come.</p>
                    <p>For as long as you are part of Connect, we will ask you to:</p>
                    <ul>
                      <li class="list-style">Update your information and answer new online surveys at least once a year.</li>
                      <li class="list-style">Donate new blood, urine, and saliva samples every two to three years.</li>
                    </ul>
                    <p>We may invite you to take part in other study activities. These are optional. We may provide payment for some of these other activities. You can say yes or no to these activities and stay in Connect.</p>
                    <p>These activities could include:</p>
                    <ul>
                      <li class="list-style">Donating other samples (like toenails or hair) or samples from your home (like dust or dryer lint).</li>
                      <li class="list-style">Having physical measurements (like height, weight, and blood pressure) taken at a health clinic or at home.</li>
                      <li class="list-style">Sharing information from wearable health trackers that you wear or mobile phone apps. These could measure physical activity, diet, sleep, or things about where you live.</li>
                    </ul>
                </section>
                <section data-i18n="home.whatWillDoSection">
                    <h2 id="what-connect-will-do">
                      <p>What Connect Will Do</p>
                    </h2>
                    <div data-embed-button="cgov_image_button" data-entity-embed-display="view_mode:media.image_display_article_small" data-entity-type="media" data-entity-uuid="a06c9cb7-d53a-49fc-a725-6eade93250d4" data-langcode="en" class="embedded-entity align-right">
                      <figure class="image-small centered-set">
                          <div class="centered-element">
                            <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_contextual_image/2021-06/health-records-icon.png?h=83bea889&amp;itok=zq0TdLYR" width="100" height="100" style="float:right; padding-left:15px" alt="Health records icon"/>
                          </div>
                      </figure>
                    </div>
                    <p>If you join Connect, we will collect information from your health care system and other sources to better understand your health.</p>
                    <p>Examples of other sources include:</p>
                    <ul>
                      <li class="list-style">Cancer and other health registries</li>
                      <li class="list-style">Environmental databases that have information about air quality in areas where you live and work</li>
                      <li class="list-style">Other databases, like the census, that have information about your neighborhood</li>
                    </ul>
                    <p>Our team will collect this information. It will not take extra effort on your part.</p>
                    <p>To collect information from some of these sources, we will use your name, address, and social security number (if you shared it) to check that we have the right information for you. We protect your privacy every time we collect information about you from other sources.</p>
                    <p>If your regular health care visits include collection of certain samples, we may coordinate with your health care system to collect any unused portions. These could include:</p>
                    <ul>
                      <li class="list-style">Tissue from medical procedures, such as a biopsy or surgery</li>
                      <li class="list-style">Stool, often used for colon cancer screening</li>
                      <li class="list-style">Samples from HPV and Pap smears, often used for cervical cancer screening</li>
                      <li class="list-style">Blood from blood tests, such as cholesterol checks</li>
                      <li class="list-style">Urine from tests to check for some infections</li>
                    </ul>
                </section>
                <section data-i18n="home.preventCancerSection">
                    <h2 id="how-your-information-will-help-prevent-cancer">
                      <p>How Your Information May Help Prevent Cancer</p>
                    </h2>
                    <p>Your health information and samples can help researchers better understand cancer and its causes. We value the time, effort, and information you choose to share with Connect, and are committed to protecting your privacy every step of the way.</p>
                    <p>
                      <a data-entity-substitution="canonical" data-entity-type="node" data-entity-uuid="4378d52a-d349-4f2d-8d53-79af4d20ec26" href="#about">Researchers around the world</a>
                      may use your information (without identifying you) to better understand the causes of cancer and other health problems.
                    </p>
                    <p>Health information, survey answers, and samples can help researchers answer important questions. Researchers can compare the habits, diet, and health issues of people who get cancer to those who do not. Your blood, urine, and other samples help researchers understand what is happening in your body. For example, we may measure cholesterol or other things that affect health, like vitamin levels or pollution from the environment. This information can help us learn more about the causes of cancer and how to prevent it.</p>
                    <p>We will update you about study progress and what we learn over time.</p>
                    <p>
                      Still have questions about Connect? 
                      <a href="https://norcfedramp.servicenowservices.com/recruit">Contact us</a>.
                    </p>
                </section>
              </div>
          </div>
        </div>
             <footer class="article-footer">
                <div id="nvcgSlSyndication">
                   <div class="contentid-911760 slot-item only-SI">
                      <div class="syndication">
                      </div>
                   </div>
                </div>
             </footer>
          </article>
       </div>
       <div class="col-1">
       </div>
    </div>`);
    window.scrollTo(0, 0);
  };

export const renderHomePrivacyPage = () => {
  const mainContent = document.getElementById('root');
  mainContent.innerHTML = translateHTML(`
    <div class="row">
      <div class="col-1">
      </div>
      <div class="col-10" id="connectBody">
          <article>
            <!-- Banner Area -->
            <!-- End Banner Area -->
            <div class="resize-content">
                <!-- PAGE TITLE -->
                <h1 data-i18n="home.privacyPageTitle">Your Privacy Is Important to Us</h1>
                <!-- END PAGE TITLE -->
                <!-- Contents -->
                <div class="blog-intro-text" data-i18n="home.privacyPageIntro">
              <img loading="lazy" src="https://www.cancer.gov/connect-prevention-study/sites/g/files/xnrzdm246/files/styles/cgov_article/public/cgov_image/media_image/2021-06/your-privacy-lead.jpg?h=becdecf7&amp;itok=iygf7OKL" width="350" height="300" style="float:right; padding-left:20px; " alt="A man in a wheelchair looking at information on a tablet" />
                <p style="margin-top:16px">As part of the study, we ask you to share information that can identify you, like your name, address, and social security number (optional), and health information. Our team values the important information you share with us, and will protect this information with the highest privacy standards.</p>
                <p>To protect your information, we: </p>
                <ul>
                  <li class="list-style">Follow federal privacy rules, including the <a href="https://www.justice.gov/opcl/overview-privacy-act-1974-2020-edition">Privacy Act</a> and the <a href="https://grants.nih.gov/grants/guide/notice-files/NOT-OD-19-050.html">Common Rule</a>.</li>
                  <li class="list-style">Maintain tight security controls. Our information systems, including MyConnect, are watched closely by security experts.</li>
                  <li class="list-style">Remove information that can identify you, including your name, date of birth, and social security number (if you shared it), from your survey answers and samples before we share them with researchers. This information is replaced with a unique number (a code) to protect your identity.</li>
                  <li class="list-style">Limit and keep track of who can access the information and samples you share. Only approved researchers who agree to our privacy rules will be allowed to use study information and samples for valid scientific reasons.</li>
                  <li class="list-style">Maintain our <a href="https://grants.nih.gov/policy/humansubjects/coc.htm">Certificate of Confidentiality</a> from the United States government. This will help protect against any legal requests (such as a court order) to give out information that could identify you.</li>
                </ul>
                <p>If you have questions about our privacy safeguards, please <a href="https://norcfedramp.servicenowservices.com/recruit">contact us</a>.</p>
                <!-- End Contents -->
              </div>
            </div>
          </article>
      </div>
      <div class="col-1">
      </div>
    </div>`);
  window.scrollTo(0, 0);
}

export function signInSignUpEntryRender() {
  const df = fragment`
  <div class="mx-4">
    <p class="loginTitleFont" style="text-align:center;" data-i18n="home.signInTitle">Sign Into Your Account</p>
    <button type="button" class="connect connect-primary" style="width:100%" id="signInBtn" data-i18n="home.signInButton">Sign In</button>
    <hr/>
    <p class="loginTitleFont" style="text-align:center;" data-i18n="home.signUpTitle">Sign Up</p>
    <button type="button" class = "connect connect-secondary" style="width:100%" id="signUpBtn" data-i18n="home.signUpButton">Create Account</button>
    <div style="font-size:8px" class="mt-3" data-i18n="shared.usGov">
    ${usGov}
    </div>
  </div>`;

  // Added this code to properly translate the string
  translateHTML(df.children[0]);
  const signInBtn = df.querySelector('#signInBtn');
  const signUpBtn = df.querySelector('#signUpBtn');

  document.getElementById('signInWrapperDiv').replaceChildren(df);

  signInBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    signInBtn.disabled = true;

    try {
      await signInCheckRender();
    } catch (error) {
      console.error('Error during sign-in:', error);
    } finally {
      signInBtn.disabled = false;
    }
  });
  
  signUpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    signUpBtn.disabled = true;

    try {
      await signUpRender({ signUpType: "phone" });
    } catch (error) {
      console.error('Error during sign-up:', error);
    } finally {
      signUpBtn.disabled = false;
    }
  });
}

export function signInCheckRender () {
  const df = fragment`
  <div class="mx-4">
    <form id="signInForm">
      <label for="accountInput" class="form-label" data-i18n="home.phoneEmailLabel">Phone or Email<br />
        <span style="font-size: 0.8rem; color:gray">Phone Format: 123-456-7890</span>
      </label>
      <input type="text" id="accountInput" />
      <div class="alert alert-warning mt-1"
          id="invalidInputAlert" role="alert" style="display:none" data-i18n="home.emailPhoneAlert">
          Please enter a valid email or phone number
      </div>
      <button type="submit" class="connect connect-primary my-3" style="width:100%" id="signInBtn" data-i18n="home.continueButton">
      Continue
      </button>
      <p>
          <span data-i18n="home.dontHaveAccount">Don't have an account?</span> 
          <a href="#" id="signUpAnchor" data-i18n="home.signUpHere">Create one here</a>
      </p>
    </form>
    <div style="font-size:8px" class="mt-3" data-i18n="shared.usGov">
      ${usGov}
    </div>
  </div>`;
   
  // Added this code to properly translate the string
 translateHTML(df.children[0]);
  const signInBtn = df.querySelector('#signInBtn');
  const accountInput = df.querySelector('#accountInput');
  const signUpAnchor = df.querySelector('#signUpAnchor');
  const invalidInputAlertDiv = df.querySelector('#invalidInputAlert');

  const form = df.querySelector('#signInForm');
  form.addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('signInWrapperDiv').replaceChildren(df);

  signInBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    signInBtn.disabled = true;
    const inputStr = accountInput.value.trim();
    const isEmail = !!inputStr.match(validEmailFormat);
    const isPhone = !!inputStr.match(validPhoneNumberFormat);

    try {
      showAnimation();
      if (isEmail) {
        await signInAnonymously();
        const emailForQuery = inputStr
          .replaceAll('%', '%25')
          .replaceAll('#', '%23')
          .replaceAll('&', '%26')
          .replaceAll(`'`, '%27')
          .replaceAll('+', '%2B');

        const response = await checkAccount({
          accountType: 'email',
          accountValue: emailForQuery,
        });

        if (response?.data?.accountExists) {
          const account = { type: 'email', value: inputStr };
          await firebaseSignInRender({ account });
        } else {
          const account = { type: 'email', value: inputStr };
          accountNotFoundRender({ account });
        }
      } else if (isPhone) {
        await signInAnonymously();
        const phoneNumberStr = inputStr.match(/\d+/g).join('').slice(-10);
        const response = await checkAccount({ accountType: 'phone', accountValue: phoneNumberStr });

        if (response?.data?.accountExists) {
          const account = { type: 'phone', value: phoneNumberStr };
          await firebaseSignInRender({ account });
        } else {
          const account = { type: 'phone number', value: inputStr };
          accountNotFoundRender({ account });
        }
      } else {
        addWarning();
      }
    } catch (error) {
      console.error('Error checking account', error);
      addWarning();
    } finally {
      hideAnimation();
      accountInput.value = '';
      signInBtn.disabled = false;
    }
  });

  signUpAnchor.addEventListener('click', async () => {
    await signUpRender({ signUpType: "phone" });
  });

  invalidInputAlertDiv.addEventListener('click', () => {
    removeWarning();
  });

  function removeWarning() {
    invalidInputAlertDiv.style.display = 'none';
    accountInput.style.border = '1px solid #ccc';
  }

  function addWarning() {
    invalidInputAlertDiv.style.display = 'block';
    accountInput.style.border = '2px solid red';
  }

  if (accountInput) {
    setTimeout(() => accountInput.focus(), 100);
  }
}

export async function signUpRender({ signUpType = "phone" }) {
  const df = fragment`
  <div class="mx-4">
    <p class="loginTitleFont" style="text-align:center;" data-i18n="home.createAccountTitle">Create an Account</p>
    <div id="signUpDiv"></div>
    <p>
      ${
        signUpType === "phone"
          ? `<div style="font-size:12px" class="mb-2">
          <span data-i18n="home.signUpEmail"></span><a href="#" id="emailSignUp" data-i18n="home.clickHere">Click here</a>
        </div>`
          : ""
      }
      <div style="font-size:12px">
        <span data-i18n="home.signInAccount">If you have an account, please </span><a href="#" id="signIn" data-i18n="home.signInAccountLink">sign in </a><span data-i18n="home.signInAccountEnd"> with the email or phone number you used to create your account.</span>
      </div>
    </p>
    <div style="font-size:8px" class="mt-3" data-i18n="shared.usGov">
    ${usGov}
    </div>
  </div>`;

  // Added this code to properly translate the string
  translateHTML(df.children[0]);
  const signInLink = df.querySelector("#signIn");
  const emailSignUpLink = df.querySelector("#emailSignUp");
  const wrapperDiv = document.getElementById("signInWrapperDiv");
  wrapperDiv.replaceChildren(df);
  wrapperDiv.setAttribute('data-ui-type', 'signUp');
  wrapperDiv.setAttribute('data-signup-type', signUpType);

  let ui = await getFirebaseUI();
  ui.start("#signUpDiv", signInConfig(signUpType));

  if (signUpType === "phone") {
    document.querySelector("div.firebaseui-card-header > h1").innerText = translateText('home.createAccountPhone');
    document.querySelector("div.firebaseui-card-header > h1").setAttribute('data-i18n', 'home.createAccountPhone');
    const verifyButton = document.querySelector('button[class~="firebaseui-id-submit"]');
    verifyButton && verifyButton.addEventListener("click", () => {
        const cancelButton = document.querySelector('button[class~="firebaseui-id-secondary-link"]');
        cancelButton && cancelButton.addEventListener("click", async () => {
          await signUpRender({ signUpType: "phone" });
        });
      });
  } else if (signUpType === "email") {
    document.querySelector("div.firebaseui-card-header > h1").innerText = translateText('home.createAccountEmail');
    document.querySelector("div.firebaseui-card-header > h1").setAttribute('data-i18n', 'home.createAccountEmail');
    const firebaseUiCardContentWrapper = document.querySelector('div[class~="firebaseui-relative-wrapper"]');
    const pElement = document.createElement("p");
    pElement.innerText = translateText('home.personalEmail');
    pElement.setAttribute('data-i18n', 'home.personalEmail');
    firebaseUiCardContentWrapper.appendChild(pElement);
    const submitButton = document.querySelector('button[class~="firebaseui-id-submit"]');
    submitButton && submitButton.addEventListener("click", () => {
      const pEle = document.querySelector('p[class~="firebaseui-text-input-error"]');
      if (pEle?.innerText !== "") {
        pEle.innerText = translateText('home.validEmail');
        pEle.setAttribute('data-i18n', 'home.validEmail');
      } else {
        window.localStorage.setItem(
          "signInEmail",
          document.querySelector('input[class~="firebaseui-id-email"]').value
        );
      }

      const backButton = document.querySelector('button[class~="firebaseui-id-secondary-link"]');
      backButton && backButton.addEventListener("click", async () => {
        await signUpRender({ signUpType: "email" });
      });
    });
    const inputEle = document.querySelector('input[class~="firebaseui-id-email"]');
    inputEle &&
        inputEle.addEventListener("keyup", (event) => {
            if (event.keyCode === 13) {
              window.localStorage.setItem(
                "signInEmail",
                inputEle.value
              );
            }
        });
  }

  signInLink.addEventListener("click", (e) => {
    e.preventDefault();
    signInCheckRender();
  });

  emailSignUpLink && emailSignUpLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await signUpRender({ signUpType: "email" });
    });
}



function accountNotFoundRender({ account }) {
  const df = fragment`
  <div class="mx-4 d-flex flex-column justify-content-center align-items-center">
    <h5 data-i18n="home.notFoundTitle">Not Found</h5>
    <div class="d-flex flex-column justify-content-left ">
      <p><span data-i18n="home.accountNotFound${account.type.replace(/\s/g,'')}"></span>${account.value}<span data-i18n="home.accountNotFound${account.type.replace(/\s/g,'')}End"></span></p>
      <p data-i18n="home.signInTrouble">If you’re having trouble signing in or don’t remember your account information, please contact the Connect Support Center at 
        <a href="tel:+18664626621">1-866-462-6621</a> or 
        <a href="mailto:ConnectStudy@norc.org">ConnectStudy@norc.org</a> before creating a new account.
      </p>
      <p><span data-i18n="home.anotherAccount">Use another account? </span><a href="#" id="useAnotherAccount" data-i18n="home.anotherAccountClick">Click here</a> </p>
      <p><span  data-i18n="home.noAccount">Don't have an account? </span><a href="#" id="createNewAccount" data-i18n="home.noAccountCreate">Create one here</a> </p>
    <div>
  </div>
  `;

  // Added this code to properly translate the string
  df.children[0].innerHTML = eval('`'+translateHTML(df.children[0].innerHTML)+'`');
  const useAnotherAccountBtn = df.querySelector('#useAnotherAccount');
  const createNewAccountBtn = df.querySelector('#createNewAccount');

  document.getElementById('signInWrapperDiv').replaceChildren(df);

  useAnotherAccountBtn.addEventListener('click', () => {
    signInCheckRender();
  });

  createNewAccountBtn.addEventListener('click', async () => {
    await signUpRender({ signUpType: "phone" });
  });
}
  
