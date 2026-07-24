// Primary navigation between the chat and dashboard surfaces.
import type { Dict } from '../lib/i18n';
import { ChartIcon, SparkIcon } from './icons';

export type TabKey = 'chat' | 'dashboard';

export function TabBar({
  t,
  active,
  onChange,
}: {
  t: Dict;
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'chat', label: t.chatTab, icon: <SparkIcon className="h-4 w-4" /> },
    {
      key: 'dashboard',
      label: t.dashboardTab,
      icon: <ChartIcon className="h-4 w-4" />,
    },
  ];

  return (
    <nav className="flex gap-1 border-b border-border-subtle">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-content'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
