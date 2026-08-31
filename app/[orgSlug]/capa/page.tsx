import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { CapaView } from "@/components/capa-view";

interface CapaPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CapaPage({ params }: CapaPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();

  const capas = await prisma.capa.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { email: true, firstName: true, lastName: true } },
      initiation: {
        select: {
          problemStatement: true,
          source: true,
          dateDue: true,
          riskCategory: true,
          fscaRequired: true,
        },
      },
      investigation: {
        select: {
          investigationSummary: true,
          planDueDate: true,
        },
      },
      implementation: {
        select: {
          implementationDueDate: true,
        },
      },
      effectiveness: {
        select: {
          dateDue: true,
        },
      },
      extensionRequests: {
        where: { status: "PENDING" },
        select: { id: true, status: true },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-8xl mx-auto pb-10">
      {/* Page Heading matching Complaints exactly */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          CAPA
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track and Manage Corrective & Preventive Actions for{" "}
          <span className="font-semibold text-foreground">{orgSlug}</span>.
        </p>
      </div>

      {/* Action Toolbar & Dynamic Grid/List View with pagination */}
      <CapaView orgSlug={orgSlug} capas={capas} />
    </div>
  );
}
