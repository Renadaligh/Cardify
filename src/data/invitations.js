// الدعوات: invitations with date, time, place, map QR code and optional guest names.
//
// Each type sets the default wording (all of it can be edited in the editor), how many
// names are shown big in the middle, and which generated designs suit it.

export const HOST_VERBS = [
  { id: "m", ar: "يتشرف" },
  { id: "f", ar: "تتشرف" },
  { id: "two", ar: "يتشرفان" },
  { id: "family", ar: "يتشرف آل" },
];

const names2 = (a, b) => [
  { ar: a.ar, en: a.en },
  { ar: b.ar, en: b.en },
];
const groomBride = names2({ ar: "اسم العريس", en: "Groom's name" }, { ar: "اسم العروس", en: "Bride's name" });

export const INVITATIONS = [
  {
    id: "inv-wedding",
    kind: "invitation",
    group: "personal",
    name: { ar: "زواج", en: "Wedding" },
    names: groomBride,
    sentence: { ar: "بدعوتكم لحضور حفل زواج", en: "request the pleasure of your company at the wedding of" },
    closing: { ar: "وبحضوركم يتم الفرح والسرور", en: "Your presence will complete our joy" },
    theme: { accent: "#b9577a", blobs: ["#f472b6", "#d4a373", "#c084fc"] },
    designs: [
      ["floral", "blush"],
      ["frame", "champagne"],
      ["arch", "ivoryRose"],
      ["geometric", "charcoalGold"],
      ["frame", "greenGold"],
    ],
  },
  {
    id: "inv-milka",
    kind: "invitation",
    group: "personal",
    name: { ar: "ملكة وعقد قران", en: "Marriage contract" },
    names: groomBride,
    sentence: { ar: "بدعوتكم لحضور حفل عقد قران", en: "invite you to the marriage contract ceremony of" },
    closing: { ar: "وبحضوركم يتم الفرح والسرور", en: "Your presence will complete our joy" },
    theme: { accent: "#a87b26", blobs: ["#d4a373", "#f472b6", "#c084fc"] },
    designs: [
      ["arch", "creamGold"],
      ["floral", "champagne"],
      ["frame", "maroonCelebrate"],
      ["geometric", "royalPlum"],
    ],
  },
  {
    id: "inv-engagement",
    kind: "invitation",
    group: "personal",
    name: { ar: "خطوبة", en: "Engagement" },
    names: groomBride,
    sentence: { ar: "بدعوتكم لحضور حفل خطوبة", en: "invite you to the engagement party of" },
    closing: { ar: "بحضوركم تكتمل فرحتنا", en: "Your presence will make our day" },
    theme: { accent: "#c2417b", blobs: ["#f9a8d4", "#e9d5ff", "#fcd34d"] },
    designs: [
      ["floral", "pinkBaby"],
      ["arch", "champagne"],
      ["frame", "ivoryRose"],
    ],
  },
  {
    id: "inv-graduation",
    kind: "invitation",
    group: "personal",
    name: { ar: "حفل تخرج", en: "Graduation party" },
    names: [{ ar: "اسم الخريج أو الخريجة", en: "Graduate's name" }],
    sentence: { ar: "بدعوتكم لحضور حفل تخرج", en: "invite you to celebrate the graduation of" },
    closing: { ar: "حضوركم يسعدنا ويكمل فرحتنا", en: "We'd love to celebrate with you" },
    theme: { accent: "#1e3a8a", blobs: ["#1d4ed8", "#d97706", "#7c3aed"] },
    designs: [
      ["cap", "navyGold"],
      ["confetti", "navyGold"],
      ["balloons", "pastelBaby"],
    ],
  },
  {
    id: "inv-aqiqah",
    kind: "invitation",
    group: "personal",
    name: { ar: "عقيقة واستقبال مولود", en: "Aqiqah & new baby" },
    names: [{ ar: "اسم المولود", en: "Baby's name" }],
    sentence: { ar: "بدعوتكم لمشاركتنا فرحة قدوم مولودنا", en: "invite you to celebrate the arrival of" },
    closing: { ar: "بحضوركم تكتمل فرحتنا", en: "Your presence will make our day" },
    theme: { accent: "#0ea5e9", blobs: ["#7dd3fc", "#f9a8d4", "#fde68a"] },
    designs: [
      ["balloons", "pastelBaby"],
      ["balloons", "pinkBaby"],
      ["floral", "pinkBaby"],
    ],
  },
  {
    id: "inv-dinner",
    kind: "invitation",
    group: "personal",
    name: { ar: "عزيمة غداء أو عشاء", en: "Lunch or dinner" },
    names: [],
    sentence: { ar: "بدعوتكم لتناول طعام العشاء", en: "invite you to dinner" },
    closing: { ar: "حياكم الله", en: "You're most welcome" },
    theme: { accent: "#a16207", blobs: ["#f59e0b", "#b45309", "#14b8a6"] },
    designs: [
      ["frame", "sand"],
      ["geometric", "charcoalGold"],
      ["sadu", "desert"],
    ],
  },
  {
    id: "inv-family",
    kind: "invitation",
    group: "personal",
    name: { ar: "اجتماع عائلي", en: "Family gathering" },
    names: [],
    sentence: { ar: "بدعوتكم لحضور الاجتماع العائلي", en: "invite you to our family gathering" },
    closing: { ar: "بحضوركم يكتمل اللقاء", en: "It won't be complete without you" },
    theme: { accent: "#0f766e", blobs: ["#14b8a6", "#f59e0b", "#6366f1"] },
    designs: [
      ["sadu", "desert"],
      ["waves", "mintFresh"],
      ["frame", "tealLight"],
    ],
  },
  {
    id: "inv-retirement",
    kind: "invitation",
    group: "personal",
    name: { ar: "حفل تكريم أو تقاعد", en: "Honouring or retirement" },
    names: [{ ar: "اسم المحتفى به", en: "Honouree's name" }],
    sentence: { ar: "بدعوتكم لحضور حفل تكريم", en: "invite you to the honouring ceremony of" },
    closing: { ar: "تقديرًا لسنوات من العطاء", en: "In appreciation of years of dedication" },
    theme: { accent: "#7c3aed", blobs: ["#a78bfa", "#fb923c", "#60a5fa"] },
    designs: [
      ["frame", "charcoalGold"],
      ["floral", "lavender"],
      ["rays", "sunsetRetire"],
    ],
  },
  {
    id: "inv-opening",
    kind: "invitation",
    group: "business",
    name: { ar: "افتتاح", en: "Opening" },
    names: [{ ar: "اسم المشروع أو الفرع", en: "Business or branch name" }],
    sentence: { ar: "بدعوتكم لحضور حفل افتتاح", en: "invite you to the grand opening of" },
    closing: { ar: "يسعدنا تشريفكم", en: "We look forward to welcoming you" },
    theme: { accent: "#0d9488", blobs: ["#14b8a6", "#6366f1", "#0ea5e9"] },
    designs: [
      ["frame", "navyGold"],
      ["confetti", "tealPro"],
      ["geometric", "charcoalGold"],
    ],
  },
  {
    id: "inv-event",
    kind: "invitation",
    group: "business",
    name: { ar: "فعالية أو مؤتمر", en: "Event or conference" },
    names: [{ ar: "اسم الفعالية", en: "Event name" }],
    sentence: { ar: "بدعوتكم لحضور", en: "invite you to attend" },
    closing: { ar: "يسعدنا تشريفكم", en: "We look forward to welcoming you" },
    theme: { accent: "#2563eb", blobs: ["#3b82f6", "#14b8a6", "#a78bfa"] },
    designs: [
      ["frame", "tealLight"],
      ["waves", "seaWave"],
      ["rays", "charcoalGold"],
    ],
  },
];

