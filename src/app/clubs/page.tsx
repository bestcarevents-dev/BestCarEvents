'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";
import { useEffect, useState, useMemo, Suspense } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, Link as LinkIcon } from "lucide-react";
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useSearchParams } from "next/navigation";
import FreeCallout from "@/components/free-callout";
import SimpleGallerySection from "@/components/SimpleGallerySection";

function ClubsPageContent() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const searchParams = useSearchParams();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const clubsPerPage = 12;
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedActivity, setSelectedActivity] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize search from URL parameters
  useEffect(() => {
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const activity = searchParams.get("activity");
    
    if (search) {
      setSearchQuery(search);
    }
    
    if (city && city !== "all") {
      setSelectedCity(city);
    }
    
    if (activity && activity !== "all") {
      setSelectedActivity(activity);
    }
  }, [searchParams]);

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

  // Filter and sort clubs
  const filteredAndSortedClubs = useMemo(() => {
    let filtered = clubs.filter(club => {
      const matchesSearch = searchQuery === "" || 
        club.clubName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.membershipCriteria?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.typicalActivities?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCity = selectedCity === "all" || 
        club.city?.toLowerCase() === selectedCity.toLowerCase();
      
      const matchesCountry = selectedCountry === "all" || 
        club.country?.toLowerCase() === selectedCountry.toLowerCase();
      
      const matchesActivity = selectedActivity === "all" || 
        club.typicalActivities?.toLowerCase().includes(selectedActivity.toLowerCase()) ||
        club.membershipCriteria?.toLowerCase().includes(selectedActivity.toLowerCase());
      
      return matchesSearch && matchesCity && matchesCountry && matchesActivity;
    });

    // Sort clubs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        case "oldest":
          const dateAOld = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
          const dateBOld = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
          return dateAOld.getTime() - dateBOld.getTime();
        case "name-asc":
          return (a.clubName || "").localeCompare(b.clubName || "");
        case "name-desc":
          return (b.clubName || "").localeCompare(a.clubName || "");
        case "city-asc":
          return (a.city || "").localeCompare(b.city || "");
        case "city-desc":
          return (b.city || "").localeCompare(a.city || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [clubs, searchQuery, selectedCity, selectedCountry, selectedActivity, sortBy]);

  // Separate featured and regular clubs
  const featuredClubs = filteredAndSortedClubs.filter(club => club.featured === true);
  const regularClubs = filteredAndSortedClubs.filter(club => club.featured !== true);

  // Pagination logic
  const totalPages = Math.ceil(regularClubs.length / clubsPerPage);
  const startIndex = (currentPage - 1) * clubsPerPage;
  const endIndex = startIndex + clubsPerPage;
  const paginatedClubs = regularClubs.slice(startIndex, endIndex);

  // Get unique filter options from clubs
  const cities = useMemo(() => {
    const clubCities = clubs
      .map(club => club.city)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return clubCities;
  }, [clubs]);

  const countries = useMemo(() => {
    const clubCountries = clubs
      .map(club => club.country)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return clubCountries;
  }, [clubs]);

  const allActivities = useMemo(() => {
    const activities = new Set<string>();
    clubs.forEach(club => {
      if (club.typicalActivities) {
        // Extract common activities from typicalActivities text
        const activityText = club.typicalActivities.toLowerCase();
        if (activityText.includes('meetup')) activities.add('Meetups');
        if (activityText.includes('track')) activities.add('Track Days');
        if (activityText.includes('drive') || activityText.includes('cruise')) activities.add('Scenic Drives');
        if (activityText.includes('social') || activityText.includes('dinner')) activities.add('Social Events');
        if (activityText.includes('race') || activityText.includes('racing')) activities.add('Racing');
        if (activityText.includes('show') || activityText.includes('display')) activities.add('Car Shows');
        if (activityText.includes('charity') || activityText.includes('fundraiser')) activities.add('Charity Events');
      }
      if (club.membershipCriteria) {
        const criteriaText = club.membershipCriteria.toLowerCase();
        if (criteriaText.includes('specific') || criteriaText.includes('make')) activities.add('Specific Car Makes');
        if (criteriaText.includes('vintage') || criteriaText.includes('classic')) activities.add('Vintage/Classic');
        if (criteriaText.includes('jdm') || criteriaText.includes('japanese')) activities.add('JDM');
        if (criteriaText.includes('muscle') || criteriaText.includes('american')) activities.add('Muscle Cars');
        if (criteriaText.includes('european') || criteriaText.includes('exotic')) activities.add('European/Exotic');
      }
    });
    return Array.from(activities).sort();
  }, [clubs]);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedCountry("all");
    setSelectedActivity("all");
    setSortBy("newest");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      <main className="py-12 md:py-10 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Car Clubs</h1>
                <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto md:mx-0">
                    Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world's most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
                </p>
            </div>
            {currentUser ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button asChild className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                    <Link href="/clubs/register" className="flex items-center">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Register Your Club
                    </Link>
                </Button>
                <Button asChild variant="outline" className="border-[#80A0A9] text-[#80A0A9] hover:bg-[#80A0A9]/10 text-sm sm:text-base">
                    <Link href="/advertise/club-listing" className="flex items-center">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Feature Your Club
                    </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
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
              title="Grow Your Club — Free to Register"
              icon="sparkles"
              messages={[
                "Join a community of enthusiasts — No fees, no subscription.",
                "Promote your car club — Get members for free.",
                "Register your club or join one — Free of charge.",
                "Worldwide exposure. Zero fees.",
              ]}
            />
          </div>

          {/* Club Search Bar */}
          <div className="bg-[#E0D8C1]/30 p-6 rounded-lg border border-[#E0D8C1]/50 mb-8">
            {/* Search Bar - Always Visible */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input 
                placeholder="Search by club name, city, country, activities..." 
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                    <SelectValue placeholder="City: Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any City</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                    <SelectValue placeholder="Country: Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Country</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                  <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                    <SelectValue placeholder="Activity: Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Activity</SelectItem>
                    {allActivities.map((activity) => (
                      <SelectItem key={activity} value={activity}>
                        {activity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                    <SelectValue placeholder="Sort by: Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                    <SelectItem value="city-asc">City: A to Z</SelectItem>
                    <SelectItem value="city-desc">City: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Club Listing Grid */}
          <div className="mb-4">
            <PartnerAdRotator page="Car clubs" maxVisible={4} />
          </div>

          {loading ? (
            <div className="text-center text-lg py-12 text-gray-600">Loading clubs...</div>
          ) : filteredAndSortedClubs.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              {searchQuery || selectedCity !== "all" || selectedCountry !== "all" || selectedActivity !== "all" ? "No clubs found matching your criteria." : "No clubs found."}
            </div>
          ) : (
            <>
              {/* Featured Clubs Carousel */}
              {featuredClubs.length > 0 ? (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                      <Star className="w-6 h-6 text-[#80A0A9]" />
                    </div>
                    <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Clubs</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/30 via-[#80A0A9]/20 to-[#E0D8C1]/30 rounded-3xl border-2 border-[#80A0A9]/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/10 via-transparent to-[#E0D8C1]/10 rounded-3xl"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-[#80A0A9]/60 p-6 shadow-inner">
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
                                  className="group relative bg-white border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[#80A0A9]/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#80A0A9] block"
                                  tabIndex={0}
                                  aria-label={`View details for ${club.clubName}`}
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                                    <div className="rounded-full border-4 border-white shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                                      <Image src={club.logoUrl || "/placeholder.jpg"} alt={club.clubName} width={80} height={80} className="object-contain w-full h-full" />
                                    </div>
                                  </div>
                                  <div className="mt-12 w-full flex flex-col items-center">
                                    <h3 className="text-xl font-bold font-headline text-[#80A0A9] mb-1 text-center group-hover:underline transition-all">{club.clubName}</h3>
                                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                                      <Users className="w-4 h-4" />
                                      <span>{club.city}, {club.country}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 text-center line-clamp-3">{club.description}</p>
                                    <div className="flex gap-3 mt-auto">
                                      {club.website && (
                                        <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-[#80A0A9] hover:text-[#80A0A9]/80 transition-colors" title="Website">
                                          <Globe className="w-5 h-5" />
                                        </a>
                                      )}
                                      {club.socialMediaLink && (
                                        <a href={club.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-[#80A0A9] hover:text-[#80A0A9]/80 transition-colors" title="Social Media">
                                          <LinkIcon className="w-5 h-5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="absolute top-4 right-4">
                                    <span className="inline-block bg-gradient-to-r from-[#80A0A9] to-[#80A0A9]/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow">{club.createdAt?.seconds ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : "New"}</span>
                                  </div>
                                </Link>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white border-[#80A0A9] h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                        <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white border-[#80A0A9] h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                      </Carousel>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 bg-[#E0D8C1]/20 rounded-lg border border-dashed border-[#80A0A9]/30">
                  <div className="text-center text-gray-600">
                    <Star className="w-8 h-8 mx-auto mb-2 text-[#80A0A9]/50" />
                    <p className="text-sm">No featured clubs at the moment. Check back soon for premium clubs!</p>
                  </div>
                </div>
              )}

              {/* Regular Clubs Grid */}
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-[#80A0A9] rounded-full"></div>
                  <h2 className="text-3xl font-bold font-headline text-center md:text-left text-gray-900">Discover the Community</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {paginatedClubs.map((club, idx) => (
                    <Link
                      key={club.documentId || idx}
                      href={`/clubs/${club.documentId}`}
                      className="group relative bg-white border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[#80A0A9]/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#80A0A9]"
                      tabIndex={0}
                      aria-label={`View details for ${club.clubName}`}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                        <div className="rounded-full border-4 border-white shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                          <Image src={club.logoUrl || "/placeholder.jpg"} alt={club.clubName} width={80} height={80} className="object-contain w-full h-full" />
                        </div>
                      </div>
                      <div className="mt-12 w-full flex flex-col items-center">
                        <h3 className="text-xl font-bold font-headline text-[#80A0A9] mb-1 text-center group-hover:underline transition-all">{club.clubName}</h3>
                        <div className="flex items-center gap-2 mb-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{club.city}, {club.country}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 text-center line-clamp-3">{club.description}</p>
                        <div className="flex gap-3 mt-auto">
                          {club.website && (
                            <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-[#80A0A9] hover:text-[#80A0A9]/80 transition-colors" title="Website">
                              <Globe className="w-5 h-5" />
                            </a>
                          )}
                          {club.socialMediaLink && (
                            <a href={club.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-[#80A0A9] hover:text-[#80A0A9]/80 transition-colors" title="Social Media">
                              <LinkIcon className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-block bg-gradient-to-r from-[#80A0A9] to-[#80A0A9]/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow">{club.createdAt?.seconds ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : "New"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                {paginatedClubs.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-lg">No clubs found on this page.</p>
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
                <PaginationContent className="bg-white border border-[#80A0A9]/30 rounded-lg p-1">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      className="text-[#80A0A9] hover:text-[#80A0A9]/80 hover:bg-[#80A0A9]/10"
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
                        className={`text-[#80A0A9] hover:text-[#80A0A9]/80 hover:bg-[#80A0A9]/10 ${
                          currentPage === page ? 'bg-[#80A0A9] text-white hover:bg-[#80A0A9]/90' : ''
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
                      className="text-[#80A0A9] hover:text-[#80A0A9]/80 hover:bg-[#80A0A9]/10"
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
        </div>
      </main>
      {/* Clubs Gallery Section */}
      <SimpleGallerySection title="Clubs Gallery" collectionName="gallery_clubs" max={12} />
    </div>
  )
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-12 text-gray-600">Loading...</div>}>
      <ClubsPageContent />
    </Suspense>
  );
} 