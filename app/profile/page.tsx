import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { DevoteeProfileView } from "@/features/devotees";

export const metadata: Metadata = {
  title: "My Profile | The Temple Puja",
  description: "View your personal details, booking history, live puja video recordings, and receipts.",
};

export default function ProfilePage() {
  return (
    <>
      <BookPageHeader
        crumb="My Profile"
        eyebrow="🙏 Devotee Profile"
        title={
          <>
            My <span className="text-amber-200">Sacred Profile</span>
          </>
        }
        subtitle="View your personal details and every pooja you've booked with templepujasewa."
        facts={[
          { icon: "🪔", label: "Booking history" },
          { icon: "🔒", label: "Private & secure" },
        ]}
      />
      <div className="min-h-[60vh] bg-cream py-10">
        <DevoteeProfileView />
      </div>
    </>
  );
}
