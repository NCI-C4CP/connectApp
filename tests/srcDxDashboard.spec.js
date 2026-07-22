// Dashboard integration for the Share New Health Information card.
// Peripheral dashboard dependencies are mocked.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../js/shared.js', () => ({
    hideAnimation: vi.fn(),
    questionnaireModules: vi.fn(() => ({})),
    storeResponse: vi.fn(),
    isParticipantDataDestroyed: vi.fn(() => false),
    translateHTML: vi.fn((s) => s),
    reportConfiguration: vi.fn(() => ({})),
    setReportAttributes: vi.fn(async (data, reports) => reports),
    sitesNotEnrolling: vi.fn(() => ({})),
    setModuleAttributes: vi.fn(async (data, modules) => modules),
    checkIfComplete: vi.fn(() => false),
    escapeHTML: vi.fn((s) => String(s ?? '')),
    logDDRumError: vi.fn(),
}));

vi.mock('../js/pages/questionnaire.js', () => ({ blockParticipant: vi.fn() }));
vi.mock('../js/components/form.js', () => ({ renderUserProfile: vi.fn() }));
vi.mock('../js/pages/consent.js', () => ({ consentTemplate: vi.fn() }));
vi.mock('../js/event.js', () => ({
    addEventHeardAboutStudy: vi.fn(),
    addEventRequestPINForm: vi.fn(),
    addEventHealthCareProviderSubmit: vi.fn(),
    addEventPinAutoUpperCase: vi.fn(),
    addEventHealthProviderModalSubmit: vi.fn(),
    addEventToggleSubmit: vi.fn(),
    storeParameters: vi.fn(),
}));
vi.mock('../js/pages/healthCareProvider.js', () => ({
    heardAboutStudy: vi.fn(() => ''),
    requestPINTemplate: vi.fn(() => ''),
    healthCareProvider: vi.fn(() => ''),
    noLongerEnrollingRender: vi.fn(),
}));

import * as shared from '../js/shared.js';
import fieldMapping from '../js/fieldToConceptIdMapping.js';
import { renderDashboard } from '../js/pages/dashboard.js';

const baseData = (overrides = {}) => ({
    [fieldMapping.healthcareProvider]: 1,
    [fieldMapping.heardAboutStudyForm]: fieldMapping.yes,
    [fieldMapping.consentSubmitted]: fieldMapping.yes,
    [fieldMapping.userProfileSubmittedAutogen]: fieldMapping.yes,
    [fieldMapping.verification]: fieldMapping.verified,
    [fieldMapping.consentWithdrawn]: fieldMapping.no,
    [fieldMapping.destroyData]: fieldMapping.no,
    [fieldMapping.enabledSurveys]: 0,
    verifiedSeen: true,
    updatesSeen: true,
    secondaryDismissed: true,
    newHealthInfoBannerSeen: true,
    ...overrides,
});

const render = async (data) => {
    await renderDashboard(data, false, []);
    return document.getElementById('root');
};

beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><body><div id="root"></div></body>', {
        url: 'http://localhost/#dashboard',
    });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.localStorage = dom.window.localStorage;
    globalThis.sessionStorage = dom.window.sessionStorage;
    globalThis.bootstrap = { Modal: function Modal() { this.show = vi.fn(); this.hide = vi.fn(); } };
    vi.clearAllMocks();
});

describe('dashboard Share New Health Information card', () => {
    it('renders for a verified, active participant', async () => {
        const root = await render(baseData());
        const card = root.querySelector('#shareHealthInfoCard');
        expect(card).not.toBeNull();
        expect(card.dataset.hrefTarget).toBe('#share-health-info');
        expect(card.querySelector('[data-i18n="dashboard.shareHealthInfoTitle"]')).not.toBeNull();
    });

    it('renders for verified participants with non-eligibility-blocking status flags', async () => {
        for (const data of [
            baseData({ [fieldMapping.participantDeceased]: fieldMapping.yes }),
            baseData({ [fieldMapping.participantDeceasedNORC]: fieldMapping.yes }),
        ]) {
            document.getElementById('root').innerHTML = '';
            const root = await render(data);
            expect(root.querySelector('#shareHealthInfoCard')).not.toBeNull();
        }
    });

    it('does not render for ineligible participant states', async () => {
        const ineligibleCases = [
            baseData({ [fieldMapping.verification]: fieldMapping.notYetVerified }),
            baseData({ [fieldMapping.consentWithdrawn]: fieldMapping.yes }),
        ];

        for (const data of ineligibleCases) {
            document.getElementById('root').innerHTML = '';
            const root = await render(data);
            expect(root.querySelector('#shareHealthInfoCard')).toBeNull();
        }
    });
});

describe('dashboard Share New Health Information one-time banner (issue #1658)', () => {
    it('shows the banner once and stores the seen flag on first sign-in after release', async () => {
        const data = baseData();
        delete data.newHealthInfoBannerSeen;
        const root = await render(data);
        const banner = root.querySelector('[data-i18n="mytodolist.newHealthInfoBanner"]');
        expect(banner).not.toBeNull();
        expect(banner.querySelector('strong')?.textContent).toBe('Share New Health Information');
        expect(shared.storeResponse).toHaveBeenCalledWith({ newHealthInfoBannerSeen: true });
    });

    it('does not show the banner again after it has been seen', async () => {
        const root = await render(baseData());
        expect(root.querySelector('[data-i18n="mytodolist.newHealthInfoBanner"]')).toBeNull();
        expect(shared.storeResponse).not.toHaveBeenCalledWith({ newHealthInfoBannerSeen: true });
    });

    it('does not show the banner to withdrawn participants', async () => {
        const data = baseData({ [fieldMapping.consentWithdrawn]: fieldMapping.yes });
        delete data.newHealthInfoBannerSeen;
        const root = await render(data);
        expect(root.querySelector('[data-i18n="mytodolist.newHealthInfoBanner"]')).toBeNull();
        expect(shared.storeResponse).not.toHaveBeenCalledWith({ newHealthInfoBannerSeen: true });
    });
});

describe('dashboard seen-flag persistence', () => {
    it.each([
        ['updatesSeen', 'mytodolist.newUpdates'],
        ['newHealthInfoBannerSeen', 'mytodolist.newHealthInfoBanner'],
    ])('logs a rejected %s write without interrupting dashboard rendering', async (flagName, bannerKey) => {
        const error = new Error('network error');
        const data = baseData();
        delete data[flagName];
        shared.storeResponse.mockRejectedValueOnce(error);

        const root = await render(data);
        await Promise.resolve();

        expect(root.querySelector(`[data-i18n="${bannerKey}"]`)).not.toBeNull();
        expect(shared.logDDRumError).toHaveBeenCalledWith(
            error,
            'DashboardSeenFlagPersistenceError',
            expect.objectContaining({
                userAction: 'persist dashboard seen flag',
                flagName,
                timestamp: expect.any(String),
            }),
        );
    });
});
