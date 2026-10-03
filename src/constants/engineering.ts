import { Tool, FormulaItem, RegionalProfile } from '../types';

/**
 * Fundamental Engineering Constants
 * REBAR_WEIGHT_DENOMINATOR: 162.2
 * Source/Derivation:
 *   Theoretical mass per meter of circular steel bar:
 *   W = Area × Density = (π/4 × (D/1000)²) × 7850 kg/m³
 *   W = (π/4 × 7850 / 1,000,000) × D²
 *   W = 0.0061653757... × D² = D² / 162.1978...
 *   In civil engineering field standards (BNBC, IS 1786, ASTM), this is universally
 *   standardized to the theoretical formula: Unit Weight = D² / 162.2 (kg/m).
 */
export const REBAR_WEIGHT_DENOMINATOR = 162.2;

/**
 * Standard density of carbon structural reinforcement steel: 7850 kg/m³
 */
export const STEEL_DENSITY = 7850;

export const DENSITIES = {
  steel: STEEL_DENSITY, // kg/m³
  concrete: 2400,    // kg/m³ (plain) / 2500 (RCC)
  rcc: 2500,         // kg/m³
  cement: 1440,      // kg/m³
  sand_dry: 1600,    // kg/m³
  sand_loose: 1440,  // kg/m³
  aggregate: 1500,   // kg/m³ (crushed stone)
  brick_masonry: 1920, // kg/m³
  water: 1000,       // kg/m³
  soil_compacted: 1900, // kg/m³
  soil_loose: 1400,  // kg/m³
};

export const REBAR_DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40] as const;

export const REBAR_STANDARD_DATA: Record<number, { unitWeight: number; area: number }> = {
  6: { unitWeight: 0.222, area: 28.27 },
  8: { unitWeight: 0.395, area: 50.27 },
  10: { unitWeight: 0.617, area: 78.54 },
  12: { unitWeight: 0.888, area: 113.1 },
  16: { unitWeight: 1.578, area: 201.06 },
  20: { unitWeight: 2.466, area: 314.16 },
  25: { unitWeight: 3.853, area: 490.87 },
  28: { unitWeight: 4.834, area: 615.75 },
  32: { unitWeight: 6.313, area: 804.25 },
  36: { unitWeight: 7.990, area: 1017.88 },
  40: { unitWeight: 9.864, area: 1256.64 },
};

export const STANDARD_BRICK_SIZES = [
  { name: 'Traditional / BD (9.5" × 4.5" × 2.75")', length: 241.3, width: 114.3, height: 69.85 },
  { name: 'Metric Standard (240 × 115 × 70 mm)', length: 240, width: 115, height: 70 },
  { name: 'Modular Brick (190 × 90 × 90 mm)', length: 190, width: 90, height: 90 },
  { name: 'Custom Brick Size', length: 240, width: 115, height: 70 },
];

export const CONCRETE_MIX_PRESETS = [
  { label: '1 : 1.5 : 3 (Nominal M20 - Columns/Beams)', c: 1, s: 1.5, a: 3, description: 'General RCC for beams, slabs & columns' },
  { label: '1 : 2 : 4 (Nominal M15 - General RCC)', c: 1, s: 2, a: 4, description: 'Foundations, mass concrete, plain slabs' },
  { label: '1 : 1 : 2 (Nominal M25 - Heavy Structural)', c: 1, s: 1, a: 2, description: 'Heavy loaded columns, water retaining tanks' },
  { label: '1 : 3 : 6 (Nominal M10 - Lean Concrete / PCC)', c: 1, s: 3, a: 6, description: 'Base foundation PCC, bed beneath footings' },
  { label: 'Custom Ratio', c: 1, s: 2, a: 4, description: 'User-specified cement:sand:aggregate proportion' },
];

export const PLASTER_MIX_PRESETS = [
  { label: '1 : 4 (External Plaster & Ceiling)', c: 1, s: 4, description: 'Weather-exposed walls & ceiling plaster' },
  { label: '1 : 5 (Internal Walls - Standard)', c: 1, s: 5, description: 'Standard indoor brickwork plaster' },
  { label: '1 : 6 (Internal Walls - Economy)', c: 1, s: 6, description: 'Economical internal finishing plaster' },
  { label: '1 : 3 (Waterproofing & Heavy Duty)', c: 1, s: 3, description: 'Damp-proof courses, wet area undercoats' },
  { label: 'Custom Mortar Ratio', c: 1, s: 5, description: 'User-specified cement:sand ratio' },
];

