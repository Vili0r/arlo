/* ─── Device presets with accurate per-device frame specs ─── */

export type DeviceCategory = "mobile" | "tablet";
export type Orientation = "portrait" | "landscape";

export interface DevicePreset {
  id: string;
  name: string;
  category: DeviceCategory;
  width: number;
  height: number;
  frame: DeviceFrameSpec;
}

export interface DeviceFrameSpec {
  outerRadius: number;
  innerRadius: number;
  /** Bezel [top, right, bottom, left] in portrait */
  bezel: [number, number, number, number];
  hasHomeButton: boolean;
  notch: "none" | "notch" | "dynamic-island" | "punch-hole";
  frameGradient: { from: string; to: string };
  statusBarHeight: number;
  homeIndicatorHeight: number;
}

/* ─── Mobile ─────────────────────────────────────────────── */
export const MOBILE_DEVICES: DevicePreset[] = [
  {
    id: "iphone-se",
    name: "iPhone SE",
    category: "mobile",
    width: 375,
    height: 667,
    frame: {
      outerRadius: 38,
      innerRadius: 0,
      bezel: [60, 10, 60, 10],
      hasHomeButton: true,
      notch: "none",
      frameGradient: { from: "#d1d1d6", to: "#b0b0b5" },
      statusBarHeight: 20,
      homeIndicatorHeight: 0,
    },
  },
  {
    id: "iphone-13-mini",
    name: "iPhone 13 mini",
    category: "mobile",
    width: 375,
    height: 812,
    frame: {
      outerRadius: 50,
      innerRadius: 42,
      bezel: [10, 10, 10, 10],
      hasHomeButton: false,
      notch: "notch",
      frameGradient: { from: "#1c1c1e", to: "#0d0d0f" },
      statusBarHeight: 47,
      homeIndicatorHeight: 34,
    },
  },
  {
    id: "iphone-16-plus",
    name: "iPhone 16 Plus",
    category: "mobile",
    width: 430,
    height: 932,
    frame: {
      outerRadius: 55,
      innerRadius: 46,
      bezel: [10, 10, 10, 10],
      hasHomeButton: false,
      notch: "dynamic-island",
      frameGradient: { from: "#2a2a2e", to: "#1a1a1e" },
      statusBarHeight: 54,
      homeIndicatorHeight: 34,
    },
  },
  {
    id: "iphone-17",
    name: "iPhone 17",
    category: "mobile",
    width: 402,
    height: 874,
    frame: {
      outerRadius: 55,
      innerRadius: 46,
      bezel: [10, 10, 10, 10],
      hasHomeButton: false,
      notch: "dynamic-island",
      frameGradient: { from: "#2a2a2e", to: "#1a1a1e" },
      statusBarHeight: 54,
      homeIndicatorHeight: 34,
    },
  },
  {
    id: "iphone-air",
    name: "iPhone Air",
    category: "mobile",
    width: 420,
    height: 912,
    frame: {
      outerRadius: 55,
      innerRadius: 46,
      bezel: [10, 10, 10, 10],
      hasHomeButton: false,
      notch: "dynamic-island",
      frameGradient: { from: "#3a3a3e", to: "#2a2a2e" },
      statusBarHeight: 54,
      homeIndicatorHeight: 34,
    },
  },
  {
    id: "iphone-17-pro",
    name: "iPhone 17 Pro",
    category: "mobile",
    width: 402,
    height: 874,
    frame: {
      outerRadius: 55,
      innerRadius: 46,
      bezel: [10, 10, 10, 10],
      hasHomeButton: false,
      notch: "dynamic-island",
      frameGradient: { from: "#48484a", to: "#2c2c2e" },
      statusBarHeight: 54,
      homeIndicatorHeight: 34,
    },
  },
  {
    id: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    category: "mobile",
    width: 440,
    height: 956,
    frame: {
      outerRadius: 55,
      innerRadius: 46,
      bezel: [10, 10, 10, 10],
      hasHomeButton: false,
      notch: "dynamic-island",
      frameGradient: { from: "#48484a", to: "#2c2c2e" },
      statusBarHeight: 54,
      homeIndicatorHeight: 34,
    },
  },
  {
    id: "galaxy-s23",
    name: "Galaxy S23",
    category: "mobile",
    width: 360,
    height: 780,
    frame: {
      outerRadius: 42,
      innerRadius: 36,
      bezel: [8, 4, 8, 4],
      hasHomeButton: false,
      notch: "punch-hole",
      frameGradient: { from: "#1a1a1a", to: "#0a0a0a" },
      statusBarHeight: 32,
      homeIndicatorHeight: 20,
    },
  },
  {
    id: "pixel-10",
    name: "Pixel 10",
    category: "mobile",
    width: 412,
    height: 915,
    frame: {
      outerRadius: 40,
      innerRadius: 34,
      bezel: [8, 4, 8, 4],
      hasHomeButton: false,
      notch: "punch-hole",
      frameGradient: { from: "#e8e8e8", to: "#d0d0d0" },
      statusBarHeight: 32,
      homeIndicatorHeight: 20,
    },
  },
];

