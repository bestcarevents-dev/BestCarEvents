"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Mail, ArrowLeft, ArrowRight, Clock, Star, Users } from "lucide-react";
import Image from "next/image";

export default function AuctionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const docRef = doc(db, "auctions", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAuction({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    if (id) fetchAuction();
  }, [id]);

  if (loading) {
    return <div className="container mx-auto py-24 text-center text-2xl font-bold animate-pulse">Loading auction details...</div>;
  }
  if (!auction) {
    return <div className="container mx-auto py-24 text-center text-red text-2xl font-bold flex flex-col items-center"><Star className="w-12 h-12 mb-4 animate-spin" />Auction not found.</div>;
  }

  // Format dates
  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-";
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString();
    if (typeof dateObj === "string" || typeof dateObj === "number") return new Date(dateObj).toLocaleDateString();
    return "-";
  };

  const images: string[] = (auction.imageUrls && Array.isArray(auction.imageUrls) && auction.imageUrls.length > 0)
    ? auction.imageUrls
    : (auction.imageUrl ? [auction.imageUrl] : []);

  return (
    <div className="container mx-auto px-4 py-10 bg-white animate-fade-in">
      <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={() => router.push('/auctions')}>
        <ArrowLeft className="w-4 h-4" /> Back to Auctions
      </Button>

      {/* Image Carousel */}
      <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl aspect-video mb-6 group">
        {images.length > 1 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-yellow-600 text-white rounded-full p-2 transition-colors shadow-lg"
            onClick={() => setCarouselIdx((prev) => (prev - 1 + images.length) % images.length)}
            aria-label="Previous image"
            type="button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        {images.length > 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-yellow-600 text-white rounded-full p-2 transition-colors shadow-lg"
            onClick={() => setCarouselIdx((prev) => (prev + 1) % images.length)}
            aria-label="Next image"
            type="button"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
        <div className="absolute inset-0">
          <Image src={images[carouselIdx] || "https://via.placeholder.com/900x500?text=No+Image"} alt={auction.auctionName} fill className="object-cover w-full h-full" />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="max-w-5xl mx-auto mb-8 flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button key={idx} className={`relative w-36 h-24 rounded-lg overflow-hidden border-2 ${carouselIdx === idx ? 'border-yellow-600' : 'border-transparent'}`} onClick={() => setCarouselIdx(idx)} aria-label={`Go to image ${idx + 1}`}>
              <Image src={img} alt={`Auction image ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-yellow-600 mb-2">{auction.auctionName}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">{auction.address}{auction.address ? ", " : ''}{auction.city}, {auction.state}, {auction.country}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {auction.auctionHouse && <Badge className="bg-yellow-600 text-white">{auction.auctionHouse}</Badge>}
              {auction.auctionType && <Badge className="bg-yellow-500 text-white">{auction.auctionType}</Badge>}
            </div>
            <p className="text-gray-700 text-lg max-w-2xl">{auction.description}</p>
          </div>

          {/* Info grid similar to hotel features area */}
          <Card className="p-6 bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-xl font-bold font-headline mb-3 text-gray-900">Event Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-900">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-yellow-600" /><span className="font-semibold">Start:</span> <span>{formatDate(auction.startDate)}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-yellow-600" /><span className="font-semibold">End:</span> <span>{formatDate(auction.endDate)}</span></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-yellow-600" /><span className="font-semibold">Viewing:</span> <span>{auction.viewingTimes || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-600" /><span className="font-semibold">Type:</span> <span>{auction.auctionType}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Contact Card */}
        <div className="lg:sticky lg:top-28 h-fit">
          <Card className="bg-white shadow-xl border border-yellow-300/70 animate-fade-in-up">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-headline font-bold text-gray-900">Contact Organizer</h2>
              <div className="flex items-center gap-2 text-gray-900"><Mail className="w-4 h-4 text-yellow-600" /><a href={`mailto:${auction.organizerContact}?subject=Inquiry about ${auction.auctionName}`} className="underline text-yellow-700">{auction.organizerContact}</a></div>
              <div className="flex items-center gap-2 text-gray-900"><MapPin className="w-4 h-4 text-yellow-600" /><span>{auction.city}, {auction.state}, {auction.country}</span></div>
              <div className="pt-2">
                <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
                  <a href={`mailto:${auction.organizerContact}?subject=Inquiry about ${auction.auctionName}`}><Mail className="mr-2 w-4 h-4" />Email Organizer</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Bottom Back Button */}
      <div className="mt-8 flex justify-center">
        <Button onClick={() => router.push('/auctions')} variant="outline" className="border-yellow-300 text-gray-900 hover:bg-yellow-50">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Auctions
        </Button>
      </div>
    </div>
  );
} 