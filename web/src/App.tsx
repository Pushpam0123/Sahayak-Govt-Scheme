import { useState } from 'react';
import { DisclaimerStrip } from './components/DisclaimerStrip';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { PrivacyBanner } from './components/PrivacyBanner';
import { TabBar, type TabKey } from './components/TabBar';
import { LandingView } from './components/home/LandingView';
import { EligibilityWizard } from './components/wizard/EligibilityWizard';
import { SchemeDetailView } from './components/schemes/SchemeDetailView';
import { ChatView } from './components/chat/ChatView';
import { SavedSchemesView } from './components/saved/SavedSchemesView';
import { DashboardView } from './components/dashboard/DashboardView';
import { AdminConsoleView } from './components/admin/AdminConsoleView';
import { useSahayak } from './hooks/useSahayak';
import { TRANSLATIONS } from './lib/i18n';
import { useLang, useTheme } from './lib/theme';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLang();
  const t = TRANSLATIONS[lang];

  const [tab, setTab] = useState<TabKey>('home');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);

  const {
    healthLoading,
    apiOnline,
    dbConnected,
    offline,
    schemes,
    eligibility,
    profile,
    setProfileField,
    resetProfile,
    savedSchemeIds,
    toggleSaveScheme,
    checkedDocs,
    toggleDocChecked,
    refresh,
  } = useSahayak();

  const handleSelectScheme = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
  };

  const handleBackFromScheme = () => {
    setSelectedSchemeId(null);
  };

  const handleAskAboutScheme = (schemeName: string) => {
    setSelectedSchemeId(null);
    setChatInitialQuery(`What are the key eligibility requirements and benefits for ${schemeName}?`);
    setTab('chat');
  };

  const handleTabChange = (newTab: TabKey) => {
    setSelectedSchemeId(null);
    setTab(newTab);
  };

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
        active={tab}
        onChange={handleTabChange}
        savedCount={savedSchemeIds.length}
      />

      <DisclaimerStrip t={t} />

      <PrivacyBanner t={t} onPurgeData={resetProfile} />

      {offline ? <OfflineBanner t={t} /> : null}

      <main className="flex flex-1 flex-col">
        {selectedSchemeId ? (
          <SchemeDetailView
            t={t}
            schemeId={selectedSchemeId}
            verdict={eligibility[selectedSchemeId]}
            isSaved={savedSchemeIds.includes(selectedSchemeId)}
            onToggleSave={toggleSaveScheme}
            onBack={handleBackFromScheme}
            onAskChatAboutScheme={handleAskAboutScheme}
            checkedDocs={checkedDocs}
            onToggleDocChecked={toggleDocChecked}
          />
        ) : tab === 'home' ? (
          <LandingView
            t={t}
            schemes={schemes}
            eligibility={eligibility}
            onStartWizard={() => setTab('wizard')}
            onSelectScheme={handleSelectScheme}
            onAskChat={(query) => {
              setChatInitialQuery(query);
              setTab('chat');
            }}
            savedSchemeIds={savedSchemeIds}
            onToggleSave={toggleSaveScheme}
          />
        ) : tab === 'wizard' ? (
          <EligibilityWizard
            t={t}
            profile={profile}
            setField={setProfileField}
            eligibility={eligibility}
            schemes={schemes}
            onSelectScheme={handleSelectScheme}
            savedSchemeIds={savedSchemeIds}
            onToggleSave={toggleSaveScheme}
            onResetProfile={resetProfile}
          />
        ) : tab === 'chat' ? (
          <ChatView
            t={t}
            lang={lang}
            schemes={schemes}
            offline={offline}
            initialQuery={chatInitialQuery}
          />
        ) : tab === 'saved' ? (
          <SavedSchemesView
            t={t}
            schemes={schemes}
            savedSchemeIds={savedSchemeIds}
            onToggleSave={toggleSaveScheme}
            onSelectScheme={handleSelectScheme}
            eligibility={eligibility}
          />
        ) : tab === 'console' ? (
          <AdminConsoleView t={t} />
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
        {t.appName} · {t.tagline} · Official Guidelines Verified
      </footer>
    </div>
  );
}

export default App;
