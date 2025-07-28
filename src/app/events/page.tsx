'use client'

import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map, PlusCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
      const fetchEvents = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const snapshot = await getDocs(collection(db, "events"));
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((event: any) => event.status === "approved");
        setEvents(data);
        setLoading(false);
      };
      fetchEvents();
    }, []);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }, []);

    // Separate featured and regular events
    const featuredEvents = events.filter(event => event.featured === true);
    const regularEvents = events.filter(event => event.featured !== true);

    return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Discover Events</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                From local meetups to international shows, find your next car adventure.
                </p>
            </div>
            {currentUser ? (
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/advertise/events-listing" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Feature Event
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/events/host" className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Host an Event
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Feature Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                      <p className="text-lg font-semibold mb-2 text-destructive">Please login to feature an event.</p>
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
                    <Button className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Host an Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                      <p className="text-lg font-semibold mb-2 text-destructive">Please login to host an event.</p>
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

      <div className="bg-card p-6 rounded-lg border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Search by name, city..." className="md:col-span-2" />
          <Select>
             <SelectTrigger><SelectValue placeholder="Category: Any" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="show">Car Show</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
                <SelectItem value="track">Track Day</SelectItem>
             </SelectContent>
          </Select>
          <Select>
            <SelectTrigger><SelectValue placeholder="Sort by: Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsContent value="list">
             {loading ? (
               <div className="py-12 text-center text-muted-foreground">Loading events...</div>
             ) : events.length === 0 ? (
               <div className="py-12 text-center text-muted-foreground">No events found.</div>
             ) : (
             <>
               <div className="mb-4">
                  <PartnerAdRotator page="Events" maxVisible={2} />
               </div>

               {/* Featured Events Carousel */}
               {featuredEvents.length > 0 ? (
                 <div className="mb-12">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-yellow-400/10 rounded-full">
                       <Star className="w-6 h-6 text-yellow-500" />
                     </div>
                     <h2 className="text-2xl font-headline font-bold text-foreground">Featured Events</h2>
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
                           {featuredEvents.map((event, index) => (
                             <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                               <div className="p-2">
                                 <EventCard 
                                   {...event} 
                                   featured={true} 
                                   name={event.eventName || event.name || `Event #${index + 1}`} 
                                   date={event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.date} 
                                   location={event.location} 
                                   image={event.imageUrl || event.image} 
                                   hint={event.eventType || event.hint} 
                                 />
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
                     <p className="text-sm">No featured events at the moment. Check back soon for premium events!</p>
                   </div>
                 </div>
               )}

               {/* Regular Events Grid */}
               <div className="mb-6">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-2 h-8 bg-primary rounded-full"></div>
                   <h2 className="text-2xl font-headline font-bold text-foreground">All Events</h2>
                   <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {regularEvents.map((event, index) => (
                      <EventCard 
                        key={event.id} 
                        {...event} 
                        featured={false} 
                        name={event.eventName || event.name || `Event #${index + 1}`} 
                        date={event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.date} 
                        location={event.location} 
                        image={event.imageUrl || event.image} 
                        hint={event.eventType || event.hint} 
                      />
                    ))}
                 </div>
                 {regularEvents.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                     <p className="text-lg">No events found.</p>
                     <p className="text-sm mt-2">Be the first to host an event in your area!</p>
                   </div>
                 )}
               </div>
             </>
             )}
             <div className="mt-12">
                <Pagination>
                <PaginationContent>
                    <PaginationItem>
                    <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationLink href="#" isActive>2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationNext href="#" />
                    </PaginationItem>
                </PaginationContent>
                </Pagination>
            </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
