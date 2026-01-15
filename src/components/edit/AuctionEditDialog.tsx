"use client";

import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type AuctionEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  initial: { auctionName?: string; auctionHouse?: string; website?: string | null };
  onSaved?: (update: Partial<{ auctionName: string; auctionHouse: string; website: string | null }>) => void;
};

export default function AuctionEditDialog({ open, onOpenChange, documentId, initial, onSaved }: AuctionEditDialogProps) {
  const [auctionName, setAuctionName] = useState<string>(initial.auctionName || "");
  const [auctionHouse, setAuctionHouse] = useState<string>(initial.auctionHouse || "");
  const [website, setWebsite] = useState<string>(initial.website || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Sync inputs when dialog opens for a specific document
  useEffect(() => {
    if (open) {
      setAuctionName(initial.auctionName || "");
      setAuctionHouse(initial.auctionHouse || "");
      setWebsite(initial.website || "");
    }
  }, [open, documentId, initial.auctionName, initial.auctionHouse, initial.website]);

  const handleSave = async () => {
    const payload: Record<string, string | null> = {};
    if (auctionName.trim() !== (initial.auctionName || "")) payload.auctionName = auctionName.trim();
    if (auctionHouse.trim() !== (initial.auctionHouse || "")) payload.auctionHouse = auctionHouse.trim();
    let trimmedWebsite = website.trim();
    if (trimmedWebsite !== (initial.website || "")) {
      // Auto-format URL - add https:// if not present
      if (trimmedWebsite && !trimmedWebsite.match(/^https?:\/\//i)) {
        trimmedWebsite = `https://${trimmedWebsite}`;
      }
      payload.website = trimmedWebsite || null;
    }
    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing to update.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const db = getFirestore(app);
      const docRef = doc(db, "auctions", documentId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        toast({ title: "Not found", description: "This auction no longer exists.", variant: "destructive" });
        return;
      }
      await updateDoc(docRef, payload);
      toast({ title: "Saved", description: "Auction updated successfully." });
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
          <DialogTitle className="text-foreground">Edit auction</DialogTitle>
          <DialogDescription className="text-muted-foreground">Update basic details only.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="auctionName" className="text-foreground">Auction name</Label>
            <Input id="auctionName" value={auctionName} onChange={(e) => setAuctionName(e.target.value)} placeholder="e.g. Spring Classic Auction" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="auctionHouse" className="text-foreground">Auction house</Label>
            <Input id="auctionHouse" value={auctionHouse} onChange={(e) => setAuctionHouse(e.target.value)} placeholder="e.g. RM Sotheby's" className="text-foreground" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="website" className="text-foreground">Website <span className="text-muted-foreground text-xs">(Optional)</span></Label>
            <Input id="website" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="example.com" className="text-foreground" />
            <p className="text-xs text-muted-foreground">No need to add https://</p>
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


