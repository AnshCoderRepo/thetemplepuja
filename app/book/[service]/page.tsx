"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookPageHeader from "@/components/BookPageHeader";
import PoojaCatalog from "@/components/PoojaCatalog";
import BookingFlow from "@/components/BookingFlow";
import { useCatalog } from "@/components/useCatalog";
import { isPoojaActive } from "@/lib/data";
import { formatINR } from "@/lib/format";

function ServiceInner() {
  const params = useParams();
  const search = useSearchParams();
  const service = typeof params.service === "string" ? params.service : "";
  // Resolve from the backend catalog (falls back to the static list).
  const { poojas, loaded } = useCatalog();
  const pooja = loaded ? (poojas.find((p) => p.slug === service) ?? null) : undefined;

  useEffect(() => {
    document.title = pooja
      ? `Book ${pooja.title} Online | The Temple Puja`
      : "Book Pooja Online | The Temple Puja";
  }, [pooja]);

  if (pooja === undefined) {
    return (
      <section className="section-pad bg-cream">
        <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-saffron-100/60" />
      </section>
    );
  }

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

  // An admin-deactivated pooja is hidden from the site — visitors get a gentle
  // "unavailable" note instead of the booking flow.
  if (!isPoojaActive(pooja)) {
    return (
      <>
        <BookPageHeader
          eyebrow="🪔 Pooja Booking"
          title="Pooja Currently Unavailable"
          subtitle={`${pooja.title} is temporarily paused by our team. It will be back soon — meanwhile, browse our other sacred services.`}
        />
        <section className="section-pad bg-cream">
          <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-10 text-center shadow-card">
            <span className="text-5xl">{pooja.emoji}</span>
            <h2 className="mt-4 font-display text-xl font-bold text-ink">
              {pooja.title} is unavailable right now
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              This pooja has been temporarily paused and cannot be booked at the
              moment. Check back soon, or pick another ritual from our catalogue.
            </p>
            <Link href="/book" className="btn-primary mt-6">
              Browse Other Poojas
            </Link>
          </div>
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
      <BookingFlow
        pooja={pooja}
        initialDate={search.get("date")}
        initialTime={search.get("time")}
      />
    </>
  );
}

export default function BookServicePage() {
  return (
    <Suspense
      fallback={
        <section className="section-pad bg-cream">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-saffron-100/60" />
        </section>
      }
    >
      <ServiceInner />
    </Suspense>
  );
}
