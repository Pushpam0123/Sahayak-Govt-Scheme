'use client';

import React from 'react';
import { useLang } from '../../lib/theme';
import { Lang, LANGUAGE_METADATA } from '../../lib/i18n';

export function LanguageSelect({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div className={`relative inline-block ${className}`}>
      <label htmlFor="language-picker" className="sr-only">
        Select Language
      </label>
      <select
        id="language-picker"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="min-h-[48px] rounded-xl border border-border-strong bg-surface px-3 py-2 text-base font-bold text-content hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer transition-colors"
        aria-label="Language selection"
      >
        {Object.values(LANGUAGE_METADATA).map((meta) => (
          <option key={meta.code} value={meta.code}>
            {meta.nativeName}
            {!meta.reviewed ? ' (unreviewed)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
