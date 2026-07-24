// Payload tests for the Health Care System Update section (issue #1658).
// Pin the exact built object with literal keys (never mapping-derived), so a
// mapping typo cannot self-confirm. Conventions under test (per the July data dictionary):
//   - every key is a top-level D_<cid> with a string value. No source-question maps, no counters.
//   - months emitted as month response cids. Countries as dictionary country cids.
//   - merged dictionary variables: state/region -> one cid. Zip/postal -> one cid.
//   - an international facility is never Google-address validated.

import { describe, it, expect, vi } from 'vitest';

vi.mock('../js/shared.js', () => ({
    allCountries: { 'United States': 1, 'United Kingdom': 2, Canada: 3 },
}));

import fieldMapping from '../js/fieldToConceptIdMapping.js';
import { buildHcsPayload, buildHcsSnapshot, makeHcsUpdate, parseHcsRow } from '../js/pages/shareNewHealthInfo/hcsPayload.js';

const domesticState = () => ({
    ...makeHcsUpdate(),
    facility: {
        ...makeHcsUpdate().facility,
        line1: 'Sibley Memorial Hospital',
        line2: '5255 Loughboro Rd NW',
        line3: 'Suite 100',
        city: 'Washington',
        state: 'District of Columbia',
        zip: '20016',
        googleAddressValidated: true,
    },
    changeMonth: 10, // November
    changeYear: '2025',
    additionalInfo: 'I moved across town.',
});

const internationalState = () => ({
    ...makeHcsUpdate(),
    facility: {
        ...makeHcsUpdate().facility,
        line1: 'Royal Marsden',
        line2: '203 Fulham Rd',
        line4: 'Building B, Chelsea',
        city: 'London',
        region: 'Greater London',
        postal: 'SW3 6JJ',
        isInternational: true,
        country: '2', // United Kingdom select value
        googleAddressValidated: true, // must be forced to No in the payload
    },
    changeYear: '2024',
});

describe('buildHcsPayload', () => {
    it('builds the exact flat domestic payload (golden)', () => {
        expect(buildHcsPayload(domesticState())).toEqual({
            D_892107008: '104430631',            // international flag = No
            D_771921322: '353358909',            // Google-validated = Yes
            D_624974556: 'Sibley Memorial Hospital',
            D_655907949: '5255 Loughboro Rd NW',
            D_858545898: 'Suite 100',
            D_973363047: 'Washington',
            D_783801971: 'District of Columbia',
            D_734087990: '20016',
            D_994200497: '615680906',            // November response cid
            D_353158944: '2025',
            D_519981637: 'I moved across town.',
        });
    });

    it('builds the exact flat international payload (golden): region/postal merge, country cid, Google forced No', () => {
        expect(buildHcsPayload(internationalState())).toEqual({
            D_892107008: '353358909',            // international flag = Yes
            D_771921322: '104430631',            // Google-validated forced to No for international
            D_624974556: 'Royal Marsden',
            D_655907949: '203 Fulham Rd',
            D_134439170: 'Building B, Chelsea',  // Line 4 (international only)
            D_973363047: 'London',
            D_783801971: 'Greater London',       // merged state/region cid
            D_734087990: 'SW3 6JJ',              // merged zip/postal cid
            D_111301575: '156628245',            // United Kingdom country response cid
            D_353158944: '2024',
        });
    });

    it('omits every facility key when the facility is empty, and omits unanswered optional fields', () => {
        const state = { ...makeHcsUpdate(), changeYear: '2024' };
        expect(buildHcsPayload(state)).toEqual({ D_353158944: '2024' });
    });

    it('preserves an explicit international Yes when no address text is entered', () => {
        const state = makeHcsUpdate();
        state.changeYear = '2024';
        state.facility.isInternational = true;
        expect(buildHcsPayload(state)).toEqual({
            D_892107008: '353358909',
            D_771921322: '104430631',
            D_353158944: '2024',
        });
    });
});

describe('buildHcsSnapshot', () => {
    it('adds the survey language and server-refreshed doc timestamp, and nothing else', () => {
        const now = new Date('2026-07-06T15:21:26.763Z');
        const snapshot = buildHcsSnapshot(domesticState(), { lang: fieldMapping.english, now });
        expect(snapshot[784119588]).toBe(fieldMapping.english);
        expect(snapshot[fieldMapping.docLastUpdatedTimestamp]).toBe('2026-07-06T15:21:26.763Z');
        // No resume fields for this submit-only module, and never the server-owned submitted timestamp.
        expect(snapshot.stateJSON).toBeUndefined();
        expect(snapshot.positionJSON).toBeUndefined();
        expect(snapshot.D_223569179).toBeUndefined();
    });
});

describe('parseHcsRow', () => {
    it('round-trips a domestic payload into display fields', () => {
        const row = { ...buildHcsPayload(domesticState()), D_223569179: '2026-07-06T15:21:26.763Z' };
        expect(parseHcsRow(row)).toEqual({
            line1: 'Sibley Memorial Hospital',
            line2: '5255 Loughboro Rd NW',
            line3: 'Suite 100',
            line4: '',
            city: 'Washington',
            stateOrRegion: 'District of Columbia',
            zipOrPostal: '20016',
            isInternational: false,
            countryCid: '',
            changeMonthCode: 10,
            changeYear: '2025',
            additionalInfo: 'I moved across town.',
            submittedTimestamp: '2026-07-06T15:21:26.763Z',
        });
    });

    it('round-trips an international payload and surfaces the country cid', () => {
        const parsed = parseHcsRow(buildHcsPayload(internationalState()));
        expect(parsed.isInternational).toBe(true);
        expect(parsed.line4).toBe('Building B, Chelsea');
        expect(parsed.stateOrRegion).toBe('Greater London');
        expect(parsed.zipOrPostal).toBe('SW3 6JJ');
        expect(parsed.countryCid).toBe('156628245');
        expect(parsed.changeMonthCode).toBeNull(); // month not answered
    });
});
