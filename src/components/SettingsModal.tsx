import React, { useState } from 'react';
import {
  X,
  Settings,
  RotateCcw,
  Check,
  MapPin,
  DollarSign,
  Hash,
  Layers,
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  Sliders,
  Scale,
  Calculator,
} from 'lucide-react';
import { AppSettings, RegionalProfile, UnitPreferences } from '../types';
import { REGIONAL_PROFILES } from '../constants/engineering';
import { ConfirmDialog } from './Common/ConfirmDialog';
import { useToast } from './Common/Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenCustomUnitModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenCustomUnitModal,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'appearance' | 'units' | 'calculation' | 'engineering' | 'data'>('units');

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    try {
      return (localStorage.getItem('pb_civillab_theme') as any) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Units
  const [unitSystem, setUnitSystem] = useState<AppSettings['unitSystem']>(settings.unitSystem || 'metric');
  const [prefLength, setPrefLength] = useState(settings.unitPreferences?.length || 'm');
  const [prefArea, setPrefArea] = useState(settings.unitPreferences?.area || 'm2');
  const [prefVolume, setPrefVolume] = useState(settings.unitPreferences?.volume || 'm3');
  const [prefMass, setPrefMass] = useState(settings.unitPreferences?.mass || 'kg');
  const [prefPressure, setPrefPressure] = useState(settings.unitPreferences?.pressure || 'mpa');
  const [prefForce, setPrefForce] = useState(settings.unitPreferences?.force || 'kN');
  const [prefStructuralDim, setPrefStructuralDim] = useState(settings.unitPreferences?.structuralDim || 'mm');

  // Calculation
  const [decimalPrecision, setDecimalPrecision] = useState(settings.decimalPrecision ?? 2);
  const [autoRounding, setAutoRounding] = useState(true);
  const [scientificNotation, setScientificNotation] = useState(false);
  const [defaultDryFactorConcrete, setDefaultDryFactorConcrete] = useState(settings.defaultDryFactorConcrete ?? 1.54);
  const [defaultDryFactorPlaster, setDefaultDryFactorPlaster] = useState(settings.defaultDryFactorPlaster ?? 1.33);
  const [defaultCementBagKg, setDefaultCementBagKg] = useState(settings.defaultCementBagKg ?? 50);

  // Engineering & Regional
  const [currency, setCurrency] = useState(settings.currency || 'BDT');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '৳');
  const [codeProfile, setCodeProfile] = useState<'bnbc' | 'aci' | 'is' | 'astm'>('bnbc');
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('bd_standard');
  const [decimalSqFt, setDecimalSqFt] = useState(settings.regionalProfile?.decimalSqFt ?? 435.6);
  const [kathaSqFt, setKathaSqFt] = useState(settings.regionalProfile?.kathaSqFt ?? 720.0);
  const [bighaKatha, setBighaKatha] = useState(settings.regionalProfile?.bighaKatha ?? 20);

  // Confirmation Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('pb_civillab_theme', newTheme);
      const root = document.documentElement;
      if (newTheme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else if (newTheme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
        root.classList.toggle('light', !isDark);
      }
    } catch {}
    toast.info(`Theme set to ${newTheme}`);
  };

  const handleProfileSelect = (key: string) => {
    setSelectedProfileKey(key);
    const p = REGIONAL_PROFILES[key];
    if (p) {
      setDecimalSqFt(p.decimalSqFt);
      setKathaSqFt(p.kathaSqFt);
      setBighaKatha(p.bighaKatha);
    }
  };

  const handleSave = () => {
    const updatedProfile: RegionalProfile = {
      name: selectedProfileKey === 'bd_standard' ? 'Bangladesh Standard' : 'Custom Profile',
      decimalSqFt,
      kathaSqFt,
      bighaKatha,
      description: `1 Decimal = ${decimalSqFt} sq.ft, 1 Katha = ${kathaSqFt} sq.ft, 1 Bigha = ${bighaKatha} Katha`,
    };

    const unitPreferences: UnitPreferences = {
      length: prefLength,
      area: prefArea,
      volume: prefVolume,
      mass: prefMass,
      pressure: prefPressure,
      force: prefForce,
      structuralDim: prefStructuralDim,
    };

    onUpdateSettings({
      ...settings,
      currency,
      currencySymbol,
      unitSystem,
      decimalPrecision,
      defaultCementBagKg,
      defaultDryFactorConcrete,
      defaultDryFactorPlaster,
      regionalProfile: updatedProfile,
      unitPreferences,
      bangladeshProfileActive: unitSystem === 'bangladesh',
    });

    toast.success('Preferences saved successfully.');
    onClose();
  };

  const handleExportData = () => {
    try {
      const backup = {
        settings,
        history: JSON.parse(localStorage.getItem('pb_civillab_history') || '[]'),
        favorites: JSON.parse(localStorage.getItem('pb_civillab_favorites') || '[]'),
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pb_civillab_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('App data and calculations exported.');
    } catch {
      toast.error('Failed to export backup data.');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) onUpdateSettings(parsed.settings);
        if (Array.isArray(parsed.history)) localStorage.setItem('pb_civillab_history', JSON.stringify(parsed.history));
        if (Array.isArray(parsed.favorites)) localStorage.setItem('pb_civillab_favorites', JSON.stringify(parsed.favorites));
        toast.success('Backup imported successfully. Refreshing view...');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        toast.error('Invalid backup JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('pb_civillab_history');
      toast.info('Calculation history cleared.');
      setIsClearHistoryConfirmOpen(false);
      window.location.reload();
    } catch {
      toast.error('Failed to clear history.');
    }
  };

  const handleResetDefaults = () => {
    setUnitSystem('metric');
    setCurrency('BDT');
    setCurrencySymbol('৳');
    setDecimalPrecision(2);
    setDefaultCementBagKg(50);
    setDefaultDryFactorConcrete(1.54);
    setDefaultDryFactorPlaster(1.33);
    setSelectedProfileKey('bd_standard');
    setDecimalSqFt(435.6);
    setKathaSqFt(720.0);
    setBighaKatha(20);
    setPrefLength('m');
    setPrefArea('m2');
    setPrefVolume('m3');
    setPrefMass('kg');
    setPrefPressure('mpa');
    setPrefForce('kN');
    setPrefStructuralDim('mm');
    setIsResetConfirmOpen(false);
    toast.info('Preferences reset to default values.');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 no-print">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-[#151C2B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-wood font-normal text-slate-100 tracking-wide">
                  Engineering & Unit Preferences
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Multi-unit ecosystem, regional land profiles, and jobsite calibration
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close preferences"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation (Section 26) */}
          <div className="flex items-center border-b border-white/10 bg-[#111827] px-4 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'units', label: 'Units Ecosystem' },
              { id: 'calculation', label: 'Calculation' },
              { id: 'engineering', label: 'Engineering Codes' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'data', label: 'Data Management' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* 1. Units Ecosystem */}
            {activeTab === 'units' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-slate-300">
                  <p className="text-xs text-cyan-300 font-semibold mb-1">Standard Multi-Unit Calibration</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set your default unit preferences. Calculators will initialize using these units, while still allowing full individual unit conversion on the fly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Length & Distance</label>
                    <select
                      value={prefLength}
                      onChange={e => setPrefLength(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="m">Meters (m)</option>
                      <option value="ft">Feet (ft)</option>
                      <option value="mm">Millimeters (mm)</option>
                      <option value="in">Inches (in)</option>
                      <option value="km">Kilometers (km)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Area</label>
                    <select
                      value={prefArea}
                      onChange={e => setPrefArea(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="m2">Square Meters (m²)</option>
                      <option value="ft2">Square Feet (sq.ft)</option>
                      <option value="decimal">Decimal (435.6 sq.ft)</option>
                      <option value="katha">Katha (720 sq.ft)</option>
                      <option value="bigha">Bigha (14,400 sq.ft)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Volume</label>
                    <select
                      value={prefVolume}
                      onChange={e => setPrefVolume(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="m3">Cubic Meters (m³)</option>
                      <option value="cft">Cubic Feet (CFT)</option>
                      <option value="liter">Liters (L)</option>
                      <option value="gal">Gallons (US)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Mass & Steel Weight</label>
                    <select
                      value={prefMass}
                      onChange={e => setPrefMass(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="tonne">Metric Tonne (t)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="bag">Cement Bags (50kg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Stress & Pressure</label>
                    <select
                      value={prefPressure}
                      onChange={e => setPrefPressure(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="mpa">Megapascal (MPa / N/mm²)</option>
                      <option value="psi">Pounds per sq inch (psi)</option>
                      <option value="kpa">Kilopascal (kPa)</option>
                      <option value="bar">Bar</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Structural Force & Load</label>
                    <select
                      value={prefForce}
                      onChange={e => setPrefForce(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="kN">Kilonewton (kN)</option>
                      <option value="N">Newton (N)</option>
                      <option value="lbf">Pound-force (lbf)</option>
                      <option value="kip">Kip (1000 lbf)</option>
                    </select>
                  </div>
                </div>

                {onOpenCustomUnitModal && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCustomUnitModal();
                      }}
                      className="px-3.5 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 font-semibold flex items-center gap-2 hover:bg-cyan-500/20 transition-colors"
                    >
                      <span>Custom Unit Manager</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Calculation Settings */}
            {activeTab === 'calculation' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Display Decimal Precision ({decimalPrecision} places)
                  </label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDecimalPrecision(p)}
                        className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-colors ${
                          decimalPrecision === p
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-[#111827] text-slate-300 hover:bg-white/5 border border-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Concrete Dry Volume Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={defaultDryFactorConcrete}
                      onChange={e => setDefaultDryFactorConcrete(parseFloat(e.target.value) || 1.54)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Standard range: 1.52 – 1.57 (dry to wet multiplier)</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Mortar/Plaster Dry Volume Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={defaultDryFactorPlaster}
                      onChange={e => setDefaultDryFactorPlaster(parseFloat(e.target.value) || 1.33)}
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Standard range: 1.30 – 1.35</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Standard Cement Bag Mass
                  </label>
                  <div className="flex items-center gap-2">
                    {[50, 40, 42.5].map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setDefaultCementBagKg(b)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-colors ${
                          defaultCementBagKg === b
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-[#111827] text-slate-300 hover:bg-white/5 border border-white/10'
                        }`}
                      >
                        {b} kg
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Engineering Codes & Regional Land Profile */}
            {activeTab === 'engineering' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Primary Building Code Reference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bnbc', name: 'BNBC 2020', desc: 'Bangladesh National Building Code' },
                      { id: 'aci', name: 'ACI 318-19', desc: 'American Concrete Institute' },
                      { id: 'is', name: 'IS 456-2000', desc: 'Bureau of Indian Standards' },
                      { id: 'astm', name: 'ASTM Standard', desc: 'American Society for Testing & Materials' },
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCodeProfile(c.id as any)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          codeProfile === c.id
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                            : 'bg-[#111827] border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <strong className="block text-xs text-slate-200">{c.name}</strong>
                        <span className="text-[10px] text-slate-400">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Regional Land-Unit Profile
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleProfileSelect('bd_standard')}
                      className={`p-2.5 rounded-xl border text-left text-xs ${
                        selectedProfileKey === 'bd_standard'
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#111827] border-white/10 text-slate-300'
                      }`}
                    >
                      <strong className="block">Bangladesh Standard</strong>
                      <span className="text-[10px] text-slate-400">1 Decimal = 435.6 sq.ft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProfileSelect('india_standard')}
                      className={`p-2.5 rounded-xl border text-left text-xs ${
                        selectedProfileKey === 'india_standard'
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#111827] border-white/10 text-slate-300'
                      }`}
                    >
                      <strong className="block">India / West Bengal</strong>
                      <span className="text-[10px] text-slate-400">Satak / Katha / Bigha</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Sq.ft per Decimal</span>
                      <input
                        type="number"
                        value={decimalSqFt}
                        onChange={e => setDecimalSqFt(parseFloat(e.target.value) || 435.6)}
                        className="w-full rounded-xl border border-white/10 bg-[#111827] p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Sq.ft per Katha</span>
                      <input
                        type="number"
                        value={kathaSqFt}
                        onChange={e => setKathaSqFt(parseFloat(e.target.value) || 720.0)}
                        className="w-full rounded-xl border border-white/10 bg-[#111827] p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Katha per Bigha</span>
                      <input
                        type="number"
                        value={bighaKatha}
                        onChange={e => setBighaKatha(parseFloat(e.target.value) || 20)}
                        className="w-full rounded-xl border border-white/10 bg-[#111827] p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Currency Code</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      placeholder="e.g. BDT, USD, INR"
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Currency Symbol</label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={e => setCurrencySymbol(e.target.value)}
                      placeholder="e.g. ৳, $, ₹"
                      className="w-full rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Interface Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                        theme === 'dark'
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-[#111827] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      <span>Dark Theme</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                        theme === 'light'
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-[#111827] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      <span>Light Theme</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('system')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                        theme === 'system'
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-[#111827] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Monitor className="w-5 h-5" />
                      <span>System Auto</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-white/10 bg-[#111827] text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-200 mb-1">High-Contrast Technical Aesthetic</p>
                  <p className="text-[11px]">
                    PB CivilLab is optimized for long sessions on jobsites and design offices with high-contrast text and standard engineering blueprint grid aesthetics.
                  </p>
                </div>
              </div>
            )}

            {/* 5. Data Management */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-white/10 bg-[#111827] space-y-3">
                  <span className="font-bold text-slate-200 block text-xs">Backup & Portability</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Export your calculation history, custom units, and preferences into a JSON backup file or restore previously saved records.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Full Backup</span>
                    </button>
                    <label className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold flex items-center gap-2 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Import Backup</span>
                      <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                  <span className="font-bold text-rose-300 block text-xs">Destructive Actions</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsClearHistoryConfirmOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All History</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#151C2B] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog (Section 40) */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset All Preferences?"
        message="This will reset your preferred units, building codes, and decimal precision back to default settings."
        confirmLabel="Reset to Defaults"
        cancelLabel="Keep Current Settings"
        isDestructive={false}
        onConfirm={handleResetDefaults}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Clear History Confirmation Dialog (Section 40) */}
      <ConfirmDialog
        isOpen={isClearHistoryConfirmOpen}
        title="Clear All Calculation History?"
        message="This will permanently delete all saved calculations from this browser."
        confirmLabel="Permanently Clear History"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleClearHistory}
        onCancel={() => setIsClearHistoryConfirmOpen(false)}
      />
    </>
  );
};
