import { getMyData, hasUserData, translateHTML, translateText } from "../shared.js";
import conceptId from '../fieldToConceptIdMapping.js';

export const renderSamplesPage = async () => {
    document.title = translateText('samples.title');
    getMyData().then(res => {

        if (!hasUserData(res)) return;
        
        let site = locations.filter(location => location.concept == res.data[conceptId.healthcareProvider])[0];
        let template;

        if (site && site !== kpga && site !== kphi && site !== kpco && site !== kpnw) {
            const locationTemplate = renderLocations(site);

            template = translateHTML(`
            <br>
            
            <div class="row">
            <div class="col-md-2">
                </div>
                <div class="col-md-8">
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
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.whenToDonate">
                                When Should I Donate My Samples?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.whenToDonate}
                            </div>
                        </div>
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.howToDonate">
                                How Do I Donate My Samples?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.howToDonate}
                            </div>
                        </div>          
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.whereToDonate">
                                Where Do I Donate My Samples?
                            </div>
                        </div>

                        ${site.locationNotes ? `
                        <div class="row" style="width:100%;">
                            <div class="messagesBodyFont">
                                ${site.locationNotes}
                            </div>
                        </div>`
                        : ''}

                        ${locationTemplate}

                        ${site.scheduling ? `
                        <div class="row" style="width:100%">
                            <div style="width:100%">
                                <div class="messagesHeaderFont" data-i18n="samples.schedule">
                                    Scheduling Information
                                </div>
                                <div class="messagesBodyFont">
                                    ${site.scheduling}
                                </div>
                            </div>
                        </div>` : ''
                        }
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.howLongAppt">
                                How Long Will My Appointment Take?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.howLong}
                            </div>
                        </div>
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.prepareAppt">
                                How Should I Prepare On the Day of My Appointment?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.prepareInstructions}
                            </div>
                        </div>
                    </div>

                    ${site.name !== henry_ford.name && site.name !== health_partners.name ?  `
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.duringAppt">
                                What Will Happen During My Appointment?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.whatHappens}
                            </div>
                        </div>
                    </div>` 
                    : '' 
                    }
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.questions">
                                Questions? Contact the Connect Support Center
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                <a href="https://myconnect.cancer.gov/support" target="_blank">MyConnect.cancer.gov/support</a> or <a data-i18n="samples.emailSupport" href="mailto: ConnectSupport@norc.org">ConnectSupport@norc.org</a>
                                <br>
                                <br>
                                ${site.support}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                </div>
            </div>    
            `);
        }
        else if (site && (site === kpga || site ===  kphi || site ===  kpco || site ===  kpnw)) {
            const locationTemplate = renderLocations(site);
            template = translateHTML(`
            <br>
            
            <div class="row">
            <div class="col-md-2">
                </div>
                <div class="col-md-8">
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
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.whenToDonateSamples">
                                When Should I Donate My Blood and Urine Samples?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.whenToDonate}
                            </div>
                        </div>
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.howToDonateSamples">
                                How Do I Donate My Blood and Urine Samples?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.howToDonateBloodAndUrine}
                            </div>
                        </div>          
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div>
                            ${site.prepInstructionsHeader}
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.prepInstructionsText}
                            </div>
                        </div>          
                    </div>          
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.duringVisit">
                                What Will Happen During My Visit?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.whatHappensDuring}
                            </div>
                        </div>          
                    </div>  
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.afterVisit">
                                What Will Happen After My Visit?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.whatHappensAfter}
                            </div>
                        </div>          
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.donatingMouthwashSample">
                                How Do I Donate My Mouthwash Sample?
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                ${site.howToDonateMouthwash}
                            </div>
                        </div>          
                    </div>
                    <div class="row" style="width:100%">
                        <div class="consentHeadersFont" style="color:#606060;width:100%">
                            <div data-i18n="samples.questions">
                                Questions? Contact the Connect Support Center
                            </div>
                        </div>
                        <div class="messagesBodyFont" style="width:100%">
                            <div>
                                <a href="https://myconnect.cancer.gov/support">MyConnect.cancer.gov/support</a>
                                <br>
                                <br>
                                <a href="mailto: ConnectSupport@norc.org">ConnectSupport@norc.org</a>
                                <br>
                                <br>
                                ${site.support}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                </div>
            </div>     
            `);
        }
        else {
            template = translateHTML(`
            <br>
            
            <div class="row">
                <div class="col-md-2">
                </div>
                <div class="col-md-8 NotoSansFont" data-i18n="samples.planCollecting">
                    We plan to begin collecting samples later this year. We will send you an email with instructions and next steps when it is time to donate samples. Thank you for being part of Connect!
                </div>
                <div class="col-md-2">
                </div>
            </div>    
            `);
        }

        document.getElementById('root').innerHTML = template;
    });
}

