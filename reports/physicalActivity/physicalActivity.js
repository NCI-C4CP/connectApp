import { translateText, translateDate, replaceUnsupportedPDFCharacters } from "../../js/shared.js";
const { PDFDocument, StandardFonts, rgb } = PDFLib;
import fieldMapping from "../../js/fieldToConceptIdMapping.js";

export const renderPhysicalActivityReport = (reports, includeHeader) => {
    let template = `<div>
                    <div class="row" style="max-width: 1000px">
                        <div class="col-md-12">`;
    let currentReport = reports['Physical Activity Report'];
    if (includeHeader) {
        let reportTitle = '<span data-i18n="reports.' + currentReport.reportId + 'ResultsTitle">' + translateText('reports.' + currentReport.reportId + 'Title') + '</span>';
        let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        let reportTime = currentReport.dateField && currentReport.data[currentReport.dateField] ? `<p class="report-generated"><span data-i18n="reports.generated">Report Generated On </span> <span data-i18n="date" data-timestamp="${currentReport.data[currentReport.dateField]}" data-date-options="${encodeURIComponent(JSON.stringify(dateOptions))}"  class="report-generated"></span></p>` : '';

        template += `<p class="messagesHeaderFont">
                ${reportTitle}
            </p>
            ${reportTime}`;
    }
    let monthDateOptions = { month: 'long' };
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
                style="align-self: stretch; padding: 32px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 36px; display: flex">
                <div
                    style="align-self: stretch; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 24px; display: flex">
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
                            <div data-i18n="reports.physicalActivityAerobicHeader"
                                style="width: 364px; color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                                Your aerobic activity</div>
                            <div
                                style="align-self: stretch; height: 249.90px; padding: 24px; background: #164C71; border-radius: 3px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 18px; display: flex; min-width: 450px;">
                                <div
                                    style="align-self: stretch; height: 141px; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; display: flex">
                                    <div
                                        style="height: 43px;line-height: 50px;background-image: url('${aerobicImage}');background-repeat: no-repeat;color: white;font-size: 18px;font-family: Montserrat;font-weight: 700;word-wrap: break-word;padding-left: 100px;">
                                        <span data-i18n="reports.${aerobicTitle}"></span></div>
                                    <div
                                        style="align-self: stretch; color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        <span data-i18n="reports.${aerobicBody}"></span></div>
                                </div>
                            </div>
                        </div>
                        <div
                            style="align-self: stretch; height: 311.90px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                            <div data-i18n="reports.physicalActivityMuscleHeader"
                                style="color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                                Your muscle strengthening activity</div>
                            <div
                                style="align-self: stretch; height: 276.90px; padding: 24px; background: #164C71; border-radius: 3px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 18px; display: flex; min-width: 450px;">
                                <div
                                    style="align-self: stretch; height: 168px; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; display: flex">
                                    <div
                                        style="height: 43px;line-height: 50px;background-image: url('${muscleImage}');background-repeat: no-repeat;color: white;font-size: 18px;font-family: Montserrat;font-weight: 700;word-wrap: break-word;padding-left: 60px;">
                                        <span data-i18n="reports.${muscleTitle}"></span> </div>
                                    <div
                                        style="align-self: stretch; color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        <span data-i18n="reports.${muscleBody}"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        style="width: 198px; padding: 24px; border-radius: 3px; border: 1px #A9AEB1 solid; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: inline-flex">
                        <div data-i18n="reports.physicalActivityCalcHeader" 
                            style="align-self: stretch; color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                            How did we calculate your activity?</div>
                        <div data-i18n="reports.physicalActivityCalcBody" 
                            style="align-self: stretch; color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">
                            We added up the time per week you reported doing different exercise and recreational
                            activities and calculated the average number of minutes of aerobic activity per week you
                            engaged in. We also looked at your answers to questions about doing muscle strengthening
                            activities, like weight training.</div>
                    </div>
                </div>
                <div style="width: 80%; height: 0px; border: 1px #A9AEB1 solid; margin-left: auto; margin-right: auto;"></div>
                <div
                    style="align-self: stretch; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 24px; display: flex">
                    <div
                        style="align-self: stretch; height: 100px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                        <div data-i18n="reports.physicalActivityGuidlinesHeader"
                            style="color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                            Key guidelines for adults</div>
                        <div data-i18n="reports.physicalActivityGuidlinesIntro"
                            style="align-self: stretch; color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                            The national physical activity guidelines were developed by experts based on more than 60
                            years of research showing how physical activity affects our health.</div>
                    </div>
                    <div style="justify-content: flex-start; align-items: flex-start; gap: 24px; display: inline-flex">
                        <div
                            style="flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: inline-flex">
                            <div data-i18n="reports.physicalActivityGuidlinesListHeader"
                                style="align-self: stretch; color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                                Adults need a mix of activity to be healthy</div>
                            <div style="align-self: stretch">
                                <ul>
                                    <li data-i18n="reports.physicalActivityGuidlinesListPoint1"
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        Aim for at least 150 minutes a week of moderate-intensity aerobic activity
                                        (anything that gets your heart beating faster counts!). Try to spread aerobic
                                        activity throughout the week. If you prefer vigorous-intensity aerobic activity
                                        (like running), aim for at least 75 minutes a week.</li>
                                    <li data-i18n="reports.physicalActivityGuidlinesListPoint2"
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                        Aim for at least 2 days a week of muscle-strengthening activity (activities that
                                        make your muscles work harder than usual). For the most health benefits, do
                                        strengthening activities that involve all major muscle groups.</li>
                                </ul>
                            </div>
                        </div>
                        <div
                            style="padding: 24px; background: #FDBE19; border-radius: 3px; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                            <div style="width: 150px"><span data-i18n="reports.physicalActivityModerateHeader" 
                                    style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 700; line-height: 20px; word-wrap: break-word">What
                                    counts as “moderate” and “vigorous” aerobic activity? </span> <span data-i18n="reports.physicalActivityModerateBody" 
                                    style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">Use
                                    the talk test to find out. When you’re doing an activity, try talking:</span><br />
                                <ul>
                                    <li data-i18n="reports.physicalActivityModeratePoint1" 
                                        style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">
                                        Breathing hard but still able to have a conversation easily? That’s moderate-intensity activity.
                                    </li>
                                    <li data-i18n="reports.physicalActivityModeratePoint2" 
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
                        <div style="flex: 1 1 0"><span data-i18n="reports.physicalActivityConsiderations" 
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">The
                                activity guidelines are for most adults. In general, healthy people who slowly increase
                                their weekly physical activity don’t need to consult their health care provider before
                                engaging in activity.
                                </span><br /><br /><span  data-i18n="reports.physicalActivityConsiderationsWarning" 
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 700; line-height: 20px; word-wrap: break-word">There
                                are key considerations for certain people, including people with chronic conditions,
                                people with disabilities, people who are pregnant or postpartum, and adults over
                                65.</span> <span  data-i18n="reports.physicalActivityConsiderationsWarningBody" 
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">.
                                It’s important for these groups of people to talk to a health care provider before
                                continuing or starting a new exercise program. For more information, please visit
                                <a
                                href="https://odphp.health.gov/sites/default/files/2019-10/PAG_ExecutiveSummary.pdf"
                                style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word">this
                                page</a></span><br /><br />
                                <span  data-i18n="reports.physicalActivityConsiderationsAge" 
                                style="color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word">.
                                Adults over 65 need the same amount of physical activity as all adults —but
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
                        <div data-i18n="reports.physicalActivityTipsHeader"
                            style="color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                            Tips for maintaining or improving your activity</div>
                        <div>
                            <ol>
                                <li data-i18n="reports.physicalActivityTipsTip1"
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    Break up activity over the week. Switch things up and get creative! There’s no wrong
                                    way to get in your aerobic and muscle strengthening activity.
                                </li>
                                <li data-i18n="reports.physicalActivityTipsTip2"
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    It all adds up. If you don’t meet the guidelines for activity this week, don’t sweat
                                    it. Even a little bit of activity can have health benefits.
                                </li>
                                <li data-i18n="reports.physicalActivityTipsTip3"
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    Try adding more movement into your day, like going for a short walk during a lunch
                                    break, taking the stairs to your office, or sneaking in some muscle strengthening
                                    exercises during commercial breaks. Check out some tips for fitting more activity
                                    into your day: <a href="https://youtu.be/61p1OIO20wk"
                                        style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word">
                                        [YouTube – 1:59]</a><span
                                        style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">.
                                    </span></li>
                                <li data-i18n="reports.physicalActivityTipsTip4"
                                    style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                    You can find the right activity for you! The key is to make activity fun and
                                    sustainable so you can continue being active over the long term. Use tips like these
                                    for getting motivated:
                                    <a href="https://youtu.be/0i1lCNHaxhs"
                                        style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word">[YouTube
                                        – 2:04]</a>
                                <li data-i18n="reports.physicalActivityTipsTip5"
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
                            <br />
                            <div data-i18n="reports.physicalActivityVisit" 
                               style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                Visit
                                <a 
                                    style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word"
                                    href="https://health.gov/moveyourway">https://health.gov/moveyourway</a>
                                for more tools, tips, and resources.
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style="flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                    <div data-i18n="reports.physicalActivityBenefits" 
                        style="color: #606060; font-size: 18px; font-family: Montserrat; font-weight: 700; line-height: 21px; word-wrap: break-word">
                        Studied benefits of physical activity:</div>
                    <div data-i18n="reports.physicalActivityBenefitsLong" ><span 
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">Long
                            term</span><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">:
                            Helps prevent <a
                                href="https://www.cancer.gov/about-cancer/causes-prevention/risk/obesity/physical-activity-fact-sheet"
                                style="color: #2973A5; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word">certain
                                cancers</a>; reduces risk of dementia, heart disease, and type 2 diabetes;
                            improves bone health; and helps ease anxiety and depression.</span>
                    </div>
                    <div data-i18n="reports.physicalActivityBenefitsShort"><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">Short
                            term:</span><span
                            style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                            Reduces stress, lowers blood pressure, sharpens focus, improves sleep, and boosts
                            mood.</span></div>
                </div>
                <div style="height: 0px; width: 80%; margin-left: auto; margin-right: auto; border: 1px #A9AEB1 solid"></div>
                <div
                    style="align-self: stretch; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 24px; display: flex">
                    <div
                        style="align-self: stretch; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 12px; display: flex">
                        <div data-i18n="reports.physicalActivityNationalHeader"
                            style="color: #606060; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                            National Data: How many adults are meeting the physical activity guidelines?</div>
                        <div>
                            <div data-i18n="reports.physicalActivityNationalAerobic"
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                A recent nationwide survey found that about <span style="font-weight: 700;">39% of adults in the U.S.</span>
                                reported engaging in recommended amounts of aerobic physical activity through leisure
                                activities, such as sports, fitness, or recreational activities.¹
                            </div>
                            <br />
                            <div data-i18n="reports.physicalActivityNationalMuscle" 
                                style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word"/>
                                <span style="color: #2E2E2E; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">31%</span>
                                of adults met the guidelines for muscle strengthening activity, with or without meeting
                                the aerobic activity guidelines.²
                            </div>
                        </div<
                    </div>
                    <br>
                    <div data-i18n="reports.physicalActivityNationalFootnote"
                        style="align-self: stretch color: #2E2E2E; font-size: 14px; font-family: Noto Sans; font-weight: 400; line-height: 20px; word-wrap: break-word" data-i18n="physicalActivityNationalFootnote"><span
                            1. National Center for Health Statistics. National health and nutrition examination survey. 2020;
                            <a
                                style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word"
                                href="https://www.cdc.gov/nchs/nhanes/index.htm">https://www.cdc.gov/nchs/nhanes/index.htm</a>.
                            <br />
                            2. National Center for Health Statistics, National Health Interview Survey, 2020;
                            <a
                                style="color: #2973A5; font-size: 14px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 20px; word-wrap: break-word"
                                href="https://www.cdc.gov/nchs/nhis/documentation/2020-nhis.html">https://www.cdc.gov/nchs/nhis/documentation/2020-nhis.html</a>.
                    </div>
                </div>
                <div
                    style=" padding: 24px; background: #164C71; border-radius: 3px; justify-content: flex-start; align-items: flex-start; gap: 18px; display: inline-flex">
                    <div
                        style="flex: 1 1 0; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; display: inline-flex">
                        <div data-i18n="reports.physicalActivityInTouch" 
                            style="align-self: stretch; color: white; font-size: 20px; font-family: Montserrat; font-weight: 700; line-height: 23px; word-wrap: break-word">
                            Get in touch</div>
                        <div style="align-self: stretch">
                            <div data-i18n="reports.physicalActivityInTouchThanks"
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">Thanks
                                for reading! We hope you're inspired to move for your health.
                            </div><br />
                            <div data-i18n="reports.physicalActivityInTouchQuestions"
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                Questions about your report or the resources we shared? Reach out to the <span
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 700; line-height: 27px; word-wrap: break-word">Connect
                                Support Center</span> at
                            <span>
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">
                                at </span><a
                                style="color: white !important; font-size: 18px; font-family: Noto Sans; font-weight: 400; text-decoration: underline; line-height: 27px; word-wrap: break-word"
                                href="https://MyConnect.cancer.gov/support" target="_blank">MyConnect.cancer.gov/support</a>
                            </div>
                            <br>
                            <div data-i18n="reports.physicalActivityInTouchProvider" 
                                style="color: white; font-size: 18px; font-family: Noto Sans; font-weight: 400; line-height: 27px; word-wrap: break-word">Questions
                                about your current health or about changing your physical activity plan? Reach out to
                                your health care provider.</div>
                    </div>
                </div>
            </div>
        </div>`;
    template += `</div>
    </div>
    </div>`
    return template;
}

export const renderPhysicalActivityReportPDF = async (reports) => {

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
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const editPage = pdfDoc.getPages().at(0);

    let pngAerobicImage;
    let pngMuscleImage;
    if (aerobicImage) {
        const pngAerobicImageBytes = await fetch(aerobicImage).then((res) => res.arrayBuffer());
        pngAerobicImage = await pdfDoc.embedPng(pngAerobicImageBytes);
        editPage.drawImage(pngAerobicImage, {
            x: 50,
            y: 415,
            width: 83,
            height: 43,
        });
    }
    if (muscleImage) {
        const pngMuscleImageBytes = await fetch(muscleImage).then((res) => res.arrayBuffer())
        pngMuscleImage = await pdfDoc.embedPng(pngMuscleImageBytes);
        editPage.drawImage(pngMuscleImage, {
            x: 55,
            y: 175,
            width: 43,
            height: 43,
        });
    }
    const helveticaFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    if (aerobicTitle) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', aerobicTitle]), helveticaFontBold), {
            x: 150,
            y: 425,
            size: 15,
            font: helveticaFontBold,
            color: rgb(1, 1, 1)
        });
    }

    if (aerobicBody) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', aerobicBody]), helveticaFont), {
            x: 50,
            y: 390,
            size: 12,
            font: helveticaFont,
            color: rgb(1, 1, 1),
            maxWidth: 320,
            lineHeight: 15
        });
    }
    if (muscleTitle) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', muscleTitle]), helveticaFontBold), {
            x: 115,
            y: 185,
            size: 15,
            font: helveticaFontBold,
            color: rgb(1, 1, 1)
        });
    }
    if (muscleBody) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', muscleBody]), helveticaFont), {
            x: 50,
            y: 150,
            size: 12,
            font: helveticaFont,
            color: rgb(1, 1, 1),
            maxWidth: 315,
            lineHeight: 15
        });
    }
    if (currentReport.dateField && currentReport.data[currentReport.dateField]) {
        let reportTime = currentReport.data[currentReport.dateField];
        let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        editPage.drawText(replaceUnsupportedPDFCharacters(translateDate(reportTime, null, dateOptions), helveticaFont), {
            x: 107,
            y: 725,
            size: 9,
            font: helveticaFont,
            color: rgb(0.18, 0.18, 0.18),
            maxWidth: 315,
            lineHeight: 15
        });
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, 'Physical_Activity_Report.pdf', "application/pdf");
}