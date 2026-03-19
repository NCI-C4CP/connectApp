import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerSharedRuntimeModuleMocks } from './moduleMocks.js';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers.js';

// Register mocks for shared.js's own imports (signIn, homePage, app, event, i18n)
registerSharedRuntimeModuleMocks();

let setModuleAttributes;
let fieldMapping;

// Minimal modules object matching what questionnaireModules() returns.
// Each test gets a fresh copy via buildModules().
const buildModules = () => ({
  'First Survey': {},
  'Background and Overall Health': { moduleId: 'Module1', enabled: true },
  'Medications, Reproductive Health, Exercise, and Sleep': { moduleId: 'Module2', enabled: false },
  'Smoking, Alcohol, and Sun Exposure': { moduleId: 'Module3', enabled: false },
  'Where You Live and Work': { moduleId: 'Module4', enabled: false },
  'Enter SSN': { moduleId: 'ModuleSsn', enabled: false },
  'Covid-19': { moduleId: 'ModuleCovid19', enabled: false },
  'Biospecimen Survey': { moduleId: 'Biospecimen', enabled: false },
  'Clinical Biospecimen Survey': { moduleId: 'ClinicalBiospecimen', enabled: false },
  'Menstrual Cycle': { moduleId: 'MenstrualCycle', enabled: false },
  'Mouthwash': { moduleId: 'Mouthwash', enabled: false },
  'PROMIS': { moduleId: 'PROMIS', enabled: false },
  'Connect Experience 2024': { moduleId: 'Experience2024', enabled: false },
  'Cancer Screening History': { moduleId: 'CancerScreeningHistory', enabled: false },
  'Diet History Questionnaire III (DHQ III)': { moduleId: 'DHQ3', enabled: false },
  '2026 Return of Results Preference Survey': { moduleId: 'ROIPreference2026', enabled: false },
});

// Stub firebase.auth() so getIdToken() resolves (needed if DHQ3 allocation is triggered).
const installFirebaseStub = () => {
  globalThis.firebase = {
    auth: () => ({
      onAuthStateChanged: (cb) => {
        // Defer the callback so the return value (unsubscribe) is assigned
        // before the callback runs — mirrors real Firebase behavior.
        queueMicrotask(() => cb({
          isAnonymous: false,
          getIdToken: () => Promise.resolve('mock-id-token'),
        }));
        return () => {};
      },
    }),
  };
};

