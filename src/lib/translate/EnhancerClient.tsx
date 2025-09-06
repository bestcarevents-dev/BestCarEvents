'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { enhancePageTranslations } from '@/lib/translate/clientEnhancer';

export default function EnhancerClient({ locale, defaultLocale = 'en' }: {locale: string; defaultLocale?: string}) {
  const pathname = usePathname();
  useEffect(() => {
    // Run after each navigation and locale change
    const run = async () => {
      // Give the DOM a tick to settle after navigation
      await new Promise((r) => setTimeout(r, 50));
      enhancePageTranslations(locale, defaultLocale);
    };
    run();
  }, [locale, defaultLocale, pathname]);
  return null;
}


