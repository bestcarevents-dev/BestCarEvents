"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

type AuthImagesDoc = {
  loginImage?: string;
  signupImage?: string;
};

export default function AdminAuthImagesPage() {
  const db = useMemo(() => getFirestore(app), []);
  const storage = useMemo(() => getStorage(app), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<null | "login" | "signup">(null);
  const [data, setData] = useState<AuthImagesDoc>({});
  const [loginPreview, setLoginPreview] = useState<string | null>(null);
  const [signupPreview, setSignupPreview] = useState<string | null>(null);
  const loginFileRef = useRef<HTMLInputElement | null>(null);
  const signupFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const refDoc = doc(db, "settings", "authImages");
        const snap = await getDoc(refDoc);
        if (snap.exists()) {
          setData(snap.data() as AuthImagesDoc);
        } else {
          await setDoc(refDoc, {});
          setData({});
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  const uploadAndSave = async (kind: "loginImage" | "signupImage", file: File) => {
    setSaving(kind === "loginImage" ? "login" : "signup");
    try {
      const r = ref(storage, `auth/${kind}/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      const settingsRef = doc(db, "settings", "authImages");
      await updateDoc(settingsRef, { [kind]: url });
      setData(prev => ({ ...prev, [kind]: url }));
      toast({ title: "Saved", description: `${kind === "loginImage" ? "Login" : "Signup"} image updated.` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save image", variant: "destructive" });
    } finally {
      setSaving(null);
      if (kind === "loginImage" && loginFileRef.current) loginFileRef.current.value = "";
      if (kind === "signupImage" && signupFileRef.current) signupFileRef.current.value = "";
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auth Images</h1>
        <p className="text-muted-foreground">Manage login and signup background images. Current images are used as fallback in the UI if these are empty.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Login Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted/40">
              <Image src={loginPreview || data.loginImage || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2700&auto=format&fit=crop"} alt="Login background" fill className="object-cover" />
            </div>
            <div className="space-y-2">
              <Label>Upload new</Label>
              <Input ref={loginFileRef} type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                setLoginPreview(f ? URL.createObjectURL(f) : null);
              }} />
              <Button disabled={saving === "login" || !loginFileRef.current?.files?.[0]} onClick={() => {
                const f = loginFileRef.current?.files?.[0];
                if (f) uploadAndSave("loginImage", f);
              }}>{saving === "login" ? "Saving..." : "Save"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signup Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted/40">
              <Image src={signupPreview || data.signupImage || "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=2700&auto=format&fit=crop"} alt="Signup background" fill className="object-cover" />
            </div>
            <div className="space-y-2">
              <Label>Upload new</Label>
              <Input ref={signupFileRef} type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                setSignupPreview(f ? URL.createObjectURL(f) : null);
              }} />
              <Button disabled={saving === "signup" || !signupFileRef.current?.files?.[0]} onClick={() => {
                const f = signupFileRef.current?.files?.[0];
                if (f) uploadAndSave("signupImage", f);
              }}>{saving === "signup" ? "Saving..." : "Save"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


