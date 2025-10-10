import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Car Hotels & Storage | BestCarEvents',
  description: 'Find premium car hotels and storage facilities. Compare amenities, security, and availability.',
  canonicalPath: '/hotels',
  keywords: ['bestcarevents', 'car hotels', 'car storage', 'vehicle storage', 'auto storage', 'car hotel near me'],
});

export default function HotelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


