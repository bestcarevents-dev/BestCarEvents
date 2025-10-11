"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchAllStaticPages, saveStaticPage } from "@/lib/staticPages";
import type { StaticPageKey } from "@/types/staticPages";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

type EditorState = Record<StaticPageKey, ReturnType<typeof createDefaultState>>;

function createDefaultState() {
  return {
    title: "",
    subtitle: "",
    body: "",
    images: [] as { url: string; alt?: string }[],
    contact: {
      email: "",
      phone: "",
      address: "",
      mapEmbedUrl: "",
      instagram: "",
      facebook: "",
      twitter: "",
      youtube: "",
      linkedin: "",
      website: "",
      tiktok: "",
      telegram: "",
      whatsapp: "",
    },
  };
}

export default function AdminStaticPages() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<StaticPageKey | null>(null);
  const [state, setState] = useState<EditorState>({ about: createDefaultState(), contact: createDefaultState(), privacy: createDefaultState(), impressum: createDefaultState() });
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const storage = getStorage(app);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => setIsAuthed(!!user));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllStaticPages();
        setState({
          about: {
            title: data.about.title,
            subtitle: data.about.subtitle || "",
            body: data.about.body,
            images: data.about.images || [],
            contact: {
              email: data.about.contact?.email || "",
              phone: data.about.contact?.phone || "",
              address: data.about.contact?.address || "",
              mapEmbedUrl: data.about.contact?.mapEmbedUrl || "",
              instagram: data.about.contact?.instagram || "",
              facebook: data.about.contact?.facebook || "",
              twitter: data.about.contact?.twitter || "",
              youtube: data.about.contact?.youtube || "",
              linkedin: data.about.contact?.linkedin || "",
              website: data.about.contact?.website || "",
              tiktok: data.about.contact?.tiktok || "",
              telegram: data.about.contact?.telegram || "",
              whatsapp: data.about.contact?.whatsapp || "",
            },
          },
          contact: {
            title: data.contact.title,
            subtitle: data.contact.subtitle || "",
            body: data.contact.body,
            images: data.contact.images || [],
            contact: {
              email: data.contact.contact?.email || "",
              phone: data.contact.contact?.phone || "",
              address: data.contact.contact?.address || "",
              mapEmbedUrl: data.contact.contact?.mapEmbedUrl || "",
              instagram: data.contact.contact?.instagram || "",
              facebook: data.contact.contact?.facebook || "",
              twitter: data.contact.contact?.twitter || "",
              youtube: data.contact.contact?.youtube || "",
              linkedin: data.contact.contact?.linkedin || "",
              website: data.contact.contact?.website || "",
              tiktok: data.contact.contact?.tiktok || "",
              telegram: data.contact.contact?.telegram || "",
              whatsapp: data.contact.contact?.whatsapp || "",
            },
          },
          privacy: {
            title: data.privacy.title,
            subtitle: data.privacy.subtitle || "",
            body: data.privacy.body,
            images: data.privacy.images || [],
            contact: {
              email: "",
              phone: "",
              address: "",
              mapEmbedUrl: "",
              instagram: "",
              facebook: "",
              twitter: "",
              youtube: "",
              linkedin: "",
              website: "",
              tiktok: "",
              telegram: "",
              whatsapp: "",
            },
          },
          impressum: {
            title: data.impressum.title,
            subtitle: data.impressum.subtitle || "",
            body: data.impressum.body,
            images: data.impressum.images || [],
            contact: {
              email: data.impressum.contact?.email || "",
              phone: data.impressum.contact?.phone || "",
              address: data.impressum.contact?.address || "",
              mapEmbedUrl: data.impressum.contact?.mapEmbedUrl || "",
              instagram: data.impressum.contact?.instagram || "",
              facebook: data.impressum.contact?.facebook || "",
              twitter: data.impressum.contact?.twitter || "",
              youtube: data.impressum.contact?.youtube || "",
              linkedin: data.impressum.contact?.linkedin || "",
              website: data.impressum.contact?.website || "",
              tiktok: data.impressum.contact?.tiktok || "",
              telegram: data.impressum.contact?.telegram || "",
              whatsapp: data.impressum.contact?.whatsapp || "",
            },
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (key: StaticPageKey) => {
    setSaving(key);
    try {
      await saveStaticPage(key, { ...state[key], updatedAt: Date.now() } as any);
    } finally {
      setSaving(null);
    }
  };

  const handlePing = async (url: string) => {
    if (!url) return false;
    try {
      const res = await fetch("/api/utils/ping", { method: "POST", body: JSON.stringify({ url }) });
      const json = await res.json();
      return Boolean(json?.ok);
    } catch {
      return false;
    }
  };

  const handleUpload = async (pageKey: StaticPageKey, idx: number, file?: File | null) => {
    if (!file) return;
    const key = `${pageKey}-${idx}`;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const path = `static-pages/${pageKey}/${Date.now()}_${file.name}`;
      const objRef = storageRef(storage, path);
      await uploadBytes(objRef, file);
      const url = await getDownloadURL(objRef);
      setState((prev) => {
        const copy = { ...prev } as EditorState;
        const images = [...copy[pageKey].images];
        images[idx] = { ...images[idx], url };
        copy[pageKey] = { ...copy[pageKey], images } as any;
        return copy;
      });
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  if (!isAuthed) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-gray-600">Please sign in to edit static pages.</p>
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

  const renderImages = (key: StaticPageKey) => (
    <div className="space-y-3">
      <Label>Images</Label>
      {state[key].images.map((img, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
          <Input
            placeholder="Image URL"
            className="md:col-span-4"
            value={img.url}
            onChange={(e) =>
              setState((prev) => {
                const copy = { ...prev };
                copy[key].images[idx] = { ...copy[key].images[idx], url: e.target.value };
                return { ...copy };
              })
            }
            onBlur={async (e) => {
              const ok = await handlePing(e.target.value);
              if (!ok) alert("Image URL is not reachable");
            }}
          />
          <Input
            placeholder="Alt text"
            className="md:col-span-2"
            value={img.alt || ""}
            onChange={(e) =>
              setState((prev) => {
                const copy = { ...prev };
                copy[key].images[idx] = { ...copy[key].images[idx], alt: e.target.value };
                return { ...copy };
              })
            }
          />
          <div className="flex gap-2">
            <input
              type="file"
              id={`file-${key}-${idx}`}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleUpload(key, idx, e.target.files?.[0] || null)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => document.getElementById(`file-${key}-${idx}`)?.click()}
              disabled={!!uploading[`${key}-${idx}`]}
            >
              {uploading[`${key}-${idx}`] ? "Uploading..." : "Upload"}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                setState((prev) => {
                  const copy = { ...prev };
                  copy[key].images = copy[key].images.filter((_, i) => i !== idx);
                  return { ...copy };
                })
              }
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          setState((prev) => ({ ...prev, [key]: { ...prev[key], images: [...prev[key].images, { url: "", alt: "" }] } }))
        }
      >
        Add Image
      </Button>
      <Button
        type="button"
        onClick={() => {
          setState((prev) => ({ ...prev, [key]: { ...prev[key], images: [...prev[key].images, { url: "", alt: "" }] } }));
          const newIdx = state[key].images.length;
          requestAnimationFrame(() => document.getElementById(`file-${key}-${newIdx}`)?.click());
        }}
      >
        Upload New Image
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="about">
        <TabsList className="mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {(["about", "contact", "privacy", "impressum"] as StaticPageKey[]).map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{key}</span>
                  <Button onClick={() => handleSave(key)} disabled={saving === key}>
                    {saving === key ? "Saving..." : "Save"}
                  </Button>
                </CardTitle>
                <CardDescription>Edit the {key} page content shown publicly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={state[key].title}
                      onChange={(e) => setState((prev) => ({ ...prev, [key]: { ...prev[key], title: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input
                      value={state[key].subtitle}
                      onChange={(e) => setState((prev) => ({ ...prev, [key]: { ...prev[key], subtitle: e.target.value } }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    className="min-h-48"
                    value={state[key].body}
                    onChange={(e) => setState((prev) => ({ ...prev, [key]: { ...prev[key], body: e.target.value } }))}
                  />
                  <p className="text-sm text-muted-foreground mt-2">Use blank lines to separate paragraphs.</p>
                </div>

                {key === "contact" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={state.contact.contact.email}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, email: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={state.contact.contact.phone}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, phone: e.target.value } } }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={state.contact.contact.address}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, address: e.target.value } } }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Google Maps Embed URL</Label>
                      <Input
                        value={state.contact.contact.mapEmbedUrl}
                        onBlur={async (e) => {
                          const ok = await handlePing(e.target.value);
                          if (!ok) alert("Map URL is not reachable");
                        }}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, mapEmbedUrl: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Instagram URL</Label>
                      <Input
                        value={state.contact.contact.instagram}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, instagram: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Facebook URL</Label>
                      <Input
                        value={state.contact.contact.facebook}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, facebook: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Twitter URL</Label>
                      <Input
                        value={state.contact.contact.twitter || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, twitter: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>YouTube URL</Label>
                      <Input
                        value={state.contact.contact.youtube || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, youtube: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={state.contact.contact.linkedin || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, linkedin: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        value={state.contact.contact.website || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, website: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>TikTok URL</Label>
                      <Input
                        value={state.contact.contact.tiktok || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, tiktok: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Telegram URL</Label>
                      <Input
                        value={state.contact.contact.telegram || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, telegram: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>WhatsApp Link</Label>
                      <Input
                        value={state.contact.contact.whatsapp || ""}
                        onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, contact: { ...p.contact.contact, whatsapp: e.target.value } } }))}
                      />
                    </div>
                  </div>
                )}

                {key === "about" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Email</Label>
                      <Input
                        value={state.about.contact.email}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, email: e.target.value } } }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Quote</Label>
                      <Input
                        value={(state as any).about.quote || ""}
                        onChange={(e) => setState((p: any) => ({ ...p, about: { ...p.about, quote: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <Label>Instagram URL</Label>
                      <Input
                        value={state.about.contact.instagram}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, instagram: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Facebook URL</Label>
                      <Input
                        value={state.about.contact.facebook}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, facebook: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Twitter URL</Label>
                      <Input
                        value={state.about.contact.twitter || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, twitter: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>YouTube URL</Label>
                      <Input
                        value={state.about.contact.youtube || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, youtube: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={state.about.contact.linkedin || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, linkedin: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        value={state.about.contact.website || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, website: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>TikTok URL</Label>
                      <Input
                        value={state.about.contact.tiktok || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, tiktok: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>Telegram URL</Label>
                      <Input
                        value={state.about.contact.telegram || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, telegram: e.target.value } } }))}
                      />
                    </div>
                    <div>
                      <Label>WhatsApp Link</Label>
                      <Input
                        value={state.about.contact.whatsapp || ""}
                        onChange={(e) => setState((p) => ({ ...p, about: { ...p.about, contact: { ...p.about.contact, whatsapp: e.target.value } } }))}
                      />
                    </div>
                  </div>
                )}

                {renderImages(key)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}


