import React, { useState, useMemo, useEffect } from 'react';
import { ResultPanel } from '../ResultPanel';
import { calculateEarthwork, calculateTruckLoads } from '../../utils/calculations';
import { AppSettings, CalculationResult } from '../../types';
import { formatNumber, formatCurrency, toBase, fromBase } from '../../utils/units';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';

interface EarthworkCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const EarthworkCalculator: React.FC<EarthworkCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const getInitialTab = (): 'excavation' | 'soil_conversion' | 'truck_loads' | 'prismoidal' => {
    if (activeView === 'soil-conversion') return 'soil_conversion';
    if (activeView === 'truck-loads') return 'truck_loads';
    if (activeView === 'mean-prismoidal') return 'prismoidal';
    return 'excavation';
  };

  const [activeTab, setActiveTab] = useState<'excavation' | 'soil_conversion' | 'truck_loads' | 'prismoidal'>(getInitialTab);

  useEffect(() => {
    if (activeView) {
      if (activeView === 'soil-conversion') setActiveTab('soil_conversion');
      else if (activeView === 'truck-loads') setActiveTab('truck_loads');
      else if (activeView === 'mean-prismoidal') setActiveTab('prismoidal');
      else if (activeView === 'earthwork-excavation') setActiveTab('excavation');
    }
  }, [activeView]);

  const defaultLengthUnit = settings.unitPreferences?.length || 'm';
  const defaultVolumeUnit = settings.unitPreferences?.volume || 'm3';

  // Excavation State with Independent Unit Selectors
  const [excavType, setExcavType] = useState<'rectangular' | 'trapezoidal_trench' | 'pit_sloped'>('rectangular');

  const [lengthVal, setLengthVal] = useState<string>('20');
  const [lengthUnit, setLengthUnit] = useState<string>(defaultLengthUnit);

  const [widthVal, setWidthVal] = useState<string>('10');
  const [widthUnit, setWidthUnit] = useState<string>('ft'); // Allows mixed e.g. 20m × 10ft × 1.5m!

  const [depthVal, setDepthVal] = useState<string>('1.5');
  const [depthUnit, setDepthUnit] = useState<string>('m');

  const [sideSlopeM, setSideSlopeM] = useState<string>('1'); // 1:1 slope
  const [truckCapVal, setTruckCapVal] = useState<string>('5');
  const [truckCapUnit, setTruckCapUnit] = useState<string>(defaultVolumeUnit);
  const [bulkingFactor, setBulkingFactor] = useState<string>('1.25');

  // Soil Volume Conversion State
  const [soilInputVolVal, setSoilInputVolVal] = useState<string>('100');
  const [soilInputVolUnit, setSoilInputVolUnit] = useState<string>(defaultVolumeUnit);
  const [soilInputType, setSoilInputType] = useState<'bank' | 'loose' | 'compacted'>('bank');
  const [soilBulking, setSoilBulking] = useState<string>('1.25'); // +25%
  const [soilShrinkage, setSoilShrinkage] = useState<string>('0.85'); // -15%

  // Truck Haulage State
  const [haulBankVolVal, setHaulBankVolVal] = useState<string>('120');
  const [haulBankVolUnit, setHaulBankVolUnit] = useState<string>(defaultVolumeUnit);
  const [haulBulking, setHaulBulking] = useState<string>('1.25');
  const [haulVehicleCapVal, setHaulVehicleCapVal] = useState<string>('5');
  const [haulVehicleCapUnit, setHaulVehicleCapUnit] = useState<string>(defaultVolumeUnit);
  const [haulTripRate, setHaulTripRate] = useState<string>('1200');

  // Prismoidal Road State
  const [roadLengthVal, setRoadLengthVal] = useState<string>('100');
  const [roadLengthUnit, setRoadLengthUnit] = useState<string>(defaultLengthUnit);
  const [area1Val, setArea1Val] = useState<string>('12');
  const [area1Unit, setArea1Unit] = useState<string>('m2');
  const [area2Val, setArea2Val] = useState<string>('18');
  const [area2Unit, setArea2Unit] = useState<string>('m2');
  const [areaMidVal, setAreaMidVal] = useState<string>('14.8');
  const [areaMidUnit, setAreaMidUnit] = useState<string>('m2');

  // Excavation Result with Independent Dimensions Normalization
  const excavResult = useMemo(() => {
    const lM = toBase(parseFloat(lengthVal) || 0, lengthUnit, 'length', { regionalProfile: settings.regionalProfile });
    const wM = toBase(parseFloat(widthVal) || 0, widthUnit, 'length', { regionalProfile: settings.regionalProfile });
    const dM = toBase(parseFloat(depthVal) || 0, depthUnit, 'length', { regionalProfile: settings.regionalProfile });
    const truckCapM3 = toBase(parseFloat(truckCapVal) || 5, truckCapUnit, 'volume', { regionalProfile: settings.regionalProfile });

    const res = calculateEarthwork(excavType, {
      lengthM: lM,
      widthM: wM,
      depthM: dM,
      sideSlopeM: parseFloat(sideSlopeM) || 1,
      truckCapacityM3: truckCapM3,
      bulkingFactor: parseFloat(bulkingFactor) || 1.25,
    });
    res.primaryCategory = 'volume';
    res.inputsSummary = [
      { label: 'Length Input', value: `${lengthVal} ${lengthUnit} (${formatNumber(lM, 3)} m)` },
      { label: 'Width Input', value: `${widthVal} ${widthUnit} (${formatNumber(wM, 3)} m)` },
      { label: 'Depth Input', value: `${depthVal} ${depthUnit} (${formatNumber(dM, 3)} m)` },
      { label: 'Truck Capacity', value: `${truckCapVal} ${truckCapUnit} (${formatNumber(truckCapM3, 2)} m³)` },
    ];
    return res;
  }, [excavType, lengthVal, lengthUnit, widthVal, widthUnit, depthVal, depthUnit, sideSlopeM, truckCapVal, truckCapUnit, bulkingFactor, settings]);

  // Soil Conversion Result
  const soilResult: CalculationResult = useMemo(() => {
    const inputVolM3 = toBase(parseFloat(soilInputVolVal) || 0, soilInputVolUnit, 'volume', {
      regionalProfile: settings.regionalProfile,
    });
    const B = Math.max(1, parseFloat(soilBulking) || 1.25);
    const S = Math.max(0.1, parseFloat(soilShrinkage) || 0.85);

    let bankM3 = 0;
    let looseM3 = 0;
    let compactedM3 = 0;

    if (soilInputType === 'bank') {
      bankM3 = inputVolM3;
      looseM3 = bankM3 * B;
      compactedM3 = bankM3 * S;
    } else if (soilInputType === 'loose') {
      looseM3 = inputVolM3;
      bankM3 = looseM3 / B;
      compactedM3 = bankM3 * S;
    } else {
      compactedM3 = inputVolM3;
      bankM3 = compactedM3 / S;
      looseM3 = bankM3 * B;
    }

    return {
      title: 'Soil Volume Conversion (Bank, Loose, Compacted)',
      primaryValue: formatNumber(looseM3, 2),
      primaryUnit: 'm³',
      primaryCategory: 'volume',
      primaryRawValue: looseM3,
      secondaryValues: [
        { label: 'Loose Volume in CFT', value: formatNumber(looseM3 * 35.3147, 1), unit: 'CFT' },
        { label: 'Bank Volume (In-situ)', value: `${formatNumber(bankM3, 2)} m³ (${formatNumber(bankM3 * 35.3147, 1)} CFT)` },
        { label: 'Compacted Fill (CCM)', value: `${formatNumber(compactedM3, 2)} m³ (${formatNumber(compactedM3 * 35.3147, 1)} CFT)` },
        { label: 'Bulking Swell Allowance', value: `+${formatNumber((B - 1) * 100, 1)}%` },
      ],
      breakdown: [
        { step: '1. In-situ Bank Cut Volume (BCM)', expression: `Baseline natural ground state`, result: `${formatNumber(bankM3, 2)} m³` },
        { step: '2. Loose Truck Hauling Volume (LCM)', expression: `BCM × ${B} (Bulking Factor)`, result: `${formatNumber(looseM3, 2)} m³` },
        { step: '3. Compacted Fill Volume (CCM)', expression: `BCM × ${S} (Compaction Factor)`, result: `${formatNumber(compactedM3, 2)} m³` },
      ],
      formula: 'Loose Vol = Bank Vol × Bulking Factor | Compacted Vol = Bank Vol × Shrinkage Factor',
      substitutedFormula: `Loose = ${formatNumber(bankM3, 2)} × ${B} = ${formatNumber(looseM3, 2)} m³ | Compacted = ${formatNumber(bankM3, 2)} × ${S} = ${formatNumber(compactedM3, 2)} m³`,
      inputsSummary: [
        { label: 'Input State', value: soilInputType.toUpperCase() },
        { label: 'Input Quantity', value: `${soilInputVolVal} ${soilInputVolUnit} (${formatNumber(inputVolM3, 2)} m³)` },
        { label: 'Bulking Factor', value: `${B} (+${formatNumber((B - 1) * 100, 0)}%)` },
      ],
      assumptions: [
        { label: 'Soil Type Context', value: 'Ordinary clayey silt / loam expands 20-30% upon excavation.' },
        { label: 'Compaction Effort', value: 'Standard Proctor or heavy sheep-foot roller compaction.' },
      ],
      engineeringNotes: 'Contract payment in tenders is strictly based on In-Situ Bank Cut Volume (BCM). Trucks must be dispatched based on Loose Cut Volume (LCM).',
    };
  }, [soilInputVolVal, soilInputVolUnit, soilInputType, soilBulking, soilShrinkage, settings]);

  // Truck Haulage Calculation
  const truckResult = useMemo(() => {
    const bankM3 = toBase(parseFloat(haulBankVolVal) || 0, haulBankVolUnit, 'volume', {
      regionalProfile: settings.regionalProfile,
    });
    const capM3 = toBase(parseFloat(haulVehicleCapVal) || 5, haulVehicleCapUnit, 'volume', {
      regionalProfile: settings.regionalProfile,
    });
    const rate = parseFloat(haulTripRate) || 0;
    const bulking = parseFloat(haulBulking) || 1.25;

    const res = calculateTruckLoads({
      excavatedBankVolM3: bankM3,
      bulkingFactor: bulking,
      vehicleCapacityM3: capM3,
      tripRate: rate,
    });
    res.primaryCategory = 'common';
    return res;
  }, [haulBankVolVal, haulBankVolUnit, haulBulking, haulVehicleCapVal, haulVehicleCapUnit, haulTripRate, settings]);

  // Prismoidal Road Volume Result
  const prismoidalResult: CalculationResult = useMemo(() => {
    const L = toBase(parseFloat(roadLengthVal) || 0, roadLengthUnit, 'length');
    const A1 = toBase(parseFloat(area1Val) || 0, area1Unit, 'area');
    const A2 = toBase(parseFloat(area2Val) || 0, area2Unit, 'area');
    const Am = toBase(parseFloat(areaMidVal) || 0, areaMidUnit, 'area');

    // Prismoidal Formula: V = (L / 6) * (A1 + 4*Am + A2)
    const volPrismoidalM3 = (L / 6) * (A1 + 4 * Am + A2);
    // Trapezoidal / End-Area Formula: V = (L / 2) * (A1 + A2)
    const volEndAreaM3 = (L / 2) * (A1 + A2);
    const prismoidalCorrection = volEndAreaM3 - volPrismoidalM3;

    return {
      title: 'Prismoidal Road & Canal Earthwork Volume',
      primaryValue: formatNumber(volPrismoidalM3, 2),
      primaryUnit: 'm³',
      primaryCategory: 'volume',
      primaryRawValue: volPrismoidalM3,
      secondaryValues: [
        { label: 'Volume in CFT', value: formatNumber(volPrismoidalM3 * 35.3147, 1), unit: 'CFT' },
        { label: 'End-Area Method (Approximation)', value: `${formatNumber(volEndAreaM3, 2)} m³` },
        { label: 'Prismoidal Correction (Cp)', value: `${formatNumber(prismoidalCorrection, 2)} m³` },
      ],
      breakdown: [
        { step: '1. Simpson’s Prismoidal Rule', expression: `(L / 6) × [A1 + (4 × Am) + A2]`, result: `${formatNumber(volPrismoidalM3, 2)} m³` },
        { step: '2. Average End Area Comparison', expression: `(L / 2) × (A1 + A2)`, result: `${formatNumber(volEndAreaM3, 2)} m³` },
      ],
      formula: 'V_prismoidal = (L / 6) × (A1 + 4·Am + A2)',
      substitutedFormula: `V = (${L}/6) × (${formatNumber(A1, 2)} + 4×${formatNumber(Am, 2)} + ${formatNumber(A2, 2)}) = ${formatNumber(volPrismoidalM3, 2)} m³`,
      inputsSummary: [
        { label: 'Road Segment Length', value: `${roadLengthVal} ${roadLengthUnit} (${formatNumber(L, 2)} m)` },
        { label: 'Initial Station Area (A1)', value: `${area1Val} ${area1Unit}` },
        { label: 'Mid-Section Area (Am)', value: `${areaMidVal} ${areaMidUnit}` },
        { label: 'End Station Area (A2)', value: `${area2Val} ${area2Unit}` },
      ],
      assumptions: [
        { label: 'Accuracy', value: 'Prismoidal formula is mathematically exact for ruled surface prismoids.' },
      ],
      engineeringNotes: 'The average end-area method almost always overestimates earthwork volume compared to the prismoidal rule.',
    };
  }, [roadLengthVal, roadLengthUnit, area1Val, area1Unit, area2Val, area2Unit, areaMidVal, areaMidUnit]);

  const activeResult = useMemo(() => {
    switch (activeTab) {
      case 'excavation': return excavResult;
      case 'soil_conversion': return soilResult;
      case 'truck_loads': return truckResult;
      case 'prismoidal': return prismoidalResult;
    }
  }, [activeTab, excavResult, soilResult, truckResult, prismoidalResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Section */}
      <div className="lg:col-span-6 space-y-6 no-print">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
          {[
            { id: 'excavation', label: 'Excavation Pit / Trench' },
            { id: 'soil_conversion', label: 'Bank / Loose / Compact' },
            { id: 'truck_loads', label: 'Truck Hauling & Cost' },
            { id: 'prismoidal', label: 'Prismoidal Alignment' },
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

        {/* Tab 1: Excavation */}
        {activeTab === 'excavation' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Trench / Pit Geometry</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rectangular', label: 'Vertical Rectangular' },
                  { id: 'trapezoidal_trench', label: 'Trapezoidal Trench' },
                  { id: 'pit_sloped', label: 'Sloped Foundation Pit' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExcavType(t.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-colors text-center ${
                      excavType === t.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'border-white/10 bg-[#111827] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Independent Length, Width, Depth Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UnitInput
                label="Excavation Length"
                value={lengthVal}
                unit={lengthUnit}
                category="length"
                onChangeValue={setLengthVal}
                onChangeUnit={setLengthUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Bottom Width"
                value={widthVal}
                unit={widthUnit}
                category="length"
                onChangeValue={setWidthVal}
                onChangeUnit={setWidthUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Excavation Depth"
                value={depthVal}
                unit={depthUnit}
                category="length"
                onChangeValue={setDepthVal}
                onChangeUnit={setDepthUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Dump Truck Capacity"
                value={truckCapVal}
                unit={truckCapUnit}
                category="volume"
                onChangeValue={setTruckCapVal}
                onChangeUnit={setTruckCapUnit}
                regionalProfile={settings.regionalProfile}
                helperText="Loose hauling volume"
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Bulking Swell Factor</label>
                <input
                  type="number"
                  step="0.05"
                  value={bulkingFactor}
                  onChange={e => setBulkingFactor(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default 1.25 (25% volume expansion)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Soil Conversion */}
        {activeTab === 'soil_conversion' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Input Soil Volume"
                value={soilInputVolVal}
                unit={soilInputVolUnit}
                category="volume"
                onChangeValue={setSoilInputVolVal}
                onChangeUnit={setSoilInputVolUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Baseline Soil Condition</label>
                <select
                  value={soilInputType}
                  onChange={e => setSoilInputType(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="bank">Bank Measure (In-situ Natural Ground)</option>
                  <option value="loose">Loose Measure (Loaded on Truck)</option>
                  <option value="compacted">Compacted Measure (Rolled Embankment)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Bulking Swell Factor (B)</label>
                <input
                  type="number"
                  step="0.05"
                  value={soilBulking}
                  onChange={e => setSoilBulking(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Compaction Factor (S)</label>
                <input
                  type="number"
                  step="0.05"
                  value={soilShrinkage}
                  onChange={e => setSoilShrinkage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Truck Loads */}
        {activeTab === 'truck_loads' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UnitInput
                label="Total In-situ Bank Cut Volume"
                value={haulBankVolVal}
                unit={haulBankVolUnit}
                category="volume"
                onChangeValue={setHaulBankVolVal}
                onChangeUnit={setHaulBankVolUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Vehicle Payload Capacity"
                value={haulVehicleCapVal}
                unit={haulVehicleCapUnit}
                category="volume"
                onChangeValue={setHaulVehicleCapVal}
                onChangeUnit={setHaulVehicleCapUnit}
                regionalProfile={settings.regionalProfile}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Bulking Factor</label>
                <input
                  type="number"
                  step="0.05"
                  value={haulBulking}
                  onChange={e => setHaulBulking(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cost per Trip ({settings.currencySymbol})</label>
                <input
                  type="number"
                  value={haulTripRate}
                  onChange={e => setHaulTripRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Prismoidal Alignment */}
        {activeTab === 'prismoidal' && (
          <div className="space-y-4">
            <UnitInput
              label="Distance Between End Sections (L)"
              value={roadLengthVal}
              unit={roadLengthUnit}
              category="length"
              onChangeValue={setRoadLengthVal}
              onChangeUnit={setRoadLengthUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UnitInput
                label="Station 1 Area (A1)"
                value={area1Val}
                unit={area1Unit}
                category="area"
                onChangeValue={setArea1Val}
                onChangeUnit={setArea1Unit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Mid-Section Area (Am)"
                value={areaMidVal}
                unit={areaMidUnit}
                category="area"
                onChangeValue={setAreaMidVal}
                onChangeUnit={setAreaMidUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Station 2 Area (A2)"
                value={area2Val}
                unit={area2Unit}
                category="area"
                onChangeValue={setArea2Val}
                onChangeUnit={setArea2Unit}
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
          defaultCategory="volume"
          allowedCategories={['volume', 'length', 'area', 'mass']}
        />
      </div>
    </div>
  );
};
