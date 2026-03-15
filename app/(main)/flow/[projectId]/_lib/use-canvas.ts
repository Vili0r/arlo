import { useState, useCallback, useRef, useEffect } from "react";

const clampZoom = (z: number) => Math.min(Math.max(z, 0.4), 1.5);

type DragMode = "none" | "pan" | "phone";

export function useCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(0.85);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });

  const [phonePosition, setPhonePosition] = useState({ x: 0, y: 0 });
  const [isDraggingPhone, setIsDraggingPhone] = useState(false);
  const phoneDragStart = useRef({ x: 0, y: 0 });
  const phonePositionStart = useRef({ x: 0, y: 0 });
  const dragMode = useRef<DragMode>("none");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) setZoom((prev) => clampZoom(prev - e.deltaY * 0.005));
      else setPanOffset((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target !== canvasRef.current && !target.dataset.canvasBg) return;
      dragMode.current = "pan";
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = { ...panOffset };
    },
    [panOffset],
  );

  const handlePhoneMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dragMode.current = "phone";
      setIsDraggingPhone(true);
      phoneDragStart.current = { x: e.clientX, y: e.clientY };
      phonePositionStart.current = { ...phonePosition };
    },
    [phonePosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode.current === "pan" && isPanning) {
        setPanOffset({
          x: panOffsetStart.current.x + (e.clientX - panStart.current.x),
          y: panOffsetStart.current.y + (e.clientY - panStart.current.y),
        });
      } else if (dragMode.current === "phone" && isDraggingPhone) {
        setPhonePosition({
          x: phonePositionStart.current.x + (e.clientX - phoneDragStart.current.x) / zoom,
          y: phonePositionStart.current.y + (e.clientY - phoneDragStart.current.y) / zoom,
        });
      }
    },
    [isPanning, isDraggingPhone, zoom],
  );

  const handleMouseUp = useCallback(() => {
    dragMode.current = "none";
    setIsPanning(false);
    setIsDraggingPhone(false);
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + 0.1)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - 0.1)), []);
  const resetZoom = useCallback(() => setZoom(0.85), []);
  const resetView = useCallback(() => {
    setZoom(0.85);
    setPanOffset({ x: 0, y: 0 });
    setPhonePosition({ x: 0, y: 0 });
  }, []);

  return {
    canvasRef,
    zoom,
    panOffset,
    isPanning,
    isDraggingPhone,
    phonePosition,
    handleCanvasMouseDown,
    handlePhoneMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoomIn,
    zoomOut,
    resetZoom,
    resetView,
  };
}
