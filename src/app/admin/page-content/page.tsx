'use client';

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { defaultPageContent, fetchAllPageHeaders, savePageHeader, type PageHeader } from "@/lib/pageContent";

const PAGE_KEYS = [
  { key: 'events', label: 'Events' },
  { key: 'forum', label: 'Forum' },
  { key: 'auctions', label: 'Auctions' },
  { key: 'others', label: 'Other Services' },
  { key: 'partners', label: 'Partners' },
  { key: 'cars', label: 'Cars' },
  { key: 'hotels', label: 'Hotels' },
  { key: 'clubs', label: 'Clubs' },
] as const;

type PageKey = typeof PAGE_KEYS[number]['key'];

type HeadersState = Record<PageKey, PageHeader>;

export default function AdminPageContent() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PageKey | null>(null);
  const [headers, setHeaders] = useState<HeadersState>(() => {
    const initial: Partial<HeadersState> = {};
    PAGE_KEYS.forEach(({ key }) => {
      initial[key] = defaultPageContent[key as keyof typeof defaultPageContent];
    });
    return initial as HeadersState;
  });

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => setIsAuthed(!!user));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllPageHeaders();
        const mapped: Partial<HeadersState> = {};
        PAGE_KEYS.forEach(({ key }) => {
          mapped[key] = data[key as keyof typeof data];
        });
        setHeaders(mapped as HeadersState);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (key: PageKey) => {
    setSaving(key);
    try {
      await savePageHeader(key as any, headers[key]);
    } finally {
      setSaving(null);
    }
  };

  if (!isAuthed) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-gray-600">Please sign in to edit page content.</p>
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
      <h1 className="text-2xl font-bold mb-6">Page Content</h1>
      <Tabs defaultValue={PAGE_KEYS[0].key}>
        <TabsList className="mb-6 flex flex-wrap">
          {PAGE_KEYS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
        {PAGE_KEYS.map(({ key, label }) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>Edit the heading and description for the {label} page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={headers[key].title}
                    onChange={(e) =>
                      setHeaders((prev) => ({ ...prev, [key]: { ...prev[key], title: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={headers[key].description}
                    onChange={(e) =>
                      setHeaders((prev) => ({ ...prev, [key]: { ...prev[key], description: e.target.value } }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSave(key)} disabled={saving === key}>
                    {saving === key ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 