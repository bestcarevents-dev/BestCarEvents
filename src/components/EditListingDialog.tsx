"use client";

import { useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type EditListingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName: string;
  documentId: string;
  fieldName: string;
  label: string;
  currentValue?: string | number | null;
  placeholder?: string;
  helpText?: string;
  onSaved?: (newValue: string) => void;
};

export default function EditListingDialog(props: EditListingDialogProps) {
  const { open, onOpenChange, collectionName, documentId, fieldName, label, currentValue, placeholder, helpText, onSaved } = props;
  const [value, setValue] = useState<string>(currentValue ? String(currentValue) : "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({ title: "Please enter a value", description: `${label} cannot be empty.`, variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const db = getFirestore(app);
      await updateDoc(doc(db, collectionName, documentId), { [fieldName]: trimmed });
      toast({ title: "Saved", description: `${label} updated successfully.` });
      onSaved?.(trimmed);
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
          <DialogTitle className="text-foreground">Edit {label}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{helpText || "Update this information. Only basic details can be changed."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-field" className="text-foreground">{label}</Label>
            <Input
              id="edit-field"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className="text-foreground"
            />
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


