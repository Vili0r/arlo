import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface VigilancePageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function VigilancePage({
  params,
}: VigilancePageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      vigilanceDecisionTree: true,
    }
  });

  if (!complaint || !complaint.vigilanceDecisionTree) {
    notFound();
  }

  const vigilance = complaint.vigilanceDecisionTree;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/complaints">Complaints</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/complaints/${id}`}>{complaint.complaintNumber}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Vigilance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vigilance Decision Tree</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Complaint: {complaint.complaintNumber}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
            <p className="font-medium">{vigilance.status}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Reportable</h3>
            <p className="font-medium">{vigilance.reportable ? "🚨 Yes (Reportable Incident)" : "🛡️ No"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
            <p className="font-mono text-sm">{new Date(vigilance.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Record ID</h3>
            <p className="font-mono text-sm">{vigilance.id}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Rationale</h3>
          <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50">
            {vigilance.rationale || <span className="text-muted-foreground italic">No rationale provided.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
