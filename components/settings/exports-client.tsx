"use client";

import * as React from "react";
import {
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  RotateCcw,
  Search,
  Eye,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateXlsBlob,
  generateTxtBlob,
  downloadBlob,
  type ExportColumn,
} from "@/lib/export-utils";

// -------------------------------------------------------------
// Field Definitions & Categories
// -------------------------------------------------------------

export interface ExportFieldConfig {
  key: string;
  label: string;
  category: string;
  description?: string;
  isDefault?: boolean;
}

const COMPLAINT_FIELDS: ExportFieldConfig[] = [
  // General & Identification
  { key: "complaintNumber", label: "Complaint Number", category: "Core Information", isDefault: true },
  { key: "shortDescription", label: "Short Description / Title", category: "Core Information", isDefault: true },
  { key: "status", label: "Complaint Status", category: "Core Information", isDefault: true },
  { key: "priority", label: "Priority / Severity", category: "Core Information", isDefault: true },
  { key: "awarenessDate", label: "Awareness Date", category: "Core Information", isDefault: true },
  { key: "dateReceived", label: "Date Received", category: "Core Information", isDefault: true },

  // Customer & Reporter
  { key: "customerName", label: "Customer / Facility Name", category: "Customer & Reporter", isDefault: true },
  { key: "customerType", label: "Customer Type", category: "Customer & Reporter", isDefault: false },
  { key: "reporterFullName", label: "Reporter Name", category: "Customer & Reporter", isDefault: true },
  { key: "email", label: "Reporter Email", category: "Customer & Reporter", isDefault: true },
  { key: "telNumber", label: "Reporter Phone", category: "Customer & Reporter", isDefault: false },
  { key: "country", label: "Reporter Country", category: "Customer & Reporter", isDefault: true },
  { key: "countryEventOccurred", label: "Event Country", category: "Customer & Reporter", isDefault: false },
  { key: "region", label: "Region", category: "Customer & Reporter", isDefault: false },

  // Medical & Regulatory
  { key: "death", label: "Patient Death Involved", category: "Medical & Regulatory", isDefault: true },
  { key: "isAdverseEvent", label: "Adverse Event", category: "Medical & Regulatory", isDefault: true },
  { key: "regulatoryReportingReference", label: "Regulatory Reporting Ref", category: "Medical & Regulatory", isDefault: false },

  // Device & Products
  { key: "deviceModel", label: "Device Model / Name", category: "Device & Products", isDefault: true },
  { key: "deviceSerialNumber", label: "Serial Number", category: "Device & Products", isDefault: true },
  { key: "lotNumber", label: "Lot / Batch Number", category: "Device & Products", isDefault: true },

  // Investigation & Resolution
  { key: "complaintOwnerName", label: "Complaint Owner", category: "Investigation & Resolution", isDefault: true },
  { key: "assignedInvestigatorName", label: "Assigned Investigator", category: "Investigation & Resolution", isDefault: true },
  { key: "approvedByName", label: "Approved By", category: "Investigation & Resolution", isDefault: false },
  { key: "investigationSummary", label: "Investigation Summary", category: "Investigation & Resolution", isDefault: false },
  { key: "rootCause", label: "Root Cause", category: "Investigation & Resolution", isDefault: false },
  { key: "closureRationale", label: "Closure Rationale", category: "Investigation & Resolution", isDefault: false },

  // System & Timestamps
  { key: "createdByName", label: "Created By", category: "System & Audit", isDefault: false },
  { key: "createdAt", label: "Created Date", category: "System & Audit", isDefault: false },
  { key: "updatedAt", label: "Last Updated Date", category: "System & Audit", isDefault: false },
];

const CAPA_FIELDS: ExportFieldConfig[] = [
  { key: "capaNumber", label: "CAPA Number", category: "Core Information", isDefault: true },
  { key: "shortDescription", label: "Short Description", category: "Core Information", isDefault: true },
  { key: "type", label: "CAPA Type", category: "Core Information", isDefault: true },
  { key: "currentPhase", label: "Current Phase", category: "Core Information", isDefault: true },
  { key: "ownerName", label: "CAPA Owner", category: "Core Information", isDefault: true },
  { key: "cancellationRequested", label: "Cancellation Requested", category: "Governance", isDefault: false },
  { key: "cancellationJustification", label: "Cancellation Justification", category: "Governance", isDefault: false },
  { key: "createdAt", label: "Created Date", category: "System & Audit", isDefault: true },
  { key: "updatedAt", label: "Last Updated Date", category: "System & Audit", isDefault: false },
];

