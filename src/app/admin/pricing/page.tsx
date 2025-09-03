"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Flat = Record<string, any>;

export default function AdminPricingPage() {
  const [data, setData] = useState<Flat>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const db = getFirestore(app);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const ref = doc(db, "settings", "pricing");
      const snap = await getDoc(ref);
      setData(snap.exists() ? (snap.data() as any) : {});
      setLoading(false);
    };
    fetch();
  }, [db]);

  const update = (path: string, value: number) => {
    setData(prev => {
      const next = { ...prev } as any;
      const parts = path.split('.')
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const ref = doc(db, "settings", "pricing");
    await setDoc(ref, data, { merge: true });
    setSaving(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit Prices</CardTitle>
          <CardDescription>All values are EUR; used as dynamic fallbacks across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Dashboard Packages">
            <NumberField label="Gold Package (dashboard.packages.Gold.eur)" value={getNum(data, 'dashboard.packages.Gold.eur', 15300)} onChange={(v) => update('dashboard.packages.Gold.eur', v)} />
            <NumberField label="Silver Package (dashboard.packages.Silver.eur)" value={getNum(data, 'dashboard.packages.Silver.eur', 10800)} onChange={(v) => update('dashboard.packages.Silver.eur', v)} />
          </Section>
          <Section title="Banner Ads">
            <NumberField label="Homepage Banner (banner.homepage)" value={getNum(data, 'banner.homepage', 6000)} onChange={(v) => update('banner.homepage', v)} />
            <NumberField label="Category Banner (banner.category)" value={getNum(data, 'banner.category', 2500)} onChange={(v) => update('banner.category', v)} />
          </Section>
          <Section title="Newsletter Mentions">
            <NumberField label="Premium Mention (newsletter.premium)" value={getNum(data, 'newsletter.premium', 600)} onChange={(v) => update('newsletter.premium', v)} />
            <NumberField label="Standard Mention (newsletter.standard)" value={getNum(data, 'newsletter.standard', 400)} onChange={(v) => update('newsletter.standard', v)} />
          </Section>
          <Section title="Listings (Events/Auction/Hotel/Club/Others)">
            <NumberField label="Featured Listing (listings.featured)" value={getNum(data, 'listings.featured', 4800)} onChange={(v) => update('listings.featured', v)} />
            <NumberField label="Standard Listing (listings.standard)" value={getNum(data, 'listings.standard', 400)} onChange={(v) => update('listings.standard', v)} />
          </Section>
          <Section title="Cars">
            <NumberField label="Basic Listing (cars.basic)" value={getNum(data, 'cars.basic', 42)} onChange={(v) => update('cars.basic', v)} />
            <NumberField label="Enhanced Listing (cars.enhanced)" value={getNum(data, 'cars.enhanced', 74)} onChange={(v) => update('cars.enhanced', v)} />
            <NumberField label="Premium Listing (cars.premium)" value={getNum(data, 'cars.premium', 107)} onChange={(v) => update('cars.premium', v)} />
            <NumberField label="Exclusive Banner (cars.exclusiveBanner)" value={getNum(data, 'cars.exclusiveBanner', 161)} onChange={(v) => update('cars.exclusiveBanner', v)} />
            <NumberField label="Featured in Newsletters (cars.newsletterFeature)" value={getNum(data, 'cars.newsletterFeature', 53)} onChange={(v) => update('cars.newsletterFeature', v)} />
            <NumberField label="Car Auction Listing (cars.auction)" value={getNum(data, 'cars.auction', 161)} onChange={(v) => update('cars.auction', v)} />
          </Section>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>These values are read by the UI and APIs. Existing hardcoded prices remain as fallbacks.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>- Update any price and click Save. Changes take effect immediately on next page load.</p>
          <p>- Categories map: Dashboard Packages, Banner, Newsletter, Listings, Cars.</p>
          <p>- If a key is missing, pages use their current fallback values.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function getNum(obj: any, path: string, fallback: number): number {
  try {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) cur = cur?.[p];
    return typeof cur === 'number' ? cur : fallback;
  } catch {
    return fallback;
  }
}


