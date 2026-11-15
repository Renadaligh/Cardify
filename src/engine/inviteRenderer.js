// Draws an invitation on a tall page (1080 × 1920).
//
// The text is a column of blocks (basmala, guest, hosts, names, date, place, map…).
// Each block is measured first; if they don't fit in the text area, everything is
// scaled down a little until they do, then the spare space is shared between the gaps.

import { DESIGNS } from "./designs";
import { fontString } from "./fonts";
import { wrapLines } from "./textLayout";
import { drawQr } from "../lib/qr";
import { isArabic, seededRandom } from "../lib/text";
import { INVITE_NOTES, PRAYER_TIMES } from "../data/invitations";

export const INVITE_SIZE = { w: 1080, h: 1920 };
const DEFAULT_AREA = { top: 0.09, bottom: 0.93, side: 0.12 };

// Where the text may go on each generated design (fractions of the page), so it stays
// clear of the design's own ornaments.
const DESIGN_AREAS = {
  crescent: { top: 0.28, bottom: 0.88, side: 0.12 },
  geometric: { top: 0.16, bottom: 0.83, side: 0.16 },
  waves: { top: 0.09, bottom: 0.86, side: 0.12 },
  chalk: { top: 0.08, bottom: 0.9, side: 0.14 },
  arch: { top: 0.2, bottom: 0.92, side: 0.17 },
  frame: { top: 0.08, bottom: 0.92, side: 0.15 },
  floral: { top: 0.13, bottom: 0.88, side: 0.13 },
  cap: { top: 0.3, bottom: 0.93, side: 0.12 },
  balloons: { top: 0.1, bottom: 0.93, side: 0.2 },
  rays: { top: 0.08, bottom: 0.93, side: 0.12 },
  sadu: { top: 0.1, bottom: 0.9, side: 0.12 },
};

const alpha = (hex, a) => {
  if (!hex?.startsWith("#")) return hex;
  const h = hex.slice(1);
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ---------- dates ----------

const locale = (lang, cal) => `${lang === "en" ? "en-GB" : "ar-SA"}-u-ca-${cal}-nu-latn`;

/** { weekday, hijri, gregorian } for a "YYYY-MM-DD" string, or null. */
export function formatInviteDate(value, lang) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, 12);
  const fmt = (cal, opts) => new Intl.DateTimeFormat(locale(lang, cal), opts).format(date);
  try {
    let hijri = fmt("islamic-umalqura", { day: "numeric", month: "long", year: "numeric" });
    hijri = hijri.replace(/\s*(هـ|AH)\s*$/u, "");
    return {
      weekday: fmt("gregory", { weekday: "long" }),
      hijri: lang === "en" ? `${hijri} AH` : `${hijri}هـ`,
      gregorian: fmt("gregory", { day: "numeric", month: "long", year: "numeric" }) + (lang === "en" ? "" : "م"),
    };
  } catch {
    return null;
  }
}

/** "8:30 مساءً" from "20:30". */
export function formatClock(value, lang) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m || 0).padStart(2, "0");
  if (lang === "en") return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
  return `${h12}:${mm} ${h < 12 ? "صباحًا" : "مساءً"}`;
}

export function inviteTimeText(o) {
  const lang = o.lang;
  if (o.timeMode === "clock") return formatClock(o.time, lang);
  const prayer = PRAYER_TIMES.find((p) => p.id === o.timeMode);
  return prayer ? prayer[lang] : "";
}

// ---------- drawing helpers ----------

function setText(ctx, font, size, weight, text) {
  ctx.font = fontString(font, size, weight);
  ctx.direction = isArabic(text) ? "rtl" : "ltr";
}

/** A block of wrapped lines, centred. Returns { h, draw(y) }. */
function textBlock(ctx, text, { font, size, weight = 500, color, maxW, maxLines = 2, lineHeight = 1.45, alpha: a = 1, minScale = 0.7 }) {
  if (!text?.trim()) return null;
  let s = size;
  let lines;
  for (;;) {
    setText(ctx, font, s, weight, text);
    lines = wrapLines(ctx, text, maxW);
    if (lines.length <= maxLines) {
      // also shrink a single word that is still too wide
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest <= maxW) break;
    }
    if (s <= size * minScale) break;
    s *= 0.94;
  }
  lines = lines.slice(0, maxLines);
  const lh = s * lineHeight;
  return {
    h: lines.length * lh,
    draw(y, cx) {
      setText(ctx, font, s, weight, text);
      ctx.fillStyle = color;
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => ctx.fillText(line, cx, y + lh * (i + 0.5), maxW));
      ctx.globalAlpha = 1;
    },
  };
}

