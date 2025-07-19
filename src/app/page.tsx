import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CarCard from '@/components/car-card';
import EventCard from '@/components/event-card';
import { ChevronRight, Globe, TrendingUp, Users } from 'lucide-react';

const HeroSlider = () => (
  <div className="relative w-full h-[70vh] -mt-20">
    <Carousel className="w-full h-full" opts={{ loop: true }}>
      <CarouselContent>
        <CarouselItem>
          <div className="relative h-[70vh] w-full">
            <Image src="https://placehold.co/1920x1080.png" alt="Featured Car Event" layout="fill" objectFit="cover" className="brightness-50" data-ai-hint="car show" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
              <h1 className="text-4xl md:text-6xl font-headline font-bold drop-shadow-lg">Find Your Next Car Event</h1>
              <p className="mt-4 text-lg md:text-xl max-w-2xl drop-shadow-md">Discover the best car shows, track days, and meetups near you.</p>
              <Button size="lg" className="mt-8 font-bold">Explore Events</Button>
            </div>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="relative h-[70vh] w-full">
            <Image src="https://placehold.co/1920x1080.png" alt="Car for Sale" layout="fill" objectFit="cover" className="brightness-50" data-ai-hint="sports car" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
              <h1 className="text-4xl md:text-6xl font-headline font-bold drop-shadow-lg">Your Dream Car Awaits</h1>
              <p className="mt-4 text-lg md:text-xl max-w-2xl drop-shadow-md">Browse thousands of unique cars from dealers and private sellers.</p>
              <Button size="lg" className="mt-8 font-bold">Shop Cars</Button>
            </div>
          </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white" />
    </Carousel>
  </div>
);

const SearchSection = () => (
  <Card className="-mt-16 relative z-10 shadow-lg max-w-4xl mx-auto">
    <CardContent className="p-4 sm:p-6">
      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Find an Event</TabsTrigger>
          <TabsTrigger value="cars">Find a Car</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-6">
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-2">
              <label htmlFor="event-keyword" className="text-sm font-medium">Keyword</label>
              <Input id="event-keyword" placeholder="e.g. 'Cars & Coffee'" className="mt-1"/>
            </div>
            <div>
              <label htmlFor="event-location" className="text-sm font-medium">Location</label>
              <Input id="event-location" placeholder="City or Zip Code" className="mt-1"/>
            </div>
            <Button type="submit" className="w-full font-bold">Search</Button>
          </form>
        </TabsContent>
        <TabsContent value="cars" className="mt-6">
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="car-keyword" className="text-sm font-medium">Keyword</label>
              <Input id="car-keyword" placeholder="e.g. 'Porsche 911'" className="mt-1"/>
            </div>
            <div>
              <label htmlFor="car-make" className="text-sm font-medium">Make</label>
              <Select>
                <SelectTrigger id="car-make" className="mt-1"><SelectValue placeholder="Any Make" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porsche">Porsche</SelectItem>
                  <SelectItem value="ferrari">Ferrari</SelectItem>
                  <SelectItem value="bmw">BMW</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <label htmlFor="car-model" className="text-sm font-medium">Model</label>
              <Input id="car-model" placeholder="Any Model" className="mt-1"/>
            </div>
            <Button type="submit" className="w-full font-bold">Search</Button>
          </form>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

const ValueProps = () => (
  <section className="py-16 sm:py-24">
    <div className="text-center">
      <h2 className="text-3xl font-headline font-extrabold sm:text-4xl">The Ultimate Hub for Car Enthusiasts</h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Connecting you with the best of the automotive world, all in one place.</p>
    </div>
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 font-headline">Discover Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">From local meetups to international expos, find events that fuel your passion.</p>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 font-headline">Buy & Sell</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">A curated marketplace for unique and classic cars from trusted sellers.</p>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 font-headline">Join the Community</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect with fellow enthusiasts, clubs, and businesses in the car community.</p>
        </CardContent>
      </Card>
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

        <section className="py-16 sm:py-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-headline font-extrabold sm:text-4xl">Featured Cars</h2>
            <Button variant="ghost">View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map(car => <CarCard key={car.id} {...car} />)}
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-headline font-extrabold sm:text-4xl">Upcoming Events</h2>
            <Button variant="ghost">View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map(event => <EventCard key={event.id} {...event} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
