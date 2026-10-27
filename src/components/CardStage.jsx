import { useEffect, useRef } from "react";

/**
 * Shows a canvas preview and lets the user drag layers (name, logo…).
 * `draw(canvas)` renders and returns the layer boxes.
 * `onMove(key, dx, dy)` receives the new offset of a layer, in fractions of the canvas.
 */
export default function CardStage({ draw, deps, offsets, onMove, hint, label }) {
  const canvasRef = useRef(null);
  const boxesRef = useRef([]);
  const dragRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) boxesRef.current = draw(canvasRef.current) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // On phones: a touch that starts on a layer drags it; anywhere else scrolls the page.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onMove) return;
    const onTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch && hit(toCanvas(touch))) e.preventDefault();
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => canvas.removeEventListener("touchstart", onTouchStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMove]);

  const toCanvas = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const hit = (p) => {
    const pad = 16;
    for (let i = boxesRef.current.length - 1; i >= 0; i--) {
      const b = boxesRef.current[i];
      if (p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad) return b;
    }
    return null;
  };

  const onPointerDown = (e) => {
    if (!onMove) return;
    const p = toCanvas(e);
    const box = hit(p);
    if (!box) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const start = offsets?.[box.key] || { dx: 0, dy: 0 };
    dragRef.current = { key: box.key, x: p.x, y: p.y, start };
    canvasRef.current.style.cursor = "grabbing";
  };

  const onPointerMove = (e) => {
    const canvas = canvasRef.current;
    const p = toCanvas(e);
    const drag = dragRef.current;
    if (!drag) {
      if (onMove && e.pointerType === "mouse") canvas.style.cursor = hit(p) ? "grab" : "default";
      return;
    }
    onMove(drag.key, drag.start.dx + (p.x - drag.x) / canvas.width, drag.start.dy + (p.y - drag.y) / canvas.height);
  };

  const endDrag = () => {
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
  };

  return (
    <div>
      <div className="stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
      {hint && <p className="stage-hint">{hint}</p>}
    </div>
  );
}
