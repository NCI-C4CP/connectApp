import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import fieldMapping from '../../js/fieldToConceptIdMapping.js';
import { questLock } from './questLock.js';

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, '../..');
const fixture = readFileSync(resolve(here, 'fixture.txt'), 'utf8');
const sharedStub = readFileSync(resolve(here, 'stubs/shared.stub.js'), 'utf8');
const ssnStub = readFileSync(resolve(here, 'stubs/ssn.stub.js'), 'utf8');

const questRuntimePaths = [
    'ActiveLogic.css',
    'Default.css',
    'Quest.css',
    'Questionnaire.css',
    'Style1.css',
    'accessibleQuestionTextBuilder.js',
    'buildGrid.js',
    'common.js',
    'customMathJSImplementation.js',
    'evaluateConditions.js',
    'eventHandlers.js',
    'initSurvey.js',
    'knownFunctions.js',
    'main.js',
    'questionProcessor.js',
    'questionnaire.js',
    'restoreResponses.js',
    'stateManager.js',
    'tree.js',
    'validate.js',
    'i18n/en.js',
    'i18n/es.js',
];

function candidateQuestRoots() {
    return [
        process.env.QUEST_INTEGRATION_ROOT,
        resolve(repositoryRoot, '.cache/quest-integration'),
        resolve(repositoryRoot, '.worktrees/quest-standalone-test-suite'),
        resolve(repositoryRoot, 'js/quest-dev'),
    ].filter(Boolean);
}

function inspectQuestRoot(root) {
    if (!existsSync(resolve(root, 'main.js'))) return 'main.js is missing';

    try {
        const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
        if (head !== questLock.commit) return `HEAD is ${head}, expected ${questLock.commit}`;
    } catch (error) {
        return `Git revision could not be read: ${error.message}`;
    }

    const diff = spawnSync('git', ['-C', root, 'diff', '--quiet', 'HEAD', '--', ...questRuntimePaths]);
    if (diff.status !== 0) return 'pinned runtime files contain local changes';

    return null;
}

export function resolvePinnedQuestRoot() {
    const failures = [];
    for (const root of candidateQuestRoots()) {
        const failure = inspectQuestRoot(root);
        if (!failure) return root;
        failures.push(`${root}: ${failure}`);
    }

    throw new Error([
        `No clean Quest checkout at ${questLock.commit} is available.`,
        'Set QUEST_INTEGRATION_ROOT or check out episphere/quest-dev at the locked commit into .cache/quest-integration.',
        ...failures,
    ].join('\n'));
}

const contentType = (file) => ({
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
}[extname(file)] || 'text/plain');

function safeQuestFile(questRoot, relativePath) {
    const file = resolve(questRoot, relativePath);
    if (!file.startsWith(`${resolve(questRoot)}${sep}`) || !existsSync(file)) {
        throw new Error(`Unexpected Quest integration asset: ${relativePath}`);
    }
    return file;
}

function defaultHost(overrides = {}) {
    const now = new Date().toISOString();
    return {
        markdown: fixture,
        participant: {
            code: 200,
            data: {
                Connect_ID: 'QUEST-INTEGRATION',
                [fieldMapping.fName]: 'Integration',
            },
        },
        appSettings: {
            currentQuestVersion: 'legacy-not-under-test',
            currentQuest2Version: questLock.configuredVersion,
            quest2ModuleActivatedTimestamp: { Module1: '2020-01-01T00:00:00.000Z' },
        },
        modules: {},
        persistedData: {},
        retrieveMode: 'success',
        retrieveDelayMs: 0,
        storeMode: 'success',
        storeDelayMs: 0,
        calls: {
            getMyData: 0,
            appSettings: [],
            retrieve: [],
            moduleSHA: [],
            startSurvey: [],
            store: [],
            render: [],
            animation: [],
            errors: [],
            createdAt: now,
        },
        ...overrides,
    };
}

