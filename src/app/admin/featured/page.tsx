"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";

const listingTypes = [
  { col: "events", label: "Event", nameKey: "eventName", viewPath: "/events/", emailKey: "uploadedByUserEmail" },
  { col: "cars", label: "Car", nameKey: (c: any) => `${c.year} ${c.make} ${c.model}` , viewPath: "/cars/", emailKey: "uploadedByUserEmail" },
  { col: "auctions", label: "Auction", nameKey: "auctionName", viewPath: "/auctions/", emailKey: "uploadedByUserEmail" },
  { col: "hotels", label: "Hotel", nameKey: "hotelName", viewPath: "/hotels/", emailKey: "uploadedByUserEmail" },
  { col: "clubs", label: "Club", nameKey: "clubName", viewPath: "/clubs/", emailKey: "uploadedByUserEmail" },
];

export default function AdminFeaturedPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerAds, setPartnerAds] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestore(app);
    const fetchAll = async () => {
      setLoading(true);
      let all: any[] = [];
      for (const type of listingTypes) {
        const snap = await getDocs(collection(db, type.col));
        const featured = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.featured === true)
          .map((item: any) => ({ ...item, _type: type.label, _col: type.col, _viewPath: type.viewPath, _nameKey: type.nameKey, _emailKey: type.emailKey }));
        all = all.concat(featured);
      }
      // Sort by createdAt desc if available, else leave as is
      all.sort((a, b) => {
        if (a.createdAt?.seconds && b.createdAt?.seconds) return b.createdAt.seconds - a.createdAt.seconds;
        return 0;
      });
      setListings(all);
      setLoading(false);
    };
    fetchAll();

    const fetchPartnerAds = async () => {
      setAdsLoading(true);
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, "partnerAds"));
      setPartnerAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAdsLoading(false);
    };
    fetchPartnerAds();
  }, []);

  const handleDeleteAd = async (id: string) => {
    setDeletingAdId(id);
    const db = getFirestore(app);
    await deleteDoc(doc(db, "partnerAds", id));
    setPartnerAds(prev => prev.filter(ad => ad.id !== id));
    setDeletingAdId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Listings Table */}
      <Card className="mb-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-lg">Featured Listings</CardTitle>
          <CardDescription className="text-xs">All currently featured (advertised) listings across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 h-auto min-h-0">
          <div className="overflow-x-auto max-h-[70vh] min-h-0">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No featured listings found.</TableCell>
                  </TableRow>
                ) : (
                  listings.map((item: any) => (
                    <TableRow key={item._col + "-" + item.id}>
                      <TableCell className="whitespace-nowrap">{item._type}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[12rem] truncate">{typeof item._nameKey === "function" ? item._nameKey(item) : item[item._nameKey] || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[14rem] truncate">{item[item._emailKey] || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={item._viewPath + item.id} className="text-primary underline" target="_blank">View</Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Partner Ads Table */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-lg">Partner Ads</CardTitle>
          <CardDescription className="text-xs">All partner advertisements on the platform. You can delete any ad.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 h-auto min-h-0">
          <div className="overflow-x-auto max-h-[70vh] min-h-0">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap max-w-[8rem]">ID</TableHead>
                  <TableHead className="whitespace-nowrap">Title</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap max-w-[16rem]">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Image</TableHead>
                  <TableHead className="whitespace-nowrap">Page</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : partnerAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No partner ads found.</TableCell>
                  </TableRow>
                ) : (
                  partnerAds.map((ad: any) => (
                    <TableRow key={ad.id}>
                      <TableCell className="max-w-[8rem] truncate whitespace-nowrap">{ad.id}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[10rem] truncate">{ad.title || ad.productName || ad.type || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{ad.adType || ad.type || '-'}</TableCell>
                      <TableCell className="max-w-[16rem] truncate">{ad.description || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {ad.imageUrls && ad.imageUrls.length > 0 ? (
                          <Image src={ad.imageUrls[0]} alt="Ad" width={60} height={40} className="rounded object-cover" />
                        ) : (
                          <span className="text-muted-foreground">No image</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{ad.page || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap max-w-[14rem] truncate">{ad.uploadedByUserEmail || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <button
                          className="text-red-600 hover:underline disabled:opacity-50"
                          disabled={deletingAdId === ad.id}
                          onClick={() => handleDeleteAd(ad.id)}
                        >
                          {deletingAdId === ad.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 