function ornament(ctx, color, w) {
  return {
    h: 36,
    draw(y, cx) {
      const mid = y + 18;
      ctx.strokeStyle = alpha(color, 0.75);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, mid);
      ctx.lineTo(cx - 22, mid);
      ctx.moveTo(cx + 22, mid);
      ctx.lineTo(cx + w / 2, mid);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, mid - 11);
      ctx.lineTo(cx + 11, mid);
      ctx.lineTo(cx, mid + 11);
      ctx.lineTo(cx - 11, mid);
      ctx.closePath();
      ctx.fill();
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(cx + side * (w / 2 + 8), mid, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  };
}

/** Weekday | date (Hijri over Gregorian) | time, in three columns with thin dividers. */
function dateRow(ctx, o, k, c, maxW) {
  const date = formatInviteDate(o.date, o.lang);
  const time = inviteTimeText(o);
  if (!date && !time) return null;
  const labels = o.lang === "en" ? { day: "Day", date: "Date", time: "Time" } : { day: "اليوم", date: "التاريخ", time: "الوقت" };
  const cols = [];
  if (date) cols.push({ label: labels.day, lines: [date.weekday] });
  if (date) cols.push({ label: labels.date, lines: [date.hijri, date.gregorian], wide: true });
  if (time) cols.push({ label: labels.time, lines: [time] });

  const font = o.textFont;
  const labelSize = 26 * k;
  const valueSize = 36 * k;
  const units = cols.reduce((s, col) => s + (col.wide ? 1.9 : 1), 0);
  const unitW = maxW / units;
  const rows = Math.max(...cols.map((col) => col.lines.length));
  const h = labelSize * 1.7 + rows * valueSize * 1.45 + 10 * k;
  return {
    h,
    draw(y, cx) {
      // Arabic: first column on the right.
      const rtl = o.lang !== "en";
      let x = rtl ? cx + maxW / 2 : cx - maxW / 2;
      cols.forEach((col, i) => {
        const w = unitW * (col.wide ? 1.9 : 1);
        const mid = rtl ? x - w / 2 : x + w / 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        setText(ctx, font, labelSize, 500, col.label);
        ctx.fillStyle = c.accent;
        ctx.fillText(col.label, mid, y + labelSize * 0.7, w - 16);
        col.lines.forEach((line, j) => {
          setText(ctx, font, valueSize * (j ? 0.82 : 1), j ? 500 : 700, line);
          ctx.fillStyle = j ? c.muted : c.text;
          ctx.fillText(line, mid, y + labelSize * 1.7 + valueSize * 1.45 * (j + 0.5), w - 16);
        });
        if (i < cols.length - 1) {
          const lx = rtl ? x - w : x + w;
          ctx.strokeStyle = alpha(c.accent, 0.45);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lx, y + 6);
          ctx.lineTo(lx, y + h - 6);
          ctx.stroke();
        }
        x = rtl ? x - w : x + w;
      });
    },
  };
}

function qrBlock(ctx, o, k, c) {
  const link = o.qr?.payload;
  if (!link) return null;
  const size = 210 * Math.max(0.8, k) * (o.qr.scale || 1);
  const caption = o.qr.caption || "";
  const capSize = 24 * k;
  return {
    h: size + (caption ? capSize * 2 : 10),
    draw(y, cx) {
      const pad = 10;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffffff";
      const r = 18;
      const x0 = cx - size / 2 - pad;
      const y0 = y - pad;
      const s = size + pad * 2;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.arcTo(x0 + s, y0, x0 + s, y0 + s, r);
      ctx.arcTo(x0 + s, y0 + s, x0, y0 + s, r);
      ctx.arcTo(x0, y0 + s, x0, y0, r);
      ctx.arcTo(x0, y0, x0 + s, y0, r);
      ctx.fill();
      ctx.restore();
      try {
        drawQr(ctx, link, cx - size / 2, y, size, "#111111", "#ffffff");
      } catch {
        /* link too long: skip the code */
      }
      if (!caption) return;
      setText(ctx, o.textFont, capSize, 500, caption);
      ctx.fillStyle = c.muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(caption, cx, y + size + pad + capSize * 1.1);
    },
  };
}

