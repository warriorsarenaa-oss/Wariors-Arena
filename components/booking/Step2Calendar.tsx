"use client";

import { useBooking } from './BookingContext';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SlotInfo } from '../../lib/slotEngine';

export default function Step2Calendar() {
  const { state, updateState, setStep } = useBooking();
  const tWizard = useTranslations("wizard");
  const locale = useLocale();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setHours(0,0,0,0);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  const fetchSlots = async (date: Date) => {
    setLoading(true);
    setSlots([]);
    updateState({ selectedDate: date, selectedSlot: null });
    
    try {
      const dateStr = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');

      const params = new URLSearchParams({
        date: dateStr,
        gameType: state.gameType!,
        durationMinutes: String(state.durationMinutes!)
      });

      const res = await fetch(`/api/slots?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSlots(data.slots || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isDayDisabled = (date: Date) => {
    return date < today || date > maxDate;
  };

  const generateDays = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];

    const startDay = startOfMonth.getDay(); 
    const offset = locale === 'ar' ? (startDay === 6 ? 0 : startDay + 1) : (startDay === 0 ? 6 : startDay - 1);
    
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  };

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  useEffect(() => {
    if (state.selectedDate && slots.length === 0 && !loading) {
        fetchSlots(state.selectedDate);
        setCurrentMonth(state.selectedDate);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: state.direction > 0 ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: state.direction > 0 ? -50 : 50 }}
      className="w-full flex flex-col"
    >
      <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-center mb-8 text-[#FFFFFF]">
        {tWizard("dateSelectionHeading")}
      </h2>

      <div className="glass-card p-6 md:p-8 rounded-[2rem] mb-8">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handlePrevMonth} disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()} className="p-2 text-[#00FFCC] disabled:text-[#A0A0B8]">
            <ChevronLeft className="rtl:rotate-180" />
          </button>
          <span className="font-bold text-xl uppercase tracking-wider">
            {currentMonth.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} disabled={currentMonth > maxDate} className="p-2 text-[#00FFCC] disabled:text-[#A0A0B8]">
            <ChevronRight className="rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {(locale === 'ar' ? ['س', 'أ', 'إ', 'ث', 'أ', 'خ', 'ج'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((d, i) => (
            <div key={i} className="text-[#A0A0B8] text-xs font-bold uppercase tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {generateDays().map((date, i) => {
            if (!date) return <div key={i} className="aspect-square" />;
            const disabled = isDayDisabled(date);
            const isSelected = state.selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === today.toDateString();

            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => fetchSlots(date)}
                className={`relative aspect-square rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  disabled 
                    ? 'text-[#A0A0B8]/30 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-[#00FFCC] text-[#0A0A0F] shadow-[0_0_10px_rgba(0,255,204,0.5)] scale-110' 
                      : 'text-white hover:bg-[#1E1E2E]'
                }`}
              >
                {date.getDate()}
                {isToday && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#00FFCC]" />}
              </button>
            );
          })}
        </div>
      </div>

      {state.selectedDate && (
        <div className="mb-8">
          <h3 className="font-bold uppercase tracking-wider text-[#A0A0B8] mb-4 text-center">
            {state.selectedDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#00FFCC]" size={32} /></div>
          ) : slots.length === 0 ? (
             <div className="text-center text-[#A0A0B8] italic p-6 rounded-xl border border-[#1E1E2E]">No availability.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {slots.map((slot, i) => {
                 const isSelected = state.selectedSlot?.time24h === slot.time24h;
                 return (
                   <button
                     key={i}
                     disabled={!slot.isAvailable}
                     title={!slot.isAvailable ? tWizard("slotTaken") : ""}
                     onClick={() => updateState({ selectedSlot: slot })}
                     className={`p-3 rounded-lg font-bold text-sm tracking-widest text-center transition-all flex items-center justify-center border ${
                       !slot.isAvailable
                         ? 'bg-transparent border-[#1E1E2E] text-[#A0A0B8]/40 line-through cursor-not-allowed'
                         : isSelected
                           ? 'bg-[#00FFCC] border-[#00FFCC] text-[#0A0A0F] shadow-[0_0_15px_rgba(0,255,204,0.3)]'
                           : 'bg-[#13131A] border-[#00FFCC]/50 text-white hover:bg-[#00FFCC]/20'
                     }`}
                   >
                     {slot.displayTime}
                   </button>
                 );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between mt-auto">
        <button
          onClick={() => setStep(1)}
          className="text-[#A0A0B8] font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          {tWizard("back")}
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!state.selectedDate || !state.selectedSlot}
          className="btn-primary uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tWizard("next")}
        </button>
      </div>
    </motion.div>
  );
}
