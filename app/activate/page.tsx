import type { Metadata } from "next";
import { Suspense } from "react";
import { BookPageHeader } from "@/components/layout";
import { DevoteeActivateForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Activate Account | templepujasewa",
  description: "Verify your mobile number via SMS OTP to activate your devotee account and set your password.",
};


export default function ActivatePage() {
  return (
    <>
      <BookPageHeader
        eyebrow="🔐 Account Activation"
        title={
          <>
            Activate Your <span className="text-amber-200">Devotee Account</span>
          </>
        }
        subtitle="Verify your mobile number with a one-time passcode (OTP) sent to your phone to securely set your password and access your seva orders."
        facts={[
          { icon: "📱", label: "Mobile OTP Verification" },
          { icon: "🔑", label: "Set Your Secure Password" },
          { icon: "🪔", label: "Instant Access to Bookings" },
        ]}
      />
      <div className="flex min-h-[50vh] items-center justify-center bg-cream px-4 py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-saffron-200 bg-white p-8 text-center text-ink-soft shadow-lg">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
              <p className="mt-3 text-sm font-medium">Loading activation...</p>
            </div>
          }
        >
          <DevoteeActivateForm />
        </Suspense>
      </div>
    </>
  );
}
