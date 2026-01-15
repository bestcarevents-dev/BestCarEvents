import type { Metadata } from 'next';
import { getAdmin } from '@/lib/firebase-admin';
import { buildMetadata, pickImageUrl, toAbsoluteUrl } from '@/lib/seo';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

// Force dynamic rendering to prevent build-time errors with dynamic routes
export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Validate params.id before using it
  if (!params?.id || typeof params.id !== 'string' || params.id.trim() === '') {
    return buildMetadata({
      title: 'Car Details',
      description: 'Explore car details, specs, photos and contact the seller.',
      canonicalPath: '/cars',
    });
  }

  try {
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
  } catch (error) {
    console.error('Error generating car metadata:', error);
    return buildMetadata({
      title: 'Car Details',
      description: 'Explore car details, specs, photos and contact the seller.',
      canonicalPath: '/cars',
    });
  }
}

export default function CarIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', item: '/' },
        { name: 'Cars', item: '/cars' },
        { name: 'Car', item: '/cars' }, // Actual name added via metadata; URL already canonical
      ]} />
      {children}
    </>
  );
}


