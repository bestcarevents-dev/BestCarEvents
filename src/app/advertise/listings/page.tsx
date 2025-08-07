"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Car, Star, Zap, Crown, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

// Car listing pricing tiers
const CAR_LISTING_TIERS = [
  {
    name: "Basic Listing",
    key: "basicListing",
    price: "CHF 39 / EUR 42",
    priceEUR: 42,
    icon: Car,
    features: [
      "Basic listing with essential details",
      "Car model, price, 5 images",
      "Great visibility at an affordable price"
    ]
  },
  {
    name: "Enhanced Listing",
    key: "enhancedListing",
    price: "CHF 69 / EUR 74",
    priceEUR: 74,
    icon: Star,
    features: [
      "Everything in Basic Listing, plus:",
      "Up to 10 images",
      "Priority placement on the website",
      "Visibility across social media platforms"
    ]
  },
  {
    name: "Premium Listing",
    key: "premiumListing",
    price: "CHF 99 / EUR 107",
    priceEUR: 107,
    icon: Zap,
    features: [
      "Everything in Enhanced Listing, plus:",
      "Up to 10 images",
      "Professional video or virtual tour",
      "Priority placement on homepage",
      "Featured across social media platforms"
    ]
  },
  {
    name: "Exclusive Banner Placement",
    key: "exclusiveBanner",
    price: "CHF 149 / EUR 161",
    priceEUR: 161,
    icon: Crown,
    features: [
      "Prominently featured on homepage banner",
      "Featured across key categories",
      "Maximum exposure to potential buyers",
      "Enhanced visibility for up to 30 days"
    ]
  }
];

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [advertiseModal, setAdvertiseModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [advertiseLoading, setAdvertiseLoading] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<'standard' | 'featured' | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const db = getFirestore(app);
    const fetchAll = async () => {
      setLoading(true);
      // Helper to fetch and filter by user
      const fetchByUser = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item: any) =>
              item.uploadedByUserId === currentUser.uid ||
              item.uploadedByUserEmail === currentUser.email
          );
      };
      
      // Fetch user document for car listings
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const [ev, ca, au, ho, cl] = await Promise.all([
        fetchByUser("events"),
        fetchByUser("cars"),
        fetchByUser("auctions"),
        fetchByUser("hotels"),
        fetchByUser("clubs"),
      ]);
      setEvents(ev);
      setCars(ca);
      setAuctions(au);
      setHotels(ho);
      setClubs(cl);
      setLoading(false);
    };
    fetchAll();
  }, [currentUser]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleDeactivate = async (col: string, id: string) => {
    const db = getFirestore(app);
    await updateDoc(doc(db, col, id), { deactivated: true });
    // Refresh the data
    if (currentUser) {
      const fetchByUser = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item: any) =>
              item.uploadedByUserId === currentUser.uid ||
              item.uploadedByUserEmail === currentUser.email
          );
      };
      if (col === "events") setEvents(await fetchByUser("events"));
      if (col === "cars") setCars(await fetchByUser("cars"));
      if (col === "auctions") setAuctions(await fetchByUser("auctions"));
      if (col === "hotels") setHotels(await fetchByUser("hotels"));
      if (col === "clubs") setClubs(await fetchByUser("clubs"));
    }
  };

  const handleAdvertise = async (col: string, id: string) => {
    setAdvertiseLoading(true);
    const db = getFirestore(app);
    
    // Check if user has remaining Credit for the selected feature type
    if (selectedFeatureType === 'standard' && (!userDoc || userDoc.standardListingRemaining <= 0)) {
      alert("You don't have enough Standard Listing Credit remaining.");
      setAdvertiseLoading(false);
      return;
    }
    if (selectedFeatureType === 'featured' && (!userDoc || userDoc.featuredListingRemaining <= 0)) {
      alert("You don't have enough Featured Listing Credit remaining.");
      setAdvertiseLoading(false);
      return;
    }

    // Calculate feature end date based on type
    const now = new Date();
    const featureStart = now;
    let featureEnd;
    
    if (selectedFeatureType === 'standard') {
      featureEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 1 month
    } else {
      featureEnd = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
    }

    await updateDoc(doc(db, col, id), { 
      featured: true,
      feature_type: selectedFeatureType,
      feature_start: featureStart,
      feature_end: featureEnd
    });
    
    // Decrement the user's Credit
    if (selectedFeatureType === 'standard') {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        standardListingRemaining: (userDoc?.standardListingRemaining || 0) - 1
      });
      // Update local state immediately
      setUserDoc((prev: any) => prev ? {
        ...prev,
        standardListingRemaining: (prev.standardListingRemaining || 0) - 1
      } : null);
    } else {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        featuredListingRemaining: (userDoc?.featuredListingRemaining || 0) - 1
      });
      // Update local state immediately
      setUserDoc((prev: any) => prev ? {
        ...prev,
        featuredListingRemaining: (prev.featuredListingRemaining || 0) - 1
      } : null);
    }
    
    setAdvertiseLoading(false);
    setAdvertiseModal(null);
    setSelectedFeatureType(null);
    setShowSuccessMessage(true);
    
    // Refresh the data
    if (currentUser) {
      const fetchByUser = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item: any) =>
              item.uploadedByUserId === currentUser.uid ||
              item.uploadedByUserEmail === currentUser.email
          );
      };
      if (col === "events") setEvents(await fetchByUser("events"));
      if (col === "cars") setCars(await fetchByUser("cars"));
      if (col === "auctions") setAuctions(await fetchByUser("auctions"));
      if (col === "hotels") setHotels(await fetchByUser("hotels"));
      if (col === "clubs") setClubs(await fetchByUser("clubs"));
      
      // Refresh user document
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
    }
  };

  const getUserName = () =>
    currentUser?.displayName || currentUser?.email || "User";

  const activeListingsCount =
    events.filter((e) => !e.deactivated).length +
    cars.filter((c) => !c.deactivated).length +
    auctions.filter((a) => !a.deactivated).length +
    hotels.filter((h) => !h.deactivated).length +
    clubs.filter((cl) => !cl.deactivated).length;

  const activeAdsCount =
    events.filter((e) => e.featured && !e.deactivated).length +
    cars.filter((c) => c.featured && !c.deactivated).length +
    auctions.filter((a) => a.featured && !a.deactivated).length +
    hotels.filter((h) => h.featured && !h.deactivated).length +
    clubs.filter((cl) => cl.featured && !cl.deactivated).length;

  const listingTables = [
    {
      label: "Cars Listing",
      data: cars,
      columns: [
        { label: "Name", key: (c: any) => `${c.year} ${c.make} ${c.model}` },
        { label: "Price", key: (c: any) => c.price && c.currency ? `${c.currency} ${c.price}` : "N/A" },
        { label: "Location", key: "location" },
        { label: "Status", key: "status" },
        { label: "Type", key: "type" },
        { label: "Deactivated", key: "deactivated" },
      ],
      col: "cars",
      viewPath: "/cars/",
    },
    {
      label: "Events Listing",
      data: events,
      columns: [
        { label: "Name", key: "eventName" },
        { label: "Date", key: "eventDate" },
        { label: "Location", key: "location" },
        { label: "Status", key: "status" },
        { label: "Featured", key: "featured" },
        { label: "Deactivated", key: "deactivated" },
      ],
      col: "events",
      viewPath: "/events/",
    },
    {
      label: "Auction Listing",
      data: auctions,
      columns: [
        { label: "Name", key: "auctionName" },
        { label: "Auction House", key: "auctionHouse" },
        { label: "Start Date", key: "startDate" },
        { label: "Status", key: "status" },
        { label: "Featured", key: "featured" },
        { label: "Deactivated", key: "deactivated" },
      ],
      col: "auctions",
      viewPath: "/auctions/",
    },
    {
      label: "Hotel Listing",
      data: hotels,
      columns: [
        { label: "Name", key: "hotelName" },
        { label: "City", key: "city" },
        { label: "State", key: "state" },
        { label: "Status", key: "status" },
        { label: "Featured", key: "featured" },
        { label: "Deactivated", key: "deactivated" },
      ],
      col: "hotels",
      viewPath: "/hotels/",
    },
    {
      label: "Club Listing",
      data: clubs,
      columns: [
        { label: "Name", key: "clubName" },
        { label: "City", key: "city" },
        { label: "Country", key: "country" },
        { label: "Status", key: "status" },
        { label: "Featured", key: "featured" },
        { label: "Deactivated", key: "deactivated" },
      ],
      col: "clubs",
      viewPath: "/clubs/",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Listing featured successfully! Your Credit has been updated.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-extrabold font-headline">My Listings</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {getUserName()}!</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Active Listings</CardTitle>
            <CardDescription>All your listings currently live.</CardDescription>
            </CardHeader>
            <CardContent>
            <p className="text-4xl font-bold">{activeListingsCount}</p>
            </CardContent>
        </Card>
        <Card className="w-full">
            <CardHeader>
            <CardTitle>Featured Listings</CardTitle>
            <CardDescription>All your featured (advertised) listings.</CardDescription>
            </CardHeader>
            <CardContent>
            <p className="text-4xl font-bold">{activeAdsCount}</p>
            </CardContent>
        </Card>
      </div>

      {/* Navigation Container */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quick Navigation</CardTitle>
          <CardDescription className="text-base">Access your different listing features and services with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/advertise/cars-listing" className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:scale-105 bg-card hover:bg-accent/50">
                <CardContent className="p-8 text-center">
                  <div className="bg-primary w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                    <Car className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Cars Features</h3>
                  <p className="text-sm text-muted-foreground">Manage and promote your car listings</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/advertise/events-listing" className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:scale-105 bg-card hover:bg-accent/50">
                <CardContent className="p-8 text-center">
                  <div className="bg-primary w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                    <Star className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Events Features</h3>
                  <p className="text-sm text-muted-foreground">Boost visibility for your events</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/advertise/auction-listing" className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:scale-105 bg-card hover:bg-accent/50">
                <CardContent className="p-8 text-center">
                  <div className="bg-primary w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                    <Zap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Auctions Features</h3>
                  <p className="text-sm text-muted-foreground">Feature your auction listings</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/advertise/hotel-listing" className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:scale-105 bg-card hover:bg-accent/50">
                <CardContent className="p-8 text-center">
                  <div className="bg-primary w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                    <Crown className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Hotels Features</h3>
                  <p className="text-sm text-muted-foreground">Promote your hotel listings</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/advertise/club-listing" className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:scale-105 bg-card hover:bg-accent/50">
                <CardContent className="p-8 text-center">
                  <div className="bg-primary w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                    <PlusCircle className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Clubs Features</h3>
                  <p className="text-sm text-muted-foreground">Showcase your club listings</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/advertise/others-listing" className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:scale-105 bg-card hover:bg-accent/50">
                <CardContent className="p-8 text-center">
                  <div className="bg-primary w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                    <Info className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Services Features</h3>
                  <p className="text-sm text-muted-foreground">Manage your service listings</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

     
    </div>
  );
}
