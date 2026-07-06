// Quest-like payload contract tests. The golden test pins the exact written object for a
// maximal diagnosis with literal keys (never mapping-derived). A mapping typo cannot
// self-confirm. Conventions under test (per the data dictionary + analytics decisions):
//   - Source Question CIDs are map parents when present; every D_ leaf value is a string
//   - treatment details are parented by the selected treatment type CID; repeatable
//     treatment physician/facility rows add matching Quest-style row counters (_1_1, _2_2, ...)
//   - screening details are parented by the selected screening option CID, with no counters
//   - months emitted as month response cids; countries as dictionary country cids
//   - merged dictionary variables: facility state/region -> one cid, zip/postal -> one cid
//   - server-owned fields (DxNumber, site DxDt, identity) are never client-emitted

import { describe, it, expect, vi } from 'vitest';

vi.mock('../js/shared.js', () => ({
    allCountries: { 'United States': 1, 'United Kingdom': 2, Canada: 3 },
}));

import fieldMapping from '../js/fieldToConceptIdMapping.js';
import {
    buildDiagnosisPayload, buildProgressSnapshot, dKey,
} from '../js/pages/shareNewHealthInfo/payload.js';

const m = fieldMapping.selfReportCancerDx;

const emptyFacility = {
    line1: '', line2: '', line3: '', line4: '', city: '', state: '', region: '', zip: '', postal: '',
    isInternational: false, country: '', googleAddressValidated: false,
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
                { firstName: 'Maya', lastName: 'Santos', npi: '1234567890' },
                { firstName: 'Jon', lastName: 'Santoso', npi: '' },
            ],
            facilities: [
                { ...emptyFacility, line1: 'Sibley Memorial Hospital', line2: '5255 Loughboro Rd NW', city: 'Washington', state: 'District of Columbia', zip: '20016', googleAddressValidated: true },
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
            physician: { firstName: 'Grace', lastName: 'Hopper', npi: '1098765432' },
            facility: { ...emptyFacility, line1: 'Imaging Center', line2: '1 Scan Way', city: 'Bethesda', state: 'Maryland', zip: '20814', googleAddressValidated: true },
        },
        {
            type: 'breastMRI', month: '', year: '2018',
            physician: { firstName: '', lastName: '', npi: '' },
            facility: { ...emptyFacility },
        },
    ],
};

