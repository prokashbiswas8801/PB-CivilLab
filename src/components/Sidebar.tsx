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
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
  Sparkles,
  User,
} from 'lucide-react';
import { Logo } from './Logo';
import { useTheme, ACCENT_THEMES, AccentColor, ThemeMode } from '../context/ThemeContext';
import { useToast } from './Common/Toast';
import { loadUserProfile } from '../utils/userProfile';

interface SidebarProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  favorites: string[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenDisclaimer: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  favorites,
  isOpenMobile,
  onCloseMobile,
  onOpenDisclaimer,
  onOpenProfile,
}) => {
  const { theme, resolvedTheme, accent, accentConfig, setTheme, setAccent, toggleTheme } = useTheme();
  const toast = useToast();
  const [userProfile, setUserProfile] = useState(() => loadUserProfile());

  // Listen for real-time user profile updates across app
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) setUserProfile(e.detail);
      else setUserProfile(loadUserProfile());
    };
    window.addEventListener('pb_civillab_user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('pb_civillab_user_profile_updated', handleProfileUpdate);
  }, []);

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
      badgeColor: 'text-cyan-700 dark:text-cyan-400',
      dotColor: 'bg-cyan-500',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      activeBg: 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300',
      lineColor: 'bg-cyan-500',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'favorites', name: `Favorites (${favorites.length})`, icon: Star },
        { id: 'profile-account', name: 'Profile Account', icon: User },
      ],
    },
    {
      title: 'Conversions',
      badgeColor: 'text-sky-700 dark:text-sky-400',
      dotColor: 'bg-sky-500',
      iconColor: 'text-sky-600 dark:text-sky-400',
      activeBg: 'bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/40 text-sky-800 dark:text-sky-300',
      lineColor: 'bg-sky-500',
      items: [
        { id: 'unit-converter', name: 'Universal Unit Converter', icon: ArrowLeftRight },
        { id: 'feet-inch-parser', name: 'Feet-Inch Decimal Parser', icon: Ruler },
      ],
    },
    {
      title: 'Materials & Masonry',
      badgeColor: 'text-amber-700 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      iconColor: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300',
      lineColor: 'bg-amber-500',
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
      badgeColor: 'text-orange-700 dark:text-orange-400',
      dotColor: 'bg-orange-500',
      iconColor: 'text-orange-600 dark:text-orange-400',
      activeBg: 'bg-orange-50 dark:bg-orange-500/15 border-orange-200 dark:border-orange-500/40 text-orange-800 dark:text-orange-300',
      lineColor: 'bg-orange-500',
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
      badgeColor: 'text-yellow-700 dark:text-yellow-400',
      dotColor: 'bg-yellow-500',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      activeBg: 'bg-yellow-50 dark:bg-yellow-500/15 border-yellow-200 dark:border-yellow-500/40 text-yellow-800 dark:text-yellow-300',
      lineColor: 'bg-yellow-500',
      items: [
        { id: 'earthwork-excavation', name: 'Excavation & Trenches', icon: Mountain },
        { id: 'soil-conversion', name: 'Soil Bulking & Swell', icon: Mountain },
        { id: 'truck-loads', name: 'Truck & Trolley Trips', icon: Mountain },
        { id: 'mean-prismoidal', name: 'Prismoidal Road Earthwork', icon: Mountain },
      ],
    },
    {
      title: 'Surveying & Geometry',
      badgeColor: 'text-emerald-700 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300',
      lineColor: 'bg-emerald-500',
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
      badgeColor: 'text-purple-700 dark:text-purple-400',
      dotColor: 'bg-purple-500',
      iconColor: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-50 dark:bg-purple-500/15 border-purple-200 dark:border-purple-500/40 text-purple-800 dark:text-purple-300',
      lineColor: 'bg-purple-500',
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
    if (id === 'profile-account') {
      if (onOpenProfile) onOpenProfile();
      onCloseMobile();
      return;
    }
    onNavigate(id);
    onCloseMobile();
  };

  const accentOptions = Object.values(ACCENT_THEMES);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container: Fully Adaptive Light & Dark Mode, Stationary Dock on Desktop */}
      <aside
        className={`fixed lg:relative top-0 lg:top-0 left-0 z-50 lg:z-10 h-screen lg:h-full border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0E17] text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 no-print select-none shadow-[2px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_12px_rgba(0,0,0,0.35)] ${
          isOpenMobile
            ? 'translate-x-0 w-72'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Mobile Top Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0E17] flex items-center justify-between lg:hidden">
          <Logo variant="full" height={30} showTagline={false} />
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close mobile sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Header: Locked Panel Title & Collapse Control */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-50/90 dark:bg-[#070B12]/80">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest font-mono">
                Engineering Suite
              </span>
              <span
                className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 font-semibold"
                title="Locked Sidebar: Navigation stays firmly docked and scrolls independently from the main page"
              >
                <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>Locked</span>
              </span>
            </div>
          ) : (
            <div className="mx-auto" title="Locked Sidebar (Stationary)">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors"
            aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation: Independent Scroll Container */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 overscroll-contain">
          {/* User Profile Account Facility (Sidebar Navigation Item & Card) */}
          {!isCollapsed ? (
            <div className="px-1 mb-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-full p-2.5 rounded-xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent hover:border-cyan-400 dark:hover:border-cyan-400 text-left transition-all group flex items-center justify-between shadow-sm active:scale-95"
                title="Manage Site Engineer & Student Identity"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {userProfile.engineerName ? userProfile.engineerName.slice(0, 2).toUpperCase() : 'PB'}
                  </div>
                  <div className="truncate min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                      {userProfile.engineerName || 'Site Engineer'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                      {userProfile.designation || 'Profile Account'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 shrink-0">
                  Account
                </span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition-all shadow-sm group"
                title={`Profile Account: ${userProfile.engineerName} (${userProfile.designation || 'Site Engineer'})`}
                aria-label="Open User Profile Account"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}

          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="flex items-center gap-1.5 px-3 mb-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${section.dotColor}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider block font-sans ${section.badgeColor}`}>
                    {section.title}
                  </span>
                </div>
              )}
              {isCollapsed && (
                <div className="w-8 mx-auto h-[1px] bg-slate-200 dark:bg-white/10 my-2" />
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
                        ? `${section.activeBg} font-semibold border shadow-sm`
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Active Drafting Line Indicator */}
                    {isActive && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r ${section.lineColor}`} />
                    )}

                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? section.iconColor : 'text-slate-500 dark:text-slate-400 group-hover:' + section.iconColor}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && isItemFav && item.id !== 'favorites' && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    )}

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-white dark:bg-[#151C2B] text-slate-800 dark:text-slate-100 text-xs rounded-lg shadow-xl border border-slate-200 dark:border-white/15 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-medium">
                        {item.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ======================================================================
         * Appearance Mode & Custom Engineering Accent Switchers (Sidebar Docked)
         * ====================================================================== */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#070B12]/80 space-y-2.5">
            {/* Mode-switching toggle (Dark / Light / System) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Theme Mode</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 capitalize">
                  {theme} ({resolvedTheme})
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label="Theme mode switcher"
                className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-[#0E1524] border border-slate-300/80 dark:border-white/10"
              >
                {[
                  { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
                  { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                  { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
                ].map(({ mode, label, icon: Icon }) => {
                  const isActive = theme === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setTheme(mode)}
                      title={`Switch to ${label} appearance`}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white dark:bg-cyan-500 text-slate-900 dark:text-slate-950 shadow-sm border border-slate-200 dark:border-cyan-400'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-300/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive && resolvedTheme === 'dark' ? 'text-slate-950' : ''}`} />
                      <span className="text-[11px]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Engineering Accent Color */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>Engineering Accent</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                  {accentConfig.label.split(' ')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-200/80 dark:bg-[#0E1524] border border-slate-300/80 dark:border-white/10">
                {accentOptions.map(item => {
                  const isSelected = item.id === accent;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAccent(item.id);
                        toast.success(`Engineering Accent: ${item.label}`);
                      }}
                      title={`${item.label} (${item.tagline})`}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'scale-110 ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-slate-100 dark:ring-offset-[#0E1524] shadow-md'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: item.dotColor }}
                      aria-label={`Select ${item.label} accent color`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed View Theme & Accent Control Icon Buttons */
          <div className="py-2.5 px-1.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#070B12]/80 flex flex-col items-center gap-2">
            {/* Theme Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Theme: ${theme} (${resolvedTheme}). Click to toggle Light/Dark`}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all shadow-sm group"
              aria-label="Toggle theme appearance"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Accent Color Cycle Button */}
            <button
              type="button"
              onClick={() => {
                const ids: AccentColor[] = ['cyan', 'amber', 'orange', 'emerald', 'purple'];
                const nextIdx = (ids.indexOf(accent) + 1) % ids.length;
                const nextAccent = ids[nextIdx];
                setAccent(nextAccent);
                toast.success(`Engineering Accent: ${ACCENT_THEMES[nextAccent].label}`);
              }}
              title={`Accent: ${accentConfig.label}. Click to cycle color`}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group relative"
              aria-label="Cycle engineering accent color"
            >
              <span
                className="w-4 h-4 rounded-full transition-transform group-hover:scale-110 shadow-sm flex items-center justify-center"
                style={{ backgroundColor: accentConfig.dotColor }}
              />
            </button>
          </div>
        )}

        {/* Sidebar Footer Brand Lockup */}
        <div className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-50/90 dark:bg-[#070B12]/80">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 mb-2">
                <Logo variant="icon" height={24} />
                <div className="text-[11px] leading-tight">
                  <strong className="text-slate-900 dark:text-slate-100 block text-xs font-wood font-normal tracking-wide">
                    PB CivilLab
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">By Prokash Biswas</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5 text-[10px]">
                <span className="text-slate-500 dark:text-slate-400 font-mono">v1.0.0 · 30+ Tools</span>
                <button
                  type="button"
                  onClick={onOpenDisclaimer}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
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
