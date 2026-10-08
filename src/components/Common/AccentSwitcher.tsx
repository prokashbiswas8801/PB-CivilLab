import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, ACCENT_THEMES, AccentColor } from '../../context/ThemeContext';
import { useToast } from './Toast';

interface AccentSwitcherProps {
  variant?: 'compact' | 'palette' | 'dropdown';
  className?: string;
}

export const AccentSwitcher: React.FC<AccentSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { accent, setAccent, accentConfig } = useTheme();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const accentsList = Object.values(ACCENT_THEMES);

  const handleSelectAccent = (selectedAccent: AccentColor, label: string) => {
    setAccent(selectedAccent);
    setIsOpen(false);
    toast.success(`Engineering Accent: ${label} applied across site`);
  };

  if (variant === 'palette') {
    return (
      <div className={`flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 ${className}`}>
        {accentsList.map(item => {
          const isSelected = item.id === accent;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectAccent(item.id, item.label)}
              title={`${item.label} (${item.tagline})`}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isSelected
                  ? 'scale-110 ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-slate-100 dark:ring-offset-[#0B0F19]'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: item.dotColor }}
              aria-label={`Select ${item.label} accent theme`}
            >
              {isSelected && <Check className="w-3 h-3 text-slate-950 font-black stroke-[3]" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs text-slate-700 dark:text-slate-300 transition-all active:scale-95 group shadow-sm"
        title="Custom Engineering Accent Color - Click to change theme highlight"
        aria-label="Theme accent color selector"
      >
        <span
          className="w-3 h-3 rounded-full transition-transform group-hover:scale-110 shadow-sm"
          style={{ backgroundColor: accentConfig.dotColor }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors" />
        <span className="hidden md:inline text-[11px] font-medium">{accentConfig.label.split(' ')[1] || accentConfig.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 mb-1.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>Theme Accent</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">5 Styles</span>
          </div>

          <div className="space-y-1">
            {accentsList.map(item => {
              const isSelected = item.id === accent;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAccent(item.id, item.label)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-white/10 font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.dotColor }}
                    />
                    <div className="truncate">
                      <div className="font-medium text-xs leading-none">{item.label}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.tagline}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5 shrink-0 ml-1 font-bold stroke-[3]"
                      style={{ color: item.dotColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
