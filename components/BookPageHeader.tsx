import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Fact {
  icon: string;
  label: string;
}

interface Props {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  facts?: Fact[];
  crumb?: string;
}

export default function BookPageHeader({ eyebrow, title, subtitle, facts = [], crumb }: Props) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-saffron-700 via-saffron-800 to-maroon-900 pb-2 pt-10 md:pb-2.5 md:pt-12 text-white">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-10 left-1/2 h-32 w-[500px] -translate-x-1/2 rounded-full bg-white/20 blur-2xl" />
      </div>

      <div className="container-px relative max-w-7xl mx-auto">
        {/* Compact Nav + Breadcrumb Row */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-amber-100/70 border-b border-white/10 pb-1.5 mb-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-medium">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-2.5 w-2.5" />
            {crumb ? (
              <span className="text-amber-50">{crumb}</span>
            ) : (
              <Link href="/book" className="transition-colors hover:text-white">
                Book Pooja
              </Link>
            )}
            {!crumb && facts.length > 0 && (
              <>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="max-w-[200px] truncate text-amber-50">Booking</span>
              </>
            )}
          </nav>

          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100 backdrop-blur">
            {eyebrow}
          </span>
        </div>

        {/* Title + Facts in one tight, cohesive row */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h1 className="font-display text-base font-bold leading-snug text-white sm:text-lg md:text-xl">
            {title}
          </h1>

          {facts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {facts.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-50 backdrop-blur"
                >
                  <span className="text-xs">{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
