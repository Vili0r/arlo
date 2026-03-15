import { X, Trash2 } from "lucide-react";
import type { FlowComponent } from "@/lib/types";
import { COMPONENT_TYPES, COLOR_MAP } from "../_lib/constants";
import { ComponentPropertyEditor } from "./component-property-editor";

export function PropertySheet({
  open,
  component,
  onClose,
  onDelete,
  onUpdateProp,
}: {
  open: boolean;
  component: FlowComponent | null;
  onClose: () => void;
  onDelete?: () => void;
  onUpdateProp?: (key: string, value: unknown) => void;
}) {
  const meta = component ? COMPONENT_TYPES.find((c) => c.type === component.type) : null;
  const colors = meta ? COLOR_MAP[meta.color] || COLOR_MAP["blue"] : COLOR_MAP["blue"];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-[#0e0e10] border-l border-white/[0.08] shadow-[-8px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 380 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <span className="text-[15px] font-bold text-white">
            {meta?.label || "Component"} properties
          </span>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {component && onUpdateProp ? (
            <ComponentPropertyEditor component={component} onUpdateProp={onUpdateProp} />
          ) : (
            <p className="text-xs text-white/30 text-center mt-8">Select a component to edit</p>
          )}
        </div>
      </div>
    </>
  );
}