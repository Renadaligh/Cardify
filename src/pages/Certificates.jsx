import { useEffect, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { ensureFonts } from "../engine/fonts";
import { renderCertificate, CERT_SIZE } from "../engine/certRenderer";
import { CERT_COLORS, CERT_STYLES, CERT_TYPES, EN_INTRO, REASONS, RECIPIENTS } from "../data/certificates";
import { CERT_IMAGE_TEMPLATES } from "../data/certificateTemplates";
import { canvasToBlob, blobToBytes, downloadBlob, loadImage, readImageFile, safeFilename, shareBlob } from "../lib/files";
import { createImagePdf } from "../lib/pdf";
import { formatDate } from "../lib/text";
import CardStage from "../components/CardStage";
import BatchDialog from "../components/BatchDialog";
import SignaturePad from "../components/SignaturePad";
import LogoList from "../components/LogoList";
import LimitedTextarea from "../components/CharCounter";
import { AlertModal } from "../components/Modal";
import { ColorField, Field, FileButton, Segmented, StepTitle } from "../components/Controls";

const CUSTOM = "custom";
const REASON_MAX = 130;

export default function Certificates() {
  const { t, lang, toast } = useApp();
  const [fontsReady, setFontsReady] = useState(false);

  // Designs: your image templates first, then the built-in styles.
  const designs = [
    ...CERT_IMAGE_TEMPLATES.map((d) => ({ ...d, kind: "image" })),
    ...CERT_STYLES.map((d) => ({ ...d, kind: "style" })),
  ];
  const [designId, setDesignId] = useState(designs[0].id);
  const design = designs.find((d) => d.id === designId) || designs[0];
  const [images, setImages] = useState({});
  const [thumbs, setThumbs] = useState({});
  const [accent, setAccent] = useState(CERT_COLORS[0]);
  const [certLang, setCertLang] = useState(lang);
  const [type, setType] = useState("appreciation");
  const [customTitle, setCustomTitle] = useState("");
  const [recipient, setRecipient] = useState("student_m");
  const [name, setName] = useState("");
  const [reasonChoice, setReasonChoice] = useState(0);
  const [customReason, setCustomReason] = useState("");
  const [headerLines, setHeaderLines] = useState(null);
  const [logos, setLogos] = useState([]);
  const [signerRole, setSignerRole] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState(null);
  const [calendar, setCalendar] = useState("hijri");

  const [alert, setAlert] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => setCertLang(lang), [lang]);

  // Load the designed backgrounds, then draw a small preview of every design.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = {};
      for (const d of CERT_IMAGE_TEMPLATES) {
        loaded[d.id] = await loadImage(d.src).catch(() => null);
      }
      if (cancelled) return;
      setImages(loaded);
      await ensureFonts();
      const next = {};
      for (const d of designs) {
        const big = document.createElement("canvas");
        renderCertificate(big, {
          style: d.kind === "style" ? d.id : "classic",
          template: d.kind === "image" ? { ...d, image: loaded[d.id] } : null,
          accent: CERT_COLORS[0],
          lang,
          title: lang === "ar" ? "شهادة شكر وتقدير" : "Certificate of Appreciation",
          intro: "",
          name: lang === "ar" ? "اسم المُكرَّم" : "Recipient",
          reason: "",
          headerLines: "",
          dateText: "",
        });
        const small = document.createElement("canvas");
        small.width = 300;
        small.height = Math.round((300 * big.height) / big.width);
        small.getContext("2d").drawImage(big, 0, 0, small.width, small.height);
        next[d.id] = small.toDataURL("image/jpeg", 0.85);
        if (cancelled) return;
      }
      setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Until the user edits it, the header follows the certificate language.
  const header = headerLines ?? (certLang === "ar" ? "المملكة العربية السعودية\nوزارة التعليم" : "");

  const recipientInfo = RECIPIENTS.find((r) => r.id === recipient);
  const typeInfo = CERT_TYPES.find((c) => c.id === type);
  const title = type === CUSTOM ? customTitle : typeInfo[certLang];
  const intro = certLang === "ar" ? recipientInfo.intro.ar : EN_INTRO;
  const reasonText = (choice) => {
    if (choice === CUSTOM) return customReason;
    const r = REASONS[choice];
    return certLang === "ar" ? r[recipientInfo.gender] : r.en;
  };

  const options = (overrides = {}) => ({
    style: design.kind === "style" ? design.id : "classic",
    template: design.kind === "image" ? { ...design, image: images[design.id] } : null,
    accent,
    lang: certLang,
    title,
    intro,
    name,
    reason: reasonText(reasonChoice),
    headerLines: header,
    logos,
    signerRole,
    signerName,
    signature,
    dateText: formatDate(new Date(), certLang, calendar),
    dateLabel: certLang === "ar" ? "التاريخ" : "Date",
    placeholderName: certLang === "ar" ? "اسم المُكرَّم" : "Recipient name",
    fontsReady,
    ...overrides,
  });

  const draw = (canvas) => {
    renderCertificate(canvas, options());
    return [];
  };

  const validate = () => {
    if (!name.trim()) {
      setAlert({ title: t.studentRequiredTitle, text: t.studentRequiredText });
      return false;
    }
    return true;
  };

  const renderTo = async (overrides) => {
    await ensureFonts();
    const canvas = document.createElement("canvas");
    renderCertificate(canvas, options({ placeholderName: "", ...overrides }));
    return canvas;
  };

  const pdfPage = async (canvas) => ({
    jpeg: await blobToBytes(await canvasToBlob(canvas, "image/jpeg", 0.92)),
    width: CERT_SIZE.w,
    height: CERT_SIZE.h,
  });

  const run = async (fn) => {
    if (!validate() || busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const fileBase = () => `certificate-${safeFilename(name)}`;

  const onPdf = () =>
    run(async () => {
      const page = await pdfPage(await renderTo());
      downloadBlob(createImagePdf([page]), `${fileBase()}.pdf`);
      toast(t.saved);
    });

  const onPng = () =>
    run(async () => {
      downloadBlob(await canvasToBlob(await renderTo()), `${fileBase()}.png`);
      toast(t.saved);
    });

  const onShare = () =>
    run(async () => {
      const blob = await canvasToBlob(await renderTo());
      const result = await shareBlob(blob, `${fileBase()}.png`, title);
      if (result === "shared") toast(t.shared);
      if (result === "downloaded") toast(t.downloadedInstead);
    });

  const onImage = (setter) => async (file) => {
    try {
      const img = await readImageFile(file);
      setter(img);
    } catch {
      toast(t.fileError);
    }
  };

  return (
    <main className="container section">
      <div className="editor-head">
        <div>
          <button className="back-link" onClick={() => navigate("/")}>
            {lang === "ar" ? "→" : "←"} {t.home}
          </button>
          <h1>{t.certTitle}</h1>
          <p className="hint" style={{ fontSize: "1rem" }}>
            {t.certSubtitle}
          </p>
        </div>
      </div>

      <div className="editor">
        <div className="panel stage-wrap">
          <CardStage draw={draw} label={title} />
        </div>

        <div className="controls">
          <section className="panel control-block">
            <StepTitle n={1}>{t.certDesign}</StepTitle>
            <div className="template-grid cert-grid">
              {designs.map((d) => (
                <button
                  key={d.id}
                  className="template-option"
                  aria-pressed={d.id === design.id}
                  onClick={() => setDesignId(d.id)}
                >
                  {thumbs[d.id] ? <img src={thumbs[d.id]} alt="" /> : <img alt="" />}
                  <span>{d.name[lang]}</span>
                </button>
              ))}
            </div>
            {design.kind === "style" && (
              <Field label={t.certColor}>
                <div className="swatches">
                  {CERT_COLORS.map((c) => (
                    <button
                      key={c}
                      className="swatch"
                      style={{ background: c }}
                      aria-label={c}
                      aria-pressed={accent === c}
                      onClick={() => setAccent(c)}
                    />
                  ))}
                  <ColorField value={accent} onChange={setAccent} />
                </div>
              </Field>
            )}
            <Field label={t.certLanguage}>
              <Segmented
                label={t.certLanguage}
                value={certLang}
                onChange={setCertLang}
                options={[
                  { value: "ar", label: "العربية" },
                  { value: "en", label: "English" },
                ]}
              />
            </Field>
          </section>

          <section className="panel control-block">
            <StepTitle n={2}>{t.content}</StepTitle>
            <Field label={t.certType} htmlFor="ctype">
              <select id="ctype" className="select" value={type} onChange={(e) => setType(e.target.value)}>
                {CERT_TYPES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c[lang]}
                  </option>
                ))}
              </select>
              {type === CUSTOM && (
                <input
                  className="input"
                  style={{ marginTop: 8 }}
                  value={customTitle}
                  maxLength={35}
                  placeholder={t.certCustomTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              )}
            </Field>

            {certLang === "ar" && (
              <Field label={t.recipientType}>
                <Segmented
                  label={t.recipientType}
                  value={recipient}
                  onChange={setRecipient}
                  options={RECIPIENTS.map((r) => ({ value: r.id, label: r.label[lang] }))}
                />
              </Field>
            )}

            <Field label={t.studentName} htmlFor="sname">
              <input
                id="sname"
                className="input"
                value={name}
                maxLength={70}
                placeholder={t.studentPlaceholder}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label={t.reason} htmlFor="reason">
              <select
                id="reason"
                className="select"
                value={reasonChoice}
                onChange={(e) => setReasonChoice(e.target.value === CUSTOM ? CUSTOM : Number(e.target.value))}
              >
                {REASONS.map((_, i) => (
                  <option key={i} value={i}>
                    {reasonText(i)}
                  </option>
                ))}
                <option value={CUSTOM}>{t.customPhrase}</option>
              </select>
              {reasonChoice === CUSTOM && (
                <div style={{ marginTop: 8 }}>
                  <LimitedTextarea
                    id="customReason"
                    value={customReason}
                    max={REASON_MAX}
                    placeholder={t.customPhrasePlaceholder}
                    onChange={setCustomReason}
                  />
                </div>
              )}
            </Field>

            <Field label={t.dateLabel}>
              <Segmented
                label={t.dateLabel}
                value={calendar}
                onChange={setCalendar}
                options={[
                  { value: "hijri", label: t.hijri },
                  { value: "gregorian", label: t.gregorian },
                  { value: "none", label: t.noDate },
                ]}
              />
            </Field>
          </section>

          <section className="panel control-block">
            <StepTitle n={3}>{t.signatureSection}</StepTitle>
            <Field label={t.headerLines} htmlFor="header">
              <textarea
                id="header"
                className="textarea"
                rows={3}
                value={header}
                placeholder={t.headerPlaceholder}
                onChange={(e) => setHeaderLines(e.target.value)}
              />
            </Field>

            <Field label={t.schoolLogo}>
              <LogoList
                logos={logos}
                onChange={setLogos}
                describe={(i) => (i === 0 ? t.logoBesideHeader : t.logoOpposite)}
                hint={t.certLogosHint}
              />
            </Field>

            <div className="row-2">
              <Field label={t.signerRole} htmlFor="role">
                <input
                  id="role"
                  className="input"
                  value={signerRole}
                  maxLength={40}
                  placeholder={t.signerRolePlaceholder}
                  onChange={(e) => setSignerRole(e.target.value)}
                />
              </Field>
              <Field label={t.signerName} htmlFor="signer">
                <input
                  id="signer"
                  className="input"
                  value={signerName}
                  maxLength={50}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </Field>
            </div>

            <Field label={t.signature}>
              <SignaturePad onChange={setSignature} placeholder={t.drawSignature} clearLabel={t.clear} />
              <div style={{ marginTop: 8 }}>
                <FileButton label={t.uploadSignature} accept="image/png,image/jpeg,image/webp" onFile={onImage(setSignature)} />
              </div>
            </Field>
          </section>

          <section className="panel control-block actions">
            <button className="btn btn-primary" onClick={onPdf} disabled={busy}>
              {t.downloadPdf}
            </button>
            <button className="btn btn-secondary" onClick={onPng} disabled={busy}>
              {t.downloadPng}
            </button>
            <button className="btn btn-secondary" onClick={onShare} disabled={busy}>
              {t.share}
            </button>
            <button className="btn btn-secondary" style={{ gridColumn: "1 / -1" }} onClick={() => setBatchOpen(true)}>
              {t.certBatch}
            </button>
          </section>
        </div>
      </div>

      {alert && <AlertModal title={alert.title} text={alert.text} buttonLabel={t.ok} onClose={() => setAlert(null)} />}

      {batchOpen && (
        <BatchDialog
          title={t.certBatch}
          intro={t.certBatchIntro}
          onClose={() => setBatchOpen(false)}
          outputName="certificates.pdf"
          build={async (names, onProgress) => {
            const pages = [];
            for (let i = 0; i < names.length; i++) {
              onProgress(i + 1);
              pages.push(await pdfPage(await renderTo({ name: names[i] })));
            }
            return createImagePdf(pages);
          }}
        />
      )}
    </main>
  );
}
