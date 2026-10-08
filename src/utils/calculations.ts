import { CalculationResult, SurveyLevelRow } from '../types';
import { DENSITIES, REBAR_STANDARD_DATA, REBAR_WEIGHT_DENOMINATOR, STEEL_DENSITY } from '../constants/engineering';
import { formatNumber, formatCurrency } from './units';
import { computeRebarCalculation } from './engineeringEngine';

// ==========================================
// 1. REBAR / STEEL WEIGHT & COST (SINGLE SOURCE OF TRUTH)
// ==========================================
export function calculateRebarWeight(
  diameterMm: number,
  lengthM: number,
  quantity: number = 1,
  ratePerKg: number = 0,
  formulaType: 'd2_162' | 'exact_density' = 'd2_162',
  customDensity: number = STEEL_DENSITY
): CalculationResult {
  return computeRebarCalculation({
    diameterMm,
    lengthPerBarM: lengthM,
    quantity,
    ratePerKg,
    formulaType,
    customDensity,
  });
}

// ==========================================
// 2. BAR BENDING SCHEDULE (BBS) HELPER
// ==========================================
export function calculateBBS(
  barDiaMm: number,
  shapeType: 'straight' | 'l_bar' | 'u_bar' | 'rect_stirrup' | 'column_tie',
  dims: { a: number; b?: number; c?: number; hook?: number },
  count: number = 1,
  ratePerKg: number = 0
): CalculationResult {
  const d = Math.max(1, barDiaMm);
  const a = Math.max(0, dims.a);
  const b = dims.b ? Math.max(0, dims.b) : 0;
  const c = dims.c ? Math.max(0, dims.c) : 0;
  const hook = dims.hook !== undefined ? dims.hook : 10 * d; // default 10d hook if applicable
  const qty = Math.max(1, count);

  let cutLengthMm = 0;
  let formulaDesc = '';

  // Bend deduction guidelines (BS 8666 / IS 2502):
  // 90° bend deduction = 2d
  // 135° hook deduction / allowance = 24d or 10d per hook
  switch (shapeType) {
    case 'straight':
      cutLengthMm = a;
      formulaDesc = 'L_cut = A';
      break;
    case 'l_bar':
      // A + B - 1*(2d) bend deduction
      cutLengthMm = a + b - 2 * d;
      formulaDesc = 'L_cut = A + B - 1×(2d) [90° bend deduction]';
      break;
    case 'u_bar':
      // A + B + C - 2*(2d)
      cutLengthMm = a + b + c - 4 * d;
      formulaDesc = 'L_cut = A + B + C - 2×(2d) [Two 90° bends]';
      break;
    case 'rect_stirrup':
    case 'column_tie':
      // 2*(A+B) + 2*hook - 3*90deg(2d) - 2*135deg(3d)
      // Standard practical formula: 2*(A + B) + 2*(10d or 12d hook) - 5 bends
      const hookLen = Math.max(75, 10 * d); // minimum 75mm hook
      cutLengthMm = 2 * (a + b) + 2 * hookLen - (3 * (2 * d) + 2 * (3 * d));
      formulaDesc = 'L_cut = 2×(A + B) + 2×Hook - Bend Deductions [3×2d + 2×3d]';
      break;
  }

  cutLengthMm = Math.max(0, cutLengthMm);
  const cutLengthM = cutLengthMm / 1000;
  const totalLengthM = cutLengthM * qty;
  const unitWeightKgM = (d * d) / 162.2;
  const totalWeightKg = unitWeightKgM * totalLengthM;
  const totalCost = totalWeightKg * ratePerKg;

  return {
    title: 'Bar Bending Schedule (BBS) Cutting Length',
    primaryValue: formatNumber(cutLengthM, 3),
    primaryUnit: 'm / bar',
    secondaryValues: [
      { label: 'Cutting Length (mm)', value: `${formatNumber(cutLengthMm, 0)} mm` },
      { label: 'Total Steel Weight', value: `${formatNumber(totalWeightKg, 2)} kg` },
      { label: 'Total Length', value: `${formatNumber(totalLengthM, 2)} m` },
      ...(ratePerKg > 0 ? [{ label: 'Total Cost', value: formatCurrency(totalCost) }] : []),
    ],
    breakdown: [
      { step: '1. Theoretical Shape Perimeter', expression: `${shapeType.toUpperCase()}`, result: `${formatNumber(cutLengthMm, 1)} mm` },
      { step: '2. Cut Length per Single Bar', expression: `${cutLengthMm} mm ÷ 1000`, result: `${formatNumber(cutLengthM, 3)} m` },
      { step: '3. Total Length for Batch', expression: `${formatNumber(cutLengthM, 3)} m × ${qty} pcs`, result: `${formatNumber(totalLengthM, 2)} m` },
      { step: '4. Theoretical Total Weight', expression: `${formatNumber(totalLengthM, 2)} m × (${d}²/162.2 kg/m)`, result: `${formatNumber(totalWeightKg, 2)} kg` },
    ],
    formula: formulaDesc,
    substitutedFormula: `Cut Length = ${formatNumber(cutLengthM, 3)} m (${formatNumber(cutLengthMm, 0)} mm)`,
    inputsSummary: [
      { label: 'Bar Diameter', value: `${d} mm` },
      { label: 'Shape Type', value: shapeType.replace('_', ' ').toUpperCase() },
      { label: 'Dimension A', value: `${a} mm` },
      ...(dims.b ? [{ label: 'Dimension B', value: `${dims.b} mm` }] : []),
      ...(dims.c ? [{ label: 'Dimension C', value: `${dims.c} mm` }] : []),
      { label: 'Number of Bars', value: `${qty} pcs` },
    ],
    assumptions: [
      { label: 'Bend Deductions', value: '90° bend = 2d; 135° stirrup hook = 3d deduction with minimum 10d (≥75mm) hook length.' },
      { label: 'Clear Cover', value: 'Inputs A and B are assumed to be out-to-out dimensions of the bent rebar (after deducting cover).' },
    ],
    engineeringNotes: 'For actual BBS fabrication and bending on site, adhere to the approved structural detailing drawings (BS 8666 / IS 2502 / ACI 318) and confirm pin diameters on bending machines.',
    isPreliminary: true,
  };
}

// ==========================================
// 3. CONCRETE VOLUME CALCULATOR
// ==========================================
export function calculateConcreteVolume(
  shape: 'slab' | 'beam' | 'rect_column' | 'circ_column' | 'footing_trapezoid' | 'custom_box',
  params: {
    lengthM?: number;
    widthM?: number;
    depthM?: number;
    heightM?: number;
    diameterMm?: number;
    topLengthM?: number;
    topWidthM?: number;
    bottomHeightM?: number;
    trapezoidHeightM?: number;
    quantity?: number;
  }
): CalculationResult {
  const qty = Math.max(1, params.quantity || 1);
  let volM3Single = 0;
  let formulaStr = '';
  let substitutedStr = '';

  switch (shape) {
    case 'slab':
    case 'custom_box': {
      const l = params.lengthM || 0;
      const w = params.widthM || 0;
      const t = params.depthM || 0;
      volM3Single = l * w * t;
      formulaStr = 'V = Length × Width × Thickness';
      substitutedStr = `V = ${l} × ${w} × ${t} = ${formatNumber(volM3Single, 4)} m³`;
      break;
    }
    case 'beam': {
      const l = params.lengthM || 0;
      const w = params.widthM || 0;
      const d = params.depthM || 0;
      volM3Single = l * w * d;
      formulaStr = 'V = Length × Width × Depth';
      substitutedStr = `V = ${l} × ${w} × ${d} = ${formatNumber(volM3Single, 4)} m³`;
      break;
    }
    case 'rect_column': {
      const w = params.widthM || 0;
      const d = params.depthM || 0;
      const h = params.heightM || 0;
      volM3Single = w * d * h;
      formulaStr = 'V = Width × Depth × Height';
      substitutedStr = `V = ${w} × ${d} × ${h} = ${formatNumber(volM3Single, 4)} m³`;
      break;
    }
    case 'circ_column': {
      const diaM = (params.diameterMm || 0) / 1000;
      const h = params.heightM || 0;
      const r = diaM / 2;
      volM3Single = Math.PI * r * r * h;
      formulaStr = 'V = π × (D / 2)² × Height';
      substitutedStr = `V = π × (${diaM} / 2)² × ${h} = ${formatNumber(volM3Single, 4)} m³`;
      break;
    }
    case 'footing_trapezoid': {
      // Sloped isolated footing: Lower box + Upper truncated pyramid
      const L1 = params.lengthM || 0;
      const B1 = params.widthM || 0;
      const h1 = params.bottomHeightM || 0; // vertical edge height

      const L2 = params.topLengthM || 0;
      const B2 = params.topWidthM || 0;
      const h2 = params.trapezoidHeightM || 0; // sloped height

      const V_bottom = L1 * B1 * h1;
      const A1 = L1 * B1;
      const A2 = L2 * B2;
      const V_slope = (h2 / 3) * (A1 + A2 + Math.sqrt(A1 * A2));

      volM3Single = V_bottom + V_slope;
      formulaStr = 'V = (L1 × B1 × h1) + [h2/3 × (A1 + A2 + √(A1 × A2))]';
      substitutedStr = `V = (${L1}×${B1}×${h1}) + [${h2}/3 × (${formatNumber(A1, 2)} + ${formatNumber(A2, 2)} + √(${formatNumber(A1 * A2, 2)}))] = ${formatNumber(volM3Single, 4)} m³`;
      break;
    }
  }

  const totalVolM3 = volM3Single * qty;
  const totalVolCFT = totalVolM3 * 35.314667;

  return {
    title: 'Concrete Wet Volume Result',
    primaryValue: formatNumber(totalVolM3, 3),
    primaryUnit: 'm³',
    secondaryValues: [
      { label: 'Volume in CFT', value: formatNumber(totalVolCFT, 2), unit: 'CFT' },
      { label: 'Total Members', value: `${qty} pcs` },
      { label: 'Estimated Concrete Mass', value: formatNumber(totalVolM3 * DENSITIES.concrete, 0), unit: 'kg' },
    ],
    breakdown: [
      { step: '1. Single Member Volume', expression: formulaStr, result: `${formatNumber(volM3Single, 4)} m³` },
      { step: '2. Multiplied by Quantity', expression: `${formatNumber(volM3Single, 4)} m³ × ${qty}`, result: `${formatNumber(totalVolM3, 3)} m³` },
      { step: '3. Imperial Conversion (CFT)', expression: `${formatNumber(totalVolM3, 3)} m³ × 35.3147 CFT/m³`, result: `${formatNumber(totalVolCFT, 2)} CFT` },
    ],
    formula: formulaStr,
    substitutedFormula: substitutedStr,
    inputsSummary: [
      { label: 'Shape / Member', value: shape.replace('_', ' ').toUpperCase() },
      { label: 'Quantity', value: `${qty} pcs` },
    ],
    assumptions: [
      { label: 'Wet Volume', value: 'Represents finished compacted wet concrete volume in formwork.' },
      { label: 'Conversion Constant', value: '1 m³ = 35.314667 CFT (Cubic Feet)' },
    ],
    engineeringNotes: 'Add 2% to 5% allowance for pumping pipeline hold-up, uneven excavation surfaces, or formwork deflection on site.',
  };
}

