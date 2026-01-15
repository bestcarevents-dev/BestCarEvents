import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

// Force dynamic rendering to prevent build-time errors with dynamic routes
export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!params?.id || typeof params.id !== 'string' || params.id.trim() === '') {
    return buildMetadata({
      title: 'Forum Post',
      description: 'View this forum discussion.',
      canonicalPath: '/forum',
    });
  }

  try {
    const admin = getAdmin();
    const db = admin.firestore();
    const snap = await db.collection('forum_posts').doc(params.id).get();
    const data = snap.exists ? snap.data() as any : null;
    const title = data?.title || 'Forum Post';
    const desc = (data?.content && String(data.content).slice(0, 160)) || 'View this forum discussion.';
    const img = pickImageUrl(data);
    return buildMetadata({
      title,
      description: desc,
      canonicalPath: `/forum/${params.id}`,
      imageUrl: img ? toAbsoluteUrl(img) : undefined,
    });
  } catch (error) {
    console.error('Error generating forum metadata:', error);
    return buildMetadata({
      title: 'Forum Post',
      description: 'View this forum discussion.',
      canonicalPath: '/forum',
    });
  }
}

export default function ForumIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


