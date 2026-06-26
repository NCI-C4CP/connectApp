// Test fixtures for the Self-Report Cancer Diagnosis flow.
// Participant profiles for eligibility gating + E2E getMyData mocks.
// Sample diagnosis states + expected payloads are added alongside the payload tests.

import fieldMapping from '../../js/fieldToConceptIdMapping.js';

const {
    verification, verified, notYetVerified,
    consentWithdrawn, destroyData, participantDeceased, participantDeceasedNORC, yes, no,
} = fieldMapping;

// Verified AND not withdrawn → eligible for the card + flow.
export const participantVerifiedNotWithdrawn = Object.freeze({
    [verification]: verified,
    [consentWithdrawn]: no,
});

// Not yet verified → not eligible.
export const participantNotVerified = Object.freeze({
    [verification]: notYetVerified,
});

// Verified but withdrawn → not eligible.
export const participantWithdrawn = Object.freeze({
    [verification]: verified,
    [consentWithdrawn]: yes,
});

// Verified, not withdrawn, but data-destruction requested → not eligible (defensive).
export const participantDataDestroyRequested = Object.freeze({
    [verification]: verified,
    [consentWithdrawn]: no,
    [destroyData]: yes,
});

// Verified/not withdrawn, but deceased by either source → not eligible.
export const participantDeceasedEmr = Object.freeze({
    [verification]: verified,
    [consentWithdrawn]: no,
    [participantDeceased]: yes,
});

export const participantDeceasedNorc = Object.freeze({
    [verification]: verified,
    [consentWithdrawn]: no,
    [participantDeceasedNORC]: yes,
});
