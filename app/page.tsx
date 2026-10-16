import type { Metadata } from "next";
import { Footer } from "@/components/layout";
import { JsonLd, ContinueBookingSection } from "@/components/common";
import { Hero, WhyChooseUs, Testimonials, FAQ } from "@/features/home";
import { PoojaCatalog } from "@/features/catalog";
import MessageCeoSection from "@/components/home/MessageCeoSection";
import { faqs } from "@/lib/data";
import { faqPageLd, organizationLd, websiteLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "TemplePujaSewa | Online Puja Booking & Panditji Services",
  description:
    "Ghar baithe online puja book karein. Hamari website TemplePujaSewa par aapko milenge verified panditji, puja samagri aur har tyohar ki sahi vidhi. Aaj hi book karein!",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "TemplePujaSewa | Online Puja Booking & Panditji Services",
    description:
      "Ghar baithe online puja book karein. Hamari website TemplePujaSewa par aapko milenge verified panditji, puja samagri aur har tyohar ki sahi vidhi. Aaj hi book karein!",
    url: SITE_URL,
    type: "website",
    siteName: "TemplePujaSewa",
    images: [{ url: "/logo.jpeg", alt: "TemplePujaSewa" }],
  },
  twitter: {
    card: "summary",
    title: "TemplePujaSewa | Online Puja Booking & Panditji Services",
    description:
      "Ghar baithe online puja book karein. Hamari website TemplePujaSewa par aapko milenge verified panditji, puja samagri aur har tyohar ki sahi vidhi. Aaj hi book karein!",
    images: ["/logo.jpeg"],
  },
};

export default function Home() {
  return (
    <>
      <JsonLd
        data={[organizationLd(), websiteLd(), faqPageLd(faqs)]}
      />
      <main>
        <Hero />

        {/* Incomplete Booking Persistence & Resume Payment ("Your Seva Awaits") */}
        <ContinueBookingSection />
        
        {/* Sacred Poojas Catalog on Landing Page (Shows top 10 with View All link) */}
        <section id="poojas" className="pt-12 pb-12 bg-cream">
          <div className="container-px mb-8 text-center">
            <span className="eyebrow">
              <span className="text-saffron-500">🪔</span>
              Sacred Pooja Catalog
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
              Choose Your Sacred Pooja
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
              Browse authentic Vedic poojas performed on auspicious dates by certified pandits. Book online in minutes.
            </p>
          </div>
          <PoojaCatalog limit={8} showViewAll={true} viewAllHref="/book" />
        </section>

        <WhyChooseUs />
        <Testimonials />
        <FAQ />

        {/* Message the CEO Section (Client Feedback Phase 10) */}
        <MessageCeoSection />
      </main>
      <Footer />
    </>
  );
}
