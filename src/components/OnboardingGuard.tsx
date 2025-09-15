"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const EXEMPT_PATH_PREFIXES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/onboarding",
  "/api",
]);

function isExemptPath(pathname: string): boolean {
  if (!pathname) return false;
  for (const p of EXEMPT_PATH_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }
  return false;
}

export default function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const checkingRef = useRef(false);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const check = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const u = auth.currentUser;
        if (!u) return; // not logged in
        if (isExemptPath(pathname)) return; // allow exempt pages
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? (snap.data() as any) : {};
        if ((data?.onboarded ?? false) !== true) {
          router.push("/onboarding");
        }
      } finally {
        checkingRef.current = false;
      }
    };

    // Run on mount and when route changes
    check();
    const unsub = onAuthStateChanged(auth, () => {
      // Re-check when auth state changes
      check();
    });
    return () => unsub();
  }, [pathname, router]);

  return null;
}


