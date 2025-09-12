"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomepageAdCarousel() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  // Auto-rotate ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, isMobile ? 1000 : 5000); // 1s on mobile, 5s otherwise
    return () => clearInterval(interval);
  }, [ads.length, isMobile]);

  if (!ads.length) return null;

  const maxVisible = isMobile ? 1 : 2;
  const totalSlides = Math.ceil(ads.length / maxVisible);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getVisibleAds = () => {
    const startIdx = currentIndex * maxVisible;
    return ads.slice(startIdx, startIdx + maxVisible);
  };

  const visibleAds = getVisibleAds();

  const renderAdContent = (ad: any) => {
    // Determine what to display based on ad type
    let displayInfo = null;
    const truncate = (str: string, n: number) => str.length > n ? str.slice(0, n - 1) + '…' : str;
    
    // Check if it's a Website or General Business category
    const isWebsiteOrGeneralBusiness = ad.adType === "Website" || ad.adType === "General Business";
    
    if (isWebsiteOrGeneralBusiness && ad.url) {
      // Display website URL for Website category
      displayInfo = (
        <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm mt-2">
          <ExternalLink className="w-3 h-3" />
          <a href={ad.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {truncate(ad.url, 35)}
          </a>
        </div>
      );
    } else if (ad.price && ad.priceRange) {
      // Display price and price range
      displayInfo = (
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-green-600 font-bold text-lg">{ad.price}</span>
          <span className="text-green-600 font-semibold text-sm">{ad.priceRange}</span>
        </div>
      );
    } else if (ad.price) {
      // Display price only
      displayInfo = (
        <div className="text-green-600 font-bold text-lg mt-2">{ad.price}</div>
      );
    } else if (ad.priceRange) {
      // Display price range only
      displayInfo = (
        <div className="text-green-600 font-semibold text-lg mt-2">{ad.priceRange}</div>
      );
    }

    return (
      <Card key={ad.id} className="flex flex-col h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
        <div className="relative w-full h-48 flex-shrink-0 overflow-hidden">
          <Image 
            src={ad.imageUrls?.[0] || "/placeholder.jpg"} 
            alt={ad.title || ad.shopName || "Ad"} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
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
              <ChevronRight className="w-4 h-4 ml-1" />
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

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {totalSlides > 1 && !isMobile && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md"
              onClick={nextSlide}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Ads Grid */}
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {visibleAds.map(renderAdContent)}
        </div>

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex 
                    ? 'bg-yellow-600 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 