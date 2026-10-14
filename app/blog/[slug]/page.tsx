import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Phone,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { BLOG_POSTS, getBlogPost, getAllBlogSlugs } from "@/lib/blog-data";
import { SITE_CONFIG } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) {
    return { title: "Article Not Found | templepujasewa" };
  }

  const articleUrl = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | templepujasewa Blog`,
    description: post.excerpt,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: articleUrl,
      siteName: "templepujasewa",
      locale: "en_IN",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.imageUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const articleUrl = `${SITE_URL}/blog/${post.slug}`;

  // JSON-LD structured data for Google Search
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
      jobTitle: post.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.brandName,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.jpeg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    keywords: post.tags.join(", "),
  };

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      {/* Schema.org BlogPosting metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <Header />
      <main className="bg-cream min-h-screen pt-28 pb-20">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="container-px max-w-4xl mx-auto py-3">
          <ol className="flex items-center gap-1.5 text-xs text-ink-soft">
            <li>
              <Link href="/" className="hover:text-saffron-700 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3 w-3 text-slate-400" />
            </li>
            <li>
              <Link href="/blog" className="hover:text-saffron-700 transition-colors">
                Spiritual Blog
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3 w-3 text-slate-400" />
            </li>
            <li className="font-semibold text-ink truncate max-w-[200px] sm:max-w-none">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Article Container */}
        <article className="container-px max-w-4xl mx-auto mt-2">
          {/* Article Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-saffron-100 px-3 py-1 text-xs font-bold text-saffron-800 border border-saffron-200">
                {post.category}
              </span>
              <span className="text-xs text-ink-soft flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-saffron-600" />
                {post.readTime}
              </span>
              <span className="text-xs text-ink-soft">•</span>
              <span className="text-xs text-ink-soft flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-saffron-600" />
                {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink leading-tight">
              {post.title}
            </h1>

            {/* Author Byline */}
            <div className="flex items-center justify-between border-y border-saffron-100/80 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-white font-bold text-sm shadow-soft">
                  🕉️
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{post.author}</p>
                  <p className="text-[11px] text-ink-soft">{post.authorRole}</p>
                </div>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:text-saffron-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Guides</span>
              </Link>
            </div>
          </header>

          {/* Featured Image */}
          <div className="relative mt-6 h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-3xl border border-saffron-100 shadow-card">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>

          {/* Article Body Content */}
          <div className="mt-8 rounded-3xl border border-saffron-100/90 bg-white p-6 sm:p-10 shadow-soft space-y-8">
            {/* Introduction */}
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 font-medium border-l-4 border-saffron-500 pl-4 py-1 italic">
              {post.content.introduction}
            </p>

            {/* Sections */}
            {post.content.sections.map((section, idx) => (
              <section key={idx} className="space-y-3.5">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
                  {section.heading}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                  {section.body}
                </p>

                {section.keyPoints && section.keyPoints.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 mt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                      Key Vedic Insights:
                    </span>
                    <ul className="space-y-1.5">
                      {section.keyPoints.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2 text-xs text-slate-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}

            {/* Conclusion */}
            <section className="space-y-3 pt-4 border-t border-saffron-100">
              <h3 className="font-display text-lg font-bold text-ink">
                Summary & Divine Grace
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                {post.content.conclusion}
              </p>
            </section>

            {/* Internal Link to Corresponding Group Puja */}
            <div className="rounded-2xl border border-saffron-300 bg-gradient-to-r from-saffron-50 via-white to-amber-50 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-700 block">
                  Recommended Online Seva
                </span>
                <h4 className="font-display text-base font-bold text-ink">
                  Participate in {post.relatedPoojaTitle}
                </h4>
                <p className="text-xs text-ink-soft">
                  Book your individual or family gotra sankalp for this sacred puja online.
                </p>
              </div>

              <Link
                href={`/book/${post.relatedPoojaSlug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white px-5 py-2.5 text-xs font-bold shadow-soft transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Book This Pooja</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Tags */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-ink mr-1">Tags:</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-saffron-50 px-2.5 py-1 text-[11px] font-semibold text-saffron-800 border border-saffron-200/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="mt-12 space-y-4">
              <h3 className="font-display text-xl font-bold text-ink">
                Related Spiritual Articles
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="group rounded-2xl border border-saffron-100 bg-white p-4 shadow-soft transition-all hover:border-saffron-300 hover:shadow-card flex items-start gap-3.5"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={rel.imageUrl}
                        alt={rel.title}
                        fill
                        sizes="64px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-saffron-700 uppercase tracking-wide">
                        {rel.category}
                      </span>
                      <h4 className="text-xs font-bold text-ink group-hover:text-saffron-700 line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                      <p className="text-[10px] text-ink-soft">{rel.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back button */}
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl border border-saffron-300 bg-white px-6 py-2.5 text-xs font-bold text-saffron-800 hover:bg-saffron-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Spiritual Guides</span>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
