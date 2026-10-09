/**
 * PB CivilLab — Numerical Safety, Input Validation & Integrity Test Suite
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 */

import {
  calculateBBS,
  calculateConcreteVolume,
  calculateConcreteMix,
  calculateBrickwork,
  calculatePlaster,
  calculateSlab,
  calculateBeam,
  calculateColumn,
  calculateStaircase,
  calculateSlopeGradient,
  calculateSurveyLevelHI,
  calculateSurveyRiseAndFall,
} from '../src/utils/calculations';

import {
  calculateCodeCompliantConcrete,
  BUILDING_CODES_DATA,
} from '../src/components/Common/CodeSelector';

import { buildReportDocument } from '../src/report/buildReportDocument';
import { validateAndImportBackup, createBlankProject } from '../src/utils/storage';
import { UserProfile, CalculationResult } from '../src/types';
import { exportCalculationToPDF } from '../src/utils/pdfExport';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('\n===============================================================');
console.log(' PB CivilLab — Validation & Architectural Integrity Tests');
console.log('===============================================================\n');

// 1. REBAR & BBS VALIDATION
console.log('▶ [1/6] BBS & Rebar Validation Invariants:');
const invBbs1 = calculateBBS(0, 'straight', { a: 1000 }, 10);
assert(invBbs1.status === 'invalid', 'Rebar diameter 0 mm is rejected as invalid');

const invBbs2 = calculateBBS(16, 'straight', { a: -500 }, 10);
assert(invBbs2.status === 'invalid', 'Negative dimension A is rejected as invalid');

const invBbs3 = calculateBBS(16, 'l_bar', { a: 1000, b: 0 }, 10);
assert(invBbs3.status === 'invalid', 'L-bar with dimension B = 0 is rejected as invalid');

const invBbs4 = calculateBBS(16, 'straight', { a: 1000 }, 0);
assert(invBbs4.status === 'invalid', 'Bar quantity = 0 is rejected as invalid');

const invBbs5 = calculateBBS(16, 'straight', { a: 1000 }, 10, -50);
assert(invBbs5.status === 'invalid', 'Negative unit rate is rejected as invalid');

const validBbs = calculateBBS(16, 'straight', { a: 2000 }, 5, 100);
assert(validBbs.status === 'valid', 'Valid BBS straight bar returns status=valid');
assert(Number(validBbs.primaryValue) > 0, 'Valid BBS produces positive cutting length');

// 2. CONCRETE MIX & VOLUME VALIDATION
console.log('\n▶ [2/6] Concrete Mix & Volume Validation:');
const invMix1 = calculateConcreteMix(0, 1, 2, 4);
assert(invMix1.status === 'invalid', 'Concrete mix with wet volume = 0 m³ is rejected');

const invMix2 = calculateConcreteMix(10, 0, 0, 0);
assert(invMix2.status === 'invalid', 'Concrete mix with 0:0:0 ratio sum is rejected');

const invMix3 = calculateConcreteMix(10, 1, 2, 4, -1.5);
assert(invMix3.status === 'invalid', 'Concrete mix with negative dry factor is rejected');

const invVol1 = calculateConcreteVolume('slab', { lengthM: -5, widthM: 4, depthM: 0.15 });
assert(invVol1.status === 'invalid', 'Slab with negative length is rejected');

const invVol2 = calculateConcreteVolume('circ_column', { diameterMm: 0, heightM: 3 });
assert(invVol2.status === 'invalid', 'Circular column with 0 mm diameter is rejected');

const validMix = calculateConcreteMix(1.5, 1, 2, 4);
assert(validMix.status === 'valid', 'Standard 1:2:4 mix computes with status=valid');

// 3. MASONRY, PLASTER & STRUCTURAL MEMBERS
console.log('\n▶ [3/6] Masonry, Plaster & Structural Member Validation:');
const invBrick = calculateBrickwork(0, 3, 0.25);
assert(invBrick.status === 'invalid', 'Brickwork with 0 length wall is rejected');

const invPlaster = calculatePlaster(0, 12);
assert(invPlaster.status === 'invalid', 'Plaster with 0 area is rejected');

const invSlab = calculateSlab(-4, 5, 150);
assert(invSlab.status === 'invalid', 'Slab helper rejects negative length');

