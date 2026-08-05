import { defineConfig, devices } from '@playwright/test';

const questIntegrationTests = '**/questIntegration/**/*.spec.js';

// E2E for the Self-Report Cancer Diagnosis flow. Tests render the real feature via a harness
// page with shared.js + dataAccess.js swapped for stubs via page.route, so the process DOM/flow
// is exercised in a real browser without the full app/Firebase boot.
export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.js',
    timeout: 30000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium-desktop',
            testIgnore: questIntegrationTests,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'chromium-phone',
            testIgnore: questIntegrationTests,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'chromium-tablet',
            testIgnore: questIntegrationTests,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 820, height: 1180 },
                hasTouch: true,
            },
        },
        {
            name: 'quest-integration',
            testMatch: questIntegrationTests,
            use: {
                ...devices['Desktop Chrome'],
                baseURL: 'http://localhost:5000',
            },
        },
    ],
    webServer: [
        {
            command: 'npx http-server -p 4173 -c-1 --silent .',
            url: 'http://localhost:4173/e2e/shareNewHealthInfo/harness.html',
            reuseExistingServer: !process.env.CI,
            timeout: 60000,
        },
        {
            // questionnaire.js maps this host to the external Quest loader.
            command: 'npx http-server -p 5000 -c-1 --silent .',
            url: 'http://localhost:5000/e2e/questIntegration/harness.html',
            reuseExistingServer: !process.env.CI,
            timeout: 60000,
        },
    ],
});
