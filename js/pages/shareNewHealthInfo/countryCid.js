// Bridges app country select values to dictionary country response CIDs.

import { allCountries } from '../../shared.js';
import { getConceptIdByCountryName } from '../../countryMapping.js';

const COUNTRY_NAME_ALIASES = {
    'United States': 'United States of America',
    'Bolivia': 'Bolivia (Plurinational State of)',
    'British Virgin Islands': 'Virgin Islands (British)',
    'Brunei': 'Brunei Darussalam',
    'Cape Verde': 'Cabo Verde',
    'Cocos Islands': 'Cocos (Keeling) Islands',
    'Cook Island': 'Cook Islands',
    'Czech Republic': 'Czechia',
    'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
    'East Timor': 'Timor-Leste',
    'Falkland Islands': 'Falkland Islands (Malvinas)',
    'Iran': 'Iran (Islamic Republic of)',
    'Ivory Coast': "Cote d'Ivoire",
    'Laos': "Lao People's Democratic Republic",
    'Macedonia': 'North Macedonia',
    'Micronesia': 'Micronesia (Federated States of)',
    'Moldova': 'Moldova, Republic of',
    'North Korea': 'Korea (Democratic People\'s Republic of)',
    'Palestine': 'Palestine, State of',
    'Republic of the Congo': 'Congo',
    'Russia': 'Russian Federation',
    'Saint Helena': 'Saint Helena, Ascension and Tristan da Cunha',
    'Saint Martin': 'Saint Martin (French Part)',
    'Sint Maarten': 'Sint Maarten (Dutch Part)',
    'South Korea': 'Korea, Republic of',
    'Swaziland': 'Eswatini',
    'Syria': 'Syrian Arab Republic',
    'Taiwan': 'Taiwan, Province of China',
    'Tanzania': 'Tanzania, United Republic of',
    'U.S. Virgin Islands': 'Virgin Islands (U.S.)',
    'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland',
    'Vatican': 'Holy See',
    'Venezuela': 'Venezuela (Bolivarian Republic of)',
    'Vietnam': 'Viet Nam',
};

// Selectable but absent from the dictionary. Payload omits the country key.
export const KNOWN_UNMAPPED_COUNTRIES = Object.freeze(['Kosovo', 'Netherlands Antilles']);

export const countryCidFromSelectValue = (value) => {
    if (value === '' || value == null) return undefined;
    const target = Number(value);
    const name = Object.keys(allCountries).find((n) => allCountries[n] === target);
    if (!name) return undefined;
    const cid = getConceptIdByCountryName(COUNTRY_NAME_ALIASES[name] || name);
    return cid ? String(cid) : undefined;
};
