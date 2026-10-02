import React from 'react';
import { Search, History, Settings, ShieldAlert, Star, Menu, Bot, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  settings: AppSettings;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenDisclaimer: () => void;
  onToggleSidebarMobile: () => void;
  historyCount: number;
  favoritesCount: number;
  activeView: string;
  onNavigate: (viewId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSearch,
  onOpenHistory,
  onOpenSettings,
  onOpenDisclaimer,
  onToggleSidebarMobile,
  historyCount,
  favoritesCount,
  activeView,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md no-print">
      {/* Zone 1: Single brand lockup with official Logo + mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-1.5 rounded-lg border border-white/10 bg-[#151C2B] text-slate-300 hover:text-white"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="text-left group flex items-center transition-transform active:scale-95"
          title="PB CivilLab - Home Dashboard"
        >
          <Logo variant="full" height={34} showTagline={true} className="hidden sm:inline-flex" />
          <Logo variant="full" height={30} showTagline={false} className="sm:hidden" />
        </button>
      </div>

      {/* Zone 2: Navigation Links (Clean text without pill wrappers) */}
      <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-slate-400">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'dashboard' ? 'text-cyan-400' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('ai-advisor')}
          className={`hover:text-cyan-300 transition-colors flex items-center gap-1.5 ${
            activeView === 'ai-advisor' ? 'text-cyan-400 font-bold' : 'text-cyan-400/90'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          AI Advisor
        </button>
        <button
          onClick={() => onNavigate('unit-converter')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'unit-converter' ? 'text-cyan-400' : ''
          }`}
        >
          Unit Converter
        </button>
        <button
          onClick={() => onNavigate('rebar-weight')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'rebar-weight' ? 'text-cyan-400' : ''
          }`}
        >
          Rebar Calculator
        </button>
        <button
          onClick={() => onNavigate('concrete-mix')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'concrete-mix' ? 'text-cyan-400' : ''
          }`}
        >
          Concrete Mix
        </button>
        <button
          onClick={() => onNavigate('level-hi-method')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'level-hi-method' ? 'text-cyan-400' : ''
          }`}
        >
          Surveying
        </button>
        <button
          onClick={() => onNavigate('quantity-takeoff')}
          className={`hover:text-slate-100 transition-colors ${
            activeView === 'quantity-takeoff' ? 'text-cyan-400' : ''
          }`}
        >
          BOQ & Takeoff
        </button>
      </nav>

      {/* Zone 3: Quick Search & Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Search Bar / Ctrl+K trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#151C2B] hover:border-cyan-500/40 hover:bg-[#1E293B] text-xs text-slate-300 hover:text-slate-100 transition-all shadow-sm group"
          title="Search calculators, formulas, and units (Ctrl+K or /)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium text-slate-300">Search calculators, units...</span>
          <span className="sm:hidden font-medium text-slate-300">Search</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-400 group-hover:text-cyan-300">
            Ctrl+K
          </kbd>
        </button>

        {/* History Button */}
        <button
          onClick={onOpenHistory}
          title="Calculation History"
          className="relative p-2 rounded-lg border border-white/10 bg-[#151C2B] hover:bg-white/5 text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <History className="w-4 h-4" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-black flex items-center justify-center font-mono">
              {historyCount > 9 ? '9+' : historyCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Application Settings"
          className="p-2 rounded-lg border border-white/10 bg-[#151C2B] hover:bg-white/5 text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Engineering Disclaimer */}
        <button
          onClick={onOpenDisclaimer}
          title="Engineering Disclaimer & Credentials"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#151C2B] hover:bg-white/5 text-xs text-amber-400/90 hover:text-amber-300 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Disclaimer</span>
        </button>
      </div>
    </header>
  );
};
