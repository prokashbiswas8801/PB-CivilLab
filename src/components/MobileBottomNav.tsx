import React from 'react';
import { LayoutDashboard, Search, ArrowLeftRight, History, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  onOpenSearch,
  onOpenHistory,
  onOpenSettings,
  historyCount,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around lg:hidden no-print safe-area-bottom shadow-2xl"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[56px] transition-colors ${
          activeView === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Dashboard</span>
      </button>

      {/* 2. Universal Search / Tool Launcher */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[56px] text-slate-400 hover:text-cyan-300 transition-colors"
      >
        <Search className="w-5 h-5 mb-0.5 text-cyan-400" />
        <span className="text-[10px] tracking-tight">Find Tools</span>
      </button>

      {/* 3. Unit Converter */}
      <button
        type="button"
        onClick={() => onNavigate('unit-converter')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[56px] transition-colors ${
          activeView === 'unit-converter' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Units</span>
      </button>

      {/* 4. History */}
      <button
        type="button"
        onClick={onOpenHistory}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[56px] text-slate-400 hover:text-slate-200 transition-colors relative"
      >
        <History className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">History</span>
        {historyCount > 0 && (
          <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
            {historyCount > 9 ? '9+' : historyCount}
          </span>
        )}
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[56px] text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Settings</span>
      </button>
    </nav>
  );
};
