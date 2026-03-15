import { Image, Smile, Rows3, Star, Check, Award, icons } from "lucide-react";
import type { FlowComponent } from "@/lib/types";

function AwardPreview({ props: p }: { props: Record<string, any> }) {
  const Laurel = ({ side }: { side: "left" | "right" }) => (
    <svg width="28" height="48" viewBox="0 0 28 48" fill="none" style={{ transform: side === "right" ? "scaleX(-1)" : undefined, opacity: 0.35 }}>
      <path d="M14 4C10 10 4 16 4 24C4 32 8 38 14 44" stroke={p.textColor || "#fff"} strokeWidth="1.5" fill="none" />
      {[8, 14, 20, 26, 32].map((y) => (
        <ellipse key={y} cx="8" cy={y} rx="5" ry="3" fill={p.textColor || "#fff"} opacity="0.25" transform={`rotate(-30 8 ${y})`} />
      ))}
    </svg>
  );

  if (p.variant === "laurel") {
    return (
      <div className="flex flex-col items-center py-4 px-3 rounded-2xl" style={{ backgroundColor: p.backgroundColor || "#1C1C1E" }}>
        <div className="flex items-center gap-1">
          <Laurel side="left" />
          <div className="text-center px-1">
            {p.issuer && (
              <p className="text-[9px] uppercase tracking-widest mb-1 opacity-50" style={{ color: p.textColor || "#fff" }}>
                {p.issuer}
              </p>
            )}
            <p className="text-sm font-bold leading-tight" style={{ color: p.textColor || "#fff" }}>
              {p.title}
            </p>
            <p className="text-[10px] mt-0.5 opacity-50" style={{ color: p.textColor || "#fff" }}>
              {p.subtitle}
            </p>
          </div>
          <Laurel side="right" />
        </div>
      </div>
    );
  }

  if (p.variant === "minimal") {
    return (
      <div className="flex items-center gap-3 py-3 px-4 rounded-2xl" style={{ backgroundColor: p.backgroundColor || "#1C1C1E" }}>
        <Award size={18} style={{ color: p.textColor || "#fff" }} className="opacity-50 shrink-0" />
        <div>
          <p className="text-xs font-semibold" style={{ color: p.textColor || "#fff" }}>
            {p.title}
          </p>
          <p className="text-[10px] opacity-50" style={{ color: p.textColor || "#fff" }}>
            {p.subtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ backgroundColor: p.backgroundColor || "#1C1C1E" }}>
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Award size={20} style={{ color: p.textColor || "#fff" }} className="opacity-70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate" style={{ color: p.textColor || "#fff" }}>
          {p.title}
        </p>
        <p className="text-[10px] opacity-50 truncate" style={{ color: p.textColor || "#fff" }}>
          {p.subtitle}
        </p>
      </div>
      {p.showLaurels && (
        <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 opacity-30">
          <path d="M10 2L12 7H18L13 10.5L14.5 16L10 12.5L5.5 16L7 10.5L2 7H8Z" fill={p.textColor || "#fff"} />
        </svg>
      )}
    </div>
  );
}

