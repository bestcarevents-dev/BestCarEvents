import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Car Forum & Community Discussions | BestCarEvents',
  description: 'Join car community discussions. Share builds, ask questions, and engage with enthusiasts worldwide.',
  canonicalPath: '/forum',
});

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return children;
}


