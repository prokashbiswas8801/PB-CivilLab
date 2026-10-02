import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Box,
  Layers,
  Grid,
  AlignJustify,
  Mountain,
  Crosshair,
  FileSpreadsheet,
  Shapes,
  BookOpen,
  Table,
  Star,
  X,
  Compass,
  Ruler,
  TrendingDown,
  Hammer,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Settings,
} from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  favorites: string[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenDisclaimer: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  favorites,
  isOpenMobile,
  onCloseMobile,
  onOpenDisclaimer,
  onOpenHistory,
  onOpenSettings,
}) => {
  // Collapsed state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pb_civillab_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('pb_civillab_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'ai-advisor', name: 'AI Civil Advisor', icon: Bot },
        { id: 'favorites', name: `Favorites (${favorites.length})`, icon: Star },
      ],
    },
    {
      title: 'Conversions',
      items: [
        { id: 'unit-converter', name: 'Universal Unit Converter', icon: ArrowLeftRight },
        { id: 'feet-inch-parser', name: 'Feet-Inch Decimal Parser', icon: Ruler },
      ],
    },
    {
      title: 'Materials & Masonry',
      items: [
        { id: 'concrete-mix', name: 'Concrete Material Mix', icon: Layers },
        { id: 'concrete-volume', name: 'Concrete Volume', icon: Box },
        { id: 'brickwork', name: 'Brickwork & Mortar', icon: Grid },
        { id: 'plaster', name: 'Plaster Calculator', icon: Hammer },
        { id: 'flooring-tiles', name: 'Flooring & Wall Tiles', icon: Shapes },
        { id: 'paint', name: 'Paint & Surface Coating', icon: Layers },
      ],
    },
    {
      title: 'Structural & RCC',
      items: [
        { id: 'rebar-weight', name: 'Rebar Weight & Cost', icon: AlignJustify },
        { id: 'bbs-helper', name: 'BBS Cutting Length', icon: AlignJustify },
        { id: 'rcc-steel-estimator', name: 'Preliminary RCC Steel', icon: Box },
        { id: 'slab-calculator', name: 'Slab (One/Two Way)', icon: Grid },
        { id: 'beam-calculator', name: 'Beam & Stirrups', icon: AlignJustify },
        { id: 'column-calculator', name: 'Column Concrete & Ties', icon: Box },
        { id: 'footing-calculator', name: 'Isolated Footing', icon: Box },
        { id: 'formwork-calculator', name: 'Formwork / Shuttering', icon: LayoutDashboard },
        { id: 'staircase-calculator', name: 'Staircase & Waist Slab', icon: TrendingDown },
      ],
    },
    {
      title: 'Earthwork & Haulage',
      items: [
        { id: 'earthwork-excavation', name: 'Excavation & Trenches', icon: Mountain },
        { id: 'soil-conversion', name: 'Soil Bulking & Swell', icon: Mountain },
        { id: 'truck-loads', name: 'Truck & Trolley Trips', icon: Mountain },
        { id: 'mean-prismoidal', name: 'Prismoidal Road Earthwork', icon: Mountain },
      ],
    },
    {
      title: 'Surveying & Geometry',
      items: [
        { id: 'level-hi-method', name: 'Leveling: HI Method', icon: Crosshair },
        { id: 'level-rise-fall', name: 'Leveling: Rise & Fall', icon: Crosshair },
        { id: 'slope-gradient', name: 'Slope & Gradient', icon: TrendingDown },
        { id: 'coordinate-distance', name: 'Coordinates & Bearing', icon: Compass },
        { id: 'chainage-calculator', name: 'Road Chainage Stations', icon: Compass },
        { id: 'dms-converter', name: 'Degrees ↔ DMS', icon: Compass },
        { id: 'geometry-calculator', name: '2D/3D Geometry Solver', icon: Shapes },
      ],
    },
    {
      title: 'Costing & Reference',
      items: [
        { id: 'quantity-takeoff', name: 'Quantity Takeoff Sheet', icon: FileSpreadsheet },
        { id: 'boq-calculator', name: 'BOQ Cost Summary', icon: FileSpreadsheet },
        { id: 'rate-analysis', name: '1 m³ Rate Analysis', icon: FileSpreadsheet },
        { id: 'formula-library', name: 'Formula Library', icon: BookOpen },
        { id: 'engineering-tables', name: 'Reference Tables', icon: Table },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-50 lg:z-10 h-screen lg:h-[calc(100vh-61px)] border-r border-white/10 bg-[#0B0F19] flex flex-col justify-between transition-all duration-200 ease-in-out no-print ${
          isOpenMobile
            ? 'translate-x-0 w-72'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Mobile Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between lg:hidden">
          <Logo variant="full" height={30} showTagline={false} />
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Close mobile sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Collapse / Expand Header */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2.5 border-b border-white/5">
          {!isCollapsed && (
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1 font-mono">
              Engineering Suite
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors mx-auto"
            aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 font-sans">
                  {section.title}
                </span>
              )}
              {isCollapsed && (
                <div className="w-8 mx-auto h-[1px] bg-white/10 my-2" />
              )}
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const isItemFav = favorites.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    title={isCollapsed ? item.name : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Active Drafting Line Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-cyan-400" />
                    )}

                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && isItemFav && item.id !== 'favorites' && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-[#151C2B] text-slate-100 text-xs rounded-md shadow-xl border border-white/15 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Brand Lockup */}
        <div className="p-3 border-t border-white/5 bg-[#070B12]/80">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 mb-2">
                <Logo variant="icon" height={24} />
                <div className="text-[11px] leading-tight">
                  <strong className="text-slate-100 block text-xs font-wood font-normal tracking-wide">PB CivilLab</strong>
                  <span className="text-slate-400">By Prokash Biswas</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                <span className="text-slate-400 font-mono">v1.0.0 · 30+ Tools</span>
                <button
                  type="button"
                  onClick={onOpenDisclaimer}
                  className="text-cyan-400 hover:underline"
                >
                  Disclaimer
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Logo variant="icon" height={22} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
