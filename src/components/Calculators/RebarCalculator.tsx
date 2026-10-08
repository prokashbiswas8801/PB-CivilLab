import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import { calculateBBS } from '../../utils/calculations';
import { computeRebarCalculation } from '../../utils/engineeringEngine';
import { REBAR_DIAMETERS, REBAR_STANDARD_DATA } from '../../constants/engineering';
import { AppSettings, CalculationResult } from '../../types';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';
import { toBase, fromBase, formatNumber, parseRebarCallout } from '../../utils/units';
import { Sparkles, Check, ArrowRight, Calculator } from 'lucide-react';

interface RebarCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const RebarCalculator: React.FC<RebarCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const [activeTab, setActiveTab] = useState<'weight' | 'bbs' | 'callout'>(() => {
    return activeView === 'bbs-helper' ? 'bbs' : 'weight';
  });

  React.useEffect(() => {
    if (activeView) {
      if (activeView === 'bbs-helper') setActiveTab('bbs');
      else if (activeView === 'rebar-weight') setActiveTab('weight');
    }
  }, [activeView]);

  const defaultLengthUnit = settings.unitPreferences?.length || 'm';

  // Rebar Weight State (Default: 25mm, 12m, 25 bars, 95 BDT/kg)
  const [diameterMm, setDiameterMm] = useState<number>(25);
  const [customDiameterInput, setCustomDiameterInput] = useState<string>('25');
  const [lengthVal, setLengthVal] = useState<string>('12');
  const [lengthUnit, setLengthUnit] = useState<string>(defaultLengthUnit);
  const [quantity, setQuantity] = useState<string>('25');
  const [rateVal, setRateVal] = useState<string>('95');
  const [rateUnit, setRateUnit] = useState<string>('kg'); // per kg, per tonne, per lb
  const [formulaType, setFormulaType] = useState<'d2_162' | 'exact_density'>('d2_162');

  // BBS State
  const [bbsDia, setBbsDia] = useState<number>(10);
  const [shapeType, setShapeType] = useState<'straight' | 'l_bar' | 'u_bar' | 'rect_stirrup' | 'column_tie'>('rect_stirrup');
  const [dimAVal, setDimAVal] = useState<string>('300');
  const [dimAUnit, setDimAUnit] = useState<string>('mm');
  const [dimBVal, setDimBVal] = useState<string>('450');
  const [dimBUnit, setDimBUnit] = useState<string>('mm');
  const [dimCVal, setDimCVal] = useState<string>('200');
  const [dimCUnit, setDimCUnit] = useState<string>('mm');
  const [bbsQty, setBbsQty] = useState<string>('50');

  // Rebar Callout Parser State (e.g. "12 mm @ 150 mm c/c")
  const [calloutText, setCalloutText] = useState('12 mm @ 150 mm c/c');
  const [spanLengthVal, setSpanLengthVal] = useState('6');
  const [spanLengthUnit, setSpanLengthUnit] = useState('m');
  const [calloutBarLengthVal, setCalloutBarLengthVal] = useState('4');
  const [calloutBarLengthUnit, setCalloutBarLengthUnit] = useState('m');

  // Convert length to base meters for calculation
  const lengthMeters = useMemo(() => {
    return toBase(parseFloat(lengthVal) || 0, lengthUnit, 'length', {
      regionalProfile: settings.regionalProfile,
    });
  }, [lengthVal, lengthUnit, settings.regionalProfile]);

  // Convert rate to rate per kg
  const effectiveRatePerKg = useMemo(() => {
    const rawRate = parseFloat(rateVal) || 0;
    if (rateUnit === 'tonne') return rawRate / 1000;
    if (rateUnit === 'lb') return rawRate / 0.45359237;
    return rawRate;
  }, [rateVal, rateUnit]);

  // Handle Diameter Changes (syncing custom input and pill)
  const handleDiameterSelect = (dia: number) => {
    setDiameterMm(dia);
    setCustomDiameterInput(dia.toString());
  };

  const handleCustomDiameterChange = (val: string) => {
    setCustomDiameterInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setDiameterMm(parsed);
    }
  };

  // Authoritative Weight Calculation (Single Source of Truth)
  const weightResult = useMemo(() => {
    const qty = parseInt(quantity, 10) || 1;
    const res = computeRebarCalculation({
      diameterMm,
      lengthPerBarM: lengthMeters,
      quantity: qty,
      ratePerKg: effectiveRatePerKg,
      formulaType,
      currencySymbol: settings.currencySymbol || '৳',
    });

    // Clean inputs summary without redundant duplicate field
    if (lengthUnit !== 'm') {
      res.inputsSummary = res.inputsSummary.map(i => {
        if (i.label === 'Length per Bar') {
          return {
            ...i,
            value: `${lengthVal} ${lengthUnit} (${formatNumber(lengthMeters, 2)} m)`,
          };
        }
        return i;
      });
    }

    return res;
  }, [diameterMm, lengthMeters, lengthVal, lengthUnit, quantity, effectiveRatePerKg, formulaType, settings.currencySymbol]);

  // BBS Dimensions normalized to mm
  const normalizedBbsDims = useMemo(() => {
    const aMm = toBase(parseFloat(dimAVal) || 0, dimAUnit, 'length') * 1000;
    const bMm = toBase(parseFloat(dimBVal) || 0, dimBUnit, 'length') * 1000;
    const cMm = toBase(parseFloat(dimCVal) || 0, dimCUnit, 'length') * 1000;
    return { a: aMm, b: bMm, c: cMm };
  }, [dimAVal, dimAUnit, dimBVal, dimBUnit, dimCVal, dimCUnit]);

  // BBS Calculation
  const bbsResult = useMemo(() => {
    const res = calculateBBS(
      bbsDia,
      shapeType,
      normalizedBbsDims,
      parseInt(bbsQty, 10) || 1,
      effectiveRatePerKg
    );
    res.primaryCategory = 'length';
    return res;
  }, [bbsDia, shapeType, normalizedBbsDims, bbsQty, effectiveRatePerKg]);

  // Callout Parsing and Result
  const calloutResult = useMemo(() => {
    const parsed = parseRebarCallout(calloutText);
    const spanM = toBase(parseFloat(spanLengthVal) || 0, spanLengthUnit, 'length');
    const barLenM = toBase(parseFloat(calloutBarLengthVal) || 0, calloutBarLengthUnit, 'length');

    const spacingM = (parsed.spacingMm || 150) / 1000;
    const numBars = spacingM > 0 ? Math.floor(spanM / spacingM) + 1 : 1;
    const dia = parsed.diameterMm || 12;

    const res = computeRebarCalculation({
      diameterMm: dia,
      lengthPerBarM: barLenM,
      quantity: numBars,
      ratePerKg: effectiveRatePerKg,
      formulaType: 'd2_162',
      currencySymbol: settings.currencySymbol || '৳',
    });

    res.title = `Rebar Callout: ${parsed.isValid ? parsed.normalizedText : calloutText}`;
    res.primaryCategory = 'mass';
    res.inputsSummary = [
      { label: 'Parsed Callout', value: parsed.normalizedText },
      { label: 'Span Length', value: `${spanLengthVal} ${spanLengthUnit} (${formatNumber(spanM, 3)} m)` },
      { label: 'Bar Spacing', value: `${parsed.spacingMm} mm` },
      { label: 'Calculated Bars', value: `${numBars} pcs (Span / Spacing + 1)` },
      { label: 'Length per Bar', value: `${calloutBarLengthVal} ${calloutBarLengthUnit} (${formatNumber(barLenM, 3)} m)` },
    ];
    return res;
  }, [calloutText, spanLengthVal, spanLengthUnit, calloutBarLengthVal, calloutBarLengthUnit, effectiveRatePerKg, settings.currencySymbol]);

  const currentResult = useMemo(() => {
    switch (activeTab) {
      case 'weight': return weightResult;
      case 'bbs': return bbsResult;
      case 'callout': return calloutResult;
    }
  }, [activeTab, weightResult, bbsResult, calloutResult]);

  const handleReset = () => {
    if (activeTab === 'weight') {
      setDiameterMm(25);
      setCustomDiameterInput('25');
      setLengthVal('12');
      setLengthUnit('m');
      setQuantity('25');
      setRateVal('95');
    } else if (activeTab === 'bbs') {
      setBbsDia(10);
      setShapeType('rect_stirrup');
      setDimAVal('300');
      setDimAUnit('mm');
      setDimBVal('450');
      setDimBUnit('mm');
      setBbsQty('50');
    } else {
      setCalloutText('12 mm @ 150 mm c/c');
      setSpanLengthVal('6');
      setCalloutBarLengthVal('4');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Bar */}
      <div className="flex border-b border-slate-200 dark:border-white/10 gap-4 overflow-x-auto pb-1 no-print">
        <button
          onClick={() => setActiveTab('weight')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'weight'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Rebar Weight & Payload
        </button>
        <button
          onClick={() => setActiveTab('callout')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'callout'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Callout Notation (@ c/c)</span>
        </button>
        <button
          onClick={() => setActiveTab('bbs')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'bbs'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Bar Bending Schedule (BBS) Helper
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 space-y-5 shadow-sm dark:shadow-xl no-print">
          {activeTab === 'weight' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Bar Diameter
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Custom Ø:</span>
                    <div className="flex rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] px-2 py-0.5 w-24">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        max="100"
                        value={customDiameterInput}
                        onChange={e => handleCustomDiameterChange(e.target.value)}
                        className="w-full bg-transparent text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono self-center">mm</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
                  {REBAR_DIAMETERS.map(dia => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => handleDiameterSelect(dia)}
                      className={`py-2 px-1 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                        diameterMm === dia
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/5 dark:bg-[#151C2B] dark:text-slate-300 dark:hover:bg-white/5'
                      }`}
                    >
                      Ø{dia} mm
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-[#0B0F19] p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
                  <span className="font-semibold text-slate-800 dark:text-slate-300">Selected: Ø{formatNumber(diameterMm, 2)} mm</span>
                  <span className="flex items-center gap-1.5">
                    <span>Unit Weight:</span>
                    <strong className="text-cyan-700 dark:text-cyan-300 font-bold">
                      {weightResult.secondaryValues?.find(s => s.label === 'Unit Weight')?.value || formatNumber(formulaType === 'd2_162' ? (diameterMm * diameterMm) / 162.2 : (Math.PI * Math.pow(diameterMm / 1000, 2) / 4) * 7850, 3)} kg/m
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      ({formulaType === 'd2_162' ? 'D²/162.2' : 'Area×7850'})
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UnitInput
                  label="Length per Bar"
                  value={lengthVal}
                  unit={lengthUnit}
                  category="length"
                  onChangeValue={setLengthVal}
                  onChangeUnit={setLengthUnit}
                  regionalProfile={settings.regionalProfile}
                  helperText="Standard commercial: 12 m (~40 ft)"
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Number of Bars (Qty)</label>
                  <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] px-3.5 py-2.5 focus-within:border-cyan-500/50">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-transparent text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono self-center">pcs</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Rate per kg ({settings.currencySymbol || 'BDT'})
                  </label>
                  <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] focus-within:border-cyan-500/50">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={rateVal}
                      onChange={e => setRateVal(e.target.value)}
                      className="w-full bg-transparent px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <select
                      value={rateUnit}
                      onChange={e => setRateUnit(e.target.value)}
                      className="bg-transparent px-2.5 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border-l border-slate-200 dark:border-white/10 focus:outline-none"
                    >
                      <option value="kg" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100">/ kg</option>
                      <option value="tonne" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100">/ tonne</option>
                      <option value="lb" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100">/ lb</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Weight Formula</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormulaType('d2_162')}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                        formulaType === 'd2_162'
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-900 dark:border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-500/40'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-[#151C2B] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold">D² / 162.2</span>
                      <span className="text-[10px] font-sans font-normal opacity-80">Site Nominal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormulaType('exact_density')}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                        formulaType === 'exact_density'
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-900 dark:border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-500/40'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-[#151C2B] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold">Area × 7850</span>
                      <span className="text-[10px] font-sans font-normal opacity-80">Exact Density</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED SUMMARY TABLE (Section 4 Specification) */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono font-bold text-cyan-700 dark:text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calculated Summary</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Full Precision ({formulaType === 'd2_162' ? 'D²/162.2' : 'Exact ρ'})</span>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A] p-3 text-xs font-mono divide-y divide-slate-200 dark:divide-white/5 shadow-sm">
                  <div className="pb-1.5 flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Total Length</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{weightResult.secondaryValues?.find(s => s.label === 'Total Length')?.value} m</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Unit Weight</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{weightResult.secondaryValues?.find(s => s.label === 'Unit Weight')?.value} kg/m</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Total Weight</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm">{weightResult.primaryValue} kg</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Total Tonnes</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{weightResult.secondaryValues?.find(s => s.label === 'Total Tonnes')?.value} t</span>
                  </div>
                  {weightResult.secondaryValues?.some(s => s.label === 'Estimated Cost') && (
                    <div className="pt-1.5 flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Estimated Cost</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {weightResult.secondaryValues?.find(s => s.label === 'Estimated Cost')?.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'callout' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Enter site rebar notation like <code className="text-cyan-700 dark:text-cyan-300 font-mono font-bold">12 mm @ 150 mm c/c</code> or <code className="text-cyan-700 dark:text-cyan-300 font-mono font-bold">16 mm @ 6 in c/c</code>. The engine automatically parses diameter and spacing.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Rebar Callout Notation</label>
                <input
                  type="text"
                  value={calloutText}
                  onChange={e => setCalloutText(e.target.value)}
                  placeholder="e.g. 12 mm @ 150 mm c/c"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-cyan-700 dark:text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
                />
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {[
                    '10 mm @ 125 mm c/c',
                    '12 mm @ 150 mm c/c',
                    '16 mm @ 200 mm c/c',
                    '12 mm @ 6 in c/c',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalloutText(preset)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-white/5 transition-colors font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UnitInput
                  label="Slab / Beam Clear Span"
                  value={spanLengthVal}
                  unit={spanLengthUnit}
                  category="length"
                  onChangeValue={setSpanLengthVal}
                  onChangeUnit={setSpanLengthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Bar Cut Length"
                  value={calloutBarLengthVal}
                  unit={calloutBarLengthUnit}
                  category="length"
                  onChangeValue={setCalloutBarLengthVal}
                  onChangeUnit={setCalloutBarLengthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            </div>
          )}

          {activeTab === 'bbs' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Rebar Bar Shape</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'straight', label: 'Straight Bar' },
                    { id: 'l_bar', label: 'L-Bend (Footing/Beam)' },
                    { id: 'rect_stirrup', label: 'Rect. Stirrup' },
                    { id: 'u_bar', label: 'U-Bar / Hairpin' },
                    { id: 'column_tie', label: 'Column Lateral Tie' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShapeType(s.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-colors text-center ${
                        shapeType === s.id
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-cyan-400 dark:bg-cyan-500/15 dark:text-cyan-300 font-bold shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-[#151C2B] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Bar Diameter</label>
                  <select
                    value={bbsDia}
                    onChange={e => setBbsDia(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    {REBAR_DIAMETERS.map(d => (
                      <option key={d} value={d} className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100">
                        Ø{d} mm ({formatNumber((d * d) / 162.2, 3)} kg/m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Total Number of Bars</label>
                  <input
                    type="number"
                    min="1"
                    value={bbsQty}
                    onChange={e => setBbsQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UnitInput
                  label="Dimension A (Length / Beam Depth)"
                  value={dimAVal}
                  unit={dimAUnit}
                  category="length"
                  onChangeValue={setDimAVal}
                  onChangeUnit={setDimAUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                {(shapeType === 'rect_stirrup' || shapeType === 'l_bar' || shapeType === 'column_tie') && (
                  <UnitInput
                    label="Dimension B (Width / Bend Leg)"
                    value={dimBVal}
                    unit={dimBUnit}
                    category="length"
                    onChangeValue={setDimBVal}
                    onChangeUnit={setDimBUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                )}
                {shapeType === 'u_bar' && (
                  <UnitInput
                    label="Dimension C (Hook / Turn)"
                    value={dimCVal}
                    unit={dimCUnit}
                    category="length"
                    onChangeValue={setDimCVal}
                    onChangeUnit={setDimCUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MULTI-UNIT RESULT PANEL */}
        <div className="lg:col-span-6 space-y-4">
          <ResultPanel
            result={currentResult}
            settings={settings}
            onReset={handleReset}
            onSaveHistory={() => onSaveHistory(currentResult)}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />

          {/* Quick-Access In-Place Unit Conversion Utility */}
          <QuickUnitConverter
            settings={settings}
            defaultCategory="length"
            allowedCategories={['length', 'mass', 'force', 'pressure']}
          />
        </div>
      </div>
    </div>
  );
};

