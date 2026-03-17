import { useEffect, useRef } from "react";

export default function MouseGradientBackground({ darkMode }) {
  const blob1 = useRef(null);
  const blob2 = useRef(null);
  const blob3 = useRef(null);

  useEffect(() => {
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

      if (blob1.current) {
        blob1.current.style.transform = `translate(${x1 - 250}px, ${y1 - 250}px)`;
      }

      if (blob2.current) {
        blob2.current.style.transform = `translate(${x2 - 300}px, ${y2 - 300}px)`;
      }

      if (blob3.current) {
        blob3.current.style.transform = `translate(${x3 - 200}px, ${y3 - 200}px)`;
      }

      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const background = darkMode
    ? "linear-gradient(135deg, #020617 0%, #0f172a 100%)"
    : "linear-gradient(135deg, #eef6ff 0%, #f8fbff 55%, #edf7ff 100%)";

  const mixBlendMode = darkMode ? "screen" : "multiply";
  const blurValue = darkMode ? "120px" : "90px";

  return (
    <div style={{ ...styles.wrapper, background }}>
      <div
        ref={blob1}
        style={{
          ...styles.blob,
          width: 500,
          height: 500,
          filter: `blur(${blurValue})`,
          mixBlendMode,
          background: darkMode
            ? "rgba(56, 189, 248, 0.35)"
            : "rgba(37, 99, 235, 0.28)",
        }}
      />

      <div
        ref={blob2}
        style={{
          ...styles.blob,
          width: 600,
          height: 600,
          filter: `blur(${blurValue})`,
          mixBlendMode,
          background: darkMode
            ? "rgba(168, 85, 247, 0.28)"
            : "rgba(147, 51, 234, 0.22)",
        }}
      />

      <div
        ref={blob3}
        style={{
          ...styles.blob,
          width: 420,
          height: 420,
          filter: `blur(${blurValue})`,
          mixBlendMode,
          background: darkMode
            ? "rgba(34, 211, 238, 0.25)"
            : "rgba(8, 145, 178, 0.20)",
        }}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    inset: 0,
    overflow: "hidden",
    zIndex: 0,
    direction: "ltr",
  },

  blob: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: "50%",
    pointerEvents: "none",
    transition: "background 0.3s ease, filter 0.3s ease",
  },
};