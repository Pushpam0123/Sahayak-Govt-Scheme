// Primary navigation across all Sahayak surfaces.
import React from 'react';
import type { Dict } from '../lib/i18n';
import { ChartIcon, SparkIcon, BookmarkIcon, SparklesIcon, ShieldCheckIcon } from './icons';

export type TabKey = 'home' | 'wizard' | 'chat' | 'saved' | 'dashboard' | 'console';

export function TabBar({
  t,
  active,
  onChange,
  savedCount = 0,
}: {
  t: Dict;
  active: TabKey;
  onChange: (tab: TabKey) => void;
  savedCount?: number;
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'home', label: t.homeTab, icon: <SparklesIcon className="h-4 w-4" /> },
    { key: 'wizard', label: t.wizardTab, icon: <ShieldCheckIcon className="h-4 w-4" /> },
    { key: 'chat', label: t.chatTab, icon: <SparkIcon className="h-4 w-4" /> },
    { key: 'saved', label: t.savedTab, icon: <BookmarkIcon className="h-4 w-4" />, badge: savedCount },
    { key: 'dashboard', label: t.dashboardTab, icon: <ChartIcon className="h-4 w-4" /> },
    { key: 'console', label: t.consoleTab, icon: <ShieldCheckIcon className="h-4 w-4" /> },
  ];

  return (
    <nav className="flex overflow-x-auto gap-1 border-b border-border-subtle scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-content'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
