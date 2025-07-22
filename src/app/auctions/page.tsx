'use client';
import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const auctionsQuery = query(collection(db, "auctions"), orderBy("startDate", "asc"));
      const snapshot = await getDocs(auctionsQuery);
      const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
      setAuctions(data);
      setLoading(false);
    };
    fetchAuctions();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Auctions</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Find and bid on the most exclusive collector cars from around the world.
          </p>
        </div>
        {currentUser ? (
          <Button asChild>
            <Link href="/auctions/submit" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Register Your Auction
            </Link>
          </Button>
        ) : (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Register Your Auction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Login Required</DialogTitle>
              </DialogHeader>
              <div className="py-4 text-center">
                <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to register your auction.</p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  <Button asChild variant="default">
                    <a href="/login">Login</a>
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card p-6 rounded-lg border mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search auctions..." className="md:col-span-2" />
          <Select>
            <SelectTrigger><SelectValue placeholder="Sort by: Ending Soon" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="newly-listed">Newly Listed</SelectItem>
              <SelectItem value="highest-bid">Highest Bid</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold font-headline mb-6">Live Auctions</h2>
        {loading ? (
          <div className="text-center text-lg py-12 animate-pulse">Loading auctions...</div>
        ) : auctions.length === 0 ? (
          <div className="text-center text-lg py-12 text-muted-foreground">No auctions found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctions.map(auction => (
              <div key={auction.documentId} className="relative group">
                <CarCard
                  id={auction.documentId}
                  name={auction.auctionName}
                  price={auction.auctionHouse}
                  location={`Starts ${auction.city}, ${auction.state}`}
                  image={auction.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"}
                  hint={auction.auctionType}
                  type="auction"
                />
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{auction.startDate?.seconds ? new Date(auction.startDate.seconds * 1000).toLocaleDateString() : "-"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
