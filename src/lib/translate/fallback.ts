import {translateBatch} from './translator';
import {cache, cacheKeyFrom, computeStableHash} from './cache';

export async function ensureTranslationsAsync(
  texts: string[],
  sourceLocale: string,
  targetLocale: string
) {
  // Check what is missing and only translate those in background
  const keys = texts.map((t) => cacheKeyFrom(computeStableHash(t), targetLocale));
  const existing = await Promise.all(keys.map((k) => cache.get(k)));
  const missing: string[] = [];
  const missingIdx: number[] = [];
  existing.forEach((val, i) => {
    if (!val) {
      missing.push(texts[i]);
      missingIdx.push(i);
    }
  });
  if (missing.length === 0) return;

  try {
    const {translations} = await translateBatch({
      texts: missing,
      sourceLocale,
      targetLocale,
    });
    await Promise.all(
      translations.map((t, i) => {
        const original = missing[i];
        return cache.set(cacheKeyFrom(computeStableHash(original), targetLocale), t);
      })
    );
  } catch (e) {
    // Swallow errors to avoid blocking render
  }
}


