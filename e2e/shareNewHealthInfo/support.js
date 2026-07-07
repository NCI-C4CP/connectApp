// Shared E2E setup: serves the feature with shared.js + dataAccess.js stubbed via page.route,
// injects a participant fixture, and navigates to the harness.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fieldMapping from '../../js/fieldToConceptIdMapping.js';

const here = dirname(fileURLToPath(import.meta.url));
const sharedStub = readFileSync(join(here, 'stubs/shared.stub.js'), 'utf8');
const dataAccessStub = readFileSync(join(here, 'stubs/dataAccess.stub.js'), 'utf8');

export const F = fieldMapping;
export const m = fieldMapping.selfReportCancerDx;

// Quest-flat payload helpers (mirror payload.js key helpers — payload.js itself cannot be imported
// here: it transitively pulls js/shared.js, whose module scope needs browser globals).
export const dk = (cid, ...idx) => ['D_' + cid, ...idx].join('_');
export const ndk = (parentCid, childCid, ...idx) => ['D_' + parentCid, 'D_' + childCid, ...idx].join('_');
export const txdk = (parentCid, childCid, position) => ndk(parentCid, childCid, position, position);
export const Y = String(fieldMapping.yes);
export const N = String(fieldMapping.no);

export const verified = { code: 200, data: { [F.verification]: F.verified, [F.consentWithdrawn]: F.no, [F.healthcareProvider]: 1, Connect_ID: 'E2E' } };
export const withdrawn = { code: 200, data: { [F.verification]: F.verified, [F.consentWithdrawn]: F.yes, Connect_ID: 'E2E' } };
export const deceased = { code: 200, data: { [F.verification]: F.verified, [F.consentWithdrawn]: F.no, [F.participantDeceased]: F.yes, Connect_ID: 'E2E' } };

export const setup = async (page, { fixture = verified, prior = [], dataAccessBody = dataAccessStub, i18n = null, enableNPIRegistry = false, hcsLatest = null } = {}) => {
    await page.route('**/js/shared.js', (route) =>
        route.fulfill({ contentType: 'application/javascript', body: sharedStub }));
    await page.route('**/js/pages/shareNewHealthInfo/dataAccess.js', (route) =>
        route.fulfill({ contentType: 'application/javascript', body: dataAccessBody }));
    await page.addInitScript(([f, p, dict, npiEnabled, hcsRow]) => {
        window.__SRCDX_FIXTURE__ = f;
        window.__SRCDX_PRIOR__ = p;
        window.__SRCDX_ENABLE_NPI_REGISTRY__ = npiEnabled === true;
        if (hcsRow) window.__HCS_LATEST__ = hcsRow; // parsed display row for the HCS section
        if (dict) window.__I18N__ = dict; // when provided, the stub translateHTML resolves real labels
    }, [fixture, prior, i18n, enableNPIRegistry, hcsLatest]);
    await page.goto('/e2e/shareNewHealthInfo/harness.html');
};

export const getPayload = (page) => page.evaluate(() => window.__SRCDX_LAST_PAYLOAD__);

// Convenience step helpers used across specs.
export const startDiagnosis = (page) => page.click('#srcdxAddDiagnosis');

// Shared drive helpers. The process walk lives in one place; specs compose these.

/** Landing -> Q1 (site) -> Q2 (year) -> lands on Q3. */
export const toTreatmentGate = async (page, { site = 'prostate', dxYear = '2020' } = {}) => {
    await page.click('#srcdxAddDiagnosis');
    await page.check(`#site_${site}`);
    await page.click('#srcdxNext');
    await page.fill('#srcdxDxYear', dxYear);
    await page.click('#srcdxNext');
};

/** ...answer Q3 Yes + select types -> lands on the first treatment detail. */
export const toTreatmentDetail = async (page, { site, dxYear, types = ['chemo'] } = {}) => {
    await toTreatmentGate(page, { site, dxYear });
    await page.check('#txReceivedYes');
    for (const t of types) await page.check(`#tx_${t}`);
    await page.click('#srcdxNext');
};

/** ...fill each detail's start year -> lands on the Treatment Summary. */
export const toTreatmentSummary = async (page, { site, dxYear, types = ['chemo'], years = ['2021'] } = {}) => {
    await toTreatmentDetail(page, { site, dxYear, types });
    for (const y of years) {
        await page.fill('#srcdxTxStartYr', y);
        await page.click('#srcdxNext');
    }
};
