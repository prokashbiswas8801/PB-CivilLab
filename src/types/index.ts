export type ToolCategory =
  | 'all'
  | 'converters'
  | 'concrete'
  | 'masonry'
  | 'rebar'
  | 'earthwork'
  | 'flooring'
  | 'surveying'
  | 'structural'
  | 'estimation'
  | 'geometry'
  | 'utilities';

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: string;
  keywords: string[];
}

export interface CalculationTraceStep {
  label: string;
  formula?: string;
  expression: string;
  result: string;
}

export interface EngineeringBasis {
  calculationBasis: string;
  formulaMethod: string;
  standardCode?: string;
  referenceClause?: string;
  materialAssumption: string;
  densityConstants: string;
  toleranceNote?: string;
  engineeringNotes?: string;
}

export type ReportStatus =
  | 'Draft'
  | 'For Review'
  | 'Checked'
  | 'Approved'
  | 'For Construction'
  | 'As-Built';

export interface ReportProjectMeta {
  projectName?: string;
  projectId?: string;
  client?: string;
  contractor?: string;
  consultant?: string;
  location?: string;
  drawingNumber?: string;
  drawingRevision?: string;
  documentNumber?: string;
  calculationReference?: string;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  reportStatus?: ReportStatus;
  date?: string;
  showEmptyFields?: boolean;
}

export interface CalculationResult {
  title: string;
  primaryValue: string;
  primaryUnit: string;
  primaryCategory?: string;
  primaryRawValue?: number;
  secondaryValues?: { label: string; value: string; unit?: string; category?: string; rawValue?: number }[];
  breakdown: { step: string; expression: string; result: string }[];
  formula: string;
  substitutedFormula: string;
  inputsSummary: { label: string; value: string; rawValue?: number; unit?: string }[];
  assumptions: { label: string; value: string }[];
  engineeringNotes?: string;
  isPreliminary?: boolean;
  dimensionValidation?: { isValid: boolean; message?: string };
  rawValues?: Record<string, number>;
  calculationTrace?: CalculationTraceStep[];
  engineeringBasis?: EngineeringBasis;
  documentId?: string;
  projectMeta?: ReportProjectMeta;
}

export interface CustomUnit {
  id: string;
  name: string;
  symbol: string;
  category: string;
  factorToBase: number;
  baseUnitSymbol: string;
  civilNote?: string;
}

export interface UnitPreferences {
  length: string;
  area: string;
  volume: string;
  mass: string;
  pressure: string;
  force: string;
  structuralDim: string;
}

export interface HistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  timestamp: string;
  summary: string;
  result: CalculationResult;
  inputUnits?: Record<string, string>;
  normalizedInputs?: Record<string, number>;
  outputUnit?: string;
}

export interface RegionalProfile {
  name: string;
  decimalSqFt: number; // 435.6 sq ft standard in Bangladesh
  kathaSqFt: number;   // 720 sq ft (1.65 decimal approx)
  bighaKatha: number;  // 20 katha per bigha
  description: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  unitSystem: 'metric' | 'imperial' | 'construction' | 'bangladesh';
  decimalPrecision: number;
  defaultCementBagKg: number;
  defaultDryFactorConcrete: number;
  defaultDryFactorPlaster: number;
  defaultConcreteWastage: number;
  regionalProfile: RegionalProfile;
  unitPreferences?: UnitPreferences;
  bangladeshProfileActive?: boolean;
  customUnits?: CustomUnit[];
}

export interface BOQItem {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface TakeoffItem {
  id: string;
  itemNo: string;
  description: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
  unit: 'm' | 'm²' | 'm³' | 'ft' | 'sq.ft' | 'CFT' | 'kg' | 'ton' | 'pcs';
  rate: number;
  totalQty: number;
  amount: number;
}

export interface SurveyLevelRow {
  id: string;
  station: string;
  bs?: number; // Backsight
  is?: number; // Intermediate sight
  fs?: number; // Foresight
  hi?: number; // Height of instrument
  rise?: number;
  fall?: number;
  rl: number;  // Reduced level
  remarks?: string;
}

export interface FormulaVariable {
  symbol: string;
  description: string;
  unit: string;
}

export interface FormulaItem {
  id: string;
  name: string;
  category: string;
  formula: string;
  variables: FormulaVariable[];
  notes: string;
}

export interface MaterialRateItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  category: 'material' | 'labor' | 'equipment' | 'overhead';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

