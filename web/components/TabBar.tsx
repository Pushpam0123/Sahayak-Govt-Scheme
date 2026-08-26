'use client';

// Primary navigation across all Sahayak surfaces driven by Next.js Link and usePathname.
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Dict } from '../lib/i18n';
import { ChartIcon, SparkIcon, BookmarkIcon, SparklesIcon, ShieldCheckIcon } from './icons';

export type TabKey = 'home' | 'wizard' | 'chat' | 'saved' | 'dashboard' | 'console';

export function TabBar({
  t,
  savedCount = 0,
}: {
  t: Dict;
  savedCount?: number;
}) {
  const pathname = usePathname();

  const tabs: { href: string; label: string; icon: React.ReactNode; badge?: number; isActive: boolean }[] = [
    {
      href: '/',
      label: t.homeTab,
      icon: <SparklesIcon className="h-4 w-4" />,
      isActive: pathname === '/',
    },
    {
      href: '/check',
      label: t.wizardTab,
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      isActive: pathname === '/check' || pathname === '/results',
    },
    {
      href: '/ask',
      label: t.chatTab,
      icon: <SparkIcon className="h-4 w-4" />,
      isActive: pathname === '/ask',
    },
    {
      href: '/saved',
      label: t.savedTab,
      icon: <BookmarkIcon className="h-4 w-4" />,
      badge: savedCount,
      isActive: pathname === '/saved',
    },
    {
      href: '/schemes',
      label: t.dashboardTab,
      icon: <ChartIcon className="h-4 w-4" />,
      isActive: pathname === '/schemes' || pathname?.startsWith('/schemes/') || pathname === '/services',
    },
    {
      href: '/console',
      label: t.consoleTab,
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      isActive: pathname === '/console' || pathname?.startsWith('/admin'),
    },
  ];

  return (
    <nav className="flex overflow-x-auto gap-1 border-b border-border-subtle scrollbar-thin">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.isActive ? 'page' : undefined}
          className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-sm font-semibold transition-colors ${
            tab.isActive
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
        </Link>
      ))}
    </nav>
  );
}
