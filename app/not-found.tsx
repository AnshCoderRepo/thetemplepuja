import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Decorative emoji */}
      <span className="text-6xl">🕉️</span>

      <h1 className="mt-6 font-display text-6xl font-bold tracking-tight text-ink">
        404
      </h1>

      <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
        This sacred page does not exist. Perhaps the path you seek has not yet
        been written in the stars.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to Home
          <span aria-hidden>→</span>
        </Link>
        <Link href="/book" className="btn-outline">
          Browse Poojas
        </Link>
      </div>

      <p className="mt-12 text-xs text-ink-soft/50">
        पथ नहीं मिला — The page you are looking for could not be found.
      </p>
    </section>
  );
}
