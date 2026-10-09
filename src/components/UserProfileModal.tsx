/**
 * PB CivilLab — User Profile Account Modal
 * Tailored for Site Engineers, Civil Engineering Students, and Quantity Surveyors
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Briefcase,
  Building2,
  Award,
  Mail,
  Phone,
  MapPin,
  Check,
  RotateCcw,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loadUserProfile, saveUserProfile, formatPreparedBy, DEFAULT_USER_PROFILE } from '../utils/userProfile';
import { useToast } from './Common/Toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

const COMMON_DESIGNATIONS = [
  { label: 'Site Engineer', role: 'site_engineer', icon: Briefcase },
  { label: 'Civil Engineering Student', role: 'student', icon: GraduationCap },
  { label: 'Structural Engineer', role: 'structural_engineer', icon: ShieldCheck },
  { label: 'Quantity Surveyor / BOQ', role: 'quantity_surveyor', icon: Building2 },
  { label: 'Project Consultant', role: 'consultant', icon: Award },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());

  // Local form state
  const [engineerName, setEngineerName] = useState(profile.engineerName);
  const [designation, setDesignation] = useState(profile.designation || 'Site Engineer');
  const [companyName, setCompanyName] = useState(profile.companyName || '');
  const [licenseNumber, setLicenseNumber] = useState(profile.licenseNumber || '');
  const [email, setEmail] = useState(profile.email || 'prokashbiswas8801@gmail.com');
  const [phone, setPhone] = useState(profile.phone || '');
  const [companyAddress, setCompanyAddress] = useState(profile.companyAddress || '');
  const [autoIncludePreparedBy, setAutoIncludePreparedBy] = useState<boolean>(
    profile.autoIncludePreparedBy !== false
  );
  const [roleType, setRoleType] = useState(profile.roleType || 'site_engineer');

  // Synchronize on modal open
  useEffect(() => {
    if (isOpen) {
      const current = loadUserProfile();
      setProfile(current);
      setEngineerName(current.engineerName);
      setDesignation(current.designation || 'Site Engineer');
      setCompanyName(current.companyName || '');
      setLicenseNumber(current.licenseNumber || '');
      setEmail(current.email || 'prokashbiswas8801@gmail.com');
      setPhone(current.phone || '');
      setCompanyAddress(current.companyAddress || '');
      setAutoIncludePreparedBy(current.autoIncludePreparedBy !== false);
      setRoleType(current.roleType || 'site_engineer');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFormattedPreparedBy = formatPreparedBy({
    engineerName,
    designation,
    autoIncludePreparedBy,
  });

  const handleSelectDesignation = (preset: { label: string; role: string }) => {
    setDesignation(preset.label);
    setRoleType(preset.role);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!engineerName.trim()) {
      toast.error('Full Name is required for report stamping.');
      return;
    }

    const updated: UserProfile = {
      engineerName: engineerName.trim(),
      designation: designation.trim(),
      companyName: companyName.trim(),
      licenseNumber: licenseNumber.trim(),
      email: email.trim(),
      phone: phone.trim(),
      companyAddress: companyAddress.trim(),
      autoIncludePreparedBy,
      roleType,
    };

    saveUserProfile(updated);
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    toast.success('Profile Account updated & saved to device storage.');
    onClose();
  };

  const handleReset = () => {
    setEngineerName(DEFAULT_USER_PROFILE.engineerName);
    setDesignation(DEFAULT_USER_PROFILE.designation || 'Site Engineer');
    setCompanyName(DEFAULT_USER_PROFILE.companyName || '');
    setLicenseNumber(DEFAULT_USER_PROFILE.licenseNumber || '');
    setEmail(DEFAULT_USER_PROFILE.email || 'prokashbiswas8801@gmail.com');
    setPhone('');
    setCompanyAddress('');
    setAutoIncludePreparedBy(true);
    setRoleType('site_engineer');
    toast.info('Form reset to default profile.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 no-print">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#151C2B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-wood font-normal text-slate-100 tracking-wide flex items-center gap-2">
                <span>Profile Account</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold uppercase">
                  Site & Academic
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Identity for calculation sheets, A4 PDF reports & QA verification blocks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close user profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Quick Designation Selector */}
          <div>
            <label className="text-slate-300 font-semibold block mb-2">
              Select Professional Role / Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DESIGNATIONS.map(item => {
                const isSelected = designation.toLowerCase() === item.label.toLowerCase();
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectDesignation(item)}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm'
                        : 'border-white/10 bg-[#151C2B] text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={engineerName}
                onChange={e => setEngineerName(e.target.value)}
                placeholder="e.g. Prokash Biswas"
                className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Professional Title / Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Site Engineer, Student"
                className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Organization / Institution / University
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. PB CivilLab Infrastructure / BUET"
                className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                License / Reg / Student ID (Optional)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="e.g. PE-48291, IEB M-38291, or ID 2024-001"
                className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="prokashbiswas8801@gmail.com"
                className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Contact Phone / Jobsite Radio
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +880 1700-000000"
                className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Jobsite Office / Campus Location
            </label>
            <input
              type="text"
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
              placeholder="e.g. Dhaka, Bangladesh"
              className="w-full rounded-xl border border-white/10 bg-[#151C2B] p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* PREPARED BY Auto-Population Toggle Control (Requirement 4) */}
          <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <label htmlFor="auto-include-toggle" className="text-xs font-bold text-cyan-300 cursor-pointer block">
                Automatically include my name in &quot;PREPARED BY&quot;
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When enabled, newly generated calculations, export summaries, and printable sheets pre-fill the author box with your name and designation. When disabled, the field remains blank for manual sign-off.
              </p>
            </div>

            <button
              id="auto-include-toggle"
              type="button"
              role="switch"
              aria-checked={autoIncludePreparedBy}
              onClick={() => setAutoIncludePreparedBy(prev => !prev)}
              className="shrink-0 p-1 text-cyan-400 hover:text-cyan-300 transition-transform active:scale-95"
              title="Toggle automatic authorship inclusion"
            >
              {autoIncludePreparedBy ? (
                <ToggleRight className="w-7 h-7 text-cyan-400" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-500" />
              )}
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl border border-white/10 bg-[#111827] space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
              Report Authorship Preview
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-100">
                  {currentFormattedPreparedBy ? (
                    <span>Prepared by: <span className="text-cyan-400">{currentFormattedPreparedBy}</span></span>
                  ) : (
                    <span className="text-slate-500 italic">(Authorship Excluded — Blank Field for Manual Sign-off)</span>
                  )}
                </p>
                {licenseNumber && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Credential Reg: {licenseNumber}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {autoIncludePreparedBy ? 'AUTO-FILL ACTIVE' : 'MANUAL ONLY'}
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#151C2B] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Profile</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
