"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Users, Link as LinkIcon, Mail, Calendar, Star } from "lucide-react";
import Image from "next/image";

export default function ClubDetailPage() {
  const { id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClub = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const docRef = doc(db, "clubs", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setClub({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    if (id) fetchClub();
  }, [id]);

  if (loading) {
    return <div className="container mx-auto py-24 text-center text-2xl font-bold animate-pulse">Loading club details...</div>;
  }
  if (!club) {
    return <div className="container mx-auto py-24 text-center text-destructive text-2xl font-bold flex flex-col items-center">Club not found.</div>;
  }

  return (
    <div className="bg-white min-h-screen animate-fade-in">
      {/* Hero Section */}
      <div className="relative w-full h-80 md:h-96 flex items-center justify-center overflow-hidden rounded-b-3xl shadow-xl mb-12">
        <Image
          src={club.logoUrl || "/placeholder.jpg"}
          alt={club.clubName}
          width={320}
          height={320}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-110 blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full text-center">
          <div className="mb-4 animate-fade-in-down">
            <div className="mx-auto rounded-full border-4 border-yellow-600 shadow-lg bg-white/90 w-32 h-32 flex items-center justify-center overflow-hidden">
              <Image src={club.logoUrl || "/placeholder.jpg"} alt={club.clubName} width={128} height={128} className="object-contain w-full h-full" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-yellow-600 drop-shadow-lg animate-fade-in-up">{club.clubName}</h1>
          <div className="flex items-center justify-center gap-3 mt-2 animate-fade-in-up">
            <Users className="w-5 h-5 text-yellow-800" />
            <span className="text-lg font-medium text-gray-900">{club.city}, {club.country}</span>
            <Badge className="bg-yellow-600 text-white font-bold ml-2 animate-pop">Club</Badge>
          </div>
          <div className="mt-4 flex gap-4 justify-center animate-fade-in-up">
            {club.website && (
              <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-800 transition-colors" title="Website">
                <Globe className="w-6 h-6" />
              </a>
            )}
            {club.socialMediaLink && (
              <a href={club.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-800 transition-colors" title="Social Media">
                <LinkIcon className="w-6 h-6" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Club Details */}
          <div className="md:col-span-2 space-y-10">
            <Card className="p-8 bg-white border border-gray-200 shadow-2xl animate-fade-in-up">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-3xl font-headline text-yellow-600 mb-2 animate-fade-in-up">About the Club</CardTitle>
                <CardDescription className="text-lg text-gray-600 animate-fade-in-up">{club.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-6 space-y-8">
                <div className="rounded-xl p-6 bg-gradient-to-br from-yellow-100 via-white to-yellow-200 border border-yellow-200 shadow animate-fade-in-up">
                  <h3 className="text-xl font-bold font-headline mb-2 text-yellow-700 animate-fade-in-up">Membership Criteria</h3>
                  <p className="text-gray-600 text-base animate-fade-in-up whitespace-pre-line">{club.membershipCriteria}</p>
                </div>
                <div className="rounded-xl p-6 bg-gradient-to-br from-yellow-100 via-white to-yellow-200 border border-yellow-200 shadow animate-fade-in-up">
                  <h3 className="text-xl font-bold font-headline mb-2 text-yellow-700 animate-fade-in-up">Typical Activities</h3>
                  <p className="text-gray-600 text-base animate-fade-in-up whitespace-pre-line">{club.typicalActivities}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Meta */}
          <div className="space-y-10">
            <Card className="p-8 bg-white border border-gray-200 shadow-xl animate-fade-in-up">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-headline text-yellow-600 mb-2 animate-fade-in-up">Contact</CardTitle>
                <CardDescription className="text-base text-gray-600 animate-fade-in-up">For more information, reach out to the club representative.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-4 space-y-4">
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Mail className="w-5 h-5 text-yellow-800" />
                  <span className="font-medium text-gray-900">{club.contactName}</span>
                </div>
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Mail className="w-5 h-5 text-yellow-800" />
                  <a href={`mailto:${club.contactEmail}`} className="text-yellow-600 underline hover:text-yellow-800 transition-colors">{club.contactEmail}</a>
                </div>
                {club.createdAt && (
                  <div className="flex items-center gap-3 animate-fade-in-up">
                    <Calendar className="w-5 h-5 text-yellow-800" />
                    <span className="text-sm text-gray-600">Joined {club.createdAt.seconds ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : club.createdAt.toString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-yellow-100 via-white to-yellow-200 border border-yellow-200 shadow-xl animate-fade-in-up">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-headline text-yellow-700 mb-2 animate-fade-in-up">Why Join?</CardTitle>
                <CardDescription className="text-base text-gray-700 animate-fade-in-up">Experience exclusivity, camaraderie, and unforgettable automotive adventures.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-4 space-y-4">
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Exclusive events and parties</span>
                </div>
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Recreational races & scenic drives</span>
                </div>
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Networking with fellow enthusiasts</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 