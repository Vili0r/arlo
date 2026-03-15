import { GripVertical, Layers, ChevronRight } from "lucide-react";
import type { Screen } from "@/lib/types";
import { COMPONENT_TYPES } from "../_lib/constants";

export function ScreensList({
  screens,
  selectedIndex,
  onSelect,
  selectedComponentId,
  onSelectComponent,
}: {
  screens: Screen[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDeleteScreen: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {screens.map((screen, index) => (
        <div key={screen.id}>
          <button
            onClick={() => {
              onSelect(index);
              onSelectComponent(null);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
              selectedIndex === index && !selectedComponentId
                ? "bg-white/[0.08] text-white"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
            }`}
          >
            <GripVertical size={12} className="text-white/20 shrink-0" />
            <Layers size={13} className="shrink-0" />
            <span className="text-xs font-medium truncate">{screen.name}</span>
            <span className="text-[10px] text-white/30 ml-auto">{screen.components.length}</span>
          </button>
          {selectedIndex === index && screen.components.length > 0 && (
            <div className="ml-5 pl-3 border-l border-white/[0.08] mt-0.5 mb-1">
              {[...screen.components].sort((a, b) => a.order - b.order).map((comp) => {
                const meta = COMPONENT_TYPES.find((c) => c.type === comp.type);
                return (
                  <button
                    key={comp.id}
                    onClick={() => onSelectComponent(comp.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                      selectedComponentId === comp.id
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                    }`}
                  >
                    {meta && <meta.icon size={11} className="shrink-0 opacity-50" />}
                    <span className="text-[11px] truncate">{meta?.label || comp.type}</span>
                    <ChevronRight size={10} className="ml-auto text-white/15" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
