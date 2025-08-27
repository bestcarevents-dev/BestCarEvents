"use client";

import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type HotelEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: {
    hotelName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    description?: string;
    storageType?: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    features?: string;
  };
  onSaved?: (update: Partial<HotelEditDialogProps["initial"]>) => void;
};

export default function HotelEditDialog({ open, onOpenChange, documentId, initial, onSaved }: HotelEditDialogProps) {
  const [hotelName, setHotelName] = useState<string>(initial.hotelName || "");
  const [address, setAddress] = useState<string>(initial.address || "");
  const [city, setCity] = useState<string>(initial.city || "");
  const [state, setState] = useState<string>(initial.state || "");
  const [country, setCountry] = useState<string>(initial.country || "");
  const [description, setDescription] = useState<string>(initial.description || "");
  const [storageType, setStorageType] = useState<string>(initial.storageType || "");
  const [website, setWebsite] = useState<string>(initial.website || "");
  const [contactName, setContactName] = useState<string>(initial.contactName || "");
  const [contactEmail, setContactEmail] = useState<string>(initial.contactEmail || "");
  const [features, setFeatures] = useState<string>(initial.features || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Ensure values are refreshed when opening
  useEffect(() => {
    if (open) {
      setHotelName(initial.hotelName || "");
      setAddress(initial.address || "");
      setCity(initial.city || "");
      setState(initial.state || "");
      setCountry(initial.country || "");
      setDescription(initial.description || "");
      setStorageType(initial.storageType || "");
      setWebsite(initial.website || "");
      setContactName(initial.contactName || "");
      setContactEmail(initial.contactEmail || "");
      // Convert array to comma separated if consumer passed an array in initial.features
      const feat = Array.isArray((initial as any).features)
        ? ((initial as any).features as string[]).join(", ")
        : initial.features || "";
      setFeatures(feat);
    }
  }, [open, documentId, initial]);

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    if (hotelName.trim() !== (initial.hotelName || "")) payload.hotelName = hotelName.trim();
    if (address.trim() !== (initial.address || "")) payload.address = address.trim();
    if (city.trim() !== (initial.city || "")) payload.city = city.trim();
    if (state.trim() !== (initial.state || "")) payload.state = state.trim();
    if (country.trim() !== (initial.country || "")) payload.country = country.trim();
    if (description.trim() !== (initial.description || "")) payload.description = description.trim();
    if (storageType.trim() !== (initial.storageType || "")) payload.storageType = storageType.trim();
    if (website.trim() !== (initial.website || "")) payload.website = website.trim();
    if (contactName.trim() !== (initial.contactName || "")) payload.contactName = contactName.trim();
    if (contactEmail.trim() !== (initial.contactEmail || "")) payload.contactEmail = contactEmail.trim();
    if (features.trim() !== (initial.features || "")) payload.features = features.split(",").map(s => s.trim()).filter(Boolean);
    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const db = getFirestore(app);
      const ref = doc(db, "hotels", documentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This hotel no longer exists.", variant: "destructive" });
        return;
      }
      await updateDoc(ref, payload);
      toast({ title: "Saved", description: "Hotel updated successfully." });
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit hotel</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="hotelName" className="text-foreground">Hotel name</Label>
            <Input id="hotelName" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="e.g. Grand Resort" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address" className="text-foreground">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street and number" className="text-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-foreground">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className="text-foreground">State</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country" className="text-foreground">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="text-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 bg-background text-foreground min-h-[100px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="storageType" className="text-foreground">Storage type</Label>
              <Input id="storageType" value={storageType} onChange={(e) => setStorageType(e.target.value)} placeholder="e.g. Climate Controlled" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="website" className="text-foreground">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="contactName" className="text-foreground">Contact name</Label>
              <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactEmail" className="text-foreground">Contact email</Label>
              <Input id="contactEmail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="text-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="features" className="text-foreground">Features (comma separated)</Label>
            <Input id="features" value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="24/7 Security, Detailing Services" className="text-foreground" />
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


