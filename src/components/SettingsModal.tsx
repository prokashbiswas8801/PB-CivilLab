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
  Sparkles,
  Palette,
  User,
  Building,
  Award,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { AppSettings, RegionalProfile, UnitPreferences, UserProfile } from '../types';
import { REGIONAL_PROFILES } from '../constants/engineering';
import { ConfirmDialog } from './Common/ConfirmDialog';
import { useToast } from './Common/Toast';
import { useTheme, ACCENT_THEMES } from '../context/ThemeContext';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'units' | 'calculation' | 'engineering' | 'appearance' | 'data'>('profile');

  // Engineer / User Profile
  const [engineerName, setEngineerName] = useState(settings.userProfile?.engineerName || 'Prokash Biswas');
  const [engineerDesignation, setEngineerDesignation] = useState(settings.userProfile?.designation || 'Civil & Structural Engineer');
  const [engineerLicense, setEngineerLicense] = useState(settings.userProfile?.licenseNumber || 'PE-48291');
  const [companyName, setCompanyName] = useState(settings.userProfile?.companyName || 'PB CivilLab Infrastructure Consult');
  const [engineerEmail, setEngineerEmail] = useState(settings.userProfile?.email || 'prokashbiswas8801@gmail.com');
  const [engineerPhone, setEngineerPhone] = useState(settings.userProfile?.phone || '');
  const [companyAddress, setCompanyAddress] = useState(settings.userProfile?.companyAddress || '');
  const [profileNotes, setProfileNotes] = useState(settings.userProfile?.notes || '');

  // Appearance
  const { theme, setTheme, accent, setAccent } = useTheme();

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

    const userProfile: UserProfile = {
      engineerName: engineerName.trim() || 'Prokash Biswas',
      designation: engineerDesignation.trim(),
      licenseNumber: engineerLicense.trim(),
      companyName: companyName.trim(),
      email: engineerEmail.trim(),
      phone: engineerPhone.trim(),
      companyAddress: companyAddress.trim(),
      notes: profileNotes.trim(),
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
      userProfile,
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
    setEngineerName('Prokash Biswas');
    setEngineerDesignation('Civil & Structural Engineer');
    setEngineerLicense('PE-48291');
    setCompanyName('PB CivilLab Infrastructure Consult');
    setEngineerEmail('prokashbiswas8801@gmail.com');
    setEngineerPhone('+880 1700-000000');
    setCompanyAddress('Dhaka, Bangladesh');
    setProfileNotes('Certified Civil Engineering Calculation Engine');
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
              { id: 'profile', label: 'Engineer Profile' },
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
            {/* 0. Engineer / User Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-slate-300">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs text-cyan-300 font-semibold">Civil Engineer & Sign-Off Identity</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set up your professional credentials. This profile automatically authenticates your calculation sheets, pre-populates the Quality Assurance (QA) verification sign-off blocks, and formats official A4 PDF exports.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Engineer Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={engineerName}
                      onChange={e => setEngineerName(e.target.value)}
                      placeholder="e.g. Prokash Biswas"
                      className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                      <span>Professional Designation / Role</span>
                    </label>
                    <input
                      type="text"
                      value={engineerDesignation}
                      onChange={e => setEngineerDesignation(e.target.value)}
                      placeholder="e.g. Civil & Structural Engineer"
                      className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>PE / License / Registration No.</span>
                    </label>
                    <input
                      type="text"
                      value={engineerLicense}
                      onChange={e => setEngineerLicense(e.target.value)}
                      placeholder="e.g. PE-48291 or IEB M-38291"
                      className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Consultancy / Firm / Agency</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. PB CivilLab Infrastructure Consult"
                      className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Official Email</span>
                    </label>
                    <input
                      type="email"
                      value={engineerEmail}
                      onChange={e => setEngineerEmail(e.target.value)}
                      placeholder="e.g. prokashbiswas8801@gmail.com"
                      className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-rose-400" />
                      <span>Contact Phone / Site Radio</span>
                    </label>
                    <input
                      type="text"
                      value={engineerPhone}
                      onChange={e => setEngineerPhone(e.target.value)}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Office / Jobsite Location</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={e => setCompanyAddress(e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Engineering Verification Notes / Motto</label>
                  <input
                    type="text"
                    value={profileNotes}
                    onChange={e => setProfileNotes(e.target.value)}
                    placeholder="e.g. Certified Civil Engineering Calculation Engine"
                    className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Live Stamp Card Preview */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold tracking-wider">
                    Sign-Off Stamp Preview (As Rendered in PDF & Print Sheets)
                  </span>
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#111827] to-[#151C2B] shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          PREPARED BY
                        </span>
                        <span className="text-xs font-bold text-slate-100">{engineerName || 'Prokash Biswas'}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {engineerDesignation || 'Civil & Structural Engineer'}
                        {engineerLicense ? ` · Reg: ${engineerLicense}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {companyName || 'PB CivilLab Infrastructure Consult'}
                        {companyAddress ? ` · ${companyAddress}` : ''}
                      </p>
                    </div>

                    <div className="w-36 h-12 rounded-lg border border-dashed border-cyan-500/40 bg-white/5 flex flex-col items-center justify-center text-center p-1 shrink-0">
                      <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Signature & Seal</span>
                      <span className="text-[8px] text-slate-400 font-mono">Ready for PDF Stamp</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

                {/* Custom Engineering Accent Theme Selector */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Custom Engineering Accent Theme</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">5 Styles</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Select your preferred accent highlight for buttons, active navigation, results, and glowing borders across the site.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Object.values(ACCENT_THEMES).map(item => {
                      const isSelected = accent === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAccent(item.id);
                            toast.success(`Engineering Accent: ${item.label} applied across site`);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-white/10 border-white/40 shadow-sm ring-1 ring-white/20'
                              : 'bg-[#111827] border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: item.dotColor }}
                            />
                            <div>
                              <strong className="block text-xs text-slate-100">{item.label}</strong>
                              <span className="text-[10px] text-slate-400 block truncate">{item.tagline}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check
                              className="w-4 h-4 shrink-0 ml-2 font-bold stroke-[3]"
                              style={{ color: item.dotColor }}
                            />
                          )}
                        </button>
                      );
                    })}
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
