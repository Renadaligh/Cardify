// Saving and restoring a certificate design.
//
// When certificates are issued, the design (texts, colours, logos, signature) is stored
// on the server with the issue, so the same certificate can be downloaded again later
// from the dashboard exactly as it was. Images are stored as small data URLs.

import { CERT_IMAGE_TEMPLATES } from "../data/certificateTemplates";
import { loadImage } from "../lib/files";

function imageToDataUrl(img, maxSide = 700) {
  if (!img) return null;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

/** The renderer options (minus the name) → a plain object that can be saved as JSON. */
export function serializeDesign(o, designId) {
  return {
    v: 1,
    designId,
    style: o.style,
    accent: o.accent,
    lang: o.lang,
    title: o.title,
    intro: o.intro,
    reason: o.reason,
    headerLines: o.headerLines,
    signerRole: o.signerRole,
    signerName: o.signerName,
    dateText: o.dateText,
    dateLabel: o.dateLabel,
    logos: (o.logos || []).filter((l) => l?.img).map((l) => ({ src: imageToDataUrl(l.img), scale: l.scale || 1 })),
    signature: imageToDataUrl(o.signature, 600),
  };
}

/** A saved design → options for renderCertificate (images loaded). */
export async function hydrateDesign(d) {
  const tpl = CERT_IMAGE_TEMPLATES.find((t) => t.id === d.designId);
  const [image, signature, ...logoImgs] = await Promise.all([
    tpl ? loadImage(tpl.src).catch(() => null) : null,
    d.signature ? loadImage(d.signature).catch(() => null) : null,
    ...(d.logos || []).map((l) => loadImage(l.src).catch(() => null)),
  ]);
  return {
    style: d.style || "classic",
    template: tpl ? { ...tpl, image } : null,
    accent: d.accent,
    lang: d.lang,
    title: d.title,
    intro: d.intro,
    reason: d.reason,
    headerLines: d.headerLines,
    signerRole: d.signerRole,
    signerName: d.signerName,
    signature,
    dateText: d.dateText,
    dateLabel: d.dateLabel,
    logos: (d.logos || []).map((l, i) => ({ img: logoImgs[i], scale: l.scale })).filter((l) => l.img),
  };
}
