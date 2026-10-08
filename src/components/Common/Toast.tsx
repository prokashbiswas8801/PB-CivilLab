import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toastMethods = {
    success: (msg: string) => addToast('success', msg),
    info: (msg: string) => addToast('info', msg),
    warning: (msg: string) => addToast('warning', msg),
    error: (msg: string) => addToast('error', msg),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print"
      >
        {toasts.map(t => {
          let bgClass = 'bg-[#111827] border-white/15 text-slate-100';
          let Icon = Info;
          let iconColor = 'text-cyan-400';

          if (t.type === 'success') {
            bgClass = 'bg-[#0B1A1E] border-emerald-500/30 text-emerald-100';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (t.type === 'warning') {
            bgClass = 'bg-[#221708] border-amber-500/30 text-amber-100';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
          } else if (t.type === 'error') {
            bgClass = 'bg-[#240D11] border-rose-500/30 text-rose-100';
            Icon = AlertCircle;
            iconColor = 'text-rose-400';
          }

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-200 transform translate-y-0 opacity-100 ${bgClass}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                <span className="text-xs font-medium leading-snug break-words">{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors shrink-0"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType['toast'] => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      success: (m: string) => console.log('Toast [success]:', m),
      info: (m: string) => console.log('Toast [info]:', m),
      warning: (m: string) => console.warn('Toast [warning]:', m),
      error: (m: string) => console.error('Toast [error]:', m),
    };
  }
  return context.toast;
};
