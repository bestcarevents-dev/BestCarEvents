'use client';
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { Globe, Link as LinkIcon } from "lucide-react";
import { defaultPageContent, fetchPageHeader, type PageHeader } from "@/lib/pageContent";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [header, setHeader] = useState<PageHeader>(defaultPageContent.partners);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPageHeader('partners');
        setHeader(data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const partnersQuery = query(collection(db, "partners"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(partnersQuery);
      const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
      setPartners(data);
      setLoading(false);
    };
    fetchPartners();
  }, []);

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.businessName?.toLowerCase().includes(q) ||
      p.categories?.join(" ").toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white min-h-screen">
      <main className="py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">{header.title}</h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto md:mx-0">
                {header.description}
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/partners/become-a-partner">Become a Partner</Link>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-12">
            <div className="flex w-full gap-4">
              <Input
                placeholder="Search partner"
                className="flex-1 px-4 py-2 rounded border bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button className="px-8">Search</Button>
            </div>
          </div>

          {/* Partner Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-full text-center text-lg py-12 animate-pulse text-gray-600">Loading partners...</div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center text-lg py-12 text-gray-600">No partners found.</div>
            ) : filtered.map((partner, idx) => (
              <Link
                key={partner.documentId || idx}
                href={`/partners/${partner.documentId}`}
                className="group relative bg-white border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-yellow-600/60 animate-fade-in cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-600"
                tabIndex={0}
                aria-label={`View details for ${partner.businessName}`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="rounded-full border-4 border-white shadow-lg bg-white w-24 h-24 flex items-center justify-center overflow-hidden animate-fade-in">
                    <Image src={partner.logoUrl || "/placeholder.jpg"} alt={partner.businessName} width={96} height={96} className="object-contain w-full h-full" />
                  </div>
                </div>
                <div className="mt-16 w-full flex flex-col items-center">
                  <h3 className="text-xl font-bold font-headline text-yellow-600 mb-1 text-center group-hover:underline transition-all notranslate" translate="no" data-no-translate>{partner.businessName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-gray-600 justify-center">
                    {partner.categories?.map((cat: string) => (
                      <span key={cat} className="inline-block bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{cat}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 text-center line-clamp-3">{partner.description}</p>
                  <div className="flex gap-3 mt-auto">
                    {partner.website && (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 transition-colors" title="Website">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {partner.socialMedia && (
                      <a href={partner.socialMedia} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 transition-colors" title="Social Media">
                        <LinkIcon className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
