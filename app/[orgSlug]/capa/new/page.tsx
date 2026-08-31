import { requireOrgAuth } from "@/lib/auth-guard";
import { NewCapaForm } from "@/components/new-capa-form";

interface NewCapaPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewCapaPage({ params }: NewCapaPageProps) {
  const { orgSlug } = await params;
  await requireOrgAuth();

  return <NewCapaForm orgSlug={orgSlug} />;
}
