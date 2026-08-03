import { navLinks } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pt-16 text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffdca1 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[700px] -translate-x-1/2 rounded-full bg-saffron-500/10 blur-3xl" />

      <div className="container-px relative">
        <div className="grid gap-10 pb-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="#home" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-saffron-400 via-saffron-500 to-maroon-600 text-xl shadow-glow">
                🕉️
              </span>
              <span className="leading-tight">
                <span className="block font-display text-2xl font-bold tracking-wide">
                  The Temple <span className="text-saffron-400">Puja</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/50">
                  Digital Spiritual Platform
                </span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60">
              India&apos;s trusted digital spiritual platform. Certified
              pandits, authentic Vedic rituals, live darshan and blessed
              samagri — bringing the divine to your doorstep.
            </p>
            <p className="mt-4 font-devanagari text-sm text-saffron-300/80">
              🙏 विश्वास, पवित्रता और भक्ति का संगम
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-saffron-400">
              Quick Links
            </h4>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-cream/60 transition-colors hover:text-saffron-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-saffron-400">
              Trust & Safety
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/60">
              <li className="flex items-center gap-2">
                <span>💳</span> Razorpay Secure Payments
              </li>
              <li className="flex items-center gap-2">
                <span>🔒</span> 100% SSL Encrypted
              </li>
              <li className="flex items-center gap-2">
                <span>✅</span> Certified Pandits
              </li>
              <li className="flex items-center gap-2">
                <span>↩️</span> Easy Refund Policy
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} The Temple Puja. All rights reserved.</p>
          <p>
            Made with <span className="text-saffron-400">🙏 devotion</span> in
            India
          </p>
        </div>
      </div>
    </footer>
  );
}
