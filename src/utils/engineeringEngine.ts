/**
 * PB CivilLab — Centralized Engineering Calculation Engine
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * CRITICAL ARCHITECTURAL CONSTITUTION:
 * 1. SINGLE SOURCE OF TRUTH:
 *    USER INPUT -> VALIDATION -> CALCULATION ENGINE -> RAW ENGINEERING RESULTS
 *    -> DISPLAY FORMATTING -> UI / TABLE / PRINT / PDF / EXPORT
 * 2. ZERO INTERMEDIATE ROUNDING:
 *    All intermediate variables maintain full IEEE 754 double precision.
 *    Rounding occurs exclusively at the final presentation layer.
 * 3. NO FABRICATED DATA:
 *    No artificial project names, drawings, or approval statuses.
 */

import { CalculationResult, CalculationTraceStep, EngineeringBasis, ReportProjectMeta, ValidationIssue, CalculationStatus } from '../types';
import { REBAR_WEIGHT_DENOMINATOR, STEEL_DENSITY } from '../constants/engineering';
import { formatNumber, formatCurrency } from './units';

export interface RebarInputParams {
  diameterMm: number;
  lengthPerBarM: number;
  quantity: number;
  ratePerKg?: number;
  formulaType?: 'd2_162' | 'exact_density';
  customDensity?: number;
  currencySymbol?: string;
  projectMeta?: ReportProjectMeta;
}

