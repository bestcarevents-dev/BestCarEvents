"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const originalPushRef = useRef<typeof history.pushState | null>(null);
  const originalReplaceRef = useRef<typeof history.replaceState | null>(null);

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

  if (!active) return null;

  // Also ensure <html> has a class so CSS can react instantly
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('nav-loading');
    // Remove class when not active handled in stop effect below
  }

  return null;
}


