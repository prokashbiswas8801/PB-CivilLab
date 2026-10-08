import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

interface UpdatePromptProps {
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Polling interval in milliseconds to check for SW updates (default: 1 hour) */
  checkIntervalMs?: number;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  className = '',
  checkIntervalMs = 60 * 60 * 1000,
}) => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // Periodically check server for new service worker builds
      const intervalId = setInterval(() => {
        if (!navigator.onLine) return;
        registration.update().catch((err) => {
          console.warn('[PWA] Periodic update check failed:', err);
        });
      }, checkIntervalMs);

      return () => clearInterval(intervalId);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
    },
  });

  const handleUpdate = () => {
    // Passes reloadPage=true to activate waiting SW and reload open tabs
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  // If no update is pending and app is not newly offline-ready, render nothing
  if (!needRefresh && !offlineReady) {
    return null;
  }

  // If newly cached and ready for offline use
  if (offlineReady && !needRefresh) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-emerald-500/30 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Offline Ready
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                PB CivilLab is cached and ready to work without an internet connection.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOfflineReady(false)}
            aria-label="Dismiss offline ready notification"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  // "Prompt for Update" banner when a new version is detected
  return (
    <aside
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] rounded-xl border border-cyan-500/40 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 mt-0.5">
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                UPDATE AVAILABLE
              </span>
              <span className="text-xs font-semibold text-white">PB CivilLab</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A newer version of the application has been deployed. Refresh to load the latest engineering calculators and improvements.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss update notification"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh to Update
        </button>
      </div>
    </aside>
  );
};

export default UpdatePrompt;
