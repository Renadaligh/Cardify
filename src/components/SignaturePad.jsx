import { useEffect, useRef } from "react";

/** Draw a signature with a finger or mouse. onChange receives an Image (transparent background) or null. */
export default function SignaturePad({ onChange, placeholder, clearLabel, useLabel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasInk.current = true;
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange(null);
  };

  const use = () => {
    if (!hasInk.current) return;
    const img = new Image();
    img.onload = () => onChange(img);
    img.src = canvasRef.current.toDataURL("image/png");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="signature-pad"
        aria-label={placeholder}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => {
          end();
          use();
        }}
        onPointerCancel={end}
      />
      <div className="row" style={{ marginTop: 8, justifyContent: "space-between" }}>
        <span className="hint" style={{ margin: 0 }}>
          {placeholder}
        </span>
        <div className="row">
          <button type="button" className="btn btn-ghost btn-small" onClick={clear}>
            {clearLabel}
          </button>
          {useLabel && (
            <button type="button" className="btn btn-ghost btn-small" onClick={use}>
              {useLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
