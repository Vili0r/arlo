import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardCheck,
  History,
  Building2,
  Lock,
} from "lucide-react";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { orgSlug } = await params;
  const { userId, orgId, orgRole } = await auth();

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  if (!userId) {
    redirect(`http://${rootDomain}/sign-in?redirect_url=http://${orgSlug}.${rootDomain}/`);
  }

  if (!orgId) {
    redirect(`http://${rootDomain}/`);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block">
                Arlo Quality
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                PMS & Compliance
              </span>
            </div>
          </div>

          {/* Org info card */}
          <div className="p-3.5 m-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground truncate">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{orgSlug.toUpperCase()}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                {orgRole ?? "org:member"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <Lock className="h-2.5 w-2.5" /> Isolated
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>

            <Link
              href="/complaints"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Complaints (PMS)
            </Link>

            <Link
              href="/capa"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ClipboardCheck className="h-4 w-4" />
              CAPA Management
            </Link>

            <Link
              href="/audit-trail"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <History className="h-4 w-4" />
              Audit Trail (21 CFR Part 11)
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3 text-[11px] text-muted-foreground text-center font-mono">
          ISO 13485 & FDA Validated
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Tenant: <code className="font-mono text-foreground font-semibold">{orgSlug}</code>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl={`http://${rootDomain}/`}
              afterSelectOrganizationUrl={`http://${rootDomain}/`}
            />
            <UserButton />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
