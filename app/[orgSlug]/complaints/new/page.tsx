import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { NewComplaintForm } from "@/components/new-complaint-form";

interface NewComplaintPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewComplaintPage({
  params,
}: NewComplaintPageProps) {
  const { orgSlug } = await params;
  await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  return <NewComplaintForm orgSlug={orgSlug} />;
}
