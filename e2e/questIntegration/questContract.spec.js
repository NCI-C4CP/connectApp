import { expect, test } from '@playwright/test';
import { questLock } from './questLock.js';
import {
    activeQuestion,
    hostSnapshot,
    openQuestIntegration,
    settleQuestFocus,
} from './support.js';

async function next(page) {
    await activeQuestion(page).locator('button.next').click();
    await settleQuestFocus(page);
}

async function reachGrid(page) {
    await activeQuestion(page, 'CHOICE').locator('label', { hasText: 'Blue' }).click();
    await next(page);
    await activeQuestion(page, 'CHECKS').locator('label', { hasText: 'Email' }).click();
    await next(page);

    const state = activeQuestion(page, 'STATE').locator('#home_state');
    await state.selectOption('MD');
    await state.blur();
    await next(page);
    await expect(activeQuestion(page, 'GRID_RATE')).toBeVisible();
}

async function answerGrid(page) {
    const grid = activeQuestion(page, 'GRID_RATE');
    await grid.locator('tr[data-question-id="GRID_WALK"] label', { hasText: 'Sometimes' }).click();
    await grid.locator('tr[data-question-id="GRID_CYCLE"] label', { hasText: 'Often' }).click();
    await settleQuestFocus(page);
    await next(page);
}

