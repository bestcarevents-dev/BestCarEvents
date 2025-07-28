"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [isFreeListing, setIsFreeListing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const db = getFirestore(app);
        const settingsRef = doc(db, "settings", "carlisting");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setIsFreeListing(settingsSnap.data()?.isFree || false);
        } else {
          // If document doesn't exist, create it with default value
          await updateDoc(settingsRef, { isFree: false });
          setIsFreeListing(false);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleToggleFreeListing = async () => {
    setSaving(true);
    try {
      const db = getFirestore(app);
      const settingsRef = doc(db, "settings", "carlisting");
      const newValue = !isFreeListing;
      
      await updateDoc(settingsRef, { isFree: newValue });
      setIsFreeListing(newValue);
      
      toast({
        title: "Success",
        description: newValue 
          ? "Car listings are now FREE for all users" 
          : "Car listings now require payment",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and configurations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Car Listing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Free Car Listings</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users can list cars for free without purchasing credits
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isFreeListing ? "default" : "secondary"}>
                {isFreeListing ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                checked={isFreeListing}
                onCheckedChange={handleToggleFreeListing}
                disabled={saving}
              />
            </div>
          </div>
          
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving changes...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 