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
import { ToastProvider } from './components/Common/Toast';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AppSettings, CalculationResult, HistoryItem } from './types';
import { REGIONAL_PROFILES, TOOLS_CATALOG } from './constants/engineering';
import { ChevronRight } from 'lucide-react';
import { Logo } from './components/Logo';

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

  // Settings State with LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('pb_civillab_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
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
    <ToastProvider>
      <div className="min-h-screen bg-[#070B12] text-[#F8FAFC] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300 pb-16 lg:pb-0">
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
        />

        {/* Main Layout Area */}
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          {/* Left Sidebar */}
          <Sidebar
            activeView={activeView}
            onNavigate={handleNavigate}
            favorites={favorites}
            isOpenMobile={isSidebarMobile}
            onCloseMobile={() => setIsSidebarMobile(false)}
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Content Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
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
                  {currentToolMeta ? currentToolMeta.category : 'Calculator'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-cyan-400 font-semibold truncate">
                  {currentToolMeta ? currentToolMeta.name : activeView}
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
              />
            )}

            {activeView === 'favorites' && (
              <Dashboard
                onNavigate={id => setActiveView(id)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                history={history}
                onOpenHistory={() => setIsHistoryOpen(true)}
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
          </main>
        </div>

        {/* Global Application Footer */}
        <footer className="border-t border-white/10 bg-[#0B0F19] py-8 px-6 text-xs text-slate-400 no-print">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-2 text-center md:text-left flex flex-col items-center md:items-start">
              <Logo variant="full" height={36} showTagline={true} />
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
      </div>
    </ToastProvider>
  );
}
