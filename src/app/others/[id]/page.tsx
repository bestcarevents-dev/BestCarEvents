"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Tag, Users, DollarSign, Clock, LinkIcon, Building2, Car, Phone, Mail, Globe, Shield, Star, Package, Palette, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface ServiceDetails {
  id: string;
  serviceName: string;
  serviceType: string;
  description: string;
  location: string;
  priceRange: string;
  imageUrls: string[];
  contactInfo: string;
  phoneNumber?: string;
  websiteUrl?: string;
  coverageArea?: string;
  businessHours?: string;
  specializations?: string;
  experience?: string;
  certifications?: string;
  rating?: number;
  featured?: boolean;
  status: string;
}

const getServiceTypeIcon = (serviceType: string) => {
  const type = serviceType.toLowerCase();
  if (type.includes('storage')) return Shield;
  if (type.includes('garage')) return Wrench;
  if (type.includes('parts')) return Package;
  if (type.includes('restoration')) return Car;
  if (type.includes('detailing')) return Palette;
  return Wrench;
};

export default function ServiceDetailsPage({ params }: { params: { id: string } }) {
    const [service, setService] = useState<ServiceDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchService = async () => {
            setLoading(true);
            const db = getFirestore(app);
            const ref = doc(db, 'others', params.id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setService({ id: snap.id, ...snap.data() } as ServiceDetails);
            } else {
                setService(null);
            }
            setLoading(false);
        };
        fetchService();
    }, [params.id]);

    if (loading) {
        return <div className="container mx-auto py-12 sm:py-24 text-center text-xl sm:text-2xl font-bold animate-pulse">Loading service details...</div>;
    }
    if (!service) {
        return <div className="container mx-auto py-12 sm:py-24 text-center text-destructive text-xl sm:text-2xl font-bold flex flex-col items-center"><Car className="w-8 h-8 sm:w-12 sm:h-12 mb-4 animate-spin" />Service not found.</div>;
    }

    const ServiceTypeIcon = getServiceTypeIcon(service.serviceType);

    return (
        <div className="container mx-auto px-4 py-6 sm:py-10 bg-white animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mb-6 sm:mb-10 group">
                <div className="relative w-full aspect-video bg-black">
                    {service.imageUrls && service.imageUrls.length > 0 ? (
                        <Image 
                            src={service.imageUrls[0]} 
                            alt={service.serviceName} 
                            fill 
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                            <ServiceTypeIcon className="w-24 h-24 text-white/50" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                <div className="absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-8 flex flex-col gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-headline text-white drop-shadow-lg animate-pop-in leading-tight">{service.serviceName}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-yellow-600 text-white animate-bounce-in text-xs sm:text-sm">{service.serviceType}</Badge>
                            {service.featured && (
                                <Badge className="bg-yellow-500 text-white animate-bounce-in text-xs sm:text-sm">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
                        {service.location && <span className="text-lg sm:text-xl font-mono font-bold text-yellow-600 drop-shadow-lg">{service.location}</span>}
                        <Button size="sm" className="mt-2 animate-pop w-fit" onClick={() => router.push('/others')}><ArrowLeft className="mr-2 w-4 h-4" />Back to Services</Button>
                    </div>
                </div>
            </div>

            {/* Quick Info Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10 animate-fade-in-up">
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                    <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Service Type</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{service.serviceType}</div>
                </div>
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                    <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Location</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{service.location}</div>
                </div>
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                    <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Price Range</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{service.priceRange}</div>
                </div>
                {service.rating && (
                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                        <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Rating</div>
                        <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{service.rating}/5</div>
                    </div>
                )}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Service Description</h2>
                            <div className="prose max-w-none text-base sm:text-lg text-gray-600 mb-2 whitespace-pre-line leading-relaxed">{service.description}</div>
                        </CardContent>
                    </Card>

                    {service.specializations && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Specializations</h2>
                                <div className="flex flex-wrap gap-2 sm:gap-4">
                                    {(Array.isArray(service.specializations)
                                      ? service.specializations
                                      : String(service.specializations)
                                          .split(/[\n,]+/)
                                          .map(s => s.trim())
                                          .filter(Boolean)
                                    ).map((spec: string, index: number) => (
                                        <span key={index} className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">{spec}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {service.certifications && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Certifications & Awards</h2>
                                <div className="prose max-w-none text-base sm:text-lg text-gray-600 mb-2 whitespace-pre-line leading-relaxed">{service.certifications}</div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Image Gallery */}
                    {service.imageUrls && service.imageUrls.length > 1 && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Gallery</h2>
                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {service.imageUrls.map((imageUrl, index) => (
                                            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                                <div className="p-2">
                                                    <div className="relative aspect-video overflow-hidden rounded-lg">
                                                        <Image
                                                            src={imageUrl}
                                                            alt={`${service.serviceName} - Image ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                                    <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 h-10 w-10 shadow-lg transition-all duration-200 hover:scale-110" />
                                </Carousel>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Quick Info Sidebar */}
                <div className="space-y-6 sm:space-y-8">
                    <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Contact Information</h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-yellow-600" />
                                    <a href={`mailto:${service.contactInfo}?subject=Inquiry about ${service.serviceName}`} className="text-yellow-600 underline break-all">{service.contactInfo}</a>
                                </div>
                                {service.phoneNumber && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-yellow-600" />
                                        <a href={`tel:${service.phoneNumber}`} className="text-gray-900">{service.phoneNumber}</a>
                                    </div>
                                )}
                                {service.websiteUrl && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-yellow-600" />
                                        <a href={service.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-600 underline break-all">{service.websiteUrl}</a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {service.businessHours && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Business Hours</h2>
                                <div className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                                    <p className="text-gray-600">{service.businessHours}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {service.coverageArea && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Coverage Area</h2>
                                <div className="flex items-start gap-2">
                                    <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                                    <p className="text-gray-600">{service.coverageArea}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {service.experience && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Experience</h2>
                                <div className="flex items-start gap-2">
                                    <Users className="w-4 h-4 text-yellow-600 mt-0.5" />
                                    <p className="text-gray-600">{service.experience}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Contact Buttons */}
                    <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Get in Touch</h2>
                            <div className="space-y-3">
                                <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                                    <a href={`mailto:${service.contactInfo}?subject=Inquiry about ${service.serviceName}`}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Email
                                    </a>
                                </Button>
                                {service.phoneNumber && (
                                    <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                                        <a href={`tel:${service.phoneNumber}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Call Now
                                        </a>
                                    </Button>
                                )}
                                {service.websiteUrl && (
                                    <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                                        <a href={service.websiteUrl} target="_blank" rel="noopener noreferrer">
                                            <Globe className="mr-2 h-4 w-4" />
                                            Visit Website
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 