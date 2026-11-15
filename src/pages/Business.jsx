import { useEffect, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { WORK_OCCASIONS, templatesFor } from "../data/occasions";
import { ensureFonts } from "../engine/fonts";
import { templateThumbnail } from "../engine/cardRenderer";
import { renderCertificate } from "../engine/certRenderer";
import { loadImage } from "../lib/files";
import { OccasionTile } from "./Home";
import PackageCards from "../components/PackageCards";

const FAN = 3;

function certificatePreview(lang) {
  const big = document.createElement("canvas");
  renderCertificate(big, {
    style: "modern",
    accent: "#0f766e",
    lang,
    title: lang === "ar" ? "شهادة إتمام دورة تدريبية" : "Certificate of Completion",
    intro: lang === "ar" ? "تشهد الجهة بأن المتدربة" : "This certifies that",
    name: lang === "ar" ? "هند العتيبي" : "Hind Alotaibi",
    reason: lang === "ar" ? "قد أتمّت البرنامج التدريبي بنجاح" : "Has successfully completed the training programme",
    headerLines: lang === "ar" ? "شركة المستقبل" : "Future Co.",
    dateText: "",
    verify: { serial: "CF-7K2M-Q9TB", url: "https://cardify.example/#/v/CF-7K2M-Q9TB" },
  });
  const small = document.createElement("canvas");
  small.width = 520;
  small.height = Math.round((520 * big.height) / big.width);
  small.getContext("2d").drawImage(big, 0, 0, small.width, small.height);
  return small.toDataURL("image/jpeg", 0.85);
}

/** "للشركات": company cards (paid per card) and company certificates, with the shared packs. */
export default function Business() {
  const { t, lang } = useApp();
  const [fans, setFans] = useState({});
  const [cert, setCert] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureFonts();
      if (cancelled) return;
      setCert(certificatePreview(lang));
      const next = {};
      for (const o of WORK_OCCASIONS) {
        const urls = [];
        for (const tpl of templatesFor(o).slice(0, FAN)) {
          const img = tpl.kind === "image" ? await loadImage(tpl.src).catch(() => null) : null;
          if (tpl.kind === "image" && !img) continue;
          urls.push(templateThumbnail(tpl, o, lang, img));
        }
        next[o.id] = urls;
        if (cancelled) return;
        setFans({ ...next });
        await new Promise((r) => setTimeout(r, 0));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <main className="container section business-page">
      <div className="editor-head">
        <div>
          <h1>{t.businessPageTitle}</h1>
          <p className="hint" style={{ fontSize: "1rem" }}>
            {t.businessPageSubtitle}
          </p>
        </div>
      </div>

      <button className="band business-cert-band" style={{ "--occ": "#0f766e" }} onClick={() => navigate("/business/certificates")}>
        <span className="band-text">
          <strong>{t.certTitleBusiness}</strong>
          <span>{t.certSubtitleBusiness}</span>
          <span className="band-cta">{t.businessCertCta}</span>
        </span>
        <span className="band-art band-cert" aria-hidden="true">
          {cert ? <img src={cert} alt="" /> : <span className="occ-skeleton skeleton" />}
        </span>
      </button>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>{t.businessCardsTitle}</h2>
        <p>{t.businessCardsSubtitle}</p>
      </div>
      <div className="occ-grid">
        {WORK_OCCASIONS.map((o) => (
          <OccasionTile key={o.id} occasion={o} lang={lang} t={t} fan={fans[o.id]} group={t.paidCardBadge} />
        ))}
      </div>

      <section className="cert-pricing">
        <div className="section-head">
          <h2>{t.pricingTitle}</h2>
          <p>{t.businessPricingNote}</p>
        </div>
        <PackageCards />
      </section>
    </main>
  );
}
