import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeftRight, Copy, Check, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { AppSettings, RegionalProfile } from '../../types';
import {
  getUnitsForCategory,
  convertUnit,
  formatNumber,
  safeParseFloat,
  UnitDefinition,
} from '../../utils/units';
import { useToast } from './Toast';

export interface QuickUnitConverterProps {
  settings?: AppSettings;
  defaultCategory?: string;
  allowedCategories?: string[];
  className?: string;
  initiallyExpanded?: boolean;
}

interface ConversionPreset {
  label: string;
  from: string;
  to: string;
  val: number;
}

export const QuickUnitConverter: React.FC<QuickUnitConverterProps> = ({
  settings,
  defaultCategory = 'length',
  allowedCategories = ['length', 'volume', 'area', 'mass', 'pressure', 'force'],
  className = '',
  initiallyExpanded = true,
}) => {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [fromValue, setFromValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync default category if prop changes
  useEffect(() => {
    if (defaultCategory && allowedCategories.includes(defaultCategory)) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  const regionalProfile: RegionalProfile | undefined = settings?.regionalProfile;
  const cementBagKg: number | undefined = settings?.defaultCementBagKg;

  // Available units for the selected category
  const units = useMemo(() => {
    return getUnitsForCategory(category, { regionalProfile, cementBagKg });
  }, [category, regionalProfile, cementBagKg]);

  // Adjust selected units when category changes
  useEffect(() => {
    if (units.length >= 2) {
      if (category === 'length') {
        setFromUnit(settings?.unitPreferences?.length || 'm');
        setToUnit(settings?.unitPreferences?.length === 'ft' ? 'm' : 'ft');
      } else if (category === 'volume') {
        setFromUnit(settings?.unitPreferences?.volume || 'm3');
        setToUnit(settings?.unitPreferences?.volume === 'cft' ? 'm3' : 'cft');
      } else if (category === 'area') {
        setFromUnit('m2');
        setToUnit('ft2');
      } else if (category === 'mass') {
        setFromUnit('kg');
        setToUnit('tonne');
      } else if (category === 'pressure') {
        setFromUnit('mpa');
        setToUnit('psi');
      } else if (category === 'force') {
        setFromUnit('kN');
        setToUnit('lbf');
      } else {
        setFromUnit(units[0]?.id || '');
        setToUnit(units[1]?.id || units[0]?.id || '');
      }
    } else if (units.length === 1) {
      setFromUnit(units[0]?.id || '');
      setToUnit(units[0]?.id || '');
    }
  }, [category, units, settings]);

  // Perform live conversion
  const conversionResult = useMemo(() => {
    const numericVal = safeParseFloat(fromValue, 0);
    const conv = convertUnit(category, fromUnit, toUnit, numericVal, {
      regionalProfile,
      cementBagKg,
    });
    return {
      numericVal,
      resultVal: conv.result,
      formula: conv.formula,
      formattedResult: formatNumber(conv.result, 4),
    };
  }, [category, fromUnit, toUnit, fromValue, regionalProfile, cementBagKg]);

  // Quick swap
  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  // Copy result
  const handleCopyResult = () => {
    const fromDef = units.find(u => u.id === fromUnit);
    const toDef = units.find(u => u.id === toUnit);
    const textToCopy = `${fromValue} ${fromDef?.symbol || fromUnit} = ${conversionResult.formattedResult} ${toDef?.symbol || toUnit}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success(`Copied: ${conversionResult.formattedResult} ${toDef?.symbol || toUnit}`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Presets tailored to civil engineering
  const presetsForCategory: ConversionPreset[] = useMemo(() => {
    switch (category) {
      case 'length':
        return [
          { label: 'm → ft', from: 'm', to: 'ft', val: 1 },
          { label: 'ft → m', from: 'ft', to: 'm', val: 1 },
          { label: 'in → mm', from: 'in', to: 'mm', val: 1 },
          { label: 'mm → in', from: 'mm', to: 'in', val: 100 },
        ];
      case 'volume':
        return [
          { label: 'm³ → CFT', from: 'm3', to: 'cft', val: 1 },
          { label: 'CFT → m³', from: 'cft', to: 'm3', val: 100 },
          { label: 'm³ → Liters', from: 'm3', to: 'liter', val: 1 },
          { label: 'gal → Liters', from: 'gal', to: 'liter', val: 1 },
        ];
      case 'area':
        return [
          { label: 'm² → sq.ft', from: 'm2', to: 'ft2', val: 1 },
          { label: 'sq.ft → Decimal', from: 'ft2', to: 'decimal', val: 435.6 },
          { label: 'Katha → sq.ft', from: 'katha', to: 'ft2', val: 1 },
          { label: 'Decimal → Katha', from: 'decimal', to: 'katha', val: 1.65 },
        ];
      case 'mass':
        return [
          { label: 'kg → lb', from: 'kg', to: 'lb', val: 1 },
          { label: 'Tonne → kg', from: 'tonne', to: 'kg', val: 1 },
          { label: 'Bag → kg', from: 'bag', to: 'kg', val: 1 },
          { label: 'lb → kg', from: 'lb', to: 'kg', val: 100 },
        ];
      case 'pressure':
        return [
          { label: 'MPa → psi', from: 'mpa', to: 'psi', val: 1 },
          { label: 'psi → MPa', from: 'psi', to: 'mpa', val: 3000 },
          { label: 'MPa → bar', from: 'mpa', to: 'bar', val: 1 },
          { label: 'kPa → psi', from: 'kpa', to: 'psi', val: 100 },
        ];
      case 'force':
        return [
          { label: 'kN → lbf', from: 'kN', to: 'lbf', val: 1 },
          { label: 'kN → kip', from: 'kN', to: 'kip', val: 10 },
          { label: 'kip → kN', from: 'kip', to: 'kN', val: 1 },
        ];
      default:
        return [];
    }
  }, [category]);

  const applyPreset = (preset: ConversionPreset) => {
    setFromUnit(preset.from);
    setToUnit(preset.to);
    setFromValue(preset.val.toString());
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'length': return 'Length';
      case 'volume': return 'Volume';
      case 'area': return 'Area';
      case 'mass': return 'Mass';
      case 'pressure': return 'Stress / MPa';
      case 'force': return 'Force / Load';
      default: return cat;
    }
  };

  const fromDef = units.find(u => u.id === fromUnit);
  const toDef = units.find(u => u.id === toUnit);

  return (
    <div
      className={`rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#111827] to-[#0B0F19] shadow-xl overflow-hidden no-print ${className}`}
    >
      {/* Header with expand/collapse trigger */}
      <div className="px-4 py-3 bg-[#151C2B] border-b border-white/5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left group flex-1"
          aria-expanded={isExpanded}
        >
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors tracking-wide font-sans">
                Quick Unit Converter
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                In-Place
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Convert dimensions instantly without leaving this tool
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors shrink-0 ml-2"
          aria-label={isExpanded ? 'Collapse Quick Converter' : 'Expand Quick Converter'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3.5 text-xs animate-in fade-in duration-150">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {allowedCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Converter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {/* Value & From Unit: col-span-5 */}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[10px] uppercase font-mono text-slate-400 block">From</label>
              <div className="flex rounded-xl border border-white/10 bg-[#0F172A] focus-within:border-cyan-500/50 overflow-hidden">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromValue}
                  onChange={e => setFromValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                />
                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                  className="bg-[#151C2B] text-cyan-300 font-mono text-xs px-2 py-1.5 border-l border-white/10 focus:outline-none cursor-pointer"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} ({u.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button: col-span-2 */}
            <div className="sm:col-span-2 flex items-center justify-center pt-3 sm:pt-4">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap units"
                className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-all active:rotate-180"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* To Unit Selector: col-span-5 */}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[10px] uppercase font-mono text-slate-400 block">To</label>
              <select
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} ({u.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Output Banner */}
          <div className="p-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-[#0F172A] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-cyan-400 block leading-none mb-1">
                Converted Equivalent
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-bold font-mono text-cyan-300 tracking-tight">
                  {conversionResult.formattedResult}
                </span>
                <span className="text-xs font-bold font-mono text-cyan-400">
                  {toDef?.symbol || toUnit}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                {fromValue || '0'} {fromDef?.symbol || fromUnit} = {conversionResult.formattedResult} {toDef?.symbol || toUnit}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyResult}
              title="Copy converted value to clipboard"
              className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Site Reference Presets */}
          {presetsForCategory.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Site Presets ({getCategoryLabel(category)})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetsForCategory.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-0.5 rounded-md border border-white/10 bg-[#0F172A] hover:border-cyan-500/40 hover:bg-[#151C2B] text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
