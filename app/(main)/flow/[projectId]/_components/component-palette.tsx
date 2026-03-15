import { COMPONENT_TYPES } from "../_lib/constants";

export function ComponentPalette({ onAdd }: { onAdd: (type: string) => void }) {
  const categories = [...new Set(COMPONENT_TYPES.map((c) => c.category))];

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">{cat}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {COMPONENT_TYPES.filter((c) => c.category === cat).map((comp) => (
              <button
                key={comp.type}
                onClick={() => onAdd(comp.type)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.04] transition-all group"
              >
                <comp.icon size={18} className="text-white/30 group-hover:text-white/60 transition-colors" />
                <span className="text-[10px] font-medium text-white/40 group-hover:text-white/60 transition-colors">{comp.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
