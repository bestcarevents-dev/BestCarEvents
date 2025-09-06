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

type EventEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: {
    eventName?: string;
    location?: string;
    description?: string;
    organizerName?: string;
    organizerContact?: string;
    eventType?: string;
    vehicleFocus?: string;
    expectedAttendance?: number;
    entryFee?: number;
    scheduleHighlights?: string;
    activities?: string;
    rulesUrl?: string;
    sponsors?: string;
    websiteUrl?: string;
  };
  onSaved?: (update: Partial<EventEditDialogProps["initial"]>) => void;
};

export default function EventEditDialog({ open, onOpenChange, documentId, initial, onSaved }: EventEditDialogProps) {
  const [eventName, setEventName] = useState<string>(initial.eventName || "");
  const [location, setLocation] = useState<string>(initial.location || "");
  const [description, setDescription] = useState<string>(initial.description || "");
  const [organizerName, setOrganizerName] = useState<string>(initial.organizerName || "");
  const [organizerContact, setOrganizerContact] = useState<string>(initial.organizerContact || "");
  const [eventType, setEventType] = useState<string>(initial.eventType || "");
  const [vehicleFocus, setVehicleFocus] = useState<string>(initial.vehicleFocus || "");
  const [expectedAttendance, setExpectedAttendance] = useState<string>(
    initial.expectedAttendance != null ? String(initial.expectedAttendance) : ""
  );
  const [entryFee, setEntryFee] = useState<string>(initial.entryFee != null ? String(initial.entryFee) : "");
  const [scheduleHighlights, setScheduleHighlights] = useState<string>(initial.scheduleHighlights || "");
  const [activities, setActivities] = useState<string>(initial.activities || "");
  const [rulesUrl, setRulesUrl] = useState<string>(initial.rulesUrl || "");
  const [sponsors, setSponsors] = useState<string>(initial.sponsors || "");
  const [websiteUrl, setWebsiteUrl] = useState<string>(initial.websiteUrl || "");
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync all fields when opening or switching document
  useEffect(() => {
    if (open) {
      setEventName(initial.eventName || "");
      setLocation(initial.location || "");
      setDescription(initial.description || "");
      setOrganizerName(initial.organizerName || "");
      setOrganizerContact(initial.organizerContact || "");
      setEventType(initial.eventType || "");
      setVehicleFocus(initial.vehicleFocus || "");
      setExpectedAttendance(initial.expectedAttendance != null ? String(initial.expectedAttendance) : "");
      setEntryFee(initial.entryFee != null ? String(initial.entryFee) : "");
      setScheduleHighlights(initial.scheduleHighlights || "");
      setActivities(initial.activities || "");
      setRulesUrl(initial.rulesUrl || "");
      setSponsors(initial.sponsors || "");
      setWebsiteUrl(initial.websiteUrl || "");
      setSelectedImage(null);
      setPreviewUrl(null);
    }
  }, [open, documentId, initial]);

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    if (eventName.trim() !== (initial.eventName || "")) payload.eventName = eventName.trim();
    if (location.trim() !== (initial.location || "")) payload.location = location.trim();
    if (description.trim() !== (initial.description || "")) payload.description = description.trim();
    if (organizerName.trim() !== (initial.organizerName || "")) payload.organizerName = organizerName.trim();
    if (organizerContact.trim() !== (initial.organizerContact || "")) payload.organizerContact = organizerContact.trim();
    if (eventType.trim() !== (initial.eventType || "")) payload.eventType = eventType.trim();
    if (vehicleFocus.trim() !== (initial.vehicleFocus || "")) payload.vehicleFocus = vehicleFocus.trim();
    if (expectedAttendance.trim() !== (initial.expectedAttendance != null ? String(initial.expectedAttendance) : "")) {
      const n = Number(expectedAttendance);
      if (!Number.isNaN(n) && n >= 0) payload.expectedAttendance = n;
    }
    if (entryFee.trim() !== (initial.entryFee != null ? String(initial.entryFee) : "")) {
      const f = Number(entryFee);
      if (!Number.isNaN(f) && f >= 0) payload.entryFee = f;
    }
    if (scheduleHighlights.trim() !== (initial.scheduleHighlights || "")) payload.scheduleHighlights = scheduleHighlights.trim();
    if (activities.trim() !== (initial.activities || "")) payload.activities = activities.trim();
    if (rulesUrl.trim() !== (initial.rulesUrl || "")) payload.rulesUrl = rulesUrl.trim();
    if (sponsors.trim() !== (initial.sponsors || "")) payload.sponsors = sponsors.trim();
    if (websiteUrl.trim() !== (initial.websiteUrl || "")) payload.websiteUrl = websiteUrl.trim();
    const hasFieldChanges = Object.keys(payload).length > 0;
    try {
      setSaving(true);
      const db = getFirestore(app);
      const ref = doc(db, "events", documentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This event no longer exists.", variant: "destructive" });
        return;
      }
      if (selectedImage) {
        const storage = getStorage(app);
        const storageRef = ref(storage, `events/${documentId}/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(storageRef, selectedImage);
        const url = await getDownloadURL(storageRef);
        // Persist under imageUrl for existing UI and add to array if present
        const data = snap.data() as any;
        payload.imageUrl = url;
        if (Array.isArray(data?.imageUrls)) {
          payload.imageUrls = [url, ...data.imageUrls].slice(0, 10);
        }
      }
      if (!hasFieldChanges && !selectedImage) {
        toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
        return;
      }
      await updateDoc(ref, payload);
      toast({ title: "Saved", description: "Event updated successfully." });
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
          <DialogTitle className="text-foreground">Edit event</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Event image</Label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-md overflow-hidden border bg-muted/40 flex items-center justify-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(initial as any)?.imageUrl || "/placeholder.jpg"} alt="Current" className="object-cover w-full h-full" />
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
                <p className="text-xs text-muted-foreground mt-1">Upload a new image. JPG/PNG, up to 5MB.</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="eventName" className="text-foreground">Event name</Label>
            <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Cars & Coffee" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="eventLocation" className="text-foreground">Location</Label>
            <Input id="eventLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 bg-background text-foreground min-h-[100px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="organizerName" className="text-foreground">Organizer name</Label>
              <Input id="organizerName" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="organizerContact" className="text-foreground">Organizer email</Label>
              <Input id="organizerContact" value={organizerContact} onChange={(e) => setOrganizerContact(e.target.value)} className="text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="eventType" className="text-foreground">Event type</Label>
              <Input id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Car Show / Race / Meetup / ..." className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vehicleFocus" className="text-foreground">Vehicle focus</Label>
              <Input id="vehicleFocus" value={vehicleFocus} onChange={(e) => setVehicleFocus(e.target.value)} placeholder="e.g. Classic, JDM" className="text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="expectedAttendance" className="text-foreground">Expected attendance</Label>
              <Input id="expectedAttendance" value={expectedAttendance} onChange={(e) => setExpectedAttendance(e.target.value)} placeholder="e.g. 300" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="entryFee" className="text-foreground">Entry fee</Label>
              <Input id="entryFee" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} placeholder="e.g. 10" className="text-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="scheduleHighlights" className="text-foreground">Schedule highlights</Label>
            <textarea id="scheduleHighlights" value={scheduleHighlights} onChange={(e) => setScheduleHighlights(e.target.value)} className="w-full border rounded px-3 py-2 bg-background text-foreground min-h-[80px]" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activities" className="text-foreground">Activities (comma separated)</Label>
            <Input id="activities" value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="Live music, Food trucks" className="text-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rulesUrl" className="text-foreground">Rules URL</Label>
              <Input id="rulesUrl" value={rulesUrl} onChange={(e) => setRulesUrl(e.target.value)} className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="websiteUrl" className="text-foreground">Website URL</Label>
              <Input id="websiteUrl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="text-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sponsors" className="text-foreground">Sponsors (comma separated)</Label>
            <Input id="sponsors" value={sponsors} onChange={(e) => setSponsors(e.target.value)} placeholder="Brand A, Brand B" className="text-foreground" />
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


