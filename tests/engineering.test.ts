/**
 * PB CivilLab — Engineering Calculation, Data Integrity & Regression Test Suite
 * Author: Prokash Biswas
 * Tagline: Calculate Smarter. Build Better.
 *
 * Automated regression tests verifying:
 * 1. Single Source of Truth & Zero Intermediate Rounding
 * 2. High-precision theoretical mass (D² / 162.2)
 * 3. Exact evaluation of D = 25mm, L = 12m, Qty = 25, Rate = 95 BDT/kg
 * 4. Multi-bar diameters: 8, 10, 12, 16, 20, 25, 32, 40 mm
 * 5. Quantity, decimal lengths, decimal rates, edge cases & validation
 * 6. Mathematical consistency between raw values and presentation layers
 * 7. Report export data integrity
 */

import {
  calculateRebarWeight,
  calculateConcreteVolume,
  calculateConcreteMix,
  calculateBrickwork,
  calculateSurveyLevelHI,
  calculateSurveyRiseAndFall,
  calculateSlopeGradient,
  convertDMS,
} from '../src/utils/calculations';

import {
  computeRebarCalculation,
  validateRebarInputs,
} from '../src/utils/engineeringEngine';

import {
  REBAR_WEIGHT_DENOMINATOR,
  STEEL_DENSITY,
} from '../src/constants/engineering';

import {
  generateCSVReport,
  generateExcelReport,
  generateJSONExport,
  exportCalculationToPDF,
} from '../src/utils/exportEngine';

import {
  convertUnit,
  parseFeetInches,
  formatFeetInches,
  parseDMS,
  formatDMS,
  parseSlope,
} from '../src/utils/units';

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
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, testName: string) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, testName, `Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(8)}, tol: ${tolerance})`);
}

function assertStrictEqual<T>(actual: T, expected: T, testName: string) {
  assert(actual === expected, testName, `Expected exact "${expected}", got "${actual}"`);
}

console.log('\n===============================================================');
console.log('  PB CivilLab — Comprehensive Engineering Regression Test Suite');
console.log('  Author: Prokash Biswas | Version 2.0.0 (Data Integrity)');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// 1. REBAR / STEEL WEIGHT & COST AUDIT (SECTION 24 SPECIFICATION TEST 1)
// -----------------------------------------------------------------------------
console.log('▶ [1/7] Section 24 Specification — Authoritative Rebar Regression Test:');

// Test 1: Exact parameters from Section 3 & Section 24
// Diameter = 25 mm, Length = 12 m, Quantity = 25, Rate = 95 BDT/kg
const test1 = computeRebarCalculation({
  diameterMm: 25,
  lengthPerBarM: 12,
  quantity: 25,
  ratePerKg: 95,
  formulaType: 'd2_162',
  currencySymbol: '৳',
});

// Expected Raw Values:
// Unit Weight = 25² / 162.2 = 3.8532675709... kg/m
// Total Length = 12 × 25 = 300 m
// Total Weight = 3.8532675709... × 300 = 1155.98027127... kg
// Total Tonnes = 1155.98027127... / 1000 = 1.15598027... t
// Estimated Cost = 1155.98027127... × 95 = 109818.12577... BDT

const raw = test1.rawValues!;
assertClose(raw.unitWeightRaw, 625 / 162.2, 0.000001, 'Raw unit weight equals exactly 25² / 162.2 (~3.85326757 kg/m)');
assertStrictEqual(raw.totalLengthRaw, 300, 'Raw total length equals exactly 300 m');
assertClose(raw.totalWeightRaw, (625 / 162.2) * 300, 0.000001, 'Raw total weight equals ~1155.98027 kg');
assertClose(raw.totalTonnesRaw, ((625 / 162.2) * 300) / 1000, 0.000001, 'Raw total tonnes equals ~1.15598027 t');
assertClose(raw.estimatedCostRaw, ((625 / 162.2) * 300) * 95, 0.0001, 'Raw estimated cost equals ~109818.1257 BDT (computed from raw weight, not rounded kg)');

// Expected Formatted Display Values:
// 3.853 kg/m, 300.00 m, 1,155.98 kg, 1.156 t, ৳109,818.13
assertStrictEqual(test1.primaryValue, '1,155.98', 'Display primary weight is "1,155.98" kg (NOT 1,155.99)');
assertStrictEqual(test1.primaryUnit, 'kg', 'Primary unit is "kg"');

