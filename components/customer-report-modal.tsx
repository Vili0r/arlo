"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Printer,
  Download,
  FileText,
  Building2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export interface CustomerReportDeviceItem {
  materialDescription?: string | null;
  materialNumber?: string | null;
  serialNumber?: string | null;
  batchNumber?: string | null;
  udi?: string | null;
  softwareVersion?: string | null;
}

export interface CustomerReportComplaintData {
  complaintNumber: string;
  shortDescription: string;
  customerName: string;
  customerType?: string | null;
  email: string;
  country: string;
  countryEventOccurred?: string | null;
  dateReceived?: string | Date | null;
  awarenessDate?: string | Date | null;
  deviceModel?: string | null;
  deviceSerialNumber?: string | null;
  lotNumber?: string | null;
  productInformation?: CustomerReportDeviceItem[];
  investigation?: {
    summary?: {
      report?: string | null;
    } | null;
  } | null;
}

interface CustomerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: CustomerReportComplaintData;
  orgName?: string;
}

export function generateReportPlainText(
  complaint: CustomerReportComplaintData,
  orgName?: string
): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const products =
    complaint.productInformation && complaint.productInformation.length > 0
      ? complaint.productInformation
      : [
          {
            materialDescription: complaint.deviceModel || "N/A",
            materialNumber: "N/A",
            serialNumber: complaint.deviceSerialNumber || "N/A",
            batchNumber: complaint.lotNumber || "N/A",
            udi: "N/A",
            softwareVersion: "N/A",
          },
        ];

  const devicesText = products
    .map(
      (p, idx) =>
        `Device #${idx + 1}:
  - Description: ${p.materialDescription || "N/A"}
  - Material / REF #: ${p.materialNumber || "N/A"}
  - Serial #: ${p.serialNumber || "N/A"}`
    )
    .join("\n\n");

  const reportBody =
    complaint.investigation?.summary?.report?.trim() ||
    "Investigation findings and conclusion have not been documented in the investigation file.";

  return `================================================================================
CUSTOMER INVESTIGATION REPORT & RESPONSE LETTER
${orgName ? `${orgName.toUpperCase()}\n` : ""}================================================================================

Date: ${currentDate}
Complaint Reference: ${complaint.complaintNumber}

--------------------------------------------------------------------------------
1. COMPLAINT & CUSTOMER OVERVIEW
--------------------------------------------------------------------------------
Short Description:      ${complaint.shortDescription}
Customer Name:          ${complaint.customerName}${complaint.customerType ? ` (${complaint.customerType})` : ""}
Reporter Email Address: ${complaint.email}
Country:                ${complaint.country}${complaint.countryEventOccurred && complaint.countryEventOccurred !== complaint.country ? ` (Event occurred in: ${complaint.countryEventOccurred})` : ""}

--------------------------------------------------------------------------------
2. DEVICE INFORMATION
--------------------------------------------------------------------------------
${devicesText}

--------------------------------------------------------------------------------
3. INVESTIGATION REPORT & CONCLUSION
--------------------------------------------------------------------------------
${reportBody}

--------------------------------------------------------------------------------
This report summarizes the investigation conducted for complaint reference ${complaint.complaintNumber}.
If you have any further questions or require additional details, please contact quality assurance.
================================================================================`;
}

