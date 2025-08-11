"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getFirestore, collection, getDocs, orderBy, addDoc, deleteDoc, doc, serverTimestamp, query, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function SectionGalleriesAdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (user) => setIsAuthed(!!user));
  }, []);

  if (!isAuthed) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-gray-600">Please sign in to manage section galleries.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Section Galleries</h1>
      <Tabs defaultValue="events">
        <TabsList className="mb-6">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="auctions">Auctions</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="cars">Cars</TabsTrigger>
        </TabsList>

        <TabsContent value="events"><GalleryManager label="Events" collectionName="gallery_events" /></TabsContent>
        <TabsContent value="auctions"><GalleryManager label="Auctions" collectionName="gallery_auctions" /></TabsContent>
        <TabsContent value="hotels"><GalleryManager label="Hotels" collectionName="gallery_hotels" /></TabsContent>
        <TabsContent value="clubs"><GalleryManager label="Clubs" collectionName="gallery_clubs" /></TabsContent>
        <TabsContent value="cars"><GalleryManager label="Cars" collectionName="gallery_cars" /></TabsContent>
      </Tabs>
    </div>
  );
}

type GalleryItem = { id: string; url: string };

function GalleryManager({ label, collectionName }: { label: string; collectionName: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const db = useMemo(() => getFirestore(app), []);
  const storage = useMemo(() => getStorage(app), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const qy = query(collection(db, collectionName), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      const list: GalleryItem[] = snap.docs.map(d => {
        const data = d.data() as any;
        const url = data?.url || data?.imageUrl || (Array.isArray(data?.images) ? data.images[0] : "");
        return { id: d.id, url };
      }).filter(it => !!it.url);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [collectionName]);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const total = files.length;
      let done = 0;
      for (const file of Array.from(files)) {
        setProgressText(`Uploading ${done + 1} of ${total}...`);
        const storagePath = `section-galleries/${collectionName}/${Date.now()}_${file.name}`;
        const r = ref(storage, storagePath);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        await addDoc(collection(db, collectionName), { url, storagePath, createdAt: serverTimestamp() });
        done += 1;
      }
      await load();
    } finally {
      setUploading(false);
      setProgressText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const dref = doc(db, collectionName, id);
    try {
      const ds = await getDoc(dref);
      if (ds.exists()) {
        const data = ds.data() as any;
        const storagePath: string | undefined = data?.storagePath;
        const url: string | undefined = data?.url || data?.imageUrl;
        try {
          if (storagePath) await deleteObject(ref(storage, storagePath));
          else if (url) await deleteObject(ref(storage, url));
        } catch {}
      }
    } finally {
      await deleteDoc(dref);
      await load();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label} Gallery</CardTitle>
        <CardDescription>
          Keep this gallery to around 12 images for best performance. You can upload multiple images at once; remember to save when you're done.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-3">
          <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => onUpload(e.target.files)} />
          <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? (progressText || "Uploading...") : "Add Images"}
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-600">Loading images...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((it) => (
              <div key={it.id} className="relative group border rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="Gallery" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="destructive" onClick={() => onDelete(it.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 