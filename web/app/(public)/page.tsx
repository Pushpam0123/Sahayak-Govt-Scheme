import type { Metadata } from 'next';
import { LandingView } from '../../components/home/LandingView';
import { getApiBase } from '../../lib/server-env';
import type { SchemeInfo } from '../../lib/types';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sahayak — Find Government Schemes You Qualify For',
  description:
    'Search Indian central and state welfare schemes, check your eligibility, and read the exact line of the official guideline behind every answer.',
};

async function getFeaturedSchemes(): Promise<SchemeInfo[] | null> {
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

export default async function HomePage() {
  const schemes = await getFeaturedSchemes();

  return <LandingView schemes={schemes} />;
}
