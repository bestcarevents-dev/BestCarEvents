"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

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
      startedAtRef.current = null;
      stopTimeoutRef.current = null;
    }, remaining) as unknown as number;

    return () => {
      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [pathname, searchParams, active]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] pointer-events-none">
      <div className="h-0.5 w-full overflow-hidden bg-transparent">
        <div className="h-full w-1/3 animate-loading-bar rounded-full bg-yellow-400" />
      </div>
    </div>
  );
}


