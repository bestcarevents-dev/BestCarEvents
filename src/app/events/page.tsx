'use client'

import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';

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
          .filter(event => event.status === "approved");
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
              <Button asChild>
                <Link href="/events/host" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Host an Event
                </Link>
              </Button>
            ) : (
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
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {events
                    .slice()
                    .sort((a, b) => (b.featured === true ? 1 : 0) - (a.featured === true ? 1 : 0))
                    .map((event, index) => (
                      <EventCard key={event.id} {...event} featured={!!event.featured} name={event.eventName || event.name || `Event #${index + 1}`} date={event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.date} location={event.location} image={event.imageUrl || event.image} hint={event.eventType || event.hint} />
                  ))}
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
