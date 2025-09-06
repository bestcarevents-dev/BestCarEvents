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

type ClubEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: {
    clubName?: string;
    description?: string;
    membershipCriteria?: string;
    typicalActivities?: string;
    city?: string;
    country?: string;
    website?: string;
    socialMediaLink?: string;
    contactName?: string;
    contactEmail?: string;
  };
  onSaved?: (update: Partial<ClubEditDialogProps["initial"]>) => void;
};

export default function ClubEditDialog({ open, onOpenChange, documentId, initial, onSaved }: ClubEditDialogProps) {
  const [clubName, setClubName] = useState<string>(initial.clubName || "");
  const [description, setDescription] = useState<string>(initial.description || "");
  const [membershipCriteria, setMembershipCriteria] = useState<string>(initial.membershipCriteria || "");
  const [typicalActivities, setTypicalActivities] = useState<string>(initial.typicalActivities || "");
  const [city, setCity] = useState<string>(initial.city || "");
  const [country, setCountry] = useState<string>(initial.country || "");
  const [website, setWebsite] = useState<string>(initial.website || "");
  const [socialMediaLink, setSocialMediaLink] = useState<string>(initial.socialMediaLink || "");
  const [contactName, setContactName] = useState<string>(initial.contactName || "");
  const [contactEmail, setContactEmail] = useState<string>(initial.contactEmail || "");
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync values on open or when switching doc
  useEffect(() => {
    if (open) {
      setClubName(initial.clubName || "");
      setDescription(initial.description || "");
      setMembershipCriteria(initial.membershipCriteria || "");
      setTypicalActivities(initial.typicalActivities || "");
      setCity(initial.city || "");
      setCountry(initial.country || "");
      setWebsite(initial.website || "");
      setSocialMediaLink(initial.socialMediaLink || "");
      setContactName(initial.contactName || "");
      setContactEmail(initial.contactEmail || "");
      setSelectedImage(null);
      setPreviewUrl(null);
    }
  }, [open, documentId, initial]);

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    if (clubName.trim() !== (initial.clubName || "")) payload.clubName = clubName.trim();
    if (description.trim() !== (initial.description || "")) payload.description = description.trim();
    if (membershipCriteria.trim() !== (initial.membershipCriteria || "")) payload.membershipCriteria = membershipCriteria.trim();
    if (typicalActivities.trim() !== (initial.typicalActivities || "")) payload.typicalActivities = typicalActivities.trim();
    if (city.trim() !== (initial.city || "")) payload.city = city.trim();
    if (country.trim() !== (initial.country || "")) payload.country = country.trim();
    if (website.trim() !== (initial.website || "")) payload.website = website.trim();
    if (socialMediaLink.trim() !== (initial.socialMediaLink || "")) payload.socialMediaLink = socialMediaLink.trim();
    if (contactName.trim() !== (initial.contactName || "")) payload.contactName = contactName.trim();
    if (contactEmail.trim() !== (initial.contactEmail || "")) payload.contactEmail = contactEmail.trim();
    const hasFieldChanges = Object.keys(payload).length > 0;
    try {
      setSaving(true);
      const db = getFirestore(app);
      const ref = doc(db, "clubs", documentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This club no longer exists.", variant: "destructive" });
        return;
      }
      // If a new image is selected, upload to storage and include in payload
      if (selectedImage) {
        const storage = getStorage(app);
        const storageRef = ref(storage, `clubs/${documentId}/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(storageRef, selectedImage);
        const url = await getDownloadURL(storageRef);
        payload.logoUrl = url;
      }
      if (!hasFieldChanges && !selectedImage) {
        toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
        return;
      }
      await updateDoc(ref, payload);
      toast({ title: "Saved", description: "Club updated successfully." });
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
          <DialogTitle className="text-foreground">Edit club</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Club logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-md overflow-hidden border bg-muted/40 flex items-center justify-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(initial as any)?.logoUrl || "/placeholder.jpg"} alt="Current" className="object-cover w-full h-full" />
                )}
              </div>
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedImage(file);
                    setPreviewUrl(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">Upload a new logo. JPG/PNG, up to 5MB.</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="clubName" className="text-foreground">Club name</Label>
            <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="e.g. Classic Riders Club" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 bg-background text-foreground min-h-[100px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="membershipCriteria" className="text-foreground">Membership criteria</Label>
              <textarea id="membershipCriteria" value={membershipCriteria} onChange={(e) => setMembershipCriteria(e.target.value)} className="w-full border rounded px-3 py-2 bg-background text-foreground min-h-[80px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="typicalActivities" className="text-foreground">Typical activities</Label>
              <textarea id="typicalActivities" value={typicalActivities} onChange={(e) => setTypicalActivities(e.target.value)} className="w-full border rounded px-3 py-2 bg-background text-foreground min-h-[80px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-foreground">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country" className="text-foreground">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="website" className="text-foreground">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="socialMediaLink" className="text-foreground">Social link</Label>
              <Input id="socialMediaLink" value={socialMediaLink} onChange={(e) => setSocialMediaLink(e.target.value)} className="text-foreground" />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-foreground">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="text-foreground">{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


