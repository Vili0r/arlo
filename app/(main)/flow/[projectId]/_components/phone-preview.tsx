import { Image, Smile, Rows3, Star, Check, Award, icons } from "lucide-react";
import type { FlowComponent } from "@/lib/types";

/* ────────────────────────────────────────────────────────────
   Font family mapping — converts our select values to CSS
   ──────────────────────────────────────────────────────────── */
const FONT_FAMILY_MAP: Record<string, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, monospace',
  rounded:
    '"SF Pro Rounded", "Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
};

/* ────────────────────────────────────────────────────────────
   Helper: resolve individual spacing values from props
   (supports both old vertical/horizontal and new individual)
   ──────────────────────────────────────────────────────────── */
function getSpacing(
  p: Record<string, any>,
  prefix: "padding" | "margin"
): { top: number; right: number; bottom: number; left: number } {
  if (
    p[`${prefix}Top`] !== undefined ||
    p[`${prefix}Right`] !== undefined ||
    p[`${prefix}Bottom`] !== undefined ||
    p[`${prefix}Left`] !== undefined
  ) {
    return {
      top: p[`${prefix}Top`] ?? 0,
      right: p[`${prefix}Right`] ?? 0,
      bottom: p[`${prefix}Bottom`] ?? 0,
      left: p[`${prefix}Left`] ?? 0,
    };
  }
  const v = p[`${prefix}Vertical`] ?? 0;
  const h = p[`${prefix}Horizontal`] ?? 0;
  return { top: v, right: h, bottom: v, left: h };
}

/* ────────────────────────────────────────────────────────────
   Helper: compute width style based on widthMode
   ──────────────────────────────────────────────────────────── */
function getWidthStyle(p: Record<string, any>): React.CSSProperties {
  const mode = p.widthMode || "fill";
  if (mode === "fill") return { width: "100%" };
  if (mode === "fixed") return { width: p.fixedWidth || 200 };
  return { width: "fit-content" }; // fit
}

/* ────────────────────────────────────────────────────────────
   Helper: compute height style based on heightMode
   ──────────────────────────────────────────────────────────── */
function getHeightStyle(p: Record<string, any>): React.CSSProperties {
  const mode = p.heightMode || "fit";
  if (mode === "fill") return { height: "100%" };
  if (mode === "fixed") return { height: p.fixedHeight || 100 };
  return { height: "auto" }; // fit
}

/* ────────────────────────────────────────────────────────────
   Helper: compute box shadow from shadow props
   ──────────────────────────────────────────────────────────── */
function getBoxShadow(p: Record<string, any>): string | undefined {
  const x = p.shadowX ?? 0;
  const y = p.shadowY ?? 0;
  const blur = p.shadowBlur ?? 0;
  const color = p.shadowColor || "rgba(0,0,0,0.2)";
  if (x === 0 && y === 0 && blur === 0) return undefined;
  return `${x}px ${y}px ${blur}px ${color}`;
}

/* ════════════════════════════════════════════════════════════
   AWARD PREVIEW (unchanged)
   ════════════════════════════════════════════════════════════ */
