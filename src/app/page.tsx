"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeCheck, Trophy, Group, Clock, Star, Map, Shield, Package } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
import { fetchHomepageContent, defaultHomepageContent } from "@/lib/homepageContent";
import type { HomepageContent } from "@/types/homepage";
import SimpleGallerySection from "@/components/SimpleGallerySection";

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

// New: Promo announcement and gallery types
type GalleryImage = { id: string; url: string };

const PromoAnnouncement = ({ copy }: { copy: NonNullable<HomepageContent["promo"]> }) => {
  return (
    <div className="bg-[#F8F6F1]">
      <div className="container mx-auto px-4 py-12">
        <div className="relative">
          {/* Paper backdrop with brass studs */}
          <div className="relative mx-auto max-w-4xl rounded-[18px] border border-[#C7BCA3]/60 bg-gradient-to-br from-[#FAF7EE] via-[#F3EADA] to-[#ECE3D1] shadow-[0_10px_30px_rgba(0,0,0,0.08)] px-6 sm:px-10 py-10">
            <div className="pointer-events-none absolute top-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
            <div className="pointer-events-none absolute top-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
            <div className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
            <div className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9CEB6] bg-[#F4F0E7] px-4 py-2 mb-5">
              <span className="text-[#7A6E57] font-semibold text-sm">{copy.badgeText}</span>
            </div>

            {/* Heading and divider */}
            <h2 className="font-headline uppercase tracking-[0.2em] text-[#1f1f1f] text-3xl sm:text-4xl md:text-5xl text-center">
              {copy.mainHeading}
            </h2>
            <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-[#C3A76D] to-[#E7D08A]" />

            {/* Chips */}
            <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-3 md:gap-4 text-sm md:text-base">
              {copy.chips.map((chip) => (
                <div key={chip} className="rounded-full px-5 py-2 border border-[#D9CEB6] bg-[#F4F0E7] text-[#1f1f1f]">
                  {chip}
                </div>
              ))}
            </div>

            {/* Subcopy */}
            <p className="mt-6 md:mt-8 text-[#2a2a2a] text-base md:text-lg max-w-2xl mx-auto text-center leading-relaxed">
              <span className="font-bold text-[#C3A76D]">{copy.carsLinePrefix}</span> Enjoy <span className="font-bold text-[#C3A76D]">{copy.carsLineHighlight}</span> listing period!
            </p>

            {/* CTA Button */}
            <div className="mt-8 flex justify-center w-full">
              <Button 
                asChild 
                size="lg" 
                className="rounded-full bg-[#C3A76D] hover:bg-[#B99754] text-black font-semibold text-base md:text-lg px-8 md:px-10 py-4 shadow-sm hover:shadow transition-all"
              >
                <Link href={copy.ctaHref}>{copy.ctaLabel}</Link>
              </Button>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="text-center pt-6 mt-8 lg:pt-10 border-t border-[#D9CEB6]">
            <NewsletterSubscribe />
          </div>
        </div>
      </div>
    </div>
  );
};

const GallerySection = ({
  title,
  collectionName,
  bgClass = "bg-white",
}: {
  title: string;
  collectionName: string;
  bgClass?: string;
}) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const db = getFirestore(app);
        
        // Different image limits for each gallery
        let imageLimit = 24; // default
        if (collectionName === "gallery") {
          imageLimit = 18; // Main gallery - more images
        } else if (collectionName === "gallery_location1") {
          imageLimit = 12; // Location 1 - medium
        } else if (collectionName === "gallery_location2") {
          imageLimit = 15; // Location 2 - different count
        }
        
        const q = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(imageLimit));
        const snap = await getDocs(q);
        const fromDb = snap.docs.map((doc) => {
          const data = doc.data() as any;
          const url = data?.url || data?.imageUrl || (Array.isArray(data?.images) ? data.images[0] : undefined);
          return { id: doc.id, url } as GalleryImage;
        });
        const filtered = fromDb.filter((g) => !!g.url);
        const fallbacks: string[] = [
          "https://images.unsplash.com/photo-1494976388531-0dffb9f5fa7b?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1494976388531-7e1cebd8b0b2?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511396837277-9e2b41dbe13a?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1465447142348-e9952c393450?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1600&auto=format&fit=crop",
        ];
        const finalImages = (filtered.length ? filtered : fallbacks.map((url, i) => ({ id: `fallback-${i}`, url })))
          .slice(0, imageLimit);
        setImages(finalImages);
      } catch (e) {
        // fallback
        const fallbacks: string[] = [
          "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511910849309-0dffb9f5fa7b?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1600&auto=format&fit=crop",
        ];
        setImages(fallbacks.map((url, i) => ({ id: `fallback-${i}`, url })));
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [collectionName]);

  // Different patterns for each gallery
  const getHeight = (index: number) => {
    if (collectionName === "gallery") {
      // Main gallery - varied heights
      const heights = ['h-64', 'h-80', 'h-72', 'h-88', 'h-64', 'h-80'];
      return heights[index % heights.length];
    } else if (collectionName === "gallery_location1") {
      // Location 1 - taller, more dramatic
      const heights = ['h-72', 'h-96', 'h-80', 'h-88', 'h-72', 'h-96'];
      return heights[index % heights.length];
    } else {
      // Location 2 - shorter, more compact
      const heights = ['h-56', 'h-64', 'h-60', 'h-72', 'h-56', 'h-64'];
      return heights[index % heights.length];
    }
  };

  const getWidth = (index: number) => {
    if (collectionName === "gallery") {
      // Main gallery - varied widths
      const widths = ['w-full', 'w-11/12', 'w-full', 'w-11/12', 'w-full', 'w-11/12'];
      return widths[index % widths.length];
    } else if (collectionName === "gallery_location1") {
      // Location 1 - more width variation
      const widths = ['w-full', 'w-10/12', 'w-11/12', 'w-full', 'w-10/12', 'w-11/12'];
      return widths[index % widths.length];
    } else {
      // Location 2 - mostly full width
      const widths = ['w-full', 'w-11/12', 'w-full', 'w-11/12', 'w-full', 'w-11/12'];
      return widths[index % widths.length];
    }
  };

  const getPosition = (index: number) => {
    if (collectionName === "gallery") {
      // Main gallery - subtle positioning
      const positions = ['', 'ml-2', '', 'mr-2', '', 'ml-2'];
      return positions[index % positions.length];
    } else if (collectionName === "gallery_location1") {
      // Location 1 - more dramatic positioning
      const positions = ['', 'ml-4', 'mr-4', '', 'ml-4', 'mr-4'];
      return positions[index % positions.length];
    } else {
      // Location 2 - minimal positioning
      const positions = ['', 'ml-1', '', 'mr-1', '', 'ml-1'];
      return positions[index % positions.length];
    }
  };

  const getGridSpan = (index: number) => {
    if (collectionName === "gallery") {
      // Main gallery - varied spans
      const spans = [
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ];
      return spans[index % spans.length];
    } else if (collectionName === "gallery_location1") {
      // Location 1 - more dramatic spans
      const spans = [
        { row: 1, col: 1 },
        { row: 3, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 1 },
        { row: 1, col: 1 },
        { row: 3, col: 1 },
      ];
      return spans[index % spans.length];
    } else {
      // Location 2 - simpler spans
      const spans = [
        { row: 1, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 1, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ];
      return spans[index % spans.length];
    }
  };

  return (
    <section className={`py-14 sm:py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className={`text-3xl sm:text-4xl font-headline font-extrabold ${bgClass.includes('#80A0A9') ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
          <p className={`${bgClass.includes('#80A0A9') ? 'text-white/90' : 'text-gray-600'} mt-3`}>An immersive wall of moments from our community.</p>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading gallery...</div>
        ) : (
          <div className="relative">
            {/* Organic Pinterest-style masonry grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px]">
              {images.map((img, index) => (
                <div 
                  key={img.id} 
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${getHeight(index)} ${getWidth(index)} ${getPosition(index)}`}
                  style={{
                    gridRow: `span ${getGridSpan(index).row}`,
                    gridColumn: `span ${getGridSpan(index).col}`,
                  }}
                >
                  <a href={img.url} target="_blank" rel="noreferrer" className="block w-full h-full">
                    <img 
                      src={img.url} 
                      alt="Gallery" 
                      loading="lazy" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                    {/* Organic overlay with irregular shape */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Decorative elements for organic feel */}
                    <div className="absolute top-3 right-3 w-3 h-3 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100"></div>
                    <div className="absolute bottom-4 left-4 w-2 h-2 bg-yellow-400/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200"></div>
                    
                    {/* Organic corner accent */}
                    <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-yellow-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300"></div>
                  </a>
                </div>
              ))}
            </div>
            
            {/* Organic floating elements for artistic touch */}
            <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-6 h-6 bg-[#80A0A9]/20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-yellow-400/30 rounded-full animate-pulse delay-500"></div>
            <div className="absolute bottom-10 right-1/3 w-5 h-5 bg-[#80A0A9]/25 rounded-full animate-pulse delay-1500"></div>
          </div>
        )}
      </div>
    </section>
  );
};

