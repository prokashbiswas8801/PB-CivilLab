import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccentColor = 'cyan' | 'amber' | 'orange' | 'emerald' | 'purple';

export interface AccentThemeConfig {
  id: AccentColor;
  label: string;
  tagline: string;
  dotColor: string;
  primaryHex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  hoverBorderClass: string;
  glowClass: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentThemeConfig> = {
  cyan: {
    id: 'cyan',
    label: 'Blueprint Cyan',
    tagline: 'Classic CAD & Drafting',
    dotColor: '#06B6D4',
    primaryHex: '#38BDF8',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500',
    borderClass: 'border-cyan-500/30',
    hoverBorderClass: 'hover:border-cyan-500/50',
    glowClass: 'shadow-cyan-500/25',
  },
  amber: {
    id: 'amber',
    label: 'Safety Amber',
    tagline: 'Construction Crane & Caution',
    dotColor: '#F59E0B',
    primaryHex: '#FBBF24',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500',
    borderClass: 'border-amber-500/30',
    hoverBorderClass: 'hover:border-amber-500/50',
    glowClass: 'shadow-amber-500/25',
  },
  orange: {
    id: 'orange',
    label: 'Rebar Orange',
    tagline: 'High-Vis RCC Reinforcement',
    dotColor: '#F97316',
    primaryHex: '#FB923C',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-500/30',
    hoverBorderClass: 'hover:border-orange-500/50',
    glowClass: 'shadow-orange-500/25',
  },
  emerald: {
    id: 'emerald',
    label: 'Surveyor Emerald',
    tagline: 'Topography & Optical Prism',
    dotColor: '#10B981',
    primaryHex: '#34D399',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500/30',
    hoverBorderClass: 'hover:border-emerald-500/50',
    glowClass: 'shadow-emerald-500/25',
  },
  purple: {
    id: 'purple',
    label: 'BIM Violet',
    tagline: 'Modern 3D Modeling & FEA',
    dotColor: '#8B5CF6',
    primaryHex: '#A78BFA',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500',
    borderClass: 'border-purple-500/30',
    hoverBorderClass: 'hover:border-purple-500/50',
    glowClass: 'shadow-purple-500/25',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  accent: AccentColor;
  accentConfig: AccentThemeConfig;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'pb_civillab_theme';
const ACCENT_STORAGE_KEY = 'pb_civillab_accent_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {}
    return 'dark'; // Default engineering drafting dark theme
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    try {
      const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (savedAccent && savedAccent in ACCENT_THEMES) {
        return savedAccent as AccentColor;
      }
    } catch {}
    return 'cyan';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen for OS system theme shifts
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemIsDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme, systemIsDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Update browser status bar & theme-color meta
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0B0F17' : '#F4F6F9');
    }
  }, [resolvedTheme]);

  // Set accent attribute and CSS variables on root element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accent);
    const config = ACCENT_THEMES[accent] || ACCENT_THEMES.cyan;
    root.style.setProperty('--accent-primary', config.primaryHex);
    root.style.setProperty('--accent-dot', config.dotColor);
  }, [accent]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
    } catch {}
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const accentConfig = useMemo(() => ACCENT_THEMES[accent] || ACCENT_THEMES.cyan, [accent]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      accent,
      accentConfig,
      setTheme,
      setAccent,
      toggleTheme,
    }),
    [theme, resolvedTheme, accent, accentConfig]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
