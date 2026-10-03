import { CustomUnit, RegionalProfile, UnitPreferences } from '../types';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  category: string;
  toBase: (val: number, profile?: RegionalProfile, cementBagKg?: number) => number;
  fromBase: (val: number, profile?: RegionalProfile, cementBagKg?: number) => number;
  civilNote?: string;
  aliases?: string[];
  system?: 'metric' | 'imperial' | 'bangladesh' | 'custom' | 'common' | 'construction';
}

export interface UnitCategoryData {
  id: string;
  name: string;
  baseUnit: string;
  baseSymbol: string;
  description: string;
  units: Record<string, UnitDefinition>;
}

export interface UnitOptions {
  regionalProfile?: RegionalProfile;
  cementBagKg?: number;
  customUnits?: CustomUnit[];
}

// ==========================================
// 1. COMPREHENSIVE UNIT DEFINITIONS
// ==========================================
export const BUILTIN_UNIT_CATEGORIES: Record<string, UnitCategoryData> = {
  length: {
    id: 'length',
    name: 'Length & Distance',
    baseUnit: 'm',
    baseSymbol: 'm',
    description: 'Linear dimension measurements from millimeters to miles and construction feet-inches',
    units: {
      mm: {
        id: 'mm',
        name: 'Millimeter',
        symbol: 'mm',
        category: 'length',
        system: 'metric',
        aliases: ['millimeter', 'millimeters', 'milli'],
        toBase: v => v * 0.001,
        fromBase: v => v / 0.001,
        civilNote: 'Standard for rebar diameters, structural steel, wall thickness & clearances',
      },
      cm: {
        id: 'cm',
        name: 'Centimeter',
        symbol: 'cm',
        category: 'length',
        system: 'metric',
        aliases: ['centimeter', 'centimeters'],
        toBase: v => v * 0.01,
        fromBase: v => v / 0.01,
      },
      m: {
        id: 'm',
        name: 'Meter',
        symbol: 'm',
        category: 'length',
        system: 'metric',
        aliases: ['meter', 'metre', 'meters', 'metres'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Base SI linear unit for site layout, room dimensions & highway chainages',
      },
      km: {
        id: 'km',
        name: 'Kilometer',
        symbol: 'km',
        category: 'length',
        system: 'metric',
        aliases: ['kilometer', 'kilometre', 'km', 'kms'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: 'Highway, canal and railway alignments',
      },
      in: {
        id: 'in',
        name: 'Inch',
        symbol: 'in',
        category: 'length',
        system: 'imperial',
        aliases: ['inch', 'inches', '"'],
        toBase: v => v * 0.0254,
        fromBase: v => v / 0.0254,
        civilNote: '1 in = 25.4 mm exact. Used for pipes, timber, rebar sizing and masonry joints',
      },
      ft: {
        id: 'ft',
        name: 'Foot',
        symbol: 'ft',
        category: 'length',
        system: 'imperial',
        aliases: ['foot', 'feet', "'"],
        toBase: v => v * 0.3048,
        fromBase: v => v / 0.3048,
        civilNote: '1 ft = 0.3048 m exact. Standard across Bangladesh construction plans & US customary',
      },
      yd: {
        id: 'yd',
        name: 'Yard',
        symbol: 'yd',
        category: 'length',
        system: 'imperial',
        aliases: ['yard', 'yards'],
        toBase: v => v * 0.9144,
        fromBase: v => v / 0.9144,
        civilNote: '1 yd = 3 ft = 0.9144 m',
      },
      mi: {
        id: 'mi',
        name: 'Mile',
        symbol: 'mi',
        category: 'length',
        system: 'imperial',
        aliases: ['mile', 'miles'],
        toBase: v => v * 1609.344,
        fromBase: v => v / 1609.344,
      },
      chain: {
        id: 'chain',
        name: "Surveyor's Chain (Gunter's Chain)",
        symbol: 'chain',
        category: 'length',
        system: 'common',
        aliases: ['chain', 'gunter chain', 'chains'],
        toBase: v => v * 20.1168,
        fromBase: v => v / 20.1168,
        civilNote: "1 Chain = 66 ft = 100 links ≈ 20.1168 m (Cadastral land surveying)",
      },
    },
  },

  area: {
    id: 'area',
    name: 'Area & Land Measurement',
    baseUnit: 'm2',
    baseSymbol: 'm²',
    description: 'Floor plates, land plots, including regional Bangladesh & Subcontinent units',
    units: {
      mm2: {
        id: 'mm2',
        name: 'Square Millimeter',
        symbol: 'mm²',
        category: 'area',
        system: 'metric',
        aliases: ['mm2', 'sq.mm', 'sq mm', 'mm^2'],
        toBase: v => v * 1e-6,
        fromBase: v => v / 1e-6,
        civilNote: 'Standard for reinforcement steel cross-sectional area (Ast)',
      },
      cm2: {
        id: 'cm2',
        name: 'Square Centimeter',
        symbol: 'cm²',
        category: 'area',
        system: 'metric',
        aliases: ['cm2', 'sq.cm', 'sq cm', 'cm^2'],
        toBase: v => v * 1e-4,
        fromBase: v => v / 1e-4,
      },
      m2: {
        id: 'm2',
        name: 'Square Meter',
        symbol: 'm²',
        category: 'area',
        system: 'metric',
        aliases: ['m2', 'sqm', 'sq.m', 'square meter', 'square metres', 'm^2'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Standard SI metric area for plaster, flooring, and room slabs',
      },
      km2: {
        id: 'km2',
        name: 'Square Kilometer',
        symbol: 'km²',
        category: 'area',
        system: 'metric',
        aliases: ['km2', 'sq.km', 'km^2'],
        toBase: v => v * 1e6,
        fromBase: v => v / 1e6,
      },
      in2: {
        id: 'in2',
        name: 'Square Inch',
        symbol: 'sq.in',
        category: 'area',
        system: 'imperial',
        aliases: ['in2', 'sq.in', 'sq in', 'sqin', 'in^2'],
        toBase: v => v * 0.00064516,
        fromBase: v => v / 0.00064516,
      },
      ft2: {
        id: 'ft2',
        name: 'Square Foot (Sq.ft)',
        symbol: 'sq.ft',
        category: 'area',
        system: 'imperial',
        aliases: ['ft2', 'sqft', 'sq.ft', 'square foot', 'square feet', 'ft^2'],
        toBase: v => v * 0.09290304,
        fromBase: v => v / 0.09290304,
        civilNote: '1 sq.ft = 0.09290304 m² exact. Universal in real estate & building estimation',
      },
      yd2: {
        id: 'yd2',
        name: 'Square Yard',
        symbol: 'sq.yd',
        category: 'area',
        system: 'imperial',
        aliases: ['yd2', 'sq.yd', 'sq yd', 'sqyd', 'yd^2'],
        toBase: v => v * 0.83612736,
        fromBase: v => v / 0.83612736,
      },
      acre: {
        id: 'acre',
        name: 'Acre',
        symbol: 'acre',
        category: 'area',
        system: 'common',
        aliases: ['acre', 'acres'],
        toBase: v => v * 4046.8564224,
        fromBase: v => v / 4046.8564224,
        civilNote: '1 Acre = 43,560 sq.ft = 100 Decimals = 4046.856 m²',
      },
      hectare: {
        id: 'hectare',
        name: 'Hectare (ha)',
        symbol: 'ha',
        category: 'area',
        system: 'metric',
        aliases: ['ha', 'hectare', 'hectares'],
        toBase: v => v * 10000,
        fromBase: v => v / 10000,
        civilNote: '1 Hectare = 10,000 m² ≈ 2.471 Acres ≈ 247.1 Decimals',
      },
      decimal: {
        id: 'decimal',
        name: 'Decimal / শতক',
        symbol: 'decimal',
        category: 'area',
        system: 'bangladesh',
        aliases: ['decimal', 'shatak', 'shotok', 'শতক', 'ডিসিমেল', 'শতাংশ'],
        toBase: (v, p) => v * ((p?.decimalSqFt ?? 435.6) * 0.09290304),
        fromBase: (v, p) => v / ((p?.decimalSqFt ?? 435.6) * 0.09290304),
        civilNote: '1 Decimal = 435.6 sq.ft (~40.468 m² in Bangladesh standard). Configurable in Settings.',
      },
      katha: {
        id: 'katha',
        name: 'Katha / কাঠা',
        symbol: 'katha',
        category: 'area',
        system: 'bangladesh',
        aliases: ['katha', 'cottah', 'কাঠা', 'কাটা'],
        toBase: (v, p) => v * ((p?.kathaSqFt ?? 720.0) * 0.09290304),
        fromBase: (v, p) => v / ((p?.kathaSqFt ?? 720.0) * 0.09290304),
        civilNote: '1 Katha = 720 sq.ft (~66.89 m² / 1.6528 Decimals in standard Dhaka/BD land records). Configurable in Settings.',
      },
      bigha: {
        id: 'bigha',
        name: 'Bigha / বিঘা',
        symbol: 'bigha',
        category: 'area',
        system: 'bangladesh',
        aliases: ['bigha', 'বিঘা'],
        toBase: (v, p) => v * ((p?.kathaSqFt ?? 720.0) * (p?.bighaKatha ?? 20) * 0.09290304),
        fromBase: (v, p) => v / ((p?.kathaSqFt ?? 720.0) * (p?.bighaKatha ?? 20) * 0.09290304),
        civilNote: '1 Bigha = 20 Katha = 14,400 sq.ft (~1337.8 m² ≈ 33.06 Decimals in Bangladesh standard). Configurable in Settings.',
      },
      sq_mi: {
        id: 'sq_mi',
        name: 'Square Mile',
        symbol: 'sq.mi',
        category: 'area',
        system: 'imperial',
        aliases: ['sqmi', 'sq.mi', 'square mile'],
        toBase: v => v * 2589988.110336,
        fromBase: v => v / 2589988.110336,
      },
    },
  },

  volume: {
    id: 'volume',
    name: 'Volume & Capacity',
    baseUnit: 'm3',
    baseSymbol: 'm³',
    description: 'Earthwork, concrete batching, mortar, timber, and fluid volume',
    units: {
      m3: {
        id: 'm3',
        name: 'Cubic Meter (cum)',
        symbol: 'm³',
        category: 'volume',
        system: 'metric',
        aliases: ['m3', 'cum', 'm^3', 'cubic meter', 'cubic metres', 'cubic metre'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Primary SI volume unit for RCC casting, soil excavation & BOQ tender schedules',
      },
      cft: {
        id: 'cft',
        name: 'Cubic Foot (CFT)',
        symbol: 'CFT',
        category: 'volume',
        system: 'construction',
        aliases: ['cft', 'cu ft', 'cuft', 'ft3', 'ft^3', 'cubic foot', 'cubic feet'],
        toBase: v => v * 0.028316846592,
        fromBase: v => v / 0.028316846592,
        civilNote: '1 m³ ≈ 35.3147 CFT. Essential on site for batching sand, stone chips & wood CFT',
      },
      cm3: {
        id: 'cm3',
        name: 'Cubic Centimeter (cc)',
        symbol: 'cm³',
        category: 'volume',
        system: 'metric',
        aliases: ['cm3', 'cc', 'cm^3'],
        toBase: v => v * 1e-6,
        fromBase: v => v / 1e-6,
      },
      mm3: {
        id: 'mm3',
        name: 'Cubic Millimeter',
        symbol: 'mm³',
        category: 'volume',
        system: 'metric',
        aliases: ['mm3', 'mm^3'],
        toBase: v => v * 1e-9,
        fromBase: v => v / 1e-9,
      },
      in3: {
        id: 'in3',
        name: 'Cubic Inch',
        symbol: 'cu.in',
        category: 'volume',
        system: 'imperial',
        aliases: ['in3', 'cu.in', 'in^3'],
        toBase: v => v * 1.6387064e-5,
        fromBase: v => v / 1.6387064e-5,
      },
      yd3: {
        id: 'yd3',
        name: 'Cubic Yard',
        symbol: 'cu.yd',
        category: 'volume',
        system: 'imperial',
        aliases: ['yd3', 'cu.yd', 'cuyd', 'cubic yard', 'cubic yards', 'yd^3'],
        toBase: v => v * 0.764554857984,
        fromBase: v => v / 0.764554857984,
        civilNote: '1 cu.yd = 27 CFT = 0.76455 m³ (Ready-mix trucks in US customary)',
      },
      liter: {
        id: 'liter',
        name: 'Liter (L)',
        symbol: 'L',
        category: 'volume',
        system: 'metric',
        aliases: ['liter', 'litre', 'l', 'liters', 'litres'],
        toBase: v => v * 0.001,
        fromBase: v => v / 0.001,
        civilNote: '1 m³ = 1,000 Liters. Water-cement ratio gauging & admixture dosing',
      },
      ml: {
        id: 'ml',
        name: 'Milliliter (mL)',
        symbol: 'mL',
        category: 'volume',
        system: 'metric',
        aliases: ['ml', 'milliliter', 'millilitre'],
        toBase: v => v * 1e-6,
        fromBase: v => v / 1e-6,
      },
      gal_us: {
        id: 'gal_us',
        name: 'US Gallon',
        symbol: 'gal (US)',
        category: 'volume',
        system: 'imperial',
        aliases: ['gal', 'gallon', 'gal us', 'us gallon'],
        toBase: v => v * 0.003785411784,
        fromBase: v => v / 0.003785411784,
        civilNote: '1 US gal ≈ 3.7854 Liters',
      },
      gal_uk: {
        id: 'gal_uk',
        name: 'Imperial (UK) Gallon',
        symbol: 'gal (UK)',
        category: 'volume',
        system: 'imperial',
        aliases: ['imperial gallon', 'uk gallon', 'gal uk'],
        toBase: v => v * 0.00454609,
        fromBase: v => v / 0.00454609,
        civilNote: '1 Imperial gal = 4.54609 Liters',
      },
    },
  },

  mass: {
    id: 'mass',
    name: 'Mass & Weight',
    baseUnit: 'kg',
    baseSymbol: 'kg',
    description: 'Reinforcement steel, cement, binder, and bulk payload mass',
    units: {
      kg: {
        id: 'kg',
        name: 'Kilogram',
        symbol: 'kg',
        category: 'mass',
        system: 'metric',
        aliases: ['kg', 'kgs', 'kilogram', 'kilograms', 'kilo'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Base SI metric mass unit for steel rebar and cement batching',
      },
      tonne: {
        id: 'tonne',
        name: 'Metric Tonne (t / MT)',
        symbol: 'tonne',
        category: 'mass',
        system: 'metric',
        aliases: ['tonne', 't', 'mt', 'metric tonne', 'metric ton', 'tonnes'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: '1 Metric Tonne = 1,000 kg. Procurement standard for steel rebars and asphalt',
      },
      bag: {
        id: 'bag',
        name: 'Cement Bag',
        symbol: 'bag',
        category: 'mass',
        system: 'construction',
        aliases: ['bag', 'bags', 'cement bag', 'cement bags', 'ব্যাগ'],
        toBase: (v, _p, bagKg) => v * (bagKg ?? 50),
        fromBase: (v, _p, bagKg) => v / (bagKg ?? 50),
        civilNote: '1 Cement Bag = 50 kg (Standard in Bangladesh/IS/BS; 42.6 kg in US 94-lb bag). Configurable in Settings.',
      },
      quintal: {
        id: 'quintal',
        name: 'Quintal (q)',
        symbol: 'q',
        category: 'mass',
        system: 'common',
        aliases: ['quintal', 'q'],
        toBase: v => v * 100,
        fromBase: v => v / 100,
        civilNote: '1 Quintal = 100 kg. Frequently cited in South Asian wholesale material markets',
      },
      g: {
        id: 'g',
        name: 'Gram',
        symbol: 'g',
        category: 'mass',
        system: 'metric',
        aliases: ['g', 'gram', 'grams', 'gm'],
        toBase: v => v * 0.001,
        fromBase: v => v / 0.001,
      },
      mg: {
        id: 'mg',
        name: 'Milligram',
        symbol: 'mg',
        category: 'mass',
        system: 'metric',
        aliases: ['mg', 'milligram'],
        toBase: v => v * 1e-6,
        fromBase: v => v / 1e-6,
      },
      lb: {
        id: 'lb',
        name: 'Pound (lb / lbs)',
        symbol: 'lb',
        category: 'mass',
        system: 'imperial',
        aliases: ['lb', 'lbs', 'pound', 'pounds'],
        toBase: v => v * 0.45359237,
        fromBase: v => v / 0.45359237,
        civilNote: '1 lb = 0.45359237 kg exact (1 kg ≈ 2.20462 lb)',
      },
      oz: {
        id: 'oz',
        name: 'Ounce',
        symbol: 'oz',
        category: 'mass',
        system: 'imperial',
        aliases: ['oz', 'ounce', 'ounces'],
        toBase: v => v * 0.028349523125,
        fromBase: v => v / 0.028349523125,
      },
      ton_us: {
        id: 'ton_us',
        name: 'US Short Ton (2,000 lb)',
        symbol: 'ton (US)',
        category: 'mass',
        system: 'imperial',
        aliases: ['ton us', 'short ton', 'us ton'],
        toBase: v => v * 907.18474,
        fromBase: v => v / 907.18474,
      },
      ton_uk: {
        id: 'ton_uk',
        name: 'Imperial Long Ton (2,240 lb)',
        symbol: 'ton (UK)',
        category: 'mass',
        system: 'imperial',
        aliases: ['ton uk', 'long ton', 'imperial ton'],
        toBase: v => v * 1016.0469088,
        fromBase: v => v / 1016.0469088,
      },
    },
  },

  force: {
    id: 'force',
    name: 'Force & Structural Load',
    baseUnit: 'N',
    baseSymbol: 'N',
    description: 'Tension, compression, column axial load and shear forces',
    units: {
      N: {
        id: 'N',
        name: 'Newton',
        symbol: 'N',
        category: 'force',
        system: 'metric',
        aliases: ['n', 'newton'],
        toBase: v => v,
        fromBase: v => v,
      },
      kN: {
        id: 'kN',
        name: 'Kilonewton',
        symbol: 'kN',
        category: 'force',
        system: 'metric',
        aliases: ['kn', 'kilonewton', 'kilonewtons'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: 'Primary structural engineering unit for axial column capacity, beam reactions & point loads (1 kN ≈ 101.97 kgf)',
      },
      MN: {
        id: 'MN',
        name: 'Meganewton',
        symbol: 'MN',
        category: 'force',
        system: 'metric',
        aliases: ['mn', 'meganewton'],
        toBase: v => v * 1e6,
        fromBase: v => v / 1e6,
        civilNote: 'Deep foundation pile capacity and bridge pier bearings (1 MN = 1,000 kN)',
      },
      kgf: {
        id: 'kgf',
        name: 'Kilogram-Force',
        symbol: 'kgf',
        category: 'force',
        system: 'common',
        aliases: ['kgf', 'kilogram force', 'kp'],
        toBase: v => v * 9.80665,
        fromBase: v => v / 9.80665,
        civilNote: '1 kgf = 9.80665 N (Standard gravity)',
      },
      tonf: {
        id: 'tonf',
        name: 'Tonne-Force (tf)',
        symbol: 'tonf',
        category: 'force',
        system: 'common',
        aliases: ['tonf', 'tf', 'tonne force', 'ton force'],
        toBase: v => v * 9806.65,
        fromBase: v => v / 9806.65,
        civilNote: '1 tonf ≈ 9.80665 kN (Traditional pile load test rating)',
      },
      lbf: {
        id: 'lbf',
        name: 'Pound-Force',
        symbol: 'lbf',
        category: 'force',
        system: 'imperial',
        aliases: ['lbf', 'pound force'],
        toBase: v => v * 4.4482216152605,
        fromBase: v => v / 4.4482216152605,
      },
      kip: {
        id: 'kip',
        name: 'Kip (Kilopound-force)',
        symbol: 'kip',
        category: 'force',
        system: 'imperial',
        aliases: ['kip', 'kips', 'klbf'],
        toBase: v => v * 4448.2216152605,
        fromBase: v => v / 4448.2216152605,
        civilNote: '1 kip = 1,000 lbf ≈ 4.4482 kN (Standard in US ACI structural design)',
      },
    },
  },

  pressure: {
    id: 'pressure',
    name: 'Pressure, Bearing & Material Stress',
    baseUnit: 'Pa',
    baseSymbol: 'Pa',
    description: 'Soil bearing capacity, concrete cylinder strength (f\'c), steel yield (fy)',
    units: {
      mpa: {
        id: 'mpa',
        name: 'Megapascal (MPa)',
        symbol: 'MPa',
        category: 'pressure',
        system: 'metric',
        aliases: ['mpa', 'megapascal'],
        toBase: v => v * 1e6,
        fromBase: v => v / 1e6,
        civilNote: '1 MPa = 1 N/mm² = 1,000 kPa. Concrete grade (e.g. M20 = 20 MPa) & steel yield (Grade 420 = 420 MPa)',
      },
      n_mm2: {
        id: 'n_mm2',
        name: 'Newton per mm² (N/mm²)',
        symbol: 'N/mm²',
        category: 'pressure',
        system: 'metric',
        aliases: ['n_mm2', 'n/mm2', 'n/mm^2', 'newton/mm2'],
        toBase: v => v * 1e6,
        fromBase: v => v / 1e6,
        civilNote: 'Exact equivalent of 1 MPa. Preferred by Eurocode (EC2) & Indian Standard (IS 456)',
      },
      kpa: {
        id: 'kpa',
        name: 'Kilopascal (kPa)',
        symbol: 'kPa',
        category: 'pressure',
        system: 'metric',
        aliases: ['kpa', 'kilopascal'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: '1 kPa = 1 kN/m². Soil safe bearing capacity (SBC) and geotechnical shear strength',
      },
      pa: {
        id: 'pa',
        name: 'Pascal (Pa)',
        symbol: 'Pa',
        category: 'pressure',
        system: 'metric',
        aliases: ['pa', 'pascal'],
        toBase: v => v,
        fromBase: v => v,
      },
      gpa: {
        id: 'gpa',
        name: 'Gigapascal (GPa)',
        symbol: 'GPa',
        category: 'pressure',
        system: 'metric',
        aliases: ['gpa', 'gigapascal'],
        toBase: v => v * 1e9,
        fromBase: v => v / 1e9,
        civilNote: 'Modulus of Elasticity Es (Steel ≈ 200 GPa; Concrete Ec ≈ 20-30 GPa)',
      },
      psi: {
        id: 'psi',
        name: 'Pounds per Square Inch (psi)',
        symbol: 'psi',
        category: 'pressure',
        system: 'imperial',
        aliases: ['psi', 'lb/in2', 'lb/in^2'],
        toBase: v => v * 6894.757293168,
        fromBase: v => v / 6894.757293168,
        civilNote: '1 MPa ≈ 145.038 psi. 3000 psi concrete ≈ 20.7 MPa; 4000 psi ≈ 27.6 MPa',
      },
      ksi: {
        id: 'ksi',
        name: 'Kilopounds per Square Inch (ksi)',
        symbol: 'ksi',
        category: 'pressure',
        system: 'imperial',
        aliases: ['ksi', 'kip/in2'],
        toBase: v => v * 6894757.293168,
        fromBase: v => v / 6894757.293168,
        civilNote: 'Grade 60 steel fy = 60 ksi ≈ 413.7 MPa; Grade 40 = 40 ksi ≈ 275.8 MPa',
      },
      psf: {
        id: 'psf',
        name: 'Pounds per Square Foot (psf)',
        symbol: 'psf',
        category: 'pressure',
        system: 'imperial',
        aliases: ['psf', 'lb/ft2', 'lb/ft^2'],
        toBase: v => v * 47.88025898,
        fromBase: v => v / 47.88025898,
        civilNote: 'Floor live loads & soil bearing pressure in Imperial drawings (e.g. 3000 psf ≈ 143.6 kPa)',
      },
      ksf: {
        id: 'ksf',
        name: 'Kips per Square Foot (ksf)',
        symbol: 'ksf',
        category: 'pressure',
        system: 'imperial',
        aliases: ['ksf', 'kip/ft2'],
        toBase: v => v * 47880.25898,
        fromBase: v => v / 47880.25898,
      },
      bar: {
        id: 'bar',
        name: 'Bar',
        symbol: 'bar',
        category: 'pressure',
        system: 'common',
        aliases: ['bar'],
        toBase: v => v * 1e5,
        fromBase: v => v / 1e5,
        civilNote: '1 bar = 100 kPa ≈ 14.5038 psi (Hydraulic test pressure in water supply)',
      },
      mbar: {
        id: 'mbar',
        name: 'Millibar',
        symbol: 'mbar',
        category: 'pressure',
        system: 'common',
        aliases: ['mbar', 'millibar'],
        toBase: v => v * 100,
        fromBase: v => v / 100,
      },
      kgf_cm2: {
        id: 'kgf_cm2',
        name: 'kgf per cm²',
        symbol: 'kgf/cm²',
        category: 'pressure',
        system: 'common',
        aliases: ['kgf/cm2', 'kg/cm2', 'kgf_cm2'],
        toBase: v => v * 98066.5,
        fromBase: v => v / 98066.5,
        civilNote: '1 kgf/cm² ≈ 0.09807 MPa ≈ 14.223 psi (Classic concrete cube test unit)',
      },
      kgf_m2: {
        id: 'kgf_m2',
        name: 'kgf per m²',
        symbol: 'kgf/m²',
        category: 'pressure',
        system: 'common',
        aliases: ['kgf/m2', 'kg/m2'],
        toBase: v => v * 9.80665,
        fromBase: v => v / 9.80665,
      },
      ft_h2o: {
        id: 'ft_h2o',
        name: 'Feet of Water',
        symbol: 'ft H₂O',
        category: 'pressure',
        system: 'imperial',
        aliases: ['ft h2o', 'feet of water'],
        toBase: v => v * 2989.0669,
        fromBase: v => v / 2989.0669,
        civilNote: 'Pump head and hydrostatic pipe elevation pressure',
      },
    },
  },

  density: {
    id: 'density',
    name: 'Density & Unit Mass',
    baseUnit: 'kg_m3',
    baseSymbol: 'kg/m³',
    description: 'Mass density of civil engineering construction materials',
    units: {
      kg_m3: {
        id: 'kg_m3',
        name: 'Kilogram per Cubic Meter (kg/m³)',
        symbol: 'kg/m³',
        category: 'density',
        system: 'metric',
        aliases: ['kg/m3', 'kg/cum', 'kg/m^3'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Steel = 7850, RCC = 2500, Plain Concrete = 2400, Sand = 1600, Water = 1000 kg/m³',
      },
      t_m3: {
        id: 't_m3',
        name: 'Tonne per Cubic Meter (t/m³)',
        symbol: 't/m³',
        category: 'density',
        system: 'metric',
        aliases: ['t/m3', 't/cum', 'tonne/m3'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: 'RCC ≈ 2.50 t/m³',
      },
      kg_L: {
        id: 'kg_L',
        name: 'Kilogram per Liter (kg/L)',
        symbol: 'kg/L',
        category: 'density',
        system: 'metric',
        aliases: ['kg/l', 'kg/liter'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: 'Water = 1.0 kg/L',
      },
      g_cm3: {
        id: 'g_cm3',
        name: 'Gram per Cubic Centimeter (g/cm³)',
        symbol: 'g/cm³',
        category: 'density',
        system: 'metric',
        aliases: ['g/cm3', 'g/cc'],
        toBase: v => v * 1000,
        fromBase: v => v / 1000,
        civilNote: 'Soil lab specific gravity testing (1 g/cm³ = 1000 kg/m³)',
      },
      lb_ft3: {
        id: 'lb_ft3',
        name: 'Pound per Cubic Foot (pcf)',
        symbol: 'lb/ft³',
        category: 'density',
        system: 'imperial',
        aliases: ['lb/ft3', 'pcf', 'lb/cft'],
        toBase: v => v * 16.01846337,
        fromBase: v => v / 16.01846337,
        civilNote: 'Concrete ≈ 150 pcf; Steel = 490 pcf; Water = 62.4 pcf',
      },
      lb_in3: {
        id: 'lb_in3',
        name: 'Pound per Cubic Inch (lb/in³)',
        symbol: 'lb/in³',
        category: 'density',
        system: 'imperial',
        aliases: ['lb/in3', 'pci'],
        toBase: v => v * 27679.904,
        fromBase: v => v / 27679.904,
        civilNote: 'Steel = 0.283 lb/in³',
      },
      kn_m3: {
        id: 'kn_m3',
        name: 'Kilonewton per Cubic Meter (kN/m³ - Unit Weight)',
        symbol: 'kN/m³',
        category: 'density',
        system: 'metric',
        aliases: ['kn/m3', 'kn/cum'],
        toBase: v => v * (1000 / 9.80665),
        fromBase: v => v * (9.80665 / 1000),
        civilNote: 'Unit Weight γ: RCC ≈ 24.5-25.0 kN/m³; Soil ≈ 18-20 kN/m³; Water = 9.81 kN/m³',
      },
    },
  },

  flow: {
    id: 'flow',
    name: 'Discharge & Fluid Flow',
    baseUnit: 'm3_s',
    baseSymbol: 'm³/s',
    description: 'Culvert discharge, storm stormwater drainage, pump delivery & open channel hydraulics',
    units: {
      m3_s: {
        id: 'm3_s',
        name: 'Cubic Meter per Second (cumec)',
        symbol: 'm³/s',
        category: 'flow',
        system: 'metric',
        aliases: ['m3/s', 'cumec', 'm3_s'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Manning’s equation and river hydrology discharge rating',
      },
      m3_min: {
        id: 'm3_min',
        name: 'Cubic Meter per Minute',
        symbol: 'm³/min',
        category: 'flow',
        system: 'metric',
        aliases: ['m3/min'],
        toBase: v => v / 60,
        fromBase: v => v * 60,
      },
      m3_h: {
        id: 'm3_h',
        name: 'Cubic Meter per Hour',
        symbol: 'm³/h',
        category: 'flow',
        system: 'metric',
        aliases: ['m3/h', 'm3/hr'],
        toBase: v => v / 3600,
        fromBase: v => v * 3600,
        civilNote: 'Site dewatering pump capacity rating',
      },
      L_s: {
        id: 'L_s',
        name: 'Liter per Second (L/s)',
        symbol: 'L/s',
        category: 'flow',
        system: 'metric',
        aliases: ['l/s', 'lps', 'liter/s'],
        toBase: v => v * 0.001,
        fromBase: v => v / 0.001,
        civilNote: '1 m³/s = 1,000 L/s. Domestic plumbing & sewer line sizing',
      },
      L_min: {
        id: 'L_min',
        name: 'Liter per Minute (L/min)',
        symbol: 'L/min',
        category: 'flow',
        system: 'metric',
        aliases: ['l/min', 'lpm'],
        toBase: v => (v * 0.001) / 60,
        fromBase: v => (v / 0.001) * 60,
      },
      cfs: {
        id: 'cfs',
        name: 'Cubic Feet per Second (cusec / CFS)',
        symbol: 'CFS',
        category: 'flow',
        system: 'imperial',
        aliases: ['cfs', 'cusec', 'cu.ft/s', 'cft/s'],
        toBase: v => v * 0.028316846592,
        fromBase: v => v / 0.028316846592,
        civilNote: '1 CFS ≈ 28.317 L/s ≈ 0.02832 m³/s (Irrigation canals & culvert runoffs)',
      },
      cfm: {
        id: 'cfm',
        name: 'Cubic Feet per Minute (CFM)',
        symbol: 'CFM',
        category: 'flow',
        system: 'imperial',
        aliases: ['cfm', 'cu.ft/min'],
        toBase: v => (v * 0.028316846592) / 60,
        fromBase: v => (v / 0.028316846592) * 60,
      },
      gpm: {
        id: 'gpm',
        name: 'US Gallons per Minute (GPM)',
        symbol: 'GPM',
        category: 'flow',
        system: 'imperial',
        aliases: ['gpm', 'gal/min'],
        toBase: v => (v * 0.003785411784) / 60,
        fromBase: v => (v / 0.003785411784) * 60,
        civilNote: 'Firefighting standpipe & municipal booster pump rating',
      },
    },
  },

  angle: {
    id: 'angle',
    name: 'Angle & Direction',
    baseUnit: 'deg',
    baseSymbol: '°',
    description: 'Theodolite, total station azimuth, prismatic compass bearing and slope angles',
    units: {
      deg: {
        id: 'deg',
        name: 'Decimal Degree (°)',
        symbol: '°',
        category: 'angle',
        system: 'common',
        aliases: ['deg', 'degree', 'degrees', '°'],
        toBase: v => v,
        fromBase: v => v,
      },
      rad: {
        id: 'rad',
        name: 'Radian (rad)',
        symbol: 'rad',
        category: 'angle',
        system: 'metric',
        aliases: ['rad', 'radian', 'radians'],
        toBase: v => (v * 180) / Math.PI,
        fromBase: v => (v * Math.PI) / 180,
      },
      grad: {
        id: 'grad',
        name: 'Gradian / Gon',
        symbol: 'grad',
        category: 'angle',
        system: 'metric',
        aliases: ['grad', 'gon', 'gradians'],
        toBase: v => v * 0.9,
        fromBase: v => v / 0.9,
        civilNote: '400 grad = 360° circle (Continental European surveying total stations)',
      },
    },
  },

  temperature: {
    id: 'temperature',
    name: 'Temperature',
    baseUnit: 'C',
    baseSymbol: '°C',
    description: 'Ambient weather, concrete hydration curing, and hot-mix asphalt compaction',
    units: {
      C: {
        id: 'C',
        name: 'Celsius',
        symbol: '°C',
        category: 'temperature',
        system: 'metric',
        aliases: ['c', 'celsius', '°c'],
        toBase: v => v,
        fromBase: v => v,
        civilNote: 'Fresh concrete placement window: 10°C to 32°C (ACI 305/306)',
      },
      F: {
        id: 'F',
        name: 'Fahrenheit',
        symbol: '°F',
        category: 'temperature',
        system: 'imperial',
        aliases: ['f', 'fahrenheit', '°f'],
        toBase: v => (v - 32) * (5 / 9),
        fromBase: v => (v * 9) / 5 + 32,
      },
      K: {
        id: 'K',
        name: 'Kelvin',
        symbol: 'K',
        category: 'temperature',
        system: 'metric',
        aliases: ['k', 'kelvin'],
        toBase: v => v - 273.15,
        fromBase: v => v + 273.15,
      },
    },
  },

  time: {
    id: 'time',
    name: 'Time & Productivity',
    baseUnit: 's',
    baseSymbol: 's',
    description: 'Concrete setting times, curing cycles, and labor productivity durations',
    units: {
      s: { id: 's', name: 'Second', symbol: 's', category: 'time', system: 'metric', aliases: ['s', 'sec'], toBase: v => v, fromBase: v => v },
      min: { id: 'min', name: 'Minute', symbol: 'min', category: 'time', system: 'metric', aliases: ['min', 'minute'], toBase: v => v * 60, fromBase: v => v / 60, civilNote: 'Initial setting time of OPC ≥ 30 min; Final ≤ 600 min' },
      h: { id: 'h', name: 'Hour', symbol: 'h', category: 'time', system: 'metric', aliases: ['h', 'hr', 'hours'], toBase: v => v * 3600, fromBase: v => v / 3600 },
      day: { id: 'day', name: 'Day', symbol: 'day', category: 'time', system: 'common', aliases: ['d', 'day', 'days'], toBase: v => v * 86400, fromBase: v => v / 86400, civilNote: 'Standard curing: 7 days, 14 days, 28 days for design compressive strength' },
      week: { id: 'week', name: 'Week', symbol: 'wk', category: 'time', system: 'common', aliases: ['wk', 'week', 'weeks'], toBase: v => v * 604800, fromBase: v => v / 604800 },
      month: { id: 'month', name: 'Month (30 days)', symbol: 'mo', category: 'time', system: 'common', aliases: ['mo', 'month'], toBase: v => v * 2592000, fromBase: v => v / 2592000 },
      worker_h: { id: 'worker_h', name: 'Worker-Hour (Labor)', symbol: 'w-hr', category: 'time', system: 'construction', aliases: ['worker-hour', 'man-hour'], toBase: v => v * 3600, fromBase: v => v / 3600 },
      worker_day: { id: 'worker_day', name: 'Worker-Day (8-hr Shift)', symbol: 'w-day', category: 'time', system: 'construction', aliases: ['worker-day', 'man-day'], toBase: v => v * 28800, fromBase: v => v / 28800 },
    },
  },

  power: {
    id: 'power',
    name: 'Power Rating',
    baseUnit: 'W',
    baseSymbol: 'W',
    description: 'Generator, deep tube well pump, and tower crane hoisting power rating',
    units: {
      W: { id: 'W', name: 'Watt', symbol: 'W', category: 'power', system: 'metric', aliases: ['w', 'watt'], toBase: v => v, fromBase: v => v },
      kW: { id: 'kW', name: 'Kilowatt', symbol: 'kW', category: 'power', system: 'metric', aliases: ['kw', 'kilowatt'], toBase: v => v * 1000, fromBase: v => v / 1000 },
      MW: { id: 'MW', name: 'Megawatt', symbol: 'MW', category: 'power', system: 'metric', aliases: ['mw'], toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      hp: { id: 'hp', name: 'Horsepower (Mechanical)', symbol: 'hp', category: 'power', system: 'imperial', aliases: ['hp', 'horsepower'], toBase: v => v * 745.699872, fromBase: v => v / 745.699872, civilNote: '1 HP = 745.7 W ≈ 0.746 kW (Common dewatering diesel pump size)' },
    },
  },

  moment: {
    id: 'moment',
    name: 'Bending Moment & Torque',
    baseUnit: 'N_m',
    baseSymbol: 'N·m',
    description: 'Beam bending moments, foundation overturning, and bolt torque',
    units: {
      N_m: { id: 'N_m', name: 'Newton-Meter', symbol: 'N·m', category: 'moment', system: 'metric', aliases: ['n-m', 'nm', 'n*m'], toBase: v => v, fromBase: v => v },
      kN_m: { id: 'kN_m', name: 'Kilonewton-Meter', symbol: 'kN·m', category: 'moment', system: 'metric', aliases: ['kn-m', 'knm', 'kn*m'], toBase: v => v * 1000, fromBase: v => v / 1000, civilNote: 'Standard structural analysis output for Mu = wL²/8' },
      N_mm: { id: 'N_mm', name: 'Newton-Millimeter', symbol: 'N·mm', category: 'moment', system: 'metric', aliases: ['n-mm', 'nmm'], toBase: v => v * 0.001, fromBase: v => v / 0.001, civilNote: 'Convenient for cross-section stress integration with b and d in mm' },
      kip_ft: { id: 'kip_ft', name: 'Kip-Foot', symbol: 'kip·ft', category: 'moment', system: 'imperial', aliases: ['kip-ft', 'k-ft'], toBase: v => v * 1355.8179483314, fromBase: v => v / 1355.8179483314, civilNote: '1 kip·ft ≈ 1.3558 kN·m (US ACI 318 moment capacity)' },
      lb_ft: { id: 'lb_ft', name: 'Foot-Pound (lb·ft)', symbol: 'lb·ft', category: 'moment', system: 'imperial', aliases: ['lb-ft', 'ft-lb'], toBase: v => v * 1.3558179483314, fromBase: v => v / 1.3558179483314 },
    },
  },

  linear_load: {
    id: 'linear_load',
    name: 'Distributed Load / Unit Length',
    baseUnit: 'N_m',
    baseSymbol: 'N/m',
    description: 'Beam uniform distributed loads (UDL) and wall self-weights',
    units: {
      N_m: { id: 'N_m', name: 'Newton per Meter', symbol: 'N/m', category: 'linear_load', system: 'metric', aliases: ['n/m'], toBase: v => v, fromBase: v => v },
      kN_m: { id: 'kN_m', name: 'Kilonewton per Meter (kN/m)', symbol: 'kN/m', category: 'linear_load', system: 'metric', aliases: ['kn/m'], toBase: v => v * 1000, fromBase: v => v / 1000, civilNote: 'Standard for beam distributed dead and live load (w)' },
      kg_m: { id: 'kg_m', name: 'kg per Meter (kg/m)', symbol: 'kg/m', category: 'linear_load', system: 'common', aliases: ['kg/m', 'kgf/m'], toBase: v => v * 9.80665, fromBase: v => v / 9.80665 },
      lb_ft: { id: 'lb_ft', name: 'Pounds per Foot (plf / lb/ft)', symbol: 'lb/ft', category: 'linear_load', system: 'imperial', aliases: ['lb/ft', 'plf'], toBase: v => v * 14.5939029, fromBase: v => v / 14.5939029, civilNote: '1 kN/m ≈ 68.52 lb/ft' },
      kip_ft: { id: 'kip_ft', name: 'Kips per Foot (klf)', symbol: 'kip/ft', category: 'linear_load', system: 'imperial', aliases: ['klf', 'kip/ft'], toBase: v => v * 14593.9029, fromBase: v => v / 14593.9029 },
    },
  },

  slope: {
    id: 'slope',
    name: 'Slope, Grade & Gradient',
    baseUnit: 'percent',
    baseSymbol: '%',
    description: 'Ramp slope, roof camber, storm sewer gradient & road cross-falls',
    units: {
      percent: { id: 'percent', name: 'Percentage (%)', symbol: '%', category: 'slope', system: 'common', aliases: ['%', 'percent'], toBase: v => v, fromBase: v => v, civilNote: 'Common for road cross slopes (e.g. 2% to 2.5% camber)' },
      ratio: { id: 'ratio', name: 'Gradient Ratio (1:N)', symbol: '1:N', category: 'slope', system: 'common', aliases: ['ratio', '1:n'], toBase: v => (v !== 0 ? 100 / v : 0), fromBase: v => (v !== 0 ? 100 / v : 0), civilNote: '1:20 = 5%; 1:50 = 2%; 1:1.5 = 66.67% embankment slope' },
      decimal: { id: 'decimal', name: 'Decimal Grade', symbol: 'grade', category: 'slope', system: 'common', aliases: ['grade', 'dec'], toBase: v => v * 100, fromBase: v => v / 100, civilNote: '0.05 grade = 5%' },
      deg: { id: 'deg', name: 'Slope Angle (°)', symbol: '°', category: 'slope', system: 'common', aliases: ['deg', 'degrees'], toBase: v => Math.tan((v * Math.PI) / 180) * 100, fromBase: v => (Math.atan(v / 100) * 180) / Math.PI },
    },
  },
};

// ==========================================
// 2. CUSTOM UNITS STORAGE & REGISTRY
// ==========================================
const CUSTOM_UNITS_KEY = 'pb_civillab_custom_units';

export function loadCustomUnits(): CustomUnit[] {
  try {
    const raw = localStorage.getItem(CUSTOM_UNITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomUnits(units: CustomUnit[]): void {
  try {
    localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(units));
  } catch (e) {
    console.warn('Failed to save custom units:', e);
  }
}

export function addCustomUnit(newUnit: Omit<CustomUnit, 'id'>): CustomUnit {
  const customUnits = loadCustomUnits();
  const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const unit: CustomUnit = { ...newUnit, id };
  const updated = [...customUnits.filter(u => u.name.toLowerCase() !== unit.name.toLowerCase()), unit];
  saveCustomUnits(updated);
  return unit;
}

export function deleteCustomUnit(id: string): void {
  const customUnits = loadCustomUnits();
  const updated = customUnits.filter(u => u.id !== id);
  saveCustomUnits(updated);
}

// Convert a CustomUnit into a UnitDefinition
export function customUnitToDefinition(cu: CustomUnit): UnitDefinition {
  return {
    id: cu.id,
    name: cu.name,
    symbol: cu.symbol,
    category: cu.category,
    system: 'custom',
    toBase: v => v * cu.factorToBase,
    fromBase: v => v / cu.factorToBase,
    civilNote: cu.civilNote || `1 ${cu.symbol} = ${cu.factorToBase} ${cu.baseUnitSymbol}`,
    aliases: [cu.name.toLowerCase(), cu.symbol.toLowerCase()],
  };
}

// ==========================================
// 3. CATEGORY & UNIT QUERY APIS
// ==========================================

export function getUnitsForCategory(category: string, options?: UnitOptions): UnitDefinition[] {
  const cat = BUILTIN_UNIT_CATEGORIES[category];
  if (!cat) return [];
  const builtin = Object.values(cat.units);
  const customList = options?.customUnits || loadCustomUnits();
  const customs = customList
    .filter(cu => cu.category === category)
    .map(customUnitToDefinition);
  return [...builtin, ...customs];
}

export function getUnitDefinition(
  unitIdOrAlias: string,
  category?: string,
  options?: UnitOptions
): UnitDefinition | undefined {
  if (!unitIdOrAlias) return undefined;
  const target = unitIdOrAlias.trim().toLowerCase();

  // Search in specified category first
  const searchCategories = category ? [category] : Object.keys(BUILTIN_UNIT_CATEGORIES);

  for (const catId of searchCategories) {
    const units = getUnitsForCategory(catId, options);
    // Exact match on id or symbol
    const match = units.find(
      u =>
        u.id.toLowerCase() === target ||
        u.symbol.toLowerCase() === target ||
        u.name.toLowerCase() === target ||
        (u.aliases && u.aliases.some(a => a.toLowerCase() === target))
    );
    if (match) return match;
  }

  return undefined;
}

// ==========================================
// 4. UNIT SEARCH WITH ALIASES
// ==========================================
export function searchUnits(
  query: string,
  category?: string,
  options?: UnitOptions
): UnitDefinition[] {
  const q = query.trim().toLowerCase();
  const searchCategories = category ? [category] : Object.keys(BUILTIN_UNIT_CATEGORIES);
  const results: UnitDefinition[] = [];

  for (const catId of searchCategories) {
    const units = getUnitsForCategory(catId, options);
    for (const u of units) {
      if (!q) {
        results.push(u);
        continue;
      }
      const match =
        u.id.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.symbol.toLowerCase().includes(q) ||
        (u.civilNote && u.civilNote.toLowerCase().includes(q)) ||
        (u.aliases && u.aliases.some(a => a.toLowerCase().includes(q)));
      if (match) {
        results.push(u);
      }
    }
  }

  return results;
}

// ==========================================
// 5. CORE CONVERSION ENGINE
// ==========================================

export function toBase(
  value: number,
  fromUnitId: string,
  category: string,
  options?: UnitOptions
): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const def = getUnitDefinition(fromUnitId, category, options);
  if (!def) return value;
  return def.toBase(value, options?.regionalProfile, options?.cementBagKg);
}

export function fromBase(
  baseValue: number,
  toUnitId: string,
  category: string,
  options?: UnitOptions
): number {
  if (isNaN(baseValue) || !isFinite(baseValue)) return 0;
  const def = getUnitDefinition(toUnitId, category, options);
  if (!def) return baseValue;
  return def.fromBase(baseValue, options?.regionalProfile, options?.cementBagKg);
}

export function convertUnit(
  category: string,
  fromUnitId: string,
  toUnitId: string,
  value: number,
  optionsOrProfile?: UnitOptions | RegionalProfile
): { result: number; formula: string } {
  if (isNaN(value) || !isFinite(value)) {
    return { result: 0, formula: 'Invalid number' };
  }

  const options: UnitOptions =
    optionsOrProfile && 'decimalSqFt' in optionsOrProfile
      ? { regionalProfile: optionsOrProfile }
      : (optionsOrProfile as UnitOptions) || {};

  const fromDef = getUnitDefinition(fromUnitId, category, options);
  const toDef = getUnitDefinition(toUnitId, category, options);

  if (!fromDef || !toDef) {
    return { result: value, formula: 'Unit definition not found' };
  }

  const baseVal = fromDef.toBase(value, options.regionalProfile, options.cementBagKg);
  const result = toDef.fromBase(baseVal, options.regionalProfile, options.cementBagKg);

  const formula = `${formatNumber(value, 4)} ${fromDef.symbol} = ${formatNumber(result, 4)} ${toDef.symbol}`;
  return { result, formula };
}

// ==========================================
// 6. DIMENSION VALIDATION
// ==========================================
export function validateDimensions(
  cat1: string,
  cat2: string,
  operation: '+' | '-' | '*' | '/'
): { isValid: boolean; message?: string } {
  if (operation === '+' || operation === '-') {
    if (cat1 !== cat2) {
      return {
        isValid: false,
        message: `Incompatible dimensions: Cannot ${operation === '+' ? 'add' : 'subtract'} ${cat1} and ${cat2}. Both quantities must share the same physical dimension.`,
      };
    }
  }
  return { isValid: true };
}

// ==========================================
// 7. HIGH PRECISION NUMBER & CURRENCY FORMATTERS
// ==========================================
export function formatNumber(val: number, maxDecimals: number = 2, minDecimals?: number): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return minDecimals ? (0).toFixed(minDecimals) : '0';
  }
  if (minDecimals === undefined && Number.isInteger(val)) {
    return val.toLocaleString('en-US');
  }
  if (Math.abs(val) < 1e-6 && val !== 0) {
    return val.toExponential(3);
  }
  if (Math.abs(val) >= 1e9) {
    return val.toExponential(3);
  }
  return val.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals !== undefined ? minDecimals : 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function safeParseFloat(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? fallback : val;
  const str = String(val).replace(/,/g, '').trim();
  if (!str) return fallback;
  const num = parseFloat(str);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

export function formatCurrency(amount: number, symbol: string = '৳', decimals: number = 2): string {
  if (isNaN(amount) || !isFinite(amount)) return `${symbol}0`;
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// ==========================================
// 8. CONSTRUCTION PARSERS
// ==========================================

/**
 * Universal length / feet-inch parser:
 * Accepts: "12'-6\"", "12 ft 6 in", "12' 4 1/2\"", "12.5 ft", "3810 mm", "3.81 m", "66 in"
 */
export function parseFeetInches(input: string): {
  totalFeet: number;
  totalInches: number;
  meters: number;
  millimeters: number;
  isValid: boolean;
  normalizedString: string;
} {
  const clean = input ? input.trim() : '';
  if (!clean) {
    return { totalFeet: 0, totalInches: 0, meters: 0, millimeters: 0, isValid: false, normalizedString: '' };
  }

  // Case 1: Feet & inches with fractional inches (e.g. 12'-6 1/2" or 12' 6" or 12ft 6in)
  const ftInFracRegex = /^(\d+)\s*(?:'|ft)\s*(?:-?\s*(\d+)(?:\s+(\d+)\/(\d+))?\s*(?:"|in)?)?$/i;
  const matchFtIn = clean.match(ftInFracRegex);
  if (matchFtIn) {
    const feet = parseInt(matchFtIn[1], 10);
    const inches = matchFtIn[2] ? parseInt(matchFtIn[2], 10) : 0;
    const fracNum = matchFtIn[3] ? parseInt(matchFtIn[3], 10) : 0;
    const fracDen = matchFtIn[4] ? parseInt(matchFtIn[4], 10) : 1;
    const totalInches = feet * 12 + inches + (fracDen !== 0 ? fracNum / fracDen : 0);
    const totalFeet = totalInches / 12;
    const meters = totalInches * 0.0254;
    const millimeters = totalInches * 25.4;
    const fracStr = matchFtIn[3] ? ` ${matchFtIn[3]}/${matchFtIn[4]}` : '';
    return {
      totalFeet,
      totalInches,
      meters,
      millimeters,
      isValid: true,
      normalizedString: `${feet}'-${inches}${fracStr}"`,
    };
  }

  // Case 2: Standard number with explicit unit or default
  const numUnitRegex = /^(-?\d+(\.\d+)?)\s*(mm|cm|m|km|in|"|ft|'|yd|mi)?$/i;
  const matchNum = clean.match(numUnitRegex);
  if (matchNum) {
    const num = parseFloat(matchNum[1]);
    const unit = (matchNum[3] || 'ft').toLowerCase();

    if (unit === 'm') {
      const ft = num / 0.3048;
      return {
        totalFeet: ft,
        totalInches: ft * 12,
        meters: num,
        millimeters: num * 1000,
        isValid: true,
        normalizedString: `${num} m`,
      };
    }
    if (unit === 'mm') {
      const m = num / 1000;
      const ft = m / 0.3048;
      return {
        totalFeet: ft,
        totalInches: ft * 12,
        meters: m,
        millimeters: num,
        isValid: true,
        normalizedString: `${num} mm`,
      };
    }
    if (unit === 'cm') {
      const m = num / 100;
      const ft = m / 0.3048;
      return {
        totalFeet: ft,
        totalInches: ft * 12,
        meters: m,
        millimeters: num * 10,
        isValid: true,
        normalizedString: `${num} cm`,
      };
    }
    if (unit === 'in' || unit === '"') {
      const feet = num / 12;
      return {
        totalFeet: feet,
        totalInches: num,
        meters: num * 0.0254,
        millimeters: num * 25.4,
        isValid: true,
        normalizedString: `${Math.floor(feet)}'-${(num % 12).toFixed(1)}"`,
      };
    }
    // Default or 'ft' / "'"
    const inches = num * 12;
    const wholeFeet = Math.floor(num);
    const remInches = Math.round((num - wholeFeet) * 12 * 10) / 10;
    return {
      totalFeet: num,
      totalInches: inches,
      meters: num * 0.3048,
      millimeters: num * 304.8,
      isValid: true,
      normalizedString: `${wholeFeet}'-${remInches}"`,
    };
  }

  return { totalFeet: 0, totalInches: 0, meters: 0, millimeters: 0, isValid: false, normalizedString: clean };
}

/**
 * Format decimal feet into construction architectural string e.g. 12'-6"
 */
export function formatFeetInches(decimalFeet: number): string {
  if (isNaN(decimalFeet) || !isFinite(decimalFeet)) return `0'-0"`;
  const isNeg = decimalFeet < 0;
  const absFeet = Math.abs(decimalFeet);
  const feet = Math.floor(absFeet);
  const totalInches = (absFeet - feet) * 12;
  const wholeInches = Math.floor(totalInches);
  const fraction = totalInches - wholeInches;

  // Approximate to nearest 1/16"
  const sixteenths = Math.round(fraction * 16);
  let fracStr = '';
  let finalInches = wholeInches;

  if (sixteenths === 16) {
    finalInches += 1;
  } else if (sixteenths > 0) {
    if (sixteenths % 8 === 0) fracStr = ` 1/2`;
    else if (sixteenths % 4 === 0) fracStr = ` ${sixteenths / 4}/4`;
    else if (sixteenths % 2 === 0) fracStr = ` ${sixteenths / 2}/8`;
    else fracStr = ` ${sixteenths}/16`;
  }

  return `${isNeg ? '-' : ''}${feet}'-${finalInches}${fracStr}"`;
}

/**
 * Rebar Callout Parser:
 * Accepts: "12 mm @ 150 mm c/c", "16mm @ 6 in c/c", "20 mm @ 200 mm", "12 @ 150"
 */
export function parseRebarCallout(input: string): {
  diameterMm: number;
  spacingMm: number;
  isValid: boolean;
  normalizedText: string;
} {
  const clean = input ? input.trim() : '';
  const match = clean.match(/^(\d+(?:\.\d+)?)\s*(?:mm)?\s*@\s*(\d+(?:\.\d+)?)\s*(mm|in|cm)?(?:\s*c\/c)?/i);
  if (match) {
    const dia = parseFloat(match[1]);
    let spacing = parseFloat(match[2]);
    const unit = (match[3] || 'mm').toLowerCase();
    if (unit === 'in') spacing *= 25.4;
    else if (unit === 'cm') spacing *= 10;
    return {
      diameterMm: dia,
      spacingMm: spacing,
      isValid: true,
      normalizedText: `Ø${dia}mm @ ${Math.round(spacing)}mm c/c`,
    };
  }
  return { diameterMm: 0, spacingMm: 0, isValid: false, normalizedText: clean };
}

/**
 * Tile dimension parser:
 * Accepts: "300 × 300 mm", "600x600 mm", "12 x 12 in", "2 x 2 ft"
 */
export function parseTileDimension(input: string): {
  widthMm: number;
  lengthMm: number;
  areaM2: number;
  areaSqFt: number;
  isValid: boolean;
  label: string;
} {
  const clean = input ? input.trim() : '';
  const match = clean.match(/^(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)\s*(mm|cm|in|ft)?$/i);
  if (match) {
    let w = parseFloat(match[1]);
    let l = parseFloat(match[2]);
    const unit = (match[3] || 'mm').toLowerCase();
    if (unit === 'cm') { w *= 10; l *= 10; }
    else if (unit === 'in') { w *= 25.4; l *= 25.4; }
    else if (unit === 'ft') { w *= 304.8; l *= 304.8; }
    const areaM2 = (w / 1000) * (l / 1000);
    const areaSqFt = areaM2 / 0.09290304;
    return {
      widthMm: w,
      lengthMm: l,
      areaM2,
      areaSqFt,
      isValid: true,
      label: `${w} × ${l} mm (${formatNumber(areaSqFt, 2)} sq.ft)`,
    };
  }
  return { widthMm: 0, lengthMm: 0, areaM2: 0, areaSqFt: 0, isValid: false, label: clean };
}

/**
 * Slope & Gradient Parser:
 * Accepts: "1:20", "5%", "0.05", "2.86°"
 */
export function parseSlope(input: string): {
  percent: number;
  ratioString: string;
  decimal: number;
  angleDeg: number;
  isValid: boolean;
} {
  const clean = input ? input.trim() : '';
  if (!clean) return { percent: 0, ratioString: '1:0', decimal: 0, angleDeg: 0, isValid: false };

  // 1:N ratio
  const ratioMatch = clean.match(/^1\s*:\s*(\d+(?:\.\d+)?)$/);
  if (ratioMatch) {
    const n = parseFloat(ratioMatch[1]);
    const percent = n !== 0 ? 100 / n : 0;
    const decimal = percent / 100;
    const angleDeg = (Math.atan(decimal) * 180) / Math.PI;
    return { percent, ratioString: `1:${n}`, decimal, angleDeg, isValid: true };
  }

  // Percentage
  const pctMatch = clean.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const decimal = pct / 100;
    const n = pct !== 0 ? Math.round((100 / pct) * 10) / 10 : 0;
    const angleDeg = (Math.atan(decimal) * 180) / Math.PI;
    return { percent: pct, ratioString: `1:${n}`, decimal, angleDeg, isValid: true };
  }

  // Degrees
  const degMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:°|deg)$/i);
  if (degMatch) {
    const deg = parseFloat(degMatch[1]);
    const decimal = Math.tan((deg * Math.PI) / 180);
    const pct = decimal * 100;
    const n = pct !== 0 ? Math.round((100 / pct) * 10) / 10 : 0;
    return { percent: pct, ratioString: `1:${n}`, decimal, angleDeg: deg, isValid: true };
  }

  // Decimal number
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    const decimal = num > 1 ? num / 100 : num;
    const pct = decimal * 100;
    const n = pct !== 0 ? Math.round((100 / pct) * 10) / 10 : 0;
    const angleDeg = (Math.atan(decimal) * 180) / Math.PI;
    return { percent: pct, ratioString: `1:${n}`, decimal, angleDeg, isValid: true };
  }

  return { percent: 0, ratioString: '1:0', decimal: 0, angleDeg: 0, isValid: false };
}

/**
 * Degrees-Minutes-Seconds (DMS) Parser:
 * Accepts: "45° 30' 20\"", "45d 30m 20s", "45-30-20", "45.5055"
 */
export function parseDMS(input: string): {
  degrees: number;
  minutes: number;
  seconds: number;
  decimalDegrees: number;
  isValid: boolean;
  formatted: string;
} {
  const clean = input ? input.trim() : '';
  const dmsMatch = clean.match(/^(\d+)\s*(?:°|d|-)\s*(\d+)?\s*(?:'|m|-)?\s*(\d+(?:\.\d+)?)?\s*(?:"|s)?$/i);
  if (dmsMatch) {
    const deg = parseInt(dmsMatch[1], 10);
    const min = dmsMatch[2] ? parseInt(dmsMatch[2], 10) : 0;
    const sec = dmsMatch[3] ? parseFloat(dmsMatch[3]) : 0;
    const decimal = deg + min / 60 + sec / 3600;
    return {
      degrees: deg,
      minutes: min,
      seconds: sec,
      decimalDegrees: decimal,
      isValid: true,
      formatted: `${deg}° ${min}' ${sec.toFixed(1)}"`,
    };
  }
  const dec = parseFloat(clean);
  if (!isNaN(dec)) {
    const deg = Math.floor(dec);
    const remM = (dec - deg) * 60;
    const min = Math.floor(remM);
    const sec = (remM - min) * 60;
    return {
      degrees: deg,
      minutes: min,
      seconds: sec,
      decimalDegrees: dec,
      isValid: true,
      formatted: `${deg}° ${min}' ${sec.toFixed(1)}"`,
    };
  }
  return { degrees: 0, minutes: 0, seconds: 0, decimalDegrees: 0, isValid: false, formatted: clean };
}

export function formatDMS(decimalDegrees: number): string {
  if (isNaN(decimalDegrees) || !isFinite(decimalDegrees)) return `0° 0' 0"`;
  const abs = Math.abs(decimalDegrees);
  const deg = Math.floor(abs);
  const remM = (abs - deg) * 60;
  const min = Math.floor(remM);
  const sec = (remM - min) * 60;
  const sign = decimalDegrees < 0 ? '-' : '';
  return `${sign}${deg}° ${min}' ${sec.toFixed(1)}"`;
}

// Backward compatibility export
export const UNIT_CATEGORIES = BUILTIN_UNIT_CATEGORIES;
