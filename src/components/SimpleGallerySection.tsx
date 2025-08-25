"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function SimpleGallerySection({ title, collectionName, max = 12 }: { title: string; collectionName: string; max?: number }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        const qy = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(max));
        const snap = await getDocs(qy);
        const urls = snap.docs.map(d => {
          const data = d.data() as any;
          return data?.url || data?.imageUrl || (Array.isArray(data?.images) ? data.images[0] : undefined);
        }).filter(Boolean) as string[];
        setImages(urls);
      } catch (e) {
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [collectionName, max]);

  if (loading) return <div className="container mx-auto px-4 py-8 md:py-12 text-center text-gray-600">Loading gallery...</div>;
  if (images.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-headline font-bold text-gray-900 mb-4 md:mb-6">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0">
          {images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={url} 
                alt="Gallery" 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              {/* Vintage vignette highlight on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
} 