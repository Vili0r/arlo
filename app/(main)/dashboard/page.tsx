import React from "react";
import { UsageSection } from "@/components/dashboard/usage-section";
import { AlertsSection } from "@/components/dashboard/alerts-section";
import { RecentPreviews } from "@/components/dashboard/recent-previews";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getProjects } from "./project/actions";

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <DashboardShell projects={projects}>
      <UsageSection />
      <AlertsSection />
      <RecentPreviews />
    </DashboardShell>
  );
}
