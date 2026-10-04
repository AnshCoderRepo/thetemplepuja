import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { DevoteeLoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Login | The Temple Puja",
  description: "Sign in to your devotee account to view bookings, history, and sacred seva details.",
};

export default function LoginPage() {
  return (
    <>
      <BookPageHeader
        eyebrow="🙏 Devotee Login"
        title={
          <>
            Access Your <span className="text-amber-200">Sacred Account</span>
          </>
        }
        subtitle="Sign in with your registered mobile number to view your pooja bookings, live video links, and download receipts."
        facts={[
          { icon: "🪔", label: "Your Bookings" },
          { icon: "🙏", label: "Upcoming Poojas" },
          { icon: "🔒", label: "Secure Access" },
        ]}
      />
      <div className="flex min-h-[50vh] items-center justify-center bg-cream px-4 py-12">
        <DevoteeLoginForm />
      </div>
    </>
  );
}