const AUDIT_FIELDS: ExportFieldConfig[] = [
  { key: "timestamp", label: "Timestamp", category: "Core Information", isDefault: true },
  { key: "action", label: "Action Taken", category: "Core Information", isDefault: true },
  { key: "entityType", label: "Entity Type", category: "Core Information", isDefault: true },
  { key: "recordNumber", label: "Record Reference", category: "Core Information", isDefault: true },
  { key: "userName", label: "Performed By", category: "Actor", isDefault: true },
  { key: "userRole", label: "Role", category: "Actor", isDefault: true },
  { key: "reason", label: "Reason for Change", category: "Audit Trail", isDefault: true },
];

export interface UserRelation {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ComplaintExportRecord {
  id: string;
  complaintNumber: string;
  shortDescription: string;
  status: string;
  priority: string;
  awarenessDate: Date | string;
  dateReceived: Date | string;
  customerName: string;
  customerType?: string | null;
  initialReporterName?: string | null;
  initialReporterSurname?: string | null;
  email?: string | null;
  telNumber?: string | null;
  country?: string | null;
  countryEventOccurred?: string | null;
  region?: string | null;
  death?: string | null;
  isAdverseEvent?: boolean;
  regulatoryReportingReference?: string | null;
  deviceModel?: string | null;
  deviceSerialNumber?: string | null;
  lotNumber?: string | null;
  complaintOwner?: UserRelation | null;
  assignedInvestigator?: UserRelation | null;
  approvedBy?: UserRelation | null;
  createdBy?: UserRelation | null;
  investigationSummary?: string | null;
  rootCause?: string | null;
  closureRationale?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  productInformation?: Array<{
    materialDescription?: string | null;
    serialNumber?: string | null;
    batchNumber?: string | null;
  }>;
  investigation?: {
    summary?: {
      report?: string | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface CapaExportRecord {
  id: string;
  capaNumber: string;
  shortDescription: string;
  type: string;
  currentPhase: string;
  owner?: UserRelation | null;
  cancellationRequested?: boolean;
  cancellationJustification?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: unknown;
}

export interface AuditLogExportRecord {
  id: string;
  timestamp: Date | string;
  action: string;
  entityType: string;
  entityId: string;
  changedBy?: UserRelation | null;
  changedByRole?: string | null;
  reason?: string | null;
  complaint?: { complaintNumber: string } | null;
  capa?: { capaNumber: string } | null;
  newData?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ExportsClientProps {
  orgSlug: string;
  complaints: ComplaintExportRecord[];
  capas?: CapaExportRecord[];
  auditLogs?: AuditLogExportRecord[];
}

type DatasetType = "complaints" | "capa" | "audit";

function formatUserDisplay(u?: UserRelation | null): string {
  if (!u) return "";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name ? `${name} (${u.email})` : u.email;
}

export function ExportsClient({
  orgSlug,
  complaints,
  capas = [],
  auditLogs = [],
}: ExportsClientProps) {
  const [selectedDataset, setSelectedDataset] =
    React.useState<DatasetType>("complaints");
  const [fieldSearch, setFieldSearch] = React.useState("");

  // Normalization of Complaints rows
  const normalizedComplaints = React.useMemo(() => {
    return complaints.map((c) => {
      const primaryProduct = c.productInformation?.[0];
      const reporterFullName = [c.initialReporterName, c.initialReporterSurname]
        .filter(Boolean)
        .join(" ");

      return {
        ...c,
        reporterFullName: reporterFullName || c.customerName || "",
        deviceModel: primaryProduct?.materialDescription || c.deviceModel || "",
        deviceSerialNumber:
          primaryProduct?.serialNumber || c.deviceSerialNumber || "",
        lotNumber: primaryProduct?.batchNumber || c.lotNumber || "",
        complaintOwnerName: formatUserDisplay(c.complaintOwner),
        assignedInvestigatorName: formatUserDisplay(c.assignedInvestigator),
        approvedByName: formatUserDisplay(c.approvedBy),
        createdByName: formatUserDisplay(c.createdBy),
        investigationSummary:
          c.investigation?.summary?.report || c.investigationSummary || "",
      };
    });
  }, [complaints]);

  // Normalization of CAPA rows
  const normalizedCapas = React.useMemo(() => {
    return capas.map((capa) => {
      return {
        ...capa,
        ownerName: formatUserDisplay(capa.owner),
      };
    });
  }, [capas]);

  // Normalization of Audit Log rows
  const normalizedAuditLogs = React.useMemo(() => {
    return auditLogs.map((log) => {
      const newData = log.newData as Record<string, unknown> | undefined;
      const recordNumber =
        log.complaint?.complaintNumber ||
        log.capa?.capaNumber ||
        (newData?.complaintNumber as string) ||
        (newData?.capaNumber as string) ||
        log.entityId;

      return {
        ...log,
        recordNumber,
        userName: formatUserDisplay(log.changedBy),
        userRole: log.changedByRole || "User",
      };
    });
  }, [auditLogs]);

  // Active dataset configuration
  const currentFields = React.useMemo(() => {
    switch (selectedDataset) {
      case "complaints":
        return COMPLAINT_FIELDS;
      case "capa":
        return CAPA_FIELDS;
      case "audit":
        return AUDIT_FIELDS;
      default:
        return COMPLAINT_FIELDS;
    }
  }, [selectedDataset]);

  const currentData = React.useMemo((): Record<string, unknown>[] => {
    switch (selectedDataset) {
      case "complaints":
        return normalizedComplaints;
      case "capa":
        return normalizedCapas;
      case "audit":
        return normalizedAuditLogs;
      default:
        return normalizedComplaints;
    }
  }, [selectedDataset, normalizedComplaints, normalizedCapas, normalizedAuditLogs]);

  // Selected field keys state per dataset
  const [selectedKeysMap, setSelectedKeysMap] = React.useState<
    Record<DatasetType, string[]>
  >(() => ({
    complaints: COMPLAINT_FIELDS.filter((f) => f.isDefault).map((f) => f.key),
    capa: CAPA_FIELDS.filter((f) => f.isDefault).map((f) => f.key),
    audit: AUDIT_FIELDS.filter((f) => f.isDefault).map((f) => f.key),
  }));

  const activeSelectedKeys = React.useMemo(() => {
    return selectedKeysMap[selectedDataset] || [];
  }, [selectedKeysMap, selectedDataset]);

  const toggleField = (key: string) => {
    setSelectedKeysMap((prev) => {
      const currentList = prev[selectedDataset] || [];
      const exists = currentList.includes(key);
      const updated = exists
        ? currentList.filter((k) => k !== key)
        : [...currentList, key];
      return { ...prev, [selectedDataset]: updated };
    });
  };

  const selectAll = () => {
    setSelectedKeysMap((prev) => ({
      ...prev,
      [selectedDataset]: currentFields.map((f) => f.key),
    }));
  };

  const deselectAll = () => {
    setSelectedKeysMap((prev) => ({
      ...prev,
      [selectedDataset]: [],
    }));
  };

  const resetDefault = () => {
    setSelectedKeysMap((prev) => ({
      ...prev,
      [selectedDataset]: currentFields
        .filter((f) => f.isDefault)
        .map((f) => f.key),
    }));
  };

  // Group fields by category
  const categories = React.useMemo(() => {
    const map = new Map<string, ExportFieldConfig[]>();
    const filtered = currentFields.filter((f) =>
      f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(fieldSearch.toLowerCase())
    );
    for (const field of filtered) {
      if (!map.has(field.category)) {
        map.set(field.category, []);
      }
      map.get(field.category)!.push(field);
    }
    return Array.from(map.entries());
  }, [currentFields, fieldSearch]);

  // Columns for export
  const exportColumns: ExportColumn[] = React.useMemo(() => {
    return currentFields
      .filter((f) => activeSelectedKeys.includes(f.key))
      .map((f) => ({ key: f.key, label: f.label }));
  }, [currentFields, activeSelectedKeys]);

  // Handler for XLS export
  const handleExportXls = () => {
    if (exportColumns.length === 0) {
      toast.error("Please select at least one field to export.");
      return;
    }
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${orgSlug}-${selectedDataset}-export-${dateStr}.xls`;
      const blob = generateXlsBlob(
        currentData,
        exportColumns,
        selectedDataset.toUpperCase()
      );
      downloadBlob(blob, filename);
      toast.success(
        `Successfully exported ${currentData.length} records to ${filename}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate XLS export file.");
    }
  };

  // Handler for TXT export
  const handleExportTxt = () => {
    if (exportColumns.length === 0) {
      toast.error("Please select at least one field to export.");
      return;
    }
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${orgSlug}-${selectedDataset}-export-${dateStr}.txt`;
      const blob = generateTxtBlob(currentData, exportColumns, "\t");
      downloadBlob(blob, filename);
      toast.success(
        `Successfully exported ${currentData.length} records to ${filename}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate TXT export file.");
    }
  };

  // Live preview sample data (first 5 records)
  const previewRows = React.useMemo(() => {
    return currentData.slice(0, 5);
  }, [currentData]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Dataset Selector & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dataset:
          </span>
          <div className="flex items-center rounded-lg bg-muted p-1 border border-border">
            <button
              onClick={() => setSelectedDataset("complaints")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                selectedDataset === "complaints"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Complaints ({normalizedComplaints.length})
            </button>
            <button
              onClick={() => setSelectedDataset("capa")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                selectedDataset === "capa"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              CAPAs ({normalizedCapas.length})
            </button>
            <button
              onClick={() => setSelectedDataset("audit")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                selectedDataset === "audit"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit Trail ({normalizedAuditLogs.length})
            </button>
          </div>
        </div>

        {/* Action Buttons for XLS & TXT */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportXls}
            disabled={exportColumns.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Download formatted Excel Spreadsheet (.xls)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export as XLS</span>
          </button>

          <button
            onClick={handleExportTxt}
            disabled={exportColumns.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Download Tab-Delimited Text File (.txt)"
          >
            <FileText className="h-4 w-4" />
            <span>Export as TXT</span>
          </button>
        </div>
      </div>

      {/* Field Selection Box */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Select & Deselect Fields
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground font-mono font-medium">
              {activeSelectedKeys.length} of {currentFields.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search within fields */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search fields..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44"
              />
            </div>

            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Select All</span>
            </button>

            <button
              type="button"
              onClick={deselectAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Deselect All</span>
            </button>

            <button
              type="button"
              onClick={resetDefault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Categorized Fields Grid */}
        <div className="p-5 space-y-6">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No fields found matching &quot;{fieldSearch}&quot;.
            </div>
          ) : (
            categories.map(([categoryName, fields]) => {
              const allCategorySelected = fields.every((f) =>
                activeSelectedKeys.includes(f.key)
              );
              const toggleCategory = () => {
                if (allCategorySelected) {
                  // Deselect category fields
                  setSelectedKeysMap((prev) => ({
                    ...prev,
                    [selectedDataset]: (prev[selectedDataset] || []).filter(
                      (k) => !fields.some((f) => f.key === k)
                    ),
                  }));
                } else {
                  // Select all in category
                  const categoryKeys = fields.map((f) => f.key);
                  setSelectedKeysMap((prev) => ({
                    ...prev,
                    [selectedDataset]: Array.from(
                      new Set([...(prev[selectedDataset] || []), ...categoryKeys])
                    ),
                  }));
                }
              };

              return (
                <div key={categoryName} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                    <button
                      type="button"
                      onClick={toggleCategory}
                      className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <span>{categoryName}</span>
                      <span className="text-[10px] font-mono font-normal opacity-70">
                        ({fields.filter((f) => activeSelectedKeys.includes(f.key)).length}/{fields.length})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleCategory}
                      className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline underline-offset-2 cursor-pointer"
                    >
                      {allCategorySelected ? "Deselect group" : "Select group"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {fields.map((field) => {
                      const isSelected = activeSelectedKeys.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          onClick={() => toggleField(field.key)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                            isSelected
                              ? "border-primary/40 bg-primary/5 text-foreground font-medium shadow-xs"
                              : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by container onClick
                            className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{field.label}</span>
                            <span className="text-[10px] font-mono text-muted-foreground/80 truncate">
                              {field.key}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Live Data Preview Section */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Live Data Preview
            </h3>
            <span className="text-xs text-muted-foreground">
              (Showing first {previewRows.length} of {currentData.length} records)
            </span>
          </div>
          {exportColumns.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {exportColumns.length} columns active
            </span>
          )}
        </div>

        {exportColumns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <p className="text-sm font-medium text-foreground">
              No fields selected
            </p>
            <p className="text-xs max-w-sm">
              Please select one or more fields from the panel above to configure
              your export columns and see a preview.
            </p>
          </div>
        ) : previewRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No records found for this dataset.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground w-10 text-center">
                    #
                  </th>
                  {exportColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3.5 py-2.5 font-semibold text-foreground whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewRows.map((row, idx) => (
                  <tr
                    key={(row.id as string) || idx}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-muted-foreground text-center">
                      {idx + 1}
                    </td>
                    {exportColumns.map((col) => {
                      const val = row[col.key];
                      const displayVal =
                        val === null || val === undefined || val === ""
                          ? "—"
                          : typeof val === "boolean"
                          ? val
                            ? "Yes"
                            : "No"
                          : String(val);

                      return (
                        <td
                          key={col.key}
                          className="px-3.5 py-2 text-foreground truncate max-w-xs"
                          title={displayVal}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