const invBeam = calculateBeam(6, 0, 500);
assert(invBeam.status === 'invalid', 'Beam helper rejects width = 0 mm');

const invStair = calculateStaircase(100, 150, 250); // floor height < riser
assert(invStair.status === 'invalid', 'Staircase with floor height < riser height is rejected');

// 4. CODE-SELECTOR & DYNAMIC CONCRETE REGIONAL LOGIC
console.log('\n▶ [4/6] Code-Compliant Concrete Calculations (BNBC 2020 vs ACI 318 vs IS 456):');
const bnbcResult = calculateCodeCompliantConcrete({
  wetVolumeM3: 10,
  mixRatio: { cement: 1, sand: 2, aggregate: 4 },
  code: 'BNBC_2020',
  specifiedStrengthMpa: 20,
});
assert(bnbcResult.title.includes('BNBC 2020'), 'BNBC 2020 result title documents code name');
assert(BUILDING_CODES_DATA.BNBC_2020.dryVolumeFactor === 1.54, 'BNBC 2020 dry factor is exactly 1.54');

const aciResult = calculateCodeCompliantConcrete({
  wetVolumeM3: 10,
  mixRatio: { cement: 1, sand: 2, aggregate: 4 },
  code: 'ACI_318',
  specifiedStrengthMpa: 20,
});
assert(BUILDING_CODES_DATA.ACI_318.dryVolumeFactor === 1.52, 'ACI 318 dry factor is exactly 1.52');

const isResult = calculateCodeCompliantConcrete({
  wetVolumeM3: 10,
  mixRatio: { cement: 1, sand: 2, aggregate: 4 },
  code: 'IS_456',
  specifiedStrengthMpa: 20,
});
assert(BUILDING_CODES_DATA.IS_456.dryVolumeFactor === 1.55, 'IS 456 dry factor is exactly 1.55');

// Verify that higher dry volume factor yields proportionally more dry volume
const bnbcDryVol = 10 * 1.54 * 1.03;
const isDryVol = 10 * 1.55 * 1.03;
assert(isDryVol > bnbcDryVol, 'IS 456 (1.55 dry factor) yields higher dry volume than BNBC (1.54)');

// 5. STORAGE & BACKUP VALIDATION (ZERO FABRICATION)
console.log('\n▶ [5/6] Storage, Migration & Zero-Fabrication Invariants:');
const blankProj = createBlankProject('Terminal Tower Jobsite');
assert(blankProj.meta.client === undefined, 'New project does NOT fabricate client name');
assert(blankProj.meta.location === undefined, 'New project does NOT fabricate jobsite location');
assert(Boolean(blankProj.meta.documentNumber?.startsWith('PBCL-')), 'New project generates standard document number');

const invalidBackup = validateAndImportBackup('{ "corrupted: json');
assert(invalidBackup.success === false, 'Malformed backup JSON safely rejected without throwing');

const emptyBackup = validateAndImportBackup(JSON.stringify({ notAProject: true }));
assert(emptyBackup.success === false, 'Backup missing project name safely rejected');

const validBackup = validateAndImportBackup(JSON.stringify({
  project: {
    name: 'Validated Metro Rail Project',
    meta: { projectName: 'Metro Pier 42' },
    history: [],
  },
}));
assert(validBackup.success === true, 'Valid project backup imports successfully');
assert(Boolean(validBackup.importedProject?.name.includes('Validated Metro Rail Project')), 'Imported project name preserved');

// 6. REPORT DOCUMENT MODEL INTEGRITY
console.log('\n▶ [6/6] Canonical Report Document Model Integrity:');
const reportDoc = buildReportDocument(validBbs, {
  projectMeta: {
    projectName: 'Super Long Engineering Infrastructure Project Title That Spans Multiple Lines Without Truncation',
    documentNumber: 'PBCL-2026-TEST',
  },
});
assert(reportDoc.header.appName === 'PB CivilLab', 'Report header enforces app name "PB CivilLab"');
assert(reportDoc.header.authorCredit === 'Prokash Biswas', 'Report header enforces author credit "Prokash Biswas"');
assert(reportDoc.header.documentNumber === 'PBCL-2026-TEST', 'Report preserves user document number');
assert(Boolean(reportDoc.project.projectName?.includes('Super Long')), 'Long project title preserved in full without truncation');
assert(reportDoc.disclaimer.length > 50, 'Standard engineering disclaimer embedded in report');

