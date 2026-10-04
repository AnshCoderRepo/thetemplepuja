import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { DevoteeSignupForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Devotee Signup | The Temple Puja",
  description: "Create your devotee profile on The Temple Puja spiritual platform.",
};

export default function SignupPage() {
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
      <div className="flex min-h-[50vh] items-center justify-center bg-cream px-4 py-12">
        <DevoteeSignupForm />
      </div>
    </>
  );
}
