"use client";

import { useBooking } from './BookingContext';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Step4OTP() {
  const { state, updateState, setStep } = useBooking();
  const tWizard = useTranslations("wizard");
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    if (val.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[i] = val.replace(/\D/g, '');
    setOtp(newOtp);

    if (val && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (!pasted) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
        inputsRef.current[5]?.focus();
    }
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.customerPhone, otp: code })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setIsErrorShake(true);
        setTimeout(() => setIsErrorShake(false), 500);
        throw new Error(data.error);
      }
      
      setIsSuccess(true);
      updateState({ phoneVerified: true, verificationToken: data.token });
      
      setTimeout(() => {
        setStep(5);
      }, 500);

    } catch (e: any) {
      setErrorMsg(e.message || tWizard("genericError"));
    } finally {
      if (!isSuccess) setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.customerPhone })
      });
      setCountdown(60);
      setErrorMsg("");
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch {
      setErrorMsg(tWizard("genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: state.direction > 0 ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: state.direction > 0 ? -50 : 50 }}
      className="w-full flex flex-col items-center"
    >
      <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-center mb-6 text-[#FFFFFF]">
        {tWizard("verifyPhoneHeading")}
      </h2>
      
      <p className="text-[#A0A0B8] mb-12 text-center">
        {tWizard("sentCodeTo", { phone: state.customerPhone })}
      </p>

      <motion.div 
        animate={isErrorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-2 md:gap-4 mb-8 rtl:space-x-reverse"
      >
        {otp.map((v, i) => (
          <input
            key={i}
            ref={el => { inputsRef.current[i] = el; }}
            disabled={isSuccess}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={`w-10 h-14 md:w-14 md:h-16 text-center text-2xl font-black rounded-lg border focus:outline-none transition-all ${
              isSuccess 
                ? 'bg-[#00FFCC]/20 border-[#00FFCC] text-[#00FFCC]' 
                : 'bg-[#13131A] text-white border-[#1E1E2E] focus:border-[#00FFCC]'
            }`}
          />
        ))}
      </motion.div>

      {errorMsg && (
         <div className="mb-6 p-4 rounded-xl bg-[#E63B2E]/10 border border-[#E63B2E] text-[#E63B2E] text-sm font-bold">
            {errorMsg}
         </div>
      )}

      <button 
        onClick={verifyOTP}
        disabled={otp.join('').length !== 6 || loading || isSuccess}
        className="w-full max-w-sm btn-primary uppercase tracking-wider mb-8 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : tWizard("verifyCodeBtn")}
      </button>

      <button
        onClick={resendOTP}
        disabled={countdown > 0 || loading || isSuccess}
        className={`font-bold text-sm tracking-wider uppercase ${
           countdown > 0 ? 'text-[#A0A0B8] cursor-not-allowed' : 'text-[#00FFCC] hover:underline'
        }`}
      >
        {countdown > 0 ? tWizard("resendIn", { time: String(countdown).padStart(2, '0') }) : tWizard("resendCodeBtn")}
      </button>

      <div className="w-full flex justify-start mt-16">
        <button
          onClick={() => setStep(3)}
          disabled={isSuccess || loading}
          className="text-[#A0A0B8] font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          {tWizard("changePhone")}
        </button>
      </div>
    </motion.div>
  );
}
