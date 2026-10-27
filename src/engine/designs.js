// Generated card designs, drawn entirely with code.
// Every design gets: the canvas size (W, H), a "frame" (the square where
// the text sits — the whole canvas for square cards, the middle square for
// stories), a colour palette and a seeded random generator (same look every time).
//
// Each design also declares a default layout for its text layers, in
// fractions of the frame, plus the fonts that suit it.

const TAU = Math.PI * 2;

function alpha(hex, a) {
  if (!hex || hex.startsWith("rgb")) return hex;
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function fillBackground(ctx, W, H, p) {
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, p.bg[0]);
  g.addColorStop(1, p.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function star8Path(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? r : r * 0.62;
    const a = (i / 16) * TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function star5Path(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function sparkle(ctx, cx, cy, r, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fillStyle = color;
  ctx.fill();
}

function diamond(ctx, cx, cy, r, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function crescent(ctx, cx, cy, r, color) {
  const size = Math.ceil(r * 2 + 8);
  const off = document.createElement("canvas");
  off.width = off.height = size;
  const o = off.getContext("2d");
  o.fillStyle = color;
  o.beginPath();
  o.arc(size / 2, size / 2, r, 0, TAU);
  o.fill();
  o.globalCompositeOperation = "destination-out";
  o.beginPath();
  o.arc(size / 2 + r * 0.42, size / 2 - r * 0.22, r * 0.86, 0, TAU);
  o.fill();
  ctx.drawImage(off, cx - size / 2, cy - size / 2);
}

function lantern(ctx, x, top, s, p) {
  const glow = ctx.createRadialGradient(x, top + s * 0.65, 0, x, top + s * 0.65, s * 1.6);
  glow.addColorStop(0, alpha(p.accent, 0.35));
  glow.addColorStop(1, alpha(p.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - s * 1.6, top - s, s * 3.2, s * 3.4);

  ctx.strokeStyle = alpha(p.accent, 0.75);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, top - s * 0.48);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, top - s * 0.42, s * 0.07, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.36, top);
  ctx.quadraticCurveTo(x, top - s * 0.5, x + s * 0.36, top);
  ctx.closePath();
  ctx.fill();

  const body = ctx.createLinearGradient(x, top, x, top + s * 1.3);
  body.addColorStop(0, "#fff6d6");
  body.addColorStop(1, alpha(p.accent, 0.85));
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, top);
  ctx.lineTo(x + s * 0.3, top);
  ctx.quadraticCurveTo(x + s * 0.62, top + s * 0.65, x + s * 0.3, top + s * 1.3);
  ctx.lineTo(x - s * 0.3, top + s * 1.3);
  ctx.quadraticCurveTo(x - s * 0.62, top + s * 0.65, x - s * 0.3, top);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = p.accent;
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = alpha(p.accent, 0.8);
  for (const dx of [-0.13, 0.13]) {
    ctx.beginPath();
    ctx.moveTo(x + s * dx, top);
    ctx.quadraticCurveTo(x + s * dx * 2, top + s * 0.65, x + s * dx, top + s * 1.3);
    ctx.stroke();
  }

  ctx.fillStyle = p.accent;
  ctx.fillRect(x - s * 0.34, top + s * 1.3, s * 0.68, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.2, top + s * 1.4);
  ctx.lineTo(x, top + s * 1.68);
  ctx.lineTo(x + s * 0.2, top + s * 1.4);
  ctx.closePath();
  ctx.fill();
}

function skyline(ctx, W, H, color) {
  const base = H - W * 0.05;
  ctx.fillStyle = color;
  ctx.fillRect(0, base, W, H - base);
  const domes = [
    [0.12, 0.05],
    [0.3, 0.075],
    [0.5, 0.11],
    [0.7, 0.075],
    [0.88, 0.05],
  ];
  for (const [fx, fr] of domes) {
    const x = W * fx;
    const r = W * fr;
    ctx.fillRect(x - r, base - r * 0.55, r * 2, r * 0.6);
    ctx.beginPath();
    ctx.moveTo(x - r, base - r * 0.5);
    ctx.bezierCurveTo(x - r, base - r * 1.5, x - r * 0.15, base - r * 1.5, x, base - r * 1.9);
    ctx.bezierCurveTo(x + r * 0.15, base - r * 1.5, x + r, base - r * 1.5, x + r, base - r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - 1.5, base - r * 2.2, 3, r * 0.4);
  }
  for (const fx of [0.2, 0.4, 0.6, 0.8]) {
    const x = W * fx;
    const mw = W * 0.016;
    const mh = W * (fx === 0.4 || fx === 0.6 ? 0.25 : 0.17);
    ctx.fillRect(x - mw / 2, base - mh, mw, mh);
    ctx.fillRect(x - mw * 0.9, base - mh * 0.72, mw * 1.8, mw * 0.5);
    ctx.beginPath();
    ctx.moveTo(x - mw / 2, base - mh);
    ctx.lineTo(x, base - mh - mw * 2.4);
    ctx.lineTo(x + mw / 2, base - mh);
    ctx.closePath();
    ctx.fill();
  }
}

function confettiPiece(ctx, x, y, s, color, rand) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rand() * TAU);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const kind = rand();
  if (kind < 0.45) {
    ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8);
  } else if (kind < 0.75) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.6, 0, TAU);
    ctx.fill();
  } else {
    ctx.lineWidth = s * 0.45;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, s, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

function inTextZone(fx, fy) {
  return fx > 0.14 && fx < 0.86 && fy > 0.26 && fy < 0.84;
}

function flower(ctx, cx, cy, r, color, center, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    ctx.rotate(TAU / 5);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.38, r * 0.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function leaf(ctx, cx, cy, len, angle, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  ctx.fill();
  ctx.restore();
}

function floralCluster(ctx, cx, cy, s, p, rand, dir) {
  const leafColor = p.leaf || "#9cbf9a";
  for (let i = 0; i < 6; i++) {
    const a = dir + (rand() - 0.5) * 2.2;
    leaf(ctx, cx, cy, s * (0.9 + rand() * 0.6), a, alpha(leafColor, 0.85));
  }
  const colors = p.floral || [p.accent, alpha(p.accent, 0.7), alpha(p.accent, 0.45)];
  const spots = [
    [0, 0, 1],
    [Math.cos(dir + 0.7) * s * 0.9, Math.sin(dir + 0.7) * s * 0.9, 0.7],
    [Math.cos(dir - 0.7) * s * 0.9, Math.sin(dir - 0.7) * s * 0.9, 0.62],
    [Math.cos(dir) * s * 1.35, Math.sin(dir) * s * 1.35, 0.45],
  ];
  spots.forEach(([dx, dy, k], i) => {
    flower(ctx, cx + dx, cy + dy, s * 0.55 * k, colors[i % colors.length], p.flowerCenter || "#f7d58b", rand() * TAU);
  });
}

function balloon(ctx, x, y, r, color, stringTo) {
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.2);
  ctx.bezierCurveTo(x - r * 0.4, y + r * 2, x + r * 0.4, stringTo - r, x + r * 0.1, stringTo);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.18, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.12, y + r * 1.24);
  ctx.lineTo(x + r * 0.12, y + r * 1.24);
  ctx.lineTo(x, y + r * 1.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.45, r * 0.18, r * 0.32, -0.5, 0, TAU);
  ctx.fill();
}

