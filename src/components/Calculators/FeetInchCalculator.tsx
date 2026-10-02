import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import { parseFeetInches, formatFeetInches, formatNumber } from '../../utils/units';
import { AppSettings, CalculationResult } from '../../types';
import { Plus, Minus, ArrowRight, Check } from 'lucide-react';

interface FeetInchCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenCustomUnitModal?: () => void;
}

export const FeetInchCalculator: React.FC<FeetInchCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
}) => {
  const [calculatorMode, setCalculatorMode] = useState<'parser' | 'arithmetic'>('parser');
  const [inputValue, setInputValue] = useState<string>("12'-6\"");

  // Arithmetic Mode State
  const [dim1, setDim1] = useState<string>("12'-6\"");
  const [op, setOp] = useState<'+' | '-'>('+');
  const [dim2, setDim2] = useState<string>("8'-4 1/2\"");

  const parsed = useMemo(() => {
    return parseFeetInches(inputValue);
  }, [inputValue]);

  // Parser Mode Result
  const parserResult: CalculationResult = useMemo(() => {
    if (!parsed.isValid) {
      return {
        title: 'Feet-Inch Dimension Parser',
        primaryValue: 'Invalid Format',
        primaryUnit: '',
        breakdown: [
          {
            step: 'Syntax Guide',
            expression: 'Examples: 12\'-6", 12 ft 6 in, 12.5 ft, 150 in, 3810 mm, 3.81 m',
            result: 'Please enter a valid format',
          },
        ],
        formula: 'Feet-Inch String Normalizer',
        substitutedFormula: inputValue,
        inputsSummary: [{ label: 'Raw String', value: inputValue }],
        assumptions: [{ label: 'Notation', value: 'Supports feet (\'), inches ("), fractional inches (e.g. 1/2, 3/4), or decimal.' }],
      };
    }

    return {
      title: 'Feet-Inch Dimension Parser & Formatter',
      primaryValue: formatNumber(parsed.meters, 4),
      primaryUnit: 'm',
      primaryCategory: 'length',
      primaryRawValue: parsed.meters,
      secondaryValues: [
        { label: 'Architectural Format', value: parsed.normalizedString },
        { label: 'Decimal Feet', value: `${formatNumber(parsed.totalFeet, 4)} ft` },
        { label: 'Millimeters', value: `${formatNumber(parsed.millimeters, 1)} mm` },
        { label: 'Total Decimal Inches', value: `${formatNumber(parsed.totalInches, 2)} in` },
      ],
      breakdown: [
        { step: '1. Parse Architectural Notation', expression: inputValue, result: parsed.normalizedString },
        { step: '2. Decimal Feet Equivalent', expression: `${formatNumber(parsed.totalInches, 3)} in ÷ 12`, result: `${formatNumber(parsed.totalFeet, 4)} ft` },
        { step: '3. Metric SI Conversion (Meters)', expression: `${formatNumber(parsed.totalInches, 3)} in × 0.0254`, result: `${formatNumber(parsed.meters, 4)} m` },
        { step: '4. Metric Millimeters', expression: `${formatNumber(parsed.meters, 4)} m × 1000`, result: `${formatNumber(parsed.millimeters, 1)} mm` },
      ],
      formula: 'Meters = TotalInches × 0.0254 | Decimal Feet = TotalInches ÷ 12',
      substitutedFormula: `${parsed.normalizedString} → ${formatNumber(parsed.totalFeet, 4)} ft = ${formatNumber(parsed.meters, 4)} m = ${formatNumber(parsed.millimeters, 1)} mm`,
      inputsSummary: [{ label: 'Input String', value: inputValue }],
      assumptions: [{ label: 'Standard Conversion', value: '1 inch = exactly 25.4 mm (0.0254 m); 1 foot = 12 inches.' }],
      engineeringNotes: 'Used on site when architectural drawings use imperial feet-inch fractions while structural reinforcement schedules or GPS surveys require metric millimeters and meters.',
    };
  }, [parsed, inputValue]);

  // Arithmetic Mode Result
  const arithmeticResult: CalculationResult = useMemo(() => {
    const p1 = parseFeetInches(dim1);
    const p2 = parseFeetInches(dim2);

    if (!p1.isValid || !p2.isValid) {
      return {
        title: 'Feet-Inch Construction Arithmetic',
        primaryValue: 'Invalid Dimension',
        primaryUnit: '',
        breakdown: [],
        formula: 'L_total = L1 ± L2',
        substitutedFormula: `${dim1} ${op} ${dim2}`,
        inputsSummary: [],
        assumptions: [],
      };
    }

    const totalFeet = op === '+' ? p1.totalFeet + p2.totalFeet : Math.max(0, p1.totalFeet - p2.totalFeet);
    const totalM = totalFeet * 0.3048;
    const formattedArch = formatFeetInches(totalFeet);

    return {
      title: `Construction Dimension Arithmetic (${op === '+' ? 'Addition' : 'Subtraction'})`,
      primaryValue: formattedArch,
      primaryUnit: 'Architectural Length',
      primaryCategory: 'length',
      primaryRawValue: totalM,
      secondaryValues: [
        { label: 'Decimal Feet', value: `${formatNumber(totalFeet, 4)} ft` },
        { label: 'Meters', value: `${formatNumber(totalM, 4)} m` },
        { label: 'Millimeters', value: `${formatNumber(totalM * 1000, 1)} mm` },
        { label: 'Total Inches', value: `${formatNumber(totalFeet * 12, 2)} in` },
      ],
      breakdown: [
        { step: '1. First Dimension', expression: dim1, result: `${formatNumber(p1.totalFeet, 4)} ft (${p1.normalizedString})` },
        { step: '2. Second Dimension', expression: dim2, result: `${formatNumber(p2.totalFeet, 4)} ft (${p2.normalizedString})` },
        { step: '3. Decimal Arithmetic', expression: `${formatNumber(p1.totalFeet, 4)} ${op} ${formatNumber(p2.totalFeet, 4)}`, result: `${formatNumber(totalFeet, 4)} ft` },
        { step: '4. Re-format Architectural', expression: `Feet + Remaining Inches Fraction`, result: formattedArch },
      ],
      formula: `L_total = L1 ${op} L2`,
      substitutedFormula: `${p1.normalizedString} ${op} ${p2.normalizedString} = ${formattedArch} (${formatNumber(totalFeet, 3)} ft / ${formatNumber(totalM, 3)} m)`,
      inputsSummary: [
        { label: 'Dimension 1', value: `${dim1} (${p1.normalizedString})` },
        { label: 'Operation', value: op === '+' ? 'Addition (+)' : 'Subtraction (-)' },
        { label: 'Dimension 2', value: `${dim2} (${p2.normalizedString})` },
      ],
      assumptions: [],
    };
  }, [dim1, dim2, op]);

  const activeResult = calculatorMode === 'parser' ? parserResult : arithmeticResult;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 rounded-xl border border-white/10 bg-[#111827] p-6 space-y-5 no-print">
          {/* Mode Switch */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCalculatorMode('parser')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                calculatorMode === 'parser'
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/10 bg-[#151C2B] text-slate-400'
              }`}
            >
              Dimension Parser & Formats
            </button>
            <button
              type="button"
              onClick={() => setCalculatorMode('arithmetic')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                calculatorMode === 'arithmetic'
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/10 bg-[#151C2B] text-slate-400'
              }`}
            >
              Feet-Inch Arithmetic (±)
            </button>
          </div>

          {calculatorMode === 'parser' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Enter Dimension in Any Common Construction Notation
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={'e.g. 12\'-6", 12 ft 6 in, 12.5 ft, 150 in, 3810 mm'}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-lg font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Test Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "12'-6\"",
                    "12 ft 6 in",
                    "12' 4 1/2\"",
                    "12.50 ft",
                    "3810 mm",
                    "3.810 m",
                  ].map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputValue(val)}
                      className="p-2 rounded-lg border border-white/5 bg-[#151C2B] hover:bg-white/10 hover:border-cyan-500/30 text-xs font-mono text-slate-300 text-left transition-colors"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formatting Previews */}
              {parsed.isValid && (
                <div className="p-4 rounded-xl border border-white/5 bg-[#151C2B] space-y-2 text-xs">
                  <span className="font-semibold text-slate-300 block mb-1">Standard Format Equivalents:</span>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2 rounded bg-[#0B0F19] text-slate-300">
                      <span className="text-[10px] text-slate-500 block">Decimal Feet:</span>
                      {formatNumber(parsed.totalFeet, 2)} ft
                    </div>
                    <div className="p-2 rounded bg-[#0B0F19] text-cyan-300 font-bold">
                      <span className="text-[10px] text-slate-500 block">Architectural:</span>
                      {parsed.normalizedString}
                    </div>
                    <div className="p-2 rounded bg-[#0B0F19] text-slate-300">
                      <span className="text-[10px] text-slate-500 block">Millimeters:</span>
                      {formatNumber(parsed.millimeters, 0)} mm
                    </div>
                    <div className="p-2 rounded bg-[#0B0F19] text-slate-300">
                      <span className="text-[10px] text-slate-500 block">Meters:</span>
                      {formatNumber(parsed.meters, 3)} m
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">First Dimension (L1)</label>
                <input
                  type="text"
                  value={dim1}
                  onChange={e => setDim1(e.target.value)}
                  placeholder={'e.g. 12\'-6"'}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-base font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setOp('+')}
                  className={`w-12 h-10 rounded-xl border font-bold text-base flex items-center justify-center transition-colors ${
                    op === '+'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-[#151C2B] text-slate-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOp('-')}
                  className={`w-12 h-10 rounded-xl border font-bold text-base flex items-center justify-center transition-colors ${
                    op === '-'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-[#151C2B] text-slate-400'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Second Dimension (L2)</label>
                <input
                  type="text"
                  value={dim2}
                  onChange={e => setDim2(e.target.value)}
                  placeholder={'e.g. 8\'-4 1/2"'}
                  className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-base font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6">
          <ResultPanel
            result={activeResult}
            settings={settings}
            onSaveHistory={() => onSaveHistory(activeResult)}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      </div>
    </div>
  );
};
