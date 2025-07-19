import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CarsPage() {
    const cars = Array(12).fill({ id: 1, name: "2021 Porsche 911 Turbo S", price: "203,500", location: "Los Angeles, CA", image: "https://placehold.co/600x400.png", hint: "silver porsche" });

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Cars for Sale</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse thousands of unique cars from our curated marketplace.
        </p>
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
