import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import {
  calculateConcreteVolume,
  calculateConcreteMix,
} from '../../utils/calculations';
import { CONCRETE_MIX_PRESETS, DENSITIES } from '../../constants/engineering';
import { AppSettings, CalculationResult } from '../../types';
import { formatNumber, toBase, fromBase } from '../../utils/units';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';

interface ConcreteCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const ConcreteCalculator: React.FC<ConcreteCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const getInitialTab = (): 'volume' | 'mix' | 'wc_ratio' | 'cement_bags' => {
    if (activeView === 'concrete-volume') return 'volume';
    if (activeView === 'wc-ratio') return 'wc_ratio';
    if (activeView === 'cement-bag') return 'cement_bags';
    return 'mix';
  };

  const [activeTab, setActiveTab] = useState<'volume' | 'mix' | 'wc_ratio' | 'cement_bags'>(getInitialTab);

  React.useEffect(() => {
    if (activeView) {
      if (activeView === 'concrete-volume') setActiveTab('volume');
      else if (activeView === 'wc-ratio') setActiveTab('wc_ratio');
      else if (activeView === 'cement-bag') setActiveTab('cement_bags');
      else if (activeView === 'concrete-mix') setActiveTab('mix');
    }
  }, [activeView]);

  // Preferred unit defaults from settings
  const defaultLengthUnit = settings.unitPreferences?.length || 'm';
  const defaultVolumeUnit = settings.unitPreferences?.volume || 'm3';
  const defaultMassUnit = settings.unitPreferences?.mass || 'kg';

  // Concrete Volume State with Unit Selectors
  const [shape, setShape] = useState<'slab' | 'beam' | 'rect_column' | 'circ_column' | 'footing_trapezoid'>('slab');
  const [lengthVal, setLengthVal] = useState<string>('6');
  const [lengthUnit, setLengthUnit] = useState<string>(defaultLengthUnit);

  const [widthVal, setWidthVal] = useState<string>('4');
  const [widthUnit, setWidthUnit] = useState<string>(defaultLengthUnit);

  const [depthVal, setDepthVal] = useState<string>('0.15'); // 150mm slab
  const [depthUnit, setDepthUnit] = useState<string>(defaultLengthUnit === 'ft' ? 'in' : 'm');

  const [heightVal, setHeightVal] = useState<string>('3');
  const [heightUnit, setHeightUnit] = useState<string>(defaultLengthUnit);

  const [diameterVal, setDiameterVal] = useState<string>('300');
  const [diameterUnit, setDiameterUnit] = useState<string>('mm');

  const [volQty, setVolQty] = useState<string>('1');

  // Trapezoidal Footing params
  const [topLengthVal, setTopLengthVal] = useState<string>('0.4');
  const [topLengthUnit, setTopLengthUnit] = useState<string>(defaultLengthUnit);

  const [topWidthVal, setTopWidthVal] = useState<string>('0.4');
  const [topWidthUnit, setTopWidthUnit] = useState<string>(defaultLengthUnit);

  const [bottomHeightVal, setBottomHeightVal] = useState<string>('0.2');
  const [bottomHeightUnit, setBottomHeightUnit] = useState<string>(defaultLengthUnit);

  const [trapHeightVal, setTrapHeightVal] = useState<string>('0.3');
  const [trapHeightUnit, setTrapHeightUnit] = useState<string>(defaultLengthUnit);

  // Concrete Material Mix State with Unit Selectors
  const [mixWetVolVal, setMixWetVolVal] = useState<string>('1');
  const [mixWetVolUnit, setMixWetVolUnit] = useState<string>(defaultVolumeUnit);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0); // 1:1.5:3 default
  const [ratioC, setRatioC] = useState<number>(1);
  const [ratioS, setRatioS] = useState<number>(1.5);
  const [ratioA, setRatioA] = useState<number>(3);
  const [dryFactor, setDryFactor] = useState<string>(settings.defaultDryFactorConcrete.toString() || '1.54');
  const [bagSizeVal, setBagSizeVal] = useState<string>(settings.defaultCementBagKg.toString() || '50');
  const [bagSizeUnit, setBagSizeUnit] = useState<string>('kg');
  const [wastagePct, setWastagePct] = useState<string>(settings.defaultConcreteWastage.toString() || '3');

  // Water-Cement Ratio State
  const [wcCementVal, setWcCementVal] = useState<string>('50'); // 1 bag
  const [wcCementUnit, setWcCementUnit] = useState<string>('kg');
  const [wcTargetRatio, setWcTargetRatio] = useState<string>('0.45');

  // Cement Bag Mass State
  const [cementTargetVolVal, setCementTargetVolVal] = useState<string>('0.035'); // ~1 bag volume
  const [cementTargetVolUnit, setCementTargetVolUnit] = useState<string>('m3');

  // Handlers for Preset
  const handlePresetSelect = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = CONCRETE_MIX_PRESETS[idx];
    if (p) {
      setRatioC(p.c);
      setRatioS(p.s);
      setRatioA(p.a);
    }
  };

  // Convert inputs to Base SI (meters) for Volume
  const normalizedDims = useMemo(() => {
    const lM = toBase(parseFloat(lengthVal) || 0, lengthUnit, 'length', { regionalProfile: settings.regionalProfile });
    const wM = toBase(parseFloat(widthVal) || 0, widthUnit, 'length', { regionalProfile: settings.regionalProfile });
    const dM = toBase(parseFloat(depthVal) || 0, depthUnit, 'length', { regionalProfile: settings.regionalProfile });
    const hM = toBase(parseFloat(heightVal) || 0, heightUnit, 'length', { regionalProfile: settings.regionalProfile });
    const diaMm = toBase(parseFloat(diameterVal) || 0, diameterUnit, 'length') * 1000;

    const topLM = toBase(parseFloat(topLengthVal) || 0, topLengthUnit, 'length');
    const topWM = toBase(parseFloat(topWidthVal) || 0, topWidthUnit, 'length');
    const botHM = toBase(parseFloat(bottomHeightVal) || 0, bottomHeightUnit, 'length');
    const trapHM = toBase(parseFloat(trapHeightVal) || 0, trapHeightUnit, 'length');

    return { lM, wM, dM, hM, diaMm, topLM, topWM, botHM, trapHM };
  }, [
    lengthVal, lengthUnit, widthVal, widthUnit, depthVal, depthUnit,
    heightVal, heightUnit, diameterVal, diameterUnit,
    topLengthVal, topLengthUnit, topWidthVal, topWidthUnit,
    bottomHeightVal, bottomHeightUnit, trapHeightVal, trapHeightUnit,
    settings.regionalProfile,
  ]);

  // Volume Calculation Result
  const volumeResult = useMemo(() => {
    const res = calculateConcreteVolume(shape, {
      lengthM: normalizedDims.lM,
      widthM: normalizedDims.wM,
      depthM: normalizedDims.dM,
      heightM: normalizedDims.hM,
      diameterMm: normalizedDims.diaMm,
      topLengthM: normalizedDims.topLM,
      topWidthM: normalizedDims.topWM,
      bottomHeightM: normalizedDims.botHM,
      trapezoidHeightM: normalizedDims.trapHM,
      quantity: parseInt(volQty, 10) || 1,
    });
    // Attach primary category for ResultPanel dynamic converter
    res.primaryCategory = 'volume';
    return res;
  }, [shape, normalizedDims, volQty]);

  // Concrete Material Mix Result
  const mixResult = useMemo(() => {
    const wetVolM3 = toBase(parseFloat(mixWetVolVal) || 0, mixWetVolUnit, 'volume', {
      regionalProfile: settings.regionalProfile,
    });
    const bagKg = toBase(parseFloat(bagSizeVal) || 50, bagSizeUnit, 'mass');

    const res = calculateConcreteMix(
      wetVolM3,
      ratioC,
      ratioS,
      ratioA,
      parseFloat(dryFactor) || 1.54,
      bagKg,
      parseFloat(wastagePct) || 3
    );
    res.primaryCategory = 'mass';
    return res;
  }, [mixWetVolVal, mixWetVolUnit, ratioC, ratioS, ratioA, dryFactor, bagSizeVal, bagSizeUnit, wastagePct, settings]);

  // Water Cement Ratio Calculation Result
  const wcResult: CalculationResult = useMemo(() => {
    const cKg = toBase(parseFloat(wcCementVal) || 0, wcCementUnit, 'mass', {
      cementBagKg: settings.defaultCementBagKg,
    });
    const ratio = Math.max(0.1, parseFloat(wcTargetRatio) || 0.45);
    const waterLiters = cKg * ratio;
    const waterGallons = waterLiters * 0.264172;

    return {
      title: 'Water-Cement (w/c) Ratio Calculation',
      primaryValue: formatNumber(waterLiters, 1),
      primaryUnit: 'Liters',
      primaryCategory: 'volume',
      primaryRawValue: waterLiters * 0.001, // in m³
      secondaryValues: [
        { label: 'Water in Gallons (US)', value: formatNumber(waterGallons, 2), unit: 'gal' },
        { label: 'Target w/c Ratio', value: formatNumber(ratio, 2) },
        { label: 'Cement Mass', value: `${formatNumber(cKg, 1)} kg (${formatNumber(cKg / (settings.defaultCementBagKg || 50), 2)} bags)` },
      ],
      breakdown: [
        { step: '1. Water Demand Formula', expression: `Cement Mass (${cKg} kg) × w/c Ratio (${ratio})`, result: `${formatNumber(waterLiters, 2)} Liters (kg)` },
        { step: '2. Water per 50 kg Bag', expression: `50 kg × ${ratio}`, result: `${formatNumber(50 * ratio, 1)} Liters / bag` },
      ],
      formula: 'Water (L) = Cement Mass (kg) × (w/c Ratio)',
      substitutedFormula: `Water = ${cKg} × ${ratio} = ${formatNumber(waterLiters, 2)} Liters`,
      inputsSummary: [
        { label: 'Cement Input', value: `${wcCementVal} ${wcCementUnit} (${formatNumber(cKg, 1)} kg)` },
        { label: 'Water-Cement Ratio', value: `${ratio}` },
      ],
      assumptions: [
        { label: 'Water Density', value: '1.0 kg/Liter at standard temperature.' },
        { label: 'Aggregate Moisture', value: 'Assumes saturated surface dry (SSD) aggregate condition. Wet aggregates require deducting free moisture from batch water.' },
      ],
      engineeringNotes: 'Lower water-cement ratios (0.40–0.45) produce high compressive strength and low permeability, but require plasticizers for slump workability (ACI 211.1).',
    };
  }, [wcCementVal, wcCementUnit, wcTargetRatio, settings]);

  // Cement Bag Mass Calculation Result
  const cementBagResult: CalculationResult = useMemo(() => {
    const volM3 = toBase(parseFloat(cementTargetVolVal) || 0, cementTargetVolUnit, 'volume', {
      regionalProfile: settings.regionalProfile,
    });
    const density = DENSITIES.cement;
    const massKg = volM3 * density;
    const bagSize = toBase(parseFloat(bagSizeVal) || 50, bagSizeUnit, 'mass');
    const bags = massKg / (bagSize || 50);
    const volCFT = volM3 * 35.3147;

    return {
      title: 'Cement Bag & Bulk Mass Calculator',
      primaryValue: formatNumber(bags, 2),
      primaryUnit: 'bags',
      primaryCategory: 'mass',
      primaryRawValue: massKg,
      secondaryValues: [
        { label: 'Total Mass', value: formatNumber(massKg, 1), unit: 'kg' },
        { label: 'Metric Tonnes', value: formatNumber(massKg / 1000, 3), unit: 'tonne' },
        { label: 'Volume in CFT', value: formatNumber(volCFT, 2), unit: 'CFT' },
        { label: 'Volume in m³', value: formatNumber(volM3, 3), unit: 'm³' },
      ],
      breakdown: [
        { step: '1. Theoretical Mass', expression: `Volume (${formatNumber(volM3, 4)} m³) × Density (${density} kg/m³)`, result: `${formatNumber(massKg, 2)} kg` },
        { step: '2. Number of Bags', expression: `${formatNumber(massKg, 2)} kg ÷ ${bagSize} kg/bag`, result: `${formatNumber(bags, 2)} bags` },
      ],
      formula: 'Bags = (Volume × Density_cement) ÷ Bag_Mass',
      substitutedFormula: `Bags = (${formatNumber(volM3, 4)} × ${density}) ÷ ${bagSize} = ${formatNumber(bags, 2)} bags`,
      inputsSummary: [
        { label: 'Target Volume', value: `${cementTargetVolVal} ${cementTargetVolUnit} (${formatNumber(volM3, 4)} m³)` },
        { label: 'Bag Mass Setting', value: `${bagSize} kg` },
      ],
      assumptions: [
        { label: 'Loose Cement Density', value: '1440 kg/m³ (90 lb/ft³) standard bulk loose cement.' },
        { label: 'Volume per 50kg Bag', value: '1 bag ≈ 0.0347 m³ ≈ 1.226 CFT loose volume.' },
      ],
      engineeringNotes: 'Cement storage on site should be on raised pallets in watertight sheds. Stack bags no higher than 10-12 bags to prevent lump formation.',
    };
  }, [cementTargetVolVal, cementTargetVolUnit, bagSizeVal, bagSizeUnit, settings]);

  const activeResult = useMemo(() => {
    switch (activeTab) {
      case 'volume': return volumeResult;
      case 'mix': return mixResult;
      case 'wc_ratio': return wcResult;
      case 'cement_bags': return cementBagResult;
    }
  }, [activeTab, volumeResult, mixResult, wcResult, cementBagResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Section */}
      <div className="lg:col-span-6 space-y-6 no-print">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
          {[
            { id: 'mix', label: 'Material Mix (1:1.5:3)' },
            { id: 'volume', label: 'Concrete Volume' },
            { id: 'wc_ratio', label: 'Water-Cement Ratio' },
            { id: 'cement_bags', label: 'Cement Bags & Bulk' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Concrete Volume */}
        {activeTab === 'volume' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Structural Member Shape</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slab', label: 'Slab / Floor' },
                  { id: 'beam', label: 'Rect. Beam' },
                  { id: 'rect_column', label: 'Rect. Column' },
                  { id: 'circ_column', label: 'Round Column' },
                  { id: 'footing_trapezoid', label: 'Trap. Footing' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                      shape === s.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape Inputs with Multi-Unit Support */}
            {(shape === 'slab' || shape === 'beam' || shape === 'rect_column') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UnitInput
                  label="Length / Span"
                  value={lengthVal}
                  unit={lengthUnit}
                  category="length"
                  onChangeValue={setLengthVal}
                  onChangeUnit={setLengthUnit}
                  regionalProfile={settings.regionalProfile}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Width (b)"
                  value={widthVal}
                  unit={widthUnit}
                  category="length"
                  onChangeValue={setWidthVal}
                  onChangeUnit={setWidthUnit}
                  regionalProfile={settings.regionalProfile}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label={shape === 'slab' ? 'Thickness / Depth (D)' : 'Depth / Height (D)'}
                  value={depthVal}
                  unit={depthUnit}
                  category="length"
                  onChangeValue={setDepthVal}
                  onChangeUnit={setDepthUnit}
                  regionalProfile={settings.regionalProfile}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Number of Members</label>
                  <input
                    type="number"
                    min="1"
                    value={volQty}
                    onChange={e => setVolQty(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {shape === 'circ_column' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UnitInput
                  label="Column Diameter"
                  value={diameterVal}
                  unit={diameterUnit}
                  category="length"
                  onChangeValue={setDiameterVal}
                  onChangeUnit={setDiameterUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Column Height"
                  value={heightVal}
                  unit={heightUnit}
                  category="length"
                  onChangeValue={setHeightVal}
                  onChangeUnit={setHeightUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Number of Columns</label>
                  <input
                    type="number"
                    min="1"
                    value={volQty}
                    onChange={e => setVolQty(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {shape === 'footing_trapezoid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <UnitInput
                  label="Bottom Length (L1)"
                  value={lengthVal}
                  unit={lengthUnit}
                  category="length"
                  onChangeValue={setLengthVal}
                  onChangeUnit={setLengthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Bottom Width (B1)"
                  value={widthVal}
                  unit={widthUnit}
                  category="length"
                  onChangeValue={setWidthVal}
                  onChangeUnit={setWidthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Bottom Height (h1)"
                  value={bottomHeightVal}
                  unit={bottomHeightUnit}
                  category="length"
                  onChangeValue={setBottomHeightVal}
                  onChangeUnit={setBottomHeightUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Top Length (L2)"
                  value={topLengthVal}
                  unit={topLengthUnit}
                  category="length"
                  onChangeValue={setTopLengthVal}
                  onChangeUnit={setTopLengthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Top Width (B2)"
                  value={topWidthVal}
                  unit={topWidthUnit}
                  category="length"
                  onChangeValue={setTopWidthVal}
                  onChangeUnit={setTopWidthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Trapezoidal Sloped Height (h2)"
                  value={trapHeightVal}
                  unit={trapHeightUnit}
                  category="length"
                  onChangeValue={setTrapHeightVal}
                  onChangeUnit={setTrapHeightUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Material Mix (1:1.5:3 etc.) */}
        {activeTab === 'mix' && (
          <div className="space-y-4">
            <UnitInput
              label="Wet Concrete Volume to Cast"
              value={mixWetVolVal}
              unit={mixWetVolUnit}
              category="volume"
              onChangeValue={setMixWetVolVal}
              onChangeUnit={setMixWetVolUnit}
              regionalProfile={settings.regionalProfile}
              helperText="Finished compacted volume"
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            {/* Nominal Mix Ratio Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Mix Proportion (Cement : Sand : Stone Chips)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONCRETE_MIX_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      selectedPresetIndex === idx
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-slate-100">{p.label.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Ratio Customizers */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-white/10 bg-[#0F172A]">
              <div>
                <label className="text-[11px] font-semibold text-cyan-300 block mb-1">Cement Ratio (C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={ratioC}
                  onChange={e => setRatioC(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-amber-300 block mb-1">Fine Aggregate (Sand)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={ratioS}
                  onChange={e => setRatioS(parseFloat(e.target.value) || 1.5)}
                  className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-purple-300 block mb-1">Coarse Aggregate</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={ratioA}
                  onChange={e => setRatioA(parseFloat(e.target.value) || 3)}
                  className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Jobsite Batching Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Dry Volume Void Factor</label>
                <input
                  type="number"
                  step="0.01"
                  value={dryFactor}
                  onChange={e => setDryFactor(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default 1.54 (54% void allowance)</span>
              </div>

              <UnitInput
                label="Cement Bag Mass"
                value={bagSizeVal}
                unit={bagSizeUnit}
                category="mass"
                onChangeValue={setBagSizeVal}
                onChangeUnit={setBagSizeUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Handling Wastage (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={wastagePct}
                  onChange={e => setWastagePct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Typically 2% to 5%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Water-Cement Ratio */}
        {activeTab === 'wc_ratio' && (
          <div className="space-y-4">
            <UnitInput
              label="Cement Quantity"
              value={wcCementVal}
              unit={wcCementUnit}
              category="mass"
              onChangeValue={setWcCementVal}
              onChangeUnit={setWcCementUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Water-Cement Ratio (w/c)</label>
              <input
                type="number"
                step="0.01"
                min="0.30"
                max="0.80"
                value={wcTargetRatio}
                onChange={e => setWcTargetRatio(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { r: 0.40, label: '0.40 (High Strength / M30+)' },
                  { r: 0.45, label: '0.45 (Standard RCC)' },
                  { r: 0.50, label: '0.50 (General Foundations)' },
                  { r: 0.55, label: '0.55 (Mass Concrete)' },
                ].map(item => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => setWcTargetRatio(item.r.toString())}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-cyan-300 border border-white/5 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Cement Bags & Bulk Volume */}
        {activeTab === 'cement_bags' && (
          <div className="space-y-4">
            <UnitInput
              label="Bulk Cement Loose Volume"
              value={cementTargetVolVal}
              unit={cementTargetVolUnit}
              category="volume"
              onChangeValue={setCementTargetVolVal}
              onChangeUnit={setCementTargetVolUnit}
              regionalProfile={settings.regionalProfile}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <UnitInput
              label="Standard Bag Mass"
              value={bagSizeVal}
              unit={bagSizeUnit}
              category="mass"
              onChangeValue={setBagSizeVal}
              onChangeUnit={setBagSizeUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />
          </div>
        )}
      </div>

      {/* Right Output Section */}
      <div className="lg:col-span-6 space-y-4">
        <ResultPanel
          result={activeResult}
          settings={settings}
          onSaveHistory={() => onSaveHistory(activeResult)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />

        {/* Quick-Access In-Place Unit Conversion Utility */}
        <QuickUnitConverter
          settings={settings}
          defaultCategory="volume"
          allowedCategories={['volume', 'mass', 'length', 'area']}
        />
      </div>
    </div>
  );
};
