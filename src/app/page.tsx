import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeCheck, Trophy, Group, Clock } from 'lucide-react';
import HeroSlider from '@/components/hero-slider';
import EventListItem from '@/components/event-list-item';
import FeaturedCarCard from '@/components/featured-car-card';
import CarCard from '@/components/car-card';
import { Card } from '@/components/ui/card';
import NewsletterSubscribe from '@/components/NewsletterSubscribe';

const ValueProposition = () => (
    <div className="bg-background">
        <div className="container mx-auto px-4 py-20">
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
            image: "https://cf-img-a-in.tosshub.com/sites/visualstory/wp/2024/07/opener-w-Bugatti-3.webp?size=*:675",
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
                <div className="space-y-8 max-w-5xl mx-auto">
                    {featuredCars.map((car) => <FeaturedCarCard key={String(car.id)} {...car} />)}
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


const FeaturedEventsSection = () => {
  const featuredEvents = [
    { id: 1, name: "Monaco Classic Car Show", date: "August 15-17, 2024", location: "Monte Carlo, Monaco", image: "https://img2.10bestmedia.com/Images/Photos/402463/Iola-Old-Car-Show_54_990x660.jpg?auto=webp&width=3840&quality=75", hint: "classic car show", description: "The most prestigious classic car exhibition in Europe, showcasing rare and exceptional vehicles from around the globe." },
    { id: 2, name: "Vintage Racing Championship", date: "September 8-10, 2024", location: "Silverstone, UK", image: "https://cdn.aarp.net/content/dam/aarp/travel/destinations/2024/01/1140-thunderbirds-detroit-michigan-car-show.jpg", hint: "race car track", description: "Experience the thrill of historic racing as legendary cars compete on the iconic Silverstone circuit." },
    { id: 3, name: "American Muscle Car Festival", date: "October 20-22, 2024", location: "Detroit, USA", image: "https://images.msv.com/high-res/7ebccdb2-57a4-47c7-b987-4d063cafa425.jpg", hint: "american muscle car", description: "A celebration of pure American power, featuring classic and modern muscle cars, drag races, and live entertainment." },
  ];
  return (
    <section className="py-20 sm:py-28 bg-background">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">Upcoming Events</h2>
                <p className="mt-4 text-lg text-muted-foreground">Discover the most exclusive automotive gatherings around the world.</p>
            </div>
            <div className="space-y-8 max-w-5xl mx-auto">
                {featuredEvents.map((item) => (
                    <EventListItem key={item.id} {...item} />
                ))}
            </div>
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
  const auctionItems = [
    { id: 1, name: "The Monterey Collector Auction", price: "24 Cars", location: "Live Now", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvqpUQXW_OsrzEA3ERbsZ3ZrLD0hXa4Lw-oQ&s", hint: "red porsche" },
    { id: 2, name: "European Classics Sale", price: "72 Cars", location: "Ends in 18h", image: "https://www.performanceracing.com/sites/default/files/styles/article_full/public/2022-03/0301fd.jpg?itok=zlTAgHBo", hint: "silver mercedes" },
    { id: 3, name: "Supercar Showcase Event", price: "15 Cars", location: "Ends in 5d", image: "https://img2.10bestmedia.com/Images/Photos/402463/Iola-Old-Car-Show_54_990x660.jpg?auto=webp&width=3840&quality=75", hint: "grey porsche" },
    { id: 4, name: "British Icons Auction", price: "31 Cars", location: "Ends in 1d", image: "https://cdn.aarp.net/content/dam/aarp/travel/destinations/2024/01/1140-thunderbirds-detroit-michigan-car-show.jpg", hint: "blue jaguar" },
  ];

  return (
    <section className="py-20 sm:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-headline font-extrabold sm:text-5xl tracking-tight text-foreground">Live Auctions</h2>
              <p className="mt-4 text-lg text-muted-foreground">Bid on rare and exclusive vehicles from around the globe.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctionItems.map(car => (
                 <div key={car.id} className="relative group">
                    <CarCard {...car} />
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{car.location}</span>
                    </div>
                </div>
              ))}
            </div>
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


export default function Home() {
  return (
    <div className="bg-background">
      <HeroSlider />
      <NewsletterSubscribe />
      <ValueProposition />
      <FeaturedCarsSection />
      <FeaturedEventsSection />
      <FeaturedAuctionsSection />
    </div>
  );
}