function patternStars(ctx, W, H, color, step) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let y = -step / 2; y < H + step; y += step) {
    for (let x = -step / 2; x < W + step; x += step) {
      star8Path(ctx, x, y, step * 0.34);
      ctx.stroke();
      diamond(ctx, x + step / 2, y + step / 2, step * 0.06, color);
    }
  }
}

function divider(ctx, cx, y, w, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y);
  ctx.lineTo(cx - 18, y);
  ctx.moveTo(cx + 18, y);
  ctx.lineTo(cx + w / 2, y);
  ctx.stroke();
  diamond(ctx, cx, y, 9, color);
}

// Default text layout (fractions of the frame). Designs override parts of it.
const BASE_LAYOUT = {
  title: { y: 0.4, size: 108 },
  sub: { y: 0.485, size: 28 },
  phrase: { y: 0.56, size: 38, maxW: 0.66 },
  name: { y: 0.735, size: 62, maxW: 0.76 },
  to: { y: 0.7, size: 46, maxW: 0.76 },
  from: { y: 0.79, size: 40, maxW: 0.76 },
  logo: { x: 0.5, y: 0.17, w: 0.13 },
};

const layout = (overrides) => {
  const out = {};
  for (const key of Object.keys(BASE_LAYOUT)) out[key] = { ...BASE_LAYOUT[key], ...(overrides[key] || {}) };
  return out;
};

