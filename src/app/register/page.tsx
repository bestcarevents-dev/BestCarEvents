"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
// removed duplicate Firestore import
import { ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "settings", "authImages"));
        if (snap.exists()) {
          setBgUrl((snap.data() as any)?.signupImage || null);
        }
      } catch {}
    })();
  }, []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app); // Initialize Firestore

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: user.email,
          userType: "regular", // Default user type
          createdAt: new Date(),
        });
      }

      router.push("/onboarding");
    } catch (error: any) {
        let errorMessage = "Failed to create an account.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already registered. Please login.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Please choose a stronger password.";
        }
        setError(errorMessage);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            name: u.displayName || "",
            email: u.email,
            userType: "regular",
            createdAt: new Date(),
          });
        }
      }
      router.push("/onboarding");
    } catch (e: any) {
      setError(e?.message || "Google sign-up failed.");
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Create an Account</h1>
            <p className="text-muted-foreground">
              Enter your information to create your account
            </p>
          </div>
          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input"
              />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                    id="confirm-password" 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input"
                />
            </div>
            {error && (
                <div className="flex items-center p-3 text-sm rounded-md bg-destructive/15 text-red">
                    <ShieldAlert className="w-5 h-5 mr-2" />
                    <p>{error}</p>
                </div>
            )}
            <Button type="submit" className="w-full font-semibold">
              Create Account
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup}>
              Sign up with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline font-semibold text-primary">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="relative flex-1 hidden w-full h-full lg:block">
        <Image
          src={bgUrl || "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=2700&auto=format&fit=crop"}
          alt="Sleek black sports car interior"
          layout="fill"
          objectFit="cover"
          className="opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-10 right-10 text-white text-right">
          <h1 className="text-5xl font-bold font-headline drop-shadow-lg">Join the Elite</h1>
          <p className="mt-2 text-xl font-sans drop-shadow-md">Access exclusive events and a community of enthusiasts.</p>
        </div>
      </div>
    </div>
  );
}
