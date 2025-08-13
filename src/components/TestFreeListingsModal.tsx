"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useFreeListings } from "./FreeListingsProvider";

export default function TestFreeListingsModal() {
  const { setShowModal } = useFreeListings();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-full shadow-lg"
      >
        Test Free Listings Modal
      </Button>
    </div>
  );
} 