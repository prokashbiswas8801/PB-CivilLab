import React from 'react';
import { Search, History, Settings, ShieldAlert, Star, Menu, FolderKanban, Coins } from 'lucide-react';
import { AppSettings } from '../types';
import { Logo } from './Logo';
import { PWAInstallButton } from './Common/PWAInstallButton';

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
  activeProjectName?: string;
  onOpenProjects?: () => void;
  onOpenRateLibrary?: () => void;
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
  activeProjectName,
  onOpenProjects,
  onOpenRateLibrary,
}) => {
  return (
    <header className="sticky top-0 z-30 shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md no-print shadow-sm">
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
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] hover:border-cyan-500/40 hover:bg-slate-200 dark:hover:bg-[#1E293B] text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-slate-100 transition-all shadow-sm group"
          title="Search calculators, formulas, and units (Ctrl+K or /)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300">Search calculators, units...</span>
          <span className="sm:hidden font-medium text-slate-700 dark:text-slate-300">Search</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Project Workspaces Button */}
        {onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            title="Switch or manage named project workspaces"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] hover:bg-slate-200 dark:hover:bg-white/5 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden md:inline font-medium max-w-[120px] truncate">
              {activeProjectName || 'Project Workspace'}
            </span>
            <span className="md:hidden font-medium">Projects</span>
          </button>
        )}

        {/* Rate Library Button */}
        {onOpenRateLibrary && (
          <button
            type="button"
            onClick={onOpenRateLibrary}
            title="Dated Rate Library (Materials, Labor, Equipment)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] hover:bg-slate-200 dark:hover:bg-white/5 text-xs text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline font-medium">Rates</span>
          </button>
        )}

        {/* History Button */}
        <button
          onClick={onOpenHistory}
          title="Calculation History"
          className="relative p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] hover:bg-slate-200 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
        >
          <History className="w-4 h-4" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center font-mono">
              {historyCount > 9 ? '9+' : historyCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Application Settings"
          className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] hover:bg-slate-200 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Engineering Disclaimer */}
        <button
          onClick={onOpenDisclaimer}
          title="Engineering Disclaimer & Credentials"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] hover:bg-slate-200 dark:hover:bg-white/5 text-xs text-amber-600 dark:text-amber-400/90 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Disclaimer</span>
        </button>
      </div>
    </header>
  );
};
