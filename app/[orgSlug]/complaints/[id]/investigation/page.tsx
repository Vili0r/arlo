import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SearchCode, FileText, FlaskConical, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface InvestigationPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function InvestigationPage({
  params,
}: InvestigationPageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      investigation: {
        include: {
          investigator: {
            select: { email: true, firstName: true, lastName: true },
          },
          riskReviewCompletedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
          investigationSummaryCompletedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
          imdrfCodes: true,
        }
      }
    }
  });

  if (!complaint || !complaint.investigation) {
    notFound();
  }

  const investigation = complaint.investigation;

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
            <BreadcrumbPage>Investigation</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
          <SearchCode className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investigation: {complaint.complaintNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">Status: {investigation.status}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Menubar className="border-border rounded-lg shadow-sm">
          <MenubarMenu>
            <MenubarTrigger className="font-medium cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              General Details
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>View Root Cause</MenubarItem>
              <MenubarItem>View Investigator Info</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="font-medium cursor-pointer">
              <FlaskConical className="w-4 h-4 mr-2" />
              Sample Analysis
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Results</MenubarItem>
              <MenubarItem>Quantity & Dates</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="font-medium cursor-pointer">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Risk Review
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Exempt Rationale</MenubarItem>
              <MenubarItem>Completion Status</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="font-medium cursor-pointer">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Summary & CAPA
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Investigation Report</MenubarItem>
              <MenubarItem>CAPA Rationale</MenubarItem>
              <MenubarItem>IMDRF Codes</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* General Details Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">General Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Investigation Required</h3>
            <p className="font-medium">{investigation.investigationRequired ? "Yes" : "No"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Investigator</h3>
            <p className="font-medium">
              {investigation.investigator?.firstName 
                ? `${investigation.investigator.firstName} ${investigation.investigator.lastName ?? ''}`
                : investigation.investigator?.email || "Unassigned"}
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Root Cause Description</h3>
          <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50">
            {investigation.rootCauseDesc || <span className="text-muted-foreground italic">No description provided.</span>}
          </div>
        </div>
      </div>

      {/* Sample Analysis Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Sample Analysis</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Analysis Required</h3>
            <p className="font-medium">{investigation.sampleAnalysisRequired ? "Yes" : "No"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Quantity Received</h3>
            <p className="font-medium">{investigation.quantity ?? "N/A"}</p>
          </div>
          {investigation.sampleReceivedDate && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Received Date</h3>
              <p className="font-medium">{new Date(investigation.sampleReceivedDate).toLocaleDateString()}</p>
            </div>
          )}
          {investigation.sampleAnalysisExemptRationale && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Exempt Rationale</h3>
              <p className="font-medium">{investigation.sampleAnalysisExemptRationale}</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Analysis Results</h3>
          <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50 whitespace-pre-wrap">
            {investigation.sampleAnalysisResults || <span className="text-muted-foreground italic">No results logged.</span>}
          </div>
        </div>
      </div>

      {/* Risk Review Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Risk Review</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Review Required</h3>
            <p className="font-medium">{investigation.riskReviewRequired ? "Yes" : "No"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed By</h3>
            <p className="font-medium">
              {investigation.riskReviewCompletedBy?.firstName 
                ? `${investigation.riskReviewCompletedBy.firstName} ${investigation.riskReviewCompletedBy.lastName ?? ''}`
                : investigation.riskReviewCompletedBy?.email || "Pending"}
            </p>
          </div>
          {investigation.riskReviewCompletedAt && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed At</h3>
              <p className="font-medium">{new Date(investigation.riskReviewCompletedAt).toLocaleDateString()}</p>
            </div>
          )}
          {investigation.riskReviewExemptRationale && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Exempt Rationale</h3>
              <p className="font-medium">{investigation.riskReviewExemptRationale}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary & CAPA Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Investigation Summary & CAPA</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">CAPA Required</h3>
            <p className="font-medium">{investigation.capaRequired ? "Yes" : "No"}</p>
          </div>
          {investigation.capaRef && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">CAPA Reference</h3>
              <p className="font-medium text-indigo-600">{investigation.capaRef}</p>
            </div>
          )}
          {investigation.capaRationale && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">CAPA Rationale</h3>
              <p className="font-medium">{investigation.capaRationale}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Reportability Review Required</h3>
            <p className="font-medium">{investigation.reportabilityReviewRequired ? "Yes" : "No"}</p>
          </div>
          {investigation.imdrfCodes && investigation.imdrfCodes.length > 0 && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">IMDRF Codes</h3>
              <ul className="list-disc list-inside space-y-1">
                {investigation.imdrfCodes.map((code) => (
                  <li key={code.id} className="text-sm">
                    <span className="font-medium">{code.code}</span> - {code.term} ({code.annex})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
          <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50 whitespace-pre-wrap">
            {investigation.summary || <span className="text-muted-foreground italic">No summary provided.</span>}
          </div>
        </div>
      </div>

    </div>
  );
}
