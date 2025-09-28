import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Car Events & Meets | BestCarEvents',
  description: 'Discover upcoming car events, rallies, track days, and meets worldwide. Filter by date, location, and type.',
  canonicalPath: '/events',
});

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


