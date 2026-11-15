import { DESIGNS, roundRect } from "./designs";
import { drawQr } from "../lib/qr";
import { fontString } from "./fonts";
import { fitParagraph } from "./textLayout";
import { isArabic, seededRandom } from "../lib/text";

export const SIZES = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

const NAME_FONT = "El Messiri";

function setDirection(ctx, text) {
  ctx.direction = isArabic(text) ? "rtl" : "ltr";
}

/** Draws one centred line, shrinking it to fit maxW. Returns its bounding box. */
function drawLine(ctx, text, x, y, o) {
  let size = o.size;
  ctx.font = fontString(o.font, size, o.weight);
  if ("letterSpacing" in ctx) ctx.letterSpacing = o.spacing ? `${o.spacing}px` : "0px";
  setDirection(ctx, text);
  let width = ctx.measureText(text).width;
  if (o.maxW && width > o.maxW) {
    size = Math.max(o.size * 0.4, (o.size * o.maxW) / width);
    ctx.font = fontString(o.font, size, o.weight);
    width = ctx.measureText(text).width;
  }
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = o.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  return { x: x - width / 2, y: y - size * 0.75, w: width, h: size * 1.5 };
}

function drawParagraph(ctx, text, x, y, o) {
  setDirection(ctx, text);
  const { lines, size } = fitParagraph(ctx, text, { ...o, maxLines: o.maxLines || 3 });
  const lh = size * (o.lineHeight || 1.6);
  // The first line stays where the design puts it; extra lines grow downwards, away from the title.
  const top = y;
  let maxWidth = 0;
  ctx.fillStyle = o.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    ctx.fillText(line, x, top + i * lh);
    maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
  });
  return { x: x - maxWidth / 2, y: top - lh / 2, w: maxWidth, h: lines.length * lh };
}

