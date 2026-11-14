// Invitations designed as images (backgrounds made in Canva / Figma).
//
// HOW TO ADD ONE
// 1. Export the background as PNG or JPG, tall: 1080 × 1920 px.
//    Keep the middle area empty for the text (see docs/invitation-guide.png).
// 2. Put the file in public/invitations/ (e.g. public/invitations/gold-wedding.png).
// 3. Add an entry below. Only `id`, `name`, `src` and `invitations` are required.
//
// invitations: which invitation types it appears under (ids from invitations.js), e.g. ["inv-wedding"].
// colors: text colours that suit your background:
//   names (the big names), text (main text), muted (small lines), accent (ornaments).
// area: the empty text area, in fractions of the page: { top, bottom, side }.
//   Default { top: 0.09, bottom: 0.93, side: 0.12 }.

const base = import.meta.env.BASE_URL;

export const INVITE_IMAGE_TEMPLATES = [
  // Example:
  // {
  //   id: "gold-wedding",
  //   name: { ar: "ذهبي فاخر", en: "Gold luxury" },
  //   src: `${base}invitations/gold-wedding.png`,
  //   invitations: ["inv-wedding", "inv-milka"],
  //   colors: { names: "#8a6420", text: "#2b2b2b", muted: "#6b6b6b", accent: "#c9a24a" },
  //   area: { top: 0.14, bottom: 0.88, side: 0.14 },
  // },
];

export const inviteImageSrc = (path) => `${base}${path}`;
