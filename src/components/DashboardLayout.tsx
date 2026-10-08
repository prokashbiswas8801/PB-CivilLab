import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Calculator, ShieldCheck, ChevronRight, Compass } from 'lucide-react';

/**
 * Touch-friendly button & input class presets optimized for mobile usability
 * on active construction jobsites (gloves, high glare, fast tapping).
 * Strictly guarantees min-h-[48px] touch target compliance (WCAG & mobile UX).
 */
export const TOUCH_BUTTON_CLASSES = {
  primary:
    'min-h-[48px] px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] shadow-md shadow-cyan-950/40 border border-cyan-400/20 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 select-none touch-manipulation',
  secondary:
    'min-h-[48px] px-4 py-3 rounded-xl text-sm font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 active:scale-[0.98] border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-400 select-none touch-manipulation',
  accent:
    'min-h-[48px] px-4 py-3 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 active:scale-[0.98] border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer select-none touch-manipulation',
  icon:
    'min-h-[48px] min-w-[48px] p-3 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.96] border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 select-none touch-manipulation',
  input:
    'min-h-[48px] px-4 py-3 rounded-xl text-base sm:text-sm font-mono text-slate-100 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-500',
} as const;

export interface DashboardLayoutProps {
  /** Optional custom header to replace or augment the default top navigation */
  header?: React.ReactNode;
  /** Navigation sidebar content (rendered in mobile drawer & desktop fixed bar) */
  sidebar?: React.ReactNode;
  /** Left workspace: Parameter inputs, input forms, calculation selectors */
  leftContent?: React.ReactNode;
  /** Right workspace: Real-time calculation results, diagrams, breakdown panels */
  rightContent?: React.ReactNode;
  /** Custom full-canvas children (bypasses 2-column split if left/right are omitted) */
  children?: React.ReactNode;
  /** Current tool or view headline title */
  title?: string;
  /** Engineering discipline category (e.g. 'Structural', 'Concrete', 'Surveying') */
  category?: string;
  /** Brief engineering subtitle or description */
  description?: string;
  /** Optional header action buttons (e.g., Export PDF, Reset, Save to Project) */
  headerActions?: React.ReactNode;
  /** Controlled state for mobile sidebar if parent manages it */
  isMobileSidebarOpen?: boolean;
  /** Callback when mobile sidebar toggle changes */
  onToggleMobileSidebar?: (open: boolean) => void;
  /** App branding title */
  brandTitle?: string;
}

