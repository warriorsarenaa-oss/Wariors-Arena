"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ChevronDown, Info } from "lucide-react";
import { designTokens } from "../../lib/designTokens";
import { useEffect, useState } from "react";

export default function Hero() {
  const tSite = useTranslations("site");
  const tBooking = useTranslations("booking");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generate deterministic but seemingly random properties forparticles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: 3 + (i % 4),
    x: (i * 17) % 100,
    y: (i * 23) % 100,
    duration: 4 + (i % 5),
    delay: (i % 10) * 0.5,
    opacity: 0.3 + ((i % 4) * 0.1),
  }));

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-dark text-textPrimary">
      {/* 1. Background Gradient Glow */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, rgba(255,59,59,0.15) 0%, transparent 60%)`,
        }}
      />

      {/* 2. Perspective Grid Floor */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[50vh] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${designTokens.colors.accent} 1px, transparent 1px),
            linear-gradient(to top, ${designTokens.colors.accent} 1px, transparent 1px)
          `,
          backgroundSize: "60px 40px",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "bottom",
        }}
      />

      {/* 3. Floating Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: designTokens.colors.accent,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
              boxShadow: `0 0 8px 1px ${designTokens.colors.accent}`,
            }}
            animate={{
              y: ["-20px", "20px"],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* 4. Diagonal Laser Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute h-[1px] w-[150%] bg-accent opacity-10"
          style={{ top: '20%', left: '-10%', transform: 'rotate(15deg)' }}
        />
        <div 
          className="absolute h-[1px] w-[150%] bg-accent opacity-[0.05]"
          style={{ top: '60%', left: '-10%', transform: 'rotate(-25deg)' }}
        />
        <div 
          className="absolute h-[1px] w-[150%] bg-accent opacity-[0.08]"
          style={{ top: '80%', left: '-10%', transform: 'rotate(5deg)' }}
        />
      </div>

      {/* 6. Right Side Visual Target SVG (Desktop Only) */}
      <motion.div 
        className="hidden lg:block absolute right-[5%] top-[50%] -translate-y-1/2 z-0 pointer-events-none opacity-15"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      >
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="190" stroke={designTokens.colors.accent} strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="200" cy="200" r="150" stroke={designTokens.colors.accent} strokeWidth="2" opacity="0.5" />
          <circle cx="200" cy="200" r="110" stroke={designTokens.colors.accent} strokeWidth="1" />
          <circle cx="200" cy="200" r="50" stroke={designTokens.colors.accent} strokeWidth="3" strokeDasharray="10 10" />
          <circle cx="200" cy="200" r="10" fill={designTokens.colors.accent} />
          
          <line x1="200" y1="0" x2="200" y2="100" stroke={designTokens.colors.accent} strokeWidth="2" />
          <line x1="200" y1="300" x2="200" y2="400" stroke={designTokens.colors.accent} strokeWidth="2" />
          <line x1="0" y1="200" x2="100" y2="200" stroke={designTokens.colors.accent} strokeWidth="2" />
          <line x1="300" y1="200" x2="400" y2="200" stroke={designTokens.colors.accent} strokeWidth="2" />
          
          <path d="M 50 50 L 120 120" stroke={designTokens.colors.accent} strokeWidth="1" opacity="0.3" />
          <path d="M 350 350 L 280 280" stroke={designTokens.colors.accent} strokeWidth="1" opacity="0.3" />
          <path d="M 350 50 L 280 120" stroke={designTokens.colors.accent} strokeWidth="1" opacity="0.3" />
          <path d="M 50 350 L 120 280" stroke={designTokens.colors.accent} strokeWidth="1" opacity="0.3" />
        </svg>
      </motion.div>

      {/* 5. Main Content Foreground */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-20">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-start max-w-3xl">
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-textSecondary text-sm md:text-base font-semibold tracking-[0.3em] uppercase mb-4"
          >
            Heliopolis · Cairo
          </motion.p>

          <div className="flex flex-col mb-4">
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-[clamp(50px,8vw,120px)] leading-[0.85] font-black uppercase tracking-tighter"
            >
              Warriors
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="text-[clamp(50px,8vw,120px)] leading-[0.85] font-black uppercase tracking-tighter text-transparent bg-clip-text"
              style={{
                WebkitTextStroke: `2px ${designTokens.colors.textPrimary}`,
                color: "transparent", 
                backgroundColor: designTokens.colors.textPrimary,
                backgroundClip: "text",
              }}
            >
              Arena
            </motion.h1>
          </div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 60 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="h-[3px] rounded-full mb-8"
            style={{ 
              backgroundColor: designTokens.colors.accent, 
              boxShadow: `0 0 10px ${designTokens.colors.accent}` 
            }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-lg md:text-xl max-w-xl mb-8 leading-relaxed font-light"
          >
            {tSite("tagline")} — {tNav("book")} online.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="inline-flex items-center gap-3 glass-card px-4 py-2 mb-10 w-auto"
            style={{ borderColor: designTokens.colors.warning }}
          >
            <Info size={18} style={{ color: designTokens.colors.warning }} />
            <span className="text-sm md:text-xs font-medium" style={{ color: designTokens.colors.warning }}>
              {tBooking("parkFeeNotice")}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href={`/${locale}/book`} className="btn-primary w-full sm:w-auto min-w-[200px]">
              {tNav("book")} <span className="ml-2">→</span>
            </Link>
            <button className="btn-secondary w-full sm:w-auto min-w-[200px]" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
              See How It Works <span className="ml-2">↓</span>
            </button>
          </motion.div>

        </div>
      </div>

      {/* Scroll Indicator */}
      <AnimatePresence>
        {scrollY < 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={32} color={designTokens.colors.textPrimary} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
