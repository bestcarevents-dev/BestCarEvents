'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map, PlusCircle, Star, Settings, Wrench, Car, Package, Palette, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

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
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-gray-200 ${featured ? 'ring-2 ring-yellow-400 shadow-md' : 'hover:scale-105'}`}>
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={imageUrls && imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/400x250?text=Service+Image'} 
          alt={serviceName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-4 bg-white">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-headline font-bold text-lg text-gray-900 group-hover:text-yellow-600 transition-colors">
            {serviceName}
          </h3>
          {rating && (
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="ml-1">{rating}</span>
            </div>
          )}
        </div>
        
        <Badge variant="outline" className="mb-2 text-xs bg-gray-50 border-gray-300 text-gray-700">
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
          <Button asChild size="sm" className="flex-1 mr-2 bg-yellow-600 hover:bg-yellow-700 text-white">
            <Link href={`/others/${id}`}>
              View Details
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <a href={`mailto:${contactInfo}?subject=Inquiry about ${serviceName}`}>
              Contact
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function OthersPage() {
    const [services, setServices] = useState<ServiceCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [sortBy, setSortBy] = useState("name");

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Other Services</h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl">
                    Discover automotive services including storage, garages, parts, restoration, detailing, and more.
                    </p>
                </div>
                {currentUser ? (
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Link href="/advertise/others-listing" className="flex items-center">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Feature Service
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/others/register" className="flex items-center">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Register Service
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Feature Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Login Required</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center">
                          <p className="text-lg font-semibold mb-2 text-destructive">Please login to feature a service.</p>
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
                          Register Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Login Required</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center">
                          <p className="text-lg font-semibold mb-2 text-destructive">Please login to register a service.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input 
                placeholder="Search by service name, type..." 
                className="md:col-span-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedType} onValueChange={setSelectedType}>
                 <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
                }}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                         <div className="p-2 bg-yellow-100 rounded-full">
                           <Star className="w-6 h-6 text-yellow-600" />
                         </div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Services</h2>
                         <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                       </div>
                       
                       <div className="relative group">
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/50 via-yellow-50/50 to-yellow-100/50 rounded-3xl border-2 border-yellow-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-50/30 via-transparent to-yellow-50/30 rounded-3xl"></div>
                         <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-yellow-200 p-6 shadow-inner">
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
                             <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                             <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                           </Carousel>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                       <div className="text-center text-gray-600">
                         <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500/50" />
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
                           <div className="p-2 bg-gray-100 rounded-full">
                             <type.icon className="w-6 h-6 text-gray-600" />
                           </div>
                           <h2 className="text-2xl font-headline font-bold text-gray-900">{type.label}</h2>
                           <div className="flex-1 h-px bg-gradient-to-r from-gray-300/50 to-transparent"></div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {typeServices.map((service) => (
                             <ServiceCard key={service.id} {...service} />
                           ))}
                         </div>
                       </div>
                     );
                   })}

                   {/* All Other Services - Only show if there are services that don't fit into categories */}
                   {sortedServices.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-2 h-8 bg-gray-600 rounded-full"></div>
                         <h2 className="text-2xl font-headline font-bold text-gray-900">All Services</h2>
                         <div className="flex-1 h-px bg-gradient-to-r from-gray-600/50 to-transparent"></div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {sortedServices.map((service) => (
                            <ServiceCard key={service.id} {...service} />
                          ))}
                       </div>
                     </div>
                   )}
                   
                   {sortedServices.length === 0 && (
                     <div className="text-center py-12 text-gray-600">
                       <p className="text-lg">No services found.</p>
                       <p className="text-sm mt-2">Be the first to register a service in your area!</p>
                     </div>
                   )}
                 </>
                 )}
                 <div className="mt-12">
                    <Pagination>
                    <PaginationContent className="bg-white border border-gray-300 rounded-lg p-1">
                        <PaginationItem>
                        <PaginationPrevious href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50" />
                        </PaginationItem>
                        <PaginationItem>
                        <PaginationLink href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50">1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                        <PaginationLink href="#" isActive className="bg-yellow-600 text-white hover:bg-yellow-700">2</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                        <PaginationLink href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50">3</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                        <PaginationNext href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50" />
                        </PaginationItem>
                    </PaginationContent>
                    </Pagination>
                </div>
            </TabsContent>
          </Tabs>

        </div>
    </div>
  );
} 