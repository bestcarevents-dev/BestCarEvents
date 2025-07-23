'use client';
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import PartnerAdRotator from '@/components/PartnerAdRotator';

export default function CarHotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, "hotels"));
      const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
      setHotels(data);
      setLoading(false);
    };
    fetchHotels();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
        <div className="text-center md:text-left md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Hotels</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
            Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world's most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
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
      <div className="mb-4">
        <PartnerAdRotator page="Car Hotels" maxVisible={2} />
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center text-lg py-12 animate-pulse">Loading hotels...</div>
        ) : hotels.length === 0 ? (
          <div className="col-span-full text-center text-lg py-12 text-muted-foreground">No hotels found.</div>
        ) : hotels
          .slice()
          .sort((a, b) => (b.featured === true ? 1 : 0) - (a.featured === true ? 1 : 0))
          .map(hotel => (
          <Card key={hotel.documentId} className="flex flex-col">
            <CardHeader className="p-0 relative">
              <Link href={`/hotels/${hotel.documentId}`} className="block relative aspect-video">
                <Image src={hotel.imageUrls?.[0] || hotel.imageUrl || "https://via.placeholder.com/800x500?text=No+Image"} alt={hotel.hotelName} layout="fill" objectFit="cover" data-ai-hint={hotel.hotelName}/>
                {hotel.featured && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
                  </div>
                )}
              </Link>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <CardTitle className="font-headline">
                <Link href={`/hotels/${hotel.documentId}`}>{hotel.hotelName}</Link>
              </CardTitle>
              <CardDescription>{hotel.city}, {hotel.state}</CardDescription>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {(hotel.features || []).map((feature: string) => (
                  <li key={feature} className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/hotels/${hotel.documentId}`}>View Services</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