const ValueProposition = ({ copy }: { copy: NonNullable<HomepageContent["value"]> }) => {
  return (
    <div className="relative bg-[#E0D8C1]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-yellow-400/20 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-yellow-400/20 blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
             <div className="text-center max-w-4xl mx-auto mb-10 md:mb-16">
                <h2 className="font-headline uppercase tracking-[0.2em] text-gray-900 text-3xl sm:text-4xl md:text-5xl">{copy.heading}</h2>
                <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
                <p className="mt-6 text-gray-800 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-16 w-16 md:h-18 md:w-18 rounded-full bg-white shadow-md ring-1 ring-black/5 mb-5">
                        <BadgeCheck className="h-8 w-8 text-yellow-600"/>
                    </div>
                    <h3 className="text-lg md:text-xl font-headline font-semibold text-gray-900 tracking-tight">{copy.items[0]?.title}</h3>
                    <p className="mt-2 text-sm md:text-base text-gray-700">{copy.items[0]?.description}</p>
                </div>
                <div className="flex flex-col items-center">
                     <div className="flex items-center justify-center h-16 w-16 md:h-18 md:w-18 rounded-full bg-white shadow-md ring-1 ring-black/5 mb-5">
                        <Trophy className="h-8 w-8 text-yellow-600"/>
                    </div>
                    <h3 className="text-lg md:text-xl font-headline font-semibold text-gray-900 tracking-tight">{copy.items[1]?.title}</h3>
                    <p className="mt-2 text-sm md:text-base text-gray-700">{copy.items[1]?.description}</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-16 w-16 md:h-18 md:w-18 rounded-full bg-white shadow-md ring-1 ring-black/5 mb-5">
                        <Group className="h-8 w-8 text-yellow-600"/>
                    </div>
                    <h3 className="text-lg md:text-xl font-headline font-semibold text-gray-900 tracking-tight">{copy.items[2]?.title}</h3>
                    <p className="mt-2 text-sm md:text-base text-gray-700">{copy.items[2]?.description}</p>
                </div>
            </div>
            
            {/* Partner Ads Section */}
            <div className="mt-12 md:mt-20">
                <HomepageAdCarousel />
            </div>
        </div>
    </div>
  );
};

