import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  CalendarCheck2,
  MapPin,
  Home,
  MessageCircle,
  Phone,
  Mail,
  Flame,
  Award,
  Video,
  Package,
} from "lucide-react";
import { Footer } from "@/components/layout";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Temple Puja | TemplePujaSewa — Sacred Vedic Rituals & Temple Seva",
  description:
    "Learn about TemplePujaSewa (आपकी आस्था, हमारी सेवा). Bridging devotees worldwide with authentic Vedic rituals, consecrated temples, and certified Gurukul Acharyas.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About Temple Puja | TemplePujaSewa",
    description:
      "Bridging devotees worldwide with authentic Vedic rituals, consecrated temples, and certified Gurukul Acharyas.",
    url: `${SITE_URL}/about`,
    siteName: "TemplePujaSewa",
    type: "website",
    images: [{ url: "/logo.png", alt: "TemplePujaSewa - आपकी आस्था, हमारी सेवा" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Temple Puja | TemplePujaSewa",
    description:
      "Bridging devotees worldwide with authentic Vedic rituals, consecrated temples, and certified Gurukul Acharyas.",
    images: ["/logo.png"],
  },
};

export default function AboutPage() {
  const whatsappUrl = getWhatsAppUrl(
    "Namaste TemplePujaSewa, I would like to know more about your Temple and Home Puja sevas."
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-16">
        {/* ─── Breadcrumb Navigation ─── */}
        <div className="container-px mx-auto max-w-5xl mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-soft">
            <Link href="/" className="hover:text-saffron-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-ink">About Temple Puja</span>
          </nav>
        </div>

        {/* ─── Hero Banner Section ─── */}
        <div className="container-px mx-auto max-w-5xl mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-white via-amber-50/50 to-saffron-50/40 p-6 sm:p-10 md:p-12 shadow-card">
            {/* Background decorative aura */}
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-saffron-300/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-saffron-300 bg-saffron-100/80 px-3.5 py-1.5 text-xs font-bold text-saffron-900 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-saffron-700" />
                  <span>आपकी आस्था, हमारी सेवा</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink leading-tight">
                  About <span className="text-saffron-600">TemplePujaSewa</span>
                </h1>

                <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
                  Connecting devotees across the globe with India&apos;s sacred temples, Vedic traditions, and verified Gurukul Acharyas. Whether performed at a sacred tirtha or in the warmth of your home, every ritual is executed with absolute scriptural purity and earnest devotion.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    href="/#poojas"
                    className="inline-flex items-center gap-2 rounded-2xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold px-6 py-3 text-xs sm:text-sm shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Explore Sacred Pujas</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-5 py-3 text-xs sm:text-sm transition-all shadow-2xs"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>Speak with Acharya</span>
                  </a>
                </div>
              </div>

              {/* Official Brand Logo Card */}
              <div className="shrink-0 flex flex-col items-center justify-center">
                <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-card border border-saffron-200/90 transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/logo.png"
                    alt="TemplePujaSewa"
                    width={280}
                    height={88}
                    className="h-16 sm:h-20 w-auto object-contain"
                    priority
                  />
                </div>
                <span className="mt-3 text-xs font-semibold text-amber-900/80">
                  Certified Vedic Ritual Platform
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Our Two Sacred Seva Formats ─── */}
        <div className="container-px mx-auto max-w-5xl mb-14">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
              Two Sacred Ways to Experience Divine Blessings
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft">
              Designed with devotion for your modern spiritual journey, maintaining traditional Vedic Vidhi-Vidhan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Temple Puja Card */}
            <div className="rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-card flex flex-col justify-between transition-all hover:border-saffron-400">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                    <MapPin className="h-6 w-6 text-saffron-700" />
                  </div>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                    Online Kshetra Puja
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                  Temple Puja (मंदिर पूजा)
                </h3>

                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Performed directly at consecrated mandirs and ancient tirtha kshetras (Kashi, Ujjain, Ayodhya, Haridwar, etc.) by presiding temple priests on your behalf.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-ink-muted">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Personalized Sankalp:</strong> Recited with your family Name, Gotra, and Nakshatra.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Video className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Live Video &amp; Recording:</strong> High-definition video recording of the ritual and divine darshan.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Package className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Doorstep Prasad:</strong> Sacred Vibhuti, Kumkum, and energised temple prasad dispatched to your residence.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <Link
                  href="/#poojas"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-3 text-xs sm:text-sm transition-colors"
                >
                  <span>Browse Temple Pujas</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Home Puja Card */}
            <div className="rounded-3xl border border-orange-200 bg-white p-6 sm:p-8 shadow-card flex flex-col justify-between transition-all hover:border-orange-400">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-800">
                    <Home className="h-6 w-6 text-orange-700" />
                  </div>
                  <span className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-orange-800">
                    In-Person Pandit Ji
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                  Home Puja (घर पर पूजा)
                </h3>

                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Our certified, Gurukul-trained Pandit Ji visits your doorstep in person to sanctify your home with authentic Vedic chants and complete Vidhi-Vidhan.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-ink-muted">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>In-Person Presence:</strong> Experienced Acharya arrives at your residence with sacred samagri.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Flame className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Complete Vedic Havan:</strong> Satyanarayan Katha, Griha Pravesh, Rudrabhishek, Navgraha Shanti, and festive rituals.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CalendarCheck2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Exact Muhurat Alignment:</strong> Auspicious timing calculated strictly by Vedic Panchang.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <Link
                  href="/#poojas"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 font-bold py-3 text-xs sm:text-sm transition-colors"
                >
                  <span>Book Home Puja Pandit Ji</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Our Sacred Principles & Standards ─── */}
        <div className="container-px mx-auto max-w-5xl mb-14">
          <div className="rounded-3xl border border-saffron-200/90 bg-white p-6 sm:p-10 shadow-card">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Our Vedic Standards &amp; Principles
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft">
                Integrity, devotion, and transparency are the foundational pillars of every puja we coordinate.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-amber-50/40 p-5">
                <Award className="h-6 w-6 text-saffron-600" />
                <h3 className="font-display text-sm font-bold text-ink">Certified Gurukul Acharyas</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Every pandit in our network is thoroughly vetted for their Vedic knowledge, Sanskrit pronunciation, and lineage.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-amber-50/40 p-5">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <h3 className="font-display text-sm font-bold text-ink">100% Pure Samagri</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Only authentic, sacred havan herbs, cow ghee, gangajal, and natural puja ingredients are utilized for rituals.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-amber-50/40 p-5">
                <HeartHandshake className="h-6 w-6 text-amber-700" />
                <h3 className="font-display text-sm font-bold text-ink">Direct Devotee Care</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Round-the-clock spiritual support via WhatsApp, phone, and direct line to our executive leadership team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Direct Leadership & Contact CTA ─── */}
        <div className="container-px mx-auto max-w-5xl">
          <div className="rounded-3xl border border-saffron-300 bg-gradient-to-br from-saffron-600 to-amber-700 p-8 sm:p-10 text-white shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <h3 className="font-display text-xl sm:text-2xl font-bold">
                Have a Question or Special Prayer Request?
              </h3>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                Connect directly with our leadership desk or talk with our spiritual coordinators to find the auspicious muhurat for your family.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href="/#feedback"
                className="w-full sm:w-auto text-center rounded-2xl bg-white text-saffron-800 hover:bg-amber-50 font-bold px-6 py-3 text-xs sm:text-sm shadow-soft transition-all hover:scale-105"
              >
                Share Your Feedback
              </Link>
              <a
                href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
                className="w-full sm:w-auto text-center rounded-2xl border border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 text-xs sm:text-sm transition-all"
              >
                Call: {SITE_CONFIG.contact.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

