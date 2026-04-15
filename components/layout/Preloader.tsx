"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [showLaser, setShowLaser] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Stage 1: Gun enters 0-400ms
    const timer1 = setTimeout(() => {
      setShowLaser(true); // 400ms
    }, 400);

    // Stage 2: Laser extends
    const timer2 = setTimeout(() => {
      setShowParticles(true); // 700ms
    }, 700);

    // Stage 3: Text fade in
    const timer3 = setTimeout(() => {
      setShowText(true); // 1000ms
    }, 1000);

    // Stage 4: Fade out preloader
    const timer4 = setTimeout(() => {
      setIsVisible(false); // 1400ms
    }, 1400);

    // Stage 5: Unmount and signal completion
    const timer5 = setTimeout(() => {
      onComplete(); // 2200ms duration total wait for fadeOut
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0F]"
          style={{ willChange: "opacity, transform" }}
        >
          <div className="relative flex flex-col items-center">
            {/* Sci-Fi Gun SVG Container */}
            <div className="relative w-64 h-32 flex items-center justify-center">
              <motion.svg
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                width="160"
                height="80"
                viewBox="0 0 160 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="z-10"
                style={{ willChange: "transform, opacity" }}
              >
                {/* Barrel */}
                <path d="M140 25 H50 V35 H140 Z" fill="#1E1E2E" />
                {/* Under-barrel attachment */}
                <path d="M120 35 H60 V45 H120 L110 35 Z" fill="#13131A" />
                {/* Main Body */}
                <path d="M20 20 H70 L80 40 H10 L20 20 Z" fill="#2E2E3E" />
                <path d="M15 25 H65 L70 35 H10 L15 25 Z" fill="#1E1E2E" />
                {/* Grip */}
                <path d="M25 40 L15 75 C12 85 25 85 35 75 L50 40 Z" fill="#13131A" />
                {/* Trigger Guard */}
                <path d="M50 40 C50 50 65 50 65 40 Z" stroke="#13131A" strokeWidth="3" fill="none" />
                {/* Trigger */}
                <path d="M55 40 L52 45" stroke="#FFFFFF" strokeWidth="2" />
                {/* Scope */}
                <path d="M30 10 H80 L85 15 H25 L30 10 Z" fill="#00FFCC" opacity="0.3" />
                <path d="M35 5 H75 L70 10 H40 Z" fill="#1E1E2E" />
                {/* Muzzle flash base */}
                <circle cx="140" cy="30" r="6" fill="#13131A" />
              </motion.svg>

              {/* Laser Beam */}
              <AnimatePresence>
                {showLaser && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute z-0 h-[2px] bg-[#00FFCC] rounded-full top-[50%] left-[87%] origin-left"
                    style={{
                      width: "150px",
                      marginTop: "-2px",
                      boxShadow: "0 0 15px 4px rgba(0,255,204,0.6)",
                      willChange: "transform",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Particles Burst at end of beam */}
              <AnimatePresence>
                {showParticles && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 1.5, 2], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute top-[50%] left-[calc(87%+150px)] w-4 h-4 rounded-full bg-[#00FFCC]"
                    style={{
                      marginTop: "-6px",
                      marginLeft: "-8px",
                      boxShadow: "0 0 20px 8px rgba(0,255,204,1)",
                      willChange: "transform, opacity",
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Typography */}
            <div className="h-16 flex flex-col items-center justify-center mt-6">
              <AnimatePresence>
                {showText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <h1 className="text-3xl tracking-widest font-bold text-white uppercase">
                      Warriors Arena
                    </h1>
                    <p className="neon-text mt-2 text-sm tracking-widest uppercase">
                      Laser Tag & Gel Blasters
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