export function PhonePreviewComponent({
  component,
  isSelected,
  onSelect,
}: {
  component: FlowComponent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const p = component.props as Record<string, any>;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`rounded-xl cursor-pointer transition-all duration-150 ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white" : "hover:ring-1 hover:ring-gray-200"
      }`}
    >
      {component.type === "TEXT" && (
        <p
          style={{
            fontSize: p.fontSize || 16,
            fontWeight: p.fontWeight || "normal",
            color: p.color || "#1A1A1A",
            textAlign: (p.textAlign as React.CSSProperties["textAlign"]) || "left",
          }}
        >
          {p.content}
        </p>
      )}

      {component.type === "IMAGE" && (
        <div
          className="bg-gray-100 rounded-xl flex items-center justify-center"
          style={{ height: p.height || 150, borderRadius: p.borderRadius || 12 }}
        >
          {p.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.src} className="w-full h-full object-cover" style={{ borderRadius: p.borderRadius || 12 }} alt="" />
          ) : (
            <Image size={24} className="text-gray-300" />
          )}
        </div>
      )}

      {component.type === "VIDEO" && (
        <div
          className="bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden"
          style={{ height: p.height || 200, borderRadius: p.borderRadius || 12 }}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
          </div>
          <span className="absolute bottom-2 left-3 text-[10px] text-white/50 font-medium">Video</span>
        </div>
      )}

      {component.type === "ICON_LIBRARY" && (() => {
        const LucideIcon = (icons as any)[p.iconName] || Smile;
        return (
          <div
            className="flex items-center justify-center"
            style={{
              backgroundColor: p.backgroundColor || "transparent",
              width: p.width,
              height: p.height,
              paddingTop: p.paddingVertical || 0,
              paddingBottom: p.paddingVertical || 0,
              paddingLeft: p.paddingHorizontal || 0,
              paddingRight: p.paddingHorizontal || 0,
              marginTop: p.marginVertical || 0,
              marginBottom: p.marginVertical || 0,
              marginLeft: p.marginHorizontal || 0,
              marginRight: p.marginHorizontal || 0,
            }}
          >
            <LucideIcon
              size={p.size || 32}
              style={{
                color: p.color || "#007AFF",
                opacity: p.opacity ?? 1
              }}
            />
          </div>
        );
      })()}

      {component.type === "STACK" && (
        <div
          className="rounded-xl border-2 border-dashed border-gray-200 p-3"
          style={{ backgroundColor: p.backgroundColor || "#F8F8F8", borderRadius: p.borderRadius || 16 }}
        >
          <div className="flex items-center justify-center gap-1 py-4">
            <Rows3 size={16} className="text-gray-300" />
            <span className="text-xs text-gray-400 font-medium">Stack ({p.direction})</span>
          </div>
        </div>
      )}

      {component.type === "FOOTER" && (
        <div className="mt-2">
          {p.showDivider && <div className="h-px bg-gray-200 mb-3" />}
          <p className="text-center" style={{ fontSize: p.fontSize || 12, color: p.textColor || "#999" }}>
            {p.text}
          </p>
        </div>
      )}

      {component.type === "TAB_BUTTON" && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {p.tabs?.map((tab: { id: string; label: string; active: boolean }) => (
            <div
              key={tab.id}
              className="flex-1 text-center py-2 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: tab.active ? "white" : "transparent",
                color: tab.active ? p.activeColor || "#007AFF" : p.inactiveColor || "#999",
                boxShadow: tab.active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
      )}

      {component.type === "BUTTON" && (
        <div
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-center"
          style={{
            backgroundColor: p.style?.backgroundColor || "#007AFF",
            color: p.style?.textColor || "#FFF",
            borderRadius: p.style?.borderRadius || 12,
          }}
        >
          {p.label}
        </div>
      )}

      {component.type === "TEXT_INPUT" && (
        <div className="border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-400">{p.placeholder || "Enter text..."}</p>
        </div>
      )}

      {component.type === "SINGLE_SELECT" && (
        <div className="space-y-2">
          {p.label && <p className="text-sm font-medium text-gray-700">{p.label}</p>}
          {p.options?.map((opt: { id: string; label: string }) => (
            <div key={opt.id} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600">
              {opt.label}
            </div>
          ))}
        </div>
      )}

      {component.type === "MULTI_SELECT" && (
        <div className="space-y-2">
          {p.label && <p className="text-sm font-medium text-gray-700">{p.label}</p>}
          <div className="flex flex-wrap gap-2">
            {p.options?.map((opt: { id: string; label: string }) => (
              <div key={opt.id} className="border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600">
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {component.type === "SLIDER" && (
        <div className="space-y-2">
          {p.label && <p className="text-sm font-medium text-gray-700">{p.label}</p>}
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-full w-1/2 bg-blue-500 rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{p.min}</span>
            <span>{p.max}</span>
          </div>
        </div>
      )}

      {component.type === "CAROUSEL" && (
        <div>
          <div className="flex gap-2 overflow-hidden" style={{ height: p.height || 180 }}>
            {p.items?.map((item: { id: string; title: string; subtitle: string }, i: number) => (
              <div
                key={item.id}
                className="shrink-0 w-[85%] rounded-2xl flex flex-col items-center justify-center"
                style={{ borderRadius: p.borderRadius || 16, backgroundColor: i === 0 ? "#F0F0F5" : "#E8E8ED" }}
              >
                <Image size={20} className="text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-500">{item.title}</p>
                {p.variant === "card" && <p className="text-[10px] text-gray-400 mt-0.5">{item.subtitle}</p>}
              </div>
            ))}
          </div>
          {p.showDots && (
            <div className="flex justify-center gap-1.5 mt-2">
              {p.items?.map((_: unknown, i: number) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-gray-600" : "bg-gray-300"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {component.type === "SOCIAL_PROOF" && (
        <div className="space-y-3">
          {p.showStars && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.floor(p.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-800">{p.rating}</span>
              <span className="text-xs text-gray-400">({(p.totalReviews || 0).toLocaleString()})</span>
            </div>
          )}
          {!p.compact &&
            p.reviews?.map((rev: { id: string; author: string; rating: number; text: string }) => (
              <div key={rev.id} className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {rev.author?.[0]}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{rev.author}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={9} className={s <= (rev.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{rev.text}</p>
              </div>
            ))}
        </div>
      )}

      {component.type === "FEATURE_LIST" && (
        <div className="space-y-2.5">
          {p.title && (
            <p className="text-sm font-semibold" style={{ color: p.textColor || "#1A1A1A" }}>
              {p.title}
            </p>
          )}
          {p.features?.map((f: { id: string; label: string }) => (
            <div key={f.id} className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                style={{ backgroundColor: (p.iconColor || "#34C759") + "18" }}
              >
                <Check size={11} style={{ color: p.iconColor || "#34C759" }} strokeWidth={3} />
              </div>
              <span className="text-sm leading-snug" style={{ color: p.textColor || "#1A1A1A" }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {component.type === "AWARD" && <AwardPreview props={p} />}
    </div>
  );
}
