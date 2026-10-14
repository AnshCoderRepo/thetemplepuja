import AdminPageClient from "../AdminPageClient";

export const dynamic = "force-dynamic";

interface AdminSectionPageProps {
  params: Promise<{
    section: string;
  }>;
}

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;
  return <AdminPageClient initialSection={section} />;
}

