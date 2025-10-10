import { getSiteUrl } from '@/lib/seo';

export default function OrganizationJsonLd() {
  const site = getSiteUrl().replace(/\/$/, '');
  const json = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'BestCarEvents',
      alternateName: ['Best Car Events', 'BestCarEvents.com'],
      url: site,
      logo: `${site}/logo.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'BestCarEvents',
      alternateName: ['Best Car Events', 'BestCarEvents.com'],
      url: site,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${site}/events?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}


