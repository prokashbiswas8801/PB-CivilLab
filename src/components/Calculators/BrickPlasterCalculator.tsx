import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import {
  calculateBrickwork,
  calculatePlaster,
  calculateFlooring,
} from '../../utils/calculations';
import { STANDARD_BRICK_SIZES, PLASTER_MIX_PRESETS } from '../../constants/engineering';
import { AppSettings, CalculationResult } from '../../types';
import { formatNumber, formatCurrency, toBase, fromBase, parseTileDimension } from '../../utils/units';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';

interface BrickPlasterCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const BrickPlasterCalculator: React.FC<BrickPlasterCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const getInitialTab = (): 'brickwork' | 'plaster' | 'tiles' | 'paint' => {
    if (activeView === 'plaster') return 'plaster';
    if (activeView === 'flooring-tiles') return 'tiles';
    if (activeView === 'paint') return 'paint';
    return 'brickwork';
  };

  const [activeTab, setActiveTab] = useState<'brickwork' | 'plaster' | 'tiles' | 'paint'>(getInitialTab);

  React.useEffect(() => {
    if (activeView) {
      if (activeView === 'plaster') setActiveTab('plaster');
      else if (activeView === 'flooring-tiles') setActiveTab('tiles');
      else if (activeView === 'paint') setActiveTab('paint');
      else if (activeView === 'brickwork') setActiveTab('brickwork');
    }
  }, [activeView]);

  const defaultLengthUnit = settings.unitPreferences?.length || 'm';
  const defaultAreaUnit = settings.unitPreferences?.area || 'm2';

  // Brickwork State with Multi-Unit Support
  const [wallLengthVal, setWallLengthVal] = useState<string>('5');
  const [wallLengthUnit, setWallLengthUnit] = useState<string>(defaultLengthUnit);

  const [wallHeightVal, setWallHeightVal] = useState<string>('3');
  const [wallHeightUnit, setWallHeightUnit] = useState<string>(defaultLengthUnit);

  const [wallThkVal, setWallThkVal] = useState<string>('5');
  const [wallThkUnit, setWallThkUnit] = useState<string>('in'); // 5 inch wall / 10 inch wall standard

  const [selectedBrickIndex, setSelectedBrickIndex] = useState<number>(0);
  const [customBrickL, setCustomBrickL] = useState<string>('240');
  const [customBrickW, setCustomBrickW] = useState<string>('115');
  const [customBrickH, setCustomBrickH] = useState<string>('70');
  const [brickDimUnit, setBrickDimUnit] = useState<string>('mm');

  const [mortarJointVal, setMortarJointVal] = useState<string>('10');
  const [mortarJointUnit, setMortarJointUnit] = useState<string>('mm');

  const [openingsVal, setOpeningsVal] = useState<string>('2.5'); // door/window
  const [openingsUnit, setOpeningsUnit] = useState<string>(defaultAreaUnit);

  const [brickRatioC, setBrickRatioC] = useState<number>(1);
  const [brickRatioS, setBrickRatioS] = useState<number>(5);
  const [brickWastePct, setBrickWastePct] = useState<string>('5');

  // Plaster State
  const [plasterAreaVal, setPlasterAreaVal] = useState<string>('50');
  const [plasterAreaUnit, setPlasterAreaUnit] = useState<string>(defaultAreaUnit);

  const [plasterThkVal, setPlasterThkVal] = useState<string>('12');
  const [plasterThkUnit, setPlasterThkUnit] = useState<string>('mm');

  const [plasterRatioC, setPlasterRatioC] = useState<number>(1);
  const [plasterRatioS, setPlasterRatioS] = useState<number>(5);
  const [plasterDryFactor, setPlasterDryFactor] = useState<string>('1.33');
  const [plasterWastePct, setPlasterWastePct] = useState<string>('5');

  // Flooring & Tiles State
  const [tileCallout, setTileCallout] = useState<string>('600 × 600 mm');
  const [roomLVal, setRoomLVal] = useState<string>('4');
  const [roomLUnit, setRoomLUnit] = useState<string>(defaultLengthUnit);
  const [roomWVal, setRoomWVal] = useState<string>('3.5');
  const [roomWUnit, setRoomWUnit] = useState<string>(defaultLengthUnit);
  const [tileWastePct, setTileWastePct] = useState<string>('5');
  const [tilesPerBox, setTilesPerBox] = useState<string>('4');

  // Paint State
  const [paintAreaVal, setPaintAreaVal] = useState<string>('100');
  const [paintAreaUnit, setPaintAreaUnit] = useState<string>(defaultAreaUnit);
  const [paintCoats, setPaintCoats] = useState<string>('2');
  const [paintCoverage, setPaintCoverage] = useState<string>('10'); // m² per liter per coat
  const [paintWastePct, setPaintWastePct] = useState<string>('5');
  const [paintCostPerL, setPaintCostPerL] = useState<string>('450');

  // Normalized Brickwork values
  const brickResult = useMemo(() => {
    const wallLM = toBase(parseFloat(wallLengthVal) || 0, wallLengthUnit, 'length', {
      regionalProfile: settings.regionalProfile,
    });
    const wallHM = toBase(parseFloat(wallHeightVal) || 0, wallHeightUnit, 'length', {
      regionalProfile: settings.regionalProfile,
    });
    const wallThkM = toBase(parseFloat(wallThkVal) || 0, wallThkUnit, 'length');
    const openingsM2 = toBase(parseFloat(openingsVal) || 0, openingsUnit, 'area', {
      regionalProfile: settings.regionalProfile,
    });

    let bL = 241.3;
    let bW = 114.3;
    let bH = 69.85;

    if (selectedBrickIndex === 3) {
      // Custom
      bL = toBase(parseFloat(customBrickL) || 240, brickDimUnit, 'length') * 1000;
      bW = toBase(parseFloat(customBrickW) || 115, brickDimUnit, 'length') * 1000;
      bH = toBase(parseFloat(customBrickH) || 70, brickDimUnit, 'length') * 1000;
    } else {
      const p = STANDARD_BRICK_SIZES[selectedBrickIndex] || STANDARD_BRICK_SIZES[0];
      bL = p.length;
      bW = p.width;
      bH = p.height;
    }

    const jointMm = toBase(parseFloat(mortarJointVal) || 10, mortarJointUnit, 'length') * 1000;

    const res = calculateBrickwork(
      wallLM,
      wallHM,
      wallThkM,
      bL,
      bW,
      bH,
      jointMm,
      openingsM2,
      brickRatioC,
      brickRatioS,
      parseFloat(brickWastePct) || 5
    );
    res.primaryCategory = 'common';
    return res;
  }, [
    wallLengthVal, wallLengthUnit, wallHeightVal, wallHeightUnit, wallThkVal, wallThkUnit,
    openingsVal, openingsUnit, selectedBrickIndex, customBrickL, customBrickW, customBrickH,
    brickDimUnit, mortarJointVal, mortarJointUnit, brickRatioC, brickRatioS, brickWastePct, settings,
  ]);

  // Plaster Calculation
  const plasterResult = useMemo(() => {
    const areaM2 = toBase(parseFloat(plasterAreaVal) || 0, plasterAreaUnit, 'area', {
      regionalProfile: settings.regionalProfile,
    });
    const thkMm = toBase(parseFloat(plasterThkVal) || 12, plasterThkUnit, 'length') * 1000;

    const res = calculatePlaster(
      areaM2,
      thkMm,
      plasterRatioC,
      plasterRatioS,
      parseFloat(plasterDryFactor) || 1.33,
      parseFloat(plasterWastePct) || 5
    );
    res.primaryCategory = 'mass';
    return res;
  }, [plasterAreaVal, plasterAreaUnit, plasterThkVal, plasterThkUnit, plasterRatioC, plasterRatioS, plasterDryFactor, plasterWastePct, settings]);

  // Flooring & Tiles Calculation
  const tileResult = useMemo(() => {
    const rLM = toBase(parseFloat(roomLVal) || 0, roomLUnit, 'length');
    const rWM = toBase(parseFloat(roomWVal) || 0, roomWUnit, 'length');
    const parsedTile = parseTileDimension(tileCallout);

    const tLMm = parsedTile.isValid ? parsedTile.lengthMm : 600;
    const tWMm = parsedTile.isValid ? parsedTile.widthMm : 600;

    const res = calculateFlooring(
      rLM,
      rWM,
      tLMm,
      tWMm,
      parseFloat(tileWastePct) || 5,
      parseInt(tilesPerBox, 10) || 4
    );
    res.primaryCategory = 'common';
    return res;
  }, [roomLVal, roomLUnit, roomWVal, roomWUnit, tileCallout, tileWastePct, tilesPerBox]);

  // Paint Calculation Result
  const paintResult: CalculationResult = useMemo(() => {
    const areaM2 = toBase(parseFloat(paintAreaVal) || 0, paintAreaUnit, 'area', {
      regionalProfile: settings.regionalProfile,
    });
    const coats = Math.max(1, parseInt(paintCoats, 10) || 2);
    const cov = Math.max(1, parseFloat(paintCoverage) || 10);
    const waste = Math.max(0, parseFloat(paintWastePct) || 5);
    const rate = parseFloat(paintCostPerL) || 0;

    const netLiters = (areaM2 * coats) / cov;
    const grossLiters = netLiters * (1 + waste / 100);
    const cost = grossLiters * rate;
    const gallonsUs = grossLiters * 0.264172;

    return {
      title: 'Architectural Paint Quantity Estimation',
      primaryValue: formatNumber(grossLiters, 2),
      primaryUnit: 'Liters',
      primaryCategory: 'volume',
      primaryRawValue: grossLiters * 0.001,
      secondaryValues: [
        { label: 'Total in US Gallons', value: formatNumber(gallonsUs, 2), unit: 'gal' },
        { label: 'Net Surface Area', value: `${formatNumber(areaM2, 2)} m² (${formatNumber(areaM2 / 0.092903, 1)} sq.ft)` },
        { label: 'Number of Coats', value: `${coats} coats` },
        ...(rate > 0 ? [{ label: 'Estimated Material Cost', value: formatCurrency(cost, settings.currencySymbol) }] : []),
      ],
      breakdown: [
        { step: '1. Total Coated Area', expression: `${formatNumber(areaM2, 2)} m² × ${coats} coats`, result: `${formatNumber(areaM2 * coats, 2)} m²-coats` },
        { step: '2. Net Paint Demand', expression: `${formatNumber(areaM2 * coats, 2)} ÷ ${cov} m²/L`, result: `${formatNumber(netLiters, 2)} L` },
        { step: '3. Include Site Wastage', expression: `${formatNumber(netLiters, 2)} L × (1 + ${waste}%)`, result: `${formatNumber(grossLiters, 2)} L` },
      ],
      formula: 'Paint (L) = (Area × Coats ÷ Coverage) × (1 + Wastage%)',
      substitutedFormula: `Paint = (${formatNumber(areaM2, 2)} × ${coats} ÷ ${cov}) × 1.${waste} = ${formatNumber(grossLiters, 2)} Liters`,
      inputsSummary: [
        { label: 'Surface Area', value: `${paintAreaVal} ${paintAreaUnit} (${formatNumber(areaM2, 2)} m²)` },
        { label: 'Coats', value: `${coats} coats` },
        { label: 'Coverage Rate', value: `${cov} m²/Liter/coat` },
      ],
      assumptions: [
        { label: 'Surface Preparation', value: 'Requires dry, dust-free surface primed with 1 coat sealer before application.' },
        { label: 'Coverage Range', value: 'Smooth plaster: 10-12 m²/L; Rough sand-faced plaster: 6-8 m²/L.' },
      ],
      engineeringNotes: 'Add separate allowance for 1 coat water-based acrylic sealer/primer on new plaster walls.',
    };
  }, [paintAreaVal, paintAreaUnit, paintCoats, paintCoverage, paintWastePct, paintCostPerL, settings]);

  const currentResult = useMemo(() => {
    switch (activeTab) {
      case 'brickwork': return brickResult;
      case 'plaster': return plasterResult;
      case 'tiles': return tileResult;
      case 'paint': return paintResult;
    }
  }, [activeTab, brickResult, plasterResult, tileResult, paintResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Section */}
      <div className="lg:col-span-6 space-y-6 no-print">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
          {[
            { id: 'brickwork', label: 'Brick Masonry Wall' },
            { id: 'plaster', label: 'Cement Plastering' },
            { id: 'tiles', label: 'Floor Tiles & Skirting' },
            { id: 'paint', label: 'Wall Paint Coating' },
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

        {/* Tab 1: Brick Masonry Wall */}
        {activeTab === 'brickwork' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UnitInput
                label="Wall Length"
                value={wallLengthVal}
                unit={wallLengthUnit}
                category="length"
                onChangeValue={setWallLengthVal}
                onChangeUnit={setWallLengthUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Wall Height"
                value={wallHeightVal}
                unit={wallHeightUnit}
                category="length"
                onChangeValue={setWallHeightVal}
                onChangeUnit={setWallHeightUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Wall Thickness"
                value={wallThkVal}
                unit={wallThkUnit}
                category="length"
                onChangeValue={setWallThkVal}
                onChangeUnit={setWallThkUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>

            {/* Brick Standard Dimension Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Standard Brick Specification
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_BRICK_SIZES.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBrickIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      selectedBrickIndex === idx
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-200">{b.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {b.length} × {b.width} × {b.height} mm
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Brick Dimensions if selected */}
            {selectedBrickIndex === 3 && (
              <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 grid grid-cols-3 gap-2">
                <UnitInput
                  label="Brick Length"
                  value={customBrickL}
                  unit={brickDimUnit}
                  category="length"
                  onChangeValue={setCustomBrickL}
                  onChangeUnit={setBrickDimUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Brick Width"
                  value={customBrickW}
                  unit={brickDimUnit}
                  category="length"
                  onChangeValue={setCustomBrickW}
                  onChangeUnit={setBrickDimUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Brick Height"
                  value={customBrickH}
                  unit={brickDimUnit}
                  category="length"
                  onChangeValue={setCustomBrickH}
                  onChangeUnit={setBrickDimUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Mortar Joint Thickness"
                value={mortarJointVal}
                unit={mortarJointUnit}
                category="length"
                onChangeValue={setMortarJointVal}
                onChangeUnit={setMortarJointUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Deductions / Openings Area"
                value={openingsVal}
                unit={openingsUnit}
                category="area"
                onChangeValue={setOpeningsVal}
                onChangeUnit={setOpeningsUnit}
                regionalProfile={settings.regionalProfile}
                helperText="Doors & windows"
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>

            {/* Mortar Mix Ratio */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-white/10 bg-[#0F172A]">
              <div>
                <label className="text-[11px] font-semibold text-cyan-300 block mb-1">Cement (C)</label>
                <input
                  type="number"
                  min="1"
                  value={brickRatioC}
                  onChange={e => setBrickRatioC(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-amber-300 block mb-1">Sand (S)</label>
                <input
                  type="number"
                  min="1"
                  value={brickRatioS}
                  onChange={e => setBrickRatioS(parseFloat(e.target.value) || 5)}
                  className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Brick Waste (%)</label>
                <input
                  type="number"
                  value={brickWastePct}
                  onChange={e => setBrickWastePct(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cement Plastering */}
        {activeTab === 'plaster' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Plastering Surface Area"
                value={plasterAreaVal}
                unit={plasterAreaUnit}
                category="area"
                onChangeValue={setPlasterAreaVal}
                onChangeUnit={setPlasterAreaUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Plaster Thickness"
                value={plasterThkVal}
                unit={plasterThkUnit}
                category="length"
                onChangeValue={setPlasterThkVal}
                onChangeUnit={setPlasterThkUnit}
                helperText="Internal: 12mm; External: 15-20mm"
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>

            {/* Plaster Mix Ratio Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mortar Mix Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {PLASTER_MIX_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPlasterRatioC(p.c);
                      setPlasterRatioS(p.s);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      plasterRatioC === p.c && plasterRatioS === p.s
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-slate-100">{p.label}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Mortar Dry Factor</label>
                <input
                  type="number"
                  step="0.01"
                  value={plasterDryFactor}
                  onChange={e => setPlasterDryFactor(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default 1.33 (33% shrinkage allowance)</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Handling Wastage (%)</label>
                <input
                  type="number"
                  value={plasterWastePct}
                  onChange={e => setPlasterWastePct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Rebound & joint filling</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Floor Tiles & Skirting */}
        {activeTab === 'tiles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Room Length"
                value={roomLVal}
                unit={roomLUnit}
                category="length"
                onChangeValue={setRoomLVal}
                onChangeUnit={setRoomLUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Room Width"
                value={roomWVal}
                unit={roomWUnit}
                category="length"
                onChangeValue={setRoomWVal}
                onChangeUnit={setRoomWUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>

            {/* Tile Dimension with presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tile Dimension Specification</label>
              <input
                type="text"
                value={tileCallout}
                onChange={e => setTileCallout(e.target.value)}
                placeholder="e.g. 600 × 600 mm or 12 × 12 in"
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
              />
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {[
                  '300 × 300 mm (12"×12")',
                  '600 × 600 mm (24"×24")',
                  '800 × 800 mm (32"×32")',
                  '1200 × 600 mm (48"×24")',
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTileCallout(preset.split(' ')[0] + ' ' + preset.split(' ')[1] + ' ' + preset.split(' ')[2])}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-cyan-300 border border-white/5 transition-colors font-mono"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cutting Wastage (%)</label>
                <input
                  type="number"
                  value={tileWastePct}
                  onChange={e => setTileWastePct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">5% straight, 10% diagonal</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tiles per Packaging Box</label>
                <input
                  type="number"
                  min="1"
                  value={tilesPerBox}
                  onChange={e => setTilesPerBox(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Standard packaging box count</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Wall Paint Coating */}
        {activeTab === 'paint' && (
          <div className="space-y-4">
            <UnitInput
              label="Total Net Surface Area"
              value={paintAreaVal}
              unit={paintAreaUnit}
              category="area"
              onChangeValue={setPaintAreaVal}
              onChangeUnit={setPaintAreaUnit}
              regionalProfile={settings.regionalProfile}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Number of Coats</label>
                <input
                  type="number"
                  min="1"
                  value={paintCoats}
                  onChange={e => setPaintCoats(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Coverage (m² / Liter / Coat)</label>
                <input
                  type="number"
                  step="0.5"
                  value={paintCoverage}
                  onChange={e => setPaintCoverage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Application Wastage (%)</label>
                <input
                  type="number"
                  value={paintWastePct}
                  onChange={e => setPaintWastePct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rate per Liter ({settings.currencySymbol})</label>
                <input
                  type="number"
                  value={paintCostPerL}
                  onChange={e => setPaintCostPerL(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Output Section */}
      <div className="lg:col-span-6 space-y-4">
        <ResultPanel
          result={currentResult}
          settings={settings}
          onSaveHistory={() => onSaveHistory(currentResult)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />

        {/* Quick-Access In-Place Unit Conversion Utility */}
        <QuickUnitConverter
          settings={settings}
          defaultCategory="area"
          allowedCategories={['area', 'length', 'volume', 'mass']}
        />
      </div>
    </div>
  );
};
