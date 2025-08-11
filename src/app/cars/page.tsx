'use client';
import { useEffect, useState, useMemo, Suspense } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { useSearchParams } from "next/navigation";
import FreeCallout from "@/components/free-callout";
import SimpleGallerySection from "@/components/SimpleGallerySection";
import { getFirestore as getFirestoreClient, doc, getDoc } from "firebase/firestore";

function CarsPageContent() {
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [isFreeCarListing, setIsFreeCarListing] = useState<boolean>(false);
    const searchParams = useSearchParams();
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const carsPerPage = 12;
    
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMake, setSelectedMake] = useState("all");
    const [selectedBodyStyle, setSelectedBodyStyle] = useState("all");
    const [selectedTransmission, setSelectedTransmission] = useState("all");
    const [selectedDrivetrain, setSelectedDrivetrain] = useState("all");
    const [selectedPriceRange, setSelectedPriceRange] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [showFilters, setShowFilters] = useState(false);

    // Initialize search from URL parameters
    useEffect(() => {
        const search = searchParams.get("search");
        const make = searchParams.get("make");
        const bodystyle = searchParams.get("bodystyle");
        
        if (search) {
            setSearchQuery(search);
        }
        
        if (make && make !== "all") {
            setSelectedMake(make);
        }
        
        if (bodystyle && bodystyle !== "all") {
            setSelectedBodyStyle(bodystyle);
        }
    }, [searchParams]);

    useEffect(() => {
      const fetchCars = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const carsQuery = query(collection(db, "cars"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(carsQuery);
        const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
        setCars(data);
        setLoading(false);
      };
      fetchCars();
    }, []);

    // Fetch settings to determine if car listing is free
    useEffect(() => {
      const fetchSettings = async () => {
        try {
          const db = getFirestoreClient(app);
          const settingsRef = doc(db, "settings", "carlisting");
          const snap = await getDoc(settingsRef);
          if (snap.exists()) {
            setIsFreeCarListing(Boolean(snap.data()?.isFree));
          }
        } catch (e) {
          setIsFreeCarListing(false);
        }
      };
      fetchSettings();
    }, []);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }, []);

    // Filter and sort cars
    const filteredAndSortedCars = useMemo(() => {
      let filtered = cars.filter(car => {
        const matchesSearch = searchQuery === "" || 
          car.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          car.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          car.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          car.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesMake = selectedMake === "all" || 
          car.make?.toLowerCase() === selectedMake.toLowerCase();
        
        const matchesBodyStyle = selectedBodyStyle === "all" || 
          car.bodyStyle?.toLowerCase().includes(selectedBodyStyle.toLowerCase());
        
        const matchesTransmission = selectedTransmission === "all" || 
          car.transmission?.toLowerCase() === selectedTransmission.toLowerCase();
        
        const matchesDrivetrain = selectedDrivetrain === "all" || 
          car.drivetrain?.toLowerCase() === selectedDrivetrain.toLowerCase();
        
        const matchesPriceRange = selectedPriceRange === "all" || 
          (selectedPriceRange === "under-10k" && parseFloat(car.price) < 10000) ||
          (selectedPriceRange === "10k-25k" && parseFloat(car.price) >= 10000 && parseFloat(car.price) < 25000) ||
          (selectedPriceRange === "25k-50k" && parseFloat(car.price) >= 25000 && parseFloat(car.price) < 50000) ||
          (selectedPriceRange === "50k-100k" && parseFloat(car.price) >= 50000 && parseFloat(car.price) < 100000) ||
          (selectedPriceRange === "over-100k" && parseFloat(car.price) >= 100000);
        
        return matchesSearch && matchesMake && matchesBodyStyle && matchesTransmission && matchesDrivetrain && matchesPriceRange;
      });

      // Sort cars
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
          case "price-asc":
            return parseFloat(a.price || "0") - parseFloat(b.price || "0");
          case "price-desc":
            return parseFloat(b.price || "0") - parseFloat(a.price || "0");
          case "mileage-asc":
            return (a.mileage || 0) - (b.mileage || 0);
          case "mileage-desc":
            return (b.mileage || 0) - (a.mileage || 0);
          case "year-desc":
            return (b.year || 0) - (a.year || 0);
          case "year-asc":
            return (a.year || 0) - (b.year || 0);
          default:
            return 0;
        }
      });

      return filtered;
    }, [cars, searchQuery, selectedMake, selectedBodyStyle, selectedTransmission, selectedDrivetrain, selectedPriceRange, sortBy]);

    // Separate featured and regular cars
    const featuredCars = filteredAndSortedCars.filter(car => car.featured === true);
    const regularCars = filteredAndSortedCars.filter(car => car.featured !== true);

    // Pagination logic
    const totalPages = Math.ceil(regularCars.length / carsPerPage);
    const startIndex = (currentPage - 1) * carsPerPage;
    const endIndex = startIndex + carsPerPage;
    const paginatedCars = regularCars.slice(startIndex, endIndex);

    // Get unique filter options from cars
    const makes = useMemo(() => {
      const carMakes = cars
        .map(car => car.make)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
      return carMakes;
    }, [cars]);

    const bodyStyles = useMemo(() => {
      const styles = cars
        .map(car => car.bodyStyle)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
      return styles;
    }, [cars]);

    const handleSearch = () => {
      setCurrentPage(1);
    };

    const handleResetFilters = () => {
      setSearchQuery("");
      setSelectedMake("all");
      setSelectedBodyStyle("all");
      setSelectedTransmission("all");
      setSelectedDrivetrain("all");
      setSelectedPriceRange("all");
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
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Cars for Sale</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto md:mx-0">
              Browse thousands of unique cars curated by enthusiasts and trusted sellers. Refine by make, body style, year, and price to find your perfect match—whether you’re chasing a weekend classic or your next daily driver.
            </p>
          </div>
          {currentUser ? (
            <Button asChild>
              <Link href="/cars/sell" className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Sell Your Car
              </Link>
            </Button>
          ) : (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Sell Your Car
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full">
                <DialogHeader>
                  <DialogTitle>Login Required</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                  <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to post a listing.</p>
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
        {isFreeCarListing && (
          <div className="mb-8">
            <FreeCallout
              title="List Your Car — First 2 Months Free"
              icon="sparkles"
              messages={[
                "Sell smarter. Pay nothing for the first 60 days.",
                "Launch offer: List for free for the first two months.",
                "Zero listing fees for 60 days — Get maximum exposure.",
              ]}
            />
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          {/* Search Bar - Always Visible */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input 
              placeholder="Search by make, model, location..." 
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Make: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Make</SelectItem>
                  {makes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedBodyStyle} onValueChange={setSelectedBodyStyle}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Body: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Body Style</SelectItem>
                  {bodyStyles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Transmission: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Transmission</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDrivetrain} onValueChange={setSelectedDrivetrain}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Drivetrain: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Drivetrain</SelectItem>
                  <SelectItem value="fwd">FWD</SelectItem>
                  <SelectItem value="rwd">RWD</SelectItem>
                  <SelectItem value="awd">AWD</SelectItem>
                  <SelectItem value="4wd">4WD</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Price: Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="under-10k">Under 10,000</SelectItem>
                  <SelectItem value="10k-25k">10,000 - 25,000</SelectItem>
                  <SelectItem value="25k-50k">25,000 - 50,000</SelectItem>
                  <SelectItem value="50k-100k">50,000 - 100,000</SelectItem>
                  <SelectItem value="over-100k">Over 100,000</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Sort by: Newest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                  <SelectItem value="mileage-desc">Mileage: High to Low</SelectItem>
                  <SelectItem value="year-desc">Year: Newest First</SelectItem>
                  <SelectItem value="year-asc">Year: Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <PartnerAdRotator page="Cars for sale" maxVisible={4} />
        </div>

        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading...</div>
        ) : filteredAndSortedCars.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {searchQuery || selectedMake !== "all" || selectedBodyStyle !== "all" || selectedTransmission !== "all" || selectedDrivetrain !== "all" || selectedPriceRange !== "all" ? "No cars found matching your criteria." : "No cars found."}
          </div>
        ) : (
          <>
            {/* Featured Cars Section */}
            {featuredCars.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-400/10 rounded-full">
                    <span className="text-yellow-500 font-bold text-sm">★</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Cars</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {featuredCars.map((car, index) => (
                    <CarCard
                      key={car.documentId || index}
                      id={car.documentId}
                      name={car.make && car.model ? `${car.year} ${car.make} ${car.model}` : car.name || "Car"}
                      price={car.price && car.currency ? `${car.currency} ${car.price}` : "N/A"}
                      location={car.location || ""}
                      image={car.images && car.images[0] ? car.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
                      hint={car.hint || car.make || "car"}
                      featured={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Cars Grid */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-yellow-600 rounded-full"></div>
                <h2 className="text-2xl font-headline font-bold text-gray-900">All Cars</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-600/50 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedCars.map((car, index) => (
                  <CarCard
                    key={car.documentId || index}
                    id={car.documentId}
                    name={car.make && car.model ? `${car.year} ${car.make} ${car.model}` : car.name || "Car"}
                    price={car.price && car.currency ? `${car.currency} ${car.price}` : "N/A"}
                    location={car.location || ""}
                    image={car.images && car.images[0] ? car.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
                    hint={car.hint || car.make || "car"}
                    featured={false}
                  />
                ))}
              </div>
              {paginatedCars.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg">No cars found on this page.</p>
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
      </div>
      {/* Cars Gallery Section */}
      <SimpleGallerySection title="Cars Gallery" collectionName="gallery_cars" max={12} />
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-12 text-gray-600">Loading...</div>}>
      <CarsPageContent />
    </Suspense>
  );
}