/* ─── Tablet ─────────────────────────────────────────────── */
export const TABLET_DEVICES: DevicePreset[] = [
  {
    id: "ipad-mini",
    name: "iPad mini",
    category: "tablet",
    width: 768,
    height: 1024,
    frame: {
      outerRadius: 22,
      innerRadius: 12,
      bezel: [18, 18, 18, 18],
      hasHomeButton: false,
      notch: "none",
      frameGradient: { from: "#2a2a2e", to: "#1a1a1e" },
      statusBarHeight: 24,
      homeIndicatorHeight: 20,
    },
  },
  {
    id: "ipad-air",
    name: "iPad Air",
    category: "tablet",
    width: 820,
    height: 1180,
    frame: {
      outerRadius: 22,
      innerRadius: 12,
      bezel: [18, 18, 18, 18],
      hasHomeButton: false,
      notch: "none",
      frameGradient: { from: "#2a2a2e", to: "#1a1a1e" },
      statusBarHeight: 24,
      homeIndicatorHeight: 20,
    },
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11\"",
    category: "tablet",
    width: 834,
    height: 1194,
    frame: {
      outerRadius: 22,
      innerRadius: 12,
      bezel: [16, 16, 16, 16],
      hasHomeButton: false,
      notch: "none",
      frameGradient: { from: "#3a3a3e", to: "#1a1a1e" },
      statusBarHeight: 24,
      homeIndicatorHeight: 20,
    },
  },
  {
    id: "ipad-pro-12-9",
    name: "iPad Pro 12.9\"",
    category: "tablet",
    width: 1024,
    height: 1366,
    frame: {
      outerRadius: 22,
      innerRadius: 12,
      bezel: [16, 16, 16, 16],
      hasHomeButton: false,
      notch: "none",
      frameGradient: { from: "#3a3a3e", to: "#1a1a1e" },
      statusBarHeight: 24,
      homeIndicatorHeight: 20,
    },
  },
];

export const ALL_DEVICES: DevicePreset[] = [...MOBILE_DEVICES, ...TABLET_DEVICES];
export const DEFAULT_DEVICE_ID = "iphone-17-pro";

export function getDeviceViewport(device: DevicePreset, orientation: Orientation) {
  if (orientation === "landscape") {
    return { viewportWidth: device.height, viewportHeight: device.width };
  }
  return { viewportWidth: device.width, viewportHeight: device.height };
}

export function getOrientedBezel(device: DevicePreset, orientation: Orientation) {
  const [t, r, b, l] = device.frame.bezel;
  if (orientation === "landscape") {
    return { top: l, right: t, bottom: r, left: b };
  }
  return { top: t, right: r, bottom: b, left: l };
}

export function getFrameDimensions(device: DevicePreset, orientation: Orientation) {
  const { viewportWidth, viewportHeight } = getDeviceViewport(device, orientation);
  const bezel = getOrientedBezel(device, orientation);
  const f = device.frame;

  return {
    viewportWidth,
    viewportHeight,
    frameWidth: viewportWidth + bezel.left + bezel.right,
    frameHeight: viewportHeight + bezel.top + bezel.bottom,
    bezel,
    outerRadius: f.outerRadius,
    innerRadius: f.innerRadius,
    statusBarHeight: f.statusBarHeight,
    homeIndicatorHeight: f.homeIndicatorHeight,
    hasHomeButton: f.hasHomeButton,
    notch: f.notch,
    frameGradient: f.frameGradient,
    isMobile: device.category === "mobile",
  };
}