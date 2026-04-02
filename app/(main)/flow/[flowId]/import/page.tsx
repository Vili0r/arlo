import { notFound } from "next/navigation";

import { getFlow } from "../actions";
import { flowConfigToEditorDocument } from "../_lib/editor-document";
import { DEFAULT_FLOW_CONFIG } from "../_lib/default-flow-config";
import { resolveTargetScreenIndex } from "../_lib/import-flow";

import { ImportPageClient } from "./import-page-client";

export default async function FlowImportPage(props: {
  params: Promise<{ flowId: string }>;
  searchParams?: Promise<{ tab?: string; screenIndex?: string }>;
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
  const currentScreenName = resolvedDocument.screens[screenIndex]?.name ?? "Untitled";
  const initialTab = searchParams?.tab === "code" ? "code" : "figma";

  return (
    <ImportPageClient
      flowId={flowId}
      currentScreenName={currentScreenName}
      screenIndex={screenIndex}
      initialTab={initialTab}
    />
  );
}
