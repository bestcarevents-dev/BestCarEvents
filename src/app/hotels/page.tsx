'use client';
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function CarHotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, "hotels"));
      const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
      setHotels(data);
      setLoading(false);
    };
    fetchHotels();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Separate featured and regular hotels
  const featuredHotels = hotels.filter(hotel => hotel.featured === true);
  const regularHotels = hotels.filter(hotel => hotel.featured !== true);

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="text-center md:text-left md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Hotels</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world's most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
         </p>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Choosing the right hotel can considerably impact your travel experience. By considering factors such as location, price, facilities, reviews, and safety, you can make a decision that meets your needs and preferences. Choose one of our partners.
         </p>
        </div>
        {currentUser ? (
          <div className="flex gap-2">
            <Button asChild>
                <Link href="/hotels/list" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    List Your Hotel
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/advertise/hotel-listing" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Feature Your Hotel
                </Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  List Your Hotel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full">
                <DialogHeader>
                  <DialogTitle>Login Required</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                  <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to list your hotel.</p>
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
                <Button variant="outline" className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Feature Your Hotel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full">
                <DialogHeader>
                  <DialogTitle>Login Required</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                  <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to feature your hotel.</p>
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

      {/* Added Text */}
      <div className="mb-4">
        <PartnerAdRotator page="Car Hotels" maxVisible={2} />
      </div>

      {loading ? (
        <div className="col-span-full text-center text-lg py-12 animate-pulse">Loading hotels...</div>
      ) : hotels.length === 0 ? (
        <div className="col-span-full text-center text-lg py-12 text-muted-foreground">No hotels found.</div>
      ) : (
        <>
          {/* Featured Hotels Carousel */}
          {featuredHotels.length > 0 ? (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-400/10 rounded-full">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-headline font-bold text-foreground">Featured Hotels</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-300/20 to-yellow-400/20 rounded-3xl border-2 border-yellow-400/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-400/5 rounded-3xl"></div>
                <div className="relative bg-background/90 backdrop-blur-sm rounded-3xl border-2 border-yellow-400/60 p-6 shadow-inner">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {featuredHotels.map((hotel) => (
                        <CarouselItem key={hotel.documentId} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                          <div className="p-2">
                            <Card className="flex flex-col h-full">
                              <CardHeader className="p-0 relative">
                                <Link href={`/hotels/${hotel.documentId}`} className="block relative aspect-video">
                                  <Image src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} alt={hotel.hotelName} layout="fill" objectFit="cover" data-ai-hint={hotel.hotelName}/>
                                </Link>
                              </CardHeader>
                              <CardContent className="p-6 flex-grow">
                                <CardTitle className="font-headline">
                                  <Link href={`/hotels/${hotel.documentId}`}>{hotel.hotelName}</Link>
                                </CardTitle>
                                <CardDescription>{hotel.city}, {hotel.state}</CardDescription>
                                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                  {(hotel.features || []).slice(0, 3).map((feature: string) => (
                                    <li key={feature} className="flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                              <CardFooter className="p-6 pt-0">
                                <Button asChild variant="outline" className="w-full">
                                  <Link href={`/hotels/${hotel.documentId}`}>View Services</Link>
                                </Button>
                              </CardFooter>
                            </Card>
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
            <div className="mb-8 p-6 bg-muted/30 rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500/50" />
                <p className="text-sm">No featured hotels at the moment. Check back soon for premium hotels!</p>
              </div>
            </div>
          )}

          {/* Regular Hotels Grid */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              <h2 className="text-2xl font-headline font-bold text-foreground">All Hotels</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularHotels.map(hotel => (
                <Card key={hotel.documentId} className="flex flex-col">
                  <CardHeader className="p-0 relative">
                    <Link href={`/hotels/${hotel.documentId}`} className="block relative aspect-video">
                      <Image src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} alt={hotel.hotelName} layout="fill" objectFit="cover" data-ai-hint={hotel.hotelName}/>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <CardTitle className="font-headline">
                      <Link href={`/hotels/${hotel.documentId}`}>{hotel.hotelName}</Link>
                    </CardTitle>
                    <CardDescription>{hotel.city}, {hotel.state}</CardDescription>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {(hotel.features || []).map((feature: string) => (
                        <li key={feature} className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/hotels/${hotel.documentId}`}>View Services</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {regularHotels.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No hotels found.</p>
                <p className="text-sm mt-2">Be the first to list your hotel!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