function logosBlock(ctx, logos, k, maxW) {
  const list = (logos || []).filter((l) => l?.img);
  if (!list.length) return null;
  const gap = 34;
  const sized = list.map((l) => {
    const maxH = 120 * k * (l.scale || 1);
    let lw = 170 * k * (l.scale || 1);
    let lh = (lw * l.img.height) / l.img.width;
    if (lh > maxH) {
      lw = (lw * maxH) / lh;
      lh = maxH;
    }
    return { img: l.img, lw, lh };
  });
  let rowW = sized.reduce((s, d) => s + d.lw, 0) + gap * (list.length - 1);
  const fit = Math.min(1, maxW / rowW);
  rowW *= fit;
  const h = Math.max(...sized.map((d) => d.lh)) * fit;
  return {
    h,
    draw(y, cx) {
      let x = cx - rowW / 2;
      sized.forEach((d) => {
        const w = d.lw * fit;
        const hh = d.lh * fit;
        ctx.drawImage(d.img, x, y + (h - hh) / 2, w, hh);
        x += w + gap * fit;
      });
    },
  };
}

// ---------- page ----------

function background(ctx, o, W, H) {
  const t = o.template;
  if (t.kind === "generated") {
    const design = DESIGNS[t.design];
    const palette = { ...t.palette, accent: o.accent || t.palette.accent };
    design.draw(ctx, W, H, { x: 0, y: 0, w: W, h: H }, palette, seededRandom(t.id));
    return {
      area: DESIGN_AREAS[t.design] || DEFAULT_AREA,
      colors: { names: palette.ink, text: palette.ink, muted: alpha(palette.text, 0.85), accent: palette.accent },
      fonts: design.fonts,
    };
  }
  if (o.image) {
    const img = o.image;
    const scale = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * scale) / 2, (H - img.height * scale) / 2, img.width * scale, img.height * scale);
  } else {
    ctx.fillStyle = "#f6f1e7";
    ctx.fillRect(0, 0, W, H);
  }
  const c = t.colors || {};
  return {
    area: { ...DEFAULT_AREA, ...t.area },
    colors: {
      names: c.names || "#7a5a1e",
      text: c.text || "#2b2b2b",
      muted: c.muted || "#666666",
      accent: c.accent || "#b48a3c",
    },
    fonts: { title: "Amiri", text: "Tajawal", name: "El Messiri" },
  };
}

