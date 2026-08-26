import type { MetadataRoute } from 'next';

const KNOWN_SCHEME_SLUGS = [
  'pm-kisan',
  'pm-fby',
  'pm-jjby',
  'pm-sby',
  'atal-pension-yojana',
  'pm-matru-vandana',
  'stand-up-india',
  'mp-ladli-behna',
  'ka-gruha-jyothi',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sahayak.gov.in';

  let slugs = KNOWN_SCHEME_SLUGS;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8000';
    const res = await fetch(`${apiBase}/api/v1/schemes`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      slugs = data.map((s: { id: string }) => s.id);
    }
  } catch {
    // API unreachable; fall back to known verified slugs
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/schemes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const schemeRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/schemes/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...schemeRoutes];
}
