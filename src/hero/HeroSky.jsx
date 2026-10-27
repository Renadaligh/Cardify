import { useEffect, useRef, useState } from "react";
import { drawSky, SCENES } from "./skyScenes";

/**
 * Full-width animated sky behind the home page title.
 * Pauses when it's off screen or the tab is hidden, and shows a still frame
 * for people who turned on "reduce motion".
 */
export default function HeroSky({ lang, children, onScene }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const onSceneRef = useRef(onScene);
  onSceneRef.current = onScene;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    let last = -1;
    const started = performance.now();
    // Where the title sits, so scenes can place things around it (e.g. the flag above it).
    const layout = { titleTop: 0 };
    const measure = () => {
      const title = wrap.querySelector("h1");
      if (title) layout.titleTop = title.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      if (reduced) paint(2.4);
    };

    const paint = (time) => {
      const index = drawSky(ctx, w, h, time, layout);
      if (index !== last) {
        last = index;
        requestAnimationFrame(measure);
        setSceneIndex(index);
        onSceneRef.current?.(index);
      }
    };

    const loop = (now) => {
      if (visible && !document.hidden) paint((now - started) / 1000);
      frame = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(wrap);
    if (!reduced) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <section className="hero-sky" ref={wrapRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="hero-sky-copy">{children(SCENES[sceneIndex].word[lang], sceneIndex)}</div>
    </section>
  );
}
