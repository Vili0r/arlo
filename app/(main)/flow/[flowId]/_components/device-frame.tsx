import React, { memo } from "react";
import type { DevicePreset, Orientation } from "../_lib/device-presets";
import { getFrameDimensions } from "../_lib/device-presets";

/* ── DARK BG HELPER ──────────────────────────────────────── */
function isDarkColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/* ════════════════════════════════════════════════════════════
   DEVICE FRAME — renders the correct chrome per device
   ════════════════════════════════════════════════════════════ */
export const DeviceFrame = memo(function DeviceFrame({
  device,
  orientation,
  frame,
  screenContent,
  progressBar,
  screenBgColor = "#FFFFFF",
  showSystemChrome = true,
}: {
  device: DevicePreset;
  orientation: Orientation;
  frame: ReturnType<typeof getFrameDimensions>;
  screenContent: React.ReactNode;
  progressBar: React.ReactNode;
  screenBgColor?: string;
  showSystemChrome?: boolean;
}) {
  const isLandscape = orientation === "landscape";
  const spec = device.frame;

  return (
    <div
      className="shadow-[0_20px_70px_rgba(0,0,0,0.5)] relative"
      style={{
        width: frame.frameWidth,
        height: frame.frameHeight,
        borderRadius: frame.outerRadius,
        background: `linear-gradient(to bottom, ${frame.frameGradient.from}, ${frame.frameGradient.to})`,
        paddingTop: frame.bezel.top,
        paddingRight: frame.bezel.right,
        paddingBottom: frame.bezel.bottom,
        paddingLeft: frame.bezel.left,
      }}
    >
      {frame.isMobile && !isLandscape && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              right: -1,
              top: spec.hasHomeButton ? 100 : 160,
              width: 3,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: -1,
              top: spec.hasHomeButton ? 90 : 140,
              width: 3,
              height: 28,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: -1,
              top: spec.hasHomeButton ? 126 : 176,
              width: 3,
              height: 28,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
        </>
      )}

      {spec.hasHomeButton && !isLandscape && (
        <div
          className="absolute flex flex-col items-center gap-1.5"
          style={{ top: 16, left: "50%", transform: "translateX(-50%)" }}
        >
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <div
            className="rounded-full"
            style={{ width: 40, height: 5, backgroundColor: "rgba(0,0,0,0.2)" }}
          />
        </div>
      )}

      {spec.hasHomeButton && !isLandscape && (
        <div
          className="absolute"
          style={{
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.15)",
            backgroundColor: "rgba(0,0,0,0.04)",
          }}
        />
      )}

      <div
        className="w-full h-full overflow-hidden flex flex-col relative"
        style={{ borderRadius: frame.innerRadius, backgroundColor: screenBgColor }}
      >
        {showSystemChrome ? (
          <StatusBar device={device} frame={frame} isLandscape={isLandscape} screenBgColor={screenBgColor} />
        ) : null}
        {screenContent}
        {progressBar}
        {showSystemChrome ? (
          <HomeArea device={device} frame={frame} isLandscape={isLandscape} screenBgColor={screenBgColor} />
        ) : null}
      </div>
    </div>
  );
});

