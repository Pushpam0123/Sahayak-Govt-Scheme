import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/site';
import { getApiBase } from '../lib/server-env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

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

  let schemeRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/v1/schemes`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      schemeRoutes = data.map((s: { id: string }) => ({
        url: `${baseUrl}/schemes/${s.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // API unreachable: return only static routes (do not emit hardcoded or guessing slugs)
  }

  return [...staticRoutes, ...schemeRoutes];
}
