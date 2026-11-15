// What a card's QR code opens: a song, a location, a photo, a link, WhatsApp, or a message.

export const QR_TYPES = [
  { id: "none", ar: "بدون", en: "None" },
  { id: "song", ar: "أغنية أو صوت", en: "Song or audio" },
  { id: "map", ar: "موقع", en: "Location" },
  { id: "image", ar: "صورة", en: "Photo" },
  { id: "link", ar: "رابط", en: "Link" },
  { id: "whatsapp", ar: "واتساب", en: "WhatsApp" },
  { id: "text", ar: "رسالة", en: "Message" },
];

const CAPTIONS = {
  song: { ar: "امسح واسمع الإهداء", en: "Scan to listen" },
  map: { ar: "امسح للوصول إلى الموقع", en: "Scan for the location" },
  image: { ar: "امسح وشوف الصورة", en: "Scan to see the photo" },
  link: { ar: "امسح الرمز", en: "Scan me" },
  whatsapp: { ar: "امسح وراسلني", en: "Scan to message me" },
  text: { ar: "امسح واقرأ الرسالة", en: "Scan to read the message" },
};

export const emptyQr = { type: "none", url: "", phone: "", text: "", mediaPage: "", mediaName: "", caption: null, scale: 1 };

export const defaultCaption = (type, lang) => CAPTIONS[type]?.[lang === "en" ? "en" : "ar"] || "";

const isUrl = (v) => /^https?:\/\/\S+\.\S+/i.test(v.trim());

/** Saudi numbers like 05xxxxxxxx become 9665xxxxxxxx. */
function waNumber(phone) {
  let d = phone.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = `966${d.slice(1)}`;
  if (d.startsWith("5") && d.length === 9) d = `966${d}`;
  return d.length >= 9 ? d : "";
}

/** The text encoded in the QR code, or "" while it's incomplete. */
export function qrPayload(q) {
  if (!q || q.type === "none") return "";
  if (q.type === "image" || (q.type === "song" && q.mediaPage)) return q.mediaPage || "";
  if (q.type === "song" || q.type === "map" || q.type === "link") return isUrl(q.url) ? q.url.trim() : "";
  if (q.type === "whatsapp") {
    const n = waNumber(q.phone || "");
    if (!n) return "";
    return `https://wa.me/${n}${q.text?.trim() ? `?text=${encodeURIComponent(q.text.trim())}` : ""}`;
  }
  if (q.type === "text") return q.text?.trim() || "";
  return "";
}

/** Options for the renderers: { payload, caption, scale } or null. */
export function qrOption(q, lang) {
  const payload = qrPayload(q);
  if (!payload) return null;
  return { payload, caption: q.caption ?? defaultCaption(q.type, lang), scale: q.scale || 1 };
}
