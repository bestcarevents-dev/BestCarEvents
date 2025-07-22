"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { CheckCircle2 } from "lucide-react";

export default function NewsletterSubscribe() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setEmail(currentUser.email || "");
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      await setDoc(doc(db, "newsletter", "subscribers"), { [emailToUse]: true }, { merge: true });
      setSubscribed(true);
    } catch (err) {
      setError("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="w-full flex justify-center mt-10 mb-0">
      {user ? (
        <>
          <Button
            size="lg"
            className="rounded-lg px-7 py-4 text-lg font-semibold shadow-xl bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all duration-300"
            onClick={handleSubscribe}
            disabled={submitting || subscribed}
          >
            {subscribed ? "Subscribed!" : "Subscribe to our Newsletter"}
          </Button>
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
            <form onSubmit={handleSubscribe}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold">Subscribe to our Newsletter</DialogTitle>
                <p className="mt-2 text-muted-foreground text-base">Enter your email to receive updates and exclusive offers.</p>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="text-lg py-3 px-4 rounded-lg border border-input focus:ring-2 focus:ring-primary"
                  disabled={submitting || subscribed}
                />
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-lg font-semibold text-lg px-7 py-3 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all duration-300"
                  disabled={submitting || subscribed}
                >
                  {submitting ? "Subscribing..." : subscribed ? "Subscribed!" : "Subscribe"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="rounded-lg font-semibold text-lg px-7 py-3">Cancel</Button>
                </DialogClose>
              </DialogFooter>
              <AnimatePresence>
                {subscribed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-0 right-0 top-0 z-20"
                  >
                    <Card className="max-w-md mx-auto text-center border-primary bg-card text-card-foreground shadow-2xl animate-in fade-in zoom-in mt-4">
                      <CardHeader className="items-center">
                        <CheckCircle2 className="w-14 h-14 text-green-500 mb-2" />
                        <CardTitle className="text-2xl font-bold font-headline">Subscribed!</CardTitle>
                        <CardDescription className="text-lg">Thank you for joining our newsletter.</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 