const totalLenDisplay = test1.secondaryValues?.find(s => s.label === 'Total Length')?.value;
assertStrictEqual(totalLenDisplay, '300.00', 'Display total length is "300.00" m');

const unitWeightDisplay = test1.secondaryValues?.find(s => s.label === 'Unit Weight')?.value;
assertStrictEqual(unitWeightDisplay, '3.853', 'Display unit weight is "3.853" kg/m');

const totalTonnesDisplay = test1.secondaryValues?.find(s => s.label === 'Total Tonnes')?.value;
assertStrictEqual(totalTonnesDisplay, '1.156', 'Display total tonnes is "1.156" t');

const costDisplay = test1.secondaryValues?.find(s => s.label === 'Estimated Cost')?.value;
assert(costDisplay?.includes('109,818.13') === true, 'Display estimated cost is "৳109,818.13" (NOT ৳109,819.48)');

// Verify delegation from legacy calculateRebarWeight
const delegatedTest = calculateRebarWeight(25, 12, 25, 95, 'd2_162');
assertStrictEqual(delegatedTest.primaryValue, '1,155.98', 'calculateRebarWeight delegates to single source of truth');

// -----------------------------------------------------------------------------
// 2. STANDARD DIAMETERS SUITE (8, 10, 12, 16, 20, 25, 32, 40 mm)
// -----------------------------------------------------------------------------
console.log('\n▶ [2/7] Standard Rebar Diameters Verification Suite:');

const standardSizes = [
  { dia: 8, expectedUnitWeight: 64 / 162.2, display: '0.395' },
  { dia: 10, expectedUnitWeight: 100 / 162.2, display: '0.617' },
  { dia: 12, expectedUnitWeight: 144 / 162.2, display: '0.888' },
  { dia: 16, expectedUnitWeight: 256 / 162.2, display: '1.578' },
  { dia: 20, expectedUnitWeight: 400 / 162.2, display: '2.466' },
  { dia: 25, expectedUnitWeight: 625 / 162.2, display: '3.853' },
  { dia: 32, expectedUnitWeight: 1024 / 162.2, display: '6.313' },
  { dia: 40, expectedUnitWeight: 1600 / 162.2, display: '9.864' },
];

standardSizes.forEach(item => {
  const res = computeRebarCalculation({
    diameterMm: item.dia,
    lengthPerBarM: 12,
    quantity: 1,
    ratePerKg: 0,
    formulaType: 'd2_162',
  });
  assertClose(res.rawValues!.unitWeightRaw, item.expectedUnitWeight, 0.0001, `Ø${item.dia}mm raw unit weight matches D²/162.2`);
  const displayedUW = res.secondaryValues?.find(s => s.label === 'Unit Weight')?.value;
  assertStrictEqual(displayedUW, item.display, `Ø${item.dia}mm display unit weight matches "${item.display}" kg/m`);
});

// -----------------------------------------------------------------------------
// 3. QUANTITIES, DECIMAL LENGTHS & RATES
// -----------------------------------------------------------------------------
console.log('\n▶ [3/7] Quantity Variations, Decimals & Edge Cases:');

// Test: Quantity = 1
const qty1 = computeRebarCalculation({ diameterMm: 16, lengthPerBarM: 12, quantity: 1, ratePerKg: 100 });
assertClose(qty1.rawValues!.totalWeightRaw, (256 / 162.2) * 12, 0.0001, 'Quantity = 1 computes exact single-bar weight');

// Test: Quantity = 100
const qty100 = computeRebarCalculation({ diameterMm: 16, lengthPerBarM: 12, quantity: 100, ratePerKg: 100 });
assertClose(qty100.rawValues!.totalWeightRaw, (256 / 162.2) * 12 * 100, 0.0001, 'Quantity = 100 computes exact 100-bar weight');

// Test: Decimal Length (11.75 m) and Decimal Rate (94.75 BDT/kg)
const decimalTest = computeRebarCalculation({
  diameterMm: 20,
  lengthPerBarM: 11.75,
  quantity: 45,
  ratePerKg: 94.75,
  currencySymbol: '৳',
});
const expectedDecWeight = (400 / 162.2) * 11.75 * 45;
assertClose(decimalTest.rawValues!.totalWeightRaw, expectedDecWeight, 0.0001, 'Decimal length & quantity computes full precision weight');
assertClose(decimalTest.rawValues!.estimatedCostRaw, expectedDecWeight * 94.75, 0.01, 'Decimal rate computes exact cost from raw weight');

