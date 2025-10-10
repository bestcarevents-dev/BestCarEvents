import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Car Forum & Community Discussions | BestCarEvents',
  description: 'Join car community discussions. Share builds, ask questions, and engage with enthusiasts worldwide.',
  canonicalPath: '/forum',
  keywords: ['bestcarevents', 'car forum', 'auto forum', 'automotive community', 'car discussion', 'car enthusiasts'],
});

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return children;
}