// The contract, key by key. Source questions and detail parents are maps.
const goldenPayload = {
    D_176158861: {
        D_181737942: '847945207', // primary site = Breast
    },
    D_299768751: '615680906',     // dx month = November (response cid)
    D_908235757: '2024',          // dx year
    D_874288004: '353358909',     // treatment received = Yes
    D_388069854: {
        D_244216107: '353358909', // chemo selected
        D_293873603: '353358909', // surgery selected
        D_555019890: '104430631', // radiation shown-unchecked -> explicit No
        D_459406752: '104430631', // other shown-unchecked -> explicit No
    },
    // --- Treatment parent = chemo (244216107) ---
    D_244216107: {
        D_742710886: '526483288', // start month = May
        D_281136649: '2023',
        D_566057154: {
            D_735592270: '353358909', // ongoing = Yes (XOR: no end keys)
        },
        D_964819753_1_1: 'Maya', D_740626474_1_1: 'Santos', D_609996916_1_1: '1234567890',
        D_964819753_2_2: 'Jon', D_740626474_2_2: 'Santoso',
        D_539812906_1_1: '104430631', // facility 1: domestic
        D_568499390_1_1: '353358909', // facility 1: selected from Google Places
        D_165350319_1_1: 'Sibley Memorial Hospital',
        D_456014563_1_1: '5255 Loughboro Rd NW',
        D_493041638_1_1: 'Washington',
        D_215797578_1_1: 'District of Columbia', // merged state/region <- state
        D_385095107_1_1: '20016',                // merged zip/postal <- zip
        D_539812906_2_2: '353358909', // facility 2: international
        D_568499390_2_2: '104430631', // international facilities are never Google-address validated
        D_165350319_2_2: 'Royal Marsden',
        D_456014563_2_2: '203 Fulham Rd',
        D_460490909_2_2: 'Building B, Chelsea',  // line4 = international-only
        D_493041638_2_2: 'London',
        D_215797578_2_2: 'Greater London',       // merged state/region <- region
        D_385095107_2_2: 'SW3 6JJ',              // merged zip/postal <- postal
        D_785016438_2_2: '156628245',            // country: select value '2' -> UK response cid
    },
    // --- Treatment parent = surgery (293873603) ---
    D_293873603: {
        D_742710886: '286592124', // start month = January
        D_281136649: '2024',
        D_566057154: {
            D_735592270: '104430631', // ongoing = No
            D_625530863: '802747980', // end month = February
            D_729162012: '2024',
        },
    },
    // --- screening (breast site) ---
    D_944065539: '353358909',     // detected = Yes
    D_130601750: {
        D_425815239: '353358909', // 2D/3D mammogram chosen
        D_759642936: '104430631', // CEM shown-unchecked -> No
        D_528508094: '353358909', // MRI chosen
        D_502929020: '104430631', // US -> No
        D_412252588: '104430631', // CBE -> No
    },
    // --- Screening parent = breast2D (425815239) ---
    D_425815239: {
        D_853862770: '463502254', // screening month = April
        D_858052564: '2017',
        D_239126548: 'Grace', D_130343311: 'Hopper', D_879021105: '1098765432',
        D_501859375: '104430631', // facility: domestic
        D_803865514: '353358909', // facility selected from Google Places
        D_977505777: 'Imaging Center',
        D_632951008: '1 Scan Way',
        D_591687168: 'Bethesda',
        D_513329248: 'Maryland',
        D_404892571: '20814',
    },
    // --- Screening parent = breastMRI (528508094), sparse: year only ---
    D_528508094: {
        D_858052564: '2018',
    },
};

const expectStringLeaves = (value, path = 'payload') => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([k, v]) => expectStringLeaves(v, `${path}.${k}`));
    } else {
        expect(typeof value, path).toBe('string');
    }
};

