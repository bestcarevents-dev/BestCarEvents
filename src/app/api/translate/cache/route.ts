import {NextRequest, NextResponse} from 'next/server';
import {cache, cacheKeyFrom, computeStableHash} from '@/lib/translate/cache';
import {ensureTranslationsAsync} from '@/lib/translate/fallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Payload = {
  locale: string;
  defaultLocale?: string;
  texts: string[];
};

export async function POST(req: NextRequest) {
  try {
    const {locale, defaultLocale = 'en', texts} = (await req.json()) as Payload;
    if (!locale || !Array.isArray(texts)) {
      return NextResponse.json({error: 'Invalid payload'}, {status: 400});
    }

    const keys = texts.map((t) => cacheKeyFrom(computeStableHash(t), locale));
    const values = await Promise.all(keys.map((k) => cache.get(k)));

    const translations = texts.map((t, i) => {
      const v = values[i] ?? t;
      const cleaned = String(v).replace(/^\s*(italiano|italian|it)\s*:\s*/i, '').trim();
      if (!cleaned || /^\s*(italiano|italian|it)\s*:?\s*$/i.test(cleaned)) return t;
      return cleaned;
    });

    const anyMissing = values.some((v) => !v);
    if (anyMissing) {
      // Fire and forget background translation for missing items
      ensureTranslationsAsync(texts, defaultLocale, locale);
    }

    return NextResponse.json({translations});
  } catch (e: any) {
    console.error('POST /api/translate/cache error:', e);
    return NextResponse.json({error: 'Internal error'}, {status: 500});
  }
}


