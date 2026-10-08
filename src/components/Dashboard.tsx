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
  Dices,
  Lightbulb,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { TOOLS_CATALOG } from '../constants/engineering';
import { Tool, ToolCategory, HistoryItem } from '../types';
import { Logo } from './Logo';
import {
  BeamColumnJointMotif,
  RebarCrossSectionMotif,
  SurveyorOpticalMotif,
  StructuralTrussMotif,
} from './Common/EngineeringMotifs';

interface DashboardProps {
  onNavigate: (viewId: string) => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  history?: HistoryItem[];
  onOpenHistory?: () => void;
  initialShowFavorites?: boolean;
}

const FIELD_PRO_TIPS = [
  {
    icon: '🏗️',
    title: 'Concrete 7-Day Strength Rule',
    tip: 'Standard concrete achieves ~65% of its 28-day design compressive strength within just 7 days of continuous moist curing.',
    tag: 'Concrete Technology',
    accentBorder: 'border-amber-500/30',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
  },
  {
    icon: '⚡',
    title: 'D²/162.2 Unit Weight Derivation',
    tip: 'Standard rebar unit weight (kg/m) = (π × D² / 4) × 7,850 kg/m³ ÷ 1,000,000 = D² / 162.197.',
    tag: 'RCC Reinforcement',
    accentBorder: 'border-orange-500/30',
    accentBg: 'bg-orange-500/10',
    accentText: 'text-orange-400',
  },
  {
    icon: '🧱',
    title: '1 m³ Brickwork Constant',
    tip: '1 cubic meter of 10-inch brick masonry with 1:6 mortar requires 500 standard modular bricks and ~0.25 m³ dry mortar.',
    tag: 'Masonry & Mortar',
    accentBorder: 'border-rose-500/30',
    accentBg: 'bg-rose-500/10',
    accentText: 'text-rose-400',
  },
  {
    icon: '📐',
    title: 'Leveling Field Check Formula',
    tip: 'Always verify HI leveling sheets with arithmetic check: Σ BS - Σ FS = Last Reduced Level (RL) - First Reduced Level.',
    tag: 'Surveying Optics',
    accentBorder: 'border-emerald-500/30',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
  },
  {
    icon: '🚜',
    title: 'Earthwork Bulking Swell Factor',
    tip: 'Freshly excavated undisturbed earth expands by 15% to 25% in volume when loaded into dump haulage trucks.',
    tag: 'Earthwork & Haul',
    accentBorder: 'border-yellow-500/30',
    accentBg: 'bg-yellow-500/10',
    accentText: 'text-yellow-400',
  },
  {
    icon: '💧',
    title: "Abrams' Water-Cement Law",
    tip: 'Compressive strength of concrete increases non-linearly as the water-cement ratio drops between 0.40 and 0.45.',
    tag: 'Mix Design',
    accentBorder: 'border-cyan-500/30',
    accentBg: 'bg-cyan-500/10',
    accentText: 'text-cyan-400',
  },
];

