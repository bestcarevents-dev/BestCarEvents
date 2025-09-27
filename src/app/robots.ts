import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/post-a-listing',
          '/advertise/dashboard',
        ],
      },
    ],
    sitemap: `${site.replace(/\/$/, '')}/sitemap.xml`,
    host: site.replace(/\/$/, ''),
  };
}


