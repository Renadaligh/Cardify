// Saudi National Day scene for the home page sky.
// The Saudi flag waving above the title, the Riyadh skyline lit green (Kingdom Centre and
// Al Faisaliah), searchlights and green / white / gold fireworks.
//
// Colours are at the top so they're easy to change.

const SAUDI_GREEN = "#006C35";
const NIGHT_TOP = "#010d07";
const NIGHT_BOTTOM = "#03301b";
const CITY = "#02140b";
const LIGHT_GREEN = "#22c55e";
const FIREWORK_COLORS = ["#2ee67a", "#ffffff", "#e6c46a", "#2ee67a", "#a7f3c4"];

const TAU = Math.PI * 2;
const SCENE_SECONDS = 5.6;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- the flag */

// The official flag drawing (public/flags/sa.svg) is used when it's there, so the
// Shahada keeps its exact Thuluth calligraphy. Until then a simple stand-in is drawn.
const FLAG_FILE = `${import.meta.env.BASE_URL}flags/sa.svg`;
const FLAG_W = 1200;
const FLAG_H = 800;
let flagCanvas = null;
let officialFlag = null;
let officialRequested = false;
let fallbackHasFont = false;

function requestOfficialFlag() {
  if (officialRequested) return;
  officialRequested = true;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = FLAG_W;
    c.height = FLAG_H;
    c.getContext("2d").drawImage(img, 0, 0, FLAG_W, FLAG_H);
    officialFlag = c;
  };
  img.onerror = () => {};
  img.src = FLAG_FILE;
}

const fontReady = () => {
  try {
    return document.fonts.check('700 40px "Amiri"');
  } catch {
    return false;
  }
};

/** Stand-in used only if public/flags/sa.svg is missing. */
function buildFallbackFlag() {
  const c = document.createElement("canvas");
  c.width = FLAG_W;
  c.height = FLAG_H;
  const x = c.getContext("2d");
  x.fillStyle = SAUDI_GREEN;
  x.fillRect(0, 0, FLAG_W, FLAG_H);
  const text = "لا إله إلا الله محمد رسول الله";
  x.fillStyle = "#ffffff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.direction = "rtl";
  let size = 230;
  x.font = `700 ${size}px "Amiri", serif`;
  const maxW = FLAG_W * 0.84;
  const measured = x.measureText(text).width;
  if (measured > maxW) {
    size = (size * maxW) / measured;
    x.font = `700 ${size}px "Amiri", serif`;
  }
  x.fillText(text, FLAG_W / 2, FLAG_H * 0.38);
  // sword: blade towards the hoist (left), hilt towards the fly (right)
  const y = FLAG_H * 0.7;
  const bladeH = FLAG_H * 0.03;
  x.beginPath();
  x.moveTo(FLAG_W * 0.2, y - bladeH);
  x.quadraticCurveTo(FLAG_W * 0.23, y - bladeH * 0.5, FLAG_W * 0.26, y - bladeH * 0.5);
  x.lineTo(FLAG_W * 0.69, y - bladeH * 0.5);
  x.lineTo(FLAG_W * 0.69, y + bladeH * 0.5);
  x.lineTo(FLAG_W * 0.26, y + bladeH * 0.5);
  x.quadraticCurveTo(FLAG_W * 0.22, y + bladeH * 0.5, FLAG_W * 0.2, y - bladeH);
  x.fill();
  x.fillRect(FLAG_W * 0.69 - 5, y - bladeH * 1.6, 11, bladeH * 3.2);
  x.fillRect(FLAG_W * 0.69 + 6, y - bladeH * 0.5, FLAG_W * 0.1, bladeH);
  flagCanvas = c;
  fallbackHasFont = fontReady();
}

function currentFlag() {
  requestOfficialFlag();
  if (officialFlag) return officialFlag;
  if (!flagCanvas || (!fallbackHasFont && fontReady())) buildFallbackFlag();
  return flagCanvas;
}

