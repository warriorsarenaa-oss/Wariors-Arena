"use client";

import { useBooking } from './BookingContext';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

export default function StepIndicator() {
  const { state, setStep } = useBooking();
  const t = useTranslations("wizard");

  const steps = [
    { id: 1, label: t("step1") },
    { id: 2, label: t("step2") },
    { id: 3, label: t("step3") },
    { id: 5, label: t("step5") } // Removed Step 4 (OTP) from indicator
  ];

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1E1E2E] -translate-y-1/2 z-0 rounded-full" />
        
        <div 
          className="absolute top-1/2 left-0 h-1 bg-[#00FFCC] -translate-y-1/2 z-0 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${state.step === 5 ? 100 : ((state.step - 1) / 3) * 100}%` }}
        />

        {steps.map((stepItem, index) => {
          const isCompleted = state.step > stepItem.id;
          const isActive = state.step === stepItem.id;

          return (
            <div key={stepItem.id} className="relative z-10 flex flex-col items-center">
              <button
                onClick={() => {
                  if (isCompleted && stepItem.id < 5) {
                    setStep(stepItem.id);
                  }
                }}
                disabled={!isCompleted || stepItem.id === 5}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isActive 
                    ? "bg-[#00FFCC] text-[#0A0A0F] shadow-[0_0_15px_rgba(0,255,204,0.5)]" 
                    : isCompleted 
                      ? "bg-[#1E1E2E] text-[#00FFCC] border-2 border-[#00FFCC] cursor-pointer hover:bg-[#00FFCC]/20" 
                      : "bg-[#1E1E2E] text-[#A0A0B8] cursor-not-allowed"
                }`}
              >
                {isCompleted ? <Check size={18} /> : index + 1}
              </button>
              <span className={`absolute -bottom-6 text-[10px] md:text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                isActive ? "text-[#00FFCC]" : "text-[#A0A0B8]"
              }`}>
                {stepItem.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
