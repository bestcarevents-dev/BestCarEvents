import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AuctionsPage() {
  const auctionItems = [
    { id: 1, name: "1989 Porsche 911 Speedster", price: "155,000", location: "Bidding ends in 2 days", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop", hint: "red porsche" },
    { id: 2, name: "1957 Mercedes-Benz 300SL", price: "1,200,000", location: "Bidding ends in 18 hours", image: "https://images.unsplash.com/photo-1587829792651-3448f86381a1?q=80&w=2070&auto=format&fit=crop", hint: "silver mercedes" },
    { id: 3, name: "2005 Porsche Carrera GT", price: "1,500,000", location: "Bidding ends in 5 days", image: "https://images.unsplash.com/photo-1626964342353-763442468357?q=80&w=2070&auto=format&fit=crop", hint: "grey porsche" },
    { id: 4, name: "1966 Jaguar E-Type Series 1", price: "275,000", location: "Bidding ends in 1 day", image: "https://images.unsplash.com/photo-1541447280853-518349a8d2d6?q=80&w=2070&auto=format&fit=crop", hint: "blue jaguar" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Auctions</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Find and bid on the most exclusive collector cars from around the world.
          </p>
        </div>
        <Button asChild>
            <Link href="/auctions/submit" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Submit for Auction
            </Link>
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg border mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search auctions..." className="md:col-span-2" />
          <Select>
            <SelectTrigger><SelectValue placeholder="Sort by: Ending Soon" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="newly-listed">Newly Listed</SelectItem>
              <SelectItem value="highest-bid">Highest Bid</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold font-headline mb-6">Live Auctions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctionItems.map(car => (
             <div key={car.id} className="relative group">
                <CarCard {...car} />
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{car.location.replace("Bidding ends in ", "")}</span>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
