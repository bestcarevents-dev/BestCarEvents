"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function ContactForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast({ title: "Missing information", description: "Please provide both email and message.", variant: "destructive" });
      return;
    }
    if (!validateEmail(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const db = getFirestore(app);
      await addDoc(collection(db, "contactRequests"), {
        email,
        message,
        createdAt: serverTimestamp(),
      });
      setEmail("");
      setMessage("");
      toast({ title: "Message sent", description: "Thank you for reaching out! We'll get back to you soon." });
    } catch (err) {
      toast({ title: "Failed to send", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-white border-amber-200 shadow-[0_8px_30px_rgba(191,146,42,0.12)]">
      <CardContent className="p-6">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">Send us a message</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-email" className="text-slate-800">Your Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-yellow-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message" className="text-slate-800">Message</Label>
            <Textarea
              id="contact-message"
              placeholder="Tell us how we can help..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-40 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-yellow-500"
              required
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white">
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


