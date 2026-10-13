import AdminPageClient from "../AdminPageClient";

export const dynamic = "force-dynamic";

interface AdminSectionPageProps {
  params: {
    section: string;
  };
}

export default function AdminSectionPage({ params }: AdminSectionPageProps) {
  return <AdminPageClient initialSection={params.section} />;
}
