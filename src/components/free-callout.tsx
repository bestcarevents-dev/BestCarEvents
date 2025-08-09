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
    <Card className={`border-primary/20 bg-primary/5 ${className || ""}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start md:items-center gap-4">
          <div className="flex-shrink-0 rounded-full bg-primary/10 text-primary p-2">
            <IconComp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold font-headline text-primary">{title}</h3>
                <p className="text-sm md:text-base text-muted-foreground mt-1">{selectedMessage}</p>
              </div>
              {ctaHref && (
                <Button asChild className="whitespace-nowrap self-start md:self-auto">
                  <Link href={ctaHref}>{ctaText}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 