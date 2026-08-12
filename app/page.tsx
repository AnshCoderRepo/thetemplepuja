import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UpcomingEvents from "@/components/UpcomingEvents";
import WhyChooseUs from "@/components/WhyChooseUs";
import ExperienceSection from "@/components/ExperienceSection";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AIGuide from "@/components/AIGuide";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <UpcomingEvents />
        <WhyChooseUs />
        <ExperienceSection />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <AIGuide />
    </>
  );
}
