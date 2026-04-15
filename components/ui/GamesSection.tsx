"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Users } from "lucide-react";

export default function GamesSection() {
  const tHome = useTranslations("home");
  const tGames = useTranslations("games");
  const locale = useLocale();

  const games = [
    {
      id: "laser_tag",
      nameEn: tGames("laserTagDescEn"),
      nameAr: tGames("laserTagDescAr"),
      durations: [
        { time: tGames("min30"), price: tGames("price150") },
        { time: tGames("hour1"), price: tGames("price300") }
      ]
    },
    {
      id: "gel_blasters",
      nameEn: tGames("gelBlastersDescEn"),
      nameAr: tGames("gelBlastersDescAr"),
      durations: [
        { time: tGames("min30"), price: tGames("price100") }
      ]
    }
  ];

  return (
    <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-5xl font-bold uppercase tracking-widest text-center mb-16"
      >
        {tHome("games")}
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="glass-card p-8 flex flex-col group transition-colors hover:border-[#00FFCC]"
          >
            <h3 className="text-3xl font-black uppercase tracking-wider mb-1 group-hover:text-[#00FFCC] transition-colors">
              {locale === 'en' ? game.nameEn : game.nameAr}
            </h3>
            <p className="text-[#A0A0B8] font-bold text-xl mb-6">
              {locale === 'ar' ? game.nameEn : game.nameAr}
            </p>
            
            <div className="flex-1 flex flex-col gap-4 mb-8">
              {game.durations.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-[#1E1E2E] pb-3">
                  <span className="font-semibold text-lg">{d.time}</span>
                  <span className="text-[#00FFCC] font-bold">{d.price}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-[#A0A0B8] mt-2">
                <Users size={18} />
                <span>{tGames("maxPlayers")}</span>
              </div>
            </div>

            <Link href={`/${locale}/book?game=${game.id}`} className="btn-secondary w-full uppercase tracking-wider text-sm mt-auto">
              {tGames("bookGame")}
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         className="w-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-6 text-center"
      >
        <p className="text-[#F59E0B] font-semibold md:text-lg">
          {tGames("parkWarning")}
        </p>
      </motion.div>
    </section>
  );
}