export const DESIGNS = {
  crescent: {
    name: { ar: "هلال وفوانيس", en: "Crescent & lanterns" },
    fonts: { title: "Reem Kufi", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.43 },
      sub: { y: 0.512 },
      phrase: { y: 0.585 },
      name: { y: 0.745 },
      to: { y: 0.71 },
      from: { y: 0.795 },
      logo: { x: 0.5, y: 0.885, w: 0.11 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      for (let i = 0; i < 90; i++) {
        const x = rand() * W;
        const y = rand() * H * 0.85;
        ctx.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + rand() * 2.2, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 7; i++) {
        sparkle(ctx, rand() * W, rand() * H * 0.7, 6 + rand() * 9, alpha(p.accent, 0.8));
      }
      const cx = f.x + f.w * 0.5;
      const cy = f.y + f.h * 0.2;
      const r = f.w * 0.085;
      const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.4);
      glow.addColorStop(0, alpha(p.accent, 0.28));
      glow.addColorStop(1, alpha(p.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(cx - r * 2.5, cy - r * 2.5, r * 5, r * 5);
      crescent(ctx, cx, cy, r, p.accent);
      const s = f.w * 0.055;
      lantern(ctx, f.x + f.w * 0.16, f.y + f.h * 0.2, s, p);
      lantern(ctx, f.x + f.w * 0.84, f.y + f.h * 0.3, s * 0.85, p);
      skyline(ctx, W, H, p.silhouette || "rgba(0,0,0,0.28)");
    },
  },

  arch: {
    name: { ar: "قوس إسلامي", en: "Islamic arch" },
    fonts: { title: "Amiri", text: "Amiri", name: "El Messiri" },
    layout: layout({
      title: { y: 0.42, size: 112 },
      sub: { y: 0.5 },
      phrase: { y: 0.575, size: 36 },
      name: { y: 0.75 },
      to: { y: 0.715 },
      from: { y: 0.8 },
      logo: { x: 0.5, y: 0.885, w: 0.11 },
    }),
    draw(ctx, W, H, f, p) {
      fillBackground(ctx, W, H, p);
      patternStars(ctx, W, H, p.soft || alpha(p.accent, 0.07), W / 6);
      const m = W * 0.08;
      const x0 = m;
      const x1 = W - m;
      const yb = H - m;
      const yApex = m + (H - W) * 0.15;
      const ys = yApex + W * 0.3;
      const archPath = (inset) => {
        ctx.beginPath();
        ctx.moveTo(x0 + inset, yb - inset);
        ctx.lineTo(x0 + inset, ys);
        ctx.bezierCurveTo(x0 + inset, ys - W * 0.17, W / 2 - W * 0.1, yApex + inset + W * 0.06, W / 2, yApex + inset);
        ctx.bezierCurveTo(W / 2 + W * 0.1, yApex + inset + W * 0.06, x1 - inset, ys - W * 0.17, x1 - inset, ys);
        ctx.lineTo(x1 - inset, yb - inset);
        ctx.closePath();
      };
      archPath(0);
      ctx.fillStyle = p.panel || (p.dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)");
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = p.accent;
      ctx.stroke();
      archPath(16);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = alpha(p.accent, 0.7);
      ctx.stroke();
      star8Path(ctx, W / 2, yApex + W * 0.085, W * 0.032);
      ctx.fillStyle = p.accent;
      ctx.fill();
      for (const dx of [-1, 1]) diamond(ctx, W / 2 + dx * W * 0.06, yApex + W * 0.1, 6, alpha(p.accent, 0.8));
    },
  },

  geometric: {
    name: { ar: "نقوش هندسية", en: "Geometric" },
    fonts: { title: "El Messiri", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.39, size: 100 },
      sub: { y: 0.47 },
      phrase: { y: 0.545, maxW: 0.62 },
      name: { y: 0.715, maxW: 0.66 },
      to: { y: 0.68, maxW: 0.66 },
      from: { y: 0.765, maxW: 0.66 },
      logo: { x: 0.5, y: 0.245, w: 0.11 },
    }),
    draw(ctx, W, H, f, p) {
      fillBackground(ctx, W, H, p);
      patternStars(ctx, W, H, p.soft || alpha(p.accent, p.dark ? 0.16 : 0.14), W / 7);
      const x = f.x + f.w * 0.11;
      const y = f.y + f.h * 0.15;
      const w = f.w * 0.78;
      const h = f.h * 0.71;
      roundRect(ctx, x, y, w, h, 26);
      ctx.fillStyle = p.panel || (p.dark ? "rgba(0,0,0,0.38)" : "rgba(255,255,255,0.9)");
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = p.accent;
      ctx.stroke();
      roundRect(ctx, x + 12, y + 12, w - 24, h - 24, 18);
      ctx.lineWidth = 1;
      ctx.strokeStyle = alpha(p.accent, 0.6);
      ctx.stroke();
      for (const [cx, cy] of [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
      ]) {
        star8Path(ctx, cx, cy, 16);
        ctx.fillStyle = p.accent;
        ctx.fill();
      }
    },
  },

  waves: {
    name: { ar: "أمواج", en: "Waves" },
    fonts: { title: "Lalezar", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.37, size: 120 },
      sub: { y: 0.455 },
      phrase: { y: 0.53 },
      name: { y: 0.695 },
      to: { y: 0.66 },
      from: { y: 0.75 },
      logo: { x: 0.5, y: 0.15, w: 0.13 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      const glow = ctx.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, W * 0.5);
      glow.addColorStop(0, alpha(p.accent, 0.16));
      glow.addColorStop(1, alpha(p.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = alpha(p.accent, 0.18);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.beginPath();
          ctx.arc(W * 0.06 + c * 22, H * 0.06 + r * 22, 3.5, 0, TAU);
          ctx.fill();
        }
      }
      const colors = p.waves || [alpha(p.accent, 0.22), alpha(p.accent, 0.45), p.accent];
      colors.forEach((color, i) => {
        const top = H - W * (0.2 - i * 0.05);
        const amp = W * 0.022;
        const phase = rand() * TAU;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) {
          ctx.lineTo(x, top + Math.sin((x / W) * TAU * 1.1 + phase) * amp);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      });
    },
  },

  frame: {
    name: { ar: "إطار أنيق", en: "Elegant frame" },
    fonts: { title: "Amiri", text: "Amiri", name: "El Messiri" },
    layout: layout({
      title: { y: 0.39, size: 110 },
      sub: { y: 0.475 },
      phrase: { y: 0.6, size: 36 },
      name: { y: 0.76 },
      to: { y: 0.725 },
      from: { y: 0.81 },
      logo: { x: 0.5, y: 0.19, w: 0.12 },
    }),
    draw(ctx, W, H, f, p) {
      fillBackground(ctx, W, H, p);
      const a = W * 0.045;
      const b = W * 0.062;
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(a, a, W - 2 * a, H - 2 * a);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(b, b, W - 2 * b, H - 2 * b);
      const corners = [
        [b, b, 0],
        [W - b, b, Math.PI / 2],
        [W - b, H - b, Math.PI],
        [b, H - b, (3 * Math.PI) / 2],
      ];
      for (const [cx, cy, rot] of corners) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 2;
        for (const r of [34, 52]) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI / 2);
          ctx.stroke();
        }
        star8Path(ctx, 0, 0, 14);
        ctx.fillStyle = p.accent;
        ctx.fill();
        diamond(ctx, 70, 0, 5, p.accent);
        diamond(ctx, 0, 70, 5, p.accent);
        ctx.restore();
      }
      divider(ctx, f.x + f.w / 2, f.y + f.h * 0.525, f.w * 0.36, p.accent);
    },
  },

  confetti: {
    name: { ar: "احتفال", en: "Confetti" },
    fonts: { title: "Lalezar", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.41, size: 120 },
      sub: { y: 0.495 },
      phrase: { y: 0.57 },
      name: { y: 0.74 },
      to: { y: 0.705 },
      from: { y: 0.79 },
      logo: { x: 0.5, y: 0.2, w: 0.12 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      for (const [x, y, r] of [
        [0, 0, 0.45],
        [W, H, 0.5],
      ]) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, W * r);
        g.addColorStop(0, alpha(p.accent, 0.14));
        g.addColorStop(1, alpha(p.accent, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      const colors = p.confetti || [p.accent, alpha(p.accent, 0.6)];
      let placed = 0;
      while (placed < 110) {
        const fx = rand();
        const fy = rand();
        if (inTextZone(fx, fy)) continue;
        confettiPiece(ctx, fx * W, fy * H, 6 + rand() * 9, colors[placed % colors.length], rand);
        placed++;
      }
    },
  },

  sadu: {
    name: { ar: "سدو", en: "Sadu" },
    fonts: { title: "Reem Kufi", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.43, size: 110 },
      sub: { y: 0.51 },
      phrase: { y: 0.585 },
      name: { y: 0.745 },
      to: { y: 0.71 },
      from: { y: 0.795 },
      logo: { x: 0.5, y: 0.235, w: 0.12 },
    }),
    draw(ctx, W, H, f, p) {
      fillBackground(ctx, W, H, p);
      const [red, dark, light, gold] = p.sadu || ["#8b1e1e", "#2b1a12", "#f4e7d3", "#c98a3a"];
      const bandH = W * 0.12;
      const band = (y0) => {
        ctx.fillStyle = dark;
        ctx.fillRect(0, y0, W, bandH);
        ctx.fillStyle = light;
        ctx.fillRect(0, y0 + 6, W, 4);
        ctx.fillRect(0, y0 + bandH - 10, W, 4);
        ctx.fillStyle = red;
        ctx.fillRect(0, y0 + 14, W, 6);
        ctx.fillRect(0, y0 + bandH - 20, W, 6);
        const t = bandH * 0.42;
        const mid = y0 + bandH / 2;
        for (let x = 0, i = 0; x < W + t; x += t, i++) {
          ctx.fillStyle = i % 2 ? gold : red;
          ctx.beginPath();
          ctx.moveTo(x, mid - t * 0.5);
          ctx.lineTo(x + t / 2, mid);
          ctx.lineTo(x, mid + t * 0.5);
          ctx.lineTo(x - t / 2, mid);
          ctx.closePath();
          ctx.fill();
          diamond(ctx, x, mid, t * 0.16, light);
          ctx.fillStyle = light;
          ctx.beginPath();
          ctx.moveTo(x + t / 2 - 6, mid - t * 0.32);
          ctx.lineTo(x + t / 2, mid - t * 0.5);
          ctx.lineTo(x + t / 2 + 6, mid - t * 0.32);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x + t / 2 - 6, mid + t * 0.32);
          ctx.lineTo(x + t / 2, mid + t * 0.5);
          ctx.lineTo(x + t / 2 + 6, mid + t * 0.32);
          ctx.closePath();
          ctx.fill();
        }
      };
      band(0);
      band(H - bandH);
      divider(ctx, f.x + f.w / 2, f.y + f.h * 0.335, f.w * 0.3, p.accent);
    },
  },

  rays: {
    name: { ar: "إشراقة", en: "Sunburst" },
    fonts: { title: "Lalezar", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.43, size: 104, maxW: 0.58 },
      sub: { y: 0.51 },
      phrase: { y: 0.585, size: 34, maxW: 0.54 },
      name: { y: 0.84 },
      to: { y: 0.815 },
      from: { y: 0.895, size: 36 },
      logo: { x: 0.5, y: 0.235, w: 0.12 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      const cx = f.x + f.w / 2;
      const cy = f.y + f.h * 0.43;
      const R = Math.hypot(W, H);
      ctx.fillStyle = p.dark ? "rgba(255,255,255,0.05)" : alpha(p.accent, 0.06);
      for (let i = 0; i < 28; i += 2) {
        const a0 = (i / 28) * TAU;
        const a1 = ((i + 1) / 28) * TAU;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fill();
      }
      const r = f.w * 0.34;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = p.panel || (p.dark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.75)");
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = p.accent;
      ctx.stroke();
      ctx.setLineDash([2, 12]);
      ctx.lineCap = "round";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 22, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        sparkle(ctx, cx + Math.cos(a) * (r + 60), cy + Math.sin(a) * (r + 60), 7 + rand() * 4, alpha(p.accent, 0.7));
      }
    },
  },

  chalk: {
    name: { ar: "سبورة", en: "Chalkboard" },
    fonts: { title: "Lalezar", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.39, size: 116 },
      sub: { y: 0.475 },
      phrase: { y: 0.555 },
      name: { y: 0.725 },
      to: { y: 0.69 },
      from: { y: 0.775 },
      logo: { x: 0.5, y: 0.19, w: 0.12 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      for (let i = 0; i < 26; i++) {
        const g = ctx.createRadialGradient(rand() * W, rand() * H, 0, rand() * W, rand() * H, W * (0.1 + rand() * 0.2));
        g.addColorStop(0, "rgba(255,255,255,0.035)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      const t = W * 0.045;
      const wood = p.frame || "#8a5a32";
      ctx.fillStyle = wood;
      ctx.fillRect(0, 0, W, t);
      ctx.fillRect(0, H - t, W, t);
      ctx.fillRect(0, 0, t, H);
      ctx.fillRect(W - t, 0, t, H);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 4;
      ctx.strokeRect(t, t, W - 2 * t, H - 2 * t);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(t, H - t - 18, W - 2 * t, 18);
      ctx.fillStyle = "#f8f5ec";
      ctx.fillRect(W * 0.7, H - t - 26, 70, 12);
      ctx.fillStyle = "#f4b3c2";
      ctx.fillRect(W * 0.78, H - t - 26, 54, 12);

      const chalk = "rgba(255,255,255,0.55)";
      ctx.strokeStyle = chalk;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      star5Path(ctx, W * 0.15, H * 0.15, 30);
      ctx.stroke();
      star5Path(ctx, W * 0.85, H * 0.82, 22);
      ctx.stroke();
      ctx.save();
      ctx.translate(W * 0.83, H * 0.14);
      ctx.rotate(-0.12);
      ctx.font = `400 46px "Lalezar", "Tajawal", sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "center";
      ctx.fillText("أ ب ت", 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(W * 0.17, H * 0.84);
      ctx.rotate(0.08);
      ctx.font = `400 40px "Lalezar", "Tajawal", sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.textAlign = "center";
      ctx.fillText("1 + 2 = 3", 0, 0);
      ctx.restore();
      const cx = f.x + f.w / 2;
      const y = f.y + f.h * 0.43;
      ctx.strokeStyle = alpha(p.accent, 0.8);
      ctx.beginPath();
      ctx.moveTo(cx - f.w * 0.2, y);
      ctx.quadraticCurveTo(cx, y + 18, cx + f.w * 0.2, y - 4);
      ctx.stroke();
    },
  },

  cap: {
    name: { ar: "قبعة التخرج", en: "Graduation cap" },
    fonts: { title: "El Messiri", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.44, size: 106 },
      sub: { y: 0.52 },
      phrase: { y: 0.595 },
      name: { y: 0.755 },
      to: { y: 0.72 },
      from: { y: 0.805 },
      logo: { x: 0.5, y: 0.89, w: 0.11 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      const colors = p.confetti || [p.accent];
      for (let i = 0; i < 60; i++) {
        const fx = rand();
        const fy = rand() * 0.3;
        confettiPiece(ctx, fx * W, fy * H, 5 + rand() * 7, colors[i % colors.length], rand);
      }
      for (let i = 0; i < 30; i++) {
        confettiPiece(ctx, rand() * W, H * (0.88 + rand() * 0.12), 5 + rand() * 6, colors[i % colors.length], rand);
      }
      const cx = f.x + f.w / 2;
      const cy = f.y + f.h * 0.22;
      const w = f.w * 0.15;
      const h = f.w * 0.055;
      const capColor = p.cap || (p.dark ? "#0b0f1a" : "#1f2a44");
      ctx.fillStyle = capColor;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.55, cy + h * 0.2);
      ctx.lineTo(cx - w * 0.55, cy + h * 1.55);
      ctx.quadraticCurveTo(cx, cy + h * 2.1, cx + w * 0.55, cy + h * 1.55);
      ctx.lineTo(cx + w * 0.55, cy + h * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = p.dark ? alpha(p.accent, 0.6) : "rgba(255,255,255,0.25)";
      ctx.stroke();
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + w * 0.72, cy + h * 0.25);
      ctx.lineTo(cx + w * 0.74, cy + h * 2.1);
      ctx.stroke();
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.74 - 9, cy + h * 2.1);
      ctx.lineTo(cx + w * 0.74 + 9, cy + h * 2.1);
      ctx.lineTo(cx + w * 0.74 + 13, cy + h * 2.9);
      ctx.lineTo(cx + w * 0.74 - 13, cy + h * 2.9);
      ctx.closePath();
      ctx.fill();
    },
  },

  balloons: {
    name: { ar: "بالونات", en: "Balloons" },
    fonts: { title: "Lalezar", text: "Tajawal", name: "El Messiri" },
    layout: layout({
      title: { y: 0.41, size: 112, maxW: 0.56 },
      sub: { y: 0.495 },
      phrase: { y: 0.57, maxW: 0.56 },
      name: { y: 0.74, maxW: 0.6 },
      to: { y: 0.705, maxW: 0.6 },
      from: { y: 0.79, maxW: 0.6 },
      logo: { x: 0.5, y: 0.18, w: 0.12 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = alpha(p.accent, 0.12 + rand() * 0.15);
        ctx.beginPath();
        ctx.arc(rand() * W, rand() * H, 2 + rand() * 4, 0, TAU);
        ctx.fill();
      }
      const colors = p.balloons || [p.accent];
      const groups = [
        [
          [0.1, 0.2, 0.072],
          [0.2, 0.13, 0.062],
          [0.17, 0.3, 0.058],
          [0.07, 0.38, 0.05],
        ],
        [
          [0.9, 0.22, 0.072],
          [0.8, 0.14, 0.06],
          [0.84, 0.32, 0.056],
          [0.93, 0.4, 0.048],
        ],
      ];
      let c = 0;
      for (const group of groups) {
        for (const [fx, fy, fr] of group) {
          balloon(ctx, f.x + fx * f.w, f.y + fy * f.h, fr * f.w, colors[c++ % colors.length], f.y + f.h * 0.62);
        }
      }
    },
  },

  floral: {
    name: { ar: "ورود", en: "Florals" },
    fonts: { title: "Amiri", text: "Amiri", name: "El Messiri" },
    layout: layout({
      title: { y: 0.41, size: 110 },
      sub: { y: 0.495 },
      phrase: { y: 0.575, size: 36, maxW: 0.62 },
      name: { y: 0.745, maxW: 0.66 },
      to: { y: 0.71, maxW: 0.66 },
      from: { y: 0.795, maxW: 0.66 },
      logo: { x: 0.5, y: 0.2, w: 0.12 },
    }),
    draw(ctx, W, H, f, p, rand) {
      fillBackground(ctx, W, H, p);
      const m = W * 0.06;
      ctx.strokeStyle = alpha(p.accent, 0.55);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
      const s = W * 0.1;
      floralCluster(ctx, W - m * 1.2, m * 1.2, s, p, rand, (3 * Math.PI) / 4);
      floralCluster(ctx, m * 1.2, H - m * 1.2, s, p, rand, -Math.PI / 4);
      floralCluster(ctx, m * 1.1, m * 1.1, s * 0.55, p, rand, Math.PI / 4);
      floralCluster(ctx, W - m * 1.1, H - m * 1.1, s * 0.55, p, rand, (-3 * Math.PI) / 4);
    },
  },
};

export { alpha, star8Path, star5Path, diamond, roundRect, sparkle, confettiPiece };
