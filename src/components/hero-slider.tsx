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
                            <Image
                                src={slide.image}
                                alt={slide.headline}
                                fill
                                priority={index === 0}
                                quality={100}
                                className="object-cover"
                                data-ai-hint={slide.hint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/70 via-black/40 to-transparent"></div>
                            {/* Warm blend into page background */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#E0D8C1]/70" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline text-shadow-lg">
                            {resolvedSlides[current].headline}
                        </h1>
                        <p className="mt-6 text-xl text-neutral-200 text-shadow-md max-w-3xl mx-auto">
                            {resolvedSlides[current].subheadline}
                        </p>
                        <div className="mt-10 max-w-2xl mx-auto px-4 sm:px-0">
                            <HeroSearch />
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

                <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 text-white bg-amber-900/30 hover:bg-amber-900/50 border-yellow-200/30 h-12 w-12" />
                <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 text-white bg-amber-900/30 hover:bg-amber-900/50 border-yellow-200/30 h-12 w-12" />
            </Carousel>
        </div>
    );
}
