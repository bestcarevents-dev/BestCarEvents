"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeCheck, Trophy, Group, Clock, Star, Map, Shield, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";
import HeroSlider from '@/components/hero-slider';
import EventListItem from '@/components/event-list-item';
import FeaturedCarCard from '@/components/featured-car-card';
import CarCard from '@/components/car-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import NewsletterSubscribe from '@/components/NewsletterSubscribe';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import Image from 'next/image';
import { Globe, Users, Link as LinkIcon } from 'lucide-react';
import HomepageAdCarousel from "@/components/HomepageAdCarousel";

type CarData = {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  price?: string;
  currency?: string;
  mileage?: number;
  transmission?: string;
  engine?: string;
  location?: string;
  images?: string[];
  listing_type?: string;
  createdAt?: any;
};

type EventData = {
  id: string;
  eventName?: string;
  eventDate?: any;
  location?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  hint?: string;
  feature_type?: string;
  status?: string;
  createdAt?: any;
};

type AuctionData = {
  id: string;
  auctionName?: string;
  auctionHouse?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate?: any;
  endDate?: any;
  imageUrl?: string;
  auctionType?: string;
  featured?: boolean;
  status?: string;
  createdAt?: any;
};

type HotelData = {
  id: string;
  hotelName?: string;
  city?: string;
  state?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  features?: string[];
  listing_type?: string;
  status?: string;
  createdAt?: any;
};

type ClubData = {
  id: string;
  clubName?: string;
  city?: string;
  country?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  socialMediaLink?: string;
  listing_type?: string;
  status?: string;
  createdAt?: any;
};

type OtherServiceData = {
  id: string;
  serviceName?: string;
  serviceType?: string;
  description?: string;
  location?: string;
  priceRange?: string;
  imageUrls?: string[];
  featured?: boolean;
  rating?: number;
  contactInfo?: string;
  coverageArea?: string;
  status?: string;
  createdAt?: any;
};

const ValueProposition = () => {
  return (
    <div className="bg-white">
        <div className="container mx-auto px-4 py-20">
             <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-gray-900">A Community Built for Car Lovers</h2>
                <p className="mt-4 text-lg text-gray-600">We are more than a marketplace. We are a global community of enthusiasts, collectors, and connoisseurs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                        <BadgeCheck className="h-8 w-8 text-yellow-600"/>
                    </div>
                    <h3 className="text-xl font-headline font-semibold text-gray-900">Curated Marketplace</h3>
                    <p className="mt-2 text-gray-600">Access a curated marketplace of the world's most desirable vehicles.</p>
                </div>
                <div className="flex flex-col items-center">
                     <div className="flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                        <Trophy className="h-8 w-8 text-yellow-600"/>
                    </div>
                    <h3 className="text-xl font-headline font-semibold text-gray-900">Verified & Trusted</h3>
                    <p className="mt-2 text-gray-600">Connect with verified enthusiasts, collectors, and event organizers.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                        <Group className="h-8 w-8 text-yellow-600"/>
                    </div>
                    <h3 className="text-xl font-headline font-semibold text-gray-900">Premier Experiences</h3>
                    <p className="mt-2 text-gray-600">Discover and attend the most prestigious automotive events.</p>
                </div>
            </div>
            
            {/* Partner Ads Section */}
            <div className="mt-20">
                <HomepageAdCarousel />
            </div>
        </div>
    </div>
  );
};

