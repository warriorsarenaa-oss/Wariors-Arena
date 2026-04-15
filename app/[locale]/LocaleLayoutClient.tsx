"use client";

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useState, useEffect } from 'react';
import { Tajawal } from 'next/font/google';
import Preloader from '../../components/layout/Preloader';
import { motion, AnimatePresence } from 'framer-motion';
import '../globals.css';

const tajawal = Tajawal({
  subsets: ['latin', 'arabic'],
  weight: ['300', '400', '500', '700', '800', '900']
});

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default function LocaleLayoutClient({
  children,
  locale,
  messages
}: {
  children: ReactNode;
  locale: string;
  messages: any;
}) {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    // If you need any side effects when preloader completes.
    if (preloaderDone) {
      window.scrollTo(0, 0);
    }
  }, [preloaderDone]);

  return (
    <html lang={locale} dir={dir}>
      <body className={tajawal.className} suppressHydrationWarning={true}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Preloader */}
          {!preloaderDone && (
            <Preloader onComplete={() => setPreloaderDone(true)} />
          )}

          {/* Main Content Entrance */}
          <AnimatePresence>
            {preloaderDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="min-h-screen"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
