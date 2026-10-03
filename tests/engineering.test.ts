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
} from '../src/utils/exportEngine';

import {
  convertUnit,
  parseFeetInches,
  formatFeetInches,
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
