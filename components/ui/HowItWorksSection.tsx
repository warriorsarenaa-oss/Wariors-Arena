"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Target, Calendar, UserCheck, Ticket } from "lucide-react";

export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const tHome = useTranslations("home");

  const steps = [
    { icon: <Target size={28} />, title: t("step1Title"), desc: t("step1Desc") },
    { icon: <Calendar size={28} />, title: t("step2Title"), desc: t("step2Desc") },
    { icon: <UserCheck size={28} />, title: t("step3Title"), desc: t("step3Desc") },
    { icon: <Ticket size={28} />, title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <section className="py-24 bg-[#13131A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-center mb-16"
        >
          {tHome("howItWorks")}
        </motion.h2>

        <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-6 pb-8 md:pb-0 hide-scrollbar snap-x snap-mandatory">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-8 min-w-[280px] md:min-w-0 snap-center flex flex-col items-start relative border-t-2 border-t-[#00FFCC]/20"
            >
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-[#00FFCC] text-[#0A0A0F] flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(0,255,204,0.5)]">
                {i + 1}
              </div>
              <div className="mb-6 text-[#00FFCC]">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">{step.title}</h3>
              <p className="text-[#A0A0B8] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