/** Renders the invitation into `canvas`. Returns [] (the layout is automatic). */
export function renderInvite(canvas, o) {
  const { w: W, h: H } = INVITE_SIZE;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  if (!o.template) return [];

  const bg = background(ctx, o, W, H);
  const area = bg.area;
  const c = { ...bg.colors, names: o.nameColor || bg.colors.names };
  if (o.accent && o.template.kind === "image") c.accent = o.accent;
  const lang = o.lang === "en" ? "en" : "ar";
  const textFont = lang === "en" ? "Cairo" : bg.fonts.text || "Tajawal";
  const nameFont = o.font || bg.fonts.name || "El Messiri";
  const titleFont = lang === "en" ? "Amiri" : "Amiri";
  const cx = W / 2;
  const maxW = W * (1 - area.side * 2);
  const top = H * area.top;
  const bottom = H * area.bottom;
  const scaleUser = o.textScale || 1;
  const ph = o.placeholders || {};

  const build = (k) => {
    const blocks = [];
    const add = (b, gapBefore = 1) => b && blocks.push({ ...b, gap: gapBefore });
    const T = (text, spec) => textBlock(ctx, text, { font: textFont, color: c.text, maxW, ...spec, size: spec.size * k });

    add(logosBlock(ctx, o.logos, k, maxW), 0);
    if (o.basmala && lang === "ar") add(T("بسم الله الرحمن الرحيم", { font: titleFont, size: 46, weight: 700, color: c.accent, maxLines: 1 }));

    if (o.guestOn) {
      const guest = o.guest?.trim() || ph.guest || "";
      const prefix = o.guestPrefix?.trim() || "";
      const line = [prefix, guest].filter(Boolean).join(" ");
      add(T(line, { size: 40, weight: 700, color: c.text, maxLines: 1, alpha: o.guest?.trim() ? 1 : 0.5 }), 1.1);
      if (o.guestSuffix?.trim()) add(T(o.guestSuffix.trim(), { size: 32, color: c.muted, maxLines: 1 }), 0.3);
    }

    const verb = lang === "ar" ? o.verb?.ar : "";
    const hosts = o.hosts?.trim() || ph.hosts;
    const hostLine = hosts ? (o.verb?.id === "family" && lang === "ar" ? `آل ${hosts.replace(/^آل\s+/, "")}` : hosts) : "";
    if (hostLine || verb) {
      if (verb) add(T(o.verb.id === "family" ? "يتشرف" : verb, { size: 38, color: c.muted, maxLines: 1 }), 1.2);
      if (hostLine) add(T(hostLine, { size: 50, weight: 700, color: c.text, maxLines: 2, alpha: o.hosts?.trim() ? 1 : 0.45 }), 0.25);
    }
    add(T(o.sentence, { size: 40, color: c.text, maxLines: 2 }), hostLine || verb ? 0.5 : 1.2);

    // Big names; empty ones show their label faintly in the preview only.
    const names = (o.names || [])
      .map((n, i) => (n?.trim() ? { text: n.trim(), a: 1 } : ph.names?.[i] ? { text: ph.names[i], a: 0.4 } : null))
      .filter(Boolean);
    if (names.length) {
      const nameSpec = { font: nameFont, size: 104 * scaleUser, weight: 700, color: c.names, maxLines: 1, lineHeight: 1.3, minScale: 0.45 };
      add(T(names[0].text, { ...nameSpec, alpha: names[0].a }), 1);
      if (names[1]) {
        add(T(lang === "en" ? "&" : "و", { font: titleFont, size: 54, weight: 700, color: c.accent, maxLines: 1, lineHeight: 1.1 }), 0.1);
        add(T(names[1].text, { ...nameSpec, alpha: names[1].a }), 0.1);
      }
    }
    add(ornament(ctx, c.accent, maxW * 0.5), 1);

    add(dateRow(ctx, { ...o, textFont }, k, c, maxW), 1);
    if (o.venue?.trim()) add(T(o.venue, { size: 44, weight: 700, maxLines: 2 }), 1);
    if (o.city?.trim()) add(T(o.city, { size: 32, color: c.muted, maxLines: 1 }), o.venue?.trim() ? 0.15 : 1);
    add(qrBlock(ctx, { ...o, textFont }, k, c), 1);

    const notes = [];
    if (o.audience === "men") notes.push(lang === "en" ? "Men's invitation" : "الدعوة للرجال");
    if (o.audience === "women") notes.push(lang === "en" ? "Women's invitation" : "الدعوة للنساء");
    INVITE_NOTES.forEach((n) => o.notes?.[n.id] && notes.push(n[lang]));
    if (notes.length) add(T(notes.join("  •  "), { size: 30, weight: 700, color: c.accent, maxLines: 2 }), 1);
    if (o.customNote?.trim()) add(T(o.customNote, { size: 30, color: c.muted, maxLines: 2 }), 0.4);
    if (o.closing?.trim()) add(T(o.closing, { font: lang === "ar" ? titleFont : "Amiri", size: 40, weight: 700, color: c.accent, maxLines: 2 }), 1);
    return blocks;
  };

  // Fit: shrink until the blocks plus minimum gaps fit, then share the spare space.
  const available = bottom - top;
  const baseGap = 46;
  const measure = (k) => {
    const list = build(k);
    const units = list.reduce((s, b, j) => s + (j ? b.gap : 0), 0);
    return { list, used: list.reduce((s, b) => s + b.h, 0) + units * baseGap * k };
  };
  let k = scaleUser;
  let { list: blocks, used } = measure(k);
  if (used > available) {
    // too much text: shrink
    for (let i = 0; i < 20 && used > available && k > 0.55; i++) {
      k *= 0.95;
      ({ list: blocks, used } = measure(k));
    }
  } else {
    // short invitation: grow a little so it doesn't look lost on the page
    for (let i = 0; i < 8 && k < scaleUser * 1.4; i++) {
      const next = measure(k * 1.05);
      if (next.used > available * 0.8) break;
      k *= 1.05;
      ({ list: blocks, used } = next);
    }
  }
  const gapUnits = blocks.reduce((s, b, j) => s + (j ? b.gap : 0), 0) || 1;
  const spare = Math.max(0, available - used);
  // Gaps grow up to 1.8× their base size; anything left centres the column.
  const extraPerUnit = Math.min(spare / gapUnits, baseGap * k * 0.8);
  const leftover = spare - extraPerUnit * gapUnits;
  let y = top + leftover / 2;
  blocks.forEach((b, j) => {
    if (j) y += b.gap * (baseGap * k + extraPerUnit);
    b.draw(y, cx);
    y += b.h;
  });
  return [];
}

const thumbCache = new Map();

/** Small tall preview of an invitation template (cached). */
export function inviteThumbnail(template, sample, image) {
  const key = `${template.id}|${sample.lang}|${image ? 1 : 0}`;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const big = document.createElement("canvas");
  renderInvite(big, { ...sample, template, image });
  const small = document.createElement("canvas");
  small.width = 270;
  small.height = 480;
  const s = small.getContext("2d");
  s.imageSmoothingQuality = "high";
  s.drawImage(big, 0, 0, 270, 480);
  const url = small.toDataURL("image/jpeg", 0.85);
  thumbCache.set(key, url);
  return url;
}

export function clearInviteThumbnails() {
  thumbCache.clear();
}
