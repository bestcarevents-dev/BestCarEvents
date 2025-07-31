"use client";

import React from "react";
import { useNewsletterModal } from "@/hooks/useNewsletterModal";
import GlobalNewsletterModal from "@/components/GlobalNewsletterModal";

interface GlobalNewsletterProviderProps {
  children: React.ReactNode;
}

export default function GlobalNewsletterProvider({ children }: GlobalNewsletterProviderProps) {
  const { showModal, closeModal, handleSubscribe, isLoading } = useNewsletterModal();

  return (
    <>
      {children}
      <GlobalNewsletterModal
        isOpen={showModal}
        onClose={closeModal}
        onSubscribe={handleSubscribe}
      />
    </>
  );
} 