// Test: Validation of zero and negative inputs
const invalid1 = validateRebarInputs(0, 12, 10, 95);
assert(!invalid1.isValid && invalid1.errors.some(e => e.includes('diameter')), 'Rebar validation rejects 0 mm diameter');

const invalid2 = validateRebarInputs(16, -5, 10, 95);
assert(!invalid2.isValid && invalid2.errors.some(e => e.includes('length')), 'Rebar validation rejects negative length');

const invalid3 = validateRebarInputs(16, 12, -2, 95);
assert(!invalid3.isValid && invalid3.errors.some(e => e.includes('Quantity')), 'Rebar validation rejects negative quantity');

const invalid4 = validateRebarInputs(16, 12, 10, -50);
assert(!invalid4.isValid && invalid4.errors.some(e => e.includes('rate')), 'Rebar validation rejects negative rate');

// Test: Very large values without crashing or producing NaN/Infinity
const largeValTest = computeRebarCalculation({
  diameterMm: 40,
  lengthPerBarM: 100,
  quantity: 10000,
  ratePerKg: 120,
});
assert(Number.isFinite(largeValTest.rawValues!.totalWeightRaw), 'Large inputs evaluate to safe finite numbers without NaN/Infinity');

// -----------------------------------------------------------------------------
// 4. REPORT & EXPORT INTEGRITY (NO FABRICATED DATA)
// -----------------------------------------------------------------------------
console.log('\n▶ [4/7] Report Generation & Zero-Fabrication Verification:');

const csvOutput = generateCSVReport(test1, {
  documentNumber: 'PBCL-2026-TEST01',
  reportStatus: 'Draft',
  date: '03 Oct 2026',
});

assert(csvOutput.includes('1,155.98'), 'CSV export includes exact primary weight');
assert(csvOutput.includes('PBCL-2026-TEST01'), 'CSV export contains document number');
assert(csvOutput.includes('Draft'), 'CSV export defaults to Draft status');
assert(!csvOutput.includes('Project Engineering Office'), 'CSV export does NOT contain fabricated office name');
assert(!csvOutput.includes('Jobsite Headquarters'), 'CSV export does NOT contain fabricated jobsite name');
assert(!csvOutput.includes('Approved For Construction'), 'CSV export does NOT fabricate approval status');

// Test PDF Generation Engine
const pdfDoc = exportCalculationToPDF(test1, {
  documentNumber: 'PBCL-2026-PDF01',
  reportStatus: 'Draft',
  date: '04 Oct 2026',
  autoDownload: false,
} as any);

assert(pdfDoc !== null && typeof pdfDoc === 'object', 'PDF export engine instantiates successfully');
assert(pdfDoc.getNumberOfPages() === 1, 'PDF export strictly adheres to exactly 1 page layout');
const pdfBytes = pdfDoc.output('arraybuffer');
assert(pdfBytes.byteLength > 1000, 'PDF output binary produces valid non-empty byte stream');

// -----------------------------------------------------------------------------
// 5. CONCRETE TECHNOLOGY & MATERIAL MIX BREAKDOWN
// -----------------------------------------------------------------------------
console.log('\n▶ [5/7] Concrete Technology & Mix Design:');

// Beam Concrete Volume: 10m x 0.3m x 0.5m = 1.5 m3
const beamConcrete = calculateConcreteVolume('beam', {
  lengthM: 10,
  widthM: 0.3,
  depthM: 0.5,
});
assertClose(parseFloat(beamConcrete.primaryValue.replace(/,/g, '')), 1.5, 0.01, 'Beam concrete volume (10m × 0.3m × 0.5m) equals 1.50 m³');

// Circular Column: Dia 600mm, Height 4.0m
// Volume = pi * 0.3^2 * 4 = 1.13097 m3
const colConcrete = calculateConcreteVolume('circ_column', {
  diameterMm: 600,
  heightM: 4.0,
});
assertClose(parseFloat(colConcrete.primaryValue.replace(/,/g, '')), 1.13, 0.02, 'Circular column volume (Ø600mm × 4m) matches πr²h (~1.13 m³)');

// Concrete Mix Design (1:2:4, Dry factor 1.54, 5% waste)
const mixResult = calculateConcreteMix(1.0, 1, 2, 4, 1.54, 5);
assert(mixResult.primaryValue !== '', 'Concrete mix calculates primary cement sacks');
assert(Boolean(mixResult.secondaryValues?.some(v => v.label.includes('Sand'))), 'Mix calculates sand volume');
assert(Boolean(mixResult.secondaryValues?.some(v => v.label.includes('Aggregate') || v.label.includes('Khoa'))), 'Mix calculates coarse aggregate');

