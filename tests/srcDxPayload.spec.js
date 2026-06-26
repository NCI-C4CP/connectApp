// Quest-flat payload contract tests. The golden test pins the exact written object for a
// maximal diagnosis with literal keys (never mapping-derived). A mapping typo cannot
// self-confirm. Conventions under test (per the data dictionary + analytics decisions):
//   - D_<questionCid> keys; every D_ value a string (response CIDs, years, text)
//   - nested detail keys are parented by the selected treatment/screening option CID:
//     D_<parentCid>_D_<childCid>; repeatable treatment physician/facility rows add _<counter>
//   - months emitted as month response cids; countries as dictionary country cids
//   - merged dictionary variables: facility state/region -> one cid, zip/postal -> one cid
//   - server-owned fields (DxNumber, site DxDt, identity) are never client-emitted

import { describe, it, expect, vi } from 'vitest';

vi.mock('../js/shared.js', () => ({
    allCountries: { 'United States': 1, 'United Kingdom': 2, Canada: 3 },
}));

import fieldMapping from '../js/fieldToConceptIdMapping.js';
import {
    buildDiagnosisPayload, buildProgressSnapshot, dKey, nestedDKey, appendDiagnosis,
} from '../js/pages/shareNewHealthInfo/payload.js';

const m = fieldMapping.selfReportCancerDx;

const emptyFacility = {
    line1: '', line2: '', line3: '', line4: '', city: '', state: '', region: '', zip: '', postal: '',
    isInternational: false, country: '',
};

const goldenState = {
    primarySite: 'breast',
    primarySiteOther: '',
    dxMonth: 10, // November
    dxYear: '2024',
    txReceived: true,
    treatments: [
        {
            type: 'chemo', otherDescribe: '',
            startMonth: 4, startYear: '2023', endMonth: '', endYear: '', ongoing: true,
            physicians: [
                { firstName: 'Maya', lastName: 'Santos', npi: '1234567890' }, // npi NOT emitted while its cid is TODO
                { firstName: 'Jon', lastName: 'Santoso', npi: '' },
            ],
            facilities: [
                { ...emptyFacility, line1: 'Sibley Memorial Hospital', line2: '5255 Loughboro Rd NW', city: 'Washington', state: 'District of Columbia', zip: '20016' },
                { ...emptyFacility, line1: 'Royal Marsden', line2: '203 Fulham Rd', line4: 'Building B, Chelsea', city: 'London', region: 'Greater London', postal: 'SW3 6JJ', isInternational: true, country: '2' },
            ],
        },
        {
            type: 'surgery', otherDescribe: '',
            startMonth: 0, startYear: '2024', endMonth: 1, endYear: '2024', ongoing: false,
            physicians: [{ firstName: '', lastName: '', npi: '' }], // seeded empty row -> no keys
            facilities: [{ ...emptyFacility }],                     // seeded empty facility -> no keys
        },
    ],
    screeningDetected: true,
    screenings: [
        {
            type: 'breast2D', month: 3, year: '2017',
            physician: { firstName: 'Grace', lastName: 'Hopper', npi: '' },
            facility: { ...emptyFacility, line1: 'Imaging Center', line2: '1 Scan Way', city: 'Bethesda', state: 'Maryland', zip: '20814' },
        },
        {
            type: 'breastMRI', month: '', year: '2018',
            physician: { firstName: '', lastName: '', npi: '' },
            facility: { ...emptyFacility },
        },
    ],
};