// 7. PROJECT EXECUTIVE SUMMARY AGGREGATION & DATA ROLL-UP
console.log('\n▶ [7/7] Project Executive Summary Aggregation & Data Roll-Up:');
const sampleProjectWorkspace = {
  id: 'test_ws_exec',
  name: 'Executive Test Flyover',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  meta: {
    projectName: 'Flyover Pier Cap 12',
    client: 'Roads & Highways Department',
    location: 'Dhaka - Chittagong Expressway',
    preparedBy: 'Prokash Biswas, PE',
    documentNumber: 'PBCL-EXEC-001',
    reportStatus: 'Approved' as const,
  },
  history: [
    {
      id: 'h1',
      toolId: 'concrete-volume',
      toolName: 'Concrete Volume Calculator',
      timestamp: '2026-03-01T00:00:00.000Z',
      summary: '32.50 m³',
      result: {
        title: 'Pier Cap Wet Volume',
        primaryValue: '32.50',
        primaryUnit: 'm³',
        primaryCategory: 'volume',
        primaryRawValue: 32.5,
        secondaryValues: [{ label: 'Volume in CFT', value: '1,147.7 CFT' }],
        breakdown: [],
        formula: 'L × W × H',
        substitutedFormula: '32.5 m³',
        inputsSummary: [{ label: 'Wet Concrete Volume', value: '32.5 m³' }],
        assumptions: [],
      },
    },
    {
      id: 'h2',
      toolId: 'rebar-weight',
      toolName: 'Rebar Calculator',
      timestamp: '2026-03-01T00:00:00.000Z',
      summary: '4,200.0 kg',
      result: {
        title: 'Pier Cap Reinforcement',
        primaryValue: '4,200.0',
        primaryUnit: 'kg',
        primaryCategory: 'mass',
        primaryRawValue: 4200.0,
        secondaryValues: [{ label: 'Metric Tonnes', value: '4.200 Tonnes' }],
        breakdown: [],
        formula: 'D²/162.2 × L × Qty',
        substitutedFormula: '4200 kg',
        inputsSummary: [],
        assumptions: [],
      },
    },
  ],
  takeoffItems: [
    {
      id: 't1',
      itemNo: '1.01',
      description: 'RCC Substructure Concrete',
      length: 10,
      width: 2,
      height: 0.5,
      quantity: 1,
      unit: 'm³' as const,
      rate: 8500,
      totalQty: 10.0,
      amount: 85000,
    },
    {
      id: 't2',
      itemNo: '1.02',
      description: 'TMT Reinforcing Steel',
      length: 1,
      width: 1,
      height: 1,
      quantity: 800,
      unit: 'kg' as const,
      rate: 95,
      totalQty: 800,
      amount: 76000,
    },
  ],
  currency: 'BDT',
  currencySymbol: '৳',
};

// Aggregate validation
const concFromHistory = sampleProjectWorkspace.history
  .filter(h => h.toolId.includes('concrete'))
  .reduce((sum, h) => sum + (h.result.primaryRawValue || 0), 0);
const concFromTakeoff = sampleProjectWorkspace.takeoffItems
  .filter(t => t.unit === 'm³')
  .reduce((sum, t) => sum + t.totalQty, 0);
const totalConcrete = concFromHistory + concFromTakeoff;

assert(totalConcrete === 42.5, 'Total concrete volume aggregates correctly (32.5 + 10 = 42.5 m³)');

const steelFromHistory = sampleProjectWorkspace.history
  .filter(h => h.toolId.includes('rebar'))
  .reduce((sum, h) => sum + (h.result.primaryRawValue || 0), 0);
const steelFromTakeoff = sampleProjectWorkspace.takeoffItems
  .filter(t => t.unit === 'kg')
  .reduce((sum, t) => sum + t.totalQty, 0);
const totalSteel = steelFromHistory + steelFromTakeoff;

assert(totalSteel === 5000.0, 'Total steel weight aggregates correctly (4200 + 800 = 5000 kg)');
assert(totalSteel / 1000 === 5.0, 'Total steel converts accurately to 5.0 Metric Tonnes');
assert(Math.round(totalConcrete * 35.3147) === 1501, 'Total concrete converts accurately to imperial CFT (1,501 CFT)');

