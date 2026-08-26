import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Section } from '../../../../components/layout/Section';
import { SchemeCard } from '../../../../components/schemes/SchemeCard';
import { AUDIENCES, getAudienceBySlug } from '../../../../lib/audiences';
import { getApiBase } from '../../../../lib/server-env';
import { SITE_URL } from '../../../../lib/site';
import type { SchemeInfo } from '../../../../lib/types';

export const dynamicParams = false;
export const revalidate = 3600;

async function getSchemes(): Promise<SchemeInfo[]> {
  const apiBase = getApiBase();
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/v1/schemes`, {
      next: { revalidate: 3600 },
    });
  } catch (err) {
    throw new Error(`Network error fetching schemes: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!res.ok) {
    throw new Error(`API error fetching schemes: HTTP ${res.status}`);
  }

  return (await res.json()) as SchemeInfo[];
}

export async function generateStaticParams() {
  try {
    const schemes = await getSchemes();
    return AUDIENCES.filter((aud) => schemes.some((s) => aud.predicate(s))).map((aud) => ({
      audience: aud.slug,
    }));
  } catch (err: unknown) {
    console.warn(`[generateStaticParams /for] Could not fetch schemes: ${String(err)}. Returning empty static params.`);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience: slug } = await params;
  const audience = getAudienceBySlug(slug);

  if (!audience) {
    return {
      title: 'Audience not found | Sahayak',
      robots: { index: false, follow: false },
    };
  }

  let schemes: SchemeInfo[] = [];
  try {
    schemes = await getSchemes();
  } catch {
    return {
      title: `${audience.title} | Sahayak`,
      robots: { index: false, follow: false },
    };
  }

  const matches = schemes.filter(audience.predicate);
  if (matches.length === 0) {
    return {
      title: 'Audience not found | Sahayak',
      robots: { index: false, follow: false },
    };
  }

  const title = `${audience.title} | Sahayak`;
  const description = audience.description;
  const canonicalUrl = `${SITE_URL}/for/${audience.slug}`;

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
      type: 'website',
    },
  };
}

export default async function AudiencePage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience: slug } = await params;
  const audience = getAudienceBySlug(slug);

  if (!audience) {
    notFound();
  }

  const schemes = await getSchemes();
  const matches = schemes.filter(audience.predicate);

  if (matches.length === 0) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-140px)]">
      {/* Header section */}
      <Section bg="bg-page" className="py-12 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="text-base font-bold uppercase tracking-wider text-muted mb-2">
              Audience Guide
            </div>
            <h1 className="text-display-section text-content text-balance">
              {audience.title}
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              {audience.description}
            </p>
          </div>
        </div>
      </Section>

      {/* Main scheme list */}
      <Section bg="bg-page" className="py-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="text-base font-bold text-muted">
              Showing <span className="text-content font-extrabold">{matches.length}</span>{' '}
              {matches.length === 1 ? 'scheme' : 'schemes'} for {audience.shortTitle}
            </div>

            <Link
              href="/schemes"
              className="text-base font-bold text-primary hover:underline"
            >
              Browse all schemes →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>

          {/* CTA Box */}
          <div className="mt-14 rounded-3xl border border-border-strong bg-surface p-8 sm:p-10 text-center flex flex-col items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-content">
              Check your exact eligibility for these programs
            </h2>
            <p className="text-base text-muted max-w-xl">
              Answer 4 questions about your age, landholding, and income to see if you meet all qualification criteria.
            </p>
            <Link
              href="/check"
              className="mt-2 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Start Eligibility Check →
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
