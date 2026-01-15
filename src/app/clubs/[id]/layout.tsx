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
      title: 'Car Club',
      description: 'Discover this car club, activities, and how to join.',
      canonicalPath: '/clubs',
    });
  }

  try {
    const admin = getAdmin();
    const db = admin.firestore();
    const snap = await db.collection('clubs').doc(params.id).get();
    const data = snap.exists ? snap.data() as any : null;
    const title = data?.name || 'Car Club';
    const desc = data?.description || 'Discover this car club, activities, and how to join.';
    const img = pickImageUrl(data);
    return buildMetadata({
      title,
      description: desc,
      canonicalPath: `/clubs/${params.id}`,
      imageUrl: img ? toAbsoluteUrl(img) : undefined,
    });
  } catch (error) {
    console.error('Error generating club metadata:', error);
    return buildMetadata({
      title: 'Car Club',
      description: 'Discover this car club, activities, and how to join.',
      canonicalPath: '/clubs',
    });
  }
}

export default function ClubIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', item: '/' }, { name: 'Clubs', item: '/clubs' }]} />
      {children}
    </>
  );
}


