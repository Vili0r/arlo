"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  SearchCode,
  Save,
  Loader2,
  FlaskConical,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { InvestigationStatus, ImdrfAnnex } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateInvestigation, type AttachmentInput } from "@/lib/actions/investigations";
import { useOrganization } from "@clerk/nextjs";
import { FileUploader } from "@/components/file-uploader";
import { CustomInvestigationSection } from "@/components/custom-investigation-section";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { cn } from "@/lib/utils";
import {
  IMDRF_ANNEX_B_CATEGORIES,
  IMDRF_ANNEX_B_SUBCAT_MAP,
  IMDRF_ANNEX_C_CATEGORIES,
  IMDRF_ANNEX_C_SUBCAT_MAP,
  IMDRF_ANNEX_D_CATEGORIES,
  IMDRF_ANNEX_D_SUBCAT_MAP,
  IMDRF_ANNEX_G_CATEGORIES,
  IMDRF_ANNEX_G_SUBCAT_MAP,
} from "@/lib/constants/qms-options";

interface ImdrfCodeInput {
  id?: string;
  productInformationId?: string | null;
  annex: ImdrfAnnex;
  category?: string;
  code: string;
  term: string;
  notes?: string | null;
}

interface InvestigationEditFormProps {
  orgSlug: string;
  complaintNumber: string;
  customSections?: any[];
  productInformation?: any[];
  investigation: {
    id: string;
    complaintId: string;
    status: InvestigationStatus;
    investigatorId?: string | null;
    notes?: string | null;

    sampleAnalysisAssignedDate?: string | null;
    sampleAnalysisCompleteDate?: string | null;
    sampleAnalysisRequired: boolean;
    sampleAnalysisExemptRationale?: string | null;
    decontaminatedAt?: string | null;
    sampleReceivedDate?: string | null;
    quantity?: number | null;
    sampleAnalysisResults?: string | null;

    riskReviewRequired: boolean;
    riskReviewExemptRationale?: string | null;
    riskReviewCompletedAt?: string | null;
    riskReviewCompletedById?: string | null;
    riskReviewResults?: string | null;

    investigationSummaryCompletedById?: string | null;
    investigationSummaryCompletedAt?: string | null;
    summaryText?: string | null;
    report?: string | null;
    capaRationale?: string | null;
    capaRequired: boolean;
    capaRef?: string | null;
    reportabilityReviewRequired: boolean;
    imdrfCodes?: ImdrfCodeInput[];

    attachments?: Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      fileSize: number | null;
      mimeType: string | null;
    }>;
  };
}

