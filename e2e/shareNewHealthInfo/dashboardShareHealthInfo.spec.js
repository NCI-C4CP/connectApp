import { test, expect } from '@playwright/test';
import en from '../../i18n/en.js';
import es from '../../i18n/es.js';
import { F, dashboardParticipant, setupDashboard } from './dashboardSupport.js';

const card = (page) => page.locator('#shareHealthInfoCard');
const banner = (page) => page.locator('[data-i18n="mytodolist.newHealthInfoBanner"]');
const withoutBannerSeen = (overrides = {}) => {
    const participant = dashboardParticipant(overrides);
    delete participant.newHealthInfoBannerSeen;
    return participant;
};

test.describe('Dashboard — Share New Health Information eligibility and announcement', () => {
    test('verified withdrawn participant sees neither the card nor the announcement', async ({ page }) => {
        await setupDashboard(page, {
            participant: withoutBannerSeen({ [F.consentWithdrawn]: F.yes }),
            i18n: en,
        });

        await expect(card(page)).toHaveCount(0);
        await expect(banner(page)).toHaveCount(0);
    });

    test('active participant who is not yet verified sees neither the card nor the announcement', async ({ page }) => {
        await setupDashboard(page, {
            participant: withoutBannerSeen({ [F.verification]: F.notYetVerified }),
            i18n: en,
        });

        await expect(card(page)).toHaveCount(0);
        await expect(banner(page)).toHaveCount(0);
    });

    test('eligible participant sees the card and one-time announcement, then only the card after reload', async ({ page }) => {
        await setupDashboard(page, { participant: withoutBannerSeen(), i18n: en });

        await expect(card(page)).toBeVisible();
        await expect(banner(page)).toHaveText(en.mytodolist.newHealthInfoBanner);
        await expect.poll(() => page.evaluate(() => window.__DASHBOARD_DATA__.newHealthInfoBannerSeen)).toBe(true);
        await expect.poll(() => page.evaluate(() => window.__DASHBOARD_STORES__)).toContainEqual({ newHealthInfoBannerSeen: true });

        await page.reload();
        await expect(card(page)).toBeVisible();
        await expect(banner(page)).toHaveCount(0);
    });

    test('announcement content renders from the approved English and Spanish dictionaries', async ({ page }) => {
        await setupDashboard(page, { participant: withoutBannerSeen(), i18n: en });
        await expect(banner(page)).toHaveText(en.mytodolist.newHealthInfoBanner);

        await page.evaluate((dictionary) => {
            window.__I18N__ = dictionary;
            window.__DASHBOARD_DATA__.newHealthInfoBannerSeen = false;
            return window.__renderDashboard();
        }, es);
        await expect(banner(page)).toHaveText(es.mytodolist.newHealthInfoBanner);
    });
});
