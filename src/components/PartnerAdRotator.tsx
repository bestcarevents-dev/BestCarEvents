"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PartnerAdRotatorProps {
  page: string; // e.g. 'Events'
  maxVisible?: number; // how many ads to show at once (desktop)
  rotateIntervalMs?: number; // how often to rotate
}

export default function PartnerAdRotator({ page, maxVisible = 4, rotateIntervalMs = 3000 }: PartnerAdRotatorProps) {
  const [ads, setAds] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      const db = getFirestore(app);
      const q = query(collection(db, "partnerAds"), where("page", "==", page));
      const snapshot = await getDocs(q);
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchAds();
  }, [page]);

  if (!ads.length) return null;

  const displayAds = ads.slice(0, isMobile ? 1 : maxVisible);

  return (
    <div className="my-6 px-4 sm:px-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Sponsored Content</h3>
      </div>

      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {displayAds.map((ad) => {
          const title = ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName || ad.websiteName || ad.businessName;

          return (
            <Link key={ad.id} href={`/partners/ad/${ad.id}`} className="block group">
              <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                  <Image
                    src={ad.imageUrls?.[0] || "/placeholder.jpg"}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 left-2 text-xs bg-yellow-600 text-white">
                    Ad
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 truncate mb-1 group-hover:text-yellow-600 transition-colors">
                    {title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {ad.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 
