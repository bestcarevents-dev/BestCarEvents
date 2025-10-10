import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Advertise With Us | BestCarEvents',
  description: 'Promote your brand to car enthusiasts. Explore ad placements, partnerships, and newsletter sponsorships.',
  canonicalPath: '/advertise-with-us',
  keywords: ['bestcarevents', 'advertise', 'sponsor', 'car audience', 'automotive advertising', 'newsletter sponsorship'],
});

export default function AdvertiseWithUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


