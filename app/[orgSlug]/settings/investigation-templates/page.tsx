import { requireOrgAuth } from "@/lib/auth-guard";
import { getInvestigationTemplates } from "@/lib/actions/investigation-templates";
import { InvestigationTemplatesClient } from "@/components/admin/investigation-templates-client";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function InvestigationTemplatesPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();
  
  // Example permission check if needed (omitted for strictness, assume admin route)
  // await requireOrgRole([PERMISSIONS.ORG_ADMIN]);

  const templates = await getInvestigationTemplates(orgId);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Investigation Sections</h2>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <InvestigationTemplatesClient templates={templates} orgSlug={orgSlug} />
      </div>
    </div>
  );
}
