"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Link as LinkIcon, Mail, Calendar, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PartnerDetailPage() {
  const params = useParams();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  // Extract and validate ID
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null;

  useEffect(() => {
    const fetchPartner = async () => {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const db = getFirestore(app);
        const docRef = doc(db, "partners", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPartner({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching partner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [id]);

  useEffect(() => {
    const fetchAds = async () => {
      if (!partner) return;
      setAdsLoading(true);
      const db = getFirestore(app);
      // Query by uploadedByUserId or uploadedByUserEmail
      let q = query(collection(db, "partnerAds"), where("uploadedByUserId", "==", partner.uploadedByUserId || ""));
      let snapshot = await getDocs(q);
      let adsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // If no ads found by userId, try by email
      if (adsList.length === 0 && partner.uploadedByUserEmail) {
        q = query(collection(db, "partnerAds"), where("uploadedByUserEmail", "==", partner.uploadedByUserEmail));
        snapshot = await getDocs(q);
        adsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      }
      setAds(adsList);
      setAdsLoading(false);
    };
    if (partner) fetchAds();
  }, [partner]);

  if (!id) {
    return <div className="container mx-auto py-24 text-center text-red-500 text-2xl font-bold flex flex-col items-center">
      Invalid partner ID
    </div>;
  }

  if (loading) {
    return <div className="container mx-auto py-24 text-center text-2xl font-bold animate-pulse">Loading partner details...</div>;
  }
  
  if (!partner) {
    return <div className="container mx-auto py-24 text-center text-red-500 text-2xl font-bold flex flex-col items-center">
      Partner not found
    </div>;
  }

  return (
    <div className="bg-white min-h-screen animate-fade-in">
      {/* Hero Section */}
      <div className="relative w-full h-80 md:h-96 flex items-center justify-center overflow-hidden rounded-b-3xl shadow-xl mb-12">
        <Image
          src={partner.logoUrl || "/placeholder.jpg"}
          alt={partner.businessName}
          width={320}
          height={320}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-110 blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full text-center">
          <div className="mb-4 animate-fade-in-down">
            <div className="mx-auto rounded-full border-4 border-yellow-600 shadow-lg bg-white/90 w-32 h-32 flex items-center justify-center overflow-hidden">
              <Image src={partner.logoUrl || "/placeholder.jpg"} alt={partner.businessName} width={128} height={128} className="object-contain w-full h-full" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-yellow-600 drop-shadow-lg animate-fade-in-up notranslate" translate="no" data-no-translate>{partner.businessName}</h1>
          <div className="flex items-center justify-center gap-3 mt-2 animate-fade-in-up">
            <Badge className="bg-yellow-600 text-white font-bold ml-2 animate-pop">Partner</Badge>
          </div>
          <div className="mt-4 flex gap-4 justify-center animate-fade-in-up">
            {partner.website && (
              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-800 transition-colors" title="Website">
                <Globe className="w-6 h-6" />
              </a>
            )}
            {partner.socialMedia && (
              <a href={partner.socialMedia} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-800 transition-colors" title="Social Media">
                <LinkIcon className="w-6 h-6" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Partner Details */}
          <div className="md:col-span-2 space-y-10">
            <Card className="p-8 bg-white border border-gray-200 shadow-2xl animate-fade-in-up">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-3xl font-headline text-yellow-600 mb-2 animate-fade-in-up">About the Partner</CardTitle>
                <CardDescription className="text-lg text-gray-600 animate-fade-in-up">{partner.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-6 space-y-8">
                <div className="rounded-xl p-6 bg-gradient-to-br from-yellow-100 via-white to-yellow-200 border border-yellow-200 shadow animate-fade-in-up">
                  <h3 className="text-xl font-bold font-headline mb-2 text-yellow-700 animate-fade-in-up">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {partner.categories?.map((cat: string) => (
                      <Badge key={cat} className="bg-yellow-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{cat}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Partner Ads Section */}
            <Card className="p-8 bg-white border border-gray-200 shadow-2xl animate-fade-in-up">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-headline text-yellow-600 mb-2 animate-fade-in-up">Partner Ads</CardTitle>
                <CardDescription className="text-base text-gray-600 animate-fade-in-up">Ads posted by this partner.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-6">
                {adsLoading ? (
                  <div className="text-center py-8 animate-pulse">Loading ads...</div>
                ) : ads.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">No ads found for this partner.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map(ad => (
                      <Link key={ad.id} href={`/partners/ad/${ad.id}`} className="block bg-white border border-gray-200 rounded-xl p-4 shadow hover:shadow-lg transition group">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded overflow-hidden bg-white flex items-center justify-center">
                            <Image src={ad.imageUrls?.[0] || "/placeholder.jpg"} alt={ad.title || ad.adType} width={80} height={80} className="object-contain w-full h-full" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold mb-1 group-hover:underline text-gray-900">{ad.title || ad.shopName || ad.providerName || ad.experienceName || ad.serviceName}</h4>
                            <div className="text-xs text-gray-600 mb-1">{ad.adType}</div>
                            <div className="text-sm line-clamp-2 text-gray-900">{ad.description}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact & Meta */}
          <div className="space-y-10">
            <Card className="p-8 bg-white border border-gray-200 shadow-xl animate-fade-in-up">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-headline text-yellow-600 mb-2 animate-fade-in-up">Contact</CardTitle>
                <CardDescription className="text-base text-gray-600 animate-fade-in-up">For more information, reach out to the partner representative.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-4 space-y-4">
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Mail className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-900">{partner.partnerName}</span>
                </div>
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Mail className="w-5 h-5 text-gray-700" />
                  <a href={`mailto:${partner.contactEmail}`} className="text-blue-700 underline hover:text-blue-800 transition-colors">{partner.contactEmail}</a>
                </div>
                {partner.createdAt && (
                  <div className="flex items-center gap-3 animate-fade-in-up">
                    <Calendar className="w-5 h-5 text-gray-700" />
                    <span className="text-sm text-gray-700">Joined {partner.createdAt.seconds ? new Date(partner.createdAt.seconds * 1000).toLocaleDateString('en-GB') : partner.createdAt.toString()}</span>
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-3 animate-fade-in-up">
                    <Mail className="w-5 h-5 text-gray-700" />
                    <span className="text-gray-900">{partner.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-yellow-100 via-white to-yellow-200 border border-yellow-200 shadow-xl animate-fade-in-up">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-headline text-yellow-700 mb-2 animate-fade-in-up">Why Choose This Partner?</CardTitle>
                <CardDescription className="text-base text-gray-700 animate-fade-in-up">Trusted by car enthusiasts for quality and service.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-4 space-y-4">
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Expertise in their category</span>
                </div>
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Great customer service</span>
                </div>
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Highly recommended by the community</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 