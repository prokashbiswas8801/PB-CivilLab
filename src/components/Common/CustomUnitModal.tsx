import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sliders, Check, HelpCircle, Layers } from 'lucide-react';
import { CustomUnit } from '../../types';
import {
  BUILTIN_UNIT_CATEGORIES,
  loadCustomUnits,
  addCustomUnit,
  deleteCustomUnit,
} from '../../utils/units';

interface CustomUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnitsUpdated?: () => void;
}

export const CustomUnitModal: React.FC<CustomUnitModalProps> = ({
  isOpen,
  onClose,
  onUnitsUpdated,
}) => {
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [category, setCategory] = useState('length');
  const [factorToBase, setFactorToBase] = useState('1');
  const [civilNote, setCivilNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomUnits(loadCustomUnits());
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategoryData = BUILTIN_UNIT_CATEGORIES[category] || BUILTIN_UNIT_CATEGORIES.length;
  const baseSymbol = currentCategoryData.baseSymbol;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();
    const factorNum = parseFloat(factorToBase);

    if (!trimmedName) {
      setError('Please provide a descriptive unit name.');
      return;
    }
    if (!trimmedSymbol) {
      setError('Please provide a unit symbol (e.g. SBB, CFT-spec).');
      return;
    }
    if (isNaN(factorNum) || factorNum <= 0) {
      setError('Conversion factor must be a positive number.');
      return;
    }

    addCustomUnit({
      name: trimmedName,
      symbol: trimmedSymbol,
      category,
      factorToBase: factorNum,
      baseUnitSymbol: baseSymbol,
      civilNote: civilNote.trim() || `1 ${trimmedSymbol} = ${factorNum} ${baseSymbol}`,
    });

    setCustomUnits(loadCustomUnits());
    setName('');
    setSymbol('');
    setFactorToBase('1');
    setCivilNote('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    if (onUnitsUpdated) onUnitsUpdated();
  };

  const handleDelete = (id: string) => {
    deleteCustomUnit(id);
    setCustomUnits(loadCustomUnits());
    if (onUnitsUpdated) onUnitsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Custom Engineering Unit Manager</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Define custom jobsite measurements and local conversions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create Unit Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/20 space-y-4">
            <h4 className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Custom Unit</span>
            </h4>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                <span>Custom unit added successfully! Available in all selectors.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Physical Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {Object.values(BUILTIN_UNIT_CATEGORIES).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (Base: {cat.baseSymbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Unit Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Site Batch Box"
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Display Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  placeholder="e.g. SBB"
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Conversion Factor (1 {symbol || 'Unit'} = ? {baseSymbol})
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="any"
                    value={factorToBase}
                    onChange={e => setFactorToBase(e.target.value)}
                    placeholder="1.0"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                  <span className="absolute right-3 text-xs text-cyan-600 dark:text-cyan-400 font-mono pointer-events-none">
                    {baseSymbol}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes / Site Context (Optional)</label>
              <input
                type="text"
                value={civilNote}
                onChange={e => setCivilNote(e.target.value)}
                placeholder="e.g. Standard wooden gauge box (1.25 CFT = 0.0354 m³)"
                className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Formula:{' '}
                <span className="font-mono text-cyan-700 dark:text-cyan-300">
                  1 {symbol || 'Custom'} = {factorToBase || '1'} {baseSymbol}
                </span>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Custom Unit</span>
              </button>
            </div>
          </form>

          {/* Existing Custom Units List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Active Custom Units ({customUnits.length})</span>
            </h4>

            {customUnits.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#111827]/40 text-center text-xs text-slate-500">
                No custom units defined yet. Create your first jobsite measurement unit above.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#111827] overflow-hidden">
                {customUnits.map(cu => (
                  <div key={cu.id} className="p-3.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{cu.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-mono text-[11px] border border-cyan-200 dark:border-cyan-500/20">
                          {cu.symbol}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          ({cu.category})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-1">
                        1 {cu.symbol} = {cu.factorToBase} {cu.baseUnitSymbol}
                        {cu.civilNote && <span className="font-sans text-slate-500 ml-2">· {cu.civilNote}</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(cu.id)}
                      title="Delete unit"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-rose-500/40 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#151C2B] flex items-center justify-between text-xs text-slate-400">
          <span>Custom units are stored locally and immediately available across all calculators.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
