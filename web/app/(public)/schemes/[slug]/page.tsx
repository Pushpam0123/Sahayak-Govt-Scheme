import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SchemeClient } from './scheme-client';
import { SITE_URL } from '../../../../lib/site';
import { getApiBase } from '../../../../lib/server-env';
import type { SchemeDetail } from '../../../../lib/types';

export const dynamicParams = true;
export const revalidate = 3600;

async function getSchemeData(slug: string): Promise<SchemeDetail | null> {
  const apiBase = getApiBase();
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/v1/schemes/${slug}`, {
      next: { revalidate: 3600 },
    });
  } catch (err) {
    throw new Error(`Network error fetching scheme '${slug}': ${err instanceof Error ? err.message : String(err)}`);
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`API error fetching scheme '${slug}': HTTP ${res.status}`);
  }

  return (await res.json()) as SchemeDetail;
}

export async function generateStaticParams() {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/v1/schemes`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn(`[generateStaticParams] Could not fetch schemes (HTTP ${res.status}). Returning empty static params.`);
      return [];
    }
    const schemes = await res.json();
    return schemes.map((s: { id: string }) => ({
      slug: s.id,
    }));
  } catch (err: any) {
    console.warn(`[generateStaticParams] API unreachable during build: ${err.message}. Falling back to empty static params.`);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let scheme: SchemeDetail | null = null;
  try {
    scheme = await getSchemeData(slug);
  } catch {
    scheme = null;
  }

  if (!scheme) {
    return {
      title: 'Scheme not found | Sahayak',
      description: 'The requested scheme could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${scheme.name} — Eligibility & Benefits | Sahayak`;
  const description =
    scheme.summary ||
    (scheme.benefit_amount
      ? `Government welfare scheme ${scheme.name} in ${scheme.state}. Benefit amount: ${scheme.benefit_amount}.`
      : `Government welfare scheme ${scheme.name} in ${scheme.state}.`);
  const canonicalUrl = `${SITE_URL}/schemes/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Sahayak',
      type: 'article',
    },
  };
}

export default async function SchemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let initialScheme: SchemeDetail | null = null;
  try {
    initialScheme = await getSchemeData(slug);
  } catch {
    initialScheme = null;
  }

  if (initialScheme === null) {
    notFound();
  }

  return <SchemeClient slug={slug} initialScheme={initialScheme} />;
}
