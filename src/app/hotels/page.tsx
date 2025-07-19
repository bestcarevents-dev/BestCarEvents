import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CarHotelsPage() {
  const hotels = [
    { name: "The Auto Club", location: "New York, NY", image: "https://placehold.co/600x400.png", hint: "luxury garage", features: ["Climate Controlled", "24/7 Security", "Detailing Services"] },
    { name: "Collector's Garage", location: "Los Angeles, CA", image: "https://placehold.co/600x400.png", hint: "modern garage", features: ["Member's Lounge", "Battery Tending", "Transportation"] },
    { name: "The Paddock", location: "Miami, FL", image: "https://placehold.co/600x400.png", hint: "car storage", features: ["Climate Controlled", "24/7 Access", "Social Events"] },
  ];
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Hotels &amp; Storage</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Secure, climate-controlled storage and services for your prized vehicle.
        </p>
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