// The contract, key by key. Detail keys are parented by the selected treatment/screening option CID.
const goldenPayload = {
    D_181737942: '847945207',     // primary site = Breast
    D_299768751: '615680906',     // dx month = November (response cid)
    D_908235757: '2024',          // dx year
    D_874288004: '353358909',     // treatment received = Yes
    D_244216107: '353358909',     // chemo selected
    D_293873603: '353358909',     // surgery selected
    D_555019890: '104430631',     // radiation shown-unchecked -> explicit No
    D_459406752: '104430631',     // other shown-unchecked -> explicit No
    // --- Treatment parent = chemo (244216107) ---
    D_244216107_D_742710886: '526483288', // start month = May
    D_244216107_D_281136649: '2023',
    D_244216107_D_735592270: '353358909', // ongoing = Yes (XOR: no end keys)
    D_244216107_D_964819753_1: 'Maya', D_244216107_D_740626474_1: 'Santos',
    D_244216107_D_964819753_2: 'Jon', D_244216107_D_740626474_2: 'Santoso',
    D_244216107_D_539812906_1: '104430631', // facility 1: domestic
    D_244216107_D_165350319_1: 'Sibley Memorial Hospital',
    D_244216107_D_456014563_1: '5255 Loughboro Rd NW',
    D_244216107_D_493041638_1: 'Washington',
    D_244216107_D_215797578_1: 'District of Columbia', // merged state/region <- state
    D_244216107_D_385095107_1: '20016',                // merged zip/postal <- zip
    D_244216107_D_539812906_2: '353358909', // facility 2: international
    D_244216107_D_165350319_2: 'Royal Marsden',
    D_244216107_D_456014563_2: '203 Fulham Rd',
    D_244216107_D_460490909_2: 'Building B, Chelsea',  // line4 = international-only
    D_244216107_D_493041638_2: 'London',
    D_244216107_D_215797578_2: 'Greater London',       // merged state/region <- region
    D_244216107_D_385095107_2: 'SW3 6JJ',              // merged zip/postal <- postal
    D_244216107_D_785016438_2: '156628245',            // country: select value '2' -> UK response cid
    // --- Treatment parent = surgery (293873603) ---
    D_293873603_D_742710886: '286592124', // start month = January
    D_293873603_D_281136649: '2024',
    D_293873603_D_735592270: '104430631', // ongoing = No
    D_293873603_D_625530863: '802747980', // end month = February
    D_293873603_D_729162012: '2024',
    // --- screening (breast site) ---
    D_944065539: '353358909',     // detected = Yes
    D_425815239: '353358909',     // 2D/3D mammogram chosen
    D_759642936: '104430631',     // CEM shown-unchecked -> No
    D_528508094: '353358909',     // MRI chosen
    D_502929020: '104430631',     // US -> No
    D_412252588: '104430631',     // CBE -> No
    // --- Screening parent = breast2D (425815239) ---
    D_425815239_D_853862770: '463502254', // screening month = April
    D_425815239_D_858052564: '2017',
    D_425815239_D_239126548: 'Grace', D_425815239_D_130343311: 'Hopper',
    D_425815239_D_501859375: '104430631', // facility: domestic
    D_425815239_D_977505777: 'Imaging Center',
    D_425815239_D_632951008: '1 Scan Way',
    D_425815239_D_591687168: 'Bethesda',
    D_425815239_D_513329248: 'Maryland',
    D_425815239_D_404892571: '20814',
    // --- Screening parent = breastMRI (528508094), sparse: year only ---
    D_528508094_D_858052564: '2018',
};

describe('buildDiagnosisPayload — golden contract', () => {
    it('emits EXACTLY the dictionary-keyed Quest-flat object for a maximal diagnosis', () => {
        expect(buildDiagnosisPayload(goldenState)).toEqual(goldenPayload);
    });

    it('every emitted value is a string', () => {
        for (const [k, v] of Object.entries(buildDiagnosisPayload(goldenState))) {
            expect(typeof v, k).toBe('string');
        }
    });

    it('never emits server-owned keys (DxNumber, site DxDt, identity)', () => {
        const p = buildDiagnosisPayload(goldenState);
        expect(dKey(m.dxNumber) in p).toBe(false);
        for (const cid of Object.values(m.dxSubmittedTimestamps)) expect(dKey(cid) in p).toBe(false);
        for (const k of ['uid', 'token', 'Connect_ID']) {
            expect(k in p).toBe(false);
        }
    });
});

