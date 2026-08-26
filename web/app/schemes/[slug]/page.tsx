import type { Metadata } from 'next';
import { SchemeClient } from './scheme-client';
import type { SchemeDetail, SchemeInfo } from '../../../lib/types';
import { DEMO_SCHEMES } from '../../../lib/demo';

export const dynamicParams = true;
export const revalidate = 3600;

async function getSchemeData(slug: string): Promise<SchemeDetail | SchemeInfo | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8000';
    const res = await fetch(`${apiBase}/api/v1/schemes/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return DEMO_SCHEMES.find((s) => s.id === slug) ?? null;
    }
    return (await res.json()) as SchemeDetail;
  } catch {
    return DEMO_SCHEMES.find((s) => s.id === slug) ?? null;
  }
}

export async function generateStaticParams() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8000';
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
  const scheme = await getSchemeData(slug);

  if (!scheme) {
    return {
      title: `${slug.toUpperCase()} — Scheme Details | Sahayak`,
      description: `Official government scheme information and eligibility criteria for ${slug}.`,
    };
  }

  const title = `${scheme.name} — Eligibility & Benefits | Sahayak`;
  const description =
    scheme.summary ||
    `Official government welfare scheme ${scheme.name} in ${scheme.state}. Benefit amount: ${scheme.benefit_amount || 'Financial Assistance'}.`;
  const canonicalUrl = `https://sahayak.gov.in/schemes/${slug}`;

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
  const schemeData = await getSchemeData(slug);
  const initialScheme =
    schemeData && 'required_documents' in schemeData
      ? (schemeData as SchemeDetail)
      : null;

  return <SchemeClient slug={slug} initialScheme={initialScheme} />;
}