test.describe('ConnectApp / Quest 2 boundary', () => {
    test('loads the pinned Quest 2 module through ConnectApp configuration and renders in the real container', async ({ page }) => {
        const diagnostics = await openQuestIntegration(page);

        await expect(page.locator('#root > .row #questionnaireRoot')).toBeVisible();
        await expect(activeQuestion(page, 'CHOICE')).toContainText('Which color do you prefer?');
        expect(diagnostics.requests.questModules[0]).toBe(
            `https://cdn.jsdelivr.net/gh/episphere/quest@v${questLock.configuredVersion}/main.js`,
        );
        expect(diagnostics.requests.questModules).toEqual(expect.arrayContaining([
            expect.stringMatching(/\/eventHandlers\.js$/),
            expect.stringMatching(/\/questionnaire\.js$/),
        ]));
        expect(diagnostics.requests.questModules.some((url) => url.endsWith('/replace2.js'))).toBe(false);
        expect(diagnostics.requests.unexpectedExternal).toEqual([]);

        const host = await hostSnapshot(page);
        expect(host.calls.render).toEqual([
            expect.objectContaining({
                activate: true,
                divID: 'questionnaireRoot',
                hasRetrieve: true,
                hasStore: true,
                lang: 'en',
                questVersion: questLock.configuredVersion,
                showProgressBarInQuest: true,
            }),
        ]);
        expect(host.calls.appSettings).toEqual([[
            'currentQuestVersion',
            'currentQuest2Version',
            'quest2ModuleActivatedTimestamp',
        ]]);
        expect(host.calls.errors).toEqual([]);
        expect(host.calls.localforageCleared).toBe(true);
    });

    test('allows focus to enter and leave Quest without trapping the participant in the PWA boundary', async ({ page }) => {
        await openQuestIntegration(page);
        await settleQuestFocus(page);

        await page.locator('#beforeQuest').focus();
        const forward = [];
        for (let index = 0; index < 20; index += 1) {
            await page.keyboard.press('Tab');
            const focused = await page.evaluate(() => ({
                id: document.activeElement?.id || '',
                insideQuest: Boolean(document.activeElement?.closest?.('#questionnaireRoot')),
            }));
            forward.push(focused);
            if (focused.id === 'afterQuest') break;
        }

        expect(forward.some(({ insideQuest }) => insideQuest)).toBe(true);
        expect(forward.at(-1)?.id).toBe('afterQuest');

        await page.keyboard.press('Shift+Tab');
        await expect(page.locator('#questionnaireRoot')).toContainText('Which color do you prefer?');
        expect(await page.evaluate(() => Boolean(document.activeElement?.closest?.('#questionnaireRoot')))).toBe(true);
    });

    test('navigates Next and Back while sending Quest state through the Connect store callback', async ({ page }) => {
        await openQuestIntegration(page);

        await activeQuestion(page, 'CHOICE').locator('label', { hasText: 'Blue' }).click();
        const firstNext = activeQuestion(page).locator('button.next');
        await firstNext.focus();
        await page.keyboard.press('Enter');
        await settleQuestFocus(page);
        await expect(activeQuestion(page, 'CHECKS')).toBeVisible();

        await activeQuestion(page, 'CHECKS').locator('label', { hasText: 'Email' }).click();
        await next(page);
        await expect(activeQuestion(page, 'STATE')).toBeVisible();

        const state = activeQuestion(page, 'STATE').locator('#home_state');
        await state.focus();
        await state.selectOption('MD');
        await state.blur();
        await next(page);
        await expect(activeQuestion(page, 'GRID_RATE')).toBeVisible();
        await activeQuestion(page, 'GRID_RATE')
            .locator('tr[data-question-id="GRID_WALK"] label', { hasText: 'Sometimes' })
            .click();
        await activeQuestion(page, 'GRID_RATE')
            .locator('tr[data-question-id="GRID_CYCLE"] label', { hasText: 'Often' })
            .click();
        await settleQuestFocus(page);
        await next(page);
        await activeQuestion(page, 'DETAIL').locator('#detail').fill('Stored detail');
        await next(page);
        await expect(activeQuestion(page, 'END')).toBeVisible();

        const back = activeQuestion(page).locator('button.previous');
        await back.focus();
        await page.keyboard.press('Enter');
        await settleQuestFocus(page);
        await expect(activeQuestion(page, 'DETAIL').locator('#detail')).toHaveValue('Stored detail');

        await expect.poll(async () => (await hostSnapshot(page)).calls.store.length).toBeGreaterThanOrEqual(4);
        const host = await hostSnapshot(page);
        expect(host.calls.store).toEqual(expect.arrayContaining([
            expect.objectContaining({ 'D_726699695_V2.CHOICE': '1' }),
            expect.objectContaining({ 'D_726699695_V2.CHECKS': ['1'] }),
            expect.objectContaining({ 'D_726699695_V2.STATE': 'MD' }),
            expect.objectContaining({
                'D_726699695_V2.GRID_RATE': {
                    GRID_WALK: '2',
                    GRID_CYCLE: '3',
                },
            }),
            expect.objectContaining({ 'D_726699695_V2.DETAIL': 'Stored detail' }),
        ]));
        expect(host.calls.store.every((payload) => 'D_726699695_V2.treeJSON' in payload)).toBe(true);
        expect(host.calls.events).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'keydown', key: 'Enter', phase: 'capture', defaultPrevented: false }),
            expect.objectContaining({ type: 'keydown', key: 'Enter', phase: 'bubble' }),
            expect.objectContaining({ type: 'submit', phase: 'capture' }),
        ]));
        expect(host.calls.errors).toEqual([]);
    });

    test('passes Connect retrieve data into Quest restoration', async ({ page }) => {
        await openQuestIntegration(page, {
            persistedData: {
                CHOICE: '2',
                treeJSON: JSON.stringify({
                    rootNode: { value: null, children: [{ value: 'CHOICE', children: [] }] },
                    currentNode: 'CHOICE',
                }),
            },
        });

        await expect(activeQuestion(page, 'CHOICE').locator('#CHOICE_2')).toBeChecked();
        const host = await hostSnapshot(page);
        expect(host.calls.retrieve).toEqual(expect.arrayContaining([
            expect.objectContaining({ conceptIds: ['D_726699695_V2'], isRetrieve: true }),
        ]));
        expect(host.calls.errors).toEqual([]);
    });

    test('keeps a representative radio grid responsive and operable inside the Connect layout', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const diagnostics = await openQuestIntegration(page);
        await reachGrid(page);

        const grid = activeQuestion(page, 'GRID_RATE');
        const table = grid.locator('table.quest-grid');
        await expect(table).toHaveCSS('display', 'block');
        await expect(table.locator('thead')).toHaveCSS('display', 'none');
        await expect(table.locator('td.response').first()).toHaveCSS('display', 'block');

        await grid.locator('tr[data-question-id="GRID_WALK"] label', { hasText: 'Sometimes' }).click();
        await expect(grid.locator('#GRID_WALK_1')).toBeChecked();

        await page.setViewportSize({ width: 1280, height: 720 });
        await expect(table).toHaveCSS('display', 'inline-table');
        await expect(table.locator('tr').first()).toHaveCSS('display', 'table-row');

        const host = await hostSnapshot(page);
        expect(host.calls.errors).toEqual([]);
        expect(diagnostics.requests.unexpectedExternal).toEqual([]);
    });

    test('opens and closes the Quest submit modal within the Connect Bootstrap page', async ({ page }) => {
        const diagnostics = await openQuestIntegration(page);
        await reachGrid(page);
        await answerGrid(page);
        await activeQuestion(page, 'DETAIL').locator('#detail').fill('Ready to submit');
        await next(page);

        const end = activeQuestion(page, 'END');
        await expect(end).toBeVisible();
        await end.getByRole('button', { name: 'Submit your survey' }).click();

        const modal = page.locator('#questionnaireRoot #submitModal');
        await expect(modal).toHaveClass(/show/);
        await expect(modal).toBeVisible();
        await expect(page.locator('#submitModalTitle')).toBeFocused();

        await modal.getByRole('button', { name: 'Close' }).click();
        await expect(modal).not.toHaveClass(/show/);
        await expect(modal).not.toBeVisible();

        const host = await hostSnapshot(page);
        expect(host.calls.errors).toEqual([]);
        expect(diagnostics.requests.unexpectedExternal).toEqual([]);
    });
});

