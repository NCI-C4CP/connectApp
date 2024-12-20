import { getMyData, hasUserData, translateHTML, translateText } from "../shared.js";

export const renderPaymentPage = async () => {
    document.title = translateText('payment.title');
    const myData = await getMyData();
    let site = 0;
    if(hasUserData(myData)){
        site = myData["data"]['827220437']
    }
    let paymentInfo = translateHTML(`
        <p data-i18n="payment.infoBody1">
            After you complete some initial study activities, we will send you a $25 gift card as a thank you. You become eligible for the $25 gift card after you:
        </p>
        <ol>
            <li data-i18n="payment.infoBodyList1">
                Donate a blood sample
                <br>
                <br>
                AND
                <br>
                <br>
            </li>
            <li data-i18n="payment.infoBodyList2">
                Complete the following survey sections on your dashboard (before or during your Connect study visit): 
                <ul>
                    <li>
                        Background and Overall Health
                    </li>
                    <li>
                        Medications, Reproductive Health, Exercise, and Sleep
                    </li>
                    <li>
                        Smoking, Alcohol, and Sun Exposure
                    </li>
                    <li>
                        Where You Live and Work
                    </li>
                </ul>
            </li>
        </ol>
        <p data-i18n="payment.infoBody2">
            Once you complete these activities, you will receive an email from ConnectSupport@norc.org with instructions on how to claim your gift card. You will be asked to select which store you would like to receive your gift card from (for example, select from Target, Walmart, Amazon, and others). We will then send you an email with your gift card code. All emails will be sent to the email address you have on file with Connect. 
        </p>
        <p data-i18n="payment.infoBody3">
            Questions? Please contact the <a href="https://norcfedramp.servicenowservices.com/participant" target="_blank">Connect Support Center</a>.
        </p>

    `);
    if(site == 809703864){
        paymentInfo = translateHTML(`
            <p data-i18n="payment.infoBody4">
                After you complete some initial study activities, you will receive $25 as a thank you. You become eligible for the $25 after you:
            </p>
            <ol>
                <li data-i18n="payment.infoBodyList3">
                    Donate a blood sample at your Connect study visit
                    <br>
                    <br>
                    AND
                    <br>
                    <br>
                </li>
                <li data-i18n="payment.infoBodyList4">
                    Complete the following survey sections on your dashboard (before or during your Connect study visit): 
                    <ul>
                        <li>
                            Background and Overall Health
                        </li>
                        <li>
                            Medications, Reproductive Health, Exercise, and Sleep
                        </li>
                        <li>
                            Smoking, Alcohol, and Sun Exposure
                        </li>
                        <li>
                            Where You Live and Work
                        </li>
                    </ul>
                </li>
            </ol>
            <p data-i18n="payment.infoBody5">
                A research coordinator will give you the $25 cash payment at the end of your Connect study visit. Questions? Please contact the <a href="https://norcfedramp.servicenowservices.com/participant" target="_blank">Connect Support Center</a>.
            </p>
        `);
    }
    let template =  translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <div class="row">
                    <h3 data-i18n="payment.infoTitle">Connect Payment Process</h3>
                </div>
                <div class="row">
                    <div>
                        ${paymentInfo}
                    </div>
                </div>
            </div>
            <div class="col-lg-2">
            </div>
        </div>
    `);
    
    document.getElementById('root').innerHTML = template;
    const btns = document.getElementsByClassName('faq-btn');
    Array.from(btns).forEach(element => {
        element.addEventListener('click', () => {
            const childs = element.querySelectorAll("[class='faq-icon']")
            const icon = childs[0].childNodes;
            if(icon[0].classList.contains('fa-plus')){
                icon[0].classList.add('fa-minus')
                icon[0].classList.remove('fa-plus')
            }
            else {
                icon[0].classList.remove('fa-minus')
                icon[0].classList.add('fa-plus')
            }
        })
    });
}