"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Car, Calendar, Building2, Gavel, Users, Wrench, X } from "lucide-react";

interface FreeListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeListingsModal({ isOpen, onClose }: FreeListingsModalProps) {
  const handleClose = () => {
    onClose();
  };

  const features = [
    { icon: Building2, title: "Hotels", description: "Free listings", color: "bg-blue-100 text-blue-700" },
    { icon: Gavel, title: "Auctions", description: "Free listings", color: "bg-green-100 text-green-700" },
    { icon: Users, title: "Clubs", description: "Free listings", color: "bg-purple-100 text-purple-700" },
    { icon: Calendar, title: "Events", description: "Free listings", color: "bg-orange-100 text-orange-700" },
    { icon: Wrench, title: "Services", description: "Free listings", color: "bg-gray-100 text-gray-700" },
    { icon: Car, title: "Cars", description: "First two months", color: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden bg-white mx-4 border border-gray-200 shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="relative p-4 sm:p-5">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>

                <DialogHeader className="text-center mb-4">
                  {/* Professional icon */}
                  <motion.div
                    className="flex justify-center mb-3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="p-2.5 bg-blue-600 rounded-full shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>

                  {/* Main title */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <DialogTitle className="text-lg sm:text-xl font-bold font-headline text-gray-900 mb-1">
                      The following are free
                    </DialogTitle>
                  </motion.div>
                </DialogHeader>

                {/* Professional features grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="grid grid-cols-2 gap-2 mb-4"
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      className="group"
                    >
                      <div className="relative p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-full flex-shrink-0 ${feature.color}`}>
                            <feature.icon className="w-3 h-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-xs truncate">
                              {feature.title}
                            </h3>
                            <p className="text-gray-600 text-xs truncate">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Professional CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  className="text-center"
                >
                  <Button
                    onClick={handleClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-sm hover:shadow-md transition-all duration-200 w-full"
                  >
                    Get Started
                  </Button>
                </motion.div>

                {/* Bottom text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  className="text-center mt-3"
                >
                  <p className="text-xs text-gray-500">
                    No hidden fees • No credit card required
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
} 