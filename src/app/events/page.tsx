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
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { useSearchParams } from "next/navigation";
import FreeCallout from "@/components/free-callout";
import SimpleGallerySection from "@/components/SimpleGallerySection";
import { defaultPageContent, fetchPageHeader, type PageHeader } from "@/lib/pageContent";

function EventsPageContent() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const searchParams = useSearchParams();
    const [header, setHeader] = useState<PageHeader>(defaultPageContent.events);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 12;
    
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCity, setSelectedCity] = useState("all");
    const [selectedState, setSelectedState] = useState("all");
    const [selectedCountry, setSelectedCountry] = useState("all");
    const [selectedEventType, setSelectedEventType] = useState("all");
    const [selectedVehicleFocus, setSelectedVehicleFocus] = useState("all");
    const [selectedEntryFee, setSelectedEntryFee] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [showFilters, setShowFilters] = useState(false); // For mobile toggle

    useEffect(() => {
      (async () => {
        try {
          const data = await fetchPageHeader('events');
          setHeader(data);
        } catch {}
      })();
    }, []);

    // Initialize search from URL parameters
    useEffect(() => {
      const search = searchParams.get("search");
      const city = searchParams.get("city");
      const eventtype = searchParams.get("eventtype");
      const vehiclefocus = searchParams.get("vehiclefocus");
      
      if (search) {
        setSearchQuery(search);
      }
      
      if (city && city !== "all") {
        setSelectedCity(city);
      }
      
      if (eventtype && eventtype !== "all") {
        setSelectedEventType(eventtype);
      }

      if (vehiclefocus && vehiclefocus !== "all") {
        setSelectedVehicleFocus(vehiclefocus);
      }
    }, [searchParams]);

    useEffect(() => {
      const fetchEvents = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const eventsQuery = query(collection(db, "events"), orderBy("eventDate", "asc"));
        const snapshot = await getDocs(eventsQuery);
        const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
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
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.country?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCity = selectedCity === "all" || 
          event.city?.toLowerCase() === selectedCity.toLowerCase();
        
        const matchesState = selectedState === "all" || 
          event.state?.toLowerCase() === selectedState.toLowerCase();
        
        const matchesCountry = selectedCountry === "all" || 
          event.country?.toLowerCase() === selectedCountry.toLowerCase();
        
        const matchesEventType = selectedEventType === "all" || 
          event.eventType?.toLowerCase() === selectedEventType.toLowerCase();

        const matchesVehicleFocus = selectedVehicleFocus === "all" || 
          event.vehicleFocus?.toLowerCase() === selectedVehicleFocus.toLowerCase();

        const matchesEntryFee = selectedEntryFee === "all" || 
          (selectedEntryFee === "free" && (event.entryFee === 0 || event.entryFee === "0")) ||
          (selectedEntryFee === "paid" && (event.entryFee !== 0 && event.entryFee !== "0"));
        
        return matchesSearch && matchesCity && matchesState && matchesCountry && matchesEventType && matchesVehicleFocus && matchesEntryFee;
      });

      // Sort events
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "date":
            const dateA = a.eventDate?.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate || 0);
            const dateB = b.eventDate?.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate || 0);
            return dateA.getTime() - dateB.getTime();
          case "newest":
            const createdAtA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
            const createdAtB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
            return createdAtB.getTime() - createdAtA.getTime();
          default:
            return 0;
        }
      });

      return filtered;
    }, [events, searchQuery, selectedCity, selectedState, selectedCountry, selectedEventType, selectedVehicleFocus, selectedEntryFee, sortBy]);

    // Separate featured and regular events
    const featuredEvents = filteredAndSortedEvents.filter(event => event.featured === true);
    const regularEvents = filteredAndSortedEvents.filter(event => event.featured !== true);

    // Pagination logic
    const totalPages = Math.ceil(regularEvents.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const paginatedEvents = regularEvents.slice(startIndex, endIndex);

    const handleSearch = () => {
      setCurrentPage(1);
    };

    const handleResetFilters = () => {
      setSearchQuery("");
      setSelectedCity("all");
      setSelectedState("all");
      setSelectedCountry("all");
      setSelectedEventType("all");
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">{header.title}</h1>
                    <p className="mt-4 text-lg text-gray-700 max-w-3xl">
                      {header.description}
                    </p>
                </div>
                {currentUser ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="border-[#80A0A9] text-[#80A0A9] hover:bg-[#80A0A9]/10 text-sm sm:text-base">
                      <Link href="/advertise/events-listing" className="flex items-center">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Feature Event
                      </Link>
                    </Button>
                    <Button asChild className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                      <Link href="/events/host" className="flex items-center">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Host an Event
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Host an Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Login Required</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center">
                          <p className="text-lg font-semibold mb-2 text-red">You must be logged in to host an event.</p>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Close</Button>
                            </DialogClose>
                            <Button asChild variant="default" className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white">
                              <a href="/login">Login</a>
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-[#80A0A9] text-[#80A0A9] hover:bg-[#80A0A9]/10 flex items-center text-sm sm:text-base">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Feature Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Login Required</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center">
                          <p className="text-lg font-semibold mb-2 text-red">You must be logged in to feature your event.</p>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Close</Button>
                            </DialogClose>
                            <Button asChild variant="default" className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white">
                              <a href="/login">Login</a>
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
            </div>
            <div className="mb-8">
              <FreeCallout
                title="List or Join Events — Always Free"
                icon="sparkles"
                messages={[
                  "Join a community of enthusiasts — No fees, no subscription.",
                  "Discover premium car events — Promote or find events for free.",
                  "List your event or join one — Free of charge.",
                  "Worldwide exposure. Zero fees.",
                ]}
              />
            </div>

          <div className="bg-[#E0D8C1]/30 p-6 rounded-lg border border-[#E0D8C1]/50 mb-8">
            {/* Search Bar - Always Visible */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input 
                placeholder="Search by name, city..." 
                className="flex-1 bg-white border-[#80A0A9]/50 text-gray-900 placeholder:text-gray-500 focus:border-[#80A0A9]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="flex gap-2 md:flex-shrink-0">
                <Button onClick={handleSearch} className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white">Search</Button>
                <Button onClick={handleResetFilters} variant="outline" className="border-[#80A0A9]/50 text-[#80A0A9] hover:bg-[#80A0A9]/10">Reset</Button>
              </div>
            </div>
            
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
              <Button 
                onClick={() => setShowFilters(!showFilters)} 
                variant="outline" 
                className="w-full border-[#80A0A9]/50 text-[#80A0A9] hover:bg-[#80A0A9]/10"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {/* Filters Section - Hidden on mobile by default */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                   <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                     <SelectValue placeholder="City: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any City</SelectItem>
                      {/* Add cities from events data if available */}
                   </SelectContent>
                </Select>
                <Select value={selectedState} onValueChange={setSelectedState}>
                   <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                     <SelectValue placeholder="State: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any State</SelectItem>
                      {/* Add states from events data if available */}
                   </SelectContent>
                </Select>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                   <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                     <SelectValue placeholder="Country: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any Country</SelectItem>
                      {/* Add countries from events data if available */}
                   </SelectContent>
                </Select>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                   <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                     <SelectValue placeholder="Event Type: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any Event Type</SelectItem>
                      {/* Add event types from events data if available */}
                   </SelectContent>
                </Select>
                <Select value={selectedVehicleFocus} onValueChange={setSelectedVehicleFocus}>
                   <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                     <SelectValue placeholder="Vehicle: Any" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">Any Vehicle Type</SelectItem>
                      {/* Add vehicle focus options from events data if available */}
                   </SelectContent>
                </Select>
                <Select value={selectedEntryFee} onValueChange={setSelectedEntryFee}>
                   <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                     <SelectValue placeholder="Fee: Any" />
                   </SelectTrigger>
                 <SelectContent>
                      <SelectItem value="all">Any Entry Fee</SelectItem>
                      <SelectItem value="free">Free Events</SelectItem>
                      <SelectItem value="paid">Paid Events</SelectItem>
                 </SelectContent>
              </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                    <SelectValue placeholder="Sort by: Date" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
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
                     {searchQuery || selectedCity !== "all" || selectedState !== "all" || selectedCountry !== "all" || selectedEventType !== "all" || selectedVehicleFocus !== "all" || selectedEntryFee !== "all" ? "No events found matching your criteria." : "No events found."}
                   </div>
                 ) : (
                 <>
                   <div className="mb-4">
                      <PartnerAdRotator page="Events" maxVisible={4} />
                   </div>

                   {/* Featured Events Grid */}
                   {featuredEvents.length > 0 ? (
                     <div className="mb-12">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                           <Star className="w-6 h-6 text-[#80A0A9]" />
                         </div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Events</h2>
                         <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                       </div>
                       
                       <div className="relative group">
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-300/20 to-yellow-400/20 rounded-3xl border-2 border-yellow-400/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-400/5 rounded-3xl"></div>
                         <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-yellow-400/60 p-6 shadow-inner">
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                             {featuredEvents.map((event, index) => (
                               <EventCard 
                                 key={event.documentId || event.id || index}
                                 {...event} 
                                 documentId={event.documentId}
                                 featured={true} 
                                 name={event.eventName || event.name || `Event #${index + 1}`} 
                                 date={event.eventDate ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.date} 
                                 location={event.location} 
                                 image={event.imageUrl || event.image} 
                                 hint={event.eventType || event.hint} 
                               />
                             ))}
                           </div>
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
                   {regularEvents.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-2 h-8 bg-yellow-600 rounded-full"></div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">All Events</h2>
                         <div className="flex-1 h-px bg-gradient-to-r from-yellow-600/50 to-transparent"></div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {paginatedEvents.map((event, index) => (
                           <EventCard 
                             key={event.documentId || event.id || index} 
                             {...event} 
                             documentId={event.documentId}
                             featured={false} 
                             name={event.eventName || event.name || `Event #${index + 1}`} 
                             date={event.eventDate ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.date} 
                             location={event.location} 
                             image={event.imageUrl || event.image} 
                             hint={event.eventType || event.hint} 
                           />
                         ))}
                       </div>
                       {paginatedEvents.length === 0 && (
                         <div className="text-center py-12 text-gray-600">
                           <p className="text-lg">No events found on this page.</p>
                         </div>
                       )}
                     </div>
                   )}
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

        {/* Events Gallery Section */}
        <SimpleGallerySection title="Events Gallery" collectionName="gallery_events" max={12} />
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
