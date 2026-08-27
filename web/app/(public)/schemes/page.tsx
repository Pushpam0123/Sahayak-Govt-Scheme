import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getApiBase } from '../../../lib/server-env';
import type { SchemeInfo } from '../../../lib/types';
import { SchemeBrowseView } from './browse-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse Government Schemes — Central & State Welfare | Sahayak',
  description:
    'Search and filter official Indian welfare schemes by state and category with verified eligibility guidelines.',
};

async function getSchemes(): Promise<SchemeInfo[] | null> {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/v1/schemes`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as SchemeInfo[];
  } catch {
    return null;
  }
}

export default async function SchemesPage() {
  const schemes = await getSchemes();

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-16 text-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
          <p className="text-base font-semibold">Loading verified schemes…</p>
        </div>
      }
    >
      <SchemeBrowseView initialSchemes={schemes} />
    </Suspense>
  );
}
