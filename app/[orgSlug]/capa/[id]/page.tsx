import { requireOrgAuth } from "@/lib/auth-guard";
import { getCapaById } from "@/lib/actions/capa";
import { CapaEditForm } from "@/components/capa-edit-form";
import { notFound } from "next/navigation";

interface CapaDetailPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function CapaDetailPage({ params }: CapaDetailPageProps) {
  const { orgSlug, id } = await params;
  await requireOrgAuth();

  const capa = await getCapaById(id);

  if (!capa) {
    notFound();
  }

  return <CapaEditForm orgSlug={orgSlug} capa={capa} />;
}
