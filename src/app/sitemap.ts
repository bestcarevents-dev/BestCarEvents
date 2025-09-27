import type { MetadataRoute } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { getSiteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl().replace(/\/$/, '');

  const staticPaths: MetadataRoute.Sitemap = [
    '',
    '/cars',
    '/events',
    '/clubs',
    '/hotels',
    '/auctions',
    '/others',
    '/forum',
    '/partners',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ].map((p) => ({ url: `${site}${p ? p : '/'}`, changeFrequency: 'daily', priority: p ? 0.6 : 1 }));

  const admin = getAdmin();
  const db = admin.firestore();

  async function ids(collectionName: string): Promise<string[]> {
    try {
      const snapshot = await db.collection(collectionName).select().limit(5000).get();
      return snapshot.docs.map((d) => d.id);
    } catch {
      return [];
    }
  }

  const [carIds, hotelIds, auctionIds, clubIds, forumIds, eventIds, partnerIds] = await Promise.all([
    ids('cars'),
    ids('hotels'),
    ids('auctions'),
    ids('clubs'),
    ids('forum_posts'),
    ids('events'),
    ids('partners'),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...carIds.map((id) => ({ url: `${site}/cars/${id}`, changeFrequency: 'weekly', priority: 0.7 })),
    ...hotelIds.map((id) => ({ url: `${site}/hotels/${id}`, changeFrequency: 'weekly', priority: 0.6 })),
    ...auctionIds.map((id) => ({ url: `${site}/auctions/${id}`, changeFrequency: 'weekly', priority: 0.6 })),
    ...clubIds.map((id) => ({ url: `${site}/clubs/${id}`, changeFrequency: 'weekly', priority: 0.5 })),
    ...forumIds.map((id) => ({ url: `${site}/forum/${id}`, changeFrequency: 'weekly', priority: 0.4 })),
    ...eventIds.map((id) => ({ url: `${site}/events/${id}`, changeFrequency: 'weekly', priority: 0.7 })),
    ...partnerIds.map((id) => ({ url: `${site}/partners/${id}`, changeFrequency: 'weekly', priority: 0.5 })),
  ];

  return [...staticPaths, ...dynamicEntries];
}


