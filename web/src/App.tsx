import { useState } from 'react';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { TabBar, type TabKey } from './components/TabBar';
import { ChatView } from './components/chat/ChatView';
import { DashboardView } from './components/dashboard/DashboardView';
import { useSahayak } from './hooks/useSahayak';
import { TRANSLATIONS } from './lib/i18n';
import { useLang, useTheme } from './lib/theme';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLang();
  const t = TRANSLATIONS[lang];

  const [tab, setTab] = useState<TabKey>('chat');

  const {
    healthLoading,
    apiOnline,
    dbConnected,
    offline,
    schemes,
    eligibility,
    profile,
    setProfileField,
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

      <TabBar t={t} active={tab} onChange={setTab} />

      {offline ? <OfflineBanner t={t} /> : null}

      <main className="flex flex-1 flex-col">
        {tab === 'chat' ? (
          <ChatView t={t} lang={lang} schemes={schemes} offline={offline} />
        ) : (
          <DashboardView
            t={t}
            schemes={schemes}
            eligibility={eligibility}
            profile={profile}
            setField={setProfileField}
            offline={offline}
          />
        )}
      </main>

      <footer className="border-t border-border-subtle pt-4 text-center text-xs text-faint">
        {t.appName} · {t.tagline}
      </footer>
    </div>
  );
}

export default App;
