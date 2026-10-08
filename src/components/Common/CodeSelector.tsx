import React from 'react';
import { BookOpen, ShieldCheck, Check, Layers, Scale, Info, Globe } from 'lucide-react';
import { CalculationResult } from '../../types';
import { formatNumber } from '../../utils/units';
import { DENSITIES } from '../../constants/engineering';

/**
 * Supported governing Civil Engineering Building Codes
 */
export type BuildingCode = 'BNBC_2020' | 'ACI_318' | 'IS_456';

export interface BuildingCodeMetadata {
  id: BuildingCode;
  codeName: string;
  fullName: string;
  organization: string;
  region: string;
  flagEmoji: string;
  strengthBasis: 'cylinder' | 'cube';
  dryVolumeFactor: number;
  safetyFactorConcrete: number; // Limit state partial safety factor or strength reduction factor
  safetyFactorSteel: number;
  designCompressiveStressFactor: string; // e.g., 0.85*f'c or 0.446*fck
  defaultBagWeightKg: number;
  maxWcRatioTypical: number;
  governingStandardClause: string;
  notes: string;
}

/**
 * Standard parameters and empirical factors per governing standard
 */
export const BUILDING_CODES_DATA: Record<BuildingCode, BuildingCodeMetadata> = {
  BNBC_2020: {
    id: 'BNBC_2020',
    codeName: 'BNBC 2020',
    fullName: 'Bangladesh National Building Code 2020',
    organization: 'Housing and Building Research Institute (HBRI) / PWD',
    region: 'Bangladesh & South Asia',
    flagEmoji: '🇧🇩',
    strengthBasis: 'cylinder',
    dryVolumeFactor: 1.54, // Standard 54% void allowance for compacted aggregates
    safetyFactorConcrete: 0.65, // Strength Reduction Factor phi for compression (tied members)
    safetyFactorSteel: 0.90, // Strength Reduction Factor phi for tension-controlled flexure
    designCompressiveStressFactor: '0.85 × f\'c (Whitney Stress Block)',
    defaultBagWeightKg: 50,
    maxWcRatioTypical: 0.45,
    governingStandardClause: 'BNBC 2020 Part 6, Chapter 5 & 6 (Concrete & Mix Design)',
    notes: 'Based on cylinder compressive strength (150 mm × 300 mm). Prescribes standard dry volume factor of 1.54 for nominal and site mixes with 50 kg cement bags.',
  },
  ACI_318: {
    id: 'ACI_318',
    codeName: 'ACI 318-19 / 318-14',
    fullName: 'Building Code Requirements for Structural Concrete (ACI 318)',
    organization: 'American Concrete Institute (ACI)',
    region: 'USA, Americas & Middle East',
    flagEmoji: '🇺🇸',
    strengthBasis: 'cylinder',
    dryVolumeFactor: 1.52, // Standard aggregate dry void index per ACI 211.1
    safetyFactorConcrete: 0.65, // phi = 0.65 (tied columns) / 0.75 (spirals)
    safetyFactorSteel: 0.90, // phi = 0.90 (tension controlled)
    designCompressiveStressFactor: '0.85 × f\'c (ACI Equivalent Rectangular Stress Block)',
    defaultBagWeightKg: 50, // Metric project standard (or 94 lb / 42.6 kg in US Customary)
    maxWcRatioTypical: 0.40,
    governingStandardClause: 'ACI 318-19 Section 19.2 (Concrete Properties) & ACI 211.1 (Proportioning)',
    notes: 'Governed by specified 28-day cylinder compressive strength (f\'c). Uses strength reduction factors (phi). Dry loose volumetric allowance standard: 1.52.',
  },
  IS_456: {
    id: 'IS_456',
    codeName: 'IS 456:2000',
    fullName: 'Plain and Reinforced Concrete — Code of Practice (Fourth Revision)',
    organization: 'Bureau of Indian Standards (BIS)',
    region: 'India & South Asia',
    flagEmoji: '🇮🇳',
    strengthBasis: 'cube',
    dryVolumeFactor: 1.55, // Standard Indian PWD / CPWD dry volume allowance (55% extra)
    safetyFactorConcrete: 1.50, // Partial Safety Factor for Material gamma_m = 1.50
    safetyFactorSteel: 1.15, // Partial Safety Factor for Material gamma_m = 1.15
    designCompressiveStressFactor: '0.446 × fck (0.67 × fck / 1.50)',
    defaultBagWeightKg: 50,
    maxWcRatioTypical: 0.50,
    governingStandardClause: 'IS 456:2000 Clause 36.4.2 (Partial Safety Factors) & IS 10262 (Mix Design)',
    notes: 'Governed by characteristic 28-day 150 mm cube compressive strength (fck). Uses material safety factor gamma_m = 1.50. Standard dry volume factor is 1.55 (1.52 - 1.57).',
  },
};