// ==========================================
// 4. CONCRETE MATERIAL MIX (CEMENT, SAND, AGGREGATE)
// ==========================================
export function calculateConcreteMix(
  wetVolM3: number,
  ratioC: number = 1,
  ratioS: number = 1.5,
  ratioA: number = 3,
  dryFactor: number = 1.54,
  bagSizeKg: number = 50,
  wastagePct: number = 3,
  cementDensity: number = DENSITIES.cement
): CalculationResult {
  const wetVol = Math.max(0, wetVolM3);
  const factor = Math.max(1, dryFactor);
  const waste = Math.max(0, wastagePct);
  const bagSize = Math.max(1, bagSizeKg);

  // Dry Volume including wastage
  const dryVolM3 = wetVol * factor * (1 + waste / 100);
  const sumRatio = ratioC + ratioS + ratioA;

  // Material Volumes
  const cementVolM3 = dryVolM3 * (ratioC / sumRatio);
  const sandVolM3 = dryVolM3 * (ratioS / sumRatio);
  const aggVolM3 = dryVolM3 * (ratioA / sumRatio);

  // Masses and Bags
  const cementMassKg = cementVolM3 * cementDensity;
  const cementBags = cementMassKg / bagSize;

  // Imperial CFT
  const sandCFT = sandVolM3 * 35.3147;
  const aggCFT = aggVolM3 * 35.3147;
  const cementCFT = cementVolM3 * 35.3147;

  // Water estimation (approx w/c 0.45 to 0.50)
  const estWaterLiters = cementMassKg * 0.45;

  return {
    title: 'Concrete Material Mix Estimation',
    primaryValue: formatNumber(cementBags, 1),
    primaryUnit: bagSize === 50 ? 'Bags (50 kg)' : `Bags (${bagSize % 1 === 0 ? bagSize : bagSize.toFixed(1)} kg)`,
    secondaryValues: [
      { label: 'Cement Total Mass', value: `${formatNumber(cementMassKg, 0)} kg (${formatNumber(cementBags, 2)} bags)` },
      { label: 'Sand Volume', value: `${formatNumber(sandCFT, 1)} CFT (${formatNumber(sandVolM3, 3)} m³)` },
      { label: 'Coarse Aggregate', value: `${formatNumber(aggCFT, 1)} CFT (${formatNumber(aggVolM3, 3)} m³)` },
      { label: 'Estimated Mixing Water', value: `${formatNumber(estWaterLiters, 0)} Liters (w/c ≈ 0.45)` },
    ],
    breakdown: [
      { step: '1. Wet to Dry Volume Factor', expression: `${wetVol} m³ × ${factor} (dry factor) × (1 + ${waste}%)`, result: `${formatNumber(dryVolM3, 3)} m³ dry volume` },
      { step: '2. Sum of Ratio Parts', expression: `${ratioC} + ${ratioS} + ${ratioA}`, result: `${sumRatio}` },
      { step: '3. Cement Volume & Bags', expression: `(${ratioC}/${sumRatio}) × ${formatNumber(dryVolM3, 3)} m³ × ${cementDensity} kg/m³ ÷ ${bagSize} kg`, result: `${formatNumber(cementBags, 2)} Bags (${bagSize % 1 === 0 ? bagSize : bagSize.toFixed(1)} kg)` },
      { step: '4. Sand Volume (Fine Aggregate)', expression: `(${ratioS}/${sumRatio}) × ${formatNumber(dryVolM3, 3)} m³ × 35.3147 CFT/m³`, result: `${formatNumber(sandCFT, 2)} CFT` },
      { step: '5. Stone / Brick Aggregate', expression: `(${ratioA}/${sumRatio}) × ${formatNumber(dryVolM3, 3)} m³ × 35.3147 CFT/m³`, result: `${formatNumber(aggCFT, 2)} CFT` },
    ],
    formula: 'V_dry = V_wet × DryFactor × (1 + Wastage%) | Material = V_dry × (Part / TotalParts)',
    substitutedFormula: `V_dry = ${wetVol} × ${factor} × 1.0${waste} = ${formatNumber(dryVolM3, 3)} m³`,
    inputsSummary: [
      { label: 'Wet Concrete Volume', value: `${wetVol} m³ (${formatNumber(wetVol * 35.3147, 1)} CFT)` },
      { label: 'Mix Proportion (C:S:A)', value: `${ratioC} : ${ratioS} : ${ratioA}` },
      { label: 'Dry Volume Factor', value: `${factor}` },
      { label: 'Wastage Allowance', value: `${waste}%` },
      { label: 'Cement Bag Mass', value: `${bagSize % 1 === 0 ? bagSize : bagSize.toFixed(1)} kg` },
    ],
    assumptions: [
      { label: 'Cement Bulk Density', value: `${cementDensity} kg/m³ (~1.44 g/cm³ standard loose cement)` },
      { label: 'Dry Factor', value: `${factor} (standard void allowance for aggregates compacted with paste)` },
      { label: 'Mix Designation', value: 'Nominal Mix estimate. Does not guarantee specific characteristic compressive strength (fck) without trial mix design.' },
    ],
    engineeringNotes: 'IMPORTANT: Nominal mix ratios (e.g. 1:1.5:3 or 1:2:4) are empirical guidelines. For high-rise or code-critical civil structures, a laboratory Concrete Mix Design (IS 10262 / ACI 211 / BS EN 206) considering aggregate grading, moisture content, and target standard deviation must be performed.',
    isPreliminary: true,
  };
}

// ==========================================
// 5. BRICKWORK & MORTAR ESTIMATOR
// ==========================================
export function calculateBrickwork(
  wallLengthM: number,
  wallHeightM: number,
  wallThicknessM: number,
  brickL_Mm: number = 241.3,
  brickW_Mm: number = 114.3,
  brickH_Mm: number = 69.85,
  mortarJointMm: number = 10,
  openingsAreaM2: number = 0,
  mortarRatioC: number = 1,
  mortarRatioS: number = 5,
  wastagePct: number = 5
): CalculationResult {
  const l = Math.max(0, wallLengthM);
  const h = Math.max(0, wallHeightM);
  const t = Math.max(0, wallThicknessM);

  const grossWallVolM3 = l * h * t;
  const deductionVolM3 = Math.max(0, openingsAreaM2) * t;
  const netWallVolM3 = Math.max(0, grossWallVolM3 - deductionVolM3);

  // Brick dimensions in meters
  const bL = brickL_Mm / 1000;
  const bW = brickW_Mm / 1000;
  const bH = brickH_Mm / 1000;
  const jointM = mortarJointMm / 1000;

  // Nominal brick dimension with mortar
  const nomL = bL + jointM;
  const nomW = bW + jointM;
  const nomH = bH + jointM;

  const nomVolPerBrick = nomL * nomW * nomH;
  const actualVolPerBrick = bL * bW * bH;

  // Number of bricks theoretical
  const theoreticalBrickCount = nomVolPerBrick > 0 ? netWallVolM3 / nomVolPerBrick : 0;
  const totalBrickCountWithWaste = Math.ceil(theoreticalBrickCount * (1 + wastagePct / 100));

  // Wet Mortar Volume = Net Wall Volume - Volume of Bricks (without waste)
  const wetMortarVolM3 = Math.max(0, netWallVolM3 - (theoreticalBrickCount * actualVolPerBrick));
  const dryMortarVolM3 = wetMortarVolM3 * 1.33 * (1 + wastagePct / 100); // 1.33 dry factor for mortar

  const mortarSum = mortarRatioC + mortarRatioS;
  const cementVolM3 = dryMortarVolM3 * (mortarRatioC / mortarSum);
  const sandVolM3 = dryMortarVolM3 * (mortarRatioS / mortarSum);

  const cementMassKg = cementVolM3 * DENSITIES.cement;
  const cementBags = cementMassKg / 50;
  const sandCFT = sandVolM3 * 35.3147;

  return {
    title: 'Brickwork & Mortar Estimation',
    primaryValue: formatNumber(totalBrickCountWithWaste, 0),
    primaryUnit: 'Bricks (Nos)',
    secondaryValues: [
      { label: 'Net Wall Volume', value: `${formatNumber(netWallVolM3, 3)} m³ (${formatNumber(netWallVolM3 * 35.3147, 1)} CFT)` },
      { label: 'Cement Bags (50kg)', value: `${formatNumber(cementBags, 1)} Bags` },
      { label: 'Sand Required', value: `${formatNumber(sandCFT, 1)} CFT (${formatNumber(sandVolM3, 2)} m³)` },
      { label: 'Dry Mortar Volume', value: `${formatNumber(dryMortarVolM3, 3)} m³` },
    ],
    breakdown: [
      { step: '1. Net Masonry Wall Volume', expression: `(${l}m × ${h}m × ${t}m) - (${openingsAreaM2}m² × ${t}m)`, result: `${formatNumber(netWallVolM3, 3)} m³` },
      { step: '2. Nominal Brick Volume with Joint', expression: `(${formatNumber(nomL, 4)} × ${formatNumber(nomW, 4)} × ${formatNumber(nomH, 4)}) m³`, result: `${formatNumber(nomVolPerBrick, 6)} m³` },
      { step: '3. Total Bricks (incl. ${wastagePct}% wastage)', expression: `(${formatNumber(netWallVolM3, 3)} ÷ ${formatNumber(nomVolPerBrick, 6)}) × 1.0${wastagePct}`, result: `${totalBrickCountWithWaste} Bricks` },
      { step: '4. Wet Mortar Volume', expression: `Net Vol - (No. of Bricks × Actual Brick Vol)`, result: `${formatNumber(wetMortarVolM3, 3)} m³` },
      { step: '5. Dry Mortar Volume (1.33 Factor)', expression: `${formatNumber(wetMortarVolM3, 3)} × 1.33 × 1.0${wastagePct}`, result: `${formatNumber(dryMortarVolM3, 3)} m³` },
      { step: '6. Cement & Sand Split', expression: `Ratio ${mortarRatioC}:${mortarRatioS} (Sum=${mortarSum})`, result: `${formatNumber(cementBags, 2)} Bags cement, ${formatNumber(sandCFT, 1)} CFT sand` },
    ],
    formula: 'Bricks = Net Wall Vol ÷ (Nominal Brick Vol) × (1 + Wastage%)',
    substitutedFormula: `Bricks = ${formatNumber(netWallVolM3, 3)} / ${formatNumber(nomVolPerBrick, 6)} × 1.0${wastagePct} = ${totalBrickCountWithWaste}`,
    inputsSummary: [
      { label: 'Wall Dimensions (L × H × T)', value: `${l}m × ${h}m × ${t}m (${formatNumber(t * 39.37, 1)}" thk)` },
      { label: 'Brick Size (L × W × H)', value: `${brickL_Mm} × ${brickW_Mm} × ${brickH_Mm} mm` },
      { label: 'Mortar Joint Thickness', value: `${mortarJointMm} mm` },
      { label: 'Mortar Ratio (C:S)', value: `${mortarRatioC} : ${mortarRatioS}` },
      { label: 'Openings Deduction', value: `${openingsAreaM2} m²` },
    ],
    assumptions: [
      { label: 'Dry Factor for Mortar', value: '1.33 (33% increase from wet paste to loose dry sand & cement)' },
      { label: 'Mortar Density', value: 'Cement density 1440 kg/m³ with standard 50 kg bag.' },
      { label: 'Frog Volume', value: 'Standard brick frog indentation mortar volume included in nominal joint calculation.' },
    ],
    engineeringNotes: 'Traditional Bangladesh brick size is 9.5" × 4.5" × 2.75" (approx 241 × 114 × 70 mm), giving approx 115–120 bricks per 1 m³ (or 11–12 bricks per CFT) for standard 5" or 10" walls.',
    isPreliminary: true,
  };
}

// ==========================================
// 6. PLASTER CALCULATOR
// ==========================================
export function calculatePlaster(
  areaM2: number,
  thicknessMm: number = 12,
  ratioC: number = 1,
  ratioS: number = 5,
  dryFactor: number = 1.33,
  wastagePct: number = 5
): CalculationResult {
  const area = Math.max(0, areaM2);
  const thkM = Math.max(1, thicknessMm) / 1000;

  const wetVolM3 = area * thkM;
  const dryVolM3 = wetVolM3 * dryFactor * (1 + wastagePct / 100);

  const sumRatio = ratioC + ratioS;
  const cementVolM3 = dryVolM3 * (ratioC / sumRatio);
  const sandVolM3 = dryVolM3 * (ratioS / sumRatio);

  const cementMassKg = cementVolM3 * DENSITIES.cement;
  const cementBags = cementMassKg / 50;
  const sandCFT = sandVolM3 * 35.3147;

  return {
    title: 'Plaster Material Calculation',
    primaryValue: formatNumber(cementBags, 1),
    primaryUnit: 'Bags Cement (50kg)',
    secondaryValues: [
      { label: 'Sand Volume', value: `${formatNumber(sandCFT, 1)} CFT (${formatNumber(sandVolM3, 3)} m³)` },
      { label: 'Plaster Surface Area', value: `${formatNumber(area, 2)} m² (${formatNumber(area * 10.7639, 1)} sq.ft)` },
      { label: 'Wet Mortar Volume', value: `${formatNumber(wetVolM3, 3)} m³` },
      { label: 'Dry Mortar Volume', value: `${formatNumber(dryVolM3, 3)} m³` },
    ],
    breakdown: [
      { step: '1. Wet Plaster Volume', expression: `${area} m² × ${thkM} m thickness`, result: `${formatNumber(wetVolM3, 4)} m³` },
      { step: '2. Dry Volume with Joint & Waste Allowance', expression: `${formatNumber(wetVolM3, 4)} m³ × ${dryFactor} × (1 + ${wastagePct}%)`, result: `${formatNumber(dryVolM3, 4)} m³` },
      { step: '3. Cement Bags (Ratio 1:S)', expression: `(${ratioC}/${sumRatio}) × ${formatNumber(dryVolM3, 4)} × 1440 kg/m³ ÷ 50`, result: `${formatNumber(cementBags, 2)} Bags` },
      { step: '4. Sand Quantity', expression: `(${ratioS}/${sumRatio}) × ${formatNumber(dryVolM3, 4)} × 35.3147 CFT`, result: `${formatNumber(sandCFT, 2)} CFT` },
    ],
    formula: 'Dry Vol = Area × Thickness × 1.33 × (1 + Waste%) | Bags = Cement Vol × 1440 / 50',
    substitutedFormula: `Dry Vol = ${area} × ${thkM} × ${dryFactor} × 1.0${wastagePct} = ${formatNumber(dryVolM3, 4)} m³`,
    inputsSummary: [
      { label: 'Plaster Surface Area', value: `${area} m²` },
      { label: 'Plaster Thickness', value: `${thicknessMm} mm` },
      { label: 'Mortar Proportion (C:S)', value: `${ratioC} : ${ratioS}` },
      { label: 'Dry Factor', value: `${dryFactor}` },
      { label: 'Wastage & Joint Allowance', value: `${wastagePct}%` },
    ],
    assumptions: [
      { label: 'Masonry Joints Roughness', value: 'Dry factor of 1.33 to 1.35 accounts for brick joint filling, uneven brick surface undulations and rebound loss.' },
      { label: 'Standard Thicknesses', value: 'Internal: 12 mm; External: 15–20 mm; Ceiling: 6–8 mm.' },
    ],
    engineeringNotes: 'Ensure masonry wall is sufficiently cured and wet with clean water before application to prevent premature mortar desiccation and cracking.',
    isPreliminary: true,
  };
}

