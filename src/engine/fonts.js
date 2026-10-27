// Free Arabic fonts from Google Fonts (loaded in index.html).
// Canvas only draws a web font after it has loaded, so we load them
// explicitly before rendering cards.

export const FONTS = [
  { id: "El Messiri", label: { ar: "المسيري", en: "El Messiri" }, weight: 700 },
  { id: "Tajawal", label: { ar: "تجوال", en: "Tajawal" }, weight: 700 },
  { id: "Cairo", label: { ar: "القاهرة", en: "Cairo" }, weight: 700 },
  { id: "Amiri", label: { ar: "أميري", en: "Amiri" }, weight: 700 },
  { id: "Reem Kufi", label: { ar: "ريم كوفي", en: "Reem Kufi" }, weight: 700 },
  { id: "Lalezar", label: { ar: "لاله زار", en: "Lalezar" }, weight: 400 },
];

export const fontWeight = (family, requested = 700) =>
  FONTS.find((f) => f.id === family)?.weight === 400 ? 400 : requested;

export function fontString(family, size, weight = 700) {
  return `${fontWeight(family, weight)} ${Math.round(size)}px "${family}", "Tajawal", "Segoe UI", Tahoma, sans-serif`;
}

let ready = null;

// The Google Fonts stylesheet must be loaded before the browser knows the fonts exist.
function stylesheetLoaded() {
  const link = document.querySelector('link[href*="fonts.googleapis.com"]');
  if (!link || link.sheet) return Promise.resolve();
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
  });
}

export function ensureFonts() {
  if (!ready) {
    const sample = "عيد مبارك Eid ٠١٢";
    const load = async () => {
      await stylesheetLoaded();
      const loads = [];
      for (const f of FONTS) {
        loads.push(document.fonts.load(`${f.weight} 40px "${f.id}"`, sample));
        if (f.weight !== 400) loads.push(document.fonts.load(`400 40px "${f.id}"`, sample));
      }
      await Promise.allSettled(loads);
    };
    ready = Promise.race([load(), new Promise((resolve) => setTimeout(resolve, 3000))]);
  }
  return ready;
}
