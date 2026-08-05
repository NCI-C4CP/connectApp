const host = () => window.__QUEST_CONNECT_HOST__;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const fetchDataWithRetry = async (operation) => operation();

export const getMyData = async () => {
    host().calls.getMyData += 1;
    return host().participant;
};

export const hasUserData = (response) => Boolean(response?.data);

export const getAppSettings = async (requestedSettings) => {
    host().calls.appSettings.push([...requestedSettings]);
    return host().appSettings;
};

export const getMySurveys = async (conceptIds, isRetrieve = false) => {
    host().calls.retrieve.push({ conceptIds: [...conceptIds], isRetrieve });
    if (!isRetrieve) return { code: 200, data: host().modules };

    if (host().retrieveDelayMs) await wait(host().retrieveDelayMs);
    if (host().retrieveMode === 'reject') throw new Error('Synthetic Connect retrieve failure');

    return {
        code: host().retrieveMode === 'non-200' ? 503 : 200,
        data: { D_726699695_V2: host().persistedData },
    };
};

export const getModuleSHA = async (path) => {
    host().calls.moduleSHA.push(path);
    return 'quest-integration-fixture';
};

export const updateStartSurveyParticipantData = async (sha, path, connectId, moduleId) => {
    host().calls.startSurvey.push({ sha, path, connectId, moduleId });
    return host().markdown;
};

export const getModuleText = async () => ({ moduleText: host().markdown });
export const getShaFromGitHubCommitData = async () => ['quest-integration-fixture', 'test'];

export const questionnaireModules = () => ({
    'Quest integration contract': {
        path: {
            en: 'test/quest-integration.txt',
            es: 'test/quest-integration-spanish.txt',
        },
        moduleId: 'Module1',
        enabled: true,
    },
});

export const storeResponseQuest = async (changes) => {
    host().calls.store.push(structuredClone(changes));
    if (host().storeDelayMs) await wait(host().storeDelayMs);
    if (host().storeMode === 'reject') throw new Error('Synthetic Connect store failure');
    return { code: host().storeMode === 'non-200' ? 503 : 200 };
};

export const storeResponse = storeResponseQuest;
export const storeResponseTree = storeResponseQuest;

export const showAnimation = () => { host().calls.animation.push('show'); };
export const hideAnimation = () => { host().calls.animation.push('hide'); };

export const logDDRumError = (error, type, context) => {
    host().calls.errors.push({
        message: String(error?.message || error),
        type,
        context: structuredClone(context || {}),
    });
};

export const translateHTML = (content) => content;
export const translateText = (key) => key;
export const getSelectedLanguage = () => 163149180;
