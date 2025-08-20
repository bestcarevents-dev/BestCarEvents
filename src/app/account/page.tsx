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

export default function AccountPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationality, setNationality] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUid(user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? (snap.data() as any) : {};
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setNationality(data.nationality || "");
        setPhotoURL(data.photoURL || null);
        setInterests(Array.isArray(data.interests) ? data.interests : []);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [auth, db, router]);

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
    if (file) setPhotoURL(URL.createObjectURL(file));
  };

  const toggleInterest = (name: string) => {
    setInterests((prev) => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      let newPhotoURL = photoURL || null;
      if (profileFile) {
        const r = ref(storage, `users/${uid}/profile_${Date.now()}_${profileFile.name}`);
        await uploadBytes(r, profileFile);
        newPhotoURL = await getDownloadURL(r);
      }
      await setDoc(doc(db, "users", uid), {
        firstName,
        lastName,
        nationality: nationality || null,
        photoURL: newPhotoURL,
        interests,
        updatedAt: new Date()
      }, { merge: true });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-10">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-headline font-bold mb-6">My Account</h1>
      <form onSubmit={onSave} className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Surname</Label>
            <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Profile picture</Label>
          <Input type="file" accept="image/*" onChange={(e) => handleProfilePick(e.target.files?.[0] || null)} />
          {photoURL && (
            <div className="mt-2">
              <Image src={photoURL} alt="Profile" width={100} height={100} className="rounded-full object-cover" />
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
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
} 