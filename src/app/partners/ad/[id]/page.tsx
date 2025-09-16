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
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function PartnerAdDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const ref = doc(db, "partnerAds", id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setAd({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    if (id) fetchAd();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-lg text-gray-600 animate-pulse">Loading ad details...</div>;
  }
  if (!ad) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-red">Ad not found.</div>;
  }

  const images: string[] = ad.imageUrls || (ad.imageUrl ? [ad.imageUrl] : []);

  // Helper to render ad-specific fields
  function renderAdFields(ad: any) {
    switch (ad.adType) {
      case "Tires & Wheels":
        return (
          <>
            <Field label="Product Name" value={ad.title} />
            <Field label="Brand" value={ad.brand} />
            <Field label="Size" value={ad.size} />
            <Field label="Price" value={ad.price} />
          </>
        );
      case "Car Parts & Accessories":
        return (
          <>
            <Field label="Product Name" value={ad.title} />
            <Field label="Part Type" value={ad.partType} />
            <Field label="Brand" value={ad.brand} />
            <Field label="Compatible Vehicles" value={ad.compatibleVehicles} />
            <Field label="Price" value={ad.price} />
          </>
        );
      case "Car Transport & Logistics":
        return (
          <>
            <Field label="Service Name" value={ad.title} />
            <Field label="Service Type" value={ad.serviceType} />
            <Field label="Coverage Area" value={ad.coverageArea} />
            <Field label="Price Range" value={ad.priceRange} />
          </>
        );
      case "Car Detailing & Wrapping":
        return (
          <>
            <Field label="Service Name" value={ad.title} />
            <Field label="Service Type" value={ad.serviceType} />
            <Field label="Price Range" value={ad.priceRange} />
          </>
        );
      case "Restoration & Custom Shops":
        return (
          <>
            <Field label="Shop Name" value={ad.shopName} />
            <Field label="Specialties" value={ad.specialties} />
            <Field label="Years in Business" value={ad.yearsInBusiness} />
            <Field label="Price Range" value={ad.priceRange} />
          </>
        );
      case "Classic Car Insurance":
        return (
          <>
            <Field label="Provider Name" value={ad.providerName} />
            <Field label="Insurance Types" value={ad.insuranceTypes} />
            <Field label="Coverage Area" value={ad.coverageArea} />
            <Field label="Price Range" value={ad.priceRange} />
          </>
        );
      case "Driving Experiences":
        return (
          <>
            <Field label="Experience Name" value={ad.experienceName} />
            <Field label="Experience Type" value={ad.experienceType} />
            <Field label="Location" value={ad.location} />
            <Field label="Price" value={ad.price} />
          </>
        );
      case "Finance / Leasing / Storage":
        return (
          <>
            <Field label="Service Name" value={ad.serviceName} />
            <Field label="Service Type" value={ad.serviceType} />
            <Field label="Coverage Area" value={ad.coverageArea} />
            <Field label="Price Range" value={ad.priceRange} />
          </>
        );
      default:
        return null;
    }
  }

  // Ensure website links include a protocol
  const normalizeUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-2 md:px-6 py-8 relative">
        {/* Back */}
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="text-gray-700 border-gray-300 hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Images Section */}
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Main Image */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-zoom-in bg-white" onClick={() => setZoomOpen(true)}>
              <Image
                src={images[carouselIdx] || "/placeholder.jpg"}
                alt={`Ad image ${carouselIdx + 1}`}
                fill
                className="object-contain w-full h-full bg-white"
                priority
              />
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 mt-4 w-full justify-center">
              {images.map((img, idx) => (
                <button
                  key={img}
                  className={`relative w-16 h-16 rounded border-2 ${carouselIdx === idx ? "border-primary" : "border-gray-200"} overflow-hidden bg-white`}
                  onClick={() => setCarouselIdx(idx)}
                  aria-label={`Show image ${idx + 1}`}
                  type="button"
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain" />
                </button>
              ))}
            </div>
            {/* Zoom Modal */}
            <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
              <DialogContent className="max-w-3xl p-0 bg-black flex flex-col items-center">
                <div className="relative w-full aspect-video max-h-[80vh]">
                  <Image
                    src={images[carouselIdx] || "/placeholder.jpg"}
                    alt={`Zoomed image ${carouselIdx + 1}`}
                    fill
                    className="object-contain w-full h-full bg-black"
                    priority
                  />
                </div>
                <div className="flex gap-2 mt-4 w-full justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={img}
                      className={`relative w-16 h-16 rounded border-2 ${carouselIdx === idx ? "border-primary" : "border-muted"} overflow-hidden bg-white`}
                      onClick={() => setCarouselIdx(idx)}
                      aria-label={`Show image ${idx + 1}`}
                      type="button"
                    >
                      <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain" />
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Product Info Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-gray-900 mb-2">{ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-base px-3 py-1 font-semibold bg-gray-100 text-gray-700 border-gray-200">{ad.adType}</Badge>
              </div>
              {/* Show price if available */}
              {ad.price && (
                <div className="text-2xl font-semibold text-gray-900 mb-2">{ad.price}</div>
              )}
              {ad.priceRange && (
                <div className="text-xl font-semibold text-gray-900 mb-2">{ad.priceRange}</div>
              )}
              <p className="text-base text-gray-700 mb-4 max-w-xl leading-relaxed">{ad.description}</p>
              <div className="flex flex-wrap gap-4 mb-4">
                {renderAdFields(ad)}
              </div>
            </div>
            {/* Sticky Contact Card */}
            <div className="lg:sticky lg:top-28 h-fit">
              <Card className="shadow-xl border border-gray-100 bg-white">
                <CardHeader className="bg-white rounded-t-xl">
                  <CardTitle className="text-2xl font-headline text-gray-900">Contact</CardTitle>
                  <CardDescription className="text-gray-700">Get in touch with the advertiser</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    {ad.contactEmail ? (
                      <a href={`mailto:${ad.contactEmail}`} className="text-base text-blue-600 underline">{ad.contactEmail}</a>
                    ) : (
                      <span className="text-base">N/A</span>
                    )}
                  </div>
                  {ad.contactName && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-muted-foreground" />
                      <span className="text-base">{ad.contactName}</span>
                    </div>
                  )}
                  {ad.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-base">{ad.phone}</span>
                    </div>
                  )}
                  {ad.website && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <a href={normalizeUrl(ad.website)!} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 underline truncate max-w-[220px]">{ad.website}</a>
                      </div>
                      <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        <a href={normalizeUrl(ad.website)!} target="_blank" rel="noopener noreferrer">Visit Website</a>
                      </Button>
                    </div>
                  )}
                  {ad.coverageArea && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span className="text-base">{ad.coverageArea}</span>
                    </div>
                  )}
                  {ad.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span className="text-base">{ad.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="flex flex-col min-w-[160px]">
      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{label}</span>
      <span className="text-base font-medium text-gray-900 break-words">{value}</span>
    </div>
  );
} 