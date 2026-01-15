import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

// Force dynamic rendering to prevent build-time errors with dynamic routes
export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!params?.id || typeof params.id !== 'string' || params.id.trim() === '') {
    return buildMetadata({
      title: 'Car Hotel',
      description: 'Discover storage, amenities, and services at this car hotel.',
      canonicalPath: '/hotels',
    });
  }

  try {
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
  } catch (error) {
    console.error('Error generating hotel metadata:', error);
    return buildMetadata({
      title: 'Car Hotel',
      description: 'Discover storage, amenities, and services at this car hotel.',
      canonicalPath: '/hotels',
    });
  }
}

export default function HotelIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', item: '/' }, { name: 'Hotels', item: '/hotels' }]} />
      {children}
    </>
  );
}


