import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, ArrowLeftRight, Check, Plus, Info, AlertCircle } from 'lucide-react';
import {
  getUnitsForCategory,
  toBase,
  fromBase,
  formatNumber,
  parseFeetInches,
  UnitDefinition,
  UnitOptions,
} from '../../utils/units';
import { RegionalProfile } from '../../types';

export interface UnitInputProps {
  label: string;
  value: string;
  unit: string;
  category: string;
  onChangeValue: (newVal: string) => void;
  onChangeUnit: (newUnit: string) => void;
  options?: UnitOptions;
  regionalProfile?: RegionalProfile;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  helperText?: string;
  alternateUnit?: string;
  onSwapUnit?: () => void;
  onOpenCustomUnitModal?: () => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const UnitInput: React.FC<UnitInputProps> = ({
  label,
  value,
  unit,
  category,
  onChangeValue,
  onChangeUnit,
  options,
  regionalProfile,
  placeholder = '0.00',
  min,
  max,
  helperText,
  alternateUnit,
  onSwapUnit,
  onOpenCustomUnitModal,
  disabled = false,
  className = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const unitOptions: UnitOptions = useMemo(() => {
    return {
      regionalProfile: regionalProfile || options?.regionalProfile,
      cementBagKg: options?.cementBagKg,
      customUnits: options?.customUnits,
    };
  }, [regionalProfile, options]);

  const availableUnits = useMemo(() => {
    return getUnitsForCategory(category, unitOptions);
  }, [category, unitOptions]);

  const currentUnitDef = useMemo(() => {
    return availableUnits.find(u => u.id === unit || u.symbol === unit) || availableUnits[0];
  }, [availableUnits, unit]);

  // Track recent units in localStorage
  const recentUnitIds = useMemo(() => {
    try {
      const stored = localStorage.getItem('pb_civillab_recent_units');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  // Filtered units based on search
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableUnits;
    return availableUnits.filter(u => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.symbol.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.aliases && u.aliases.some(a => a.toLowerCase().includes(q))) ||
        (u.civilNote && u.civilNote.toLowerCase().includes(q))
      );
    });
  }, [availableUnits, searchQuery]);

  // Grouped units for organized display
  const groupedUnits = useMemo(() => {
    if (searchQuery.trim()) {
      return [{ groupName: 'Search Results', units: filteredUnits }];
    }

    const recents = availableUnits.filter(u => recentUnitIds.includes(u.id));
    const metric = availableUnits.filter(u => u.system === 'metric' || u.system === 'common');
    const imperial = availableUnits.filter(u => u.system === 'imperial' || u.system === 'construction');
    const regional = availableUnits.filter(u => u.system === 'bangladesh');
    const custom = availableUnits.filter(u => u.system === 'custom');

    const groups: { groupName: string; units: UnitDefinition[] }[] = [];
    if (recents.length > 0) groups.push({ groupName: 'Recently Used', units: recents });
    if (metric.length > 0) groups.push({ groupName: 'Metric (SI)', units: metric });
    if (imperial.length > 0) groups.push({ groupName: 'Imperial / US Standard', units: imperial });
    if (regional.length > 0) groups.push({ groupName: 'Regional Land Units', units: regional });
    if (custom.length > 0) groups.push({ groupName: 'Custom Units', units: custom });

    // Fallback if no specific systems
    if (groups.length === 0) {
      groups.push({ groupName: 'Standard Units', units: availableUnits });
    }
    return groups;
  }, [availableUnits, filteredUnits, recentUnitIds, searchQuery]);

