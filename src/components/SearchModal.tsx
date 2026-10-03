import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  ArrowRight,
  BookOpen,
  Calculator,
  ArrowLeftRight,
  Clock,
  Star,
  CornerDownLeft,
  ChevronRight,
  TrendingUp,
  Hash,
  Scale,
  Compass,
  Layers,
} from 'lucide-react';
import { TOOLS_CATALOG, FORMULA_LIBRARY } from '../constants/engineering';
import { BUILTIN_UNIT_CATEGORIES, getUnitsForCategory } from '../utils/units';
import { Tool, FormulaItem } from '../types';
import { Logo } from './Logo';
import { SurveyorOpticalMotif } from './Common/EngineeringMotifs';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string, options?: { initialTab?: string; unitCategory?: string }) => void;
  favorites?: string[];
}

interface UnitSearchResult {
  id: string;
  name: string;
  symbol: string;
  category: string;
  civilNote?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  favorites = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [toolFrequencies, setToolFrequencies] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);

  // Load local analytics on open
  useEffect(() => {
    if (isOpen) {
      try {
        const rawRecents = localStorage.getItem('pb_civillab_recent_tools');
        if (rawRecents) setRecentToolIds(JSON.parse(rawRecents));

        const rawFreq = localStorage.getItem('pb_civillab_tool_frequencies');
        if (rawFreq) setToolFrequencies(JSON.parse(rawFreq));
      } catch {}

      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Record tool selection into local analytics
  const handleSelectTool = (toolId: string) => {
    try {
      const raw = localStorage.getItem('pb_civillab_recent_tools');
      const recents: string[] = raw ? JSON.parse(raw) : [];
      const updated = [toolId, ...recents.filter(id => id !== toolId)].slice(0, 8);
      localStorage.setItem('pb_civillab_recent_tools', JSON.stringify(updated));

      const rawFreq = localStorage.getItem('pb_civillab_tool_frequencies');
      const freq: Record<string, number> = rawFreq ? JSON.parse(rawFreq) : {};
      freq[toolId] = (freq[toolId] || 0) + 1;
      localStorage.setItem('pb_civillab_tool_frequencies', JSON.stringify(freq));
    } catch {}

    onNavigate(toolId);
    onClose();
  };

  // Pre-compiled list of all searchable engineering units
  const allSearchableUnits = useMemo(() => {
    const list: UnitSearchResult[] = [];
    Object.values(BUILTIN_UNIT_CATEGORIES).forEach(cat => {
      const units = getUnitsForCategory(cat.id);
      units.forEach(u => {
        list.push({
          id: u.id,
          name: u.name,
          symbol: u.symbol,
          category: cat.id,
          civilNote: u.civilNote,
        });
      });
    });
    return list;
  }, []);

  // Multi-tier intelligent relevance engine
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // EMPTY QUERY: Display Recents, Favorites, and Quick Tools
    if (!q) {
      const recents = recentToolIds
        .map(id => TOOLS_CATALOG.find(t => t.id === id))
        .filter((t): t is Tool => Boolean(t))
        .slice(0, 4);

      const favTools = favorites
        .map(id => TOOLS_CATALOG.find(t => t.id === id))
        .filter((t): t is Tool => Boolean(t))
        .slice(0, 4);

      // Default popular tools fallback
      const defaultTools = TOOLS_CATALOG.slice(0, 6);

      return {
        isQueryEmpty: true,
        tools: recents.length > 0 ? recents : defaultTools,
        favoriteTools: favTools,
        units: [],
        formulas: [],
        totalCount: (recents.length > 0 ? recents.length : defaultTools.length) + favTools.length,
      };
    }

    // NON-EMPTY QUERY: Compute relevance scores
    const scoredTools: { tool: Tool; score: number }[] = [];

    TOOLS_CATALOG.forEach(tool => {
      let score = 0;
      const name = tool.name.toLowerCase();
      const desc = tool.description.toLowerCase();
      const cat = tool.category.toLowerCase();

      // 1. Exact Name Match
      if (name === q) score += 2000;
      // 2. Name Starts With Query
      else if (name.startsWith(q)) score += 1200;
      // 3. Word in name starts with query
      else if (name.split(/\s+/).some(w => w.startsWith(q))) score += 800;
      // 4. Name contains query
      else if (name.includes(q)) score += 500;

      // 5. Keyword Matches
      tool.keywords.forEach(kw => {
        const k = kw.toLowerCase();
        if (k === q) score += 600;
        else if (k.startsWith(q)) score += 350;
        else if (k.includes(q)) score += 200;
      });

      // 6. Category Match
      if (cat === q) score += 400;
      else if (cat.includes(q)) score += 200;

      // 7. Description contains query
      if (desc.includes(q)) score += 100;

      // 8. Specific Civil Engineering Natural Aliases & Unit triggers
      if (['cft', 'cu.ft', 'cubic foot', 'cubic feet'].includes(q)) {
        if (tool.id === 'concrete-volume' || tool.id === 'concrete-mix' || tool.id === 'unit-converter' || tool.id === 'earthwork-excavation') score += 750;
      }
      if (['m3', 'cum', 'cu.m', 'cubic meter'].includes(q)) {
        if (tool.id === 'concrete-volume' || tool.id === 'unit-converter' || tool.id === 'rate-analysis' || tool.id === 'soil-conversion') score += 750;
      }
      if (['steel', 'rod', 'rebar weight', 'kg/m', 'd2/162'].includes(q)) {
        if (tool.id === 'rebar-weight' || tool.id === 'bbs-helper' || tool.id === 'rcc-steel-estimator') score += 900;
      }
      if (['rl', 'hi', 'bm', 'reduced level', 'staff', 'backsight'].includes(q)) {
        if (tool.id === 'level-hi-method' || tool.id === 'level-rise-fall') score += 950;
      }
      if (['boq', 'bill of quantities', 'estimate', 'tender', 'cost'].includes(q)) {
        if (tool.id === 'boq-calculator' || tool.id === 'quantity-takeoff' || tool.id === 'rate-analysis') score += 850;
      }
      if (['brick', 'mortar', 'wall', 'sand'].includes(q)) {
        if (tool.id === 'brickwork' || tool.id === 'plaster') score += 800;
      }
      if (['decimal', 'katha', 'bigha', 'land', 'satak'].includes(q)) {
        if (tool.id === 'unit-converter' || tool.id === 'quantity-takeoff') score += 850;
      }
      if (['slab', 'one way', 'two way'].includes(q)) {
        if (tool.id === 'slab-calculator' || tool.id === 'concrete-volume' || tool.id === 'rcc-steel-estimator') score += 850;
      }

      // 9. Local Usage Frequency Bonus
      const freq = toolFrequencies[tool.id] || 0;
      if (freq > 0) {
        score += Math.min(freq * 15, 150);
      }

      if (score > 0) {
        scoredTools.push({ tool, score });
      }
    });

    // Sort tools descending by score
    scoredTools.sort((a, b) => b.score - a.score);
    const matchedTools = scoredTools.slice(0, 8).map(s => s.tool);

    // Matching Units
    const matchedUnits = allSearchableUnits
      .filter(u => {
        const sym = u.symbol.toLowerCase();
        const nm = u.name.toLowerCase();
        const cat = u.category.toLowerCase();
        return (
          sym === q ||
          sym.startsWith(q) ||
          nm.includes(q) ||
          (u.civilNote && u.civilNote.toLowerCase().includes(q)) ||
          cat === q
        );
      })
      .slice(0, 3);

    // Matching Formulas
    const matchedFormulas = FORMULA_LIBRARY.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.notes.toLowerCase().includes(q)
    ).slice(0, 3);

    const totalCount = matchedTools.length + matchedUnits.length + matchedFormulas.length;

    return {
      isQueryEmpty: false,
      tools: matchedTools,
      favoriteTools: [],
      units: matchedUnits,
      formulas: matchedFormulas,
      totalCount,
    };
  }, [query, recentToolIds, toolFrequencies, favorites, allSearchableUnits]);

  // Handle keyboard navigation across entire list
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const maxIdx = Math.max(0, searchResults.totalCount - 1);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < maxIdx ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIdx));
      } else if (e.key === 'Enter') {
        e.preventDefault();

        // Handle empty query (Recents vs Favorites)
        if (searchResults.isQueryEmpty) {
          const allEmptyItems = [...searchResults.tools, ...searchResults.favoriteTools];
          const selected = allEmptyItems[selectedIndex];
          if (selected) {
            handleSelectTool(selected.id);
          }
          return;
        }

        // Handle query results: Tools -> Units -> Formulas
        const toolCount = searchResults.tools.length;
        const unitCount = searchResults.units.length;

        if (selectedIndex < toolCount) {
          const tool = searchResults.tools[selectedIndex];
          if (tool) handleSelectTool(tool.id);
        } else if (selectedIndex < toolCount + unitCount) {
          const unit = searchResults.units[selectedIndex - toolCount];
          if (unit) {
            onNavigate('unit-converter', { unitCategory: unit.category });
            onClose();
          }
        } else {
          onNavigate('formula-library');
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onNavigate, onClose]);

  // Clean Category Breadcrumb
  const getCategoryBreadcrumb = (category: string): string => {
    switch (category) {
      case 'concrete': return 'Materials & Concrete';
      case 'rebar': return 'Structural & Rebar';
      case 'masonry': return 'Masonry & Plaster';
      case 'structural': return 'RCC & Structural';
      case 'earthwork': return 'Earthwork & Haulage';
      case 'surveying': return 'Surveying & Geometry';
      case 'estimation': return 'Costing & BOQ';
      case 'geometry': return 'Surveying & Geometry';
      case 'converters': return 'Unit Conversions';
      default: return 'Engineering Suite';
    }
  };

  const getToolIcon = (category: string) => {
    switch (category) {
      case 'concrete': return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'rebar': return <Scale className="w-4 h-4 text-cyan-400" />;
      case 'masonry': return <Calculator className="w-4 h-4 text-cyan-400" />;
      case 'structural': return <Calculator className="w-4 h-4 text-cyan-400" />;
      case 'earthwork': return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'surveying': return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'estimation': return <Hash className="w-4 h-4 text-cyan-400" />;
      case 'converters': return <ArrowLeftRight className="w-4 h-4 text-cyan-400" />;
      default: return <Calculator className="w-4 h-4 text-cyan-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with Material blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm no-print"
      />

      {/* Floating Material Palette Container */}
      <div className="fixed inset-x-3 sm:inset-x-6 top-12 sm:top-20 z-50 max-w-2xl mx-auto rounded-2xl border border-white/15 bg-gradient-to-b from-[#111827] to-[#0B0F19] shadow-2xl overflow-hidden no-print animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Search Input Bar (Material Elevation) */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#151C2B] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search calculators, tools, formulas, units (e.g. c, reb, CFT, slab, RL)..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded font-mono bg-white/5 border border-white/10 text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Scrollable Suggestion Body */}
        <div ref={resultListRef} className="overflow-y-auto p-2 sm:p-3 space-y-4 text-xs flex-1">
          {/* STATE 1: EMPTY QUERY (Recent & Favorite Launchers) */}
          {searchResults.isQueryEmpty && (
            <div className="space-y-4">
              {/* Recently Used */}
              {searchResults.tools.length > 0 && (
                <div>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Recently Opened & Recommended Tools</span>
                  </span>
                  <div className="space-y-1">
                    {searchResults.tools.map((tool, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleSelectTool(tool.id)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between group transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-sm'
                              : 'hover:bg-white/5 border border-transparent text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-cyan-500/25 text-cyan-300' : 'bg-white/5 text-cyan-400'}`}>
                              {getToolIcon(tool.category)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-wood font-normal text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 tracking-wide truncate">
                                {tool.name}
                              </h4>
                              <span className="text-[11px] font-mono text-cyan-400 block">
                                {getCategoryBreadcrumb(tool.category)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {isSelected && (
                              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                                <CornerDownLeft className="w-3 h-3" /> Launch
                              </span>
                            )}
                            <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pinned Favorites */}
              {searchResults.favoriteTools.length > 0 && (
                <div>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Pinned Favorites</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {searchResults.favoriteTools.map((fav, fIdx) => {
                      const itemIdx = searchResults.tools.length + fIdx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <button
                          key={fav.id}
                          onClick={() => handleSelectTool(fav.id)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/40 text-white'
                              : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-slate-100 block truncate">{fav.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{getCategoryBreadcrumb(fav.category)}</span>
                            </div>
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Jump Topic Chips */}
              <div className="pt-1">
                <span className="px-2 text-[10px] uppercase font-mono text-slate-500 block mb-2">
                  Popular Topics & Quick Searches
                </span>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {[
                    { label: 'Concrete (CFT/m³)', q: 'concrete' },
                    { label: 'Rebar Steel Weight', q: 'rebar' },
                    { label: 'BOQ Estimator', q: 'boq' },
                    { label: 'Surveying Level (RL)', q: 'level' },
                    { label: 'Brickwork & Mortar', q: 'brick' },
                    { label: 'Slab Calculation', q: 'slab' },
                    { label: 'Feet-Inch Decimal', q: 'feet' },
                    { label: 'Unit Converter', q: 'unit' },
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => {
                        setQuery(chip.q);
                        inputRef.current?.focus();
                      }}
                      className="px-2.5 py-1 rounded-lg border border-white/10 bg-[#0F172A] hover:border-cyan-500/40 hover:bg-[#151C2B] text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: ACTIVE QUERY RESULTS */}
          {!searchResults.isQueryEmpty && (
            <div className="space-y-4">
              {/* Calculators & Tools */}
              {searchResults.tools.length > 0 && (
                <div>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Calculators & Engineering Tools ({searchResults.tools.length})
                  </span>
                  <div className="space-y-1">
                    {searchResults.tools.map((tool, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleSelectTool(tool.id)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full p-2.5 sm:p-3 rounded-xl text-left flex items-center justify-between group transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-sm'
                              : 'hover:bg-white/5 border border-transparent text-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-cyan-500/25 text-cyan-300' : 'bg-white/5 text-cyan-400'}`}>
                              {getToolIcon(tool.category)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-wood font-normal text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 tracking-wide truncate">
                                {tool.name}
                              </h4>
                              <span className="text-[11px] font-mono text-cyan-400 block mt-0.5">
                                {getCategoryBreadcrumb(tool.category)}
                              </span>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {isSelected && (
                              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                                <CornerDownLeft className="w-3 h-3" /> Select
                              </span>
                            )}
                            <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Units & Physical Quantities */}
              {searchResults.units.length > 0 && (
                <div>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Units & Quick Conversions ({searchResults.units.length})
                  </span>
                  <div className="space-y-1">
                    {searchResults.units.map((unit, uIdx) => {
                      const itemIdx = searchResults.tools.length + uIdx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <button
                          key={unit.id + uIdx}
                          onClick={() => {
                            onNavigate('unit-converter', { unitCategory: unit.category });
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between group transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                              : 'hover:bg-white/5 border border-transparent text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-xs text-cyan-300 shrink-0">
                              {unit.symbol}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-slate-100 block">
                                {unit.name} ({unit.symbol})
                              </span>
                              <span className="text-[10px] text-cyan-400 font-mono block">
                                Category: {unit.category.toUpperCase()} {unit.civilNote ? `· ${unit.civilNote}` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400">
                            <span>Open Converter</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formulas & Code References */}
              {searchResults.formulas.length > 0 && (
                <div>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Engineering Equations ({searchResults.formulas.length})
                  </span>
                  <div className="space-y-1">
                    {searchResults.formulas.map((f, fIdx) => {
                      const itemIdx = searchResults.tools.length + searchResults.units.length + fIdx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            onNavigate('formula-library');
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between group transition-colors ${
                            isSelected
                              ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                              : 'hover:bg-white/5 border border-transparent text-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-amber-500/25 text-amber-300' : 'bg-white/5 text-amber-400'}`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs text-slate-100 group-hover:text-amber-300 truncate">
                                {f.name}
                              </h4>
                              <span className="font-mono text-[11px] text-cyan-400 block mt-0.5">{f.formula}</span>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{f.notes}</p>
                            </div>
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ml-3 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STATE 3: ZERO RESULTS */}
              {searchResults.totalCount === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-3 flex flex-col items-center">
                  <div className="opacity-40 mb-1">
                    <SurveyorOpticalMotif size={72} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">No matching engineering tools found</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      No results for <strong className="text-cyan-300 font-mono">"{query}"</strong>
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] uppercase font-mono text-slate-500 block mb-2">
                      Try searching one of these key terms:
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                      {['concrete', 'rebar', 'CFT', 'BOQ', 'surveying', 'slab', 'brickwork', 'plaster'].map(term => (
                        <button
                          key={term}
                          onClick={() => {
                            setQuery(term);
                            inputRef.current?.focus();
                          }}
                          className="px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono transition-colors"
                        >
                          • {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar with Keyboard Instruction & Brand */}
        <div className="p-3 bg-[#111827] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Logo variant="icon" height={15} />
            <span className="font-wood font-normal text-slate-300">PB CivilLab</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-[10px] text-cyan-400">Intelligent Launcher</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="hidden sm:inline">↑↓ navigate</span>
            <span className="hidden sm:inline">↵ open</span>
            <span>ESC close</span>
          </div>
        </div>
      </div>
    </>
  );
};
