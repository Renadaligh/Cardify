// Texts for the certificates section. m = masculine, f = feminine.

export const CERT_TYPES = [
  { id: "appreciation", ar: "شهادة شكر وتقدير", en: "Certificate of Appreciation" },
  { id: "excellence", ar: "شهادة تفوّق", en: "Certificate of Excellence" },
  { id: "achievement", ar: "شهادة تميّز", en: "Certificate of Achievement" },
  { id: "participation", ar: "شهادة مشاركة", en: "Certificate of Participation" },
  { id: "attendance", ar: "شهادة حضور", en: "Certificate of Attendance" },
  { id: "custom", ar: "عنوان من كتابتي", en: "Custom title" },
];

export const RECIPIENTS = [
  { id: "student_m", label: { ar: "طالب", en: "Student (m)" }, gender: "m", intro: { ar: "يسرّنا تقديم هذه الشهادة للطالب" } },
  { id: "student_f", label: { ar: "طالبة", en: "Student (f)" }, gender: "f", intro: { ar: "يسرّنا تقديم هذه الشهادة للطالبة" } },
  { id: "teacher_m", label: { ar: "معلم", en: "Teacher (m)" }, gender: "m", intro: { ar: "يسرّنا تقديم هذه الشهادة للأستاذ" } },
  { id: "teacher_f", label: { ar: "معلمة", en: "Teacher (f)" }, gender: "f", intro: { ar: "يسرّنا تقديم هذه الشهادة للأستاذة" } },
  { id: "general", label: { ar: "عام", en: "General" }, gender: "m", intro: { ar: "يسرّنا تقديم هذه الشهادة إلى" } },
];

export const EN_INTRO = "This certificate is proudly presented to";

export const REASONS = [
  {
    m: "وذلك لتفوّقه الدراسي وتميّزه، متمنّين له دوام التوفيق والنجاح",
    f: "وذلك لتفوّقها الدراسي وتميّزها، متمنّين لها دوام التوفيق والنجاح",
    en: "For outstanding academic achievement. We wish you continued success.",
  },
  {
    m: "وذلك لحسن خلقه وانضباطه، متمنّين له مستقبلًا مشرقًا",
    f: "وذلك لحسن خلقها وانضباطها، متمنّين لها مستقبلًا مشرقًا",
    en: "For excellent conduct and discipline. Wishing you a bright future.",
  },
  {
    m: "وذلك لمشاركته الفاعلة وتميّزه في الأنشطة المدرسية",
    f: "وذلك لمشاركتها الفاعلة وتميّزها في الأنشطة المدرسية",
    en: "For active participation and excellence in school activities.",
  },
  {
    m: "وذلك لإتقانه حفظ كتاب الله وتلاوته، جعله الله من أهل القرآن",
    f: "وذلك لإتقانها حفظ كتاب الله وتلاوته، جعلها الله من أهل القرآن",
    en: "For excellence in Quran memorization and recitation.",
  },
  {
    m: "تقديرًا لجهوده المميزة وعطائه المستمر",
    f: "تقديرًا لجهودها المميزة وعطائها المستمر",
    en: "In appreciation of your outstanding effort and dedication.",
  },
];

export const CERT_STYLES = [
  { id: "classic", name: { ar: "كلاسيكي", en: "Classic" } },
  { id: "royal", name: { ar: "ملكي", en: "Royal" } },
  { id: "modern", name: { ar: "عصري", en: "Modern" } },
  { id: "islamic", name: { ar: "زخرفة إسلامية", en: "Islamic" } },
  { id: "kids", name: { ar: "مرح", en: "Playful" } },
];

export const CERT_COLORS = ["#a8792b", "#1e3a8a", "#0b7a3e", "#8b1e3f", "#6d28d9", "#0f766e"];
