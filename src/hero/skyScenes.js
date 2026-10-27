// The home page hero: the sky changes from one occasion to the next.
//
// HOW TO CHANGE IT
// - Each entry in SCENES is one occasion: `word` is the word shown in the title
//   ("بطاقة رمضان"), and `draw()` paints the sky with canvas code.
// - To change a scene's colours, edit the gradient colours at the top of its draw().
// - To remove a scene, delete its entry. To add one, copy an entry and change it.
// - SCENE_LEN is how long each scene stays (seconds); FADE is the cross-fade time.
//
// draw(ctx, w, h, t, u): w/h = size in px, t = time in seconds,
// u = progress through the scene from 0 to 1 (use it for entrance animations).

import { drawNationalDay } from "./nationalDay";

const TAU = Math.PI * 2;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
const easeInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- shapes */

function crescent(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(cx - r - 2, cy - r - 2, r * 2 + 4, r * 2 + 4);
  ctx.arc(cx + r * 0.42, cy - r * 0.22, r * 0.86, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill("evenodd");
  ctx.restore();
}

function lantern(ctx, x, top, s, lit, swing) {
  ctx.save();
  ctx.translate(x, 0);
  ctx.rotate(swing);
  ctx.translate(-x, 0);
  if (lit > 0) {
    const g = ctx.createRadialGradient(x, top + s * 0.65, 0, x, top + s * 0.65, s * 2.4);
    g.addColorStop(0, `rgba(255, 196, 92, ${0.45 * lit})`);
    g.addColorStop(1, "rgba(255, 196, 92, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - s * 2.5, top - s * 2, s * 5, s * 5);
  }
  ctx.strokeStyle = "rgba(230, 184, 92, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, top - s * 0.45);
  ctx.stroke();
  ctx.fillStyle = "#e6b85c";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.36, top);
  ctx.quadraticCurveTo(x, top - s * 0.5, x + s * 0.36, top);
  ctx.closePath();
  ctx.fill();
  const body = ctx.createLinearGradient(x, top, x, top + s * 1.3);
  body.addColorStop(0, lit > 0 ? `rgba(255, 246, 214, ${0.35 + 0.65 * lit})` : "rgba(80, 70, 50, 0.9)");
  body.addColorStop(1, lit > 0 ? `rgba(230, 160, 70, ${0.4 + 0.6 * lit})` : "rgba(60, 45, 30, 0.9)");
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, top);
  ctx.lineTo(x + s * 0.3, top);
  ctx.quadraticCurveTo(x + s * 0.62, top + s * 0.65, x + s * 0.3, top + s * 1.3);
  ctx.lineTo(x - s * 0.3, top + s * 1.3);
  ctx.quadraticCurveTo(x - s * 0.62, top + s * 0.65, x - s * 0.3, top);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "#e6b85c";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#e6b85c";
  ctx.fillRect(x - s * 0.34, top + s * 1.3, s * 0.68, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.2, top + s * 1.4);
  ctx.lineTo(x, top + s * 1.7);
  ctx.lineTo(x + s * 0.2, top + s * 1.4);
  ctx.fill();
  ctx.restore();
}

function skyline(ctx, w, h, color) {
  const base = h - Math.max(18, w * 0.03);
  ctx.fillStyle = color;
  ctx.fillRect(0, base, w, h - base);
  const unit = Math.min(w, 900);
  const domes = [0.08, 0.24, 0.5, 0.76, 0.92];
  domes.forEach((fx, i) => {
    const x = w * fx;
    const r = unit * (i === 2 ? 0.075 : 0.045);
    ctx.fillRect(x - r, base - r * 0.55, r * 2, r * 0.6);
    ctx.beginPath();
    ctx.moveTo(x - r, base - r * 0.5);
    ctx.bezierCurveTo(x - r, base - r * 1.5, x - r * 0.15, base - r * 1.5, x, base - r * 1.9);
    ctx.bezierCurveTo(x + r * 0.15, base - r * 1.5, x + r, base - r * 1.5, x + r, base - r * 0.5);
    ctx.fill();
  });
  [0.16, 0.38, 0.62, 0.84].forEach((fx, i) => {
    const x = w * fx;
    const mw = unit * 0.012;
    const mh = unit * (i === 1 || i === 2 ? 0.2 : 0.14);
    ctx.fillRect(x - mw / 2, base - mh, mw, mh);
    ctx.fillRect(x - mw, base - mh * 0.72, mw * 2, mw * 0.5);
    ctx.beginPath();
    ctx.moveTo(x - mw / 2, base - mh);
    ctx.lineTo(x, base - mh - mw * 2.6);
    ctx.lineTo(x + mw / 2, base - mh);
    ctx.fill();
  });
}

