"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";
import BookPageHeader from "@/components/BookPageHeader";
import { isValidIndianPhone } from "@/lib/validation";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", gotra: "", city: "", phone: "" });
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length <= 1) {
      setError("Please enter your full name.");
      return;
    }
    if (form.gotra.trim().length === 0) {
      setError("Please enter your gotra.");
      return;
    }
    if (form.city.trim().length <= 1) {
      setError("Please enter your city.");
      return;
    }
    if (!isValidIndianPhone(form.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setError("");
    router.push("/book/form");
  };

  return (
    <>
      <BookPageHeader
        eyebrow="🕉️ New Devotee"
        title={
          <>
            Create Your <span className="text-amber-200">Profile</span>
          </>
        }
        subtitle="Share your details once — your devotee profile is created automatically after your first payment and carries every pooja you book."
        facts={[
          { icon: "🙏", label: "Certified Pandits" },
          { icon: "💳", label: "Razorpay Secure" },
          { icon: "✨", label: "Profile Auto-created" },
        ]}
      />
      <section className="section-pad bg-cream">
        <div className="container-px">
          <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
            <div className="flex items-center gap-3 bg-gradient-to-r from-saffron-500 to-maroon-600 px-6 py-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl backdrop-blur">
                <UserRound className="h-5 w-5 text-white" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Devotee Signup
                </h2>
                <p className="text-xs text-amber-100/90">
                  One step away from your first pooja
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5 px-6 py-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="su-name"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                  >
                    Full Name *
                  </label>
                  <input
                    id="su-name"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="e.g. Aarav Sharma"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label
                    htmlFor="su-gotra"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                  >
                    Gotra *
                  </label>
                  <input
                    id="su-gotra"
                    value={form.gotra}
                    onChange={set("gotra")}
                    placeholder="e.g. Kashyap"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="su-city"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                  >
                    City *
                  </label>
                  <input
                    id="su-city"
                    value={form.city}
                    onChange={set("city")}
                    placeholder="e.g. New Delhi"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label
                    htmlFor="su-phone"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                  >
                    Mobile Number *
                  </label>
                  <input
                    id="su-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    className={inputCls}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary !w-full !py-3.5">
                Continue to Book My First Pooja
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="rounded-2xl bg-saffron-50 px-4 py-3 text-center text-xs leading-relaxed text-ink-soft">
                Your profile becomes active the moment your first payment is
                confirmed — then you can view it anytime via{" "}
                <span className="font-bold text-saffron-700">Login</span> with
                the same mobile number.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
