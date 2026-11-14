// البشائر: the person announces their own good news ("بحمد الله عُقد قراني").
//
// Each announcement has "voices" (الصيغة): who the news is about. A voice lists the
// fields it needs and builds the sentence from them, in Arabic and English.
// To add one: copy an entry, change the texts, and pick designs like in occasions.js.

const opt = (value, before = " ", after = "") => (value?.trim() ? `${before}${value.trim()}${after}` : "");

// Field labels shown in the editor (a voice can rename a field with `labels`).
export const ANNOUNCEMENT_FIELDS = {
  person: { ar: "الاسم", en: "Name", placeholder: { ar: "مثال: محمد", en: "e.g. Mohammed" } },
  partner: { ar: "على (اختياري)", en: "To (optional)", placeholder: { ar: "مثال: كريمة آل فلان", en: "e.g. Sarah Ahmed" } },
  family: { ar: "اسم العائلة", en: "Family name", placeholder: { ar: "مثال: الغامدي", en: "e.g. Alghamdi" } },
  place: { ar: "الجهة (اختياري)", en: "Where (optional)", placeholder: { ar: "مثال: جامعة الملك سعود", en: "e.g. King Saud University" } },
};

const son = { ar: "ابني", en: "My son" };
const daughter = { ar: "ابنتي", en: "My daughter" };
const me = { ar: "أنا", en: "Me" };
const family = { ar: "العائلة", en: "Family" };

