"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gift, Megaphone, Sparkles } from "lucide-react";

type FreeCalloutProps = {
  title?: string;
  messages: string[];
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
    <Card className={`border-0 bg-gradient-to-b from-white to-[#E0D8C1]/30 shadow-lg ${className || ""}`}>
      <CardContent className="p-4 md:p-6">
        <div className="relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-yellow-400/20 rounded-full blur-lg"></div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-yellow-400/20 rounded-full blur-lg"></div>
          </div>
          
          {/* Main content */}
          <div className="relative flex flex-col items-center text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <span className="animate-pulse">🎉</span>
              <span className="font-semibold text-gray-900 text-sm">ZERO COST</span>
              <span className="animate-pulse">🎉</span>
            </div>
            
            {/* Animated gradient title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-headline text-amber-500 pb-2 mb-3">
              ALL LISTINGS ARE FREE
            </h2>
            
            {/* Message */}
            <p className="text-base md:text-lg text-gray-800 max-w-xl mb-4">
              <span className="font-bold text-yellow-500">Cars:</span> Enjoy <span className="font-bold text-yellow-500">2 months free</span> listing period!
            </p>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-6 leading-relaxed max-w-lg">
              {selectedMessage}
            </p>

            {/* CTA Button */}
            {ctaHref && (
              <div className="flex justify-center w-full">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <Link href={ctaHref}>
                    {ctaText}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 