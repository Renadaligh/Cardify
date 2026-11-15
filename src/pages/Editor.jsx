import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { getOccasion, templatesFor } from "../data/occasions";
import { FONTS, ensureFonts } from "../engine/fonts";
import { renderCard, templateThumbnail, clearThumbnailCache } from "../engine/cardRenderer";
import { loadImage, canvasToBlob, downloadBlob, shareBlob, safeFilename, blobToBytes } from "../lib/files";
import { createZip } from "../lib/zip";
import CardStage from "../components/CardStage";
import BatchDialog from "../components/BatchDialog";
import { AlertModal } from "../components/Modal";
import EditorSteps, { Step, MobileActionBar } from "../components/EditorSteps";
import { ColorField, Field, Segmented } from "../components/Controls";
import LogoList from "../components/LogoList";
import LimitedTextarea from "../components/CharCounter";
import QrField from "../components/QrField";
import { emptyQr, qrOption } from "../lib/qrContent";
import { ANNOUNCEMENT_FIELDS, announcementText } from "../data/announcements";

const CUSTOM = "custom";
const PHRASE_MAX = 90;
const ANNOUNCE_MAX = 140;

export default function Editor({ occasionId }) {
  const { t, lang, toast } = useApp();
  const occasion = getOccasion(occasionId);
  const templates = useMemo(() => (occasion ? templatesFor(occasion) : []), [occasion]);

  const [templateId, setTemplateId] = useState(templates[0]?.id);
  const [image, setImage] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [thumbsVersion, setThumbsVersion] = useState(0);

  const [cardLang, setCardLang] = useState(lang);
  const [name, setName] = useState("");
  const [dedication, setDedication] = useState(false);
  const [toName, setToName] = useState("");
  const [phraseChoice, setPhraseChoice] = useState(0);
  const [customPhrase, setCustomPhrase] = useState("");

  // البشائر
  const isAnnounce = occasion?.kind === "announcement";
  const [voiceId, setVoiceId] = useState(occasion?.voices?.[0].id);
  const [annFields, setAnnFields] = useState({});
  const [annCustom, setAnnCustom] = useState(false);
  const [annText, setAnnText] = useState("");
  const voice = occasion?.voices?.find((v) => v.id === voiceId) || occasion?.voices?.[0];

  const [font, setFont] = useState("");
  const [nameColor, setNameColor] = useState(null);
  const [accent, setAccent] = useState(null);
  const [textScale, setTextScale] = useState(1);
  const [logos, setLogos] = useState([]);
  const [qr, setQr] = useState(emptyQr);
  const [size, setSize] = useState("square");
  const [offsets, setOffsets] = useState({});

  const [alert, setAlert] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const template = templates.find((tp) => tp.id === templateId) || templates[0];

  useEffect(() => {
    ensureFonts().then(() => {
      clearThumbnailCache();
      setFontsReady(true);
    });
  }, []);

  // Card language follows the site language until the user changes it here.
  useEffect(() => setCardLang(lang), [lang]);

  useEffect(() => {
    let cancelled = false;
    setImage(null);
    if (template?.kind === "image") {
      loadImage(template.src).then((img) => !cancelled && setImage(img));
    }
    return () => {
      cancelled = true;
    };
  }, [template]);

  // Load the image templates once so their thumbnails can be drawn.
  useEffect(() => {
    const images = templates.filter((tp) => tp.kind === "image");
    Promise.all(images.map((tp) => loadImage(tp.src).catch(() => null))).then(() => setThumbsVersion((v) => v + 1));
  }, [templates]);

  const [thumbs, setThumbs] = useState({});
  useEffect(() => {
    if (!occasion) return;
    let cancelled = false;
    (async () => {
      const next = {};
      for (const tp of templates) {
        const img = tp.kind === "image" ? await loadImage(tp.src).catch(() => null) : null;
        if (tp.kind === "image" && !img) continue;
        next[tp.id] = templateThumbnail(tp, occasion, cardLang, img);
        if (cancelled) return;
      }
      setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [templates, occasion, cardLang, fontsReady, thumbsVersion]);

  const phrases = occasion?.phrases?.[cardLang] || [];
  const fieldLabel = (key) => (voice?.labels?.[key] || ANNOUNCEMENT_FIELDS[key])[lang];
  const builtText = isAnnounce && voice ? announcementText(voice, annFields, cardLang) : "";
  // Preview while a required field is empty: show its label in its place.
  const previewText =
    isAnnounce && voice && !builtText
      ? voice[cardLang === "en" ? "en" : "ar"]({
          ...Object.fromEntries((voice.required || []).map((k) => [k, `(${fieldLabel(k)})`])),
          ...Object.fromEntries(Object.entries(annFields).filter(([, v]) => v?.trim())),
        })
      : "";
  const phrase = isAnnounce
    ? annCustom
      ? annText
      : builtText || previewText
    : phraseChoice === CUSTOM
      ? customPhrase
      : phrases[phraseChoice] || phrases[0] || "";

  const defaultNameColor = template?.kind === "image" ? template.color : template?.palette?.ink || "#000000";
  const defaultAccent = template?.kind === "generated" ? template.palette.accent : null;

  const options = (overrides = {}) => ({
    template,
    occasion,
    size,
    lang: cardLang,
    mode: isAnnounce ? "announcement" : undefined,
    name,
    dedication: isAnnounce ? false : dedication,
    toName,
    phrase,
    font: font || null,
    nameColor,
    accent,
    textScale,
    logos,
    qr: qrOption(qr, cardLang),
    offsets,
    image,
    placeholders: isAnnounce ? {} : { name: t.namePlaceholder, to: t.toPlaceholder },
    ...overrides,
  });

  const draw = (canvas) => renderCard(canvas, options());

  const onMove = useCallback((key, dx, dy) => {
    setOffsets((prev) => ({ ...prev, [key]: { dx, dy } }));
  }, []);

  const chooseTemplate = (id) => {
    setTemplateId(id);
    setOffsets({});
    setNameColor(null);
  };

  const changeSize = (value) => {
    setSize(value);
    setOffsets({});
  };

  const validate = () => {
    if (isAnnounce) {
      if (annCustom) {
        if (annText.trim()) return true;
        setAlert({ title: t.fieldRequiredTitle, text: t.fieldRequiredText.replace("{field}", t.annText) });
        return false;
      }
      const missing = (voice.required || []).find((k) => !annFields[k]?.trim());
      if (missing) {
        setAlert({ title: t.fieldRequiredTitle, text: t.fieldRequiredText.replace("{field}", fieldLabel(missing)) });
        return false;
      }
      return true;
    }
    if (!name.trim()) {
      setAlert({ title: t.nameRequiredTitle, text: t.nameRequiredText });
      return false;
    }
    if (dedication && !toName.trim()) {
      setAlert({ title: t.toRequiredTitle, text: t.toRequiredText });
      return false;
    }
    return true;
  };

  const exportBlob = async (overrides) => {
    await ensureFonts();
    const canvas = document.createElement("canvas");
    renderCard(canvas, options({ placeholders: {}, ...overrides }));
    return canvasToBlob(canvas);
  };

  const filename = () =>
    `cardify-${safeFilename(isAnnounce ? occasion.name[cardLang] : dedication ? toName : name)}.png`;

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
      const result = await shareBlob(await exportBlob(), filename(), occasion.title[cardLang]);
      if (result === "shared") toast(t.shared);
      if (result === "downloaded") toast(t.downloadedInstead);
    } finally {
      setBusy(false);
    }
  };

  if (!occasion) {
    navigate("/");
    return null;
  }

  return (
    <main className="container section">
      <div className="editor-head">
        <div>
          <button className="back-link" onClick={() => navigate("/")}>
            {lang === "ar" ? "→" : "←"} {t.back}
          </button>
          <h1>{occasion.name[lang]}</h1>
        </div>
      </div>

      <div className="editor">
        <div className="panel stage-wrap">
          <CardStage
            draw={draw}
            offsets={offsets}
            onMove={onMove}
            hint={t.dragHint}
            label={occasion.title[cardLang]}
          />
        </div>

        <div className="controls">
          <EditorSteps>
          <Step label={t.stepTemplate}>
            <div className="template-grid">
              {templates.map((tp) => (
                <button
                  key={tp.id}
                  className="template-option"
                  aria-pressed={tp.id === template.id}
                  onClick={() => chooseTemplate(tp.id)}
                >
                  {thumbs[tp.id] ? <img src={thumbs[tp.id]} alt="" /> : <img alt="" />}
                  <span>{tp.name[lang]}</span>
                </button>
              ))}
            </div>
          </Step>

          <Step label={t.stepText}>

            {isAnnounce && (
              <>
                <Field label={t.annVoice}>
                  <div className="chips chips-start" role="group" aria-label={t.annVoice}>
                    {occasion.voices.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="chip"
                        aria-pressed={v.id === voice.id}
                        onClick={() => setVoiceId(v.id)}
                      >
                        {v.label[lang]}
                      </button>
                    ))}
                  </div>
                </Field>

                {!annCustom &&
                  voice.fields.map((key) => (
                    <Field key={key} label={fieldLabel(key)} htmlFor={`ann-${key}`}>
                      <input
                        id={`ann-${key}`}
                        className="input"
                        value={annFields[key] || ""}
                        maxLength={40}
                        placeholder={ANNOUNCEMENT_FIELDS[key].placeholder[lang]}
                        onChange={(e) => setAnnFields((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </Field>
                  ))}

                <label className="check">
                  <input
                    type="checkbox"
                    checked={annCustom}
                    onChange={(e) => {
                      setAnnCustom(e.target.checked);
                      if (e.target.checked && !annText) setAnnText(builtText);
                    }}
                  />
                  {t.annEditText}
                </label>
                {annCustom && (
                  <Field label={t.annText} htmlFor="annText">
                    <LimitedTextarea id="annText" value={annText} max={ANNOUNCE_MAX} onChange={setAnnText} />
                  </Field>
                )}

                <Field label={t.annSignature} htmlFor="name">
                  <input
                    id="name"
                    className="input"
                    value={name}
                    maxLength={40}
                    placeholder={t.annSignaturePlaceholder}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              </>
            )}

            {!isAnnounce && (
            <>
            <Field label={t.yourName} htmlFor="name">
              <input
                id="name"
                className="input"
                value={name}
                maxLength={40}
                placeholder={t.namePlaceholder}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <label className="check">
              <input type="checkbox" checked={dedication} onChange={(e) => setDedication(e.target.checked)} />
              {t.dedicate}
            </label>

            {dedication && (
              <Field label={t.toName} htmlFor="toName">
                <input
                  id="toName"
                  className="input"
                  value={toName}
                  maxLength={40}
                  placeholder={t.toPlaceholder}
                  onChange={(e) => setToName(e.target.value)}
                />
              </Field>
            )}

            {template.kind === "generated" && (
              <Field label={t.phrase} htmlFor="phrase">
                <select
                  id="phrase"
                  className="select"
                  value={phraseChoice}
                  onChange={(e) => setPhraseChoice(e.target.value === CUSTOM ? CUSTOM : Number(e.target.value))}
                >
                  {phrases.map((p, i) => (
                    <option key={i} value={i}>
                      {p}
                    </option>
                  ))}
                  <option value={CUSTOM}>{t.customPhrase}</option>
                </select>
                {phraseChoice === CUSTOM && (
                  <div style={{ marginTop: 8 }}>
                    <LimitedTextarea
                      id="customPhrase"
                      value={customPhrase}
                      max={PHRASE_MAX}
                      placeholder={t.customPhrasePlaceholder}
                      onChange={setCustomPhrase}
                    />
                  </div>
                )}
              </Field>
            )}

            </>
            )}

            {(template.kind === "generated" || isAnnounce) && (
              <Field label={t.cardLanguage}>
                <Segmented
                  label={t.cardLanguage}
                  value={cardLang}
                  onChange={(v) => {
                    setCardLang(v);
                    if (phraseChoice !== CUSTOM) setPhraseChoice(0);
                  }}
                  options={[
                    { value: "ar", label: "العربية" },
                    { value: "en", label: "English" },
                  ]}
                />
              </Field>
            )}
          </Step>

          <Step label={t.stepStyle}>

            <Field label={t.font} htmlFor="font">
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
              <Field label={isAnnounce ? t.annTextColor : t.nameColor} htmlFor="nameColor">
                <ColorField
                  id="nameColor"
                  value={nameColor || defaultNameColor}
                  onChange={setNameColor}
                  onReset={nameColor ? () => setNameColor(null) : null}
                  resetLabel={t.resetColors}
                />
              </Field>

              {template.kind === "generated" && (
                <Field label={t.accentColor} htmlFor="accent">
                  <ColorField
                    id="accent"
                    value={accent || defaultAccent}
                    onChange={setAccent}
                    onReset={accent ? () => setAccent(null) : null}
                    resetLabel={t.resetColors}
                  />
                </Field>
              )}
            </div>
            {template.kind === "generated" && <p className="hint" style={{ marginTop: -4 }}>{t.accentHint}</p>}

            <Field label={`${isAnnounce ? t.annTextSize : t.textSize} (${Math.round(textScale * 100)}%)`} htmlFor="scale">
              <input
                id="scale"
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                value={textScale}
                onChange={(e) => setTextScale(Number(e.target.value))}
              />
            </Field>

            <button
              className="btn btn-ghost btn-small"
              onClick={() => setOffsets({})}
              disabled={!Object.keys(offsets).length}
            >
              {t.resetPositions}
            </button>
          </Step>

          <Step label={t.stepLogo}>
            <LogoList
              logos={logos}
              onChange={setLogos}
              onRemoved={() =>
                setOffsets((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("logo"))))
              }
            />
          </Step>

          <Step label={t.stepQr}>
            <p className="hint" style={{ marginTop: 0 }}>
              {t.qrIntro}
            </p>
            <QrField value={qr} onChange={setQr} cardLang={cardLang} />
          </Step>

          <Step label={t.stepSize}>
            <Segmented
              label={t.stepSize}
              value={size}
              onChange={changeSize}
              options={[
                { value: "square", label: t.square },
                { value: "story", label: t.story },
              ]}
            />
          </Step>
          </EditorSteps>

          <section className="panel control-block actions">
            <button className="btn btn-primary" onClick={onDownload} disabled={busy}>
              {t.download}
            </button>
            <button className="btn btn-secondary btn-wide" onClick={onShare} disabled={busy}>
              {t.share}
            </button>
            {!isAnnounce && (
              <button className="btn btn-secondary btn-wide" onClick={() => setBatchOpen(true)}>
                {t.batch}
              </button>
            )}
          </section>
        </div>
      </div>

      <MobileActionBar label={t.download} onClick={onDownload} disabled={busy} />

      {alert && <AlertModal title={alert.title} text={alert.text} buttonLabel={t.ok} onClose={() => setAlert(null)} />}

      {batchOpen && (
        <BatchDialog
          intro={dedication ? t.batchIntroTo : t.batchIntroNames}
          onClose={() => setBatchOpen(false)}
          validate={() => (dedication && !name.trim() ? t.batchFromRequired : null)}
          outputName="cardify-cards.zip"
          build={async (names, onProgress) => {
            await ensureFonts();
            const files = [];
            const used = new Set();
            for (let i = 0; i < names.length; i++) {
              onProgress(i + 1);
              const overrides = dedication ? { toName: names[i] } : { name: names[i] };
              const blob = await exportBlob(overrides);
              let file = `${safeFilename(names[i], `card-${i + 1}`)}.png`;
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
