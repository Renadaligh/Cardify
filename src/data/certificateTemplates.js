// Certificates designed as images (backgrounds made in Canva / Figma).
//
// HOW TO ADD ONE
// 1. Export the background as PNG or JPG, A4 landscape: 3508 × 2480 px.
//    Leave empty space where the text goes (see "certificate-guide.png" in the README).
// 2. Put the file in public/certificates/ (e.g. public/certificates/gold.png).
// 3. Add an entry below. Only `id`, `name` and `src` are required; everything else is optional.
//
// layout: move any part, in fractions of the page height (y) or width (edge / sideX / maxW):
//   header  { y, edge }        header lines and logos (edge = distance from the side)
//   title   { y, size, show }  certificate title — set show: false if it's part of your design
//   divider { y, show }        small ornament under the title
//   intro   { y }              "يسرّنا تقديم هذه الشهادة..."
//   name    { y, size, line }  recipient's name, and the thin line under it
//   reason  { y, maxW }        reason text (up to 3 lines)
//   footer  { y, sideX }       signature (one side) and date (other side)
// colors: title, name, text, muted, accent — text colours that suit your background.
// medal: true draws the gold medal in the middle of the footer.

const base = import.meta.env.BASE_URL;

export const CERT_IMAGE_TEMPLATES = [
  // Example:
  // {
  //   id: "gold-frame",
  //   name: { ar: "إطار ذهبي", en: "Gold frame" },
  //   src: `${base}certificates/gold.png`,
  //   colors: { title: "#8a6420", name: "#8a6420", text: "#2b2b2b", muted: "#6b6b6b", accent: "#c9a24a" },
  //   layout: { title: { y: 0.3 }, name: { y: 0.5 } },
  //   medal: false,
  // },
];

export const certImageSrc = (path) => `${base}${path}`;
