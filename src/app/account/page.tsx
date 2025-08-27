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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

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
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<{ id: string; name: string }[]>([]);
  // Lifestyle & Networking
  const [lifestyleNetworkingNames, setLifestyleNetworkingNames] = useState<string[]>([]);
  const [lifestyleNetworkingIds, setLifestyleNetworkingIds] = useState<string[]>([]);
  const [availableLifestyleNetworking, setAvailableLifestyleNetworking] = useState<{ id: string; name: string; group?: string; active?: boolean }[]>([]);
  const [lifestyleSearch, setLifestyleSearch] = useState("");
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
        setInterestIds(Array.isArray((data as any).interestIds) ? (data as any).interestIds : []);
        setLifestyleNetworkingNames(Array.isArray((data as any).lifestyleNetworking) ? (data as any).lifestyleNetworking : []);
        setLifestyleNetworkingIds(Array.isArray((data as any).lifestyleNetworkingIds) ? (data as any).lifestyleNetworkingIds : []);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [auth, db, router]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snap = await getDocs(collection(db, "interests"));
        const items = snap.docs.map(d => {
          const data = (d.data() as any) || {};
          return {
            id: d.id,
            name: data.name as string,
            section: (data.section as string) || undefined,
            group: (data.group as string) || undefined,
            active: typeof data.active === 'boolean' ? data.active : true,
          } as any;
        }).filter(x => !!x.name);

        // Interests: legacy items without section treated as "interest"
        const interestItems = items.filter((it: any) => !it.section || it.section === 'interest');
        setAvailableInterests(interestItems.map((i: any) => ({ id: i.id, name: i.name })));

        // Lifestyle & Networking: explicit section only
        const lnItems = items.filter((it: any) => it.section === 'lifestyle-networking' && it.active !== false);
        setAvailableLifestyleNetworking(lnItems as any);
      } catch {
        // Fallbacks for interests to avoid empty UI; lifestyle/networking empty until admin adds
        setAvailableInterests([
          { id: 'fallback-1', name: 'Car auctions' },
          { id: 'fallback-2', name: 'Car hotels' },
          { id: 'fallback-3', name: 'Classic cars' },
          { id: 'fallback-4', name: 'Supercars' },
          { id: 'fallback-5', name: 'Storage' },
          { id: 'fallback-6', name: 'Hotel' },
        ]);
        setAvailableLifestyleNetworking([]);
      }
    };
    loadCategories();
  }, [db]);

  const handleProfilePick = (file: File | null) => {
    setProfileFile(file);
    if (file) setPhotoURL(URL.createObjectURL(file));
  };

  const toggleInterest = (name: string) => {
    setInterests((prev) => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
    const match = availableInterests.find(a => a.name === name);
    if (match) {
      setInterestIds((prev) => prev.includes(match.id) ? prev.filter(id => id !== match.id) : [...prev, match.id]);
    }
  };

  const toggleLifestyle = (item: { id: string; name: string }) => {
    setLifestyleNetworkingNames((prev) => prev.includes(item.name) ? prev.filter(i => i !== item.name) : [...prev, item.name]);
    setLifestyleNetworkingIds((prev) => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
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
        interestIds,
        lifestyleNetworking: lifestyleNetworkingNames,
        lifestyleNetworkingIds,
        updatedAt: new Date()
      }, { merge: true });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#E0D8C1]">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
            <span className="font-semibold text-gray-900">Let’s personalize your experience</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-amber-500">Your Profile</h1>
          <p className="text-base text-gray-800 mt-2">Complete these steps to get tailored events, cars and experiences.</p>
        </motion.div>

        <form onSubmit={onSave} className="grid gap-8">
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Step 1 · Personal details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
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
                        <Image src={photoURL} alt="Profile" width={96} height={96} className="rounded-full object-cover" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">PNG or JPG recommended. Square images look best.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Step 2 · Fields of interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.name)}
                        whileTap={{ scale: 0.98 }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${interests.includes(item.name) ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                      >
                        {item.name}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Selected: {interests.length}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Step 3 · Lifestyle & Networking</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ln-search">Search</Label>
                    <Input id="ln-search" placeholder="Search categories..." value={lifestyleSearch} onChange={(e) => setLifestyleSearch(e.target.value)} />
                  </div>
                  {(() => {
                    const filtered = availableLifestyleNetworking.filter(item => item.name.toLowerCase().includes(lifestyleSearch.toLowerCase()));
                    const byGroup: Record<string, { id: string; name: string; group?: string }[]> = {};
                    for (const item of filtered) {
                      const key = item.group || 'Other';
                      if (!byGroup[key]) byGroup[key] = [];
                      byGroup[key].push(item);
                    }
                    const groups = Object.keys(byGroup).sort();
                    if (groups.length === 0) {
                      return <p className="text-sm text-muted-foreground">No categories yet. Add them in Admin → Interests.</p>;
                    }
                    return (
                      <div className="grid gap-4">
                        {groups.map(group => (
                          <div key={group} className="grid gap-2">
                            <div className="text-sm font-medium text-gray-900">{group}</div>
                            <div className="flex flex-wrap gap-2">
                              {byGroup[group].map((it) => (
                                <motion.button
                                  key={it.id}
                                  type="button"
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => toggleLifestyle(it)}
                                  className={`px-3 py-1.5 rounded-full text-sm border transition ${lifestyleNetworkingNames.includes(it.name) ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                                >
                                  {it.name}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground">Selected: {lifestyleNetworkingNames.length} • No limits.</p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex justify-center">
            <Button type="submit" disabled={saving} className="font-semibold">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
} 