import React from 'react';
import { X, ShieldAlert, CheckCircle2, User } from 'lucide-react';
import { Logo } from './Logo';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm no-print"
      />

      {/* Modal Dialog */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto rounded-2xl border border-white/10 bg-[#0B0F19] shadow-2xl overflow-hidden no-print">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-wood font-normal text-base text-white tracking-wide">Engineering Disclaimer & Verification Notice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-200">
            <p className="font-medium">
              PB CivilLab provides calculation, conversion, and quantity estimation tools for educational,
              preliminary, and practical site assistance.
            </p>
          </div>

          <p>
            Calculated outputs depend upon user-entered dimensions, empirical assumptions, material densities,
            aggregate void ratios, moisture conditions, workmanship, and regional specifications.
          </p>

          <p>
            <strong>Structural & Engineering Design Calculations:</strong> Preliminary steel reinforcement ratios,
            beam shear link spacings, column load estimates, and slab aspect classifications provided in this toolkit
            are intended for feasibility planning and material procurement estimation only. They do <em>not</em> replace
            rigorous structural analysis, computer-aided finite element modeling (FEM), code-compliant moment envelopes,
            or construction execution drawings stamped by a licensed professional civil/structural engineer.
          </p>

          <p>
            All final construction activities must comply with applicable national and international standards (such as
            BNBC, ACI 318, IS 456, BS EN 1992, ASTM, or AASHTO).
          </p>

          {/* Project & Creator Lockup */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#111827] flex items-center justify-between gap-4 flex-wrap">
            <Logo variant="full" height={34} showTagline={true} />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Created & Engineered by</span>
              <strong className="text-xs text-white">Prokash Biswas</strong>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="p-4 border-t border-white/10 bg-[#111827] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </>
  );
};
