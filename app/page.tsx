import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UpcomingEvents from "@/components/UpcomingEvents";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AIGuide from "@/components/AIGuide";
import JsonLd from "@/components/JsonLd";
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
        <UpcomingEvents />
        <WhyChooseUs />
<Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <AIGuide />
    </>
  );
}
