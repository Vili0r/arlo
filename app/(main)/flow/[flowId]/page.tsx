import { getFlow } from "./actions";
import { FlowBuilderClient } from "./_components/flow-builder-client";
import { notFound } from "next/navigation";

export default async function FlowBuilderPage(props: {
  params: Promise<{ flowId: string }>;
  searchParams?: Promise<{ openImport?: string }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const flowId = params.flowId;
  
  if (!flowId) {
    notFound();
  }

  const { config, projectId, registryKeys, developmentVersion, productionVersion } =
    await getFlow(flowId);

  return (
    <FlowBuilderClient
      flowId={flowId}
      initialData={config}
      initialProjectId={projectId}
      initialDevelopmentVersion={developmentVersion}
      initialProductionVersion={productionVersion}
      registryKeys={registryKeys}
      initialOpenImportSource={searchParams?.openImport === "figma" ? "figma" : null}
    />
  );
}
