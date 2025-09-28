import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Car Clubs | Join Local & International Clubs | BestCarEvents',
  description: 'Explore car clubs, meet enthusiasts, and join activities. Find clubs by location and interest.',
  canonicalPath: '/clubs',
});

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