function drawBlurredCover(ctx, img, W, H) {
  const small = document.createElement("canvas");
  small.width = Math.ceil(W / 36);
  small.height = Math.ceil(H / 36);
  const s = small.getContext("2d");
  const scale = Math.max(small.width / img.width, small.height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  s.drawImage(img, (small.width - w) / 2, (small.height - h) / 2, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, 0, W, H);
}

/**
 * Renders a card into `canvas` and returns the boxes of the movable layers
 * (used to drag them with the mouse or a finger).
 */
export function renderCard(canvas, o) {
  const { w: W, h: H } = SIZES[o.size] || SIZES.square;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const frame = o.size === "story" ? { x: 0, y: (H - W) / 2, w: W, h: W } : { x: 0, y: 0, w: W, h: H };
  const t = o.template;
  const off = o.offsets || {};
  const boxes = [];

  let layout;
  let fonts;
  let colors;

  if (t.kind === "generated") {
    const design = DESIGNS[t.design];
    const palette = { ...t.palette, accent: o.accent || t.palette.accent };
    design.draw(ctx, W, H, frame, palette, seededRandom(t.id));
    layout = design.layout;
    fonts = design.fonts;
    colors = { title: palette.ink, sub: palette.accent, phrase: palette.text, name: palette.ink };
  } else {
    if (!o.image) return boxes;
    if (o.size === "story") {
      drawBlurredCover(ctx, o.image, W, H);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 50;
      ctx.drawImage(o.image, frame.x, frame.y, frame.w, frame.h);
      ctx.restore();
    } else {
      ctx.drawImage(o.image, 0, 0, W, H);
    }
    layout = { ...t.layout, logo: t.logo };
    fonts = { name: NAME_FONT };
    colors = { name: t.color };
  }

  const pos = (key, spec) => ({
    x: frame.x + (spec.x ?? 0.5) * frame.w + (off[key]?.dx || 0) * W,
    y: frame.y + spec.y * frame.h + (off[key]?.dy || 0) * H,
  });

  const lang = o.lang || "ar";
  const announce = o.mode === "announcement";
  let pushDown = 0;

  // Announcement on an image template: the sentence goes where the name would be.
  if (t.kind === "image" && announce && o.phrase) {
    const spec = layout.phrase || { y: layout.name.y - 0.08, size: 44, maxW: 0.74 };
    const p = pos("phrase", spec);
    boxes.push({
      key: "phrase",
      ...drawParagraph(ctx, o.phrase, p.x, p.y, {
        font: o.font || "Tajawal",
        size: (spec.size || 44) * (o.textScale || 1),
        weight: 700,
        color: o.nameColor || colors.name,
        maxW: (spec.maxW || 0.74) * frame.w,
        maxLines: 4,
        lineHeight: 1.5,
      }),
    });
    const box = boxes[boxes.length - 1];
    const nameTop = frame.y + layout.name.y * frame.h - layout.name.size * 0.4;
    pushDown = Math.max(0, box.y + box.h + frame.h * 0.01 - nameTop);
  }

  if (t.kind === "generated" && o.occasion) {
    const title = o.occasion.title[lang];
    let p = pos("title", layout.title);
    boxes.push({
      key: "title",
      ...drawLine(ctx, title, p.x, p.y, {
        font: fonts.title,
        size: layout.title.size,
        weight: 700,
        color: colors.title,
        maxW: frame.w * (layout.title.maxW ?? 0.78),
      }),
    });

    const other = lang === "ar" ? "en" : "ar";
    const sub = other === "en" ? o.occasion.title.en.toUpperCase() : o.occasion.title.ar;
    p = pos("sub", layout.sub);
    boxes.push({
      key: "sub",
      ...drawLine(ctx, sub, p.x, p.y, {
        font: other === "en" ? "Tajawal" : fonts.text,
        size: layout.sub.size,
        weight: 500,
        color: colors.sub,
        spacing: other === "en" ? 6 : 0,
        maxW: frame.w * 0.8,
      }),
    });

    if (o.phrase) {
      p = pos("phrase", layout.phrase);
      // An announcement's sentence is the main message: bigger, bolder, up to 4 lines.
      boxes.push({
        key: "phrase",
        ...drawParagraph(ctx, o.phrase, p.x, p.y, {
          font: announce ? o.font || fonts.text : fonts.text,
          size: layout.phrase.size * (announce ? 1.22 * (o.textScale || 1) : 1),
          weight: announce ? 700 : 500,
          color: announce ? o.nameColor || colors.name : colors.phrase,
          maxW: layout.phrase.maxW * frame.w * (announce ? 1.08 : 1),
          maxLines: announce ? 4 : 3,
          lineHeight: announce ? 1.5 : 1.6,
        }),
      });
      // A long phrase pushes the name lines down so they never overlap.
      if (!off.phrase) {
        const phraseBottom = boxes[boxes.length - 1].y + boxes[boxes.length - 1].h;
        const first = o.dedication && !announce ? layout.to : layout.name;
        const nameTop = frame.y + first.y * frame.h - first.size * 0.75;
        pushDown = Math.max(0, phraseBottom + frame.h * 0.015 - nameTop);
      }
    }
  }

  const scale = o.textScale || 1;
  const nameFont = o.font || fonts.name || NAME_FONT;
  const nameColor = o.nameColor || colors.name;
  const labels = lang === "ar" ? { to: "إلى:", from: "من:" } : { to: "To:", from: "From:" };
  const name = o.name?.trim();
  const ph = o.placeholders || {};

  const personal = (key, text, spec, isPlaceholder) => {
    const p = pos(key, spec);
    p.y += pushDown;
    boxes.push({
      key,
      ...drawLine(ctx, text, p.x, p.y, {
        font: nameFont,
        size: spec.size * scale,
        weight: 700,
        color: nameColor,
        maxW: spec.maxW * frame.w,
        alpha: isPlaceholder ? 0.5 : 1,
      }),
    });
  };

  if (announce) {
    // Optional signature under the sentence ("أبو محمد"، "عائلة الغامدي").
    if (name) {
      const spec = layout.name;
      const p = pos("name", spec);
      p.y += pushDown;
      boxes.push({
        key: "name",
        ...drawLine(ctx, name, p.x, p.y, {
          font: nameFont,
          size: spec.size * 0.62 * scale,
          weight: 700,
          color: t.kind === "generated" ? colors.sub : nameColor,
          maxW: spec.maxW * frame.w,
        }),
      });
    }
  } else if (o.dedication) {
    const to = o.toName?.trim();
    personal("to", `${labels.to} ${to || ph.to || ""}`, layout.to, !to);
    personal("from", `${labels.from} ${name || ph.name || ""}`, layout.from, !name);
  } else {
    personal("name", name || ph.name || "", layout.name, !name);
  }

  // Logos sit side by side around the template's logo spot; each one can be dragged.
  const logos = (o.logos || []).filter((l) => l?.img);
  if (logos.length && layout.logo) {
    const spec = layout.logo;
    const gap = frame.w * 0.03;
    const sized = logos.map((l) => {
      let lw = spec.w * frame.w * (l.scale || 1);
      let lh = (lw * l.img.height) / l.img.width;
      const maxH = frame.h * 0.22 * (l.scale || 1);
      if (lh > maxH) {
        lw = (lw * maxH) / lh;
        lh = maxH;
      }
      return { lw, lh };
    });
    const rowW = sized.reduce((sum, d) => sum + d.lw, 0) + gap * (logos.length - 1);
    // Keep the whole row inside the card when the spot is near an edge.
    const centre = (spec.x ?? 0.5) * frame.w;
    const margin = frame.w * 0.04;
    const shift =
      Math.max(0, margin - (centre - rowW / 2)) - Math.max(0, centre + rowW / 2 - (frame.w - margin));
    let cursor = -rowW / 2 + shift;
    logos.forEach((l, i) => {
      const { lw, lh } = sized[i];
      const key = `logo${i}`;
      const p = pos(key, { ...spec, x: (spec.x ?? 0.5) + (cursor + lw / 2) / frame.w });
      cursor += lw + gap;
      ctx.drawImage(l.img, p.x - lw / 2, p.y - lh / 2, lw, lh);
      boxes.push({ key, x: p.x - lw / 2, y: p.y - lh / 2, w: lw, h: lh });
    });
  }

  // Optional QR code (song, location, photo, link…) in a bottom corner; draggable.
  if (o.qr?.payload) {
    const size = frame.w * 0.15 * (o.qr.scale || 1);
    const pad = size * 0.07;
    const capSize = Math.max(16, frame.w * 0.021 * (o.qr.scale || 1));
    const caption = o.qr.caption?.trim() || "";
    const spec = { x: lang === "ar" ? 0.13 : 0.87, y: 0.84 };
    const p = pos("qr", spec);
    const top = p.y - size / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = size * 0.12;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, p.x - size / 2 - pad, top - pad, size + pad * 2, size + pad * 2 + (caption ? capSize * 1.9 : 0), size * 0.1);
    ctx.fill();
    ctx.restore();
    try {
      drawQr(ctx, o.qr.payload, p.x - size / 2, top, size, "#111111", "#ffffff");
    } catch {
      /* too long for a QR code */
    }
    if (caption) {
      ctx.font = fontString("Tajawal", capSize, 700);
      ctx.direction = isArabic(caption) ? "rtl" : "ltr";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1f2937";
      ctx.fillText(caption, p.x, top + size + capSize * 0.95, size + pad * 2 - 8);
    }
    const h = size + pad * 2 + (caption ? capSize * 1.9 : 0);
    boxes.push({ key: "qr", x: p.x - size / 2 - pad, y: top - pad, w: size + pad * 2, h });
  }

  return boxes;
}

const thumbCache = new Map();

/** Small preview image of a template (cached). */
export function templateThumbnail(template, occasion, lang, image) {
  const key = `${template.id}|${lang}|${image ? 1 : 0}`;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const big = document.createElement("canvas");
  renderCard(big, {
    template,
    occasion,
    size: "square",
    lang,
    phrase: occasion.phrases ? occasion.phrases[lang][0] : occasion.sample?.[lang],
    mode: occasion.kind === "announcement" ? "announcement" : undefined,
    image,
    placeholders: { name: "" },
  });
  const small = document.createElement("canvas");
  small.width = small.height = 360;
  const s = small.getContext("2d");
  s.imageSmoothingQuality = "high";
  s.drawImage(big, 0, 0, 360, 360);
  const url = small.toDataURL("image/jpeg", 0.85);
  thumbCache.set(key, url);
  return url;
}

export function clearThumbnailCache() {
  thumbCache.clear();
}
