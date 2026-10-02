import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Copy,
  Check,
  RotateCcw,
  Info,
  Sliders,
  Search,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BUILTIN_UNIT_CATEGORIES,
  convertUnit,
  formatNumber,
  getUnitsForCategory,
  toBase,
  fromBase,
  parseFeetInches,
  UnitDefinition,
} from '../utils/units';
import { AppSettings } from '../types';
import { CustomUnitModal } from './Common/CustomUnitModal';

interface UnitConverterModuleProps {
  settings: AppSettings;
}

export const UnitConverterModule: React.FC<UnitConverterModuleProps> = ({ settings }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('length');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [inputValue, setInputValue] = useState<string>('1');
  const [copied, setCopied] = useState<boolean>(false);
  const [precision, setPrecision] = useState<number>(settings.decimalPrecision ?? 2);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const categoryData = useMemo(() => {
    return BUILTIN_UNIT_CATEGORIES[selectedCategory] || BUILTIN_UNIT_CATEGORIES.length;
  }, [selectedCategory]);

  const unitsList = useMemo(() => {
    return getUnitsForCategory(selectedCategory, {
      regionalProfile: settings.regionalProfile,
      cementBagKg: settings.defaultCementBagKg,
      customUnits: settings.customUnits,
    });
  }, [selectedCategory, settings]);

  // When category changes, set sensible defaults
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const catUnits = getUnitsForCategory(catId, {
      regionalProfile: settings.regionalProfile,
      cementBagKg: settings.defaultCementBagKg,
      customUnits: settings.customUnits,
    });
    if (catUnits.length > 0) {
      setFromUnit(catUnits[0].id);
      setToUnit(catUnits[1]?.id || catUnits[0].id);
    }
  };

  // Mixed feet-inch parse support
  const numericInput = useMemo(() => {
    if (selectedCategory === 'length' && (inputValue.includes("'") || inputValue.includes('"') || /ft\b/i.test(inputValue))) {
      const parsed = parseFeetInches(inputValue);
      if (parsed.isValid) {
        // Convert parsed meters to fromUnit
        return fromBase(parsed.meters, fromUnit, 'length', { regionalProfile: settings.regionalProfile });
      }
    }
    const val = parseFloat(inputValue);
    return isNaN(val) ? 0 : val;
  }, [inputValue, selectedCategory, fromUnit, settings.regionalProfile]);

  const { result, formula } = useMemo(() => {
    return convertUnit(
      selectedCategory,
      fromUnit,
      toUnit,
      numericInput,
      {
        regionalProfile: settings.regionalProfile,
        cementBagKg: settings.defaultCementBagKg,
        customUnits: settings.customUnits,
      }
    );
  }, [selectedCategory, fromUnit, toUnit, numericInput, settings]);

  const fromDef = useMemo(() => {
    return unitsList.find(u => u.id === fromUnit) || unitsList[0];
  }, [unitsList, fromUnit]);

  const toDef = useMemo(() => {
    return unitsList.find(u => u.id === toUnit) || unitsList[1] || unitsList[0];
  }, [unitsList, toUnit]);

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    // Convert value on swap so physical quantity is preserved
    setInputValue(formatNumber(result, 4).replace(/,/g, ''));
  };

  const handleCopy = () => {
    const text = `${inputValue} ${fromDef?.symbol || ''} = ${formatNumber(result, precision)} ${toDef?.symbol || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute live equivalents across all other units in this category
  const allEquivalents = useMemo(() => {
    if (numericInput === 0 && inputValue !== '0') return [];
    const baseVal = toBase(numericInput, fromUnit, selectedCategory, {
      regionalProfile: settings.regionalProfile,
      cementBagKg: settings.defaultCementBagKg,
      customUnits: settings.customUnits,
    });

    return unitsList.map(u => {
      const val = fromBase(baseVal, u.id, selectedCategory, {
        regionalProfile: settings.regionalProfile,
        cementBagKg: settings.defaultCementBagKg,
        customUnits: settings.customUnits,
      });
      return {
        unit: u,
        converted: formatNumber(val, precision),
        isSource: u.id === fromUnit,
        isTarget: u.id === toUnit,
      };
    });
  }, [numericInput, fromUnit, selectedCategory, unitsList, precision, settings, toUnit, inputValue]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111827] to-[#0B0F19] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/20">
              CENTRALIZED MULTI-UNIT ENGINE
            </span>
            <span className="text-xs text-slate-400">16+ Physical Dimensions</span>
          </div>
          <h2 className="text-2xl font-wood font-normal text-white tracking-wide">
            Universal Engineering Unit Converter
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Convert between SI Metric, Imperial/US Customary, and Bangladesh Land & Construction Units with full mathematical precision.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Unit Manager</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {Object.values(BUILTIN_UNIT_CATEGORIES).map(cat => {
          const isSelected = cat.id === selectedCategory;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'border border-white/10 bg-[#111827] text-slate-300 hover:bg-[#151C2B] hover:text-white'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-white/5 text-cyan-400'}`}>
                {cat.baseSymbol}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Conversion Interactive Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Converter Panel */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#111827] shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>{categoryData.name}</span>
            </h3>
            {/* Precision Selector */}
            <div className="flex items-center gap-1 text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
              <span>Precision:</span>
              {[0, 1, 2, 3, 4].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrecision(p)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                    precision === p ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
            {/* Input Value & Unit */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">From Value</label>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="1.0"
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-base font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
              <select
                value={fromUnit}
                onChange={e => setFromUnit(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#151C2B] px-3 py-2 text-xs font-medium text-cyan-300 focus:outline-none focus:border-cyan-500/50"
              >
                {unitsList.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="sm:col-span-1 flex justify-center py-2">
              <button
                type="button"
                onClick={handleSwap}
                title="⇄ Swap from & to units with automatic value conversion"
                className="w-10 h-10 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 flex items-center justify-center transition-all duration-150 shadow-sm hover:scale-105 active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Converted Output Display */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Converted Output</label>
              <div className="rounded-xl border border-cyan-500/30 bg-[#0F172A] px-3.5 py-2.5 text-base font-mono font-bold text-cyan-400 select-all overflow-x-auto truncate">
                {formatNumber(result, precision)}
              </div>
              <select
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#151C2B] px-3 py-2 text-xs font-medium text-cyan-300 focus:outline-none focus:border-cyan-500/50"
              >
                {unitsList.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} — {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Card & Formula */}
          <div className="p-4 rounded-xl border border-white/5 bg-[#151C2B] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Conversion Equation:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B0F19] text-cyan-300 font-mono text-sm border border-white/5 overflow-x-auto">
              {formula}
            </div>
            {toDef?.civilNote && (
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                <span className="text-cyan-400 font-bold mr-1">Civil Engineering Note:</span>
                {toDef.civilNote}
              </p>
            )}
          </div>
        </div>

        {/* Simultaneous Equivalents Table in this Category */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#111827] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Unit Live Matrix</span>
            </h3>
            <span className="text-[11px] text-slate-500">Auto-calculated</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Same quantity rendered across all standard units in <span className="text-cyan-300 font-semibold">{categoryData.name}</span>:
          </p>

          <div className="border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5 bg-[#0F172A] max-h-[360px] overflow-y-auto">
            {allEquivalents.map(eq => (
              <div
                key={eq.unit.id}
                onClick={() => setToUnit(eq.unit.id)}
                className={`p-2.5 px-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  eq.isTarget
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                    : eq.isSource
                    ? 'bg-white/5 text-slate-300'
                    : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-cyan-400 font-bold mr-2">{eq.unit.symbol}</span>
                  <span className="truncate">{eq.unit.name}</span>
                </div>
                <div className="font-mono font-bold text-slate-100 shrink-0">
                  {eq.converted}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CustomUnitModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </div>
  );
};
