import React, { useState, useMemo, useEffect } from 'react';
import { ResultPanel } from '../ResultPanel';
import {
  calculateRCCSteelEstimator,
  calculateSlab,
  calculateBeam,
  calculateColumn,
  calculateStaircase,
  calculateIsolatedFooting,
  calculateFormwork,
} from '../../utils/calculations';
import { AppSettings, CalculationResult } from '../../types';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';
import { toBase, fromBase, formatNumber } from '../../utils/units';

interface StructuralCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const StructuralCalculator: React.FC<StructuralCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const getInitialTab = (): 'rcc_steel' | 'slab' | 'beam' | 'column' | 'footing' | 'formwork' | 'staircase' => {
    if (activeView === 'slab-calculator') return 'slab';
    if (activeView === 'beam-calculator') return 'beam';
    if (activeView === 'column-calculator') return 'column';
    if (activeView === 'footing-calculator') return 'footing';
    if (activeView === 'formwork-calculator') return 'formwork';
    if (activeView === 'staircase-calculator') return 'staircase';
    return 'rcc_steel';
  };

  const [activeTab, setActiveTab] = useState<'rcc_steel' | 'slab' | 'beam' | 'column' | 'footing' | 'formwork' | 'staircase'>(getInitialTab);

  useEffect(() => {
    if (activeView) {
      if (activeView === 'slab-calculator') setActiveTab('slab');
      else if (activeView === 'beam-calculator') setActiveTab('beam');
      else if (activeView === 'column-calculator') setActiveTab('column');
      else if (activeView === 'footing-calculator') setActiveTab('footing');
      else if (activeView === 'formwork-calculator') setActiveTab('formwork');
      else if (activeView === 'staircase-calculator') setActiveTab('staircase');
      else if (activeView === 'rcc-steel-estimator') setActiveTab('rcc_steel');
    }
  }, [activeView]);

  const defaultLengthUnit = settings.unitPreferences?.length || 'm';
  const defaultVolumeUnit = settings.unitPreferences?.volume || 'm3';

  // Preliminary RCC Steel State
  const [concreteVolVal, setConcreteVolVal] = useState<string>('5');
  const [concreteVolUnit, setConcreteVolUnit] = useState<string>(defaultVolumeUnit);
  const [memberType, setMemberType] = useState<'slab' | 'beam' | 'column' | 'footing' | 'lintel' | 'custom'>('beam');
  const [customPct, setCustomPct] = useState<string>('1.5');
  const [steelRateVal, setSteelRateVal] = useState<string>('95');
  const [steelRateUnit, setSteelRateUnit] = useState<string>('kg');

  // Slab State
  const [slabLengthVal, setSlabLengthVal] = useState<string>('6');
  const [slabLengthUnit, setSlabLengthUnit] = useState<string>(defaultLengthUnit);
  const [slabWidthVal, setSlabWidthVal] = useState<string>('3.5');
  const [slabWidthUnit, setSlabWidthUnit] = useState<string>(defaultLengthUnit);
  const [slabThkVal, setSlabThkVal] = useState<string>('150');
  const [slabThkUnit, setSlabThkUnit] = useState<string>('mm');
  const [slabSteelPct, setSlabSteelPct] = useState<string>('0.8');

  // Beam State
  const [beamLengthVal, setBeamLengthVal] = useState<string>('5');
  const [beamLengthUnit, setBeamLengthUnit] = useState<string>(defaultLengthUnit);
  const [beamWidthVal, setBeamWidthVal] = useState<string>('250');
  const [beamWidthUnit, setBeamWidthUnit] = useState<string>('mm');
  const [beamDepthVal, setBeamDepthVal] = useState<string>('450');
  const [beamDepthUnit, setBeamDepthUnit] = useState<string>('mm');
  const [beamCoverVal, setBeamCoverVal] = useState<string>('25');
  const [beamCoverUnit, setBeamCoverUnit] = useState<string>('mm');
  const [stirrupSpacingVal, setStirrupSpacingVal] = useState<string>('150');
  const [stirrupSpacingUnit, setStirrupSpacingUnit] = useState<string>('mm');
  const [stirrupDiaVal, setStirrupDiaVal] = useState<string>('8');
  const [stirrupDiaUnit, setStirrupDiaUnit] = useState<string>('mm');

  // Column State
  const [colShape, setColShape] = useState<'rectangular' | 'circular'>('rectangular');
  const [colHeightVal, setColHeightVal] = useState<string>('3.2');
  const [colHeightUnit, setColHeightUnit] = useState<string>(defaultLengthUnit);
  const [colWidthVal, setColWidthVal] = useState<string>('300');
  const [colWidthUnit, setColWidthUnit] = useState<string>('mm');
  const [colDepthVal, setColDepthVal] = useState<string>('450');
  const [colDepthUnit, setColDepthUnit] = useState<string>('mm');
  const [colDiaVal, setColDiaVal] = useState<string>('350');
  const [colDiaUnit, setColDiaUnit] = useState<string>('mm');
  const [colTieSpacingVal, setColTieSpacingVal] = useState<string>('150');
  const [colTieSpacingUnit, setColTieSpacingUnit] = useState<string>('mm');
  const [colSteelPct, setColSteelPct] = useState<string>('2.0');

  // Footing State
  const [footingBaseLVal, setFootingBaseLVal] = useState<string>('1.8');
  const [footingBaseLUnit, setFootingBaseLUnit] = useState<string>(defaultLengthUnit);
  const [footingBaseWVal, setFootingBaseWVal] = useState<string>('1.8');
  const [footingBaseWUnit, setFootingBaseWUnit] = useState<string>(defaultLengthUnit);
  const [footingEdgeH1Val, setFootingEdgeH1Val] = useState<string>('0.25');
  const [footingEdgeH1Unit, setFootingEdgeH1Unit] = useState<string>(defaultLengthUnit);
  const [footingSlopedH2Val, setFootingSlopedH2Val] = useState<string>('0.35');
  const [footingSlopedH2Unit, setFootingSlopedH2Unit] = useState<string>(defaultLengthUnit);
  const [colPadLVal, setColPadLVal] = useState<string>('0.35');
  const [colPadLUnit, setColPadLUnit] = useState<string>(defaultLengthUnit);
  const [colPadWVal, setColPadWVal] = useState<string>('0.35');
  const [colPadWUnit, setColPadWUnit] = useState<string>(defaultLengthUnit);
  const [footingRebarDia, setFootingRebarDia] = useState<string>('12');
  const [footingRebarSpacing, setFootingRebarSpacing] = useState<string>('150');
  const [footingQty, setFootingQty] = useState<string>('1');

  // Formwork State
  const [formworkMember, setFormworkMember] = useState<'slab' | 'beam' | 'column' | 'footing' | 'retaining_wall'>('beam');
  const [fwLengthVal, setFwLengthVal] = useState<string>('5');
  const [fwLengthUnit, setFwLengthUnit] = useState<string>(defaultLengthUnit);
  const [fwWidthVal, setFwWidthVal] = useState<string>('0.25');
  const [fwWidthUnit, setFwWidthUnit] = useState<string>(defaultLengthUnit);
  const [fwHeightVal, setFwHeightVal] = useState<string>('3');
  const [fwHeightUnit, setFwHeightUnit] = useState<string>(defaultLengthUnit);
  const [fwDepthVal, setFwDepthVal] = useState<string>('0.45');
  const [fwDepthUnit, setFwDepthUnit] = useState<string>(defaultLengthUnit);
  const [fwQty, setFwQty] = useState<string>('1');

  // Staircase State
  const [floorHeightVal, setFloorHeightVal] = useState<string>('3000');
  const [floorHeightUnit, setFloorHeightUnit] = useState<string>('mm');
  const [riserVal, setRiserVal] = useState<string>('150');
  const [riserUnit, setRiserUnit] = useState<string>('mm');
  const [treadVal, setTreadVal] = useState<string>('250');
  const [treadUnit, setTreadUnit] = useState<string>('mm');
  const [stairWidthVal, setStairWidthVal] = useState<string>('1.2');
  const [stairWidthUnit, setStairWidthUnit] = useState<string>(defaultLengthUnit);
  const [waistThkVal, setWaistThkVal] = useState<string>('150');
  const [waistThkUnit, setWaistThkUnit] = useState<string>('mm');

  // Calculations with Normalized SI Inputs
  const rccSteelResult = useMemo(() => {
    const volM3 = toBase(parseFloat(concreteVolVal) || 0, concreteVolUnit, 'volume', {
      regionalProfile: settings.regionalProfile,
    });
    const rateKg = steelRateUnit === 'tonne'
      ? (parseFloat(steelRateVal) || 0) / 1000
      : (parseFloat(steelRateVal) || 0);

    const res = calculateRCCSteelEstimator(
      volM3,
      memberType,
      memberType === 'custom' ? parseFloat(customPct) || 1.0 : undefined,
      rateKg
    );
    res.primaryCategory = 'mass';
    return res;
  }, [concreteVolVal, concreteVolUnit, memberType, customPct, steelRateVal, steelRateUnit, settings]);

  const slabResult = useMemo(() => {
    const lM = toBase(parseFloat(slabLengthVal) || 0, slabLengthUnit, 'length');
    const wM = toBase(parseFloat(slabWidthVal) || 0, slabWidthUnit, 'length');
    const thkMm = toBase(parseFloat(slabThkVal) || 150, slabThkUnit, 'length') * 1000;

    const res = calculateSlab(lM, wM, thkMm, parseFloat(slabSteelPct) || 0.8);
    res.primaryCategory = 'volume';
    return res;
  }, [slabLengthVal, slabLengthUnit, slabWidthVal, slabWidthUnit, slabThkVal, slabThkUnit, slabSteelPct]);

  const beamResult = useMemo(() => {
    const lM = toBase(parseFloat(beamLengthVal) || 0, beamLengthUnit, 'length');
    const wMm = toBase(parseFloat(beamWidthVal) || 250, beamWidthUnit, 'length') * 1000;
    const dMm = toBase(parseFloat(beamDepthVal) || 450, beamDepthUnit, 'length') * 1000;
    const coverMm = toBase(parseFloat(beamCoverVal) || 25, beamCoverUnit, 'length') * 1000;
    const stirrupSpacingMm = toBase(parseFloat(stirrupSpacingVal) || 150, stirrupSpacingUnit, 'length') * 1000;
    const stirrupDiaMm = toBase(parseFloat(stirrupDiaVal) || 8, stirrupDiaUnit, 'length') * 1000;

    const res = calculateBeam(lM, wMm, dMm, coverMm, stirrupSpacingMm, stirrupDiaMm);
    res.primaryCategory = 'volume';
    return res;
  }, [
    beamLengthVal, beamLengthUnit, beamWidthVal, beamWidthUnit, beamDepthVal, beamDepthUnit,
    beamCoverVal, beamCoverUnit, stirrupSpacingVal, stirrupSpacingUnit, stirrupDiaVal, stirrupDiaUnit,
  ]);

  const colResult = useMemo(() => {
    const hM = toBase(parseFloat(colHeightVal) || 0, colHeightUnit, 'length');
    const wMm = toBase(parseFloat(colWidthVal) || 300, colWidthUnit, 'length') * 1000;
    const dMm = toBase(parseFloat(colDepthVal) || 450, colDepthUnit, 'length') * 1000;
    const diaMm = toBase(parseFloat(colDiaVal) || 350, colDiaUnit, 'length') * 1000;
    const tieMm = toBase(parseFloat(colTieSpacingVal) || 150, colTieSpacingUnit, 'length') * 1000;

    const res = calculateColumn(colShape, hM, {
      widthMm: wMm,
      depthMm: dMm,
      diameterMm: diaMm,
      tieSpacingMm: tieMm,
      rebarPct: parseFloat(colSteelPct) || 2.0,
    });
    res.primaryCategory = 'volume';
    return res;
  }, [colShape, colHeightVal, colHeightUnit, colWidthVal, colWidthUnit, colDepthVal, colDepthUnit, colDiaVal, colDiaUnit, colTieSpacingVal, colTieSpacingUnit, colSteelPct]);

  const footingResult = useMemo(() => {
    const bL = toBase(parseFloat(footingBaseLVal) || 0, footingBaseLUnit, 'length');
    const bW = toBase(parseFloat(footingBaseWVal) || 0, footingBaseWUnit, 'length');
    const h1 = toBase(parseFloat(footingEdgeH1Val) || 0, footingEdgeH1Unit, 'length');
    const h2 = toBase(parseFloat(footingSlopedH2Val) || 0, footingSlopedH2Unit, 'length');
    const cL = toBase(parseFloat(colPadLVal) || 0, colPadLUnit, 'length');
    const cW = toBase(parseFloat(colPadWVal) || 0, colPadWUnit, 'length');

    const res = calculateIsolatedFooting({
      baseLengthM: bL,
      baseWidthM: bW,
      baseEdgeH1M: h1,
      slopedH2M: h2,
      colPadLengthM: cL,
      colPadWidthM: cW,
      rebarDiaMm: parseFloat(footingRebarDia) || 12,
      rebarSpacingMm: parseFloat(footingRebarSpacing) || 150,
      quantity: parseInt(footingQty, 10) || 1,
    });
    res.primaryCategory = 'volume';
    return res;
  }, [footingBaseLVal, footingBaseLUnit, footingBaseWVal, footingBaseWUnit, footingEdgeH1Val, footingEdgeH1Unit, footingSlopedH2Val, footingSlopedH2Unit, colPadLVal, colPadLUnit, colPadWVal, colPadWUnit, footingRebarDia, footingRebarSpacing, footingQty]);

  const formworkResult = useMemo(() => {
    const lM = toBase(parseFloat(fwLengthVal) || 0, fwLengthUnit, 'length');
    const wM = toBase(parseFloat(fwWidthVal) || 0, fwWidthUnit, 'length');
    const hM = toBase(parseFloat(fwHeightVal) || 0, fwHeightUnit, 'length');
    const dM = toBase(parseFloat(fwDepthVal) || 0, fwDepthUnit, 'length');

    const res = calculateFormwork(formworkMember, {
      lengthM: lM,
      widthM: wM,
      heightM: hM,
      depthM: dM,
      diameterM: 0.35,
      quantity: parseInt(fwQty, 10) || 1,
    });
    res.primaryCategory = 'area';
    return res;
  }, [formworkMember, fwLengthVal, fwLengthUnit, fwWidthVal, fwWidthUnit, fwHeightVal, fwHeightUnit, fwDepthVal, fwDepthUnit, fwQty]);

  const staircaseResult = useMemo(() => {
    const flMm = toBase(parseFloat(floorHeightVal) || 3000, floorHeightUnit, 'length') * 1000;
    const rMm = toBase(parseFloat(riserVal) || 150, riserUnit, 'length') * 1000;
    const tMm = toBase(parseFloat(treadVal) || 250, treadUnit, 'length') * 1000;
    const wM = toBase(parseFloat(stairWidthVal) || 1.2, stairWidthUnit, 'length');
    const waistMm = toBase(parseFloat(waistThkVal) || 150, waistThkUnit, 'length') * 1000;

    const res = calculateStaircase(flMm, rMm, tMm, wM, waistMm);
    res.primaryCategory = 'volume';
    return res;
  }, [floorHeightVal, floorHeightUnit, riserVal, riserUnit, treadVal, treadUnit, stairWidthVal, stairWidthUnit, waistThkVal, waistThkUnit]);

  const activeResult = useMemo(() => {
    switch (activeTab) {
      case 'rcc_steel': return rccSteelResult;
      case 'slab': return slabResult;
      case 'beam': return beamResult;
      case 'column': return colResult;
      case 'footing': return footingResult;
      case 'formwork': return formworkResult;
      case 'staircase': return staircaseResult;
    }
  }, [activeTab, rccSteelResult, slabResult, beamResult, colResult, footingResult, formworkResult, staircaseResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Section */}
      <div className="lg:col-span-6 space-y-6 no-print">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
          {[
            { id: 'rcc_steel', label: 'RCC Steel Ratio' },
            { id: 'slab', label: 'Slab Design' },
            { id: 'beam', label: 'Beam Stirrups' },
            { id: 'column', label: 'Column Ties' },
            { id: 'footing', label: 'Isolated Footing' },
            { id: 'formwork', label: 'Shuttering Area' },
            { id: 'staircase', label: 'Staircase Waist' },
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

        {/* Tab 1: RCC Steel Estimator */}
        {activeTab === 'rcc_steel' && (
          <div className="space-y-4">
            <UnitInput
              label="Concrete Wet Volume"
              value={concreteVolVal}
              unit={concreteVolUnit}
              category="volume"
              onChangeValue={setConcreteVolVal}
              onChangeUnit={setConcreteVolUnit}
              regionalProfile={settings.regionalProfile}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Member Type (Rule-of-Thumb %)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slab', label: 'Slab (1.0%)' },
                  { id: 'beam', label: 'Beam (2.0%)' },
                  { id: 'column', label: 'Column (2.5%)' },
                  { id: 'footing', label: 'Footing (0.8%)' },
                  { id: 'lintel', label: 'Lintel (1.0%)' },
                  { id: 'custom', label: 'Custom %' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMemberType(m.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-colors text-center ${
                      memberType === m.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {memberType === 'custom' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Custom Steel Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customPct}
                  onChange={e => setCustomPct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Steel Rate</label>
              <div className="flex rounded-xl border border-white/10 bg-[#0F172A] focus-within:border-cyan-500/50">
                <input
                  type="number"
                  value={steelRateVal}
                  onChange={e => setSteelRateVal(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none"
                />
                <select
                  value={steelRateUnit}
                  onChange={e => setSteelRateUnit(e.target.value)}
                  className="bg-transparent px-2.5 py-2 text-xs font-semibold text-cyan-300 border-l border-white/10 focus:outline-none"
                >
                  <option value="kg" className="bg-[#111827]">/ kg</option>
                  <option value="tonne" className="bg-[#111827]">/ tonne</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Slab */}
        {activeTab === 'slab' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Long Span (Ly)"
                value={slabLengthVal}
                unit={slabLengthUnit}
                category="length"
                onChangeValue={setSlabLengthVal}
                onChangeUnit={setSlabLengthUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Short Span (Lx)"
                value={slabWidthVal}
                unit={slabWidthUnit}
                category="length"
                onChangeValue={setSlabWidthVal}
                onChangeUnit={setSlabWidthUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Slab Overall Thickness (D)"
                value={slabThkVal}
                unit={slabThkUnit}
                category="length"
                onChangeValue={setSlabThkVal}
                onChangeUnit={setSlabThkUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Steel Ratio (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={slabSteelPct}
                  onChange={e => setSlabSteelPct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Beam */}
        {activeTab === 'beam' && (
          <div className="space-y-4">
            <UnitInput
              label="Clear Beam Span"
              value={beamLengthVal}
              unit={beamLengthUnit}
              category="length"
              onChangeValue={setBeamLengthVal}
              onChangeUnit={setBeamLengthUnit}
              regionalProfile={settings.regionalProfile}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Beam Width (b)"
                value={beamWidthVal}
                unit={beamWidthUnit}
                category="length"
                onChangeValue={setBeamWidthVal}
                onChangeUnit={setBeamWidthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Beam Depth (D)"
                value={beamDepthVal}
                unit={beamDepthUnit}
                category="length"
                onChangeValue={setBeamDepthVal}
                onChangeUnit={setBeamDepthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <UnitInput
                label="Clear Cover"
                value={beamCoverVal}
                unit={beamCoverUnit}
                category="length"
                onChangeValue={setBeamCoverVal}
                onChangeUnit={setBeamCoverUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Stirrup Spacing"
                value={stirrupSpacingVal}
                unit={stirrupSpacingUnit}
                category="length"
                onChangeValue={setStirrupSpacingVal}
                onChangeUnit={setStirrupSpacingUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Stirrup Bar Ø"
                value={stirrupDiaVal}
                unit={stirrupDiaUnit}
                category="length"
                onChangeValue={setStirrupDiaVal}
                onChangeUnit={setStirrupDiaUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Column */}
        {activeTab === 'column' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['rectangular', 'circular'].map(sh => (
                <button
                  key={sh}
                  type="button"
                  onClick={() => setColShape(sh as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                    colShape === sh
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                      : 'border-white/10 bg-[#111827] text-slate-400'
                  }`}
                >
                  {sh} Column
                </button>
              ))}
            </div>

            <UnitInput
              label="Column Clear Height"
              value={colHeightVal}
              unit={colHeightUnit}
              category="length"
              onChangeValue={setColHeightVal}
              onChangeUnit={setColHeightUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            {colShape === 'rectangular' ? (
              <div className="grid grid-cols-2 gap-3">
                <UnitInput
                  label="Width (b)"
                  value={colWidthVal}
                  unit={colWidthUnit}
                  category="length"
                  onChangeValue={setColWidthVal}
                  onChangeUnit={setColWidthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Depth (D)"
                  value={colDepthVal}
                  unit={colDepthUnit}
                  category="length"
                  onChangeValue={setColDepthVal}
                  onChangeUnit={setColDepthUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            ) : (
              <UnitInput
                label="Diameter (Ø)"
                value={colDiaVal}
                unit={colDiaUnit}
                category="length"
                onChangeValue={setColDiaVal}
                onChangeUnit={setColDiaUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Tie Ring Spacing"
                value={colTieSpacingVal}
                unit={colTieSpacingUnit}
                category="length"
                onChangeValue={setColTieSpacingVal}
                onChangeUnit={setColTieSpacingUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Steel Ratio (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={colSteelPct}
                  onChange={e => setColSteelPct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">BNBC/ACI min 1%, max 4%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Footing */}
        {activeTab === 'footing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Base Length (L)"
                value={footingBaseLVal}
                unit={footingBaseLUnit}
                category="length"
                onChangeValue={setFootingBaseLVal}
                onChangeUnit={setFootingBaseLUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Base Width (B)"
                value={footingBaseWVal}
                unit={footingBaseWUnit}
                category="length"
                onChangeValue={setFootingBaseWVal}
                onChangeUnit={setFootingBaseWUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Edge Depth (h1)"
                value={footingEdgeH1Val}
                unit={footingEdgeH1Unit}
                category="length"
                onChangeValue={setFootingEdgeH1Val}
                onChangeUnit={setFootingEdgeH1Unit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Sloped Depth (h2)"
                value={footingSlopedH2Val}
                unit={footingSlopedH2Unit}
                category="length"
                onChangeValue={setFootingSlopedH2Val}
                onChangeUnit={setFootingSlopedH2Unit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rebar Ø (mm)</label>
                <input
                  type="number"
                  value={footingRebarDia}
                  onChange={e => setFootingRebarDia(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Spacing (mm)</label>
                <input
                  type="number"
                  value={footingRebarSpacing}
                  onChange={e => setFootingRebarSpacing(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={footingQty}
                  onChange={e => setFootingQty(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Formwork */}
        {activeTab === 'formwork' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Shuttering Member</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'beam', label: 'Beam Sides & Bottom' },
                  { id: 'slab', label: 'Slab Soffit' },
                  { id: 'column', label: 'Column 4-Sides' },
                  { id: 'footing', label: 'Footing Perimeter' },
                  { id: 'retaining_wall', label: 'Retaining Wall' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormworkMember(m.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-colors text-center ${
                      formworkMember === m.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Length"
                value={fwLengthVal}
                unit={fwLengthUnit}
                category="length"
                onChangeValue={setFwLengthVal}
                onChangeUnit={setFwLengthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Width (b)"
                value={fwWidthVal}
                unit={fwWidthUnit}
                category="length"
                onChangeValue={setFwWidthVal}
                onChangeUnit={setFwWidthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Depth / Height"
                value={fwDepthVal}
                unit={fwDepthUnit}
                category="length"
                onChangeValue={setFwDepthVal}
                onChangeUnit={setFwDepthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity of Members</label>
                <input
                  type="number"
                  min="1"
                  value={fwQty}
                  onChange={e => setFwQty(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Staircase */}
        {activeTab === 'staircase' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Floor-to-Floor Height"
                value={floorHeightVal}
                unit={floorHeightUnit}
                category="length"
                onChangeValue={setFloorHeightVal}
                onChangeUnit={setFloorHeightUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Flight / Stair Width"
                value={stairWidthVal}
                unit={stairWidthUnit}
                category="length"
                onChangeValue={setStairWidthVal}
                onChangeUnit={setStairWidthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <UnitInput
                label="Riser (R)"
                value={riserVal}
                unit={riserUnit}
                category="length"
                onChangeValue={setRiserVal}
                onChangeUnit={setRiserUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Tread (T)"
                value={treadVal}
                unit={treadUnit}
                category="length"
                onChangeValue={setTreadVal}
                onChangeUnit={setTreadUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Waist Slab Thk"
                value={waistThkVal}
                unit={waistThkUnit}
                category="length"
                onChangeValue={setWaistThkVal}
                onChangeUnit={setWaistThkUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
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
          defaultCategory="length"
          allowedCategories={['length', 'volume', 'area', 'mass', 'pressure', 'force']}
        />
      </div>
    </div>
  );
};