const CATEGORY_THEMES: Record<string, {
  label: string;
  badge: string;
  dot: string;
  activeBtn: string;
  borderHover: string;
  iconBg: string;
}> = {
  all: {
    label: 'All Tools',
    badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    dot: 'bg-cyan-400',
    activeBtn: 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30',
    borderHover: 'hover:border-cyan-500/40',
    iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  converters: {
    label: 'Unit Conversion',
    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    dot: 'bg-sky-400',
    activeBtn: 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30',
    borderHover: 'hover:border-sky-500/40',
    iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  concrete: {
    label: 'Concrete & Materials',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
    activeBtn: 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30',
    borderHover: 'hover:border-amber-500/40',
    iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  rebar: {
    label: 'RCC & Reinforcement',
    badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    dot: 'bg-orange-400',
    activeBtn: 'bg-orange-500 text-slate-950 font-bold shadow-md shadow-orange-500/30',
    borderHover: 'hover:border-orange-500/40',
    iconBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  masonry: {
    label: 'Masonry & Plaster',
    badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    dot: 'bg-rose-400',
    activeBtn: 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30',
    borderHover: 'hover:border-rose-500/40',
    iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  structural: {
    label: 'Structural Prelim',
    badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    dot: 'bg-indigo-400',
    activeBtn: 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/30',
    borderHover: 'hover:border-indigo-500/40',
    iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  earthwork: {
    label: 'Earthwork & Haulage',
    badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    dot: 'bg-yellow-400',
    activeBtn: 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/30',
    borderHover: 'hover:border-yellow-500/40',
    iconBg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  surveying: {
    label: 'Surveying & Levels',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    activeBtn: 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30',
    borderHover: 'hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  estimation: {
    label: 'Estimation & BOQ',
    badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    dot: 'bg-purple-400',
    activeBtn: 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/30',
    borderHover: 'hover:border-purple-500/40',
    iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  geometry: {
    label: 'Geometry',
    badge: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    dot: 'bg-teal-400',
    activeBtn: 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30',
    borderHover: 'hover:border-teal-500/40',
    iconBg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  utilities: {
    label: 'Utilities',
    badge: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    dot: 'bg-fuchsia-400',
    activeBtn: 'bg-fuchsia-500 text-white font-bold shadow-md shadow-fuchsia-500/30',
    borderHover: 'hover:border-fuchsia-500/40',
    iconBg: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  },
};

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  favorites,
  onToggleFavorite,
  history = [],
  onOpenHistory,
  initialShowFavorites = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(initialShowFavorites);
  const [tipIndex, setTipIndex] = useState<number>(0);

  React.useEffect(() => {
    if (initialShowFavorites !== undefined) {
      setShowOnlyFavorites(initialShowFavorites);
    }
  }, [initialShowFavorites]);

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

  // Specific 7 Quick Actions with distinctive energetic color identities
  const primaryQuickActions = [
    {
      id: 'unit-converter',
      name: 'Unit Converter',
      icon: ArrowLeftRight,
      desc: 'Instant conversion with regional land units',
      color: 'text-sky-400',
      tag: 'Conversions',
      gradient: 'from-sky-500/15 via-cyan-500/5 to-transparent',
      border: 'border-sky-500/25 hover:border-sky-400',
      iconBox: 'bg-sky-500/15 border border-sky-500/30 text-sky-400',
    },
    {
      id: 'concrete-mix',
      name: 'Concrete Mix',
      icon: Layers,
      desc: 'Cement bags, sand CFT & stone breakdown',
      color: 'text-amber-400',
      tag: 'Mix Design',
      gradient: 'from-amber-500/15 via-yellow-500/5 to-transparent',
      border: 'border-amber-500/25 hover:border-amber-400',
      iconBox: 'bg-amber-500/15 border border-amber-500/30 text-amber-400',
    },
    {
      id: 'rebar-weight',
      name: 'Rebar Calculator',
      icon: AlignJustify,
      desc: 'D²/162.2 steel reinforcement mass',
      color: 'text-orange-400',
      tag: 'RCC Steel',
      gradient: 'from-orange-500/15 via-red-500/5 to-transparent',
      border: 'border-orange-500/25 hover:border-orange-400',
      iconBox: 'bg-orange-500/15 border border-orange-500/30 text-orange-400',
    },
    {
      id: 'brickwork',
      name: 'Brickwork & Mortar',
      icon: Grid,
      desc: 'Brick count with opening deductions',
      color: 'text-rose-400',
      tag: 'Masonry',
      gradient: 'from-rose-500/15 via-pink-500/5 to-transparent',
      border: 'border-rose-500/25 hover:border-rose-400',
      iconBox: 'bg-rose-500/15 border border-rose-500/30 text-rose-400',
    },
    {
      id: 'earthwork-excavation',
      name: 'Earthwork & Haul',
      icon: Mountain,
      desc: 'Excavation volumes & trench profiles',
      color: 'text-yellow-400',
      tag: 'Excavation',
      gradient: 'from-yellow-500/15 via-amber-500/5 to-transparent',
      border: 'border-yellow-500/25 hover:border-yellow-400',
      iconBox: 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
    },
    {
      id: 'boq-calculator',
      name: 'BOQ Estimator',
      icon: Receipt,
      desc: 'Bill of quantities with overhead & taxes',
      color: 'text-purple-400',
      tag: 'Costing',
      gradient: 'from-purple-500/15 via-indigo-500/5 to-transparent',
      border: 'border-purple-500/25 hover:border-purple-400',
      iconBox: 'bg-purple-500/15 border border-purple-500/30 text-purple-400',
    },
    {
      id: 'quantity-takeoff',
      name: 'Quantity Takeoff',
      icon: FileSpreadsheet,
      desc: 'L × W × H dimensional measurement sheet',
      color: 'text-emerald-400',
      tag: 'Takeoff',
      gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
      border: 'border-emerald-500/25 hover:border-emerald-400',
      iconBox: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400',
    },
  ];

  // Random tool launcher (Fun exploratory feature)
  const handleRandomTool = () => {
    const validTools = TOOLS_CATALOG.filter(t => t.id !== 'dashboard');
    const random = validTools[Math.floor(Math.random() * validTools.length)];
    if (random) {
      onNavigate(random.id);
    }
  };

  const handleNextTip = () => {
    setTipIndex(prev => (prev + 1) % FIELD_PRO_TIPS.length);
  };

  const currentTip = FIELD_PRO_TIPS[tipIndex];

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
      {/* 1. Hero Workspace Hub */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-sky-50/40 to-slate-50 dark:from-[#111827] dark:via-[#0E1526] dark:to-[#141B2D] p-6 sm:p-10 shadow-2xl overflow-hidden engineering-grid">
        {/* Colorful Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* Architectural 2D Vector Watermarks */}
        <div className="absolute -top-4 -right-4 opacity-15 pointer-events-none">
          <StructuralTrussMotif size={220} />
        </div>
        <div className="absolute bottom-2 right-1/3 opacity-10 pointer-events-none hidden md:block">
          <BeamColumnJointMotif size={140} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Logo variant="full" height={38} className="drop-shadow-md" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-wood font-normal tracking-wide text-slate-900 dark:text-white leading-tight">
              Civil Engineering Calculations.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-amber-500 dark:from-cyan-400 dark:via-sky-400 dark:to-amber-400 block sm:inline">
                Simplified.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95"
              >
                <span>Explore All Tools</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Fun Random Tool Button */}
              <button
                type="button"
                onClick={handleRandomTool}
                className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-amber-500/10 active:scale-95 group"
                title="Roll the engineering dice to open a random calculator!"
              >
                <Dices className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
                <span>Surprise Me</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('unit-converter')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Universal Unit Converter</span>
              </button>
            </div>
          </div>

          {/* Architectural Typographic Badge on Desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center p-8 rounded-2xl border border-sky-200 dark:border-cyan-500/20 bg-gradient-to-b from-white to-sky-50/50 dark:from-[#111827] dark:to-[#0B0F19] backdrop-blur-sm shadow-xl shrink-0 text-center min-w-[280px] relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 opacity-10 pointer-events-none">
              <RebarCrossSectionMotif size={120} />
            </div>
            <span className="font-wood font-normal text-4xl text-slate-900 dark:text-slate-100 tracking-wider block drop-shadow-md">
              PB CivilLab
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400 font-semibold mt-2 block font-sans">
              Calculate Smarter. Build Better.
            </span>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 w-full flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>OFFICIAL ENGINEERING SUITE</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Banner - Colorful highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-white/5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-cyan-500/30">
            <span className="text-lg sm:text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 block">
              {TOOLS_CATALOG.length}+
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Engineering Tools</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-emerald-500/30">
            <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
              100+
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Standard Units</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-amber-500/30">
            <span className="text-lg sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 block">
              100%
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Offline Capable</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-purple-500/30">
            <span className="text-lg sm:text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 block">
              4 Standards
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">BNBC · ACI · IS · ASTM</span>
          </div>
        </div>
      </div>

      {/* 1.2 Interactive Field Pro Tip Banner (Fun Civil Wisdom) */}
      <div className={`relative rounded-2xl border ${currentTip.accentBorder} ${currentTip.accentBg} bg-white/90 dark:bg-[#111827]/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm shadow-sm dark:shadow-md transition-all`}>
        <div className="flex items-start gap-3.5">
          <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 select-none">
            {currentTip.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${currentTip.accentBorder} ${currentTip.accentText}`}>
                {currentTip.tag}
              </span>
              <span className="text-xs font-wood font-normal tracking-wide text-slate-900 dark:text-slate-100">
                {currentTip.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-3xl">
              {currentTip.tip}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextTip}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95 group shadow-sm self-end sm:self-center"
          title="Show next field wisdom tip"
        >
          <RefreshCw className="w-3 h-3 text-cyan-600 dark:text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
          <span>Next Tip</span>
        </button>
      </div>

      {/* 1.5 Recent Calculations Resume Bar (if any) */}
      {history.length > 0 && (
        <section aria-labelledby="recent-calcs-heading" className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 id="recent-calcs-heading" className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
                Recent Calculations
              </h2>
            </div>
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
              >
                View All ({history.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {history.slice(0, 5).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.toolId)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 hover:border-cyan-500/40 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all text-left group shrink-0 active:scale-95"
              >
                <span className="font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-300 truncate max-w-[140px]">
                  {item.toolName}
                </span>
                <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400/90 font-semibold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/15">
                  {item.summary}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2. Quick Actions (Section 4) */}
      <section aria-labelledby="quick-actions-heading">
        <div className="flex items-center justify-between mb-3.5">
          <h2 id="quick-actions-heading" className="text-base font-wood font-normal text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Essential field and office workflows</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {primaryQuickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className={`p-4 rounded-xl border bg-gradient-to-b ${action.gradient} bg-white dark:bg-[#111827] ${action.border} transition-all text-left group shadow-sm flex flex-col justify-between hover:scale-[1.02] active:scale-95`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.iconBox} group-hover:scale-110 transition-transform shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                      {action.tag}
                    </span>
                  </div>
                  <h3 className={`text-xs sm:text-sm font-wood font-normal text-slate-900 dark:text-slate-100 group-hover:${action.color} transition-colors mb-1 tracking-wide`}>
                    {action.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                    {action.desc}
                  </p>
                </div>
                <div className={`mt-3 pt-2 border-t border-white/5 flex items-center text-[10px] ${action.color} font-semibold group-hover:translate-x-0.5 transition-transform`}>
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
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-wood font-normal text-slate-900 dark:text-slate-100 tracking-wide">
                  Recent Calculations
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">({history.length})</span>
              </div>
              {history.length > 0 && onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 font-semibold"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mx-auto flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Recent Calculations</p>
                  <p className="text-xs text-slate-500 mt-0.5">Your recent calculations will appear here with automatic history preservation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('concrete-mix')}
                  className="px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
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
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A] hover:border-cyan-500/40 hover:bg-slate-100 dark:hover:bg-[#151C2B] text-left transition-colors group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{item.toolName}</span>
                        <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                        {item.summary}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-sans">
                        {item.result?.title}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>1-Click Restore</span>
                      <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Snapshot (Section 4) */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/10 mb-4">
              <Briefcase className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-base font-wood font-normal text-slate-900 dark:text-slate-100 tracking-wide">
                Project Snapshot
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Project Scope</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200 text-sm block">{projectSnapshot.projectName}</span>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">Active Workspace · Local Storage</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Calculations Logged</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{projectSnapshot.totalCalculationsLogged}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Preliminary Items</span>
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{projectSnapshot.pendingAuditItems}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block mb-1">Standard Code Profiles</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono leading-relaxed">{projectSnapshot.verifiedCodeProfiles}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/5 mt-4 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('boq-calculator')}
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
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
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 id="favorites-heading" className="text-base font-wood font-normal text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Pinned Favorites
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">({favoriteTools.length})</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Quick-access pinned tools</span>
        </div>

        {favoriteTools.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-center space-y-2 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Favorites Pinned</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pin frequently used tools for quick access using the star icon on any calculator.</p>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('tools-catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
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
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/60 dark:border-cyan-500/20">
                      {tool.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(tool.id)}
                      title="Remove from favorites"
                      className="text-amber-500 hover:text-slate-400 p-1 rounded transition-colors"
                    >
                      <Star className="w-4 h-4 fill-amber-500" />
                    </button>
                  </div>
                  <h3 className="text-sm font-wood font-normal text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors tracking-wide mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(tool.id)}
                  className="mt-4 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400 font-semibold group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors"
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
            <h2 className="text-xl font-wood font-normal text-slate-900 dark:text-slate-100 tracking-wide">Engineering Tool Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
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
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 w-44 sm:w-60 font-medium shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                showOnlyFavorites
                  ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Favorites</span>
            </button>
          </div>
        </div>

        {showOnlyFavorites && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-semibold">Favorites Filter Active:</span>
              <span>Showing {filteredTools.length} pinned calculators.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowOnlyFavorites(false)}
              className="text-xs font-semibold underline hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"
            >
              Show All Tools
            </button>
          </div>
        )}

        {/* Category Filter Pills - Domain-Colored */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map(cat => {
            const isCatSelected = selectedCategory === cat.id;
            const theme = CATEGORY_THEMES[cat.id] || CATEGORY_THEMES.all;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                  isCatSelected
                    ? theme.activeBtn
                    : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Tools Cards Grid */}
        {filteredTools.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-center flex flex-col items-center justify-center space-y-3 shadow-md">
            <SurveyorOpticalMotif size={90} className="text-sky-600/40 dark:text-cyan-400/40 mb-1" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Engineering Tools Found
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              {searchQuery ? `No calculators matched "${searchQuery}".` : 'No tools found in the selected filter.'} Try searching for keywords like rebar, concrete, brick, slope, or unit conversion.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setShowOnlyFavorites(false);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => {
            const isFav = favorites.includes(tool.id);
            const theme = CATEGORY_THEMES[tool.category] || CATEGORY_THEMES.all;

            return (
              <div
                key={tool.id}
                className={`p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] ${theme.borderHover} hover:bg-slate-50 dark:hover:bg-[#151C2B] transition-all group flex flex-col justify-between shadow-sm hover:shadow-md hover:scale-[1.01]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badge}`}>
                      {tool.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(tool.id)}
                      title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-base font-wood font-normal text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors mb-2 tracking-wide">
                    {tool.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-sans">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {tool.keywords.slice(0, 3).map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded font-mono"
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
      )}
      </div>

      {/* Engineering Philosophy Notice */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs text-slate-600 dark:text-slate-300 space-y-3 font-sans shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h4 className="font-wood font-normal text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            The PB CivilLab Calculation Contract
          </h4>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">BNBC · ACI 318 · IS 456 · ASTM Standard Alignment</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Every mathematical formula executed in PB CivilLab uses standardized structural and geotechnical derivations.
          All volume calculations, bar bending deductions, cement dry-factors, and leveling sheets undergo arithmetic checks
          before rendering. Always verify field measurements with certified structural engineer signatures before physical construction.
        </p>
      </div>

      {/* Creator Attribution & Copyright Footer */}
      <footer className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-sans">
        <div className="flex items-center gap-3">
          <Logo variant="full" height={28} showTagline={true} />
        </div>
        <div className="text-center sm:text-right space-y-0.5">
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            Designed & Developed by <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Prokash Biswas</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Copyright © 2026 Prokash Biswas. All rights reserved. · v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
};
