"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Car, X } from "lucide-react";

interface FreeListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeListingsModal({ isOpen, onClose }: FreeListingsModalProps) {
  const handleClose = () => {
    onClose();
  };

  // Generate random stars for the background
  const stars = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 2,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[92vw] p-0 overflow-hidden bg-gradient-to-br from-white to-[#E0D8C1] mx-auto sm:mx-4 border border-yellow-400/20 shadow-xl left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
        <AnimatePresence mode="wait">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative"
          >
            {/* Starry background */}
            <div className="absolute inset-0 overflow-hidden">
              {stars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute text-yellow-400"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    fontSize: `${star.size}px`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0.8, 1],
                    scale: [0, 1.2, 1, 1.1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: star.delay,
                    ease: "easeInOut"
                  }}
                >
                  <Star className="w-full h-full fill-current" />
                </motion.div>
              ))}
            </div>

            <div className="relative p-5 sm:p-6">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all duration-200 hover:scale-110"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>

              {/* Main content */}
              <div className="text-center">
                {/* Animated star icon */}
                <motion.div
                  className="flex justify-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-lg">
                      <Star className="w-6 h-6 text-white fill-current" />
                    </div>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full blur-lg opacity-30"></div>
                  </div>
                </motion.div>

                {/* Main title with dramatic animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="mb-3"
                >
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 drop-shadow-sm">
                    ALL LISTINGS ARE
                  </h1>
                  <motion.h1 
                    className="text-3xl sm:text-4xl font-black text-amber-500"
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    FREE!
                  </motion.h1>
                </motion.div>

                {/* Cars subtitle with car icon */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                  className="mb-5"
                >
                  <div className="flex items-center justify-center space-x-2 bg-yellow-400/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30">
                    <Car className="w-4 h-4 text-yellow-600" />
                    <span className="text-base font-bold text-gray-900">
                      Cars: Free for 2 months
                    </span>
                  </div>
                </motion.div>

                {/* CTA Button with dramatic effect */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                >
                  <Button
                    onClick={handleClose}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-full text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform border-2 border-yellow-500/20"
                  >
                    START LISTING NOW! 🚀
                  </Button>
                </motion.div>

                {/* Bottom sparkle effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mt-3"
                >
                  <div className="flex justify-center space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="text-yellow-500"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      >
                        ✨
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
} 