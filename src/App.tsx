/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UnitConverterModule } from './components/UnitConverterModule';
import { RebarCalculator } from './components/Calculators/RebarCalculator';
import { ConcreteCalculator } from './components/Calculators/ConcreteCalculator';
import { BrickPlasterCalculator } from './components/Calculators/BrickPlasterCalculator';
import { StructuralCalculator } from './components/Calculators/StructuralCalculator';
import { EarthworkCalculator } from './components/Calculators/EarthworkCalculator';
import { SurveyingCalculator } from './components/Calculators/SurveyingCalculator';
import { EstimationCalculator } from './components/Calculators/EstimationCalculator';
import { GeometryCalculator } from './components/Calculators/GeometryCalculator';
import { FeetInchCalculator } from './components/Calculators/FeetInchCalculator';
import { FormulaLibraryView } from './components/FormulaLibraryView';
import { ReferenceTablesView } from './components/ReferenceTablesView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { SearchModal } from './components/SearchModal';
import { ProjectWorkspaceModal } from './components/Common/ProjectWorkspaceModal';
import { RateLibraryModal } from './components/Common/RateLibraryModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ToastProvider } from './components/Common/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ThemeProvider } from './context/ThemeContext';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AppSettings, CalculationResult, HistoryItem, ProjectWorkspace } from './types';
import { REGIONAL_PROFILES, TOOLS_CATALOG } from './constants/engineering';
import { DEFAULT_USER_PROFILE } from './utils/storage';
import { ChevronRight } from 'lucide-react';
import { Logo } from './components/Logo';

