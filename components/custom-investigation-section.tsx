"use client";

import { useState, useTransition } from "react";
import { updateCustomSection } from "@/lib/actions/investigation-templates";
import { useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";

export function CustomInvestigationSection({ initialSection }: { initialSection: any }) {
  const [section, setSection] = useState(initialSection);
  const [isPending, startTransition] = useTransition();

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  const handleChange = (field: string, value: any) => {
    setSection((prev: any) => ({ ...prev, [field]: value }));
  };

  const toDateString = (isoString?: string | null | Date) => isoString ? new Date(isoString).toISOString().split('T')[0] : "";

  const handleSave = () => {
    startTransition(async () => {
      await updateCustomSection(section.id, {
        assignedToId: section.assignedToId,
        isRequired: section.isRequired,
        assignedDate: section.assignedDate ? new Date(section.assignedDate) : null,
        exemptRationale: section.exemptRationale,
        results: section.results,
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`req-${section.id}`}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={section.isRequired}
          onChange={(e) => handleChange('isRequired', e.target.checked)}
        />
        <Label htmlFor={`req-${section.id}`} className="font-medium">Section Required</Label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Assigned To</Label>
          <select
            value={section.assignedToId || ""}
            onChange={(e) => handleChange('assignedToId', e.target.value || null)}
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
          <Label className="text-sm font-medium">Assigned Date</Label>
          <Input
            type="date"
            value={toDateString(section.assignedDate)}
            onChange={(e) => handleChange('assignedDate', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Exempt Rationale</Label>
        <Textarea
          rows={2}
          value={section.exemptRationale || ""}
          onChange={(e) => handleChange('exemptRationale', e.target.value)}
          placeholder="Rationale if this section is exempted..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Results</Label>
        <Textarea
          rows={4}
          value={section.results || ""}
          onChange={(e) => handleChange('results', e.target.value)}
          placeholder="Enter analysis results..."
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isPending} variant="secondary">
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save {section.template.sectionName}</>
          )}
        </Button>
      </div>
    </div>
  );
}
