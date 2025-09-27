import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('auctions').doc(params.id).get();
  const data = snap.exists ? snap.data() as any : null;
  const title = data?.title || 'Auction Details';
  const desc = data?.description || 'Explore auction details, schedule, and featured lots.';
  const img = pickImageUrl(data);
  return buildMetadata({
    title,
    description: desc,
    canonicalPath: `/auctions/${params.id}`,
    imageUrl: img ? toAbsoluteUrl(img) : undefined,
  });
}

export default function AuctionIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}


