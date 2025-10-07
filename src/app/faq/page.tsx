"use client";

import { useEffect, useMemo, useState } from "react";
import type { FaqItem, FaqSettings } from "@/lib/faq";
import { fetchFaqs, fetchFaqSettings } from "@/lib/faq";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [settings, setSettings] = useState<FaqSettings>({});
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [items, s] = await Promise.all([fetchFaqs(), fetchFaqSettings()]);
        setFaqs(items);
        setSettings(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(!!u));
    return () => unsub();
  }, []);

  const jsonLd = useMemo(() => {
    const mainEntity = (faqs || []).map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    }));
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity,
    } as const;
  }, [faqs]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-sm text-muted-foreground">Loading FAQ…</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 md:py-12">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-block rounded-full bg-[#ff8a00] text-white text-[11px] font-bold tracking-[0.04em] px-3 py-1 uppercase">FAQ</span>
        <h1 className="m-0 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[-0.02em] text-[#0d2744]">
          {settings.title || "Frequently Asked Questions"}
        </h1>
      </div>
      {settings.intro && (
        <p className="mt-1 mb-6 text-[#314660] text-sm sm:text-base">
          {settings.intro}
        </p>
      )}

      <section aria-label="FAQ accordion" className="bg-white rounded-2xl border border-[#e5e8ef] overflow-hidden shadow-[0_6px_18px_rgba(13,39,68,0.06)]">
        {(faqs || []).map((item, idx) => (
          <details key={item.id || `faq-${idx}`} className="group border-b last:border-b-0 border-[#e5e8ef]">
            <summary
              className="relative w-full text-left cursor-pointer list-none select-none appearance-none bg-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 text-[#0d2744] font-semibold text-base sm:text-[1.05rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#113a63]/30 rounded-[10px]"
            >
              <span>{item.question}</span>
              {item.tags && item.tags.length > 0 && (
                <span className="ml-2 inline-flex gap-1 align-middle">
                  {item.tags.slice(0, 2).map((t) => (
                    <span key={t} className="inline-block bg-[#eef3fa] text-[#113a63] text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-[0.05em]">{t}</span>
                  ))}
                </span>
              )}
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0d2744] transition-transform duration-200 group-open:rotate-180"
                width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 text-[15px] text-[#0d2744]/90">
              <p className="m-0 whitespace-pre-line">{item.answer}</p>
            </div>
          </details>
        ))}
      </section>

      <div className="mt-5">
          <button
            type="button"
            onClick={() => router.push(isAuthed ? "/events/host" : "/login")}
            className="inline-flex items-center gap-2 bg-[#ff8a00] text-white font-bold px-4 py-3 rounded-xl hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00]/40"
          >
            Submit your event
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      </div>
    </div>
  );
}


