// Templates designed as images (your original Eid designs).
// The image holds the decoration and greeting; the name, the
// to/from lines and the logo are drawn on top as layers.
// Positions are fractions of the image (0 → 1).

const base = import.meta.env.BASE_URL;

const bottomLayout = (nameY, maxW = 0.8) => ({
  name: { y: nameY, size: 50, maxW },
  to: { y: nameY - 0.035, size: 40, maxW },
  from: { y: nameY + 0.03, size: 34, maxW },
});

const BOTH_EIDS = ["eid-fitr", "eid-adha"];

export const IMAGE_TEMPLATES = [
  {
    id: "t1",
    name: { ar: "فطر لافندر", en: "Lavender Fitr" },
    src: `${base}templates/T1.png`,
    occasions: ["eid-fitr"],
    color: "#65537b",
    layout: { ...bottomLayout(0.75), to: { y: 0.71, size: 42, maxW: 0.8 }, from: { y: 0.79, size: 36, maxW: 0.8 } },
    logo: { x: 0.5, y: 0.2, w: 0.13 },
  },
  {
    id: "t2",
    name: { ar: "فطر كحلي", en: "Navy Fitr" },
    src: `${base}templates/T2.png`,
    occasions: ["eid-fitr"],
    color: "#142640",
    layout: { ...bottomLayout(0.75), to: { y: 0.71, size: 42, maxW: 0.8 }, from: { y: 0.79, size: 36, maxW: 0.8 } },
    logo: { x: 0.5, y: 0.2, w: 0.13 },
  },
  {
    id: "t3",
    name: { ar: "هلال أزرق", en: "Blue crescent" },
    src: `${base}templates/T3.png`,
    occasions: BOTH_EIDS,
    color: "#feffff",
    layout: { ...bottomLayout(0.8), to: { y: 0.77, size: 42, maxW: 0.8 }, from: { y: 0.845, size: 36, maxW: 0.8 } },
    logo: { x: 0.5, y: 0.14, w: 0.12 },
  },
  {
    id: "t4",
    name: { ar: "هلال زمردي", en: "Emerald crescent" },
    src: `${base}templates/T4.png`,
    occasions: BOTH_EIDS,
    color: "#feffff",
    layout: { ...bottomLayout(0.8), to: { y: 0.77, size: 42, maxW: 0.8 }, from: { y: 0.845, size: 36, maxW: 0.8 } },
    logo: { x: 0.5, y: 0.14, w: 0.12 },
  },
  {
    id: "t5",
    name: { ar: "كوفي برتقالي", en: "Orange Kufic" },
    src: `${base}templates/T5.png`,
    occasions: BOTH_EIDS,
    color: "#f08a5d",
    layout: bottomLayout(0.91),
    logo: { x: 0.14, y: 0.12, w: 0.14 },
  },
  {
    id: "t6",
    name: { ar: "كوفي كحلي", en: "Navy Kufic" },
    src: `${base}templates/T6.png`,
    occasions: BOTH_EIDS,
    color: "#002b5b",
    layout: bottomLayout(0.91),
    logo: { x: 0.86, y: 0.12, w: 0.14 },
  },
  {
    id: "t7",
    name: { ar: "موجة سماوية", en: "Sky wave" },
    src: `${base}templates/T7.png`,
    occasions: BOTH_EIDS,
    color: "#320f54",
    layout: bottomLayout(0.9),
    logo: { x: 0.13, y: 0.11, w: 0.13 },
  },
  {
    id: "t8",
    name: { ar: "موجة ليلية", en: "Night wave" },
    src: `${base}templates/T8.png`,
    occasions: BOTH_EIDS,
    color: "#fefefd",
    layout: bottomLayout(0.9),
    logo: { x: 0.13, y: 0.11, w: 0.13 },
  },
  {
    id: "t9",
    name: { ar: "عمود فيروزي", en: "Turquoise column" },
    src: `${base}templates/T9.png`,
    occasions: BOTH_EIDS,
    color: "#feffff",
    layout: {
      name: { y: 0.92, size: 40, maxW: 0.32 },
      to: { y: 0.885, size: 32, maxW: 0.32 },
      from: { y: 0.945, size: 28, maxW: 0.32 },
    },
    logo: { x: 0.15, y: 0.12, w: 0.14 },
  },
  {
    id: "t10",
    name: { ar: "عمود بنفسجي", en: "Violet column" },
    src: `${base}templates/T10.png`,
    occasions: BOTH_EIDS,
    color: "#f9f1f0",
    layout: {
      name: { y: 0.92, size: 40, maxW: 0.32 },
      to: { y: 0.885, size: 32, maxW: 0.32 },
      from: { y: 0.945, size: 28, maxW: 0.32 },
    },
    logo: { x: 0.15, y: 0.12, w: 0.14 },
  },
];
