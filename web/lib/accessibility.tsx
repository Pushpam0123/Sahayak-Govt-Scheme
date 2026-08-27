'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type FontScale = 'default' | 'large' | 'larger';

interface AccessibilityContextType {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  fontScale: 'default',
  setFontScale: () => {},
  cycleFontScale: () => {},
  highContrast: false,
  toggleHighContrast: () => {},
});

const SCALE_VALUES: Record<FontScale, string> = {
  default: '1',
  large: '1.15',
  larger: '1.3',
};

const SCALE_CYCLE: FontScale[] = ['default', 'large', 'larger'];

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    if (typeof document !== 'undefined') {
      const stored = localStorage.getItem('sahayak-font-scale');
      if (stored === 'large' || stored === 'larger' || stored === 'default') {
        return stored;
      }
    }
    return 'default';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('high-contrast');
    }
    return false;
  });

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', SCALE_VALUES[scale] || '1');
      try {
        localStorage.setItem('sahayak-font-scale', scale);
      } catch {}
    }
  }, []);

  const cycleFontScale = useCallback(() => {
    setFontScaleState((prev) => {
      const currIdx = SCALE_CYCLE.indexOf(prev);
      const next = SCALE_CYCLE[(currIdx + 1) % SCALE_CYCLE.length];
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--font-scale', SCALE_VALUES[next] || '1');
        try {
          localStorage.setItem('sahayak-font-scale', next);
        } catch {}
      }
      return next;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('high-contrast', next);
        try {
          localStorage.setItem('sahayak-contrast', next ? 'high' : 'normal');
        } catch {}
      }
      return next;
    });
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        setFontScale,
        cycleFontScale,
        highContrast,
        toggleHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
