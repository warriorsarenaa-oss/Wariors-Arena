"use client";

import { useBooking } from './BookingContext';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Step1GameSelect() {
  const { state, updateState, setStep } = useBooking();
  const tWizard = useTranslations("wizard");
  const tGames = useTranslations("games");
  const locale = useLocale();
  
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = async (gameId: 'laser_tag' | 'gel_blasters', duration: 30 | 60) => {
    const interactionKey = `${gameId}-${duration}`;
    setLoadingId(interactionKey);

    try {
      const res = await fetch(`/api/game-durations?gameType=${gameId}&durationMinutes=${duration}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      console.log('[Step1] Selected durationId:', data.id, 'gameType:', gameId);

      updateState({
        gameType: gameId,
        durationMinutes: duration as 30 | 60,
        pricePerPlayer: data.price_per_player,
        durationId: data.id
      });

      // Simple visual feedback before auto-advancing
      setTimeout(() => {
        setStep(2);
      }, 400);

    } catch (err) {
      console.error('[Step1] Failed to fetch duration UUID:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const games_map = [
    {
      id: "laser_tag" as const,
      nameEn: tGames("laserTagDescEn"),
      nameAr: tGames("laserTagDescAr"),
      durations: [30, 60]
    },
    {
      id: "gel_blasters" as const,
      nameEn: tGames("gelBlastersDescEn"),
      nameAr: tGames("gelBlastersDescAr"),
      durations: [30]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full flex flex-col"
    >
      <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-center mb-10 text-[#FFFFFF]">
        {tWizard("gameSelectHeading")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {games_map.map((game) => (
          <div key={game.id} className="glass-card p-6 flex flex-col group border-2 border-transparent hover:border-[#00FFCC]/30 transition-all rounded-[2rem]">
            <h3 className="text-3xl font-black uppercase tracking-wider mb-1 text-white">
              {locale === 'en' ? game.nameEn : game.nameAr}
            </h3>
            <p className="text-[#A0A0B8] font-bold text-xl mb-6">
              {locale === 'ar' ? game.nameEn : game.nameAr}
            </p>
            
            <div className="flex-1 flex flex-col gap-3">
              {game.durations.map((mins) => {
                const isSelected = state.gameType === game.id && state.durationMinutes === mins;
                const interactionKey = `${game.id}-${mins}`;
                const isLoading = loadingId === interactionKey;

                return (
                  <button
                    key={mins}
                    disabled={!!loadingId}
                    onClick={() => handleSelect(game.id, mins as any)}
                    className={`w-full p-4 rounded-xl font-bold text-lg transition-all flex justify-between items-center border ${
                      isSelected 
                        ? 'bg-[#00FFCC] text-[#0A0A0F] border-[#00FFCC] shadow-[0_0_15px_rgba(0,255,204,0.3)] scale-[1.02]' 
                        : 'bg-[#1E1E2E]/50 text-white border-[#1E1E2E] hover:border-[#00FFCC]/50 hover:bg-[#1E1E2E]'
                    } ${isLoading ? 'opacity-70' : ''}`}
                  >
                    <span>{mins} {tGames("min30").includes("30") ? "min" : "دقيقة"}</span>
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span className="opacity-60 text-sm">Select →</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 text-center mb-8">
        <p className="text-[#F59E0B] font-semibold text-sm">
          {tGames("parkWarning")}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setStep(2)}
          disabled={!state.durationId || !!loadingId}
          className="btn-primary uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tWizard("next")}
        </button>
      </div>
    </motion.div>
  );
}
