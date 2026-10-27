import { useEffect, useRef } from "react";

// Soft colour blobs that follow the mouse (or finger). Colours change with the occasion.
export default function Background({ colors }) {
  const blobs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let x1 = mouseX;
    let y1 = mouseY;
    let x2 = window.innerWidth * 0.7;
    let y2 = window.innerHeight * 0.3;
    let x3 = window.innerWidth * 0.3;
    let y3 = window.innerHeight * 0.7;
    let frameId;

    const handleMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      x1 += (mouseX - x1) * 0.08;
      y1 += (mouseY - y1) * 0.08;
      x2 += (mouseX * 0.4 - x2) * 0.03;
      y2 += (mouseY * 0.4 - y2) * 0.03;
      x3 += (mouseX * 0.7 - x3) * 0.02;
      y3 += (mouseY * 0.7 - y3) * 0.02;
      const [a, b, c] = blobs.map((r) => r.current);
      if (a) a.style.transform = `translate(${x1 - 250}px, ${y1 - 250}px)`;
      if (b) b.style.transform = `translate(${x2 - 300}px, ${y2 - 300}px)`;
      if (c) c.style.transform = `translate(${x3 - 200}px, ${y3 - 200}px)`;
      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handleMove);
    frameId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = [0.34, 0.28, 0.24];
  const sizes = [500, 600, 420];
  const initial = [
    "translate(calc(50vw - 250px), calc(50vh - 250px))",
    "translate(calc(70vw - 300px), calc(30vh - 300px))",
    "translate(calc(30vw - 200px), calc(70vh - 200px))",
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        direction: "ltr",
        background: "linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 100%)",
      }}
    >
      {blobs.map((ref, i) => (
        <div
          key={i}
          ref={ref}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: sizes[i],
            height: sizes[i],
            borderRadius: "50%",
            pointerEvents: "none",
            filter: "blur(120px)",
            mixBlendMode: "screen",
            background: colors[i],
            opacity: opacity[i],
            transform: initial[i],
            transition: "background 0.6s ease, opacity 0.6s ease",
          }}
        />
      ))}
    </div>
  );
}