// -----------------------------------------------------------------------------
// 6. MASONRY, SURVEYING & FIELD CHECKS
// -----------------------------------------------------------------------------
console.log('\n▶ [6/7] Masonry & Surveying Field Book Checks:');

// Wall 5m long, 3m high, 0.25m (10") thick = 3.75 m3 gross
const brickResult = calculateBrickwork(5, 3, 0.25, 240, 115, 70, 12, 0, 1, 5, 5);
assert(parseFloat(brickResult.primaryValue.replace(/,/g, '')) > 1000, '5m × 3m × 0.25m brick wall yields realistic brick count (>1000 bricks)');

// Height of Instrument (HI) check
const hiResult = calculateSurveyLevelHI([
  { id: '1', station: 'BM', bs: 1.500, rl: 100.000, remarks: 'BM' },
  { id: '2', station: 'CP1', fs: 2.000, rl: 0, remarks: 'CP1' },
]);
assert(hiResult.isBalanced, 'Survey HI arithmetic check: Sum(BS) - Sum(FS) equals Last RL - First RL');

// Rise & Fall check
const rfResult = calculateSurveyRiseAndFall([
  { id: '1', station: 'BM', bs: 1.500, rl: 100.000, remarks: 'BM' },
  { id: '2', station: 'CP1', fs: 2.000, rl: 0, remarks: 'CP1' },
]);
assert(rfResult.isBalanced, 'Survey Rise & Fall arithmetic check: Sum(Rise) - Sum(Fall) equals Last RL - First RL');

// -----------------------------------------------------------------------------
// 7. UNIVERSAL UNIT CONVERSIONS & DIMENSION PARSER
// -----------------------------------------------------------------------------
console.log('\n▶ [7/7] Unit Conversions & Construction Dimension Parser:');

const mToFt = convertUnit('length', 'm', 'ft', 1.0);
assertClose(mToFt.result, 3.28084, 0.001, '1 meter = 3.28084 feet');

const cumToCft = convertUnit('volume', 'm3', 'cft', 1.0);
assertClose(cumToCft.result, 35.3147, 0.01, '1 cubic meter = 35.3147 CFT');

const mpaToPsi = convertUnit('pressure', 'MPa', 'psi', 1.0);
assertClose(mpaToPsi.result, 145.038, 0.1, '1 MPa = 145.038 psi');

const acreToSqft = convertUnit('area', 'acre', 'ft2', 1.0);
assertClose(acreToSqft.result, 43560, 1.0, '1 Acre = 43,560 sq ft');

const kathaToSqft = convertUnit('area', 'katha', 'ft2', 1.0);
assertClose(kathaToSqft.result, 720, 1.0, '1 Katha (Bangladesh standard) = 720 sq ft');

const decimalToSqft = convertUnit('area', 'decimal', 'ft2', 1.0);
assertClose(decimalToSqft.result, 435.6, 0.5, '1 Decimal / Shotangsho = 435.6 sq ft');

const ftInch1 = parseFeetInches("12'-6\"");
assert(ftInch1.isValid, 'Parse 12\'-6" is marked valid');
assertClose(ftInch1.totalFeet, 12.5, 0.001, 'Parse 12\'-6" returns exactly 12.50 decimal feet');

const ftInch2 = parseFeetInches("10'-4 1/2\"");
assert(ftInch2.isValid, 'Parse 10\'-4 1/2" is marked valid');
assertClose(ftInch2.totalFeet, 10.375, 0.001, 'Parse 10\'-4 1/2" returns exactly 10.375 decimal feet');

const formattedFraction = formatFeetInches(12.5);
assert(formattedFraction.includes('12') && formattedFraction.includes('6'), 'Format 12.5 decimal feet outputs 12\'-6"');

// -----------------------------------------------------------------------------
// 8. BUG FIXES & COMPREHENSIVE REGRESSION SUITE
// -----------------------------------------------------------------------------
console.log('\n▶ [8/8] CivilLab Bug Fixes & Regression Suite:');

// 8.1 Survey Turning Point — Format A: Single row with both FS & BS
const surveyFmtA = [
  { id: '1', station: 'BM', bs: 1.500, rl: 100.000, remarks: 'BM' },
  { id: '2', station: 'CP1', fs: 2.000, bs: 1.000, rl: 0, remarks: 'CP1 Turning Point' },
  { id: '3', station: 'ST2', fs: 1.200, rl: 0, remarks: 'End Point' },
];

