import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CarCard from '@/components/car-card';
import EventCard from '@/components/event-card';
import { ArrowRight, ChevronRight, Globe, TrendingUp, Users } from 'lucide-react';

const HeroSlider = () => (
  <div className="relative w-full h-[80vh] bg-black">
    <Carousel className="w-full h-full" opts={{ loop: true }} plugins={[
      // Autoplay({
      //   delay: 5000,
      // }),
    ]}>
      <CarouselContent>
        <CarouselItem>
          <div className="relative h-[80vh] w-full">
            <Image src="https://placehold.co/1920x1080.png" alt="Featured Car Event" fill objectFit="cover" className="opacity-40" data-ai-hint="car show" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
              <h1 className="text-4xl md:text-7xl font-headline font-bold drop-shadow-lg leading-tight">The Epicenter of Car Culture</h1>
              <p className="mt-4 text-lg md:text-xl max-w-3xl drop-shadow-md">Your ultimate destination for premier car events, exclusive sales, and a vibrant community of fellow enthusiasts.</p>
              <Button size="lg" className="mt-8 font-bold text-lg py-7 px-10 rounded-full" asChild>
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="relative h-[80vh] w-full">
            <Image src="https://placehold.co/1920x1080.png" alt="Car for Sale" fill objectFit="cover" className="opacity-40" data-ai-hint="sports car" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
              <h1 className="text-4xl md:text-7xl font-headline font-bold drop-shadow-lg leading-tight">Find Your Next Masterpiece</h1>
              <p className="mt-4 text-lg md:text-xl max-w-3xl drop-shadow-md">Browse a curated marketplace of exceptional vehicles from trusted dealers and private sellers.</p>
              <Button size="lg" className="mt-8 font-bold text-lg py-7 px-10 rounded-full" asChild>
                <Link href="/cars">Shop Cars</Link>
              </Button>
            </div>
          </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/20 hover:bg-black/50 border-white/20 hover:border-white" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/20 hover:bg-black/50 border-white/20 hover:border-white" />
    </Carousel>
  </div>
);

const SearchSection = () => (
    <div className="bg-background">
        <Card className="relative z-10 shadow-lg max-w-5xl mx-auto -mt-20 border-t-4 border-primary rounded-xl">
            <CardContent className="p-6 sm:p-8">
            <Tabs defaultValue="events">
                <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full h-12">
                <TabsTrigger value="events" className="rounded-full text-base data-[state=active]:bg-background data-[state=active]:text-foreground">Find an Event</TabsTrigger>
                <TabsTrigger value="cars" className="rounded-full text-base data-[state=active]:bg-background data-[state=active]:text-foreground">Find a Car</TabsTrigger>
                </TabsList>
                <TabsContent value="events" className="mt-6">
                <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                    <label htmlFor="event-keyword" className="text-sm font-medium ml-1">Keyword</label>
                    <Input id="event-keyword" placeholder="e.g. 'Cars & Coffee'" className="mt-1 h-12 text-base"/>
                    </div>
                    <div>
                    <label htmlFor="event-location" className="text-sm font-medium ml-1">Location</label>
                    <Input id="event-location" placeholder="City or Zip Code" className="mt-1 h-12 text-base"/>
                    </div>
                    <Button type="submit" className="w-full font-bold h-12 text-base md:col-start-3">Search</Button>
                </form>
                </TabsContent>
                <TabsContent value="cars" className="mt-6">
                 <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="car-keyword" className="text-sm font-medium ml-1">Keyword</label>
                        <Input id="car-keyword" placeholder="e.g. 'Porsche 911'" className="mt-1 h-12 text-base"/>
                    </div>
                    <div>
                        <label htmlFor="car-make" className="text-sm font-medium ml-1">Make</label>
                        <Select>
                            <SelectTrigger id="car-make" className="mt-1 h-12 text-base"><SelectValue placeholder="Any Make" /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="porsche">Porsche</SelectItem>
                            <SelectItem value="ferrari">Ferrari</SelectItem>
                            <SelectItem value="bmw">BMW</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="car-model" className="text-sm font-medium ml-1">Model</label>
                        <Input id="car-model" placeholder="Any Model" className="mt-1 h-12 text-base"/>
                    </div>
                    <Button type="submit" className="w-full font-bold h-12 text-base">Search</Button>
                </form>
                </TabsContent>
            </Tabs>
            </CardContent>
        </Card>
    </div>
);

const ValueProps = () => (
  <section className="py-24 sm:py-32">
    <div className="text-center max-w-3xl mx-auto">
      <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight">The Ultimate Hub for Car Enthusiasts</h2>
      <p className="mt-6 text-lg text-muted-foreground">Connecting you with the best of the automotive world, all in one place.</p>
    </div>
    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Globe className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-2xl font-headline font-semibold">Discover Events</h3>
            <p className="mt-2 text-muted-foreground">From local meetups to international expos, find events that fuel your passion.</p>
        </div>
        <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-2xl font-headline font-semibold">Buy & Sell</h3>
            <p className="mt-2 text-muted-foreground">A curated marketplace for unique and classic cars from trusted sellers.</p>
        </div>
        <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-2xl font-headline font-semibold">Join the Community</h3>
            <p className="mt-2 text-muted-foreground">Connect with fellow enthusiasts, clubs, and businesses in the car community.</p>
        </div>
    </div>
  </section>
);


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
      <HeroSlider />
      <SearchSection />
      <div className="container mx-auto px-4">
        <ValueProps />
        
        <div className="border-t">
            <section className="py-24 sm:py-32">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight">Featured Cars</h2>
                    <Button variant="ghost" asChild>
                      <Link href="/cars">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredCars.map(car => <CarCard key={car.id} {...car} />)}
                </div>
            </section>
        </div>

        <div className="border-t">
            <section className="py-24 sm:py-32">
            <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight">Upcoming Events</h2>
                 <Button variant="ghost" asChild>
                    <Link href="/events">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredEvents.map(event => <EventCard key={event.id} {...event} />)}
            </div>
            </section>
        </div>
      </div>
    </div>
  );
}
