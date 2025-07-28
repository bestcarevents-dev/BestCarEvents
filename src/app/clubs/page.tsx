'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, Link as LinkIcon } from "lucide-react";
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const clubsQuery = query(collection(db, "clubs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(clubsQuery);
      const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
      setClubs(data);
      setLoading(false);
    };
    fetchClubs();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Separate featured and regular clubs
  const featuredClubs = clubs.filter(club => club.featured === true);
  const regularClubs = clubs.filter(club => club.featured !== true);

  return (
    <div className="bg-background text-foreground">
      <main className="py-12 md:py-10 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Clubs</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
                    Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world's most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
                </p>
            </div>
            {currentUser ? (
              <div className="flex gap-2">
                <Button asChild>
                    <Link href="/clubs/register" className="flex items-center">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Register Your Club
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/advertise/club-listing" className="flex items-center">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Feature Your Club
                    </Link>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Register Your Club
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                      <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to register your club.</p>
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
                      Feature Your Club
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                      <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to feature your club.</p>
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

          {/* Club Search Bar */}
          <div className="bg-card p-6 rounded-lg border mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search by club name or description..."
                className="md:col-span-2 px-4 py-2 rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Location (e.g. city, country)"
                className="px-4 py-2 rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select className="px-4 py-2 rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="newest">Sort by: Newest</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
              <Button>Search</Button>
            </div>
          </div>

          {/* Club Listing Grid */}
          <div className="mb-4">
            <PartnerAdRotator page="Car clubs" maxVisible={2} />
          </div>

          {loading ? (
            <div className="col-span-full text-center text-lg py-12 animate-pulse">Loading clubs...</div>
          ) : clubs.length === 0 ? (
            <div className="col-span-full text-center text-lg py-12 text-muted-foreground">No clubs found.</div>
          ) : (
            <>
              {/* Featured Clubs Carousel */}
              {featuredClubs.length > 0 ? (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-400/10 rounded-full">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-headline font-bold text-foreground">Featured Clubs</h2>
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
                          {featuredClubs.map((club) => (
                            <CarouselItem key={club.documentId} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                              <div className="p-2">
                                <Link
                                  href={`/clubs/${club.documentId}`}
                                  className="group relative bg-card border rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary block"
                                  tabIndex={0}
                                  aria-label={`View details for ${club.clubName}`}
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                                    <div className="rounded-full border-4 border-background shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                                      <Image src={club.logoUrl || "/placeholder.jpg"} alt={club.clubName} width={80} height={80} className="object-contain w-full h-full" />
                                    </div>
                                  </div>
                                  <div className="mt-12 w-full flex flex-col items-center">
                                    <h3 className="text-xl font-bold font-headline text-primary mb-1 text-center group-hover:underline transition-all">{club.clubName}</h3>
                                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                      <Users className="w-4 h-4" />
                                      <span>{club.city}, {club.country}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4 text-center line-clamp-3">{club.description}</p>
                                    <div className="flex gap-3 mt-auto">
                                      {club.website && (
                                        <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors" title="Website">
                                          <Globe className="w-5 h-5" />
                                        </a>
                                      )}
                                      {club.socialMediaLink && (
                                        <a href={club.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors" title="Social Media">
                                          <LinkIcon className="w-5 h-5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="absolute top-4 right-4">
                                    <span className="inline-block bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow">{club.createdAt?.seconds ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : "New"}</span>
                                  </div>
                                </Link>
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
                    <p className="text-sm">No featured clubs at the moment. Check back soon for premium clubs!</p>
                  </div>
                </div>
              )}

              {/* Regular Clubs Grid */}
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-primary rounded-full"></div>
                  <h2 className="text-3xl font-bold font-headline text-center md:text-left">Discover the Community</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {regularClubs.map((club, idx) => (
                    <Link
                      key={club.documentId || idx}
                      href={`/clubs/${club.documentId}`}
                      className="group relative bg-card border rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      tabIndex={0}
                      aria-label={`View details for ${club.clubName}`}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                        <div className="rounded-full border-4 border-background shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                          <Image src={club.logoUrl || "/placeholder.jpg"} alt={club.clubName} width={80} height={80} className="object-contain w-full h-full" />
                        </div>
                      </div>
                      <div className="mt-12 w-full flex flex-col items-center">
                        <h3 className="text-xl font-bold font-headline text-primary mb-1 text-center group-hover:underline transition-all">{club.clubName}</h3>
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{club.city}, {club.country}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 text-center line-clamp-3">{club.description}</p>
                        <div className="flex gap-3 mt-auto">
                          {club.website && (
                            <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors" title="Website">
                              <Globe className="w-5 h-5" />
                            </a>
                          )}
                          {club.socialMediaLink && (
                            <a href={club.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors" title="Social Media">
                              <LinkIcon className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-block bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow">{club.createdAt?.seconds ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : "New"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                {regularClubs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">No clubs found.</p>
                    <p className="text-sm mt-2">Be the first to register your club!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
