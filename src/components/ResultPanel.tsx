import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Printer,
  Bookmark,
  Star,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Hash,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CalculationResult, AppSettings } from '../types';
import { Logo } from './Logo';
import { useToast } from './Common/Toast';
import { PrintPreviewModal } from './Common/PrintPreviewModal';
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
  onConsultAI?: (calc: CalculationResult) => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  settings,
  onReset,
  onSaveHistory,
  isFavorite = false,
  onToggleFavorite,
  onConsultAI,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedResultOnly, setCopiedResultOnly] = useState(false);
  const [savedHistory, setSavedHistory] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
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
    setAuditReport(null);
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

  // Status Badge Label (Section 14)
  const statusBadge = useMemo(() => {
    if (!result) return null;
    if (result.isPreliminary) {
      return {
        label: 'PRELIMINARY ESTIMATION',
        className: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      };
    }
    return {
      label: 'CODE-REFERENCED CALCULATION',
      className: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    };
  }, [result]);

  if (!result) {
    return (
      <div className="h-full min-h-[340px] rounded-2xl border border-white/10 bg-[#111827]/60 p-8 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
          <ArrowLeftRight className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-200">Ready to Compute</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
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

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const handleSave = () => {
    if (onSaveHistory) {
      onSaveHistory();
      setSavedHistory(true);
      toast.success('Calculation saved to history.');
      setTimeout(() => setSavedHistory(false), 2000);
    }
  };

  const handleTriggerAudit = async () => {
    setIsAuditModalOpen(true);
    if (auditReport) return;
    setIsAuditing(true);
    setAuditError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ calculation: result }),
      });
      clearTimeout(timeoutId);

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server error (HTTP ${response.status})` };
      }

      if (!response.ok) {
        throw new Error(data.error || 'Audit request failed');
      }
      setAuditReport(data.audit);
      toast.success('AI engineering code audit completed.');
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      setAuditError(
        isAbort
          ? 'Audit request timed out after 35 seconds. Please try again.'
          : err?.message || 'Error occurred while contacting AI Audit service.'
      );
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] shadow-xl overflow-hidden print-card">
      {/* Top Banner / Actions Header */}
      <div className="px-5 py-3.5 border-b border-white/5 bg-[#151C2B] flex items-center justify-between no-print flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Logo variant="icon" height={18} />
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            Calculation Output
          </span>
          {statusBadge && (
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* AI Audit Action Button */}
          <button
            type="button"
            onClick={handleTriggerAudit}
            title="Perform AI Technical Audit & Code Verification"
            className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-xs font-semibold text-cyan-300 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit with AI</span>
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isFavorite
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyResultOnly}
            title="Copy value + unit only (e.g. 12.50 m³)"
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copiedResultOnly ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400">Unit Copied ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Unit</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy full calculation sheet"
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Sheet Copied ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Sheet</span>
              </>
            )}
          </button>

          {onSaveHistory && (
            <button
              type="button"
              onClick={handleSave}
              title="Save to local calculation history"
              className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
            >
              {savedHistory ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">Saved ✓</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save</span>
                </>
              )}
            </button>
          )}

          {/* Generate Summary Report Button (Physical Site Log) */}
          <button
            type="button"
            onClick={handlePrint}
            title="Generate and print a clean summary report formatted for physical project site logs"
            className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Generate Summary Report</span>
            <span className="sm:hidden">Report</span>
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

      {/* ========================================================================= */}
      {/* PHYSICAL PROJECT SITE LOG SUMMARY REPORT (PRINT / PDF ONLY)               */}
      {/* Formatted specifically for physical jobsite clipboards and field logs     */}
      {/* ========================================================================= */}
      <div className="print-only hidden font-sans text-black bg-white p-6 max-w-4xl mx-auto leading-normal">
        {/* Official Site Header */}
        <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-wood text-3xl font-bold text-black tracking-tight">PB CivilLab</span>
              <span className="text-[10px] px-2 py-0.5 border border-black font-mono font-bold uppercase tracking-wider">
                Official Site Log
              </span>
            </div>
            <p className="text-xs text-gray-800 mt-1 font-medium">
              Civil Engineering Field Computation & Verification Log · Prokash Biswas
            </p>
            <p className="text-[11px] text-gray-600 font-mono mt-0.5">
              Generated: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="border border-black px-3 py-1 font-mono text-center">
              <span className="block text-[9px] uppercase tracking-wider text-gray-600">Document Ref</span>
              <strong className="text-xs">LOG-{Date.now().toString().slice(-6)}</strong>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
              Code: {settings?.regionalProfile?.name || 'BNBC 2020 / ACI 318 Standard'}
            </div>
          </div>
        </div>

        {/* Project & Module Metadata Bar */}
        <div className="grid grid-cols-3 gap-2 border border-black p-2.5 mb-4 text-xs bg-gray-50 print-no-break">
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-600">Site Log Title</span>
            <span className="font-bold text-black">{result.title}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-600">Physical Dimension / Category</span>
            <span className="font-semibold text-black uppercase font-mono">{outputCategory || 'General Civil'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-600">Engineering Status</span>
            <span className="font-bold text-black uppercase font-mono">
              {result.isPreliminary ? 'Preliminary Estimate' : 'Code-Referenced'}
            </span>
          </div>
        </div>

        {/* Primary Result Highlight Box */}
        <div className="border-2 border-black p-4 mb-4 bg-gray-100 flex items-center justify-between print-no-break">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
              Primary Computed Result
            </span>
            <div className="text-3xl font-extrabold font-mono text-black mt-1">
              {activeDisplayValue} <span className="text-xl font-bold">{activeUnit}</span>
            </div>
            {secondaryUnitConversion && (
              <p className="text-xs text-gray-700 font-mono mt-1">
                Equivalent: {secondaryUnitConversion.unitA} ≈ {secondaryUnitConversion.unitB}
              </p>
            )}
          </div>
          <div className="border-l border-gray-400 pl-4 text-right text-xs space-y-1">
            <span className="block text-[10px] uppercase text-gray-600 font-bold">Standard Precision</span>
            <span className="font-mono font-bold text-black">{settings?.decimalPrecision ?? 2} Decimals</span>
          </div>
        </div>

        {/* Computed Secondary Quantities Table */}
        {result.secondaryValues && result.secondaryValues.length > 0 && (
          <div className="mb-4 print-no-break">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
              Computed Quantities & Secondary Outputs
            </h4>
            <table className="w-full text-xs border border-collapse border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-1.5 text-left border-r border-black font-bold">Item / Quantity Description</th>
                  <th className="p-1.5 text-right font-bold">Computed Value</th>
                </tr>
              </thead>
              <tbody>
                {result.secondaryValues.map((sec, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black font-medium">{sec.label}</td>
                    <td className="p-1.5 text-right font-mono font-bold">
                      {sec.value} {sec.unit || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Input Parameters Table */}
        {result.inputsSummary && result.inputsSummary.length > 0 && (
          <div className="mb-4 print-no-break">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
              Specified Field Input Parameters
            </h4>
            <table className="w-full text-xs border border-collapse border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-1.5 text-left border-r border-black font-bold">Field Parameter</th>
                  <th className="p-1.5 text-right font-bold">Input Value</th>
                </tr>
              </thead>
              <tbody>
                {result.inputsSummary.map((inp, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black">{inp.label}</td>
                    <td className="p-1.5 text-right font-mono font-bold">{inp.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Governing Equation Box */}
        <div className="mb-4 border border-black p-3 text-xs bg-gray-50 print-no-break">
          <span className="font-bold uppercase text-[10px] text-gray-700 block mb-1">
            Governing Engineering Equation & Mathematical Substituted Trace
          </span>
          <div className="font-mono text-black font-bold mb-1">
            Formula: {result.formula}
          </div>
          <div className="font-mono text-gray-800 text-[11px]">
            Substituted: {result.substitutedFormula}
          </div>
        </div>

        {/* Assumptions & Notes */}
        {(result.assumptions?.length || result.engineeringNotes) && (
          <div className="mb-4 text-xs print-no-break">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
              Design Assumptions & Field Practical Notes
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-800 text-[11px]">
              {result.assumptions?.map((ass, idx) => (
                <li key={idx}>
                  <strong>{ass.label}:</strong> {ass.value}
                </li>
              ))}
              {result.engineeringNotes && (
                <li>
                  <strong>Site Note:</strong> {result.engineeringNotes}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Physical Quality Assurance Sign-Off Block */}
        <div className="mt-8 pt-4 border-t-2 border-black print-no-break">
          <span className="block text-[10px] uppercase font-bold text-gray-600 mb-4 tracking-wider">
            Jobsite Quality Assurance & Verification Sign-Off
          </span>
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-black pt-1">
              <span className="block font-bold text-black">Prepared By (Site Engineer)</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">Signature & Date</span>
            </div>
            <div className="border-t border-black pt-1">
              <span className="block font-bold text-black">Checked By (Quality / RE)</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">Signature & Date</span>
            </div>
            <div className="border-t border-black pt-1">
              <span className="block font-bold text-black">Approved By (Project Manager)</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">Signature & Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Technical Audit Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#0F172A] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-white/10 bg-[#151C2B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">AI Civil Engineering Audit & Code Check</h3>
                  <p className="text-[11px] text-cyan-300 font-mono">{result.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-200 leading-relaxed font-sans">
              {isAuditing && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <p className="text-slate-300 font-medium">
                    Performing structural audit against BNBC, ACI 318, IS 456 & ASTM codes...
                  </p>
                </div>
              )}

              {auditError && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 space-y-1">
                  <span className="font-bold">Audit Service Notice</span>
                  <p>{auditError}</p>
                </div>
              )}

              {auditReport && (
                <div className="space-y-3 whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                  {auditReport}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-white/10 bg-[#151C2B] flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Verified against standard civil tolerances</span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-medium transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

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
