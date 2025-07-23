import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PartnerAdRotatorProps {
  page: string; // e.g. 'Events'
  maxVisible?: number; // how many ads to show at once
  rotateIntervalMs?: number; // how often to rotate
}

export default function PartnerAdRotator({ page, maxVisible = 2, rotateIntervalMs = 7000 }: PartnerAdRotatorProps) {
  const [ads, setAds] = useState<any[]>([]);
  const [startIdx, setStartIdx] = useState(0);

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
    if (ads.length <= maxVisible) return;
    const interval = setInterval(() => {
      setStartIdx((prev) => (prev + maxVisible) % ads.length);
    }, rotateIntervalMs);
    return () => clearInterval(interval);
  }, [ads, maxVisible, rotateIntervalMs]);

  if (!ads.length) return null;
  const visibleAds = ads.length <= maxVisible ? ads : [
    ...ads.slice(startIdx, startIdx + maxVisible),
    ...(startIdx + maxVisible > ads.length ? ads.slice(0, (startIdx + maxVisible) % ads.length) : [])
  ];

  return (
    <div className="flex flex-col gap-4 my-6">
      {visibleAds.map(ad => (
        <Card key={ad.id} className="flex flex-row items-center gap-4 bg-muted/60 border-muted/40 shadow-none hover:shadow-md transition group">
          <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border">
            <Image src={ad.imageUrls?.[0] || "/placeholder.jpg"} alt={ad.title || ad.shopName || "Ad"} fill className="object-contain" />
            <Badge className="absolute top-1 left-1 text-xs bg-primary/80 text-white">Featured</Badge>
          </div>
          <CardContent className="p-0 flex flex-col flex-grow min-w-0">
            <Link href={`/partners/ad/${ad.id}`} className="hover:underline text-base font-semibold text-foreground truncate block">
              {ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName}
            </Link>
            {ad.price && <div className="text-green-600 font-bold text-sm mt-1">{ad.price}</div>}
            <div className="text-xs text-muted-foreground truncate max-w-xs">{ad.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 