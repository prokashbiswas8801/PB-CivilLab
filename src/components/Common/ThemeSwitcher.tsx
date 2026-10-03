import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'segmented' | 'compact' | 'dropdown';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'segmented', className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-300/80 bg-white/5 dark:bg-white/5 light:bg-slate-100 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-cyan-400 transition-all flex items-center justify-center ${className}`}
        title={`Current: ${theme} (${resolvedTheme}). Click to switch theme`}
        aria-label="Toggle theme appearance"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-cyan-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>
    );
  }

  // Segmented Material 3 theme pill selector
  const options: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Appearance Theme"
      className={`inline-flex items-center p-0.5 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-300 bg-[#0B0F19] dark:bg-[#0B0F19] light:bg-slate-100 shadow-inner ${className}`}
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(mode)}
            title={`Switch to ${label} appearance`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-100 light:hover:text-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