const DEFAULT_INITIAL_PROJECT: ProjectWorkspace = {
  id: 'proj_default',
  name: 'Default Engineering Workspace',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  meta: {
    projectName: 'General Project Workspace',
    client: 'Site Engineering Office',
    location: 'Jobsite Location',
    preparedBy: 'Prokash Biswas, Lead Engineer',
    documentNumber: 'PBCL-2026-0001',
    reportStatus: 'Draft',
  },
  history: [],
  currency: 'BDT',
  currencySymbol: '৳',
};

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'BDT',
  currencySymbol: '৳',
  unitSystem: 'metric',
  decimalPrecision: 2,
  defaultCementBagKg: 50,
  defaultDryFactorConcrete: 1.54,
  defaultDryFactorPlaster: 1.33,
  defaultConcreteWastage: 3,
  regionalProfile: REGIONAL_PROFILES.bd_standard,
  userProfile: DEFAULT_USER_PROFILE,
};

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isSidebarMobile, setIsSidebarMobile] = useState(false);
  const [isProjectWorkspaceOpen, setIsProjectWorkspaceOpen] = useState(false);
  const [isRateLibraryOpen, setIsRateLibraryOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  // Settings State with LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('pb_civillab_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Project Workspaces State with LocalStorage
  const [projects, setProjects] = useState<ProjectWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem('pb_civillab_projects');
      return saved ? JSON.parse(saved) : [DEFAULT_INITIAL_PROJECT];
    } catch {
      return [DEFAULT_INITIAL_PROJECT];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pb_civillab_active_project_id');
      return saved || 'proj_default';
    } catch {
      return 'proj_default';
    }
  });

  // Favorites with LocalStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pb_civillab_favorites');
      return saved ? JSON.parse(saved) : ['rebar-weight', 'concrete-mix', 'brickwork', 'unit-converter'];
    } catch {
      return ['rebar-weight', 'concrete-mix', 'brickwork', 'unit-converter'];
    }
  });

  // History with LocalStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('pb_civillab_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Project helper
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || DEFAULT_INITIAL_PROJECT;

  // Persist Projects & Active Project ID
  useEffect(() => {
    try {
      localStorage.setItem('pb_civillab_projects', JSON.stringify(projects));
      localStorage.setItem('pb_civillab_active_project_id', activeProjectId);
    } catch (e) {
      console.warn('Could not save projects to localStorage', e);
    }
  }, [projects, activeProjectId]);

  // Sync history updates back into the active project workspace
  useEffect(() => {
    setProjects(prev =>
      prev.map(p => (p.id === activeProjectId ? { ...p, history, updatedAt: new Date().toISOString() } : p))
    );
  }, [history, activeProjectId]);

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const target = projects.find(p => p.id === projectId);
    if (target && target.history) {
      setHistory(target.history);
    }
  };

  const handleCreateProject = (name: string, meta?: any) => {
    const newProj: ProjectWorkspace = {
      id: `proj_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: meta || {
        projectName: name,
        client: 'Site Client',
        location: 'Site Location',
        preparedBy: 'Prokash Biswas, Lead Engineer',
        documentNumber: `PBCL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        reportStatus: 'Draft',
      },
      history: [],
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
    };
    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setHistory([]);
  };

  const handleUpdateProject = (updated: ProjectWorkspace) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter(p => p.id !== projectId);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0].id);
      setHistory(remaining[0].history || []);
    }
  };

  const handleImportProject = (imported: ProjectWorkspace) => {
    const safeProj: ProjectWorkspace = {
      ...imported,
      id: `proj_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProjects(prev => [safeProj, ...prev]);
    setActiveProjectId(safeProj.id);
    setHistory(safeProj.history || []);
  };

  // Theme synchronization on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('pb_civillab_theme') || 'dark';
      const root = document.documentElement;
      if (savedTheme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else if (savedTheme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
        root.classList.toggle('light', !isDark);
      }
    } catch {}
  }, []);

  // Persist Settings
  useEffect(() => {
    try {
      localStorage.setItem('pb_civillab_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }
  }, [settings]);

  // Persist Favorites
  useEffect(() => {
    try {
      localStorage.setItem('pb_civillab_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not save favorites to localStorage', e);
    }
  }, [favorites]);

  // Persist History
  useEffect(() => {
    try {
      localStorage.setItem('pb_civillab_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [history]);

  // Global Ctrl+K and / shortcut listener (Section 3 & 28)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }
      if (e.key === '/' && !isSearchOpen) {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isSearchOpen]);

  const handleToggleFavorite = (toolId: string) => {
    setFavorites(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSaveCalculation = (toolId: string, toolName: string, result: CalculationResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      toolId,
      toolName,
      timestamp: new Date().toISOString(),
      summary: `${result.primaryValue} ${result.primaryUnit}`,
      result,
    };
    setHistory(prev => [newItem, ...prev.slice(0, 49)]); // keep max 50
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleAddSampleCalculations = () => {
    const sampleItems: HistoryItem[] = [
      {
        id: `sample_${Date.now()}_1`,
        toolId: 'concrete-volume',
        toolName: 'Concrete Volume Calculator',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        summary: '24.50 m³',
        result: {
          title: 'RCC Slab & Beam Concrete Volume',
          primaryValue: '24.50',
          primaryUnit: 'm³',
          primaryCategory: 'volume',
          primaryRawValue: 24.5,
          secondaryValues: [
            { label: 'Volume in CFT', value: '865.2 CFT' },
            { label: 'Total Members', value: '2 Slabs, 4 Beams' },
            { label: 'Estimated Concrete Mass', value: '58,800 kg' },
            { label: 'Estimated Cost', value: `${settings.currencySymbol} 185,000` },
          ],
          breakdown: [
            { step: '1. Slab Panel 1 (10m × 7m × 0.15m)', expression: '10 × 7 × 0.15', result: '10.50 m³' },
            { step: '2. Slab Panel 2 (12m × 6m × 0.15m)', expression: '12 × 6 × 0.15', result: '10.80 m³' },
            { step: '3. Connecting Beams', expression: '4 × (6m × 0.25m × 0.53m)', result: '3.20 m³' },
          ],
          formula: 'V = Length × Width × Thickness',
          substitutedFormula: 'V = 10.50 + 10.80 + 3.20 = 24.50 m³',
          inputsSummary: [
            { label: 'Structural Grade', value: 'M25 (1:1:2)' },
            { label: 'Wet Concrete Volume', value: '24.50 m³' },
          ],
          assumptions: [
            { label: 'Compaction Factor', value: '0.92 per ACI 309' },
          ],
        },
      },
      {
        id: `sample_${Date.now()}_2`,
        toolId: 'rebar-weight',
        toolName: 'Rebar Weight & BBS Helper',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        summary: '1,850.5 kg',
        result: {
          title: 'Column & Beam Reinforcement Schedule',
          primaryValue: '1,850.5',
          primaryUnit: 'kg',
          primaryCategory: 'mass',
          primaryRawValue: 1850.5,
          secondaryValues: [
            { label: 'Metric Tonnes', value: '1.851 Tonnes' },
            { label: 'Total Bar Length', value: '1,170.0 m' },
            { label: 'Estimated Cost', value: `${settings.currencySymbol} 175,800` },
          ],
          breakdown: [
            { step: '1. 16mm Main Longitudinal Bars', expression: '60 bars × 12m × 1.579 kg/m', result: '1,136.9 kg' },
            { step: '2. 10mm Stirrups / Ties', expression: '360 ties × 1.95m × 0.617 kg/m', result: '433.1 kg' },
            { step: '3. 12mm Secondary Dist. Bars', expression: '32 bars × 9.8m × 0.888 kg/m', result: '280.5 kg' },
          ],
          formula: 'Weight = (D² / 162.2) × Length × Quantity',
          substitutedFormula: 'W = Σ(UnitWeight × Length × Qty) = 1,850.5 kg',
          inputsSummary: [
            { label: 'Steel Grade', value: '500W (Grade 72.5 / 500 MPa)' },
            { label: 'Bar Diameters', value: '16mm, 12mm, 10mm' },
          ],
          assumptions: [
            { label: 'Density', value: '7,850 kg/m³ per ASTM A615 / BDS 1313' },
          ],
        },
      },
      {
        id: `sample_${Date.now()}_3`,
        toolId: 'brickwork',
        toolName: 'Brick Masonry Calculator',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        summary: '12,250 Pcs',
        result: {
          title: '10" Exterior Brickwork Wall',
          primaryValue: '12,250',
          primaryUnit: 'Bricks',
          primaryCategory: 'count',
          primaryRawValue: 12250,
          secondaryValues: [
            { label: 'Total Wall Volume', value: '24.50 m³' },
            { label: 'Dry Mortar Volume', value: '6.13 m³' },
            { label: 'Cement Required', value: '28.5 Bags (50 kg)' },
            { label: 'Sand Required', value: '216.5 CFT' },
            { label: 'Estimated Cost', value: `${settings.currencySymbol} 153,125` },
          ],
          breakdown: [
            { step: '1. Gross Wall Volume', expression: '49m length × 2.0m height × 0.25m thickness', result: '24.50 m³' },
            { step: '2. Brick Demand (500/m³)', expression: '24.50 m³ × 500 bricks/m³', result: '12,250 Bricks' },
            { step: '3. Mortar 1:6 Ratio', expression: '24.50 m³ × 0.25 dry factor', result: '6.13 m³ dry mortar' },
          ],
          formula: 'Bricks = Wall Volume (m³) × 500 bricks/m³',
          substitutedFormula: 'Bricks = 24.50 × 500 = 12,250 bricks',
          inputsSummary: [
            { label: 'Wall Thickness', value: '10 inch (250 mm)' },
            { label: 'Mortar Ratio', value: '1:6 (Cement : Sand)' },
          ],
          assumptions: [
            { label: 'Standard Modular Brick', value: '240mm × 115mm × 70mm with 12mm mortar joints' },
          ],
        },
      },
      {
        id: `sample_${Date.now()}_4`,
        toolId: 'earthwork',
        toolName: 'Earthwork Calculator',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        summary: '85.00 m³',
        result: {
          title: 'Foundation Trench & Column Footing Excavation',
          primaryValue: '85.00',
          primaryUnit: 'm³',
          primaryCategory: 'volume',
          primaryRawValue: 85.0,
          secondaryValues: [
            { label: 'Volume in CFT', value: '3,001.7 CFT' },
            { label: 'Loose Swell Volume (+20%)', value: '102.00 m³' },
            { label: 'Estimated Dump Haul Trips', value: '18 Trips (6 m³ tipper)' },
            { label: 'Estimated Cost', value: `${settings.currencySymbol} 15,300` },
          ],
          breakdown: [
            { step: '1. 12 Footing Pits (2m × 2m × 1.5m)', expression: '12 × (2 × 2 × 1.5)', result: '72.00 m³' },
            { step: '2. Grade Beam Trenches', expression: '26m × 0.5m × 1.0m', result: '13.00 m³' },
          ],
          formula: 'Volume = Length × Width × Depth',
          substitutedFormula: 'V = 72.00 + 13.00 = 85.00 m³',
          inputsSummary: [
            { label: 'Soil Type', value: 'Medium Sandy Silt / Clay' },
            { label: 'Swell Bulking Factor', value: '20%' },
          ],
          assumptions: [
            { label: 'Over-excavation Margin', value: 'Includes 150mm side working space for shuttering' },
          ],
        },
      },
    ];

    setHistory(prev => [...sampleItems, ...prev]);
  };

  // Central Navigation handler with local tool analytics
  const handleNavigate = (viewId: string) => {
    setActiveView(viewId);
    try {
      const raw = localStorage.getItem('pb_civillab_recent_tools');
      const recents: string[] = raw ? JSON.parse(raw) : [];
      const updated = [viewId, ...recents.filter(id => id !== viewId)].slice(0, 8);
      localStorage.setItem('pb_civillab_recent_tools', JSON.stringify(updated));

      const rawFreq = localStorage.getItem('pb_civillab_tool_frequencies');
      const freq: Record<string, number> = rawFreq ? JSON.parse(rawFreq) : {};
      freq[viewId] = (freq[viewId] || 0) + 1;
      localStorage.setItem('pb_civillab_tool_frequencies', JSON.stringify(freq));
    } catch {}
  };

  // Find active tool metadata for breadcrumb
  const currentToolMeta = TOOLS_CATALOG.find(t => t.id === activeView);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="h-screen max-h-screen bg-[#F4F6F9] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F1F5F9] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300 overflow-hidden pb-16 lg:pb-0">
        {/* Top Header */}
        <Header
          settings={settings}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
          onToggleSidebarMobile={() => setIsSidebarMobile(true)}
          historyCount={history.length}
          favoritesCount={favorites.length}
          activeView={activeView}
          onNavigate={handleNavigate}
          activeProjectName={activeProject.name}
          onOpenProjects={() => setIsProjectWorkspaceOpen(true)}
          onOpenRateLibrary={() => setIsRateLibraryOpen(true)}
        />

        {/* Main Layout Area: Locked Split Layout */}
        <div className="flex-1 flex w-full max-w-[1720px] mx-auto min-h-0 overflow-hidden relative">
          {/* Left Sidebar: Permanently Docked & Locked */}
          <Sidebar
            activeView={activeView}
            onNavigate={handleNavigate}
            favorites={favorites}
            isOpenMobile={isSidebarMobile}
            onCloseMobile={() => setIsSidebarMobile(false)}
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsUserProfileOpen(true)}
          />

          {/* Content Viewport: Independently Scrollable Main Canvas */}
          <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-[#F4F6F9] dark:bg-[#070B12]">
            <div className="w-full flex-1">
              {/* Breadcrumb Trail (no-print) */}
            {activeView !== 'dashboard' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium no-print">
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Logo variant="icon" height={16} />
                  <span className="font-wood font-normal tracking-wide text-slate-300">PB CivilLab</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                  {currentToolMeta ? currentToolMeta.category : (activeView === 'favorites' ? 'Overview' : 'Calculator')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-cyan-400 font-semibold truncate">
                  {currentToolMeta ? currentToolMeta.name : (activeView === 'favorites' ? 'Pinned Favorites' : activeView)}
                </span>
              </div>
            )}

            {/* Active Tool Headline Banner */}
            {activeView !== 'dashboard' && currentToolMeta && (
              <div className="mb-6 pb-4 border-b border-white/10 no-print">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-widest font-mono">
                    {currentToolMeta.category}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-400 font-mono">Standard Civil Computation</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-wood font-normal text-slate-100 tracking-wide">
                  {currentToolMeta.name}
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  {currentToolMeta.description}
                </p>
              </div>
            )}

            {/* Dynamic Active View Rendering */}
            {activeView === 'dashboard' && (
              <Dashboard
                onNavigate={handleNavigate}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                history={history}
                onOpenHistory={() => setIsHistoryOpen(true)}
                activeProject={activeProject}
                onOpenProjectWorkspace={() => setIsProjectWorkspaceOpen(true)}
                onAddSampleCalculations={handleAddSampleCalculations}
                settings={settings}
              />
            )}

            {activeView === 'favorites' && (
              <Dashboard
                onNavigate={handleNavigate}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                history={history}
                onOpenHistory={() => setIsHistoryOpen(true)}
                initialShowFavorites={true}
                activeProject={activeProject}
                onOpenProjectWorkspace={() => setIsProjectWorkspaceOpen(true)}
                onAddSampleCalculations={handleAddSampleCalculations}
                settings={settings}
              />
            )}

            {activeView === 'unit-converter' && (
              <UnitConverterModule settings={settings} />
            )}

            {(activeView === 'rebar-weight' || activeView === 'bbs-helper') && (
              <RebarCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Rebar Calculator', res)}
                isFavorite={favorites.includes('rebar-weight')}
                onToggleFavorite={() => handleToggleFavorite('rebar-weight')}
                activeView={activeView}
              />
            )}

            {(activeView === 'concrete-mix' ||
              activeView === 'concrete-volume' ||
              activeView === 'wc-ratio' ||
              activeView === 'cement-bag') && (
              <ConcreteCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Concrete Calculator', res)}
                isFavorite={favorites.includes('concrete-mix')}
                onToggleFavorite={() => handleToggleFavorite('concrete-mix')}
                activeView={activeView}
              />
            )}

            {(activeView === 'brickwork' ||
              activeView === 'plaster' ||
              activeView === 'flooring-tiles' ||
              activeView === 'paint') && (
              <BrickPlasterCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Masonry & Plaster', res)}
                isFavorite={favorites.includes('brickwork')}
                onToggleFavorite={() => handleToggleFavorite('brickwork')}
                activeView={activeView}
              />
            )}

            {(activeView === 'rcc-steel-estimator' ||
              activeView === 'slab-calculator' ||
              activeView === 'beam-calculator' ||
              activeView === 'column-calculator' ||
              activeView === 'footing-calculator' ||
              activeView === 'formwork-calculator' ||
              activeView === 'staircase-calculator') && (
              <StructuralCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Structural Calculator', res)}
                isFavorite={favorites.includes('rcc-steel-estimator')}
                onToggleFavorite={() => handleToggleFavorite('rcc-steel-estimator')}
                activeView={activeView}
              />
            )}

            {(activeView === 'earthwork-excavation' ||
              activeView === 'soil-conversion' ||
              activeView === 'truck-loads' ||
              activeView === 'mean-prismoidal') && (
              <EarthworkCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Earthwork Calculator', res)}
                isFavorite={favorites.includes('earthwork-excavation')}
                onToggleFavorite={() => handleToggleFavorite('earthwork-excavation')}
                activeView={activeView}
              />
            )}

            {(activeView === 'level-hi-method' ||
              activeView === 'level-rise-fall' ||
              activeView === 'slope-gradient' ||
              activeView === 'coordinate-distance' ||
              activeView === 'dms-converter' ||
              activeView === 'chainage-calculator') && (
              <SurveyingCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Surveying Calculator', res)}
                isFavorite={favorites.includes('level-hi-method')}
                onToggleFavorite={() => handleToggleFavorite('level-hi-method')}
                activeView={activeView}
              />
            )}

            {(activeView === 'quantity-takeoff' ||
              activeView === 'boq-calculator' ||
              activeView === 'rate-analysis') && (
              <EstimationCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Estimation Calculator', res)}
                isFavorite={favorites.includes('quantity-takeoff')}
                onToggleFavorite={() => handleToggleFavorite('quantity-takeoff')}
                activeView={activeView}
              />
            )}

            {activeView === 'geometry-calculator' && (
              <GeometryCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Geometry Solver', res)}
                isFavorite={favorites.includes('geometry-calculator')}
                onToggleFavorite={() => handleToggleFavorite('geometry-calculator')}
              />
            )}

            {activeView === 'feet-inch-parser' && (
              <FeetInchCalculator
                settings={settings}
                onSaveHistory={res => handleSaveCalculation(activeView, 'Feet-Inch Parser', res)}
                isFavorite={favorites.includes('feet-inch-parser')}
                onToggleFavorite={() => handleToggleFavorite('feet-inch-parser')}
              />
            )}

            {activeView === 'formula-library' && <FormulaLibraryView />}

            {activeView === 'engineering-tables' && <ReferenceTablesView />}
          </div>

          {/* Global Application Footer (Docked within Main Scrollable Viewport) */}
          <footer className="mt-12 pt-8 border-t border-slate-200/80 dark:border-white/10 bg-transparent text-xs text-slate-500 dark:text-slate-400 no-print">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-center md:text-left flex flex-col items-center md:items-start">
                <Logo variant="full" height={34} showTagline={true} />
                <span className="text-slate-400 block text-xs">
                  Civil Engineering Tools by Prokash Biswas
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="hover:text-slate-200 transition-colors"
                >
                  Tools Directory
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('formula-library')}
                  className="hover:text-slate-200 transition-colors"
                >
                  Formula Library
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('engineering-tables')}
                  className="hover:text-slate-200 transition-colors"
                >
                  Reference Tables
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisclaimerOpen(true)}
                  className="hover:text-slate-200 transition-colors"
                >
                  About & Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisclaimerOpen(true)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Engineering Disclaimer
                </button>
              </div>

              <div className="text-center md:text-right text-[11px] text-slate-400 font-mono">
                <span>© 2026 Prokash Biswas. All rights reserved. · v1.0.0</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

        {/* Mobile Bottom Navigation (Section 16) */}
        <MobileBottomNav
          activeView={activeView}
          onNavigate={handleNavigate}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          historyCount={history.length}
        />

        {/* History Slide-over Drawer */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onClearHistory={handleClearHistory}
          onDeleteItem={handleDeleteHistoryItem}
          onSelectCalculation={item => {
            handleNavigate(item.toolId);
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={setSettings}
        />

        {/* User Profile Account Modal (Tailored for site engineers & students) */}
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
          onProfileUpdated={(updatedProfile) => {
            setSettings(prev => ({
              ...prev,
              userProfile: updatedProfile,
            }));
          }}
        />

        {/* Engineering Disclaimer Modal */}
        <DisclaimerModal
          isOpen={isDisclaimerOpen}
          onClose={() => setIsDisclaimerOpen(false)}
        />

        {/* Global Quick Command Palette (Ctrl+K and /) */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={handleNavigate}
          favorites={favorites}
        />

        {/* Named Project Workspaces Modal */}
        <ProjectWorkspaceModal
          isOpen={isProjectWorkspaceOpen}
          onClose={() => setIsProjectWorkspaceOpen(false)}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onImportProject={handleImportProject}
          settings={settings}
        />

        {/* Dated Rate Library Modal */}
        <RateLibraryModal
          isOpen={isRateLibraryOpen}
          onClose={() => setIsRateLibraryOpen(false)}
          settings={settings}
        />

        {/* PWA Update Banner with "Refresh to Update" Prompt */}
        <UpdatePrompt />
      </div>
    </ToastProvider>
  </ThemeProvider>
  );
}
