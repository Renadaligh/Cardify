import { IMAGE_TEMPLATES } from "./imageTemplates";
import { DESIGNS } from "../engine/designs";
import { PALETTES } from "./palettes";

// To add an occasion: add an entry here. To add a generated template to an
// occasion: add [designName, paletteName] to its `designs` list.
// theme = the site's accent colour and background blobs inside that occasion.

export const GROUPS = [
  { id: "religious", name: { ar: "مناسبات دينية", en: "Religious occasions" } },
  { id: "national", name: { ar: "مناسبات وطنية", en: "National days" } },
  { id: "education", name: { ar: "التعليم", en: "Education" } },
  { id: "personal", name: { ar: "مناسبات شخصية", en: "Personal milestones" } },
  { id: "work", name: { ar: "العمل والشركات", en: "Work & business" } },
];

export const OCCASIONS = [
  {
    id: "ramadan",
    group: "religious",
    name: { ar: "رمضان", en: "Ramadan" },
    title: { ar: "رمضان كريم", en: "Ramadan Kareem" },
    phrases: {
      ar: [
        "مبارك عليكم الشهر، تقبّل الله صيامكم وقيامكم",
        "أهلّه الله علينا وعليكم باليمن والإيمان",
        "كل عام وأنتم إلى الله أقرب",
      ],
      en: [
        "Wishing you a blessed and peaceful Ramadan",
        "May this month bring you peace and light",
      ],
    },
    theme: { accent: "#5b3fd1", blobs: ["#6d5bd0", "#d9a441", "#3b82c4"] },
    designs: [
      ["crescent", "nightIndigo"],
      ["arch", "royalPlum"],
      ["geometric", "nightNavy"],
      ["frame", "creamGold"],
      ["crescent", "charcoalGold"],
      ["waves", "lavender"],
    ],
  },
  {
    id: "eid-fitr",
    group: "religious",
    name: { ar: "عيد الفطر", en: "Eid al-Fitr" },
    title: { ar: "عيد فطر مبارك", en: "Eid Mubarak" },
    phrases: {
      ar: [
        "تقبّل الله منا ومنكم صالح الأعمال",
        "أعاده الله علينا وعليكم باليمن والبركات",
        "كل عام وأنتم بخير، وعساكم من عوّاده",
      ],
      en: [
        "May Allah accept our good deeds and yours",
        "Wishing you joy and peace this Eid",
      ],
    },
    theme: { accent: "#800ed2", blobs: ["#2563eb", "#9333ea", "#0891b2"] },
    images: true,
    designs: [
      ["crescent", "nightEmerald"],
      ["arch", "creamGold"],
      ["geometric", "tealLight"],
      ["confetti", "festive"],
    ],
  },
  {
    id: "eid-adha",
    group: "religious",
    name: { ar: "عيد الأضحى", en: "Eid al-Adha" },
    title: { ar: "عيد أضحى مبارك", en: "Eid Mubarak" },
    phrases: {
      ar: [
        "تقبّل الله منا ومنكم، وكل عام وأنتم بخير",
        "أعاده الله علينا وعليكم وعلى الأمة الإسلامية بالخير",
        "تقبّل الله طاعاتكم وحجّ الحجاج",
      ],
      en: [
        "Eid Mubarak! May your home be filled with blessings",
        "Wishing you and your family a blessed Eid al-Adha",
      ],
    },
    theme: { accent: "#9a6b12", blobs: ["#d9a441", "#7c3aed", "#0f766e"] },
    images: true,
    designs: [
      ["crescent", "nightNavy"],
      ["arch", "maroonGold"],
      ["geometric", "sand"],
      ["frame", "creamGold"],
    ],
  },
  {
    id: "national-day",
    group: "national",
    date: { ar: "٢٣ سبتمبر", en: "23 September" },
    name: { ar: "اليوم الوطني", en: "National Day" },
    title: { ar: "دام عزّك يا وطن", en: "Happy National Day" },
    phrases: {
      ar: ["اليوم الوطني السعودي", "حفظ الله بلادنا وأدام عزّها", "فخورون بوطننا وقيادتنا"],
      en: ["Saudi National Day", "Proud of our homeland"],
    },
    theme: { accent: "#0b7a3e", blobs: ["#16a34a", "#0d9488", "#65a30d"] },
    designs: [
      ["rays", "saudiGreen"],
      ["sadu", "greenSadu"],
      ["waves", "greenWhite"],
      ["frame", "greenGold"],
      ["geometric", "greenWhite"],
    ],
  },
  {
    id: "founding-day",
    group: "national",
    date: { ar: "٢٢ فبراير", en: "22 February" },
    name: { ar: "يوم التأسيس", en: "Founding Day" },
    title: { ar: "يوم التأسيس", en: "Founding Day" },
    phrases: {
      ar: ["يوم بدينا", "نعتز بجذورنا وتاريخنا العريق", "ذكرى تأسيس الدولة السعودية"],
      en: ["Proud of our roots and history", "Saudi Founding Day"],
    },
    theme: { accent: "#8a5a2b", blobs: ["#b45309", "#a16207", "#92400e"] },
    designs: [
      ["sadu", "desert"],
      ["sadu", "earthDark"],
      ["frame", "sand"],
      ["arch", "earthDark"],
      ["rays", "desert"],
    ],
  },
  {
    id: "flag-day",
    group: "national",
    date: { ar: "١١ مارس", en: "11 March" },
    name: { ar: "يوم العلم", en: "Flag Day" },
    title: { ar: "يوم العلم", en: "Flag Day" },
    phrases: {
      ar: ["رايتنا خفّاقة عالية", "علمنا رمز عزّنا ووحدتنا"],
      en: ["Our flag, our pride", "Saudi Flag Day"],
    },
    theme: { accent: "#047857", blobs: ["#059669", "#10b981", "#0f766e"] },
    designs: [
      ["rays", "greenWhite"],
      ["waves", "greenWhite"],
      ["frame", "saudiGreen"],
      ["sadu", "greenSadu"],
    ],
  },
  {
    id: "teachers-day",
    group: "education",
    date: { ar: "٥ أكتوبر", en: "5 October" },
    name: { ar: "يوم المعلم", en: "Teachers' Day" },
    title: { ar: "شكرًا معلمي", en: "Thank You, Teacher" },
    phrases: {
      ar: [
        "كل الشكر لمن علّمنا حرفًا وأنار لنا الطريق",
        "شكرًا على عطائك وصبرك وإخلاصك",
        "معلمي، أنت النور الذي أضاء دروبنا",
      ],
      en: ["Thank you for everything you taught us", "Happy Teachers' Day!"],
    },
    theme: { accent: "#2563eb", blobs: ["#3b82f6", "#f59e0b", "#10b981"] },
    designs: [
      ["chalk", "chalkboard"],
      ["confetti", "skyBlue"],
      ["frame", "navyGold"],
      ["floral", "skyBlue"],
      ["waves", "seaWave"],
    ],
  },
  {
    id: "graduation",
    group: "education",
    name: { ar: "التخرج", en: "Graduation" },
    title: { ar: "مبروك التخرج", en: "Happy Graduation" },
    phrases: {
      ar: ["فرحة تخرجك فرحتنا، وإلى نجاحات أكبر", "بداية مشوار جديد مليء بالإنجاز", "تعب السنين صار فرحة اليوم"],
      en: ["So proud of you, congratulations!", "The future is yours"],
    },
    theme: { accent: "#1e3a8a", blobs: ["#1d4ed8", "#d97706", "#7c3aed"] },
    designs: [
      ["cap", "navyGold"],
      ["confetti", "navyGold"],
      ["cap", "skyBlue"],
      ["balloons", "pastelBaby"],
      ["frame", "maroonCelebrate"],
    ],
  },
  {
    id: "school-end",
    group: "education",
    name: { ar: "نهاية العام الدراسي", en: "End of school year" },
    title: { ar: "ختامها مسك", en: "Have a Great Summer" },
    phrases: {
      ar: ["شكرًا على عام مليء بالعطاء والإنجاز", "إجازة سعيدة ونلقاكم على خير"],
      en: ["Thank you for a wonderful year", "Enjoy your summer break!"],
    },
    theme: { accent: "#ea580c", blobs: ["#f97316", "#facc15", "#0ea5e9"] },
    designs: [
      ["confetti", "sunsetOrange"],
      ["waves", "seaWave"],
      ["balloons", "sunsetOrange"],
      ["chalk", "chalkboard"],
    ],
  },
  {
    id: "wedding",
    group: "personal",
    name: { ar: "الزواج", en: "Wedding" },
    title: { ar: "بارك الله لكما", en: "Congratulations" },
    phrases: {
      ar: ["بارك الله لكما وبارك عليكما وجمع بينكما في خير", "ألف مبروك، وعسى أيامكم كلها سعادة"],
      en: ["Wishing you a lifetime of love and happiness", "Congratulations on your wedding"],
    },
    theme: { accent: "#b9577a", blobs: ["#f472b6", "#d4a373", "#c084fc"] },
    designs: [
      ["floral", "blush"],
      ["frame", "champagne"],
      ["arch", "ivoryRose"],
      ["floral", "champagne"],
      ["geometric", "charcoalGold"],
    ],
  },
  {
    id: "newborn",
    group: "personal",
    name: { ar: "المولود", en: "New baby" },
    title: { ar: "مبارك المولود", en: "Welcome, Little One" },
    phrases: {
      ar: ["بورك لكم في الموهوب، وشكرتم الواهب، وبلغ أشدّه، ورُزقتم برّه", "جعله الله من مواليد السعادة"],
      en: ["Congratulations on your new arrival", "Welcome to the world, little one"],
    },
    theme: { accent: "#0ea5e9", blobs: ["#7dd3fc", "#f9a8d4", "#fde68a"] },
    designs: [
      ["balloons", "pastelBaby"],
      ["balloons", "pinkBaby"],
      ["floral", "pinkBaby"],
      ["confetti", "pastelBaby"],
      ["waves", "mintFresh"],
    ],
  },
  {
    id: "promotion",
    group: "personal",
    name: { ar: "الترقية", en: "Promotion" },
    title: { ar: "مبروك الترقية", en: "Congratulations" },
    phrases: {
      ar: ["نجاح يستحقه من يعمل بإخلاص", "إلى الأمام دائمًا، ومزيدًا من التقدم"],
      en: ["Congratulations on your well-deserved promotion", "Onwards and upwards!"],
    },
    theme: { accent: "#0f766e", blobs: ["#14b8a6", "#d4af37", "#0ea5e9"] },
    designs: [
      ["frame", "navyGold"],
      ["confetti", "tealPro"],
      ["rays", "charcoalGold"],
      ["geometric", "tealLight"],
    ],
  },
  {
    id: "retirement",
    group: "personal",
    name: { ar: "التقاعد", en: "Retirement" },
    title: { ar: "شكرًا لسنوات العطاء", en: "Happy Retirement" },
    phrases: {
      ar: ["بداية جديدة لأيام أجمل", "سيبقى أثرك الطيب حاضرًا في كل مكان"],
      en: ["Thank you for years of dedication", "Enjoy every moment of your new chapter"],
    },
    theme: { accent: "#7c3aed", blobs: ["#a78bfa", "#fb923c", "#60a5fa"] },
    designs: [
      ["floral", "lavender"],
      ["waves", "sunsetRetire"],
      ["frame", "charcoalGold"],
      ["rays", "sunsetRetire"],
    ],
  },
  {
    id: "thanks",
    group: "work",
    name: { ar: "شكر وتقدير", en: "Thank you" },
    title: { ar: "شكرًا لك", en: "Thank You" },
    phrases: {
      ar: ["شكرًا لجهودك المميزة وعطائك المستمر", "عطاؤك يصنع الفرق", "نقدّر شراكتكم وثقتكم بنا"],
      en: ["Thank you for your outstanding effort", "We value your partnership"],
    },
    theme: { accent: "#0d9488", blobs: ["#14b8a6", "#6366f1", "#0ea5e9"] },
    designs: [
      ["frame", "tealLight"],
      ["geometric", "charcoalGold"],
      ["waves", "mintFresh"],
      ["confetti", "tealPro"],
      ["frame", "navyGold"],
    ],
  },
];

export const DEFAULT_THEME = { accent: "#800ed2", blobs: ["#2563eb", "#9333ea", "#0891b2"] };

export function getOccasion(id) {
  return OCCASIONS.find((o) => o.id === id);
}

/** All templates (image + generated) available for an occasion. */
export function templatesFor(occasion) {
  const generated = occasion.designs.map(([design, palette], i) => ({
    id: `${occasion.id}-${design}-${palette}-${i}`,
    kind: "generated",
    design,
    palette: PALETTES[palette],
    name: DESIGNS[design].name,
  }));
  const images = occasion.images
    ? IMAGE_TEMPLATES.filter((t) => t.occasions.includes(occasion.id)).map((t) => ({ ...t, kind: "image" }))
    : [];
  return [...images, ...generated];
}
