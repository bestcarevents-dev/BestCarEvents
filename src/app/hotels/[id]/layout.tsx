import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('hotels').doc(params.id).get();
  const data = snap.exists ? snap.data() as any : null;
  const title = data?.name || 'Car Hotel';
  const desc = data?.description || 'Discover storage, amenities, and services at this car hotel.';
  const img = pickImageUrl(data);
  return buildMetadata({
    title,
    description: desc,
    canonicalPath: `/hotels/${params.id}`,
    imageUrl: img ? toAbsoluteUrl(img) : undefined,
  });
}

export default function HotelIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


