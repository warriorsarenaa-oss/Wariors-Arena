"use client";

import React, { createContext, useContext, useState } from 'react';
import { SlotInfo, BookingData } from '../../lib/slotEngine';

interface BookingState {
  step: number;
  direction: number;
  gameType: 'laser_tag' | 'gel_blasters' | null;
  durationMinutes: 30 | 60 | null;
  gameTypeId: string | null;
  durationId: string | null;
  pricePerPlayer: number | null;
  selectedDate: Date | null;
  selectedSlot: SlotInfo | null;
  numPlayers: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  phoneVerified: boolean;
  verificationToken: string | null;
  confirmedBooking: BookingData | null;
}

interface BookingContextType {
  state: BookingState;
  setStep: (step: number) => void;
  updateState: (updates: Partial<BookingState>) => void;
  resetAll: () => void;
}

const initialState: BookingState = {
  step: 1,
  direction: 1,
  gameType: null,
  durationMinutes: null,
  gameTypeId: null,
  durationId: null,
  pricePerPlayer: null,
  selectedDate: null,
  selectedSlot: null,
  numPlayers: 1,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  phoneVerified: true, // Temporarily disabled OTP verification
  verificationToken: "BYPASSED",
  confirmedBooking: null
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  const setStep = (newStep: number) => {
    setState(prev => ({
      ...prev,
      direction: newStep > prev.step ? 1 : -1,
      step: newStep
    }));
  };

  const updateState = (updates: Partial<BookingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetAll = () => {
    setState(initialState);
  };

  return (
    <BookingContext.Provider value={{ state, setStep, updateState, resetAll }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
