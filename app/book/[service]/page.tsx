import type { Metadata } from "next";
import { getPooja } from "@/lib/data";
import { formatINR } from "@/lib/format";
import BookPageHeader from "@/components/BookPageHeader";
import PoojaCatalog from "@/components/PoojaCatalog";
import BookingFlow from "@/components/BookingFlow";

interface Props {
  params: Promise<{ service: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  const pooja = getPooja(service);
  return {
    title: pooja ? `Book ${pooja.title} Online | The Temple Puja` : "Book Pooja Online | The Temple Puja",
    description: pooja
      ? pooja.description
      : "Book certified pandits for authentic Vedic poojas online with secure payment.",
  };
}

export default async function BookServicePage({ params }: Props) {
  const { service } = await params;
  const pooja = getPooja(service);

  if (!pooja) {
    return (
      <>
        <BookPageHeader
          eyebrow="🪔 Pooja Booking"
          title="Choose Your Sacred Pooja"
          subtitle={`We couldn't find "${service}". Browse our full collection and pick the ritual that speaks to your heart.`}
        />
        <section className="section-pad bg-cream">
          <PoojaCatalog
            notice={`"${service}" isn't a valid pooja — here are all our sacred services instead.`}
          />
        </section>
      </>
    );
  }

  return (
    <>
      <BookPageHeader
        eyebrow={`${pooja.emoji} Pooja Booking`}
        title={
          <>
            {pooja.title}{" "}
            <span className="align-middle font-devanagari text-2xl font-semibold text-amber-200/90 sm:text-3xl">
              {pooja.hindiTitle}
            </span>
          </>
        }
        subtitle={pooja.description}
        facts={[
          { icon: "⏱️", label: pooja.duration },
          { icon: "🪔", label: `Best: ${pooja.bestMuhurat}` },
          { icon: "💎", label: `From ${formatINR(pooja.price)}` },
          { icon: "⭐", label: "4.9 rated pandits" },
        ]}
      />
      <BookingFlow pooja={pooja} />
    </>
  );
}