// Ready-made extra lines the user can switch on.
export const INVITE_NOTES = [
  { id: "private", ar: "الدعوة خاصة", en: "This invitation is personal" },
  { id: "noKids", ar: "نعتذر عن اصطحاب الأطفال", en: "Kindly, no children" },
  { id: "noPhotos", ar: "نأمل عدم التصوير", en: "Kindly, no photography" },
];

export const PRAYER_TIMES = [
  { id: "asr", ar: "بعد صلاة العصر", en: "After Asr prayer" },
  { id: "maghrib", ar: "بعد صلاة المغرب", en: "After Maghrib prayer" },
  { id: "isha", ar: "بعد صلاة العشاء", en: "After Isha prayer" },
];

// Example text for the design thumbnails.
export const inviteSample = (inv, lang) => ({
  lang,
  basmala: lang === "ar",
  verb: HOST_VERBS[0],
  hosts: lang === "ar" ? "محمد بن عبدالله" : "Mohammed Abdullah",
  sentence: inv.sentence[lang],
  names: inv.names.map((n) => (lang === "ar" ? n.ar.replace(/^اسم\s+/, "") : n.en.replace(/'s name$/, ""))),
  date: "2026-12-17",
  timeMode: "isha",
  venue: lang === "ar" ? "قاعة الاحتفالات" : "The Grand Hall",
  closing: inv.closing[lang],
});
