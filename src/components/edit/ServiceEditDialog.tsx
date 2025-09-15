"use client";

import { useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";

type ServiceEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: { serviceName?: string; location?: string; locationData?: LocationData; addressLine?: string; city?: string; region?: string; country?: string; postalCode?: string };
  onSaved?: (update: Partial<{ serviceName: string; location: string; locationData: LocationData; addressLine: string; city: string; region: string; country: string; postalCode: string }>) => void;
};

export default function ServiceEditDialog({ open, onOpenChange, documentId, initial, onSaved }: ServiceEditDialogProps) {
  const [serviceName, setServiceName] = useState<string>(initial.serviceName || "");
  const [location, setLocation] = useState<string>(initial.location || "");
  const [locationData, setLocationData] = useState<LocationData | null>(initial.locationData || null);
  const [addressLine, setAddressLine] = useState<string>(initial.addressLine || "");
  const [city, setCity] = useState<string>(initial.city || "");
  const [region, setRegion] = useState<string>(initial.region || "");
  const [country, setCountry] = useState<string>(initial.country || "");
  const [postalCode, setPostalCode] = useState<string>(initial.postalCode || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    if (serviceName.trim() !== (initial.serviceName || "")) payload.serviceName = serviceName.trim();
    if (location.trim() !== (initial.location || "")) payload.location = location.trim();
    if (JSON.stringify(locationData || null) !== JSON.stringify((initial as any).locationData || null)) payload.locationData = locationData;
    if (addressLine.trim() !== (initial.addressLine || "")) payload.addressLine = addressLine.trim();
    if (city.trim() !== (initial.city || "")) payload.city = city.trim();
    if (region.trim() !== (initial.region || "")) payload.region = region.trim();
    if (country.trim() !== (initial.country || "")) payload.country = country.trim();
    if (postalCode.trim() !== (initial.postalCode || "")) payload.postalCode = postalCode.trim();
    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const db = getFirestore(app);
      const docRef = doc(db, "others", documentId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This service no longer exists.", variant: "destructive" });
        return;
      }
      await updateDoc(docRef, payload);
      toast({ title: "Saved", description: "Service updated successfully." });
      onSaved?.(payload as any);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit service</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-foreground">Location</Label>
            <LocationPicker
              required
              initialValue={locationData as any}
              onChange={(value) => {
                setLocationData(value);
                setLocation(value?.formattedAddress || "");
                const c = (value as any)?.components;
                const line = [c?.streetNumber, c?.route].filter(Boolean).join(" ");
                if (line) setAddressLine(line);
                if (c?.locality) setCity(c.locality);
                if (c?.administrativeAreaLevel1) setRegion(c.administrativeAreaLevel1);
                if (c?.country) setCountry(c.country);
                if (c?.postalCode) setPostalCode(c.postalCode);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="serviceName" className="text-foreground">Service name</Label>
            <Input id="serviceName" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Classic Car Detailing" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="serviceLocation" className="text-foreground">Location</Label>
            <Input id="serviceLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="text-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="addressLine" className="text-foreground">Address</Label>
              <Input id="addressLine" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Street and number" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city" className="text-foreground">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="region" className="text-foreground">Region/State</Label>
              <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region/State" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country" className="text-foreground">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="postalCode" className="text-foreground">ZIP / Postal Code</Label>
              <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="ZIP / Postal code" className="text-foreground" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-foreground">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="text-foreground">{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


