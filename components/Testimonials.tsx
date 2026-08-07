import SectionHeading from "./SectionHeading";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  // Pad to an odd count so the fanned deck is symmetric (a lone repeat of the
  // first review sits at the far edge, mostly clipped and rotated).
  const deck = testimonials.length % 2 === 0
    ? [...testimonials, testimonials[0]]
    : testimonials;
  const items = deck.map((t, i) => ({
    id: `${t.name}-${i}`,
    quote: t.text,
    by: `${t.name}, ${t.location}`,
    avatar: t.avatar,
    avatarColor: t.color,
  }));

  return (
    <section
      id="testimonials"
      className="section-pad relative overflow-hidden bg-maroon-900"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffdca1 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-saffron-500/15 blur-3xl" />

      <div className="container-px relative">
        <SectionHeading
          dark
          eyebrow="Testimonials"
          title="Devotee Reviews"
          subtitle="Hear from thousands of satisfied devotees across India — drag through the reviews"
        />

        <StaggerTestimonials items={items} />
      </div>
    </section>
  );
}
