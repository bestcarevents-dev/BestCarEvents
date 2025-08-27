"use client";

import { useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type CarEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: { location?: string; price?: number; currency?: string };
  onSaved?: (update: Partial<{ location: string; price: number; currency: string }>) => void;
};

export default function CarEditDialog({ open, onOpenChange, documentId, initial, onSaved }: CarEditDialogProps) {
  const [location, setLocation] = useState<string>(initial.location || "");
  const [price, setPrice] = useState<string>(initial.price != null ? String(initial.price) : "");
  const [currency, setCurrency] = useState<string>(initial.currency || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const payload: Record<string, any> = {};
    if (location.trim() !== (initial.location || "")) payload.location = location.trim();
    if (price.trim() !== (initial.price != null ? String(initial.price) : "")) {
      const parsed = Number(price);
      if (Number.isNaN(parsed) || parsed < 0) {
        toast({ title: "Invalid price", description: "Enter a valid number.", variant: "destructive" });
        return;
      }
      payload.price = parsed;
    }
    if (currency.trim() !== (initial.currency || "")) payload.currency = currency.trim();
    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const db = getFirestore(app);
      const ref = doc(db, "cars", documentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This car listing no longer exists.", variant: "destructive" });
        return;
      }
      await updateDoc(ref, payload);
      toast({ title: "Saved", description: "Car listing updated successfully." });
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
          <DialogTitle className="text-foreground">Edit car listing</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="carLocation" className="text-foreground">Location</Label>
            <Input id="carLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="carPrice" className="text-foreground">Price</Label>
              <Input id="carPrice" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 25000" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="carCurrency" className="text-foreground">Currency</Label>
              <Input id="carCurrency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="e.g. CHF, EUR" className="text-foreground" />
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