// ==========================================
// 7. FLOORING & TILES CALCULATOR
// ==========================================
export function calculateFlooring(
  roomLM: number,
  roomWM: number,
  tileLMm: number,
  tileWMm: number,
  wastagePct: number = 5,
  tilesPerBox: number = 4
): CalculationResult {
  const roomAreaM2 = Math.max(0, roomLM) * Math.max(0, roomWM);
  const roomAreaSqFt = roomAreaM2 * 10.7639;

  const tileAreaM2 = (Math.max(1, tileLMm) / 1000) * (Math.max(1, tileWMm) / 1000);
  const tileAreaSqFt = tileAreaM2 * 10.7639;

  const theoreticalTiles = tileAreaM2 > 0 ? roomAreaM2 / tileAreaM2 : 0;
  const totalTilesWithWaste = Math.ceil(theoreticalTiles * (1 + wastagePct / 100));

  const boxCount = Math.ceil(totalTilesWithWaste / Math.max(1, tilesPerBox));
  const totalPurchasedTiles = boxCount * tilesPerBox;
  const leftoverTiles = totalPurchasedTiles - Math.ceil(theoreticalTiles);
  const leftoverAreaSqFt = leftoverTiles * tileAreaSqFt;

  return {
    title: 'Flooring & Tile Estimation',
    primaryValue: formatNumber(totalTilesWithWaste, 0),
    primaryUnit: 'Tiles (Nos)',
    secondaryValues: [
      { label: 'Carton / Box Count', value: `${boxCount} Boxes (${tilesPerBox} pcs/box)` },
      { label: 'Total Floor Area', value: `${formatNumber(roomAreaSqFt, 1)} sq.ft (${formatNumber(roomAreaM2, 2)} m²)` },
      { label: 'Coverage of 1 Tile', value: `${formatNumber(tileAreaSqFt, 2)} sq.ft (${tileLMm}×${tileWMm} mm)` },
      { label: 'Spare / Cut Tiles', value: `${leftoverTiles} pcs (${formatNumber(leftoverAreaSqFt, 1)} sq.ft)` },
    ],
    breakdown: [
      { step: '1. Room Net Floor Area', expression: `${roomLM} m × ${roomWM} m`, result: `${formatNumber(roomAreaM2, 2)} m² (${formatNumber(roomAreaSqFt, 1)} sq.ft)` },
      { step: '2. Single Tile Area', expression: `(${tileLMm}/1000) × (${tileWMm}/1000)`, result: `${formatNumber(tileAreaM2, 4)} m² (${formatNumber(tileAreaSqFt, 2)} sq.ft)` },
      { step: '3. Theoretical Tile Quantity', expression: `${formatNumber(roomAreaM2, 2)} ÷ ${formatNumber(tileAreaM2, 4)}`, result: `${formatNumber(theoreticalTiles, 1)} tiles` },
      { step: '4. Allowance for Cutting & Breakage', expression: `${formatNumber(theoreticalTiles, 1)} × (1 + ${wastagePct}%)`, result: `${totalTilesWithWaste} tiles` },
      { step: '5. Purchase Cartons / Boxes', expression: `${totalTilesWithWaste} tiles ÷ ${tilesPerBox} per box`, result: `${boxCount} full boxes` },
    ],
    formula: 'Tiles = (Room Area ÷ Tile Area) × (1 + Wastage%) | Boxes = ⌈Tiles ÷ BoxCapacity⌉',
    substitutedFormula: `Tiles = (${formatNumber(roomAreaM2, 2)} / ${formatNumber(tileAreaM2, 4)}) × 1.0${wastagePct} = ${totalTilesWithWaste}`,
    inputsSummary: [
      { label: 'Room Dimensions', value: `${roomLM} m × ${roomWM} m` },
      { label: 'Tile Dimensions', value: `${tileLMm} mm × ${tileWMm} mm` },
      { label: 'Wastage Allowance', value: `${wastagePct}%` },
      { label: 'Tiles per Box', value: `${tilesPerBox} pcs` },
    ],
    assumptions: [
      { label: 'Skirting Not Included', value: 'Calculate perimeter wall skirting tile requirements separately (typically add 5-10%).' },
      { label: 'Joint Spacers', value: '2mm to 3mm tile grout joints are absorbed in the cutting waste percentage.' },
    ],
    engineeringNotes: 'For diagonal or herringbone tile layout patterns, increase wastage allowance from 5% to 10%–15% due to extensive angle cutting along room borders.',
    isPreliminary: true,
  };
}

// ==========================================
// 8. EARTHWORK EXCAVATION & TRUCK LOADS
// ==========================================
export function calculateEarthwork(
  type: 'rectangular' | 'trapezoidal_trench' | 'pit_sloped',
  params: {
    lengthM: number;
    widthM: number;
    depthM: number;
    sideSlopeM?: number; // 1:m slope (horizontal run for 1 vertical)
    topWidthM?: number;
    bottomWidthM?: number;
    truckCapacityM3?: number;
    bulkingFactor?: number;
  }
): CalculationResult {
  const l = Math.max(0, params.lengthM);
  const d = Math.max(0, params.depthM);
  const truckCap = Math.max(1, params.truckCapacityM3 || 5); // default 5 m³ (approx 175 CFT)
  const bulking = Math.max(1, params.bulkingFactor || 1.25); // default 25% soil bulking

  let bankVolM3 = 0;
  let formulaStr = '';
  let substitutedStr = '';

  if (type === 'rectangular') {
    const w = Math.max(0, params.widthM);
    bankVolM3 = l * w * d;
    formulaStr = 'V_bank = Length × Width × Depth';
    substitutedStr = `V_bank = ${l} × ${w} × ${d} = ${formatNumber(bankVolM3, 2)} m³`;
  } else if (type === 'trapezoidal_trench') {
    // V = L × D × (B1 + B2)/2
    const b1 = params.bottomWidthM || params.widthM || 0;
    const b2 = params.topWidthM || (b1 + 2 * (params.sideSlopeM || 1) * d);
    bankVolM3 = l * d * ((b1 + b2) / 2);
    formulaStr = 'V = Length × Depth × (B_bottom + B_top) / 2';
    substitutedStr = `V = ${l} × ${d} × (${b1} + ${b2}) / 2 = ${formatNumber(bankVolM3, 2)} m³`;
  } else {
    // Sloped Pit / Prismoidal
    const b1 = params.widthM;
    const l1 = params.lengthM;
    const m = params.sideSlopeM || 1;
    const b2 = b1 + 2 * m * d;
    const l2 = l1 + 2 * m * d;
    const A1 = l1 * b1;
    const A2 = l2 * b2;
    const Am = ((l1 + l2) / 2) * ((b1 + b2) / 2);
    bankVolM3 = (d / 6) * (A1 + 4 * Am + A2);
    formulaStr = 'V = (Depth / 6) × (A1 + 4Am + A2) [Prismoidal]';
    substitutedStr = `V = (${d}/6) × (${formatNumber(A1, 1)} + 4×${formatNumber(Am, 1)} + ${formatNumber(A2, 1)}) = ${formatNumber(bankVolM3, 2)} m³`;
  }

  const bankVolCFT = bankVolM3 * 35.3147;
  const looseVolM3 = bankVolM3 * bulking;
  const looseVolCFT = looseVolM3 * 35.3147;
  const truckTrips = Math.ceil(looseVolM3 / truckCap);

  return {
    title: 'Earthwork Excavation & Haulage',
    primaryValue: formatNumber(bankVolM3, 2),
    primaryUnit: 'm³ (Bank Volume)',
    secondaryValues: [
      { label: 'Bank Volume in CFT', value: `${formatNumber(bankVolCFT, 1)} CFT` },
      { label: 'Loose Volume for Hauling', value: `${formatNumber(looseVolM3, 2)} m³ (${formatNumber(looseVolCFT, 1)} CFT)` },
      { label: 'Dump Truck Trips', value: `${truckTrips} Trips (${truckCap} m³ capacity)` },
      { label: 'Tractor Trolley Trips (3 m³)', value: `${Math.ceil(looseVolM3 / 3)} Trips` },
    ],
    breakdown: [
      { step: '1. In-situ Bank Cut Volume', expression: formulaStr, result: `${formatNumber(bankVolM3, 2)} m³ (${formatNumber(bankVolCFT, 1)} CFT)` },
      { step: '2. Loose Swelled Volume (Bulking)', expression: `${formatNumber(bankVolM3, 2)} m³ × ${bulking} (bulking factor)`, result: `${formatNumber(looseVolM3, 2)} m³` },
      { step: '3. Truck Loads Calculation', expression: `${formatNumber(looseVolM3, 2)} m³ ÷ ${truckCap} m³/trip`, result: `${truckTrips} trips` },
    ],
    formula: formulaStr,
    substitutedFormula: substitutedStr,
    inputsSummary: [
      { label: 'Excavation Type', value: type.replace('_', ' ').toUpperCase() },
      { label: 'Length & Depth', value: `L = ${l} m, Depth = ${d} m` },
      { label: 'Truck Capacity', value: `${truckCap} m³ (~${formatNumber(truckCap * 35.3147, 0)} CFT)` },
      { label: 'Soil Bulking Factor', value: `${bulking} (+${formatNumber((bulking - 1) * 100, 0)}% swell)` },
    ],
    assumptions: [
      { label: 'Bank vs Loose Volume', value: 'Soil expands upon excavation (bulking/swell). Truck haulage capacity is always based on LOOSE volume, not bank volume.' },
      { label: 'Bulking Guide', value: 'Sand: 10-15%, Ordinary Earth: 20-30%, Heavy Clay: 30-40%, Rock: 50-60%.' },
    ],
    engineeringNotes: 'For excavations deeper than 1.5 m (5 ft), side sloping (benching/battering) or proper timber/sheet shoring is mandatory to avoid catastrophic trench wall collapse.',
    isPreliminary: true,
  };
}

// ==========================================
// 9. PRELIMINARY RCC STEEL ESTIMATOR
// ==========================================
export function calculateRCCSteelEstimator(
  concreteVolM3: number,
  memberType: 'slab' | 'beam' | 'column' | 'footing' | 'lintel' | 'custom',
  customPct?: number,
  steelRateKg: number = 0
): CalculationResult {
  const vol = Math.max(0, concreteVolM3);

  // Typical civil rules of thumb steel percentages (by volume of concrete):
  // Slab: 0.7% to 1.0% (approx 55 to 80 kg/m³)
  // Beam: 1.0% to 2.0% (approx 80 to 160 kg/m³)
  // Column: 1.0% to 4.0% (approx 80 to 320 kg/m³, average 2.0% = 160 kg/m³)
  // Footing: 0.5% to 0.8% (approx 40 to 65 kg/m³)
  let defaultPct = 1.0;
  let typicalRange = '';

  switch (memberType) {
    case 'slab':
      defaultPct = 0.8;
      typicalRange = '0.7% – 1.0% (55 – 80 kg/m³)';
      break;
    case 'beam':
      defaultPct = 1.5;
      typicalRange = '1.0% – 2.0% (80 – 160 kg/m³)';
      break;
    case 'column':
      defaultPct = 2.0;
      typicalRange = '1.0% – 4.0% (80 – 315 kg/m³)';
      break;
    case 'footing':
      defaultPct = 0.6;
      typicalRange = '0.5% – 0.8% (40 – 65 kg/m³)';
      break;
    case 'lintel':
      defaultPct = 1.0;
      typicalRange = '0.8% – 1.2% (65 – 95 kg/m³)';
      break;
    case 'custom':
      defaultPct = customPct || 1.0;
      typicalRange = 'User Defined';
      break;
  }

  const pct = customPct !== undefined ? customPct : defaultPct;
  // Steel weight = Volume of concrete × (percentage / 100) × Steel density (7850 kg/m³)
  const steelWeightKg = vol * (pct / 100) * DENSITIES.steel;
  const steelWeightTon = steelWeightKg / 1000;
  const kgPerM3 = vol > 0 ? steelWeightKg / vol : 0;
  const totalCost = steelWeightKg * steelRateKg;

  return {
    title: 'Preliminary RCC Steel Reinforcement Estimate',
    primaryValue: formatNumber(steelWeightKg, 1),
    primaryUnit: 'kg Steel',
    secondaryValues: [
      { label: 'Total Tonnes', value: `${formatNumber(steelWeightTon, 3)} Tonne` },
      { label: 'Reinforcement Density', value: `${formatNumber(kgPerM3, 1)} kg / m³ concrete` },
      { label: 'Steel Ratio Assumed', value: `${pct}% by volume` },
      ...(steelRateKg > 0 ? [{ label: 'Estimated Steel Cost', value: formatCurrency(totalCost) }] : []),
    ],
    breakdown: [
      { step: '1. Steel Volume from Percentage', expression: `${vol} m³ × (${pct} ÷ 100)`, result: `${formatNumber(vol * (pct / 100), 5)} m³ steel` },
      { step: '2. Mass using Steel Density (7850 kg/m³)', expression: `${formatNumber(vol * (pct / 100), 5)} m³ × 7850 kg/m³`, result: `${formatNumber(steelWeightKg, 2)} kg` },
      { step: '3. Expressed in Metric Tonnes', expression: `${formatNumber(steelWeightKg, 2)} kg ÷ 1000`, result: `${formatNumber(steelWeightTon, 3)} tonne` },
      ...(steelRateKg > 0 ? [{ step: '4. Estimated Rebar Cost', expression: `${formatNumber(steelWeightKg, 1)} kg × ${steelRateKg}`, result: formatCurrency(totalCost) }] : []),
    ],
    formula: 'W_steel = V_concrete × (Steel% / 100) × 7850 kg/m³',
    substitutedFormula: `W_steel = ${vol} × (${pct} / 100) × 7850 = ${formatNumber(steelWeightKg, 2)} kg`,
    inputsSummary: [
      { label: 'Concrete Volume', value: `${vol} m³ (${formatNumber(vol * 35.3147, 1)} CFT)` },
      { label: 'Structural Member', value: memberType.toUpperCase() },
      { label: 'Reinforcement Percentage', value: `${pct}%` },
      { label: 'Typical Design Range', value: typicalRange },
    ],
    assumptions: [
      { label: 'Steel Density', value: '7850 kg/m³' },
      { label: 'Preliminary Nature', value: 'PRELIMINARY ESTIMATION ONLY. Not structural design.' },
    ],
    engineeringNotes: 'DISCLAIMER: This preliminary ratio estimator is strictly for rough budget forecasting and material procurement feasibility. It NEVER replaces detailed structural engineering analysis, load calculations, moment/shear diagrams, or code-compliant reinforcement detailing drawings approved by a licensed professional engineer.',
    isPreliminary: true,
  };
}

