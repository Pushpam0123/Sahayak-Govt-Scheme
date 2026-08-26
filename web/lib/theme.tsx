'use client';

// Theme + language hooks and contexts with localStorage persistence and SSR safety.
// Initial values are resolved synchronously by <head> inline script to prevent flash of wrong theme/lang.

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Lang } from './i18n';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'sahayak-theme';
const LANG_KEY = 'sahayak-lang';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
});

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof document !== 'undefined') {
      const docLang = document.documentElement.lang;
      if (docLang === 'hi' || docLang === 'en') {
        return docLang;
      }
    }
    return 'en';
  });

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useLang() {
  return useContext(LangContext);
}
