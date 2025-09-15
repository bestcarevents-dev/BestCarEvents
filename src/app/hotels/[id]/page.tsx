"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Globe, MapPin, Star, ArrowLeft, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const featureIcons: Record<string, React.ReactNode> = {
  "Climate Controlled": <Star className="w-4 h-4 text-primary" />, // Replace with better icons if available
  "24/7 Security": <Star className="w-4 h-4 text-primary" />, // ...
  "Detailing Services": <Star className="w-4 h-4 text-primary" />, // ...
  "Member's Lounge": <Star className="w-4 h-4 text-primary" />, // ...
  "Battery Tending": <Star className="w-4 h-4 text-primary" />, // ...
  "Transportation": <Star className="w-4 h-4 text-primary" />, // ...
  "24/7 Access": <Star className="w-4 h-4 text-primary" />, // ...
  "Social Events": <Star className="w-4 h-4 text-primary" />, // ...
  "Sales & Brokerage": <Star className="w-4 h-4 text-primary" />, // ...
};

export default function HotelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const fetchHotel = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const ref = doc(db, "hotels", id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setHotel({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    if (id) fetchHotel();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-lg animate-pulse">Loading hotel details...</div>;
  }
  if (!hotel) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-red">Hotel not found.</div>;
  }

  const images: string[] = hotel.imageUrls || (hotel.imageUrl ? [hotel.imageUrl] : []);

  return (
    <div className="container mx-auto px-2 md:px-6 py-8 relative">
      <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" /> Back to Hotels
      </Button>
      {/* Immersive Image Carousel */}
      <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg aspect-video mb-8 group">
        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-primary text-white rounded-full p-2 transition-colors shadow-lg"
            onClick={() => setCarouselIdx((prev) => (prev - 1 + images.length) % images.length)}
            aria-label="Previous image"
            type="button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-primary text-white rounded-full p-2 transition-colors shadow-lg"
            onClick={() => setCarouselIdx((prev) => (prev + 1) % images.length)}
            aria-label="Next image"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
        <AnimatePresence initial={false}>
          <motion.div
            key={carouselIdx}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={images[carouselIdx] || "/placeholder.jpg"}
              alt={`Hotel image ${carouselIdx + 1}`}
              fill
              className="object-cover w-full h-full"
              priority
            />
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full border-2 ${carouselIdx === idx ? "bg-primary border-primary" : "bg-white/70 border-white"}`}
                onClick={() => setCarouselIdx(idx)}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary mb-2">{hotel.hotelName}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-lg text-muted-foreground">
                {hotel.privacyMode ? (
                  <>
                    {hotel.city}{hotel.state ? ", " + hotel.state : ""}{hotel.country ? ", " + hotel.country : ""}
                  </>
                ) : (
                  <>
                    {hotel.address}{hotel.city ? ", " + hotel.city : ""}{hotel.state ? ", " + hotel.state : ""}{hotel.country ? ", " + hotel.country : ""}
                  </>
                )}
              </span>
            </div>
            {hotel.privacyMode && (
              <p className="text-sm text-yellow-700 mb-4">The lister enabled privacy mode. Contact them for the exact location.</p>
            )}
            <p className="text-lg text-muted-foreground mb-4 max-w-2xl">{hotel.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-base px-3 py-1 font-semibold animate-pulse">{hotel.storageType}</Badge>
              {hotel.website && (
                <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline hover:text-accent transition-colors">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
            </div>
          </div>

          {/* Features & Amenities */}
          <div>
            <h2 className="text-2xl font-bold font-headline mb-3">Features & Amenities</h2>
            <div className="flex flex-wrap gap-3">
              {(hotel.features || []).map((feature: string, idx: number) => (
                <motion.div
                  key={feature}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05, type: "spring" }}
                >
                  <Badge variant="outline" className="flex items-center gap-2 px-3 py-2 text-base font-medium shadow hover:scale-105 transition-transform cursor-pointer">
                    {featureIcons[feature] || <Star className="w-4 h-4 text-primary" />} {feature}
                  </Badge>
                </motion.div>
              ))}
              {(!hotel.features || hotel.features.length === 0) && <span className="text-muted-foreground">No features listed.</span>}
            </div>
          </div>

          {/* Location Map Section */}
          {((hotel as any)?.locationData?.latitude && (hotel as any)?.locationData?.longitude) || hotel.address || hotel.city ? (
            <div>
              <h2 className="text-2xl font-bold font-headline mb-3">Location</h2>
              <div className="flex items-center gap-2 mb-3 text-gray-700">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-base">
                  {hotel.privacyMode ? (
                    <>
                      {hotel.city}{hotel.state ? ", " + hotel.state : ""}{hotel.country ? ", " + hotel.country : ""}
                    </>
                  ) : (
                    <>
                      {hotel.address}{hotel.city ? ", " + hotel.city : ""}{hotel.state ? ", " + hotel.state : ""}{hotel.country ? ", " + hotel.country : ""}
                    </>
                  )}
                </span>
              </div>
              {hotel.privacyMode && (
                <p className="text-sm text-yellow-700 mb-2">Privacy mode is on. Exact address hidden.</p>
              )}
              <div className="w-full overflow-hidden rounded-lg border">
                {(hotel as any)?.locationData?.latitude && (hotel as any)?.locationData?.longitude ? (
                  <iframe
                    title="Hotel location map"
                    src={`https://www.google.com/maps?q=${(hotel as any).locationData.latitude},${(hotel as any).locationData.longitude}&z=14&output=embed`}
                    className="w-full h-[320px] sm:h-[360px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <iframe
                    title="Hotel location map"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${hotel.address || ''} ${hotel.city || ''} ${hotel.state || ''} ${hotel.country || ''}`.trim())}&z=14&output=embed`}
                    className="w-full h-[320px] sm:h-[360px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
            </div>
          ) : null}

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold font-headline mb-2">Gallery</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    className={`relative w-40 h-28 rounded-lg overflow-hidden border-2 ${carouselIdx === idx ? "border-primary" : "border-transparent"}`}
                    onClick={() => setCarouselIdx(idx)}
                  >
                    <Image src={img} alt={`Hotel image ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Contact Card */}
        <div className="lg:sticky lg:top-28 h-fit">
          <Card className="shadow-xl border-2 border-primary/30 animate-fade-in-up">
            <CardHeader className="bg-primary/10 rounded-t-xl">
              <CardTitle className="text-2xl font-headline text-primary">Contact Facility</CardTitle>
              <CardDescription>Get in touch with the facility manager</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-base">{hotel.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-muted-foreground" />
                <span className="text-base">{hotel.contactName}</span>
              </div>
              {hotel.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">Visit Website</a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="text-base">{hotel.city}, {hotel.state}, {hotel.country}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 