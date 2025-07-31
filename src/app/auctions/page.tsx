'use client';
import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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

  // Separate featured and regular auctions
  const featuredAuctions = auctions.filter(auction => auction.featured === true);
  const regularAuctions = auctions.filter(auction => auction.featured !== true);

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Car Auctions</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto md:mx-0">
              Find and bid on the most exclusive collector cars from around the world.
            </p>
          </div>
          {currentUser ? (
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/auctions/submit" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Register Your Auction
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Link href="/advertise/auction-listing" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Feature Your Auction
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
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
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Feature Your Auction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to feature your auction.</p>
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
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input placeholder="Search auctions..." className="md:col-span-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
            <Select>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue placeholder="Sort by: Ending Soon" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="newly-listed">Newly Listed</SelectItem>
                <SelectItem value="highest-bid">Highest Bid</SelectItem>
              </SelectContent>
            </Select>
            <Button>Search</Button>
          </div>
        </div>

        <div className="mb-4">
          <PartnerAdRotator page="Auctions" maxVisible={4} />
        </div>

        {loading ? (
          <div className="text-center text-lg py-12 animate-pulse text-gray-600">Loading auctions...</div>
        ) : auctions.length === 0 ? (
          <div className="text-center text-lg py-12 text-gray-600">No auctions found.</div>
        ) : (
          <>
            {/* Featured Auctions Carousel */}
            {featuredAuctions.length > 0 ? (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-400/10 rounded-full">
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Auctions</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-300/20 to-yellow-400/20 rounded-3xl border-2 border-yellow-400/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-400/5 rounded-3xl"></div>
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-yellow-400/60 p-6 shadow-inner">
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {featuredAuctions.map((auction) => (
                          <CarouselItem key={auction.documentId} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                            <div className="p-2">
                              <div className="relative group">
                                <CarCard
                                  id={auction.documentId}
                                  name={auction.auctionName}
                                  price={auction.auctionHouse}
                                  location={`Starts ${auction.city}, ${auction.state}`}
                                  image={auction.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"}
                                  hint={auction.auctionType}
                                  type="auction"
                                  featured={true}
                                />
                                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                  <span>{auction.startDate?.seconds ? new Date(auction.startDate.seconds * 1000).toLocaleDateString() : "-"}</span>
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                      <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                    </Carousel>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-6 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                <div className="text-center text-gray-600">
                  <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500/50" />
                  <p className="text-sm">No featured auctions at the moment. Check back soon for premium auctions!</p>
                </div>
              </div>
            )}

            {/* Regular Auctions Grid */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-yellow-600 rounded-full"></div>
                <h2 className="text-2xl font-headline font-bold text-gray-900">Live Auctions</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-600/50 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {regularAuctions.map(auction => (
                  <div key={auction.documentId} className="relative group">
                    <CarCard
                      id={auction.documentId}
                      name={auction.auctionName}
                      price={auction.auctionHouse}
                      location={`Starts ${auction.city}, ${auction.state}`}
                      image={auction.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"}
                      hint={auction.auctionType}
                      type="auction"
                      featured={false}
                    />
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span>{auction.startDate?.seconds ? new Date(auction.startDate.seconds * 1000).toLocaleDateString() : "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
              {regularAuctions.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg">No auctions found.</p>
                  <p className="text-sm mt-2">Be the first to register an auction!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