// ==========================================
// 10. SLAB CALCULATOR (VOLUME & ONE-WAY / TWO-WAY)
// ==========================================
export function calculateSlab(
  lengthM: number,
  widthM: number,
  thicknessMm: number,
  prelimSteelPct: number = 0.8
): CalculationResult {
  const l = Math.max(0, lengthM);
  const w = Math.max(0, widthM);
  const thkM = Math.max(1, thicknessMm) / 1000;

  const longerSpan = Math.max(l, w);
  const shorterSpan = Math.min(l, w);
  const spanRatio = shorterSpan > 0 ? longerSpan / shorterSpan : 0;

  // Slab classification rule: Ly / Lx >= 2 -> One-Way; Ly / Lx < 2 -> Two-Way
  const isOneWay = spanRatio >= 2.0;
  const slabTypeDesc = isOneWay
    ? `One-Way Slab (Ly/Lx = ${formatNumber(spanRatio, 2)} ≥ 2.0). Main reinforcement spans across shorter direction.`
    : `Two-Way Slab (Ly/Lx = ${formatNumber(spanRatio, 2)} < 2.0). Bending moments distributed in both orthogonal directions.`;

  const volM3 = l * w * thkM;
  const volCFT = volM3 * 35.3147;
  const steelKg = volM3 * (prelimSteelPct / 100) * DENSITIES.steel;

  return {
    title: 'Slab Concrete & Behavior Helper',
    primaryValue: formatNumber(volM3, 3),
    primaryUnit: 'm³ Concrete',
    secondaryValues: [
      { label: 'Volume in CFT', value: `${formatNumber(volCFT, 2)} CFT` },
      { label: 'Classification', value: isOneWay ? 'ONE-WAY SLAB' : 'TWO-WAY SLAB' },
      { label: 'Span Aspect Ratio (Ly/Lx)', value: formatNumber(spanRatio, 2) },
      { label: 'Approx. Rebar Mass', value: `${formatNumber(steelKg, 1)} kg (${prelimSteelPct}%)` },
    ],
    breakdown: [
      { step: '1. Slab Aspect Ratio Check', expression: `Longer Span (${longerSpan}m) ÷ Shorter Span (${shorterSpan}m)`, result: `Ratio = ${formatNumber(spanRatio, 2)} → ${isOneWay ? 'One-Way' : 'Two-Way'}` },
      { step: '2. Compacted Concrete Volume', expression: `${l}m × ${w}m × ${thkM}m`, result: `${formatNumber(volM3, 3)} m³ (${formatNumber(volCFT, 1)} CFT)` },
      { step: '3. Shuttering / Bottom Formwork Area', expression: `${l}m × ${w}m`, result: `${formatNumber(l * w, 2)} m² (${formatNumber(l * w * 10.7639, 1)} sq.ft)` },
      { step: '4. Preliminary Steel Mass', expression: `${formatNumber(volM3, 3)} m³ × ${prelimSteelPct}% × 7850`, result: `${formatNumber(steelKg, 1)} kg` },
    ],
    formula: 'Ly/Lx ≥ 2.0 → One-Way | Ly/Lx < 2.0 → Two-Way | V = L × W × Thickness',
    substitutedFormula: `V = ${l} × ${w} × ${thkM} = ${formatNumber(volM3, 3)} m³`,
    inputsSummary: [
      { label: 'Slab Dimensions', value: `${l} m × ${w} m` },
      { label: 'Thickness', value: `${thicknessMm} mm (${formatNumber(thicknessMm / 25.4, 1)} inches)` },
      { label: 'Reinforcement % Assumed', value: `${prelimSteelPct}%` },
    ],
    assumptions: [
      { label: 'Support Boundary Conditions', value: 'Assumed supported on all four edges for aspect ratio check. Cantilevered slabs are always one-way.' },
    ],
    engineeringNotes: slabTypeDesc,
    isPreliminary: true,
  };
}

// ==========================================
// 11. BEAM CALCULATOR (CONCRETE, FORMWORK, STIRRUPS)
// ==========================================
export function calculateBeam(
  lengthM: number,
  widthMm: number,
  depthMm: number,
  clearCoverMm: number = 25,
  stirrupSpacingMm: number = 150,
  stirrupDiaMm: number = 8
): CalculationResult {
  const l = Math.max(0, lengthM);
  const bM = Math.max(1, widthMm) / 1000;
  const dM = Math.max(1, depthMm) / 1000;
  const coverM = Math.max(0, clearCoverMm) / 1000;

  const volM3 = l * bM * dM;
  const volCFT = volM3 * 35.3147;

  // Formwork area for typical beam: bottom soffit + two side faces
  // (Top is cast flush or slab)
  const formworkAreaM2 = (bM + 2 * dM) * l;
  const formworkAreaSqFt = formworkAreaM2 * 10.7639;

  // Stirrup count: (Length - 2*cover) / spacing + 1
  const spacingM = Math.max(10, stirrupSpacingMm) / 1000;
  const effLengthM = Math.max(0, l - 2 * coverM);
  const stirrupCount = Math.floor(effLengthM / spacingM) + 1;

  // Approximate single stirrup cutting length
  // 2*(b_core + d_core) + 2*hook
  const bCore = Math.max(0, widthMm - 2 * clearCoverMm);
  const dCore = Math.max(0, depthMm - 2 * clearCoverMm);
  const hookLen = Math.max(75, 10 * stirrupDiaMm);
  const singleCutLenM = (2 * (bCore + dCore) + 2 * hookLen - 4 * (2 * stirrupDiaMm)) / 1000;
  const totalStirrupSteelKg = stirrupCount * singleCutLenM * ((stirrupDiaMm * stirrupDiaMm) / 162.2);

  return {
    title: 'Beam Concrete & Formwork Estimator',
    primaryValue: formatNumber(volM3, 3),
    primaryUnit: 'm³ Concrete',
    secondaryValues: [
      { label: 'Volume in CFT', value: `${formatNumber(volCFT, 2)} CFT` },
      { label: 'Formwork / Shuttering Area', value: `${formatNumber(formworkAreaM2, 2)} m² (${formatNumber(formworkAreaSqFt, 1)} sq.ft)` },
      { label: 'Stirrup / Ring Count', value: `${stirrupCount} pcs (@ ${stirrupSpacingMm}mm c/c)` },
      { label: 'Stirrups Steel Weight', value: `${formatNumber(totalStirrupSteelKg, 1)} kg (Ø${stirrupDiaMm} mm)` },
    ],
    breakdown: [
      { step: '1. Concrete Volume', expression: `${l}m × ${bM}m × ${dM}m`, result: `${formatNumber(volM3, 3)} m³` },
      { step: '2. Formwork Surface Area (Bottom + 2 Sides)', expression: `(${bM} + 2×${dM}) × ${l}m`, result: `${formatNumber(formworkAreaM2, 2)} m²` },
      { step: '3. Number of Stirrups', expression: `(${effLengthM}m span ÷ ${spacingM}m) + 1`, result: `${stirrupCount} rings` },
      { step: '4. Stirrup Cutting Length & Weight', expression: `${stirrupCount} rings × ${formatNumber(singleCutLenM, 3)}m × unit wt`, result: `${formatNumber(totalStirrupSteelKg, 1)} kg` },
    ],
    formula: 'V = L × B × D | Formwork = (B + 2D) × L | Stirrup Count = (Span / Spacing) + 1',
    substitutedFormula: `V = ${l} × ${bM} × ${dM} = ${formatNumber(volM3, 3)} m³`,
    inputsSummary: [
      { label: 'Beam Span Length', value: `${l} m` },
      { label: 'Width × Depth', value: `${widthMm} mm × ${depthMm} mm` },
      { label: 'Clear Concrete Cover', value: `${clearCoverMm} mm` },
      { label: 'Stirrup Spacing', value: `${stirrupSpacingMm} mm c/c (Ø${stirrupDiaMm} mm)` },
    ],
    assumptions: [
      { label: 'Shuttering Faces', value: 'Assumed bottom soffit + 2 exposed sides. Top face cast with floor slab.' },
      { label: 'Uniform Stirrup Spacing', value: 'Zone-based stirrup densification near column supports (L/4 zone) should be applied as per code.' },
    ],
    engineeringNotes: 'Structural beams must be designed for shear, flexure and deflection per ACI 318 / IS 456 / Eurocode 2. Stirrup spacing is typically reduced to 100mm near beam ends for seismic and high shear resistance.',
    isPreliminary: true,
  };
}

// ==========================================
// 12. COLUMN CALCULATOR (RECTANGULAR & CIRCULAR)
// ==========================================
export function calculateColumn(
  shape: 'rectangular' | 'circular',
  heightM: number,
  params: {
    widthMm?: number;
    depthMm?: number;
    diameterMm?: number;
    clearCoverMm?: number;
    tieSpacingMm?: number;
    tieDiaMm?: number;
    rebarPct?: number;
  }
): CalculationResult {
  const h = Math.max(0, heightM);
  const tieSpacingMm = Math.max(50, params.tieSpacingMm || 150);
  const tieDiaMm = params.tieDiaMm || 8;
  const rebarPct = params.rebarPct || 2.0;

  let volM3 = 0;
  let formworkM2 = 0;

  if (shape === 'rectangular') {
    const bM = (params.widthMm || 300) / 1000;
    const dM = (params.depthMm || 300) / 1000;
    volM3 = bM * dM * h;
    formworkM2 = 2 * (bM + dM) * h;
  } else {
    const diaM = (params.diameterMm || 300) / 1000;
    const r = diaM / 2;
    volM3 = Math.PI * r * r * h;
    formworkM2 = Math.PI * diaM * h;
  }

  const volCFT = volM3 * 35.3147;
  const formworkSqFt = formworkM2 * 10.7639;

  // Tie / Stirrup count
  const spacingM = tieSpacingMm / 1000;
  const tieCount = Math.floor(h / spacingM) + 1;

  // Preliminary longitudinal rebar
  const steelKg = volM3 * (rebarPct / 100) * DENSITIES.steel;

  return {
    title: 'Column Concrete & Formwork Helper',
    primaryValue: formatNumber(volM3, 3),
    primaryUnit: 'm³ Concrete',
    secondaryValues: [
      { label: 'Volume in CFT', value: `${formatNumber(volCFT, 2)} CFT` },
      { label: 'Shuttering Area (4 Sides)', value: `${formatNumber(formworkM2, 2)} m² (${formatNumber(formworkSqFt, 1)} sq.ft)` },
      { label: 'Tie / Lateral Ring Count', value: `${tieCount} rings (@ ${tieSpacingMm}mm c/c)` },
      { label: 'Estimated Vertical Rebar', value: `${formatNumber(steelKg, 1)} kg (${rebarPct}%)` },
    ],
    breakdown: [
      { step: '1. Column Concrete Volume', expression: shape === 'rectangular' ? `B × D × H` : `π × (D/2)² × H`, result: `${formatNumber(volM3, 3)} m³` },
      { step: '2. Formwork Perimeter Surface', expression: shape === 'rectangular' ? `2×(B + D) × H` : `π × D × H`, result: `${formatNumber(formworkM2, 2)} m²` },
      { step: '3. Lateral Ties / Rings Count', expression: `${h}m column height ÷ ${spacingM}m spacing + 1`, result: `${tieCount} ties` },
      { step: '4. Preliminary Longitudinal Steel', expression: `${formatNumber(volM3, 3)} m³ × ${rebarPct}% × 7850`, result: `${formatNumber(steelKg, 1)} kg` },
    ],
    formula: shape === 'rectangular' ? 'V = B × D × H | Formwork = 2(B + D) × H' : 'V = π × R² × H | Formwork = π × D × H',
    substitutedFormula: `V = ${formatNumber(volM3, 3)} m³`,
    inputsSummary: [
      { label: 'Column Shape', value: shape.toUpperCase() },
      { label: 'Height', value: `${h} m` },
      { label: 'Cross Section', value: shape === 'rectangular' ? `${params.widthMm} × ${params.depthMm} mm` : `Ø${params.diameterMm} mm` },
      { label: 'Lateral Tie Spacing', value: `${tieSpacingMm} mm c/c` },
    ],
    assumptions: [
      { label: 'Minimum Steel Requirement', value: 'Codes typically require a minimum 0.8% and maximum 4.0% longitudinal steel for RCC columns.' },
    ],
    engineeringNotes: 'Columns are compression members subject to axial load and potential biaxial bending. Critical lap splices must be staggered and placed in the middle half of clear column height.',
    isPreliminary: true,
  };
}