export async function openQuestIntegration(page, overrides = {}) {
    const questRoot = resolvePinnedQuestRoot();
    const requests = {
        questModules: [],
        questStyles: [],
        unexpectedExternal: [],
    };

    await page.addInitScript((hostFixture) => {
        window.__QUEST_CONNECT_HOST__ = hostFixture;
        window.localforage = {
            clear: async () => { window.__QUEST_CONNECT_HOST__.calls.localforageCleared = true; },
        };

        const record = (phase) => (event) => {
            if (!event.target?.closest?.('#questionnaireRoot')) return;
            window.__QUEST_CONNECT_HOST__.calls.events ||= [];
            window.__QUEST_CONNECT_HOST__.calls.events.push({
                type: event.type,
                key: event.key,
                phase,
                target: event.target.id || event.target.tagName,
                defaultPrevented: event.defaultPrevented,
            });
        };

        ['keydown', 'keyup', 'click', 'input', 'change', 'submit'].forEach((type) => {
            document.addEventListener(type, record('capture'), true);
            document.addEventListener(type, record('bubble'));
        });
    }, defaultHost(overrides));

    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());

        if (url.origin === 'http://localhost:5000') {
            if (url.pathname === '/js/shared.js') {
                await route.fulfill({ contentType: 'application/javascript', body: sharedStub });
                return;
            }
            if (url.pathname === '/js/pages/ssn.js') {
                await route.fulfill({ contentType: 'application/javascript', body: ssnStub });
                return;
            }
            await route.continue();
            return;
        }

        const questModule = url.href.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/episphere\/quest@v[^/]+\/(.+)$/);
        if (questModule) {
            const relativePath = decodeURIComponent(questModule[1]);
            const file = safeQuestFile(questRoot, relativePath);
            requests.questModules.push(url.href);
            let body = readFileSync(file);
            if (relativePath === 'main.js') {
                body = Buffer.concat([
                    body,
                    Buffer.from(`
const questIntegrationRender = transform.render;
transform.render = async (parameters, divID, previousResults = {}) => {
    window.__QUEST_CONNECT_HOST__.calls.render.push({
        activate: parameters.activate,
        lang: parameters.lang,
        questVersion: parameters.questVersion,
        showProgressBarInQuest: parameters.showProgressBarInQuest,
        hasStore: typeof parameters.store === 'function',
        hasRetrieve: typeof parameters.retrieve === 'function',
        divID,
        previousResults,
    });
    return questIntegrationRender(parameters, divID, previousResults);
};
`),
                ]);
            }
            await route.fulfill({ contentType: contentType(file), body });
            return;
        }

        if (url.href === 'https://cdn.jsdelivr.net/npm/mathjs@13.0.3/+esm') {
            await route.fulfill({
                contentType: 'application/javascript',
                body: [
                    'const { create, all } = globalThis.math;',
                    'export { create, all };',
                ].join('\n'),
            });
            return;
        }

        const questStyle = url.href.match(/^https:\/\/episphere\.github\.io\/quest-dev\/(ActiveLogic|Style1)\.css$/);
        if (questStyle) {
            const file = safeQuestFile(questRoot, `${questStyle[1]}.css`);
            requests.questStyles.push(url.href);
            await route.fulfill({ contentType: 'text/css', body: readFileSync(file) });
            return;
        }

        requests.unexpectedExternal.push(url.href);
        await route.abort('blockedbyclient');
    });

    await page.goto('/e2e/questIntegration/harness.html');
    await page.waitForFunction(() => window.__QUEST_CONNECT_READY__ || window.__QUEST_CONNECT_ERROR__);

    const renderError = await page.evaluate(() => window.__QUEST_CONNECT_ERROR__ || null);
    if (renderError) throw new Error(renderError);

    await page.waitForFunction(() => (
        document.querySelector('#questionnaireRoot form.question.active')
        || document.querySelector('#root [role="alert"]')
    ));

    const loaderFailure = await page.evaluate(() => {
        const alert = document.querySelector('#root [role="alert"]');
        const errors = window.__QUEST_CONNECT_HOST__?.calls?.errors || [];
        if (!alert && errors.length === 0) return null;
        return {
            alert: alert?.textContent?.trim() || '',
            errors,
        };
    });
    if (loaderFailure) {
        throw new Error(`ConnectApp could not load Quest:\n${JSON.stringify(loaderFailure, null, 2)}`);
    }

    return { questRoot, requests };
}

export const activeQuestion = (page, id) => page.locator(
    `#questionnaireRoot form.question.active${id ? `#${id}` : ''}`,
);

export const hostSnapshot = (page) => page.evaluate(() => structuredClone(window.__QUEST_CONNECT_HOST__));

export async function settleQuestFocus(page) {
    await page.waitForTimeout(550);
}
