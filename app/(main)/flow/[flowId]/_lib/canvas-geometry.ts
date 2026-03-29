export type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasRect extends CanvasPoint {
  width: number;
  height: number;
}

export const GRID_SIZE = 8;
export const MIN_NODE_SIZE = 20;
export const SNAP_THRESHOLD = 6;
export const ROTATION_SNAP_STEP = 45;

export const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundToGrid(value: number, grid = GRID_SIZE): number {
  return Math.round(value / grid) * grid;
}

export function normalizeRect(
  start: CanvasPoint,
  end: CanvasPoint,
): CanvasRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function rectsIntersect(a: CanvasRect, b: CanvasRect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function getRectCenter(rect: CanvasRect): CanvasPoint {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function getBoundingRect(rects: CanvasRect[]): CanvasRect | null {
  if (rects.length === 0) return null;

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function clientPointToElementPoint(
  clientX: number,
  clientY: number,
  element: HTMLElement,
): CanvasPoint {
  const rect = element.getBoundingClientRect();
  const scaleX = rect.width / Math.max(element.offsetWidth, 1);
  const scaleY = rect.height / Math.max(element.offsetHeight, 1);

  return {
    x: (clientX - rect.left) / (scaleX || 1),
    y: (clientY - rect.top) / (scaleY || 1),
  };
}

export function rotateVector(
  x: number,
  y: number,
  degrees: number,
): CanvasPoint {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

export function getAngleBetweenPoints(
  center: CanvasPoint,
  point: CanvasPoint,
): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

export function snapAngle(angle: number, freeRotation: boolean): number {
  if (freeRotation) return angle;
  return Math.round(angle / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP;
}
