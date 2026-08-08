"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { deals, type Coupon } from "@/lib/data";
import { useCatalog } from "./useCatalog";

// Marketing styling for the well-known coupons; admin-added coupons fall back
// to the generic defaults below.
const dealStyle: Record<string, { icon: string; gradient: string; title: string }> = {
  TEMPLE30: { icon: "🎉", gradient: "from-saffron-500 to-saffron-700", title: "First Booking" },
  MUHURAT: { icon: "🪔", gradient: "from-sky-500 to-indigo-700", title: "Shubh Muhurat" },
  BUNDLE20: { icon: "🛍️", gradient: "from-emerald-500 to-teal-700", title: "Bundle Deal" },
  TEMPLEKUNDLI: { icon: "🔮", gradient: "from-indigo-500 to-purple-700", title: "Kundli with Pooja" },
};

const fallbackStyle = { icon: "🎟️", gradient: "from-saffron-500 to-saffron-700" };

function dealsFromCoupons(map: Record<string, Coupon>) {
  return Object.entries(map).map(([code, c]) => {
    const style = dealStyle[code] ?? fallbackStyle;
    return {
      badge: c.kind === "percent" && c.value ? `${c.value}% OFF` : "FREE",
      title: style.title ?? c.label,
      description: c.description,
      code,
      icon: style.icon,
      gradient: style.gradient,
    };
  });
}

export default function Deals() {
  const [copied, setCopied] = useState<string | null>(null);
  const { coupons } = useCatalog();
  // Static cards on first render (SSR-safe); swap in backend-managed coupons.
  const [couponList, setCouponList] = useState(deals);
  useEffect(() => {
    setCouponList(dealsFromCoupons(coupons));
  }, [coupons]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard unavailable — still show feedback
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <section id="deals" className="section-pad relative bg-cream">
      <div className="container-px">
        <SectionHeading
          eyebrow="Special Deals"
          title="Exclusive Offers"
          subtitle="Exclusive deals for devoted spiritual seekers"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {couponList.map((deal, i) => (
            <Reveal key={deal.code} delay={i * 80}>
              <div className="group card-hover relative flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft">
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${deal.gradient}`}
                />
                {/* Badge */}
                <div
                  className={`inline-flex w-fit items-center rounded-full bg-gradient-to-r ${deal.gradient} px-3.5 py-1.5 text-xs font-bold text-white shadow`}
                >
                  {deal.badge}
                </div>
                <div className="mt-4 text-4xl transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
                  {deal.icon}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">
                  {deal.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
                  {deal.description}
                </p>

                {/* Coupon code */}
                <button
                  onClick={() => copyCode(deal.code)}
                  className="mt-5 flex items-center justify-between rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50 px-4 py-2.5 transition-colors hover:border-saffron-400 hover:bg-saffron-100"
                  aria-label={`Copy coupon code ${deal.code}`}
                >
                  <span className="font-mono text-sm font-bold tracking-widest text-saffron-700">
                    {deal.code}
                  </span>
                  {copied === deal.code ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <Check className="h-4 w-4" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </span>
                  )}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