const FeaturedCarsSection = () => {
    const [featuredCars, setFeaturedCars] = useState<CarData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        const fetchFeaturedCars = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);
                
                // Fetch all cars
                const carsQuery = query(
                    collection(db, "cars"), 
                    orderBy("createdAt", "desc")
                );
                const carsSnapshot = await getDocs(carsQuery);
                const allCars = carsSnapshot.docs
                    .map(doc => ({ 
                        id: doc.id,
                        ...doc.data() 
                    } as CarData));

                // Separate exclusive banner cars and normal cars
                const exclusiveCars = allCars.filter(car => car.listing_type === "exclusiveBanner");
                const normalCars = allCars.filter(car => car.listing_type !== "exclusiveBanner");

                let finalCars: CarData[] = [];

                if (exclusiveCars.length === 0) {
                    // Case 1: No exclusive banner cars - show 2 random normal cars
                    finalCars = normalCars.slice(0, 2);
                } else if (exclusiveCars.length === 1) {
                    // Case 2: 1 exclusive banner car - show 1 exclusive + 1 normal car
                    finalCars = [exclusiveCars[0], ...normalCars.slice(0, 1)];
                } else if (exclusiveCars.length === 2) {
                    // Case 3: 2 exclusive banner cars - show only the 2 exclusive cars
                    finalCars = exclusiveCars.slice(0, 2);
                } else {
                    // Case 4: 2+ exclusive banner cars - show all exclusive cars in carousel
                    finalCars = exclusiveCars;
                }

                setFeaturedCars(finalCars);
            } catch (error) {
                console.error("Error fetching featured cars:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeaturedCars();
    }, []);

    // Auto-rotation effect - only for case 4 (2+ exclusive cars)
    useEffect(() => {
        if (!isAutoPlaying || featuredCars.length <= 2) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredCars.length / 2));
        }, 2000); // Change every 2 seconds

        return () => clearInterval(interval);
    }, [isAutoPlaying, featuredCars.length]);

    const nextSlide = () => {
        if (featuredCars.length <= 2) return;
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredCars.length / 2));
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const prevSlide = () => {
        if (featuredCars.length <= 2) return;
        setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredCars.length / 2)) % Math.ceil(featuredCars.length / 2));
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToSlide = (index: number) => {
        if (featuredCars.length <= 2) return;
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const totalSlides = Math.ceil(featuredCars.length / 2);
    const isCarousel = featuredCars.length > 2;

    return (
        <section className="py-20 sm:py-28 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">Featured Cars</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Explore a selection of exceptional vehicles from our curated marketplace.</p>
                </div>
                {loading ? (
                    <div className="text-center text-lg py-12 text-gray-600">Loading featured cars...</div>
                ) : featuredCars.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                        <p className="text-lg">No cars available at the moment.</p>
                        <p className="text-sm mt-2">Check back soon for new listings.</p>
                    </div>
                ) : (
                    <div className="relative max-w-5xl mx-auto">
                        {/* Carousel Container */}
                        <div className="relative overflow-hidden">
                            <div 
                                className="flex transition-transform duration-700 ease-in-out"
                                style={{
                                    transform: isCarousel ? `translateX(-${currentSlide * 100}%)` : 'none',
                                    width: isCarousel ? `${totalSlides * 100}%` : '100%'
                                }}
                            >
                                {isCarousel ? (
                                    // Carousel mode - show 2 cars per slide
                                    Array.from({ length: totalSlides }, (_, slideIndex) => (
                                        <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                                            <div className="space-y-8">
                                                {featuredCars.slice(slideIndex * 2, slideIndex * 2 + 2).map((car) => (
                                                    <FeaturedCarCard 
                                                        key={car.id} 
                                                        name={car.make && car.model ? `${car.year} ${car.make} ${car.model}` : "Car"}
                                                        year={car.year?.toString() || ""}
                                                        price={car.price && car.currency ? `${car.currency} ${car.price}` : "N/A"}
                                                        image={car.images && car.images[0] ? car.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
                                                        hint={car.make?.toLowerCase() || "car"}
                                                        featured={car.listing_type === "exclusiveBanner"}
                                                        specs={[
                                                            { name: "Mileage", value: car.mileage ? `${car.mileage.toLocaleString()} km` : "N/A" },
                                                            { name: "Transmission", value: car.transmission || "N/A" },
                                                            { name: "Engine", value: car.engine || "N/A" }
                                                        ]}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Normal mode - show all cars (max 2)
                                    <div className="w-full px-4">
                                        <div className="space-y-8">
                                            {featuredCars.map((car) => (
                                                <FeaturedCarCard 
                                                    key={car.id} 
                                                    name={car.make && car.model ? `${car.year} ${car.make} ${car.model}` : "Car"}
                                                    year={car.year?.toString() || ""}
                                                    price={car.price && car.currency ? `${car.currency} ${car.price}` : "N/A"}
                                                    image={car.images && car.images[0] ? car.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
                                                    hint={car.make?.toLowerCase() || "car"}
                                                    featured={car.listing_type === "exclusiveBanner"}
                                                    specs={[
                                                        { name: "Mileage", value: car.mileage ? `${car.mileage.toLocaleString()} km` : "N/A" },
                                                        { name: "Transmission", value: car.transmission || "N/A" },
                                                        { name: "Engine", value: car.engine || "N/A" }
                                                    ]}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Controls - Only show for carousel */}
                        {isCarousel && (
                            <>
                                {/* Previous/Next Buttons */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-200 shadow-lg"
                                    onClick={prevSlide}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-200 shadow-lg"
                                    onClick={nextSlide}
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>

                                {/* Dots Indicator */}
                                <div className="flex justify-center mt-8 space-x-2">
                                    {Array.from({ length: totalSlides }, (_, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            size="icon"
                                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                                index === currentSlide 
                                                    ? 'bg-primary scale-125' 
                                                    : 'bg-border hover:bg-border/80'
                                            }`}
                                            onClick={() => goToSlide(index)}
                                        >
                                            <Circle className="w-2 h-2" />
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                <div className="text-center mt-16">
                    <Button size="lg" asChild className="font-bold rounded-full">
                        <Link href="/cars">View Marketplace <ArrowRight className="w-5 h-5 ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};

const FeaturedEventsSection = () => {
  const [featuredEvents, setFeaturedEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        
        // Fetch all approved events
        const eventsQuery = query(
          collection(db, "events"), 
          orderBy("eventDate", "asc")
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const allEvents = eventsSnapshot.docs
          .map(doc => ({ 
            id: doc.id,
            ...doc.data() 
          } as EventData))
          .filter(event => event.status === "approved");

        // Separate featured events and normal events
        const featuredEvents = allEvents.filter(event => event.feature_type === "featured");
        const normalEvents = allEvents.filter(event => event.feature_type !== "featured");

        let finalEvents: EventData[] = [];

        if (featuredEvents.length === 0) {
          // Case 1: No featured events - show 3 random normal events
          finalEvents = normalEvents.slice(0, 3);
        } else if (featuredEvents.length === 1) {
          // Case 2: 1 featured event - show 1 featured + 2 normal events
          finalEvents = [featuredEvents[0], ...normalEvents.slice(0, 2)];
        } else if (featuredEvents.length === 2) {
          // Case 3: 2 featured events - show 2 featured + 1 normal event
          finalEvents = [featuredEvents[0], featuredEvents[1], ...normalEvents.slice(0, 1)];
        } else if (featuredEvents.length === 3) {
          // Case 4: 3 featured events - show only the 3 featured events
          finalEvents = featuredEvents.slice(0, 3);
        } else {
          // Case 5: 3+ featured events - show all featured events in carousel
          finalEvents = featuredEvents;
        }

        setFeaturedEvents(finalEvents);
      } catch (error) {
        console.error("Error fetching featured events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedEvents();
  }, []);

  // Auto-rotation effect - only for case 5 (3+ featured events)
  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredEvents.length / 3));
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredEvents.length]);

  const nextSlide = () => {
    if (featuredEvents.length <= 3) return;
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredEvents.length / 3));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (featuredEvents.length <= 3) return;
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredEvents.length / 3)) % Math.ceil(featuredEvents.length / 3));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (featuredEvents.length <= 3) return;
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const totalSlides = Math.ceil(featuredEvents.length / 3);
  const isCarousel = featuredEvents.length > 3;

  const formatDate = (eventDate: any) => {
    if (!eventDate) return "TBD";
    const date = eventDate.seconds ? new Date(eventDate.seconds * 1000) : new Date(eventDate);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-gray-900">Upcoming Events</h2>
          <p className="mt-4 text-lg text-gray-600">Discover the most exclusive automotive gatherings around the world.</p>
        </div>
        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading upcoming events...</div>
        ) : featuredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No events available at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new events.</p>
          </div>
        ) : (
          <div className="relative max-w-5xl mx-auto">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: isCarousel ? `translateX(-${currentSlide * 100}%)` : 'none',
                  width: isCarousel ? `${totalSlides * 100}%` : '100%'
                }}
              >
                {isCarousel ? (
                  // Carousel mode - show 3 events per slide
                  Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                      <div className="space-y-8">
                        {featuredEvents.slice(slideIndex * 3, slideIndex * 3 + 3).map((event) => (
                          <EventListItem 
                            key={event.id} 
                            id={parseInt(event.id)}
                            name={event.eventName || "Event"}
                            date={formatDate(event.eventDate)}
                            location={event.location || "TBD"}
                            image={event.imageUrl || event.image || "https://via.placeholder.com/600x400?text=No+Image"}
                            hint={event.hint || "event"}
                            description={event.description || "No description available."}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Normal mode - show all events (max 3)
                  <div className="w-full px-4">
                    <div className="space-y-8">
                      {featuredEvents.map((event) => (
                        <EventListItem 
                          key={event.id} 
                          id={parseInt(event.id)}
                          name={event.eventName || "Event"}
                          date={formatDate(event.eventDate)}
                          location={event.location || "TBD"}
                          image={event.imageUrl || event.image || "https://via.placeholder.com/600x400?text=No+Image"}
                          hint={event.hint || "event"}
                          description={event.description || "No description available."}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls - Only show for carousel */}
            {isCarousel && (
              <>
                {/* Previous/Next Buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6 text-gray-700" />
                </Button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentSlide 
                          ? 'bg-yellow-600 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => goToSlide(index)}
                    >
                      <Circle className="w-2 h-2" />
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="text-center mt-16">
          <Button size="lg" asChild className="font-bold rounded-full">
            <Link href="/events">
              View All Events <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedAuctionsSection = () => {
  const [featuredAuctions, setFeaturedAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchFeaturedAuctions = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        
        // Fetch all auctions
        const auctionsQuery = query(
          collection(db, "auctions"), 
          orderBy("startDate", "asc")
        );
        const auctionsSnapshot = await getDocs(auctionsQuery);
        const allAuctions = auctionsSnapshot.docs
          .map(doc => ({ 
            id: doc.id,
            ...doc.data() 
          } as AuctionData));

        // Separate featured auctions and normal auctions
        const featuredAuctions = allAuctions.filter(auction => auction.featured === true);
        const normalAuctions = allAuctions.filter(auction => auction.featured !== true);

        let finalAuctions: AuctionData[] = [];

        if (featuredAuctions.length === 0) {
          // Case 1: No featured auctions - show 4 random normal auctions
          finalAuctions = normalAuctions.slice(0, 4);
        } else if (featuredAuctions.length === 1) {
          // Case 2: 1 featured auction - show 1 featured + 3 normal auctions
          finalAuctions = [featuredAuctions[0], ...normalAuctions.slice(0, 3)];
        } else if (featuredAuctions.length === 2) {
          // Case 3: 2 featured auctions - show 2 featured + 2 normal auctions
          finalAuctions = [featuredAuctions[0], featuredAuctions[1], ...normalAuctions.slice(0, 2)];
        } else if (featuredAuctions.length === 3) {
          // Case 4: 3 featured auctions - show 3 featured + 1 normal auction
          finalAuctions = [featuredAuctions[0], featuredAuctions[1], featuredAuctions[2], ...normalAuctions.slice(0, 1)];
        } else if (featuredAuctions.length === 4) {
          // Case 5: 4 featured auctions - show only the 4 featured auctions
          finalAuctions = featuredAuctions.slice(0, 4);
        } else {
          // Case 6: 4+ featured auctions - show all featured auctions in carousel
          finalAuctions = featuredAuctions;
        }

        setFeaturedAuctions(finalAuctions);
      } catch (error) {
        console.error("Error fetching featured auctions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedAuctions();
  }, []);

  // Auto-rotation effect - only for case 6 (4+ featured auctions)
  useEffect(() => {
    if (!isAutoPlaying || featuredAuctions.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredAuctions.length / 4));
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredAuctions.length]);

  const nextSlide = () => {
    if (featuredAuctions.length <= 4) return;
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredAuctions.length / 4));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (featuredAuctions.length <= 4) return;
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredAuctions.length / 4)) % Math.ceil(featuredAuctions.length / 4));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (featuredAuctions.length <= 4) return;
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const totalSlides = Math.ceil(featuredAuctions.length / 4);
  const isCarousel = featuredAuctions.length > 4;

  const formatDate = (startDate: any) => {
    if (!startDate) return "TBD";
    const date = startDate.seconds ? new Date(startDate.seconds * 1000) : new Date(startDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">Live Auctions</h2>
          <p className="mt-4 text-lg text-muted-foreground">Bid on rare and exclusive vehicles from around the globe.</p>
        </div>
        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading live auctions...</div>
        ) : featuredAuctions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No auctions available at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new auctions.</p>
          </div>
        ) : (
          <div className="relative max-w-7xl mx-auto">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: isCarousel ? `translateX(-${currentSlide * 100}%)` : 'none',
                  width: isCarousel ? `${totalSlides * 100}%` : '100%'
                }}
              >
                {isCarousel ? (
                  // Carousel mode - show 4 auctions per slide
                  Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredAuctions.slice(slideIndex * 4, slideIndex * 4 + 4).map((auction) => (
                          <div key={auction.id} className="relative group">
                            <CarCard
                              id={auction.id}
                              name={auction.auctionName || "Auction"}
                              price={auction.auctionHouse || "N/A"}
                              location={`Starts ${auction.city || ""}, ${auction.state || ""}`}
                              image={auction.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}
                              hint={auction.auctionType || "auction"}
                              type="auction"
                              featured={auction.featured === true}
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <span>{formatDate(auction.startDate)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Normal mode - show all auctions (max 4)
                  <div className="w-full px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {featuredAuctions.map((auction) => (
                        <div key={auction.id} className="relative group">
                          <CarCard
                            id={auction.id}
                            name={auction.auctionName || "Auction"}
                            price={auction.auctionHouse || "N/A"}
                            location={`Starts ${auction.city || ""}, ${auction.state || ""}`}
                            image={auction.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}
                            hint={auction.auctionType || "auction"}
                            type="auction"
                            featured={auction.featured === true}
                          />
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span>{formatDate(auction.startDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls - Only show for carousel */}
            {isCarousel && (
              <>
                {/* Previous/Next Buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-200 shadow-lg"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-200 shadow-lg"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentSlide 
                          ? 'bg-primary scale-125' 
                          : 'bg-border hover:bg-border/80'
                      }`}
                      onClick={() => goToSlide(index)}
                    >
                      <Circle className="w-2 h-2" />
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="text-center mt-16">
          <Button size="lg" asChild className="font-bold rounded-full">
            <Link href="/auctions">
              View All Auctions <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedHotelsSection = () => {
  const [featuredHotels, setFeaturedHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        
        // Fetch all hotels
        const hotelsQuery = query(
          collection(db, "hotels"), 
          orderBy("createdAt", "desc")
        );
        const hotelsSnapshot = await getDocs(hotelsQuery);
        const allHotels = hotelsSnapshot.docs
          .map(doc => ({ 
            id: doc.id,
            ...doc.data() 
          } as HotelData));

        // Separate featured hotels and normal hotels
        const featuredHotels = allHotels.filter(hotel => hotel.listing_type === "featured");
        const normalHotels = allHotels.filter(hotel => hotel.listing_type !== "featured");

        let finalHotels: HotelData[] = [];

        if (featuredHotels.length === 0) {
          // Case 1: No featured hotels - show 3 random normal hotels
          finalHotels = normalHotels.slice(0, 3);
        } else if (featuredHotels.length === 1) {
          // Case 2: 1 featured hotel - show 1 featured + 2 normal hotels
          finalHotels = [featuredHotels[0], ...normalHotels.slice(0, 2)];
        } else if (featuredHotels.length === 2) {
          // Case 3: 2 featured hotels - show 2 featured + 1 normal hotel
          finalHotels = [featuredHotels[0], featuredHotels[1], ...normalHotels.slice(0, 1)];
        } else if (featuredHotels.length === 3) {
          // Case 4: 3 featured hotels - show only the 3 featured hotels
          finalHotels = featuredHotels.slice(0, 3);
        } else {
          // Case 5: 3+ featured hotels - show all featured hotels in carousel
          finalHotels = featuredHotels;
        }

        setFeaturedHotels(finalHotels);
      } catch (error) {
        console.error("Error fetching featured hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedHotels();
  }, []);

  // Auto-rotation effect - only for case 5 (3+ featured hotels)
  useEffect(() => {
    if (!isAutoPlaying || featuredHotels.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredHotels.length / 3));
    }, 3500); // Change every 3.5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredHotels.length]);

  const nextSlide = () => {
    if (featuredHotels.length <= 3) return;
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredHotels.length / 3));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (featuredHotels.length <= 3) return;
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredHotels.length / 3)) % Math.ceil(featuredHotels.length / 3));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (featuredHotels.length <= 3) return;
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const totalSlides = Math.ceil(featuredHotels.length / 3);
  const isCarousel = featuredHotels.length > 3;

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-gray-900">Featured Hotels</h2>
          <p className="mt-4 text-lg text-gray-600">Discover premium car hotels and storage facilities for your valuable vehicles.</p>
        </div>
        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading featured hotels...</div>
        ) : featuredHotels.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No hotels available at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new listings.</p>
          </div>
        ) : (
          <div className="relative max-w-6xl mx-auto">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: isCarousel ? `translateX(-${currentSlide * 100}%)` : 'none',
                  width: isCarousel ? `${totalSlides * 100}%` : '100%'
                }}
              >
                {isCarousel ? (
                  // Carousel mode - show 3 hotels per slide
                  Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredHotels.slice(slideIndex * 3, slideIndex * 3 + 3).map((hotel) => (
                          <Card key={hotel.id} className="flex flex-col bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="p-0 relative">
                              <Link href={`/hotels/${hotel.id}`} className="block relative aspect-video">
                                <Image 
                                  src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} 
                                  alt={hotel.hotelName || "Hotel"} 
                                  fill
                                  className="object-cover"
                                  data-ai-hint={hotel.hotelName}
                                />
                              </Link>
                              {hotel.listing_type === "featured" && (
                                <div className="absolute top-3 left-3 z-10">
                                  <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="p-6 flex-grow">
                              <CardTitle className="font-headline text-gray-900">
                                <Link href={`/hotels/${hotel.id}`} className="hover:text-yellow-600 transition-colors">
                                  {hotel.hotelName || "Hotel"}
                                </Link>
                              </CardTitle>
                              <CardDescription className="text-gray-600">
                                {hotel.city || ""}, {hotel.state || ""}
                              </CardDescription>
                              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                {(hotel.features || []).slice(0, 3).map((feature: string) => (
                                  <li key={feature} className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter className="p-6 pt-0">
                              <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                                <Link href={`/hotels/${hotel.id}`}>View Services</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Normal mode - show all hotels (max 3)
                  <div className="w-full px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {featuredHotels.map((hotel) => (
                        <Card key={hotel.id} className="flex flex-col bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardHeader className="p-0 relative">
                            <Link href={`/hotels/${hotel.id}`} className="block relative aspect-video">
                              <Image 
                                src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} 
                                alt={hotel.hotelName || "Hotel"} 
                                fill
                                className="object-cover"
                                data-ai-hint={hotel.hotelName}
                              />
                            </Link>
                            {hotel.listing_type === "featured" && (
                              <div className="absolute top-3 left-3 z-10">
                                <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="p-6 flex-grow">
                            <CardTitle className="font-headline text-gray-900">
                              <Link href={`/hotels/${hotel.id}`} className="hover:text-yellow-600 transition-colors">
                                {hotel.hotelName || "Hotel"}
                              </Link>
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                              {hotel.city || ""}, {hotel.state || ""}
                            </CardDescription>
                            <ul className="mt-4 space-y-2 text-sm text-gray-600">
                              {(hotel.features || []).slice(0, 3).map((feature: string) => (
                                <li key={feature} className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter className="p-6 pt-0">
                            <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                              <Link href={`/hotels/${hotel.id}`}>View Services</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls - Only show for carousel */}
            {isCarousel && (
              <>
                {/* Previous/Next Buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6 text-gray-700" />
                </Button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentSlide 
                          ? 'bg-yellow-600 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => goToSlide(index)}
                    >
                      <Circle className="w-2 h-2" />
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="text-center mt-16">
          <Button size="lg" asChild className="font-bold rounded-full">
            <Link href="/hotels">
              View All Hotels <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedClubsSection = () => {
  const [featuredClubs, setFeaturedClubs] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchFeaturedClubs = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        
        // Fetch all clubs
        const clubsQuery = query(
          collection(db, "clubs"), 
          orderBy("createdAt", "desc")
        );
        const clubsSnapshot = await getDocs(clubsQuery);
        const allClubs = clubsSnapshot.docs
          .map(doc => ({ 
            id: doc.id,
            ...doc.data() 
          } as ClubData));

        // Separate featured clubs and normal clubs
        const featuredClubs = allClubs.filter(club => club.listing_type === "featured");
        const normalClubs = allClubs.filter(club => club.listing_type !== "featured");

        let finalClubs: ClubData[] = [];

        if (featuredClubs.length === 0) {
          // Case 1: No featured clubs - show 4 random normal clubs
          finalClubs = normalClubs.slice(0, 4);
        } else if (featuredClubs.length === 1) {
          // Case 2: 1 featured club - show 1 featured + 3 normal clubs
          finalClubs = [featuredClubs[0], ...normalClubs.slice(0, 3)];
        } else if (featuredClubs.length === 2) {
          // Case 3: 2 featured clubs - show 2 featured + 2 normal clubs
          finalClubs = [featuredClubs[0], featuredClubs[1], ...normalClubs.slice(0, 2)];
        } else if (featuredClubs.length === 3) {
          // Case 4: 3 featured clubs - show 3 featured + 1 normal club
          finalClubs = [featuredClubs[0], featuredClubs[1], featuredClubs[2], ...normalClubs.slice(0, 1)];
        } else if (featuredClubs.length === 4) {
          // Case 5: 4 featured clubs - show only the 4 featured clubs
          finalClubs = featuredClubs.slice(0, 4);
        } else {
          // Case 6: 4+ featured clubs - show all featured clubs in carousel
          finalClubs = featuredClubs;
        }

        setFeaturedClubs(finalClubs);
      } catch (error) {
        console.error("Error fetching featured clubs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedClubs();
  }, []);

  // Auto-rotation effect - only for case 6 (4+ featured clubs)
  useEffect(() => {
    if (!isAutoPlaying || featuredClubs.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredClubs.length / 4));
    }, 4500); // Change every 4.5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredClubs.length]);

  const nextSlide = () => {
    if (featuredClubs.length <= 4) return;
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredClubs.length / 4));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (featuredClubs.length <= 4) return;
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredClubs.length / 4)) % Math.ceil(featuredClubs.length / 4));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (featuredClubs.length <= 4) return;
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const totalSlides = Math.ceil(featuredClubs.length / 4);
  const isCarousel = featuredClubs.length > 4;

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "New";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">Featured Clubs</h2>
          <p className="mt-4 text-lg text-muted-foreground">Join exclusive car clubs and connect with fellow enthusiasts around the world.</p>
        </div>
        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading featured clubs...</div>
        ) : featuredClubs.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No clubs available at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new clubs.</p>
          </div>
        ) : (
          <div className="relative max-w-7xl mx-auto">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: isCarousel ? `translateX(-${currentSlide * 100}%)` : 'none',
                  width: isCarousel ? `${totalSlides * 100}%` : '100%'
                }}
              >
                {isCarousel ? (
                  // Carousel mode - show 4 clubs per slide
                  Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredClubs.slice(slideIndex * 4, slideIndex * 4 + 4).map((club) => (
                          <div key={club.id} className="relative pt-12 pb-4">
                            <Link
                              href={`/clubs/${club.id}`}
                              className="group relative bg-card border border-border rounded-2xl shadow-lg p-6 pt-12 pb-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-yellow-600/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-600 min-h-[320px]"
                              tabIndex={0}
                              aria-label={`View details for ${club.clubName}`}
                            >
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                                <div className="rounded-full border-4 border-background shadow-lg bg-background w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                                  <Image 
                                    src={club.logoUrl || "https://via.placeholder.com/80x80?text=Logo"} 
                                    alt={club.clubName || "Club"} 
                                    width={80} 
                                    height={80} 
                                    className="object-contain w-full h-full" 
                                  />
                                </div>
                              </div>
                              <div className="w-full flex flex-col items-center flex-grow space-y-3">
                                <h3 className="text-xl font-bold font-headline text-yellow-600 text-center group-hover:underline transition-all">
                                  {club.clubName || "Club"}
                                </h3>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  <span>{club.city || ""}, {club.country || ""}</span>
                                </div>
                                <p className="text-sm text-muted-foreground text-center line-clamp-4 flex-grow leading-relaxed">
                                  {club.description || "No description available."}
                                </p>
                                <div className="flex gap-3 mt-4">
                                  {club.website && (
                                    <a 
                                      href={club.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-yellow-600 hover:text-yellow-700 transition-colors" 
                                      title="Website"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Globe className="w-5 h-5" />
                                    </a>
                                  )}
                                  {club.socialMediaLink && (
                                    <a 
                                      href={club.socialMediaLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-yellow-600 hover:text-yellow-700 transition-colors" 
                                      title="Social Media"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <LinkIcon className="w-5 h-5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="absolute top-3 right-3">
                                <span className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                                  {formatDate(club.createdAt)}
                                </span>
                              </div>
                              {club.listing_type === "featured" && (
                                <div className="absolute top-3 left-3">
                                  <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
                                </div>
                              )}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Normal mode - show all clubs (max 4)
                  <div className="w-full px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {featuredClubs.map((club) => (
                        <div key={club.id} className="relative pt-12 pb-4">
                          <Link
                            href={`/clubs/${club.id}`}
                            className="group relative bg-card border border-border rounded-2xl shadow-lg p-6 pt-12 pb-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-yellow-600/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-600 min-h-[320px]"
                            tabIndex={0}
                            aria-label={`View details for ${club.clubName}`}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                              <div className="rounded-full border-4 border-background shadow-lg bg-background w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                                <Image 
                                  src={club.logoUrl || "https://via.placeholder.com/80x80?text=Logo"} 
                                  alt={club.clubName || "Club"} 
                                  width={80} 
                                  height={80} 
                                  className="object-contain w-full h-full" 
                                />
                              </div>
                            </div>
                            <div className="w-full flex flex-col items-center flex-grow space-y-3">
                              <h3 className="text-xl font-bold font-headline text-yellow-600 text-center group-hover:underline transition-all">
                                {club.clubName || "Club"}
                              </h3>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>{club.city || ""}, {club.country || ""}</span>
                              </div>
                              <p className="text-sm text-muted-foreground text-center line-clamp-4 flex-grow leading-relaxed">
                                {club.description || "No description available."}
                              </p>
                              <div className="flex gap-3 mt-4">
                                {club.website && (
                                  <a 
                                    href={club.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-yellow-600 hover:text-yellow-700 transition-colors" 
                                    title="Website"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Globe className="w-5 h-5" />
                                  </a>
                                )}
                                {club.socialMediaLink && (
                                  <a 
                                    href={club.socialMediaLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-yellow-600 hover:text-yellow-700 transition-colors" 
                                    title="Social Media"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <LinkIcon className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                                {formatDate(club.createdAt)}
                              </span>
                            </div>
                            {club.listing_type === "featured" && (
                              <div className="absolute top-3 left-3">
                                <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
                              </div>
                            )}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls - Only show for carousel */}
            {isCarousel && (
              <>
                {/* Previous/Next Buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-200 shadow-lg"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-200 shadow-lg"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentSlide 
                          ? 'bg-primary scale-125' 
                          : 'bg-border hover:bg-border/80'
                      }`}
                      onClick={() => goToSlide(index)}
                    >
                      <Circle className="w-2 h-2" />
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="text-center mt-16">
          <Button size="lg" asChild className="font-bold rounded-full">
            <Link href="/clubs">
              View All Clubs <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedOtherServicesSection = () => {
  const [featuredServices, setFeaturedServices] = useState<OtherServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchFeaturedServices = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        
        // Fetch all approved services
        const servicesQuery = query(
          collection(db, "others"), 
          orderBy("createdAt", "desc")
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        const allServices = servicesSnapshot.docs
          .map(doc => ({ 
            id: doc.id,
            ...doc.data() 
          } as OtherServiceData))
          .filter(service => service.status === "approved");

        // Separate featured services and normal services
        const featuredServices = allServices.filter(service => service.featured === true);
        const normalServices = allServices.filter(service => service.featured !== true);

        let finalServices: OtherServiceData[] = [];

        if (featuredServices.length === 0) {
          // Case 1: No featured services - show 4 random normal services
          finalServices = normalServices.slice(0, 4);
        } else if (featuredServices.length === 1) {
          // Case 2: 1 featured service - show 1 featured + 3 normal services
          finalServices = [featuredServices[0], ...normalServices.slice(0, 3)];
        } else if (featuredServices.length === 2) {
          // Case 3: 2 featured services - show 2 featured + 2 normal services
          finalServices = [featuredServices[0], featuredServices[1], ...normalServices.slice(0, 2)];
        } else if (featuredServices.length === 3) {
          // Case 4: 3 featured services - show 3 featured + 1 normal service
          finalServices = [featuredServices[0], featuredServices[1], featuredServices[2], ...normalServices.slice(0, 1)];
        } else if (featuredServices.length === 4) {
          // Case 5: 4 featured services - show only the 4 featured services
          finalServices = featuredServices.slice(0, 4);
        } else {
          // Case 6: 4+ featured services - show all featured services in carousel
          finalServices = featuredServices;
        }

        setFeaturedServices(finalServices);
      } catch (error) {
        console.error("Error fetching featured services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedServices();
  }, []);

  // Auto-rotation effect - only for case 6 (4+ featured services)
  useEffect(() => {
    if (!isAutoPlaying || featuredServices.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredServices.length / 4));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredServices.length]);

  const nextSlide = () => {
    if (featuredServices.length <= 4) return;
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredServices.length / 4));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    if (featuredServices.length <= 4) return;
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredServices.length / 4)) % Math.ceil(featuredServices.length / 4));
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    if (featuredServices.length <= 4) return;
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const totalSlides = Math.ceil(featuredServices.length / 4);
  const isCarousel = featuredServices.length > 4;

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-gray-900">Other Services</h2>
          <p className="mt-4 text-lg text-gray-600">Discover automotive services including storage, garages, parts, restoration, detailing, and more.</p>
        </div>
        {loading ? (
          <div className="text-center text-lg py-12 text-gray-600">Loading other services...</div>
        ) : featuredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No services available at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new services.</p>
          </div>
        ) : (
          <div className="relative max-w-7xl mx-auto">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: isCarousel ? `translateX(-${currentSlide * 100}%)` : 'none',
                  width: isCarousel ? `${totalSlides * 100}%` : '100%'
                }}
              >
                {isCarousel ? (
                  // Carousel mode - show 4 services per slide
                  Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredServices.slice(slideIndex * 4, slideIndex * 4 + 4).map((service) => (
                          <Card key={service.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:scale-105">
                            <div className="relative aspect-video overflow-hidden">
                              <Image 
                                src={service.imageUrls && service.imageUrls.length > 0 ? service.imageUrls[0] : 'https://via.placeholder.com/400x250?text=Service+Image'} 
                                alt={service.serviceName || "Service"}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {service.featured && (
                                <div className="absolute top-2 left-2">
                                  <span className="inline-flex items-center rounded-full bg-yellow-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            
                            <CardContent className="p-4 bg-white">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-headline font-bold text-lg text-gray-900 group-hover:text-yellow-600 transition-colors">
                                  {service.serviceName || "Service"}
                                </h3>
                                {service.rating && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="ml-1">{service.rating}</span>
                                  </div>
                                )}
                              </div>
                              
                              <span className="inline-block bg-gray-50 border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs mb-2">
                                {service.serviceType || "Service"}
                              </span>
                              
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {service.description || "No description available."}
                              </p>
                              
                              <div className="space-y-1 text-sm text-gray-500 mb-3">
                                <div className="flex items-center">
                                  <Map className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{service.location || "Location TBD"}</span>
                                </div>
                                {service.coverageArea && (
                                  <div className="flex items-center">
                                    <Shield className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>Coverage: {service.coverageArea}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{service.priceRange || "Price TBD"}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Button asChild size="sm" className="flex-1 mr-2 bg-yellow-600 hover:bg-yellow-700 text-white">
                                  <Link href={`/others/${service.id}`}>
                                    View Details
                                  </Link>
                                </Button>
                                {service.contactInfo && (
                                  <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                    <a href={`mailto:${service.contactInfo}?subject=Inquiry about ${service.serviceName}`}>
                                      Contact
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Normal mode - show all services (max 4)
                  <div className="w-full px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {featuredServices.map((service) => (
                        <Card key={service.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:scale-105">
                          <div className="relative aspect-video overflow-hidden">
                            <Image 
                              src={service.imageUrls && service.imageUrls.length > 0 ? service.imageUrls[0] : 'https://via.placeholder.com/400x250?text=Service+Image'} 
                              alt={service.serviceName || "Service"}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {service.featured && (
                              <div className="absolute top-2 left-2">
                                <span className="inline-flex items-center rounded-full bg-yellow-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          
                          <CardContent className="p-4 bg-white">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-headline font-bold text-lg text-gray-900 group-hover:text-yellow-600 transition-colors">
                                {service.serviceName || "Service"}
                              </h3>
                              {service.rating && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="ml-1">{service.rating}</span>
                                </div>
                              )}
                            </div>
                            
                            <span className="inline-block bg-gray-50 border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs mb-2">
                              {service.serviceType || "Service"}
                            </span>
                            
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {service.description || "No description available."}
                            </p>
                            
                            <div className="space-y-1 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <Map className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{service.location || "Location TBD"}</span>
                              </div>
                              {service.coverageArea && (
                                <div className="flex items-center">
                                  <Shield className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>Coverage: {service.coverageArea}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Package className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{service.priceRange || "Price TBD"}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Button asChild size="sm" className="flex-1 mr-2 bg-yellow-600 hover:bg-yellow-700 text-white">
                                <Link href={`/others/${service.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              {service.contactInfo && (
                                <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                  <a href={`mailto:${service.contactInfo}?subject=Inquiry about ${service.serviceName}`}>
                                    Contact
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls - Only show for carousel */}
            {isCarousel && (
              <>
                {/* Previous/Next Buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6 text-gray-700" />
                </Button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentSlide 
                          ? 'bg-yellow-600 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => goToSlide(index)}
                    >
                      <Circle className="w-2 h-2" />
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="text-center mt-16">
          <Button size="lg" asChild className="font-bold rounded-full">
            <Link href="/others">
              View All Services <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  return (
    <div className="bg-background">
      <HeroSlider />
      <NewsletterSubscribe />
      <ValueProposition />
      <FeaturedCarsSection />
      <FeaturedEventsSection />
      <FeaturedAuctionsSection />
      <FeaturedHotelsSection />
      <FeaturedClubsSection />
      <FeaturedOtherServicesSection />
    </div>
  );
}
