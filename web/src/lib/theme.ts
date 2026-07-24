// Theme + language hooks with localStorage persistence.
// Default theme is light (citizen portal); the `.dark` class on <html>
// activates the dark console palette defined in index.css.

import { useCallback, useEffect, useState } from 'react';
import type { Lang } from './i18n';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'sahayak-theme';
const LANG_KEY = 'sahayak-lang';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // Light (citizen-portal) is the default; the toggle persists any change.
  return 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { theme, toggleTheme };
}

function getInitialLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'hi' ? 'hi' : 'en';
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  return { lang, setLang };
}
