'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map, PlusCircle, Star, Settings, Wrench, Car, Package, Palette, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import FreeCallout from "@/components/free-callout";
import { defaultPageContent, fetchPageHeader, type PageHeader } from "@/lib/pageContent";

interface ServiceCardProps {
  id: string;
  serviceName: string;
  serviceType: string;
  description: string;
  location: string;
  priceRange: string;
  imageUrls: string[];
  featured?: boolean;
  rating?: number;
  contactInfo: string;
  coverageArea?: string;
}

const ServiceCard = ({ id, serviceName, serviceType, description, location, priceRange, imageUrls, featured = false, rating, contactInfo, coverageArea }: ServiceCardProps) => {
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-gray-200 ${featured ? 'ring-2 ring-[#80A0A9] shadow-md' : 'hover:scale-105'}`}>
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={imageUrls && imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/400x250?text=Service+Image'} 
          alt={serviceName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-[#80A0A9] text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-4 bg-white">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-headline font-bold text-lg text-gray-900 group-hover:text-[#80A0A9] transition-colors">
            {serviceName}
          </h3>
          {rating && (
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 text-[#80A0A9] fill-current" />
              <span className="ml-1">{rating}</span>
            </div>
          )}
        </div>
        
        <Badge variant="outline" className="mb-2 text-xs bg-[#E0D8C1]/20 border-[#80A0A9]/30 text-[#80A0A9]">
          {serviceType}
        </Badge>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {description}
        </p>
        
        <div className="space-y-1 text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <Map className="w-4 h-4 mr-2 text-gray-400" />
            <span>{location}</span>
          </div>
          {coverageArea && (
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-gray-400" />
              <span>Coverage: {coverageArea}</span>
            </div>
          )}
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2 text-gray-400" />
            <span>{priceRange}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button asChild size="sm" className="flex-1 mr-2 bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white">
            <Link href={`/others/${id}`}>
              View Details
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-[#80A0A9]/50 text-[#80A0A9] hover:bg-[#80A0A9]/10">
            <a href={`mailto:${contactInfo}?subject=Inquiry about ${serviceName}`}>
              Contact
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

function OthersPageContent() {
    const [services, setServices] = useState<ServiceCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const searchParams = useSearchParams();
    const [header, setHeader] = useState<PageHeader>(defaultPageContent.others);
    const [currentPage, setCurrentPage] = useState(1);
    const servicesPerPage = 12;

    useEffect(() => {
      (async () => {
        try {
          const data = await fetchPageHeader('others');
          setHeader(data);
        } catch {}
      })();
    }, []);

    // Initialize search from URL parameters
    useEffect(() => {
      const search = searchParams.get("search");
      const servicetype = searchParams.get("servicetype");
      
      if (search) {
        setSearchTerm(search);
      }
      
      if (servicetype && servicetype !== "all") {
        setSelectedType(servicetype);
      }
    }, [searchParams]);

    useEffect(() => {
      const fetchServices = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const snapshot = await getDocs(collection(db, "others"));
        const data = snapshot.docs
          .map(doc => ({ 
            id: doc.id, 
            serviceName: doc.data().serviceName,
            serviceType: doc.data().serviceType,
            description: doc.data().description,
            location: doc.data().location,
            priceRange: doc.data().priceRange,
            imageUrls: doc.data().imageUrls || [],
            featured: doc.data().featured,
            rating: doc.data().rating,
            contactInfo: doc.data().contactInfo,
            coverageArea: doc.data().coverageArea,
            status: doc.data().status
          } as ServiceCardProps))
          .filter((service: any) => service.status === "approved");
        setServices(data);
        setLoading(false);
      };
      fetchServices();
    }, []);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }, []);

    // Separate featured and regular services
    const featuredServices = services.filter(service => service.featured === true);
    const regularServices = services.filter(service => service.featured !== true);

    // Filter and sort services
    const filteredServices = regularServices.filter(service => {
      const matchesSearch = searchTerm === "" || 
        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || 
        service.serviceType.toLowerCase().includes(selectedType.replace('-', ' ')) ||
        service.serviceType.toLowerCase() === selectedType;
      
      return matchesSearch && matchesType;
    });

    // Sort services
    const sortedServices = [...filteredServices].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.serviceName.localeCompare(b.serviceName);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price":
          // Simple price comparison - you might want to implement more sophisticated logic
          return a.priceRange.localeCompare(b.priceRange);
        default:
          return 0;
      }
    });

    // Pagination for regular services
    const totalPages = Math.ceil(sortedServices.length / servicesPerPage);
    const startIndex = (currentPage - 1) * servicesPerPage;
    const endIndex = startIndex + servicesPerPage;
    const paginatedServices = sortedServices.slice(startIndex, endIndex);

    // Group services by type for better organization
    const serviceTypes = [
      { key: 'car-storage', label: 'Car Storage', icon: Shield },
      { key: 'garage', label: 'Garage Services', icon: Wrench },
      { key: 'spare-parts', label: 'Spare Parts', icon: Package },
      { key: 'restoration', label: 'Restoration', icon: Car },
      { key: 'detailing', label: 'Detailing', icon: Palette },
      { key: 'wrapping', label: 'Wrapping & Vinyl', icon: Palette },
      { key: 'towing', label: 'Towing Services', icon: Wrench },
      { key: 'transport', label: 'Transport', icon: Car },
      { key: 'insurance', label: 'Insurance', icon: Shield },
      { key: 'finance', label: 'Finance', icon: Package },
      { key: 'consulting', label: 'Consulting', icon: Settings },
      { key: 'other', label: 'Other Services', icon: Settings },
    ];

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
              <Button asChild className="bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                <Link href="/others/register" className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  List Your Service
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#80A0A9] text-[#80A0A9] hover:bg-[#80A0A9]/10 text-sm sm:text-base">
                <Link href="/advertise/others-listing" className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Feature Your Service
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white text-sm sm:text-base">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    List Your Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to list your service.</p>
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
                    Feature Your Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Login Required</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-center">
                    <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to feature your service.</p>
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
                title="Post Your Services — Always Free"
                icon="sparkles"
                messages={[
                  "Posting all services is free.",
                  "Reach car enthusiasts — No fees, no subscription.",
                  "Register your service today at no cost.",
                ]}
                ctaHref="/others/register"
                ctaText="Register Service"
              />
            </div>

          <div className="bg-[#E0D8C1]/30 p-6 rounded-lg border border-[#E0D8C1]/50 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input 
                placeholder="Search by service name, type..." 
                className="md:col-span-2 bg-white border-[#80A0A9]/50 text-gray-900 placeholder:text-gray-500 focus:border-[#80A0A9]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedType} onValueChange={setSelectedType}>
                 <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                   <SelectValue placeholder="Service Type: Any" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">Any Type</SelectItem>
                    {serviceTypes.map(type => (
                      <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white border-[#80A0A9]/50 text-gray-900 focus:border-[#80A0A9]">
                  <SelectValue placeholder="Sort by: Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedType("all");
                  setSortBy("name");
                  setCurrentPage(1);
                }}
                variant="outline"
                className="border-[#80A0A9]/50 text-[#80A0A9] hover:bg-[#80A0A9]/10"
              >
                Clear
              </Button>
            </div>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsContent value="list">
                 {loading ? (
                   <div className="py-12 text-center text-gray-600">Loading services...</div>
                 ) : services.length === 0 ? (
                   <div className="py-12 text-center text-gray-600">No services found.</div>
                 ) : (
                 <>
                   <div className="mb-4">
                      <PartnerAdRotator page="Others" maxVisible={4} />
                   </div>

                   {/* Featured Services Carousel */}
                   {featuredServices.length > 0 ? (
                     <div className="mb-12">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                           <Star className="w-6 h-6 text-[#80A0A9]" />
                         </div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Services</h2>
                         <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                       </div>
                       
                       <div className="relative group">
                         <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/30 via-[#80A0A9]/20 to-[#E0D8C1]/30 rounded-3xl border-2 border-[#80A0A9]/40 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                         <div className="absolute inset-0 bg-gradient-to-r from-[#E0D8C1]/10 via-transparent to-[#E0D8C1]/10 rounded-3xl"></div>
                         <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-[#80A0A9]/60 p-6 shadow-inner">
                           <Carousel
                             opts={{
                               align: "start",
                               loop: false,
                             }}
                             className="w-full"
                           >
                             <CarouselContent className="-ml-2 md:-ml-4">
                               {featuredServices.map((service, index) => (
                                 <CarouselItem key={service.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                   <div className="p-2">
                                     <ServiceCard {...service} />
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
                         <p className="text-sm">No featured services at the moment. Check back soon for premium services!</p>
                       </div>
                     </div>
                   )}

                   {/* Service Categories */}
                   {serviceTypes.map(type => {
                     const typeServices = sortedServices.filter(service => 
                       service.serviceType.toLowerCase().includes(type.key.replace('-', ' ')) ||
                       service.serviceType.toLowerCase() === type.key
                     );
                     
                     if (typeServices.length === 0) return null;
                     
                     return (
                       <div key={type.key} className="mb-12">
                         <div className="flex items-center gap-3 mb-6">
                           <div className="p-2 bg-[#E0D8C1]/20 rounded-full">
                             <type.icon className="w-6 h-6 text-[#80A0A9]" />
                           </div>
                           <h2 className="text-2xl font-headline font-bold text-gray-900">{type.label}</h2>
                           <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {typeServices.map(service => (
                             <ServiceCard key={service.id} {...service} />
                           ))}
                         </div>
                       </div>
                     );
                   })}

                   {/* All Other Services (paginated) */}
                   {sortedServices.length > 0 && regularServices.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-2 h-8 bg-[#80A0A9] rounded-full"></div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">All Services</h2>
                         <div className="flex-1 h-px bg-gradient-to-r from-[#80A0A9]/50 to-transparent"></div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {paginatedServices.map((service) => (
                            <ServiceCard key={service.id} {...service} />
                          ))}
                       </div>
                       {paginatedServices.length === 0 && (
                         <div className="text-center py-12 text-gray-600">
                           <p className="text-lg">No services found on this page.</p>
                         </div>
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
                                     if (currentPage > 1) setCurrentPage(currentPage - 1);
                                   }}
                                 />
                               </PaginationItem>
                               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                 <PaginationItem key={page}>
                                   <PaginationLink
                                     href="#"
                                     className={`text-[#80A0A9] hover:text-[#80A0A9]/80 hover:bg-[#80A0A9]/10 ${currentPage === page ? 'bg-[#80A0A9] text-white hover:bg-[#80A0A9]/90' : ''}`}
                                     onClick={(e) => {
                                       e.preventDefault();
                                       setCurrentPage(page);
                                       window.scrollTo({ top: 0, behavior: 'smooth' });
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
                                     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                   }}
                                 />
                               </PaginationItem>
                             </PaginationContent>
                           </Pagination>
                         </div>
                       )}
                     </div>
                   )}
                   
                   {sortedServices.length === 0 && featuredServices.length === 0 && (
                     <div className="text-center py-12 text-gray-600">
                       <p className="text-lg">No services found.</p>
                       <p className="text-sm mt-2">Be the first to register a service in your area!</p>
                     </div>
                   )}
                 </>
                 )}
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}

export default function OthersPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-12 text-gray-600">Loading...</div>}>
      <OthersPageContent />
    </Suspense>
  );
} 