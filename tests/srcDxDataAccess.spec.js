// Server-backed transport tests (dataAccess.js): per-screen save, submit, server resume, and
// the previously-reported mapping. Module-level caching (api base) means each test re-imports
// a fresh module (vi.resetModules + dynamic import), and the hostname is pinned non-localhost
// so the gitignored local-dev override can't leak into the suite.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../js/shared.js', () => ({
    appState: { getState: () => ({ idToken: 'tok' }) },
    getIdToken: async () => 'tok',
    getApiBaseUrl: () => 'https://cf.test/app',
    getAppSettings: vi.fn(async () => ({ enableNPIRegistry: false })),
    translateText: (k) => k, // labels assert on the i18n KEY
    allCountries: { 'United States': 1, 'United Kingdom': 2 }, // payload.js -> countryCid.js dependency
}));

import { getAppSettings } from '../js/shared.js';

let fetchStub;

const importDataAccess = async () => import('../js/pages/shareNewHealthInfo/dataAccess.js');

const jsonResponse = (data, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => data });

beforeEach(() => {
    vi.resetModules();
    fetchStub = vi.fn(async () => jsonResponse({ code: 200 }));
    vi.stubGlobal('fetch', fetchStub);
    vi.stubGlobal('location', { hostname: 'app.test' });
    vi.mocked(getAppSettings).mockReset().mockResolvedValue({ enableNPIRegistry: false });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('saveCancerDxProgress', () => {
    it('POSTs the snapshot to storeSelfReportCancerDx?action=save with a Bearer token', async () => {
        const { saveCancerDxProgress } = await importDataAccess();
        const res = await saveCancerDxProgress({ D_181737942: '847945207', stateJSON: '{}' });
        expect(res).toEqual({ code: 200 });
        const [url, options] = fetchStub.mock.calls[0];
        expect(url).toBe('https://cf.test/app?api=storeSelfReportCancerDx&action=save');
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(options.body)).toEqual({ D_181737942: '847945207', stateJSON: '{}' });
    });

    it('resolves { code: 0 } on network failure (never throws)', async () => {
        fetchStub.mockRejectedValue(new Error('offline'));
        const { saveCancerDxProgress } = await importDataAccess();
        const res = await saveCancerDxProgress({});
        expect(res.code).toBe(0);
    });

    it('passes a non-200 server envelope through for the caller to inspect', async () => {
        fetchStub.mockResolvedValue(jsonResponse({ code: 400, message: 'Bad request' }));
        const { saveCancerDxProgress } = await importDataAccess();
        expect((await saveCancerDxProgress({})).code).toBe(400);
    });
});

describe('submitSelfReportCancerDx', () => {
    it('POSTs the same snapshot shape to storeSelfReportCancerDx?action=submit', async () => {
        const { submitSelfReportCancerDx } = await importDataAccess();
        await submitSelfReportCancerDx({ D_181737942: '847945207' });
        expect(fetchStub.mock.calls[0][0]).toBe('https://cf.test/app?api=storeSelfReportCancerDx&action=submit');
        expect(fetchStub.mock.calls[0][1].method).toBe('POST');
    });
});

describe('loadCancerDxProgress (server resume)', () => {
    const inProgressDoc = (over = {}) => ({
        stateJSON: JSON.stringify({ state: { primarySite: 'breast' } }),
        positionJSON: JSON.stringify({ screenId: 'diagnosisDate', history: ['landing'] }),
        ...over,
    });

    it('parses the in-progress row into { state, position }', async () => {
        fetchStub.mockResolvedValue(jsonResponse({ data: { inProgress: inProgressDoc(), submitted: [] }, code: 200 }));
        const { loadCancerDxProgress } = await importDataAccess();
        const saved = await loadCancerDxProgress();
        expect(saved.state.primarySite).toBe('breast');
        expect(saved.position.screenId).toBe('diagnosisDate');
        expect(fetchStub.mock.calls[0][0]).toBe('https://cf.test/app?api=getSelfReportCancerDx');
    });

    it.each([
        ['no in-progress row', { inProgress: null, submitted: [] }],
        ['corrupt stateJSON', { inProgress: inProgressDoc({ stateJSON: 'not json' }), submitted: [] }],
        ['missing positionJSON', { inProgress: { stateJSON: '{"state":{}}' }, submitted: [] }],
    ])('returns null on %s', async (_label, data) => {
        fetchStub.mockResolvedValue(jsonResponse({ data, code: 200 }));
        const { loadCancerDxProgress } = await importDataAccess();
        expect(await loadCancerDxProgress()).toBeNull();
    });

    it('rejects when the read itself fails', async () => {
        fetchStub.mockRejectedValue(new Error('offline'));
        const { loadCancerDxProgress } = await importDataAccess();
        await expect(loadCancerDxProgress()).rejects.toThrow('offline');
    });

    it('rejects when the server read is not ok', async () => {
        fetchStub.mockResolvedValue(jsonResponse({ code: 500 }, false));
        const { loadCancerDxProgress } = await importDataAccess();
        await expect(loadCancerDxProgress()).rejects.toThrow('Unable to load self-report cancer diagnosis rows');
    });
});

describe('getPreviouslyReportedDx', () => {
    it('maps submitted rows to { location (i18n site label), dxDate MM/YYYY or YYYY }', async () => {
        fetchStub.mockResolvedValue(jsonResponse({
            data: {
                inProgress: null,
                submitted: [
                    { D_181737942: '847945207', D_299768751: '615680906', D_908235757: '2024' }, // breast, Nov
                    { D_181737942: '295976386', D_908235757: '2021' },                            // prostate, year only
                ],
            },
            code: 200,
        }));
        const { getPreviouslyReportedDx } = await importDataAccess();
        expect(await getPreviouslyReportedDx()).toEqual([
            { location: 'shareHealthInfo.site_breast', dxDate: '11/2024' },
            { location: 'shareHealthInfo.site_prostate', dxDate: '2021' },
        ]);
    });

    it('returns [] on any failure (the landing must always render)', async () => {
        fetchStub.mockRejectedValue(new Error('offline'));
        const { getPreviouslyReportedDx } = await importDataAccess();
        expect(await getPreviouslyReportedDx()).toEqual([]);
    });
});

describe('loadShareHealthInfoSettings', () => {
    it('enables NPI registry only for strict boolean true', async () => {
        vi.mocked(getAppSettings).mockResolvedValue({ enableNPIRegistry: true });
        const { loadShareHealthInfoSettings } = await importDataAccess();
        expect(await loadShareHealthInfoSettings()).toEqual({ enableNPIRegistry: true });
        expect(getAppSettings).toHaveBeenCalledWith(['enableNPIRegistry']);
    });

    it.each([
        ['false', { enableNPIRegistry: false }],
        ['missing', {}],
        ['string true', { enableNPIRegistry: 'true' }],
    ])('keeps NPI registry disabled for %s', async (_label, settings) => {
        vi.mocked(getAppSettings).mockResolvedValue(settings);
        const { loadShareHealthInfoSettings } = await importDataAccess();
        expect(await loadShareHealthInfoSettings()).toEqual({ enableNPIRegistry: false });
    });

    it('defaults NPI registry off if appSettings cannot be loaded', async () => {
        vi.mocked(getAppSettings).mockRejectedValue(new Error('down'));
        const { loadShareHealthInfoSettings } = await importDataAccess();
        expect(await loadShareHealthInfoSettings()).toEqual({ enableNPIRegistry: false });
    });
});