const health_partners = {
    concept: '531629870',
    name: 'HealthPartners',

    donatingSamples: '<span data-i18n="samples.health_partners.donatingSamples">As a part of your Connect participation, we ask you to donate blood, urine, and saliva samples and complete a short survey related to the samples we are collecting.',
    whenToDonate: '<span data-i18n="samples.health_partners.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.',
    howToDonate: '<span data-i18n="samples.health_partners.howToDonate">Connect participants at HealthPartners have two options for donating samples. You can choose the most convenient option for you. There are no co-pays or charges associated with donating samples for Connect.<br><br><span class="site-info-bold">Option 1:</span> Make an appointment to come into our Connect research location, the HealthPartners Neuroscience Center, to donate your samples.<br><br><span class="site-info-bold">Option 2:</span> Make an appointment to come into one of the HealthPartners clinical collection locations.<br><br>When it is time to donate your samples, we will send you an email with a link for more information. If you are interested in donating samples at the Connect research location, simply click the link to schedule a time that works for you. If you prefer to donate samples at one of our HealthPartners clinical collection locations, please call the Connect team at HealthPartners at (952) 967-5067.  The table below includes more information about these options.<br><br><table border="1" style="width: 100`%;"><tr><th class="site-info-align" style="width: 50%;"><span class="site-info-bold">Option 1: Connect Research Location</span><br><i>HealthPartners Neuroscience Center, St. Paul</i>  </th><th style="width: 50%;"><span class="site-info-bold">Option 2: HealthPartners Clinical Collection Locations </span><br><i>HealthPartners Riverway Clinic Elk River and <br>Park Nicollet Clinic Chanhassen</i><br><br></th></tr><tr><td style="width: 50%;">Connect team will greet you and walk you through your visit.</td><td style="width: 50%;">HealthPartners clinical lab staff will collect your Connect samples.</td></tr><tr><td style="width: 50%;">The team will draw blood, collect urine, and collect a saliva sample by asking you to swish with mouthwash.<br><br>You will also complete a survey related to the samples we are collecting in MyConnect using your mobile phone. If you do not have a mobile phone, we will provide you with a tablet to complete your survey. You will need your MyConnect login information to complete the survey.</td><td style="width: 50%;">Lab staff will collect blood and urine samples at your visit. You can donate Connect samples and complete any labs ordered by your provider in the same visit. <br><br>Within 48 hours of your sample donation, you will receive an email with a link to a survey to complete on MyConnect. The survey is related to the samples that we collected. <br><br> The Connect team will send you a mouthwash collection kit with instructions to complete your saliva sample at home.</td></tr><tr><td style="width: 50%;">When you receive the scheduling email from the Connect team, please use the link included to schedule an appointment to donate your samples at a time that is convenient for you. You may also call the Connect team at 952-967-5357 if you would prefer to schedule your appointment over the phone.</td><td style="width: 50%;">To schedule at one of these locations, please call our team at 952-967-5357 after you receive the scheduling email from the Connect team.</td></tr></table><br>For questions, please contact the Connect team at HealthPartners at 952-967-5357 or ConnectStudy@healthpartners.com.',
    scheduling: '',
    howLong: '<span data-i18n="samples.health_partners.howLong"><span class="site-info-bold">Connect Research Location:</span><br><br>Please expect to spend about 30-45 minutes at your appointment to donate your samples. During your appointment, we will ask you to complete a short survey related to the samples we are collecting.<br><br><span class="site-info-bold">Connect Clinical Collection Location:</span><br><br>Please expect to spend about 10-15 minutes at your appointment to donate your blood and urine samples.',
    prepareInstructions: '<span data-i18n="samples.health_partners.prepareInstructions"><span class="site-info-bold">Connect Research Location:</span><br><br>On the day of your appointment, please drink plenty of water, but <span class="site-info-bold">stop drinking water one hour before your appointment.</span><br><br><span class="site-info-bold">One hour before your appointment:</span> Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please bring a valid government-issued photo ID, such as a driver\'s license.</li><li>Make sure you know your login information for your <a href="https://myconnect.cancer.gov">MyConnect account.</a><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:</li><ul><li>The last time you ate or drank, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul><br><span class="site-info-bold">Connect Clinical Collection Locations:</span><br><br>On the day of your appointment, you do not need to fast. Please drink plenty of water to keep hydrated.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please bring a valid government-issued photo ID, such as a driver\'s license.</li><li>After your appointment:<br><ul><li>Be sure to check your email for a link to a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so it is important to complete it as soon as you can.</li><li>We will email you when we ship your mouthwash home collection kit. Please use this kit and included instructions to collect your mouthwash sample at home.</li></ul></li></ul><br> <div class="consentHeadersFont" style="color:#606060;width:100%">When Will I Receive My $25 Payment?</div><br>You will receive your $25 e-gift card  after you donate a blood sample and complete <span class="site-info-bold">all four sections</span> of your first Connect survey.<br><br>You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<ol><li>Background and Overall Health</li><li>Medications, Reproductive Health, Exercise, and Sleep</li><li>Smoking, Alcohol, and Sun Exposure</li><li>Where you Live and Work</li>',
    support: '<span data-i18n="samples.health_partners.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)',
    locations: [
        [
            '<span data-i18n="samples.health_partners.locations.NeuroscienceName">HealthPartners Neuroscience Center</span>',
            '<span data-i18n="samples.health_partners.locations.NeuroscienceAddress">295 Phalen Boulevard<br>St. Paul, MN 55130<br><br>Upon arrival, please proceed to the Welcome Desk on the first floor to check in for your appointment.</span>',

            '',
            '<span data-i18n="samples.health_partners.locations.NeuroscienceParking">Parking at the Neuroscience Center is free and located at Olive Street and Phalen Blvd. When you arrive, please park in the Neuroscience Center Parking ramp located across from Olive Street.<br><br><div class="messagesHeaderFont">Scheduling Information</div><br>You can self-schedule using the link included in the scheduling email sent from the Connect team. For questions or to schedule over the phone, please call 952-967-5067.</span>'
        ],
        [
            '<span data-i18n="samples.health_partners.locations.RiverwayName">HealthPartners Riverway Clinic Elk River</span>',
            '<span data-i18n="samples.health_partners.locations.RiverwayAddress">530 3rd St NW<br>Elk River, MN 55330<br><br>Upon arrival, proceed past the main check in desk and go directly to the lab check in desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.RiverwayParking">Parking is free in the Elk River Clinic parking lot.<br><br><div class="messagesHeaderFont">Scheduling Information</div><br>Self-scheduling is not currently available for the Elk River location. For questions and scheduling, please call 952-967-5067</span>'
        ],
        [
            '<span data-i18n="samples.health_partners.locations.NicolletName">Park Nicollet Clinic Chanhassen</span>',
            '<span data-i18n="samples.health_partners.locations.NicolletAddress">300 Lake Dr E<br>Chanhassen, MN 55317 <br><br>Upon arrival, please take the stairs or elevator to the 2nd floor and check in for your appointment at the lab check in desk.</span>',
            '',
            '<span data-i18n="samples.health_partners.locations.NicolletParking">Parking is free in the Chanhassen Clinic parking lot.<br><br><div class="messagesHeaderFont">Scheduling Information</div><br>Self-scheduling is not currently available for the Chanhassen location. For questions and scheduling, please call 952-967-5067.</span>',
        ]
    ]
};

