import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ExportsClient } from "@/components/settings/exports-client";
import { FileSpreadsheet } from "lucide-react";

interface ExportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ExportsPage({ params }: ExportsPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();

  // Fetch Complaints with relations for this organization
  const complaints = await prisma.complaint.findMany({
    where: {
      orgId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: {
      createdBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      complaintOwner: {
        select: { email: true, firstName: true, lastName: true },
      },
      assignedInvestigator: {
        select: { email: true, firstName: true, lastName: true },
      },
      approvedBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      productInformation: true,
      investigation: {
        include: {
          summary: true,
        },
      },
    },
  });

  // Fetch CAPAs for this organization
  const capas = await prisma.capa.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      owner: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
  });

  // Fetch recent Audit Logs for this organization
  const auditLogs = await prisma.auditLog.findMany({
    where: { orgId },
    orderBy: { timestamp: "desc" },
    take: 500,
    include: {
      changedBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      complaint: {
        select: { complaintNumber: true },
      },
      capa: {
        select: { capaNumber: true },
      },
    },
  });

  return (
    <div className="w-full flex justify-center pb-12">
      <div className="w-full max-w-6xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Data Exports
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customize column fields and export compliance records for{" "}
              <span className="font-semibold text-foreground">{orgSlug}</span> into{" "}
              <span className="font-medium text-foreground">XLS (Excel)</span> or{" "}
              <span className="font-medium text-foreground">TXT (Tab-delimited)</span> format.
            </p>
          </div>
        </div>

        {/* Client Component with Interactive Field Selectors and Exporters */}
        <ExportsClient
          orgSlug={orgSlug}
          complaints={complaints}
          capas={capas}
          auditLogs={auditLogs}
        />
      </div>
    </div>
  );
}