function cap(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = "#0a0f1e";
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, s * 0.08);
  ctx.lineTo(-s * 0.55, s * 0.55);
  ctx.quadraticCurveTo(0, s * 0.78, s * 0.55, s * 0.55);
  ctx.lineTo(s * 0.55, s * 0.08);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.36);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s * 0.36);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(225, 179, 90, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "#e1b35a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.7, s * 0.1);
  ctx.lineTo(s * 0.72, s * 0.75);
  ctx.stroke();
  ctx.restore();
}

/* ---------------------------------------------------------------- sky scenes */

const STARS = (() => {
  const r = rng(7);
  return Array.from({ length: 140 }, () => ({ x: r(), y: r() * 0.8, s: 0.5 + r() * 1.6, p: r() * TAU }));
})();

function makeConfetti(seed, count, colors) {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    return {
      side: left ? 0 : 1,
      delay: r() * 0.35,
      vx: (left ? 1 : -1) * (0.08 + r() * 0.32),
      vy: -(0.7 + r() * 0.55),
      spin: (r() - 0.5) * 14,
      size: 3 + r() * 5,
      color: colors[i % colors.length],
      shape: r(),
    };
  });
}

const EID_CONFETTI = makeConfetti(3, 180, ["#f2b33d", "#ffffff", "#e76f51", "#8e5ad6", "#2a9d8f"]);
const GRAD_GOLD = makeConfetti(11, 90, ["#e1b35a", "#f5d48a", "#ffffff"]);

function drawConfettiBurst(ctx, w, h, list, u) {
  const unit = Math.min(w, h);
  for (const c of list) {
    const k = (u - c.delay) * 1.6;
    if (k <= 0) continue;
    const x = (c.side ? w : 0) + c.vx * unit * k * 1.4;
    const y = h + c.vy * unit * 1.5 * k + 0.9 * unit * k * k;
    if (y > h + 20) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(c.spin * k);
    ctx.fillStyle = c.color;
    if (c.shape < 0.6) ctx.fillRect(-c.size, -c.size * 0.4, c.size * 2, c.size * 0.8);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, c.size * 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}


export const SCENES = [
  {
    word: { ar: "رمضان", en: "Ramadan" },
    // colours of the soft light in the page background while this scene plays
    tint: ["#6d5bd0", "#e6b85c", "#3b4bd0"],
    glow: "rgba(230, 184, 92, 0.55)",
    draw(ctx, w, h, t, u) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#070a24");
      g.addColorStop(1, "#262b78");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (const s of STARS) {
        ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + s.p));
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const unit = Math.min(w, h);
      const r = unit * 0.085;
      const cx = w * 0.5;
      const cy = lerp(h * 0.62, h * 0.2, ease(u * 1.6));
      const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
      glow.addColorStop(0, "rgba(230, 184, 92, 0.32)");
      glow.addColorStop(1, "rgba(230, 184, 92, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
      crescent(ctx, cx, cy, r, "#e6b85c");
      const spots = [0.1, 0.24, 0.76, 0.9];
      spots.forEach((fx, i) => {
        const target = h * (0.16 + (i % 2) * 0.1);
        const top = lerp(-unit * 0.2, target, ease(u * 2 - i * 0.12));
        const lit = ease((u - 0.3 - i * 0.07) * 5);
        lantern(ctx, w * fx, top, unit * 0.045, lit, Math.sin(t * 1.3 + i) * 0.05);
      });
      skyline(ctx, w, h, "rgba(4, 6, 24, 0.85)");
    },
  },
  {
    word: { ar: "العيد", en: "Eid" },
    tint: ["#f2a65a", "#a8507a", "#f6b3c8"],
    glow: "rgba(255, 190, 140, 0.6)",
    draw(ctx, w, h, t, u) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#2a1650");
      g.addColorStop(0.55, "#a8507a");
      g.addColorStop(1, "#ffc98f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const unit = Math.min(w, h);
      const sy = lerp(h * 1.1, h * 0.86, ease(u * 1.4));
      const sun = ctx.createRadialGradient(w / 2, sy, 0, w / 2, sy, unit * 0.7);
      sun.addColorStop(0, "rgba(255, 236, 190, 0.95)");
      sun.addColorStop(0.25, "rgba(255, 200, 140, 0.5)");
      sun.addColorStop(1, "rgba(255, 200, 140, 0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + t * 0.05;
        ctx.fillStyle = "rgba(255, 240, 210, 0.05)";
        ctx.beginPath();
        ctx.moveTo(w / 2, sy);
        ctx.arc(w / 2, sy, unit * 1.5, a, a + 0.18);
        ctx.fill();
      }
      drawConfettiBurst(ctx, w, h, EID_CONFETTI, u);
      skyline(ctx, w, h, "rgba(60, 20, 50, 0.55)");
    },
  },
  {
    // The National Day scene lives in its own file: ./nationalDay.js
    word: { ar: "اليوم الوطني", en: "National Day" },
    tint: ["#16a34a", "#006c35", "#c9a24a"],
    glow: "rgba(120, 220, 160, 0.5)",
    draw: drawNationalDay,
  },
  {
    word: { ar: "التخرج", en: "Graduation" },
    tint: ["#1e40af", "#e1b35a", "#3b82f6"],
    glow: "rgba(225, 179, 90, 0.5)",
    draw(ctx, w, h, t, u) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0a1630");
      g.addColorStop(1, "#1e3a78");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (const side of [0, 1]) {
        const x0 = side ? w * 0.85 : w * 0.15;
        const sway = Math.sin(t * 0.6 + side * 2) * w * 0.12;
        const beam = ctx.createLinearGradient(x0, h, w / 2 + sway, 0);
        beam.addColorStop(0, "rgba(255, 240, 200, 0.22)");
        beam.addColorStop(1, "rgba(255, 240, 200, 0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(x0 - 10, h);
        ctx.lineTo(w / 2 + sway - w * 0.12, 0);
        ctx.lineTo(w / 2 + sway + w * 0.12, 0);
        ctx.lineTo(x0 + 10, h);
        ctx.fill();
      }
      const unit = Math.min(w, h);
      const r = rng(21);
      for (let i = 0; i < 9; i++) {
        const delay = r() * 0.25;
        const k = Math.max(0, (u - delay) * 1.3);
        const x0 = w * (0.15 + r() * 0.7);
        const vx = (r() - 0.5) * w * 0.25;
        const peak = h * (0.15 + r() * 0.3);
        const y = h + 20 - (h + 20 - peak) * (1 - Math.pow(1 - Math.min(k, 2) / 1, 2));
        if (k <= 0) continue;
        cap(ctx, x0 + vx * k, Math.min(h + 40, y), unit * (0.04 + r() * 0.025), k * (r() > 0.5 ? 6 : -6));
      }
      for (const c of GRAD_GOLD) {
        const x = (c.delay * 2.7 + c.vx + 1) % 1;
        const y = ((t * (0.04 + c.size * 0.006) + c.delay * 3) % 1.1) - 0.05;
        ctx.save();
        ctx.translate(x * w, y * h);
        ctx.rotate(t * c.spin * 0.2);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size, -c.size * 0.4, c.size * 2, c.size * 0.8);
        ctx.restore();
      }
    },
  },
];

