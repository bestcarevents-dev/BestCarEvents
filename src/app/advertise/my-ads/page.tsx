"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { AlertTriangle, Info } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PAGE_OPTIONS = [
  "Events",
  "Cars for sale",
  "Auctions",
  "Car Hotels",
  "Car clubs",
  "Home page"
];

export default function MyAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userDoc, setUserDoc] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !currentUser) return;
    const fetchAds = async () => {
      setAdsLoading(true);
      const db = getFirestore(app);
      
      // Fetch user document for banner remaining counts
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const adsQuery = query(collection(db, "partnerAds"), where("uploadedByUserId", "==", currentUser.uid));
      const snapshot = await getDocs(adsQuery);
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAdsLoading(false);
    };
    fetchAds();
  }, [currentUser, authChecked]);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Banner Remaining Cards */}
      {userDoc && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Banner Advertisement Credit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Category Page Banner</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/advertise/dashboard')}
                >
                  Buy More
                </Button>
              </div>
              <div className="text-center mb-3">
                <p className="text-2xl font-bold text-primary">
                  {userDoc.categoryBannerRemaining || 0}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Category page banners only allow your ad to be shown in a specific category page. 
                This provides targeted exposure to users browsing that particular category.
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Homepage Banner</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/advertise/dashboard')}
                >
                  Buy More
                </Button>
              </div>
              <div className="text-center mb-3">
                <p className="text-2xl font-bold text-primary">
                  {userDoc.homepageBannerRemaining || 0}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Homepage banner remaining allows your ad to be seen on the homepage along with category pages. 
                This provides maximum exposure across the entire website.
              </p>
            </Card>
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Your Ads</h2>
        {adsLoading ? (
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