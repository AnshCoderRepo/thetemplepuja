"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookPageHeader } from "@/components/layout";
import { PoojaCatalog, useCatalog } from "@/features/catalog";
import { BookingFlow } from "@/features/bookings";
import { useI18n } from "@/components/providers";
import {
  isPoojaActive,
  getLocalizedPoojaTitle,
  getLocalizedPoojaDescription,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaDuration,
  getLocalizedPoojaBestMuhurat,
} from "@/lib/data";

function ServiceInner({ service }: { service: string }) {
  const search = useSearchParams();
  const { locale, t } = useI18n();
  // Resolve from the backend catalog (falls back to the static list).
  const { poojas, loaded } = useCatalog();
  const pooja = loaded ? (poojas.find((p) => p.slug === service) ?? null) : undefined;

  const locTitle = pooja ? getLocalizedPoojaTitle(pooja, locale) : "";

  useEffect(() => {
    document.title = locTitle
      ? `${locTitle} | templepujasewa`
      : "Book Pooja Online | templepujasewa";
  }, [locTitle]);

  if (pooja === undefined) {
    return (
      <section className="section-pad bg-cream">
        <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-saffron-100/60" />
      </section>
    );
  }

  if (!pooja || !isPoojaActive(pooja)) {
    return (
      <section className="section-pad bg-cream">
        <div className="container-px text-center">
          <span className="text-4xl">🪔</span>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            {t("book.noResults")}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {t("book.noResultsDesc")}
          </p>
          <Link href="/book" className="btn-primary mt-6">
            {t("book.allPoojas")}
          </Link>
          <div className="mt-12">
            <PoojaCatalog />
          </div>
        </div>
      </section>
    );
  }

  const initialDate = search.get("date") ?? undefined;
  const initialTime = search.get("time") ?? undefined;

  const locBadge = getLocalizedPoojaNativeBadge(pooja, locale);
  const locDesc = getLocalizedPoojaDescription(pooja, locale);
  const locDuration = getLocalizedPoojaDuration(pooja, locale);
  const locMuhurat = getLocalizedPoojaBestMuhurat(pooja, locale);

  const durationPrefix =
    locale === "hi"
      ? "अवधि"
      : locale === "te"
      ? "వ్యవధి"
      : locale === "ta"
      ? "கால அளவு"
      : "Duration";

  const muhuratPrefix =
    locale === "hi"
      ? "शुभ मुहूर्त"
      : locale === "te"
      ? "శుభ ముహూర్తం"
      : locale === "ta"
      ? "சுப முகூர்த்தம்"
      : "Best Muhurat";

  return (
    <>
      <BookPageHeader
        eyebrow={locBadge}
        title={locTitle}
        subtitle={`${locDesc.slice(0, 110)}... • ${durationPrefix}: ${locDuration} • ${muhuratPrefix}: ${locMuhurat}`}
      />
      <section className="section-pad bg-cream">
        <div className="container-px">
          <BookingFlow
            pooja={pooja}
            initialDate={initialDate ?? null}
            initialTime={initialTime ?? null}
          />
        </div>
      </section>
    </>
  );
}

export default function ServiceClient({ service }: { service: string }) {
  return (
    <Suspense
      fallback={
        <section className="section-pad bg-cream">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-saffron-100/60" />
        </section>
      }
    >
      <ServiceInner service={service} />
    </Suspense>
  );
}