// ==========================================
// 13. STAIRCASE GEOMETRY & WAIST SLAB
// ==========================================
export function calculateStaircase(
  floorHeightMm: number,
  riserMm: number = 150,
  treadMm: number = 250,
  stairWidthM: number = 1.0,
  waistThkMm: number = 150
): CalculationResult {
  const h = Math.max(1, floorHeightMm);
  const r = Math.max(1, riserMm);
  const t = Math.max(1, treadMm);
  const w = Math.max(0.5, stairWidthM);
  const waistThkM = Math.max(1, waistThkMm) / 1000;

  // Number of risers
  const numRisers = Math.round(h / r);
  const actualRiserMm = h / numRisers;
  const numTreads = numRisers - 1; // standard straight flight: 1 less tread than riser

  // Total going (horizontal run of steps)
  const totalGoingMm = numTreads * t;
  const totalGoingM = totalGoingMm / 1000;
  const heightM = h / 1000;

  // Incline length of waist slab (Hypotenuse)
  const waistLengthM = Math.sqrt(totalGoingM * totalGoingM + heightM * heightM);
  const slopeAngleDeg = (Math.atan(heightM / totalGoingM) * 180) / Math.PI;

  // Volume: (Waist slab inclined volume) + (Steps triangular volume)
  const waistVolM3 = waistLengthM * w * waistThkM;
  // Step triangle: 0.5 * (r/1000) * (t/1000) * w * numTreads
  const stepsVolM3 = 0.5 * (actualRiserMm / 1000) * (t / 1000) * w * numTreads;
  const totalStairVolM3 = waistVolM3 + stepsVolM3;

  // Ergonomic Comfort Rule: 2R + T
  const blondelScore = 2 * actualRiserMm + t;
  const isComfortable = blondelScore >= 600 && blondelScore <= 650;

  return {
    title: 'Staircase Geometry & Concrete Volume',
    primaryValue: formatNumber(numRisers, 0),
    primaryUnit: 'Risers',
    secondaryValues: [
      { label: 'Number of Treads', value: `${numTreads} treads (@ ${t} mm)` },
      { label: 'Actual Riser Height', value: `${formatNumber(actualRiserMm, 1)} mm` },
      { label: 'Total Horizontal Going', value: `${formatNumber(totalGoingM, 2)} m` },
      { label: 'Slope / Pitch Angle', value: `${formatNumber(slopeAngleDeg, 1)}°` },
      { label: 'Total Concrete Volume', value: `${formatNumber(totalStairVolM3, 3)} m³ (${formatNumber(totalStairVolM3 * 35.3147, 1)} CFT)` },
      { label: 'Ergonomic Check (2R+T)', value: `${formatNumber(blondelScore, 0)} mm (${isComfortable ? 'Optimal' : 'Check Code'})` },
    ],
    breakdown: [
      { step: '1. Number of Risers', expression: `${h} mm ÷ ${r} mm`, result: `${numRisers} risers (Actual R = ${formatNumber(actualRiserMm, 1)} mm)` },
      { step: '2. Total Horizontal Going', expression: `${numTreads} treads × ${t} mm`, result: `${formatNumber(totalGoingM, 2)} m` },
      { step: '3. Inclined Waist Slab Length', expression: `√(${formatNumber(totalGoingM, 2)}² + ${formatNumber(heightM, 2)}²)`, result: `${formatNumber(waistLengthM, 3)} m` },
      { step: '4. Waist Slab Concrete Volume', expression: `${formatNumber(waistLengthM, 3)}m × ${w}m × ${waistThkM}m`, result: `${formatNumber(waistVolM3, 3)} m³` },
      { step: '5. Steps Triangular Volume', expression: `0.5 × R × T × Width × ${numTreads}`, result: `${formatNumber(stepsVolM3, 3)} m³` },
      { step: '6. Combined Staircase Volume', expression: `Waist Vol + Steps Vol`, result: `${formatNumber(totalStairVolM3, 3)} m³` },
    ],
    formula: '2R + T ≈ 600–650 mm (Ergonomic Blondel Rule) | Length = √(Going² + Height²)',
    substitutedFormula: `2 × ${formatNumber(actualRiserMm, 1)} + ${t} = ${formatNumber(blondelScore, 0)} mm`,
    inputsSummary: [
      { label: 'Floor-to-Floor Height', value: `${floorHeightMm} mm` },
      { label: 'Target Riser', value: `${riserMm} mm` },
      { label: 'Tread Depth', value: `${treadMm} mm` },
      { label: 'Flight Width', value: `${stairWidthM} m` },
      { label: 'Waist Slab Thickness', value: `${waistThkMm} mm` },
    ],
    assumptions: [
      { label: 'Comfort Standard', value: '2R + T ideally falls between 600 mm and 650 mm (24" to 25.5") for effortless foot movement.' },
      { label: 'Pitch Angle Standard', value: 'Ideal stair pitch angle is between 25° and 35°.' },
    ],
    engineeringNotes: 'Landing slabs at intermediate flights are excluded and should be calculated as horizontal slabs. Verify minimum headroom clearance (≥ 2.1 m / 7 ft) along the full stair incline.',
    isPreliminary: true,
  };
}

// ==========================================
// 14. SURVEYING: HEIGHT OF INSTRUMENT (HI) LEVELING
// ==========================================
export function calculateSurveyLevelHI(rows: SurveyLevelRow[]): {
  rows: SurveyLevelRow[];
  sumBS: number;
  sumFS: number;
  lastRL: number;
  firstRL: number;
  diffBS_FS: number;
  diffRL: number;
  isBalanced: boolean;
} {
  let currentHI = 0;
  let sumBS = 0;
  let sumFS = 0;

  const calculatedRows: SurveyLevelRow[] = [];
  const initialRL =
    rows.length > 0 && typeof rows[0]?.rl === 'number' && isFinite(rows[0].rl)
      ? rows[0].rl
      : 100;

  for (let i = 0; i < rows.length; i++) {
    const row = { ...rows[i] };
    const hasBS = row.bs !== undefined && row.bs !== null && isFinite(row.bs);
    const hasIS = row.is !== undefined && row.is !== null && isFinite(row.is);
    const hasFS = row.fs !== undefined && row.fs !== null && isFinite(row.fs);

    if (hasBS) {
      sumBS += row.bs!;
    }
    if (hasFS) {
      sumFS += row.fs!;
    }

    if (i === 0) {
      // Benchmark (Initial Station)
      row.rl = initialRL;
      if (hasBS) {
        currentHI = initialRL + row.bs!;
        row.hi = currentHI;
      }
    } else {
      // Check if this row is a turning point with both FS and BS in the same row
      if (hasFS && hasBS) {
        // First compute RL from previous instrument setup's HI and this foresight
        row.rl = currentHI - row.fs!;
        // Then start new instrument setup: new HI = RL + backsight
        currentHI = row.rl + row.bs!;
        row.hi = currentHI;
      } else if (hasFS) {
        // Change point foresight or final station foresight
        row.rl = currentHI - row.fs!;
        row.hi = currentHI;
      } else if (hasIS) {
        // Intermediate station
        row.rl = currentHI - row.is!;
        row.hi = currentHI;
      } else if (hasBS) {
        // Duplicate station / two-row change point (row with only BS following an FS)
        // Physical point is the same as the previous station
        const prevStationRL = calculatedRows[i - 1]?.rl ?? initialRL;
        row.rl = prevStationRL;
        currentHI = prevStationRL + row.bs!;
        row.hi = currentHI;
      } else {
        // No sight reading entered
        row.rl = calculatedRows[i - 1]?.rl ?? initialRL;
        row.hi = currentHI;
      }
    }

    calculatedRows.push(row);
  }

  const firstRL = calculatedRows.length > 0 ? calculatedRows[0].rl : initialRL;
  const lastRL =
    calculatedRows.length > 0 ? calculatedRows[calculatedRows.length - 1].rl : firstRL;
  const diffBS_FS = Math.round((sumBS - sumFS) * 1000) / 1000;
  const diffRL = Math.round((lastRL - firstRL) * 1000) / 1000;
  const isBalanced = Math.abs(diffBS_FS - diffRL) < 0.005;

  return {
    rows: calculatedRows,
    sumBS,
    sumFS,
    lastRL,
    firstRL,
    diffBS_FS,
    diffRL,
    isBalanced,
  };
}

// ==========================================
// 15. SURVEYING: RISE AND FALL METHOD
// ==========================================
export function calculateSurveyRiseAndFall(rows: SurveyLevelRow[]): {
  rows: SurveyLevelRow[];
  sumBS: number;
  sumFS: number;
  sumRise: number;
  sumFall: number;
  lastRL: number;
  firstRL: number;
  diffBS_FS: number;
  diffRise_Fall: number;
  diffRL: number;
  isBalanced: boolean;
} {
  let sumBS = 0;
  let sumFS = 0;
  let sumRise = 0;
  let sumFall = 0;

  const calculatedRows: SurveyLevelRow[] = [];
  const initialRL =
    rows.length > 0 && typeof rows[0]?.rl === 'number' && isFinite(rows[0].rl)
      ? rows[0].rl
      : 100;
  let currentRL = initialRL;
  let prevReading = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = { ...rows[i] };
    const hasBS = row.bs !== undefined && row.bs !== null && isFinite(row.bs);
    const hasIS = row.is !== undefined && row.is !== null && isFinite(row.is);
    const hasFS = row.fs !== undefined && row.fs !== null && isFinite(row.fs);

    if (hasBS) sumBS += row.bs!;
    if (hasFS) sumFS += row.fs!;

    if (i === 0) {
      // First row (Benchmark)
      row.rl = initialRL;
      row.rise = 0;
      row.fall = 0;
      prevReading = hasBS ? row.bs! : hasIS ? row.is! : hasFS ? row.fs! : 0;
    } else {
      // Check turning point format
      // Format A: Both FS and BS in the same row
      if (hasFS && hasBS) {
        // The foresight is looking at this physical point from previous setup
        const diff = Math.round((prevReading - row.fs!) * 1000) / 1000;
        if (diff > 0) {
          row.rise = diff;
          row.fall = 0;
          sumRise += diff;
          currentRL += diff;
        } else {
          row.rise = 0;
          row.fall = Math.abs(diff);
          sumFall += Math.abs(diff);
          currentRL -= Math.abs(diff);
        }
        row.rl = Math.round(currentRL * 1000) / 1000;
        // Now, for subsequent readings from the new setup, the reference is BS!
        prevReading = row.bs!;
      } else if (hasFS) {
        // Foresight only
        const diff = Math.round((prevReading - row.fs!) * 1000) / 1000;
        if (diff > 0) {
          row.rise = diff;
          row.fall = 0;
          sumRise += diff;
          currentRL += diff;
        } else {
          row.rise = 0;
          row.fall = Math.abs(diff);
          sumFall += Math.abs(diff);
          currentRL -= Math.abs(diff);
        }
        row.rl = Math.round(currentRL * 1000) / 1000;
        prevReading = row.fs!;
      } else if (hasIS) {
        // Intermediate sight
        const diff = Math.round((prevReading - row.is!) * 1000) / 1000;
        if (diff > 0) {
          row.rise = diff;
          row.fall = 0;
          sumRise += diff;
          currentRL += diff;
        } else {
          row.rise = 0;
          row.fall = Math.abs(diff);
          sumFall += Math.abs(diff);
          currentRL -= Math.abs(diff);
        }
        row.rl = Math.round(currentRL * 1000) / 1000;
        prevReading = row.is!;
      } else if (hasBS) {
        // Format B: Two-row change point format (this row has only BS, continuing from previous row's FS)
        // Foresight and backsight represent the same physical point and do NOT create a false rise or fall!
        row.rise = 0;
        row.fall = 0;
        // RL remains the same as the change point physical station
        row.rl = currentRL;
        // Subsequent readings use the new setup's BS as reference:
        prevReading = row.bs!;
      } else {
        // Row without sight
        row.rise = 0;
        row.fall = 0;
        row.rl = currentRL;
      }
    }

    calculatedRows.push(row);
  }

  const firstRL = calculatedRows.length > 0 ? calculatedRows[0].rl : initialRL;
  const lastRL =
    calculatedRows.length > 0 ? calculatedRows[calculatedRows.length - 1].rl : firstRL;
  const diffBS_FS = Math.round((sumBS - sumFS) * 1000) / 1000;
  const diffRise_Fall = Math.round((sumRise - sumFall) * 1000) / 1000;
  const diffRL = Math.round((lastRL - firstRL) * 1000) / 1000;

  const isBalanced =
    Math.abs(diffBS_FS - diffRise_Fall) < 0.005 && Math.abs(diffRise_Fall - diffRL) < 0.005;

  return {
    rows: calculatedRows,
    sumBS,
    sumFS,
    sumRise,
    sumFall,
    lastRL,
    firstRL,
    diffBS_FS,
    diffRise_Fall,
    diffRL,
    isBalanced,
  };
}

