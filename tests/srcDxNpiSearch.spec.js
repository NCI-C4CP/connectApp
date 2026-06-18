// searchNPIProviders transport tests (dataAccess.js). The function backs a typeahead, so its
// contract is absolute: never rejects, resolves [] on any failure. Module state (the cached
// api base) means every test re-imports a fresh module via vi.resetModules() + dynamic import.
// location.hostname is pinned per test (vi.stubGlobal): the suite must not depend on the
// machine. local-dev/config.js exists (with real overrides) on dev machines but not in CI,
// so every localhost-path test also mocks that module.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mutable knobs read lazily by the hoisted mock factory (re-evaluated per import).
let stateToken = '';
let tokenValue = 'tok';
let baseValue = 'https://cf.test/app';
let baseCalls = 0;

vi.mock('../js/shared.js', () => ({
    appState: { getState: () => ({ idToken: stateToken }) },
    getIdToken: async () => tokenValue,
    getApiBaseUrl: () => { baseCalls += 1; return baseValue; },
    getAppSettings: vi.fn(async () => ({ enableNPIRegistry: false })),
}));

const okResponse = (data) => ({ ok: true, status: 200, json: async () => data });
const providers = [{ npi: '1234567890', firstName: 'MAYA', lastName: 'SANTOS', credential: 'M.D.', specialty: 'Medical Oncology', city: 'BETHESDA', state: 'MD' }];

let fetchStub;

const importSearch = async () =>
    (await import('../js/pages/shareNewHealthInfo/dataAccess.js')).searchNPIProviders;

beforeEach(() => {
    vi.resetModules();
    stateToken = '';
    tokenValue = 'tok';
    baseValue = 'https://cf.test/app';
    baseCalls = 0;
    fetchStub = vi.fn(async () => okResponse({ data: providers, code: 200 }));
    vi.stubGlobal('fetch', fetchStub);
    vi.stubGlobal('location', { hostname: 'app.test' }); // non-localhost default
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('../local-dev/config.js');
});

describe('searchNPIProviders', () => {
    it('calls the api with lastName/firstName params and a Bearer token, returning the data array', async () => {
        const search = await importSearch();
        const result = await search({ firstName: 'Maya', lastName: 'Santos' });
        expect(result).toEqual(providers);
        const [url, options] = fetchStub.mock.calls[0];
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname).toBe('https://cf.test/app');
        expect(parsed.searchParams.get('api')).toBe('searchNPIRegistry');
        expect(parsed.searchParams.get('lastName')).toBe('Santos');
        expect(parsed.searchParams.get('firstName')).toBe('Maya');
        expect(options.headers.Authorization).toBe('Bearer tok');
    });

    it('omits the firstName param when blank', async () => {
        const search = await importSearch();
        await search({ firstName: '   ', lastName: 'Santos' });
        expect(new URL(fetchStub.mock.calls[0][0]).searchParams.has('firstName')).toBe(false);
    });

    it('prefers the appState token over an auth round-trip', async () => {
        stateToken = 'state-tok';
        const search = await importSearch();
        await search({ lastName: 'Santos' });
        expect(fetchStub.mock.calls[0][1].headers.Authorization).toBe('Bearer state-tok');
    });

    it('short-circuits to [] without fetching when lastName is under 2 chars', async () => {
        const search = await importSearch();
        expect(await search({ lastName: 'S' })).toEqual([]);
        expect(await search({ lastName: '' })).toEqual([]);
        expect(await search()).toEqual([]);
        expect(fetchStub).not.toHaveBeenCalled();
    });

    it('resolves [] without fetching when no token is available', async () => {
        tokenValue = null;
        const search = await importSearch();
        expect(await search({ lastName: 'Santos' })).toEqual([]);
        expect(fetchStub).not.toHaveBeenCalled();
    });

    it('resolves [] on a non-OK response', async () => {
        fetchStub.mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
        const search = await importSearch();
        expect(await search({ lastName: 'Santos' })).toEqual([]);
    });

    it('resolves [] on a network failure', async () => {
        fetchStub.mockRejectedValue(new Error('offline'));
        const search = await importSearch();
        expect(await search({ lastName: 'Santos' })).toEqual([]);
    });

    it('resolves [] when the body is not JSON', async () => {
        fetchStub.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } });
        const search = await importSearch();
        expect(await search({ lastName: 'Santos' })).toEqual([]);
    });

    it('resolves [] when data is not an array', async () => {
        fetchStub.mockResolvedValue(okResponse({ data: { nope: true }, code: 200 }));
        const search = await importSearch();
        expect(await search({ lastName: 'Santos' })).toEqual([]);
    });

    it('resolves [] (never rejects) when the fetch aborts', async () => {
        fetchStub.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        const search = await importSearch();
        await expect(search({ lastName: 'Santos' })).resolves.toEqual([]);
    });

    it('passes the caller-provided AbortSignal through to fetch', async () => {
        const controller = new AbortController();
        const search = await importSearch();
        await search({ lastName: 'Santos' }, { signal: controller.signal });
        expect(fetchStub.mock.calls[0][1].signal).toBe(controller.signal);
    });

    it('resolves the base once and caches it across calls', async () => {
        const search = await importSearch();
        await search({ lastName: 'Santos' });
        await search({ lastName: 'Santoso' });
        expect(baseCalls).toBe(1);
    });
});

describe('searchNPIProviders — localhost api base override', () => {
    const EMULATOR = 'http://localhost:5001/nih-nci-dceg-connect-dev/us-central1/app';

    beforeEach(() => {
        vi.stubGlobal('location', { hostname: 'localhost' });
    });

    it('uses apiBaseOverride from local-dev/config.js on localhost', async () => {
        vi.doMock('../local-dev/config.js', () => ({ apiBaseOverride: EMULATOR }));
        const search = await importSearch();
        await search({ lastName: 'Santos' });
        expect(fetchStub.mock.calls[0][0].startsWith(`${EMULATOR}?`)).toBe(true);
        expect(baseCalls).toBe(0);
    });

    it('falls back to the deployed base when the config has no override', async () => {
        vi.doMock('../local-dev/config.js', () => ({}));
        const search = await importSearch();
        await search({ lastName: 'Santos' });
        expect(fetchStub.mock.calls[0][0].startsWith('https://cf.test/app?')).toBe(true);
    });

    it('falls back to the deployed base when the config module is absent (CI)', async () => {
        vi.doMock('../local-dev/config.js', () => { throw new Error('not found'); });
        const search = await importSearch();
        await search({ lastName: 'Santos' });
        expect(fetchStub.mock.calls[0][0].startsWith('https://cf.test/app?')).toBe(true);
    });

    it('never reads the override off localhost', async () => {
        vi.stubGlobal('location', { hostname: 'myconnect.cancer.gov' });
        vi.doMock('../local-dev/config.js', () => ({ apiBaseOverride: EMULATOR }));
        const search = await importSearch();
        await search({ lastName: 'Santos' });
        expect(fetchStub.mock.calls[0][0].startsWith('https://cf.test/app?')).toBe(true);
    });
});
