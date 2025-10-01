'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { enhancePageTranslations } from '@/lib/translate/clientEnhancer';

export default function EnhancerClient({ locale, defaultLocale = 'en' }: {locale: string; defaultLocale?: string}) {
  const pathname = usePathname();
  const dbg = (...args: any[]) => {
    try {
      if (typeof window !== 'undefined' && (window as any).__DEBUG_TRANSLATE) {
        // eslint-disable-next-line no-console
        console.log('[translate/enhancer]', ...args);
      }
    } catch {}
  };
  useEffect(() => {
    // Run after each navigation and locale change
    const run = async () => {
      // Give the DOM a tick to settle after navigation
      await new Promise((r) => setTimeout(r, 50));
      dbg('navigation enhance', { pathname, locale });
      enhancePageTranslations(locale, defaultLocale);
    };
    run();
  }, [locale, defaultLocale, pathname]);

  // Observe dynamic DOM changes and translate newly added/changed content
  useEffect(() => {
    if (locale === defaultLocale) return;
    let timer: any = null;
    const pendingRoots = new Set<Node>();

    const schedule = () => {
      if (timer) return;
      timer = setTimeout(async () => {
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();
        timer = null;
        // If many changes happened, do a single pass on body for efficiency
        if (roots.length === 0) return;
        if (roots.length > 5) {
          dbg('observer batch -> body', { batches: roots.length });
          await enhancePageTranslations(locale, defaultLocale);
        } else {
          dbg('observer batch -> roots', { batches: roots.length });
          for (const root of roots) {
            await enhancePageTranslations(locale, defaultLocale, root);
          }
        }
      }, 200);
    };

    const observer = new MutationObserver((mutations) => {
      dbg('mutations', { count: mutations.length });
      for (const m of mutations) {
        if (m.type === 'childList') {
          pendingRoots.add(m.target);
          for (const n of Array.from(m.addedNodes)) {
            if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
              pendingRoots.add(n as Node);
            }
          }
        } else if (m.type === 'characterData') {
          if (m.target && (m.target as Node).parentNode) {
            pendingRoots.add((m.target as Node).parentNode as Node);
          }
        }
      }
      schedule();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [locale, defaultLocale]);
  return null;
}