/** The flag floating and waving in the wind (no pole), centred at cx with its top at `top`. */
function drawWavingFlag(ctx, cx, top, fw, fh, t) {
  const src = currentFlag();
  const strips = Math.max(60, Math.min(200, Math.round(fw / 2)));
  const sw = FLAG_W / strips;
  const dw = fw / strips;
  const amp = fh * 0.06;
  const left = cx - fw / 2;
  const bob = Math.sin(t * 1.1) * fh * 0.03;

  // soft glow behind the flag
  const halo = ctx.createRadialGradient(cx, top + fh / 2, 0, cx, top + fh / 2, fw * 0.85);
  halo.addColorStop(0, "rgba(34, 197, 94, 0.25)");
  halo.addColorStop(1, "rgba(34, 197, 94, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(cx - fw, top - fh, fw * 2, fh * 3);

  for (let i = 0; i < strips; i++) {
    const f = i / strips;
    const phase = f * 6.2 - t * 3.4;
    const wave = Math.sin(phase) * amp * (0.45 + f * 0.75);
    const slope = Math.cos(phase);
    const x = left + i * dw;
    const y = top + bob + wave;
    ctx.drawImage(src, i * sw, 0, sw, FLAG_H, x, y, dw + 1, fh);
    const shade = slope * (0.12 + f * 0.2);
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade * 0.32})` : `rgba(0,0,0,${-shade})`;
    ctx.fillRect(x, y, dw + 1, fh);
  }
}

/* ---------------------------------------------------------------- city */

function kingdomCentre(ctx, cx, base, H, W, glow) {
  const top = base - H;
  const horn = W * 0.36;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(cx - W / 2, base);
    ctx.quadraticCurveTo(cx - W * 0.45, top + H * 0.4, cx - horn, top);
    ctx.quadraticCurveTo(cx, top + H * 0.42, cx + horn, top);
    ctx.quadraticCurveTo(cx + W * 0.45, top + H * 0.4, cx + W / 2, base);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = CITY;
  ctx.fill();
  ctx.save();
  ctx.shadowColor = LIGHT_GREEN;
  ctx.shadowBlur = 18 * glow;
  ctx.strokeStyle = `rgba(46, 230, 122, ${0.85 * glow})`;
  ctx.lineWidth = 2;
  path();
  ctx.stroke();
  ctx.restore();
  // skybridge across the opening
  const by = top + H * 0.13;
  ctx.fillStyle = `rgba(46, 230, 122, ${0.9 * glow})`;
  ctx.fillRect(cx - W * 0.21, by, W * 0.42, Math.max(2, H * 0.012));
}

function faisaliah(ctx, cx, base, H, W, glow) {
  const top = base - H;
  ctx.fillStyle = CITY;
  ctx.beginPath();
  ctx.moveTo(cx - W / 2, base);
  ctx.lineTo(cx - W * 0.08, top + H * 0.08);
  ctx.lineTo(cx, top);
  ctx.lineTo(cx + W * 0.08, top + H * 0.08);
  ctx.lineTo(cx + W / 2, base);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(46, 230, 122, ${0.5 * glow})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // the golden globe
  const gy = top + H * 0.24;
  const gr = W * 0.17;
  const g = ctx.createRadialGradient(cx - gr * 0.3, gy - gr * 0.3, 0, cx, gy, gr * 2.4);
  g.addColorStop(0, `rgba(255, 228, 150, ${0.95 * glow + 0.05})`);
  g.addColorStop(0.4, `rgba(230, 196, 106, ${0.5 * glow})`);
  g.addColorStop(1, "rgba(230, 196, 106, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, gy, gr * 2.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#c9a24a";
  ctx.beginPath();
  ctx.arc(cx, gy, gr, 0, TAU);
  ctx.fill();
}

function palm(ctx, x, base, H, lean) {
  ctx.strokeStyle = CITY;
  ctx.fillStyle = CITY;
  ctx.lineWidth = Math.max(3, H * 0.05);
  ctx.lineCap = "round";
  const topX = x + lean * H * 0.25;
  const topY = base - H;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + lean * H * 0.05, base - H * 0.5, topX, topY);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.42;
    const len = H * (0.42 + (i % 2) * 0.08);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + len * 0.28;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.5 - len * 0.12, ex, ey);
    ctx.lineTo(topX + Math.cos(a) * len * 0.45, topY + Math.sin(a) * len * 0.45 - len * 0.05);
    ctx.closePath();
    ctx.fill();
  }
}

function city(ctx, w, h, t, glow) {
  const base = h - Math.max(14, h * 0.02);
  const unit = Math.max(Math.min(w, h * 1.3), h * 0.58);

  // searchlights from behind the towers
  for (const [fx, speed, phase] of [
    [0.3, 0.5, 0],
    [0.62, 0.42, 2],
    [0.8, 0.55, 4],
  ]) {
    const x0 = w * fx;
    const ang = -Math.PI / 2 + Math.sin(t * speed + phase) * 0.45;
    const len = h * 1.1;
    const spread = 0.05;
    const g = ctx.createLinearGradient(x0, base, x0 + Math.cos(ang) * len, base + Math.sin(ang) * len);
    g.addColorStop(0, `rgba(46, 230, 122, ${0.28 * glow})`);
    g.addColorStop(1, "rgba(46, 230, 122, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.lineTo(x0 + Math.cos(ang - spread) * len, base + Math.sin(ang - spread) * len);
    ctx.lineTo(x0 + Math.cos(ang + spread) * len, base + Math.sin(ang + spread) * len);
    ctx.closePath();
    ctx.fill();
  }

  // generic towers with lit windows
  const r = rng(77);
  const towers = 26;
  for (let i = 0; i < towers; i++) {
    const tw = unit * (0.025 + r() * 0.035);
    const th = unit * (0.05 + r() * 0.12);
    const tx = (i / towers) * w + r() * 20 - 10;
    ctx.fillStyle = CITY;
    ctx.fillRect(tx, base - th, tw, th + 2);
    for (let wy = base - th + 6; wy < base - 4; wy += 7) {
      for (let wx = tx + 4; wx < tx + tw - 3; wx += 6) {
        if (r() < 0.32) {
          ctx.fillStyle = r() < 0.5 ? "rgba(167, 243, 196, 0.55)" : "rgba(255, 236, 190, 0.45)";
          ctx.fillRect(wx, wy, 2, 2.5);
        }
      }
    }
  }

  // landmarks
  kingdomCentre(ctx, w * 0.68, base, unit * 0.33, unit * 0.075, glow);
  faisaliah(ctx, w * 0.36, base, unit * 0.27, unit * 0.07, glow);

  // palms on the edges
  palm(ctx, w * 0.04, base, unit * 0.12, 0.4);
  palm(ctx, w * 0.11, base, unit * 0.09, -0.3);
  palm(ctx, w * 0.9, base, unit * 0.11, -0.35);
  palm(ctx, w * 0.97, base, unit * 0.08, 0.3);

  ctx.fillStyle = CITY;
  ctx.fillRect(0, base, w, h - base);
}

/* ---------------------------------------------------------------- fireworks */

const BURSTS = (() => {
  const r = rng(23);
  return Array.from({ length: 9 }, (_, i) => ({
    at: 0.25 + i * 0.58 + r() * 0.2,
    x: [0.14, 0.86, 0.3, 0.72, 0.1, 0.9, 0.5, 0.22, 0.8][i],
    y: 0.12 + r() * 0.22,
    color: FIREWORK_COLORS[i % FIREWORK_COLORS.length],
    sparks: 46 + Math.floor(r() * 20),
    seed: Math.floor(r() * 1e6),
  }));
})();

function fireworks(ctx, w, h, local) {
  const unit = Math.min(w, h);
  for (const b of BURSTS) {
    const k = local - b.at;
    if (k < -0.6 || k > 1.9) continue;
    const bx = b.x * w;
    const by = b.y * h;
    if (k < 0) {
      // rising trail
      const p = 1 + k / 0.6;
      const y = h - (h - by) * p;
      ctx.fillStyle = "rgba(255, 240, 210, 0.9)";
      ctx.fillRect(bx - 1, y, 2, 10);
      continue;
    }
    const life = k / 1.9;
    const alpha = 1 - life;
    const radius = unit * 0.16 * (1 - Math.pow(1 - Math.min(1, k / 0.9), 3));
    const r = rng(b.seed);
    ctx.fillStyle = b.color;
    for (let i = 0; i < b.sparks; i++) {
      const a = (i / b.sparks) * TAU + r() * 0.1;
      const sp = 0.75 + r() * 0.35;
      const x = bx + Math.cos(a) * radius * sp;
      const y = by + Math.sin(a) * radius * sp + unit * 0.05 * k * k;
      ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(i * 3 + k * 20));
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, 2.2 * (1 - life * 0.6)), 0, TAU);
      ctx.fill();
    }
    if (k < 0.25) {
      ctx.globalAlpha = (0.25 - k) * 2.4;
      const fl = ctx.createRadialGradient(bx, by, 0, bx, by, unit * 0.12);
      fl.addColorStop(0, "rgba(255,255,255,0.8)");
      fl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fl;
      ctx.fillRect(bx - unit * 0.12, by - unit * 0.12, unit * 0.24, unit * 0.24);
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------------------------------------------------------------- scene */

const STARS = (() => {
  const r = rng(91);
  return Array.from({ length: 90 }, () => ({ x: r(), y: r() * 0.6, s: 0.5 + r() * 1.3, p: r() * TAU }));
})();

export function drawNationalDay(ctx, w, h, t, u, layout = {}) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, NIGHT_TOP);
  sky.addColorStop(1, NIGHT_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  for (const s of STARS) {
    ctx.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.4 + s.p));
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
  }
  ctx.globalAlpha = 1;

  const local = u * SCENE_SECONDS;
  fireworks(ctx, w, h, local);

  // flag floating just above the title
  const narrow = w < 640;
  const titleTop = layout.titleTop || h * 0.4;
  const room = titleTop - 104 - h * 0.035;
  const fh = Math.max(60, Math.min(room, h * 0.24, (narrow ? w * 0.6 : w * 0.3) * (2 / 3)));
  const fw = fh * 1.5;
  const top = titleTop - h * 0.035 - fh;
  drawWavingFlag(ctx, w / 2, top, fw, fh, t);

  // the city lights up as the scene starts
  city(ctx, w, h, t, clamp01(u * 3));
}
