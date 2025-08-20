"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function OnboardingPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationality, setNationality] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setCurrentUserId(u.uid);
      }
    });
    return () => unsub();
  }, [auth, router]);

  useEffect(() => {
    const loadInterests = async () => {
      try {
        const snap = await getDocs(collection(db, "interests"));
        const vals = snap.docs.map(d => (d.data() as any)?.name).filter(Boolean);
        setAvailableInterests(vals.length ? vals : ["Car auctions","Car hotels","Classic cars","Supercars","Storage","Hotel"]);
      } catch {
        setAvailableInterests(["Car auctions","Car hotels","Classic cars","Supercars","Storage","Hotel"]);
      }
    };
    loadInterests();
  }, [db]);

  const handleProfilePick = (file: File | null) => {
    setProfileFile(file);
    if (file) setProfilePreview(URL.createObjectURL(file));
    else setProfilePreview(null);
  };

  const toggleInterest = (name: string) => {
    setInterests((prev) => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      let photoURL: string | undefined;
      if (profileFile) {
        const r = ref(storage, `users/${currentUserId}/profile_${Date.now()}_${profileFile.name}`);
        await uploadBytes(r, profileFile);
        photoURL = await getDownloadURL(r);
      }
      await setDoc(doc(db, "users", currentUserId), {
        firstName,
        lastName,
        nationality: nationality || null,
        photoURL: photoURL || null,
        interests,
        updatedAt: new Date()
      }, { merge: true });
      router.push("/account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[360px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Tell us about yourself</h1>
            <p className="text-muted-foreground">Customize your profile to get better recommendations.</p>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-input" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Surname</Label>
                <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-input" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nationality">Nationality (optional)</Label>
              <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className="bg-input" />
            </div>
            <div className="grid gap-2">
              <Label>Profile picture (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => handleProfilePick(e.target.files?.[0] || null)} className="bg-input" />
              {profilePreview && (
                <div className="mt-2">
                  <Image src={profilePreview} alt="Preview" width={100} height={100} className="rounded-full object-cover" />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Fields of interest</Label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleInterest(name)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${interests.includes(name) ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">You can update these later in My Account.</p>
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={saving}>
              {saving ? 'Saving...' : 'Finish'}
            </Button>
          </form>
        </div>
      </div>
      <div className="relative flex-1 hidden w-full h-full lg:block">
        <Image
          src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=2700&auto=format&fit=crop"
          alt="Sleek black sports car interior"
          layout="fill"
          objectFit="cover"
          className="opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-10 right-10 text-white text-right">
          <h1 className="text-5xl font-bold font-headline drop-shadow-lg">Welcome!</h1>
          <p className="mt-2 text-xl font-sans drop-shadow-md">Personalize your experience in a minute.</p>
        </div>
      </div>
    </div>
  );
} 