describe('buildDiagnosisPayload — golden contract', () => {
    it('emits EXACTLY the dictionary-keyed Quest-like object for a maximal diagnosis', () => {
        expect(buildDiagnosisPayload(goldenState)).toEqual(goldenPayload);
    });

    it('every emitted value is a string', () => {
        expectStringLeaves(buildDiagnosisPayload(goldenState));
    });

    it('never emits server-owned keys (DxNumber, site DxDt, identity)', () => {
        const p = buildDiagnosisPayload(goldenState);
        expect(dKey(m.dxNumber) in p).toBe(false);
        for (const cid of Object.values(m.dxSubmittedTimestamps)) expect(dKey(cid) in p).toBe(false);
        for (const k of ['uid', 'token', 'Connect_ID']) {
            expect(k in p).toBe(false);
        }
    });

    it('does not emit legacy flat source children or old composite detail keys', () => {
        const p = buildDiagnosisPayload(goldenState);
        expect('D_181737942' in p).toBe(false);
        expect('D_546976551' in p).toBe(false);
        expect('D_244216107_D_281136649' in p).toBe(false);
        expect('D_244216107_D_964819753_1_1' in p).toBe(false);
        expect('D_425815239_D_858052564' in p).toBe(false);
        expect(typeof p.D_244216107).toBe('object');
        expect(typeof p.D_425815239).toBe('object');
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

    it('includes the Other write-in only when site is "other"', () => {
        const p = buildDiagnosisPayload({ primarySite: 'other', primarySiteOther: 'Gallbladder', dxYear: '2021' });
        expect(p.D_176158861.D_181737942).toBe('807835037');
        expect(p.D_176158861.D_546976551).toBe('Gallbladder');
        const emptyOther = buildDiagnosisPayload({ primarySite: 'other', primarySiteOther: '', dxYear: '2021' });
        expect(emptyOther.D_176158861.D_181737942).toBe('807835037');
        expect(emptyOther.D_176158861.D_546976551).toBeUndefined();
        expect('D_546976551' in buildDiagnosisPayload({ primarySite: 'breast', primarySiteOther: 'ignored', dxYear: '2021' }).D_176158861).toBe(false);
    });

    it('omits ALL treatment-section keys when txReceived is false or unanswered', () => {
        const no = buildDiagnosisPayload({ primarySite: 'prostate', dxYear: '2020', txReceived: false, treatments: [{ type: 'chemo', startYear: '2021' }] });
        expect(no.D_874288004).toBe('104430631');
        expect('D_388069854' in no).toBe(false);          // no type flags
        expect('D_244216107' in no).toBe(false);          // no treatment detail map
        const unanswered = buildDiagnosisPayload({ primarySite: 'prostate', dxYear: '2020' });
        expect('D_874288004' in unanswered).toBe(false);
    });

    it('emits explicit No treatment type flags but no loop rows when Q3 is Yes and no optional type is selected', () => {
        const p = buildDiagnosisPayload({ primarySite: 'prostate', dxYear: '2020', txReceived: true, treatments: [] });
        expect(p[dKey(m.txReceived)]).toBe(String(fieldMapping.yes));
        expect(p[dKey(m.sourceQuestions.treatmentType)][dKey(m.treatment.chemo)]).toBe(String(fieldMapping.no));
        expect(p[dKey(m.sourceQuestions.treatmentType)][dKey(m.treatment.surgery)]).toBe(String(fieldMapping.no));
        expect(p[dKey(m.sourceQuestions.treatmentType)][dKey(m.treatment.radiation)]).toBe(String(fieldMapping.no));
        expect(p[dKey(m.sourceQuestions.treatmentType)][dKey(m.treatment.other)]).toBe(String(fieldMapping.no));
        expect(dKey(m.treatment.chemo) in p).toBe(false);
    });

    it('emits the treatment other-describe only when the Other type is selected', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [{ type: 'other', otherDescribe: 'Immunotherapy', startYear: '2024', ongoing: true }],
        });
        expect(p.D_388069854.D_459406752).toBe('353358909');
        expect(p.D_388069854.D_420392069).toBe('Immunotherapy');
        expect(p.D_459406752.D_281136649).toBe('2024');

        const emptyOther = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [{ type: 'other', otherDescribe: '', startYear: '2024', ongoing: true }],
        });
        expect(emptyOther.D_388069854.D_459406752).toBe('353358909');
        expect(emptyOther.D_388069854.D_420392069).toBeUndefined();
        expect(emptyOther.D_459406752.D_281136649).toBe('2024');
    });

    it('parents treatment details by treatment type regardless of state array order', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', txReceived: true,
            treatments: [
                { type: 'radiation', startYear: '2022', ongoing: true },
                { type: 'chemo', startYear: '2021', ongoing: true },
            ],
        });
        expect(p.D_244216107.D_281136649).toBe('2021'); // chemo parent
        expect(p.D_555019890.D_281136649).toBe('2022'); // radiation parent
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

        expect(p.D_244216107[dKey(m.treatment.physFirstName, 1, 1)]).toBe('Ada');
        expect(p.D_244216107[dKey(m.treatment.physFirstName, 2, 2)]).toBe('Katherine');
        expect(p.D_244216107[dKey(m.treatment.physFirstName, 3, 3)]).toBeUndefined();
        expect(p.D_244216107[dKey(m.treatment.facility.line1, 1, 1)]).toBe('Facility A');
        expect(p.D_244216107[dKey(m.treatment.facility.googleValidated, 1, 1)]).toBe('104430631');
        expect(p.D_244216107[dKey(m.treatment.facility.line1, 2, 2)]).toBe('Facility C');
        expect(p.D_244216107[dKey(m.treatment.facility.googleValidated, 2, 2)]).toBe('104430631');
        expect(p.D_244216107[dKey(m.treatment.facility.line1, 3, 3)]).toBeUndefined();
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

        expect(p.D_244216107[dKey(m.treatment.physFirstName, 1, 1)]).toBe('Maya');
        expect(p.D_244216107[dKey(m.treatment.physLastName, 1, 1)]).toBe('Santos');
        expect(p.D_244216107[dKey(m.treatment.physFirstName, 2, 2)]).toBeUndefined();
        expect(p.D_244216107[dKey(m.treatment.facility.line1, 1, 1)]).toBe('Hospital B');
        expect(p.D_244216107[dKey(m.treatment.facility.googleValidated, 1, 1)]).toBe('104430631');
        expect(p.D_244216107[dKey(m.treatment.facility.line1, 2, 2)]).toBeUndefined();
    });

    it('omits screening entirely for non-eligible sites, even with stale screening state', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'prostate', dxYear: '2020', screeningDetected: true,
            screenings: [{ type: 'breast2D', year: '2019' }],
        });
        expect('D_944065539' in p).toBe(false);
        expect('D_130601750' in p).toBe(false);
        expect('D_425815239' in p).toBe(false);
    });

    it('drops wrong-site screenings but keeps right-site ones (site changed mid-flow)', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'colon', dxYear: '2020', screeningDetected: true,
            screenings: [{ type: 'breast2D', year: '2019' }, { type: 'colonCol', year: '2018' }],
        });
        expect('D_425815239' in p).toBe(false);           // breast option flag never emitted for colon
        expect(p.D_130601750.D_122234136).toBe('353358909'); // colonoscopy chosen
        expect(p.D_130601750.D_603167806).toBe('104430631'); // other colon options -> explicit No
        expect(p.D_122234136.D_858052564).toBe('2018');      // colonCol parent
    });

    it('screeningDetected=No emits the flag and nothing else from the section', () => {
        const p = buildDiagnosisPayload({ primarySite: 'lung', dxYear: '2020', screeningDetected: false, screenings: [{ type: 'lungCT', year: '2019' }] });
        expect(p.D_944065539).toBe('104430631');
        expect('D_130601750' in p).toBe(false);
        expect('D_633630015' in p).toBe(false);
    });

    it('lung screening Yes stores the answer under the screening source and details in the lung CT map', () => {
        const p = buildDiagnosisPayload({
            primarySite: 'lung', dxYear: '2020', screeningDetected: true,
            screenings: [{ type: 'lungCT', year: '2019', physician: { firstName: 'Grace', lastName: 'Hopper' }, facility: { ...emptyFacility, line1: 'CT Center' } }],
        });
        expect(p.D_944065539).toBe('353358909');
        expect(p.D_130601750).toEqual({ D_633630015: '353358909' });
        expect(p.D_633630015.D_633630015).toBeUndefined();
        expect(p.D_633630015.D_858052564).toBe('2019');
        expect(p.D_633630015.D_239126548).toBe('Grace');
        expect(p.D_633630015.D_977505777).toBe('CT Center');
        expect(p.D_633630015.D_803865514).toBe('104430631');
    });

    it('emits mapped NPIs and omits unmatched physician NPI rows', () => {
        const p = buildDiagnosisPayload(goldenState);
        expect(p.D_244216107.D_609996916_1_1).toBe('1234567890');
        expect('D_609996916_2_2' in p.D_244216107).toBe(false);
        expect(p.D_425815239.D_879021105).toBe('1098765432');
    });
});

describe('buildProgressSnapshot', () => {
    const NOW = new Date('2026-06-12T12:00:00.000Z');
    const position = { screenId: 'diagnosisDate', history: ['landing', 'primarySite'] };

    it('wraps the payload with language, lastUpdated, and lossless state/position strings', () => {
        const snap = buildProgressSnapshot(goldenState, position, { lang: 163149180, now: NOW });
        expect(snap.D_176158861.D_181737942).toBe('847945207'); // payload rides along
        expect(snap[784119588]).toBe(163149180);                // surveyLanguage: bare cid, NUMBER
        expect(snap[fieldMapping.docLastUpdatedTimestamp]).toBe('2026-06-12T12:00:00.000Z'); // lastUpdated ISO string
        const stateBlob = JSON.parse(snap.stateJSON);
        expect(stateBlob.v).toBeUndefined();
        expect(stateBlob.state.primarySite).toBe('breast');
        expect(stateBlob.state.treatments[0].physicians[0].npi).toBe('1234567890'); // npi remains in the resume state
        expect(JSON.parse(snap.positionJSON)).toEqual(position);
    });
});
