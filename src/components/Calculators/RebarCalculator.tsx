import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import { calculateRebarWeight, calculateBBS } from '../../utils/calculations';
import { REBAR_DIAMETERS, REBAR_STANDARD_DATA } from '../../constants/engineering';
import { AppSettings, CalculationResult } from '../../types';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';
import { toBase, fromBase, formatNumber, parseRebarCallout } from '../../utils/units';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

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

  // Rebar Weight State
  const [diameterMm, setDiameterMm] = useState<number>(16);
  const [lengthVal, setLengthVal] = useState<string>('12');
  const [lengthUnit, setLengthUnit] = useState<string>(defaultLengthUnit);
  const [quantity, setQuantity] = useState<string>('10');
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

  // Weight Calculation
  const weightResult = useMemo(() => {
    const res = calculateRebarWeight(
      diameterMm,
      lengthMeters,
      parseInt(quantity, 10) || 1,
      effectiveRatePerKg,
      formulaType
    );
    res.primaryCategory = 'mass';
    res.inputsSummary.push({
      label: 'Input Length',
      value: `${lengthVal} ${lengthUnit} (${formatNumber(lengthMeters, 3)} m)`,
    });
    return res;
  }, [diameterMm, lengthMeters, lengthVal, lengthUnit, quantity, effectiveRatePerKg, formulaType]);

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

    const res = calculateRebarWeight(
      dia,
      barLenM,
      numBars,
      effectiveRatePerKg,
      'd2_162'
    );

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
  }, [calloutText, spanLengthVal, spanLengthUnit, calloutBarLengthVal, calloutBarLengthUnit, effectiveRatePerKg]);

  const currentResult = useMemo(() => {
    switch (activeTab) {
      case 'weight': return weightResult;
      case 'bbs': return bbsResult;
      case 'callout': return calloutResult;
    }
  }, [activeTab, weightResult, bbsResult, calloutResult]);

  const handleReset = () => {
    if (activeTab === 'weight') {
      setDiameterMm(16);
      setLengthVal('12');
      setLengthUnit('m');
      setQuantity('10');
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
      <div className="flex border-b border-white/10 gap-4 overflow-x-auto pb-1 no-print">
        <button
          onClick={() => setActiveTab('weight')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'weight'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rebar Weight & Payload
        </button>
        <button
          onClick={() => setActiveTab('callout')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'callout'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Callout Notation (@ c/c)</span>
        </button>
        <button
          onClick={() => setActiveTab('bbs')}
          className={`text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'bbs'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Bar Bending Schedule (BBS) Helper
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-6 rounded-xl border border-white/10 bg-[#111827] p-6 space-y-5 no-print">
          {activeTab === 'weight' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Nominal Bar Diameter
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
                  {REBAR_DIAMETERS.map(dia => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => setDiameterMm(dia)}
                      className={`py-2 px-1 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                        diameterMm === dia
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-white/5 bg-[#151C2B] text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      Ø{dia} mm
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-[#0B0F19] p-2.5 rounded-lg border border-white/5">
                  <span>Selected: Ø{diameterMm} mm</span>
                  <span>
                    Unit Weight: {REBAR_STANDARD_DATA[diameterMm]?.unitWeight || ((diameterMm * diameterMm) / 162.2).toFixed(3)} kg/m
                    ({formatNumber((REBAR_STANDARD_DATA[diameterMm]?.unitWeight || ((diameterMm * diameterMm) / 162.2)) * 0.671969, 3)} lb/ft)
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
                  <label className="text-xs font-semibold text-slate-300 block">Number of Bars (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Steel Procurement Rate ({settings.currencySymbol})
                  </label>
                  <div className="flex rounded-xl border border-white/10 bg-[#0F172A] focus-within:border-cyan-500/50">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={rateVal}
                      onChange={e => setRateVal(e.target.value)}
                      className="w-full bg-transparent px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none"
                    />
                    <select
                      value={rateUnit}
                      onChange={e => setRateUnit(e.target.value)}
                      className="bg-transparent px-2.5 py-2 text-xs font-semibold text-cyan-300 border-l border-white/10 focus:outline-none"
                    >
                      <option value="kg" className="bg-[#111827]">/ kg</option>
                      <option value="tonne" className="bg-[#111827]">/ tonne</option>
                      <option value="lb" className="bg-[#111827]">/ lb</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Weight Formula</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormulaType('d2_162')}
                      className={`p-2 rounded-lg border text-xs font-mono transition-colors text-center ${
                        formulaType === 'd2_162'
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                          : 'border-white/10 bg-[#151C2B] text-slate-400'
                      }`}
                    >
                      D² / 162.2
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormulaType('exact_density')}
                      className={`p-2 rounded-lg border text-xs font-mono transition-colors text-center ${
                        formulaType === 'exact_density'
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                          : 'border-white/10 bg-[#151C2B] text-slate-400'
                      }`}
                    >
                      Area × 7850
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'callout' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs text-slate-300 leading-relaxed">
                Enter site rebar notation like <code className="text-cyan-300 font-mono font-bold">12 mm @ 150 mm c/c</code> or <code className="text-cyan-300 font-mono font-bold">16 mm @ 6 in c/c</code>. The engine automatically parses diameter and spacing.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Rebar Callout Notation</label>
                <input
                  type="text"
                  value={calloutText}
                  onChange={e => setCalloutText(e.target.value)}
                  placeholder="e.g. 12 mm @ 150 mm c/c"
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
                />
                <div className="flex items-center gap-1.5 pt-1">
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
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-cyan-300 border border-white/5 transition-colors font-mono"
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
                <label className="text-xs font-semibold text-slate-300 block mb-2">Rebar Bar Shape</label>
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
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                          : 'border-white/10 bg-[#151C2B] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Bar Diameter</label>
                  <select
                    value={bbsDia}
                    onChange={e => setBbsDia(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    {REBAR_DIAMETERS.map(d => (
                      <option key={d} value={d}>
                        Ø{d} mm ({formatNumber((d * d) / 162.2, 3)} kg/m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Total Number of Bars</label>
                  <input
                    type="number"
                    min="1"
                    value={bbsQty}
                    onChange={e => setBbsQty(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
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
