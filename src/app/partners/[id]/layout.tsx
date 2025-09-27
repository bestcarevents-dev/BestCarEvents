import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('partners').doc(params.id).get();
  const data = snap.exists ? snap.data() as any : null;
  const title = data?.name || 'Partner';
  const desc = data?.description || 'View partner profile, ads and details.';
  const img = pickImageUrl(data);
  return buildMetadata({
    title,
    description: desc,
    canonicalPath: `/partners/${params.id}`,
    imageUrl: img ? toAbsoluteUrl(img) : undefined,
  });
}

export default function PartnerIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


