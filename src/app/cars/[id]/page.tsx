"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Share2, Heart, CheckCircle, AlertCircle, Mail } from "lucide-react";
import Image from "next/image";

const featureIcons: Record<string, any> = {
  "Air Conditioning": <CheckCircle className="w-4 h-4 mr-1 text-primary" />, // Add more icons as needed
  "Power Steering": <CheckCircle className="w-4 h-4 mr-1 text-primary" />,
  "Power Windows": <CheckCircle className="w-4 h-4 mr-1 text-primary" />,
  "Sunroof/Moonroof": <Star className="w-4 h-4 mr-1 text-yellow-500" />,
  "Navigation System": <MapPin className="w-4 h-4 mr-1 text-blue-500" />,
  "Bluetooth": <CheckCircle className="w-4 h-4 mr-1 text-primary" />,
  "Backup Camera": <CheckCircle className="w-4 h-4 mr-1 text-primary" />,
  "Leather Seats": <CheckCircle className="w-4 h-4 mr-1 text-primary" />,
  "Heated Seats": <CheckCircle className="w-4 h-4 mr-1 text-primary" />,
};

export default function CarDetailsPage() {
  const { id } = useParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaApi, setEmblaApi] = useState<any>(null);
  const images = car?.images || ["https://via.placeholder.com/800x500?text=No+Image"];

  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const docRef = doc(db, "cars", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCar({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    if (id) fetchCar();
  }, [id]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  if (loading) {
    return <div className="container mx-auto py-24 text-center text-2xl font-bold animate-pulse">Loading car details...</div>;
  }
  if (!car) {
    return <div className="container mx-auto py-24 text-center text-red text-2xl font-bold flex flex-col items-center"><AlertCircle className="w-12 h-12 mb-4" />Car not found.</div>;
  }

  // Highlight badges
  const highlightBadges = [];
  if (car.mileage && car.mileage < 20000) highlightBadges.push("Low Mileage");
  if (car.features && car.features.includes("Sunroof/Moonroof")) highlightBadges.push("Rare Find");

  return (
    <div className="container mx-auto px-4 py-10 bg-white animate-fade-in">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl mb-10">
        <Carousel className="w-full" setApi={setEmblaApi}>
          <CarouselContent>
            {images.map((img: string, idx: number) => (
              <CarouselItem key={idx} className="aspect-video flex items-center justify-center bg-black">
                <Image src={img} alt={`Car image ${idx + 1}`} width={900} height={500} className="object-contain w-full h-full transition-transform duration-500 hover:scale-105" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          {/* Custom Large Left/Right Buttons */}
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-yellow-600 text-black hover:text-white rounded-full p-3 shadow-lg text-3xl transition-colors"
            onClick={() => emblaApi && emblaApi.scrollPrev()}
            aria-label="Previous image"
            style={{ minWidth: 48, minHeight: 48 }}
          >
            &#8592;
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-yellow-600 text-black hover:text-white rounded-full p-3 shadow-lg text-3xl transition-colors"
            onClick={() => emblaApi && emblaApi.scrollNext()}
            aria-label="Next image"
            style={{ minWidth: 48, minHeight: 48 }}
          >
            &#8594;
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white rounded-full px-4 py-1 text-sm font-semibold shadow">
            {currentIndex + 1} / {images.length}
          </div>
        </Carousel>
        <div className="absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-white drop-shadow-lg">{car.year} {car.make} {car.model}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {highlightBadges.map(badge => (
                <Badge key={badge} className="bg-yellow-600 text-white animate-bounce-in">{badge}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-2">
            <span className="text-3xl font-mono font-bold text-yellow-600 drop-shadow-lg">{car.currency} {car.price}</span>
            <Button size="lg" className="mt-2 animate-pop" onClick={() => setShowContact(true)}><Mail className="mr-2" />Contact Seller</Button>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button variant="ghost" size="icon" className="hover:text-yellow-600"><Share2 /></Button>
          <Button variant="ghost" size="icon" className="hover:text-red-600"><Heart /></Button>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Specs & Features */}
        <div className="md:col-span-2 space-y-8">
          <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Body:</span> <span className="text-gray-900">{car.bodyStyle}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Engine:</span> <span className="text-gray-900">{car.engine}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Transmission:</span> <span className="text-gray-900">{car.transmission}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Drivetrain:</span> <span className="text-gray-900">{car.drivetrain}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Exterior:</span> <span className="text-gray-900">{car.exteriorColor}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Interior:</span> <span className="text-gray-900">{car.interiorColor}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Mileage:</span> <span className="text-gray-900">{car.mileage?.toLocaleString()} mi</span></div>
                {car.vin && <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">VIN:</span> <span className="text-gray-900">{car.vin}</span></div>}
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">Location:</span> <MapPin className="w-4 h-4 inline-block mr-1 text-yellow-600" /><span className="text-gray-900">{car.location}</span></div>
              </div>
              <h3 className="text-xl font-bold font-headline mb-2 text-yellow-600">Features</h3>
              <div className="flex flex-wrap gap-2">
                {(car.features || []).map((feature: string) => (
                  <Badge key={feature} className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 border border-gray-200 animate-fade-in-up">
                    {featureIcons[feature] || <CheckCircle className="w-4 h-4 mr-1 text-yellow-600" />} {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Condition & Description</h2>
              <div className="prose max-w-none text-lg text-gray-600 mb-2 whitespace-pre-line">{car.description}</div>
              <div className="text-base text-gray-900 mt-4"><span className="font-semibold text-gray-900">Condition:</span> <span className="text-gray-900">{car.conditionDetails}</span></div>
            </CardContent>
          </Card>

          {/* Video Section */}
          {car.videoUrl && (
            <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
              <CardContent className="p-0">
                <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Professional Video</h2>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <video 
                    src={car.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                    preload="metadata"
                    poster={car.images?.[0] || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Professional video or virtual tour of this vehicle
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Seller Info */}
        <div className="space-y-8">
          <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-xl font-bold font-headline mb-4 text-yellow-600">Seller Information</h2>
              <div className="mb-2"><span className="font-semibold text-gray-900">Name:</span> <span className="text-gray-900">{car.sellerName}</span></div>
              <div className="mb-2"><span className="font-semibold text-gray-900">Contact:</span> <a href={`mailto:${car.sellerContact}`} className="text-yellow-600 underline">{car.sellerContact}</a></div>
              <div className="mb-2"><span className="font-semibold text-gray-900">Location:</span> <MapPin className="w-4 h-4 inline-block mr-1 text-yellow-600" /><span className="text-gray-900">{car.location}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Seller Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-lg font-semibold mb-2">Send an email to the seller to inquire about this car.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Close</Button>
              </DialogClose>
              <Button asChild variant="default">
                <a href={`mailto:${car.sellerContact}?subject=Inquiry about ${car.year} ${car.make} ${car.model}`}>Email Seller</a>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 