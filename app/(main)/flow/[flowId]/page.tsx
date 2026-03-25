import { getFlow } from "./actions";
import { FlowBuilderClient } from "./_components/flow-builder-client";
import { notFound } from "next/navigation";

export default async function FlowBuilderPage(props: { params: Promise<{ flowId: string }> }) {
  const params = await props.params;
  const flowId = params.flowId;
  
  if (!flowId) {
    notFound();
  }

  const { config, projectId, registryKeys } = await getFlow(flowId);

  return (
    <FlowBuilderClient
      flowId={flowId}
      initialData={config}
      initialProjectId={projectId}
      registryKeys={registryKeys}
    />
  );
}
