"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Car, Calendar, Building2, Gavel, X } from "lucide-react";

interface FreeListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeListingsModal({ isOpen, onClose }: FreeListingsModalProps) {
  const handleClose = () => {
    onClose();
  };

  const features = [
    { icon: Car, title: "Cars", description: "2 months free!", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, title: "Events", description: "Free listings!", color: "from-purple-500 to-pink-500" },
    { icon: Building2, title: "Hotels", description: "Free listings!", color: "from-green-500 to-emerald-500" },
    { icon: Gavel, title: "Auctions", description: "Free listings!", color: "from-orange-500 to-red-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden bg-white mx-4 border-0 shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Subtle background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-lg"></div>
              
              <div className="relative p-4 sm:p-5">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all duration-200 hover:scale-110"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>

                <DialogHeader className="text-center mb-4">
                  {/* Compact icon */}
                  <motion.div
                    className="flex justify-center mb-3"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="relative">
                      <div className="p-2.5 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Main title */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <DialogTitle className="text-lg sm:text-xl font-bold font-headline text-gray-900 mb-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                      ALL LISTINGS ARE FREE
                    </DialogTitle>
                  </motion.div>

                  {/* Subtitle */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <p className="text-sm text-gray-700 font-medium">
                      Cars: Enjoy 2 months free listing period!
                    </p>
                  </motion.div>
                </DialogHeader>

                {/* Compact features grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="grid grid-cols-2 gap-2 mb-4"
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                      className="group"
                    >
                      <div className="relative p-2.5 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-3 rounded-lg group-hover:opacity-5 transition-opacity duration-200`}></div>
                        
                        <div className="relative flex items-center space-x-2">
                          <div className={`p-1.5 bg-gradient-to-br ${feature.color} rounded-full flex-shrink-0`}>
                            <feature.icon className="w-3 h-3 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-xs truncate">
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

                {/* Compact CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  className="text-center"
                >
                  <Button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-semibold py-2 px-6 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform w-full"
                  >
                    Start Listing Now!
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