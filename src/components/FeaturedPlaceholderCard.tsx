"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className={cn("bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm rounded-xl overflow-hidden", className)}>
      <div className="relative w-full aspect-video bg-gray-50">
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-yellow-600 text-white">
          <Star className="w-3 h-3" />
          <span>Featured</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-3">
            <div className="text-xs text-gray-500">Premium placement</div>
            <div className="mt-1 text-sm font-medium text-gray-800">{title}</div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-600 line-clamp-2">
            {description}
          </div>
          <Link href={ctaHref} className="text-sm font-medium text-[#80A0A9] hover:text-[#80A0A9]/80 whitespace-nowrap">
            {ctaText}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