export const REGIONAL_PROFILES: Record<string, RegionalProfile> = {
  bd_standard: {
    name: 'Bangladesh Standard (Government / REHAB)',
    decimalSqFt: 435.6,
    kathaSqFt: 720.0,
    bighaKatha: 20,
    description: '1 Decimal = 435.6 sq.ft (40.468 m²), 1 Katha = 720 sq.ft (~1.65 Decimals), 1 Bigha = 20 Katha (14,400 sq.ft)',
  },
  india_standard: {
    name: 'India / West Bengal Standard',
    decimalSqFt: 435.6,
    kathaSqFt: 720.0,
    bighaKatha: 20,
    description: '1 Decimal/Satak = 435.6 sq.ft, 1 Katha = 720 sq.ft (Kolkata standard), 1 Bigha = 20 Katha',
  },
  custom: {
    name: 'Custom User Profile',
    decimalSqFt: 435.6,
    kathaSqFt: 720.0,
    bighaKatha: 20,
    description: 'User-configured land parcel unit conversions',
  },
};

export const TOOLS_CATALOG: Tool[] = [
  // Converters
  {
    id: 'unit-converter',
    name: 'Universal Unit Converter',
    category: 'converters',
    description: 'Instant conversion for Length, Area (with regional land units: decimal, katha, bigha), Volume (CFT/m³), Mass, Pressure, Force, Density, Slope & Flow.',
    icon: 'ArrowLeftRight',
    keywords: ['converter', 'units', 'feet', 'meter', 'cft', 'inch', 'decimal', 'katha', 'bigha', 'mpa', 'psi', 'kg'],
  },
  {
    id: 'feet-inch-parser',
    name: 'Feet-Inch Decimal Converter',
    category: 'utilities',
    description: 'Converts construction notation such as 5\'-6" or 12\' 4 1/2" into decimal feet, inches, meters and millimeters.',
    icon: 'Ruler',
    keywords: ['feet', 'inch', 'fraction', 'site', 'dimension', 'measurement'],
  },

  // Concrete & Materials
  {
    id: 'concrete-volume',
    name: 'Concrete Volume Calculator',
    category: 'concrete',
    description: 'Calculates wet concrete volume in m³ and CFT for slabs, beams, columns (rectangular & circular), footings and walls.',
    icon: 'Box',
    keywords: ['concrete', 'volume', 'slab', 'beam', 'column', 'footing', 'cft', 'm3'],
  },
  {
    id: 'concrete-mix',
    name: 'Concrete Material Mix (Cement, Sand, Stone)',
    category: 'concrete',
    description: 'Breakdown of cement bags (50kg), dry sand (CFT & m³), aggregate, and mixing water with dry volume factor (1.54) & wastage.',
    icon: 'Layers',
    keywords: ['concrete mix', 'cement bags', 'sand', 'aggregate', 'dry volume factor', '1:2:4', '1:1.5:3', 'water cement ratio'],
  },
  {
    id: 'wc-ratio',
    name: 'Water-Cement Ratio (w/c) Calculator',
    category: 'concrete',
    description: 'Compute water quantity required from cement mass and target w/c ratio, or reverse verify water content for desired workability.',
    icon: 'Droplets',
    keywords: ['water', 'cement', 'w/c ratio', 'slump', 'durability', 'mix design'],
  },
  {
    id: 'cement-bag',
    name: 'Cement Bags & Bulk Mass Calculator',
    category: 'concrete',
    description: 'Calculate exact number of 50 kg bags and loose cement volume from given target weight or container cubic volume.',
    icon: 'Package',
    keywords: ['cement', 'bags', '50kg', 'density', 'loose bulk'],
  },

  // Masonry & Plaster
  {
    id: 'brickwork',
    name: 'Brickwork & Mortar Estimator',
    category: 'masonry',
    description: 'Accurate brick count, mortar volume, cement bags and sand requirement for 5", 10" or custom walls with door/window deductions.',
    icon: 'Grid',
    keywords: ['brick', 'brickwork', 'masonry', 'mortar', 'sand', 'wall', 'opening deduction'],
  },
  {
    id: 'plaster',
    name: 'Wall & Ceiling Plaster Calculator',
    category: 'masonry',
    description: 'Calculate wet mortar volume, dry volume factor (1.33), cement bags, sand quantity for 12mm, 15mm or 20mm internal/external coats.',
    icon: 'Paintbrush',
    keywords: ['plaster', 'mortar', 'wall area', 'thickness', 'cement', 'sand', 'wastage'],
  },
  {
    id: 'paint',
    name: 'Paint & Surface Coating Estimator',
    category: 'masonry',
    description: 'Estimate primer, wall putty, and top coat paint in liters and gallons based on wall surface area, coats, and coverage rates.',
    icon: 'Brush',
    keywords: ['paint', 'primer', 'putty', 'coverage', 'liter', 'gallon', 'coats'],
  },
  {
    id: 'flooring-tiles',
    name: 'Flooring & Wall Tiles Calculator',
    category: 'flooring',
    description: 'Calculate number of floor/wall tiles needed, box count, grout area, and wastage allowance with room openings deduction.',
    icon: 'Square',
    keywords: ['tile', 'flooring', 'wall tiles', 'box count', 'skirting', 'wastage'],
  },

  // RCC & Reinforcement
  {
    id: 'rebar-weight',
    name: 'Rebar / Steel Weight & Cost Calculator',
    category: 'rebar',
    description: 'Calculate theoretical steel reinforcement weight using D²/162.2 or exact πD²/4×ρ. Outputs weight in kg, metric tonnes, and cost.',
    icon: 'AlignJustify',
    keywords: ['rebar', 'steel', 'weight', 'd2/162', 'diameter', 'tonne', 'cost', 'reinforcement'],
  },
  {
    id: 'bbs-helper',
    name: 'Bar Bending Schedule (BBS) Helper',
    category: 'rebar',
    description: 'Calculate cutting length and total weight for straight bars, L-bend, U-bend, and rectangular beam/column stirrups with standard hook deductions.',
    icon: 'GitFork',
    keywords: ['bbs', 'cutting length', 'stirrup', 'tie', 'hook', 'bend', 'bar bending schedule'],
  },
  {
    id: 'rcc-steel-estimator',
    name: 'Preliminary RCC Steel Estimator',
    category: 'structural',
    description: 'Preliminary reinforcement mass estimation for slabs (0.7-1%), beams (1-2%), columns (1-4%), and footings (0.5-0.8%) from concrete volume.',
    icon: 'Cpu',
    keywords: ['rcc', 'steel percentage', 'preliminary', 'reinforcement', 'kg/m3', 'structural'],
  },
  {
    id: 'slab-calculator',
    name: 'Slab Concrete & Reinforcement Helper',
    category: 'structural',
    description: 'Calculate slab volume, classification helper (One-Way Ly/Lx ≥ 2 vs Two-Way Ly/Lx < 2), preliminary rebar, and thickness conversion.',
    icon: 'Columns',
    keywords: ['slab', 'one way', 'two way', 'thickness', 'ly/lx', 'reinforcement'],
  },
  {
    id: 'beam-calculator',
    name: 'Beam Concrete & Formwork Calculator',
    category: 'structural',
    description: 'Compute beam volume, shuttering/formwork contact area (bottom + 2 sides), preliminary longitudinal rebar, and stirrup count & spacing.',
    icon: 'Minimize2',
    keywords: ['beam', 'formwork', 'shuttering', 'stirrups', 'clear cover', 'concrete'],
  },
  {
    id: 'column-calculator',
    name: 'Column Concrete & Formwork Calculator',
    category: 'structural',
    description: 'Square, rectangular and circular column volume, shuttering surface area, vertical steel estimation, and lateral tie/spiral ring count.',
    icon: 'SquareDashedBottom',
    keywords: ['column', 'ties', 'spiral', 'shuttering', 'concrete volume', 'vertical bars'],
  },
  {
    id: 'footing-calculator',
    name: 'Isolated & Stepped Footing Calculator',
    category: 'structural',
    description: 'Calculate excavation, PCC bed volume, isolated RCC footing volume (trapezoidal / stepped), and bottom rebar mesh quantity.',
    icon: 'Maximize',
    keywords: ['footing', 'foundation', 'pcc', 'trapezoid', 'isolated footing', 'excavation'],
  },
  {
    id: 'formwork-calculator',
    name: 'Formwork / Shuttering Area Calculator',
    category: 'structural',
    description: 'Contact surface area calculation for slabs, beams, columns, footing sides, and retaining walls in m² and sq.ft.',
    icon: 'PanelLeft',
    keywords: ['formwork', 'shuttering', 'plywood', 'staging', 'area', 'm2', 'sqft'],
  },
  {
    id: 'staircase-calculator',
    name: 'Staircase Geometry & Waist Slab Estimator',
    category: 'structural',
    description: 'Check 2R + T comfort rule (600–650 mm), calculate number of risers/treads, total going, flight slope angle, and waist slab concrete volume.',
    icon: 'TrendingUp',
    keywords: ['stair', 'staircase', 'riser', 'tread', 'waist slab', 'going', 'flight'],
  },

  // Earthwork
  {
    id: 'earthwork-excavation',
    name: 'Earthwork Excavation & Embankment',
    category: 'earthwork',
    description: 'Rectangular, trapezoidal trench, and sloped pit excavation volume with side slope ratio (1:m) and truck trip estimation.',
    icon: 'Mountain',
    keywords: ['earthwork', 'excavation', 'trench', 'pit', 'embankment', 'cft', 'm3'],
  },
  {
    id: 'soil-conversion',
    name: 'Soil Volume Conversion (Bank, Loose, Compacted)',
    category: 'earthwork',
    description: 'Interconvert Bank Cubic Meter (BCM), Loose Cubic Meter (LCM), and Compacted Cubic Meter (CCM) using bulking and shrinkage factors.',
    icon: 'Waves',
    keywords: ['soil', 'bulking', 'shrinkage', 'bank volume', 'loose volume', 'compacted'],
  },
  {
    id: 'truck-loads',
    name: 'Earthwork Truck & Trolley Load Calculator',
    category: 'earthwork',
    description: 'Calculate total dump truck trips or tractor trolley loads required based on excavated soil volume and vehicle capacity.',
    icon: 'Truck',
    keywords: ['truck', 'trips', 'haulage', 'trolley', 'dump truck', 'payload'],
  },
  {
    id: 'mean-prismoidal',
    name: 'Road Earthwork (Mean Area & Prismoidal)',
    category: 'earthwork',
    description: 'Longitudinal road/canal earthwork calculation using Average Cross-Section Area Method and Prismoidal Formula V = L/6(A1 + 4Am + A2).',
    icon: 'Navigation',
    keywords: ['prismoidal', 'mean area', 'road', 'embankment', 'cutting', 'filling'],
  },

  // Surveying
  {
    id: 'level-hi-method',
    name: 'Leveling: Height of Instrument (HI) Method',
    category: 'surveying',
    description: 'Height of Instrument leveling sheet: calculate HI = RL + BS, Reduced Level (RL = HI - IS/FS) with automatic arithmetic check ΣBS - ΣFS = Last RL - First RL.',
    icon: 'Crosshair',
    keywords: ['surveying', 'hi method', 'collimation', 'leveling', 'backsight', 'foresight', 'rl'],
  },
  {
    id: 'level-rise-fall',
    name: 'Leveling: Rise and Fall Method',
    category: 'surveying',
    description: 'Calculate elevation differences (Rise or Fall) for station sightings with full arithmetic check: ΣBS - ΣFS = ΣRise - ΣFall = Last RL - First RL.',
    icon: 'GitCommit',
    keywords: ['rise and fall', 'leveling', 'differential leveling', 'surveying', 'bench mark'],
  },
  {
    id: 'slope-gradient',
    name: 'Slope, Gradient & Rise-Run Converter',
    category: 'surveying',
    description: 'Convert between Slope percentage (%), Gradient ratio (1:N), Angle in degrees, Rise, Run and Hypotenuse with automatic solver.',
    icon: 'TrendingDown',
    keywords: ['slope', 'gradient', 'rise', 'run', 'angle', 'grade', 'hypotenuse'],
  },
  {
    id: 'chainage-calculator',
    name: 'Road Chainage & Station Calculator',
    category: 'surveying',
    description: 'Computes road / alignment chainage stations (e.g. 0+000, 1+250.5) from start point, incremental interval, and total distance.',
    icon: 'Milestone',
    keywords: ['chainage', 'station', 'road', 'highway', 'alignment', 'interval'],
  },
  {
    id: 'dms-converter',
    name: 'Degrees ↔ DMS (Deg, Min, Sec) Converter',
    category: 'surveying',
    description: 'Instant conversion between Decimal Degrees (e.g. 23.8103°) and Degrees, Minutes, Seconds (23° 48\' 37.08") for GPS & theodolite angles.',
    icon: 'Compass',
    keywords: ['dms', 'degrees', 'minutes', 'seconds', 'bearing', 'gps', 'angle'],
  },
  {
    id: 'coordinate-distance',
    name: 'Coordinate Distance & Azimuth / Bearing',
    category: 'surveying',
    description: 'Compute horizontal grid distance, whole circle bearing (WCB), and quadrant bearing from coordinate pairs (Easting/Northing or X/Y).',
    icon: 'MapPin',
    keywords: ['coordinates', 'bearing', 'azimuth', 'distance', 'easting', 'northing', 'wcb'],
  },

  // Estimation & Costing
  {
    id: 'quantity-takeoff',
    name: 'Quantity Takeoff (L × W × H) Sheet',
    category: 'estimation',
    description: 'Dynamic takeoff spreadsheet for civil work items with dimensions, units, rates, live subtotals, and exportable summary.',
    icon: 'FileSpreadsheet',
    keywords: ['takeoff', 'measurement sheet', 'dimensions', 'lxbxh', 'rate', 'costing'],
  },
  {
    id: 'boq-calculator',
    name: 'Bill of Quantities (BOQ) & Cost Summary',
    category: 'estimation',
    description: 'Comprehensive BOQ estimator with customizable currency (BDT ৳ default), Wastage %, Contractor Overhead %, and Contingencies.',
    icon: 'Receipt',
    keywords: ['boq', 'bill of quantities', 'estimate', 'tender', 'cost', 'overhead', 'contingency'],
  },
  {
    id: 'rate-analysis',
    name: 'Rate Analysis for 1 m³ Concrete',
    category: 'estimation',
    description: 'Unit rate analysis breaking down material costs (cement, sand, stone), labor (mason, helper, vibrator), equipment and contractor profit.',
    icon: 'Calculator',
    keywords: ['rate analysis', 'analysis of rates', 'unit price', 'labor', 'materials', 'm3 cost'],
  },

  // Geometry
  {
    id: 'geometry-calculator',
    name: 'Civil Geometry Solver (2D Area & 3D Volume)',
    category: 'geometry',
    description: 'Area, perimeter, surface area, and volume solver for Rectangle, Triangle, Trapezoid, Circle, Semicircle, Cylinder, Cone, and Sphere.',
    icon: 'Shapes',
    keywords: ['geometry', 'area', 'perimeter', 'volume', 'trapezoid', 'cylinder', 'triangle'],
  },

  // Reference & Formula
  {
    id: 'formula-library',
    name: 'Engineering Formula Library',
    category: 'utilities',
    description: 'Searchable technical formulas for structural bending, shear, beam deflection, soil mechanics, concrete proportions, and hydraulics.',
    icon: 'BookOpen',
    keywords: ['formula', 'equations', 'mechanics', 'bending', 'deflection', 'shear', 'reference'],
  },
  {
    id: 'engineering-tables',
    name: 'Civil Material Densities & Reference Tables',
    category: 'utilities',
    description: 'Quick reference tables for densities of building materials, standard rebar weights, nominal concrete ratios, and mortar thicknesses.',
    icon: 'Table',
    keywords: ['densities', 'material weight', 'nominal mix', 'steel table', 'standards'],
  },
];

