"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const PAGE_OPTIONS = [
  "Events",
  "Cars for sale",
  "Auctions",
  "Car Hotels",
  "Car clubs",
  "Home page"
];

export default function PartnerDashboard() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const adsQuery = query(collection(db, "partnerAds"), where("uploadedByUserId", "==", user.uid));
      const snapshot = await getDocs(adsQuery);
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchAds();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Partner Dashboard</h1>
        <Button asChild>
          <Link href="/partners/advertise">Advertise New Product</Link>
        </Button>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Your Ads</h2>
        {loading ? (
          <div className="text-center py-8 animate-pulse">Loading your ads...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">You have not created any ads yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map(ad => (
              <div key={ad.id} className="bg-card border rounded-xl p-4 shadow hover:shadow-lg transition group flex flex-col gap-4">
                <div onClick={() => router.push(`/partners/ad/${ad.id}`)} className="cursor-pointer">
                  <h3 className="text-lg font-bold mb-2">{ad.title || ad.productName || ad.type}</h3>
                  <div className="text-sm text-muted-foreground mb-2">{ad.adType || ad.type}</div>
                  <div className="text-sm line-clamp-2 mb-2">{ad.description}</div>
                  {ad.imageUrls && ad.imageUrls.length > 0 && (
                    <img src={ad.imageUrls[0]} alt="Ad" className="w-full h-32 object-cover rounded mt-2" />
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-semibold mb-1">Show this ad on:</label>
                  <Select
                    value={ad.page || ""}
                    onValueChange={async (newPage) => {
                      const db = getFirestore(app);
                      await updateDoc(doc(db, "partnerAds", ad.id), { page: newPage });
                      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, page: newPage } : a));
                    }}
                  >
                    <SelectTrigger className="w-full bg-background border-muted">
                      <SelectValue placeholder="-- Select Page --" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!ad.page && (
                    <div className="flex items-center gap-2 text-xs text-destructive mt-2 bg-destructive/10 rounded px-2 py-1">
                      <AlertTriangle className="w-4 h-4" /> No page selected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 