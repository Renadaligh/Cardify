const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export const isArabic = (text) => ARABIC.test(String(text || ""));

export function seededRandom(seed) {
  let a = typeof seed === "number" ? seed : hashString(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function formatDate(date, lang, calendar) {
  if (calendar === "none") return "";
  const locale =
    lang === "ar"
      ? `ar-SA-u-ca-${calendar === "hijri" ? "islamic-umalqura" : "gregory"}`
      : `en-GB-u-ca-${calendar === "hijri" ? "islamic-umalqura" : "gregory"}`;
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return date.toLocaleDateString(lang === "ar" ? "ar" : "en-GB");
  }
}
