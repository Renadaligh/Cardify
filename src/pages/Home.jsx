import { useEffect, useRef, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { GROUPS, OCCASIONS, templatesFor } from "../data/occasions";
import { ensureFonts } from "../engine/fonts";
import { templateThumbnail, clearThumbnailCache } from "../engine/cardRenderer";
import { renderCertificate } from "../engine/certRenderer";
import { loadImage } from "../lib/files";
import HeroSky from "../hero/HeroSky";
import { SCENES } from "../hero/skyScenes";

const FAN_SIZE = 3;

/** One occasion: a fan of its real templates that spreads on hover / focus. */
function OccasionTile({ occasion, lang, t, fan, group }) {
  const count = templatesFor(occasion).length;
  return (
    <button
      className="occ-tile"
      style={{ "--occ": occasion.theme.accent }}
      onClick={() => navigate(`/o/${occasion.id}`)}
    >
      <span className="occ-group">{group}</span>
      <span className="occ-fan" aria-hidden="true">
        {Array.from({ length: FAN_SIZE }, (_, i) => (
          <span key={i} className="occ-card" style={{ "--i": i - 1 }}>
            {fan?.[i] && <img src={fan[i]} alt="" loading="lazy" />}
          </span>
        ))}
      </span>
      <span className="occ-meta">
        <strong>{occasion.name[lang]}</strong>
        <span>{occasion.date ? occasion.date[lang] : t.templatesCount(count)}</span>
      </span>
      <span className="occ-go" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

/** Small preview of a certificate for the teachers band. */
function certificatePreview(lang) {
  const big = document.createElement("canvas");
  renderCertificate(big, {
    style: "classic",
    accent: "#a8792b",
    lang,
    title: lang === "ar" ? "شهادة شكر وتقدير" : "Certificate of Appreciation",
    intro: lang === "ar" ? "يسرّنا تقديم هذه الشهادة للطالبة" : "This certificate is proudly presented to",
    name: lang === "ar" ? "سارة محمد" : "Sarah Mohammed",
    reason: lang === "ar" ? "وذلك لتفوّقها الدراسي وتميّزها" : "For outstanding academic achievement",
    headerLines: lang === "ar" ? "المملكة العربية السعودية\nوزارة التعليم" : "",
    dateText: "",
  });
  const small = document.createElement("canvas");
  small.width = 560;
  small.height = Math.round((560 * big.height) / big.width);
  const ctx = small.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(big, 0, 0, small.width, small.height);
  return small.toDataURL("image/jpeg", 0.85);
}

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));

export default function Home() {
  const { t, lang, setHeroTint } = useApp();
  const occasionsRef = useRef(null);
  const [fans, setFans] = useState({});
  const { occasionFilter: filter, setOccasionFilter: setFilter, scrollRequest } = useApp();

  // Opened from a category in the header: scroll down to the occasions.
  useEffect(() => {
    if (!scrollRequest) return;
    const id = setTimeout(() => occasionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(id);
  }, [scrollRequest]);

  const [cert, setCert] = useState(null);
  const groupName = Object.fromEntries(GROUPS.map((g) => [g.id, g.name[lang]]));
  const visible = OCCASIONS.filter((o) => filter === "all" || o.group === filter);

  // Fans of real templates for every occasion, drawn a few at a time so scrolling stays smooth.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureFonts();
      clearThumbnailCache();
      const next = {};
      for (const occasion of OCCASIONS) {
        const list = templatesFor(occasion).slice(0, FAN_SIZE);
        const urls = [];
        for (const tpl of list) {
          const img = tpl.kind === "image" ? await loadImage(tpl.src).catch(() => null) : null;
          if (tpl.kind === "image" && !img) continue;
          urls.push(templateThumbnail(tpl, occasion, lang, img));
        }
        next[occasion.id] = urls;
        if (cancelled) return;
        setFans({ ...next });
        await nextFrame();
      }
      if (!cancelled) setCert(certificatePreview(lang));
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const thanks = OCCASIONS.find((o) => o.id === "thanks");

  return (
    <main>
      <HeroSky lang={lang} onScene={(i) => setHeroTint(SCENES[i].tint)}>
        {(word, i) => (
          <>
            <h1>
              {t.heroCard}{" "}
              <span key={i} className="hero-word">
                {word}
              </span>
            </h1>
            <p>{t.heroSubtitle}</p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => occasionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {t.start}
              </button>
              <button className="btn btn-glass" onClick={() => navigate("/certificates")}>
                {t.certificatesCta}
              </button>
            </div>
          </>
        )}
      </HeroSky>

      <section ref={occasionsRef} className="container section occasions-section">
        <div className="section-head">
          <h2>{t.occasionsTitle}</h2>
          <p>{t.occasionsSubtitle}</p>
        </div>

        <div className="filter-bar">
          <div className="chips" role="group" aria-label={t.occasionsTitle}>
            {[{ id: "all", name: { ar: t.filterAll, en: t.filterAll } }, ...GROUPS].map((g) => (
              <button key={g.id} className="chip" aria-pressed={filter === g.id} onClick={() => setFilter(g.id)}>
                {g.name[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="occ-grid">
          {visible.map((o) => (
            <OccasionTile key={o.id} occasion={o} lang={lang} t={t} fan={fans[o.id]} group={groupName[o.group]} />
          ))}
        </div>

        <div className="bands">
          <button className="band" style={{ "--occ": "#c9a24a" }} onClick={() => navigate("/certificates")}>
            <span className="band-text">
              <strong>{t.teachersTitle}</strong>
              <span>{t.teachersText}</span>
              <span className="band-cta">{t.teachersButton}</span>
            </span>
            <span className="band-art band-cert" aria-hidden="true">
              {cert && <img src={cert} alt="" />}
            </span>
          </button>
          <button className="band" style={{ "--occ": thanks.theme.accent }} onClick={() => navigate("/o/thanks")}>
            <span className="band-text">
              <strong>{t.businessTitle}</strong>
              <span>{t.businessText}</span>
              <span className="band-cta">{t.businessButton}</span>
            </span>
            <span className="band-art occ-fan" aria-hidden="true">
              {Array.from({ length: FAN_SIZE }, (_, i) => (
                <span key={i} className="occ-card" style={{ "--i": i - 1 }}>
                  {fans.thanks?.[i] && <img src={fans.thanks[i]} alt="" />}
                </span>
              ))}
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