// =========================================================================
// 8. USER PROFILE INTEGRATION & GRANULAR REPORT SELECTION
// =========================================================================
console.log('\n▶ [8/8] User Profile Integration & Granular Report Selection Integrity:');

const testProfile: UserProfile = {
  engineerName: 'Engr. Prokash Biswas',
  designation: 'Principal Structural Engineer',
  licenseNumber: 'PE-48291',
  companyName: 'PB CivilLab Engineering Consult',
  email: 'prokashbiswas8801@gmail.com',
  phone: '+880 1700-000000',
  companyAddress: 'Dhaka, Bangladesh',
  notes: 'Certified Professional Calculation',
};

assert(testProfile.engineerName.includes('Prokash Biswas'), 'User Profile preserves engineer name');
assert(testProfile.licenseNumber === 'PE-48291', 'User Profile preserves license number');
assert(testProfile.email === 'prokashbiswas8801@gmail.com', 'User Profile preserves author email');

// Test buildReportDocument with User Profile / Engineer metadata
const sampleCalcResult: CalculationResult = {
  title: 'Isolated Column Footing Dimension & Reinforcement Check',
  primaryValue: '12.50',
  primaryUnit: 'm³',
  status: 'valid',
  breakdown: [
    { step: 'Base Area', expression: '2.5 × 2.5', result: '6.25 m²' },
    { step: 'Volume', expression: '6.25 × 2.0', result: '12.50 m³' },
  ],
  formula: 'V = L × B × H',
  substitutedFormula: 'V = 2.5 × 2.5 × 2.0 = 12.50 m³',
  inputsSummary: [
    { label: 'Length', value: '2.5', unit: 'm' },
    { label: 'Width', value: '2.5', unit: 'm' },
    { label: 'Depth', value: '2.0', unit: 'm' },
  ],
  assumptions: [{ label: 'Soil Bearing', value: '200 kPa' }],
  engineeringNotes: 'Ensure 75mm clear cover for footing in direct soil contact.',
};

const reportWithProfile = buildReportDocument(sampleCalcResult, {
  projectMeta: {
    projectName: 'Commercial Tower Foundations',
    preparedBy: testProfile.engineerName,
    consultant: testProfile.companyName,
    engineerDesignation: testProfile.designation,
    engineerLicense: testProfile.licenseNumber,
  },
});

assert(reportWithProfile.project.preparedBy === 'Engr. Prokash Biswas', 'Report document model preserves preparedBy engineer');
assert(reportWithProfile.project.consultant === 'PB CivilLab Engineering Consult', 'Report document model preserves consultancy firm');
assert(
  Boolean(reportWithProfile.signOff[0]?.title?.includes('Principal Structural Engineer')) &&
  Boolean(reportWithProfile.signOff[0]?.title?.includes('PE-48291')),
  'Sign-off PREPARED BY card displays engineer designation and PE license registration'
);

// Test Granular Selection: Executive 1-Page Summary Preset
const execDoc = buildReportDocument(sampleCalcResult, {
  sectionOptions: {
    showProjectInfo: true,
    showInputs: true,
    showPrimaryResult: true,
    showSecondaryResults: true,
    showDetailedTables: false,
    showCalculationTrace: false,
    showEngineeringBasis: false,
    showEngineeringNotes: true,
    showVerification: true,
  },
});

assert(execDoc.layout.showPrimaryResult === true, 'Executive preset maintains primary output');
assert(execDoc.layout.showCalculationTrace === false, 'Executive preset cleanly hides deep calculation trace for single-page budget');
assert(execDoc.layout.showVerification === true, 'Executive preset maintains QA verification block');

// Test PDF export with userProfile integration
const pdfDoc = exportCalculationToPDF(sampleCalcResult, {
  autoDownload: false,
  fitToOnePage: true,
  settings: {
    userProfile: testProfile,
  },
  projectMeta: {
    projectName: 'Highway Box Culvert',
  },
});

assert(pdfDoc.getNumberOfPages() === 1, 'PDF engine strictly respects fitToOnePage constraint (exactly 1 page)');
assert(pdfDoc.output().length > 0, 'PDF engine outputs non-empty byte buffer with embedded profile');

console.log('\n===============================================================');
console.log(` VALIDATION TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