describe('buildDiagnosisPayload — sections & gating', () => {
    it('maps all 12 internal month codes to their response cids', () => {
        const expected = ['286592124', '802747980', '676299940', '463502254', '526483288', '842005720',
            '574954852', '887495026', '181090983', '259643910', '615680906', '840678879'];
        expected.forEach((cid, code) => {
            const p = buildDiagnosisPayload({ primarySite: 'prostate', dxMonth: code, dxYear: '2020' });
            expect(p.D_299768751).toBe(cid);
        });
        expect('D_299768751' in buildDiagnosisPayload({ primarySite: 'prostate', dxMonth: '', dxYear: '2020' })).toBe(false);
    });

    it('includes the Other write-in only when site is "other" (FLAT key)', () => {
        const p = buildDiagnosisPayload({ primarySite: 'other', primarySiteOther: 'Gallbladder', dxYear: '2021' });
        expect(p.D_181737942).toBe('807835037');
        expect(p.D_546976551).toBe('Gallbladder');
        const emptyOther = buildDiagnosisPayload({ primarySite: 'other', primarySiteOther: '', dxYear: '2021' });
        expect(emptyOther.D_181737942).toBe('807835037');
        expect(emptyOther.D_546976551).toBeUndefined();
        expect('D_546976551' in buildDiagnosisPayload({ primarySite: 'breast', primarySiteOther: 'ignored', dxYear: '2021' })).toBe(false);
    });

    it('omits ALL treatment-section keys when txReceived is false or unanswered', () => {
        const no = buildDiagnosisPayload({ primarySite: 'prostate', dxYear: '2020', txReceived: false, treatments: [{ type: 'chemo', startYear: '2021' }] });
        expect(no.D_874288004).toBe('104430631');
        expect('D_244216107' in no).toBe(false);          // no type flags
        expect(nestedDKey(m.treatment.chemo, m.treatment.startYear) in no).toBe(false); // no nested keys
        const unanswered = buildDiagnosisPayload({ primarySite: 'prostate', dxYear: '2020' });
        expect('D_874288004' in unanswered).toBe(false);
    });

    it('emits explicit No treatment type flags but no loop rows when Q3 is Yes and no optional type is selected', () => {
        const p = buildDiagnosisPayload({ primarySite: 'prostate', dxYear: '2020', txReceived: true, treatments: [] });
        expect(p[dKey(m.txReceived)]).toBe(String(fieldMapping.yes));
        expect(p[dKey(m.treatment.chemo)]).toBe(String(fieldMapping.no));
        expect(p[dKey(m.treatment.surgery)]).toBe(String(fieldMapping.no));
        expect(p[dKey(m.treatment.radiation)]).toBe(String(fieldMapping.no));
        expect(p[dKey(m.treatment.other)]).toBe(String(fieldMapping.no));
        expect(nestedDKey(m.treatment.chemo, m.treatment.startYear) in p).toBe(false);
    });

    it('emits the FLAT treatment other-describe only when the Other type is selected', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [{ type: 'other', otherDescribe: 'Immunotherapy', startYear: '2024', ongoing: true }],
        });
        expect(p.D_459406752).toBe('353358909');
        expect(p.D_420392069).toBe('Immunotherapy');      // flat — no loop suffix
        expect(p.D_459406752_D_281136649).toBe('2024');

        const emptyOther = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [{ type: 'other', otherDescribe: '', startYear: '2024', ongoing: true }],
        });
        expect(emptyOther.D_459406752).toBe('353358909');
        expect(emptyOther.D_420392069).toBeUndefined();
        expect(emptyOther.D_459406752_D_281136649).toBe('2024');
    });

    it('parents treatment details by treatment type regardless of state array order', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [
                { type: 'radiation', startYear: '2022', ongoing: true },
                { type: 'chemo', startYear: '2021', ongoing: true },
            ],
        });
        expect(p.D_244216107_D_281136649).toBe('2021'); // chemo parent
        expect(p.D_555019890_D_281136649).toBe('2022'); // radiation parent
    });

    it('compacts physician and facility loop indexes after a middle entry is removed', () => {
        const remainingPhysicians = [
            { firstName: 'Ada', lastName: 'Lovelace', npi: '' },
            { firstName: 'Grace', lastName: 'Hopper', npi: '' },
            { firstName: 'Katherine', lastName: 'Johnson', npi: '' },
        ];
        const remainingFacilities = [
            { ...emptyFacility, line1: 'Facility A' },
            { ...emptyFacility, line1: 'Facility B' },
            { ...emptyFacility, line1: 'Facility C' },
        ];
        remainingPhysicians.splice(1, 1);
        remainingFacilities.splice(1, 1);

        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [{
                type: 'chemo', startYear: '2021', ongoing: true,
                physicians: remainingPhysicians,
                facilities: remainingFacilities,
            }],
        });

        expect(p[nestedDKey(m.treatment.chemo, m.treatment.physFirstName, 1)]).toBe('Ada');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.physFirstName, 2)]).toBe('Katherine');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.physFirstName, 3)]).toBeUndefined();
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.facility.line1, 1)]).toBe('Facility A');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.facility.line1, 2)]).toBe('Facility C');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.facility.line1, 3)]).toBeUndefined();
    });

    it('compacts non-empty physician and facility rows before assigning counters', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [{
                type: 'chemo', startYear: '2021', ongoing: true,
                physicians: [
                    { firstName: '', lastName: '', npi: '' },
                    { firstName: 'Maya', lastName: 'Santos', npi: '' },
                ],
                facilities: [
                    { ...emptyFacility },
                    { ...emptyFacility, line1: 'Hospital B' },
                ],
            }],
        });

        expect(p[nestedDKey(m.treatment.chemo, m.treatment.physFirstName, 1)]).toBe('Maya');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.physLastName, 1)]).toBe('Santos');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.physFirstName, 2)]).toBeUndefined();
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.facility.line1, 1)]).toBe('Hospital B');
        expect(p[nestedDKey(m.treatment.chemo, m.treatment.facility.line1, 2)]).toBeUndefined();
    });

    it('omits screening entirely for non-eligible sites, even with stale screening state', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', screeningDetected: true,
            screenings: [{ type: 'breast2D', year: '2019' }],
        });
        expect('D_944065539' in p).toBe(false);
        expect('D_425815239' in p).toBe(false);
        expect(nestedDKey(m.screening.optionValues.breast2D, m.screening.year) in p).toBe(false);
    });

    it('drops wrong-site screenings but keeps right-site ones (site changed mid-flow)', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'colon', dxYear: '2020', screeningDetected: true,
            screenings: [{ type: 'breast2D', year: '2019' }, { type: 'colonCol', year: '2018' }],
        });
        expect('D_425815239' in p).toBe(false);           // breast option flag never emitted for colon
        expect(p.D_122234136).toBe('353358909');          // colonoscopy chosen
        expect(p.D_603167806).toBe('104430631');          // other colon options -> explicit No
        expect(p.D_122234136_D_858052564).toBe('2018');   // colonCol parent
    });

    it('screeningDetected=No emits the flag and nothing else from the section', () => {
        const p = buildDiagnosisPayload({ primarySite: 'lung', dxYear: '2020', screeningDetected: false, screenings: [{ type: 'lungCT', year: '2019' }] });
        expect(p.D_944065539).toBe('104430631');
        expect('D_633630015' in p).toBe(false);
        expect(nestedDKey(m.screening.optionValues.lungCT, m.screening.year) in p).toBe(false);
    });

    it('emits the physician NPI once its mapping cid is assigned (TODO flip)', () => {
        const original = m.treatment.physNpi;
        try {
            m.treatment.physNpi = 999999999;
            const p = buildDiagnosisPayload(goldenState);
            expect(p.D_244216107_D_999999999_1).toBe('1234567890');
            expect('D_244216107_D_999999999_2' in p).toBe(false); // unmatched physician has no npi
        } finally {
            m.treatment.physNpi = original;
        }
    });
});

