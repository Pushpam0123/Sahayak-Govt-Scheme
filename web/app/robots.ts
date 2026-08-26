import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sahayak.gov.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/schemes', '/schemes/*', '/services', '/privacy'],
        disallow: ['/check', '/results', '/ask', '/saved', '/console', '/admin', '/admin/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
