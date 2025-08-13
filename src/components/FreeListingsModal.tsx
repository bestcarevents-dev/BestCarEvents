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
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 mx-4 border-0 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            {/* Starry background */}
            <div className="absolute inset-0 overflow-hidden">
              {stars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute text-yellow-300"
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

            <div className="relative p-6 sm:p-8">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Main content */}
              <div className="text-center">
                {/* Animated star icon */}
                <motion.div
                  className="flex justify-center mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: "bounceOut" }}
                >
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-2xl animate-pulse">
                      <Star className="w-8 h-8 text-white fill-current" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  </div>
                </motion.div>

                {/* Main title with dramatic animation */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                  className="mb-4"
                >
                  <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 drop-shadow-lg">
                    ALL LISTINGS ARE
                  </h1>
                  <motion.h1 
                    className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      textShadow: [
                        "0 0 20px rgba(255, 255, 0, 0.5)",
                        "0 0 30px rgba(255, 255, 0, 0.8)",
                        "0 0 20px rgba(255, 255, 0, 0.5)"
                      ]
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
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <Car className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-bold text-white">
                      Cars: Free for 2 months
                    </span>
                  </div>
                </motion.div>

                {/* CTA Button with dramatic effect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
                >
                  <Button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white font-black py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 transform border-2 border-white/20"
                  >
                    START LISTING NOW! 🚀
                  </Button>
                </motion.div>

                {/* Bottom sparkle effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="mt-4"
                >
                  <div className="flex justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="text-yellow-400"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 1, 0.5]
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