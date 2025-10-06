"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, ExternalLink, Star, Zap, TrendingUp } from "lucide-react";

interface PartnerAdRotatorProps {
  page: string; // e.g. 'Events'
  maxVisible?: number; // how many ads to show at once (desktop)
  rotateIntervalMs?: number; // how often to rotate
}

export default function PartnerAdRotator({ page, maxVisible = 3, rotateIntervalMs = 5000 }: PartnerAdRotatorProps) {
  const [ads, setAds] = useState<any[]>([]);
  const [startIdx, setStartIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredAd, setHoveredAd] = useState<string | null>(null);

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

  useEffect(() => {
    const currentMaxVisible = isMobile ? 1 : maxVisible;
    if (ads.length <= currentMaxVisible) return;
    const interval = setInterval(() => {
      setStartIdx((prev) => (prev + 1) % ads.length);
    }, rotateIntervalMs);
    return () => clearInterval(interval);
  }, [ads, maxVisible, rotateIntervalMs, isMobile]);

  if (!ads.length) return null;
  
  const currentMaxVisible = isMobile ? 1 : maxVisible;
  const visibleAds = ads.length <= currentMaxVisible ? ads : [
    ...ads.slice(startIdx, startIdx + currentMaxVisible),
    ...(startIdx + currentMaxVisible > ads.length ? ads.slice(0, (startIdx + currentMaxVisible) % ads.length) : [])
  ];

  const truncate = (str: string, n: number) => str?.length > n ? str.slice(0, n - 1) + '…' : str;

  return (
    <div className="relative my-12 py-8 px-4 sm:px-6 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-yellow-300/40 shadow-2xl overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.15),transparent_50%)]"></div>
      
      {/* Animated sparkle effect */}
      <div className="absolute top-4 right-4 animate-pulse">
        <Sparkles className="w-8 h-8 text-yellow-500" />
      </div>
      <div className="absolute bottom-4 left-4 animate-pulse delay-75">
        <Zap className="w-6 h-6 text-orange-500" />
      </div>

      <div className="relative z-10">
        {/* Premium Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg">
            <Star className="w-5 h-5 text-white fill-white animate-pulse" />
            <span className="text-white font-bold text-sm uppercase tracking-wider">Featured Partners</span>
            <Star className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-headline font-extrabold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Premium Advertising Space
          </h2>
          <p className="text-gray-700 text-base sm:text-lg max-w-2xl mx-auto mb-4">
            Reach thousands of engaged automotive enthusiasts. <span className="font-semibold text-yellow-700">Your brand deserves this spotlight!</span>
          </p>
        </div>

        {/* Ads Grid */}
        <div className={`grid gap-6 mb-8 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {visibleAds.map((ad, idx) => {
            // Determine what to display based on ad type
            let displayInfo = null;
            const isWebsiteOrGeneralBusiness = ad.adType === "Website" || ad.adType === "General Business";
            
            if (isWebsiteOrGeneralBusiness && ad.url) {
              const href = /^https?:\/\//i.test(ad.url) ? ad.url : `https://${ad.url}`;
              displayInfo = (
                <div className="text-blue-600 font-semibold text-sm mt-2 flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" />
                  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                    {truncate(ad.url, isMobile ? 30 : 25)}
                  </a>
                </div>
              );
            } else if (ad.price && ad.priceRange) {
              displayInfo = (
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-green-600 font-bold text-base">{truncate(ad.price, 25)}</span>
                  <span className="text-green-600 font-semibold text-sm">{truncate(ad.priceRange, 25)}</span>
                </div>
              );
            } else if (ad.price) {
              displayInfo = (
                <div className="text-green-600 font-bold text-base mt-2">{truncate(ad.price, 25)}</div>
              );
            } else if (ad.priceRange) {
              displayInfo = (
                <div className="text-green-600 font-semibold text-base mt-2">{truncate(ad.priceRange, 25)}</div>
              );
            }

            return (
              <Link 
                key={ad.id} 
                href={`/partners/ad/${ad.id}`}
                onMouseEnter={() => setHoveredAd(ad.id)}
                onMouseLeave={() => setHoveredAd(null)}
                className="block group"
              >
                <Card className={`
                  h-full overflow-hidden bg-white border-2 transition-all duration-300 cursor-pointer
                  ${hoveredAd === ad.id 
                    ? 'border-yellow-400 shadow-2xl scale-105 -translate-y-2' 
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
                  }
                `}>
                  {/* Image Section - Much Larger Now */}
                  <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <Image 
                      src={ad.imageUrls?.[0] || "/placeholder.jpg"} 
                      alt={ad.title || ad.shopName || "Ad"} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"></div>
                    
                    {/* Premium badge with animation */}
                    <Badge className="absolute top-3 left-3 text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Featured Ad
                    </Badge>

                    {/* Position indicator for carousel */}
                    {ads.length > currentMaxVisible && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                        {((startIdx + idx) % ads.length) + 1}/{ads.length}
                      </div>
                    )}
                  </div>

                  {/* Content Section - More spacious */}
                  <CardContent className="p-5">
                    <h3 className="text-xl font-headline font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                      {ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName || ad.websiteName || ad.businessName}
                    </h3>
                    
                    {displayInfo}
                    
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                      {ad.description}
                    </p>

                    {/* View Details CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-yellow-600 group-hover:text-yellow-700">
                        View Details
                      </span>
                      <ArrowRight className="w-5 h-5 text-yellow-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Carousel Indicators */}
        {ads.length > currentMaxVisible && (
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: Math.ceil(ads.length / currentMaxVisible) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStartIdx(idx * currentMaxVisible)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  Math.floor(startIdx / currentMaxVisible) === idx
                    ? 'w-8 bg-yellow-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to ad group ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Prominent CTA Section */}
        <div className="relative">
          {/* Glowing effect behind button */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-2xl opacity-30 animate-pulse"></div>
          
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-yellow-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">
                    Advertise Your Business Here
                  </h3>
                </div>
                <p className="text-gray-600 text-base sm:text-lg">
                  Get maximum visibility and drive real results. <span className="font-semibold text-yellow-700">Premium placement guaranteed.</span>
                </p>
              </div>
              
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 whitespace-nowrap border-0 group"
              >
                <Link href="/advertise-with-us" className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Start Advertising
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
