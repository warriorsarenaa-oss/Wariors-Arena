/*
SQL SCHEMA FOR BLOG POSTS:

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  excerpt_en text,
  excerpt_ar text,
  content_en text,
  content_ar text,
  image_url text,
  published_at timestamptz DEFAULT now(),
  slug text UNIQUE NOT NULL
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_posts_select_all" ON blog_posts FOR SELECT USING (true);
*/

import { getTranslations } from "next-intl/server";
import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";

export const revalidate = 60;

export const metadata = {
  title: 'Blog | Warriors Arena',
  description: 'News, updates, and stories from Warriors Arena — Heliopolis, Cairo.',
};


export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  let posts: any[] | null = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')) {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });
      posts = data;
    }
  } catch (error) {
    console.error("Supabase not configured yet");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest text-center mb-16">
          {t("title")}
        </h1>

        {(!posts || posts.length === 0) ? (
          <div className="text-center py-20 glass-card">
            <h2 className="text-2xl font-semibold text-[#A0A0B8] uppercase tracking-wider">{t("empty")}</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="glass-card overflow-hidden flex flex-col group hover:border-[#00FFCC] transition-colors">
                <div className="relative w-full h-48 bg-[#13131A] overflow-hidden">
                  {post.image_url ? (
                    <Image 
                      src={post.image_url} 
                      alt={locale === 'en' ? post.title_en : post.title_ar}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1E1E2E]">
                      <span className="text-[#A0A0B8] uppercase tracking-wider text-xs">Warriors Arena</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#A0A0B8] mb-3">
                    <Calendar size={14} />
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-wide mb-3 group-hover:text-[#00FFCC] transition-colors line-clamp-2">
                    {locale === 'en' ? post.title_en : post.title_ar}
                  </h2>
                  <p className="text-[#A0A0B8] text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    {locale === 'en' ? post.excerpt_en : post.excerpt_ar}
                  </p>
                  <Link href={`/${locale}/blog/${post.slug}`} className="text-[#00FFCC] font-semibold text-sm uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all">
                    {t("readMore")} <span className="rtl:rotate-180">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
