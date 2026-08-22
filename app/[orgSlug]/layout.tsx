import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";

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
  const user = await currentUser();

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  if (!userId) {
    redirect(`http://${rootDomain}/sign-in?redirect_url=http://${orgSlug}.${rootDomain}/`);
  }

  if (!orgId) {
    redirect(`http://${rootDomain}/`);
  }

  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : null;

  return (
    <WorkspaceShell
      orgSlug={orgSlug}
      orgRole={orgRole}
      userEmail={primaryEmail}
      userName={fullName}
      userImageUrl={user?.imageUrl}
    >
      {children}
    </WorkspaceShell>
  );
}
