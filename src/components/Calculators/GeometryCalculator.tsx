import React, { useState, useMemo } from 'react';
import { ResultPanel } from '../ResultPanel';
import { calculateGeometry } from '../../utils/calculations';
import { AppSettings, CalculationResult } from '../../types';
import { UnitInput } from '../Common/UnitInput';
import { toBase } from '../../utils/units';

interface GeometryCalculatorProps {
  settings: AppSettings;
  onSaveHistory: (result: CalculationResult) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenCustomUnitModal?: () => void;
}

export const GeometryCalculator: React.FC<GeometryCalculatorProps> = ({
  settings,
  onSaveHistory,
  isFavorite,
  onToggleFavorite,
  onOpenCustomUnitModal,
}) => {
  const [shape, setShape] = useState<'rectangle' | 'triangle' | 'circle' | 'semicircle' | 'trapezoid' | 'cylinder' | 'cone' | 'sphere'>('rectangle');

  const defaultLengthUnit = settings.unitPreferences?.length || 'm';

  const [dimAVal, setDimAVal] = useState<string>('5');
  const [dimAUnit, setDimAUnit] = useState<string>(defaultLengthUnit);

  const [dimBVal, setDimBVal] = useState<string>('3');
  const [dimBUnit, setDimBUnit] = useState<string>(defaultLengthUnit);

  const [dimCVal, setDimCVal] = useState<string>('4');
  const [dimCUnit, setDimCUnit] = useState<string>(defaultLengthUnit);

  const [radiusVal, setRadiusVal] = useState<string>('2.5');
  const [radiusUnit, setRadiusUnit] = useState<string>(defaultLengthUnit);

  const [heightVal, setHeightVal] = useState<string>('4');
  const [heightUnit, setHeightUnit] = useState<string>(defaultLengthUnit);

  const result = useMemo(() => {
    const aM = toBase(parseFloat(dimAVal) || 0, dimAUnit, 'length');
    const bM = toBase(parseFloat(dimBVal) || 0, dimBUnit, 'length');
    const cM = toBase(parseFloat(dimCVal) || 0, dimCUnit, 'length');
    const rM = toBase(parseFloat(radiusVal) || 0, radiusUnit, 'length');
    const hM = toBase(parseFloat(heightVal) || 0, heightUnit, 'length');

    const res = calculateGeometry(shape, {
      a: aM,
      b: bM,
      c: cM,
      r: rM,
      h: hM,
    });

    const is3D = ['cylinder', 'cone', 'sphere'].includes(shape);
    res.primaryCategory = is3D ? 'volume' : 'area';
    return res;
  }, [shape, dimAVal, dimAUnit, dimBVal, dimBUnit, dimCVal, dimCUnit, radiusVal, radiusUnit, heightVal, heightUnit]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-6 rounded-xl border border-white/10 bg-[#111827] p-6 space-y-5 no-print">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Select Geometric Shape
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'rectangle', label: 'Rectangle' },
                { id: 'triangle', label: 'Triangle' },
                { id: 'circle', label: 'Circle' },
                { id: 'semicircle', label: 'Semicircle' },
                { id: 'trapezoid', label: 'Trapezoid' },
                { id: 'cylinder', label: 'Cylinder' },
                { id: 'cone', label: 'Cone' },
                { id: 'sphere', label: 'Sphere' },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShape(s.id as any)}
                  className={`p-2 rounded-lg border text-center text-xs font-medium transition-colors ${
                    shape === s.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/5 bg-[#151C2B] text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Inputs according to shape with UnitInput */}
          <div className="space-y-3">
            {shape === 'rectangle' && (
              <div className="grid grid-cols-2 gap-3">
                <UnitInput
                  label="Length (a)"
                  value={dimAVal}
                  unit={dimAUnit}
                  category="length"
                  onChangeValue={setDimAVal}
                  onChangeUnit={setDimAUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Width (b)"
                  value={dimBVal}
                  unit={dimBUnit}
                  category="length"
                  onChangeValue={setDimBVal}
                  onChangeUnit={setDimBUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            )}

            {shape === 'triangle' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <UnitInput
                    label="Base (b)"
                    value={dimBVal}
                    unit={dimBUnit}
                    category="length"
                    onChangeValue={setDimBVal}
                    onChangeUnit={setDimBUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                  <UnitInput
                    label="Vertical Height (h)"
                    value={heightVal}
                    unit={heightUnit}
                    category="length"
                    onChangeValue={setHeightVal}
                    onChangeUnit={setHeightUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <UnitInput
                    label="Side a (optional for perimeter)"
                    value={dimAVal}
                    unit={dimAUnit}
                    category="length"
                    onChangeValue={setDimAVal}
                    onChangeUnit={setDimAUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                  <UnitInput
                    label="Side c (optional for perimeter)"
                    value={dimCVal}
                    unit={dimCUnit}
                    category="length"
                    onChangeValue={setDimCVal}
                    onChangeUnit={setDimCUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                </div>
              </div>
            )}

            {(shape === 'circle' || shape === 'semicircle') && (
              <UnitInput
                label="Radius (r)"
                value={radiusVal}
                unit={radiusUnit}
                category="length"
                onChangeValue={setRadiusVal}
                onChangeUnit={setRadiusUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            )}

            {shape === 'trapezoid' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <UnitInput
                    label="Parallel Base 1 (a)"
                    value={dimAVal}
                    unit={dimAUnit}
                    category="length"
                    onChangeValue={setDimAVal}
                    onChangeUnit={setDimAUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                  <UnitInput
                    label="Parallel Base 2 (b)"
                    value={dimBVal}
                    unit={dimBUnit}
                    category="length"
                    onChangeValue={setDimBVal}
                    onChangeUnit={setDimBUnit}
                    onOpenCustomUnitModal={onOpenCustomUnitModal}
                  />
                </div>
                <UnitInput
                  label="Perpendicular Height (h)"
                  value={heightVal}
                  unit={heightUnit}
                  category="length"
                  onChangeValue={setHeightVal}
                  onChangeUnit={setHeightUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            )}

            {(shape === 'cylinder' || shape === 'cone') && (
              <div className="grid grid-cols-2 gap-3">
                <UnitInput
                  label="Base Radius (r)"
                  value={radiusVal}
                  unit={radiusUnit}
                  category="length"
                  onChangeValue={setRadiusVal}
                  onChangeUnit={setRadiusUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
                <UnitInput
                  label="Height (h)"
                  value={heightVal}
                  unit={heightUnit}
                  category="length"
                  onChangeValue={setHeightVal}
                  onChangeUnit={setHeightUnit}
                  onOpenCustomUnitModal={onOpenCustomUnitModal}
                />
              </div>
            )}

            {shape === 'sphere' && (
              <UnitInput
                label="Sphere Radius (r)"
                value={radiusVal}
                unit={radiusUnit}
                category="length"
                onChangeValue={setRadiusVal}
                onChangeUnit={setRadiusUnit}
                onOpenCustomUnitModal={onOpenCustomUnitModal}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RESULT PANEL */}
        <div className="lg:col-span-6">
          <ResultPanel
            result={result}
            settings={settings}
            onSaveHistory={() => onSaveHistory(result)}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      </div>
    </div>
  );
};
