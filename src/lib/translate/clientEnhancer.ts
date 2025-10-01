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

// Minimal indicator (tiny spinner) management
let indicatorCount = 0;

function ensureIndicator(): HTMLElement | null {
  try {
    let el = document.getElementById('mini-translate-indicator');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'mini-translate-indicator';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.style.position = 'fixed';
    el.style.top = '8px';
    el.style.right = '8px';
    el.style.zIndex = '100';
    el.style.padding = '6px 8px';
    el.style.background = 'rgba(15,23,42,0.70)'; // slate-900/70
    el.style.color = '#fff';
    el.style.borderRadius = '9999px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '6px';
    el.style.fontSize = '12px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
    el.style.backdropFilter = 'saturate(140%) blur(6px)';
    el.style.webkitBackdropFilter = 'saturate(140%) blur(6px)';

    // spinner
    const spinner = document.createElement('span');
    spinner.setAttribute('aria-hidden', 'true');
    spinner.style.width = '10px';
    spinner.style.height = '10px';
    spinner.style.border = '2px solid rgba(255,255,255,0.25)';
    spinner.style.borderTopColor = '#fde68a'; // amber-200
    spinner.style.borderRadius = '9999px';
    spinner.style.display = 'inline-block';
    spinner.style.animation = 'mini-spin 0.75s linear infinite';

    const text = document.createElement('span');
    text.textContent = 'Translating';
    text.style.opacity = '0.9';

    el.appendChild(spinner);
    el.appendChild(text);

    // inject keyframes once
    if (!document.getElementById('mini-spin-style')) {
      const style = document.createElement('style');
      style.id = 'mini-spin-style';
      style.textContent = '@keyframes mini-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    document.body.appendChild(el);
    return el;
  } catch {
    return null;
  }
}

function showIndicator() {
  indicatorCount++;
  const el = ensureIndicator();
  if (el) el.style.opacity = '1';
}

function hideIndicatorSoon() {
  indicatorCount = Math.max(0, indicatorCount - 1);
  if (indicatorCount === 0) {
    const el = document.getElementById('mini-translate-indicator');
    if (!el) return;
    // Fade out subtly
    el.style.transition = 'opacity 160ms ease-in';
    el.style.opacity = '0';
    setTimeout(() => {
      // Keep element mounted to avoid layout shift; we just keep it invisible
      // Could remove if needed: el.remove()
    }, 200);
  }
}

export async function enhancePageTranslations(locale: string, defaultLocale = 'en', root?: Node) {
  if (locale === defaultLocale) return;

  const endpoint = '/api/translate/cache';
  const container = root ?? document.body;
  const nodes = collectTextNodes(container);
  const uniqueTexts = Array.from(new Set(nodes.map((n) => n.textContent || '')));
  if (uniqueTexts.length === 0) return;

  showIndicator();
  try {
    const initial = await fetchTranslations(endpoint, { locale, defaultLocale, texts: uniqueTexts });
    if (!initial) {
      return;
    }
    const initialMap = new Map<string, string>();
    uniqueTexts.forEach((t, i) => initialMap.set(t, initial.translations[i]));
    applyTranslationsToDom(nodes, initialMap);

    // remaining texts are those that still equal their originals
    let remaining = uniqueTexts.filter((t) => (initialMap.get(t) ?? t) === t);
    if (remaining.length === 0) return;

    // Backoff-bounded retry loop
    const retryDelaysMs = [400, 800, 1200, 2000, 3000, 3000];
    for (let i = 0; i < retryDelaysMs.length && remaining.length > 0; i++) {
      await new Promise((r) => setTimeout(r, retryDelaysMs[i]));
      const res = await fetchTranslations(endpoint, { locale, defaultLocale, texts: remaining });
      if (!res) continue;
      const map = new Map<string, string>();
      remaining.forEach((t, idx) => map.set(t, res.translations[idx]));
      applyTranslationsToDom(nodes, map);
      // prune those that translated now
      remaining = remaining.filter((t) => (map.get(t) ?? t) === t);
    }
  } finally {
    hideIndicatorSoon();
  }
}


