"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { CheckCircle2, Mail, Star, Zap, Gift, LogIn } from "lucide-react";

interface GlobalNewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export default function GlobalNewsletterModal({ isOpen, onClose, onSubscribe }: GlobalNewsletterModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    const db = getFirestore(app);
    const emailToUse = user?.email;
    
    if (!emailToUse) {
      setError("Please login to subscribe to our newsletter.");
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
      onSubscribe();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSubscribed(false);
      }, 2000);
    } catch (err) {
      setError("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setShowLoginPrompt(false);
    }
  };

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[92vw] p-0 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-[#E0D8C1] mx-auto sm:mx-4 border border-yellow-400/20 shadow-xl left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 sm:max-w-2xl sm:w-[90vw]">
        <AnimatePresence mode="wait">
          {!subscribed ? (
            <motion.div
              key="subscribe"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-red-500/10 rounded-lg"></div>
                
                <div className="relative p-4 sm:p-6 md:p-8">
                  <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all duration-200 hover:scale-110"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <DialogHeader className="text-center mb-4 sm:mb-6">
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
                        <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                    </div>
                    <DialogTitle className="text-2xl sm:text-3xl font-bold font-headline text-gray-900 mb-2">
                      Stay in the Loop!
                    </DialogTitle>
                    <DialogDescription className="text-base sm:text-lg text-gray-700 max-w-md mx-auto">
                      Get exclusive access to premium automotive content, early event announcements, and insider tips.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="text-center">
                      <div className="p-2 sm:p-3 bg-blue-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Premium Content</h3>
                      <p className="text-xs sm:text-sm text-gray-700">Exclusive articles and expert insights</p>
                    </div>
                    <div className="text-center">
                      <div className="p-2 sm:p-3 bg-green-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Early Access</h3>
                      <p className="text-xs sm:text-sm text-gray-700">Be first to know about new events</p>
                    </div>
                    <div className="text-center">
                      <div className="p-2 sm:p-3 bg-purple-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                        <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Special Offers</h3>
                      <p className="text-xs sm:text-sm text-gray-700">Member-only discounts and deals</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {showLoginPrompt && (
                    <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-800 font-semibold mb-2 text-sm sm:text-base">Login Required</p>
                      <p className="text-blue-700 text-xs sm:text-sm mb-3">Please login to subscribe to our newsletter.</p>
                      <Button
                        onClick={handleLoginClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-sm sm:text-base"
                      >
                        Login to Subscribe
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleSubscribe}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                          <span className="text-xs sm:text-sm">Subscribing...</span>
                        </div>
                      ) : (
                        "Subscribe Now"
                      )}
                    </Button>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      disabled={submitting}
                      className="flex-1 border-gray-300 text-gray-800 hover:bg-gray-50 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 text-sm sm:text-base"
                    >
                      Maybe Later
                    </Button>
                  </div>

                  <p className="text-xs text-gray-600 text-center mt-3 sm:mt-4">
                    No spam, unsubscribe anytime. We respect your privacy.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            >
              <Card className="max-w-md mx-auto text-center border-0 shadow-none">
                <CardHeader className="items-center pb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mb-4" />
                  </motion.div>
                  <CardTitle className="text-xl sm:text-2xl font-bold font-headline text-gray-900 mb-2">
                    Welcome to the Family!
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg text-gray-700">
                    You're now subscribed to our premium newsletter. Check your email for exclusive content!
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
} 