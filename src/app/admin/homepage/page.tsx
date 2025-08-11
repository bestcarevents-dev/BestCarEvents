"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchHomepageContent, saveHomepageSection, defaultHomepageContent } from "@/lib/homepageContent";
import type { HomepageContent, HeroSlide, PromoContent, SectionCopy, ValuePropositionContent } from "@/types/homepage";
import { getFirestore, collection, getDocs, orderBy, addDoc, deleteDoc, doc, serverTimestamp, query, getDoc } from "firebase/firestore";
import { deleteObject } from "firebase/storage";

export default function AdminHomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthed(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchHomepageContent();
        setContent(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => {
    setSavingKey(String(key));
    try {
      await saveHomepageSection(key, value);
      setContent((prev) => ({ ...prev, [key]: value }));
    } finally {
      setSavingKey(null);
    }
  };

  if (!isAuthed) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-gray-600">Please sign in to edit homepage content.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-gray-600">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Homepage Content</h1>
      <Tabs defaultValue="hero">
        <TabsList className="mb-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="promo">Promo</TabsTrigger>
          <TabsTrigger value="value">Value Proposition</TabsTrigger>
          <TabsTrigger value="cars">Featured Cars</TabsTrigger>
          <TabsTrigger value="events">Featured Events</TabsTrigger>
          <TabsTrigger value="auctions">Featured Auctions</TabsTrigger>
          <TabsTrigger value="hotels">Featured Hotels</TabsTrigger>
          <TabsTrigger value="clubs">Featured Clubs</TabsTrigger>
          <TabsTrigger value="services">Other Services</TabsTrigger>
          <TabsTrigger value="galleries">Galleries</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroEditor
            slides={content.hero?.slides ?? []}
            onSave={async (slides) => onSave("hero", { slides })}
            saving={savingKey === "hero"}
          />
        </TabsContent>

        <TabsContent value="promo">
          <PromoEditor
            value={content.promo ?? defaultHomepageContent.promo!}
            onSave={(val) => onSave("promo", val)}
            saving={savingKey === "promo"}
          />
        </TabsContent>

        <TabsContent value="value">
          <ValueEditor
            value={content.value ?? defaultHomepageContent.value!}
            onSave={(val) => onSave("value", val)}
            saving={savingKey === "value"}
          />
        </TabsContent>

        <TabsContent value="cars">
          <SectionCopyEditor
            heading="Featured Cars"
            value={content.featuredCars ?? defaultHomepageContent.featuredCars!}
            onSave={(val) => onSave("featuredCars", val)}
            saving={savingKey === "featuredCars"}
          />
        </TabsContent>

        <TabsContent value="events">
          <SectionCopyEditor
            heading="Featured Events"
            value={content.featuredEvents ?? defaultHomepageContent.featuredEvents!}
            onSave={(val) => onSave("featuredEvents", val)}
            saving={savingKey === "featuredEvents"}
          />
        </TabsContent>

        <TabsContent value="auctions">
          <SectionCopyEditor
            heading="Featured Auctions"
            value={content.featuredAuctions ?? defaultHomepageContent.featuredAuctions!}
            onSave={(val) => onSave("featuredAuctions", val)}
            saving={savingKey === "featuredAuctions"}
          />
        </TabsContent>

        <TabsContent value="hotels">
          <SectionCopyEditor
            heading="Featured Hotels"
            value={content.featuredHotels ?? defaultHomepageContent.featuredHotels!}
            onSave={(val) => onSave("featuredHotels", val)}
            saving={savingKey === "featuredHotels"}
          />
        </TabsContent>

        <TabsContent value="clubs">
          <SectionCopyEditor
            heading="Featured Clubs"
            value={content.featuredClubs ?? defaultHomepageContent.featuredClubs!}
            onSave={(val) => onSave("featuredClubs", val)}
            saving={savingKey === "featuredClubs"}
          />
        </TabsContent>

        <TabsContent value="services">
          <SectionCopyEditor
            heading="Other Services"
            value={content.featuredServices ?? defaultHomepageContent.featuredServices!}
            onSave={(val) => onSave("featuredServices", val)}
            saving={savingKey === "featuredServices"}
          />
        </TabsContent>

        <TabsContent value="galleries">
          <GalleryTitlesEditor
            value={{
              main: content.galleries?.main ?? defaultHomepageContent.galleries!.main!,
              location1: content.galleries?.location1 ?? defaultHomepageContent.galleries!.location1!,
              location2: content.galleries?.location2 ?? defaultHomepageContent.galleries!.location2!,
            }}
            onSave={(val) => onSave("galleries", val as any)}
            saving={savingKey === "galleries"}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GalleryManager label="Main Gallery" collectionName="gallery" />
            <GalleryManager label="Location 1" collectionName="gallery_location1" />
            <GalleryManager label="Location 2" collectionName="gallery_location2" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeroEditor({ slides, onSave, saving }: { slides: HeroSlide[]; onSave: (slides: HeroSlide[]) => Promise<void>; saving: boolean }) {
  const [localSlides, setLocalSlides] = useState<HeroSlide[]>(slides);
  const storage = useMemo(() => getStorage(app), []);

  const addSlide = () => setLocalSlides((prev) => [...prev, { headline: "", subheadline: "", image: "" }]);
  const removeSlide = (index: number) => setLocalSlides((prev) => prev.filter((_, i) => i !== index));

  const uploadImage = async (file: File, index: number) => {
    const r = ref(storage, `homepage/hero/${Date.now()}_${file.name}`);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    setLocalSlides((prev) => prev.map((s, i) => (i === index ? { ...s, image: url } : s)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Slides</CardTitle>
        <CardDescription>Manage images and text shown in the homepage hero.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {localSlides.map((s, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={s.headline} onChange={(e) => setLocalSlides((prev) => prev.map((p, idx) => (idx === i ? { ...p, headline: e.target.value } : p)))} />
              <Label>Subheadline</Label>
              <Textarea value={s.subheadline} onChange={(e) => setLocalSlides((prev) => prev.map((p, idx) => (idx === i ? { ...p, subheadline: e.target.value } : p)))} />
              <Label>Hint (alt text)</Label>
              <Input value={s.hint ?? ""} onChange={(e) => setLocalSlides((prev) => prev.map((p, idx) => (idx === i ? { ...p, hint: e.target.value } : p)))} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={s.image} onChange={(e) => setLocalSlides((prev) => prev.map((p, idx) => (idx === i ? { ...p, image: e.target.value } : p)))} />
              <div>
                <Label>Upload Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files && uploadImage(e.target.files[0], i)} />
              </div>
            </div>
            <div className="flex items-end justify-between md:col-span-1">
              <Button variant="destructive" onClick={() => removeSlide(i)}>Remove</Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSlide}>Add Slide</Button>
          <Button onClick={() => onSave(localSlides)} disabled={saving}>
            {saving ? "Saving..." : "Save Hero"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PromoEditor({ value, onSave, saving }: { value: PromoContent; onSave: (v: PromoContent) => Promise<void>; saving: boolean }) {
  const [local, setLocal] = useState<PromoContent>(value);
  const update = (patch: Partial<PromoContent>) => setLocal((prev) => ({ ...prev, ...patch }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo Announcement</CardTitle>
        <CardDescription>Edit text and CTA for the promo banner.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Badge Text</Label>
          <Input value={local.badgeText} onChange={(e) => update({ badgeText: e.target.value })} />
        </div>
        <div>
          <Label>Main Heading</Label>
          <Input value={local.mainHeading} onChange={(e) => update({ mainHeading: e.target.value })} />
        </div>
        <div>
          <Label>Chips (comma-separated)</Label>
          <Input
            value={local.chips.join(", ")}
            onChange={(e) => update({ chips: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Cars Line Prefix</Label>
            <Input value={local.carsLinePrefix} onChange={(e) => update({ carsLinePrefix: e.target.value })} />
          </div>
          <div>
            <Label>Cars Line Highlight</Label>
            <Input value={local.carsLineHighlight} onChange={(e) => update({ carsLineHighlight: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>CTA Label</Label>
            <Input value={local.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })} />
          </div>
          <div>
            <Label>CTA Link</Label>
            <Input value={local.ctaHref} onChange={(e) => update({ ctaHref: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(local)} disabled={saving}>
            {saving ? "Saving..." : "Save Promo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCopyEditor({ heading, value, onSave, saving }: { heading: string; value: SectionCopy; onSave: (v: SectionCopy) => Promise<void>; saving: boolean }) {
  const [local, setLocal] = useState<SectionCopy>(value);
  const update = (patch: Partial<SectionCopy>) => setLocal((prev) => ({ ...prev, ...patch }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
        <CardDescription>Edit section heading, description and CTA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input value={local.title} onChange={(e) => update({ title: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={local.description} onChange={(e) => update({ description: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>CTA Label</Label>
            <Input value={local.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })} />
          </div>
          <div>
            <Label>CTA Link</Label>
            <Input value={local.ctaHref} onChange={(e) => update({ ctaHref: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(local)} disabled={saving}>
            {saving ? "Saving..." : "Save Section"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ValueEditor({ value, onSave, saving }: { value: ValuePropositionContent; onSave: (v: ValuePropositionContent) => Promise<void>; saving: boolean }) {
  const [local, setLocal] = useState<ValuePropositionContent>(value);
  const update = (patch: Partial<ValuePropositionContent>) => setLocal((prev) => ({ ...prev, ...patch }));
  const updateItem = (index: number, patch: Partial<ValuePropositionContent["items"][number]>) =>
    setLocal((prev) => ({ ...prev, items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Value Proposition</CardTitle>
        <CardDescription>Edit the heading, blurb, and the three items.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Heading</Label>
          <Input value={local.heading} onChange={(e) => update({ heading: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={local.description} onChange={(e) => update({ description: e.target.value })} />
        </div>
        <div className="grid gap-4">
          {local.items.map((item, i) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded p-3" key={i}>
              <div>
                <Label>Item {i + 1} Title</Label>
                <Input value={item.title} onChange={(e) => updateItem(i, { title: e.target.value })} />
              </div>
              <div>
                <Label>Item {i + 1} Description</Label>
                <Input value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(local)} disabled={saving}>
            {saving ? "Saving..." : "Save Value"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GalleryTitlesEditor({ value, onSave, saving }: { value: NonNullable<HomepageContent["galleries"]>; onSave: (v: NonNullable<HomepageContent["galleries"]>) => Promise<void>; saving: boolean }) {
  const [local, setLocal] = useState(value);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery Titles</CardTitle>
        <CardDescription>Edit the titles for the gallery sections.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Main Gallery Title</Label>
          <Input value={local.main?.title ?? ""} onChange={(e) => setLocal((p) => ({ ...p, main: { ...(p.main || {}), title: e.target.value } }))} />
          <div className="mt-2">
            <Label className="mr-2">Layout</Label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={local.main?.layout ?? 'random'}
              onChange={(e) => setLocal((p) => ({ ...p, main: { ...(p.main || {}), layout: e.target.value as 'random' | 'simple' } }))}
            >
              <option value="random">Random (masonry)</option>
              <option value="simple">Simple grid</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Location 1 Title</Label>
          <Input value={local.location1?.title ?? ""} onChange={(e) => setLocal((p) => ({ ...p, location1: { ...(p.location1 || {}), title: e.target.value } }))} />
          <div className="mt-2">
            <Label className="mr-2">Layout</Label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={local.location1?.layout ?? 'random'}
              onChange={(e) => setLocal((p) => ({ ...p, location1: { ...(p.location1 || {}), layout: e.target.value as 'random' | 'simple' } }))}
            >
              <option value="random">Random (masonry)</option>
              <option value="simple">Simple grid</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Location 2 Title</Label>
          <Input value={local.location2?.title ?? ""} onChange={(e) => setLocal((p) => ({ ...p, location2: { ...(p.location2 || {}), title: e.target.value } }))} />
          <div className="mt-2">
            <Label className="mr-2">Layout</Label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={local.location2?.layout ?? 'random'}
              onChange={(e) => setLocal((p) => ({ ...p, location2: { ...(p.location2 || {}), layout: e.target.value as 'random' | 'simple' } }))}
            >
              <option value="random">Random (masonry)</option>
              <option value="simple">Simple grid</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(local)} disabled={saving}>
            {saving ? "Saving..." : "Save Galleries"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type GalleryItem = { id: string; url: string };

function GalleryManager({ label, collectionName }: { label: string; collectionName: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const storage = useMemo(() => getStorage(app), []);
  const db = useMemo(() => getFirestore(app), []);
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const total = files.length;
      let done = 0;
      for (const file of Array.from(files)) {
        setProgressText(`Uploading ${done + 1} of ${total}...`);
        const storagePath = `homepage/${collectionName}/${Date.now()}_${file.name}`;
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
    if (!confirm("Delete this image from the gallery?")) return;
    const dref = doc(db, collectionName, id);
    try {
      const ds = await getDoc(dref);
      if (ds.exists()) {
        const data = ds.data() as any;
        const storagePath: string | undefined = data?.storagePath;
        const url: string | undefined = data?.url || data?.imageUrl;
        try {
          if (storagePath) {
            await deleteObject(ref(storage, storagePath));
          } else if (url) {
            await deleteObject(ref(storage, url));
          }
        } catch (e) {
          // ignore storage deletion failure
        }
      }
    } finally {
      await deleteDoc(dref);
    }
    await load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label} Images</CardTitle>
        <CardDescription>Upload and manage images for {label.toLowerCase()}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-3">
          <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => onUpload(e.target.files)} />
          <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? (progressText || "Uploading...") : "Add Images"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Tip: You can upload multiple images at once, or add more later. Try to keep each gallery to about 12 images. After managing images, remember to save your changes on this page.
        </p>
        {loading ? (
          <p className="text-sm text-gray-600">Loading images...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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