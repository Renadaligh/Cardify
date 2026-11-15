// "Real examples" strip on the home page: finished cards with made-up names,
// so visitors see what they'll get before they start.

import { getOccasion, templatesFor } from "./occasions";
import { announcementText } from "./announcements";
import { HOST_VERBS } from "./invitations";
import { renderCard } from "../engine/cardRenderer";
import { renderInvite } from "../engine/inviteRenderer";
import { renderCertificate } from "../engine/certRenderer";

const shrink = (big, width) => {
  const small = document.createElement("canvas");
  small.width = width;
  small.height = Math.round((width * big.height) / big.width);
  const ctx = small.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(big, 0, 0, small.width, small.height);
  return small.toDataURL("image/jpeg", 0.85);
};

const ar = (lang, a, e) => (lang === "en" ? e : a);

function card(occasionId, index, lang, extra) {
  const occasion = getOccasion(occasionId);
  const template = templatesFor(occasion).filter((t) => t.kind === "generated")[index];
  const big = document.createElement("canvas");
  renderCard(big, { template, occasion, size: "square", lang, phrase: occasion.phrases?.[lang]?.[0], ...extra });
  return shrink(big, 420);
}

export function renderExamples(lang) {
  const list = [];
  const add = (id, route, label, render, kind = "square") => {
    try {
      list.push({ id, route, label, url: render(), kind });
    } catch {
      /* skip an example that fails to draw */
    }
  };

  add("eid", "/o/eid-fitr", ar(lang, "تهنئة عيد", "Eid greeting"), () =>
    card("eid-fitr", 0, lang, { name: ar(lang, "عائلة الشهري", "The Alshehri family") })
  );

  add("wedding", "/o/inv-wedding", ar(lang, "دعوة زواج", "Wedding invitation"), () => {
    const inv = getOccasion("inv-wedding");
    const big = document.createElement("canvas");
    renderInvite(big, {
      template: templatesFor(inv)[0],
      lang,
      basmala: lang === "ar",
      verb: HOST_VERBS[2],
      hosts: ar(lang, "سعد الغامدي و فهد العتيبي", "Saad Alghamdi & Fahad Alotaibi"),
      sentence: inv.sentence[lang],
      names: ar(lang, ["عبدالله", "نورة"], ["Abdullah", "Noura"]),
      date: "2026-12-17",
      timeMode: "isha",
      venue: ar(lang, "قاعة الأمير للاحتفالات", "Al Ameer Hall"),
      city: ar(lang, "الرياض", "Riyadh"),
      qr: { payload: "https://maps.google.com", caption: ar(lang, "امسح للوصول إلى الموقع", "Scan for the location") },
      closing: inv.closing[lang],
    });
    return shrink(big, 300);
  }, "tall");

  add("newborn", "/o/ann-newborn", ar(lang, "بشارة مولود", "New baby"), () => {
    const occ = getOccasion("ann-newborn");
    return card("ann-newborn", 0, lang, {
      mode: "announcement",
      phrase: announcementText(occ.voices[1], { person: ar(lang, "لين", "Leen") }, lang),
      name: ar(lang, "أبو فيصل", "Faisal's dad"),
    });
  });

  add("cert", "/certificates", ar(lang, "شهادة شكر", "Certificate"), () => {
    const big = document.createElement("canvas");
    renderCertificate(big, {
      style: "royal",
      accent: "#1e3a8a",
      lang,
      title: ar(lang, "شهادة تفوّق", "Certificate of Excellence"),
      intro: ar(lang, "يسرّنا تقديم هذه الشهادة للطالب", "This certificate is proudly presented to"),
      name: ar(lang, "يوسف خالد", "Yousef Khalid"),
      reason: ar(lang, "وذلك لتفوّقه الدراسي وتميّزه، متمنّين له دوام التوفيق", "For outstanding academic achievement"),
      headerLines: lang === "ar" ? "المملكة العربية السعودية\nوزارة التعليم" : "",
      dateText: "",
      verify: { serial: "CF-7K2M-Q9TB", url: "https://cardify.example/#/v/CF-7K2M-Q9TB" },
    });
    return shrink(big, 520);
  }, "wide");

  add("grad", "/o/graduation", ar(lang, "تهنئة تخرّج", "Graduation"), () =>
    card("graduation", 0, lang, { name: ar(lang, "ريم الدوسري", "Reem Aldosari") })
  );

  add("national", "/o/national-day", ar(lang, "اليوم الوطني", "National Day"), () =>
    card("national-day", 0, lang, { name: ar(lang, "شركة المستقبل", "Future Co.") })
  );

  return list;
}
