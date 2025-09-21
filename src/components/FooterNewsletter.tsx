"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { CheckCircle2, LogIn } from "lucide-react";

export default function FooterNewsletter() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setEmail(currentUser.email || "");
    });
    return () => unsubscribe();
  }, []);

  // Check if already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.uid) {
        setAlreadySubscribed(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? (snap.data() as any) : null;
        setAlreadySubscribed(!!data?.isNewsletterSubscribed);
      } catch {
        setAlreadySubscribed(false);
      }
    };
    checkSubscription();
  }, [user]);

  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (alreadySubscribed) return; // no-op if already subscribed
    setSubmitting(true);
    setError(null);
    const db = getFirestore(app);
    const emailToUse = user?.email || email;
    if (!emailToUse || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailToUse)) {
      setError("Please enter a valid email address.");
      setSubmitting(false);
      return;
    }
    try {
      // Add to newsletter subscribers
      await setDoc(doc(db, "newsletter", "subscribers"), { [emailToUse]: true }, { merge: true });
      
      // Update user's document with newsletter subscription status
      if (user?.uid) {
        await setDoc(doc(db, "users", user.uid), { 
          isNewsletterSubscribed: true 
        }, { merge: true });
      }
      
      setSubscribed(true);
      setAlreadySubscribed(true);
    } catch (err) {
      setError("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-hide subscribed container after 3 seconds
  useEffect(() => {
    if (!subscribed) return;
    const t = setTimeout(() => setSubscribed(false), 3000);
    return () => clearTimeout(t);
  }, [subscribed]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSubscribed(false);
        setError(null);
        if (!user) setEmail("");
      }, 400);
    }
  }, [open, user]);

  return (
    <div className="w-full flex justify-center py-4">
      {user ? (
        <>
          <Button
            size="lg"
            className="rounded-lg px-7 py-4 text-lg font-semibold shadow-xl bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all duration-300"
            onClick={handleSubscribe}
            disabled={submitting || subscribed || alreadySubscribed}
          >
            {alreadySubscribed ? "Subscribed — you'll receive updates" : (subscribed ? "Subscribed!" : "Subscribe to our Newsletter")}
          </Button>
          {/* Removed extra subscribed notice to keep only button text */}
          <AnimatePresence>
            {subscribed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="absolute mt-20 z-20"
              >
                <Card className="max-w-md mx-auto text-center border-primary bg-card text-card-foreground shadow-2xl animate-in fade-in zoom-in">
                  <CardHeader className="items-center">
                    <CheckCircle2 className="w-14 h-14 text-green-500 mb-2" />
                    <CardTitle className="text-2xl font-bold font-headline">Subscribed!</CardTitle>
                    <CardDescription className="text-lg">Thank you for joining our newsletter.</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="rounded-lg px-7 py-4 text-lg font-semibold shadow-xl bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all duration-300"
            >
              Subscribe to our Newsletter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">Login Required</DialogTitle>
              <p className="mt-2 text-muted-foreground text-base">Please login to subscribe to our newsletter.</p>
            </DialogHeader>
            <div className="py-6 text-center">
              <div className="mb-4">
                <LogIn className="w-16 h-16 text-[#E0D8C1] mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2 text-red">Login Required</p>
                <p className="text-sm text-muted-foreground">You need to be logged in to subscribe to our newsletter.</p>
              </div>
              <DialogFooter className="flex flex-col gap-2">
                <Button asChild variant="default" className="w-full">
                  <a href="/login">Login to Subscribe</a>
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">Close</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 