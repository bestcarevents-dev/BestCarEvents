import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Car Auctions | Live & Upcoming | BestCarEvents',
  description: 'Browse live and upcoming car auctions. Discover rare cars, bid schedules, and auction details.',
  canonicalPath: '/auctions',
});

export default function AuctionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


