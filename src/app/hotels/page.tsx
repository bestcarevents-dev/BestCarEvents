'use client';
import { useEffect, useState, useMemo, Suspense } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FeaturedPlaceholderCard from "@/components/FeaturedPlaceholderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
 
import { useSearchParams } from "next/navigation";
import FreeCallout from "@/components/free-callout";
import FreeCalloutDynamic from "@/components/FreeCalloutDynamic";
import SimpleGallerySection from "@/components/SimpleGallerySection";
import { defaultPageContent, fetchPageHeader, type PageHeader } from "@/lib/pageContent";
import { useFormPreferences } from "@/hooks/useFormPreferences";

function CarHotelsPageContent() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const searchParams = useSearchParams();
  const [header, setHeader] = useState<PageHeader>(defaultPageContent.hotels);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const hotelsPerPage = 12;
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedStorageType, setSelectedStorageType] = useState("all");
  const [selectedFeature, setSelectedFeature] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPageHeader('hotels');
        setHeader(data);
      } catch {}
    })();
  }, []);

  // Initialize search from URL parameters
  useEffect(() => {
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const storagetype = searchParams.get("storagetype");
    
    if (search) {
      setSearchQuery(search);
    }
    
    if (city && city !== "all") {
      setSelectedCity(city);
    }
    
    if (storagetype && storagetype !== "all") {
      setSelectedStorageType(storagetype);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, "hotels"));
      const data = snapshot.docs.map(doc => ({ ...doc.data(), documentId: doc.id }));
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

  // Filter and sort hotels
  const filteredAndSortedHotels = useMemo(() => {
    const extractCity = (value?: string | null) => {
      if (!value || typeof value !== 'string') return "";
      return value.split(',')[0]?.trim() || "";
    };
    let filtered = hotels.filter(hotel => {
      const matchesSearch = searchQuery === "" || 
        hotel.hotelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const hotelCity = (hotel.city || extractCity(hotel.location || "")).toLowerCase();
      const matchesCity = selectedCity === "all" || hotelCity === selectedCity.toLowerCase();
      
      const matchesState = selectedState === "all" || 
        hotel.state?.toLowerCase() === selectedState.toLowerCase();
      
      const matchesStorageType = selectedStorageType === "all" || 
        hotel.storageType?.toLowerCase() === selectedStorageType.toLowerCase();
      
      const matchesFeature = selectedFeature === "all" || 
        hotel.features?.some((feature: string) => 
          feature.toLowerCase().includes(selectedFeature.toLowerCase())
        );
      
      return matchesSearch && matchesCity && matchesState && matchesStorageType && matchesFeature;
    });

    // Sort hotels
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
          return (a.hotelName || "").localeCompare(b.hotelName || "");
        case "name-desc":
          return (b.hotelName || "").localeCompare(a.hotelName || "");
        case "city-asc":
          return (a.city || "").localeCompare(b.city || "");
        case "city-desc":
          return (b.city || "").localeCompare(a.city || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [hotels, searchQuery, selectedCity, selectedState, selectedStorageType, selectedFeature, sortBy]);

  // Separate featured and regular hotels
  const featuredHotels = filteredAndSortedHotels.filter(hotel => hotel.featured === true);
  const regularHotels = filteredAndSortedHotels.filter(hotel => hotel.featured !== true);

  // Pagination logic
  const totalPages = Math.ceil(regularHotels.length / hotelsPerPage);
  const startIndex = (currentPage - 1) * hotelsPerPage;
  const endIndex = startIndex + hotelsPerPage;
  const paginatedHotels = regularHotels.slice(startIndex, endIndex);

  // Get unique filter options from hotels
  const sharedPrefs = useFormPreferences("shared");
  const cities = useMemo(() => {
    const set = new Set<string>();
    const extractCity = (value?: string | null) => {
      if (!value || typeof value !== 'string') return null;
      return value.split(',')[0]?.trim() || null;
    };
    hotels.forEach((hotel) => {
      const c = (hotel.city || extractCity(hotel.location)) as string | null;
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [hotels]);

  const cityOptions = useMemo(() => {
    const base = (cities && cities.length > 0) ? cities : (sharedPrefs.data?.citiesWhitelist || []);
    if (selectedCity !== 'all' && selectedCity && !base.includes(selectedCity)) {
      return [selectedCity, ...base];
    }
    return base;
  }, [cities, selectedCity, sharedPrefs.data?.citiesWhitelist]);

  const states = useMemo(() => {
    const hotelStates = hotels
      .map(hotel => hotel.state)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return hotelStates;
  }, [hotels]);

  const storageTypes = useMemo(() => {
    const types = hotels
      .map(hotel => hotel.storageType)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return types;
  }, [hotels]);

  const allFeatures = useMemo(() => {
    const features = new Set<string>();
    hotels.forEach(hotel => {
      if (hotel.features && Array.isArray(hotel.features)) {
        hotel.features.forEach((feature: string) => features.add(feature));
      }
    });
    return Array.from(features).sort();
  }, [hotels]);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedState("all");
    setSelectedStorageType("all");
    setSelectedFeature("all");
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
      <div className="container mx-auto px-4 py-8">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="text-center md:text-left md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">{header.title}</h1>
            <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto md:mx-0">
              {header.description}
           </p>
          </div>
          {currentUser ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button asChild className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                  <Link href="/hotels/list" className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      List Your Hotel
                  </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#80A0A9] text-[#80A0A9] hover:bg-[#80A0A9]/10 text-sm sm:text-base">
                  <Link href="/advertise/hotel-listing" className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Feature Your Hotel
                  </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    List Your Hotel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-red">You must be logged in to list your hotel.</p>
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
                    Feature Your Hotel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-red">You must be logged in to feature your hotel.</p>
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
        <FreeCalloutDynamic section="hotels" />

        <div className="bg-[#E0D8C1]/30 p-6 rounded-lg border border-[#E0D8C1]/50 mb-8">
          {/* Search Bar - Always Visible */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input 
              placeholder="Search by hotel name, city, state..." 
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
              <Select value={selectedStorageType} onValueChange={setSelectedStorageType}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="Storage: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Storage Type</SelectItem>
                  {storageTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="Feature: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Feature</SelectItem>
                  {allFeatures.map((feature) => (
                    <SelectItem key={feature} value={feature}>
                      {feature}
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

        {/* Added Text */}
        <div className="mb-4">
          <PartnerAdRotator page="Car Hotels" maxVisible={4} />
        </div>

        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading hotels...</div>
        ) : filteredAndSortedHotels.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {searchQuery || selectedCity !== "all" || selectedState !== "all" || selectedStorageType !== "all" || selectedFeature !== "all" ? "No hotels found matching your criteria." : "No hotels found."}
          </div>
        ) : (
          <>
            {/* Featured Hotels Grid */}
            {featuredHotels.length > 0 ? (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                    <Star className="w-6 h-6 text-[#80A0A9]" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Hotels</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/30 via-[#80A0A9]/20 to-[#E0D8C1]/30 rounded-3xl border-2 border-[#80A0A9]/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/10 via-transparent to-[#E0D8C1]/10 rounded-3xl"></div>
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-[#80A0A9]/60 p-6 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {featuredHotels.map((hotel, index) => (
                        <Card key={hotel.documentId || index} className="flex flex-col h-full bg-white border border-gray-200">
                          <CardHeader className="p-0 relative">
                            <Link href={`/hotels/${hotel.documentId}`} className="block relative aspect-video">
                              <Image src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} alt={hotel.hotelName} layout="fill" objectFit="cover" data-ai-hint={hotel.hotelName}/>
                            </Link>
                          </CardHeader>
                          <CardContent className="p-6 flex-grow">
                            <CardTitle className="font-headline text-gray-900 notranslate" translate="no" data-no-translate>
                              <Link href={`/hotels/${hotel.documentId}`} className="hover:text-[#80A0A9] transition-colors notranslate">{hotel.hotelName}</Link>
                            </CardTitle>
                            <CardDescription className="text-gray-600">{[hotel.city, hotel.state].filter(Boolean).join(', ')}</CardDescription>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                    <Star className="w-6 h-6 text-[#80A0A9]" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Hotels</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/30 via-[#80A0A9]/20 to-[#E0D8C1]/30 rounded-3xl border-2 border-[#80A0A9]/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/10 via-transparent to-[#E0D8C1]/10 rounded-3xl"></div>
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-[#80A0A9]/60 p-6 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <FeaturedPlaceholderCard 
                        title="This spot could be yours"
                        description="Feature your car hotel to appear here and get more bookings."
                        ctaHref="/advertise/hotel-listing"
                        ctaText="Feature your hotel"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Hotels Grid */}
            {regularHotels.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-8 bg-[#80A0A9] rounded-full"></div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">All Hotels</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedHotels.map(hotel => (
                    <Card key={hotel.documentId} className="flex flex-col bg-white border border-gray-200">
                      <CardHeader className="p-0 relative">
                        <Link href={`/hotels/${hotel.documentId}`} className="block relative aspect-video">
                          <Image src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} alt={hotel.hotelName} layout="fill" objectFit="cover" data-ai-hint={hotel.hotelName}/>
                        </Link>
                      </CardHeader>
                      <CardContent className="p-6 flex-grow">
                        <CardTitle className="font-headline text-gray-900 notranslate" translate="no" data-no-translate>
                          <Link href={`/hotels/${hotel.documentId}`} className="hover:text-[#80A0A9] transition-colors notranslate">{hotel.hotelName}</Link>
                        </CardTitle>
                        <CardDescription className="text-gray-600">{[hotel.city, hotel.state].filter(Boolean).join(', ')}</CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {paginatedHotels.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-lg">No hotels found on this page.</p>
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
      {/* Hotels Gallery Section */}
      <SimpleGallerySection title="Hotels Gallery" collectionName="gallery_hotels" max={12} />
    </div>
  );
}

export default function CarHotelsPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-12 text-gray-600">Loading...</div>}>
      <CarHotelsPageContent />
    </Suspense>
  );
}
