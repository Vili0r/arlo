"use client";

import { useState, useTransition } from "react";
import { createInvestigationTemplate, toggleInvestigationTemplate } from "@/lib/actions/investigation-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InvestigationTemplatesClient({ templates, orgSlug }: { templates: any[], orgSlug: string }) {
  const [sectionName, setSectionName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) return;

    startTransition(async () => {
      await createInvestigationTemplate(sectionName.trim(), orgSlug);
      setSectionName("");
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleInvestigationTemplate(id, !currentStatus, orgSlug);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Custom Section</CardTitle>
          <CardDescription>
            Create a new section template. Sections cannot be deleted, only deactivated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="sectionName" className="text-sm font-medium leading-none">
                Section Name
              </label>
              <Input
                id="sectionName"
                placeholder="e.g. Chemical Analysis"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" disabled={isPending || !sectionName.trim()}>
              Add Section
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active & Historical Sections</CardTitle>
          <CardDescription>
            Manage the availability of investigation sections for new investigations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No custom sections defined yet.
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{template.sectionName}</span>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggle(template.id, template.isActive)}
                  >
                    {template.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
