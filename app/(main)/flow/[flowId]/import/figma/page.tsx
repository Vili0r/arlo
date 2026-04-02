import { notFound } from "next/navigation";

import { getFlow } from "../../actions";
import { flowConfigToEditorDocument } from "../../_lib/editor-document";
import { DEFAULT_FLOW_CONFIG } from "../../_lib/default-flow-config";
import { resolveTargetScreenIndex } from "../../_lib/import-flow";

import { FigmaImportPageClient } from "./figma-import-page-client";

export default async function FlowFigmaImportPage(props: {
  params: Promise<{ flowId: string }>;
  searchParams?: Promise<{ screenIndex?: string }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const flowId = params.flowId;

  if (!flowId) {
    notFound();
  }

  const { document } = await getFlow(flowId);
  const resolvedDocument = document ?? flowConfigToEditorDocument(DEFAULT_FLOW_CONFIG);
  const requestedScreenIndex = Number.parseInt(searchParams?.screenIndex ?? "", 10);
  const screenIndex = resolveTargetScreenIndex(
    Number.isNaN(requestedScreenIndex) ? undefined : requestedScreenIndex,
    resolvedDocument.screens.length,
  );

  const currentScreen = resolvedDocument.screens[screenIndex];
  const figmaSource = currentScreen?.source.kind === "imported-figma" ? currentScreen.source : null;

  return (
    <FigmaImportPageClient
      flowId={flowId}
      currentScreenName={currentScreen?.name ?? "Untitled"}
      screenIndex={screenIndex}
      initialSource={figmaSource?.sourceUrl ?? ""}
      hasImportedSource={Boolean(figmaSource)}
      lastSyncedAt={figmaSource?.lastSyncedAt ?? null}
      fileName={figmaSource?.fileName ?? null}
      nodeName={figmaSource?.nodeName ?? null}
    />
  );
}