test.describe('ConnectApp / Quest 2 native keyboard expectations @known-defect', () => {
    test('#1587 activates a focused native radio with Space', async ({ page }) => {
        await openQuestIntegration(page);

        const radio = activeQuestion(page, 'CHOICE').locator('#CHOICE_1');
        await expect(radio).toBeAttached();
        test.fail(true, 'https://github.com/episphere/connect/issues/1587');
        await radio.focus();
        await page.keyboard.press('Space');
        await expect(radio).toBeChecked();
    });

    test('#1587 preserves radio arrow movement and group exclusivity', async ({ page }) => {
        await openQuestIntegration(page);

        const first = activeQuestion(page, 'CHOICE').locator('#CHOICE_1');
        const second = activeQuestion(page, 'CHOICE').locator('#CHOICE_2');
        await activeQuestion(page, 'CHOICE').locator('label', { hasText: 'Blue' }).click();
        await expect(first).toBeChecked();
        test.fail(true, 'https://github.com/episphere/connect/issues/1587');
        await first.focus();
        await page.keyboard.press('ArrowRight');

        await expect(first).not.toBeChecked();
        await expect(second).toBeChecked();
        await expect(second).toBeFocused();
    });

    test('#1587 toggles a focused native checkbox with Space', async ({ page }) => {
        await openQuestIntegration(page);

        await activeQuestion(page, 'CHOICE').locator('label', { hasText: 'Blue' }).click();
        await next(page);
        const checkbox = activeQuestion(page, 'CHECKS').locator('#CHECKS_1');
        await expect(checkbox).toBeAttached();
        test.fail(true, 'https://github.com/episphere/connect/issues/1587');
        await checkbox.focus();
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
        await page.keyboard.press('Space');
        await expect(checkbox).not.toBeChecked();
    });

    test('#1587 leaves native select arrow handling intact', async ({ page }) => {
        await openQuestIntegration(page);

        await activeQuestion(page, 'CHOICE').locator('label', { hasText: 'Blue' }).click();
        await next(page);
        await activeQuestion(page, 'CHECKS').locator('label', { hasText: 'Email' }).click();
        await next(page);

        const select = activeQuestion(page, 'STATE').locator('#home_state');
        await select.focus();
        await expect(select).toBeFocused();
        test.fail(true, 'https://github.com/episphere/connect/issues/1587');
        await page.keyboard.press('ArrowDown');
        expect(await select.inputValue()).not.toBe('');
    });
});
