"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  ClipboardCheck,
  History,
  Users,
  Building2,
  Lock,
  ShieldCheck,
  ChevronsUpDown,
  Search,
  PanelLeftClose,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Bell,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface WorkspaceShellProps {
  children: React.ReactNode;
  orgSlug: string;
  orgRole?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userImageUrl?: string | null;
}

export function WorkspaceShell({
  children,
  orgSlug,
  orgRole,
  userEmail,
  userName,
  userImageUrl,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const { openOrganizationProfile } = useClerk();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Persist sidebar state in localStorage & handle responsive default
  React.useEffect(() => {
    const saved = localStorage.getItem("arlo-sidebar-open");
    if (saved !== null) {
      setIsSidebarOpen(saved === "true");
    } else if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Close sidebar on mobile when route changes
  React.useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("arlo-sidebar-open", String(next));
      return next;
    });
  };

  // Compute dynamic screen title based on active path
  const screenTitle = React.useMemo(() => {
    if (!pathname) return "Overview";
    const cleanPath = pathname.replace(/\/+$/, "") || "/";

    if (cleanPath === "/" || cleanPath === `/${orgSlug}`) {
      return "Overview";
    }

    if (cleanPath.endsWith("/complaints/new") || cleanPath === "/complaints/new") {
      return "New Complaint";
    }
    if (cleanPath.endsWith("/complaints") || cleanPath === "/complaints") {
      return "Complaints";
    }
    if (cleanPath.includes("/investigation")) {
      return "Investigation Details";
    }
    if (cleanPath.includes("/vigilance")) {
      return "Vigilance Details";
    }
    if (cleanPath.includes("/communications")) {
      return "Communication Details";
    }
    if (cleanPath.includes("/complaints/")) {
      return "Complaint Details";
    }
    if (cleanPath.endsWith("/capa") || cleanPath === "/capa" || cleanPath.includes("/capa/")) {
      return "CAPA Management";
    }

    // Fallback: parse segments excluding orgSlug
    const segments = cleanPath.split("/").filter(Boolean);
    const relevantSegments = segments.filter((s) => s !== orgSlug);
    if (relevantSegments.length === 0) return "Overview";

    return relevantSegments
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" - ");
  }, [pathname, orgSlug]);

  const navItems = [
    {
      title: "Overview",
      href: "/",
      exact: true,
      icon: LayoutDashboard,
    },
    {
      title: "Complaints (PMS)",
      href: "/complaints",
      exact: true,
      icon: FileSpreadsheet,
    },
    {
      title: "New Complaint",
      href: "/complaints/new",
      icon: PlusCircle,
    },
    {
      title: "CAPA Management",
      href: "/capa",
      icon: ClipboardCheck,
    },
    {
      title: "Settings (Templates)",
      href: "/settings/investigation-templates",
      icon: SlidersHorizontal,
    },
    {
      title: "Organization & Users",
      onClick: () => openOrganizationProfile(),
      href: "#",
      icon: Users,
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans selection:bg-neutral-800 selection:text-white relative">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out shrink-0 select-none z-50 fixed md:relative inset-y-0 left-0 h-full group/sidebar relative ${
          isSidebarOpen
            ? "w-[250px] translate-x-0 opacity-100 shadow-2xl md:shadow-none"
            : "w-0 -translate-x-full opacity-0 overflow-hidden border-none"
        }`}
      >
        {/* Collapse Button in vertical middle of sidebar on hover */}
        <button
          onClick={toggleSidebar}
          title="Collapse Sidebar"
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:bg-accent hover:text-foreground opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {/* Sidebar Header: Team / Org Selector */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-border">
          <button
            onClick={() => openOrganizationProfile()}
            title="Manage Organization Users & Settings"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors w-full justify-between group"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-xs font-bold text-black shrink-0 shadow-xs">
                {orgSlug.charAt(0).toUpperCase()}
              </div>
              <span className="truncate font-bold text-xs tracking-tight text-foreground">
                {orgSlug}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-mono group-hover:text-foreground">
                Manage
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </div>
          </button>
        </div>

        {/* Search bar inside sidebar */}
        <div className="p-3 pb-1">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Filter menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-muted/40 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            <kbd className="absolute right-2 text-[10px] font-mono text-muted-foreground rounded border border-border px-1 py-0.5 bg-muted">
              F
            </kbd>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1 scrollbar-thin">
          {filteredNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : item.href !== "#" && pathname.startsWith(item.href);

            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full group flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="truncate">{item.title}</span>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href}
                className={`group flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="truncate">{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3.5 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2 truncate">
            <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-medium text-foreground shrink-0">
              {userName ? userName.charAt(0) : userEmail ? userEmail.charAt(0).toUpperCase() : "V"}
            </div>
            <span className="text-xs text-muted-foreground font-medium truncate">
              {userName || userEmail?.split("@")[0] || "admin"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <button className="p-1 hover:text-foreground rounded hover:bg-accent transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <button className="p-1 hover:text-foreground rounded hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card text-card-foreground px-4 shrink-0 relative">
          {/* Header Left Section */}
          <div className="flex items-center gap-3 z-10">
            {/* Expand Sidebar Button (only visible when sidebar is collapsed) */}
            {!isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                title="Expand Sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border border-transparent hover:border-border"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}

            {/* Scope Breadcrumb */}
            <div className={`flex items-center gap-2 ${!isSidebarOpen ? "border-l border-border pl-3" : ""}`}>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors">
                <span>All Projects</span>
                <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Center Section: Dynamic Screen Tab / Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center h-full">
            <span className="text-xs font-semibold text-foreground border-b-2 border-foreground flex items-center h-full px-2 transition-all duration-200">
              {screenTitle}
            </span>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 z-10">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Clerk User Button */}
            <div className="flex items-center pl-1 border-l border-border">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-background text-foreground p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
