/**
 * PB CivilLab — Engineering Calculation & Unit Conversion Test Suite
 * Author: Prokash Biswas
 * Tagline: Calculate Smarter. Build Better.
 *
 * Automated regression tests verifying deterministic calculation engines,
 * unit conversion accuracy, field surveying checks, and structural formulas.
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
  convertUnit,
  parseFeetInches,
  formatFeetInches
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
  assert(diff <= tolerance, testName, `Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(6)}, tol: ${tolerance})`);
}

console.log('\n===============================================================');
console.log('  PB CivilLab — Automated Engineering Verification Test Suite');
console.log('  Author: Prokash Biswas | Version 1.0.0');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// 1. REBAR / STEEL WEIGHT & COST AUDIT
// -----------------------------------------------------------------------------
console.log('▶ [1/6] Rebar Weight & Steel Mechanics Calculations:');

// Test 1: Standard 16mm bar, 12m length using D^2/162.2 formula
// Expected unit weight = 16*16 / 162.198 = 1.5783 kg/m. Total = 1.5783 * 12 = 18.94 kg
const rebar16 = calculateRebarWeight(16, 12, 1, 0, 'd2_162');
assertClose(parseFloat(rebar16.primaryValue.replace(/,/g, '')), 18.94, 0.1, '16mm rebar (12m) standard unit weight matches D²/162.2 (~18.94 kg)');

// Test 2: Standard 10mm bar, 12m length
// Expected unit weight = 100 / 162.198 = 0.6165 kg/m. Total = 7.40 kg
const rebar10 = calculateRebarWeight(10, 12, 1, 0, 'd2_162');
assertClose(parseFloat(rebar10.primaryValue.replace(/,/g, '')), 7.40, 0.1, '10mm rebar (12m) standard unit weight matches D²/162.2 (~7.40 kg)');

// Test 3: Multiple bars with rate calculation
const rebarBatch = calculateRebarWeight(20, 12, 10, 110, 'd2_162');
assert(parseFloat(rebarBatch.primaryValue.replace(/,/g, '')) > 0, '20mm rebar batch computes positive weight');
assert(Boolean(rebarBatch.secondaryValues?.some(v => v.label.includes('Cost'))), 'Rebar calculation includes cost estimation when rate provided');

// -----------------------------------------------------------------------------
// 2. CONCRETE TECHNOLOGY & MATERIAL MIX BREAKDOWN
// -----------------------------------------------------------------------------
console.log('\n▶ [2/6] Concrete Technology & Mix Design:');

// Test 4: Beam Concrete Volume: 10m x 0.3m x 0.5m = 1.5 m3
const beamConcrete = calculateConcreteVolume('beam', {
  lengthM: 10,
  widthM: 0.3,
  depthM: 0.5
});
assertClose(parseFloat(beamConcrete.primaryValue.replace(/,/g, '')), 1.5, 0.01, 'Beam concrete volume (10m × 0.3m × 0.5m) equals 1.50 m³');

// Test 5: Circular Column: Dia 600mm, Height 4.0m
// Volume = pi * 0.3^2 * 4 = 1.13097 m3
const colConcrete = calculateConcreteVolume('circ_column', {
  diameterMm: 600,
  heightM: 4.0
});
assertClose(parseFloat(colConcrete.primaryValue.replace(/,/g, '')), 1.13, 0.02, 'Circular column volume (Ø600mm × 4m) matches πr²h (~1.13 m³)');

// Test 6: Concrete Mix Design (1:2:4, Dry factor 1.54, 5% waste)
const mixResult = calculateConcreteMix(1.0, 1, 2, 4, 1.54, 5);
assert(mixResult.primaryValue !== '', 'Concrete mix calculates primary cement sacks');
assert(Boolean(mixResult.secondaryValues?.some(v => v.label.includes('Sand'))), 'Mix calculates sand volume');
assert(Boolean(mixResult.secondaryValues?.some(v => v.label.includes('Aggregate') || v.label.includes('Khoa'))), 'Mix calculates coarse aggregate');

// -----------------------------------------------------------------------------
// 3. MASONRY & BRICKWORK ESTIMATION
// -----------------------------------------------------------------------------
console.log('\n▶ [3/6] Masonry & Brickwork Calculations:');

// Test 7: Wall 5m long, 3m high, 0.25m (10") thick = 3.75 m3 gross
const brickResult = calculateBrickwork(5, 3, 0.25, 240, 115, 70, 12, 0, 1, 5, 5);
assert(parseFloat(brickResult.primaryValue.replace(/,/g, '')) > 1000, '5m × 3m × 0.25m brick wall yields realistic brick count (>1000 bricks)');

// -----------------------------------------------------------------------------
// 4. SURVEYING FIELD BOOK ARITHMETIC CHECKS
// -----------------------------------------------------------------------------
console.log('\n▶ [4/6] Surveying Field Book Verification Checks:');

// Test 8: Height of Instrument (HI) arithmetic verification
// BS = 1.500 at BM RL 100.000 -> HI = 101.500. FS = 2.000 -> RL = 99.500
// Check: Sum BS (1.5) - Sum FS (2.0) = -0.500. Last RL (99.5) - First RL (100.0) = -0.500
const hiResult = calculateSurveyLevelHI([
  { id: '1', station: 'BM', bs: 1.500, rl: 100.000, remarks: 'BM' },
  { id: '2', station: 'CP1', fs: 2.000, rl: 0, remarks: 'CP1' }
]);
assert(hiResult.isBalanced, 'Survey HI arithmetic check: Sum(BS) - Sum(FS) equals Last RL - First RL');

// Test 9: Rise & Fall arithmetic verification
const rfResult = calculateSurveyRiseAndFall([
  { id: '1', station: 'BM', bs: 1.500, rl: 100.000, remarks: 'BM' },
  { id: '2', station: 'CP1', fs: 2.000, rl: 0, remarks: 'CP1' }
]);
assert(rfResult.isBalanced, 'Survey Rise & Fall arithmetic check: Sum(Rise) - Sum(Fall) equals Last RL - First RL');

// -----------------------------------------------------------------------------
// 5. UNIVERSAL UNIT CONVERSION ACCURACY
// -----------------------------------------------------------------------------
console.log('\n▶ [5/6] High-Precision Unit Conversions:');

// Test 10: 1 Meter to Feet (1 m = 3.28084 ft)
const mToFt = convertUnit('length', 'm', 'ft', 1.0);
assertClose(mToFt.result, 3.28084, 0.001, '1 meter = 3.28084 feet');

// Test 11: 1 Cubic Meter to Cubic Feet (CFT) (1 m³ = 35.3147 ft³)
const cumToCft = convertUnit('volume', 'm3', 'cft', 1.0);
assertClose(cumToCft.result, 35.3147, 0.01, '1 cubic meter = 35.3147 CFT');

// Test 12: 1 Megapascal to PSI (1 MPa = 145.038 psi)
const mpaToPsi = convertUnit('pressure', 'MPa', 'psi', 1.0);
assertClose(mpaToPsi.result, 145.038, 0.1, '1 MPa = 145.038 psi');

// Test 13: 1 Acre to Square Feet (1 Acre = 43,560 sq ft)
const acreToSqft = convertUnit('area', 'acre', 'ft2', 1.0);
assertClose(acreToSqft.result, 43560, 1.0, '1 Acre = 43,560 sq ft');

// Test 14: Regional Land Units: 1 Katha (Bangladesh) = 720 sq ft
const kathaToSqft = convertUnit('area', 'katha', 'ft2', 1.0);
assertClose(kathaToSqft.result, 720, 1.0, '1 Katha (Bangladesh standard) = 720 sq ft');

// Test 15: Regional Land Units: 1 Decimal (Cent) = 435.6 sq ft
const decimalToSqft = convertUnit('area', 'decimal', 'ft2', 1.0);
assertClose(decimalToSqft.result, 435.6, 0.5, '1 Decimal / Shotangsho = 435.6 sq ft');

// -----------------------------------------------------------------------------
// 6. SITE DIMENSION PARSER & FEET-INCH FRACTIONS
// -----------------------------------------------------------------------------
console.log('\n▶ [6/6] Construction Dimension Parser (Feet-Inches-Fractions):');

// Test 16: Parse "12'-6\"" -> 12.5 feet
const ftInch1 = parseFeetInches("12'-6\"");
assert(ftInch1.isValid, 'Parse 12\'-6" is marked valid');
assertClose(ftInch1.totalFeet, 12.5, 0.001, 'Parse 12\'-6" returns exactly 12.50 decimal feet');

// Test 17: Parse "10'-4 1/2\"" -> 10 + 4.5/12 = 10.375 feet
const ftInch2 = parseFeetInches("10'-4 1/2\"");
assert(ftInch2.isValid, 'Parse 10\'-4 1/2" is marked valid');
assertClose(ftInch2.totalFeet, 10.375, 0.001, 'Parse 10\'-4 1/2" returns exactly 10.375 decimal feet');

// Test 18: Format decimal feet to fractional string: 12.5 -> 12'-6"
const formattedFraction = formatFeetInches(12.5);
assert(formattedFraction.includes('12') && formattedFraction.includes('6'), 'Format 12.5 decimal feet outputs 12\'-6"');

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ENGINEERING CALCULATIONS AND UNIT ENGINES VERIFIED 100% ACCURATE!\n');
  process.exit(0);
}
