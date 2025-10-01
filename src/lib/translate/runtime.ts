import {cache, cacheKeyFrom, computeStableHash} from './cache';
import {ensureTranslationsAsync} from './fallback';

function sanitizeTranslated(original: string, translated: string | null | undefined): string {
  if (!translated) return original;
  let out = String(translated);
  out = out.replace(/^\s*(italiano|italian|it)\s*:\s*/i, '');
  out = out.trim();
  if (!out || /^\s*(italiano|italian|it)\s*:?\s*$/i.test(out)) return original;
  return out;
}

export async function getTranslationsOrDefault(
  texts: string[],
  locale: string,
  defaultLocale: string
): Promise<string[]> {
  if (locale === defaultLocale) return texts;

  const keys = texts.map((t) => cacheKeyFrom(computeStableHash(t), locale));
  const fromCache = await Promise.all(keys.map((k) => cache.get(k)));
  const output = texts.map((t, i) => sanitizeTranslated(t, fromCache[i] ?? t));

  const anyMissing = fromCache.some((v) => !v);
  if (anyMissing) {
    // Queue background translation without blocking
    ensureTranslationsAsync(texts, defaultLocale, locale);
  }

  return output;
}


