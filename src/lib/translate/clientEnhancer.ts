'use client';

type FetchPayload = {
  locale: string;
  defaultLocale: string;
  texts: string[];
};

function dbg(...args: any[]) {
  try {
    if (typeof window !== 'undefined' && (window as any).__DEBUG_TRANSLATE) {
      // eslint-disable-next-line no-console
      console.log('[translate/client]', ...args);
    }
  } catch {}
}

function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n: Node) => {
      const t = n.textContent?.trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      if (n.parentElement && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(n.parentElement.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      // Respect opt-out markers on parent elements
      if (n.parentElement) {
        const el = n.parentElement as HTMLElement;
        if (el.getAttribute('data-no-translate') != null || el.getAttribute('translate') === 'no') {
          return NodeFilter.FILTER_REJECT;
        }
        const cls = el.className || '';
        if (typeof cls === 'string' && cls.split(' ').includes('notranslate')) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  } as any);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

async function fetchTranslations(endpoint: string, payload: FetchPayload) {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  dbg('fetchTranslations ->', { count: payload.texts.length, locale: payload.locale });
  let url = endpoint;
  try {
    if (typeof window !== 'undefined' && (window as any).__DEBUG_TRANSLATE) {
      url = `${endpoint}?debug=1`;
    }
  } catch {}
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
  const ms = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start).toFixed(0);
  if (!res.ok) {
    dbg('fetchTranslations <- error', { status: res.status, ms });
    return null;
  }
  const json = (await res.json()) as {translations: string[]};
  dbg('fetchTranslations <-', { received: json?.translations?.length ?? 0, ms });
  return json;
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
let hideTimeout: any = null;
let isEnhancing = false;
let lastEnhanceAt = 0;

function getFlagUrl(locale: string): string | null {
  switch ((locale || '').toLowerCase()) {
    case 'it':
      return 'https://flagcdn.com/it.svg';
    case 'sv':
      return 'https://flagcdn.com/se.svg';
    case 'da':
      return 'https://flagcdn.com/dk.svg';
    case 'ur':
      return 'https://flagcdn.com/pk.svg';
    case 'en':
      return 'https://flagcdn.com/gb.svg';
    default:
      return null;
  }
}

function ensureIndicator(): HTMLElement | null {
  try {
    let el = document.getElementById('mini-translate-indicator');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'mini-translate-indicator';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.style.position = 'fixed';
    el.style.bottom = '8px';
    el.style.left = '8px';
    el.style.zIndex = '100';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.background = 'rgba(15,23,42,0.60)';
    el.style.borderRadius = '9999px';
    el.style.display = 'grid';
    el.style.placeItems = 'center';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
    el.style.backdropFilter = 'saturate(140%) blur(6px)';
    el.style.webkitBackdropFilter = 'saturate(140%) blur(6px)';

    // Wrapper so we can spin the ring around the flag
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.style.width = '22px';
    wrap.style.height = '22px';

    // Flag image
    const img = document.createElement('img');
    img.id = 'mini-translate-flag';
    img.alt = 'Language';
    img.width = 18;
    img.height = 18;
    img.style.width = '18px';
    img.style.height = '18px';
    img.style.borderRadius = '3px';
    img.style.display = 'block';
    img.style.objectFit = 'cover';
    img.referrerPolicy = 'no-referrer';
    img.src = getFlagUrl((window as any).__currentTargetLocale || 'it') || 'https://flagcdn.com/it.svg';

    // Spinner ring around flag
    const ring = document.createElement('span');
    ring.setAttribute('aria-hidden', 'true');
    ring.style.position = 'absolute';
    ring.style.inset = '-2px';
    ring.style.border = '2px solid rgba(255,255,255,0.25)';
    ring.style.borderTopColor = '#fde68a';
    ring.style.borderRadius = '9999px';
    ring.style.animation = 'mini-spin 0.8s linear infinite';

    wrap.appendChild(img);
    wrap.appendChild(ring);
    el.appendChild(wrap);

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
  if (!el) return;
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  el.style.transition = 'opacity 120ms ease-out';
  el.style.opacity = '1';
  dbg('indicator show', { indicatorCount });
}

function hideIndicatorSoon() {
  indicatorCount = Math.max(0, indicatorCount - 1);
  if (indicatorCount === 0) {
    const el = document.getElementById('mini-translate-indicator');
    if (!el) return;
    if (hideTimeout) clearTimeout(hideTimeout);
    // Keep visible briefly to avoid flicker across quick successive passes
    hideTimeout = setTimeout(() => {
      el.style.transition = 'opacity 160ms ease-in';
      el.style.opacity = '0';
    }, 800);
    dbg('indicator hide soon');
  }
}

export async function enhancePageTranslations(locale: string, defaultLocale = 'en', root?: Node) {
  if (locale === defaultLocale) return;

  const endpoint = '/api/translate/cache';
  const container = root ?? document.body;
  const nodes = collectTextNodes(container);
  const uniqueTexts = Array.from(new Set(nodes.map((n) => n.textContent || '')));
  if (uniqueTexts.length === 0) return;

  // expose locale for flag selection
  (window as any).__currentTargetLocale = locale;

  // Throttle frequent dynamic calls to avoid excessive API traffic and flicker
  const now = Date.now();
  const isSubtree = !!root && root !== document.body;
  if (isSubtree && now - lastEnhanceAt < 600) {
    dbg('throttle skip subtree enhance', { sinceLastMs: now - lastEnhanceAt, texts: uniqueTexts.length });
    return;
  }

  dbg('enhance start', { locale, isSubtree, texts: uniqueTexts.length });
  showIndicator();
  try {
    if (isEnhancing && isSubtree) {
      // Another pass is already enhancing the DOM; rely on it to cover recent changes
      dbg('skip subtree; already enhancing');
      return;
    }
    isEnhancing = true;
    const initial = await fetchTranslations(endpoint, { locale, defaultLocale, texts: uniqueTexts });
    if (!initial) {
      dbg('initial fetch failed');
      return;
    }
    const initialMap = new Map<string, string>();
    uniqueTexts.forEach((t, i) => initialMap.set(t, initial.translations[i]));
    applyTranslationsToDom(nodes, initialMap);

    // remaining texts are those that still equal their originals
    let remaining = uniqueTexts.filter((t) => (initialMap.get(t) ?? t) === t);
    dbg('remaining after initial', { remaining: remaining.length });
    if (remaining.length === 0) return;

    // Backoff-bounded retry loop (shorter for subtree updates)
    const retryDelaysMs = isSubtree ? [600, 1500] : [400, 800, 1200, 2000, 3000, 3000];
    for (let i = 0; i < retryDelaysMs.length && remaining.length > 0; i++) {
      await new Promise((r) => setTimeout(r, retryDelaysMs[i]));
      const res = await fetchTranslations(endpoint, { locale, defaultLocale, texts: remaining });
      if (!res) continue;
      const map = new Map<string, string>();
      remaining.forEach((t, idx) => map.set(t, res.translations[idx]));
      applyTranslationsToDom(nodes, map);
      // prune those that translated now
      remaining = remaining.filter((t) => (map.get(t) ?? t) === t);
      dbg('retry pass', { attempt: i + 1, remaining: remaining.length });
    }
  } finally {
    isEnhancing = false;
    lastEnhanceAt = Date.now();
    dbg('enhance end');
    hideIndicatorSoon();
  }
}


