"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gift, Megaphone, Sparkles } from "lucide-react";

type FreeCalloutProps = {
  title?: string;
  messages?: string[];
  ctaHref?: string;
  ctaText?: string;
  className?: string;
  icon?: "gift" | "megaphone" | "sparkles";
};

export default function FreeCallout({
  title = "Free Listings",
  messages,
  ctaHref,
  ctaText = "Get Started",
  className,
  icon = "megaphone",
}: FreeCalloutProps) {
  const selectedMessage = useMemo(() => {
    if (!messages || messages.length === 0) return "Free to join and list.";
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
  }, [messages]);

  const IconComp = icon === "gift" ? Gift : icon === "sparkles" ? Sparkles : Megaphone;

  return (
    <Card className={`border border-[#C7BCA3]/60 bg-gradient-to-br from-[#FAF7EE] via-[#F3EADA] to-[#ECE3D1] shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-[18px] ${className || ""}`}>
      <CardContent className="p-6 md:p-8">
        <div className="relative flex flex-col items-center text-center">
          {/* Brass studs */}
          <div className="pointer-events-none absolute top-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
          <div className="pointer-events-none absolute top-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
          <div className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
          <div className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9CEB6] bg-[#F4F0E7] px-4 py-2 mb-4">
            <IconComp className="h-4 w-4 text-[#7D8C91]" />
            <span className="text-[#7A6E57] font-semibold text-sm">ZERO COST</span>
          </div>

          {/* Title and divider */}
          <h2 className="font-headline uppercase tracking-[0.2em] text-[#1f1f1f] text-2xl md:text-3xl lg:text-4xl break-words hyphens-auto text-balance leading-tight">
            ALL LISTINGS ARE FREE
          </h2>
          <div className="mx-auto mt-3 h-[2px] w-24 bg-gradient-to-r from-[#C3A76D] to-[#E7D08A]" />

          {/* Message */}
          <p className="mt-4 text-base md:text-lg text-[#2a2a2a] max-w-xl break-words hyphens-auto text-balance leading-snug">
            <span className="font-bold text-[#C3A76D]">Cars:</span> Free car listings until <span className="font-bold text-[#C3A76D]">31st November 2025</span>.
          </p>

          {/* Description */}
          <p className="text-sm text-[#4a4a4a] mb-6 leading-relaxed max-w-lg break-words hyphens-auto text-balance">
            {selectedMessage}
          </p>

          {/* CTA Button */}
          {ctaHref && (
            <div className="flex justify-center w-full">
              <Button 
                asChild 
                size="lg" 
                className="rounded-full bg-[#C3A76D] hover:bg-[#B99754] text-black font-semibold text-base px-6 py-3 shadow-sm hover:shadow transition-all"
              >
                <Link href={ctaHref}>
                  {ctaText}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 