/* ── STATUS BAR ─────────────────────────────────────────── */
const StatusBar = memo(function StatusBar({
  device,
  frame,
  isLandscape,
  screenBgColor = "#FFFFFF",
}: {
  device: DevicePreset;
  frame: ReturnType<typeof getFrameDimensions>;
  isLandscape: boolean;
  screenBgColor?: string;
}) {
  const spec = device.frame;
  if (spec.statusBarHeight === 0) return null;

  const dark = isDarkColor(screenBgColor);
  const textColor = dark ? "white" : "black";
  const fillColor = dark ? "white" : "black";

  if (spec.hasHomeButton) {
    return (
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[11px] font-semibold" style={{ color: textColor }}>9:41</span>
        <StatusBarIcons size="small" fill={fillColor} />
      </div>
    );
  }

  if (spec.notch === "notch") {
    return (
      <div className="relative flex items-end justify-between px-6 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[15px] font-semibold tracking-tight pb-1" style={{ color: textColor }}>9:41</span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <svg width="164" height="32" viewBox="0 0 164 32" fill="none">
            <path d="M0 0H50C50 0 50 0 54 4C58 8 60 12 64 16C68 20 72 24 82 24C92 24 96 20 100 16C104 12 106 8 110 4C114 0 114 0 114 0H164V0H0Z" fill="black" />
            <rect x="50" y="0" width="64" height="4" fill="black" />
          </svg>
        </div>
        <div className="pb-1">
          <StatusBarIcons size="normal" fill={fillColor} />
        </div>
      </div>
    );
  }

  if (spec.notch === "dynamic-island") {
    return (
      <div className="relative flex items-end justify-between px-8 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[15px] font-semibold tracking-tight pb-2" style={{ color: textColor }}>9:41</span>
        <div className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full" style={{ top: 12, width: 120, height: 34 }} />
        <div className="pb-2">
          <StatusBarIcons size="normal" fill={fillColor} />
        </div>
      </div>
    );
  }

  if (spec.notch === "punch-hole") {
    const isPixel = device.id.startsWith("pixel");
    return (
      <div className="relative flex items-center justify-between px-5 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[12px] font-medium" style={{ color: textColor }}>{isPixel ? "12:30" : "9:41"}</span>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black" style={{ width: 10, height: 10, top: "50%", transform: "translate(-50%, -50%)" }} />
        <StatusBarIcons size="small" fill={fillColor} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 shrink-0" style={{ height: spec.statusBarHeight }}>
      <span className="text-[13px] font-semibold tracking-tight" style={{ color: textColor }}>9:41</span>
      <StatusBarIcons size="normal" fill={fillColor} />
    </div>
  );
});

/* ── HOME AREA ──────────────────────────────────────────── */
const HomeArea = memo(function HomeArea({
  device,
  frame,
  isLandscape,
  screenBgColor = "#FFFFFF",
}: {
  device: DevicePreset;
  frame: ReturnType<typeof getFrameDimensions>;
  isLandscape: boolean;
  screenBgColor?: string;
}) {
  const spec = device.frame;
  if (spec.hasHomeButton) return null;

  if (spec.homeIndicatorHeight > 0) {
    const dark = isDarkColor(screenBgColor);
    return (
      <div
        className="flex items-center justify-center shrink-0"
        style={{ height: spec.homeIndicatorHeight, backgroundColor: screenBgColor }}
      >
        <div
          className="rounded-full"
          style={{
            width: isLandscape ? Math.min(200, frame.viewportWidth * 0.15) : 134,
            height: 5,
            backgroundColor: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
          }}
        />
      </div>
    );
  }

  return null;
});

/* ── STATUS BAR ICONS ─────────────────────────────────── */
const StatusBarIcons = memo(function StatusBarIcons({
  size = "normal",
  fill = "black",
}: {
  size?: "small" | "normal";
  fill?: string;
}) {
  const s = size === "small" ? 0.75 : 1;
  return (
    <div className="flex items-center gap-1" style={{ transform: `scale(${s})`, transformOrigin: "right center" }}>
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
        <rect x="0" y="3" width="3" height="9" rx="1" fill={fill} />
        <rect x="5" y="2" width="3" height="10" rx="1" fill={fill} />
        <rect x="10" y="1" width="3" height="11" rx="1" fill={fill} />
        <rect x="15" y="0" width="3" height="12" rx="1" fill={fill} />
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <path d="M8 3.3C10 3.3 11.8 4.1 13 5.5L14.4 4C12.8 2.3 10.5 1.2 8 1.2S3.2 2.3 1.6 4L3 5.5C4.2 4.1 6 3.3 8 3.3Z" fill={fill} />
        <path d="M8 6.7C9.2 6.7 10.3 7.2 11 8L12.4 6.5C11.3 5.4 9.7 4.7 8 4.7S4.7 5.4 3.6 6.5L5 8C5.7 7.2 6.8 6.7 8 6.7Z" fill={fill} />
        <circle cx="8" cy="10.5" r="1.5" fill={fill} />
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x="0" y="1" width="23" height="11" rx="3.5" stroke={fill} strokeWidth="1" />
        <rect x="24.5" y="4.5" width="2" height="4" rx="1" fill={fill} opacity="0.4" />
        <rect x="1.5" y="2.5" width="20" height="8" rx="2" fill={fill} />
      </svg>
    </div>
  );
});
