import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { getOccasion, templatesFor } from "../data/occasions";
import { HOST_VERBS, INVITE_NOTES, PRAYER_TIMES, inviteSample } from "../data/invitations";
import { FONTS, ensureFonts } from "../engine/fonts";
import { renderInvite, inviteThumbnail, clearInviteThumbnails } from "../engine/inviteRenderer";
import { loadImage, canvasToBlob, downloadBlob, shareBlob, safeFilename, blobToBytes } from "../lib/files";
import { createZip } from "../lib/zip";
import CardStage from "../components/CardStage";
import BatchDialog from "../components/BatchDialog";
import { AlertModal } from "../components/Modal";
import { ColorField, Field, Segmented, StepTitle } from "../components/Controls";
import LogoList from "../components/LogoList";
import LimitedTextarea from "../components/CharCounter";

const GUEST_DEFAULTS = {
  ar: { prefix: "حضرة/", suffix: "حفظه الله" },
  en: { prefix: "Dear", suffix: "" },
};

export default function InviteEditor({ occasionId }) {
  const { t, lang, toast } = useApp();
  const inv = getOccasion(occasionId);
  const templates = useMemo(() => (inv ? templatesFor(inv) : []), [inv]);

  const [templateId, setTemplateId] = useState(templates[0]?.id);
  const [image, setImage] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [thumbs, setThumbs] = useState({});

  const [cardLang, setCardLang] = useState(lang);
  const [basmala, setBasmala] = useState(true);
  const [verbId, setVerbId] = useState("m");
  const [hosts, setHosts] = useState("");
  const [sentence, setSentence] = useState(null); // null = the type's default wording
  const [names, setNames] = useState(["", ""]);
  const [guestOn, setGuestOn] = useState(false);
  const [guest, setGuest] = useState("");
  const [guestPrefix, setGuestPrefix] = useState(null);
  const [guestSuffix, setGuestSuffix] = useState(null);

  const [date, setDate] = useState("");
  const [timeMode, setTimeMode] = useState("clock");
  const [time, setTime] = useState("20:00");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [mapLink, setMapLink] = useState("");

  const [audience, setAudience] = useState("all");
  const [notes, setNotes] = useState({});
  const [customNote, setCustomNote] = useState("");
  const [closing, setClosing] = useState(null);

  const [font, setFont] = useState("");
  const [nameColor, setNameColor] = useState(null);
  const [accent, setAccent] = useState(null);
  const [textScale, setTextScale] = useState(1);
  const [logos, setLogos] = useState([]);

  const [alert, setAlert] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const template = templates.find((tp) => tp.id === templateId) || templates[0];

  useEffect(() => {
    ensureFonts().then(() => {
      clearInviteThumbnails();
      setFontsReady(true);
    });
  }, []);

  useEffect(() => setCardLang(lang), [lang]);

  useEffect(() => {
    let cancelled = false;
    setImage(null);
    if (template?.kind === "image") loadImage(template.src).then((img) => !cancelled && setImage(img));
    return () => {
      cancelled = true;
    };
  }, [template]);

  useEffect(() => {
    if (!inv) return;
    let cancelled = false;
    (async () => {
      const next = {};
      const sample = inviteSample(inv, cardLang);
      for (const tp of templates) {
        const img = tp.kind === "image" ? await loadImage(tp.src).catch(() => null) : null;
        if (tp.kind === "image" && !img) continue;
        next[tp.id] = inviteThumbnail(tp, sample, img);
        if (cancelled) return;
      }
      setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [templates, inv, cardLang, fontsReady]);

  if (!inv) {
    navigate("/");
    return null;
  }

  const L = cardLang;
  const verb = HOST_VERBS.find((v) => v.id === verbId);
  const nameLabels = inv.names.map((n) => n[lang]);
  const finalSentence = sentence ?? inv.sentence[L];
  const finalClosing = closing ?? inv.closing[L];
  const prefix = guestPrefix ?? GUEST_DEFAULTS[L].prefix;
  const suffix = guestSuffix ?? GUEST_DEFAULTS[L].suffix;
  const palette = template?.kind === "generated" ? template.palette : null;

  const options = (overrides = {}) => ({
    template,
    image,
    lang: L,
    basmala,
    verb,
    hosts,
    sentence: finalSentence,
    names: names.slice(0, inv.names.length),
    guestOn,
    guest,
    guestPrefix: prefix,
    guestSuffix: suffix,
    date,
    timeMode,
    time,
    venue,
    city,
    mapLink,
    audience,
    notes,
    customNote,
    closing: finalClosing,
    font: font || null,
    nameColor,
    accent,
    textScale,
    logos,
    placeholders: {
      names: nameLabels.map((n) => n),
      hosts: t.invHosts,
      guest: t.invGuestPlaceholder,
    },
    ...overrides,
  });

  const draw = (canvas) => renderInvite(canvas, options());

  const changeLang = (v) => {
    setCardLang(v);
    // wording that wasn't edited follows the language
    setSentence(null);
    setClosing(null);
    setGuestPrefix(null);
    setGuestSuffix(null);
  };

  const validate = (forBatch = false) => {
    const missing = [];
    if (!hosts.trim()) missing.push(t.invHosts);
    inv.names.forEach((n, i) => !names[i]?.trim() && missing.push(n[lang]));
    if (!date) missing.push(t.invDate);
    if (!venue.trim()) missing.push(t.invVenue);
    if (guestOn && !forBatch && !guest.trim()) missing.push(t.invGuest);
    if (missing.length) {
      setAlert({ title: t.fieldRequiredTitle, text: t.fieldRequiredText.replace("{field}", missing.join("، ")) });
      return false;
    }
    if (mapLink.trim() && !/^https?:\/\//i.test(mapLink.trim())) {
      setAlert({ title: t.invMapInvalidTitle, text: t.invMapInvalidText });
      return false;
    }
    return true;
  };

  const exportBlob = async (overrides) => {
    await ensureFonts();
    const canvas = document.createElement("canvas");
    renderInvite(canvas, options({ placeholders: {}, ...overrides }));
    return canvasToBlob(canvas);
  };

  const filename = () => `cardify-${safeFilename(guestOn && guest ? guest : inv.name[L])}.png`;

  const onDownload = async () => {
    if (!validate() || busy) return;
    setBusy(true);
    try {
      downloadBlob(await exportBlob(), filename());
      toast(t.saved);
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    if (!validate() || busy) return;
    setBusy(true);
    try {
      const result = await shareBlob(await exportBlob(), filename(), inv.name[L]);
      if (result === "shared") toast(t.shared);
      if (result === "downloaded") toast(t.downloadedInstead);
    } finally {
      setBusy(false);
    }
  };

  const openBatch = () => {
    if (!validate(true)) return;
    setBatchOpen(true);
  };

  const timeOptions = [
    { value: "clock", label: t.invTimeClock },
    ...PRAYER_TIMES.map((p) => ({ value: p.id, label: p[lang] })),
    { value: "none", label: t.invTimeNone },
  ];

  return (
    <main className="container section">
      <div className="editor-head">
        <div>
          <button className="back-link" onClick={() => navigate("/")}>
            {lang === "ar" ? "→" : "←"} {t.back}
          </button>
          <h1>
            {t.invitationOf} {inv.name[lang]}
          </h1>
        </div>
      </div>

      <div className="editor">
        <div className="panel stage-wrap">
          <CardStage draw={draw} hint={t.invPreviewHint} label={inv.name[L]} />
        </div>

        <div className="controls">
          <section className="panel control-block">
            <StepTitle n={1}>{t.stepTemplate}</StepTitle>
            <div className="template-grid template-grid-tall">
              {templates.map((tp) => (
                <button
                  key={tp.id}
                  className="template-option"
                  aria-pressed={tp.id === template.id}
                  onClick={() => {
                    setTemplateId(tp.id);
                    setNameColor(null);
                    setAccent(null);
                  }}
                >
                  {thumbs[tp.id] ? <img src={thumbs[tp.id]} alt="" /> : <img alt="" />}
                  <span>{tp.name[lang]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel control-block">
            <StepTitle n={2}>{t.invStepWho}</StepTitle>

            <Field label={t.cardLanguage}>
              <Segmented
                label={t.cardLanguage}
                value={L}
                onChange={changeLang}
                options={[
                  { value: "ar", label: "العربية" },
                  { value: "en", label: "English" },
                ]}
              />
            </Field>

            {L === "ar" && (
              <label className="check">
                <input type="checkbox" checked={basmala} onChange={(e) => setBasmala(e.target.checked)} />
                {t.invBasmala}
              </label>
            )}

            {L === "ar" && (
              <Field label={t.invVerb}>
                <div className="chips chips-start" role="group" aria-label={t.invVerb}>
                  {HOST_VERBS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="chip"
                      aria-pressed={v.id === verbId}
                      onClick={() => setVerbId(v.id)}
                    >
                      {v.ar}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label={verbId === "family" && L === "ar" ? t.invFamily : t.invHosts} htmlFor="hosts">
              <input
                id="hosts"
                className="input"
                value={hosts}
                maxLength={70}
                placeholder={verbId === "family" && L === "ar" ? t.invFamilyPlaceholder : t.invHostsPlaceholder}
                onChange={(e) => setHosts(e.target.value)}
              />
            </Field>

            <Field label={t.invSentence} htmlFor="sentence">
              <LimitedTextarea id="sentence" value={finalSentence} max={90} onChange={setSentence} />
            </Field>

            {inv.names.map((n, i) => (
              <Field key={i} label={n[lang]} htmlFor={`name-${i}`}>
                <input
                  id={`name-${i}`}
                  className="input"
                  value={names[i] || ""}
                  maxLength={30}
                  onChange={(e) => setNames((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                />
              </Field>
            ))}

            <label className="check">
              <input type="checkbox" checked={guestOn} onChange={(e) => setGuestOn(e.target.checked)} />
              {t.invGuestOn}
            </label>
            {guestOn && (
              <>
                <div className="row-guest">
                  <Field label={t.invGuestPrefix} htmlFor="gprefix">
                    <input
                      id="gprefix"
                      className="input"
                      value={prefix}
                      maxLength={20}
                      onChange={(e) => setGuestPrefix(e.target.value)}
                    />
                  </Field>
                  <Field label={t.invGuest} htmlFor="guest">
                    <input
                      id="guest"
                      className="input"
                      value={guest}
                      maxLength={40}
                      placeholder={t.invGuestPlaceholder}
                      onChange={(e) => setGuest(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label={t.invGuestSuffix} htmlFor="gsuffix">
                  <input
                    id="gsuffix"
                    className="input"
                    value={suffix}
                    maxLength={30}
                    onChange={(e) => setGuestSuffix(e.target.value)}
                  />
                </Field>
                <p className="hint">{t.invGuestHint}</p>
              </>
            )}
          </section>

          <section className="panel control-block">
            <StepTitle n={3}>{t.invStepWhen}</StepTitle>
            <Field label={t.invDate} htmlFor="date" hint={t.invDateHint}>
              <input id="date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t.invTime} htmlFor="timeMode">
              <select id="timeMode" className="select" value={timeMode} onChange={(e) => setTimeMode(e.target.value)}>
                {timeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {timeMode === "clock" && (
                <input
                  type="time"
                  className="input"
                  style={{ marginTop: 8 }}
                  value={time}
                  aria-label={t.invTime}
                  onChange={(e) => setTime(e.target.value)}
                />
              )}
            </Field>
            <Field label={t.invVenue} htmlFor="venue">
              <input
                id="venue"
                className="input"
                value={venue}
                maxLength={60}
                placeholder={t.invVenuePlaceholder}
                onChange={(e) => setVenue(e.target.value)}
              />
            </Field>
            <Field label={t.invCity} htmlFor="city">
              <input
                id="city"
                className="input"
                value={city}
                maxLength={50}
                placeholder={t.invCityPlaceholder}
                onChange={(e) => setCity(e.target.value)}
              />
            </Field>
            <Field label={t.invMap} htmlFor="map" hint={t.invMapHint}>
              <input
                id="map"
                className="input"
                dir="ltr"
                inputMode="url"
                value={mapLink}
                placeholder="https://maps.app.goo.gl/..."
                onChange={(e) => setMapLink(e.target.value)}
              />
            </Field>
          </section>

          <section className="panel control-block">
            <StepTitle n={4}>{t.invStepNotes}</StepTitle>
            <Field label={t.invAudience}>
              <Segmented
                label={t.invAudience}
                value={audience}
                onChange={setAudience}
                options={[
                  { value: "all", label: t.invAudienceAll },
                  { value: "men", label: t.invAudienceMen },
                  { value: "women", label: t.invAudienceWomen },
                ]}
              />
            </Field>
            {INVITE_NOTES.map((n) => (
              <label className="check" key={n.id}>
                <input
                  type="checkbox"
                  checked={!!notes[n.id]}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [n.id]: e.target.checked }))}
                />
                {n[lang]}
              </label>
            ))}
            <Field label={t.invCustomNote} htmlFor="note">
              <input
                id="note"
                className="input"
                value={customNote}
                maxLength={70}
                placeholder={t.invCustomNotePlaceholder}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </Field>
            <Field label={t.invClosing} htmlFor="closing">
              <input
                id="closing"
                className="input"
                value={finalClosing}
                maxLength={60}
                onChange={(e) => setClosing(e.target.value)}
              />
            </Field>
          </section>

          <section className="panel control-block">
            <StepTitle n={5}>{t.stepStyle}</StepTitle>
            <Field label={t.invNamesFont} htmlFor="font">
              <select id="font" className="select" value={font} onChange={(e) => setFont(e.target.value)}>
                <option value="">{t.fontDefault}</option>
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>
                    {f.label[lang]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="row-2">
              <Field label={t.invNamesColor} htmlFor="nameColor">
                <ColorField
                  id="nameColor"
                  value={nameColor || palette?.ink || template?.colors?.names || "#7a5a1e"}
                  onChange={setNameColor}
                  onReset={nameColor ? () => setNameColor(null) : null}
                  resetLabel={t.resetColors}
                />
              </Field>
              <Field label={t.accentColor} htmlFor="accent">
                <ColorField
                  id="accent"
                  value={accent || palette?.accent || template?.colors?.accent || "#b48a3c"}
                  onChange={setAccent}
                  onReset={accent ? () => setAccent(null) : null}
                  resetLabel={t.resetColors}
                />
              </Field>
            </div>
            <Field label={`${t.annTextSize} (${Math.round(textScale * 100)}%)`} htmlFor="scale">
              <input
                id="scale"
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={textScale}
                onChange={(e) => setTextScale(Number(e.target.value))}
              />
            </Field>
            <p className="hint">{t.invAutoFit}</p>
          </section>

          <section className="panel control-block">
            <StepTitle n={6}>{t.stepLogo}</StepTitle>
            <LogoList logos={logos} onChange={setLogos} />
          </section>

          <section className="panel control-block actions">
            <button className="btn btn-primary" onClick={onDownload} disabled={busy}>
              {t.invDownload}
            </button>
            <button className="btn btn-secondary btn-wide" onClick={onShare} disabled={busy}>
              {t.share}
            </button>
            <button className="btn btn-secondary btn-wide" onClick={openBatch}>
              {t.invBatch}
            </button>
          </section>
        </div>
      </div>

      {alert && <AlertModal title={alert.title} text={alert.text} buttonLabel={t.ok} onClose={() => setAlert(null)} />}

      {batchOpen && (
        <BatchDialog
          title={t.invBatch}
          intro={t.invBatchIntro}
          onClose={() => setBatchOpen(false)}
          outputName="cardify-invitations.zip"
          build={async (guests, onProgress) => {
            await ensureFonts();
            const files = [];
            const used = new Set();
            for (let i = 0; i < guests.length; i++) {
              onProgress(i + 1);
              const blob = await exportBlob({ guestOn: true, guest: guests[i] });
              let file = `${safeFilename(guests[i], `invite-${i + 1}`)}.png`;
              if (used.has(file)) file = `${i + 1}-${file}`;
              used.add(file);
              files.push({ name: file, data: await blobToBytes(blob) });
            }
            return createZip(files);
          }}
        />
      )}
    </main>
  );
}
