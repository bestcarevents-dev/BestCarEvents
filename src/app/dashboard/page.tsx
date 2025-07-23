"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
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

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [advertiseModal, setAdvertiseModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [advertiseLoading, setAdvertiseLoading] = useState(false);

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
    await updateDoc(doc(db, col, id), { featured: true });
    setAdvertiseLoading(false);
    setAdvertiseModal(null);
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
      label: "Cars Listing",
      data: cars,
      columns: [
        { label: "Name", key: (c: any) => `${c.year} ${c.make} ${c.model}` },
        { label: "Price", key: (c: any) => c.price ? `$${c.price.toLocaleString()}` : "N/A" },
        { label: "Location", key: "location" },
        { label: "Status", key: "status" },
        { label: "Featured", key: "featured" },
        { label: "Deactivated", key: "deactivated" },
      ],
      col: "cars",
      viewPath: "/cars/",
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
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-extrabold font-headline">My Dashboard</h1>
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
            <CardTitle>Active Ads</CardTitle>
            <CardDescription>All your featured (advertised) listings.</CardDescription>
            </CardHeader>
            <CardContent>
            <p className="text-4xl font-bold">{activeAdsCount}</p>
            </CardContent>
        </Card>
      </div>
      {loading ? (
        <div className="text-center py-12 text-lg animate-pulse">Loading your listings...</div>
      ) : (
        listingTables.map((table) => (
          <Card key={table.label} className="mb-8">
            <CardHeader>
              <CardTitle>{table.label}</CardTitle>
              <CardDescription>Manage your {table.label.toLowerCase()} here.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    {table.columns.map((col) => (
                      <TableHead key={typeof col.key === "string" ? col.key : col.label}>{col.label}</TableHead>
                    ))}
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {table.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={table.columns.length + 1} className="text-center text-muted-foreground">No listings found.</TableCell>
                    </TableRow>
                  ) : (
                    table.data.map((item: any) => (
                      <TableRow key={item.id}>
                        {table.columns.map((col, idx) => (
                          <TableCell key={idx}>
                            {typeof col.key === "function"
                              ? col.key(item)
                              : col.key === "deactivated"
                              ? item.deactivated ? "Yes" : "No"
                              : col.key === "featured"
                              ? item.featured ? "Yes" : "No"
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
                                <Link href={table.viewPath + item.id}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(table.col, item.id)}
                                disabled={item.deactivated}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Dialog open={advertiseModal?.open && advertiseModal.col === table.col && advertiseModal.id === item.id} onOpenChange={(open) => !open && setAdvertiseModal(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant={item.featured ? "secondary" : "default"}
                                size="sm"
                                disabled={item.featured}
                                onClick={() => setAdvertiseModal({ open: true, col: table.col, id: item.id })}
                              >
                                {item.featured ? "Advertised" : "Advertise"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Advertise Listing</DialogTitle>
                                <DialogDescription>
                                  Pay $10 to feature this listing. Featured listings appear more prominently.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 text-center">
                                <Button
                                  className="w-full text-lg py-4"
                                  disabled={advertiseLoading}
                                  onClick={async () => await handleAdvertise(table.col, item.id)}
                                >
                                  {advertiseLoading ? "Processing..." : "Pay $10 & Feature"}
                                </Button>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Close</Button>
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
        ))
      )}
    </div>
  );
}
