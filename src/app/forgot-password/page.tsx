"use client";

import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { CheckCircle, ShieldAlert } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const auth = getAuth(app);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      let errorMessage = "Failed to send password reset email.";
       if (error.code === 'auth/user-not-found') {
            errorMessage = "No account found with that email address.";
       } else if (error.code === 'auth/invalid-email') {
           errorMessage = "Please enter a valid email address.";
       }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="mx-auto grid w-[350px] gap-6">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>
        <form onSubmit={handleResetPassword} className="grid gap-4">
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
           {error && (
                <div className="flex items-center p-3 text-sm rounded-md bg-destructive/15 text-destructive">
                    <ShieldAlert className="w-5 h-5 mr-2" />
                    <p>{error}</p>
                </div>
            )}
            {success && (
                <div className="flex items-center p-3 text-sm rounded-md bg-green-500/15 text-green-500">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <p>{success}</p>
                </div>
            )}
          <Button type="submit" className="w-full font-semibold">
            Send Reset Link
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Remembered your password?{" "}
          <Link href="/login" className="underline font-semibold text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
