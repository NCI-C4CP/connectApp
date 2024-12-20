import { retrieveNotifications, showAnimation, hideAnimation, translateHTML, translateText } from "../shared.js";


export const renderNotificationsPage = async () => {
    document.title = translateText('notifications.title');
    showAnimation();
    const notifs = await retrieveNotifications();

    let template = `
        <div class="row">
            <div class="col-lg-2">
            </div>
            <div class="col-lg-8">
    `;
    let read = [];
    let unread = [];
    
    for (let i = 0; i < notifs.data.length; i++) {
        if (notifs.data[i].read) {
            read.push(notifs.data[i]);

        } else {
            unread.push(notifs.data[i]);
        }
    }
    if (unread.length === 0) {
        template += `
                <ul class="nav nav-tabs" style="border-bottom:none; margin-top:20px">
                    <li class="nav-item">
                        <button class="nav-link navbar-btn messages-Active-Nav" id="readNotiifs" data-i18n="notifications.read"></button>
                    </li>
                </ul>`;
    } else {
        template += `
                <ul class="nav nav-tabs" style="border-bottom:none; margin-top:20px">
                    <li class="nav-item" >
                        <button class=" nav-link navbar-btn messages-Active-Nav" id="unreadNotifs" data-i18n="notifications.unread">Unread</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link navbar-btn messages-Inactive-Nav" id="readNotifs" data-i18n="notifications.read">Read</button>
                    </li>
                </ul>`;
    }

    
    template += `
        <div class="surveyMainBody id="surveyMainBody">
    `;
    if (unread.length === 0) {
        template += renderMainBody(notifs.data, 'read');
    } else {
        template += renderMainBody(notifs.data, 'unread');
    }
    
    template += `</ul>`;
    template += `
        </div>
        <div class="col-lg-2">
        </div>
    </div>
    `;
    
    const mainContent = document.getElementById('root');
    mainContent.innerHTML = translateHTML(template);
    if (unread.length > 0) {
        document.getElementById('readNotifs').addEventListener('click', () => {
            document.getElementById('surveyMainBody').innerHTML = renderMainBody(notifs.data, 'read');
            if (!document.getElementById('readNotifs').classList.contains('messages-Active-Nav')) {
                let toActive = document.getElementById('readNotifs');   
                let toInactive = document.getElementById('unreadNotifs');
                toActive.classList.remove('messages-Inactive-Nav');
                toActive.classList.add('messages-Active-Nav');
                toInactive.classList.add('messages-Inactive-Nav');
                toInactive.classList.remove('messages-Active-Nav');
            }
        });
        document.getElementById('unreadNotifs').addEventListener('click', () => {
            if (!document.getElementById('unreadNotifs').classList.contains('messages-Active-Nav')) {
                let toInactive = document.getElementById('readNotifs');   
                let toActive = document.getElementById('unreadNotifs');
                toActive.classList.remove('messages-Inactive-Nav');
                toActive.classList.add('messages-Active-Nav');
                toInactive.classList.add('messages-Inactive-Nav');
                toInactive.classList.remove('messages-Active-Nav');
            }
            document.getElementById('surveyMainBody').innerHTML = renderMainBody(notifs.data, 'unread');
        });
    }
    hideAnimation();
};


const renderMainBody = (data, tab) => {
    let template = `<ul class="questionnaire-module-list">`;
    let hasNotification = false;
    for (let i = 0; i < data.length; i++) {
        if ((tab === 'read' && data[i].read === true) || (tab === 'unread' && data[i].read === false)) {
            let notificationTitle = '<span data-i18n="notifications.email">'+translateText('notifications.email')+'</span> ('+data[i].notification.title+')';
            if (data[i].notificationType === "sms") {
                notificationTitle = '<span data-i18n="notifications.sms">'+translateText('notifications.sms')+'</span>';
              }
            
            const notificationBody = data[i].notification.body.replace(/<style[^>]*>.*?<\/style>/gs, "");
            template += `<li style="width:100%; margin:auto; margin-bottom:20px; border:1px solid lightgrey; border-radius:5px;">
                <div>
                    <div class="row">
                        <div class="col-md-2 ">
                        <div class="SurveyIcon"><i class="fas fa-bell d-none d-md-block" data-i18n="notifications.surveyIcon" title="Survey Icon" style="text-align:center; width:100%;font-size:30px;color:#ffff;padding-top:5px"></i></div>
                        </div>
                        <div class="col-md-10">
                            <span class="messagesHeaderFont">
                                ${notificationTitle}
                            </span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-2">
                        </div>
                        <div class="col-md-10 messagesBodyFont">
                        ${notificationBody}
                        </div>
                    </div>
                </div>
            </li>
            `;
            hasNotification = true;
        }
        
    }
    if (!hasNotification) {
        template += `
            <div class="row">
                <span class="messagesHeaderFont" style="text-align:center; margin:auto;" data-i18n="notifications.noMessages">
                    You have no messages.
                </span>
            </div>
            `;
    }
    
    return translateHTML(template);
};