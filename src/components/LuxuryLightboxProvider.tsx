"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type LightboxContextValue = {
  open: (images: string[], startIndex?: number) => void;
  close: () => void;
};

const LuxuryLightboxContext = createContext<LightboxContextValue | undefined>(undefined);

export function useLuxuryLightbox(): LightboxContextValue {
  const ctx = useContext(LuxuryLightboxContext);
  if (!ctx) throw new Error("useLuxuryLightbox must be used within LuxuryLightboxProvider");
  return ctx;
}

export default function LuxuryLightboxProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const open = useCallback((imgs: string[], startIndex: number = 0) => {
    const valid = (imgs || []).filter(Boolean);
    if (valid.length === 0) return;
    setImages(valid);
    setIndex(Math.max(0, Math.min(startIndex, valid.length - 1)));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % Math.max(1, images.length));
  }, [images.length]);

  const prev = useCallback(() => {
    setIndex((prev) => (prev - 1 + Math.max(1, images.length)) % Math.max(1, images.length));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, next, prev, close]);

  const value = useMemo<LightboxContextValue>(() => ({ open, close }), [open, close]);

  return (
    <LuxuryLightboxContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[min(96vw,1280px)] w-[96vw] p-0 bg-gradient-to-b from-[#0b0b0b]/95 to-[#111]/95 border-0 shadow-2xl overflow-hidden">
          <div className="relative w-full">
            {/* Chrome top bar with luxury accents */}
            <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20 bg-gradient-to-b from-black/60 to-transparent">
              <div className="h-[2px] w-24 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 rounded-full" />
              <button aria-label="Close" onClick={close} className="inline-flex items-center justify-center rounded-full p-2 hover:bg-white/10 text-[#E0D8C1] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image area */}
            <div className="relative w-full aspect-video bg-black">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[index] || "/placeholder.jpg"}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-contain select-none"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Gradient frame accents */}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-white/5">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    aria-label="Previous"
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/5 hover:bg-white/15 text-[#E0D8C1] border border-white/10 rounded-full p-3 backdrop-blur-md transition-colors"
                    type="button"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    aria-label="Next"
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/5 hover:bg-white/15 text-[#E0D8C1] border border-white/10 rounded-full p-3 backdrop-blur-md transition-colors"
                    type="button"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom chrome: index and thumbnails */}
            <div className="px-4 py-3 bg-gradient-to-t from-black/70 to-black/20">
              <div className="flex items-center justify-between text-[#E0D8C1] mb-2">
                <div className="text-sm tracking-wide">{index + 1} / {images.length}</div>
                <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                <div className="text-xs uppercase tracking-[0.2em] opacity-80">Gallery</div>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img + i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden border ${index === i ? 'border-amber-400' : 'border-white/10'}`}
                      type="button"
                    >
                      <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LuxuryLightboxContext.Provider>
  );
}


