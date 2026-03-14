import React from "react";
import { SearchBar } from "@/components/dashboard/search-bar";
import { UsageSection } from "@/components/dashboard/usage-section";
import { AlertsSection } from "@/components/dashboard/alerts-section";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { RecentPreviews } from "@/components/dashboard/recent-previews";
import { getProjects } from "./new/actions";

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <SearchBar />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
        {/* Left column: Usage + Alerts */}
        <div className="space-y-6">
          <UsageSection />
          <AlertsSection />
          <RecentPreviews />
        </div>

        {/* Right column: Projects */}
        <div>
          <ProjectsSection projects={projects} />
        </div>
      </div>
    </div>
  );
}
