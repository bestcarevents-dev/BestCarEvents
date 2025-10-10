import { getSiteUrl, toAbsoluteUrl } from '@/lib/seo';

type BreadcrumbItem = {
  name: string;
  item: string; // absolute or path
};

export default function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const site = getSiteUrl().replace(/\/$/, '');
  const list = (items || []).map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    item: {
      '@id': it.item.startsWith('http') ? it.item : toAbsoluteUrl(it.item, site),
      name: it.name,
    },
  }));

  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list,
  } as const;

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}


