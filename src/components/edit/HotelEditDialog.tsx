"use client";

import { useState } from "react";
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
  initial: { hotelName?: string; city?: string; state?: string };
  onSaved?: (update: Partial<{ hotelName: string; city: string; state: string }>) => void;
};

export default function HotelEditDialog({ open, onOpenChange, documentId, initial, onSaved }: HotelEditDialogProps) {
  const [hotelName, setHotelName] = useState<string>(initial.hotelName || "");
  const [city, setCity] = useState<string>(initial.city || "");
  const [state, setState] = useState<string>(initial.state || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const payload: Record<string, string> = {};
    if (hotelName.trim() !== (initial.hotelName || "")) payload.hotelName = hotelName.trim();
    if (city.trim() !== (initial.city || "")) payload.city = city.trim();
    if (state.trim() !== (initial.state || "")) payload.state = state.trim();
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit hotel</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="hotelName" className="text-foreground">Hotel name</Label>
            <Input id="hotelName" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="e.g. Grand Resort" className="text-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-foreground">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className="text-foreground">State</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="text-foreground" />
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


