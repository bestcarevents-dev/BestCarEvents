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
      // avoid scripts/styles
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

export async function enhancePageTranslations(locale: string, defaultLocale = 'en') {
  if (locale === defaultLocale) {
    // Restore original text by causing a full rerender fetch and skipping replacements
    return;
  }
  const textNodes = collectTextNodes(document.body);
  const unique = Array.from(new Set(textNodes.map((n) => n.textContent || '')));
  if (unique.length === 0) return;
  const endpoint = '/api/translate/cache';
  const result = await fetchTranslations(endpoint, {locale, defaultLocale, texts: unique});
  if (!result) return;
  const map = new Map<string, string>();
  unique.forEach((t, i) => map.set(t, result.translations[i]));
  // Apply translations in-place
  for (const n of textNodes) {
    const t = n.textContent || '';
    const tr = map.get(t);
    if (tr && tr !== t) n.textContent = tr;
  }

  // Quick retry after a short delay for just-missed items
  setTimeout(async () => {
    const missingNodes = collectTextNodes(document.body).filter((n) => (n.textContent || '').trim().length > 0);
    const missingUnique = Array.from(new Set(missingNodes.map((n) => n.textContent || '')));
    const res2 = await fetchTranslations(endpoint, {locale, defaultLocale, texts: missingUnique});
    if (!res2) return;
    const map2 = new Map<string, string>();
    missingUnique.forEach((t, i) => map2.set(t, res2.translations[i]));
    for (const n of missingNodes) {
      const t2 = n.textContent || '';
      const tr2 = map2.get(t2);
      if (tr2 && tr2 !== t2) n.textContent = tr2;
    }
  }, 1200);
}