const sanford = {
    concept: '657167265',
    name: 'Sanford',
    donatingSamples: '<span data-i18n="samples.sanford.donatingSamples">As part of Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.sanford.whenToDonate">The Connect team will send a MyChart message when it is time to donate your samples. If you do not have a MyChart account, we will send you an email. Be sure to check your spam or junk folder. After you receive the MyChart message or email, it is important to donate your samples as soon as you can.<br><br><span style="font-weight:900; text-decoration:underline">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
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
    whatHappens: '<span data-i18n="samples.sanford.whatHappens">Option 1: Sanford Health Lab Location <br><br> Check in at the registration desk when you arrive. Lab staff will collect blood and urine samples during your visit.<br><br> After your visit, please remember to check your email for a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so please complete it as soon as you can. <br><br> Option 2: Connect Research Lab <br><br> Check in at the registration desk. The registration team will direct you where to go next to get your samples collected. At the end of your visit, the Connect team will check you out of your appointment. <br><br> We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br> We will also ask you to complete a short survey on MyConnect using your mobile phone. You will need your MyConnect login information to complete the survey. If you do not have a mobile phone, we may be able to provide you with a tablet to complete your survey.<br><br> We strongly encourage you to complete your survey at your appointment. If you choose to complete it after you leave your appointment, it is important to do so as soon as possible.<br><br> <div class="consentHeadersFont" style="color:#606060;width:100%">When Will I Receive My $25 Payment?</div><br>You will receive your $25 gift card  after you donate a blood sample and complete <span class="site-info-bold">all four sections</span> of your first Connect survey.<br><br>You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<ol><li>Background and Overall Health</li><li>Medications, Reproductive Health, Exercise, and Sleep</li><li>Smoking, Alcohol, and Sun Exposure</li><li>Where you Live and Work</li> </span>',
    support: '<span data-i18n="samples.sanford.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)</span>',
    locations: [
        [
            '<span data-i18n="samples.sanford.locations.Option1"><span>Option 1: Sanford Health Lab Location</span><br><br><span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; font-weight: 400; line-height: 27px; color: #2E2E2E; margin-top: 20px;"> To find a Sanford Health Lab Location  and its operating hours, please visit <a href="https://www.sanfordhealth.org/locations" target="_blank">https://www.sanfordhealth.org/locations</a> <br><br>  Exact hours may vary by location. Walking in outside of normal business hours may lead to longer wait times. <br><br> Note: If you live in the Bismarck region, the Sanford lab team prefers you pre-schedule an appointment. You can do this within your MyChart or by calling the lab directly.</span> </span>',
            '',
            '',
            ''
        ],
        [
            '<span data-i18n="samples.sanford.locations.Option2"><span>Option 2: Connect Research Lab</span> <br><br> <span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; font-weight: 400; color: #2E2E2E; margin-top: 20px;">Use the link in the message we send to your MyChart or email to schedule an appointment at one of the below locations. You may also schedule an appointment by calling the Connect team at 605-312-6100. <br><br>  Connect Research Lab appointments are available Monday – Thursday 7:00am – 4:00pm and Friday 7:00am – 2:00pm. If you would like to schedule outside of these hours, please contact the Connect team at 605-312-6100 or ConnectStudy@sanfordhealth.org. <span style=" font-family: \'Noto Sans\', sans-serif; font-size: 18px; line-height: 27px; color: #2E2E2E; margin-top: 20px;"></span>',
            '',
            '',
            ''
        ],
        [
            '<span data-i18n="samples.sanford.locations.SiouxFallsName">Sioux Falls, SD: Edith Breast Cancer Center</span>',
            '<span data-i18n="samples.sanford.locations.SiouxFallsAddress">1210 W. 18th St.<br>Sioux Falls, SD 57104<br><i>Enter Through Door BB</i></span></span>',
            '',
            '<span data-i18n="samples.sanford.locations.SiouxFallsParking">Free valet parking is available near the front entrance of the Edith Breast Cancer Center. Free patient parking is also available in the lot on the corner of S Grange Ave and W 18th Street. Enter through door BB. No parking validation is needed.</span>'
        ],
        [
            '<span data-i18n="samples.sanford.locations.FargoName">Fargo, ND: South University Urgent Care/Orthopedic Walk-In Clinic</span>',
            '<span data-i18n="samples.sanford.locations.FargoAddress">1720 University Drive S<br>Fargo, ND 58102<br><i>Enter Through Door #8</i></span>',
            '',
            '<span data-i18n="samples.sanford.locations.FargoParking">Free patient parking is available in the lot near the Urgent Care entrance—Door #8. No parking validation needed.</span>',
        ]
      ]
};