export const ANNOUNCEMENTS = [
  {
    id: "ann-aqd",
    kind: "announcement",
    name: { ar: "عقد قران", en: "Marriage contract" },
    title: { ar: "عقد قران", en: "Just Married" },
    theme: { accent: "#b9577a", blobs: ["#f472b6", "#d4a373", "#c084fc"] },
    designs: [
      ["floral", "blush"],
      ["frame", "champagne"],
      ["arch", "ivoryRose"],
      ["geometric", "charcoalGold"],
    ],
    voices: [
      {
        id: "self",
        label: me,
        fields: ["partner"],
        ar: (f) => `بحمد الله وتوفيقه تم عقد قراني${opt(f.partner, " على ")}`,
        en: (f) => `Alhamdulillah, I'm now married${opt(f.partner, " to ")}`,
      },
      {
        id: "son",
        label: son,
        fields: ["person", "partner"],
        required: ["person"],
        labels: { person: { ar: "اسم الابن", en: "Son's name" } },
        ar: (f) => `بحمد الله وتوفيقه تم عقد قران ابني ${f.person}${opt(f.partner, " على ")}، سائلين الله لهما التوفيق والسعادة`,
        en: (f) => `Alhamdulillah, my son ${f.person} is now married${opt(f.partner, " to ")}. May Allah bless them both`,
      },
      {
        id: "daughter",
        label: daughter,
        fields: ["person", "partner"],
        required: ["person"],
        labels: { person: { ar: "اسم الابنة", en: "Daughter's name" } },
        ar: (f) => `بحمد الله وتوفيقه تم عقد قران ابنتي ${f.person}${opt(f.partner, " على ")}، سائلين الله لهما التوفيق والسعادة`,
        en: (f) => `Alhamdulillah, my daughter ${f.person} is now married${opt(f.partner, " to ")}. May Allah bless them both`,
      },
      {
        id: "family",
        label: family,
        fields: ["family", "person", "partner"],
        required: ["family", "person"],
        ar: (f) => `يسرّ آل ${f.family} الإعلان عن عقد قران ${f.person}${opt(f.partner, " على ")}`,
        en: (f) => `The ${f.family} family is delighted to announce the marriage of ${f.person}${opt(f.partner, " to ")}`,
      },
    ],
  },
  {
    id: "ann-engagement",
    kind: "announcement",
    name: { ar: "خطوبة", en: "Engagement" },
    title: { ar: "خطوبة", en: "Engaged" },
    theme: { accent: "#c2417b", blobs: ["#f9a8d4", "#e9d5ff", "#fcd34d"] },
    designs: [
      ["floral", "pinkBaby"],
      ["frame", "ivoryRose"],
      ["arch", "champagne"],
      ["floral", "lavender"],
    ],
    voices: [
      {
        id: "self",
        label: me,
        fields: ["partner"],
        ar: (f) => `بحمد الله تمّت خطوبتي${opt(f.partner, " على ")}`,
        en: (f) => `Alhamdulillah, I'm engaged${opt(f.partner, " to ")}`,
      },
      {
        id: "son",
        label: son,
        fields: ["person", "partner"],
        required: ["person"],
        labels: { person: { ar: "اسم الابن", en: "Son's name" } },
        ar: (f) => `بحمد الله تمّت خطوبة ابني ${f.person}${opt(f.partner, " على ")}، أتمّ الله لهما على خير`,
        en: (f) => `Alhamdulillah, my son ${f.person} is engaged${opt(f.partner, " to ")}`,
      },
      {
        id: "daughter",
        label: daughter,
        fields: ["person", "partner"],
        required: ["person"],
        labels: { person: { ar: "اسم الابنة", en: "Daughter's name" } },
        ar: (f) => `بحمد الله تمّت خطوبة ابنتي ${f.person}${opt(f.partner, " على ")}، أتمّ الله لهما على خير`,
        en: (f) => `Alhamdulillah, my daughter ${f.person} is engaged${opt(f.partner, " to ")}`,
      },
      {
        id: "family",
        label: family,
        fields: ["family", "person", "partner"],
        required: ["family", "person"],
        ar: (f) => `يسرّ آل ${f.family} الإعلان عن خطوبة ${f.person}${opt(f.partner, " على ")}`,
        en: (f) => `The ${f.family} family is delighted to announce the engagement of ${f.person}${opt(f.partner, " to ")}`,
      },
    ],
  },
  {
    id: "ann-newborn",
    kind: "announcement",
    name: { ar: "مولود جديد", en: "New baby" },
    title: { ar: "مولود جديد", en: "New Baby" },
    theme: { accent: "#0ea5e9", blobs: ["#7dd3fc", "#f9a8d4", "#fde68a"] },
    designs: [
      ["balloons", "pastelBaby"],
      ["balloons", "pinkBaby"],
      ["floral", "pinkBaby"],
      ["waves", "mintFresh"],
    ],
    voices: [
      {
        id: "boy",
        label: { ar: "مولود", en: "Baby boy" },
        fields: ["person"],
        required: ["person"],
        labels: { person: { ar: "اسم المولود", en: "Baby's name" } },
        ar: (f) => `بحمد الله وفضله رُزقنا بمولودنا ${f.person}، جعله الله من مواليد السعادة`,
        en: (f) => `Alhamdulillah, we've been blessed with our baby boy ${f.person}`,
      },
      {
        id: "girl",
        label: { ar: "مولودة", en: "Baby girl" },
        fields: ["person"],
        required: ["person"],
        labels: { person: { ar: "اسم المولودة", en: "Baby's name" } },
        ar: (f) => `بحمد الله وفضله رُزقنا بمولودتنا ${f.person}، جعلها الله من مواليد السعادة`,
        en: (f) => `Alhamdulillah, we've been blessed with our baby girl ${f.person}`,
      },
      {
        id: "family",
        label: family,
        fields: ["family", "person"],
        required: ["family", "person"],
        labels: { person: { ar: "اسم المولود", en: "Baby's name" } },
        ar: (f) => `يسرّ آل ${f.family} الإعلان عن قدوم مولودهم ${f.person}`,
        en: (f) => `The ${f.family} family is delighted to welcome ${f.person}`,
      },
    ],
  },
  {
    id: "ann-graduation",
    kind: "announcement",
    name: { ar: "تخرّج", en: "Graduation" },
    title: { ar: "تخرّج", en: "Graduated" },
    theme: { accent: "#1e3a8a", blobs: ["#1d4ed8", "#d97706", "#7c3aed"] },
    designs: [
      ["cap", "navyGold"],
      ["confetti", "navyGold"],
      ["cap", "skyBlue"],
      ["frame", "maroonCelebrate"],
    ],
    voices: [
      {
        id: "self",
        label: me,
        fields: ["place"],
        ar: (f) => `بحمد الله وتوفيقه تخرّجت${opt(f.place, " من ")}`,
        en: (f) => `Alhamdulillah, I graduated${opt(f.place, " from ")}`,
      },
      {
        id: "son",
        label: son,
        fields: ["person", "place"],
        required: ["person"],
        labels: { person: { ar: "اسم الابن", en: "Son's name" } },
        ar: (f) => `بحمد الله تخرّج ابني ${f.person}${opt(f.place, " من ")}، وإلى نجاحات أكبر`,
        en: (f) => `Alhamdulillah, my son ${f.person} graduated${opt(f.place, " from ")}`,
      },
      {
        id: "daughter",
        label: daughter,
        fields: ["person", "place"],
        required: ["person"],
        labels: { person: { ar: "اسم الابنة", en: "Daughter's name" } },
        ar: (f) => `بحمد الله تخرّجت ابنتي ${f.person}${opt(f.place, " من ")}، وإلى نجاحات أكبر`,
        en: (f) => `Alhamdulillah, my daughter ${f.person} graduated${opt(f.place, " from ")}`,
      },
    ],
  },
  {
    id: "ann-hajj",
    kind: "announcement",
    name: { ar: "حج وعمرة", en: "Hajj & Umrah" },
    title: { ar: "تقبّل الله", en: "May Allah Accept" },
    theme: { accent: "#0f766e", blobs: ["#14b8a6", "#d4af37", "#0ea5e9"] },
    designs: [
      ["arch", "creamGold"],
      ["crescent", "nightEmerald"],
      ["geometric", "sand"],
      ["frame", "greenGold"],
    ],
    voices: [
      {
        id: "hajj",
        label: { ar: "أنا: حج", en: "Me: Hajj" },
        fields: [],
        ar: () => "بحمد الله أتممت أداء فريضة الحج، تقبّل الله منا ومنكم",
        en: () => "Alhamdulillah, I've completed Hajj. May Allah accept from us and you",
      },
      {
        id: "umrah",
        label: { ar: "أنا: عمرة", en: "Me: Umrah" },
        fields: [],
        ar: () => "بحمد الله أتممت أداء العمرة، تقبّل الله منا ومنكم",
        en: () => "Alhamdulillah, I've completed Umrah. May Allah accept from us and you",
      },
      {
        id: "father",
        label: { ar: "والدي", en: "My father" },
        fields: [],
        ar: () => "بحمد الله عاد والدي من الحج سالمًا، تقبّل الله منه",
        en: () => "Alhamdulillah, my father has returned safely from Hajj. May Allah accept from him",
      },
      {
        id: "mother",
        label: { ar: "والدتي", en: "My mother" },
        fields: [],
        ar: () => "بحمد الله عادت والدتي من الحج سالمةً، تقبّل الله منها",
        en: () => "Alhamdulillah, my mother has returned safely from Hajj. May Allah accept from her",
      },
    ],
  },
  {
    id: "ann-recovery",
    kind: "announcement",
    name: { ar: "شفاء", en: "Recovery" },
    title: { ar: "الحمد لله على السلامة", en: "Thank You" },
    theme: { accent: "#059669", blobs: ["#34d399", "#93c5fd", "#fde68a"] },
    designs: [
      ["waves", "mintFresh"],
      ["floral", "champagne"],
      ["frame", "tealLight"],
    ],
    voices: [
      {
        id: "self",
        label: me,
        fields: [],
        ar: () => "الحمد لله على تمام الشفاء، شاكرين لكم سؤالكم ودعواتكم",
        en: () => "Alhamdulillah, I've fully recovered. Thank you for your kind wishes and prayers",
      },
      {
        id: "father",
        label: { ar: "والدي", en: "My father" },
        fields: [],
        ar: () => "الحمد لله على سلامة والدي، شاكرين لكم سؤالكم ودعواتكم",
        en: () => "Alhamdulillah, my father has recovered. Thank you for your kind wishes and prayers",
      },
      {
        id: "mother",
        label: { ar: "والدتي", en: "My mother" },
        fields: [],
        ar: () => "الحمد لله على سلامة والدتي، شاكرين لكم سؤالكم ودعواتكم",
        en: () => "Alhamdulillah, my mother has recovered. Thank you for your kind wishes and prayers",
      },
      {
        id: "child",
        label: { ar: "ابني / ابنتي", en: "My child" },
        fields: ["person"],
        required: ["person"],
        ar: (f) => `الحمد لله على سلامة ${f.person}، شاكرين لكم سؤالكم ودعواتكم`,
        en: (f) => `Alhamdulillah, ${f.person} has recovered. Thank you for your kind wishes and prayers`,
      },
    ],
  },
  {
    id: "ann-home",
    kind: "announcement",
    name: { ar: "بيت جديد", en: "New home" },
    title: { ar: "بيت جديد", en: "New Home" },
    theme: { accent: "#b45309", blobs: ["#f59e0b", "#a16207", "#0ea5e9"] },
    designs: [
      ["frame", "sand"],
      ["geometric", "creamGold"],
      ["waves", "sunsetRetire"],
    ],
    voices: [
      {
        id: "self",
        label: { ar: "نحن", en: "We" },
        fields: ["place"],
        labels: { place: { ar: "الحي أو المدينة (اختياري)", en: "Area or city (optional)" } },
        ar: (f) => `بحمد الله انتقلنا إلى منزلنا الجديد${opt(f.place, " في ")}، نسأل الله أن يجعله دار خير وبركة`,
        en: (f) => `Alhamdulillah, we've moved into our new home${opt(f.place, " in ")}`,
      },
      {
        id: "family",
        label: family,
        fields: ["family", "place"],
        required: ["family"],
        labels: { place: { ar: "الحي أو المدينة (اختياري)", en: "Area or city (optional)" } },
        ar: (f) => `يسرّ آل ${f.family} الإعلان عن انتقالهم إلى منزلهم الجديد${opt(f.place, " في ")}`,
        en: (f) => `The ${f.family} family has moved into their new home${opt(f.place, " in ")}`,
      },
    ],
  },
  {
    id: "ann-job",
    kind: "announcement",
    name: { ar: "وظيفة أو ترقية", en: "New job or promotion" },
    title: { ar: "خبر سعيد", en: "Good News" },
    theme: { accent: "#0f766e", blobs: ["#14b8a6", "#d4af37", "#6366f1"] },
    designs: [
      ["frame", "navyGold"],
      ["confetti", "tealPro"],
      ["rays", "charcoalGold"],
    ],
    voices: [
      {
        id: "job",
        label: { ar: "وظيفة جديدة", en: "New job" },
        fields: ["place"],
        required: ["place"],
        labels: { place: { ar: "جهة العمل", en: "Company" } },
        ar: (f) => `بحمد الله وتوفيقه انضممت إلى ${f.place}`,
        en: (f) => `Alhamdulillah, I've joined ${f.place}`,
      },
      {
        id: "promotion",
        label: { ar: "ترقية", en: "Promotion" },
        fields: ["place"],
        labels: { place: { ar: "المسمى الجديد (اختياري)", en: "New title (optional)" } },
        ar: (f) => `بحمد الله وتوفيقه تمّت ترقيتي${opt(f.place, " إلى ")}`,
        en: (f) => `Alhamdulillah, I've been promoted${opt(f.place, " to ")}`,
      },
    ],
  },
  {
    id: "ann-quran",
    kind: "announcement",
    name: { ar: "ختم القرآن", en: "Quran completion" },
    title: { ar: "ختم القرآن", en: "Quran Completion" },
    theme: { accent: "#0b7a3e", blobs: ["#16a34a", "#d4af37", "#0d9488"] },
    designs: [
      ["arch", "greenGold"],
      ["geometric", "creamGold"],
      ["frame", "greenGold"],
    ],
    voices: [
      {
        id: "self",
        label: me,
        fields: [],
        ar: () => "بفضل الله أتممت حفظ كتاب الله، اللهم اجعله حجة لي لا عليّ",
        en: () => "By the grace of Allah, I've memorised the Holy Quran",
      },
      {
        id: "son",
        label: son,
        fields: ["person"],
        required: ["person"],
        labels: { person: { ar: "اسم الابن", en: "Son's name" } },
        ar: (f) => `بفضل الله أتمّ ابني ${f.person} حفظ كتاب الله، جعله الله من أهل القرآن`,
        en: (f) => `By the grace of Allah, my son ${f.person} has memorised the Holy Quran`,
      },
      {
        id: "daughter",
        label: daughter,
        fields: ["person"],
        required: ["person"],
        labels: { person: { ar: "اسم الابنة", en: "Daughter's name" } },
        ar: (f) => `بفضل الله أتمّت ابنتي ${f.person} حفظ كتاب الله، جعلها الله من أهل القرآن`,
        en: (f) => `By the grace of Allah, my daughter ${f.person} has memorised the Holy Quran`,
      },
    ],
  },
];

/** The sentence for a voice, or "" if a required field is still empty. */
export function announcementText(voice, fields, lang) {
  const missing = (voice.required || []).some((k) => !fields[k]?.trim());
  if (missing) return "";
  const clean = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, (v || "").trim()]));
  return voice[lang === "en" ? "en" : "ar"](clean);
}

// Sample sentence for the template thumbnails (first voice, example names).
const SAMPLE = {
  ar: { person: "محمد", family: "الغامدي", place: "شركة المستقبل" },
  en: { person: "Mohammed", family: "Alghamdi", place: "Future Co." },
};
for (const a of ANNOUNCEMENTS) {
  const v = a.voices[0];
  const pick = (lang) =>
    Object.fromEntries(v.fields.filter((k) => (v.required || []).includes(k)).map((k) => [k, SAMPLE[lang][k]]));
  a.sample = { ar: announcementText(v, pick("ar"), "ar"), en: announcementText(v, pick("en"), "en") };
}
