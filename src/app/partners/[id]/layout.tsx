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
      title: 'Partner',
      description: 'View partner profile, ads and details.',
      canonicalPath: '/partners',
    });
  }

  try {
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
  } catch (error) {
    console.error('Error generating partner metadata:', error);
    return buildMetadata({
      title: 'Partner',
      description: 'View partner profile, ads and details.',
      canonicalPath: '/partners',
    });
  }
}

export default function PartnerIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', item: '/' }, { name: 'Partners', item: '/partners' }]} />
      {children}
    </>
  );
}


