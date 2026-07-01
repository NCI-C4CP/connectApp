// Country select-value -> dictionary response-CID translation. The completeness test walks the shared.js allCountries list.

import { describe, it, expect, vi } from 'vitest';

vi.mock('../js/shared.js', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('js/shared.js', 'utf8');
    const block = src.match(/export const allCountries = \{([\s\S]*?)\n\}/)[1];
    const allCountries = Object.fromEntries(
        [...block.matchAll(/"([^"]+)":\s*(\d+)/g)].map(([, name, num]) => [name, Number(num)]),
    );
    return { allCountries };
});

import { allCountries } from '../js/shared.js';
import { countryCidFromSelectValue, KNOWN_UNMAPPED_COUNTRIES } from '../js/pages/shareNewHealthInfo/countryCid.js';

describe('countryCidFromSelectValue', () => {
    it('extracted the real allCountries list (sanity)', () => {
        expect(Object.keys(allCountries).length).toBeGreaterThan(200);
        expect(allCountries['United States']).toBe(1);
    });

    it('EVERY selectable country resolves to a 9-digit response CID (alias table complete)', () => {
        const unresolved = Object.keys(allCountries)
            .filter((name) => !KNOWN_UNMAPPED_COUNTRIES.includes(name))
            .filter((name) => !/^\d{9}$/.test(countryCidFromSelectValue(allCountries[name]) || ''));
        expect(unresolved).toEqual([]);
    });

    it('translates exact-name and aliased countries to the dictionary CIDs', () => {
        expect(countryCidFromSelectValue(allCountries['Canada'])).toBe('794205182');
        expect(countryCidFromSelectValue(allCountries['United Kingdom'])).toBe('156628245'); // via alias
        expect(countryCidFromSelectValue(allCountries['United States'])).toBe('333208328');
    });

    it('returns undefined for empty values, unknown values, and CID-less countries', () => {
        expect(countryCidFromSelectValue('')).toBeUndefined();
        expect(countryCidFromSelectValue(null)).toBeUndefined();
        expect(countryCidFromSelectValue(999999)).toBeUndefined();
        for (const name of KNOWN_UNMAPPED_COUNTRIES) {
            expect(allCountries[name]).toBeDefined(); // still selectable in the UI
            expect(countryCidFromSelectValue(allCountries[name])).toBeUndefined();
        }
    });
});