  // Auto-conversion when unit changes (with safe comma handling)
  const handleSelectUnit = (newUnitId: string) => {
    if (newUnitId === currentUnitDef?.id) {
      setIsOpen(false);
      return;
    }

    // Save to recents
    try {
      const updated = [newUnitId, ...recentUnitIds.filter(id => id !== newUnitId)].slice(0, 6);
      localStorage.setItem('pb_civillab_recent_units', JSON.stringify(updated));
    } catch {}

    const cleanNumStr = value ? value.replace(/,/g, '').trim() : '';
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num) && num !== 0 && currentUnitDef) {
      // Convert current value to base, then to new unit
      const baseVal = toBase(num, currentUnitDef.id, category, unitOptions);
      const convertedVal = fromBase(baseVal, newUnitId, category, unitOptions);
      onChangeValue(formatNumber(convertedVal, 4).replace(/,/g, ''));
    }

    onChangeUnit(newUnitId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Safe input change handling (normalizing comma, feet-inches, etc.)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (category === 'length' && (raw.includes("'") || raw.includes('"') || /ft\b/i.test(raw))) {
      const parsed = parseFeetInches(raw);
      if (parsed.isValid && currentUnitDef) {
        const inCurrentUnit = fromBase(parsed.meters, currentUnitDef.id, 'length', unitOptions);
        onChangeValue(formatNumber(inCurrentUnit, 4).replace(/,/g, ''));
        return;
      }
    }
    onChangeValue(raw);
  };

  // Unit Swap handler
  const handleQuickSwap = () => {
    if (onSwapUnit) {
      onSwapUnit();
      return;
    }
    if (alternateUnit) {
      handleSelectUnit(alternateUnit);
    } else if (availableUnits.length > 1) {
      const otherUnit = availableUnits.find(u => u.id !== currentUnitDef?.id);
      if (otherUnit) handleSelectUnit(otherUnit.id);
    }
  };

  // Validation indicator
  const cleanVal = value ? value.replace(/,/g, '').trim() : '';
  const numValue = parseFloat(cleanVal);
  const isInvalidNumber = cleanVal !== '' && isNaN(numValue);
  const isBelowMin = min !== undefined && !isNaN(numValue) && numValue < min;
  const isAboveMax = max !== undefined && !isNaN(numValue) && numValue > max;
  const hasError = isInvalidNumber || isBelowMin || isAboveMax;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold" title="Required field">*</span>}
          {helperText && (
            <span className="text-[11px] font-normal text-slate-400 font-sans">({helperText})</span>
          )}
        </label>

        {/* Quick swap button if applicable */}
        {(onSwapUnit || alternateUnit || availableUnits.length > 1) && (
          <button
            type="button"
            onClick={handleQuickSwap}
            title="Swap to alternative unit with automatic conversion"
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-cyan-500/10"
          >
            <ArrowLeftRight className="w-2.5 h-2.5" />
            <span>⇄ Convert</span>
          </button>
        )}
      </div>

      <div
        className={`relative flex rounded-xl border bg-[#0F172A]/80 transition-all duration-150 shadow-inner ${
          hasError
            ? 'border-rose-500/60 ring-1 ring-rose-500/20'
            : 'border-white/10 hover:border-cyan-500/30 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/20'
        }`}
      >
        {/* Value Input Box */}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none"
        />

        {/* Searchable Unit Selector Dropdown Trigger */}
        <div className="relative border-l border-white/10 flex items-center" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-white/5 hover:bg-white/10 rounded-r-xl transition-colors h-full select-none"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="font-mono">{currentUnitDef?.symbol || unit}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
              }`}
            />
          </button>

          {/* Grouped & Searchable Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-80 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111827] shadow-2xl z-50 overflow-hidden backdrop-blur-md">
              {/* Unit Search Bar */}
              <div className="p-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Search ${category} units...`}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F19] pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans shadow-sm"
                  />
                </div>
              </div>

              {/* Units List Grouped */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 p-1">
                {groupedUnits.every(g => g.units.length === 0) ? (
                  <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                    No matching unit found.
                  </div>
                ) : (
                  groupedUnits.map((group, gIdx) => {
                    if (group.units.length === 0) return null;
                    return (
                      <div key={gIdx} className="py-1">
                        <span className="px-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                          {group.groupName}
                        </span>
                        <div className="space-y-0.5">
                          {group.units.map(u => {
                            const isSelected = u.id === currentUnitDef?.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleSelectUnit(u.id)}
                                className={`w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs group ${
                                  isSelected
                                    ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold'
                                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{u.symbol}</span>
                                    <span className="truncate">{u.name}</span>
                                  </div>
                                  {u.civilNote && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-sans">
                                      {u.civilNote}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {u.system && (
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                                      {u.system === 'bangladesh' ? 'BD Land' : u.system}
                                    </span>
                                  )}
                                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Custom Unit Action Footer */}
              {onOpenCustomUnitModal && (
                <div className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B]/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenCustomUnitModal();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Unit</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline non-aggressive validation hint */}
      {hasError && (
        <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>
            {isInvalidNumber
              ? 'Please enter a valid numeric value.'
              : isBelowMin
              ? `Value must be at least ${min}.`
              : `Value cannot exceed ${max}.`}
          </span>
        </div>
      )}
    </div>
  );
};
