"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers";
import { LanguageToggle } from "@/components/common";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6">
        <LanguageToggle />
      </div>

      {/* Decorative emoji */}
      <span className="text-6xl">🕉️</span>

      <h1 className="mt-6 font-display text-6xl font-bold tracking-tight text-ink">
        {t("notFound.title")}
      </h1>

      <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
        {t("notFound.message")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          {t("notFound.backHome")}
          <span aria-hidden>→</span>
        </Link>
        <Link href="/book" className="btn-outline">
          {t("notFound.browsePoojas")}
        </Link>
      </div>

      <p className="mt-12 text-xs text-ink-soft/50">
        {t("notFound.hindi")} — The page you are looking for could not be found.
      </p>
    </section>
  );
}