const marshfield = {
    concept: '303349821',
    name: 'Marshfield',
    donatingSamples: '<span data-i18n="samples.marshfield.donatingSamples">As part of Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.marshfield.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<br><br><span style="font-weight:900; text-decoration:underline">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span style="font-weight:900; text-decoration:underline">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span style="font-weight:900; text-decoration:underline">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span style="font-weight:900; text-decoration:underline">do not</span> donate samples for Connect on the <span style="font-weight:900; text-decoration:underline">same day</span> as your colonoscopy.</span>',
    howToDonate: '<span data-i18n="samples.marshfield.howToDonate">The email we send you will contain a link to schedule an appointment. Simply click the link to schedule a time that is convenient for you to donate your samples. You can also call Marshfield Clinic Research Institute at 715-898-9444 to schedule an appointment, or a Connect team member will call you to schedule an appointment to donate your samples at a time that is convenient for you.</span>',
    scheduling: '<span data-i18n="samples.marshfield.scheduling">For questions and scheduling please call: 715-898-9444 or email <a href="mailto: connectstudy@marshfieldresearch.org">connectstudy@marshfieldresearch.org</a>.</span>',
    howLong: '<span data-i18n="samples.marshfield.howLong">Please expect to spend an average of one hour at your appointment to donate your samples and complete a short survey.</span>',
    prepareInstructions: '<span data-i18n="samples.marshfield.prepareInstructions">On the day of your appointment, please drink plenty of water, but <span style="font-weight:900; text-decoration:underline">stop drinking water one hour before your appointment.</span><br><br><span style="font-weight:900; text-decoration:underline">One hour before your appointment:</span> Please <span style="font-weight:900; text-decoration:underline">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span style="font-weight:900; text-decoration:underline">Things to bring and remember:</span><br><br><ul><li>Make sure you know your login information for MyConnect.</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:<ul><li>The last time you ate or drank, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul></span>',
    whatHappens: '<span data-i18n="samples.marshfield.whatHappens">The Connect team will check you in for your appointment and then collect your samples. At the end of your visit, the Connect team will check you out of your appointment.<br><br>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br>We will also ask you to complete <span style="font-weight:900; text-decoration:underline">a short survey</span> on MyConnect using your mobile phone. If you do not have a mobile phone, we will provide a tablet for you to use complete your survey. You will need your MyConnect login information to complete the survey.</span>',
    support: '<span data-i18n="samples.marshfield.support">Call 1-877-505-0253 (8:00 a.m.-10:00 p.m. CT on weekdays and 9:00 a.m.-6:00 p.m. CT on weekends)</span>',
    locations: [
        [
            '<span data-i18n="samples.marshfield.locations.MarshfieldName">Marshfield Clinic, Marshfield Center</span>',
            '<span data-i18n="samples.marshfield.locations.MarshfieldAddress">1000 N. Oak Ave<br>Marshfield, WI 54449</span>',
            '<span data-i18n="samples.marshfield.locations.MarshfieldSchedule">Monday - Thursday: 7:00 a.m. to 4:00 p.m. and Friday 7:00 a.m. to noon</span>',
            '<span data-i18n="samples.marshfield.locations.generalParking">General parking available</span>'
        ],
        [
            '<span data-i18n="samples.marshfield.locations.LakeHallieName">Lake Hallie Center</span>',
            '<span data-i18n="samples.marshfield.locations.LakeHallieAddress">12961 27th Ave<br>Chippewa Falls, WI 54729</span>',
            '<span data-i18n="samples.marshfield.locations.LakeHallieSchedule">Monday - Thursday: 7:00 a.m. to 4:00 p.m.<br>Fridays: 8:00 a.m. to 2:00 p.m.</span>',
            '<span data-i18n="samples.marshfield.locations.generalParking">General parking available</span>'
        ],
        [
            '<span data-i18n="samples.marshfield.locations.MinocquaName">Minocqua Center</span>',
            '<span data-i18n="samples.marshfield.locations.MinocquaAddress">9576 WI-70 Trunk<br>Minocqua, WI 54548</span>',
            '<span data-i18n="samples.marshfield.locations.MinocquaSchedule">Wednesdays: 8:00 a.m. to 1:00 p.m.</span>',
            '<span data-i18n="samples.marshfield.locations.generalParking">General parking available</span>'
        ],
        [
            '<span data-i18n="samples.marshfield.locations.WestonName">Weston Center</span>',
            '<span data-i18n="samples.marshfield.locations.WestonAddress">3400 Ministry Pkwy<br>Weston, WI 54476</span>',
            '<span data-i18n="samples.marshfield.locations.WestonSchedule">Mondays - Thursdays: 7:00 a.m. to 1:00 p.m. *Please ask about evening and Friday appointment availability if needed</span>',
            '<span data-i18n="samples.marshfield.locations.generalParking">General parking available</span>'
        ],
        [
            '<span data-i18n="samples.marshfield.locations.WisconsinRapidsName">Wisconsin Rapids Center</span>',
            '<span data-i18n="samples.marshfield.locations.WisconsinRapidsAddress">220 24th St S,<br>Wisconsin Rapids,WI 54494</span>',
            '<span data-i18n="samples.marshfield.locations.WisconsinRapidsSchedule">Thursdays: 7:00 a.m. to 4:00 p.m.<br>Fridays: 7:00 a.m. to 10:00 a.m.</span>',
            '<span data-i18n="samples.marshfield.locations.generalParking">General parking available</span>'
        ]
    ]
};

