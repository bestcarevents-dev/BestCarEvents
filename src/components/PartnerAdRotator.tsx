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
  const [startIdx, setStartIdx] = useState(0);
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

  useEffect(() => {
    const currentMaxVisible = isMobile ? 2 : maxVisible;
    if (ads.length <= currentMaxVisible) return;
    const interval = setInterval(() => {
      setStartIdx((prev) => (prev + currentMaxVisible) % ads.length);
    }, rotateIntervalMs);
    return () => clearInterval(interval);
  }, [ads, maxVisible, rotateIntervalMs, isMobile]);

  if (!ads.length) return null;
  
  const currentMaxVisible = isMobile ? 2 : maxVisible;
  const visibleAds = ads.length <= currentMaxVisible ? ads : [
    ...ads.slice(startIdx, startIdx + currentMaxVisible),
    ...(startIdx + currentMaxVisible > ads.length ? ads.slice(0, (startIdx + currentMaxVisible) % ads.length) : [])
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-6">
      {visibleAds.map(ad => {
        // Determine price info based on ad type
        let priceInfo = null;
        const truncate = (str: string, n: number) => str.length > n ? str.slice(0, n - 1) + '…' : str;
        if (ad.price && ad.priceRange) {
          priceInfo = <div className="flex flex-col gap-1 mt-1">
            <span className="text-green-600 font-bold text-sm">{truncate(ad.price, 21)}</span>
            <span className="text-green-600 font-semibold text-xs">{truncate(ad.priceRange, 21)}</span>
          </div>;
        } else if (ad.price) {
          priceInfo = <div className="text-green-600 font-bold text-sm mt-1">{truncate(ad.price, 21)}</div>;
        } else if (ad.priceRange) {
          priceInfo = <div className="text-green-600 font-semibold text-sm mt-1">{truncate(ad.priceRange, 21)}</div>;
        }
        return (
          <Card key={ad.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white border border-gray-200 shadow-sm hover:shadow-md transition group w-full">
            <div className="relative w-full sm:w-28 h-32 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200">
              <Image src={ad.imageUrls?.[0] || "/placeholder.jpg"} alt={ad.title || ad.shopName || "Ad"} fill className="object-contain" />
              <Badge className="absolute top-1 left-1 text-xs bg-yellow-600 text-white">Featured</Badge>
            </div>
            <CardContent className="p-3 sm:p-0 flex flex-col flex-grow min-w-0">
              <Link href={`/partners/ad/${ad.id}`} className="hover:underline text-base font-semibold text-gray-900 truncate block">
                {ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName}
              </Link>
              {priceInfo}
              <div className="text-xs text-gray-600 truncate max-w-full sm:max-w-xs mt-1">{ad.description}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 