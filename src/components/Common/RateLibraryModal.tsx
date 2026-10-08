import React, { useState, useEffect } from 'react';
import { RateLibraryItem, AppSettings } from '../../types';
import { Coins, Plus, Trash2, Edit3, Check, X, Calendar, MapPin, Tag } from 'lucide-react';
import { useToast } from './Toast';

interface RateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onApplyRate?: (rateItem: RateLibraryItem) => void;
}

const DEFAULT_BASELINE_RATES: RateLibraryItem[] = [
  {
    id: 'rate_1',
    name: '500W TMT Deformed Rebar',
    category: 'material',
    rate: 95.0,
    currency: 'BDT',
    unit: 'kg',
    supplierOrRegion: 'BSRM / AKS Mill Gate, Chittagong',
    dateEntered: '2026-03-15',
    notes: 'Grade 72.5 / 500W high-yield deformed bar per BDS ISO 6935-2.',
  },
  {
    id: 'rate_2',
    name: 'Ordinary Portland Cement (53 Grade / CEM I)',
    category: 'material',
    rate: 540.0,
    currency: 'BDT',
    unit: 'bag (50 kg)',
    supplierOrRegion: 'Dhaka Regional Depots',
    dateEntered: '2026-03-20',
    notes: '50 kg standard bag packing compliant with BDS EN 197-1.',
  },
  {
    id: 'rate_3',
    name: 'Coarse Sand (FM 2.5 Sylhet Sand)',
    category: 'material',
    rate: 55.0,
    currency: 'BDT',
    unit: 'CFT',
    supplierOrRegion: 'Sylhet Quarry / Site Delivery',
    dateEntered: '2026-03-10',
    notes: 'Clean riverbed coarse aggregate for high-strength concrete mixes.',
  },
  {
    id: 'rate_4',
    name: 'Crushed Stone Aggregate (20 mm Dowki Stone)',
    category: 'material',
    rate: 185.0,
    currency: 'BDT',
    unit: 'CFT',
    supplierOrRegion: 'Bholaganj / Jaflong Crushing Yards',
    dateEntered: '2026-03-12',
    notes: 'Graded crushed basaltic stone 20 mm down.',
  },
  {
    id: 'rate_5',
    name: 'Head Mason / Bar Bender (Skilled)',
    category: 'labor',
    rate: 1100.0,
    currency: 'BDT',
    unit: 'day (8 hrs)',
    supplierOrRegion: 'Metropolitan Construction Union',
    dateEntered: '2026-01-10',
    notes: 'Skilled structural mason / BBS technician.',
  },
  {
    id: 'rate_6',
    name: 'General Construction Helper (Unskilled)',
    category: 'labor',
    rate: 700.0,
    currency: 'BDT',
    unit: 'day (8 hrs)',
    supplierOrRegion: 'Jobsite Daily Wage',
    dateEntered: '2026-01-10',
    notes: 'Material handling and concrete placing helper.',
  },
  {
    id: 'rate_7',
    name: 'Needle Vibrator with Operator',
    category: 'equipment',
    rate: 1500.0,
    currency: 'BDT',
    unit: 'day',
    supplierOrRegion: 'Local Plant Hire',
    dateEntered: '2026-02-01',
    notes: 'Petrol vibrator with 40 mm needle.',
  },
];

export const RateLibraryModal: React.FC<RateLibraryModalProps> = ({
  isOpen,
  onClose,
  settings,
  onApplyRate,
}) => {
  const toast = useToast();
  const [rates, setRates] = useState<RateLibraryItem[]>(() => {
    try {
      const stored = localStorage.getItem('pb_civillab_rate_library');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_BASELINE_RATES;
  });

  const [filterCategory, setFilterCategory] = useState<'all' | 'material' | 'labor' | 'equipment'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New item form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<'material' | 'labor' | 'equipment'>('material');
  const [itemRate, setItemRate] = useState('');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemRegion, setItemRegion] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('pb_civillab_rate_library', JSON.stringify(rates));
    } catch {}
  }, [rates]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(itemRate);
    if (!itemName.trim() || isNaN(parsedRate) || parsedRate <= 0) {
      toast.error('Please provide a valid item name and positive rate');
      return;
    }

    const newItem: RateLibraryItem = {
      id: `rate_${Date.now()}`,
      name: itemName.trim(),
      category: itemCategory,
      rate: parsedRate,
      currency: settings.currency || 'BDT',
      unit: itemUnit.trim() || 'unit',
      supplierOrRegion: itemRegion.trim() || undefined,
      dateEntered: new Date().toISOString().slice(0, 10),
      notes: itemNotes.trim() || undefined,
    };

    setRates(prev => [newItem, ...prev]);
    setIsAdding(false);
    setItemName('');
    setItemRate('');
    setItemRegion('');
    setItemNotes('');
    toast.success(`Added "${newItem.name}" to rate library`);
  };

  const handleDelete = (id: string, name: string) => {
    setRates(prev => prev.filter(r => r.id !== id));
    toast.info(`Removed "${name}" from rate library`);
  };

  const filteredRates = rates.filter(r => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#151D2C]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Civil Construction Rate Library
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-normal">
                  User-Supplied & Local
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track dated market rates with supplier references for accurate project estimation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-100 dark:bg-[#111827] border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {(['all', 'material', 'labor', 'equipment'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filterCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-[#151D2C] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Market Rate</span>
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border-b border-cyan-500/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Item Name (e.g. 500W Rebar)"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="sm:col-span-2 rounded-xl border border-cyan-500/30 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                required
              />
              <select
                value={itemCategory}
                onChange={e => setItemCategory(e.target.value as any)}
                className="rounded-xl border border-cyan-500/30 bg-white dark:bg-[#0F172A] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="material">Material</option>
                <option value="labor">Labor</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex rounded-xl border border-cyan-500/30 bg-white dark:bg-[#0F172A] overflow-hidden">
                <input
                  type="number"
                  step="any"
                  placeholder="Rate"
                  value={itemRate}
                  onChange={e => setItemRate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                  required
                />
                <span className="px-2 py-1.5 bg-slate-100 dark:bg-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center">
                  {settings.currencySymbol || '৳'}
                </span>
              </div>
              <input
                type="text"
                placeholder="Unit (e.g. kg, CFT, bag, day)"
                value={itemUnit}
                onChange={e => setItemUnit(e.target.value)}
                className="rounded-xl border border-cyan-500/30 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Supplier / Region Note"
                value={itemRegion}
                onChange={e => setItemRegion(e.target.value)}
                className="rounded-xl border border-cyan-500/30 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Save Rate
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-white/5">
          {filteredRates.map(r => (
            <div
              key={r.id}
              className="pt-2.5 first:pt-0 p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#111827] flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/10 transition-all"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {r.name}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold ${
                    r.category === 'material'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                      : r.category === 'labor'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {r.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  <span>{settings.currencySymbol || '৳'}{r.rate.toLocaleString()}</span>
                  <span className="text-slate-400 font-normal">/ {r.unit}</span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                  {r.supplierOrRegion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{r.supplierOrRegion}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Entered: {r.dateEntered}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onApplyRate && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyRate(r);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Apply Rate
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(r.id, r.name)}
                  title="Remove Rate"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#151D2C] border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Rates are stored locally and fully editable.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
