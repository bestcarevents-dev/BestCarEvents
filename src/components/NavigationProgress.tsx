"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const originalPushRef = useRef<typeof history.pushState | null>(null);
  const originalReplaceRef = useRef<typeof history.replaceState | null>(null);
  const inflightCountRef = useRef(0);
  const totalBytesRef = useRef(0);
  const loadedBytesRef = useRef(0);
  const originalFetchRef = useRef<typeof fetch | null>(null);

  // Start progress on internal link clicks for immediate feedback
  useEffect(() => {
    const isModifiedClick = (event: MouseEvent) => {
      return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event as any).button === 1;
    };

    const isSameOrigin = (url: URL) => {
      try {
        return url.origin === window.location.origin;
      } catch {
        return false;
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      let el = event.target as HTMLElement | null;
      while (el && el.tagName !== "A") el = el.parentElement;
      if (!el) return;
      const anchor = el as HTMLAnchorElement;
      const href = anchor.getAttribute("href") || "";
      const target = anchor.getAttribute("target");
      if (!href || href.startsWith("#") || target === "_blank") return;

      try {
        const url = href.startsWith("/") ? new URL(href, window.location.origin) : new URL(href);
        if (!isSameOrigin(url)) return;
      } catch {
        return;
      }

      // Same-origin navigation → show progress
      if (!active) {
        setActive(true);
        startedAtRef.current = Date.now();
      }
    };

    document.addEventListener("click", onClickCapture, { capture: true });
    return () => document.removeEventListener("click", onClickCapture, { capture: true } as any);
  }, [active]);

  // Stop progress when the route (path or query) changes
  useEffect(() => {
    if (!active) return;
    const MIN_VISIBLE_MS = 200;
    const startedAt = startedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
    }
    stopTimeoutRef.current = window.setTimeout(() => {
      setActive(false);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('nav-loading');
      }
      startedAtRef.current = null;
      stopTimeoutRef.current = null;
    }, remaining) as unknown as number;

    return () => {
      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [pathname, searchParams, active]);

  // Start progress for programmatic navigations (router.push/replace, back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!originalPushRef.current) originalPushRef.current = history.pushState;
    if (!originalReplaceRef.current) originalReplaceRef.current = history.replaceState;

    const start = () => {
      if (!active) {
        setActive(true);
        startedAtRef.current = Date.now();
      }
    };

    const patchedPush: typeof history.pushState = function (...args) {
      start();
      return originalPushRef.current!.apply(history, args as any);
    };
    const patchedReplace: typeof history.replaceState = function (...args) {
      start();
      return originalReplaceRef.current!.apply(history, args as any);
    };

    const onPopState = () => start();

    history.pushState = patchedPush;
    history.replaceState = patchedReplace;
    window.addEventListener('popstate', onPopState);

    return () => {
      if (originalPushRef.current) history.pushState = originalPushRef.current;
      if (originalReplaceRef.current) history.replaceState = originalReplaceRef.current;
      window.removeEventListener('popstate', onPopState);
    };
  }, [active]);

  // Instrument fetch to estimate progress during navigations
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!originalFetchRef.current) originalFetchRef.current = window.fetch.bind(window);

    const isNav = () => document.documentElement.classList.contains('nav-loading');

    const instrumentedFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || String(input);
      const sameOrigin = (() => {
        try { return new URL(url, window.location.origin).origin === window.location.origin; } catch { return false; }
      })();

      if (!isNav() || !sameOrigin) {
        return originalFetchRef.current!(input as any, init);
      }

      inflightCountRef.current += 1;
      try {
        const res = await originalFetchRef.current!(input as any, init);
        const contentLengthHeader = res.headers.get('content-length');
        const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

        if (!res.body || !(res.body as any).getReader) {
          // If not a stream we can't measure; make a small heuristic bump
          totalBytesRef.current += contentLength || 100000;
          loadedBytesRef.current += contentLength || 100000;
          const pct = totalBytesRef.current > 0 ? loadedBytesRef.current / totalBytesRef.current : 0.9;
          setProgress(Math.min(0.95, pct));
          return res;
        }

        totalBytesRef.current += contentLength || 100000;
        const reader = (res.body as ReadableStream).getReader();
        let received = 0;
        const stream = new ReadableStream({
          start: async (controller) => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
              received += value.byteLength;
              loadedBytesRef.current += value.byteLength;
              const pct = totalBytesRef.current > 0 ? loadedBytesRef.current / totalBytesRef.current : 0.9;
              setProgress(Math.min(0.98, pct));
            }
            controller.close();
          }
        });
        return new Response(stream, {
          headers: res.headers,
          status: res.status,
          statusText: res.statusText
        });
      } finally {
        inflightCountRef.current -= 1;
        if (inflightCountRef.current <= 0) {
          // Let the route-change effect finalize and clear class
          totalBytesRef.current = 0;
          loadedBytesRef.current = 0;
          setProgress(1);
        }
      }
    };

    window.fetch = instrumentedFetch as any;

    return () => {
      if (originalFetchRef.current) window.fetch = originalFetchRef.current;
    };
  }, []);

  // Render determinate top bar bound to progress
  useEffect(() => {
    if (!active) return;
    if (typeof document === 'undefined') return;
    let bar = document.getElementById('nav-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'nav-progress-bar';
      bar.style.position = 'fixed';
      bar.style.top = '0';
      bar.style.left = '0';
      bar.style.height = '2px';
      bar.style.zIndex = '9999';
      bar.style.background = 'hsl(60 100% 70%)';
      document.body.appendChild(bar);
    }
    bar.style.width = `${Math.max(5, Math.min(99, Math.floor(progress * 100)))}%`;
    return () => {
      if (!document.documentElement.classList.contains('nav-loading')) {
        const el = document.getElementById('nav-progress-bar');
        if (el) el.remove();
      }
    };
  }, [active, progress]);

  if (!active) return null;

  // Also ensure <html> has a class so CSS can react instantly
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('nav-loading');
    // Remove class when not active handled in stop effect below
  }

  return null;
}


