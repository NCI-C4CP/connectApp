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
    it('does not render while Self-Report Cancer Diagnosis is disabled', async () => {
        const root = await render(baseData());
        const card = root.querySelector('#shareHealthInfoCard');
        expect(card).toBeNull();
    });

    it('does not render for verified participants with non-eligibility-blocking status flags while disabled', async () => {
        for (const data of [
            baseData({ [fieldMapping.participantDeceased]: fieldMapping.yes }),
            baseData({ [fieldMapping.participantDeceasedNORC]: fieldMapping.yes }),
        ]) {
            document.getElementById('root').innerHTML = '';
            const root = await render(data);
            expect(root.querySelector('#shareHealthInfoCard')).toBeNull();
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
