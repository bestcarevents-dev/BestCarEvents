import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export function useNewsletterModal() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkNewsletterStatus = async () => {
      // Check if we're on a page where we shouldn't show the modal
      const currentPath = window.location.pathname;
      const excludedPaths = [
        '/login',
        '/register',
        '/admin',
        '/auth',
        '/reset-password',
        '/verify-email'
      ];
      
      const shouldExclude = excludedPaths.some(path => currentPath.startsWith(path));
      if (shouldExclude) {
        setHasChecked(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const auth = getAuth(app);
        
        // Wait for auth state to be determined
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve();
          });
        });

        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          // User is not logged in - show modal after delay
          setTimeout(() => {
            setShowModal(true);
            setHasChecked(true);
            setIsLoading(false);
          }, 2500); // 2.5 seconds delay
          return;
        }

        // User is logged in - check their subscription status
        const db = getFirestore(app);
        const userDocRef = doc(db, "users", currentUser.uid);
        
        // Wait for database response
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isSubscribed = userData.isNewsletterSubscribed === true;
          
          if (!isSubscribed) {
            // User is not subscribed - show modal after delay
            setTimeout(() => {
              setShowModal(true);
              setHasChecked(true);
              setIsLoading(false);
            }, 2500); // 2.5 seconds delay
            return;
          }
        } else {
          // User document doesn't exist - show modal after delay
          setTimeout(() => {
            setShowModal(true);
            setHasChecked(true);
            setIsLoading(false);
          }, 2500); // 2.5 seconds delay
          return;
        }
        
        // User is subscribed - don't show modal
        setHasChecked(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error("Error checking newsletter status:", error);
        setHasChecked(true);
        setIsLoading(false);
      }
    };

    // Only check once per session
    if (!hasChecked) {
      checkNewsletterStatus();
    }
  }, [hasChecked]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubscribe = () => {
    // This will be called when user subscribes successfully
    // The modal will close automatically after 2 seconds
  };

  return {
    showModal,
    closeModal,
    handleSubscribe,
    isLoading
  };
} 