// ==========================================
// 16. SURVEYING: SLOPE & GRADIENT
// ==========================================
export function calculateSlopeGradient(rise: number, run: number): CalculationResult {
  const dy = isFinite(rise) ? rise : 0;
  const dx = isFinite(run) ? run : 0;

  // Zero run edge case: Vertical slope
  if (dx === 0) {
    if (dy === 0) {
      // 0 rise and 0 run: Level point
      return {
        title: 'Slope, Gradient & Rise-Run Solution',
        primaryValue: '0.00%',
        primaryUnit: 'Slope',
        secondaryValues: [
          { label: 'Gradient Ratio', value: 'Level Point (0, 0)' },
          { label: 'Pitch Angle', value: '0.00°' },
          { label: 'Hypotenuse (Slope Length)', value: '0.000 m' },
          { label: 'Rise per 100 m', value: '0.00 m' },
        ],
        breakdown: [
          { step: '1. Null Displacement', expression: 'Rise = 0, Run = 0', result: 'Level Point' },
        ],
        formula: 'Slope% = (Rise / Run) × 100 | Ratio = 1 : (Run/Rise) | Angle = arctan(Rise/Run)',
        substitutedFormula: 'Rise = 0 m, Run = 0 m → Level Point',
        inputsSummary: [
          { label: 'Vertical Rise', value: '0 m' },
          { label: 'Horizontal Run', value: '0 m' },
        ],
        assumptions: [
          { label: 'Geometry', value: 'Zero horizontal and vertical displacement.' },
        ],
        engineeringNotes: 'Level point with zero horizontal run and zero vertical rise.',
      };
    }

    // Vertical slope (Run = 0, Rise != 0)
    const isNegative = dy < 0;
    const absRise = Math.abs(dy);
    const angleDeg = isNegative ? -90 : 90;
    return {
      title: 'Slope, Gradient & Rise-Run Solution',
      primaryValue: 'Vertical (90°)',
      primaryUnit: 'Slope',
      secondaryValues: [
        { label: 'Gradient Ratio', value: 'Vertical (1 : 0 Plumb)' },
        { label: 'Pitch Angle', value: `${formatNumber(angleDeg, 2)}°` },
        { label: 'Hypotenuse (Slope Length)', value: `${formatNumber(absRise, 3)} m` },
        { label: 'Slope Classification', value: isNegative ? 'Vertical Downward Face' : 'Vertical Plumb Face' },
      ],
      breakdown: [
        { step: '1. Vertical Wall / Plumb Check', expression: `Run = 0 m, Rise = ${dy} m`, result: 'Vertical Slope (Infinite Grade)' },
        { step: '2. Pitch Angle', expression: `arctan(${dy} ÷ 0)`, result: `${formatNumber(angleDeg, 2)}°` },
        { step: '3. Vertical Height', expression: `|Rise|`, result: `${formatNumber(absRise, 3)} m` },
      ],
      formula: 'Vertical slope: Run = 0 → Angle = ±90° | Ratio = Vertical (Plumb)',
      substitutedFormula: `Rise = ${dy} m, Run = 0 m → Pitch Angle = ${formatNumber(angleDeg, 2)}°`,
      inputsSummary: [
        { label: 'Vertical Rise', value: `${dy} m` },
        { label: 'Horizontal Run', value: '0 m (Vertical)' },
      ],
      assumptions: [
        { label: 'Geometry', value: 'Zero horizontal run indicates a true vertical slope / plumb face.' },
      ],
      engineeringNotes: 'Zero horizontal run represents a purely vertical face, retaining wall, or plumb column (90° inclination). In road/drainage engineering, horizontal run must be non-zero for cross-slope or longitudinal grades.',
    };
  }

  // Level ground (Rise = 0, Run > 0)
  if (dy === 0) {
    const absRun = Math.abs(dx);
    return {
      title: 'Slope, Gradient & Rise-Run Solution',
      primaryValue: '0.00%',
      primaryUnit: 'Slope',
      secondaryValues: [
        { label: 'Gradient Ratio', value: 'Level Ground (Flat / 0%)' },
        { label: 'Pitch Angle', value: '0.00°' },
        { label: 'Hypotenuse (Slope Length)', value: `${formatNumber(absRun, 3)} m` },
        { label: 'Rise per 100 m', value: '0.00 m' },
      ],
      breakdown: [
        { step: '1. Slope Percentage', expression: `(0 ÷ ${absRun}) × 100`, result: '0.00%' },
        { step: '2. Gradient Ratio', expression: 'Level Ground (Zero vertical incline)', result: 'Level Ground (Flat / 0%)' },
        { step: '3. Pitch Angle', expression: `arctan(0 ÷ ${absRun})`, result: '0.00°' },
      ],
      formula: 'Slope% = (Rise / Run) × 100 | Ratio = 1 : (Run/Rise) | Angle = arctan(Rise/Run)',
      substitutedFormula: `Slope% = (0 / ${absRun}) × 100 = 0.00% (Level Ground)`,
      inputsSummary: [
        { label: 'Vertical Rise', value: '0 m (Level Ground)' },
        { label: 'Horizontal Run', value: `${absRun} m` },
      ],
      assumptions: [
        { label: 'Ground Condition', value: 'Level ground with zero vertical elevation difference.' },
      ],
      engineeringNotes: 'Zero rise represents completely level / flat ground. Note that for paved roads and roofs, standard minimum drainage slopes (typically 1% to 2% / 1:100 to 1:50) are recommended to prevent standing water ponding.',
    };
  }

  // General slope (positive or negative rise)
  const isDownhill = dy < 0;
  const absDy = Math.abs(dy);
  const slopePct = (dy / dx) * 100;
  const ratioN = dx / absDy;
  const angleRad = Math.atan(dy / dx);
  const angleDeg = (angleRad * 180) / Math.PI;
  const hypotenuse = Math.sqrt(dy * dy + dx * dx);

  const ratioLabel = isDownhill
    ? `1 : ${formatNumber(ratioN, 2)} (Fall / Downgrade)`
    : `1 : ${formatNumber(ratioN, 2)}`;

  return {
    title: 'Slope, Gradient & Rise-Run Solution',
    primaryValue: `${formatNumber(slopePct, 2)}%`,
    primaryUnit: isDownhill ? 'Slope (Fall)' : 'Slope',
    secondaryValues: [
      { label: 'Gradient Ratio', value: ratioLabel },
      { label: 'Pitch Angle', value: `${formatNumber(angleDeg, 2)}°` },
      { label: 'Hypotenuse (Slope Length)', value: `${formatNumber(hypotenuse, 3)} m` },
      { label: isDownhill ? 'Fall per 100 m' : 'Rise per 100 m', value: `${formatNumber(Math.abs(slopePct), 2)} m` },
    ],
    breakdown: [
      { step: '1. Slope Percentage', expression: `(${dy} ÷ ${dx}) × 100`, result: `${formatNumber(slopePct, 2)}%` },
      { step: '2. Gradient Ratio (1 in N)', expression: isDownhill ? `1 in (${dx} ÷ ${absDy}) (Fall)` : `1 in (${dx} ÷ ${absDy})`, result: ratioLabel },
      { step: '3. Incline Angle in Degrees', expression: `arctan(${dy} ÷ ${dx}) × (180/π)`, result: `${formatNumber(angleDeg, 2)}°` },
      { step: '4. True Slope Distance (Hypotenuse)', expression: `√(${dy}² + ${dx}²)`, result: `${formatNumber(hypotenuse, 3)} m` },
    ],
    formula: 'Slope% = (Rise / Run) × 100 | Ratio = 1 : (|Run|/|Rise|) | Angle = arctan(Rise/Run)',
    substitutedFormula: `Slope% = (${dy} / ${dx}) × 100 = ${formatNumber(slopePct, 2)}%`,
    inputsSummary: [
      { label: isDownhill ? 'Vertical Fall (Negative Rise)' : 'Vertical Rise', value: `${dy} m` },
      { label: 'Horizontal Run', value: `${dx} m` },
    ],
    assumptions: [
      { label: 'Units Consistency', value: 'Rise and Run must be entered in identical units (both meters or both feet).' },
      { label: 'Slope Orientation', value: isDownhill ? 'Negative rise represents a downhill gradient (fall / downgrade).' : 'Positive rise represents an uphill gradient (rise / upgrade).' },
    ],
    engineeringNotes: isDownhill
      ? 'Negative rise denotes a fall or downward slope. Drainage channels, sewers, and downhill highway ramps commonly operate in this range (1% to 2% minimum for self-cleansing velocity per ASCE/CPHEEO).'
      : 'Drainage pipes typically use 1% to 2% (1:100 to 1:50) slope. Wheelchair accessible ramps must not exceed 1:12 (~8.33%) per universal accessibility building codes (ADA / BNBC).',
  };
}

// ==========================================
// 17. DMS ↔ DECIMAL DEGREES
// ==========================================
export function convertDMS(val: number, mode: 'dec_to_dms' | 'dms_to_dec', mins: number = 0, secs: number = 0): {
  decDeg: number;
  d: number;
  m: number;
  s: number;
  formatted: string;
} {
  if (mode === 'dec_to_dms') {
    const isNegative = val < 0;
    const absVal = Math.abs(isFinite(val) ? val : 0);
    let d = Math.floor(absVal);
    const minFrac = (absVal - d) * 60;
    let m = Math.floor(minFrac);
    let s = Math.round((minFrac - m) * 60 * 100) / 100;
    if (s >= 60) {
      s = 0;
      m += 1;
    }
    if (m >= 60) {
      m = 0;
      d += 1;
    }
    const signPrefix = isNegative ? '-' : '';
    const formatted = `${signPrefix}${d}° ${m.toString().padStart(2, '0')}' ${s.toFixed(2).padStart(5, '0')}"`;
    return {
      decDeg: val,
      d: isNegative ? -d : d,
      m,
      s,
      formatted,
    };
  } else {
    const isNegative = val < 0 || Object.is(val, -0);
    const absDeg = Math.abs(val);
    const safeM = Math.max(0, Math.min(59.9999, mins));
    const safeS = Math.max(0, Math.min(59.9999, secs));
    const dec = (isNegative ? -1 : 1) * (absDeg + safeM / 60 + safeS / 3600);
    return {
      decDeg: dec,
      d: val,
      m: mins,
      s: secs,
      formatted: `${formatNumber(dec, 6)}°`,
    };
  }
}