describe('buildProgressSnapshot', () => {
    const NOW = new Date('2026-06-12T12:00:00.000Z');
    const position = { screenId: 'diagnosisDate', history: ['landing', 'primarySite'] };

    it('wraps the payload with language, lastUpdated, and lossless state/position strings', () => {
        const snap = buildProgressSnapshot(goldenState, position, { lang: 163149180, now: NOW });
        expect(snap.D_181737942).toBe('847945207');             // payload rides along
        expect(snap[784119588]).toBe(163149180);                // surveyLanguage: bare cid, NUMBER
        expect(snap[fieldMapping.docLastUpdatedTimestamp]).toBe('2026-06-12T12:00:00.000Z'); // lastUpdated ISO string
        const stateBlob = JSON.parse(snap.stateJSON);
        expect(stateBlob.v).toBeUndefined();
        expect(stateBlob.state.primarySite).toBe('breast');
        expect(stateBlob.state.treatments[0].physicians[0].npi).toBe('1234567890'); // npi survives via stateJSON pre-cid
        expect(JSON.parse(snap.positionJSON)).toEqual(position);
    });
});

describe('appendDiagnosis', () => {
    it('appends without mutating the prior list', () => {
        const prior = [{ D_181737942: '847945207' }];
        const result = appendDiagnosis(prior, { D_181737942: '754745617' });
        expect(result).toHaveLength(2);
        expect(prior).toHaveLength(1);
        expect(result[1].D_181737942).toBe('754745617');
    });
});
