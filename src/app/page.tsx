import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import CarCard from '@/components/car-card';
import EventCard from '@/components/event-card';
import { ArrowRight, Search } from 'lucide-react';

const HeroSection = () => (
  <div className="relative bg-black text-white overflow-hidden">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative pt-48 pb-64">
        <div className="absolute inset-0">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Luxury car"
            fill
            priority
            quality={100}
            className="object-cover opacity-30"
            data-ai-hint="dark luxury car"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        </div>

        <div className="relative text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            <span className="block">The Destination For</span>
            <span className="block text-primary">Automotive Enthusiasts</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-neutral-300 sm:max-w-3xl">
            Discover premier car events, find rare and exclusive vehicles, and connect with a community that shares your passion.
          </p>
          <form className="mt-12 sm:flex sm:max-w-xl sm:mx-auto">
            <div className="min-w-0 flex-1">
              <label htmlFor="search" className="sr-only">Search</label>
              <Input
                id="search"
                type="search"
                placeholder="Search for cars or events..."
                className="block w-full h-14 bg-white/10 border-neutral-600 placeholder:text-neutral-400 focus:ring-primary focus:border-primary text-lg"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-3">
              <Button type="submit" size="lg" className="block w-full h-14 text-lg font-bold px-8">
                <Search className="h-5 w-5 mr-2 -ml-1" />
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);

const TrustBadges = () => (
  <div className="bg-black">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center">
            <p className="font-bold text-3xl text-white">10,000+</p>
            <p className="text-sm text-neutral-400 uppercase tracking-wider">Listings</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-3xl text-white">500+</p>
            <p className="text-sm text-neutral-400 uppercase tracking-wider">Trusted Partners</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-3xl text-white">1M+</p>
            <p className="text-sm text-neutral-400 uppercase tracking-wider">Community Members</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-3xl text-white">4.9/5</p>
            <p className="text-sm text-neutral-400 uppercase tracking-wider">User Rating</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);


const FeaturedSection = ({ title, items, href, card: ItemCard }: { title: string, items: any[], href: string, card: React.ElementType }) => (
  <section className="py-20 sm:py-28">
    <div className="flex justify-between items-center mb-12">
      <h2 className="text-3xl font-headline font-extrabold sm:text-4xl tracking-tight">{title}</h2>
      <Button variant="ghost" asChild>
        <Link href={href}>View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
      </Button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item) => <ItemCard key={item.id} {...item} />)}
    </div>
  </section>
);


const CtaSection = () => (
    <div className="bg-muted">
        <div className="container mx-auto px-4 py-20 sm:py-24">
            <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12">
                <Image 
                    src="https://placehold.co/1200x600.png"
                    alt="Car interior"
                    fill
                    className="object-cover opacity-20"
                    data-ai-hint="car interior"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
                <div className="relative max-w-xl">
                    <h2 className="text-3xl font-extrabold font-headline sm:text-4xl">Ready to Sell Your Car?</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Reach thousands of potential buyers by listing your car on our marketplace. It's simple, fast, and effective.</p>
                    <Button size="lg" className="mt-8">
                        List Your Car Now
                    </Button>
                </div>
            </div>
        </div>
    </div>
)


export default function Home() {
  const featuredCars = [
    { id: 1, name: "2021 Porsche 911 Turbo S", price: "203,500", location: "Los Angeles, CA", image: "https://placehold.co/600x400.png", hint: "silver porsche" },
    { id: 2, name: "1967 Ford Mustang Shelby GT500", price: "250,000", location: "Miami, FL", image: "https://placehold.co/600x400.png", hint: "classic mustang" },
    { id: 3, name: "2022 Ferrari SF90 Stradale", price: "511,295", location: "New York, NY", image: "https://placehold.co/600x400.png", hint: "red ferrari" },
    { id: 4, name: "2020 McLaren 720S", price: "301,500", location: "Chicago, IL", image: "https://placehold.co/600x400.png", hint: "orange mclaren" },
  ];

  const featuredEvents = [
    { id: 1, name: "Pebble Beach Concours d'Elegance", date: "August 18, 2024", location: "Pebble Beach, CA", image: "https://placehold.co/600x400.png", hint: "vintage cars" },
    { id: 2, name: "The Amelia Concours d'Elegance", date: "March 2, 2025", location: "Amelia Island, FL", image: "https://placehold.co/600x400.png", hint: "luxury cars" },
    { id: 3, name: "Goodwood Festival of Speed", date: "July 11, 2025", location: "Chichester, UK", image: "https://placehold.co/600x400.png", hint: "race track" },
    { id: 4, name: "Cars & Coffee Los Angeles", date: "Every Saturday", location: "Los Angeles, CA", image: "https://placehold.co/600x400.png", hint: "parked cars" },
  ];

  return (
    <div className="bg-background">
      <HeroSection />
      <TrustBadges />
      <div className="container mx-auto px-4">
        <FeaturedSection title="Featured Cars For Sale" items={featuredCars} href="/cars" card={CarCard} />
      </div>
      <CtaSection />
       <div className="container mx-auto px-4">
        <FeaturedSection title="Upcoming Events" items={featuredEvents} href="/events" card={EventCard} />
       </div>
    </div>
  );
}
