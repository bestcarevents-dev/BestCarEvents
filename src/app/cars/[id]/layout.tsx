import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('cars').doc(params.id).get();
  const data = snap.exists ? snap.data() as any : null;
  const title = data?.title || [data?.year, data?.make, data?.model].filter(Boolean).join(' ') || 'Car Details';
  const desc = data?.description || 'Explore car details, specs, photos and contact the seller.';
  const img = pickImageUrl(data);
  return buildMetadata({
    title,
    description: desc,
    canonicalPath: `/cars/${params.id}`,
    imageUrl: img ? toAbsoluteUrl(img) : undefined,
  });
}

export default function CarIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


