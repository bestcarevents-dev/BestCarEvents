import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('events').doc(params.id).get();
  const data = snap.exists ? snap.data() as any : null;
  const title = data?.eventName || 'Event Details';
  const desc = data?.description || 'See event details, location, schedule and register.';
  const img = pickImageUrl(data) || data?.imageUrl;
  return buildMetadata({
    title,
    description: desc,
    canonicalPath: `/events/${params.id}`,
    imageUrl: img ? toAbsoluteUrl(img) : undefined,
  });
}

export default function EventIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


