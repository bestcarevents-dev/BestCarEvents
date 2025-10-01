'use client';

type FetchPayload = {
  locale: string;
  defaultLocale: string;
  texts: string[];
};

function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n: Node) => {
      const t = n.textContent?.trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      if (n.parentElement && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(n.parentElement.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  } as any);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

async function fetchTranslations(endpoint: string, payload: FetchPayload) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as {translations: string[]};
}

function applyTranslationsToDom(nodes: Text[], sourceToTranslated: Map<string, string>) {
  for (const node of nodes) {
    const original = node.textContent || '';
    const translated = sourceToTranslated.get(original);
    if (translated && translated !== original) node.textContent = translated;
  }
}

function computeMissingTexts(nodes: Text[], map: Map<string, string>): string[] {
  const missing: string[] = [];
  for (const node of nodes) {
    const t = node.textContent || '';
    const tr = map.get(t);
    if (!tr || tr === t) missing.push(t);
  }
  return Array.from(new Set(missing));
}

export async function enhancePageTranslations(locale: string, defaultLocale = 'en') {
  if (locale === defaultLocale) return;

  const endpoint = '/api/translate/cache';
  const allTextNodes = collectTextNodes(document.body);
  const uniqueTexts = Array.from(new Set(allTextNodes.map((n) => n.textContent || '')));
  if (uniqueTexts.length === 0) return;

  // Very small, unobtrusive toast using existing toaster (top edge on mobile, bottom-right on desktop via default viewport CSS)
  // We avoid importing react hooks here; use imperative toast API to keep this file framework-agnostic
  const toastApi = ((): {update: (p: any) => void; dismiss: () => void} | null => {
    try {
      // dynamic import to avoid bundling if not needed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { toast } = require('@/hooks/use-toast');
      const t = toast({
        title: 'Translating…',
        description: 'Applying language in the background',
        duration: 999999, // we will dismiss manually
      });
      return { update: t.update, dismiss: t.dismiss };
    } catch {
      return null;
    }
  })();

  const initial = await fetchTranslations(endpoint, { locale, defaultLocale, texts: uniqueTexts });
  if (!initial) {
    toastApi?.dismiss();
    return;
  }
  const initialMap = new Map<string, string>();
  uniqueTexts.forEach((t, i) => initialMap.set(t, initial.translations[i]));
  applyTranslationsToDom(allTextNodes, initialMap);

  // Determine which texts still need translation (cache misses returned as originals)
  let missing = computeMissingTexts(allTextNodes, initialMap);

  if (missing.length === 0) {
    toastApi?.dismiss();
    return;
  }

  // Backoff-bounded retry loop: quick retries first, then spaced retries; total < ~10s
  const retryDelaysMs = [400, 800, 1200, 2000, 3000, 3000];
  for (let i = 0; i < retryDelaysMs.length && missing.length > 0; i++) {
    await new Promise((r) => setTimeout(r, retryDelaysMs[i]));
    const res = await fetchTranslations(endpoint, { locale, defaultLocale, texts: missing });
    if (!res) continue;
    const map = new Map<string, string>();
    missing.forEach((t, idx) => map.set(t, res.translations[idx]));
    // Apply newly available translations only
    applyTranslationsToDom(allTextNodes, map);
    // Recompute missing based on what remains unchanged
    missing = computeMissingTexts(allTextNodes, map);
  }

  // Final small update and dismiss shortly after
  if (missing.length === 0) {
    toastApi?.update({ title: 'Translated', description: 'Language applied' });
  } else {
    toastApi?.update({ title: 'Partial translation', description: 'Some items will update soon' });
  }
  setTimeout(() => toastApi?.dismiss(), 900);
}


