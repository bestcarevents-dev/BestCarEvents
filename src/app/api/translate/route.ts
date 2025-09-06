import {NextRequest, NextResponse} from 'next/server';
import {translateBatch} from '@/lib/translate/translator';
import {computeStableHash, cacheKeyFrom, cache as cacheProvider} from '@/lib/translate/cache';

type WebhookPayload = {
  sourceLocale: string;
  targetLocales: string[]; // e.g., ['sv','da','ur']
  items: {id: string; text: string}[]; // user-visible text blocks, deterministic ID per block
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const {sourceLocale, targetLocales, items} = payload;
    if (!sourceLocale || !Array.isArray(targetLocales) || !Array.isArray(items)) {
      return NextResponse.json({error: 'Invalid payload'}, {status: 400});
    }

    const sourceTexts = items.map((i) => i.text || '');

    const results: Record<string, {log: any}> = {};

    for (const targetLocale of targetLocales) {
      const {translations, log} = await translateBatch({
        texts: sourceTexts,
        sourceLocale,
        targetLocale,
      });
      // Persist with stable keys derived from content hash + locale
      await Promise.all(
        translations.map((t, idx) => {
          const hash = computeStableHash(sourceTexts[idx]);
          const key = cacheKeyFrom(hash, targetLocale);
          return cacheProvider.set(key, t);
        })
      );
      results[targetLocale] = {log};
    }

    return NextResponse.json({ok: true, results});
  } catch (err: any) {
    return NextResponse.json({error: err?.message || 'Internal error'}, {status: 500});
  }
}


