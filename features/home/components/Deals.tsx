"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/common";
import { deals, type Coupon } from "@/lib/data";
import { useCatalog } from "@/features/catalog";

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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { coupons, loaded } = useCatalog();

  const [activeDeals, setActiveDeals] = useState(deals);

  useEffect(() => {
    if (loaded && Object.keys(coupons).length > 0) {
      setActiveDeals(dealsFromCoupons(coupons));
    }
  }, [coupons, loaded]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section id="deals" className="section-pad relative overflow-hidden bg-cream">
      <div className="container-px relative">
        <SectionHeading
          eyebrow="Special Offers"
          title="Exclusive Pooja Deals & Packages"
          subtitle="Save on your auspicious occasions with our limited-time blessings"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {activeDeals.map((deal, i) => (
            <Reveal key={deal.code} delay={i * 70}>
              <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-saffron-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{deal.icon}</span>
                    <span className="rounded-full bg-saffron-100 px-3 py-1 text-xs font-bold text-saffron-700">
                      {deal.badge}
                    </span>
                  </div>
                  <h3 className="font-display mt-4 text-lg font-bold text-ink">
                    {deal.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    {deal.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-saffron-100">
                  <div className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 border border-dashed border-saffron-200">
                    <span className="font-mono text-xs font-bold text-ink tracking-wider">
                      {deal.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(deal.code)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:text-saffron-800"
                    >
                      {copiedCode === deal.code ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