const hiFmtA = calculateSurveyLevelHI(surveyFmtA);
assert(hiFmtA.isBalanced, 'Survey HI Format A: Sum(BS) - Sum(FS) equals Last RL - First RL');
assertClose(hiFmtA.lastRL, 99.300, 0.001, 'Survey HI Format A: Last RL equals exactly 99.300');

const rfFmtA = calculateSurveyRiseAndFall(surveyFmtA);
assert(rfFmtA.isBalanced, 'Survey Rise & Fall Format A: 3-part check balanced');
assertClose(rfFmtA.lastRL, 99.300, 0.001, 'Survey Rise & Fall Format A: Last RL equals exactly 99.300');
assertStrictEqual(rfFmtA.rows[1].fall, 0.5, 'Survey Rise & Fall Format A: CP1 fall is exactly 0.500');
assertClose(rfFmtA.rows[2].fall!, 0.2, 0.001, 'Survey Rise & Fall Format A: Subsequent sight uses new setup BS (Fall = 0.200)');

// 8.2 Survey Turning Point — Format B: Two-row format with duplicate CP station
const surveyFmtB = [
  { id: '1', station: 'BM', bs: 1.500, rl: 100.000, remarks: 'BM' },
  { id: '2', station: 'CP1', fs: 2.000, rl: 0, remarks: 'CP1 Foresight' },
  { id: '3', station: 'CP1', bs: 1.000, rl: 0, remarks: 'CP1 Backsight on duplicate station' },
  { id: '4', station: 'ST2', fs: 1.200, rl: 0, remarks: 'End Point' },
];

const hiFmtB = calculateSurveyLevelHI(surveyFmtB);
assert(hiFmtB.isBalanced, 'Survey HI Format B: 3-part check balanced');
assertClose(hiFmtB.rows[1].rl, 99.500, 0.001, 'Survey HI Format B: CP1 FS establishes RL = 99.500');
assertClose(hiFmtB.rows[2].rl, 99.500, 0.001, 'Survey HI Format B: Duplicate CP1 BS row maintains physical RL = 99.500');
assertClose(hiFmtB.lastRL, 99.300, 0.001, 'Survey HI Format B: Final station RL is 99.300');

const rfFmtB = calculateSurveyRiseAndFall(surveyFmtB);
assert(rfFmtB.isBalanced, 'Survey Rise & Fall Format B: 3-part check balanced');
assertStrictEqual(rfFmtB.rows[2].rise, 0, 'Survey Rise & Fall Format B: Duplicate CP BS row produces NO false rise (rise = 0)');
assertStrictEqual(rfFmtB.rows[2].fall, 0, 'Survey Rise & Fall Format B: Duplicate CP BS row produces NO false fall (fall = 0)');
assertClose(rfFmtB.rows[2].rl, 99.500, 0.001, 'Survey Rise & Fall Format B: Duplicate CP BS row preserves physical RL = 99.500');
assertClose(rfFmtB.lastRL, 99.300, 0.001, 'Survey Rise & Fall Format B: Final station RL is 99.300');

// 8.3 Benchmark RL of exactly zero (0.000)
const surveyZeroBM = [
  { id: '1', station: 'BM', bs: 1.500, rl: 0.000, remarks: 'BM at Datum 0.000' },
  { id: '2', station: 'ST1', fs: 0.500, rl: 0, remarks: 'Station 1' },
];

const hiZero = calculateSurveyLevelHI(surveyZeroBM);
assertStrictEqual(hiZero.firstRL, 0, 'Survey HI correctly handles benchmark RL of exactly zero (not default 100)');
assertStrictEqual(hiZero.lastRL, 1.000, 'Survey HI: Last RL from zero BM is exactly 1.000');

const rfZero = calculateSurveyRiseAndFall(surveyZeroBM);
assertStrictEqual(rfZero.firstRL, 0, 'Survey Rise & Fall correctly handles benchmark RL of exactly zero');
assertStrictEqual(rfZero.lastRL, 1.000, 'Survey Rise & Fall: Last RL from zero BM is exactly 1.000');

// 8.4 Negative & Malformed DMS Parsing and Formatting
const dmsNegFormat = formatDMS(-12.5);
assert(dmsNegFormat.includes('12') && dmsNegFormat.includes('30'), 'Negative decimal degree -12.5° formats as -12° 30′ 00″');
assert(dmsNegFormat.startsWith('−') || dmsNegFormat.startsWith('-'), 'Negative decimal degree formatting preserves negative sign');

