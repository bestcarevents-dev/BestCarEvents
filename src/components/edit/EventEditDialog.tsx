"use client";

import { useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type EventEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: { eventName?: string; location?: string };
  onSaved?: (update: Partial<{ eventName: string; location: string }>) => void;
};

export default function EventEditDialog({ open, onOpenChange, documentId, initial, onSaved }: EventEditDialogProps) {
  const [eventName, setEventName] = useState<string>(initial.eventName || "");
  const [location, setLocation] = useState<string>(initial.location || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const payload: Record<string, string> = {};
    if (eventName.trim() !== (initial.eventName || "")) payload.eventName = eventName.trim();
    if (location.trim() !== (initial.location || "")) payload.location = location.trim();
    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const db = getFirestore(app);
      const ref = doc(db, "events", documentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This event no longer exists.", variant: "destructive" });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit event</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="eventName" className="text-foreground">Event name</Label>
            <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Cars & Coffee" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="eventLocation" className="text-foreground">Location</Label>
            <Input id="eventLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="text-foreground" />
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


