import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Layers,
  AlignJustify,
  Grid,
  Mountain,
  FileSpreadsheet,
  Receipt,
  Star,
  Search,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Clock,
  Briefcase,
  History,
  TrendingUp,
  Bookmark,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';
import { TOOLS_CATALOG } from '../constants/engineering';
import { Tool, ToolCategory, HistoryItem } from '../types';
import { Logo } from './Logo';

interface DashboardProps {
  onNavigate: (viewId: string) => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  history?: HistoryItem[];
  onOpenHistory?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  favorites,
  onToggleFavorite,
  history = [],
  onOpenHistory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);

  const categories: { id: ToolCategory; label: string }[] = [
    { id: 'all', label: 'All Tools' },
    { id: 'converters', label: 'Unit Conversion' },
    { id: 'concrete', label: 'Concrete & Materials' },
    { id: 'rebar', label: 'RCC & Reinforcement' },
    { id: 'masonry', label: 'Masonry & Plaster' },
    { id: 'structural', label: 'Structural Prelim' },
    { id: 'earthwork', label: 'Earthwork & Haulage' },
    { id: 'surveying', label: 'Surveying & Levels' },
    { id: 'estimation', label: 'Estimation & BOQ' },
    { id: 'geometry', label: 'Geometry' },
    { id: 'utilities', label: 'Utilities' },
  ];

  // Specific 7 Quick Actions requested in Section 4
  const primaryQuickActions = [
    { id: 'unit-converter', name: 'Unit Converter', icon: ArrowLeftRight, desc: 'Instant conversion with regional land units' },
    { id: 'concrete-mix', name: 'Concrete Calculator', icon: Layers, desc: 'Cement bags, sand CFT & stone breakdown' },
    { id: 'rebar-weight', name: 'Rebar Calculator', icon: AlignJustify, desc: 'D²/162.2 steel reinforcement mass' },
    { id: 'brickwork', name: 'Brickwork & Mortar', icon: Grid, desc: 'Brick count with opening deductions' },
    { id: 'earthwork-excavation', name: 'Earthwork Calculator', icon: Mountain, desc: 'Excavation volumes & trench profiles' },
    { id: 'boq-calculator', name: 'BOQ Estimator', icon: Receipt, desc: 'Bill of quantities with overhead & taxes' },
    { id: 'quantity-takeoff', name: 'Quantity Takeoff', icon: FileSpreadsheet, desc: 'L × W × H dimensional measurement sheet' },
  ];

  // Filtered tools
  const filteredTools = useMemo(() => {
    return TOOLS_CATALOG.filter(tool => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesFavorites = !showOnlyFavorites || favorites.includes(tool.id);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some(k => k.toLowerCase().includes(q));

      return matchesCategory && matchesFavorites && matchesSearch;
    });
  }, [selectedCategory, showOnlyFavorites, favorites, searchQuery]);

  // Favorite tool objects
  const favoriteTools = useMemo(() => {
    return TOOLS_CATALOG.filter(t => favorites.includes(t.id));
  }, [favorites]);

  // Project Snapshot Data (derived from BOQ / Takeoff or active calculation stats)
  const projectSnapshot = useMemo(() => {
    let boqTotal = 0;
    let itemCount = 0;
    try {
      const storedBoq = localStorage.getItem('pb_civillab_boq');
      if (storedBoq) {
        const parsed = JSON.parse(storedBoq);
        if (Array.isArray(parsed)) {
          itemCount = parsed.length;
          boqTotal = parsed.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
        }
      }
    } catch {}

    return {
      projectName: 'Standard Civil Project Suite',
      estimatedCost: boqTotal > 0 ? boqTotal : null,
      totalCalculationsLogged: history.length,
      activeModules: 27,
      verifiedCodeProfiles: 'BNBC 2020 · ACI 318 · IS 456 · ASTM',
      pendingAuditItems: history.filter(h => h.result?.isPreliminary).length,
    };
  }, [history]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Section */}
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#111827] to-[#0B0F19] p-6 sm:p-10 shadow-2xl overflow-hidden engineering-grid">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Logo variant="full" height={38} className="drop-shadow-md" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-wood font-normal tracking-wide text-white leading-tight">
              Civil Engineering Calculations.{' '}
              <span className="text-cyan-400 block sm:inline">Simplified.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              A comprehensive, transparent toolkit for civil engineers, surveyors, estimators, site supervisors, and students.
              Every calculation reveals its full substituted formula, intermediate mathematical breakdown, and engineering assumptions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('tools-catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <span>Explore All Tools</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('unit-converter')}
                className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span>Universal Unit Converter</span>
              </button>
            </div>
          </div>

          {/* Architectural Typographic Badge on Desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center p-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#111827] to-[#0B0F19] backdrop-blur-sm shadow-2xl shrink-0 text-center min-w-[280px]">
            <span className="font-wood font-normal text-4xl text-slate-100 tracking-wider block drop-shadow-md">
              PB CivilLab
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-cyan-400 font-semibold mt-2 block font-sans">
              Calculate Smarter. Build Better.
            </span>
            <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>OFFICIAL ENGINEERING SUITE</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/5 text-xs">
          <div>
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400 block">
              {TOOLS_CATALOG.length}+
            </span>
            <span className="text-slate-400">Engineering Tools</span>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400 block">
              100+
            </span>
            <span className="text-slate-400">Standard Units</span>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400 block">
              100%
            </span>
            <span className="text-slate-400">Offline Capable</span>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400 block">
              4 Standards
            </span>
            <span className="text-slate-400">BNBC / ACI / IS / ASTM</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions (Section 4) */}
      <section aria-labelledby="quick-actions-heading">
        <div className="flex items-center justify-between mb-3.5">
          <h2 id="quick-actions-heading" className="text-base font-wood font-normal text-slate-100 uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400">Essential field and office workflows</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {primaryQuickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className="p-4 rounded-xl border border-white/10 bg-[#111827] hover:border-cyan-500/40 hover:bg-[#151C2B] transition-all text-left group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-wood font-normal text-slate-100 group-hover:text-cyan-300 transition-colors mb-1 tracking-wide">
                    {action.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {action.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center text-[10px] text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Launch</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Recent Calculations & Project Snapshot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calculations (Section 4 & 23) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-wood font-normal text-slate-100 tracking-wide">
                  Recent Calculations
                </h3>
                <span className="text-xs text-slate-400 font-mono">({history.length})</span>
              </div>
              {history.length > 0 && onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-semibold"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-500">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">No Recent Calculations</p>
                  <p className="text-xs text-slate-500 mt-0.5">Your recent calculations will appear here with automatic history preservation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('concrete-mix')}
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Calculator</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {history.slice(0, 4).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.toolId)}
                    className="p-3.5 rounded-xl border border-white/5 bg-[#0F172A] hover:border-cyan-500/30 hover:bg-[#151C2B] text-left transition-colors group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-mono text-cyan-400 font-semibold">{item.toolName}</span>
                        <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="text-base sm:text-lg font-mono font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {item.summary}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-sans">
                        {item.result?.title}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>1-Click Restore</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Snapshot (Section 4) */}
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-wood font-normal text-slate-100 tracking-wide">
                Project Snapshot
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#0F172A] border border-white/5">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Project Scope</span>
                <span className="font-semibold text-slate-200 text-sm block">{projectSnapshot.projectName}</span>
                <span className="text-[11px] text-cyan-400 font-mono mt-1 block">Active Workspace · Local Storage</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#0F172A] border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Calculations Logged</span>
                  <span className="text-xl font-bold font-mono text-slate-100">{projectSnapshot.totalCalculationsLogged}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F172A] border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Preliminary Items</span>
                  <span className="text-xl font-bold font-mono text-amber-400">{projectSnapshot.pendingAuditItems}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F172A] border border-white/5">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Standard Code Profiles</span>
                <p className="text-[11px] text-slate-300 font-mono leading-relaxed">{projectSnapshot.verifiedCodeProfiles}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('boq-calculator')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Manage BOQ & Estimates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Pinned Favorites Section (Section 4 & 23) */}
      <section aria-labelledby="favorites-heading">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 id="favorites-heading" className="text-base font-wood font-normal text-slate-100 uppercase tracking-wider">
              Pinned Favorites
            </h2>
            <span className="text-xs text-slate-400 font-mono">({favoriteTools.length})</span>
          </div>
          <span className="text-xs text-slate-400">Quick-access pinned tools</span>
        </div>

        {favoriteTools.length === 0 ? (
          <div className="p-6 rounded-xl border border-white/10 bg-[#111827] text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No Favorites Pinned</p>
            <p className="text-xs text-slate-400">Pin frequently used tools for quick access using the star icon on any calculator.</p>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('tools-catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Browse Calculators</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {favoriteTools.map(tool => (
              <div
                key={tool.id}
                className="p-4 rounded-xl border border-white/10 bg-[#111827] hover:border-cyan-500/30 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10">
                      {tool.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(tool.id)}
                      title="Remove from favorites"
                      className="text-amber-400 hover:text-slate-400 p-1 rounded transition-colors"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>
                  <h3 className="text-sm font-wood font-normal text-slate-100 group-hover:text-cyan-300 transition-colors tracking-wide mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(tool.id)}
                  className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors"
                >
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Tool Catalog Section */}
      <div id="tools-catalog-section" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-wood font-normal text-slate-100 tracking-wide">Engineering Tool Directory</h2>
            <p className="text-xs text-slate-400 font-sans">
              Showing {filteredTools.length} of {TOOLS_CATALOG.length} verified calculators
            </p>
          </div>

          {/* Search & Favorites Toggle inside Directory */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter tools..."
                className="rounded-xl border border-white/10 bg-[#111827] pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 w-44 sm:w-60 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showOnlyFavorites
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#111827] border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Favorites</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-[#111827] text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tools Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => {
            const isFav = favorites.includes(tool.id);

            return (
              <div
                key={tool.id}
                className="p-5 rounded-2xl border border-white/10 bg-[#111827] hover:border-cyan-500/40 hover:bg-[#151C2B] transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {tool.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(tool.id)}
                      title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-base font-wood font-normal text-slate-100 group-hover:text-cyan-300 transition-colors mb-2 tracking-wide">
                    {tool.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {tool.keywords.slice(0, 3).map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(tool.id)}
                    className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 ml-2 shrink-0 transition-colors"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineering Philosophy Notice */}
      <div className="p-6 rounded-xl border border-white/10 bg-[#111827] text-xs text-slate-300 space-y-3 font-sans">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h4 className="font-wood font-normal text-slate-100 text-base flex items-center gap-2 tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            The PB CivilLab Calculation Contract
          </h4>
          <span className="text-[11px] font-mono text-slate-400">BNBC · ACI 318 · IS 456 · ASTM Standard Alignment</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Every mathematical formula executed in PB CivilLab uses standardized structural and geotechnical derivations.
          All volume calculations, bar bending deductions, cement dry-factors, and leveling sheets undergo arithmetic checks
          before rendering. Always verify field measurements with certified structural engineer signatures before physical construction.
        </p>
      </div>

      {/* Creator Attribution & Copyright Footer */}
      <footer className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-sans">
        <div className="flex items-center gap-3">
          <Logo variant="full" height={28} showTagline={true} />
        </div>
        <div className="text-center sm:text-right space-y-0.5">
          <p className="text-slate-300 font-medium">
            Designed & Developed by <span className="text-cyan-400 font-semibold">Prokash Biswas</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Copyright © 2026 Prokash Biswas. All rights reserved. · v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
};
