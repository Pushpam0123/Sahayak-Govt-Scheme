'use client';

// Top app bar: brand, language selector, theme toggle, and API/DB status.
import type { Dict, Lang } from '../lib/i18n';
import type { Theme } from '../lib/theme';
import { IconButton, Spinner } from './ui';
import { LanguageSelect } from './ui/LanguageSelect';
import { MoonIcon, RefreshIcon, SunIcon } from './icons';

interface HeaderProps {
  t: Dict;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  healthLoading: boolean;
  apiOnline: boolean;
  dbConnected: boolean;
  onRefresh: () => void;
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? 'bg-success' : 'bg-danger'
      }`}
    />
  );
}

export function Header({
  t,
  theme,
  toggleTheme,
  healthLoading,
  apiOnline,
  dbConnected,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-center md:justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary text-lg font-bold shadow-sm">
          स
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-content">
            {t.appName}
          </h1>
          <p className="text-xs text-muted">{t.tagline}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelect />

        <IconButton
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
          className="min-h-[48px] min-w-[48px]"
        >
          {theme === 'dark' ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </IconButton>

        {/* Health */}
        <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            {healthLoading ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <StatusDot
                ok={apiOnline}
                label={`${t.apiLabel}: ${apiOnline ? t.online : t.offline}`}
              />
            )}
            <span className="text-muted">{t.apiLabel}</span>
          </span>
          <span className="h-4 w-px bg-border-subtle" />
          <span className="flex items-center gap-1.5">
            {healthLoading ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <StatusDot
                ok={dbConnected}
                label={`${t.dbLabel}: ${dbConnected ? t.connected : t.offline}`}
              />
            )}
            <span className="text-muted">{t.dbLabel}</span>
          </span>
          <button
            onClick={onRefresh}
            disabled={healthLoading}
            aria-label={t.refresh}
            title={t.refresh}
            className="text-muted hover:text-content transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshIcon
              className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
