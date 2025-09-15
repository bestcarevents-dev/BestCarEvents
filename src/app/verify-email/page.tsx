"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, sendEmailVerification, reload } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setChecking(false);
      if (!user) return; // allow page to show
      try {
        await reload(user);
      } catch {}
      if (user.emailVerified) {
        router.replace("/onboarding");
      }
    });
    return () => unsub();
  }, [auth, router]);

  const handleResend = async () => {
    setMessage(null);
    setSending(true);
    try {
      const u = auth.currentUser;
      if (!u) {
        setMessage("Please log in to resend the verification email.");
        return;
      }
      await sendEmailVerification(u);
      setMessage("Verification email sent. Check your inbox and spam folder.");
    } catch (e: any) {
      setMessage(e?.message || "Could not send verification email. Try again later.");
    } finally {
      setSending(false);
    }
  };

  const handleIHaveVerified = async () => {
    const u = auth.currentUser;
    if (!u) return;
    try { await reload(u); } catch {}
    if (u.emailVerified) {
      router.replace("/onboarding");
    } else {
      setMessage("Not verified yet. Click the link in your email, then try Refresh.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheck className="w-6 h-6 text-primary" />
            Verify your email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We sent a verification link to your email address. Please click the link to confirm your account.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleResend} disabled={sending}>
              Resend email
            </Button>
            <Button variant="outline" onClick={handleIHaveVerified}>
              <RefreshCw className="w-4 h-4 mr-2" />
              I verified, refresh
            </Button>
          </div>
          {message && (
            <div className="text-sm text-muted-foreground">{message}</div>
          )}
          {!checking && !auth.currentUser && (
            <div className="text-sm text-muted-foreground">
              You are not logged in. Please log in to continue.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


