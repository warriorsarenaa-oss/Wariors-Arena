"use client";

import { useBooking } from './BookingContext';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function Step3PlayerInfo() {
  const { state, updateState, setStep } = useBooking();
  const tWizard = useTranslations("wizard");
  const tGames = useTranslations("games");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePlayersChange = (delta: number) => {
    const newCount = state.numPlayers + delta;
    if (newCount >= 1 && newCount <= 6) {
      updateState({ numPlayers: newCount });
    }
  };

  const isPhoneValid = /^01[0125][0-9]{8}$/.test(state.customerPhone);
  const isNameValid = state.customerName.length >= 2;
  const isEmailValid = state.customerEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customerEmail) : true;

  const canProceed = isPhoneValid && isNameValid && isEmailValid;

  const handleContinue = () => {
    if (!canProceed) return;
    setStep(5); // Skip Step 4 (OTP) entirely
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: state.direction > 0 ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: state.direction > 0 ? -50 : 50 }}
      className="w-full flex flex-col"
    >
      <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-center mb-8 text-[#FFFFFF]">
        {tWizard("playerDetailsHeading")}
      </h2>

      <div className="glass-card p-6 md:p-8 rounded-[2rem] mb-8 border border-[#1E1E2E]">
        <div className="flex flex-col items-center mb-10 pb-10 border-b border-[#1E1E2E]">
          <span className="text-[#A0A0B8] font-bold uppercase tracking-wider mb-4">Players (Max 6)</span>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => handlePlayersChange(-1)} 
              disabled={state.numPlayers <= 1}
              className="w-12 h-12 rounded-full border-2 border-[#1E1E2E] flex items-center justify-center font-bold text-xl text-white hover:bg-[#1E1E2E] disabled:opacity-30 transition-all"
            >-</button>
            <span className="text-4xl font-black">{state.numPlayers}</span>
            <button 
              onClick={() => handlePlayersChange(1)} 
              disabled={state.numPlayers >= 6}
              className="w-12 h-12 rounded-full border-2 border-[#1E1E2E] flex items-center justify-center font-bold text-xl text-white hover:bg-[#1E1E2E] disabled:opacity-30 transition-all"
            >+</button>
          </div>
          {state.pricePerPlayer && (
            <div className="mt-4 text-[#00FFCC] font-bold text-xl uppercase tracking-wider">
              Total: {state.pricePerPlayer * state.numPlayers} EGP
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[#A0A0B8] text-sm font-bold uppercase tracking-wider mb-2">{tWizard("fullName")} *</label>
            <input 
              type="text" 
              value={state.customerName}
              onChange={(e) => updateState({ customerName: e.target.value })}
              className={`w-full bg-[#13131A] border ${!isNameValid && state.customerName.length > 0 ? 'border-[#E63B2E]' : 'border-[#1E1E2E]'} rounded-xl p-4 text-white focus:outline-none focus:border-[#00FFCC] transition-colors`}
              placeholder="e.g. Ahmed Hassan"
            />
          </div>

          <div>
            <label className="block text-[#A0A0B8] text-sm font-bold uppercase tracking-wider mb-2">{tWizard("phoneNumber")} *</label>
            <div className="relative">
              <input 
                type="tel" 
                value={state.customerPhone}
                onChange={(e) => updateState({ customerPhone: e.target.value.replace(/\D/g, '').substring(0, 11) })}
                className={`w-full bg-[#13131A] border ${!isPhoneValid && state.customerPhone.length >= 11 ? 'border-[#E63B2E]' : 'border-[#1E1E2E]'} rounded-xl p-4 text-white focus:outline-none focus:border-[#00FFCC] transition-colors`}
                placeholder="01XXXXXXXXX"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isPhoneValid && <Check size={20} className="text-[#00FFCC]" />}
                {!isPhoneValid && state.customerPhone.length >= 11 && <AlertCircle size={20} className="text-[#E63B2E]" />}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#A0A0B8] text-sm font-bold uppercase tracking-wider mb-2">{tWizard("email")} (Optional)</label>
            <input 
              type="email" 
              value={state.customerEmail}
              onChange={(e) => updateState({ customerEmail: e.target.value })}
              className={`w-full bg-[#13131A] border ${!isEmailValid ? 'border-[#E63B2E]' : 'border-[#1E1E2E]'} rounded-xl p-4 text-white focus:outline-none focus:border-[#00FFCC] transition-colors`}
              placeholder="ahmed@example.com"
            />
          </div>
        </div>

        {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-[#E63B2E]/10 border border-[#E63B2E]/50 text-[#E63B2E] text-sm font-bold">
                {errorMsg}
            </div>
        )}

        <div className="mt-8">
          <button 
            onClick={handleContinue}
            disabled={!canProceed || loading}
            className="w-full btn-primary uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {tWizard("next")}
          </button>
        </div>
      </div>

      <div className="w-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 text-center mb-4">
        <p className="text-[#F59E0B] font-semibold text-xs md:text-sm">{tGames("parkWarning")}</p>
      </div>

      <p className="text-center text-[#E63B2E] font-bold text-xs md:text-sm uppercase tracking-wider mb-8">
        {tWizard("cancelPolicy")}
      </p>

      <div className="flex justify-start mt-auto">
        <button
          onClick={() => setStep(2)}
          className="text-[#A0A0B8] font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          {tWizard("back")}
        </button>
      </div>
    </motion.div>
  );
}
