import { test, expect } from '@playwright/test';
import { setup } from './support.js';

// Per-screen write: every Next/Back sends the full snapshot (logged by
// the stub in window.__SRCDX_SAVES__). A terminal save failure reverts navigation to the last
// server-acked screen (Quest parity). Submit sends the byte-identical snapshot, and merely
// opening the page never creates a server row.

const saves = (page) => page.evaluate(() => window.__SRCDX_SAVES__ || []);

test.describe('Server-backed per-screen writes', () => {
    test('a failed save reverts navigation to the last server-acked screen with an alert', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');                          // -> Q2; the @Q2 snapshot saves OK
        await expect(page.locator('#srcdxDxYear')).toBeVisible();

        await page.evaluate(() => { window.__SRCDX_SAVE_FAIL__ = true; });
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');                          // -> Q3 attempt; its save fails

        // Reverted to Q2 (the last acked snapshot — taken on arriving at Q2, so the year is
        // empty again: the unsaved answer is dropped, exactly Quest's store-error semantics).
        await expect(page.locator('.srcdx-save-error')).toBeVisible();
        await expect(page.locator('#srcdxDxYear')).toBeVisible();
        await expect(page.locator('#srcdxDxYear')).toHaveValue('');
        await expect(page.locator('#txReceivedNo')).toHaveCount(0); // NOT on Q3

        await page.evaluate(() => { window.__SRCDX_SAVE_FAIL__ = false; });
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');                          // retry proceeds
        await expect(page.locator('#txReceivedNo')).toBeVisible();
    });

    test('submit sends the byte-identical snapshot the last per-screen save sent (D_ fields)', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');
        await page.check('#txReceivedNo');
        await page.click('#srcdxNext');                          // -> review (last per-screen save)
        await page.click('#srcdxNext');                          // submit

        const parity = await page.evaluate(() => {
            const dOnly = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => k.startsWith('D_')));
            const lastSave = (window.__SRCDX_SAVES__ || []).at(-1);
            return { save: dOnly(lastSave || {}), submit: dOnly(window.__SRCDX_LAST_PAYLOAD__ || {}) };
        });
        expect(Object.keys(parity.submit).length).toBeGreaterThan(0);
        expect(parity.submit).toEqual(parity.save);              // one builder, one contract
        // The snapshot also carries the operational resume strings on BOTH paths.
        const last = await page.evaluate(() => (window.__SRCDX_SAVES__ || []).at(-1));
        expect(typeof last.stateJSON).toBe('string');
        expect(typeof last.positionJSON).toBe('string');
    });

    test('opening the page (landing only) never creates a server row', async ({ page }) => {
        await setup(page);
        await expect(page.locator('#srcdxAddDiagnosis')).toBeVisible();
        expect(await saves(page)).toHaveLength(0);               // no save calls at all
        const stored = await page.evaluate(() => sessionStorage.getItem('srcdx_inprogress_e2e'));
        expect(stored).toBeNull();
    });

    test('submit quiesces an in-flight save so none commits after the row is finalized (race)', async ({ page }) => {
        await setup(page);
        await page.click('#srcdxAddDiagnosis');
        await page.check('#site_prostate');
        await page.click('#srcdxNext');                          // -> Q2 (saves settle; delay not yet armed)
        await page.fill('#srcdxDxYear', '2020');
        await page.click('#srcdxNext');                          // -> Q3
        await page.check('#txReceivedNo');

        // Arm a slow save, then go to review: the review-arrival save is still in flight at submit.
        await page.evaluate(() => { window.__SRCDX_SAVE_DELAY_MS__ = 600; });
        await page.click('#srcdxNext');                          // -> review; its snapshot save is in flight
        await page.click('#srcdxNext');                          // submit: must await the in-flight save

        // Submit reached confirmation — with the fix only after the 600ms save committed.
        await expect(page.locator('#srcdxAddAnother')).toBeVisible();

        // Once every save has fully settled, assert none committed after submit began:
        //  - ordering: 'submitStart' is the last event (no trailing 'saveEnd' after it)
        //  - state: the finalized in-progress row stays removed, not resurrected by a late save
        await page.waitForFunction(() => {
            const o = window.__SRCDX_ORDER__ || [];
            const saves = window.__SRCDX_SAVES__ || [];
            return o.includes('submitStart') && o.filter((e) => e === 'saveEnd').length === saves.length;
        });
        const order = await page.evaluate(() => window.__SRCDX_ORDER__);
        expect(order.indexOf('submitStart')).toBe(order.length - 1);
        const stored = await page.evaluate(() => sessionStorage.getItem('srcdx_inprogress_e2e'));
        expect(stored).toBeNull();
    });
});
