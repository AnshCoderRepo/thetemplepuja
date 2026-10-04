import { Header, Footer } from "@/components/layout";
import { JsonLd } from "@/components/common";
import { Hero, WhyChooseUs, Testimonials, FAQ } from "@/features/home";
import { PoojaCatalog, UpcomingEvents } from "@/features/catalog";
import { faqs } from "@/lib/data";
import { faqPageLd, organizationLd, websiteLd } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <JsonLd
        data={[organizationLd(), websiteLd(), faqPageLd(faqs)]}
      />
      <Header />
      <main>
        <Hero />
        
        {/* All Sacred Poojas Catalog on Landing Page */}
        <section id="poojas" className="pt-12 pb-6 bg-cream">
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
          <PoojaCatalog />
        </section>

        <UpcomingEvents />
        <WhyChooseUs />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
