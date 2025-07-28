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

export default function AuctionListingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
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
      
      // Fetch user document for auction listings
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const auctionsData = await fetchByUser("auctions");
      setAuctions(auctionsData);
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
      setAuctions(await fetchByUser("auctions"));
    }
  };

  const handleAdvertise = async (col: string, id: string) => {
    setAdvertiseLoading(true);
    const db = getFirestore(app);
    
    // Check if user has remaining quota for the selected feature type
    if (selectedFeatureType === 'standard' && (!userDoc || userDoc.standardListingRemaining <= 0)) {
      alert("You don't have enough Standard Listing quota remaining.");
      setAdvertiseLoading(false);
      return;
    }
    if (selectedFeatureType === 'featured' && (!userDoc || userDoc.featuredListingRemaining <= 0)) {
      alert("You don't have enough Featured Listing quota remaining.");
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
    
    // Decrement the user's quota
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
      setAuctions(await fetchByUser("auctions"));
      
      // Refresh user document
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
    }
  };

  const getUserName = () =>
    currentUser?.displayName || currentUser?.email || "User";

  const activeListingsCount = auctions.filter((a) => !a.deactivated).length;
  const activeAdsCount = auctions.filter((a) => a.featured && !a.deactivated).length;

  const tableData = {
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
  };

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
                Listing featured successfully! Your quota has been updated.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline">Auction Listing</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {getUserName()}!</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
            <CardDescription>All your auction listings currently live.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeListingsCount}</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Featured Listings</CardTitle>
            <CardDescription>All your featured (advertised) auction listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeAdsCount}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-lg animate-pulse">Loading your auction listings...</div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tableData.label}</CardTitle>
                <CardDescription>Manage your {tableData.label.toLowerCase()} here.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={() => router.push('/advertise/dashboard')}
                >
                  Buy Featured
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/auctions/submit')}
                >
                  List your auction
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add quota cards for Auction Listing section */}
            {userDoc && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Current Auction Listing Quota</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="font-medium">Standard Listing</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {userDoc.standardListingRemaining || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="font-medium">Featured Listing</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {userDoc.featuredListingRemaining || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  {tableData.columns.map((col) => (
                    <TableHead key={typeof col.key === "string" ? col.key : col.label}>{col.label}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableData.columns.length + 1} className="text-center text-muted-foreground">No auction listings found.</TableCell>
                  </TableRow>
                ) : (
                  tableData.data.map((item: any) => (
                    <TableRow key={item.id}>
                      {tableData.columns.map((col, idx) => (
                        <TableCell key={idx}>
                          {typeof col.key === "function"
                            ? col.key(item)
                            : col.key === "deactivated"
                            ? item.deactivated ? "Yes" : "No"
                            : col.key === "featured"
                            ? item.featured ? "Yes" : "No"
                            : col.key === "type"
                            ? item.type || "N/A"
                            : col.key === "eventDate" || col.key === "startDate"
                            ? item[col.key]?.seconds
                              ? new Date(item[col.key].seconds * 1000).toLocaleDateString()
                              : item[col.key]?.toString() || "-"
                            : item[col.key] || "-"}
                        </TableCell>
                      ))}
                      <TableCell className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                              <Link href={tableData.viewPath + item.id}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(tableData.col, item.id)}
                              disabled={item.deactivated}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Dialog open={advertiseModal?.open && advertiseModal.col === tableData.col && advertiseModal.id === item.id} onOpenChange={(open) => {
                          if (!open) {
                            setAdvertiseModal(null);
                            setSelectedFeatureType(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant={item.featured ? "secondary" : "default"}
                              size="sm"
                              disabled={item.featured}
                              onClick={() => {
                                setAdvertiseModal({ open: true, col: tableData.col, id: item.id });
                                setSelectedFeatureType(null);
                              }}
                            >
                              {item.featured ? "Featured" : "Feature"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Feature Listing</DialogTitle>
                              <DialogDescription>
                                Choose a feature type for your listing.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {/* Quota Cards */}
                            {userDoc && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Your Current Quota</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-muted rounded text-center">
                                    <p className="text-sm font-medium">Standard</p>
                                    <p className="text-lg font-bold text-primary">
                                      {userDoc.standardListingRemaining || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                  </div>
                                  <div className="p-3 bg-muted rounded text-center">
                                    <p className="text-sm font-medium">Featured</p>
                                    <p className="text-lg font-bold text-primary">
                                      {userDoc.featuredListingRemaining || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Feature Type Selection */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  id="feature-standard" 
                                  name="feature-type" 
                                  value="standard" 
                                  checked={selectedFeatureType === 'standard'} 
                                  onChange={() => setSelectedFeatureType('standard')}
                                  disabled={!userDoc || userDoc.standardListingRemaining <= 0}
                                />
                                <Label htmlFor="feature-standard" className="flex-1">
                                  <div className="font-medium">Standard Listing</div>
                                  <div className="text-sm text-muted-foreground">
                                    Will display in the featured section for 1 month only
                                  </div>
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  id="feature-featured" 
                                  name="feature-type" 
                                  value="featured" 
                                  checked={selectedFeatureType === 'featured'} 
                                  onChange={() => setSelectedFeatureType('featured')}
                                  disabled={!userDoc || userDoc.featuredListingRemaining <= 0}
                                />
                                <Label htmlFor="feature-featured" className="flex-1">
                                  <div className="font-medium">Featured (Premium) Listing</div>
                                  <div className="text-sm text-muted-foreground">
                                    Will stay in the featured section for 1 year and will have higher priority and more clicks
                                  </div>
                                </Label>
                              </div>
                            </div>
                            
                            <div className="py-4 text-center">
                              <Button
                                className="w-full text-lg py-4"
                                disabled={advertiseLoading || !selectedFeatureType}
                                onClick={async () => await handleAdvertise(tableData.col, item.id)}
                              >
                                {advertiseLoading ? "Processing..." : `Feature ${selectedFeatureType === 'standard' ? 'Standard' : 'Premium'}`}
                              </Button>
                            </div>
                            
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 