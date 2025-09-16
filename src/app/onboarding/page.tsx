"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getAuth, onAuthStateChanged, applyActionCode, reload, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<{ id: string; name: string }[]>([]);
  const [lifestyleNetworkingNames, setLifestyleNetworkingNames] = useState<string[]>([]);
  const [lifestyleNetworkingIds, setLifestyleNetworkingIds] = useState<string[]>([]);
  const [availableLifestyleNetworking, setAvailableLifestyleNetworking] = useState<{ id: string; name: string; group?: string; active?: boolean }[]>([]);
  const [lifestyleSearch, setLifestyleSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Handle Firebase email action links e.g. mode=verifyEmail&oobCode=...
  useEffect(() => {
    const mode = searchParams?.get('mode');
    const oobCode = searchParams?.get('oobCode');
    if (mode === 'verifyEmail' && oobCode) {
      (async () => {
        try {
          await applyActionCode(auth, oobCode);
          try { if (auth.currentUser) await reload(auth.currentUser); } catch {}
          setVerifyMessage('Your email has been verified successfully.');
        } catch (e: any) {
          setVerifyMessage(e?.message || 'Verification link is invalid or expired.');
        } finally {
          // Clean the query params from URL
          router.replace('/onboarding');
        }
      })();
    }
  }, [auth, router, searchParams]);

  // Handle Firebase password reset links e.g. mode=resetPassword&oobCode=...
  useEffect(() => {
    const mode = searchParams?.get('mode');
    const oobCode = searchParams?.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      setResetMode(true);
      (async () => {
        try {
          const email = await verifyPasswordResetCode(auth, oobCode);
          setResetEmail(email || null);
          setResetError(null);
        } catch (e: any) {
          setResetError(e?.message || 'This password reset link is invalid or expired.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [auth, searchParams]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const mode = searchParams?.get('mode');
        if (mode === 'resetPassword') {
          setLoading(false);
          return;
        }
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
  }, [auth, db, router, searchParams]);

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    const oobCode = searchParams?.get('oobCode');
    if (!oobCode) {
      setResetError('Missing reset code.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    setResetSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      // Redirect to login with a success hint
      router.replace('/login?reset=1');
    } catch (e: any) {
      setResetError(e?.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

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

        const interestItems = items.filter((it: any) => !it.section || it.section === 'interest');
        setAvailableInterests(interestItems.map((i: any) => ({ id: i.id, name: i.name })));

        const lnItems = items.filter((it: any) => it.section === 'lifestyle-networking' && it.active !== false);
        setAvailableLifestyleNetworking(lnItems as any);
      } catch {
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
    if (!firstName.trim() || !lastName.trim() || !gender) return;
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
        gender,
        photoURL: newPhotoURL,
        interests,
        interestIds,
        lifestyleNetworking: lifestyleNetworkingNames,
        lifestyleNetworkingIds,
        onboarded: true,
        updatedAt: new Date()
      }, { merge: true });
      router.push("/");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-10">Loading...</div>;

  // Render password reset UI if in reset mode
  if (resetMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#E0D8C1]">
        <div className="container mx-auto px-4 py-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
              <span className="font-semibold text-gray-900">Reset your password</span>
            </div>
            {resetEmail && (
              <p className="text-base text-gray-800">for <span className="font-medium">{resetEmail}</span></p>
            )}
            {verifyMessage && (
              <p className="text-sm text-green-700 mt-2">{verifyMessage}</p>
            )}
            {resetError && (
              <p className="text-sm text-red-600 mt-2">{resetError}</p>
            )}
          </motion.div>

          <Card className="shadow-lg bg-white border border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-gray-900">Choose a new password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirmReset} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword" className="text-gray-900">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    className="bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-gray-900">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                    className="bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Button type="button" variant="outline" onClick={() => router.push('/login')}>
                    Back to login
                  </Button>
                  <Button type="submit" disabled={resetSubmitting} className="font-semibold">
                    {resetSubmitting ? 'Updating...' : 'Update password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <Card className="shadow-lg bg-white border border-yellow-400/20">
                <CardHeader>
                  <CardTitle className="text-gray-900">Step 1 · Personal details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName" className="text-gray-900">First name</Label>
                      <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-white text-gray-900 placeholder:text-gray-500" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName" className="text-gray-900">Surname</Label>
                      <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-white text-gray-900 placeholder:text-gray-500" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nationality" className="text-gray-900">Nationality</Label>
                    <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className="bg-white text-gray-900 placeholder:text-gray-500" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-gray-900">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="bg-white text-gray-900">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="na">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-gray-900">Profile picture</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleProfilePick(e.target.files?.[0] || null)} className="bg-white text-gray-900" />
                    {photoURL && (
                      <div className="mt-2">
                        <Image src={photoURL} alt="Profile" width={96} height={96} className="rounded-full object-cover" />
                      </div>
                    )}
                    <p className="text-xs text-gray-700">PNG or JPG recommended. Square images look best.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="shadow-lg bg-white border border-yellow-400/20">
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
                  <p className="text-xs text-gray-700 mt-2">Selected: {interests.length}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card className="shadow-lg bg-white border border-yellow-400/20">
                <CardHeader>
                  <CardTitle className="text-gray-900">Step 3 · Lifestyle & Networking</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ln-search" className="text-gray-900">Search</Label>
                    <Input id="ln-search" placeholder="Search categories..." value={lifestyleSearch} onChange={(e) => setLifestyleSearch(e.target.value)} className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                      return <p className="text-sm text-gray-700">Category was not found.</p>;
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
                  <p className="text-xs text-gray-700">Selected: {lifestyleNetworkingNames.length} • No limits.</p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex justify-center">
            <Button type="submit" disabled={saving} className="font-semibold">
              {saving ? 'Saving...' : 'Finish Onboarding'}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}