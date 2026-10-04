"use client";

import { BadgeCheck, MapPin, Phone, XCircle } from "lucide-react";
import type { UserProfile } from "@/lib/storage";

interface DevoteeProfileCardProps {
  profile: UserProfile;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DevoteeProfileCard({ profile }: DevoteeProfileCardProps) {
  const activeCount = profile.bookings.filter((b) => b.status !== "cancelled").length;
  const cancelledCount = profile.bookings.length - activeCount;

  return (
    <div className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
      <div className="relative h-24 bg-gradient-to-r from-saffron-500 via-saffron-600 to-maroon-700">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
      </div>
      <div className="px-8 pb-8">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-saffron-400 to-maroon-600 font-display text-2xl font-bold text-white shadow-card">
              {initials(profile.name)}
            </span>
            <div className="pb-1">
              <h2 className="font-display text-2xl font-bold text-ink">
                {profile.name}
              </h2>
              <p className="text-xs font-medium text-ink-soft">
                Devotee since {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
          <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
              <BadgeCheck className="h-4 w-4" />
              {activeCount} Active Booking{activeCount !== 1 ? "s" : ""}
            </span>
            {cancelledCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600">
                <XCircle className="h-4 w-4" />
                {cancelledCount} Cancelled
              </span>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { icon: "🧬", label: "Gotra", value: profile.gotra || "—" },
            {
              icon: <MapPin className="h-4 w-4 text-saffron-600" />,
              label: "City",
              value: profile.city || "—",
            },
            {
              icon: <Phone className="h-4 w-4 text-saffron-600" />,
              label: "Mobile",
              value: (
                <a
                  href={`tel:+91${profile.phone}`}
                  className="font-semibold text-ink transition-colors hover:text-saffron-600"
                >
                  +91 {profile.phone}
                </a>
              ),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-2xl border border-saffron-100 bg-cream/60 px-4 py-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-soft">
                {row.icon}
              </span>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  {row.label}
                </dt>
                <dd className="truncate text-sm text-ink">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
