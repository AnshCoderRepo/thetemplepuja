import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles, UserCheck } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { activeBlogPosts, type BlogPost } from "@/lib/blog-data";
import { getResolvedCatalog } from "@/lib/server-store";
import { SITE_CONFIG } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Vedic Spiritual Blog & Puja Guides | templepujasewa",
  description:
    "Explore authentic Vedic astrology articles, muhurat guides, puja significance, and spiritual insights for family harmony and divine protection.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Vedic Spiritual Blog & Puja Guides | templepujasewa",
    description:
      "Explore authentic Vedic astrology articles, muhurat guides, puja significance, and spiritual insights for family harmony and divine protection.",
    url: `${SITE_URL}/blog`,
    siteName: "templepujasewa",
    locale: "en_IN",
    type: "website",
  },
};

export default async function BlogListingPage() {
  const catalog = await getResolvedCatalog();
  const publishedPosts = activeBlogPosts(catalog.blogs);

  return (
    <>
      <Header />
      <main className="bg-cream min-h-screen pt-28 pb-20">
        {/* Hero Section */}
        <section className="container-px py-8 sm:py-12 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron-300/80 bg-saffron-50 px-4 py-1.5 text-xs font-bold text-saffron-800 shadow-2xs mb-4">
            <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
            <span>Spiritual Knowledge & Vedic Wisdom</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink leading-tight">
            Vedic Ritual Guides & Sacred Insights
          </h1>
          <p className="mt-4 text-sm sm:text-base text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Understand the timeless significance of ancient Vedic mantras, auspicious astrological muhurats, and sacred poojas performed at India&apos;s historic temples.
          </p>
        </section>

        {/* Featured Article & Grid */}
        <section className="container-px max-w-7xl mx-auto">
          {publishedPosts.length === 0 ? (
            <div className="rounded-3xl border border-saffron-200 bg-white p-12 text-center shadow-soft max-w-md mx-auto">
              <span className="text-4xl">🪔</span>
              <h2 className="mt-4 font-display text-xl font-bold text-ink">Articles Updating Soon</h2>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Our Vedic scholars are authoring auspicious spiritual guides. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {publishedPosts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-saffron-300 hover:shadow-card"
              >
                {/* Article Image Container */}
                <Link href={`/blog/${post.slug}`} className="relative h-52 w-full overflow-hidden bg-slate-100 block">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  <span className="absolute bottom-3 left-3.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-amber-200 border border-white/20">
                    {post.category}
                  </span>
                </Link>

                {/* Article Details */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[11px] text-ink-soft mb-2.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-saffron-600" />
                        {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-saffron-600" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="font-display text-lg font-bold text-ink group-hover:text-saffron-700 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className="mt-2.5 text-xs text-ink-soft line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-saffron-100/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-100 text-saffron-800 text-xs font-bold">
                        🕉️
                      </div>
                      <div className="text-[11px]">
                        <p className="font-bold text-ink leading-tight">{post.author}</p>
                        <p className="text-[10px] text-ink-soft">{post.authorRole}</p>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-saffron-600 hover:text-saffron-700 transition-colors"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          )}

          {/* Bottom CTA to Group Pujas */}
          <div className="mt-16 rounded-3xl border border-saffron-200 bg-gradient-to-r from-saffron-500 to-saffron-600 p-8 sm:p-10 text-center text-white shadow-soft">
            <span className="inline-block text-3xl mb-2">🪔</span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Book an Auspicious Group Puja?
            </h3>
            <p className="mt-2 text-sm text-amber-100 max-w-xl mx-auto leading-relaxed">
              Experience the spiritual power of authentic Vedic rituals performed on consecrated tithis with complete gotra sankalp and live video darshan.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-saffron-900 shadow-md transition-all hover:bg-amber-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Browse All Group Pujas</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#message-ceo"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
              >
                <span>A Message to Our CEO</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