const dmsNegParse = parseDMS('-12° 30\' 00"');
assert(dmsNegParse.isValid, 'Negative DMS string "-12° 30\' 00\\"" parses as valid');
assertClose(dmsNegParse.decimalDegrees, -12.5, 0.0001, 'Negative DMS string evaluates to exactly -12.5°');

const dmsInvalidMin = parseDMS('45° 75\' 20"');
assert(!dmsInvalidMin.isValid, 'DMS parser rejects minutes >= 60');
assert(Boolean(dmsInvalidMin.errorMessage?.includes('Minutes')), 'DMS parser returns descriptive error for invalid minutes');

const dmsInvalidSec = parseDMS('45° 30\' 85"');
assert(!dmsInvalidSec.isValid, 'DMS parser rejects seconds >= 60');
assert(Boolean(dmsInvalidSec.errorMessage?.includes('Seconds')), 'DMS parser returns descriptive error for invalid seconds');

const dmsJunk = parseDMS('45° 30\' 20" extra malformed junk');
assert(!dmsJunk.isValid, 'DMS parser rejects strings with trailing junk text');

// 8.5 Slope & Gradient: Zero Rise, Zero Run, Negative Rise, and Direct Notation
const slopeLevel = calculateSlopeGradient(0, 50);
assertStrictEqual(slopeLevel.primaryValue, '0.00%', 'Zero rise evaluates to 0.00% slope');
assert(Boolean(slopeLevel.secondaryValues?.some(v => v.value.includes('Level Ground'))), 'Zero rise displays clear Level Ground ratio instead of 1:0');

const slopeVertical = calculateSlopeGradient(10, 0);
assert(slopeVertical.primaryValue.includes('Vertical'), 'Zero run evaluates as vertical slope without arbitrary replacement');
assert(Boolean(slopeVertical.secondaryValues?.some(v => v.value.includes('Vertical'))), 'Zero run ratio displays vertical plumb face');

const slopeNegative = calculateSlopeGradient(-5, 100);
assert(slopeNegative.primaryValue.includes('-5%') || slopeNegative.primaryValue.includes('-5.00%'), 'Negative rise correctly evaluates to negative percentage');
assert(Boolean(slopeNegative.secondaryValues?.some(v => v.value.includes('Fall'))), 'Negative rise documents fall / downgrade slope');

const slopeNotationValid = parseSlope('1:20');
assert(slopeNotationValid.isValid, 'Direct slope ratio 1:20 is valid');
assertStrictEqual(slopeNotationValid.percent, 5, '1:20 evaluates to 5% grade');

const slopeNotationInvalid = parseSlope('invalid slope input');
assert(!slopeNotationInvalid.isValid, 'Direct slope parser rejects malformed input');
assert(Boolean(slopeNotationInvalid.errorMessage), 'Direct slope parser returns clear error message');

// 8.6 Configurable Concrete Cement Bag Masses
const mix40kg = calculateConcreteMix(1.0, 1, 2, 4, 1.54, 40);
assertStrictEqual(mix40kg.primaryUnit, 'Bags (40 kg)', 'Concrete mix result label displays 40 kg for 40 kg bag');

const mix25kg = calculateConcreteMix(1.0, 1, 2, 4, 1.54, 25);
assertStrictEqual(mix25kg.primaryUnit, 'Bags (25 kg)', 'Concrete mix result label displays 25 kg for 25 kg bag');

const mix50kg = calculateConcreteMix(1.0, 1, 2, 4, 1.54, 50);
assertStrictEqual(mix50kg.primaryUnit, 'Bags (50 kg)', 'Concrete mix result label displays 50 kg for 50 kg bag');

// -----------------------------------------------------------------------------
// 9. PRINTING, A4 LAYOUT, PREVIEW CONTROLS & PAGINATION SUITE
// -----------------------------------------------------------------------------
console.log('\n▶ [9/9] Printing, A4 Layout, Preview Controls & Multi-Page Pagination:');

// 9.1 Preview Section Controls in CSV Export
const fullMeta = {
  projectName: 'CivilLab Tower',
  projectId: 'CLT-001',
  client: 'Apex Infrastructure',
  documentNumber: 'PBCL-2026-PRINT01',
  reportStatus: 'Checked' as const,
  preparedBy: 'Engr. Prokash Biswas',
};

