import { Metadata } from "next";
import { getInstanceBaseline, getReleaseManifest } from "@/actions/assurance/baseline";
import { SoftwareAssuranceView } from "@/components/assurance/software-assurance-view";

interface AssurancePageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({
  params,
}: AssurancePageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  return {
    title: `Software Assurance & Validation - ${orgSlug}`,
    description: "Customer-facing validation support pack, automated verification receipts, and live configuration baseline.",
  };
}

export default async function SoftwareAssurancePage({ params }: AssurancePageProps) {
  const { orgSlug } = await params;
  const [baseline, releaseManifest] = await Promise.all([
    getInstanceBaseline(orgSlug),
    getReleaseManifest("1.0.0"),
  ]);

  return (
    <SoftwareAssuranceView
      baseline={baseline}
      releaseManifest={releaseManifest}
      orgSlug={orgSlug}
    />
  );
}
