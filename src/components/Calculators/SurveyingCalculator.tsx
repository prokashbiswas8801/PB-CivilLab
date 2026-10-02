import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import {
  calculateSurveyLevelHI,
  calculateSurveyRiseAndFall,
  calculateSlopeGradient,
  convertDMS,
  calculateCoordinates,
  calculateChainage,
} from '../../utils/calculations';
import { AppSettings, CalculationResult, SurveyLevelRow } from '../../types';
import { formatNumber, toBase, fromBase, parseSlope, parseDMS, formatDMS } from '../../utils/units';
import { Plus, Trash2, CheckCircle2, AlertCircle, Compass, ArrowRight } from 'lucide-react';
import { UnitInput } from '../Common/UnitInput';
import { QuickUnitConverter } from '../Common/QuickUnitConverter';

interface SurveyingCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeView?: string;
  onOpenCustomUnitModal?: () => void;
}

export const SurveyingCalculator: React.FC<SurveyingCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  activeView,
  onOpenCustomUnitModal,
}) => {
  const getInitialTab = (): 'level_hi' | 'level_rise_fall' | 'slope' | 'dms' | 'coords' | 'chainage' => {
    if (activeView === 'level-rise-fall') return 'level_rise_fall';
    if (activeView === 'slope-gradient') return 'slope';
    if (activeView === 'dms-converter') return 'dms';
    if (activeView === 'coordinate-distance') return 'coords';
    if (activeView === 'chainage-calculator') return 'chainage';
    return 'level_hi';
  };

  const [activeTab, setActiveTab] = useState<'level_hi' | 'level_rise_fall' | 'slope' | 'dms' | 'coords' | 'chainage'>(getInitialTab);

  React.useEffect(() => {
    if (activeView) {
      if (activeView === 'level-rise-fall') setActiveTab('level_rise_fall');
      else if (activeView === 'slope-gradient') setActiveTab('slope');
      else if (activeView === 'dms-converter') setActiveTab('dms');
      else if (activeView === 'coordinate-distance') setActiveTab('coords');
      else if (activeView === 'chainage-calculator') setActiveTab('chainage');
      else if (activeView === 'level-hi-method') setActiveTab('level_hi');
    }
  }, [activeView]);

  const defaultLengthUnit = settings.unitPreferences?.length || 'm';

  // HI Method State
  const [benchmarkRL, setBenchmarkRL] = useState<string>('100.000');
  const [levelUnit, setLevelUnit] = useState<string>(defaultLengthUnit);
  const [hiRows, setHiRows] = useState<SurveyLevelRow[]>([
    { id: '1', station: 'BM 1', bs: 1.450, rl: 100.000, remarks: 'Bench Mark on Culvert' },
    { id: '2', station: 'Stn A', is: 1.820, rl: 0 },
    { id: '3', station: 'Stn B', is: 2.150, rl: 0 },
    { id: '4', station: 'CP 1', fs: 2.450, rl: 0, remarks: 'Change Point' },
  ]);

  // Rise and Fall State
  const [rfRows, setRfRows] = useState<SurveyLevelRow[]>([
    { id: '1', station: 'BM 1', bs: 1.450, rl: 100.000, remarks: 'Initial Benchmark' },
    { id: '2', station: 'Stn A', is: 1.820, rl: 0 },
    { id: '3', station: 'Stn B', is: 2.150, rl: 0 },
    { id: '4', station: 'Stn C', fs: 2.450, rl: 0 },
  ]);

  // Slope & Gradient State
  const [slopeInputMode, setSlopeInputMode] = useState<'rise_run' | 'direct_format'>('rise_run');
  const [riseVal, setRiseVal] = useState<string>('2.5');
  const [riseUnit, setRiseUnit] = useState<string>(defaultLengthUnit);
  const [runVal, setRunVal] = useState<string>('50');
  const [runUnit, setRunUnit] = useState<string>(defaultLengthUnit);
  const [directSlopeText, setDirectSlopeText] = useState<string>('1:20');

  // DMS State
  const [dmsStringInput, setDmsStringInput] = useState<string>('45° 30\' 20"');
  const [decDegrees, setDecDegrees] = useState<string>('45.505556');
  const [dmsMode, setDmsMode] = useState<'string_to_dec' | 'dec_to_string'>('string_to_dec');

  // Coordinates State
  const [x1Val, setX1Val] = useState<string>('500000');
  const [y1Val, setY1Val] = useState<string>('2630000');
  const [x2Val, setX2Val] = useState<string>('500350');
  const [y2Val, setY2Val] = useState<string>('2630450');
  const [coordUnit, setCoordUnit] = useState<string>(defaultLengthUnit);

  // Chainage State
  const [startChainageVal, setStartChainageVal] = useState<string>('0');
  const [totalDistVal, setTotalDistVal] = useState<string>('500');
  const [chainIntervalVal, setChainIntervalVal] = useState<string>('50');
  const [chainUnit, setChainUnit] = useState<string>(defaultLengthUnit);

  // Level HI calculation
  const hiCalcResult = useMemo(() => {
    const updated = [...hiRows];
    if (updated[0]) updated[0].rl = parseFloat(benchmarkRL) || 100;
    return calculateSurveyLevelHI(updated);
  }, [hiRows, benchmarkRL]);

  // Level Rise & Fall calculation
  const rfCalcResult = useMemo(() => {
    const updated = [...rfRows];
    if (updated[0]) updated[0].rl = parseFloat(benchmarkRL) || 100;
    return calculateSurveyRiseAndFall(updated);
  }, [rfRows, benchmarkRL]);

  // Slope Calculation with Direct Notation or Rise/Run
  const slopeResult = useMemo(() => {
    if (slopeInputMode === 'direct_format') {
      const parsed = parseSlope(directSlopeText);
      const riseM = parsed.percent;
      const runM = 100;
      const res = calculateSlopeGradient(riseM, runM);
      res.title = `Slope Evaluation: ${directSlopeText}`;
      res.inputsSummary = [
        { label: 'Entered Notation', value: directSlopeText },
        { label: 'Equivalent Ratio', value: parsed.ratioString },
        { label: 'Percentage Grade', value: `${formatNumber(parsed.percent, 2)}%` },
        { label: 'Decimal Grade', value: formatNumber(parsed.decimal, 4) },
        { label: 'Angle in Degrees', value: `${formatNumber(parsed.angleDeg, 2)}°` },
      ];
      return res;
    }
    const rM = toBase(parseFloat(riseVal) || 0, riseUnit, 'length');
    const rnM = toBase(parseFloat(runVal) || 1, runUnit, 'length');
    const res = calculateSlopeGradient(rM, rnM);
    res.inputsSummary = [
      { label: 'Rise Input', value: `${riseVal} ${riseUnit} (${formatNumber(rM, 3)} m)` },
      { label: 'Run Input', value: `${runVal} ${runUnit} (${formatNumber(rnM, 3)} m)` },
    ];
    return res;
  }, [slopeInputMode, directSlopeText, riseVal, riseUnit, runVal, runUnit]);

  // Coordinates Calculation
  const coordsResult = useMemo(() => {
    const p1x = toBase(parseFloat(x1Val) || 0, coordUnit, 'length');
    const p1y = toBase(parseFloat(y1Val) || 0, coordUnit, 'length');
    const p2x = toBase(parseFloat(x2Val) || 0, coordUnit, 'length');
    const p2y = toBase(parseFloat(y2Val) || 0, coordUnit, 'length');

    const res = calculateCoordinates(p1x, p1y, p2x, p2y);
    res.primaryCategory = 'length';
    return res;
  }, [x1Val, y1Val, x2Val, y2Val, coordUnit]);

  // DMS Result with string parser
  const dmsResult: CalculationResult = useMemo(() => {
    if (dmsMode === 'string_to_dec') {
      const parsed = parseDMS(dmsStringInput);
      const rad = (parsed.decimalDegrees * Math.PI) / 180;
      const grad = parsed.decimalDegrees / 0.9;

      return {
        title: 'Surveying Angular Conversion (DMS → Decimal)',
        primaryValue: formatNumber(parsed.decimalDegrees, 6),
        primaryUnit: 'degrees (°)',
        primaryCategory: 'angle',
        primaryRawValue: parsed.decimalDegrees,
        secondaryValues: [
          { label: 'DMS Formatted', value: parsed.formatted },
          { label: 'Radians (rad)', value: formatNumber(rad, 6), unit: 'rad' },
          { label: 'Gradians (grad/gon)', value: formatNumber(grad, 4), unit: 'grad' },
        ],
        breakdown: [
          { step: '1. Degrees, Minutes, Seconds Parts', expression: `${parsed.degrees}° + ${parsed.minutes}' + ${parsed.seconds.toFixed(2)}"`, result: parsed.formatted },
          { step: '2. Decimal Formula', expression: `Deg + (Min / 60) + (Sec / 3600)`, result: `${formatNumber(parsed.decimalDegrees, 6)}°` },
          { step: '3. Radian Conversion', expression: `(${formatNumber(parsed.decimalDegrees, 6)} × π) / 180`, result: `${formatNumber(rad, 6)} rad` },
        ],
        formula: 'Decimal Degrees = Degrees + (Minutes / 60) + (Seconds / 3600)',
        substitutedFormula: `Dec = ${parsed.degrees} + (${parsed.minutes}/60) + (${parsed.seconds.toFixed(2)}/3600) = ${formatNumber(parsed.decimalDegrees, 6)}°`,
        inputsSummary: [
          { label: 'Input String', value: dmsStringInput },
          { label: 'Parsed DMS', value: parsed.formatted },
        ],
        assumptions: [
          { label: 'Standard Angle', value: 'Angles normalized to 360° circle.' },
        ],
        engineeringNotes: 'Total station and theodolite instruments typically output azimuth and horizontal angles in DMS format.',
      };
    } else {
      const dec = parseFloat(decDegrees) || 0;
      const formatted = formatDMS(dec);
      const rad = (dec * Math.PI) / 180;

      return {
        title: 'Decimal Degrees to DMS Conversion',
        primaryValue: formatted,
        primaryUnit: 'DMS',
        primaryCategory: 'angle',
        primaryRawValue: dec,
        secondaryValues: [
          { label: 'Decimal Degrees', value: `${formatNumber(dec, 6)}°` },
          { label: 'Radians', value: formatNumber(rad, 6), unit: 'rad' },
        ],
        breakdown: [
          { step: '1. Extract Whole Degrees', expression: `floor(${dec})`, result: `${Math.floor(dec)}°` },
          { step: '2. Remainder to Minutes', expression: `(${dec} - ${Math.floor(dec)}) × 60`, result: `${formatNumber((dec - Math.floor(dec)) * 60, 2)}'` },
        ],
        formula: 'DMS = Deg° Min\' Sec"',
        substitutedFormula: `${dec}° → ${formatted}`,
        inputsSummary: [{ label: 'Decimal Degrees', value: `${dec}°` }],
        assumptions: [],
      };
    }
  }, [dmsMode, dmsStringInput, decDegrees]);

  const hiFormattedResult: CalculationResult = useMemo(() => {
    return {
      title: 'Leveling Field Book (HI Method)',
      primaryValue: formatNumber(hiCalcResult.lastRL, 3),
      primaryUnit: 'm (Final RL)',
      primaryCategory: 'length',
      primaryRawValue: hiCalcResult.lastRL,
      secondaryValues: [
        { label: 'Initial Benchmark RL', value: `${formatNumber(hiCalcResult.firstRL, 3)} m` },
        { label: 'Σ Backsights (ΣBS)', value: `${formatNumber(hiCalcResult.sumBS, 3)} m` },
        { label: 'Σ Foresights (ΣFS)', value: `${formatNumber(hiCalcResult.sumFS, 3)} m` },
        { label: 'ΣBS - ΣFS', value: `${formatNumber(hiCalcResult.diffBS_FS, 3)} m` },
        { label: 'Last RL - First RL', value: `${formatNumber(hiCalcResult.diffRL, 3)} m` },
        { label: 'Arithmetic Check', value: hiCalcResult.isBalanced ? 'Balanced ✓' : 'Mismatch ⚠️' },
      ],
      breakdown: [
        { step: '1. Arithmetic Verification Check', expression: 'ΣBS - ΣFS = Last RL - First RL', result: `${hiCalcResult.diffBS_FS} = ${hiCalcResult.diffRL} (${hiCalcResult.isBalanced ? 'OK' : 'Error'})` },
        { step: '2. Height of Instrument (HI)', expression: 'HI = RL + BS', result: 'Calculated across instrument setups' },
        { step: '3. Reduced Level (RL)', expression: 'RL = HI - IS (or HI - FS)', result: `Final RL = ${formatNumber(hiCalcResult.lastRL, 3)} m` },
      ],
      formula: 'HI = RL + BS | RL = HI - Staff Reading | Check: ΣBS - ΣFS = Last RL - First RL',
      substitutedFormula: `${formatNumber(hiCalcResult.sumBS, 3)} - ${formatNumber(hiCalcResult.sumFS, 3)} = ${formatNumber(hiCalcResult.diffBS_FS, 3)} m`,
      inputsSummary: [
        { label: 'Total Sights', value: `${hiCalcResult.rows.length} stations` },
        { label: 'Starting Bench Mark RL', value: `${benchmarkRL} ${levelUnit}` },
      ],
      assumptions: [
        { label: 'Curvature & Refraction', value: 'Ignored for sights under 100m. Equalize BS and FS lengths to eliminate collimation error.' },
      ],
      engineeringNotes: hiCalcResult.isBalanced ? 'Field book arithmetic check passes perfectly.' : 'Warning: Arithmetic check does not balance. Check entry values.',
    };
  }, [hiCalcResult, benchmarkRL, levelUnit]);

  const rfFormattedResult: CalculationResult = useMemo(() => {
    return {
      title: 'Leveling Field Book (Rise & Fall Method)',
      primaryValue: formatNumber(rfCalcResult.lastRL, 3),
      primaryUnit: 'm (Final RL)',
      primaryCategory: 'length',
      primaryRawValue: rfCalcResult.lastRL,
      secondaryValues: [
        { label: 'Initial Benchmark RL', value: `${formatNumber(rfCalcResult.firstRL, 3)} m` },
        { label: 'Σ Backsight - Σ Foresight', value: `${formatNumber(rfCalcResult.diffBS_FS, 3)} m` },
        { label: 'Σ Rise - Σ Fall', value: `${formatNumber(rfCalcResult.diffRise_Fall, 3)} m` },
        { label: 'Last RL - First RL', value: `${formatNumber(rfCalcResult.diffRL, 3)} m` },
        { label: 'Three-Fold Check', value: rfCalcResult.isBalanced ? 'Balanced ✓' : 'Mismatch ⚠️' },
      ],
      breakdown: [
        { step: '1. Three-Way Arithmetic Check', expression: 'ΣBS - ΣFS = ΣRise - ΣFall = Last RL - First RL', result: `${rfCalcResult.diffBS_FS} = ${rfCalcResult.diffRise_Fall} = ${rfCalcResult.diffRL}` },
        { step: '2. Rise / Fall Evaluation', expression: 'Previous Sight - Current Sight', result: 'Evaluated between successive stations' },
      ],
      formula: 'Rise / Fall = Prev Sight - Next Sight | 3-Fold Check: ΣBS - ΣFS = ΣRise - ΣFall = Last RL - First RL',
      substitutedFormula: `ΣBS - ΣFS = ${formatNumber(rfCalcResult.diffBS_FS, 3)} m | ΣRise - ΣFall = ${formatNumber(rfCalcResult.diffRise_Fall, 3)} m`,
      inputsSummary: [
        { label: 'Total Stations', value: `${rfCalcResult.rows.length} stations` },
        { label: 'Benchmark RL', value: `${benchmarkRL} ${levelUnit}` },
      ],
      assumptions: [],
      engineeringNotes: rfCalcResult.isBalanced ? 'Rise & Fall 3-fold check verified.' : 'Check arithmetic entries.',
    };
  }, [rfCalcResult, benchmarkRL, levelUnit]);

  // Chainage Result
  const chainageResult: CalculationResult = useMemo(() => {
    const startM = toBase(parseFloat(startChainageVal) || 0, chainUnit, 'length');
    const distM = toBase(parseFloat(totalDistVal) || 500, chainUnit, 'length');
    const intM = toBase(parseFloat(chainIntervalVal) || 50, chainUnit, 'length');

    const data = calculateChainage(startM, distM, intM);
    const endStation = data.stations[data.stations.length - 1]?.chainageStr || '0+000';
    const firstStation = data.stations[0]?.chainageStr || '0+000';

    return {
      title: 'Road & Route Chainage Alignment',
      primaryValue: endStation,
      primaryUnit: 'End Station',
      primaryCategory: 'length',
      secondaryValues: [
        { label: 'Start Station', value: firstStation },
        { label: 'Total Distance', value: `${formatNumber(distM, 2)} m` },
        { label: 'Station Interval', value: `${formatNumber(intM, 2)} m` },
        { label: 'Total Stations/Pegs', value: `${data.stations.length}` },
      ],
      breakdown: data.stations.slice(0, 8).map(st => ({
        step: `Peg #${st.index + 1}`,
        expression: `Station ${st.chainageStr}`,
        result: `${formatNumber(st.distanceM, 2)} m`,
      })),
      formula: 'Chainage = (km) + (meters)',
      substitutedFormula: `From ${firstStation} to ${endStation} over ${formatNumber(distM, 2)} m`,
      inputsSummary: [
        { label: 'Start Distance', value: `${startChainageVal} ${chainUnit}` },
        { label: 'Total Length', value: `${totalDistVal} ${chainUnit}` },
        { label: 'Peg Interval', value: `${chainIntervalVal} ${chainUnit}` },
      ],
      assumptions: [
        { label: 'Station Format', value: 'Standard metric road chainage: 1+250.0 means 1 km + 250 m from origin datum.' },
      ],
      engineeringNotes: 'Used for cross-section leveling, earthwork mass-haul diagrams, and culvert peg locations.',
    };
  }, [startChainageVal, totalDistVal, chainIntervalVal, chainUnit]);

  const activeResult = useMemo(() => {
    switch (activeTab) {
      case 'level_hi': return hiFormattedResult;
      case 'level_rise_fall': return rfFormattedResult;
      case 'slope': return slopeResult;
      case 'coords': return coordsResult;
      case 'dms': return dmsResult;
      case 'chainage': return chainageResult;
    }
  }, [activeTab, hiFormattedResult, rfFormattedResult, slopeResult, coordsResult, dmsResult, chainageResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Section */}
      <div className="lg:col-span-6 space-y-6 no-print">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
          {[
            { id: 'level_hi', label: 'Leveling: HI Method' },
            { id: 'level_rise_fall', label: 'Rise & Fall Method' },
            { id: 'slope', label: 'Slope & Gradient' },
            { id: 'dms', label: 'DMS ⇄ Degrees' },
            { id: 'coords', label: 'Coordinates / Bearing' },
            { id: 'chainage', label: 'Road Chainage' },
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

        {/* Tab: Leveling HI Method */}
        {activeTab === 'level_hi' && (
          <div className="space-y-4">
            <UnitInput
              label="Initial Benchmark Reduced Level (BM RL)"
              value={benchmarkRL}
              unit={levelUnit}
              category="length"
              onChangeValue={setBenchmarkRL}
              onChangeUnit={setLevelUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0F172A]">
              <div className="p-3 bg-[#151C2B] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Level Field Book (HI Method)</span>
                <button
                  type="button"
                  onClick={() =>
                    setHiRows([
                      ...hiRows,
                      { id: Date.now().toString(), station: `Stn ${String.fromCharCode(65 + hiRows.length)}`, is: 1.5, rl: 0 },
                    ])
                  }
                  className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sight</span>
                </button>
              </div>

              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                {hiRows.map((r, idx) => (
                  <div key={r.id} className="p-2.5 grid grid-cols-5 gap-2 items-center text-xs">
                    <input
                      type="text"
                      value={r.station}
                      onChange={e => {
                        const copy = [...hiRows];
                        copy[idx].station = e.target.value;
                        setHiRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-slate-200 font-mono text-xs border border-white/5"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="BS"
                      value={r.bs ?? ''}
                      onChange={e => {
                        const copy = [...hiRows];
                        copy[idx].bs = e.target.value ? parseFloat(e.target.value) : undefined;
                        setHiRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-cyan-300 font-mono text-xs border border-white/5"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="IS"
                      value={r.is ?? ''}
                      onChange={e => {
                        const copy = [...hiRows];
                        copy[idx].is = e.target.value ? parseFloat(e.target.value) : undefined;
                        setHiRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-slate-200 font-mono text-xs border border-white/5"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="FS"
                      value={r.fs ?? ''}
                      onChange={e => {
                        const copy = [...hiRows];
                        copy[idx].fs = e.target.value ? parseFloat(e.target.value) : undefined;
                        setHiRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-amber-300 font-mono text-xs border border-white/5"
                    />
                    <button
                      type="button"
                      onClick={() => setHiRows(hiRows.filter(row => row.id !== r.id))}
                      className="p-1 text-slate-500 hover:text-rose-400 justify-self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Rise & Fall Method */}
        {activeTab === 'level_rise_fall' && (
          <div className="space-y-4">
            <UnitInput
              label="Benchmark Reduced Level"
              value={benchmarkRL}
              unit={levelUnit}
              category="length"
              onChangeValue={setBenchmarkRL}
              onChangeUnit={setLevelUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />

            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0F172A]">
              <div className="p-3 bg-[#151C2B] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Field Book (Rise & Fall)</span>
                <button
                  type="button"
                  onClick={() =>
                    setRfRows([
                      ...rfRows,
                      { id: Date.now().toString(), station: `Stn ${String.fromCharCode(65 + rfRows.length)}`, is: 1.5, rl: 0 },
                    ])
                  }
                  className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sight</span>
                </button>
              </div>

              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                {rfRows.map((r, idx) => (
                  <div key={r.id} className="p-2.5 grid grid-cols-5 gap-2 items-center text-xs">
                    <input
                      type="text"
                      value={r.station}
                      onChange={e => {
                        const copy = [...rfRows];
                        copy[idx].station = e.target.value;
                        setRfRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-slate-200 font-mono text-xs border border-white/5"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="BS"
                      value={r.bs ?? ''}
                      onChange={e => {
                        const copy = [...rfRows];
                        copy[idx].bs = e.target.value ? parseFloat(e.target.value) : undefined;
                        setRfRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-cyan-300 font-mono text-xs border border-white/5"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="IS"
                      value={r.is ?? ''}
                      onChange={e => {
                        const copy = [...rfRows];
                        copy[idx].is = e.target.value ? parseFloat(e.target.value) : undefined;
                        setRfRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-slate-200 font-mono text-xs border border-white/5"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="FS"
                      value={r.fs ?? ''}
                      onChange={e => {
                        const copy = [...rfRows];
                        copy[idx].fs = e.target.value ? parseFloat(e.target.value) : undefined;
                        setRfRows(copy);
                      }}
                      className="rounded bg-[#111827] px-2 py-1 text-amber-300 font-mono text-xs border border-white/5"
                    />
                    <button
                      type="button"
                      onClick={() => setRfRows(rfRows.filter(row => row.id !== r.id))}
                      className="p-1 text-slate-500 hover:text-rose-400 justify-self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Slope & Gradient */}
        {activeTab === 'slope' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSlopeInputMode('rise_run')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  slopeInputMode === 'rise_run'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-[#111827] text-slate-400'
                }`}
              >
                Rise / Run Input
              </button>
              <button
                type="button"
                onClick={() => setSlopeInputMode('direct_format')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  slopeInputMode === 'direct_format'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-[#111827] text-slate-400'
                }`}
              >
                Direct Notation (1:20 / 5% / 2.86°)
              </button>
            </div>

            {slopeInputMode === 'rise_run' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UnitInput
                  label="Vertical Rise / Fall (Δh)"
                  value={riseVal}
                  unit={riseUnit}
                  category="length"
                  onChangeValue={setRiseVal}
                  onChangeUnit={setRiseUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Horizontal Run (L)"
                  value={runVal}
                  unit={runUnit}
                  category="length"
                  onChangeValue={setRunVal}
                  onChangeUnit={setRunUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Slope Notation (1:N, %, decimal or degrees)
                </label>
                <input
                  type="text"
                  value={directSlopeText}
                  onChange={e => setDirectSlopeText(e.target.value)}
                  placeholder="e.g. 1:20, 5%, 0.05, 2.86°"
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {['1:20 (5%)', '1:50 (2%)', '1:100 (1%)', '1:1.5 (66.7%)'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDirectSlopeText(preset.split(' ')[0])}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-cyan-300 border border-white/5 transition-colors font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: DMS Converter */}
        {activeTab === 'dms' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDmsMode('string_to_dec')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  dmsMode === 'string_to_dec'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-[#111827] text-slate-400'
                }`}
              >
                DMS (45° 30' 20") → Decimal
              </button>
              <button
                type="button"
                onClick={() => setDmsMode('dec_to_string')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  dmsMode === 'dec_to_string'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-[#111827] text-slate-400'
                }`}
              >
                Decimal Degrees → DMS
              </button>
            </div>

            {dmsMode === 'string_to_dec' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">DMS Angle String</label>
                <input
                  type="text"
                  value={dmsStringInput}
                  onChange={e => setDmsStringInput(e.target.value)}
                  placeholder={'e.g. 45° 30\' 20" or 45d 30m 20s'}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {['45° 30\' 20"', '23° 48\' 37"', '90° 0\' 0"', '120° 15\' 45"'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDmsStringInput(preset)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-cyan-300 border border-white/5 transition-colors font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Decimal Degrees (°)</label>
                <input
                  type="number"
                  step="any"
                  value={decDegrees}
                  onChange={e => setDecDegrees(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab: Coordinates & Bearing */}
        {activeTab === 'coords' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Station 1 Easting (X1)"
                value={x1Val}
                unit={coordUnit}
                category="length"
                onChangeValue={setX1Val}
                onChangeUnit={setCoordUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Station 1 Northing (Y1)"
                value={y1Val}
                unit={coordUnit}
                category="length"
                onChangeValue={setY1Val}
                onChangeUnit={setCoordUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Station 2 Easting (X2)"
                value={x2Val}
                unit={coordUnit}
                category="length"
                onChangeValue={setX2Val}
                onChangeUnit={setCoordUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Station 2 Northing (Y2)"
                value={y2Val}
                unit={coordUnit}
                category="length"
                onChangeValue={setY2Val}
                onChangeUnit={setCoordUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            </div>
          </div>
        )}

        {/* Tab: Chainage */}
        {activeTab === 'chainage' && (
          <div className="space-y-4">
            <UnitInput
              label="Starting Chainage"
              value={startChainageVal}
              unit={chainUnit}
              category="length"
              onChangeValue={setStartChainageVal}
              onChangeUnit={setChainUnit}
              onOpenCustomUnitModal={onOpenCustomUnitModal}
            />
            <div className="grid grid-cols-2 gap-3">
              <UnitInput
                label="Total Alignment Distance"
                value={totalDistVal}
                unit={chainUnit}
                category="length"
                onChangeValue={setTotalDistVal}
                onChangeUnit={setChainUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
              <UnitInput
                label="Peg / Station Interval"
                value={chainIntervalVal}
                unit={chainUnit}
                category="length"
                onChangeValue={setChainIntervalVal}
                onChangeUnit={setChainUnit}
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
          allowedCategories={['length', 'area', 'slope']}
        />
      </div>
    </div>
  );
};
