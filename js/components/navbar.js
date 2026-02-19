import { isParticipantDataDestroyed, appState, translateHTML, retrieveNotifications } from "../shared.js";
import fieldMapping from '../fieldToConceptIdMapping.js';

export const userNavBar = (response) => {
    const disabledClass = isParticipantDataDestroyed(response.data) ? 'disabled': '';

    let template = translateHTML(`
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" href="#dashboard" id="userDashboard" data-i18n="navbar.dashboardLink">Dashboard</a>
            </li>
            <li class="nav-item">
                <a class="nav-link ${disabledClass}" href="#support" id="connectSupport" data-i18n="navbar.supportLink">Support</a>
            </li>
        </ul>
    `);

    return template;
}

export const userHeaderNavBar = (response) => {
    let profileLinkText = '';
    const displayName = response.data && (response.data[fieldMapping.prefName] || response.data[fieldMapping.fName]);
    if (displayName) {
        profileLinkText = `<span data-i18n="navbar.profileLinkPre"></span>${displayName}<span data-i18n="navbar.profileLinkPost">'s Profile</span>`;
    } else {
        profileLinkText = '<span data-i18n="navbar.profileLink"></span>';
    }

    let template = translateHTML(`
        <ul class="navbar-nav">
            <li class="nav-item flex-row">
                <a class="nav-link" href="#messages" id="messagesLink" title="Messages"><span id="messagesIcon" data-i18n="navbar.messagesIcon" class="fa-solid fa-bell" style="position: relative"></span><span class="d-md-none" style="margin-left: .8rem" data-i18n="navbar.messagesLink"></span></a>
            </li>
            <div class="header-vr d-none d-md-block"></div>
            <li class="nav-item d-none d-md-block">
                <div class="dropdown">
                <button class="btn btn-link dropdown-toggle nav-link" type="button" id="dropdownUserMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="fas fa-user profile-icon"></span> ${profileLinkText}
                </button>
                <div class="dropdown-menu" aria-labelledby="dropdownUserMenuButton">
                    <a class="dropdown-item" href="#myprofile" data-i18n="navbar.editProfileLink">Edit My Profile</a>
                    <hr class="dropdown-divider" />
                    <a class="dropdown-item" href="#sign_out" data-i18n="navbar.signOutLink">Sign Out</a>
                </div>
                </div>
            </li>
            <li class="nav-item d-md-none">
                <a class="nav-link d-flex align-items-center" href="#myprofile" ><span class="fas fa-user profile-icon-sm"></span> &nbsp;<span data-i18n="navbar.editProfileLink">Edit My Profile</span></a>
            </li>
            <li class="nav-item d-md-none">
                <a class="nav-link" href="#sign_out"><span class="fas fa-sign-out-alt"></span> <span data-i18n="navbar.signOutLink">Sign Out</span></a>
            </li>
        </ul>
    `);

    return template;
}

export const addMessageCounterToNavBar = () => {
    const messagesIcon = document.getElementById('messagesIcon');
    if (messagesIcon) {
        retrieveNotifications()
            .then((notifications) => {
                let unreadCount = 0;
                for (let i = 0; i < notifications.data.length; i++) {
                    if (!notifications.data[i].read) {
                        unreadCount++;
                    }
                }
                if (unreadCount > 0) {
                    let countSpan = document.createElement('span');
                    countSpan.id = 'messageCount';
                    countSpan.className = 'message-count';
                    countSpan.innerText = unreadCount+'';
                    messagesIcon.appendChild(countSpan);
                } else {
                    let countSpan = document.getElementById('messageCount');
                    if (countSpan) {
                        countSpan.parentNode.removeChild(countSpan);
                    }
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }
}

export const homeNavBar = () => {
    return translateHTML(`
        <div class="navbar-nav transparent-border">
            <li class="nav-item" data-i18n="navbar.homeLink">
                <a class="nav-link" href="#" id="home" title="Home"> Home</a>
            </li>
        </div>
        <div class="navbar-nav transparent-border">
            <li class="nav-item" data-i18n="navbar.aboutLink">
                <a class="nav-link" href="#about" id="about" title="About"> About</a>
            </li>
        </div>
        <div class="navbar-nav transparent-border">
            <li class="nav-item" data-i18n="navbar.expectationsLink">
                <a class="nav-link" href="#expectations" id="expectations" title="Expectations"> What to expect</a>
            </li>
        </div>
        <div class="navbar-nav transparent-border">
            <li class="nav-item" data-i18n="navbar.privacyLink">
                <a class="nav-link" href="#privacy" id="privacy" title="Privacy"> Privacy</a>
            </li>
        </div>
    `);
}

export const languageSelector = () => {
    const selectedLanguage = appState.getState().language;
    return translateHTML(`
        <label for="languageSelector" id="languageSelectorTitle" data-i18n="languageSelector.title">Language</label>
        <select  id="languageSelector">
            <option value="${fieldMapping.language.en}" ${selectedLanguage === fieldMapping.language.en ? 'selected' : ''} data-i18n="languageSelector.englishOption">English</option>
            <option value="${fieldMapping.language.es}" ${selectedLanguage === fieldMapping.language.es ? 'selected' : ''} data-i18n="languageSelector.spanishOption">Spanish</option>
        </select>
    `);
}