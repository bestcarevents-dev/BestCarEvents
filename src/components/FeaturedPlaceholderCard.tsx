"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedPlaceholderCardProps {
  title?: string;
  description?: string;
  ctaHref: string;
  ctaText: string;
  className?: string;
}

export default function FeaturedPlaceholderCard({
  title = "This spot could be yours",
  description,
  ctaHref,
  ctaText,
  className,
}: FeaturedPlaceholderCardProps) {
  return (
    <div className={cn("mx-auto max-w-3xl", className)}>
      <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md rounded-2xl overflow-hidden">
        <div className="relative w-full aspect-video bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <Star className="w-6 h-6 text-yellow-500/70" />
              <span className="text-sm md:text-base">Premium placement</span>
            </div>
          </div>
        </div>
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            <Button asChild className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white">
              <Link href={ctaHref}>{ctaText}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


