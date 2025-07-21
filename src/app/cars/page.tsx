import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function CarsPage() {
    const cars = [
        { id: 1, name: "2021 Porsche 911 Turbo S", price: "203,500", location: "Los Angeles, CA", image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=2070&auto=format&fit=crop", hint: "silver porsche" },
        { id: 2, name: "2022 BMW M4 Competition", price: "85,000", location: "Miami, FL", image: "https://images.unsplash.com/photo-1633359023247-c035a7c2936a?q=80&w=2070&auto=format&fit=crop", hint: "green bmw" },
        { id: 3, name: "2020 Audi R8 V10", price: "175,000", location: "New York, NY", image: "https://images.unsplash.com/photo-1605515239963-503672953e5f?q=80&w=2070&auto=format&fit=crop", hint: "blue audi" },
        { id: 4, name: "2023 Lamborghini Huracan Evo", price: "330,000", location: "Las Vegas, NV", image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop", hint: "yellow lamborghini" },
        { id: 5, name: "2018 McLaren 720S", price: "280,000", location: "Chicago, IL", image: "https://images.unsplash.com/photo-1594910237616-8c8a143b3511?q=80&w=1974&auto=format&fit=crop", hint: "orange mclaren" },
        { id: 6, name: "2021 Ferrari F8 Tributo", price: "450,000", location: "San Francisco, CA", image: "https://images.unsplash.com/photo-1612763335559-a0cec3c6d594?q=80&w=2070&auto=format&fit=crop", hint: "red ferrari" },
        { id: 7, name: "2019 Aston Martin DBS Superleggera", price: "290,000", location: "Austin, TX", image: "https://images.unsplash.com/photo-1582269249781-b6a6c4f0e5b3?q=80&w=2070&auto=format&fit=crop", hint: "black aston martin" },
        { id: 8, name: "2022 Mercedes-AMG GT Black Series", price: "400,000", location: "Seattle, WA", image: "https://images.unsplash.com/photo-1617083232367-45e758a5c378?q=80&w=2070&auto=format&fit=crop", hint: "grey mercedes" },
        { id: 9, name: "2017 Ford GT", price: "950,000", location: "Detroit, MI", image: "https://images.unsplash.com/photo-1614266395300-580749a1738d?q=80&w=2070&auto=format&fit=crop", hint: "blue ford gt" },
        { id: 10, name: "2020 Chevrolet Corvette C8", price: "80,000", location: "Dallas, TX", image: "https://images.unsplash.com/photo-1593902897485-0550993c938b?q=80&w=2070&auto=format&fit=crop", hint: "orange corvette" },
        { id: 11, name: "2021 Nissan GT-R Nismo", price: "215,000", location: "Phoenix, AZ", image: "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?q=80&w=2070&auto=format&fit=crop", hint: "white nissan gtr" },
        { id: 12, name: "2022 Bugatti Chiron", price: "3,500,000", location: "Beverly Hills, CA", image: "https://images.unsplash.com/photo-1629450646450-a9c135a51052?q=80&w=2070&auto=format&fit=crop", hint: "blue bugatti" },
    ];

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Cars for Sale</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Browse thousands of unique cars from our curated marketplace.
          </p>
        </div>
        <Button asChild>
            <Link href="/cars/sell" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Sell Your Car
            </Link>
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg border mb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Search by make, model..." className="md:col-span-2" />
          <Input placeholder="Location (e.g. city, zip)" />
          <Select>
            <SelectTrigger><SelectValue placeholder="Sort by: Newest" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((car, index) => (
          <CarCard key={index} {...car} name={`${car.name} #${index + 1}`} />
        ))}
      </div>

      <div className="mt-12">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
