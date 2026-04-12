import { getFlow } from "./actions";
import { flowConfigToEditorDocument } from "./_lib/editor-document";
import { DEFAULT_FLOW_CONFIG } from "./_lib/default-flow-config";
import { resolveTargetScreenIndex } from "./_lib/import-flow";
import { FlowBuilderClient } from "./_components/flow-builder-client";
import { notFound } from "next/navigation";

export default async function FlowBuilderPage(props: {
  params: Promise<{ flowId: string }>;
  searchParams?: Promise<{ screenIndex?: string }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const flowId = params.flowId;

  if (!flowId) {
    notFound();
  }

  const { document, slug, projectId, registryKeys, developmentVersion, productionVersion } =
    await getFlow(flowId);
  const resolvedDocument = document ?? flowConfigToEditorDocument(DEFAULT_FLOW_CONFIG);
  const parsedScreenIndex = Number.parseInt(searchParams?.screenIndex ?? "", 10);
  const initialSelectedScreenIndex = resolveTargetScreenIndex(
    Number.isNaN(parsedScreenIndex) ? undefined : parsedScreenIndex,
    resolvedDocument.screens.length,
  );

  return (
    <FlowBuilderClient
      flowId={flowId}
      initialFlowSlug={slug}
      initialDocument={document}
      initialProjectId={projectId}
      initialDevelopmentVersion={developmentVersion}
      initialProductionVersion={productionVersion}
      registryKeys={registryKeys}
      initialSelectedScreenIndex={initialSelectedScreenIndex}
    />
  );
}