const fullCsv = generateCSVReport(test1, fullMeta);
assert(fullCsv.includes('--- PROJECT INFORMATION ---'), 'Full CSV includes project information');
assert(fullCsv.includes('--- PRIMARY ENGINEERING RESULT ---'), 'Full CSV includes primary result');
assert(fullCsv.includes('--- INPUT PARAMETERS ---'), 'Full CSV includes inputs table');
assert(fullCsv.includes('--- CALCULATED OUTPUTS ---'), 'Full CSV includes secondary outputs');
assert(fullCsv.includes('--- CALCULATION TRACE ---'), 'Full CSV includes calculation trace');
assert(fullCsv.includes('--- ENGINEERING BASIS & STANDARDS ---'), 'Full CSV includes engineering basis');
assert(fullCsv.includes('--- VERIFICATION & APPROVAL ---'), 'Full CSV includes verification block');

// Test turning off specific sections
const noProjectInfoCsv = generateCSVReport(test1, fullMeta, { showProjectInfo: false });
assert(!noProjectInfoCsv.includes('--- PROJECT INFORMATION ---'), 'Section control: disabling project info removes it from CSV');
assert(noProjectInfoCsv.includes('--- PRIMARY ENGINEERING RESULT ---'), 'Disabling project info preserves primary result');

const noInputsCsv = generateCSVReport(test1, fullMeta, { showInputs: false });
assert(!noInputsCsv.includes('--- INPUT PARAMETERS ---'), 'Section control: disabling inputs removes it from CSV');

const noSecondariesCsv = generateCSVReport(test1, fullMeta, { showSecondaryResults: false });
assert(!noSecondariesCsv.includes('--- CALCULATED OUTPUTS ---'), 'Section control: disabling secondary results removes it from CSV');

const noTraceCsv = generateCSVReport(test1, fullMeta, { showCalculationTrace: false });
assert(!noTraceCsv.includes('--- CALCULATION TRACE ---'), 'Section control: disabling calculation trace removes it from CSV');

const noBasisCsv = generateCSVReport(test1, fullMeta, { showEngineeringBasis: false });
assert(!noBasisCsv.includes('--- ENGINEERING BASIS & STANDARDS ---'), 'Section control: disabling engineering basis removes it from CSV');

const noVerificationCsv = generateCSVReport(test1, fullMeta, { showVerification: false });
assert(!noVerificationCsv.includes('--- VERIFICATION & APPROVAL ---'), 'Section control: disabling verification block removes it from CSV');

// 9.2 Mandatory Branding Enforcement
const bareMinimumCsv = generateCSVReport(test1, fullMeta, {
  showProjectInfo: false,
  showInputs: false,
  showPrimaryResult: false,
  showSecondaryResults: false,
  showCalculationTrace: false,
  showEngineeringBasis: false,
  showEngineeringNotes: false,
  showDetailedTables: false,
  showVerification: false,
});
assert(bareMinimumCsv.includes('PB CivilLab'), 'Mandatory Branding: App Name present even when all sections are disabled');
assert(bareMinimumCsv.includes('Prokash Biswas'), 'Mandatory Branding: Creator credit present even when all sections are disabled');
assert(bareMinimumCsv.includes('Calculate Smarter. Build Better.'), 'Mandatory Branding: App tagline present in header');

// 9.3 A4 Layout Options: Portrait vs Landscape
const portraitPdf = exportCalculationToPDF(test1, {
  orientation: 'portrait',
  margin: 'normal',
  autoDownload: false,
});
assertClose(portraitPdf.internal.pageSize.getWidth(), 210, 0.01, 'A4 Portrait page width is exactly 210 mm');
assertClose(portraitPdf.internal.pageSize.getHeight(), 297, 0.01, 'A4 Portrait page height is exactly 297 mm');

const landscapePdf = exportCalculationToPDF(test1, {
  orientation: 'landscape',
  margin: 'compact',
  autoDownload: false,
});
assertClose(landscapePdf.internal.pageSize.getWidth(), 297, 0.01, 'A4 Landscape page width is exactly 297 mm');
assertClose(landscapePdf.internal.pageSize.getHeight(), 210, 0.01, 'A4 Landscape page height is exactly 210 mm');

