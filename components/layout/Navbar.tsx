"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { designTokens } from "../../lib/designTokens";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const switchLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    let newPath = pathname;
    if (pathname.startsWith(`/${locale}`)) {
      newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    } else {
      newPath = `/${newLocale}${pathname}`;
    }
    router.replace(newPath);
  };

  const navLinks = [
    { href: `/${locale}/faq`, label: t("faq") },
    { href: `/${locale}/blog`, label: t("blog") },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-darkSurface/90 backdrop-blur-md shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left - Logo */}
          <Link href={`/${locale}`} className="flex items-baseline gap-1 relative z-50">
            <span className="text-xl md:text-2xl font-bold tracking-widest textPrimary uppercase">
              Warriors Arena
            </span>
            <span style={{ color: designTokens.colors.accent }} className="text-3xl leading-none">
              .
            </span>
          </Link>

          {/* Right - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-textSecondary hover:text-textPrimary transition-colors font-medium text-sm uppercase tracking-wide"
              >
                {link.label}
              </Link>
            ))}
            <Link href={`/${locale}/book`} className="btn-primary uppercase text-sm">
              {t("book")}
            </Link>
            
            {/* Language Toggle */}
            <button
              onClick={switchLocale}
              className="px-3 py-1 rounded-full border border-darkBorder flex items-center gap-2 hover:bg-darkBorder/50 transition-colors"
            >
              <span className={`text-xs font-bold ${locale === 'en' ? 'text-accent' : 'text-textSecondary'}`}>EN</span>
              <span className="text-darkBorder">|</span>
              <span className={`text-xs font-bold ${locale === 'ar' ? 'text-accent' : 'text-textSecondary'}`}>عر</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4 relative z-50">
            <button
              onClick={switchLocale}
              className="px-2 py-1 rounded-full border border-darkBorder flex items-center gap-2"
            >
              <span className={`text-xs font-bold ${locale === 'en' ? 'text-accent' : 'text-textSecondary'}`}>EN</span>
              <span className={`text-xs font-bold ${locale === 'ar' ? 'text-accent' : 'text-textSecondary'}`}>عر</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-textPrimary focus:outline-none"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="md:hidden fixed inset-0 top-0 left-0 w-full bg-dark bg-opacity-95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.2 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl text-textPrimary hover:text-accent font-bold uppercase tracking-widest"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href={`/${locale}/book`}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-xl uppercase tracking-widest px-8 py-4"
              >
                {t("book")}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
