import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Printer,
  Bookmark,
  Star,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Hash,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileText,
  Download,
} from 'lucide-react';
import { CalculationResult, AppSettings } from '../types';
import { Logo } from './Logo';
import { useToast } from './Common/Toast';
import { PrintPreviewModal } from './Common/PrintPreviewModal';
import { exportCalculationToPDF } from '../utils/exportEngine';
import { RebarCrossSectionMotif, BeamColumnJointMotif } from './Common/EngineeringMotifs';
import {
  getUnitsForCategory,
  fromBase,
  toBase,
  formatNumber,
  formatCurrency,
} from '../utils/units';

interface ResultPanelProps {
  result: CalculationResult | null;
  settings?: AppSettings;
  onReset?: () => void;
  onSaveHistory?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  settings,
  onReset,
  onSaveHistory,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedResultOnly, setCopiedResultOnly] = useState(false);
  const [savedHistory, setSavedHistory] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Collapsible sections state (Section 13)
  const [isFormulaExpanded, setIsFormulaExpanded] = useState(true);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true);
  const [isAssumptionsExpanded, setIsAssumptionsExpanded] = useState(true);

  // Dynamic Output Unit State
  const [selectedOutputUnit, setSelectedOutputUnit] = useState<string | null>(null);
  const [precisionOverride, setPrecisionOverride] = useState<number | 'auto'>(
    settings?.decimalPrecision ?? 2
  );
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  // Reset output unit override if result changes
  React.useEffect(() => {
    setSelectedOutputUnit(null);
  }, [result?.title, result?.primaryValue, result?.primaryUnit]);

  // Determine Category of Primary Output
  const outputCategory = useMemo(() => {
    if (!result) return null;
    if (result.primaryCategory) return result.primaryCategory;
    const u = result.primaryUnit.toLowerCase().trim();
    if (['m³', 'cft', 'cu.ft', 'cu.m', 'liter', 'l', 'gal'].includes(u)) return 'volume';
    if (['kg', 'tonne', 't', 'ton', 'lb', 'lbs', 'bag', 'q'].includes(u)) return 'mass';
    if (['m', 'ft', 'mm', 'cm', 'in', 'km'].includes(u)) return 'length';
    if (['m²', 'sq.ft', 'sqft', 'sq.m', 'acre', 'decimal', 'katha', 'bigha', 'ha'].includes(u)) return 'area';
    if (['kn', 'n', 'mn', 'kgf', 'lbf', 'kip'].includes(u)) return 'force';
    if (['mpa', 'kpa', 'psi', 'ksi', 'n/mm²', 'bar'].includes(u)) return 'pressure';
    if (['kn/m', 'n/m', 'lb/ft'].includes(u)) return 'linear_load';
    if (['kn·m', 'n·m', 'kip·ft'].includes(u)) return 'moment';
    return null;
  }, [result]);

  const availableOutputUnits = useMemo(() => {
    if (!outputCategory) return [];
    return getUnitsForCategory(outputCategory, {
      regionalProfile: settings?.regionalProfile,
      cementBagKg: settings?.defaultCementBagKg,
      customUnits: settings?.customUnits,
    });
  }, [outputCategory, settings]);

  // Compute canonical base value
  const baseValue = useMemo(() => {
    if (!result) return 0;
    if (result.primaryRawValue !== undefined) return result.primaryRawValue;
    const cleanNum = result.primaryValue ? result.primaryValue.replace(/,/g, '') : '0';
    const num = parseFloat(cleanNum);
    if (isNaN(num)) return 0;
    if (!outputCategory) return num;
    return toBase(num, result.primaryUnit, outputCategory, {
      regionalProfile: settings?.regionalProfile,
      cementBagKg: settings?.defaultCementBagKg,
      customUnits: settings?.customUnits,
    });
  }, [result, outputCategory, settings]);

  // Compute active display value & unit
  const activeUnit = selectedOutputUnit || result?.primaryUnit || '';
  const activeDisplayValue = useMemo(() => {
    if (!result) return '0';
    const precision = precisionOverride === 'auto' ? 4 : precisionOverride;
    if (selectedOutputUnit && outputCategory && baseValue !== 0) {
      const converted = fromBase(baseValue, selectedOutputUnit, outputCategory, {
        regionalProfile: settings?.regionalProfile,
        cementBagKg: settings?.defaultCementBagKg,
        customUnits: settings?.customUnits,
      });
      return formatNumber(converted, precision);
    }
    const cleanNum = result.primaryValue ? result.primaryValue.replace(/,/g, '') : '0';
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && precisionOverride !== 'auto') {
      return formatNumber(num, precisionOverride);
    }
    return result.primaryValue;
  }, [result, selectedOutputUnit, outputCategory, baseValue, precisionOverride, settings]);

  // Compute common alternative multi-unit representation
  const secondaryUnitConversion = useMemo(() => {
    if (!result || !outputCategory || baseValue === 0) return null;
    if (outputCategory === 'volume') {
      const inM3 = fromBase(baseValue, 'm3', 'volume', { regionalProfile: settings?.regionalProfile });
      const inCft = fromBase(baseValue, 'cft', 'volume', { regionalProfile: settings?.regionalProfile });
      return {
        unitA: `${formatNumber(inM3, 2)} m³`,
        unitB: `${formatNumber(inCft, 2)} CFT`,
      };
    }
    if (outputCategory === 'mass') {
      const inKg = fromBase(baseValue, 'kg', 'mass');
      const inTonne = fromBase(baseValue, 'tonne', 'mass');
      const inLb = fromBase(baseValue, 'lb', 'mass');
      return {
        unitA: `${formatNumber(inKg, 2)} kg`,
        unitB: `${formatNumber(inTonne, 3)} tonne (${formatNumber(inLb, 1)} lb)`,
      };
    }
    if (outputCategory === 'area') {
      const inM2 = fromBase(baseValue, 'm2', 'area', { regionalProfile: settings?.regionalProfile });
      const inSqFt = fromBase(baseValue, 'ft2', 'area', { regionalProfile: settings?.regionalProfile });
      const inDec = fromBase(baseValue, 'decimal', 'area', { regionalProfile: settings?.regionalProfile });
      return {
        unitA: `${formatNumber(inM2, 2)} m²`,
        unitB: `${formatNumber(inSqFt, 2)} sq.ft (${formatNumber(inDec, 3)} decimal)`,
      };
    }
    if (outputCategory === 'length') {
      const inM = fromBase(baseValue, 'm', 'length');
      const inFt = fromBase(baseValue, 'ft', 'length');
      return {
        unitA: `${formatNumber(inM, 3)} m`,
        unitB: `${formatNumber(inFt, 2)} ft`,
      };
    }
    return null;
  }, [result, outputCategory, baseValue, settings]);

  // Engineering Result States (Material 3 Precision Specification)
  const statusBadge = useMemo(() => {
    if (!result) return null;
    const t = result.title.toLowerCase();
    if (result.isPreliminary || t.includes('preliminary') || t.includes('thumb-rule')) {
      return {
        state: 'PRELIMINARY',
        label: 'PRELIMINARY ESTIMATE',
        className: 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300',
        note: 'Requires final structural verification against physical project drawings and certified design review.',
        icon: AlertTriangle,
      };
    }
    if (
      t.includes('takeoff') ||
      t.includes('boq') ||
      t.includes('brick') ||
      t.includes('plaster') ||
      t.includes('paint') ||
      t.includes('tile') ||
      t.includes('haulage') ||
      t.includes('rate')
    ) {
      return {
        state: 'ESTIMATION',
        label: 'MATERIAL ESTIMATION',
        className: 'bg-sky-500/15 border-sky-500/30 text-sky-800 dark:text-sky-300',
        note: 'Site-specific wastage and field tolerances apply. Recommended allowances included in breakdown.',
        icon: Hash,
      };
    }
    if (t.includes('converter') || t.includes('parser') || t.includes('geometry') || t.includes('dms')) {
      return {
        state: 'INFORMATION',
        label: 'MATHEMATICAL EXACT',
        className: 'bg-slate-500/15 border-slate-500/30 text-slate-700 dark:text-slate-300',
        note: 'Exact algebraic and geometric derivation with high-precision double-float accuracy.',
        icon: Info,
      };
    }
    return {
      state: 'CODE-REFERENCED',
      label: 'CODE-REFERENCED CALCULATION',
      className: 'bg-cyan-500/15 border-cyan-500/30 text-sky-800 dark:text-cyan-300',
      note: 'Verified against standard civil specifications (BNBC 2020 / ACI 318 / IS 456 / ASTM).',
      icon: ShieldCheck,
    };
  }, [result]);

  if (!result) {
    return (
      <div className="h-full min-h-[340px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827]/60 p-8 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
        <div className="mb-3 opacity-30 pointer-events-none">
          <RebarCrossSectionMotif size={90} />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Ready to Compute
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          Enter parameters on the left to compute live values. The Multi-Unit Engine will automatically normalize variables, display step-by-step arithmetic traces, and enable dynamic unit conversion.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    let text = `PB CivilLab — Civil Engineering Tools by Prokash Biswas\n`;
    text += `Tool: ${result.title}\n`;
    text += `Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}\n\n`;
    text += `RESULT: ${activeDisplayValue} ${activeUnit}\n`;
    if (secondaryUnitConversion) {
      text += `Equivalent: ${secondaryUnitConversion.unitA} = ${secondaryUnitConversion.unitB}\n`;
    }
    if (result.secondaryValues && result.secondaryValues.length > 0) {
      text += `\nAdditional Outputs:\n`;
      result.secondaryValues.forEach(s => {
        text += `• ${s.label}: ${s.value} ${s.unit || ''}\n`;
      });
    }
    if (result.inputsSummary && result.inputsSummary.length > 0) {
      text += `\nInputs:\n`;
      result.inputsSummary.forEach(i => {
        text += `• ${i.label}: ${i.value}\n`;
      });
    }
    text += `\nFormula Used:\n${result.formula}\n`;
    text += `Substituted: ${result.substitutedFormula}\n`;
    if (result.assumptions && result.assumptions.length > 0) {
      text += `\nAssumptions:\n`;
      result.assumptions.forEach(a => {
        text += `• ${a.label}: ${a.value}\n`;
      });
    }
    if (result.engineeringNotes) {
      text += `\nEngineering Notes:\n${result.engineeringNotes}\n`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Full engineering calculation sheet copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyResultOnly = () => {
    navigator.clipboard.writeText(`${activeDisplayValue} ${activeUnit}`);
    setCopiedResultOnly(true);
    toast.success(`Copied: ${activeDisplayValue} ${activeUnit}`);
    setTimeout(() => setCopiedResultOnly(false), 2000);
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const handleExportPDF = () => {
    if (!result) return;
    try {
      setIsExportingPDF(true);
      exportCalculationToPDF(result, {
        settings,
        projectMeta: result.projectMeta,
        autoDownload: true,
      });
      toast.success('Official A4 Engineering PDF exported with PB CivilLab branding');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF. Opening print preview instead.');
      setIsPrintPreviewOpen(true);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 1200);
    }
  };

  const handleSave = () => {
    if (onSaveHistory) {
      onSaveHistory();
      setSavedHistory(true);
      toast.success('Calculation saved to history.');
      setTimeout(() => setSavedHistory(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-xl overflow-hidden print-card">
      {/* Top Banner / Actions Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#151C2B] flex items-center justify-between no-print flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Logo variant="icon" height={18} />
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">
            Calculation Output
          </span>
          {statusBadge && (
            <span
              title={statusBadge.note}
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border flex items-center gap-1 font-semibold ${statusBadge.className}`}
            >
              <statusBadge.icon className="w-3 h-3 shrink-0" />
              <span>{statusBadge.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">

          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isFavorite
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyResultOnly}
            title="Copy value + unit only (e.g. 12.50 m³)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copiedResultOnly ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Unit Copied ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Copy Unit</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy full calculation sheet"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Sheet Copied ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Full Sheet</span>
              </>
            )}
          </button>

          {onSaveHistory && (
            <button
              type="button"
              onClick={handleSave}
              title="Save to local calculation history"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              {savedHistory ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Saved ✓</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Save</span>
                </>
              )}
            </button>
          )}

          {/* Instant 1-Click Site Log PDF Export */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            title="Export official 1-page A4 Site Log PDF directly with PB CivilLab branding, calculation trace & QA verification block"
            className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Print & PDF Report Preview Button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Open interactive report preview to customize project metadata, print, or export formats"
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Print / Preview</span>
            <span className="sm:hidden">Print</span>
          </button>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset inputs"
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Result Display (On-Screen Interactive UI) */}
      <div className="p-6 no-print">
        {/* On-Screen Calculation Title */}
        <div className="mb-4 pb-2 border-b border-white/5">
          <h2 className="text-xl sm:text-2xl font-wood font-normal text-slate-100 tracking-wide">
            {result.title}
          </h2>
        </div>

        {/* Primary Result Section with Output Unit Selector (Section 12) */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-[#111827] to-[#151C2B] relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span>Primary Engineering Output</span>
              {outputCategory && (
                <span className="text-[10px] text-slate-500">({outputCategory})</span>
              )}
            </span>

            {/* Precision Selector Bar (Section 26) */}
            <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-black/40 p-1 rounded-lg border border-white/5 no-print">
              <Hash className="w-3 h-3 text-cyan-400 ml-1" />
              <span>Decimals:</span>
              {[0, 1, 2, 3, 4].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrecisionOverride(p)}
                  className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                    precisionOverride === p ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPrecisionOverride('auto')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  precisionOverride === 'auto' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-white/10 text-slate-300'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-5xl font-extrabold text-cyan-400 font-mono tracking-tight print-text-dark">
              {activeDisplayValue}
            </span>

            {/* Interactive Output Unit Selector Dropdown */}
            {availableOutputUnits.length > 0 ? (
              <div className="relative inline-block no-print">
                <button
                  type="button"
                  onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                  title="Click to change displayed output unit (auto-converts instantly)"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white font-bold text-base transition-colors"
                >
                  <span className="font-mono">{activeUnit}</span>
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                </button>

                {isUnitDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-white/15 bg-[#0F172A] shadow-2xl z-50 p-1.5 max-h-56 overflow-y-auto backdrop-blur-md">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5 mb-1 font-mono">
                      Convert Output Unit:
                    </div>
                    {availableOutputUnits.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedOutputUnit(u.symbol);
                          setIsUnitDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors flex items-center justify-between ${
                          u.symbol === activeUnit
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <span className="font-mono text-cyan-400 font-bold">{u.symbol}</span>
                        <span className="text-[11px] text-slate-400 truncate ml-2 font-sans">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xl sm:text-2xl font-semibold text-slate-300 print-text-dark font-mono">
                {activeUnit}
              </span>
            )}
          </div>

          {/* Dual / Secondary Multi-Unit Display */}
          {secondaryUnitConversion && (
            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Dual Units:</span>
              <span className="text-slate-300 font-semibold">{secondaryUnitConversion.unitA}</span>
              <span>≈</span>
              <span className="text-cyan-400 font-semibold">{secondaryUnitConversion.unitB}</span>
            </div>
          )}
        </div>

        {/* Dimension Validation Warning if Incompatible */}
        {result.dimensionValidation && !result.dimensionValidation.isValid && (
          <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-sans">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{result.dimensionValidation.message || 'Invalid unit combination encountered.'}</span>
          </div>
        )}

        {/* Secondary Values Grid */}
        {result.secondaryValues && result.secondaryValues.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {result.secondaryValues.map((sec, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-[#151C2B]/80 shadow-sm">
                <span className="text-xs text-slate-400 block mb-1 truncate font-sans">{sec.label}</span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-slate-100 font-mono print-text-dark">
                    {sec.value}
                  </span>
                  {sec.unit && (
                    <span className="text-xs font-semibold text-cyan-400 font-mono print-text-dark">
                      {sec.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collapsible Formula Section (Section 13) */}
        <div className="mb-4 rounded-xl border border-white/5 bg-[#151C2B]/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors no-print"
          >
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Governing Equation & Formula</span>
            </span>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-mono text-cyan-400">SI Normalized</span>
              {isFormulaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {(isFormulaExpanded || window.matchMedia?.('print')?.matches) && (
            <div className="p-4 pt-1 font-mono text-xs space-y-2 border-t border-white/5">
              <div className="p-2.5 rounded-lg bg-[#0B0F19] text-cyan-300 border border-white/5 overflow-x-auto">
                <code>{result.formula}</code>
              </div>
              <div className="text-slate-400 pt-1">
                <span className="text-[11px] uppercase tracking-wider block text-slate-500 font-sans mb-1">
                  Substituted Values & Evaluation
                </span>
                <div className="p-2.5 rounded-lg bg-[#0B0F19] text-slate-200 border border-white/5 overflow-x-auto">
                  <code>{result.substitutedFormula}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Step Breakdown (Section 13) */}
        {result.breakdown && result.breakdown.length > 0 && (
          <div className="mb-4 rounded-xl border border-white/5 bg-[#151C2B]/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors no-print"
            >
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Step-by-Step Mathematical Trace ({result.breakdown.length} steps)
              </span>
              {isBreakdownExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isBreakdownExpanded && (
              <div className="divide-y divide-white/5 border-t border-white/5 text-xs">
                {result.breakdown.map((b, idx) => (
                  <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-200">{b.step}</span>
                      <p className="font-mono text-slate-400 text-[11px]">{b.expression}</p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="font-mono font-bold text-cyan-300">{b.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inputs Summary & Assumptions (Collapsible, Section 13) */}
        <div className="mb-4 rounded-xl border border-white/5 bg-[#151C2B]/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAssumptionsExpanded(!isAssumptionsExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors no-print"
          >
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Input Parameters & Assumptions
            </span>
            {isAssumptionsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isAssumptionsExpanded && (
            <div className="p-4 pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {result.inputsSummary && result.inputsSummary.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                    Inputs Received
                  </span>
                  <ul className="space-y-1 divide-y divide-white/5">
                    {result.inputsSummary.map((inp, idx) => (
                      <li key={idx} className="pt-1 flex items-center justify-between text-slate-400">
                        <span>{inp.label}</span>
                        <span className="font-mono text-slate-200 font-semibold">{inp.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.assumptions && result.assumptions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                    Design Assumptions
                  </span>
                  <ul className="space-y-1 divide-y divide-white/5">
                    {result.assumptions.map((ass, idx) => (
                      <li key={idx} className="pt-1 flex flex-col text-slate-400">
                        <span className="font-medium text-slate-300">{ass.label}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{ass.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Engineering Practical Notes */}
        {result.engineeringNotes && (
          <div className="mt-4 p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/15 text-xs text-slate-300 flex items-start gap-2.5">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 font-mono">
              Site Note
            </span>
            <p className="leading-relaxed text-slate-300 font-sans">{result.engineeringNotes}</p>
          </div>
        )}
      </div>

      {/* PB CivilLab Dedicated Print & PDF Report Engine Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        result={result}
        settings={settings || ({} as any)}
      />
    </div>
  );
};