beforeAll(async () => {
  vi.resetModules();
  vi.doUnmock('../js/shared.js');
  const shared = await import('../js/shared.js');
  setModuleAttributes = shared.setModuleAttributes;

  const fm = await import('../js/fieldToConceptIdMapping.js');
  fieldMapping = fm.default;
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Static attribute assignments ───────────────────────────────────

describe('setModuleAttributes – static attributes', () => {
  it('sets First Survey attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['First Survey'].description).toBe('mytodolist.mainHeaderFirstSurveyDescription');
    expect(result['First Survey'].hasIcon).toBe(false);
    expect(result['First Survey'].noButton).toBe(true);
  });

  it('sets header, description, and estimatedTime for four core modules', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Background and Overall Health'].header).toBe('Background and Overall Health');
    expect(result['Background and Overall Health'].description).toBe('mytodolist.mainBodyBackgroundDescription');
    expect(result['Background and Overall Health'].estimatedTime).toBe('mytodolist.20_30minutes');

    expect(result['Medications, Reproductive Health, Exercise, and Sleep'].header).toBe('Medications, Reproductive Health, Exercise, and Sleep');
    expect(result['Medications, Reproductive Health, Exercise, and Sleep'].estimatedTime).toBe('mytodolist.20_30minutes');

    expect(result['Smoking, Alcohol, and Sun Exposure'].header).toBe('Smoking, Alcohol, and Sun Exposure');
    expect(result['Smoking, Alcohol, and Sun Exposure'].estimatedTime).toBe('mytodolist.20_30minutes');

    expect(result['Where You Live and Work'].header).toBe('Where You Live and Work');
    expect(result['Where You Live and Work'].estimatedTime).toBe('mytodolist.20_30minutes');
  });

  it('sets Enter SSN attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Enter SSN'].header).toBe('Your Social Security Number (SSN)');
    expect(result['Enter SSN'].hasIcon).toBe(false);
    expect(result['Enter SSN'].noButton).toBe(false);
    expect(result['Enter SSN'].estimatedTime).toBe('mytodolist.less5minutes');
  });

  it('sets Covid-19 attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Covid-19'].header).toBe('COVID-19 Survey');
    expect(result['Covid-19'].hasIcon).toBe(false);
    expect(result['Covid-19'].noButton).toBe(false);
    expect(result['Covid-19'].estimatedTime).toBe('mytodolist.10minutes');
  });

  it('sets Biospecimen Survey attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Biospecimen Survey'].header).toBe('Baseline Blood, Urine, and Mouthwash Sample Survey');
    expect(result['Biospecimen Survey'].estimatedTime).toBe('mytodolist.5minutes');
  });

  it('sets Clinical Biospecimen Survey attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Clinical Biospecimen Survey'].header).toBe('Baseline Blood and Urine Sample Survey');
    expect(result['Clinical Biospecimen Survey'].estimatedTime).toBe('mytodolist.5minutes');
  });

  it('sets Menstrual Cycle attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Menstrual Cycle'].header).toBe('Menstrual Cycle Survey');
    expect(result['Menstrual Cycle'].estimatedTime).toBe('mytodolist.5minutes');
  });

  it('sets Mouthwash attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Mouthwash'].header).toBe('At-Home Mouthwash Sample Survey');
    expect(result['Mouthwash'].estimatedTime).toBe('mytodolist.5minutes');
  });

  it('sets PROMIS attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['PROMIS'].header).toBe('Quality of Life Survey');
    expect(result['PROMIS'].estimatedTime).toBe('mytodolist.10_15minutes');
  });

  it('sets Connect Experience 2024 attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Connect Experience 2024'].header).toBe('2024 Connect Experience Survey');
    expect(result['Connect Experience 2024'].estimatedTime).toBe('mytodolist.15_20minutes');
  });

  it('sets Cancer Screening History attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Cancer Screening History'].header).toBe('Cancer Screening History Survey');
    expect(result['Cancer Screening History'].estimatedTime).toBe('mytodolist.15_20minutes');
  });

  it('sets DHQ III attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].header).toBe('Diet History Questionnaire III (DHQ III)');
    expect(result['Diet History Questionnaire III (DHQ III)'].estimatedTime).toBe('mytodolist.45_60minutes');
  });

  it('sets 2026 Return of Results Preference Survey attributes', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['2026 Return of Results Preference Survey'].header).toBe('2026 Return of Results Preference Survey');
    expect(result['2026 Return of Results Preference Survey'].estimatedTime).toBe('mytodolist.10_15minutes');
  });
});

// ─── Module enabling logic ──────────────────────────────────────────

