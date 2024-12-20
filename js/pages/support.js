import { getMyData, hasUserData, translateHTML, translateText } from "../shared.js";

export const renderSupportPage = async () => {
    document.title = translateText('support.title');
    const myData = await getMyData();
    let link = "https://norcfedramp.servicenowservices.com/recruit";
    let phone = 'defaultPhone';
    let email = 'defaultEmail';
    
    if(hasUserData(myData)){
        let data = myData.data;
        
        if(!(data['827220437'] && data['142654897'] && data['919254129'] !== 353358909)){
            link="https://norcfedramp.servicenowservices.com/participant"
            phone = 'signedInPhone';
        }
    }

    let template =  translateHTML(`
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
                <div class="row">
                    <h3 data-i18n="support.infoTitle">Connect Support Center</h3>
                </div>
                <div class="row">
                    <div>
                        <p data-i18n="support.question">
                            Have a question or problem?
                        </p>
                        <p data-i18n="support.visitPortal">
                            Visit the Connect Support Center portal to search frequently asked questions or to submit a question.
                        </p>
                            <a href="${link}" target="_blank">MyConnect.cancer.gov/support</a>
                        <br>
                        <br>
                        <p>
                            <span data-i18n="support.alsoCall">You can also call </span><span data-i18n="support.${phone}"></span><span data-i18n="support.alsoEmail"> or email </span><span data-i18n="support.${email}"></span>
                        </p>
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