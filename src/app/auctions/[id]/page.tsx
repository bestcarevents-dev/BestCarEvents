"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Mail, ArrowLeft, Clock, Star, Users } from "lucide-react";
import Image from "next/image";

export default function AuctionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="container mx-auto py-24 text-center text-destructive text-2xl font-bold flex flex-col items-center"><Star className="w-12 h-12 mb-4 animate-spin" />Auction not found.</div>;
  }

  // Format dates
  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-";
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString();
    if (typeof dateObj === "string" || typeof dateObj === "number") return new Date(dateObj).toLocaleDateString();
    return "-";
  };

  // Timeline for wow effect
  const timeline = [
    { label: "Start Date", value: formatDate(auction.startDate), icon: <Clock className="w-5 h-5 text-primary" /> },
    { label: "End Date", value: formatDate(auction.endDate), icon: <Clock className="w-5 h-5 text-secondary" /> },
    { label: "Viewing Times", value: auction.viewingTimes || "N/A", icon: <Users className="w-5 h-5 text-accent" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-10 bg-white animate-fade-in">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-10 group">
        <div className="relative w-full aspect-video bg-black">
          <Image src={auction.imageUrl || "https://via.placeholder.com/900x500?text=No+Image"} alt={auction.auctionName} fill className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        <div className="absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-white drop-shadow-lg animate-pop-in">{auction.auctionName}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-yellow-600 text-white animate-bounce-in">{auction.auctionHouse}</Badge>
              <Badge className="bg-yellow-500 text-white animate-bounce-in">{auction.auctionType}</Badge>
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-2">
            <span className="text-xl font-mono font-bold text-yellow-600 drop-shadow-lg">{auction.city}, {auction.state}, {auction.country}</span>
            <Button size="lg" className="mt-2 animate-pop" onClick={() => router.push('/auctions')}><ArrowLeft className="mr-2" />Back to Auctions</Button>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button variant="ghost" size="icon" className="hover:text-yellow-600" onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})}><Star /></Button>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-10 items-center justify-center animate-fade-in-up">
        {timeline.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-8 py-6 animate-pop-in" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="mb-2">{item.icon}</div>
            <div className="text-lg font-semibold text-yellow-600 mb-1">{item.label}</div>
            <div className="text-xl font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-8">
          <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Event Description</h2>
              <div className="prose max-w-none text-lg text-gray-600 mb-2 whitespace-pre-line">{auction.description}</div>
              <div className="text-base text-gray-900 mt-4"><span className="font-semibold text-gray-900">Venue:</span> <span className="text-gray-900">{auction.address}</span></div>
            </CardContent>
          </Card>
          <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Organizer & Contact</h2>
              <div className="mb-2"><span className="font-semibold text-gray-900">Organizer:</span> <span className="text-gray-900">{auction.organizerName}</span></div>
              <div className="mb-2"><span className="font-semibold text-gray-900">Contact:</span> <a href={`mailto:${auction.organizerContact}?subject=Inquiry about ${auction.auctionName}`} className="text-yellow-600 underline">{auction.organizerContact}</a></div>
            </CardContent>
          </Card>
        </div>
        {/* Quick Info */}
        <div className="space-y-8">
          <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
            <CardContent className="p-0">
              <h2 className="text-xl font-bold font-headline mb-4 text-yellow-600">Quick Info</h2>
              <div className="mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-yellow-600" /><span className="font-semibold text-gray-900">Start:</span> <span className="text-gray-900">{formatDate(auction.startDate)}</span></div>
              <div className="mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-yellow-600" /><span className="font-semibold text-gray-900">End:</span> <span className="text-gray-900">{formatDate(auction.endDate)}</span></div>
              <div className="mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-yellow-600" /><span className="font-semibold text-gray-900">Location:</span> <span className="text-gray-900">{auction.city}, {auction.state}, {auction.country}</span></div>
              <div className="mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /><span className="font-semibold text-gray-900">Type:</span> <span className="text-gray-900">{auction.auctionType}</span></div>
              <div className="mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-yellow-600" /><span className="font-semibold text-gray-900">Viewing:</span> <span className="text-gray-900">{auction.viewingTimes || 'N/A'}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Organizer Floating Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-fade-in-up">
        <Button size="lg" className="rounded-full shadow-2xl animate-pop" asChild>
          <a href={`mailto:${auction.organizerContact}?subject=Inquiry about ${auction.auctionName}`}>
            <Mail className="mr-2" />Contact Organizer
          </a>
        </Button>
      </div>
    </div>
  );
} 