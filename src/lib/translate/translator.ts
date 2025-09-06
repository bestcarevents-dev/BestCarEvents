import {getTranslationClients} from './googleClient';
import {cache, cacheKeyFrom, computeStableHash} from './cache';

export type TranslateInput = {
  texts: string[];
  sourceLocale: string;
  targetLocale: string;
};

export type TranslateBatchLog = {
  totalChars: number;
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  usedGlossary: boolean;
};

const MAX_PER_REQUEST = 5000;

function chunkTextsPreserveOrder(texts: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLen = 0;
  for (const t of texts) {
    const len = Buffer.byteLength(t, 'utf8');
    if (len > MAX_PER_REQUEST) {
      // Hard split overly long strings to protect API; keep simple split
      const midpoint = Math.floor(t.length / 2);
      const left = t.slice(0, midpoint);
      const right = t.slice(midpoint);
      for (const part of [left, right]) {
        if (Buffer.byteLength(part, 'utf8') > MAX_PER_REQUEST) {
          // still too long; push as its own to fail-fast
          chunks.push([part]);
          continue;
        }
        if (currentLen + Buffer.byteLength(part, 'utf8') > MAX_PER_REQUEST) {
          if (current.length) chunks.push(current);
          current = [];
          currentLen = 0;
        }
        current.push(part);
        currentLen += Buffer.byteLength(part, 'utf8');
      }
      continue;
    }
    if (currentLen + len > MAX_PER_REQUEST) {
      if (current.length) chunks.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(t);
    currentLen += len;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateChunk(texts: string[], source: string, target: string): Promise<string[]> {
  const {translationClient, projectId, location, glossaryName} = getTranslationClients();
  const parent = `projects/${projectId}/locations/${location}`;

  const request: any = {
    parent,
    contents: texts,
    sourceLanguageCode: source,
    targetLanguageCode: target,
    mimeType: 'text/plain',
  };

  if (glossaryName) {
    request.glossaryConfig = {glossary: glossaryName};
  }

  const [response] = await translationClient.translateText(request);
  const translations = response.glossaryTranslations?.length
    ? response.glossaryTranslations
    : response.translations || [];
  return translations.map((t) => t.translatedText || '');
}

export async function translateBatch({texts, sourceLocale, targetLocale}: TranslateInput): Promise<{translations: string[]; log: TranslateBatchLog;}> {
  const totalChars = texts.reduce((sum, t) => sum + Buffer.byteLength(t, 'utf8'), 0);
  const log: TranslateBatchLog = {
    totalChars,
    requests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    usedGlossary: Boolean(getTranslationClients().glossaryName),
  };

  const hashes = texts.map((t) => computeStableHash(t));
  const keys = hashes.map((h) => cacheKeyFrom(h, targetLocale));

  const results: (string | null)[] = await Promise.all(keys.map((k) => cache.get(k)));
  const output: string[] = new Array(texts.length);
  const toTranslate: {index: number; text: string}[] = [];

  results.forEach((val, i) => {
    if (val) {
      log.cacheHits++;
      output[i] = val;
    } else {
      log.cacheMisses++;
      toTranslate.push({index: i, text: texts[i]});
    }
  });

  if (toTranslate.length === 0) {
    return {translations: output, log};
  }

  const chunks = chunkTextsPreserveOrder(toTranslate.map((t) => t.text));
  let startIdx = 0;

  for (const chunk of chunks) {
    let attempts = 0;
    // Rate limit/backoff
    while (true) {
      try {
        log.requests++;
        const translated = await translateChunk(chunk, sourceLocale, targetLocale);
        for (let i = 0; i < translated.length; i++) {
          const originalIndex = toTranslate[startIdx + i].index;
          const translatedText = translated[i];
          output[originalIndex] = translatedText;
        }
        // persist to cache
        await Promise.all(
          translated.map((t, i) => {
            const original = chunk[i];
            const key = cacheKeyFrom(computeStableHash(original), targetLocale);
            return cache.set(key, t);
          })
        );
        startIdx += chunk.length;
        break;
      } catch (err: any) {
        attempts++;
        const status = err?.code || err?.status || 0;
        if (attempts >= 5) throw err;
        // exponential backoff with jitter
        const base = 500 * Math.pow(2, attempts);
        const jitter = Math.floor(Math.random() * 200);
        if (status === 429 || status === 503) {
          await delay(base + jitter);
          continue;
        }
        await delay(300 + jitter);
      }
    }
  }

  return {translations: output, log};
}


