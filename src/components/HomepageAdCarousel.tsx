"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice as formatPriceUtil } from "@/lib/utils";

export default function HomepageAdCarousel() {
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
      const q = query(collection(db, "partnerAds"), where("isHomepage", "==", true));
      const snapshot = await getDocs(q);
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchAds();
  }, []);

  if (!ads.length) return null;

  const columns = isMobile ? 1 : 3; // show more ads at once on desktop

  const renderAdContent = (ad: any) => {
    // Determine what to display based on ad type
    let displayInfo = null;
    
    if (ad.price && ad.priceRange) {
      // Display price and price range
      displayInfo = (
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-green-600 font-bold text-lg">{formatPriceUtil(String(ad.price))}</span>
          <span className="text-green-600 font-semibold text-sm">{formatPriceUtil(String(ad.priceRange))}</span>
        </div>
      );
    } else if (ad.price) {
      // Display price only
      displayInfo = (
        <div className="text-green-600 font-bold text-lg mt-2">{formatPriceUtil(String(ad.price))}</div>
      );
    } else if (ad.priceRange) {
      // Display price range only
      displayInfo = (
        <div className="text-green-600 font-semibold text-lg mt-2">{formatPriceUtil(String(ad.priceRange))}</div>
      );
    }

    return (
      <Card key={ad.id} className="flex flex-col h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
        <div className="relative w-full h-48 flex-shrink-0 overflow-hidden">
          <Image 
            src={ad.imageUrls?.[0] || "/placeholder.jpg"} 
            alt={ad.title || ad.shopName || "Ad"} 
            fill 
            className="object-contain bg-white" 
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <Badge className="absolute top-3 left-3 text-xs bg-yellow-600 text-white font-semibold">
            Ad
          </Badge>
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <Link 
            href={`/partners/ad/${ad.id}`} 
            className="hover:underline text-lg font-headline font-semibold text-gray-900 line-clamp-2 mb-2"
          >
            {ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName || ad.websiteName || ad.businessName}
          </Link>
          {displayInfo}
          <div className="text-sm text-gray-600 mt-3 line-clamp-3 flex-grow">
            {ad.description}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link 
              href={`/partners/ad/${ad.id}`}
              className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-semibold text-sm transition-colors"
            >
              Learn More
              <span className="ml-1">→</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-headline font-bold text-gray-900 mb-2">
          Featured Advertisements
        </h3>
        <p className="text-gray-600">
          Discover premium automotive services and products from our trusted partners
        </p>
      </div>

      {/* Ads Grid: show more items, no carousel */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {ads.map(renderAdContent)}
        {/* Advertise placeholder card at the end */}
        <Card className="flex flex-col h-full bg-white border border-yellow-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="relative w-full h-48 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50">
            <Badge className="absolute top-3 left-3 text-xs bg-yellow-600 text-white font-semibold">
              Ad
            </Badge>
            <div className="text-center px-4">
              <div className="text-base font-headline font-semibold text-gray-900">This spot could be yours</div>
              <div className="text-sm text-gray-600 mt-1">Promote your automotive service or product</div>
            </div>
          </div>
          <CardContent className="p-4">
            <Link 
              href="/advertise/advertise" 
              className="inline-flex items-center justify-center w-full rounded-md bg-yellow-600 text-white text-sm font-semibold py-2 hover:bg-yellow-700 transition-colors"
            >
              Advertise with us
              <span className="ml-1">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 