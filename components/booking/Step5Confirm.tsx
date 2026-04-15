"use client";

import { useBooking } from './BookingContext';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Download, AlertTriangle } from 'lucide-react';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export default function Step5Confirm() {
  const { state, updateState } = useBooking();
  const tWizard = useTranslations("wizard");
  const tGames = useTranslations("games");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSlotTaken, setIsSlotTaken] = useState(false);

  useEffect(() => {
    if (state.confirmedBooking) {
      setLoading(false);
      return;
    }

    const commitBooking = async () => {
      try {
        const payload = {
            durationId: state.durationId,
            date: state.selectedDate ? toLocalDateString(state.selectedDate) : null,
            slotTime: state.selectedSlot?.time24h,
            numPlayers: state.numPlayers,
            customerName: state.customerName,
            customerPhone: state.customerPhone,
            customerEmail: state.customerEmail,
            token: state.verificationToken 
        };

        console.log('[Step5] Booking payload:', payload);

        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (res.status === 409) {
           setIsSlotTaken(true);
           throw new Error(data.error);
        }
        if (!res.ok) throw new Error(data.error);
        
        updateState({ confirmedBooking: data });
        triggerConfetti();

      } catch (e: any) {
        setErrorMsg(e.message || tWizard("genericError"));
      } finally {
        setLoading(false);
      }
    };

    commitBooking();
  }, []);

  const triggerConfetti = () => {
      const colors = ['#00FFCC', '#FFFFFF', '#1E1E2E'];
      for (let i = 0; i < 50; i++) {
         const dot = document.createElement('div');
         dot.className = 'fixed rounded-full z-50 pointer-events-none';
         dot.style.width = Math.random() * 8 + 4 + 'px';
         dot.style.height = dot.style.width;
         dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
         dot.style.left = '50%';
         dot.style.top = '50%';
         document.body.appendChild(dot);
         
         const angle = Math.random() * Math.PI * 2;
         const velocity = 15 + Math.random() * 25;
         let vx = Math.cos(angle) * velocity;
         let vy = Math.sin(angle) * velocity - 10;

         let tick = 0;
         const animate = () => {
             tick++;
             vy += 0.5;
             dot.style.transform = `translate(${vx * tick}px, ${vy * tick}px) scale(${1 - tick/100})`;
             if (tick < 100) {
                 requestAnimationFrame(animate);
             } else {
                 dot.remove();
             }
         };
         requestAnimationFrame(animate);
      }
  };

  const handleDownloadPDF = async () => {
     if (!state.confirmedBooking) return;
     
     const res = await fetch('/api/pdf', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            booking_code: state.confirmedBooking.bookingCode,
            booking_date: state.confirmedBooking.date,
            slot_time: state.confirmedBooking.slotTime,
            num_players: state.confirmedBooking.numPlayers,
            total_price: state.confirmedBooking.totalPrice,
            customer_name: state.confirmedBooking.customerName,
            customer_phone: state.confirmedBooking.customerPhone,
            customer_email: state.confirmedBooking.customerEmail
         })
     });

     if (!res.ok) return;

     const blob = await res.blob();
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${state.confirmedBooking.bookingCode}.pdf`;
     a.click();
     window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 min-h-[400px]">
         <Loader2 className="animate-spin text-[#00FFCC] mb-6" size={48} />
         <p className="text-[#A0A0B8] uppercase tracking-widest font-bold">{tWizard("lockingSession")}</p>
      </div>
    );
  }

  if (errorMsg) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
             <AlertTriangle size={64} className="text-[#E63B2E] mb-6" />
             <h2 className="text-2xl font-bold uppercase tracking-wider text-white text-center mb-4">Verification Failed</h2>
             <p className="text-[#A0A0B8] text-center mb-8">{errorMsg}</p>
             {isSlotTaken ? (
                 <button onClick={() => updateState({ step: 2, selectedSlot: null })} className="btn-primary">
                    {tWizard("chooseAnotherSlot")}
                 </button>
             ) : (
                 <button onClick={() => window.location.reload()} className="btn-secondary">
                    Retry
                 </button>
             )}
        </motion.div>
      );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col items-center"
    >
      <div className="glass-card w-full p-8 rounded-[2rem] border-2 border-[#00FFCC]/50 shadow-[0_0_50px_rgba(0,255,204,0.1)] relative overflow-hidden mb-10">
         <div className="absolute top-0 left-0 w-full h-2 bg-[#00FFCC]" />
         
         <div className="text-center mb-10 mt-4">
             <p className="text-[#A0A0B8] uppercase tracking-wider font-bold mb-2">{tWizard("bookingCode")}</p>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-widest">{state.confirmedBooking?.bookingCode}</h1>
         </div>

         <div className="w-full border-t border-b border-[#1E1E2E] py-6 mb-6">
             <div className="grid grid-cols-2 gap-y-4">
                 <div className="text-[#A0A0B8] uppercase tracking-wider text-sm font-bold">Date:</div>
                 <div className="text-white font-semibold text-right">{state.confirmedBooking?.date}</div>
                 <div className="text-[#A0A0B8] uppercase tracking-wider text-sm font-bold">Time:</div>
                 <div className="text-white font-semibold text-right">{state.selectedSlot?.displayTime}</div>
                 <div className="text-[#A0A0B8] uppercase tracking-wider text-sm font-bold">Players:</div>
                 <div className="text-white font-semibold text-right">{state.numPlayers}</div>
                 <div className="text-[#A0A0B8] uppercase tracking-wider text-sm font-bold">Total:</div>
                 <div className="text-[#00FFCC] font-black text-right">{state.confirmedBooking?.totalPrice} EGP</div>
             </div>
         </div>

         <div className="w-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 text-center mt-6">
           <p className="text-[#F59E0B] font-semibold text-sm">
             {tGames("parkWarning")}
           </p>
         </div>

      </div>

      <div className="flex flex-col w-full gap-4 max-w-sm">
         <button onClick={handleDownloadPDF} className="w-full border-2 border-[#00FFCC] text-[#00FFCC] p-4 rounded-full uppercase tracking-wider font-bold hover:bg-[#00FFCC] hover:text-[#0A0A0F] transition-all flex items-center justify-center gap-2">
            <Download size={20} /> {tWizard("downloadPdf")}
         </button>
         <button onClick={() => window.location.href = window.location.pathname} className="w-full text-[#A0A0B8] uppercase tracking-wider font-bold p-4 hover:text-white transition-all text-sm">
            {tWizard("bookAnother")}
         </button>
      </div>
      
    </motion.div>
  );
}
