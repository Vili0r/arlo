"use client";

import { useOrganization } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUserName } from "@/lib/utils";

interface CustomInvestigationSectionProps {
  section: {
    id: string;
    isRequired?: boolean;
    assignedToId?: string | null;
    assignedDate?: Date | string | null;
    exemptRationale?: string | null;
    results?: string | null;
    template?: {
      sectionName?: string;
      isActive?: boolean;
    } | null;
  };
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export function CustomInvestigationSection({
  section,
  onChange,
  disabled,
}: CustomInvestigationSectionProps) {
  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  const toDateString = (isoString?: string | null | Date) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`req-${section.id}`}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
          checked={!!section.isRequired}
          onChange={(e) => onChange("isRequired", e.target.checked)}
        />
        <Label htmlFor={`req-${section.id}`} className="font-medium">
          Section Required
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Assigned To {section.isRequired && <span className="text-destructive">*</span>}
          </Label>
          <select
            disabled={disabled}
            value={section.assignedToId || ""}
            onChange={(e) => onChange("assignedToId", e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Unassigned</option>
            {memberships?.data?.map((m) => (
              <option
                key={m.publicUserData?.userId || m.id}
                value={m.publicUserData?.userId || ""}
              >
                {formatUserName(m.publicUserData, "User")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Assigned Date {section.isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="date"
            disabled={disabled}
            value={toDateString(section.assignedDate)}
            onChange={(e) => onChange("assignedDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Exempt Rationale {!section.isRequired && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          rows={2}
          disabled={disabled}
          value={section.exemptRationale || ""}
          onChange={(e) => onChange("exemptRationale", e.target.value)}
          placeholder="Rationale if this section is exempted..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Results {section.isRequired && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          rows={4}
          disabled={disabled}
          value={section.results || ""}
          onChange={(e) => onChange("results", e.target.value)}
          placeholder="Enter analysis results..."
        />
      </div>
    </div>
  );
}