// 9.4 Multi-Page Pagination for Long Datasets
const longResult = {
  ...test1,
  title: 'Long Surveying / Takeoff Measurement Schedule',
  inputsSummary: Array.from({ length: 28 }, (_, i) => ({
    label: `Station Point #${i + 1} - Backsight Reading`,
    value: `${(1.234 + i * 0.15).toFixed(3)} m`,
  })),
  secondaryValues: Array.from({ length: 20 }, (_, i) => ({
    label: `Intermediate Reduced Level RL-${i + 1}`,
    value: `${(100.5 + i * 0.25).toFixed(3)} m`,
  })),
  calculationTrace: Array.from({ length: 12 }, (_, i) => ({
    label: `Arithmetic Check Step ${i + 1}`,
    expression: `HI - FS = ${(102.5 + i).toFixed(2)} - ${(1.5 + i * 0.1).toFixed(2)}`,
    result: `${(101.0 + i * 0.9).toFixed(3)} m`,
  })),
  engineeringNotes: 'Long site surveying log recorded at Sector 14 foundation grid. Checked against benchmark BM-04 with dual optical level verification and electronic distance meter cross-checks.',
};

const multiPagePdf = exportCalculationToPDF(longResult, {
  autoDownload: false,
});
assert(multiPagePdf.getNumberOfPages() >= 2, `Long report dynamically paginates across multiple pages (got ${multiPagePdf.getNumberOfPages()} pages)`);
const multiPageBytes = multiPagePdf.output('arraybuffer');
assert(multiPageBytes.byteLength > 5000, 'Multi-page PDF produces non-empty byte stream');

// 9.5 Repeating Header & Dynamic Page Numbering in Multi-Page Landscape PDF
const landscapeMultiPage = exportCalculationToPDF(longResult, {
  orientation: 'landscape',
  margin: 'compact',
  autoDownload: false,
});
assert(landscapeMultiPage.getNumberOfPages() >= 2, `Landscape report dynamically paginates across multiple pages (got ${landscapeMultiPage.getNumberOfPages()} pages)`);
const landscapeBytes = landscapeMultiPage.output('arraybuffer');
assert(landscapeBytes.byteLength > 5000, 'Landscape multi-page PDF produces non-empty byte stream');

// 9.6 Excel Spreadsheet Export (UTF-8 BOM validation)
const excelOutput = generateExcelReport(test1, {
  documentNumber: 'PBCL-EXCEL-01',
  reportStatus: 'Draft',
});
assert(excelOutput.startsWith('\uFEFF'), 'Excel report begins with UTF-8 Byte Order Mark');
assert(excelOutput.includes('PB CivilLab'), 'Excel report contains mandatory PB CivilLab branding');
assert(excelOutput.includes('Prokash Biswas'), 'Excel report contains mandatory author credit');

// 9.7 Structured JSON Calculation Export
const jsonOutput = generateJSONExport(test1, {
  documentNumber: 'PBCL-JSON-01',
  reportStatus: 'Draft',
});
const parsedJSON = JSON.parse(jsonOutput);
assertStrictEqual(parsedJSON.app, 'PB CivilLab', 'JSON export contains app identity');
assertStrictEqual(parsedJSON.author, 'Prokash Biswas', 'JSON export contains author credit');
assertStrictEqual(parsedJSON.documentId, 'PBCL-JSON-01', 'JSON export preserves document number');
assertStrictEqual(parsedJSON.calculation.primaryResult.value, '1,155.98', 'JSON export preserves exact primary value');

// JSON Export Section Controls: Disabling inputs omits inputs key
const jsonNoInputs = generateJSONExport(test1, undefined, { showInputs: false });
const parsedNoInputs = JSON.parse(jsonNoInputs);
assertStrictEqual(parsedNoInputs.calculation.inputs, undefined, 'JSON export omits inputs when showInputs is false');

// 9.8 Edge Cases: Empty or Minimal Result Export
const minimalResult = {
  title: 'Minimal Calculation',
  primaryValue: '42.00',
  primaryUnit: 'kN',
  breakdown: [],
  formula: 'F = m * a',
  substitutedFormula: '42 = 6 * 7',
  inputsSummary: [],
  assumptions: [],
};

const minimalCsv = generateCSVReport(minimalResult);
assert(minimalCsv.includes('Minimal Calculation'), 'Minimal result exports without crashing');
assert(minimalCsv.includes('42.00'), 'Minimal result exports primary value');

const minimalPdf = exportCalculationToPDF(minimalResult, { autoDownload: false });
assertStrictEqual(minimalPdf.getNumberOfPages(), 1, 'Minimal result PDF renders clean 1-page document');


// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ENGINEERING CALCULATIONS, DATA INTEGRITY & REGRESSION TESTS PASSED 100%!\n');
  process.exit(0);
}
