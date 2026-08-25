import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CommunicationPageProps {
  params: Promise<{ orgSlug: string; id: string; communicationId: string }>;
}

export default async function CommunicationPage({
  params,
}: CommunicationPageProps) {
  const { orgSlug, id, communicationId } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      customerCommunications: {
        where: { id: communicationId },
        include: {
          author: {
            select: { email: true, firstName: true, lastName: true },
          }
        }
      }
    }
  });

  if (!complaint || complaint.customerCommunications.length === 0) {
    notFound();
  }

  const communication = complaint.customerCommunications[0];

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
            <BreadcrumbPage>Communication Log</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Follow-up Log</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Complaint: {complaint.complaintNumber}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Direction</h3>
            <p className="font-medium">{communication.direction}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Communication Date</h3>
            <p className="font-mono text-sm">{new Date(communication.communicationDate).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Author</h3>
            <p className="font-medium">
              {communication.author?.firstName 
                ? `${communication.author.firstName} ${communication.author.lastName ?? ''}`
                : communication.author?.email || "Unknown Author"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Record ID</h3>
            <p className="font-mono text-sm">{communication.id}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
          <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50 whitespace-pre-wrap">
            {communication.notes || <span className="text-muted-foreground italic">No notes provided.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
