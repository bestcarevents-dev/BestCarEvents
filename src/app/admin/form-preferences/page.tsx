"use client";

import { useEffect, useMemo, useState } from "react";
import { getPreferences, savePreferences, seedDefaults, type CarPreferences, type EventPreferences, type HotelPreferences, type ServicePreferences, type AuctionPreferences, type SharedPreferences, DEFAULT_CAR_PREFERENCES, DEFAULT_EVENT_PREFERENCES, DEFAULT_HOTEL_PREFERENCES, DEFAULT_SERVICE_PREFERENCES, DEFAULT_AUCTION_PREFERENCES } from "@/lib/formPreferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type Section = "cars" | "events" | "hotels" | "services" | "auctions" | "shared";

export default function FormPreferencesPage() {
  const [active, setActive] = useState<Section>("cars");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [cars, setCars] = useState<CarPreferences | null>(null);
  const [events, setEvents] = useState<EventPreferences | null>(null);
  const [hotels, setHotels] = useState<HotelPreferences | null>(null);
  const [services, setServices] = useState<ServicePreferences | null>(null);
  const [auctions, setAuctions] = useState<AuctionPreferences | null>(null);
  const [shared, setShared] = useState<SharedPreferences | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setCars(await getPreferences<CarPreferences>("cars"));
        setEvents(await getPreferences<EventPreferences>("events"));
        setHotels(await getPreferences<HotelPreferences>("hotels"));
        setServices(await getPreferences<ServicePreferences>("services"));
        setAuctions(await getPreferences<AuctionPreferences>("auctions"));
        setShared(await getPreferences<SharedPreferences>("shared"));
      } catch (e: any) {
        toast({ title: "Failed to load preferences", description: e?.message || "", variant: "destructive" });
      }
    })();
  }, [toast]);

  const onSave = async () => {
    try {
      setSaving(true);
      if (cars) await savePreferences("cars", sanitizeStrings(cars));
      if (events) await savePreferences("events", sanitizeStrings(events));
      if (hotels) await savePreferences("hotels", sanitizeStrings(hotels));
      if (services) await savePreferences("services", sanitizeServiceTypes(services));
      if (auctions) await savePreferences("auctions", sanitizeStrings(auctions));
      if (shared) await savePreferences("shared", sanitizeStrings(shared));
      toast({ title: "Saved", description: "Form preferences updated." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onSeed = async () => {
    try {
      setSaving(true);
      await seedDefaults();
      setCars(await getPreferences<CarPreferences>("cars"));
      setEvents(await getPreferences<EventPreferences>("events"));
      setHotels(await getPreferences<HotelPreferences>("hotels"));
      setServices(await getPreferences<ServicePreferences>("services"));
      setAuctions(await getPreferences<AuctionPreferences>("auctions"));
      setShared(await getPreferences<SharedPreferences>("shared"));
      toast({ title: "Seeded defaults", description: "Baseline options were created/merged." });
    } catch (e: any) {
      toast({ title: "Seed failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Form Preferences</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSeed} disabled={saving}>Seed defaults</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save All"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage dropdown options shown across forms, hero search, and filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={active} onValueChange={(v) => setActive(v as Section)}>
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="cars">Cars</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="hotels">Hotels</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="auctions">Auctions</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>

            <TabsContent value="cars">
              {cars && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArrayEditor label="Body Styles" value={cars.bodyStyles} onChange={(v) => setCars({ ...cars, bodyStyles: v })} />
                  <ArrayEditor label="Transmissions" value={cars.transmissions} onChange={(v) => setCars({ ...cars, transmissions: v })} />
                  <ArrayEditor label="Drivetrains" value={cars.drivetrains} onChange={(v) => setCars({ ...cars, drivetrains: v })} />
                  <ArrayEditor label="Currencies" value={cars.currencies} onChange={(v) => setCars({ ...cars, currencies: v })} />
                  <ArrayEditor label="Features" value={cars.features} onChange={(v) => setCars({ ...cars, features: v })} />
                  <ArrayEditor label="Makes (optional)" value={cars.makes} onChange={(v) => setCars({ ...cars, makes: v })} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="events">
              {events && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArrayEditor label="Event Types" value={events.eventTypes} onChange={(v) => setEvents({ ...events, eventTypes: v })} />
                  <ArrayEditor label="Vehicle Focuses" value={events.vehicleFocuses} onChange={(v) => setEvents({ ...events, vehicleFocuses: v })} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="hotels">
              {hotels && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArrayEditor label="Storage Types" value={hotels.storageTypes} onChange={(v) => setHotels({ ...hotels, storageTypes: v })} />
                  <ArrayEditor label="Features" value={hotels.features} onChange={(v) => setHotels({ ...hotels, features: v })} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="services">
              {services && (
                <div className="space-y-6">
                  <ServiceTypeEditor value={services.serviceTypes || []} onChange={(v) => setServices({ ...services, serviceTypes: v })} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="auctions">
              {auctions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArrayEditor label="Auction Types" value={auctions.auctionTypes} onChange={(v) => setAuctions({ ...auctions, auctionTypes: v })} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared">
              {shared && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArrayEditor label="Cities (whitelist, optional)" value={shared.citiesWhitelist} onChange={(v) => setShared({ ...shared, citiesWhitelist: v })} />
                  <ArrayEditor label="Countries (whitelist, optional)" value={shared.countriesWhitelist} onChange={(v) => setShared({ ...shared, countriesWhitelist: v })} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ArrayEditor({ label, value, onChange }: { label: string; value?: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState<string>("" );
  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add item" />
        <Button type="button" onClick={() => {
          const v = normalize(text);
          if (!v) return;
          if (items.find((i) => i.toLowerCase() === v.toLowerCase())) { setText(""); return; }
          onChange([...(items || []), v]);
          setText("");
        }}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((i, idx) => (
          <div key={`${i}-${idx}`} className="flex items-center gap-2 border rounded px-2 py-1">
            <span>{i}</span>
            <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== idx))}>×</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceTypeEditor({ value, onChange }: { value: NonNullable<ServicePreferences["serviceTypes"]>; onChange: (v: NonNullable<ServicePreferences["serviceTypes"]>) => void }) {
  const [draft, setDraft] = useState({ value: "", label: "", description: "" });
  return (
    <div>
      <Label className="mb-2 block">Service Types</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <Input placeholder="value (key)" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
        <Input placeholder="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <Input placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </div>
      <Button type="button" onClick={() => {
        const v = normalize(draft.value);
        const lbl = draft.label.trim();
        if (!v || !lbl) return;
        if (value.find((t) => t.value.toLowerCase() === v.toLowerCase())) return;
        onChange([...(value || []), { value: v, label: lbl, description: draft.description.trim() || undefined }]);
        setDraft({ value: "", label: "", description: "" });
      }}>Add</Button>
      <Separator className="my-4" />
      <div className="space-y-2">
        {(value || []).map((t, idx) => (
          <div key={`${t.value}-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <Input value={t.value} onChange={(e) => {
              const next = [...value];
              next[idx] = { ...next[idx], value: normalize(e.target.value) };
              onChange(next);
            }} />
            <Input value={t.label} onChange={(e) => {
              const next = [...value];
              next[idx] = { ...next[idx], label: e.target.value };
              onChange(next);
            }} />
            <div className="flex gap-2">
              <Input value={t.description || ""} onChange={(e) => {
                const next = [...value];
                next[idx] = { ...next[idx], description: e.target.value };
                onChange(next);
              }} />
              <Button variant="destructive" onClick={() => onChange(value.filter((_, j) => j !== idx))}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalize(s: string) { return s.replace(/\s+/g, " ").trim(); }

function sanitizeStrings<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (Array.isArray(val)) {
      out[key] = val
        .map((v) => (typeof v === "string" ? normalize(v) : v))
        .filter((v) => v)
        .filter((v, i, arr) => (typeof v === "string" ? arr.findIndex((x) => (x as string).toLowerCase() === v.toLowerCase()) === i : true));
    } else {
      out[key] = val;
    }
  }
  return out as T;
}

function sanitizeServiceTypes(p: ServicePreferences): ServicePreferences {
  const list = p.serviceTypes || [];
  const cleaned = list
    .map((t) => ({ value: normalize(t.value), label: t.label.trim(), description: (t.description || "").trim() || undefined }))
    .filter((t) => t.value && t.label)
    .filter((t, i, arr) => arr.findIndex((x) => x.value.toLowerCase() === t.value.toLowerCase()) === i);
  return { ...p, serviceTypes: cleaned };
}


