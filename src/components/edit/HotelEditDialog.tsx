"use client";

import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";

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
    postalCode?: string;
    locationData?: LocationData;
    description?: string;
    storageType?: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    features?: string;
    imageUrl?: string;
    imageUrls?: string[];
  };
  onSaved?: (update: Partial<HotelEditDialogProps["initial"]>) => void;
};

export default function HotelEditDialog({ open, onOpenChange, documentId, initial, onSaved }: HotelEditDialogProps) {
  const [hotelName, setHotelName] = useState<string>(initial.hotelName || "");
  const [address, setAddress] = useState<string>(initial.address || "");
  const [city, setCity] = useState<string>(initial.city || "");
  const [state, setState] = useState<string>(initial.state || "");
  const [country, setCountry] = useState<string>(initial.country || "");
  const [postalCode, setPostalCode] = useState<string>(initial.postalCode || "");
  const [locationData, setLocationData] = useState<LocationData | null>(initial.locationData || null);
  const [description, setDescription] = useState<string>(initial.description || "");
  const [storageType, setStorageType] = useState<string>(initial.storageType || "");
  const [website, setWebsite] = useState<string>(initial.website || "");
  const [contactName, setContactName] = useState<string>(initial.contactName || "");
  const [contactEmail, setContactEmail] = useState<string>(initial.contactEmail || "");
  const [features, setFeatures] = useState<string>(initial.features || "");
  const [saving, setSaving] = useState(false);
  // Existing images on the listing
  const [currentImages, setCurrentImages] = useState<string[]>(Array.isArray((initial as any)?.imageUrls) ? ((initial as any).imageUrls as string[]) : ((initial as any)?.imageUrl ? [((initial as any).imageUrl as string)] : []));
  // Files selected to be added in this edit session (not yet uploaded)
  const [filesToAdd, setFilesToAdd] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const { toast } = useToast();

  // Ensure values are refreshed when opening
  useEffect(() => {
    if (open) {
      setHotelName(initial.hotelName || "");
      setAddress(initial.address || "");
      setCity(initial.city || "");
      setState(initial.state || "");
      setCountry(initial.country || "");
      setPostalCode(initial.postalCode || "");
      setLocationData((initial as any).locationData || null);
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
      setCurrentImages(Array.isArray((initial as any)?.imageUrls) ? ((initial as any).imageUrls as string[]) : ((initial as any)?.imageUrl ? [((initial as any).imageUrl as string)] : []));
      setFilesToAdd([]);
      setFilePreviews([]);
    }
  }, [open, documentId, initial]);

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    if (hotelName.trim() !== (initial.hotelName || "")) payload.hotelName = hotelName.trim();
    if (address.trim() !== (initial.address || "")) payload.address = address.trim();
    if (city.trim() !== (initial.city || "")) payload.city = city.trim();
    if (state.trim() !== (initial.state || "")) payload.state = state.trim();
    if (country.trim() !== (initial.country || "")) payload.country = country.trim();
    if (postalCode.trim() !== (initial.postalCode || "")) payload.postalCode = postalCode.trim();
    if (JSON.stringify(locationData || null) !== JSON.stringify((initial as any).locationData || null)) payload.locationData = locationData;
    if (description.trim() !== (initial.description || "")) payload.description = description.trim();
    if (storageType.trim() !== (initial.storageType || "")) payload.storageType = storageType.trim();
    if (website.trim() !== (initial.website || "")) payload.website = website.trim();
    if (contactName.trim() !== (initial.contactName || "")) payload.contactName = contactName.trim();
    if (contactEmail.trim() !== (initial.contactEmail || "")) payload.contactEmail = contactEmail.trim();
    if (features.trim() !== (initial.features || "")) payload.features = features.split(",").map(s => s.trim()).filter(Boolean);
    const hasFieldChanges = Object.keys(payload).length > 0;
    try {
      setSaving(true);
      const db = getFirestore(app);
      const docRef = doc(db, "hotels", documentId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This hotel no longer exists.", variant: "destructive" });
        return;
      }
      // Upload newly added files, if any
      const uploadedUrls: string[] = [];
      if (filesToAdd.length > 0) {
        const storage = getStorage(app);
        for (const file of filesToAdd) {
          const storageRef = ref(storage, `hotels/${documentId}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          uploadedUrls.push(url);
        }
      }
      // Determine if images changed (either removed or added)
      const initialImages = Array.isArray((initial as any)?.imageUrls) ? ((initial as any).imageUrls as string[]) : ((initial as any)?.imageUrl ? [((initial as any).imageUrl as string)] : []);
      const imagesChanged = filesToAdd.length > 0 || JSON.stringify(currentImages) !== JSON.stringify(initialImages);
      if (!hasFieldChanges && !imagesChanged) {
        toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
        return;
      }
      if (imagesChanged) {
        const finalImages = [...uploadedUrls, ...currentImages].slice(0, 10);
        payload.imageUrls = finalImages;
        payload.imageUrl = finalImages[0] || "";
      }
      await updateDoc(docRef, payload);
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
          <div className="space-y-2">
            <Label className="text-foreground">Location</Label>
            <LocationPicker
              required
              initialValue={locationData as any}
              onChange={(value) => {
                setLocationData(value);
                const c = (value as any)?.components;
                const line = [c?.streetNumber, c?.route].filter(Boolean).join(" ");
                if (line) setAddress(line);
                if (c?.locality) setCity(c.locality);
                if (c?.administrativeAreaLevel1) setState(c.administrativeAreaLevel1);
                if (c?.country) setCountry(c.country);
                if (c?.postalCode) setPostalCode(c.postalCode);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Images</Label>
            {/* Current images with remove option */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {currentImages.length === 0 && (
                <div className="col-span-full text-sm text-muted-foreground">No images currently attached.</div>
              )}
              {currentImages.map((url, idx) => (
                <div key={url + idx} className="relative border rounded-md overflow-hidden bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Image ${idx + 1}`} className="object-cover w-full h-24" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-red-600 text-white"
                    onClick={() => setCurrentImages((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {/* Add new images */}
            <div className="mt-3">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setFilesToAdd((prev) => [...prev, ...files]);
                  setFilePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Add one or more images. JPG/PNG, up to 5MB each. Max 10 total.</p>
              {filePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filePreviews.map((p, idx) => (
                    <div key={p + idx} className="relative border rounded-md overflow-hidden bg-muted/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`New ${idx + 1}`} className="object-cover w-full h-24" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-gray-700 text-white"
                        onClick={() => {
                          setFilesToAdd((prev) => prev.filter((_, i) => i !== idx));
                          setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
            <Label htmlFor="postalCode" className="text-foreground">ZIP / Postal Code</Label>
            <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="ZIP / Postal code" className="text-foreground" />
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


