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
}

export default function BookPageHeader({ eyebrow, title, subtitle, facts = [] }: Props) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-saffron-600 via-saffron-700 to-maroon-800 pb-16 pt-28 md:pb-20 md:pt-36">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 right-[-60px] h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <span className="absolute left-[6%] top-20 animate-float text-4xl opacity-30">🪔</span>
        <span className="absolute right-[8%] top-28 animate-float text-5xl opacity-20 [animation-delay:1.2s]">🕉️</span>
        <span className="absolute bottom-8 right-[18%] animate-float text-3xl opacity-20 [animation-delay:2s]">🔔</span>
        <span className="absolute bottom-12 left-[14%] animate-float text-3xl opacity-20 [animation-delay:2.6s]">📿</span>
      </div>

      <div className="container-px relative">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium text-amber-100/70"
        >
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/book" className="transition-colors hover:text-white">
            Book Pooja
          </Link>
          {facts.length > 0 && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="max-w-[200px] truncate text-amber-50">Booking</span>
            </>
          )}
        </nav>

        <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
          {eyebrow}
        </span>

        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-amber-50/80 sm:text-base">
          {subtitle}
        </p>

        {facts.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2.5">
            {facts.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