const henry_ford = {
    concept: '548392715',
    name: 'Henry Ford Health',
    donatingSamples: '<span data-i18n="samples.henry_ford.donatingSamples">Thank you for being part of Connect. As part of the study, we ask you to donate blood, urine, and saliva samples.</span>',
    whenToDonate: '<span data-i18n="samples.henry_ford.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Important Notes:</span><br><br><ol><li> If you have had a blood transfusion or donated blood recently:<br> Please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect.</li><br><li> If you have recently donated plasma:<br> Please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect.</li><br><li> If you have an upcoming colonoscopy:<br> Please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</li></ol></span>',
    howToDonate: '<span data-i18n="samples.henry_ford.howToDonate">Connect participants at Henry Ford Health have two options for donating samples. You can choose the most convenient option for you.<br><br><span class="site-info-bold">Option 1:</span> Make an appointment to come into one of our Connect Research Labs to donate your samples.<br><br><span class="site-info-bold">Option 2:</span> A study team member can request a lab order be placed for you. After you receive the order confirmation email, you can donate samples by visiting a participating Henry Ford Health Lab Services location during normal hours of operation.<br><br> The table below includes more information about these options.<br><br><table border="1"><tr><th><span class="site-info-bold">Option 1: Connect Research Lab</span> </th><th><span class="site-info-bold">Option 2: HFH Lab Services</span></th></tr><tr><td>Connect team will greet you and walk you through your visit.</td><td>More hours and more locations, no need to schedule an appointment.</td></tr><tr><td>The team will draw blood, collect urine, and collect a saliva sample by asking you to swish with mouthwash.</td><td>Lab staff will collect blood and urine samples at your visit. We will send a mouthwash collection kit and instructions to you to complete your saliva sample at home.</td></tr><tr><td>Schedule your appointment using the link in the email we send or schedule with Connect staff by calling 855-574-7540.</td><td>Request a lab order using the link in the email we send. The order will be placed by Connect staff.<span class="site-info-bold"> Please allow up to 48 hours to receive order confirmation via email.</span> Once you receive the confirmation email, visit a participating HFH Lab Services location.<span class="site-info-bold"> Orders expire after 90 days.</span></td></tr></table><br>When it is time to donate your samples, we will send you an email with a link to make your selection. Simply click the link to schedule a time that works for you to donate your samples at a Connect Research Lab or to request a lab order be placed so you can donate samples at a participating Henry Ford Health Lab Services location. <br><br> You can donate Connect samples and complete any labs ordered by your provider in the same visit.<br><br><span class="site-info-bold">For questions or assistance with transportation, please call 855-574-7540 or email <a href="mailto:ConnectStudy@hfhs.org">ConnectStudy@hfhs.org</a></span></span>',
    howLong: '<span data-i18n="samples.henry_ford.howLong"><span class="site-info-bold">For Option 1: Connect Research Lab Appointment</span><br>Please expect to spend about one hour at your appointment to donate your samples and complete a short survey.<br><br><span class="site-info-bold">For Option 2: Henry Ford Health Lab Services Locations</span><br>Wait times to donate samples may vary by location. To better serve HFH patients, Henry Ford Lab Services have started using <span class="site-info-bold">“Save My Spot".</span><br><br><span class="site-info-bold">“Save My Spot"</span> is an optional service to reserve your spot in line at one of the participating Henry Ford Health Lab Services locations (Macomb and Wyandotte). All lab orders must be placed before using “Save My Spot,” including your lab order for Connect.<br><br>To use this optional service, click this link only after receiving order confirmation from Connect staff: <a href= "https://www.henryford.com/locations/henry-ford-hospital/lab-services">https://www.henryford.com/locations/henry-ford-hospital/lab-services</a> </span>',
    prepareInstructions: '<span data-i18n="samples.henry_ford.prepareInstructions">On the day of your visit to donate samples for Connect, you do not need to fast unless told to do so by your provider for any other lab work they’ve ordered. We request you drink plenty of water to keep hydrated but <span class="site-info-bold">stop drinking water one hour before your visit.</span><br><br><span class="site-info-bold">One hour before your visit:</span> Please <span class="site-info-bold">do not</span> eat, drink, chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span class="site-info-bold">Things to bring and remember:</span> We will ask you to complete a short survey on MyConnect after you donate samples. You will need your login method for MyConnect and a personal device to complete the survey. <br><br>You will be asked questions related to:<ul><li>The last time you ate or drank before your appointment, and the time you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><br><div class="consentHeadersFont" style="color:#606060;width:100%">When Will I Receive My $25 Payment?</div><br>You will receive your $25 gift card after you donate a blood sample and complete <span class="site-info-bold">all four sections</span> of your first Connect survey.<br><br>You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<ol><li>Background and Overall Health</li><li>Medications, Reproductive Health, Exercise, and Sleep</li><li>Smoking, Alcohol, and Sun Exposure</li><li>Where you Live and Work</li></span>',
    support: '<span data-i18n="samples.henry_ford.support">Call 1-877-505-0253 (9:00 a.m.-11:00 p.m. ET on weekdays and 10:00 a.m.-7:00 p.m. ET on weekends)</span>',
    locationNotes: '<span data-i18n="samples.henry_ford.locationNotes"><h4>Option 1: Connect Research Labs</h4></span>',
    locations: [
        [
            '<span data-i18n="samples.henry_ford.locations.K13Name">Henry Ford Hospital - Detroit, K13 Research Clinic</span>',
            '<span data-i18n="samples.henry_ford.locations.K13Address">2799 W Grand Blvd<br>K Building, Floor 13<br>Detroit, MI 48202<br>(313) 542-9709</span>',
            '',
            '<span data-i18n="samples.henry_ford.locations.K13Parking">Free self-parking available to visitors. Lots located near each hospital entrance (Main, West, East) or use the parking garage on the Lodge service drive, near Bethune.</span>'
        ],
        [
            '<span data-i18n="samples.henry_ford.locations.LivoniaName">Henry Ford Medical Center - Livonia</span>',
            '<span data-i18n="samples.henry_ford.locations.LivoniaAddress">29200 Schoolcraft Road<br>Radiology, Floor 1<br>Livonia, MI 48150<br>(313) 269-5634</span>',
            '',
            '<span data-i18n="samples.henry_ford.locations.LivoniaParking">Easy, free self-parking is available in the surface lot in front of the building. The medical center visitor lot is located behind Aldi.<br><br><br><h4><div class="consentHeadersFont" style="color:#606060;width:100%">Option 2: Henry Ford Health Lab Services locations</div></h4></span>',
        ],
        [
            '<span data-i18n="samples.henry_ford.locations.DetroitName">Henry Ford Hospital - Detroit</span>',
            '<span data-i18n="samples.henry_ford.locations.DetroitAddress">2799 W Grand Blvd<br>Detroit, MI 48202<br>Location: K1 Outpatient Lab</span>',
            '',
            '<span data-i18n="samples.henry_ford.locations.DetroitParking">Free self-parking available to visitors. Lots located near each hospital entrance (Main, West, East) or use the parking garage on the Lodge service drive, near Bethune.</span>',
        ],

        [
           '<span data-i18n="samples.henry_ford.locations.MacombName">Henry Ford Hospital - Macomb</span>',  
           '<span data-i18n="samples.henry_ford.locations.MacombAddress">16151 19 Mile Road<br> Ste 110<br>Clinton Township, MI 48038<br>Location: First Floor, Suite 110</span>',
           '',
           '<span data-i18n="samples.henry_ford.locations.MacombParking">All self-parking at Henry Ford Macomb Hospital is free. Self-parking areas are available near the Main entrance, Medical Pavilion and Emergency entrance. Wheelchairs are available at all entrances.</span>',
        ],
        [
          '<span data-i18n="samples.henry_ford.locations.WyandotteName">Henry Ford Hospital - Wyandotte</span>',
          '<span data-i18n="samples.henry_ford.locations.WyandotteAddress">2333 Biddle Ave<br> Wyandotte, MI 48192<br> Location: First Floor Lab Services</span>',
          '',
          '<span data-i18n="samples.henry_ford.locations.WyandotteParking">Parking lots are conveniently located near all hospital entrances for those who do not wish to use valet. Wheelchairs are available at all entrances and handicapped parking is available in each parking area. Valet parking is available at all hospital entrances for $3.00. This service is not available on holidays.</span>',
        ],
        [
           '<span data-i18n="samples.henry_ford.locations.WestBloomfieldName">Henry Ford Hospital - West Bloomfield</span>',
           '<span data-i18n="samples.henry_ford.locations.WestBloomfieldAddress">6777 West Maple Road<br>West Bloomfield, MI 48322<br>Location: Lab Services First Floor - Bloomfield Reception</span>',
           '',
           '<span data-i18n="samples.henry_ford.locations.WestBloomfieldParking">ll self-parking at Henry Ford West Bloomfield Hospital is free. Self-parking areas are available near the Main entrance and at the Henry Ford Cancer entrance. Wheelchairs are available at all entrances. Handicapped-designated parking spaces are located in front of the Main entrance, the West entrance and the Emergency entrance.</span>',
        ],
        [
           '<span data-i18n="samples.henry_ford.locations.FairlaneName"></span>Henry Ford Medical Center - Fairlane</span>',
           '<span data-i18n="samples.henry_ford.locations.FairlaneAddress"></span>19401 Hubbard Dr.<br>Dearborn, MI 48126<br>Location: First Floor Lab Services</span>',
           '',
           '<span data-i18n="samples.henry_ford.locations.FairlaneParking">Self-parking available in parking lot near building. All self-parking at Henry Ford Medical Center Fairlane is free.</span>',
        ],
        [
           '<span data-i18n="samples.henry_ford.locations.RoyalOakName">Henry Ford Medical Center - Royal Oak</span>',
           '<span data-i18n="samples.henry_ford.locations.RoyalOakAddress">110 E. 2<sup>nd</sup> Street<br>Royal Oak, MI 48067<br>Location: First Floor Lab Services</span>',
           '',
           '<span data-i18n="samples.henry_ford.locations.RoyalOakParking">Convenient patient parking spots in parking structure located 100 feet from entrance.</span>',
        ],
        [
           '<span data-i18n="samples.henry_ford.locations.TroyName">Henry Ford Medical Center - Troy</span>',
           '<span data-i18n="samples.henry_ford.locations.TroyAddress">2825 Livernois<br>Troy, MI 48083<br>Location: First Floor Lab Services</span>',
           '',
           '',
        ],
        [
           '<span data-i18n="samples.henry_ford.locations.PlymouthName">Henry Ford Medical Center - Plymouth</span>',
           '<span data-i18n="samples.henry_ford.locations.PlymouthAddress">4077 Ann Arbor Road<br>Plymouth, MI 48067<br>Location: First Floor Lab Services</span>',
           '',
           '',
        ],
    ]
};