export const FORMULA_LIBRARY: FormulaItem[] = [
  {
    id: 'rebar-weight-d2',
    name: 'Unit Weight of Steel Rebar',
    category: 'Reinforcement',
    formula: 'w = d² / 162.2 (kg/m)',
    variables: [
      { symbol: 'w', description: 'Theoretical mass per unit length', unit: 'kg/m' },
      { symbol: 'd', description: 'Nominal diameter of rebar', unit: 'mm' },
      { symbol: '162.2', description: 'Derived constant = (4 × 10⁶) / (π × 7850)', unit: 'constant' },
    ],
    notes: 'Derived from steel density ρ = 7850 kg/m³. Exact formula is w = (π × d² / 4) × 7850 × 10⁻⁶.',
  },
  {
    id: 'concrete-dry-vol',
    name: 'Concrete Dry Volume Factor',
    category: 'Concrete',
    formula: 'V_dry = V_wet × 1.54',
    variables: [
      { symbol: 'V_dry', description: 'Dry loose volume of materials (cement + sand + coarse aggregate)', unit: 'm³ or CFT' },
      { symbol: 'V_wet', description: 'Finished compacted concrete volume', unit: 'm³ or CFT' },
      { symbol: '1.54', description: 'Bulking & void reduction factor (typically 1.52 to 1.57)', unit: 'ratio' },
    ],
    notes: 'Accounts for voids in fine and coarse aggregates filled by water and cement paste during mixing.',
  },
  {
    id: 'prismoidal-formula',
    name: 'Prismoidal Formula for Earthwork Volume',
    category: 'Earthwork',
    formula: 'V = (L / 6) × (A₁ + 4A_m + A₂)',
    variables: [
      { symbol: 'V', description: 'Excavation or embankment volume', unit: 'm³ or CFT' },
      { symbol: 'L', description: 'Distance between end cross-sections', unit: 'm or ft' },
      { symbol: 'A₁', description: 'Cross-sectional area at start', unit: 'm² or sq.ft' },
      { symbol: 'A₂', description: 'Cross-sectional area at end', unit: 'm² or sq.ft' },
      { symbol: 'A_m', description: 'Mid-sectional area calculated from average linear dimensions', unit: 'm² or sq.ft' },
    ],
    notes: 'More accurate than mean area method for tapering ground or steep transitions.',
  },
  {
    id: 'leveling-check',
    name: 'Differential Leveling Arithmetic Check',
    category: 'Surveying',
    formula: 'ΣBS - ΣFS = ΣRise - ΣFall = Last RL - First RL',
    variables: [
      { symbol: 'ΣBS', description: 'Sum of all backsight readings', unit: 'm or ft' },
      { symbol: 'ΣFS', description: 'Sum of all foresight readings', unit: 'm or ft' },
      { symbol: 'ΣRise', description: 'Sum of all positive elevation rises', unit: 'm or ft' },
      { symbol: 'ΣFall', description: 'Sum of all negative elevation falls', unit: 'm or ft' },
      { symbol: 'RL', description: 'Reduced Level relative to benchmark datum', unit: 'm or ft' },
    ],
    notes: 'Essential mathematical integrity check to prevent sighting calculation errors in surveying field books.',
  },
  {
    id: 'stair-comfort',
    name: 'Staircase Ergonomic Proportions (Blondel Rule)',
    category: 'Structural',
    formula: '2R + T ≈ 600 mm to 650 mm (24" to 25.5")',
    variables: [
      { symbol: 'R', description: 'Riser height (typically 150–175 mm / 6"–7")', unit: 'mm' },
      { symbol: 'T', description: 'Tread / Going depth (typically 250–300 mm / 10"–12")', unit: 'mm' },
    ],
    notes: 'Reference guideline for human walking pace ergonomics on stairs. Not a rigid structural requirement.',
  },
  {
    id: 'bending-stress',
    name: 'Bending Stress Formula (Euler-Bernoulli Beam)',
    category: 'Structural',
    formula: 'σ = (M × y) / I = M / Z',
    variables: [
      { symbol: 'σ', description: 'Bending stress at extreme fiber', unit: 'MPa (N/mm²)' },
      { symbol: 'M', description: 'Bending moment', unit: 'N·mm or kN·m' },
      { symbol: 'y', description: 'Distance from neutral axis', unit: 'mm' },
      { symbol: 'I', description: 'Second moment of area', unit: 'mm⁴' },
      { symbol: 'Z', description: 'Section modulus (I / y_max)', unit: 'mm³' },
    ],
    notes: 'Fundamental structural beam theory for flexural stress.',
  },
  {
    id: 'wc-water-demand',
    name: 'Water-Cement Ratio',
    category: 'Concrete',
    formula: 'w/c = W_water / W_cement',
    variables: [
      { symbol: 'w/c', description: 'Water to cement mass ratio (typically 0.40 to 0.55)', unit: 'dimensionless' },
      { symbol: 'W_water', description: 'Mass of clean mixing water', unit: 'kg or liters' },
      { symbol: 'W_cement', description: 'Mass of cement powder', unit: 'kg' },
    ],
    notes: 'Lower w/c ratio increases compressive strength and durability, but requires plasticizers for adequate workability.',
  },
];