export interface RebarRawCalculation {
  diameterMm: number;
  lengthPerBarM: number;
  quantity: number;
  ratePerKg: number;
  formulaType: 'd2_162' | 'exact_density';
  customDensity: number;
  unitWeightRaw: number;     // kg/m
  totalLengthRaw: number;    // m
  totalWeightRaw: number;    // kg
  totalTonnesRaw: number;    // metric tonnes
  estimatedCostRaw: number;  // Currency
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Standard factory for returning safely rejected engineering calculation results.
 * Never silently repairs invalid engineering inputs.
 */
export function createInvalidResult(
  title: string,
  issues: ValidationIssue[],
  primaryUnit: string = ''
): CalculationResult {
  return {
    title,
    primaryValue: '—',
    primaryUnit,
    status: 'invalid',
    validationIssues: issues,
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    breakdown: issues.map(i => ({
      step: `Validation Check: ${i.field}`,
      expression: i.code,
      result: i.message,
    })),
    formula: 'Calculation blocked: input parameters violate physical or engineering constraints.',
    substitutedFormula: issues.map(i => i.message).join(' | '),
    inputsSummary: [],
    assumptions: [],
    engineeringNotes: 'Please correct identified parameter errors to evaluate accurate civil engineering computations.',
  };
}

/**
 * Validates rebar input parameters against engineering rules.
 * Prevents NaN, Infinity, zero/negative geometry, and negative rates.
 */
export function validateRebarInputs(
  diameterMm: number,
  lengthPerBarM: number,
  quantity: number,
  ratePerKg: number = 0
): ValidationResult {
  const errors: string[] = [];

  if (isNaN(diameterMm) || diameterMm <= 0) {
    errors.push('Please enter a valid bar diameter greater than 0 mm.');
  } else if (diameterMm > 100) {
    errors.push('Bar diameter exceeds standard rebar specifications (max 100 mm).');
  }

  if (isNaN(lengthPerBarM) || lengthPerBarM <= 0) {
    errors.push('Please enter a valid length per bar greater than 0 m.');
  } else if (lengthPerBarM > 1000) {
    errors.push('Length per bar exceeds practical structural limit (max 1,000 m).');
  }

  if (isNaN(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
    errors.push('Quantity of bars must be a positive whole integer (at least 1 pcs).');
  }

  if (isNaN(ratePerKg) || ratePerKg < 0) {
    errors.push('Unit rate per kg must be zero or a positive number.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Centralized, authoritative calculation engine for Rebar / Steel Weight.
 * Strictly implements full IEEE 754 precision internally.
 */
export function computeRebarCalculation(params: RebarInputParams): CalculationResult {
  const {
    diameterMm,
    lengthPerBarM,
    quantity,
    ratePerKg = 0,
    formulaType = 'd2_162',
    customDensity = STEEL_DENSITY,
    currencySymbol = '৳',
    projectMeta,
  } = params;

  const validation = validateRebarInputs(diameterMm, lengthPerBarM, quantity, ratePerKg);

  if (!validation.isValid) {
    const issues: ValidationIssue[] = validation.errors.map(err => ({
      field: 'rebar',
      severity: 'error',
      code: 'INVALID_REBAR_INPUT',
      message: err,
    }));
    return createInvalidResult('Rebar / Steel Weight Calculation', issues, 'kg');
  }

  const d = diameterMm;
  const l = lengthPerBarM;
  const qty = quantity;
  const rate = ratePerKg;

  // 1. Raw Engineering Calculations (FULL PRECISION - NEVER ROUND INTERMEDIATES)
  let unitWeightRaw = 0;
  let formulaStr = '';
  let substitutedStr = '';

  if (formulaType === 'd2_162') {
    // Exact specification formula: Unit Weight = D² / 162.2
    unitWeightRaw = (d * d) / REBAR_WEIGHT_DENOMINATOR;
    formulaStr = 'W_unit = D² / 162.2 (kg/m)';
    substitutedStr = `W_unit = ${d}² / 162.2 = ${unitWeightRaw.toFixed(8)} kg/m`;
  } else {
    // Exact density method: Area (m²) × Density (kg/m³)
    const areaM2 = (Math.PI * Math.pow(d / 1000, 2)) / 4;
    unitWeightRaw = areaM2 * customDensity;
    formulaStr = 'W_unit = (π × D² / 4) × ρ (kg/m)';
    substitutedStr = `W_unit = (π × (${d}/1000)² / 4) × ${customDensity} = ${unitWeightRaw.toFixed(8)} kg/m`;
  }

  // Total Length = Length per Bar × Quantity
  const totalLengthRaw = l * qty;

  // Total Weight = Unit Weight (Raw) × Total Length
  const totalWeightRaw = unitWeightRaw * totalLengthRaw;

  // Total Tonnes = Total Weight (Raw) ÷ 1,000
  const totalTonnesRaw = totalWeightRaw / 1000;

  // Estimated Cost = Total Weight (Raw) × Rate per kg
  // CRITICAL: Must be calculated from totalWeightRaw, NOT from rounded kg!
  const estimatedCostRaw = totalWeightRaw * rate;

  // 2. Presentation Layer Formatting (ONLY at output, never feed back into arithmetic)
  const unitWeightFormatted = formatNumber(unitWeightRaw, 3);
  const totalLengthFormatted = formatNumber(totalLengthRaw, 2, 2);
  const totalWeightFormatted = formatNumber(totalWeightRaw, 2);
  const totalTonnesFormatted = formatNumber(totalTonnesRaw, 3);
  const estimatedCostFormatted = formatCurrency(estimatedCostRaw, currencySymbol);

  // 3. Transparent Calculation Trace (Mathematical Derivation)
  const calculationTrace: CalculationTraceStep[] = [
    {
      label: 'Unit Weight (Nominal Mass per Meter)',
      formula: formulaType === 'd2_162' ? 'W_unit = D² / 162.2' : 'W_unit = Area × ρ',
      expression: formulaType === 'd2_162'
        ? `${d}² / 162.2`
        : `(π × (${d}/1000)² / 4) × ${customDensity}`,
      result: `${unitWeightRaw.toFixed(8)} kg/m (Display: ${unitWeightFormatted} kg/m)`,
    },
    {
      label: 'Total Cumulative Length',
      formula: 'L_total = Length per Bar × Number of Bars',
      expression: `${l} m × ${qty} pcs`,
      result: `${totalLengthFormatted} m`,
    },
    {
      label: 'Total Theoretical Mass',
      formula: 'W_total = Unit Weight × Total Length',
      expression: `${unitWeightRaw.toFixed(8)} kg/m × ${totalLengthRaw} m`,
      result: `${totalWeightFormatted} kg (Exact: ${totalWeightRaw.toFixed(5)} kg)`,
    },
    {
      label: 'Total Mass in Metric Tonnes',
      formula: 'Tonnes = Total Weight ÷ 1,000',
      expression: `${totalWeightRaw.toFixed(5)} kg ÷ 1,000`,
      result: `${totalTonnesFormatted} t`,
    },
    ...(rate > 0 ? [{
      label: 'Estimated Material Cost',
      formula: 'Cost = Total Weight (Raw) × Rate per kg',
      expression: `${totalWeightRaw.toFixed(5)} kg × ${rate}`,
      result: estimatedCostFormatted,
    }] : []),
  ];

  // 4. Engineering Basis & Verifiable References
  const engineeringBasis: EngineeringBasis = {
    calculationBasis: 'Standard theoretical mass calculation',
    formulaMethod: formulaType === 'd2_162'
      ? 'D² / 162.2 Nominal Construction Formula'
      : 'Cross-Sectional Area × Material Density',
    standardCode: 'Nominal theoretical dimensions per BDS 1313 / ASTM A615 / IS 1786',
    referenceClause: 'Theoretical mass formula (Unit Weight = D² / 162.2 kg/m)',
    materialAssumption: 'Carbon Steel Reinforcement Bar',
    densityConstants: `Steel Density ρ = ${customDensity} kg/m³, REBAR_WEIGHT_DENOMINATOR = ${REBAR_WEIGHT_DENOMINATOR}`,
    toleranceNote:
      'Calculated mass represents theoretical nominal mass based on the selected calculation method. Actual supplied or billed material mass may differ according to the applicable product standard, manufacturing tolerances, manufacturer data and procurement conditions.',
    engineeringNotes:
      'Theoretical nominal rebar mass is intended for engineering estimation, bill of quantities (BOQ), and structural documentation. Actual site dispatches should be verified with certified weighbridge records or mill inspection certificates.',
  };

  // 5. Clean, authoritative inputs summary (NO redundant duplicate inputs)
  const inputsSummary = [
    { label: 'Bar Diameter', value: `${d} mm`, rawValue: d, unit: 'mm' },
    { label: 'Length per Bar', value: `${l} m`, rawValue: l, unit: 'm' },
    { label: 'Number of Bars', value: `${qty} pcs`, rawValue: qty, unit: 'pcs' },
    ...(rate > 0 ? [{ label: 'Rate per kg', value: formatCurrency(rate, currencySymbol), rawValue: rate, unit: `${currencySymbol}/kg` }] : []),
  ];

  const secondaryValues = [
    { label: 'Total Tonnes', value: totalTonnesFormatted, unit: 't', rawValue: totalTonnesRaw },
    { label: 'Unit Weight', value: unitWeightFormatted, unit: 'kg/m', rawValue: unitWeightRaw },
    { label: 'Total Length', value: totalLengthFormatted, unit: 'm', rawValue: totalLengthRaw },
    ...(rate > 0 ? [{ label: 'Estimated Cost', value: estimatedCostFormatted, rawValue: estimatedCostRaw }] : []),
  ];

  return {
    title: 'Rebar / Steel Weight Calculation',
    primaryValue: totalWeightFormatted,
    primaryUnit: 'kg',
    status: 'valid',
    validationIssues: [],
    primaryCategory: 'mass',
    primaryRawValue: totalWeightRaw,
    secondaryValues,
    breakdown: calculationTrace.map(t => ({
      step: t.label,
      expression: t.expression,
      result: t.result,
    })),
    formula: formulaStr,
    substitutedFormula: substitutedStr,
    inputsSummary,
    assumptions: [
      { label: 'Calculation Method', value: engineeringBasis.calculationBasis },
      { label: 'Formula / Denominator', value: formulaType === 'd2_162' ? `D² / ${REBAR_WEIGHT_DENOMINATOR} (kg/m)` : `Area × ${customDensity} kg/m³` },
      { label: 'Steel Density', value: `${customDensity} kg/m³` },
      { label: 'Tolerance Note', value: engineeringBasis.toleranceNote || '' },
    ],
    engineeringNotes: engineeringBasis.engineeringNotes,
    dimensionValidation: {
      isValid: validation.isValid,
      message: validation.errors.join(' '),
    },
    rawValues: {
      unitWeightRaw,
      totalLengthRaw,
      totalWeightRaw,
      totalTonnesRaw,
      estimatedCostRaw,
      diameterMm: d,
      lengthPerBarM: l,
      quantity: qty,
      ratePerKg: rate,
    },
    calculationTrace,
    engineeringBasis,
    projectMeta,
  };
}
