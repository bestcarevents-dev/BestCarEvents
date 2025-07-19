
"use client"
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"

const slides = [
    {
        headline: "Experience the Thrill of the Drive",
        subheadline: "Discover premier car events, find rare and exclusive vehicles, and connect with a community that shares your passion.",
        image: "https://placehold.co/1920x1080.png",
        hint: "sports car sunset",
        cta: "Explore Events"
    },
    {
        headline: "Find Your Next Masterpiece",
        subheadline: "Our curated marketplace features thousands of unique vehicles, from timeless classics to modern supercars.",
        image: "https://placehold.co/1920x1080.png",
        hint: "vintage car show",
        cta: "Browse Cars"
    },
    {
        headline: "Join a Community of Enthusiasts",
        subheadline: "Attend exclusive meetups, track days, and auctions. The ultimate destination for automotive lovers.",
        image: "https://placehold.co/1920x1080.png",
        hint: "car community meetup",
        cta: "Become a Member"
    }
]

export default function HeroSlider() {
    return (
        <div className="relative h-[90vh] md:h-screen w-full text-white overflow-hidden">
            <Carousel
                className="w-full h-full"
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
                opts={{ loop: true }}
            >
                <CarouselContent>
                    {slides.map((slide, index) => (
                        <CarouselItem key={index} className="relative w-full h-full">
                            <Image
                                src={slide.image}
                                alt={slide.headline}
                                fill
                                priority={index === 0}
                                quality={100}
                                className="object-cover"
                                data-ai-hint={slide.hint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative text-center container mx-auto px-4">
                                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
                                        {slide.headline}
                                    </h1>
                                    <p className="mt-6 max-w-lg mx-auto text-xl text-neutral-200 sm:max-w-3xl">
                                        {slide.subheadline}
                                    </p>
                                    <div className="mt-10">
                                        <Button size="lg" className="font-bold">
                                            {slide.cta} <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 border-0 h-12 w-12" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 border-0 h-12 w-12" />
            </Carousel>
        </div>
    );
}