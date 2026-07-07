// Health Care System Update tests forfunctions in dataAccess.js.
// hostname pinned non-localhost so the gitignored local-dev override can't leak in.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../js/shared.js', () => ({
    appState: { getState: () => ({ idToken: 'tok' }) },
    getIdToken: async () => 'tok',
    getApiBaseUrl: () => 'https://cf.test/app',
    getAppSettings: vi.fn(async () => ({ enableNPIRegistry: false })),
    translateText: (k) => k,
    allCountries: { 'United States': 1, 'United Kingdom': 2 }, // payload.js -> countryCid.js dependency
}));

let fetchStub;

const importDataAccess = async () => import('../js/pages/shareNewHealthInfo/dataAccess.js');

const jsonResponse = (data, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => data });

beforeEach(() => {
    vi.resetModules();
    fetchStub = vi.fn(async () => jsonResponse({ code: 200 }));
    vi.stubGlobal('fetch', fetchStub);
    vi.stubGlobal('location', { hostname: 'app.test' });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('submitSelfReportHCSUpdate', () => {
    it('POSTs the snapshot to storeSelfReportHCSUpdate (no action param) with a Bearer token', async () => {
        const { submitSelfReportHCSUpdate } = await importDataAccess();
        const res = await submitSelfReportHCSUpdate({ D_624974556: 'Sibley Memorial Hospital', D_353158944: '2025' });
        expect(res).toEqual({ code: 200 });
        const [url, options] = fetchStub.mock.calls[0];
        expect(url).toBe('https://cf.test/app?api=storeSelfReportHCSUpdate');
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(options.body)).toEqual({ D_624974556: 'Sibley Memorial Hospital', D_353158944: '2025' });
    });

    it('resolves { code: 0 } on network failure (never throws)', async () => {
        fetchStub.mockRejectedValue(new Error('offline'));
        const { submitSelfReportHCSUpdate } = await importDataAccess();
        expect((await submitSelfReportHCSUpdate({})).code).toBe(0);
    });

    it('passes a non-200 server envelope through for the section to inspect', async () => {
        fetchStub.mockResolvedValue(jsonResponse({ code: 400, message: 'Bad request' }));
        const { submitSelfReportHCSUpdate } = await importDataAccess();
        expect((await submitSelfReportHCSUpdate({})).code).toBe(400);
    });
});

describe('getMostRecentHCSUpdate', () => {
    const domesticRow = {
        D_892107008: '104430631',
        D_771921322: '353358909',
        D_624974556: 'SIBLEY MEMORIAL HOSPITAL',
        D_655907949: '5255 Loughboro Rd NW',
        D_973363047: 'Washington',
        D_783801971: 'District of Columbia',
        D_734087990: '20016',
        D_994200497: '615680906', // November
        D_353158944: '2025',
        D_223569179: '2025-11-20T15:21:26.763Z',
    };

    it('GETs getSelfReportHCSUpdate and parses the LAST submitted row (server sorts ascending)', async () => {
        fetchStub.mockResolvedValue(jsonResponse({
            data: { submitted: [{ ...domesticRow, D_624974556: 'Older Facility' }, domesticRow] },
            code: 200,
        }));
        const { getMostRecentHCSUpdate } = await importDataAccess();
        const latest = await getMostRecentHCSUpdate();
        expect(fetchStub.mock.calls[0][0]).toBe('https://cf.test/app?api=getSelfReportHCSUpdate');
        expect(latest.line1).toBe('SIBLEY MEMORIAL HOSPITAL'); // case preserved
        expect(latest.stateOrRegion).toBe('District of Columbia');
        expect(latest.isInternational).toBe(false);
        expect(latest.changeMonthCode).toBe(10);
        expect(latest.changeYear).toBe('2025');
        expect(latest.submittedTimestamp).toBe('2025-11-20T15:21:26.763Z');
    });

    it('returns null when the participant has never submitted an update', async () => {
        fetchStub.mockResolvedValue(jsonResponse({ data: { submitted: [] }, code: 200 }));
        const { getMostRecentHCSUpdate } = await importDataAccess();
        expect(await getMostRecentHCSUpdate()).toBeNull();
    });

    it('throws on a non-OK response so the section can render its load-error state', async () => {
        fetchStub.mockResolvedValue(jsonResponse({}, false));
        const { getMostRecentHCSUpdate } = await importDataAccess();
        await expect(getMostRecentHCSUpdate()).rejects.toThrow(/500/);
    });

    it('throws on a network failure (distinct from the never-updated null)', async () => {
        fetchStub.mockRejectedValue(new Error('offline'));
        const { getMostRecentHCSUpdate } = await importDataAccess();
        await expect(getMostRecentHCSUpdate()).rejects.toThrow('offline');
    });
});