export const SCENE_LEN = 5.6;
export const FADE = 1.8;

export function sceneAt(time) {
  const cycle = SCENE_LEN * SCENES.length;
  const tt = ((time % cycle) + cycle) % cycle;
  const index = Math.floor(tt / SCENE_LEN);
  const local = tt - index * SCENE_LEN;
  return { index, local };
}

// The outgoing scene is drawn on its own layer and faded as a whole, so a scene
// that changes transparency while drawing (stars, fireworks…) can't break the fade.
let fadeLayer = null;

function layerFor(ctx) {
  const { width, height } = ctx.canvas;
  if (!fadeLayer || fadeLayer.width !== width || fadeLayer.height !== height) {
    fadeLayer = document.createElement("canvas");
    fadeLayer.width = width;
    fadeLayer.height = height;
  }
  const lctx = fadeLayer.getContext("2d");
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.clearRect(0, 0, width, height);
  lctx.setTransform(ctx.getTransform());
  return lctx;
}

/** Draws the sky at `time` (seconds) and returns the index of the current scene. */
export function drawSky(ctx, w, h, time, layout = {}) {
  const { index, local } = sceneAt(time);
  const scene = SCENES[index];
  scene.draw(ctx, w, h, time, local / SCENE_LEN, layout);
  if (local < FADE) {
    const prev = SCENES[(index + SCENES.length - 1) % SCENES.length];
    const lctx = layerFor(ctx);
    prev.draw(lctx, w, h, time, (SCENE_LEN + local) / SCENE_LEN, layout);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1 - easeInOut(local / FADE);
    ctx.drawImage(fadeLayer, 0, 0);
    ctx.restore();
  }
  return index;
}
