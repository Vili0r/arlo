import { requireOrgAuth } from "@/lib/auth-guard";
import { CustomizeInsightsClient } from "@/components/settings/customize-insights-client";

interface CustomizeInsightsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CustomizeInsightsPage({
  params,
}: CustomizeInsightsPageProps) {
  const { orgSlug } = await params;
  const { userId, orgRole } = await requireOrgAuth();

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Customize Insights</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Personalize your workspace overview cards and real-time operational insights.
            </p>
          </div>
        </div>
        <CustomizeInsightsClient
          userId={userId}
          orgSlug={orgSlug}
          orgRole={orgRole}
        />
      </div>
    </div>
  );
}
