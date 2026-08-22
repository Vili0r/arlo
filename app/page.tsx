import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrgSubdomain } from "@/lib/tenant";
import {
  Shield,
  Building2,
  ArrowRight,
  FileSpreadsheet,
  ClipboardCheck,
  History,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const authContext = await auth();
  const { userId, orgId, orgRole } = authContext;

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  // If user is authenticated and belongs to an active org, compute name-based subdomain and redirect
  if (userId && orgId) {
    const orgSubdomain = await getOrgSubdomain(orgId);
    if (orgSubdomain) {
      const workspaceUrl = `http://${orgSubdomain}.${rootDomain}`;
      redirect(workspaceUrl);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">Arlo</span>
              <span className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                PMS & 21 CFR Part 11
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Show when="signed-in">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/"
                afterSelectOrganizationUrl="/"
              />
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton>
                <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 justify-center">
        <Show when="signed-out">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Post-Market Surveillance & Quality Tracker
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Regulatory-grade multi-tenant platform for Medical Device
              Manufacturers. Enforcing strict tenant isolation, ISO 13485
              separation of duties, and FDA 21 CFR Part 11 electronic records.
            </p>
            <div className="pt-4 flex justify-center">
              <SignInButton>
                <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Access Quality Portal
                </button>
              </SignInButton>
            </div>
          </div>
        </Show>

        <Show when="signed-in">
          {/* User is signed in but has not chosen an organization yet */}
          <div className="mx-auto max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 p-8 text-center space-y-4">
            <Building2 className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">
              Select or Create Your Organization
            </h2>
            <p className="text-xs text-muted-foreground">
              To route you to your dedicated organization subdomain workspace with
              tenant isolation, please select or create an Organization.
            </p>
            <div className="pt-2 flex justify-center">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/"
                afterSelectOrganizationUrl="/"
              />
            </div>
          </div>
        </Show>
      </main>
    </div>
  );
}
