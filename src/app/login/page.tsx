"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { ShieldAlert } from "lucide-react";
import Script from "next/script";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = getAuth(app);
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "settings", "authImages"));
        if (snap.exists()) {
          setBgUrl((snap.data() as any)?.loginImage || null);
        }
      } catch {}
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Optional: protect login with reCAPTCHA Enterprise
      let passing = false;
      if (typeof window !== 'undefined' && (window as any).grecaptcha) {
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
        const action = 'LOGIN';
        const token: string = await new Promise((resolve) => {
          (window as any).grecaptcha.ready(async () => {
            const t = await (window as any).grecaptcha.execute(siteKey, { action });
            resolve(t);
          });
        });
        const verifyRes = await fetch('/api/recaptcha/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action }),
        });
        const verifyJson = await verifyRes.json();
        passing = !!verifyJson?.ok && !!verifyJson?.valid && !!verifyJson?.passing;
      }
      if (!passing) {
        setError("reCAPTCHA verification failed. Please try again.");
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user && !cred.user.emailVerified) {
        try { await sendEmailVerification(cred.user); } catch {}
        router.push("/verify-email");
        return;
      }
      router.push("/");
    } catch (error: any) {
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}`} strategy="afterInteractive" />
      <div className="relative flex-1 hidden w-full h-full lg:block">
          <Image
              src={bgUrl || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2700&auto=format&fit=crop"}
              alt="Stylish white sports car"
              layout="fill"
              objectFit="cover"
              className="opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-10 left-10 text-white">
              <h1 className="text-5xl font-bold font-headline drop-shadow-lg">BestCarEvents</h1>
              <p className="mt-2 text-xl font-sans drop-shadow-md">Your premier destination for automotive excellence.</p>
          </div>
      </div>
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Welcome Back</h1>
            <p className="text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
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
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline font-semibold text-primary">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
