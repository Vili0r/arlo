"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Menu, MoreHorizontal, ChevronDown } from "lucide-react";
import { ProjectSwitcher } from "@/components/dashboard/project-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-white/[0.08] bg-[#0a0a0a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-md hover:bg-white/[0.08] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-white/60" />
            </button>
            <ProjectSwitcher />

          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/80">Overview</span>
          </div>
          <button className="p-1.5 rounded-md hover:bg-white/[0.08] transition-colors">
            <MoreHorizontal size={16} className="text-white/50" />
          </button>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
