'use client';

import React from 'react';
import { useAccessibility } from '../../lib/accessibility';

export function AccessibilityControls({ className = '' }: { className?: string }) {
  const { fontScale, cycleFontScale, highContrast, toggleHighContrast } = useAccessibility();

  const scaleLabels: Record<string, string> = {
    default: 'A',
    large: 'A+',
    larger: 'A++',
  };

  const scaleTitles: Record<string, string> = {
    default: 'Font size: Normal. Click for Large.',
    large: 'Font size: Large. Click for Largest.',
    larger: 'Font size: Largest. Click for Normal.',
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="group" aria-label="Accessibility controls">
      {/* Font Size Step Cycle */}
      <button
        type="button"
        onClick={cycleFontScale}
        className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm font-extrabold text-content hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer"
        aria-label={`Change text size. Current: ${fontScale}`}
        title={scaleTitles[fontScale] || 'Change font size'}
      >
        <span className="tabular-nums">{scaleLabels[fontScale] || 'A'}</span>
      </button>

      {/* High Contrast Toggle */}
      <button
        type="button"
        onClick={toggleHighContrast}
        className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-extrabold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          highContrast
            ? 'border-primary bg-primary text-on-primary shadow-sm'
            : 'border-border-strong bg-surface text-content hover:bg-surface-2'
        }`}
        aria-pressed={highContrast}
        aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
        title={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      >
        <span>HC</span>
      </button>
    </div>
  );
}
