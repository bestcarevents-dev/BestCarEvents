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

  if (loading) return <div className="container mx-auto px-4 py-12 text-center text-gray-600">Loading gallery...</div>;
  if (images.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-headline font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Gallery" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
} 