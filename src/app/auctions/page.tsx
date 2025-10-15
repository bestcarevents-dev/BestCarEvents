'use client';
import CarCard from "@/components/car-card";
import FeaturedPlaceholderCard from "@/components/FeaturedPlaceholderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo, Suspense } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
 
import { useSearchParams } from "next/navigation";
import FreeCallout from "@/components/free-callout";
import FreeCalloutDynamic from "@/components/FreeCalloutDynamic";
import SimpleGallerySection from "@/components/SimpleGallerySection";
import { defaultPageContent, fetchPageHeader, type PageHeader } from "@/lib/pageContent";
import { useFormPreferences } from "@/hooks/useFormPreferences";

function AuctionsPageContent() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const searchParams = useSearchParams();
  const [header, setHeader] = useState<PageHeader>(defaultPageContent.auctions);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const auctionsPerPage = 12;
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedAuctionType, setSelectedAuctionType] = useState("all");
  const [sortBy, setSortBy] = useState("ending-soon");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPageHeader('auctions');
        setHeader(data);
      } catch {}
    })();
  }, []);

  // Initialize search from URL parameters
  useEffect(() => {
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const auctiontype = searchParams.get("auctiontype");
    
    if (search) {
      setSearchQuery(search);
    }
    
    if (city && city !== "all") {
      setSelectedCity(city);
    }
    
    if (auctiontype && auctiontype !== "all") {
      setSelectedAuctionType(auctiontype);
    }
  }, [searchParams]);

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

  // Filter and sort auctions
  const filteredAndSortedAuctions = useMemo(() => {
    let filtered = auctions.filter(auction => {
      // Date filtering: auctions have a single relevant date for visibility.
      // Keep auctions where endDate (if present) or startDate (fallback) is >= start of today.
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const parseDate = (d: any): Date | null => {
        if (!d) return null;
        return d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
      };
      const lastRelevantDate = parseDate(auction?.endDate) || parseDate(auction?.startDate);
      const isUpcomingOrOngoing = !lastRelevantDate || lastRelevantDate.getTime() >= startOfToday.getTime();
      const matchesSearch = searchQuery === "" || 
        auction.auctionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.auctionHouse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCity = selectedCity === "all" || 
        auction.city?.toLowerCase() === selectedCity.toLowerCase();
      
      const matchesState = selectedState === "all" || 
        auction.state?.toLowerCase() === selectedState.toLowerCase();
      
      const matchesCountry = selectedCountry === "all" || 
        auction.country?.toLowerCase() === selectedCountry.toLowerCase();
      
      const matchesAuctionType = selectedAuctionType === "all" || 
        auction.auctionType?.toLowerCase() === selectedAuctionType.toLowerCase();
      
      return isUpcomingOrOngoing && matchesSearch && matchesCity && matchesState && matchesCountry && matchesAuctionType;
    });

    // Sort auctions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          const endDateA = a.endDate?.seconds ? new Date(a.endDate.seconds * 1000) : new Date(a.endDate || 0);
          const endDateB = b.endDate?.seconds ? new Date(b.endDate.seconds * 1000) : new Date(b.endDate || 0);
          return endDateA.getTime() - endDateB.getTime();
        case "newly-listed":
          const startDateA = a.startDate?.seconds ? new Date(a.startDate.seconds * 1000) : new Date(a.startDate || 0);
          const startDateB = b.startDate?.seconds ? new Date(b.startDate.seconds * 1000) : new Date(b.startDate || 0);
          return startDateB.getTime() - startDateA.getTime();
        case "name-asc":
          return (a.auctionName || "").localeCompare(b.auctionName || "");
        case "name-desc":
          return (b.auctionName || "").localeCompare(a.auctionName || "");
        case "house-asc":
          return (a.auctionHouse || "").localeCompare(b.auctionHouse || "");
        case "house-desc":
          return (b.auctionHouse || "").localeCompare(a.auctionHouse || "");
        case "city-asc":
          return (a.city || "").localeCompare(b.city || "");
        case "city-desc":
          return (b.city || "").localeCompare(a.city || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [auctions, searchQuery, selectedCity, selectedState, selectedCountry, selectedAuctionType, sortBy]);

  // Separate featured and regular auctions
  const featuredAuctions = filteredAndSortedAuctions.filter(auction => auction.featured === true);
  const regularAuctions = filteredAndSortedAuctions.filter(auction => auction.featured !== true);

  // Pagination logic
  const totalPages = Math.ceil(regularAuctions.length / auctionsPerPage);
  const startIndex = (currentPage - 1) * auctionsPerPage;
  const endIndex = startIndex + auctionsPerPage;
  const paginatedAuctions = regularAuctions.slice(startIndex, endIndex);

  // Get unique filter options from auctions
  const sharedPrefs = useFormPreferences("shared");
  const cities = useMemo(() => {
    const set = new Set<string>();
    const extractCity = (value?: string | null) => {
      if (!value || typeof value !== 'string') return null;
      return value.split(',')[0]?.trim() || null;
    };
    auctions.forEach((auction) => {
      const c = (auction.city || extractCity(auction.location)) as string | null;
      if (c) set.add(c);
    });
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return list.length > 0 ? list : (sharedPrefs.data?.citiesWhitelist || []);
  }, [auctions, sharedPrefs.data?.citiesWhitelist]);

  const cityOptions = useMemo(() => {
    if (selectedCity !== 'all' && selectedCity && !cities.includes(selectedCity)) {
      return [selectedCity, ...cities];
    }
    return cities;
  }, [cities, selectedCity]);

  const states = useMemo(() => {
    const auctionStates = auctions
      .map(auction => auction.state)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return auctionStates;
  }, [auctions]);

  const countries = useMemo(() => {
    const auctionCountries = auctions
      .map(auction => auction.country)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return auctionCountries;
  }, [auctions]);

  const auctionTypes = useMemo(() => {
    const types = auctions
      .map(auction => auction.auctionType)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return types;
  }, [auctions]);

  const formatDate = (startDate: any) => {
    if (!startDate) return "TBD";
    const date = startDate.seconds ? new Date(startDate.seconds * 1000) : new Date(startDate);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedState("all");
    setSelectedCountry("all");
    setSelectedAuctionType("all");
    setSortBy("ending-soon");
    setCurrentPage(1);
    setShowFilters(false);
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
            <p className="mt-4 text-lg text-gray-700 max-w-3xl mx-auto md:mx-0">
              {header.description}
            </p>
          </div>
          {currentUser ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button asChild className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                <Link href="/auctions/submit" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Register Your Auction
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#80A0A9] text-[#80A0A9] hover:bg-[#80A0A9]/10 text-sm sm:text-base">
                <Link href="/advertise/auction-listing" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Feature Your Auction
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Register Your Auction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-red">You must be logged in to register your auction.</p>
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
                    Feature Your Auction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-red">You must be logged in to feature your auction.</p>
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
        <FreeCalloutDynamic section="auctions" />

        <div className="bg-[#E0D8C1]/30 p-6 rounded-lg border border-[#E0D8C1]/50 mb-8">
          {/* Search Bar - Always Visible */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input 
              placeholder="Search by auction name, house, city, state..." 
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="City: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any City</SelectItem>
                  {cityOptions.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="State: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any State</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
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
              <Select value={selectedAuctionType} onValueChange={setSelectedAuctionType}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="Type: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Type</SelectItem>
                  {auctionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="Sort by: Ending Soon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ending-soon">Ending Soon</SelectItem>
                  <SelectItem value="newly-listed">Newly Listed</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  <SelectItem value="house-asc">Auction House: A to Z</SelectItem>
                  <SelectItem value="house-desc">Auction House: Z to A</SelectItem>
                  <SelectItem value="city-asc">City: A to Z</SelectItem>
                  <SelectItem value="city-desc">City: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <PartnerAdRotator page="Auctions" maxVisible={4} />
        </div>

        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading auctions...</div>
        ) : filteredAndSortedAuctions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {searchQuery || selectedCity !== "all" || selectedState !== "all" || selectedCountry !== "all" || selectedAuctionType !== "all" ? "No auctions found matching your criteria." : "No auctions found."}
          </div>
        ) : (
          <>
            {/* Featured Auctions Grid */}
            {featuredAuctions.length > 0 ? (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                    <Star className="w-6 h-6 text-[#80A0A9]" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Auctions</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/30 via-[#80A0A9]/20 to-[#E0D8C1]/30 rounded-3xl border-2 border-[#80A0A9]/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/10 via-transparent to-[#E0D8C1]/10 rounded-3xl"></div>
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-[#80A0A9]/60 p-6 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {featuredAuctions.map((auction, index) => (
                        <div key={auction.documentId || index} className="relative group">
                          <CarCard
                            id={auction.documentId}
                            name={auction.auctionName || "Auction"}
                            price={`${auction.auctionHouse || "Auction House"}`}
                            location={`${auction.city}, ${auction.state}`}
                            image={(Array.isArray(auction.imageUrls) && auction.imageUrls.length > 0 ? auction.imageUrls[0] : auction.imageUrl) || "https://via.placeholder.com/600x400?text=No+Image"}
                            hint={auction.auctionType || "auction"}
                            type="auction"
                            featured={true}
                          />
                          <div className="absolute top-4 right-4 bg-[#F4F0E7]/95 border border-[#D9CEB6] text-[#1f1f1f] px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow">
                            <Clock className="w-4 h-4 text-[#7D8C91]" />
                            <span>{formatDate(auction.startDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <FeaturedPlaceholderCard 
                  title="This spot could be yours"
                  description="Feature your auction to appear here and reach serious buyers."
                  ctaHref="/advertise/auction-listing"
                  ctaText="Feature your auction"
                />
              </div>
            )}

            {/* Regular Auctions Grid */}
            {regularAuctions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-8 bg-[#80A0A9] rounded-full"></div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">All Auctions</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedAuctions.map((auction, index) => (
                    <div key={auction.documentId || index} className="relative group">
                      <CarCard
                        id={auction.documentId}
                        name={auction.auctionName || "Auction"}
                        price={`${auction.auctionHouse || "Auction House"}`}
                        location={`${auction.city}, ${auction.state}`}
                        image={(Array.isArray(auction.imageUrls) && auction.imageUrls.length > 0 ? auction.imageUrls[0] : auction.imageUrl) || "https://via.placeholder.com/600x400?text=No+Image"}
                        hint={auction.auctionType || "auction"}
                        type="auction"
                        featured={false}
                      />
                      <div className="absolute top-4 right-4 bg-[#F4F0E7]/95 border border-[#D9CEB6] text-[#1f1f1f] px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow">
                        <Clock className="w-4 h-4 text-[#7D8C91]" />
                        <span>{formatDate(auction.startDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {paginatedAuctions.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-lg">No auctions found on this page.</p>
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
      {/* Auctions Gallery Section */}
      <SimpleGallerySection title="Auctions Gallery" collectionName="gallery_auctions" max={12} />
    </div>
  );
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-12 text-gray-600">Loading...</div>}>
      <AuctionsPageContent />
    </Suspense>
  );
}
