'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme, useLang } from '../../lib/theme';
import { TRANSLATIONS } from '../../lib/i18n';
import { Button } from '../../components/ui';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { AccessibilityControls } from '../../components/ui/AccessibilityControls';
import { OfflineProvenanceBanner } from '../../components/layout/OfflineProvenanceBanner';
import { MoonIcon, SunIcon } from '../../components/icons';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex min-h-screen flex-col bg-page text-content">
      {/* Sticky header with solid background and visible focus rings */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-page">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-on-primary shadow-sm">
                स
              </div>
              <div>
                <div className="text-base font-extrabold tracking-tight text-content group-hover:text-primary transition-colors">
                  {t.appName}
                </div>
                <div className="text-sm text-muted">{t.tagline}</div>
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-5 text-base font-semibold text-muted" aria-label="Main Navigation">
              <Link
                href="/schemes"
                className="rounded-lg px-2 py-1 hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t.schemesTab}
              </Link>
              <Link
                href="/services"
                className="rounded-lg px-2 py-1 hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Services
              </Link>
              <Link
                href="/ask"
                className="rounded-lg px-2 py-1 hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t.chatTab}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AccessibilityControls />
            <LanguageSelect />

            <Button
              variant="ghost"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-12 w-12 items-center justify-center p-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Offline Provenance Banner for cached pages */}
      <OfflineProvenanceBanner />

      {/* Main content allowing full-bleed and contained sections */}
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>

      {/* Honest footer with min 16px text */}
      <footer className="w-full border-t border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-center text-base text-faint">
          {t.appName} · {t.tagline}
        </div>
      </footer>
    </div>
  );
}