function AwardPreview({ props: p }: { props: Record<string, any> }) {
  const Laurel = ({ side }: { side: "left" | "right" }) => (
    <svg
      width="28"
      height="48"
      viewBox="0 0 28 48"
      fill="none"
      style={{
        transform: side === "right" ? "scaleX(-1)" : undefined,
        opacity: 0.35,
      }}
    >
      <path
        d="M14 4C10 10 4 16 4 24C4 32 8 38 14 44"
        stroke={p.textColor || "#fff"}
        strokeWidth="1.5"
        fill="none"
      />
      {[8, 14, 20, 26, 32].map((y) => (
        <ellipse
          key={y}
          cx="8"
          cy={y}
          rx="5"
          ry="3"
          fill={p.textColor || "#fff"}
          opacity="0.25"
          transform={`rotate(-30 8 ${y})`}
        />
      ))}
    </svg>
  );

  if (p.variant === "laurel") {
    return (
      <div
        className="flex flex-col items-center py-4 px-3 rounded-2xl"
        style={{ backgroundColor: p.backgroundColor || "#1C1C1E" }}
      >
        <div className="flex items-center gap-1">
          <Laurel side="left" />
          <div className="text-center px-1">
            {p.issuer && (
              <p
                className="text-[9px] uppercase tracking-widest mb-1 opacity-50"
                style={{ color: p.textColor || "#fff" }}
              >
                {p.issuer}
              </p>
            )}
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: p.textColor || "#fff" }}
            >
              {p.title}
            </p>
            <p
              className="text-[10px] mt-0.5 opacity-50"
              style={{ color: p.textColor || "#fff" }}
            >
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
      <div
        className="flex items-center gap-3 py-3 px-4 rounded-2xl"
        style={{ backgroundColor: p.backgroundColor || "#1C1C1E" }}
      >
        <Award
          size={18}
          style={{ color: p.textColor || "#fff" }}
          className="opacity-50 shrink-0"
        />
        <div>
          <p
            className="text-xs font-semibold"
            style={{ color: p.textColor || "#fff" }}
          >
            {p.title}
          </p>
          <p
            className="text-[10px] opacity-50"
            style={{ color: p.textColor || "#fff" }}
          >
            {p.subtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-2xl"
      style={{ backgroundColor: p.backgroundColor || "#1C1C1E" }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Award
          size={20}
          style={{ color: p.textColor || "#fff" }}
          className="opacity-70"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-bold truncate"
          style={{ color: p.textColor || "#fff" }}
        >
          {p.title}
        </p>
        <p
          className="text-[10px] opacity-50 truncate"
          style={{ color: p.textColor || "#fff" }}
        >
          {p.subtitle}
        </p>
      </div>
      {p.showLaurels && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="shrink-0 opacity-30"
        >
          <path
            d="M10 2L12 7H18L13 10.5L14.5 16L10 12.5L5.5 16L7 10.5L2 7H8Z"
            fill={p.textColor || "#fff"}
          />
        </svg>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PHONE PREVIEW COMPONENT
   ════════════════════════════════════════════════════════════ */
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

  // Compute outer margin for the wrapper
  const outerMarginStyle: React.CSSProperties =
    component.type === "TEXT" || component.type === "IMAGE" || component.type === "VIDEO" || component.type === "ICON_LIBRARY" || component.type === "STACK" || component.type === "BUTTON"
      ? (() => {
          const m = getSpacing(p, "margin");
          return {
            marginTop: m.top || undefined,
            marginRight: m.right || undefined,
            marginBottom: m.bottom || undefined,
            marginLeft: m.left || undefined,
          };
        })()
      : {};

  // ICON_LIBRARY should wrap tightly — selection ring only around icon, not full width
  const wrapperFit = component.type === "ICON_LIBRARY" ? "w-fit" : "";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={outerMarginStyle}
      className={`rounded-xl cursor-pointer transition-all duration-150 ${wrapperFit} ${
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
          : "hover:ring-1 hover:ring-gray-200"
      }`}
    >
      {/* ════════════════════════════════════════════════
          TEXT — ★ FULLY REFLECTIVE on device
          ════════════════════════════════════════════════ */}
      {component.type === "TEXT" && (() => {
        const padding = getSpacing(p, "padding");
        const fontFamily = FONT_FAMILY_MAP[p.fontFamily || "system"];
        const lineHeight =
          p.lineHeight && p.lineHeight > 0
            ? `${p.lineHeight}px`
            : undefined;
        const letterSpacing =
          p.letterSpacing && p.letterSpacing !== 0
            ? `${p.letterSpacing}px`
            : undefined;
        const bgColor = p.backgroundColor || "transparent";
        const borderRadius = p.borderRadius ?? 0;
        const borderWidth = p.borderWidth ?? 0;
        const borderColor = p.borderColor || "#000000";
        const opacity =
          p.opacity !== undefined && p.opacity !== 100
            ? p.opacity / 100
            : undefined;
        const boxShadow = getBoxShadow(p);

        return (
          <div
            style={{
              // Width & height
              ...getWidthStyle(p),
              ...getHeightStyle(p),
              // Background
              backgroundColor: bgColor !== "transparent" ? bgColor : undefined,
              // Border
              borderRadius: borderRadius > 0 ? borderRadius : undefined,
              border:
                borderWidth > 0
                  ? `${borderWidth}px solid ${borderColor}`
                  : undefined,
              // Shadow
              boxShadow,
              // Opacity
              opacity,
              // Overflow for border-radius clipping
              overflow: borderRadius > 0 ? "hidden" : undefined,
            }}
          >
            <p
              style={{
                // Padding (inner)
                paddingTop: padding.top,
                paddingRight: padding.right,
                paddingBottom: padding.bottom,
                paddingLeft: padding.left,
                // Typography
                fontSize: p.fontSize || 16,
                fontWeight: p.fontWeight || "normal",
                fontFamily,
                color: p.color || "#1A1A1A",
                textAlign:
                  (p.textAlign as React.CSSProperties["textAlign"]) || "left",
                lineHeight,
                letterSpacing,
                // Reset
                margin: 0,
                // Ensure long text wraps
                wordBreak: "break-word",
              }}
            >
              {p.content}
            </p>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════
          IMAGE — ★ FULLY REFLECTIVE on device
          ════════════════════════════════════════════════ */}
      {component.type === "IMAGE" && (() => {
        const padding = getSpacing(p, "padding");
        const borderRadius =
          p.maskShape === "circle"
            ? "50%"
            : p.maskShape === "rounded"
              ? 16
              : p.borderRadius || 12;
        const borderWidth = p.borderWidth ?? 0;
        const borderColor = p.borderColor || "#000000";
        const boxShadow = getBoxShadow(p);
        const overlayOpacity = (p.overlayOpacity ?? 0) / 100;
        const overlayColor = p.overlayColor || "#000000";
        const fitMode = p.fitMode || "cover";
        const objectFit =
          fitMode === "fit"
            ? "contain"
            : (fitMode as React.CSSProperties["objectFit"]);

        // Height: fixed by default for images
        const heightMode = p.heightMode || "fixed";
        const height =
          heightMode === "fixed"
            ? p.height || 200
            : heightMode === "fill"
              ? "100%"
              : "auto";

        // Width
        const widthMode = p.widthMode || "fill";
        const width =
          widthMode === "fixed"
            ? p.width || 300
            : widthMode === "fill"
              ? "100%"
              : "fit-content";

        return (
          <div
            className="relative overflow-hidden"
            style={{
              width,
              height,
              borderRadius,
              border:
                borderWidth > 0
                  ? `${borderWidth}px solid ${borderColor}`
                  : undefined,
              boxShadow,
              paddingTop: padding.top || undefined,
              paddingRight: padding.right || undefined,
              paddingBottom: padding.bottom || undefined,
              paddingLeft: padding.left || undefined,
              backgroundColor: p.src ? undefined : "#f3f4f6",
            }}
          >
            {p.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.src}
                className="w-full h-full"
                style={{
                  objectFit,
                  borderRadius:
                    borderWidth > 0
                      ? undefined
                      : borderRadius,
                  display: "block",
                }}
                alt=""
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: "#f3f4f6" }}
              >
                <Image size={24} className="text-gray-300" />
              </div>
            )}

            {/* Overlay */}
            {overlayOpacity > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: overlayColor,
                  opacity: overlayOpacity,
                  borderRadius,
                }}
              />
            )}
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════
          VIDEO — ★ FULLY REFLECTIVE on device
          ════════════════════════════════════════════════ */}
      {component.type === "VIDEO" && (() => {
        const padding = getSpacing(p, "padding");
        const borderRadius =
          p.maskShape === "circle"
            ? "50%"
            : p.maskShape === "rounded"
              ? 16
              : p.borderRadius || 12;
        const borderWidth = p.borderWidth ?? 0;
        const borderColor = p.borderColor || "#000000";
        const boxShadow = getBoxShadow(p);
        const overlayOpacity = (p.overlayOpacity ?? 0) / 100;
        const overlayColor = p.overlayColor || "#000000";
        const fitMode = p.fitMode || "cover";
        const objectFit =
          fitMode === "fit"
            ? "contain"
            : (fitMode as React.CSSProperties["objectFit"]);

        const heightMode = p.heightMode || "fixed";
        const height =
          heightMode === "fixed"
            ? p.height || 200
            : heightMode === "fill"
              ? "100%"
              : "auto";

        const widthMode = p.widthMode || "fill";
        const width =
          widthMode === "fixed"
            ? p.width || 300
            : widthMode === "fill"
              ? "100%"
              : "fit-content";

        return (
          <div
            className="relative overflow-hidden"
            style={{
              width,
              height,
              borderRadius,
              border:
                borderWidth > 0
                  ? `${borderWidth}px solid ${borderColor}`
                  : undefined,
              boxShadow,
              paddingTop: padding.top || undefined,
              paddingRight: padding.right || undefined,
              paddingBottom: padding.bottom || undefined,
              paddingLeft: padding.left || undefined,
              backgroundColor: "#111",
            }}
          >
            {p.src ? (
              <video
                src={p.src}
                className="w-full h-full"
                style={{ objectFit, display: "block" }}
                muted={p.muted ?? true}
                loop={p.loop ?? true}
                autoPlay={p.autoplay ?? false}
                controls={p.showControls ?? false}
                playsInline
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
                </div>
                <span className="text-[10px] text-white/50 font-medium mt-2">
                  Video
                </span>
              </div>
            )}

            {/* Overlay */}
            {overlayOpacity > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: overlayColor,
                  opacity: overlayOpacity,
                  borderRadius,
                }}
              />
            )}
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════
          ICON_LIBRARY — ★ FULLY REFLECTIVE on device
          ════════════════════════════════════════════════ */}
      {component.type === "ICON_LIBRARY" &&
        (() => {
          const LucideIcon = (icons as any)[p.iconName] || Smile;
          const padding = getSpacing(p, "padding");
          const bgColor = p.backgroundColor || "transparent";
          const hasBg = bgColor !== "transparent";

          // Background shape → border-radius
          const bgBorderRadius =
            p.bgShape === "circle"
              ? "50%"
              : p.bgShape === "rounded"
                ? 8
                : p.borderRadius ?? 0;

          const borderWidth = p.borderWidth ?? 0;
          const borderColor = p.borderColor || "#000000";
          const boxShadow = getBoxShadow(p);

          // Icon size (used for both the lucide icon and as a baseline)
          const iconW = p.width || 24;
          const iconH = p.height || 24;

          return (
            <div
              className="flex items-center justify-center"
              style={{
                // The container sizes to icon + padding + border
                width: "fit-content",
                height: "fit-content",
                paddingTop: padding.top || undefined,
                paddingRight: padding.right || undefined,
                paddingBottom: padding.bottom || undefined,
                paddingLeft: padding.left || undefined,
                backgroundColor: hasBg ? bgColor : undefined,
                borderRadius: bgBorderRadius,
                border:
                  borderWidth > 0
                    ? `${borderWidth}px solid ${borderColor}`
                    : undefined,
                boxShadow,
              }}
            >
              <LucideIcon
                size={Math.min(iconW, iconH)}
                style={{
                  color: p.color || "#007AFF",
                  opacity: p.opacity ?? 1,
                  width: iconW,
                  height: iconH,
                }}
              />
            </div>
          );
        })()}

      {/* ════════════════════════════════════════════════
          STACK — ★ FULLY REFLECTIVE on device + Badge
          ════════════════════════════════════════════════ */}
      {component.type === "STACK" && (() => {
        const padding = getSpacing(p, "padding");
        const borderRadius =
          p.shape === "circle"
            ? "50%"
            : p.shape === "pill"
              ? 999
              : p.shape === "rounded"
                ? 16
                : p.borderRadius || 0;
        const borderWidth = p.borderWidth ?? 0;
        const borderColor = p.borderColor || "#000000";
        const boxShadow = getBoxShadow(p);
        const bgColor = p.backgroundColor || "#F8F8F8";

        // Badge
        const hasBadge = p.badgeText && p.badgeText.trim().length > 0;
        const badgePositionStyle = p.badgePositionStyle || "overlaid";
        const badgeAlignment = p.badgePositionAlignment || "top-center";

        // Badge shape → border-radius
        const badgeShape = p.badgeShape || "pill";
        const badgeBR =
          badgeShape === "pill"
            ? 999
            : badgeShape === "circle"
              ? "50%"
              : badgeShape === "rounded"
                ? 8
                : 0;

        const badgeFillColor = p.badgeFillColor || p.badgeBackgroundColor || "#11D483";
        const badgeBorderWidth = p.badgeBorderWidth ?? 0;
        const badgeBorderColor = p.badgeBorderColor || "#000000";

        const badgeShadowX = p.badgeShadowX ?? 0;
        const badgeShadowY = p.badgeShadowY ?? 0;
        const badgeShadowBlur = p.badgeShadowBlur ?? 0;
        const badgeShadowColor = p.badgeShadowColor || "rgba(0,0,0,0.2)";
        const badgeBoxShadow =
          badgeShadowX === 0 && badgeShadowY === 0 && badgeShadowBlur === 0
            ? undefined
            : `${badgeShadowX}px ${badgeShadowY}px ${badgeShadowBlur}px ${badgeShadowColor}`;

        const badgeFontFamily = FONT_FAMILY_MAP[p.badgeFontFamily || "system"];
        const badgeFontSize = Number(p.badgeFontSize) || 14;

        // Badge position alignment → CSS
        const [vAlign, hAlign] = badgeAlignment.split("-");
        const badgePositionCSS: React.CSSProperties = {};
        if (badgePositionStyle === "overlaid") {
          badgePositionCSS.position = "absolute";
          badgePositionCSS.zIndex = 10;
          if (vAlign === "top") badgePositionCSS.top = -6;
          else if (vAlign === "bottom") badgePositionCSS.bottom = -6;
          else badgePositionCSS.top = "50%";
          if (hAlign === "left") badgePositionCSS.left = 8;
          else if (hAlign === "right") badgePositionCSS.right = 8;
          else { badgePositionCSS.left = "50%"; badgePositionCSS.transform = vAlign === "center" ? "translate(-50%, -50%)" : "translateX(-50%)"; }
        }

        const badgeEl = hasBadge ? (
          <span
            style={{
              display: "inline-block",
              fontSize: badgeFontSize,
              fontWeight: p.badgeFontWeight || "600",
              fontFamily: badgeFontFamily,
              color: p.badgeColor || "#FFFFFF",
              backgroundColor: badgeFillColor,
              borderRadius: badgeBR,
              border: badgeBorderWidth > 0 ? `${badgeBorderWidth}px solid ${badgeBorderColor}` : undefined,
              boxShadow: badgeBoxShadow,
              paddingTop: p.badgePaddingTop ?? 4,
              paddingRight: p.badgePaddingRight ?? 8,
              paddingBottom: p.badgePaddingBottom ?? 4,
              paddingLeft: p.badgePaddingLeft ?? 8,
              marginTop: p.badgeMarginTop ?? 0,
              marginRight: p.badgeMarginRight ?? 0,
              marginBottom: p.badgeMarginBottom ?? 0,
              marginLeft: p.badgeMarginLeft ?? 0,
              textAlign: (p.badgeAlignment as React.CSSProperties["textAlign"]) || "center",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              ...badgePositionCSS,
            }}
          >
            {p.badgeText}
          </span>
        ) : null;

        return (
          <div className="relative">
            {/* Badge above */}
            {badgeEl && badgePositionStyle === "above" && (
              <div style={{ textAlign: hAlign === "left" ? "left" : hAlign === "right" ? "right" : "center", marginBottom: 4 }}>
                {badgeEl}
              </div>
            )}

            {/* Stack container */}
            <div
              className="relative"
              style={{
                backgroundColor: bgColor,
                borderRadius,
                border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "2px dashed #e5e7eb",
                boxShadow,
                paddingTop: padding.top || 12,
                paddingRight: padding.right || 12,
                paddingBottom: padding.bottom || 12,
                paddingLeft: padding.left || 12,
                overflow: badgePositionStyle === "overlaid" ? "visible" : undefined,
              }}
            >
              {/* Overlaid badge */}
              {badgeEl && badgePositionStyle === "overlaid" && badgeEl}

              {/* Inline badge */}
              {badgeEl && badgePositionStyle === "inline" && (
                <div style={{ textAlign: hAlign === "left" ? "left" : hAlign === "right" ? "right" : "center", marginBottom: 6 }}>
                  {badgeEl}
                </div>
              )}

              {/* Stack content placeholder */}
              <div className="flex items-center justify-center gap-1 py-3">
                <Rows3 size={16} className="text-gray-300" />
                <span className="text-xs text-gray-400 font-medium">
                  Stack ({p.axis || "vertical"})
                </span>
              </div>
            </div>

            {/* Badge below */}
            {badgeEl && badgePositionStyle === "below" && (
              <div style={{ textAlign: hAlign === "left" ? "left" : hAlign === "right" ? "right" : "center", marginTop: 4 }}>
                {badgeEl}
              </div>
            )}
          </div>
        );
      })()}

      {component.type === "FOOTER" && (
        <div className="mt-2">
          {p.showDivider && <div className="h-px bg-gray-200 mb-3" />}
          <p
            className="text-center"
            style={{
              fontSize: p.fontSize || 12,
              color: p.textColor || "#999",
            }}
          >
            {p.text}
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          TAB_BUTTON — Stack-based: tab buttons + content area
          ════════════════════════════════════════════════ */}
      {component.type === "TAB_BUTTON" && (() => {
        const variant = p.variant || "pill";
        const activeIndicator = p.activeIndicator || "bg";
        const isUnderline = activeIndicator === "underline" || variant === "underline";
        const isSeparated = variant === "separated";
        const containerBg = p.containerBgColor || (isUnderline ? "#FFFFFF" : "#F0F0F0");
        const containerBR = p.containerBorderRadius ?? (isUnderline ? 0 : 12);
        const tabBR = p.tabBorderRadius ?? (isUnderline ? 0 : 10);
        const containerPad = p.containerPadding ?? (isSeparated ? 0 : 4);
        const activeColor = p.activeColor || (variant === "pill" ? "#1A1A1A" : "#FFFFFF");
        const inactiveColor = p.inactiveColor || "#999";
        const activeBg = p.activeBgColor || (variant === "pill" ? "#FFFFFF" : "#6C5CE7");
        const inactiveBg = p.inactiveBgColor || (isSeparated ? "#FFFFFF" : "transparent");
        const fontSize = p.fontSize ?? 13;
        const fontWeight = p.fontWeight || "600";
        const tabPV = p.tabPaddingV ?? 8;
        const tabPH = p.tabPaddingH ?? 16;
        const activeShadow = p.activeShadow ?? (variant === "pill" || variant === "separated");

        // Find the active tab
        const activeTabId = p.activeTabId || p.tabs?.find((t: any) => t.active)?.id;
        const activeTab = p.tabs?.find((t: any) => t.id === activeTabId) || p.tabs?.[0];

        return (
          <div className="flex flex-col">
            {/* ── Tab Buttons Row ── */}
            <div
              className="flex items-center"
              style={{
                backgroundColor: isSeparated ? "transparent" : containerBg,
                borderRadius: containerBR,
                padding: isSeparated ? 0 : containerPad,
                gap: isSeparated ? 8 : 0,
                borderBottom: isUnderline ? "1px solid #E5E7EB" : undefined,
                justifyContent: isSeparated ? "center" : undefined,
              }}
            >
              {p.tabs?.map(
                (tab: {
                  id: string;
                  label: string;
                  active: boolean;
                  badge?: string;
                }) => {
                  const isActive = tab.id === activeTabId || tab.active;
                  return (
                    <div
                      key={tab.id}
                      className="flex items-center justify-center gap-1.5 text-center"
                      style={{
                        flex: isSeparated ? undefined : 1,
                        paddingTop: tabPV,
                        paddingBottom: tabPV,
                        paddingLeft: tabPH,
                        paddingRight: tabPH,
                        borderRadius: isUnderline ? 0 : tabBR,
                        backgroundColor:
                          isUnderline
                            ? "transparent"
                            : isActive
                              ? activeBg
                              : inactiveBg,
                        color: isActive ? activeColor : inactiveColor,
                        fontSize,
                        fontWeight,
                        boxShadow:
                          isActive && activeShadow && !isUnderline
                            ? "0 1px 4px rgba(0,0,0,0.1)"
                            : undefined,
                        borderBottom:
                          isUnderline && isActive
                            ? `2px solid ${activeColor}`
                            : isUnderline
                              ? "2px solid transparent"
                              : undefined,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && isActive && (
                        <span
                          className="font-bold leading-tight"
                          style={{
                            fontSize: Math.max(fontSize - 3, 9),
                            color: activeColor,
                            opacity: 0.9,
                          }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* ── Active Tab Content Area ── */}
            <div
              className="mt-2 rounded-lg border border-dashed border-gray-200 p-3 min-h-[40px]"
              style={{ backgroundColor: "#FAFAFA" }}
            >
              {activeTab?.children && activeTab.children.length > 0 ? (
                activeTab.children.map((child: any) => (
                  <p
                    key={child.id}
                    style={{
                      fontSize: child.fontSize || 14,
                      color: child.color || "#1A1A1A",
                      fontWeight: child.fontWeight || "normal",
                      margin: 0,
                    }}
                  >
                    {child.content || "Text"}
                  </p>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center">
                  Tab content
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════
          BUTTON — ★ FULLY REFLECTIVE on device + Badge
          ════════════════════════════════════════════════ */}
      {component.type === "BUTTON" && (() => {
        const padding = getSpacing(p, "padding");

        // Background color: prefer new prop, fall back to legacy style prop
        const bgColor = p.backgroundColor || p.style?.backgroundColor || "#007AFF";
        const textColor = p.style?.textColor || "#FFFFFF";

        // Shape → border-radius
        const borderRadius =
          p.shape === "circle"
            ? "50%"
            : p.shape === "pill"
              ? 999
              : p.shape === "rounded"
                ? 16
                : p.borderRadius ?? p.style?.borderRadius ?? 12;

        const borderWidth = p.borderWidth ?? 0;
        const borderColor = p.borderColor || "#000000";
        const boxShadow = getBoxShadow(p);

        // Size
        const widthMode = p.widthMode || "fill";
        const width =
          widthMode === "fixed" ? p.width || 300 : widthMode === "fill" ? "100%" : "fit-content";

        const heightMode = p.heightMode || "fit";
        const height =
          heightMode === "fixed" ? p.height || 48 : heightMode === "fill" ? "100%" : "auto";

        // Badge
        const hasBadge = p.badgeText && p.badgeText.trim().length > 0;
        const badgePositionStyle = p.badgePositionStyle || "overlaid";
        const badgeAlignment = p.badgePositionAlignment || "top-center";

        const badgeShape = p.badgeShape || "pill";
        const badgeBR =
          badgeShape === "pill" ? 999 : badgeShape === "circle" ? "50%" : badgeShape === "rounded" ? 8 : 0;

        const badgeFillColor = p.badgeFillColor || p.badgeBackgroundColor || "#11D483";
        const badgeBorderWidth = p.badgeBorderWidth ?? 0;
        const badgeBorderColor = p.badgeBorderColor || "#000000";

        const badgeShadowX = p.badgeShadowX ?? 0;
        const badgeShadowY = p.badgeShadowY ?? 0;
        const badgeShadowBlur = p.badgeShadowBlur ?? 0;
        const badgeShadowColor = p.badgeShadowColor || "rgba(0,0,0,0.2)";
        const badgeBoxShadow =
          badgeShadowX === 0 && badgeShadowY === 0 && badgeShadowBlur === 0
            ? undefined
            : `${badgeShadowX}px ${badgeShadowY}px ${badgeShadowBlur}px ${badgeShadowColor}`;

        const badgeFontFamily = FONT_FAMILY_MAP[p.badgeFontFamily || "system"];
        const badgeFontSize = Number(p.badgeFontSize) || 14;

        // Badge position alignment → CSS
        const [vAlign, hAlign] = badgeAlignment.split("-");
        const badgePositionCSS: React.CSSProperties = {};
        if (badgePositionStyle === "overlaid") {
          badgePositionCSS.position = "absolute";
          badgePositionCSS.zIndex = 10;
          if (vAlign === "top") badgePositionCSS.top = -6;
          else if (vAlign === "bottom") badgePositionCSS.bottom = -6;
          else badgePositionCSS.top = "50%";
          if (hAlign === "left") badgePositionCSS.left = 8;
          else if (hAlign === "right") badgePositionCSS.right = 8;
          else {
            badgePositionCSS.left = "50%";
            badgePositionCSS.transform = vAlign === "center" ? "translate(-50%, -50%)" : "translateX(-50%)";
          }
        }

        const badgeEl = hasBadge ? (
          <span
            style={{
              display: "inline-block",
              fontSize: badgeFontSize,
              fontWeight: p.badgeFontWeight || "600",
              fontFamily: badgeFontFamily,
              color: p.badgeColor || "#FFFFFF",
              backgroundColor: badgeFillColor,
              borderRadius: badgeBR,
              border: badgeBorderWidth > 0 ? `${badgeBorderWidth}px solid ${badgeBorderColor}` : undefined,
              boxShadow: badgeBoxShadow,
              paddingTop: p.badgePaddingTop ?? 4,
              paddingRight: p.badgePaddingRight ?? 8,
              paddingBottom: p.badgePaddingBottom ?? 4,
              paddingLeft: p.badgePaddingLeft ?? 8,
              marginTop: p.badgeMarginTop ?? 0,
              marginRight: p.badgeMarginRight ?? 0,
              marginBottom: p.badgeMarginBottom ?? 0,
              marginLeft: p.badgeMarginLeft ?? 0,
              textAlign: (p.badgeAlignment as React.CSSProperties["textAlign"]) || "center",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              ...badgePositionCSS,
            }}
          >
            {p.badgeText}
          </span>
        ) : null;

        return (
          <div className="relative" style={{ width }}>
            {/* Badge above */}
            {badgeEl && badgePositionStyle === "above" && (
              <div style={{ textAlign: hAlign === "left" ? "left" : hAlign === "right" ? "right" : "center", marginBottom: 4 }}>
                {badgeEl}
              </div>
            )}

            {/* Button container */}
            <div
              className="relative text-sm font-semibold text-center"
              style={{
                width: "100%",
                height,
                backgroundColor: bgColor,
                color: textColor,
                borderRadius,
                border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
                boxShadow,
                paddingTop: padding.top || 14,
                paddingRight: padding.right || 0,
                paddingBottom: padding.bottom || 14,
                paddingLeft: padding.left || 0,
                overflow: badgePositionStyle === "overlaid" ? "visible" : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Overlaid badge */}
              {badgeEl && badgePositionStyle === "overlaid" && badgeEl}

              {/* Inline badge */}
              {badgeEl && badgePositionStyle === "inline" && (
                <div style={{ textAlign: hAlign === "left" ? "left" : hAlign === "right" ? "right" : "center", marginBottom: 4, position: "absolute", top: -6, left: 0, right: 0 }}>
                  {badgeEl}
                </div>
              )}

              {p.label}
            </div>

            {/* Badge below */}
            {badgeEl && badgePositionStyle === "below" && (
              <div style={{ textAlign: hAlign === "left" ? "left" : hAlign === "right" ? "right" : "center", marginTop: 4 }}>
                {badgeEl}
              </div>
            )}
          </div>
        );
      })()}

      {component.type === "TEXT_INPUT" && (
        <div className="border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-400">
            {p.placeholder || "Enter text..."}
          </p>
        </div>
      )}

      {component.type === "SINGLE_SELECT" && (
        <div className="space-y-2">
          {p.label && (
            <p className="text-sm font-medium text-gray-700">{p.label}</p>
          )}
          {p.options?.map((opt: { id: string; label: string }) => (
            <div
              key={opt.id}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}

      {component.type === "MULTI_SELECT" && (
        <div className="space-y-2">
          {p.label && (
            <p className="text-sm font-medium text-gray-700">{p.label}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {p.options?.map((opt: { id: string; label: string }) => (
              <div
                key={opt.id}
                className="border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600"
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {component.type === "SLIDER" && (
        <div className="space-y-2">
          {p.label && (
            <p className="text-sm font-medium text-gray-700">{p.label}</p>
          )}
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
          <div
            className="flex gap-2 overflow-hidden"
            style={{ height: p.height || 180 }}
          >
            {p.items?.map(
              (
                item: { id: string; title: string; subtitle: string },
                i: number
              ) => (
                <div
                  key={item.id}
                  className="shrink-0 w-[85%] rounded-2xl flex flex-col items-center justify-center"
                  style={{
                    borderRadius: p.borderRadius || 16,
                    backgroundColor: i === 0 ? "#F0F0F5" : "#E8E8ED",
                  }}
                >
                  <Image size={20} className="text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-500">
                    {item.title}
                  </p>
                  {p.variant === "card" && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
          {p.showDots && (
            <div className="flex justify-center gap-1.5 mt-2">
              {p.items?.map((_: unknown, i: number) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-gray-600" : "bg-gray-300"}`}
                />
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
                  <Star
                    key={s}
                    size={14}
                    className={
                      s <= Math.floor(p.rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-800">
                {p.rating}
              </span>
              <span className="text-xs text-gray-400">
                ({(p.totalReviews || 0).toLocaleString()})
              </span>
            </div>
          )}
          {!p.compact &&
            p.reviews?.map(
              (rev: {
                id: string;
                author: string;
                rating: number;
                text: string;
              }) => (
                <div
                  key={rev.id}
                  className="bg-gray-50 rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                      {rev.author?.[0]}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {rev.author}
                    </span>
                    <div className="flex gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={9}
                          className={
                            s <= (rev.rating || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {rev.text}
                  </p>
                </div>
              )
            )}
        </div>
      )}

      {component.type === "FEATURE_LIST" && (
        <div className="space-y-2.5">
          {p.title && (
            <p
              className="text-sm font-semibold"
              style={{ color: p.textColor || "#1A1A1A" }}
            >
              {p.title}
            </p>
          )}
          {p.features?.map((f: { id: string; label: string }) => (
            <div key={f.id} className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                style={{
                  backgroundColor: (p.iconColor || "#34C759") + "18",
                }}
              >
                <Check
                  size={11}
                  style={{ color: p.iconColor || "#34C759" }}
                  strokeWidth={3}
                />
              </div>
              <span
                className="text-sm leading-snug"
                style={{ color: p.textColor || "#1A1A1A" }}
              >
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