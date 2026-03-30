import React from "react";
import type { EditorScreen, EditorNode, EditorComponentNode, EditorGroupNode } from "../_lib/editor-document";
import { PhonePreviewComponent } from "./phone-preview";
import { InlineTextEditor } from "./inline-text-editor";
import { AnimatedWrapper } from "./animated-wrapper";

interface NodeRendererProps {
  screen: EditorScreen;
  screenIndex: number;
  nodeId: string;
  selectedComponentId?: string | null;
  onSelectComponent: (id: string | null) => void;
  previewTransforms?: Record<string, Partial<EditorNode['transform']>>;
  registerNode: (id: string, element: HTMLDivElement | null) => void;
  inlineTextEdit: { screenIndex: number; nodeId: string } | null;
  setInlineTextEdit: (state: { screenIndex: number; nodeId: string } | null) => void;
  beginInlineTextEdit: (screenIndex: number, nodeId: string) => void;
  updateComponentProp: (componentId: string, key: string, value: unknown) => void;
}

export function NodeRenderer({
  screen,
  screenIndex,
  nodeId,
  selectedComponentId,
  onSelectComponent,
  previewTransforms = {},
  registerNode,
  inlineTextEdit,
  setInlineTextEdit,
  beginInlineTextEdit,
  updateComponentProp,
}: NodeRendererProps) {
  const node = screen.nodes[nodeId];
  if (!node) return null;

  const transientLayout = previewTransforms[nodeId];
  const layout = {
    x: transientLayout?.x ?? node.transform.x ?? 0,
    y: transientLayout?.y ?? node.transform.y ?? 0,
    width: transientLayout?.width ?? node.transform.width,
    height: transientLayout?.height ?? node.transform.height,
    rotation: transientLayout?.rotation ?? node.transform.rotation ?? 0,
    zIndex: transientLayout?.zIndex ?? node.transform.zIndex ?? 0,
    visible: node.visible,
  };

  if (!layout.visible) return null;

  const isEditing = inlineTextEdit?.screenIndex === screenIndex && inlineTextEdit.nodeId === nodeId;

  // Render Component Node
  if (node.kind === "component") {
    return (
      <div
        ref={(el) => registerNode(node.id, el)}
        data-node-id={node.id}
        className={screen.layoutMode === "absolute" ? "pointer-events-none absolute left-0 top-0" : "relative"}
        style={
          screen.layoutMode === "absolute"
            ? {
                width: layout.width ?? undefined,
                height: layout.height ?? undefined,
                zIndex: layout.zIndex,
                transform: `translate3d(${layout.x}px, ${layout.y}px, 0px)`,
                transformOrigin: "top left",
              }
            : undefined
        }
      >
        <div
          style={{
            width: layout.width ? "100%" : undefined,
            height: layout.height ? "100%" : undefined,
            transform: layout.rotation ? `rotate(${layout.rotation}deg)` : undefined,
            transformOrigin: "center center",
          }}
        >
          {isEditing && node.component.type === "TEXT" ? (
            <div className="pointer-events-auto">
              <InlineTextEditor
                component={node.component}
                onCommit={(nextValue) => {
                  updateComponentProp(node.component.id, "content", nextValue);
                  setInlineTextEdit(null);
                }}
                onCancel={() => setInlineTextEdit(null)}
              />
            </div>
          ) : (
            <AnimatedWrapper componentId={node.component.id} animation={node.component.animation} screenIndex={screenIndex}>
              <div className="pointer-events-auto">
                <PhonePreviewComponent
                  component={node.component}
                  isSelected={false} // Selection is handled by Interaction Layer
                  onSelect={() => {}}
                  onDoubleClick={() => {
                    if (node.component.type === "TEXT") {
                      beginInlineTextEdit(screenIndex, node.component.id);
                    }
                  }}
                />
              </div>
            </AnimatedWrapper>
          )}
        </div>
      </div>
    );
  }

  // Render Group Node (Auto Layout or Container)
  if (node.kind === "group") {
    const isAutoLayout = node.layoutMode === "auto";
    
    return (
      <div
        ref={(el) => registerNode(node.id, el)}
        data-group-id={node.id}
        className={screen.layoutMode === "absolute" ? "pointer-events-none absolute left-0 top-0" : "relative"}
        style={
          screen.layoutMode === "absolute"
            ? {
                width: layout.width ?? "100%",
                height: layout.height ?? "auto",
                zIndex: layout.zIndex,
                transform: `translate3d(${layout.x}px, ${layout.y}px, 0px)`,
                transformOrigin: "top left",
                display: isAutoLayout ? "flex" : "block",
                flexDirection: "column", // TODO: Read from constraints/props
                gap: 12,
              }
            : {
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }
        }
      >
        {node.childIds.map((childId) => (
          <NodeRenderer
            key={childId}
            screen={screen}
            screenIndex={screenIndex}
            nodeId={childId}
            selectedComponentId={selectedComponentId}
            onSelectComponent={onSelectComponent}
            previewTransforms={previewTransforms}
            registerNode={registerNode}
            inlineTextEdit={inlineTextEdit}
            setInlineTextEdit={setInlineTextEdit}
            beginInlineTextEdit={beginInlineTextEdit}
            updateComponentProp={updateComponentProp}
          />
        ))}
      </div>
    );
  }

  return null;
}
