import {cache, cacheKeyFrom, computeStableHash} from './cache';
import {ensureTranslationsAsync} from './fallback';

export async function getTranslationsOrDefault(
  texts: string[],
  locale: string,
  defaultLocale: string
): Promise<string[]> {
  if (locale === defaultLocale) return texts;

  const keys = texts.map((t) => cacheKeyFrom(computeStableHash(t), locale));
  const fromCache = await Promise.all(keys.map((k) => cache.get(k)));
  const output = texts.map((t, i) => fromCache[i] ?? t);

  const anyMissing = fromCache.some((v) => !v);
  if (anyMissing) {
    // Queue background translation without blocking
    ensureTranslationsAsync(texts, defaultLocale, locale);
  }

  return output;
}