const u_chicago = {
    concept: '809703864',
    name: 'UChicago Medicine',
    donatingSamples: '<span data-i18n="samples.u_chicago.donatingSamples">As part of  Connect, we ask you to donate blood, urine, and saliva samples and complete a short survey.</span>',
    whenToDonate: '<span data-i18n="samples.u_chicago.whenToDonate">The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood please wait at least <span class="site-info-bold">eight weeks</span> from your transfusion or donation before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
    howToDonate: '<span data-i18n="samples.u_chicago.howToDonate">Connect participants at UChicago have two options for donating samples. You can choose the most convenient option for you. For questions and assistance with transportation, please call UChicago at (773) 834-5804 or email Connect@bsd.uchicago.edu.<br><br> Option 1: Make an appointment to come into one of our Connect Research Labs to donate your samples.<br><br> Option 2: A study team member can request a lab order be placed for you. After you receive the order confirmation email, you can donate samples by visiting a participating UChicago Medicine (UCM) Outpatient Clinical Lab Location during normal hours of operation.<br><br> The table below includes more information about these options.<br><br> ' +
        '<table style="border: 1px solid">' +
        '<tr style="border: 1px solid">' +
        '<td style="border: 1px solid; padding-left: 10px">Option 1: Connect Research Lab</td>' +
        '<td style="border: 1px solid; padding-left: 10px">Option 2: UCM Outpatient Clinical Lab Location</td>' +
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
    howLong: '<span data-i18n="samples.u_chicago.howLong">"Option 1: UChicago Connect Research Lab Location:<br> Please expect to spend about 30-45 minutes at your appointment to donate your samples. During your appointment, we will ask you to complete a short survey related to the samples we collect.<br><br> Option 2: UCM Outpatient Clinical Lab  Location:<br> Wait times to donate samples may vary by location. Please expect to spend about 10-15 minutes at your appointment to donate your blood and urine samples.</span>',
    prepareInstructions: '<span data-i18n="samples.u_chicago.prepareInstructions">"Option 1: UChicago Connect Research Lab Location:<br><br>On the day of your visit, you do not need to fast. Please drink plenty of water to keep hydrated, but <span class="site-info-bold">stop drinking water one hour before your visit</span>. Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please remember to bring a valid photo ID that is not expired (driver\'s license, passport, Chicago CityKey, school photo ID, or other photo ID)</li><li>Make sure you know your login information for MyConnect</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:<ul><li>The last time you ate or drank before your appointment, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul> Option 2: UCM Outpatient Clinical Lab Location:<br><br> On the day of your appointment, you do not need to fast. Please drink plenty of water to keep hydrated.<br><br><span class="site-info-bold">Things to bring and remember:</span><br><br><ul><li>Please remember to bring a valid photo ID that is not expired (driver\'s license, passport, Chicago CityKey, school photo ID, or other photo ID)</li><li>After your appointment:<ul><li>Be sure to check your email for a link to a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so it is important to complete it as soon as you can.</li><li>We will email you when we ship your mouthwash home collection kit. Please use this kit and included instructions to collect your mouthwash sample at home.</li></ul></li></ul></span>',
    whatHappens: '<span data-i18n="samples.u_chicago.whatHappens">"Option 1: UChicago Connect Research Lab Location:<br><br> The research team will check you in for your appointment and then collect your samples. At the end of your visit, the research team will check you out of your appointment.<br><br>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.<br><br> <span class="site-info-underline">To save time at your appointment, please complete your first Connect survey on MyConnect before donating samples. If you are not able to complete the survey before your appointment, we will ask you to complete the survey during your appointment.</span><br><br> We will also ask you to complete a short survey about your samples on MyConnect using your mobile phone. You will need your MyConnect login information to complete the survey. If you do not have a mobile phone, we will provide you with a tablet to complete your survey. We strongly encourage you to complete your survey at your appointment. If you choose to complete it after you leave your appointment, it is important to do so as soon as possible.<br><br> Option 2: UCM Outpatient Clinical Services Lab Location:<br><br> Lab staff will collect blood and urine samples at your visit. You may donate Connect samples and complete any labs ordered by your provider in the same visit. After your visit, please remember to check your email for a survey to complete on MyConnect. The survey asks questions about the day you donated samples, so please complete it as soon as you can.<br><br><div class="consentHeadersFont" style="color:#606060;width:100%"> When Will I Receive My $25 Payment?</div><br> You will receive your $25 payment after you donate a blood sample and complete all four sections of your first Connect survey.<br><br> You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<br> 1. Background and Overall Health<br>2. Medications, Reproductive Health, Exercise, and Sleep<br>3. Smoking, Alcohol, and Sun Exposure<br>4. Where you Live and Work</span>',
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
            '<span data-i18n="samples.u_chicago.locations.DuchossoisName"><span class="site-info-underline">UChicago, Duchossois Center for Advanced Medicine (DCAM) in Hyde Park</span></span>',
            '<span data-i18n="samples.u_chicago.locations.DuchossoisAddress">University of Chicago Medicine <br>Duchossois Center for Advanced Medicine (DCAM) #2101 </br>5758 S. Maryland Avenue <br>Chicago, IL 60637</br><br>After entering the DCAM building from the main entrance, look for us at the top of the stairs on the 2nd floor.</br></p></span>',
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
            '<span data-i18n="samples.u_chicago.locations.RiverEastName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-river-east" target="_blank">UChicago Medicine River East</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.RiverEastAddress">Located in Lucky Strike Downtown Chicago <br>355 E. Grand Ave <br>Chicago, IL 60611</span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.RiverEastParking">From Lake Shore Drive: Exit at Grand Ave. and proceed west towards McClurg Ct.  An entrance to the parking garage is located past that intersection on your left at 321 E. Grand.<br><br>From the West: Take Illinois St. east towards Columbus Dr. An entrance to the parking garage is located past that intersection on your left at 300 E. Illinois.<br><br>Once inside the parking garage, follow the signs to LL3 (Fall) for designated UChicago Medicine patient parking.  We will validate your parking pass from the parking garage. Please show your self-parking ticket to research staff. We are unable to validate street parking.</span>',
        ],
        [
            '<span data-i18n="samples.u_chicago.locations.SouthLoopName"><span class="site-info-underline"><a href="https://www.uchicagomedicine.org/find-a-location/uchicago-medicine-south-loop" target="_blank">UChicago Medicine – South Loop, in Downtown Chicago</a></span></span>',
            '<span data-i18n="samples.u_chicago.locations.SouthLoopAddress">Southgate Market P1 <br> 1101 S Canal St<br>Chicago, IL 60607</span></span>',
            '',
            '<span data-i18n="samples.u_chicago.locations.SouthLoopParking">The clinic is located on the P1 level next to the DSW. Entrances are located off of Canal St right beside the Panera Bread and on the P1 level of the parking garage. We will validate your parking pass from the parking garage. Please show your self-parking ticket to research staff. We are unable to validate street parking.</span></span>',
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
    ]
};