/**
 * PB CivilLab Fully Responsive Engineering Layout Component
 * - Mobile (<1024px): 1-column flex layout with off-canvas slide-out navigation
 * - Desktop (>=1024px): Fixed multi-tool sidebar + 2-column split workspace
 * - Construction site ergonomics: min-h-[48px] tap targets for glove-friendly use
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  sidebar,
  leftContent,
  rightContent,
  children,
  title,
  category,
  description,
  headerActions,
  isMobileSidebarOpen: controlledMobileOpen,
  onToggleMobileSidebar,
  brandTitle = 'PB CivilLab',
}) => {
  // Uncontrolled state fallback if not managed by parent
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen;

  const setMobileOpen = useCallback(
    (open: boolean) => {
      if (onToggleMobileSidebar) {
        onToggleMobileSidebar(open);
      } else {
        setInternalMobileOpen(open);
      }
    },
    [onToggleMobileSidebar]
  );

  // Close mobile drawer on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, setMobileOpen]);

  // Lock body scroll when mobile off-canvas drawer is active
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 font-sans antialiased">
      {/* ===================================================================== */}
      {/* 1. TOP RESPONSIVE HEADER BAR (WITH MOBILE HAMBURGER TOGGLE) */}
      {/* ===================================================================== */}
      {header ? (
        header
      ) : (
        <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile & Tablet (lg:hidden) */}
            <button
              type="button"
              onClick={() => setMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileOpen}
              className={`lg:hidden ${TOUCH_BUTTON_CLASSES.icon}`}
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white font-mono font-bold text-sm shadow-md shadow-cyan-900/40">
                PB
              </span>
              <div className="leading-tight">
                <span className="font-semibold text-white text-base tracking-wide flex items-center gap-1.5">
                  {brandTitle}
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Pro
                  </span>
                </span>
                <p className="hidden md:block text-[11px] text-slate-400">
                  Precision Civil Engineering Suite
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions (Touch-friendly $\ge 48px$ on mobile) */}
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        </header>
      )}

      {/* ===================================================================== */}
      {/* 2. MAIN LAYOUT WRAPPER: SIDEBAR + INDEPENDENT CONTENT VIEWPORT */}
      {/* ===================================================================== */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto min-h-0 overflow-hidden relative">
        {/* ------------------------------------------------------------------- */}
        {/* A. MOBILE SIDEBAR DRAWER (OFF-CANVAS WITH BACKDROP) */}
        {/* ------------------------------------------------------------------- */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          role="navigation"
          aria-label="Mobile Navigation Drawer"
          className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-900/98 border-r border-slate-800 shadow-2xl p-4 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Drawer Top Banner & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white font-mono font-bold text-xs">
                  PB
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">{brandTitle}</h2>
                  <p className="text-[11px] text-slate-400">Site Engineering Menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className={TOUCH_BUTTON_CLASSES.icon}
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" onClick={() => setMobileOpen(false)}>
              {sidebar || (
                <div className="p-4 text-xs text-slate-400 text-center border border-dashed border-slate-800 rounded-xl">
                  Navigation items or &lt;Sidebar /&gt; component
                </div>
              )}
            </div>

            {/* Mobile Drawer Footer Status */}
            <div className="pt-4 border-t border-slate-800 mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Offline Verified
              </span>
              <span className="text-[11px] font-mono text-slate-500">v2.0.0</span>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* B. DESKTOP FIXED SIDEBAR (lg:flex, LOCKED ON PC) */}
        {/* ------------------------------------------------------------------- */}
        <aside
          role="navigation"
          aria-label="Desktop Navigation"
          className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex-col justify-between overflow-y-auto"
        >
          {sidebar || (
            <div className="p-6 text-xs text-slate-400">
              Desktop Sidebar Area
            </div>
          )}
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* C. MAIN WORKSPACE VIEWPORT */}
        {/* ------------------------------------------------------------------- */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain flex flex-col justify-between p-4 sm:p-6 lg:p-8">
          <div className="w-full flex-1 max-w-7xl mx-auto">
            {/* Optional Tool Header / Breadcrumb Banner */}
            {title && (
              <header className="mb-6 pb-4 border-b border-slate-800/80">
                {category && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest font-mono">
                      {category}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400 font-mono">Engineering Specification</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                    {title}
                  </h1>
                  {headerActions && (
                    <div className="flex items-center gap-2 shrink-0">
                      {headerActions}
                    </div>
                  )}
                </div>
                {description && (
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    {description}
                  </p>
                )}
              </header>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* WORKSPACE CONTENT GRID: */}
            {/* - Mobile: 1 column vertical stack (`flex-col` or `grid-cols-1`) */}
            {/* - Desktop: 2-column split layout (`lg:grid-cols-12` or `lg:grid-cols-2`) */}
            {/* ----------------------------------------------------------------- */}
            {leftContent || rightContent ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Calculation Inputs & Control Panels */}
                <section
                  aria-label="Calculation Inputs"
                  className="w-full lg:col-span-7 xl:col-span-7 space-y-6"
                >
                  {leftContent}
                </section>

                {/* Right Column: Real-Time Results & Summary (Sticky on Desktop) */}
                <section
                  aria-label="Calculation Results"
                  className="w-full lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-6"
                >
                  {rightContent}
                </section>
              </div>
            ) : (
              children
            )}
          </div>

          {/* Touch-Friendly Global Engineering Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-800/60 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{brandTitle}</span>
              <span className="text-slate-600">|</span>
              <span>Prokash Biswas</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span>Standard Civil Verification</span>
              <span>·</span>
              <span>Metric & US Customary</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