export function CustomerReportModal({
  isOpen,
  onClose,
  complaint,
  orgName,
}: CustomerReportModalProps) {
  const [copied, setCopied] = React.useState(false);

  const currentDate = React.useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const products = React.useMemo(() => {
    if (
      complaint.productInformation &&
      complaint.productInformation.length > 0
    ) {
      return complaint.productInformation;
    }
    return [
      {
        materialDescription: complaint.deviceModel || null,
        materialNumber: null,
        serialNumber: complaint.deviceSerialNumber || null,
        batchNumber: complaint.lotNumber || null,
        udi: null,
        softwareVersion: null,
      },
    ];
  }, [complaint]);

  const reportBody =
    complaint.investigation?.summary?.report?.trim() || null;

  const handleCopy = async () => {
    try {
      const text = generateReportPlainText(complaint, orgName);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Report Copied", {
        description: "Customer report text copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy report to clipboard.");
    }
  };

  const handleDownload = () => {
    try {
      const text = generateReportPlainText(complaint, orgName);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Customer_Report_${complaint.complaintNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Report Downloaded", {
        description: `Customer_Report_${complaint.complaintNumber}.txt saved.`,
      });
    } catch {
      toast.error("Failed to download report.");
    }
  };

  const handlePrint = () => {
    const printElement = document.getElementById("customer-report-printable");
    if (!printElement) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title></title>
          <style>
            @page {
              margin: 0;
              size: auto;
            }
            @media print {
              @page {
                margin: 0;
                size: auto;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #18181b;
              background: #ffffff;
              font-size: 12px;
              line-height: 1.6;
              padding: 16mm 18mm;
              margin: 0;
            }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-8 > * + * { margin-top: 2rem; }
            .border-b { border-bottom: 1px solid #e4e4e7; }
            .border-t { border-top: 1px solid #e4e4e7; }
            .border { border: 1px solid #e4e4e7; }
            .rounded-lg { border-radius: 0.5rem; }
            .p-4 { padding: 1rem; }
            .p-5 { padding: 1.25rem; }
            .pb-6 { padding-bottom: 1.5rem; }
            .pt-6 { padding-top: 1.5rem; }
            .pt-2 { padding-top: 0.5rem; }
            .mt-0\\.5 { margin-top: 0.125rem; }
            .mt-1 { margin-top: 0.25rem; }
            .bg-muted\\/10 { background-color: #fafafa; }
            .bg-card { background-color: #ffffff; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-xs { font-size: 12px; line-height: 1rem; }
            .text-sm { font-size: 13px; line-height: 1.25rem; }
            .text-2xl { font-size: 20px; line-height: 1.75rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            .text-muted-foreground { color: #71717a; }
            .text-foreground { color: #09090b; }
            .text-primary { color: #09090b; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-tight { letter-spacing: -0.025em; }
            .block { display: block; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .gap-1 { gap: 0.25rem; }
            .gap-1\\.5 { gap: 0.375rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .text-right { text-align: right; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .italic { font-style: italic; }
            .print-avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            @media (min-width: 640px) {
              .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .sm\\:flex-row { flex-direction: row; }
              .sm\\:items-center { align-items: center; }
              .sm\\:text-right { text-align: right; }
            }
          </style>
        </head>
        <body>
          ${printElement.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border">
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Customer Investigation Report &amp; Letter
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Automated customer report for complaint{" "}
                  <span className="font-mono font-medium text-foreground">
                    {complaint.complaintNumber}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs gap-1.5 h-8"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy Text"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-xs gap-1.5 h-8"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 h-8"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Body / Printable Report */}
        <div
          id="customer-report-printable"
          className="p-6 sm:p-8 overflow-y-auto space-y-8 print:p-0 print:overflow-visible print:space-y-6"
        >
          {/* Letterhead */}
          <div className="border-b border-border pb-6 space-y-3 print-avoid-break">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  Customer Investigation Report
                </h1>
              </div>
              <div className="text-right sm:text-right font-mono text-xs text-muted-foreground space-y-1">
                <div>
                  Ref:{" "}
                  <strong className="text-foreground">
                    {complaint.complaintNumber}
                  </strong>
                </div>
                <div>Date: {currentDate}</div>
              </div>
            </div>
            {orgName && (
              <p className="text-xs font-medium text-muted-foreground">
                Prepared by: <span className="text-foreground">{orgName}</span>
              </p>
            )}
          </div>

          {/* Section 1: Complaint & Customer Summary */}
          <div className="space-y-3 print-avoid-break">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>1. Complaint &amp; Customer Overview</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/10 text-xs">
              <div>
                <span className="text-muted-foreground block font-medium">
                  Short Description
                </span>
                <span className="text-foreground font-semibold mt-0.5 block text-sm">
                  {complaint.shortDescription}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">
                  Customer
                </span>
                <span className="text-foreground font-medium mt-0.5 block">
                  {complaint.customerName}
                  {complaint.customerType ? ` (${complaint.customerType})` : ""}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">
                  Reporter Email Address
                </span>
                <span className="text-foreground font-mono mt-0.5 block">
                  {complaint.email}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">
                  Country
                </span>
                <span className="text-foreground font-medium mt-0.5 block">
                  {complaint.country}
                  {complaint.countryEventOccurred &&
                    complaint.countryEventOccurred !== complaint.country && (
                      <span className="text-muted-foreground text-[11px] block">
                        (Event occurred in: {complaint.countryEventOccurred})
                      </span>
                    )}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Device Information (WITHOUT IMDRF coding) */}
          <div className="space-y-3 print-avoid-break">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary" />
              <span>2. Device Information</span>
            </h2>
            <div className="space-y-3">
              {products.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border p-4 bg-muted/10 text-xs space-y-2 print-avoid-break"
                >
                  {products.length > 1 && (
                    <div className="font-semibold text-primary text-[11px] uppercase tracking-wider border-b border-border/50 pb-1">
                      Device #{idx + 1}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Device / Model Description
                      </span>
                      <span className="text-foreground font-medium">
                        {p.materialDescription || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Material / REF #
                      </span>
                      <span className="text-foreground font-mono">
                        {p.materialNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Serial Number
                      </span>
                      <span className="text-foreground font-mono">
                        {p.serialNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Investigation Report (Main Body) */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>3. Investigation Report &amp; Conclusion</span>
            </h2>
            <div className="rounded-lg border border-border p-5 bg-card text-xs leading-relaxed">
              {reportBody ? (
                <div className="whitespace-pre-wrap font-sans text-foreground text-sm space-y-2">
                  {reportBody}
                </div>
              ) : (
                <div className="text-muted-foreground italic py-3 text-center">
                  No detailed investigation report narrative has been recorded
                  in the investigation file yet.
                </div>
              )}
            </div>
          </div>

          {/* Closing & Formal Sign-off */}
          <div className="border-t border-border pt-6 text-xs text-muted-foreground space-y-4 print-avoid-break">
            <p>
              This customer response report concludes the post-market surveillance
              and quality investigation for record{" "}
              <strong className="text-foreground font-mono">
                {complaint.complaintNumber}
              </strong>
              . If further clarification or assistance is required, please reach
              out.
            </p>
            <div className="pt-2 flex flex-col gap-1">
              <span className="font-semibold text-foreground">
                Quality Assurance Department
              </span>
              <span>{orgName || "Medical Device Quality Management"}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/20 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
