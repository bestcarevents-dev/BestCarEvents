import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Cars for Sale | Listings | BestCarEvents',
  description: 'Shop cars for sale. Filter by make, model, year, price, and location. High-quality photos and details.',
  canonicalPath: '/cars',
});

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