// ==========================================
// 18. COORDINATE DISTANCE & AZIMUTH / BEARING
// ==========================================
export function calculateCoordinates(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CalculationResult {
  const dx = x2 - x1; // Easting difference
  const dy = y2 - y1; // Northing difference
  const dist = Math.sqrt(dx * dx + dy * dy);

  let rad = Math.atan2(dx, dy); // Azimuth clockwise from North
  if (rad < 0) rad += 2 * Math.PI;
  const deg = (rad * 180) / Math.PI;

  const dms = convertDMS(deg, 'dec_to_dms');

  // Quadrant bearing (e.g. N 35° 12' E)
  let quad = '';
  let quadDeg = deg;
  if (deg >= 0 && deg <= 90) {
    quad = `N ${dms.d}° ${dms.m}' ${dms.s.toFixed(1)}" E`;
  } else if (deg > 90 && deg <= 180) {
    quadDeg = 180 - deg;
    const qDms = convertDMS(quadDeg, 'dec_to_dms');
    quad = `S ${qDms.d}° ${qDms.m}' ${qDms.s.toFixed(1)}" E`;
  } else if (deg > 180 && deg <= 270) {
    quadDeg = deg - 180;
    const qDms = convertDMS(quadDeg, 'dec_to_dms');
    quad = `S ${qDms.d}° ${qDms.m}' ${qDms.s.toFixed(1)}" W`;
  } else {
    quadDeg = 360 - deg;
    const qDms = convertDMS(quadDeg, 'dec_to_dms');
    quad = `N ${qDms.d}° ${qDms.m}' ${qDms.s.toFixed(1)}" W`;
  }

  return {
    title: 'Coordinate Distance & Azimuth / Bearing',
    primaryValue: formatNumber(dist, 3),
    primaryUnit: 'm (Distance)',
    secondaryValues: [
      { label: 'Whole Circle Bearing (WCB)', value: `${formatNumber(deg, 3)}° (${dms.formatted})` },
      { label: 'Reduced / Quadrant Bearing', value: quad },
      { label: 'Δ Easting (ΔX)', value: `${formatNumber(dx, 3)} m` },
      { label: 'Δ Northing (ΔY)', value: `${formatNumber(dy, 3)} m` },
    ],
    breakdown: [
      { step: '1. Departure (ΔX) & Latitude (ΔY)', expression: `ΔX = ${x2} - ${x1}; ΔY = ${y2} - ${y1}`, result: `ΔX = ${formatNumber(dx, 3)}m, ΔY = ${formatNumber(dy, 3)}m` },
      { step: '2. Horizontal Distance', expression: `√(ΔX² + ΔY²)`, result: `${formatNumber(dist, 3)} m` },
      { step: '3. Whole Circle Bearing (WCB)', expression: `arctan(ΔX / ΔY) measured clockwise from North`, result: `${formatNumber(deg, 3)}°` },
      { step: '4. Quadrantal Bearing Conversion', expression: `Quadrant mapping`, result: quad },
    ],
    formula: 'D = √((X2 - X1)² + (Y2 - Y1)²) | Bearing = arctan((X2 - X1) / (Y2 - Y1))',
    substitutedFormula: `D = √(${formatNumber(dx, 3)}² + ${formatNumber(dy, 3)}²) = ${formatNumber(dist, 3)} m`,
    inputsSummary: [
      { label: 'Point 1 (X1, Y1)', value: `(${x1}, ${y1})` },
      { label: 'Point 2 (X2, Y2)', value: `(${x2}, ${y2})` },
    ],
    assumptions: [
      { label: 'Coordinate System', value: 'Planar grid coordinates (Easting = X, Northing = Y). For long geodetic baselines (>5 km), apply earth curvature and map projection scale factors.' },
    ],
    engineeringNotes: 'Used for setting out building centerlines, bridge pier alignments, and traversing checks in land surveying.',
  };
}

// ==========================================
// 19. ROAD CHAINAGE & STATIONS
// ==========================================
export function calculateChainage(
  startChainageM: number,
  totalDistanceM: number,
  intervalM: number = 20
): { stations: { chainageStr: string; distanceM: number; index: number }[] } {
  const start = Math.max(0, startChainageM);
  const dist = Math.max(0, totalDistanceM);
  const interval = Math.max(1, intervalM);

  const stations: { chainageStr: string; distanceM: number; index: number }[] = [];
  let current = start;
  let idx = 0;

  while (current <= start + dist) {
    const km = Math.floor(current / 1000);
    const m = current % 1000;
    const chainageStr = `${km}+${m.toFixed(1).padStart(5, '0')}`;
    stations.push({ chainageStr, distanceM: current, index: idx });
    current += interval;
    idx++;
  }

  // Include exact end station if not matched
  const endDist = start + dist;
  if (stations[stations.length - 1]?.distanceM !== endDist && endDist > start) {
    const km = Math.floor(endDist / 1000);
    const m = endDist % 1000;
    stations.push({
      chainageStr: `${km}+${m.toFixed(1).padStart(5, '0')}`,
      distanceM: endDist,
      index: idx,
    });
  }

  return { stations };
}

// ==========================================
// 20. RATE ANALYSIS FOR 1 m³ CONCRETE
// ==========================================
export function calculateConcreteRateAnalysis(
  cementBagRate: number = 550,     // ৳ per bag
  sandCftRate: number = 45,        // ৳ per CFT
  stoneCftRate: number = 130,      // ৳ per CFT
  masonDayRate: number = 900,      // ৳ per mason
  helperDayRate: number = 650,     // ৳ per helper
  mixerVibratorRate: number = 350,  // ৳ per m³
  contractorProfitPct: number = 10,
  overheadPct: number = 5
): CalculationResult {
  // Quantities for 1 m³ nominal M20 (1:1.5:3) concrete:
  // Cement: ~8.2 bags
  // Sand: ~15.2 CFT
  // Stone Chips: ~30.4 CFT
  // Labor per m³: ~0.4 mason, ~2.5 helpers
  const cementQty = 8.2;
  const sandQty = 15.2;
  const stoneQty = 30.4;
  const masonDays = 0.45;
  const helperDays = 2.8;

  const cementCost = cementQty * cementBagRate;
  const sandCost = sandQty * sandCftRate;
  const stoneCost = stoneQty * stoneCftRate;
  const totalMaterialCost = cementCost + sandCost + stoneCost;

  const laborCost = masonDays * masonDayRate + helperDays * helperDayRate;
  const equipCost = mixerVibratorRate;

  const directCost = totalMaterialCost + laborCost + equipCost;
  const overheadAmount = directCost * (overheadPct / 100);
  const profitAmount = (directCost + overheadAmount) * (contractorProfitPct / 100);
  const totalUnitRate = directCost + overheadAmount + profitAmount;

  return {
    title: 'Unit Rate Analysis: 1 m³ Concrete (1:1.5:3)',
    primaryValue: formatCurrency(totalUnitRate),
    primaryUnit: 'per m³',
    secondaryValues: [
      { label: 'Rate per CFT', value: formatCurrency(totalUnitRate / 35.3147) },
      { label: 'Materials Subtotal', value: formatCurrency(totalMaterialCost) },
      { label: 'Labor Subtotal', value: formatCurrency(laborCost) },
      { label: 'Plant & Equipment', value: formatCurrency(equipCost) },
      { label: 'Overhead & Profit', value: formatCurrency(overheadAmount + profitAmount) },
    ],
    breakdown: [
      { step: '1. Cement (8.2 bags)', expression: `8.2 bags × ${formatCurrency(cementBagRate)}`, result: formatCurrency(cementCost) },
      { step: '2. Fine Sand (15.2 CFT)', expression: `15.2 CFT × ${formatCurrency(sandCftRate)}`, result: formatCurrency(sandCost) },
      { step: '3. Coarse Stone Aggregate (30.4 CFT)', expression: `30.4 CFT × ${formatCurrency(stoneCftRate)}`, result: formatCurrency(stoneCost) },
      { step: '4. Skilled & Unskilled Labor', expression: `(0.45 Mason × ${formatCurrency(masonDayRate)}) + (2.8 Helper × ${formatCurrency(helperDayRate)})`, result: formatCurrency(laborCost) },
      { step: '5. Mixer & Needle Vibrator', expression: `Batching & casting tools`, result: formatCurrency(equipCost) },
      { step: '6. Direct Prime Cost', expression: `Materials + Labor + Equipment`, result: formatCurrency(directCost) },
      { step: '7. Overhead & Contractor Profit', expression: `${overheadPct}% Overhead + ${contractorProfitPct}% Profit`, result: formatCurrency(overheadAmount + profitAmount) },
    ],
    formula: 'Unit Rate = Material Cost + Labor Cost + Equipment + Overhead% + Profit%',
    substitutedFormula: `Total Rate = ${formatCurrency(directCost)} + ${formatCurrency(overheadAmount + profitAmount)} = ${formatCurrency(totalUnitRate)} / m³`,
    inputsSummary: [
      { label: 'Cement Rate', value: `${formatCurrency(cementBagRate)} / bag` },
      { label: 'Sand Rate', value: `${formatCurrency(sandCftRate)} / CFT` },
      { label: 'Stone Rate', value: `${formatCurrency(stoneCftRate)} / CFT` },
      { label: 'Mason / Helper Wage', value: `${formatCurrency(masonDayRate)} / ${formatCurrency(helperDayRate)} per day` },
    ],
    assumptions: [
      { label: 'Mix Proportions', value: '1:1.5:3 nominal volumetric ratio with 1.54 dry volume factor and standard density.' },
      { label: 'Labor Productivity', value: 'Based on standard schedule of rates (PWD / CPWD standard labor coefficients).' },
    ],
    engineeringNotes: 'Adjust market rates in the input fields according to current local vendor quotations in your site jurisdiction.',
    isPreliminary: true,
  };
}

// ==========================================
// 21. GEOMETRY 2D & 3D SOLVER
// ==========================================
export function calculateGeometry(
  shape: 'rectangle' | 'triangle' | 'circle' | 'semicircle' | 'trapezoid' | 'cylinder' | 'cone' | 'sphere',
  dims: { a?: number; b?: number; c?: number; r?: number; h?: number }
): CalculationResult {
  let primaryVal = 0;
  let unit = '';
  let formulaStr = '';
  let substituted = '';
  const secondaries: { label: string; value: string; unit?: string }[] = [];

  const a = Math.max(0, dims.a || 0);
  const b = Math.max(0, dims.b || 0);
  const c = Math.max(0, dims.c || 0);
  const r = Math.max(0, dims.r || 0);
  const h = Math.max(0, dims.h || 0);

  switch (shape) {
    case 'rectangle': {
      primaryVal = a * b;
      unit = 'm² (Area)';
      formulaStr = 'Area = Length × Width | Perimeter = 2(L + W)';
      substituted = `Area = ${a} × ${b} = ${formatNumber(primaryVal, 2)} m²`;
      secondaries.push({ label: 'Perimeter', value: `${formatNumber(2 * (a + b), 2)} m` });
      secondaries.push({ label: 'Diagonal', value: `${formatNumber(Math.sqrt(a * a + b * b), 2)} m` });
      break;
    }
    case 'triangle': {
      // If 3 sides given: Heron's formula; if base + height: 0.5 * b * h
      if (a > 0 && b > 0 && c > 0) {
        const s = (a + b + c) / 2;
        primaryVal = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        formulaStr = 'Area = √(s(s-a)(s-b)(s-c)) [Heron\'s Formula]';
        substituted = `s = ${s} m; Area = ${formatNumber(primaryVal, 2)} m²`;
        secondaries.push({ label: 'Perimeter', value: `${formatNumber(a + b + c, 2)} m` });
      } else {
        primaryVal = 0.5 * b * h;
        formulaStr = 'Area = 0.5 × Base × Height';
        substituted = `Area = 0.5 × ${b} × ${h} = ${formatNumber(primaryVal, 2)} m²`;
      }
      unit = 'm² (Area)';
      break;
    }
    case 'circle': {
      primaryVal = Math.PI * r * r;
      unit = 'm² (Area)';
      formulaStr = 'Area = π × R² | Circumference = 2 × π × R';
      substituted = `Area = π × ${r}² = ${formatNumber(primaryVal, 3)} m²`;
      secondaries.push({ label: 'Circumference', value: `${formatNumber(2 * Math.PI * r, 3)} m` });
      secondaries.push({ label: 'Diameter', value: `${formatNumber(2 * r, 3)} m` });
      break;
    }
    case 'semicircle': {
      primaryVal = 0.5 * Math.PI * r * r;
      unit = 'm² (Area)';
      formulaStr = 'Area = 0.5 × π × R² | Perimeter = πR + 2R';
      substituted = `Area = 0.5 × π × ${r}² = ${formatNumber(primaryVal, 3)} m²`;
      secondaries.push({ label: 'Perimeter', value: `${formatNumber(Math.PI * r + 2 * r, 3)} m` });
      break;
    }
    case 'trapezoid': {
      primaryVal = 0.5 * (a + b) * h;
      unit = 'm² (Area)';
      formulaStr = 'Area = 0.5 × (Base1 + Base2) × Height';
      substituted = `Area = 0.5 × (${a} + ${b}) × ${h} = ${formatNumber(primaryVal, 2)} m²`;
      break;
    }
    case 'cylinder': {
      primaryVal = Math.PI * r * r * h;
      unit = 'm³ (Volume)';
      const curvedArea = 2 * Math.PI * r * h;
      const totalArea = curvedArea + 2 * Math.PI * r * r;
      formulaStr = 'Volume = π × R² × H | Curved Area = 2πRH';
      substituted = `Volume = π × ${r}² × ${h} = ${formatNumber(primaryVal, 3)} m³`;
      secondaries.push({ label: 'Curved Surface Area', value: `${formatNumber(curvedArea, 2)} m²` });
      secondaries.push({ label: 'Total Surface Area', value: `${formatNumber(totalArea, 2)} m²` });
      break;
    }
    case 'cone': {
      primaryVal = (1 / 3) * Math.PI * r * r * h;
      unit = 'm³ (Volume)';
      const slantL = Math.sqrt(r * r + h * h);
      const curvedArea = Math.PI * r * slantL;
      formulaStr = 'Volume = (1/3) × π × R² × H | Slant L = √(R² + H²)';
      substituted = `Volume = (1/3) × π × ${r}² × ${h} = ${formatNumber(primaryVal, 3)} m³`;
      secondaries.push({ label: 'Slant Height (L)', value: `${formatNumber(slantL, 3)} m` });
      secondaries.push({ label: 'Curved Surface Area', value: `${formatNumber(curvedArea, 2)} m²` });
      break;
    }
    case 'sphere': {
      primaryVal = (4 / 3) * Math.PI * Math.pow(r, 3);
      unit = 'm³ (Volume)';
      const surfArea = 4 * Math.PI * r * r;
      formulaStr = 'Volume = (4/3) × π × R³ | Surface Area = 4πR²';
      substituted = `Volume = (4/3) × π × ${r}³ = ${formatNumber(primaryVal, 3)} m³`;
      secondaries.push({ label: 'Surface Area', value: `${formatNumber(surfArea, 2)} m²` });
      break;
    }
  }

  return {
    title: `Geometry Solver: ${shape.toUpperCase()}`,
    primaryValue: formatNumber(primaryVal, 3),
    primaryUnit: unit,
    secondaryValues: secondaries,
    breakdown: [
      { step: '1. Geometric Evaluation', expression: formulaStr, result: `${formatNumber(primaryVal, 3)} ${unit}` },
    ],
    formula: formulaStr,
    substitutedFormula: substituted,
    inputsSummary: [
      { label: 'Geometric Shape', value: shape.toUpperCase() },
      ...(dims.a ? [{ label: 'Side A / Base 1', value: `${dims.a} m` }] : []),
      ...(dims.b ? [{ label: 'Side B / Base 2', value: `${dims.b} m` }] : []),
      ...(dims.c ? [{ label: 'Side C', value: `${dims.c} m` }] : []),
      ...(dims.r ? [{ label: 'Radius (R)', value: `${dims.r} m` }] : []),
      ...(dims.h ? [{ label: 'Height (H)', value: `${dims.h} m` }] : []),
    ],
    assumptions: [
      { label: 'Euclidean Geometry', value: 'Calculated using exact Euclidean geometric theorems and π ≈ 3.14159265.' },
    ],
    engineeringNotes: 'Used for retention ponds, tank capacities, conical stockpiles, and irregular parcel boundary calculations.',
  };
}

// ==========================================
// 22. ISOLATED & STEPPED FOOTING CALCULATOR
// ==========================================
export function calculateIsolatedFooting(params: {
  baseLengthM: number;
  baseWidthM: number;
  baseEdgeH1M: number;
  slopedH2M: number;
  colPadLengthM: number;
  colPadWidthM: number;
  pccOffsetMm?: number;
  pccThkMm?: number;
  rebarDiaMm?: number;
  rebarSpacingMm?: number;
  quantity?: number;
}): CalculationResult {
  const L = Math.max(0.1, params.baseLengthM);
  const W = Math.max(0.1, params.baseWidthM);
  const h1 = Math.max(0, params.baseEdgeH1M);
  const h2 = Math.max(0, params.slopedH2M);
  const l_col = Math.max(0.1, params.colPadLengthM);
  const w_col = Math.max(0.1, params.colPadWidthM);
  const pccOffset = (params.pccOffsetMm || 75) / 1000;
  const pccThk = (params.pccThkMm || 75) / 1000;
  const barDia = params.rebarDiaMm || 12;
  const barSpacing = (params.rebarSpacingMm || 150) / 1000;
  const qty = Math.max(1, params.quantity || 1);

  // Lower Rectangular Box Volume: V1 = L * W * h1
  const v1 = L * W * h1;

  // Upper Truncated Pyramid (Prismoidal Frustum): V2 = (h2 / 3) * (A1 + A2 + sqrt(A1 * A2))
  const A1 = L * W;
  const A2 = l_col * w_col;
  const v2 = h2 > 0 ? (h2 / 3) * (A1 + A2 + Math.sqrt(A1 * A2)) : 0;
  const singleVolM3 = v1 + v2;
  const totalVolM3 = singleVolM3 * qty;

  // PCC Volume: (L + 2*offset) * (W + 2*offset) * pccThk * qty
  const pccL = L + 2 * pccOffset;
  const pccW = W + 2 * pccOffset;
  const singlePccVolM3 = pccL * pccW * pccThk;
  const totalPccVolM3 = singlePccVolM3 * qty;

  // Bottom Rebar Mesh (Bidirectional bottom steel)
  // Number of bars along L: (W - 2*cover) / spacing + 1
  const clearCover = 0.05; // 50mm footing cover
  const effL = Math.max(0.1, L - 2 * clearCover);
  const effW = Math.max(0.1, W - 2 * clearCover);
  const numBarsAlongL = Math.ceil(effW / barSpacing) + 1;
  const numBarsAlongW = Math.ceil(effL / barSpacing) + 1;
  const barUnitWeight = (barDia * barDia) / 162.2;
  const totalBarLength = (numBarsAlongL * effL + numBarsAlongW * effW) * qty;
  const totalMeshSteelKg = totalBarLength * barUnitWeight;

  return {
    title: 'Isolated Sloped Footing Concrete & Rebar',
    primaryValue: formatNumber(totalVolM3, 3),
    primaryUnit: 'm³ RCC Concrete',
    secondaryValues: [
      { label: 'Volume per Footing', value: `${formatNumber(singleVolM3, 3)} m³ (${formatNumber(singleVolM3 * 35.3147, 1)} CFT)` },
      { label: 'PCC Bed Concrete', value: `${formatNumber(totalPccVolM3, 3)} m³ (1:3:6 Lean)` },
      { label: 'Bottom Rebar Mesh', value: `${formatNumber(totalMeshSteelKg, 1)} kg (Ø${barDia}mm)` },
      { label: 'Footing Base Area', value: `${formatNumber(L * W, 2)} m² (${formatNumber(L * W * 10.7639, 1)} sq.ft)` },
      { label: 'Lower Box Volume (V1)', value: `${formatNumber(v1, 3)} m³` },
      { label: 'Upper Frustum (V2)', value: `${formatNumber(v2, 3)} m³` },
    ],
    breakdown: [
      { step: '1. Lower Rectangular Base Volume (V1)', expression: `${L}m × ${W}m × ${h1}m`, result: `${formatNumber(v1, 3)} m³` },
      { step: '2. Upper Trapezoidal Frustum Volume (V2)', expression: `(${h2}/3) × [(${formatNumber(A1, 2)}) + (${formatNumber(A2, 2)}) + √(${formatNumber(A1 * A2, 2)})]`, result: `${formatNumber(v2, 3)} m³` },
      { step: '3. Total Footing Concrete (V1 + V2) × Qty', expression: `(${formatNumber(singleVolM3, 3)}) × ${qty}`, result: `${formatNumber(totalVolM3, 3)} m³` },
      { step: '4. PCC Lean Concrete Bed Volume', expression: `${formatNumber(pccL, 2)}m × ${formatNumber(pccW, 2)}m × ${pccThk}m × ${qty}`, result: `${formatNumber(totalPccVolM3, 3)} m³` },
      { step: '5. Bottom Reinforcement Mesh Weight', expression: `${formatNumber(totalBarLength, 1)} m × (${barDia}²/162.2 kg/m)`, result: `${formatNumber(totalMeshSteelKg, 1)} kg` },
    ],
    formula: 'V_footing = (L × W × h₁) + [h₂ / 3 × (A₁ + A₂ + √(A₁ × A₂))]',
    substitutedFormula: `V = (${L}×${W}×${h1}) + [${h2}/3 × (${formatNumber(A1, 2)} + ${formatNumber(A2, 2)} + ${formatNumber(Math.sqrt(A1 * A2), 2)})] = ${formatNumber(singleVolM3, 3)} m³`,
    inputsSummary: [
      { label: 'Footing Base (L × W)', value: `${L} × ${W} m` },
      { label: 'Vertical Edge (h1)', value: `${h1} m` },
      { label: 'Sloped Frustum (h2)', value: `${h2} m` },
      { label: 'Column Base Pad', value: `${l_col} × ${w_col} m` },
      { label: 'Quantity', value: `${qty} footings` },
      { label: 'Bottom Rebar', value: `Ø${barDia}mm @ ${params.rebarSpacingMm || 150}mm c/c` },
    ],
    assumptions: [
      { label: 'Clear Cover', value: '50 mm bottom clear cover for footings cast against lean concrete PCC.' },
      { label: 'PCC Projection', value: '75 mm (3") standard projection beyond footing edges.' },
    ],
    engineeringNotes: 'Ensure soil subgrade bearing capacity (SBC) is verified before placing PCC. Sloped top surface should maintain a minimum slope to allow proper concrete compaction without sliding.',
  };
}

// ==========================================
// 23. FORMWORK / SHUTTERING AREA CALCULATOR
// ==========================================
export function calculateFormwork(
  memberType: 'slab' | 'beam' | 'column' | 'footing' | 'retaining_wall',
  params: {
    lengthM?: number;
    widthM?: number;
    heightM?: number;
    depthM?: number;
    diameterM?: number;
    quantity?: number;
  }
): CalculationResult {
  const L = Math.max(0, params.lengthM || 0);
  const W = Math.max(0, params.widthM || 0);
  const H = Math.max(0, params.heightM || 0);
  const D = Math.max(0, params.depthM || 0);
  const dia = Math.max(0, params.diameterM || 0);
  const qty = Math.max(1, params.quantity || 1);

  let singleAreaM2 = 0;
  let formulaStr = '';
  let subStr = '';

  switch (memberType) {
    case 'slab':
      // Soffit area + perimeter edge forms
      singleAreaM2 = L * W + 2 * (L + W) * D;
      formulaStr = 'Area = (L × W) + 2 × (L + W) × Thickness [Soffit + Edge Formwork]';
      subStr = `Area = (${L} × ${W}) + 2 × (${L} + ${W}) × ${D} = ${formatNumber(singleAreaM2, 2)} m²`;
      break;
    case 'beam':
      // Soffit (bottom) + two sides: (B + 2*D) * L
      singleAreaM2 = (W + 2 * D) * L;
      formulaStr = 'Area = (Width + 2 × Depth) × Span Length [Bottom + 2 Vertical Sides]';
      subStr = `Area = (${W} + 2 × ${D}) × ${L} = ${formatNumber(singleAreaM2, 2)} m²`;
      break;
    case 'column':
      if (dia > 0) {
        // Circular column: π * D * H
        singleAreaM2 = Math.PI * dia * H;
        formulaStr = 'Area = π × Diameter × Height [Curved Shuttering]';
        subStr = `Area = π × ${dia} × ${H} = ${formatNumber(singleAreaM2, 2)} m²`;
      } else {
        // Rectangular column: 2 * (W + D) * H
        singleAreaM2 = 2 * (W + D) * H;
        formulaStr = 'Area = 2 × (Width + Depth) × Column Height [4 Vertical Sides]';
        subStr = `Area = 2 × (${W} + ${D}) × ${H} = ${formatNumber(singleAreaM2, 2)} m²`;
      }
      break;
    case 'footing':
      // Vertical perimeter edge forms: 2 * (L + W) * H
      singleAreaM2 = 2 * (L + W) * H;
      formulaStr = 'Area = 2 × (Length + Width) × Footing Height [Vertical Perimeter Sides]';
      subStr = `Area = 2 × (${L} + ${W}) × ${H} = ${formatNumber(singleAreaM2, 2)} m²`;
      break;
    case 'retaining_wall':
      // Both faces + ends: 2 * (L * H) + 2 * (W * H)
      singleAreaM2 = 2 * (L * H) + 2 * (W * H);
      formulaStr = 'Area = 2 × (Length × Height) + 2 × (Thickness × Height) [Both Faces]';
      subStr = `Area = 2 × (${L} × ${H}) + 2 × (${W} × ${H}) = ${formatNumber(singleAreaM2, 2)} m²`;
      break;
  }

  const totalAreaM2 = singleAreaM2 * qty;
  const totalAreaSqFt = totalAreaM2 * 10.7639;

  // Number of standard 8ft x 4ft (2.44m x 1.22m = 2.977 m²) plywood sheets needed
  const plywoodSheetArea = 2.44 * 1.22;
  const plywoodSheets = Math.ceil(totalAreaM2 / plywoodSheetArea);

  return {
    title: `Formwork & Shuttering Area: ${memberType.replace('_', ' ').toUpperCase()}`,
    primaryValue: formatNumber(totalAreaM2, 2),
    primaryUnit: 'm² Shuttering Contact Area',
    secondaryValues: [
      { label: 'Area in Sq.Ft', value: `${formatNumber(totalAreaSqFt, 1)} sq.ft` },
      { label: 'Plywood Sheets (8\'×4\')', value: `${plywoodSheets} sheets (2.98 m²/sheet)` },
      { label: 'Formwork per Unit', value: `${formatNumber(singleAreaM2, 2)} m²` },
      { label: 'Quantity of Members', value: `${qty} pcs` },
    ],
    breakdown: [
      { step: '1. Contact Surface Calculation', expression: formulaStr, result: `${formatNumber(singleAreaM2, 2)} m² / member` },
      { step: '2. Total Shuttering Area', expression: `${formatNumber(singleAreaM2, 2)} m² × ${qty}`, result: `${formatNumber(totalAreaM2, 2)} m²` },
      { step: '3. Imperial Conversion', expression: `${formatNumber(totalAreaM2, 2)} m² × 10.7639`, result: `${formatNumber(totalAreaSqFt, 1)} sq.ft` },
      { step: '4. Estimated Plywood (8ft × 4ft)', expression: `${formatNumber(totalAreaM2, 2)} m² ÷ 2.977 m²`, result: `${plywoodSheets} sheets` },
    ],
    formula: formulaStr,
    substitutedFormula: subStr,
    inputsSummary: [
      { label: 'Member Type', value: memberType.replace('_', ' ').toUpperCase() },
      ...(L > 0 ? [{ label: 'Length', value: `${L} m` }] : []),
      ...(W > 0 ? [{ label: 'Width', value: `${W} m` }] : []),
      ...(H > 0 ? [{ label: 'Height', value: `${H} m` }] : []),
      ...(D > 0 ? [{ label: 'Depth/Thickness', value: `${D} m` }] : []),
      ...(dia > 0 ? [{ label: 'Diameter', value: `${dia} m` }] : []),
      { label: 'Quantity', value: `${qty} members` },
    ],
    assumptions: [
      { label: 'Staging & Props', value: 'Props, walers, ties, and bracing are extra and calculated separately from contact area.' },
      { label: 'Repetition Factor', value: 'Plywood sheets can typically be reused 3–5 times with proper release oil application.' },
    ],
    engineeringNotes: 'Ensure formwork is rigid, leak-proof at joints to prevent slurry loss (honeycombing), and properly braced against hydrostatic concrete pressure.',
  };
}

// ==========================================
// 24. EARTHWORK TRUCK & TROLLEY LOAD CALCULATOR
// ==========================================
export function calculateTruckLoads(params: {
  excavatedBankVolM3: number;
  bulkingFactor: number;
  vehicleCapacityM3: number;
  tripRate: number;
  soilLooseDensityKgM3?: number;
}): CalculationResult {
  const bankVol = Math.max(0, params.excavatedBankVolM3);
  const bulking = Math.max(1, params.bulkingFactor || 1.25);
  const capM3 = Math.max(0.5, params.vehicleCapacityM3 || 5);
  const rate = Math.max(0, params.tripRate || 0);
  const density = params.soilLooseDensityKgM3 || 1400; // kg/m³ loose soil

  const looseVolM3 = bankVol * bulking;
  const looseVolCFT = looseVolM3 * 35.3147;
  const totalTrips = Math.ceil(looseVolM3 / capM3);
  const totalMassTonnes = (looseVolM3 * density) / 1000;
  const tonnesPerTrip = totalMassTonnes / (totalTrips || 1);
  const totalCost = totalTrips * rate;

  return {
    title: 'Earthwork Truck & Trolley Haulage Trips',
    primaryValue: formatNumber(totalTrips, 0),
    primaryUnit: 'Vehicle Trips',
    secondaryValues: [
      { label: 'Loose Volume to Haul', value: `${formatNumber(looseVolM3, 2)} m³ (${formatNumber(looseVolCFT, 1)} CFT)` },
      { label: 'In-situ Bank Volume', value: `${formatNumber(bankVol, 2)} m³ (${formatNumber(bankVol * 35.3147, 1)} CFT)` },
      { label: 'Total Soil Mass', value: `${formatNumber(totalMassTonnes, 1)} Metric Tonnes` },
      { label: 'Payload per Trip', value: `≈ ${formatNumber(tonnesPerTrip, 1)} Tonnes` },
      ...(rate > 0 ? [{ label: 'Total Haulage Cost', value: formatCurrency(totalCost) }] : []),
    ],
    breakdown: [
      { step: '1. Bulked Loose Volume (LCM)', expression: `${bankVol} m³ (BCM) × ${bulking} (Bulking Factor)`, result: `${formatNumber(looseVolM3, 2)} m³` },
      { step: '2. Required Haulage Trips', expression: `⌈${formatNumber(looseVolM3, 2)} m³ ÷ ${capM3} m³/trip⌉`, result: `${totalTrips} trips` },
      { step: '3. Total Soil Haul Mass', expression: `${formatNumber(looseVolM3, 2)} m³ × ${density} kg/m³ ÷ 1000`, result: `${formatNumber(totalMassTonnes, 1)} tonnes` },
      ...(rate > 0 ? [{ step: '4. Total Transportation Cost', expression: `${totalTrips} trips × ${rate}/trip`, result: formatCurrency(totalCost) }] : []),
    ],
    formula: 'Trips = ⌈(Bank Volume × Bulking Factor) ÷ Vehicle Capacity⌉',
    substitutedFormula: `Trips = ⌈(${bankVol} × ${bulking}) ÷ ${capM3}⌉ = ⌈${formatNumber(looseVolM3, 2)} ÷ ${capM3}⌉ = ${totalTrips}`,
    inputsSummary: [
      { label: 'Bank Excavation Cut', value: `${bankVol} m³` },
      { label: 'Bulking Factor', value: `${bulking}` },
      { label: 'Vehicle Body Capacity', value: `${capM3} m³ (${formatNumber(capM3 * 35.3147, 1)} CFT)` },
      ...(rate > 0 ? [{ label: 'Rate per Trip', value: formatCurrency(rate) }] : []),
    ],
    assumptions: [
      { label: 'Bulking Swell', value: 'Soil expands upon excavation into loose state. Common sand/clay: 20%–30% bulking.' },
      { label: 'Truck Capacity', value: 'Standard tractor trolley: 3–4 m³ (100–140 CFT); 2-axle dump truck: 5–6 m³ (180–210 CFT); 3-axle tipper: 10–14 m³.' },
    ],
    engineeringNotes: 'Overloading tippers beyond axle load regulations causes road damage and vehicle breakdown. Verify road permit payload limits.',
  };
}

