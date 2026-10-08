import React, { Component, ErrorInfo, ReactNode } from 'react';
import { APP_NAME, APP_VERSION, APP_AUTHOR } from '../constants/version';
import { AlertTriangle, RefreshCw, DatabaseBackup, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PB CivilLab ErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  /**
   * Safe cache recovery: unregisters service workers and purges stale caches,
   * while STRICTLY PRESERVING all user projects and calculation records in localStorage!
   */
  private handleSafeCacheRecovery = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
      // Reload without clearing user data
      window.location.reload();
    } catch (err) {
      console.error('[PB CivilLab] Safe cache recovery failed:', err);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{APP_NAME}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-normal">
                    v{APP_VERSION}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Civil Engineering Suite • Lead Engineer: {APP_AUTHOR}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Application Execution Interrupted</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected exception was encountered during calculation or render execution. Your stored engineering workspaces and calculation history remain safely preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 font-mono text-xs text-red-300/90 break-words max-h-36 overflow-y-auto">
                <p className="font-semibold text-slate-400 mb-1">Exception Details:</p>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3.5 text-xs text-cyan-200/90 flex items-start gap-3">
              <DatabaseBackup className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300">Data Safety Assurance:</span> Safe Cache Recovery refreshes browser scripts and service workers without deleting your projects, settings, or rates.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleSafeCacheRecovery}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 transition-all flex items-center justify-center gap-2"
              >
                <DatabaseBackup className="w-4 h-4" />
                Safe Cache Recovery
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