const bswh = {
    concept: '472940358',
    name: 'Baylor Scott & White Health (BSWH)',
    donatingSamples: '<span data-i18n="samples.bswh.donatingSamples">As part of Connect, we ask you to donate blood, urine, and mouthwash samples and complete a short surveys.</span>',
    whenToDonate: '<span data-i18n="samples.bswh.whenToDonate"><p>The Connect team will send you an email when it is time to donate your samples. Be sure to check your spam or junk folder. After you receive the email, it is important to donate your samples as soon as you can. It is easy to donate all of your samples in one visit.<p/><p> <span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.<p/></span>',
    howToDonate: '<span data-i18n="samples.bswh.howToDonate"><p>Contact the BSWH Connect team at 214-865-2427 or by email at <a href="mailto:ConnectStudy@bswhealth.org">ConnectStudy@bswhealth.org</a> to schedule your appointment.</p></span>',
    prepInstructionsHeader: '<span data-i18n="samples.bswh.prepInstructionsHeader">What Should I Bring to the Visit?</span>',
    prepInstructionsText: '<span data-i18n="samples.bswh.prepInstructionsText"><ul><li>Please bring your Kaiser Permanente member ID card and a picture ID.</li><li>KPNW Infectious Disease and Infection Prevention & Control recommends members, patients, and visitors wear a mask in ambulatory care including labs and hospital settings. </li></ul><span class="site-info-bold-italic">Note: Hand sanitizer will be available for your use.</span></span>',
    whatHappensDuring: '<span data-i18n="samples.bswh.whatHappensDuring">Donating your research blood and urine samples is just like providing a clinical sample requested by your health care provider. When you arrive at the clinic, you may go directly to the lab, get a ticket with a number, and follow the instructions. When it is your turn, the lab staff will call your number and collect your samples similarly to a clinical sample collection for medical care. Tell the lab techs that you are donating samples for NCI Connect. The techs will be able to see your blood draw and urine collection orders and instructions for Connect in their system.</span>',
    whatHappensAfter: '<span data-i18n="samples.bswh.whatHappensAfter">Within a day of your blood and urine collection, we will send you an email asking you to complete a short survey on MyConnect. The survey will ask about recent actions, such as:<br></br><ul  style="list-style-type:circle;"><li>The last time you ate or drank before your lab visit, and the times you went to sleep the night before your visit and woke up on the day of your visit.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul><span class="site-info-bold-italic">When you receive our email, it is important that you complete the survey as soon as possible.</span></span>',
    howToDonateMouthwash: '<span data-i18n="samples.bswh.howToDonateMouthwash">We will send you an email as soon as your mouthwash home collection kit is on its way.  Once you receive the kit, you can collect your mouthwash sample in the comfort of your own home. The kit we mail you will include instructions and all of the items you need to collect your sample, including a return shipping box with a pre-paid shipping label to return your sample to us.<br></br>When you collect your mouthwash sample, we will ask you to complete a short survey on MyConnect. <span class="site-info-bold-italic">It is important to complete this survey on the same day that you collect your mouthwash sample.</span></span>',
    support: '<p><span data-i18n="samples.bswh.support">Call 1-877-505-0253 (6:00 a.m-8:00 p.m. PT on weekdays and 7:00 a.m.-4:00 p.m. PT on weekends)</span></p>',
    locationNotes: `<span data-i18n="samples.bswh.locationNotes"><div style="margin-bottom:2rem;"> 
                    <div>
                        <span class="site-info-bold">Baylor Scott & White Health and Wellness Center- Dallas</span>
                        <p>4500 Spring Ave<br>
                            Dallas, TX 75210<br>
                            Parking Instructions: The site offers free surface level parking.
                        </p>
                    </div>
                    <div>
                        <span class="site-info-bold">Baylor Scott & White Community Care (BCC) - Fort Worth*</span>
                        <p >1307 8th Ave, Ste 305<br>
                            Fort Worth, TX 76104<br>
                            Parking Instructions: The site offers free surface level parking.<br>
                            <span style="font-size:1rem" class="site-info-underline-italic">*Note: Only patients of Baylor Scott & White Health Community Care - Fort Worth clinic can schedule an appointment at this location.</span>
                        </p>
                    </div>
                    <div>
                        <span class="site-info-bold">Baylor Scott & White All Saints Hospital- Fort Worth</span>
                        <p>1400 8th Avenue Fort Worth, TX 76104<br>
                        6th Floor, C Building<br>
                        Parking Instructions: Use the patient parking structure by the hospital.
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
                        <p>3410 Worth St, Suite 530<br>
                        Dallas, TX 75246<br>
                        Parking Instructions: Drive to the back of the Sammons Cancer Center Building and park in the underground garage. You will get a ticket from the machine as you enter the garage. Please keep the ticket. During your visit, the Connect team will give you a voucher for free parking. 
                        </p>
                    </div>
                    </span>`,
    howLong: '<span data-i18n="samples.bswh.howLong">If you complete your first Connect survey before your appointment, please expect to spend about 45 minutes at your appointment to donate your samples and please expect to spend about 45 minutes at your appointment to donate your samples and complete another short biospecimen sample survey.</span>',
    prepareInstructions: '<span data-i18n="samples.bswh.prepareInstructions"><p>On the day of your appointment, you do not need to fast. Drink plenty of water to keep hydrated, but <span class="site-info-bold">stop drinking water one hour before your appointment.</span></p> <p><span class="site-info-bold">One hour before your appointment:</span> Please <span class="site-info-bold">do not</span> eat, drink any liquids (including water), chew gum, smoke, vape, or chew any products (including tobacco), rinse your mouth, or brush your teeth.</p> <p class="site-info-bold">Things to bring and remember</p><ul><li>Please remember to bring a valid photo ID that is not expired (driver’s license, passport, school photo ID, or other photo ID)</li><li>Make sure you know your login information for MyConnect</li><li>We will ask you to complete a short survey when you donate your samples. It may be helpful to have this information on hand:</li><ul><li>The last time you ate or drank before your appointment, and the times you went to sleep the night before your appointment and woke up on the day of your appointment.</li><li>If you are menstruating, the start date of your most recent menstrual period in the last 12 months.</li></ul></li></ul></span>',
    whatHappens: `<span data-i18n="samples.bswh.whatHappens"><p>The research team will check you in for your appointment and then collect your samples. At the end of your visit, the research team will check you out of your appointment.</p>
                  <p>We will draw a blood sample, collect a urine sample, and collect a saliva sample by asking you to swish with mouthwash.</p>
                  <p>We will also ask you to complete a short survey on MyConnect using your mobile phone. You will need your MyConnect login information to complete the survey. If you do not have a mobile phone, we will provide you with a tablet to complete your survey. We strongly encourage you to complete your survey at your appointment. If you choose to complete it after you leave your appointment, it is important to do so as soon as possible.</p>
                  <div class="consentHeadersFont" style="color:#606060;width:100%;padding-top:1rem;">When Will I Receive My $25 Payment?</div><br>
                  You will receive your $25 payment after you donate a blood sample and complete all four sections of your first Connect survey.<br><br>
                  You can find the four sections of your first survey on your MyConnect Dashboard. These sections are:<br><br>
                  <ol><li class="site-list-item-spacing">Background and Overall Health</li><li class="site-list-item-spacing">Medications, Reproductive Health, Exercise, and Sleep</li><li class="site-list-item-spacing">Smoking, Alcohol, and Sun Exposure</li><li class="site-list-item-spacing">Where you Live and Work</li>
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
    whenToDonate: '<span data-i18n="samples.kpga.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
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
    whenToDonate: '<span data-i18n="samples.kphi.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
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
    whenToDonate: '<span data-i18n="samples.kpco.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br><span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy. </span>',
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
    whenToDonate: '<span data-i18n="samples.kpnw.whenToDonate">We will send you an email when it is time to donate your samples. After you receive the email, it is important to donate your samples as soon as you can.<br><br> <span class="site-info-bold">Note:</span> If you have recently had a blood transfusion or donated blood, please wait at least <span class="site-info-bold">eight weeks</span> from your donation or transfusion before donating your samples for Connect. If you have recently donated plasma, please wait at least <span class="site-info-bold">two days</span> from your plasma donation before donating samples for Connect. If you have an upcoming colonoscopy, please be sure that you <span class="site-info-bold">do not</span> donate samples for Connect on the <span class="site-info-bold">same day</span> as your colonoscopy.</span>',
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
    if(site.locations){
        site.locations.forEach(location => {
            template += `
                <div class="row" style="width:100%">
                    <div class="messagesHeaderFont">
                        ${location[0]}
                    </div>
                </div>`
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
            } else if (site === sanford) {
                template += !location[1] ? '' : `<div class="row" style="width:100%">
                <div style="width:100%">
                    <div class="messagesHeaderFont" data-i18n="samples.directionsText">
                        Address and Directions
                    </div>
                    <div class="messagesBodyFont">
                        ${location[1]}
                    </div>
                </div>`
            } else if (site === u_chicago && !location[1]){
                template += `<div class="row" style="width:100%">
                <div style="width:100%">
                    <div class="messagesBodyFont">
                        ${location[1]}
                    </div>
                </div>
            </div>`
            } else {
                template += `<div class="row" style="width:100%">
                <div style="width:100%">
                    <div class="messagesHeaderFont" data-i18n="samples.directionsText">
                        Address and Directions
                    </div>
                    <div class="messagesBodyFont">
                        ${location[1]}
                    </div>
                </div>
            </div>`
            }
            if(location[2])  {
                template+=`    
                <div class="row" style="width:100%;padding:5px 15px;">
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
            
            if(location[3])  {
            template+=` 
                <div class="row" style="width:100%">
                    <div style="width:100%">
                        <div class="messagesHeaderFont" data-i18n="samples.parkingInstructions">
                            Parking Instructions
                        </div>
                        <div class="messagesBodyFont">
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