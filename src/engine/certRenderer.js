// Draws an A4 landscape certificate (2339 × 1654 px ≈ 200 dpi).

import { alpha, star8Path, star5Path, diamond, roundRect, confettiPiece } from "./designs";
import { fontString } from "./fonts";
import { fitParagraph } from "./textLayout";
import { isArabic, seededRandom } from "../lib/text";

export const CERT_SIZE = { w: 2339, h: 1654 };

const INK = "#1f2937";
const MUTED = "#6b7280";
const GOLD = "#c9a24a";

function mix(hex, amount, toward = "#ffffff") {
  const parse = (h) => {
    const n = parseInt(h.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = parse(hex);
  const b = parse(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function text(ctx, value, x, y, { font, size, weight = 700, color = INK, maxW, align = "center" }) {
  if (!value) return;
  let s = size;
  ctx.font = fontString(font, s, weight);
  ctx.direction = isArabic(value) ? "rtl" : "ltr";
  let w = ctx.measureText(value).width;
  if (maxW && w > maxW) {
    s = Math.max(size * 0.45, (size * maxW) / w);
    ctx.font = fontString(font, s, weight);
  }
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function paragraph(ctx, value, x, y, { font, size, color, maxW, weight = 500 }) {
  if (!value) return;
  ctx.direction = isArabic(value) ? "rtl" : "ltr";
  const fit = fitParagraph(ctx, value, { font, size, weight, maxW, maxLines: 3 });
  const lh = fit.size * 1.65;
  const top = y - ((fit.lines.length - 1) * lh) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  fit.lines.forEach((l, i) => ctx.fillText(l, x, top + i * lh));
}

function medal(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (const dx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * r * 0.25, cy + r * 0.5);
    ctx.lineTo(cx + dx * r * 0.75, cy + r * 1.75);
    ctx.lineTo(cx + dx * r * 0.45, cy + r * 1.55);
    ctx.lineTo(cx + dx * r * 0.2, cy + r * 1.85);
    ctx.lineTo(cx - dx * r * 0.1, cy + r * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rr = i % 2 ? r : r * 0.9;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  star5Path(ctx, cx, cy, r * 0.42);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
}

function cornerOrnament(ctx, x, y, rot, color, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (const r of [size * 0.55, size * 0.85]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI / 2);
    ctx.stroke();
  }
  star8Path(ctx, 0, 0, size * 0.28);
  ctx.fillStyle = color;
  ctx.fill();
  diamond(ctx, size * 1.1, 0, 9, color);
  diamond(ctx, 0, size * 1.1, 9, color);
  ctx.restore();
}

const STYLES = {
  classic(ctx, W, H, accent) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#fffdf7");
    g.addColorStop(1, "#f6eedb");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 22;
    ctx.strokeRect(60, 60, W - 120, H - 120);
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 100, W - 200, H - 200);
    const corners = [
      [100, 100, 0],
      [W - 100, 100, Math.PI / 2],
      [W - 100, H - 100, Math.PI],
      [100, H - 100, (3 * Math.PI) / 2],
    ];
    for (const [x, y, r] of corners) cornerOrnament(ctx, x, y, r, accent, 90);
    return { title: accent, name: accent, medal: accent };
  },

  royal(ctx, W, H, accent) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = alpha("#ffffff", 0.06);
    for (let y = 0; y < H; y += 60) {
      for (let x = (y / 60) % 2 ? 30 : 0; x < W; x += 60) {
        star8Path(ctx, x, y, 12);
        ctx.fill();
      }
    }
    roundRect(ctx, 110, 110, W - 220, H - 220, 18);
    ctx.fillStyle = "#fffdf8";
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 8;
    ctx.stroke();
    roundRect(ctx, 135, 135, W - 270, H - 270, 12);
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const [x, y] of [
      [110, 110],
      [W - 110, 110],
      [110, H - 110],
      [W - 110, H - 110],
    ]) {
      star8Path(ctx, x, y, 34);
      ctx.fillStyle = GOLD;
      ctx.fill();
    }
    return { title: accent, name: mix(GOLD, 0.25, "#000000"), medal: GOLD };
  },

  modern(ctx, W, H, accent) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    const light = mix(accent, 0.55);
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.3, 0);
    ctx.lineTo(0, H * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.2, 0);
    ctx.lineTo(0, H * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W * 0.7, H);
    ctx.lineTo(W, H * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W * 0.8, H);
    ctx.lineTo(W, H * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha("#000000", 0.08);
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 70, W - 140, H - 140);
    return { title: INK, name: accent, medal: accent };
  },

  islamic(ctx, W, H, accent) {
    ctx.fillStyle = "#fffcf4";
    ctx.fillRect(0, 0, W, H);
    const band = 120;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(band, band, W - band * 2, H - band * 2);
    ctx.clip("evenodd");
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = alpha("#ffffff", 0.55);
    ctx.lineWidth = 2;
    const step = 80;
    for (let y = -step; y < H + step; y += step) {
      for (let x = -step; x < W + step; x += step) {
        star8Path(ctx, x, y, step * 0.36);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 6;
    ctx.strokeRect(band, band, W - band * 2, H - band * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = accent;
    ctx.strokeRect(band + 22, band + 22, W - band * 2 - 44, H - band * 2 - 44);
    ctx.fillStyle = alpha(accent, 0.05);
    for (let y = band + 60; y < H - band; y += 140) {
      for (let x = band + 60; x < W - band; x += 140) {
        star8Path(ctx, x, y, 34);
        ctx.fill();
      }
    }
    return { title: accent, name: accent, medal: accent };
  },

  kids(ctx, W, H, accent) {
    ctx.fillStyle = mix(accent, 0.93);
    ctx.fillRect(0, 0, W, H);
    const rand = seededRandom("kids-cert");
    const colors = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];
    roundRect(ctx, 90, 90, W - 180, H - 180, 60);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.setLineDash([28, 18]);
    ctx.lineWidth = 8;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.setLineDash([]);
    let placed = 0;
    while (placed < 70) {
      const x = rand() * W;
      const y = rand() * H;
      const inside = x > 150 && x < W - 150 && y > 150 && y < H - 150;
      if (inside) continue;
      const c = colors[placed % colors.length];
      if (placed % 3 === 0) {
        star5Path(ctx, x, y, 18 + rand() * 18);
        ctx.fillStyle = c;
        ctx.fill();
      } else {
        confettiPiece(ctx, x, y, 12 + rand() * 10, c, rand);
      }
      placed++;
    }
    for (const [x, y, c] of [
      [250, H - 250, "#f59e0b"],
      [W - 250, H - 250, "#ec4899"],
    ]) {
      star5Path(ctx, x, y, 46);
      ctx.fillStyle = c;
      ctx.fill();
    }
    return { title: accent, name: mix(accent, 0.15, "#000000"), medal: "#f59e0b", font: "Lalezar" };
  },
};

/**
 * o: { style, accent, lang, title, intro, name, reason, headerLines, logos,
 *      signerRole, signerName, signature, dateText, dateLabel, placeholderName }
 */
// Default positions (in px on the 2339 × 1654 canvas). A designed template can
// override any of them in fractions of the page (see src/data/certificateTemplates.js).
const DEFAULT_LAYOUT = {
  header: { y: 260, edge: 200 },
  title: { y: 520, size: 128, show: true },
  divider: { y: 615, show: true },
  intro: { y: 700 },
  name: { y: 840, size: 118, line: 925 },
  reason: { y: 1050, maxW: 1550 },
  footer: { y: 1290, sideX: 560 },
  medal: { show: true },
};

const X_KEYS = new Set(["edge", "sideX", "maxW"]);

function layoutFor(template, W, H) {
  const out = {};
  for (const [part, values] of Object.entries(DEFAULT_LAYOUT)) {
    out[part] = { ...values };
    const custom = template?.layout?.[part];
    if (!custom) continue;
    for (const [key, v] of Object.entries(custom)) {
      if (typeof v !== "number" || key === "size") out[part][key] = v;
      else out[part][key] = v * (X_KEYS.has(key) ? W : H);
    }
  }
  return out;
}

function drawCover(ctx, img, W, H) {
  const scale = Math.max(W / img.width, H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

export function renderCertificate(canvas, o) {
  const { w: W, h: H } = CERT_SIZE;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const tpl = o.template;
  let look;
  if (tpl?.image) {
    // A background designed as an image: only the text and logos are drawn on top.
    drawCover(ctx, tpl.image, W, H);
    const c = tpl.colors || {};
    look = {
      title: c.title || INK,
      name: c.name || c.title || INK,
      medal: c.accent || GOLD,
      ink: c.text || INK,
      muted: c.muted || MUTED,
      font: tpl.font,
    };
  } else {
    look = { ink: INK, muted: MUTED, ...(STYLES[o.style] || STYLES.classic)(ctx, W, H, o.accent) };
  }
  const L = layoutFor(tpl, W, H);
  const titleFont = look.font || (o.lang === "ar" ? "Amiri" : "El Messiri");
  const bodyFont = look.font ? "Tajawal" : o.lang === "ar" ? "Tajawal" : "El Messiri";
  const cx = W / 2;
  const rtl = o.lang === "ar";

  const header = (o.headerLines || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 4);

  const logos = (o.logos || []).filter((l) => l?.img);
  const sized = logos.map((l) => {
    const k = l.scale || 1;
    let lw = 240 * k;
    let lh = (lw * l.img.height) / l.img.width;
    if (lh > 190 * k) {
      lw = (lw * 190 * k) / lh;
      lh = 190 * k;
    }
    return { img: l.img, lw, lh };
  });

  // The first logo (e.g. the ministry's) sits right beside the header text, at the outer edge.
  const edge = L.header.edge;
  const headerLogo = sized[0];
  const headerCy = header.length ? L.header.y + ((header.length - 1) * 62) / 2 : L.header.y + 40;
  let textX = rtl ? W - edge : edge;
  if (headerLogo) {
    const lx = rtl ? W - edge - headerLogo.lw : edge;
    ctx.drawImage(headerLogo.img, lx, headerCy - headerLogo.lh / 2, headerLogo.lw, headerLogo.lh);
    textX = rtl ? lx - 36 : lx + headerLogo.lw + 36;
  }

  header.forEach((line, i) => {
    text(ctx, line, textX, L.header.y + i * 62, {
      font: "Tajawal",
      size: 44,
      weight: 700,
      color: look.ink,
      align: rtl ? "right" : "left",
      maxW: headerLogo ? 600 : 700,
    });
  });

  // The other logos (up to 3) sit side by side on the opposite side.
  const others = sized.slice(1);
  if (others.length) {
    const gap = 40;
    const rowW = others.reduce((sum, d) => sum + d.lw, 0) + gap * (others.length - 1);
    let x = rtl ? edge : W - edge - rowW;
    for (const d of others) {
      ctx.drawImage(d.img, x, headerCy - d.lh / 2, d.lw, d.lh);
      x += d.lw + gap;
    }
  }

  if (L.title.show) text(ctx, o.title, cx, L.title.y, { font: titleFont, size: L.title.size, color: look.title, maxW: 1500 });

  if (L.divider.show) {
    const dividerY = L.divider.y;
    ctx.strokeStyle = look.medal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 260, dividerY);
    ctx.lineTo(cx - 30, dividerY);
    ctx.moveTo(cx + 30, dividerY);
    ctx.lineTo(cx + 260, dividerY);
    ctx.stroke();
    diamond(ctx, cx, dividerY, 12, look.medal);
  }

  text(ctx, o.intro, cx, L.intro.y, { font: bodyFont, size: 48, weight: 500, color: look.muted, maxW: 1600 });

  const name = o.name?.trim() || o.placeholderName || "";
  ctx.globalAlpha = o.name?.trim() ? 1 : 0.4;
  text(ctx, name, cx, L.name.y, { font: titleFont, size: L.name.size, color: look.name, maxW: 1500 });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = alpha("#000000", 0.15);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 520, L.name.line);
  ctx.lineTo(cx + 520, L.name.line);
  ctx.stroke();

  paragraph(ctx, o.reason, cx, L.reason.y, { font: bodyFont, size: 50, color: look.ink, maxW: L.reason.maxW });

  // Bottom row: signature on the start side, date on the end side, medal in the middle.
  const sigX = rtl ? W - L.footer.sideX : L.footer.sideX;
  const dateX = rtl ? L.footer.sideX : W - L.footer.sideX;
  const rowY = L.footer.y;

  if (o.signerRole) text(ctx, o.signerRole, sigX, rowY, { font: bodyFont, size: 40, weight: 700, color: look.muted, maxW: 600 });
  if (o.signerName) text(ctx, o.signerName, sigX, rowY + 62, { font: bodyFont, size: 44, weight: 700, color: look.ink, maxW: 600 });
  if (o.signature) {
    let sw = 380;
    let sh = (sw * o.signature.height) / o.signature.width;
    if (sh > 150) {
      sw = (sw * 150) / sh;
      sh = 150;
    }
    ctx.drawImage(o.signature, sigX - sw / 2, rowY + 100, sw, sh);
  }

  if (o.dateText) {
    text(ctx, o.dateLabel, dateX, rowY, { font: bodyFont, size: 40, weight: 700, color: look.muted });
    text(ctx, o.dateText, dateX, rowY + 62, { font: bodyFont, size: 44, weight: 700, color: look.ink, maxW: 600 });
  }

  if (L.medal.show && !tpl?.image && o.style !== "kids") medal(ctx, cx, rowY + 40, 88, look.medal);
  else if (L.medal.show && tpl?.image && tpl.medal) medal(ctx, cx, rowY + 40, 88, look.medal);
}
