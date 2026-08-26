'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, LangProvider, useTheme, useLang } from '../lib/theme';
import { TRANSLATIONS } from '../lib/i18n';
import { useSahayak } from '../hooks/useSahayak';
import { Header } from '../components/Header';
import { TabBar } from '../components/TabBar';
import { DisclaimerStrip } from '../components/DisclaimerStrip';
import { PrivacyBanner } from '../components/PrivacyBanner';
import { OfflineBanner } from '../components/OfflineBanner';

function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLang();
  const t = TRANSLATIONS[lang];

  const {
    healthLoading,
    apiOnline,
    dbConnected,
    offline,
    resetProfile,
    savedSchemeIds,
    refresh,
  } = useSahayak();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 p-4 md:p-6">
      <Header
        t={t}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        healthLoading={healthLoading}
        apiOnline={apiOnline}
        dbConnected={dbConnected}
        onRefresh={refresh}
      />

      <TabBar
        t={t}
        savedCount={savedSchemeIds.length}
      />

      <DisclaimerStrip t={t} />

      <PrivacyBanner t={t} onPurgeData={resetProfile} />

      {offline ? <OfflineBanner t={t} /> : null}

      <main className="flex flex-1 flex-col">
        {children}
      </main>

      <footer className="border-t border-border-subtle pt-4 text-center text-xs text-faint">
        {t.appName} · {t.tagline} · Official Guidelines Verified
      </footer>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LangProvider>
          <AppShell>{children}</AppShell>
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
