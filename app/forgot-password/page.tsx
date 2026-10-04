import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { ForgotPasswordSteps } from "@/features/auth";

export const metadata: Metadata = {
  title: "Reset Password | The Temple Puja",
  description: "Reset your devotee account password via WhatsApp OTP.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <BookPageHeader
        eyebrow="🔐 Reset Password"
        title={
          <>
            Forgot Your <span className="text-amber-200">Password</span>?
          </>
        }
        subtitle="No worries! Enter your registered mobile number and we'll send you a one-time password to reset your account."
        facts={[
          { icon: "📱", label: "OTP via WhatsApp" },
          { icon: "⏱️", label: "10 min expiry" },
          { icon: "🔒", label: "Secure Reset" },
        ]}
      />
      <div className="flex min-h-[50vh] items-center justify-center bg-cream px-4 py-12">
        <ForgotPasswordSteps />
      </div>
    </>
  );
}
