'use client';
import { useEffect } from 'react';
import { enhancePageTranslations } from '@/lib/translate/clientEnhancer';

export default function EnhancerClient({ locale, defaultLocale = 'en' }: {locale: string; defaultLocale?: string}) {
  useEffect(() => {
    enhancePageTranslations(locale, defaultLocale);
  }, [locale, defaultLocale]);
  return null;
}


