"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { designTokens } from "../../lib/designTokens";

export default function Footer() {
  const tSite = useTranslations("site");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <footer className="w-full bg-[#05050A] border-t border-[#1E1E2E] pt-16 pb-8 px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        <div className="flex flex-col items-center md:items-start">
          <Link href={`/${locale}`} className="flex items-baseline gap-1 mb-2">
            <span className="text-xl md:text-2xl font-bold tracking-widest text-[#FFFFFF] uppercase">
              {tSite("name")}
            </span>
            <span style={{ color: designTokens.colors.accent }} className="text-3xl leading-none">.</span>
          </Link>
          <p className="text-[#A0A0B8] tracking-wider uppercase text-sm">{tSite("tagline")}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 uppercase tracking-widest text-sm font-semibold">
          <Link href={`/${locale}`} className="text-[#A0A0B8] hover:text-[#00FFCC] transition-colors">{tNav("home")}</Link>
          <Link href={`/${locale}/book`} className="text-[#A0A0B8] hover:text-[#00FFCC] transition-colors">{tNav("book")}</Link>
          <Link href={`/${locale}/faq`} className="text-[#A0A0B8] hover:text-[#00FFCC] transition-colors">{tNav("faq")}</Link>
          <Link href={`/${locale}/blog`} className="text-[#A0A0B8] hover:text-[#00FFCC] transition-colors">{tNav("blog")}</Link>
        </div>

        <div className="flex flex-col items-center md:items-end gap-6">
          <button
            onClick={switchLocale}
            className="px-3 py-1 rounded-full border border-[#1E1E2E] flex items-center gap-2 hover:bg-[#1E1E2E]/50 transition-colors"
          >
            <span className={`text-xs font-bold ${locale === 'en' ? 'text-[#00FFCC]' : 'text-[#A0A0B8]'}`}>EN</span>
            <span className="text-[#1E1E2E]">|</span>
            <span className={`text-xs font-bold ${locale === 'ar' ? 'text-[#00FFCC]' : 'text-[#A0A0B8]'}`}>عر</span>
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#1E1E2E]/50 text-center text-[#A0A0B8] text-xs tracking-wider">
        {tSite("rights")}
      </div>
    </footer>
  );
}