const FeaturedCarsSection = ({ copy }: { copy: NonNullable<HomepageContent["featuredCars"]> }) => {
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
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#E0D8C1]">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-14">
                    <h2 className="font-headline uppercase tracking-[0.2em] text-gray-900 text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
                    <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
                    <p className="mt-6 text-gray-700 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
                </div>
                {loading ? (
                    <div className="text-center text-base md:text-lg py-8 md:py-12 text-gray-600">Loading featured cars...</div>
                ) : featuredCars.length === 0 ? (
                    <div className="text-center py-8 md:py-12 text-gray-600">
                        <p className="text-base md:text-lg">No cars available at the moment.</p>
                        <p className="text-xs md:text-sm mt-2">Check back soon for new listings.</p>
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
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
                                    onClick={prevSlide}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
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
                    <Button size="lg" asChild className="rounded-full px-8 py-5 font-semibold text-gray-900 shadow-lg ring-1 ring-yellow-500/40
                                                  bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                                  transition-all duration-300 hover:-translate-y-0.5">
                        <Link href={copy.ctaHref}>{copy.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};

const FeaturedEventsSection = ({ copy }: { copy: NonNullable<HomepageContent["featuredEvents"]> }) => {
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#80A0A9]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-14">
          <h2 className="font-headline uppercase tracking-[0.2em] text-white drop-shadow-2xl text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
          <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
          <p className="mt-6 text-white/90 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
        </div>
        {loading ? (
          <div className="text-center text-base md:text-lg py-8 md:py-12 text-gray-600">Loading upcoming events...</div>
        ) : featuredEvents.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-600">
            <p className="text-base md:text-lg">No events available at the moment.</p>
            <p className="text-xs md:text-sm mt-2">Check back soon for new events.</p>
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
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
                          ? 'bg-yellow-400 scale-125' 
                          : 'bg-white/60 hover:bg-white/80'
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
          <Button size="lg" asChild className="rounded-full px-8 py-5 font-semibold text-gray-900 shadow-lg ring-1 ring-yellow-500/40
                                            bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                            transition-all duration-300 hover:-translate-y-0.5">
            <Link href={copy.ctaHref}>
              {copy.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedAuctionsSection = ({ copy }: { copy: NonNullable<HomepageContent["featuredAuctions"]> }) => {
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-14">
          <h2 className="font-headline uppercase tracking-[0.2em] text-gray-900 text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
          <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
          <p className="mt-6 text-gray-700 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
        </div>
        {loading ? (
          <div className="text-center text-base md:text-lg py-8 md:py-12 text-gray-600">Loading live auctions...</div>
        ) : featuredAuctions.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-600">
            <p className="text-base md:text-lg">No auctions available at the moment.</p>
            <p className="text-xs md:text-sm mt-2">Check back soon for new auctions.</p>
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
                            <div className="absolute top-4 right-4 bg-[#F4F0E7]/95 border border-[#D9CEB6] text-[#1f1f1f] px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow">
                              <Clock className="w-4 h-4 text-[#7D8C91]" />
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
                          <div className="absolute top-4 right-4 bg-[#F4F0E7]/95 border border-[#D9CEB6] text-[#1f1f1f] px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold shadow">
                            <Clock className="w-4 h-4 text-[#7D8C91]" />
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
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
          <Button size="lg" asChild className="rounded-full px-8 py-5 font-semibold text-gray-900 shadow-lg ring-1 ring-yellow-500/40
                                            bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                            transition-all duration-300 hover:-translate-y-0.5">
            <Link href={copy.ctaHref}>
              {copy.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedHotelsSection = ({ copy }: { copy: NonNullable<HomepageContent["featuredHotels"]> }) => {
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-14">
          <h2 className="font-headline uppercase tracking-[0.2em] text-gray-900 text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
          <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
          <p className="mt-6 text-gray-700 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
        </div>
        {loading ? (
          <div className="text-center text-base md:text-lg py-8 md:py-12 text-gray-600">Loading featured hotels...</div>
        ) : featuredHotels.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-600">
            <p className="text-base md:text-lg">No hotels available at the moment.</p>
            <p className="text-xs md:text-sm mt-2">Check back soon for new listings.</p>
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
                          <Card key={hotel.id} className="flex flex-col overflow-hidden rounded-[18px] border border-[#C7BCA3]/50 bg-[#F8F6F1] shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)] transition-all duration-500">
                            <CardHeader className="p-0 relative">
                              <Link href={`/hotels/${hotel.id}`} className="block relative aspect-video bg-[#EDE7DA]">
                                <div className="absolute inset-0 m-4 rounded-[12px] border border-[#B49A6A]/50 overflow-hidden shadow-inner">
                                  <Image 
                                    src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} 
                                    alt={hotel.hotelName || "Hotel"} 
                                    fill
                                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                                    data-ai-hint={hotel.hotelName}
                                  />
                                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)]" />
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#C3A76D] via-[#E7D08A] to-[#B98A2A] opacity-90" />
                                </div>
                              </Link>
                              {hotel.listing_type === "featured" && (
                                <div className="absolute top-3 left-3 z-10">
                                  <span className="inline-flex items-center rounded-full bg-[#E7D08A] text-black px-3 py-1 text-xs font-bold shadow ring-1 ring-black/10">Featured</span>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="p-6 flex-grow">
                              <CardTitle className="font-headline tracking-[-0.01em] bg-gradient-to-r from-[#1d1d1d] via-[#2a2a2a] to-[#1d1d1d] bg-clip-text text-transparent">
                                <Link href={`/hotels/${hotel.id}`} className="hover:opacity-90 transition">
                                  {hotel.hotelName || "Hotel"}
                                </Link>
                              </CardTitle>
                              <CardDescription className="text-[#7A6E57]">
                                {hotel.city || ""}, {hotel.state || ""}
                              </CardDescription>
                              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                {(hotel.features || []).slice(0, 3).map((feature: string) => (
                                  <li key={feature} className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-[#C3A76D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter className="p-6 pt-0">
                              <Button asChild className="w-full rounded-full bg-[#C3A76D] hover:bg-[#B99754] text-black font-semibold shadow-sm hover:shadow transition-all">
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
                            <Button asChild variant="outline" className="w-full rounded-full border border-yellow-500/40 text-gray-900 hover:bg-white shadow-sm">
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-yellow-500/40 hover:bg-white transition-all duration-200 shadow-lg rounded-full"
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
          <Button size="lg" asChild className="rounded-full px-8 py-5 font-semibold text-gray-900 shadow-lg ring-1 ring-yellow-500/40
                                            bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                            transition-all duration-300 hover:-translate-y-0.5">
            <Link href={copy.ctaHref}>
              {copy.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedClubsSection = ({ copy }: { copy: NonNullable<HomepageContent["featuredClubs"]> }) => {
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#80A0A9]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-14">
          <h2 className="font-headline uppercase tracking-[0.2em] text-white drop-shadow-2xl text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
          <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
          <p className="mt-6 text-white/90 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
        </div>
        {loading ? (
          <div className="text-center text-base md:text-lg py-8 md:py-12 text-gray-600">Loading featured clubs...</div>
        ) : featuredClubs.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-600">
            <p className="text-base md:text-lg">No clubs available at the moment.</p>
            <p className="text-xs md:text-sm mt-2">Check back soon for new clubs.</p>
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
                              className="group relative bg-white border border-gray-200 rounded-2xl shadow-lg p-6 pt-12 pb-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-yellow-600/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-600 min-h-[320px]"
                              tabIndex={0}
                              aria-label={`View details for ${club.clubName}`}
                            >
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                                <div className="rounded-full border-4 border-white shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
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
                            className="group relative bg-white border border-gray-200 rounded-2xl shadow-lg p-6 pt-12 pb-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-yellow-600/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-600 min-h-[320px]"
                            tabIndex={0}
                            aria-label={`View details for ${club.clubName}`}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                              <div className="rounded-full border-4 border-white shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white transition-all duration-200 shadow-lg"
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
          <Button size="lg" asChild className="rounded-full px-8 py-5 font-semibold text-gray-900 shadow-lg ring-1 ring-yellow-500/40
                                            bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                            transition-all duration-300 hover:-translate-y-0.5">
            <Link href={copy.ctaHref}>
              {copy.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FeaturedOtherServicesSection = ({ copy }: { copy: NonNullable<HomepageContent["featuredServices"]> }) => {
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-14">
          <h2 className="font-headline uppercase tracking-[0.2em] text-gray-900 text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
          <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
          <p className="mt-6 text-gray-700 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">{copy.description}</p>
        </div>
        {loading ? (
          <div className="text-center text-base md:text-lg py-8 md:py-12 text-gray-600">Loading other services...</div>
        ) : featuredServices.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-600">
            <p className="text-base md:text-lg">No services available at the moment.</p>
            <p className="text-xs md:text-sm mt-2">Check back soon for new services.</p>
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
                                <Button asChild size="sm" className="flex-1 mr-2 rounded-full text-gray-900 shadow-md ring-1 ring-yellow-500/40 bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600">
                                  <Link href={`/others/${service.id}`}>
                                    View Details
                                  </Link>
                                </Button>
                                {service.contactInfo && (
                                  <Button asChild variant="outline" size="sm" className="rounded-full border border-yellow-500/40 text-gray-900 hover:bg-white shadow-sm">
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
                              <Button asChild size="sm" className="flex-1 mr-2 rounded-full text-gray-900 shadow-md ring-1 ring-yellow-500/40 bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600">
                                <Link href={`/others/${service.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              {service.contactInfo && (
                                <Button asChild variant="outline" size="sm" className="rounded-full border border-yellow-500/40 text-gray-900 hover:bg-white shadow-sm">
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
          <Button size="lg" asChild className="rounded-full px-8 py-5 font-semibold text-gray-900 shadow-lg ring-1 ring-yellow-500/40
                                            bg-gradient-to-b from-yellow-400 via-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                            transition-all duration-300 hover:-translate-y-0.5">
            <Link href={copy.ctaHref}>
              {copy.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [copy, setCopy] = useState<HomepageContent>(defaultHomepageContent);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchHomepageContent();
        setCopy(data);
      } catch (e) {
        // use defaults on failure
      }
    })();
  }, []);

  // Best-effort autoplay on load and after first user interaction
  useEffect(() => {
    const attemptPlay = () => {
      const el = videoRef.current;
      if (!el) return;
      el.play().catch(() => {});
    };
    attemptPlay();
    const onInteract = () => {
      const el = videoRef.current;
      if (el) {
        // Unmute on first user gesture to allow audio playback
        el.muted = false;
        setIsMuted(false);
      }
      attemptPlay();
      document.removeEventListener('click', onInteract);
      document.removeEventListener('touchstart', onInteract);
    };
    document.addEventListener('click', onInteract, { once: true });
    document.addEventListener('touchstart', onInteract, { once: true });
    return () => {
      document.removeEventListener('click', onInteract);
      document.removeEventListener('touchstart', onInteract);
    };
  }, []);

  const videoCopy = copy.video ?? defaultHomepageContent.video!;

  return (
    <div className="bg-white">
      {/* Fullscreen vertical video above hero; -mt-20 cancels global layout spacing on homepage only */}
      <section className="relative h-screen w-full -mt-20 overflow-hidden">
        <video
          ref={videoRef}
          src="https://firebasestorage.googleapis.com/v0/b/bestcarevents-dev.firebasestorage.app/o/homepage%2Fhero%2Fhomepage_video.mp4?alt=media&token=3a1fee0e-e09d-4900-a097-327b112a1c93"
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          autoPlay
          muted={isMuted}
          loop
          preload="auto"
          poster="/video_fall.jpg"
        />
        {/* Mute/Unmute control */}
        <button
          type="button"
          aria-label={isMuted ? 'Unmute background video' : 'Mute background video'}
          onClick={() => {
            const el = videoRef.current;
            if (!el) return;
            const next = !isMuted;
            el.muted = next;
            setIsMuted(next);
            el.play().catch(() => {});
          }}
          className="absolute bottom-6 right-6 z-20 rounded-full bg-black/50 hover:bg-black/70 text-white px-3 py-2 backdrop-blur shadow-md"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        {/* Luxury text overlay in the lower third */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="relative h-full flex items-end justify-center pb-16 md:pb-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="font-headline uppercase tracking-[0.2em] text-white drop-shadow-2xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                {videoCopy.title}
              </h2>
              <div className="mx-auto mt-4 h-[2px] w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
              <p className="mt-6 text-neutral-200/95 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                {videoCopy.text}
              </p>
            </div>
          </div>
        </div>
        {/* Optional subtle gradient to blend with header/hero below for a luxury feel */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black/30" />
      </section>
      {/* Spacer: subtle white blend before the hero slider */}
      {/* <div className="h-24 sm:h-16 bg-gradient-to-b from-white to-[#E0D8C1]" /> */}
      <HeroSlider slides={copy.hero?.slides} />
      <PromoAnnouncement copy={copy.promo ?? defaultHomepageContent.promo!} />
      <ValueProposition copy={copy.value ?? defaultHomepageContent.value!} />
      <SimpleGallerySection title={copy.galleries?.main?.title ?? defaultHomepageContent.galleries!.main!.title} collectionName="gallery" max={12} />

      {/* Removed previous mid-page vertical video section */}

      <FeaturedCarsSection copy={copy.featuredCars ?? defaultHomepageContent.featuredCars!} />
      <FeaturedEventsSection copy={copy.featuredEvents ?? defaultHomepageContent.featuredEvents!} />
      <SimpleGallerySection title={copy.galleries?.location1?.title ?? defaultHomepageContent.galleries!.location1!.title} collectionName="gallery_location1" max={12} />
      <FeaturedAuctionsSection copy={copy.featuredAuctions ?? defaultHomepageContent.featuredAuctions!} />
      <FeaturedHotelsSection copy={copy.featuredHotels ?? defaultHomepageContent.featuredHotels!} />
      <SimpleGallerySection title={copy.galleries?.location2?.title ?? defaultHomepageContent.galleries!.location2!.title} collectionName="gallery_location2" max={12} />
      <FeaturedClubsSection copy={copy.featuredClubs ?? defaultHomepageContent.featuredClubs!} />
      <FeaturedOtherServicesSection copy={copy.featuredServices ?? defaultHomepageContent.featuredServices!} />
    </div>
  );
}
