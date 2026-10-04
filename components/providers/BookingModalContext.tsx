"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface BookingModalContextType {
  isOpen: boolean;
  selectedPoojaSlug: string | null;
  openBooking: (poojaSlug?: string) => void;
  closeBooking: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined);

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPoojaSlug, setSelectedPoojaSlug] = useState<string | null>(null);

  const openBooking = useCallback((poojaSlug?: string) => {
    setSelectedPoojaSlug(poojaSlug || null);
    setIsOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsOpen(false);
    setSelectedPoojaSlug(null);
  }, []);

  // Sync body overflow when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeBooking();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeBooking]);

  return (
    <BookingModalContext.Provider
      value={{
        isOpen,
        selectedPoojaSlug,
        openBooking,
        closeBooking,
      }}
    >
      {children}
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  const context = useContext(BookingModalContext);
  if (!context) {
    throw new Error("useBookingModal must be used within a BookingModalProvider");
  }
  return context;
}
