"use client";

import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

interface BannedUserProviderProps {
  children: React.ReactNode;
}

export default function BannedUserProvider({ children }: BannedUserProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!currentUser) {
        setIsBanned(false);
        setChecked(true);
        return;
      }
      try {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const data = snap.exists() ? (snap.data() as any) : undefined;
        setIsBanned(data?.userType === "banned");
      } catch {
        setIsBanned(false);
      } finally {
        setChecked(true);
      }
    };
    run();
  }, [currentUser]);

  return (
    <>
      {isBanned && (
        <div className="fixed top-0 left-0 right-0 z-[60]">
          <div className="container mx-auto px-4 pt-24">
            <Alert variant="destructive" className="shadow-lg">
              <TriangleAlert className="h-5 w-5" />
              <AlertTitle>Your account has been banned</AlertTitle>
              <AlertDescription>
                If you believe this is a mistake, please email your appeal to
                {" "}
                <a
                  className="underline font-medium"
                  href="mailto:info@bestcarevents.com"
                >
                  info@bestcarevents.com
                </a>
                .
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      {children}
    </>
  );
}


