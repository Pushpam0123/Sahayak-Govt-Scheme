'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme, useLang } from '../../lib/theme';
import { TRANSLATIONS } from '../../lib/i18n';
import { Button } from '../../components/ui';
import { MoonIcon, SunIcon } from '../../components/icons';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLang();
  const t = TRANSLATIONS[lang];

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 md:p-6">
      <header className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-black text-on-primary shadow-sm">
              स
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-content group-hover:text-primary transition-colors">
                {t.appName}
              </div>
              <div className="text-xs text-muted">{t.tagline}</div>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm font-semibold text-muted">
            <Link href="/schemes" className="hover:text-content transition-colors">
              Schemes
            </Link>
            <Link href="/services" className="hover:text-content transition-colors">
              Services
            </Link>
            <Link href="/ask" className="hover:text-content transition-colors">
              Ask Assistant
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-bold text-content hover:bg-surface-2 transition-colors"
          >
            {lang === 'hi' ? 'English' : 'हिंदी'}
          </button>
          <Button
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-8 w-8 p-0"
          >
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {children}
      </main>

      <footer className="border-t border-border-subtle pt-4 text-center text-xs text-faint">
        {t.appName} · {t.tagline}
      </footer>
    </div>
  );
}
