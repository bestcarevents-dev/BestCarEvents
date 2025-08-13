"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Car, Calendar, Building2, Gavel, Wrench, X } from "lucide-react";

interface FreeListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeListingsModal({ isOpen, onClose }: FreeListingsModalProps) {
  const handleClose = () => {
    onClose();
  };

  const features = [
    { icon: Car, title: "Cars", description: "Enjoy 2 months free listing period!", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, title: "Events", description: "List your events for free!", color: "from-purple-500 to-pink-500" },
    { icon: Building2, title: "Hotels", description: "Free hotel listings available!", color: "from-green-500 to-emerald-500" },
    { icon: Gavel, title: "Auctions", description: "Free auction listings!", color: "from-orange-500 to-red-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-white mx-4 border-0 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-h-[90vh] overflow-y-auto"
          >
            <div className="relative">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 rounded-lg animate-pulse"></div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute top-8 right-8 w-3 h-3 bg-orange-400 rounded-full"
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 left-8 w-2 h-2 bg-red-400 rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>

              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>

                <DialogHeader className="text-center mb-6 sm:mb-8">
                  {/* Main icon with animation */}
                  <motion.div
                    className="flex justify-center mb-4 sm:mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <div className="relative">
                      <div className="p-4 sm:p-5 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-2xl">
                        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    </div>
                  </motion.div>

                  {/* Main title with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-gray-900 mb-2 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                      ALL LISTINGS ARE FREE
                    </DialogTitle>
                  </motion.div>

                  {/* Subtitle with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <p className="text-lg sm:text-xl text-gray-700 font-semibold">
                      Cars: Enjoy 2 months free listing period!
                    </p>
                  </motion.div>
                </DialogHeader>

                {/* Features grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="group"
                    >
                      <div className="relative p-4 sm:p-5 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-xl group-hover:opacity-10 transition-opacity duration-300`}></div>
                        
                        <div className="relative">
                          <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-full w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 flex items-center justify-center shadow-lg`}>
                            <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2 text-center text-sm sm:text-base">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 text-center text-xs sm:text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="text-center"
                >
                  <Button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-full text-lg sm:text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 transform"
                  >
                    Start Listing Now!
                  </Button>
                </motion.div>

                {/* Bottom text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  className="text-center mt-4 sm:mt-6"
                >
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    No hidden fees • No credit card required • Start today!
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