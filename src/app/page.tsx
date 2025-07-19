import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeCheck, Trophy, Group } from 'lucide-react';
import HeroSlider from '@/components/hero-slider';
import EventListItem from '@/components/event-list-item';
import FeaturedCarCard from '@/components/featured-car-card';

const ValueProposition = () => (
    <div className="bg-background">
        <div className="container mx-auto px-4 py-24 sm:py-32">
             <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">A Community Built for Car Lovers</h2>
                <p className="mt-4 text-lg text-muted-foreground">We are more than a marketplace. We are a global community of enthusiasts, collectors, and connoisseurs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                        <BadgeCheck className="h-8 w-8 text-primary"/>
                    </div>
                    <h3 className="text-xl font-headline font-semibold text-foreground">Curated Marketplace</h3>
                    <p className="mt-2 text-muted-foreground">Access a curated marketplace of the world's most desirable vehicles.</p>
                </div>
                <div className="flex flex-col items-center">
                     <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                        <Trophy className="h-8 w-8 text-primary"/>
                    </div>
                    <h3 className="text-xl font-headline font-semibold text-foreground">Verified & Trusted</h3>
                    <p className="mt-2 text-muted-foreground">Connect with verified enthusiasts, collectors, and event organizers.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                        <Group className="h-8 w-8 text-primary"/>
                    </div>
                    <h3 className="text-xl font-headline font-semibold text-foreground">Premier Experiences</h3>
                    <p className="mt-2 text-muted-foreground">Discover and attend the most prestigious automotive events.</p>
                </div>
            </div>
        </div>
    </div>
);

const FeaturedCarsSection = () => {
    const featuredCars = [
        {
            id: 1,
            name: "Bugatti Tourbillon",
            year: "2026",
            price: "4,000,000",
            image: "https://i.ibb.co/C0yCg1Q/bugatti-tourbillon.webp",
            hint: "blue bugatti",
            specs: [
                { name: "0-60 mph", value: "2.0s" },
                { name: "Horsepower", value: "1800 hp" },
                { name: "Top Speed", value: "277 mph" }
            ]
        },
        {
            id: 2,
            name: "Chevrolet Corvette Z06",
            year: "2023",
            price: "112,700",
            image: "https://www.carpro.com/hubfs/2023-Chevrolet-Corvette-Z06-credit-chevrolet.jpeg",
            hint: "red corvette",
            specs: [
                { name: "0-60 mph", value: "2.6s" },
                { name: "Horsepower", value: "670 hp" },
                { name: "Top Speed", value: "195 mph" }
            ]
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">Featured Cars</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Explore a selection of exceptional vehicles from our curated marketplace.</p>
                </div>
                <div className="space-y-16">
                    {featuredCars.map((car) => <FeaturedCarCard key={car.id} {...car} />)}
                </div>
                <div className="text-center mt-16">
                    <Button size="lg" asChild className="font-bold rounded-full">
                        <Link href="/cars">View Marketplace <ArrowRight className="w-5 h-5 ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};


const FeaturedEventsSection = ({ title, description, items, href }: { title: string, description: string, items: any[], href: string }) => (
  <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">{title}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="space-y-8 max-w-5xl mx-auto">
              {items.map((item) => (
                  <EventListItem key={item.id} {...item} />
              ))}
          </div>
          <div className="text-center mt-16">
              <Button size="lg" asChild className="font-bold rounded-full">
                  <Link href={href}>
                      View All Events <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
              </Button>
          </div>
      </div>
  </section>
);


export default function Home() {
  const featuredEvents = [
    { id: 1, name: "Monaco Classic Car Show", date: "March 15-17, 2024", location: "Monte Carlo, Monaco", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop", hint: "classic car", description: "The most prestigious classic car exhibition in Europe, showcasing rare and exceptional vehicles from around the globe.", type: "Car Show", tags: ["Luxury", "Classic Cars", "Europe"] },
    { id: 2, name: "Vintage Racing Championship", date: "April 8-10, 2024", location: "Silverstone, UK", image: "https://images.unsplash.com/photo-1541447280853-518349a8d2d6?q=80&w=2070&auto=format&fit=crop", hint: "race car", description: "Experience the thrill of historic racing as legendary cars from different eras compete on the iconic Silverstone circuit.", type: "Racing", tags: ["Vintage", "Motorsport", "UK"] },
    { id: 3, name: "American Muscle Car Festival", date: "May 20-22, 2024", location: "Detroit, USA", image: "https://images.unsplash.com/photo-1603912443422-3c130a430b55?q=80&w=2070&auto=format&fit=crop", hint: "muscle car", description: "A celebration of pure American power, featuring classic and modern muscle cars, drag races, and live entertainment.", type: "Festival", tags: ["Muscle Cars", "USA", "Family Friendly"] },
  ];

  return (
    <div className="bg-background">
      <HeroSlider />
      <ValueProposition />
      <FeaturedCarsSection />
       <FeaturedEventsSection
        title="Upcoming Events"
        description="Discover the most exclusive automotive gatherings around the world."
        items={featuredEvents}
        href="/events"
      />
    </div>
  );
}
