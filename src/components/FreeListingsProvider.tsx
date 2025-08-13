"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import FreeListingsModal from "./FreeListingsModal";

interface FreeListingsContextType {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const FreeListingsContext = createContext<FreeListingsContextType | undefined>(undefined);

export function useFreeListings() {
  const context = useContext(FreeListingsContext);
  if (context === undefined) {
    throw new Error("useFreeListings must be used within a FreeListingsProvider");
  }
  return context;
}

interface FreeListingsProviderProps {
  children: React.ReactNode;
}

export default function FreeListingsProvider({ children }: FreeListingsProviderProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasShownOnCurrentPage, setHasShownOnCurrentPage] = useState(false);
  const pathname = usePathname();

  // Pages where the modal should appear (only existing pages)
  const targetPages = ["/events", "/hotels", "/clubs", "/auctions", "/others", "/cars"];

  useEffect(() => {
    // Check if current page is in target pages
    const isTargetPage = targetPages.some(page => pathname.startsWith(page));
    
    if (isTargetPage && !hasShownOnCurrentPage) {
      // Add a shorter delay to ensure the page is loaded but not too intrusive
      const timer = setTimeout(() => {
        setShowModal(true);
        setHasShownOnCurrentPage(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, hasShownOnCurrentPage]);

  // Reset the flag when navigating to a different page
  useEffect(() => {
    const isTargetPage = targetPages.some(page => pathname.startsWith(page));
    if (!isTargetPage) {
      setHasShownOnCurrentPage(false);
    }
  }, [pathname]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <FreeListingsContext.Provider value={{ showModal, setShowModal }}>
      {children}
      <FreeListingsModal isOpen={showModal} onClose={handleCloseModal} />
    </FreeListingsContext.Provider>
  );
} 