export function InvestigationEditForm({
  orgSlug,
  complaintNumber,
  customSections = [],
  productInformation = [],
  investigation,
}: InvestigationEditFormProps) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState("general");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  // General Details State
  const [status, setStatus] = React.useState<InvestigationStatus>(investigation.status);
  const [investigatorId, setInvestigatorId] = React.useState(investigation.investigatorId || "");
  const [notes, setNotes] = React.useState(investigation.notes || "");
  const [attachments, setAttachments] = React.useState<AttachmentInput[]>(() => {
    return investigation.attachments?.map(a => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) || [];
  });

  // Sample Analysis State
  const [sampleAnalysisRequired, setSampleAnalysisRequired] = React.useState(investigation.sampleAnalysisRequired);
  const [sampleAnalysisExemptRationale, setSampleAnalysisExemptRationale] = React.useState(investigation.sampleAnalysisExemptRationale || "");
  const [quantity, setQuantity] = React.useState(investigation.quantity?.toString() || "");
  const [sampleAnalysisResults, setSampleAnalysisResults] = React.useState(investigation.sampleAnalysisResults || "");
  
  // Dates stored as YYYY-MM-DD strings for native date inputs
  const toDateString = (isoString?: string | null) => isoString ? new Date(isoString).toISOString().split('T')[0] : "";
  const [sampleAnalysisAssignedDate, setSampleAnalysisAssignedDate] = React.useState(toDateString(investigation.sampleAnalysisAssignedDate));
  const [sampleAnalysisCompleteDate, setSampleAnalysisCompleteDate] = React.useState(toDateString(investigation.sampleAnalysisCompleteDate));
  const [decontaminatedAt, setDecontaminatedAt] = React.useState(toDateString(investigation.decontaminatedAt));
  const [sampleReceivedDate, setSampleReceivedDate] = React.useState(toDateString(investigation.sampleReceivedDate));

  // Risk Review State
  const [riskReviewRequired, setRiskReviewRequired] = React.useState(investigation.riskReviewRequired);
  const [riskReviewExemptRationale, setRiskReviewExemptRationale] = React.useState(investigation.riskReviewExemptRationale || "");
  const [riskReviewCompletedById, setRiskReviewCompletedById] = React.useState(investigation.riskReviewCompletedById || "");
  const [riskReviewCompletedAt, setRiskReviewCompletedAt] = React.useState(toDateString(investigation.riskReviewCompletedAt));
  const [riskReviewResults, setRiskReviewResults] = React.useState(investigation.riskReviewResults || "");

  // Summary & CAPA State
  const [investigationSummaryCompletedById, setInvestigationSummaryCompletedById] = React.useState(investigation.investigationSummaryCompletedById || "");
  const [investigationSummaryCompletedAt, setInvestigationSummaryCompletedAt] = React.useState(toDateString(investigation.investigationSummaryCompletedAt));
  const [summaryText, setSummaryText] = React.useState(investigation.summaryText || "");
  const [report, setReport] = React.useState(investigation.report || "");
  const [capaRequired, setCapaRequired] = React.useState(investigation.capaRequired);
  const [capaRationale, setCapaRationale] = React.useState(investigation.capaRationale || "");
  const [capaRef, setCapaRef] = React.useState(investigation.capaRef || "");
  const [reportabilityReviewRequired, setReportabilityReviewRequired] = React.useState(investigation.reportabilityReviewRequired);
  
  const [imdrfGroups, setImdrfGroups] = React.useState<ImdrfCodeInput[][]>(() => {
    const existingCodes = investigation.imdrfCodes || [];
    const groups: ImdrfCodeInput[][] = [];
    let currentGroup: ImdrfCodeInput[] = [];
    for (const code of existingCodes) {
       currentGroup.push({
          ...code,
          category: code.code ? code.code.substring(0, 3) : ""
       });
       if (currentGroup.length === 4) {
           groups.push(currentGroup);
           currentGroup = [];
       }
    }
    // Fallback if there are remainder codes or empty
    if (currentGroup.length > 0) {
        while (currentGroup.length < 4) {
            const missing = [ImdrfAnnex.ANNEX_B, ImdrfAnnex.ANNEX_C, ImdrfAnnex.ANNEX_D, ImdrfAnnex.ANNEX_G].find(a => !currentGroup.some(c => c.annex === a));
            if (missing) currentGroup.push({ annex: missing, category: "", code: "", term: "", productInformationId: currentGroup[0]?.productInformationId });
        }
        groups.push(currentGroup);
    }
    if (groups.length === 0) {
        groups.push([
          { annex: ImdrfAnnex.ANNEX_B, category: "", code: "", term: "", productInformationId: null },
          { annex: ImdrfAnnex.ANNEX_C, category: "", code: "", term: "", productInformationId: null },
          { annex: ImdrfAnnex.ANNEX_D, category: "", code: "", term: "", productInformationId: null },
          { annex: ImdrfAnnex.ANNEX_G, category: "", code: "", term: "", productInformationId: null },
        ]);
    }
    return groups;
  });

  const [customSectionStates, setCustomSectionStates] = React.useState(customSections);

  React.useEffect(() => {
    setCustomSectionStates(customSections);
  }, [customSections]);

  const handleCustomSectionChange = (sectionId: string, field: string, value: any) => {
    setCustomSectionStates((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const handleAddImdrfGroup = () => {
    setImdrfGroups([...imdrfGroups, [
      { annex: ImdrfAnnex.ANNEX_B, category: "", code: "", term: "", productInformationId: null },
      { annex: ImdrfAnnex.ANNEX_C, category: "", code: "", term: "", productInformationId: null },
      { annex: ImdrfAnnex.ANNEX_D, category: "", code: "", term: "", productInformationId: null },
      { annex: ImdrfAnnex.ANNEX_G, category: "", code: "", term: "", productInformationId: null },
    ]]);
  };

  const handleRemoveImdrfGroup = (index: number) => {
    if (imdrfGroups.length > 1) {
      setImdrfGroups(imdrfGroups.filter((_, i) => i !== index));
    }
  };

  const handleImdrfCodeChange = (groupIndex: number, codeIndex: number, field: keyof ImdrfCodeInput, value: string) => {
    setImdrfGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[codeIndex] = { ...newGroup[codeIndex], [field]: value };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  };


  const handleGroupNotesChange = (groupIndex: number, notes: string) => {
    setImdrfGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const newGroup = [...newGroups[groupIndex]];
      for (let i = 0; i < newGroup.length; i++) {
        newGroup[i] = { ...newGroup[i], notes };
      }
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  };

  const handleGroupProductChange = (groupIndex: number, productId: string) => {
    setImdrfGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = newGroups[groupIndex].map(code => ({
        ...code,
        productInformationId: productId || null
      }));
      return newGroups;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateInvestigation({
        id: investigation.id,
        complaintId: investigation.complaintId,
        orgSlug,
        status,
        investigatorId: investigatorId || null,
        notes: notes || null,
        newAttachments: attachments.filter(a => !investigation.attachments?.some(ea => ea.fileUrl === a.fileUrl)),
        
        sampleAnalysisAssignedDate: sampleAnalysisAssignedDate ? new Date(sampleAnalysisAssignedDate) : null,
        sampleAnalysisCompleteDate: sampleAnalysisCompleteDate ? new Date(sampleAnalysisCompleteDate) : null,
        sampleAnalysisRequired,
        sampleAnalysisExemptRationale: sampleAnalysisExemptRationale || null,
        decontaminatedAt: decontaminatedAt ? new Date(decontaminatedAt) : null,
        sampleReceivedDate: sampleReceivedDate ? new Date(sampleReceivedDate) : null,
        quantity: quantity ? parseInt(quantity, 10) : null,
        sampleAnalysisResults: sampleAnalysisResults || null,

        riskReviewRequired,
        riskReviewExemptRationale: riskReviewExemptRationale || null,
        riskReviewCompletedAt: riskReviewCompletedAt ? new Date(riskReviewCompletedAt) : null,
        riskReviewCompletedById: riskReviewCompletedById || null,
        riskReviewResults: riskReviewResults || null,

        investigationSummaryCompletedById: investigationSummaryCompletedById || null,
        investigationSummaryCompletedAt: investigationSummaryCompletedAt ? new Date(investigationSummaryCompletedAt) : null,
        summaryText: summaryText || null,
        report: report || null,
        capaRationale: capaRationale || null,
        capaRequired,
        capaRef: capaRef || null,
        reportabilityReviewRequired,
        imdrfCodes: imdrfGroups.flat(),
        customSections: customSectionStates.map((cs) => ({
          id: cs.id,
          isRequired: !!cs.isRequired,
          assignedToId: cs.assignedToId || null,
          assignedDate: cs.assignedDate ? new Date(cs.assignedDate) : null,
          exemptRationale: cs.exemptRationale || null,
          results: cs.results || null,
        })),
      });

      toast.success("Success", { description: "Investigation details saved successfully." });
      router.refresh();
    } catch (err: any) {
      console.error("[Investigation Update Error]", err);
      setError(err?.message || "Failed to save investigation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/complaints">Complaints</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/complaints/${investigation.complaintId}`}>{complaintNumber}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Investigation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  <SearchCode className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Investigation: {complaintNumber}</CardTitle>
                  <CardDescription className="mt-1">Manage all investigation tasks and CAPA assignments</CardDescription>
                </div>
              </div>
              <div className="flex items-center">
                <StatusTransitionTracker
                  entityType="Investigation"
                  entityId={investigation.id}
                  currentStatus={status}
                  onStatusChanged={(newStatus) => {
                    setStatus(newStatus as InvestigationStatus);
                    router.refresh();
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="w-full sm:w-auto flex flex-wrap h-auto p-1 bg-muted/50 gap-1 rounded-lg">
                  <TabsTrigger value="general" className="gap-2 text-xs py-2">
                    <FileText className="h-4 w-4" /> General Details
                  </TabsTrigger>
                  <TabsTrigger value="sample" className="gap-2 text-xs py-2">
                    <FlaskConical className="h-4 w-4" /> Sample Analysis
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="gap-2 text-xs py-2">
                    <ShieldAlert className="h-4 w-4" /> Risk Review
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="gap-2 text-xs py-2">
                    <CheckCircle2 className="h-4 w-4" /> Summary & CAPA
                  </TabsTrigger>
                  {customSectionStates.map((section) => (
                    <TabsTrigger key={section.id} value={`custom-${section.id}`} className="gap-2 text-xs py-2">
                      <SearchCode className="h-4 w-4" /> {section.template?.sectionName || "Custom Section"}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-6 rounded-xl border border-border bg-muted/15 p-6">
                  {/* General Details Tab */}
                  <TabsContent value="general" className="mt-0 space-y-6 outline-none">
                <h2 className="text-xl font-semibold border-b pb-2">General Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/40 text-sm gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          (status as string) === "COMPLETED"
                            ? "bg-green-500"
                            : (status as string) === "UNDER_REVIEW"
                            ? "bg-purple-500"
                            : (status as string) === "IN_PROGRESS"
                            ? "bg-amber-500"
                            : (status as string) === "NOT_REQUIRED"
                            ? "bg-zinc-400"
                            : "bg-blue-500"
                        )}
                      />
                      <span className="font-medium text-foreground">
                        {(status as string) === "IN_PROGRESS"
                          ? "Under Investigation"
                          : (status as string) === "UNDER_REVIEW"
                          ? "Under Review"
                          : (status as string) === "NOT_STARTED"
                          ? "Not Started"
                          : (status as string) === "NOT_REQUIRED"
                          ? "Not Required"
                          : (status as string) === "COMPLETED"
                          ? "Completed"
                          : String(status)}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        Managed via e-signature stepper
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Investigator <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={investigatorId}
                      onChange={(e) => setInvestigatorId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      {memberships?.data?.map((m) => (
                        <option key={m.publicUserData?.userId} value={m.publicUserData?.userId || ""}>
                          {m.publicUserData?.firstName} {m.publicUserData?.lastName} ({m.publicUserData?.identifier})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Attachments</Label>
                  <FileUploader attachments={attachments} onChange={setAttachments} />
                </div>
              </TabsContent>

              {/* Sample Analysis Tab */}
              <TabsContent value="sample" className="mt-0 space-y-6 outline-none">
                <h2 className="text-xl font-semibold border-b pb-2">Sample Analysis</h2>
                <div className="flex items-center space-x-2 mb-2">
                  <input 
                    type="checkbox"
                    id="sampleRequired" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={sampleAnalysisRequired} 
                    onChange={(e) => setSampleAnalysisRequired(e.target.checked)} 
                  />
                  <Label htmlFor="sampleRequired" className="font-medium">Sample Analysis Required</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sample Received Date</Label>
                    <Input type="date" value={sampleReceivedDate} onChange={(e) => setSampleReceivedDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Assigned Date <span className="text-destructive">*</span>
                    </Label>
                    <Input type="date" value={sampleAnalysisAssignedDate} onChange={(e) => setSampleAnalysisAssignedDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Complete Date <span className="text-destructive">*</span>
                    </Label>
                    <Input type="date" value={sampleAnalysisCompleteDate} onChange={(e) => setSampleAnalysisCompleteDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Decontaminated At</Label>
                    <Input type="date" value={decontaminatedAt} onChange={(e) => setDecontaminatedAt(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Exempt Rationale</Label>
                  <Textarea 
                    rows={2} 
                    value={sampleAnalysisExemptRationale} 
                    onChange={(e) => setSampleAnalysisExemptRationale(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Analysis Results</Label>
                  <Textarea 
                    rows={4} 
                    value={sampleAnalysisResults} 
                    onChange={(e) => setSampleAnalysisResults(e.target.value)} 
                  />
                </div>
              </TabsContent>

              {/* Risk Review Tab */}
              <TabsContent value="risk" className="mt-0 space-y-6 outline-none">
                <h2 className="text-xl font-semibold border-b pb-2">Risk Review</h2>
                <div className="flex items-center space-x-2 mb-2">
                  <input 
                    type="checkbox"
                    id="riskRequired" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={riskReviewRequired} 
                    onChange={(e) => setRiskReviewRequired(e.target.checked)} 
                  />
                  <Label htmlFor="riskRequired" className="font-medium">Risk Review Required</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Exempt Rationale {!riskReviewRequired && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea 
                    rows={2} 
                    value={riskReviewExemptRationale} 
                    onChange={(e) => setRiskReviewExemptRationale(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Completed By {riskReviewRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <select
                      value={riskReviewCompletedById}
                      onChange={(e) => setRiskReviewCompletedById(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      {memberships?.data?.map((m) => (
                        <option key={m.publicUserData?.userId} value={m.publicUserData?.userId || ""}>
                          {m.publicUserData?.firstName} {m.publicUserData?.lastName} ({m.publicUserData?.identifier})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Completed At {riskReviewRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <Input type="date" value={riskReviewCompletedAt} onChange={(e) => setRiskReviewCompletedAt(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="text-sm font-medium">
                    Risk Review Results {riskReviewRequired && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea 
                    rows={4} 
                    value={riskReviewResults} 
                    onChange={(e) => setRiskReviewResults(e.target.value)} 
                    placeholder="Enter risk review results..." 
                  />
                </div>
              </TabsContent>

              {/* Summary & CAPA Tab */}
              <TabsContent value="summary" className="mt-0 space-y-6 outline-none">
                <h2 className="text-xl font-semibold border-b pb-2">Investigation Summary & CAPA</h2>
                
                 <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Summary <span className="text-destructive">*</span>
                  </Label>
                  <Textarea rows={3} value={summaryText} onChange={(e) => setSummaryText(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Report <span className="text-destructive">*</span>
                  </Label>
                  <Textarea rows={4} value={report} onChange={(e) => setReport(e.target.value)} />
                </div>

               
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-2 pt-4">
                    <input 
                      type="checkbox"
                      id="capaRequired" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={capaRequired} 
                      onChange={(e) => setCapaRequired(e.target.checked)} 
                    />
                    <Label htmlFor="capaRequired" className="font-medium">CAPA Required</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <input 
                      type="checkbox"
                      id="repRequired" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={reportabilityReviewRequired} 
                      onChange={(e) => setReportabilityReviewRequired(e.target.checked)} 
                    />
                    <Label htmlFor="repRequired" className="font-medium">Reportability Review Required</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CAPA Reference #</Label>
                    <Input value={capaRef} onChange={(e) => setCapaRef(e.target.value)} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    CAPA Rationale <span className="text-destructive">*</span>
                  </Label>
                  <Textarea rows={2} value={capaRationale} onChange={(e) => setCapaRationale(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea 
                    rows={2} 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="General investigation notes..." 
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        IMDRF Investigation Codes <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Hierarchical categorization of the investigation findings.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/10 p-4 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{imdrfGroups.length} IMDRF Coding Group{imdrfGroups.length !== 1 && "s"} Added</p>
                      <p className="text-xs text-muted-foreground mt-1">Manage product finding categories and codes.</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                          Manage IMDRF Codes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] xl:max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage IMDRF Coding Groups</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="rounded-md border border-border overflow-hidden bg-background overflow-x-auto">
                            <Table className="min-w-[1150px]">
                              <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableHead className="w-[200px]">Product</TableHead>
                                  <TableHead className="w-[180px]">Annex B (Type)</TableHead>
                                  <TableHead className="w-[180px]">Annex C (Findings)</TableHead>
                                  <TableHead className="w-[180px]">Annex D (Conclusion)</TableHead>
                                  <TableHead className="w-[180px]">Annex G (Component)</TableHead>
                                  <TableHead className="w-[200px]">Notes</TableHead>
                                  <TableHead className="w-[60px] text-center"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {imdrfGroups.map((group, groupIdx) => {
                                  const getCodeSelects = (annex: string) => {
                                    const codeIndex = group.findIndex(c => c.annex === annex);
                                    const actualIndex = codeIndex >= 0 ? codeIndex : 0;
                                    const codeObj = group[actualIndex];
                                    
                                    const getCategoryOptions = () => {
                                      switch (annex) {
                                        case "ANNEX_B": return IMDRF_ANNEX_B_CATEGORIES;
                                        case "ANNEX_C": return IMDRF_ANNEX_C_CATEGORIES;
                                        case "ANNEX_D": return IMDRF_ANNEX_D_CATEGORIES;
                                        case "ANNEX_G": return IMDRF_ANNEX_G_CATEGORIES;
                                        default: return [];
                                      }
                                    };
                                    const getSubCodeOptions = () => {
                                      if (!codeObj?.category) return [];
                                      switch (annex) {
                                        case "ANNEX_B": return IMDRF_ANNEX_B_SUBCAT_MAP[codeObj.category] || [];
                                        case "ANNEX_C": return IMDRF_ANNEX_C_SUBCAT_MAP[codeObj.category] || [];
                                        case "ANNEX_D": return IMDRF_ANNEX_D_SUBCAT_MAP[codeObj.category] || [];
                                        case "ANNEX_G": return IMDRF_ANNEX_G_SUBCAT_MAP[codeObj.category] || [];
                                        default: return [];
                                      }
                                    };
                                    const categories = getCategoryOptions();
                                    const subCodes = getSubCodeOptions();
                                    
                                    return (
                                      <div className="flex flex-col gap-2">
                                        <select
                                          required
                                          value={codeObj?.category || ""}
                                          onChange={(e) => {
                                            const selectedCat = e.target.value;
                                            const categoryOption = categories.find(o => o.value === selectedCat);
                                            
                                            handleImdrfCodeChange(groupIdx, actualIndex, "category", selectedCat);
                                            
                                            // Check if this category has subcodes
                                            let catSubCodes = [];
                                            if (annex === "ANNEX_C") catSubCodes = IMDRF_ANNEX_C_SUBCAT_MAP[selectedCat] || [];
                                            if (annex === "ANNEX_D") catSubCodes = IMDRF_ANNEX_D_SUBCAT_MAP[selectedCat] || [];
                                            if (annex === "ANNEX_G") catSubCodes = IMDRF_ANNEX_G_SUBCAT_MAP[selectedCat] || [];

                                            if (annex === "ANNEX_B" || (selectedCat && catSubCodes.length === 0)) {
                                              handleImdrfCodeChange(groupIdx, actualIndex, "code", selectedCat);
                                              handleImdrfCodeChange(groupIdx, actualIndex, "term", categoryOption ? categoryOption.label.split(" - ")[1] || categoryOption.label : "");
                                            } else {
                                              handleImdrfCodeChange(groupIdx, actualIndex, "code", "");
                                              handleImdrfCodeChange(groupIdx, actualIndex, "term", "");
                                            }
                                          }}
                                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"
                                        >
                                          <option value="">{annex === "ANNEX_B" ? "Code..." : "Category..."}</option>
                                          {categories.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                        
                                        {annex !== "ANNEX_B" && codeObj?.category && subCodes.length > 0 && (
                                          <select
                                            required
                                            value={codeObj?.code || ""}
                                            onChange={(e) => {
                                              const selectedVal = e.target.value;
                                              const option = subCodes.find(o => o.value === selectedVal);
                                              handleImdrfCodeChange(groupIdx, actualIndex, "code", selectedVal);
                                              handleImdrfCodeChange(groupIdx, actualIndex, "term", option ? option.label.split(" - ")[1] || option.label : "");
                                            }}
                                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"
                                          >
                                            <option value="">Code...</option>
                                            {subCodes.map(opt => (
                                              <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                        
                                        {annex !== "ANNEX_B" && !codeObj?.category && (
                                          <select
                                            required
                                            disabled
                                            value=""
                                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring opacity-50"
                                          >
                                            <option value="">Code...</option>
                                          </select>
                                        )}
                                        
                                      </div>
                                    );
                                  };
        
                                  return (
                                    <TableRow key={groupIdx} className="align-top hover:bg-muted/10 group">
                                      <TableCell className="p-3">
                                        <select
                                          value={group[0]?.productInformationId || ""}
                                          onChange={(e) => handleGroupProductChange(groupIdx, e.target.value)}
                                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"
                                        >
                                          <option value="">-- No Product --</option>
                                          {productInformation.map(p => (
                                            <option key={p.id} value={p.id}>
                                              {p.materialDescription || p.materialNumber || p.id} {p.serialNumber ? `(SN: ${p.serialNumber})` : ""}
                                            </option>
                                          ))}
                                        </select>
                                      </TableCell>
                                      <TableCell className="p-3 align-top min-w-[200px]">
                                        {getCodeSelects("ANNEX_B")}
                                      </TableCell>
                                      <TableCell className="p-3 align-top min-w-[200px]">
                                        {getCodeSelects("ANNEX_C")}
                                      </TableCell>
                                      <TableCell className="p-3 align-top min-w-[200px]">
                                        {getCodeSelects("ANNEX_D")}
                                      </TableCell>
                                      <TableCell className="p-3 align-top min-w-[200px]">
                                        {getCodeSelects("ANNEX_G")}
                                      </TableCell>
                                      <TableCell className="p-3 align-top min-w-[200px]">
                                        <textarea
                                          placeholder="Notes (optional)"
                                          value={group[0]?.notes || ""}
                                          onChange={(e) => handleGroupNotesChange(groupIdx, e.target.value)}
                                          className="w-full min-h-[60px] rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring resize-y"
                                        />
                                      </TableCell>
                                      <TableCell className="p-3 text-center align-middle opacity-0 group-hover:opacity-100 transition-opacity">
                                        {imdrfGroups.length > 1 && (
                                          <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleRemoveImdrfGroup(groupIdx)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          <Button type="button" variant="outline" onClick={handleAddImdrfGroup} className="w-full border-dashed mt-4">
                            <Plus className="h-4 w-4 mr-2" /> Add IMDRF Coding Row
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Summary Completed By <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={investigationSummaryCompletedById}
                      onChange={(e) => setInvestigationSummaryCompletedById(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      {memberships?.data?.map((m) => (
                        <option key={m.publicUserData?.userId} value={m.publicUserData?.userId || ""}>
                          {m.publicUserData?.firstName} {m.publicUserData?.lastName} ({m.publicUserData?.identifier})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Summary Completed At <span className="text-destructive">*</span>
                    </Label>
                    <Input type="date" value={investigationSummaryCompletedAt} onChange={(e) => setInvestigationSummaryCompletedAt(e.target.value)} />
                  </div>
                </div>
              </TabsContent>

              {/* Custom Sections Tabs */}
              {customSectionStates.map((section) => (
                <TabsContent key={section.id} value={`custom-${section.id}`} className="mt-0 space-y-6 outline-none">
                  <h2 className="text-xl font-semibold border-b pb-2">{section.template?.sectionName || "Custom Section"}</h2>
                  <CustomInvestigationSection
                    section={section}
                    onChange={(field, value) => handleCustomSectionChange(section.id, field, value)}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 pb-4">
          <Link
            href={`/complaints/${investigation.complaintId}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Cancel
          </Link>
          <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Save Investigation
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</div>
  );
}