describe('setModuleAttributes – enabling modules', () => {
  it('enables Biospecimen Survey and Covid-19 when biospecimen data is present', async () => {
    const data = { 331584571: { 266600170: { 840048338: true } } };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Biospecimen Survey'].enabled).toBe(true);
    expect(result['Covid-19'].enabled).toBe(true);
  });

  it('does not enable Biospecimen Survey when biospecimen data is absent', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Biospecimen Survey'].enabled).toBeFalsy();
  });

  it('enables Clinical Biospecimen Survey and Covid-19 when matching collection exists', async () => {
    const collections = [{ 650516960: 664882224 }];
    const result = await setModuleAttributes({}, buildModules(), collections);

    expect(result['Clinical Biospecimen Survey'].enabled).toBe(true);
    expect(result['Covid-19'].enabled).toBe(true);
  });

  it('does not enable Clinical Biospecimen Survey when no matching collection exists', async () => {
    const collections = [{ 650516960: 999999 }];
    const result = await setModuleAttributes({}, buildModules(), collections);

    expect(result['Clinical Biospecimen Survey'].enabled).toBeFalsy();
  });

  it('does not enable Clinical Biospecimen Survey when collections is null', async () => {
    const result = await setModuleAttributes({}, buildModules(), null);

    expect(result['Clinical Biospecimen Survey'].enabled).toBeFalsy();
  });

  it('enables Modules 2-4 and marks Module 1 complete when Module 1 is submitted', async () => {
    const data = { [fieldMapping.Module1.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Background and Overall Health'].completed).toBe(true);
    expect(result['Smoking, Alcohol, and Sun Exposure'].enabled).toBe(true);
    expect(result['Where You Live and Work'].enabled).toBe(true);
    expect(result['Medications, Reproductive Health, Exercise, and Sleep'].enabled).toBe(true);
  });

  it('does not enable Modules 2-4 when Module 1 is not submitted', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Smoking, Alcohol, and Sun Exposure'].enabled).toBeFalsy();
    expect(result['Where You Live and Work'].enabled).toBeFalsy();
    expect(result['Medications, Reproductive Health, Exercise, and Sleep'].enabled).toBeFalsy();
  });

  it('enables Enter SSN when participant is verified', async () => {
    const data = { [fieldMapping.verification]: fieldMapping.verified };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Enter SSN'].enabled).toBe(true);
  });

  it('does not enable Enter SSN when participant is not verified', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Enter SSN'].enabled).toBeFalsy();
  });

  it('enables Mouthwash when home mouthwash kit is shipped', async () => {
    const data = {
      [fieldMapping.collectionDetails]: {
        [fieldMapping.baseline]: {
          [fieldMapping.bioKitMouthwash]: {
            [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
            [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.shipped,
          },
        },
      },
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Mouthwash'].enabled).toBe(true);
  });

  it('enables Mouthwash when home mouthwash kit is received', async () => {
    const data = {
      [fieldMapping.collectionDetails]: {
        [fieldMapping.baseline]: {
          [fieldMapping.bioKitMouthwash]: {
            [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
            [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.received,
          },
        },
      },
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Mouthwash'].enabled).toBe(true);
  });

  it('does not enable Mouthwash when kit status is not shipped or received', async () => {
    const data = {
      [fieldMapping.collectionDetails]: {
        [fieldMapping.baseline]: {
          [fieldMapping.bioKitMouthwash]: {
            [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
            [fieldMapping.kitStatus]: 999999, // neither shipped nor received
          },
        },
      },
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Mouthwash'].enabled).toBeFalsy();
  });

  it('does not enable Mouthwash when kit type does not match', async () => {
    const data = {
      [fieldMapping.collectionDetails]: {
        [fieldMapping.baseline]: {
          [fieldMapping.bioKitMouthwash]: {
            [fieldMapping.kitType]: 999999,
            [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.shipped,
          },
        },
      },
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Mouthwash'].enabled).toBeFalsy();
  });
});

// ─── Completion flags ───────────────────────────────────────────────

describe('setModuleAttributes – completion flags', () => {
  it('marks Module 2 as completed when submitted', async () => {
    const data = { [fieldMapping.Module2.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Medications, Reproductive Health, Exercise, and Sleep'].completed).toBe(true);
  });

  it('marks Module 3 as completed when submitted', async () => {
    const data = { [fieldMapping.Module3.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Smoking, Alcohol, and Sun Exposure'].completed).toBe(true);
  });

  it('marks Module 4 as completed when submitted', async () => {
    const data = { [fieldMapping.Module4.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Where You Live and Work'].completed).toBe(true);
  });

  it('marks Enter SSN as completed when submitted', async () => {
    const data = { [fieldMapping.ModuleSsn.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Enter SSN'].completed).toBe(true);
  });

  it('marks Covid-19 as completed when submitted', async () => {
    const data = { [fieldMapping.ModuleCovid19.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Covid-19'].completed).toBe(true);
  });

  it('marks Biospecimen Survey as completed when submitted', async () => {
    const data = { [fieldMapping.Biospecimen.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Biospecimen Survey'].completed).toBe(true);
  });

  it('marks Clinical Biospecimen Survey as completed when submitted', async () => {
    const data = { [fieldMapping.ClinicalBiospecimen.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Clinical Biospecimen Survey'].completed).toBe(true);
  });

  it('marks Mouthwash as completed when submitted', async () => {
    const data = { [fieldMapping.Mouthwash.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Mouthwash'].completed).toBe(true);
  });

  it('marks Menstrual Cycle as completed when submitted', async () => {
    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.MenstrualCycle.statusFlag]: fieldMapping.moduleStatus.submitted,
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].completed).toBe(true);
  });
});

// ─── PROMIS date-window logic ───────────────────────────────────────

describe('setModuleAttributes – PROMIS enabling', () => {
  it('enables PROMIS when verified, not submitted, and >90 days since verification', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z', // ~151 days ago
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['PROMIS'].enabled).toBe(true);
  });

  it('does not enable PROMIS when verified <90 days ago', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-05-01T00:00:00Z', // ~31 days ago
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['PROMIS'].enabled).toBe(false);
  });

  it('enables PROMIS when verified, not submitted, and no verifiedDate', async () => {
    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      // No verifiedDate — inner cutoff check is skipped, enabled stays true
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['PROMIS'].enabled).toBe(true);
  });

  it('enables and completes PROMIS when already submitted', async () => {
    const data = {
      [fieldMapping.PROMIS.statusFlag]: fieldMapping.moduleStatus.submitted,
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['PROMIS'].enabled).toBe(true);
    expect(result['PROMIS'].completed).toBe(true);
  });
});

// ─── Menstrual Cycle date-window logic ──────────────────────────────

describe('setModuleAttributes – Menstrual Cycle enabling', () => {
  it('enables when eligible and biospecimen submitted within 5-45 day window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.Biospecimen.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.Biospecimen.completeTs]: '2025-05-22T00:00:00Z', // 10 days ago
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBe(true);
  });

  it('disables when biospecimen was completed too recently (<5 days)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.Biospecimen.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.Biospecimen.completeTs]: '2025-05-30T00:00:00Z', // 2 days ago
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBe(false);
  });

  it('disables when biospecimen was completed >45 days ago', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.Biospecimen.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.Biospecimen.completeTs]: '2025-04-10T00:00:00Z', // 52 days ago
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBe(false);
  });

  it('uses clinical biospecimen date when regular biospecimen is not submitted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.ClinicalBiospecimen.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.ClinicalBiospecimen.completeTs]: '2025-05-20T00:00:00Z', // 12 days ago
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBe(true);
  });

  it('disables when clinical biospecimen was completed outside the 5-45 day window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.ClinicalBiospecimen.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.ClinicalBiospecimen.completeTs]: '2025-05-30T00:00:00Z', // 2 days ago — too recent
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBe(false);
  });

  it('stays enabled when eligible but neither biospecimen nor clinical biospecimen is submitted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      // Neither Biospecimen nor ClinicalBiospecimen statusFlag is submitted
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBe(true);
  });

  it('does not enable when participant is not eligible', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Menstrual Cycle'].enabled).toBeFalsy();
  });

  it('skips date-window check when Menstrual Cycle is already submitted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.menstrualSurveyEligible]: fieldMapping.yes,
      [fieldMapping.MenstrualCycle.statusFlag]: fieldMapping.moduleStatus.submitted,
      // Biospecimen completed >45 days ago — would normally disable MC
      [fieldMapping.Biospecimen.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.Biospecimen.completeTs]: '2025-04-01T00:00:00Z',
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    // The date-window check is inside the "if statusFlag !== submitted" block,
    // so MC stays enabled when already submitted.
    expect(result['Menstrual Cycle'].enabled).toBe(true);
    expect(result['Menstrual Cycle'].completed).toBe(true);
  });
});

// ─── Closed surveys (shown only when submitted) ────────────────────

describe('setModuleAttributes – closed surveys', () => {
  it('enables and completes Experience 2024 when submitted', async () => {
    const data = { [fieldMapping.Experience2024.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Connect Experience 2024'].enabled).toBe(true);
    expect(result['Connect Experience 2024'].completed).toBe(true);
  });

  it('does not enable Experience 2024 when not submitted', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['Connect Experience 2024'].enabled).toBe(false);
  });

  it('enables and completes ROI Preference 2026 when submitted', async () => {
    const data = { [fieldMapping.ROIPreference2026.statusFlag]: fieldMapping.moduleStatus.submitted };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['2026 Return of Results Preference Survey'].enabled).toBe(true);
    expect(result['2026 Return of Results Preference Survey'].completed).toBe(true);
  });

  it('does not enable ROI Preference 2026 when not submitted', async () => {
    const result = await setModuleAttributes({}, buildModules(), []);

    expect(result['2026 Return of Results Preference Survey'].enabled).toBe(false);
  });
});

// ─── Cancer Screening History (270-day window) ─────────────────────

describe('setModuleAttributes – Cancer Screening History', () => {
  it('enables when verified >270 days ago and statusFlag exists', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z', // ~334 days ago
      [fieldMapping.CancerScreeningHistory.statusFlag]: fieldMapping.moduleStatus.notStarted,
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Cancer Screening History'].enabled).toBe(true);
  });

  it('marks Cancer Screening History complete when submitted and >270 days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.CancerScreeningHistory.statusFlag]: fieldMapping.moduleStatus.submitted,
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Cancer Screening History'].enabled).toBe(true);
    expect(result['Cancer Screening History'].completed).toBe(true);
  });

  it('does not enable when verified <270 days ago', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-03-01T00:00:00Z', // ~92 days ago
      [fieldMapping.CancerScreeningHistory.statusFlag]: fieldMapping.moduleStatus.notStarted,
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Cancer Screening History'].enabled).toBeFalsy();
  });

  it('does not enable when statusFlag is missing even if >270 days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      // no CancerScreeningHistory.statusFlag
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Cancer Screening History'].enabled).toBeFalsy();
  });
});

// ─── DHQ3 (180-day window + credential allocation) ─────────────────

describe('setModuleAttributes – DHQ3', () => {
  it('enables when verified >180 days, has a valid statusFlag, and has UUID', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z', // ~334 days
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.started,
      [fieldMapping.DHQ3.uuid]: 'existing-uuid',
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBe(true);
  });

  it('does not enable when statusFlag is notYetEligible', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.notYetEligible,
      [fieldMapping.DHQ3.uuid]: 'some-uuid',
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBeFalsy();
  });

  it('does not enable when no UUID is present (even with valid statusFlag)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    // statusFlag = submitted, but no UUID — the enable check requires uuid to be truthy
    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.submitted,
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBeFalsy();
  });

  it('marks DHQ3 complete when submitted with UUID', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.submitted,
      [fieldMapping.DHQ3.uuid]: 'some-uuid',
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].completed).toBe(true);
  });

  it('skips allocation when notStarted but UUID already exists', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.notStarted,
      [fieldMapping.DHQ3.uuid]: 'pre-existing-uuid', // UUID already set — no allocation
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBe(true);
  });

  it('does not enable when no statusFlag is present within 180-day window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      // No DHQ3.statusFlag at all
      [fieldMapping.DHQ3.uuid]: 'some-uuid',
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBeFalsy();
  });

  it('does not enable when verified <180 days ago', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-03-01T00:00:00Z', // ~92 days
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.started,
      [fieldMapping.DHQ3.uuid]: 'some-uuid',
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBeFalsy();
  });

  it('attempts credential allocation when eligible without UUID', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    installFirebaseStub();

    const mockUuid = 'allocated-uuid-123';
    globalThis.fetch = vi.fn()
      // First call: getAppSettings
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200,
          data: {
            dhq: {
              dhqStudyIDs: ['study-1'],
              dhqDepletedCredentials: [],
            },
          },
        }),
      })
      // Second call: allocateDHQ3Credential
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200,
          data: { [fieldMapping.DHQ3.uuid]: mockUuid },
        }),
      });

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.notStarted,
      // No UUID — triggers assignDHQ3Credential
    };
    const result = await setModuleAttributes(data, buildModules(), []);

    expect(globalThis.fetch).toHaveBeenCalled();
    // After allocation, UUID should be set on data and module enabled
    expect(data[fieldMapping.DHQ3.uuid]).toBe(mockUuid);
    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBe(true);
  });

  it('returns modules early when credential allocation fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    installFirebaseStub();

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const data = {
      [fieldMapping.verification]: fieldMapping.verified,
      [fieldMapping.verifiedDate]: '2025-01-01T00:00:00Z',
      [fieldMapping.DHQ3.statusFlag]: fieldMapping.moduleStatus.notStarted,
    };

    // Suppress expected console.error from the catch block
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await setModuleAttributes(data, buildModules(), []);

    // Function returns early on allocation failure
    expect(result).toBeDefined();
    expect(result['Diet History Questionnaire III (DHQ III)'].enabled).toBeFalsy();

    consoleErrorSpy.mockRestore();
  });
});

// ─── Return value ───────────────────────────────────────────────────

describe('setModuleAttributes – return value', () => {
  it('returns the same modules object reference (mutated in-place)', async () => {
    const modules = buildModules();
    const result = await setModuleAttributes({}, modules, []);

    expect(result).toBe(modules);
  });
});
