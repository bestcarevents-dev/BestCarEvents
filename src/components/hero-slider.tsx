"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"
import HeroSearch from './hero-search';
import { cn } from '@/lib/utils';

export type HeroSlide = {
  headline: string;
  subheadline: string;
  image: string;
  hint?: string;
};

const defaultSlides: HeroSlide[] = [
    {
        headline: "Discover Premium Car Events",
        subheadline: "Connect with automotive excellence worldwide",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop",
        hint: "dark sports car",
    },
    {
        headline: "Find Your Next Masterpiece",
        subheadline: "Our curated marketplace features thousands of unique vehicles",
        image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop",
        hint: "vintage car show",
    },
    {
        headline: "Join a Community of Enthusiasts",
        subheadline: "Attend exclusive meetups, track days, and auctions.",
        image: "https://plus.unsplash.com/premium_photo-1664303847960-586318f59035?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hint: "car community meetup",
    }
]

export default function HeroSlider({ slides }: { slides?: HeroSlide[] }) {
    const [api, setApi] = useState<any>()
    const [current, setCurrent] = useState(0)
    const resolvedSlides = slides && slides.length > 0 ? slides : defaultSlides;
    const [loaded, setLoaded] = useState<boolean[]>(() => new Array(resolvedSlides.length).fill(false))

    React.useEffect(() => {
        if (!api) {
            return
        }
        setCurrent(api.selectedScrollSnap())
        const onSelect = () => {
            setCurrent(api.selectedScrollSnap())
        }
        api.on("select", onSelect)
        return () => {
            api.off("select", onSelect)
        }
    }, [api])

    React.useEffect(() => {
        setLoaded(new Array(resolvedSlides.length).fill(false))
    }, [resolvedSlides.length])

    return (
        <div className="relative w-full text-white pt-1 lg:pt-0">
            <Carousel
                className="w-full"
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
                opts={{ loop: true }}
                setApi={setApi}
            >
                <CarouselContent>
                    {resolvedSlides.map((slide, index) => (
                        <CarouselItem key={index} className="relative w-full h-screen min-h-[700px]">
                            {/* Fallback image shown while the main image loads */}
                            <Image
                                src="/home_slide.jpg"
                                alt="Hero fallback"
                                fill
                                priority={index === 0}
                                quality={90}
                                className="object-cover"
                            />
                            {/* Main slide image fades in when loaded */}
                            <Image
                                src={slide.image}
                                alt={slide.headline}
                                fill
                                priority={index === 0}
                                quality={100}
                                className={cn("object-cover transition-opacity duration-500", loaded[index] ? "opacity-100" : "opacity-0")}
                                data-ai-hint={slide.hint}
                                onLoadingComplete={() => {
                                    setLoaded(prev => {
                                        const next = [...prev];
                                        next[index] = true;
                                        return next;
                                    });
                                }}
                                onError={() => {
                                    setLoaded(prev => {
                                        const next = [...prev];
                                        next[index] = false;
                                        return next;
                                    });
                                }}
                            />
                            {/* Luxury vintage overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#F3EADA]/70" />
                            {/* Brass top rail */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#C3A76D] via-[#E7D08A] to-[#B98A2A] opacity-90" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {/* Center overlay with hero-style heading */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="font-headline uppercase tracking-[0.2em] drop-shadow-2xl text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
                            {resolvedSlides[current].headline}
                        </h1>
                        <div className="mx-auto mt-3 h-[2px] w-20 bg-gradient-to-r from-yellow-400 to-yellow-200" />
                        <p className="mt-5 text-white/95 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                            {resolvedSlides[current].subheadline}
                        </p>
                        <div className="mt-8 max-w-2xl mx-auto px-4 sm:px-0">
                            <div className="rounded-2xl border border-white/15 bg-black/65 backdrop-blur-md p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                                <HeroSearch />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3">
                    {resolvedSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => api?.scrollTo(i)}
                            className={cn("h-2.5 w-2.5 rounded-full transition-all duration-300", current === i ? "bg-yellow-400 w-8" : "bg-white/70")}
                        />
                    ))}
                </div>

                <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-[#E7D08A]/30 h-12 w-12" />
                <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-[#E7D08A]/30 h-12 w-12" />
            </Carousel>
        </div>
    );
}