export interface CodeSelectorProps {
  selectedCode: BuildingCode;
  onChange: (code: BuildingCode) => void;
  variant?: 'cards' | 'segmented' | 'compact';
  showDetails?: boolean;
  className?: string;
}

/**
 * Professional Code Selector component for PB CivilLab.
 * Enables site engineers to toggle between governing building codes with real-time specification badges.
 */
export const CodeSelector: React.FC<CodeSelectorProps> = ({
  selectedCode,
  onChange,
  variant = 'cards',
  showDetails = true,
  className = '',
}) => {
  const currentMeta = BUILDING_CODES_DATA[selectedCode];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Governing Building Standard
        </label>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
          {currentMeta.strengthBasis === 'cylinder' ? "Cylinder f'c Basis" : 'Cube fck Basis'}
        </span>
      </div>

      {/* Segmented / Cards Selector */}
      {variant === 'segmented' ? (
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#151C2B] border border-slate-200 dark:border-white/10">
          {(Object.keys(BUILDING_CODES_DATA) as BuildingCode[]).map((codeKey) => {
            const isSelected = selectedCode === codeKey;
            const item = BUILDING_CODES_DATA[codeKey];
            return (
              <button
                key={codeKey}
                type="button"
                onClick={() => onChange(codeKey)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 touch-manipulation min-h-[44px] ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>{item.flagEmoji}</span>
                  <span>{item.codeName}</span>
                </span>
                <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900/80 font-bold' : 'text-slate-400'}`}>
                  Factor: {item.dryVolumeFactor}
                </span>
              </button>
            );
          })}
        </div>
      ) : variant === 'compact' ? (
        <div className="relative">
          <select
            value={selectedCode}
            onChange={(e) => onChange(e.target.value as BuildingCode)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50 appearance-none font-mono min-h-[44px]"
          >
            {(Object.keys(BUILDING_CODES_DATA) as BuildingCode[]).map((codeKey) => {
              const item = BUILDING_CODES_DATA[codeKey];
              return (
                <option key={codeKey} value={codeKey}>
                  {item.flagEmoji} {item.codeName} — {item.fullName} (Dry Factor: {item.dryVolumeFactor})
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        /* Cards Variant (Default) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(Object.keys(BUILDING_CODES_DATA) as BuildingCode[]).map((codeKey) => {
            const isSelected = selectedCode === codeKey;
            const item = BUILDING_CODES_DATA[codeKey];
            return (
              <div
                key={codeKey}
                onClick={() => onChange(codeKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(codeKey);
                  }
                }}
                className={`relative p-3 rounded-xl border transition-all cursor-pointer text-left touch-manipulation min-h-[52px] ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/15 ring-2 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span className="text-sm">{item.flagEmoji}</span>
                    <span>{item.codeName}</span>
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                  {item.fullName}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Dry Factor:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.dryVolumeFactor}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Code Specification Details Banner */}
      {showDetails && (
        <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#151C2A] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px]">
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              <span>{currentMeta.fullName}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {currentMeta.region}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-slate-200/80 dark:border-white/5 text-[10px] font-mono">
            <div>
              <span className="text-slate-400 block">Dry Volume Factor</span>
              <strong className="text-cyan-600 dark:text-cyan-300 text-xs">{currentMeta.dryVolumeFactor}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">
                {currentMeta.strengthBasis === 'cylinder' ? 'Strength Red. (ϕ)' : 'Material Factor (γm)'}
              </span>
              <strong className="text-slate-900 dark:text-slate-100 text-xs">
                {currentMeta.strengthBasis === 'cylinder' ? `ϕ = ${currentMeta.safetyFactorConcrete}` : `γm = ${currentMeta.safetyFactorConcrete}`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Strength Basis</span>
              <strong className="text-slate-900 dark:text-slate-100 text-xs uppercase">{currentMeta.strengthBasis}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Max w/c Ratio</span>
              <strong className="text-slate-900 dark:text-slate-100 text-xs">{currentMeta.maxWcRatioTypical}</strong>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-white/5 italic leading-relaxed">
            <span className="font-bold not-italic text-slate-700 dark:text-slate-300">Clause Reference: </span>
            {currentMeta.governingStandardClause}
          </p>
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// CONCRETE CALCULATION FUNCTION ADJUSTED DYNAMICALLY BY GOVERNING BUILDING CODE
// ==============================================================================

export interface CodeCompliantConcreteParams {
  wetVolumeM3: number;
  mixRatio: { cement: number; sand: number; aggregate: number };
  code: BuildingCode;
  specifiedStrengthMpa?: number; // f'c (cylinder for BNBC/ACI) or fck (cube for IS 456)
  wastagePct?: number;
  cementBagWeightKg?: number;
}

/**
 * Authoritative concrete material calculation function that accepts a governing building code.
 *
 * Dynamically adjusts:
 * 1. Dry Volume Factor:
 *    - BNBC 2020: 1.54 (54% extra for dry bulk voids)
 *    - ACI 318:   1.52 (Absolute volume void factor per ACI 211.1)
 *    - IS 456:    1.55 (Standard Indian Standard CPWD volumetric multiplier)
 * 2. Design Compressive Strengths & Safety Factors:
 *    - BNBC 2020: Cylinder basis f'c with phi = 0.65; design stress block = 0.85 * f'c
 *    - ACI 318:   Cylinder basis f'c with phi = 0.65; design stress block = 0.85 * f'c
 *    - IS 456:    Cube basis fck with gamma_m = 1.50; design compressive strength = 0.446 * fck
 * 3. Water-Cement Ratio and Durability Checks
 */
export function calculateCodeCompliantConcrete({
  wetVolumeM3,
  mixRatio,
  code,
  specifiedStrengthMpa = 20,
  wastagePct = 3,
  cementBagWeightKg,
}: CodeCompliantConcreteParams): CalculationResult {
  const codeMeta = BUILDING_CODES_DATA[code];
  const wetVol = Math.max(0, wetVolumeM3);
  const waste = Math.max(0, wastagePct);
  const bagSize = cementBagWeightKg || codeMeta.defaultBagWeightKg;

  // 1. DYNAMIC FACTOR ADJUSTMENT BASED ON SELECTED CODE
  const dryFactor = codeMeta.dryVolumeFactor;
  const dryVolumeM3 = wetVol * dryFactor * (1 + waste / 100);

  // 2. RATIO COMPUTATION
  const sumRatio = mixRatio.cement + mixRatio.sand + mixRatio.aggregate;
  const cementVolM3 = dryVolumeM3 * (mixRatio.cement / sumRatio);
  const sandVolM3 = dryVolumeM3 * (mixRatio.sand / sumRatio);
  const aggregateVolM3 = dryVolumeM3 * (mixRatio.aggregate / sumRatio);

  // 3. MASSES AND BAGS
  const cementMassKg = cementVolM3 * DENSITIES.cement;
  const cementBags = cementMassKg / bagSize;

  // 4. IMPERIAL CONVERSIONS (CFT)
  const sandCFT = sandVolM3 * 35.3147;
  const aggCFT = aggregateVolM3 * 35.3147;

  // 5. CODE-SPECIFIC DESIGN STRENGTH & SAFETY FACTOR CONVERSIONS
  let designStrengthMpa = 0;
  let strengthEquationDesc = '';
  let standardReferenceStrength = '';

  if (codeMeta.strengthBasis === 'cylinder') {
    // BNBC 2020 & ACI 318: Cylinder Strength f'c
    // Design compressive strength block = 0.85 * f'c
    // Factored nominal capacity factor = phi * 0.85 * f'c
    const phi = codeMeta.safetyFactorConcrete; // 0.65
    designStrengthMpa = phi * 0.85 * specifiedStrengthMpa;
    strengthEquationDesc = `f_cd = ϕ × 0.85 × f'c = ${phi} × 0.85 × ${specifiedStrengthMpa} MPa`;
    standardReferenceStrength = `${specifiedStrengthMpa} MPa (28-day 150×300 mm Cylinder f'c)`;
  } else {
    // IS 456:2000: Cube Strength fck (150 mm cube)
    // Design compressive strength = 0.67 * fck / gamma_m = 0.67 * fck / 1.5 = 0.446 * fck
    const gammaM = codeMeta.safetyFactorConcrete; // 1.50
    designStrengthMpa = (0.67 * specifiedStrengthMpa) / gammaM;
    strengthEquationDesc = `f_cd = (0.67 × fck) / γm = (0.67 × ${specifiedStrengthMpa}) / ${gammaM}`;
    standardReferenceStrength = `${specifiedStrengthMpa} MPa (28-day 150 mm Cube fck)`;
  }

  // Estimated mixing water based on code maximum allowable water-cement ratio
  const maxWcRatio = codeMeta.maxWcRatioTypical;
  const waterLiters = cementMassKg * maxWcRatio;

  return {
    title: `Concrete Material Estimation (${codeMeta.codeName})`,
    primaryValue: formatNumber(cementBags, 1),
    primaryUnit: `Bags (${bagSize} kg)`,
    primaryCategory: 'Concrete Technology',
    secondaryValues: [
      {
        label: 'Cement Total Mass',
        value: `${formatNumber(cementMassKg, 0)} kg (${formatNumber(cementBags, 2)} bags)`,
      },
      {
        label: 'Fine Aggregate (Sand)',
        value: `${formatNumber(sandCFT, 1)} CFT (${formatNumber(sandVolM3, 3)} m³)`,
      },
      {
        label: 'Coarse Aggregate (Stone)',
        value: `${formatNumber(aggCFT, 1)} CFT (${formatNumber(aggregateVolM3, 3)} m³)`,
      },
      {
        label: 'Design Strength (f_cd)',
        value: `${formatNumber(designStrengthMpa, 2)} MPa (${codeMeta.codeName})`,
      },
      {
        label: `Max Water @ w/c ${maxWcRatio}`,
        value: `${formatNumber(waterLiters, 0)} Liters (Max permissible)`,
      },
    ],
    breakdown: [
      {
        step: `1. Code Dry Factor (${codeMeta.codeName})`,
        expression: `${wetVol} m³ wet × ${dryFactor} (${codeMeta.codeName} factor) × (1 + ${waste}%)`,
        result: `${formatNumber(dryVolumeM3, 3)} m³ Dry Volume`,
      },
      {
        step: '2. Volumetric Proportion Sum',
        expression: `${mixRatio.cement} + ${mixRatio.sand} + ${mixRatio.aggregate}`,
        result: `${sumRatio} parts`,
      },
      {
        step: `3. Cement Requirement`,
        expression: `(${mixRatio.cement}/${sumRatio}) × ${formatNumber(dryVolumeM3, 3)} m³ × ${DENSITIES.cement} kg/m³ ÷ ${bagSize} kg`,
        result: `${formatNumber(cementBags, 2)} Bags (${bagSize} kg)`,
      },
      {
        step: `4. Design Concrete Strength`,
        expression: strengthEquationDesc,
        result: `${formatNumber(designStrengthMpa, 2)} MPa`,
      },
      {
        step: `5. Durability Water Limit (${codeMeta.codeName})`,
        expression: `${formatNumber(cementMassKg, 1)} kg cement × ${maxWcRatio} max w/c`,
        result: `${formatNumber(waterLiters, 0)} Liters`,
      },
    ],
    formula: `V_dry = V_wet × DryFactor_${code} × (1 + Waste%) | f_cd per ${codeMeta.governingStandardClause}`,
    substitutedFormula: `V_dry = ${wetVol} × ${dryFactor} × (1 + ${waste}/100) = ${formatNumber(dryVolumeM3, 3)} m³`,
    inputsSummary: [
      { label: 'Governing Code', value: `${codeMeta.codeName} (${codeMeta.region})` },
      { label: 'Wet Concrete Volume', value: `${wetVol} m³ (${formatNumber(wetVol * 35.3147, 1)} CFT)` },
      { label: 'Mix Proportion (C:S:A)', value: `${mixRatio.cement} : ${mixRatio.sand} : ${mixRatio.aggregate}` },
      { label: 'Selected Dry Volume Factor', value: `${dryFactor} (${codeMeta.codeName})` },
      { label: 'Specified Strength', value: standardReferenceStrength },
      { label: 'Wastage Allowance', value: `${waste}%` },
      { label: 'Cement Bag Mass', value: `${bagSize} kg` },
    ],
    assumptions: [
      {
        label: 'Dry Factor Rationale',
        value: `${codeMeta.codeName} standard multiplier (${dryFactor}) accounts for dry loose void compaction and paste occupation.`,
      },
      {
        label: 'Strength Formulation',
        value: `${codeMeta.codeName} design strength basis: ${codeMeta.designCompressiveStressFactor}.`,
      },
      {
        label: 'Cement Density',
        value: `${DENSITIES.cement} kg/m³ standard bulk loose Portland cement.`,
      },
    ],
    engineeringNotes: `Computed under ${codeMeta.fullName}. For critical structural components, field trial mixes must be crushed in a certified testing laboratory adhering to ${codeMeta.governingStandardClause}.`,
    engineeringBasis: {
      calculationBasis: `Code-Compliant Material Volumetric Proportioning (${codeMeta.codeName})`,
      formulaMethod: `Dry Factor ${dryFactor} + Limit State Safety Factor (${codeMeta.safetyFactorConcrete})`,
      standardCode: codeMeta.fullName,
      referenceClause: codeMeta.governingStandardClause,
      materialAssumption: `Classified Portland Cement (BDS EN 197-1 / ASTM C150 / IS 269), Zone II Sand, 20mm Down Aggregate`,
      densityConstants: `Cement: ${DENSITIES.cement} kg/m³; Water: 1000 kg/m³`,
      toleranceNote: `Actual yield on site varies ±2-3% depending on aggregate moisture content, absorption, and batching accuracy.`,
    },
    isPreliminary: false,
  };
}
