import React from "react";
import type { FlowComponent, Screen } from "@/lib/types";
import { StackEditor } from "./editors/stack-editor";
import { FooterEditor } from "./editors/footer-editor";
import { TextEditor } from "./editors/text-editor";
import { ImageEditor } from "./editors/image-editor";
import { VideoEditor } from "./editors/video-editor";
import { IconLibraryEditor } from "./editors/icon-library-editor";
import { ButtonEditor } from "./editors/button-editor";
import { getFallbackEditors } from "./editors/fallback-editors";

export function ComponentPropertyEditor({
  component,
  onUpdateProp,
  screens,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
  screens?: Screen[];
}) {
  if (component.type === "STACK") return <StackEditor component={component} onUpdateProp={onUpdateProp} />;
  if (component.type === "FOOTER") return <FooterEditor component={component} onUpdateProp={onUpdateProp} />;
  if (component.type === "TEXT") return <TextEditor component={component} onUpdateProp={onUpdateProp} />;
  if (component.type === "IMAGE") return <ImageEditor component={component} onUpdateProp={onUpdateProp} />;
  if (component.type === "VIDEO") return <VideoEditor component={component} onUpdateProp={onUpdateProp} />;
  if (component.type === "ICON_LIBRARY") return <IconLibraryEditor component={component} onUpdateProp={onUpdateProp} />;
  if (component.type === "BUTTON") return <ButtonEditor component={component} onUpdateProp={onUpdateProp} screens={screens} />;

  const fallbackEditors = getFallbackEditors(component, onUpdateProp);
  return (
    <div className="flex flex-col gap-4">
      {fallbackEditors[component.type] || (
        <p className="text-xs text-white/30">No editor available</p>
      )}
    </div>
  );
}
