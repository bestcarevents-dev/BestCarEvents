import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function CarHotelsPage() {
  const hotels = [
    { name: "The Auto Club", location: "New York, NY", image: "https://images.unsplash.com/photo-1582066249336-d24912fb6518?q=80&w=2070&auto=format&fit=crop", hint: "luxury garage", features: ["Climate Controlled", "24/7 Security", "Detailing Services"] },
    { name: "Collector's Garage", location: "Los Angeles, CA", image: "https://images.unsplash.com/photo-1614266395300-580749a1738d?q=80&w=2070&auto=format&fit=crop", hint: "modern garage", features: ["Member's Lounge", "Battery Tending", "Transportation"] },
    { name: "The Paddock", location: "Miami, FL", image: "https://images.unsplash.com/photo-1549399542-7e3f8b4aca54?q=80&w=1974&auto=format&fit=crop", hint: "car storage", features: ["Climate Controlled", "24/7 Access", "Social Events"] },
  ];
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="text-center md:text-left md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Hotels</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world’s most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
         </p>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Choosing the right hotel can considerably impact your travel experience. By considering factors such as location, price, facilities, reviews, and safety, you can make a decision that meets your needs and preferences. Choose one of our partners.
         </p>
        </div>
        <Button asChild>
            <Link href="/hotels/list" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                List Your Hotel
            </Link>
        </Button>
      </div>

      {/* Added Text */}
      <div className="mb-12 text-center md:text-left">
        
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hotels.map(hotel => (
          <Card key={hotel.name} className="flex flex-col">
            <CardHeader className="p-0">
              <div className="relative aspect-video">
                <Image src={hotel.image} alt={hotel.name} layout="fill" objectFit="cover" data-ai-hint={hotel.hint}/>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <CardTitle className="font-headline">{hotel.name}</CardTitle>
              <CardDescription>{hotel.location}</CardDescription>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {hotel.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button variant="outline" className="w-full">View Services</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
