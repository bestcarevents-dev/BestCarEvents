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
import { useEffect, useState, useMemo, Suspense } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useSearchParams } from "next/navigation";

function EventsPageContent() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const searchParams = useSearchParams();
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 12;
    
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedVehicleFocus, setSelectedVehicleFocus] = useState("all");
    const [selectedEntryFee, setSelectedEntryFee] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [showFilters, setShowFilters] = useState(false);

    // Initialize search from URL parameters
    useEffect(() => {
      const search = searchParams.get("search");
      const category = searchParams.get("category");
      const vehiclefocus = searchParams.get("vehiclefocus");
      
      if (search) {
        setSearchQuery(search);
      }
      
      if (category && category !== "all") {
        setSelectedCategory(category);
      }
      
      if (vehiclefocus && vehiclefocus !== "all") {
        setSelectedVehicleFocus(vehiclefocus);
      }
    }, [searchParams]);

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

    // Filter and sort events
    const filteredAndSortedEvents = useMemo(() => {
      let filtered = events.filter(event => {
        const matchesSearch = searchQuery === "" || 
          event.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === "all" || 
          event.eventType?.toLowerCase() === selectedCategory.toLowerCase();
        
        const matchesVehicleFocus = selectedVehicleFocus === "all" || 
          event.vehicleFocus?.toLowerCase().includes(selectedVehicleFocus.toLowerCase());
        
        const matchesEntryFee = selectedEntryFee === "all" || 
          (selectedEntryFee === "free" && (!event.entryFee || event.entryFee === 0)) ||
          (selectedEntryFee === "paid" && event.entryFee && event.entryFee > 0);
        
        return matchesSearch && matchesCategory && matchesVehicleFocus && matchesEntryFee;
      });

      // Sort events
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "date":
            const dateA = a.eventDate?.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate || 0);
            const dateB = b.eventDate?.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate || 0);
            return dateA.getTime() - dateB.getTime();
          case "popular":
            // Sort by featured first, then by name
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return (a.eventName || "").localeCompare(b.eventName || "");
          case "distance":
            // For now, sort by name as distance would require location services
            return (a.eventName || "").localeCompare(b.eventName || "");
          case "fee":
            // Sort by entry fee (free first, then by amount)
            const feeA = a.entryFee || 0;
            const feeB = b.entryFee || 0;
            if (feeA === 0 && feeB > 0) return -1;
            if (feeA > 0 && feeB === 0) return 1;
            return feeA - feeB;
          default:
            return 0;
        }
      });

      return filtered;
    }, [events, searchQuery, selectedCategory, selectedVehicleFocus, selectedEntryFee, sortBy]);

    // Separate featured and regular events
    const featuredEvents = filteredAndSortedEvents.filter(event => event.featured === true);
    const regularEvents = filteredAndSortedEvents.filter(event => event.featured !== true);

    // Pagination logic
    const totalPages = Math.ceil(regularEvents.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const paginatedEvents = regularEvents.slice(startIndex, endIndex);

    // Get unique categories from events
    const categories = useMemo(() => {
      const cats = events
        .map(event => event.eventType)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
      return cats;
    }, [events]);

    // Get unique vehicle focus options from events
    const vehicleFocusOptions = useMemo(() => {
      const focuses = events
        .map(event => event.vehicleFocus)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
      return focuses;
    }, [events]);

    const handleSearch = () => {
      // Search is handled by the useMemo above, this is just for the button
      setCurrentPage(1); // Reset to first page when searching
    };

    const handleResetFilters = () => {
      setSearchQuery("");
      setSelectedCategory("all");
      setSelectedVehicleFocus("all");
      setSelectedEntryFee("all");
      setSortBy("date");
      setCurrentPage(1);
      setShowFilters(false); // Hide filters on mobile after reset
    };

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
    <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Discover Events</h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl">
                    From local meetups to international shows, find your next car adventure.
                    </p>
                </div>
                {currentUser ? (
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
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
                        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center">
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

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            {/* Search Bar - Always Visible */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input 
                placeholder="Search by name, city..." 
                className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="flex gap-2 md:flex-shrink-0">
                <Button onClick={handleSearch} className="bg-yellow-600 hover:bg-yellow-700">Search</Button>
                <Button onClick={handleResetFilters} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Reset</Button>
              </div>
            </div>
            
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
              <Button 
                onClick={() => setShowFilters(!showFilters)} 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {/* Filters Section - Hidden on mobile by default */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                   <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                     <SelectValue placeholder="Category: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
                <Select value={selectedVehicleFocus} onValueChange={setSelectedVehicleFocus}>
                   <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                     <SelectValue placeholder="Vehicle: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any Vehicle Type</SelectItem>
                      {vehicleFocusOptions.map((focus) => (
                        <SelectItem key={focus} value={focus}>
                          {focus}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
                <Select value={selectedEntryFee} onValueChange={setSelectedEntryFee}>
                   <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                     <SelectValue placeholder="Fee: Any" />
                   </SelectTrigger>
                 <SelectContent>
                      <SelectItem value="all">Any Entry Fee</SelectItem>
                      <SelectItem value="free">Free Events</SelectItem>
                      <SelectItem value="paid">Paid Events</SelectItem>
                 </SelectContent>
              </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Sort by: Date" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="fee">Entry Fee</SelectItem>
                    <SelectItem value="distance">Name</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsContent value="list">
                 {loading ? (
                   <div className="py-12 text-center text-gray-600">Loading events...</div>
                 ) : filteredAndSortedEvents.length === 0 ? (
                   <div className="py-12 text-center text-gray-600">
                     {searchQuery || selectedCategory !== "all" || selectedVehicleFocus !== "all" || selectedEntryFee !== "all" ? "No events found matching your criteria." : "No events found."}
                   </div>
                 ) : (
                 <>
                   <div className="mb-4">
                      <PartnerAdRotator page="Events" maxVisible={4} />
                   </div>

                   {/* Featured Events Carousel */}
                   {featuredEvents.length > 0 ? (
                     <div className="mb-12">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-yellow-400/10 rounded-full">
                           <Star className="w-6 h-6 text-yellow-500" />
                         </div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Events</h2>
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
                     <div className="mb-8 p-6 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                       <div className="text-center text-gray-600">
                         <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500/50" />
                         <p className="text-sm">No featured events at the moment. Check back soon for premium events!</p>
                       </div>
                     </div>
                   )}

                   {/* Regular Events Grid */}
                   <div className="mb-6">
                     <div className="flex items-center gap-3 mb-6">
                       <div className="w-2 h-8 bg-yellow-600 rounded-full"></div>
                       <h2 className="text-2xl font-headline font-bold text-gray-900">All Events</h2>
                       <div className="flex-1 h-px bg-gradient-to-r from-yellow-600/50 to-transparent"></div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedEvents.map((event, index) => (
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
                     {paginatedEvents.length === 0 && (
                       <div className="text-center py-12 text-gray-600">
                         <p className="text-lg">No events found on this page.</p>
                         <p className="text-sm mt-2">Try adjusting your search criteria or check other pages.</p>
                       </div>
                     )}
                   </div>
                 </>
                 )}
                 
                 {/* Pagination */}
                 {totalPages > 1 && (
                 <div className="mt-12">
                    <Pagination>
                    <PaginationContent className="bg-white border border-gray-300 rounded-lg p-1">
                        <PaginationItem>
                           <PaginationPrevious 
                             href="#" 
                             className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                             onClick={(e) => {
                               e.preventDefault();
                               if (currentPage > 1) handlePageChange(currentPage - 1);
                             }}
                           />
                        </PaginationItem>
                         
                         {/* Generate page numbers */}
                         {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                           <PaginationItem key={page}>
                             <PaginationLink 
                               href="#" 
                               className={`text-gray-700 hover:text-gray-900 hover:bg-gray-50 ${
                                 currentPage === page ? 'bg-yellow-600 text-white hover:bg-yellow-700' : ''
                               }`}
                               onClick={(e) => {
                                 e.preventDefault();
                                 handlePageChange(page);
                               }}
                             >
                               {page}
                             </PaginationLink>
                        </PaginationItem>
                         ))}
                         
                        <PaginationItem>
                           <PaginationNext 
                             href="#" 
                             className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                             onClick={(e) => {
                               e.preventDefault();
                               if (currentPage < totalPages) handlePageChange(currentPage + 1);
                             }}
                           />
                        </PaginationItem>
                    </PaginationContent>
                    </Pagination>
                </div>
                 )}
            </TabsContent>
          </Tabs>

        </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-12 text-gray-600">Loading...</div>}>
      <EventsPageContent />
    </Suspense>
  );
}
