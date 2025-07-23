'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, Link as LinkIcon } from "lucide-react";
import PartnerAdRotator from '@/components/PartnerAdRotator';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const clubsQuery = query(collection(db, "clubs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(clubsQuery);
      const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
      setClubs(data);
      setLoading(false);
    };
    fetchClubs();
  }, []);

  return (
    <div className="bg-background text-foreground">
      <main className="py-12 md:py-10 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Clubs</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
                    Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world's most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
                </p>
            </div>
            <Button asChild>
                <Link href="/clubs/register" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Register Your Club
                </Link>
            </Button>
          </div>

          {/* Club Search Bar */}
          <div className="bg-card p-6 rounded-lg border mb-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search by club name or description..."
                className="md:col-span-2 px-4 py-2 rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Location (e.g. city, country)"
                className="px-4 py-2 rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select className="px-4 py-2 rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="newest">Sort by: Newest</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
              <Button>Search</Button>
            </div>
          </div>

          {/* Club Listing Grid */}
          <div className="mb-4">
            <PartnerAdRotator page="Car clubs" maxVisible={2} />
          </div>
          <div className="mt-16">
            <h2 className="text-3xl font-bold font-headline mb-8 text-center md:text-left">Discover the Community</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {loading ? (
                <div className="col-span-full text-center text-lg py-12 animate-pulse">Loading clubs...</div>
              ) : clubs.length === 0 ? (
                <div className="col-span-full text-center text-lg py-12 text-muted-foreground">No clubs found.</div>
              ) : clubs.map((club, idx) => (
                <Link
                  key={club.documentId || idx}
                  href={`/clubs/${club.documentId}`}
                  className="group relative bg-card border rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                  aria-label={`View details for ${club.clubName}`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="rounded-full border-4 border-background shadow-lg bg-white w-20 h-20 flex items-center justify-center overflow-hidden animate-fade-in">
                      <Image src={club.logoUrl || "/placeholder.jpg"} alt={club.clubName} width={80} height={80} className="object-contain w-full h-full" />
                    </div>
                  </div>
                  <div className="mt-12 w-full flex flex-col items-center">
                    <h3 className="text-xl font-bold font-headline text-primary mb-1 text-center group-hover:underline transition-all">{club.clubName}</h3>
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{club.city}, {club.country}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 text-center line-clamp-3">{club.description}</p>
                    <div className="flex gap-3 mt-auto">
                      {club.website && (
                        <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors" title="Website">
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                      {club.socialMediaLink && (
                        <a href={club.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors" title="Social Media">
                          <LinkIcon className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="inline-block bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow">{club.createdAt?.seconds ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : "New"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
