import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
}

export default function ForumIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


