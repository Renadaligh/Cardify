import { useEffect, useRef, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { ensureFonts } from "../engine/fonts";
import { renderCertificate, CERT_SIZE } from "../engine/certRenderer";
import { CERT_AUDIENCES, CERT_COLORS, CERT_STYLES, EN_INTRO } from "../data/certificates";
import { CERT_IMAGE_TEMPLATES } from "../data/certificateTemplates";
import { canvasToBlob, blobToBytes, downloadBlob, loadImage, readImageFile, safeFilename, shareBlob } from "../lib/files";
import { createImagePdf } from "../lib/pdf";
import { formatDate } from "../lib/text";
import CardStage from "../components/CardStage";
import BatchDialog from "../components/BatchDialog";
import SignaturePad from "../components/SignaturePad";
import LogoList from "../components/LogoList";
import LimitedTextarea from "../components/CharCounter";
import Modal, { AlertModal } from "../components/Modal";
import PackageCards from "../components/PackageCards";
import { api, sitePage } from "../lib/api";
import { serializeDesign } from "../engine/certDesign";
import EditorSteps, { Step, MobileActionBar } from "../components/EditorSteps";
import { ColorField, Field, FileButton, Segmented } from "../components/Controls";

const CUSTOM = "custom";
const REASON_MAX = 130;

export default function Certificates({ audience = "education" }) {
  const { t, lang, toast, user, setUser, openAuth } = useApp();
  const [fontsReady, setFontsReady] = useState(false);

  // Designs: your image templates first, then the built-in styles.
  const designs = [
    ...CERT_IMAGE_TEMPLATES.map((d) => ({ ...d, kind: "image" })),
    // the playful kids' design is for schools only
    ...CERT_STYLES.filter((d) => audience !== "business" || d.id !== "kids").map((d) => ({ ...d, kind: "style" })),
  ];
  const [designId, setDesignId] = useState(audience === "business" ? "modern" : designs[0].id);
  const design = designs.find((d) => d.id === designId) || designs[0];
  const [images, setImages] = useState({});
  const [thumbs, setThumbs] = useState({});
  const [accent, setAccent] = useState(CERT_COLORS[0]);
  const [certLang, setCertLang] = useState(lang);
  // Schools (#/certificates) or companies (#/business/certificates): the titles, recipients and reasons on offer.
  const A = CERT_AUDIENCES[audience];
  const CERT_TYPES = A.types;
  const RECIPIENTS = A.recipients;
  const REASONS = A.reasons;
  const [type, setType] = useState("appreciation");
  const [customTitle, setCustomTitle] = useState("");
  const [recipient, setRecipient] = useState(A.defaultRecipient);
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
  // After issuing, the certificate is locked: { serial, batchId, name }.
  const [issued, setIssued] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [needCredits, setNeedCredits] = useState(null); // number of credits needed
  const pricingRef = useRef(null);

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
  const header =
    headerLines ??
    (audience === "business" ? user?.org || "" : certLang === "ar" ? "المملكة العربية السعودية\nوزارة التعليم" : "");

  const recipientInfo = RECIPIENTS.find((r) => r.id === recipient) || RECIPIENTS[0];
  const typeInfo = CERT_TYPES.find((c) => c.id === type) || CERT_TYPES[0];
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
    // Preview carries a watermark; the issued certificate has the verification code instead.
    watermark: issued ? null : t.certWatermark,
    verify: issued ? { serial: issued.serial, url: sitePage(`/v/${issued.serial}`) } : null,
    ...overrides,
  });

  const draw = (canvas) => {
    renderCertificate(canvas, options());
    return [];
  };

  const validate = () => {
    if (!issued && !name.trim()) {
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

  const fileBase = () => `certificate-${safeFilename(issued?.name || name)}`;

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

  // ---- issuing (uses credits) ----

  const ensureUser = async () => user || (await openAuth("signup", t.certLoginReason));

  const issueRequest = async (names) => {
    const opts = options({ watermark: null, verify: null });
    const data = await api("POST", "/api/certificates/issue", {
      recipients: names,
      title,
      // shown on the verification page: the account's school/company, else the last header line
      issuer: user?.org || header.split(/\r?\n/).filter(Boolean).pop() || "",
      design: serializeDesign(opts, design.id),
    });
    setUser((u) => (u ? { ...u, credits: data.credits } : u));
    return data;
  };

  const onIssueClick = async () => {
    if (!validate()) return;
    const u = await ensureUser();
    if (!u) return;
    if (u.credits < 1) return setNeedCredits(1);
    setConfirmOpen(true);
  };

  const confirmIssue = async () => {
    setBusy(true);
    try {
      const data = await issueRequest([name.trim()]);
      setIssued({ serial: data.certificates[0].serial, batchId: data.batchId, name: name.trim() });
      setConfirmOpen(false);
      toast(t.certIssuedToast);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setConfirmOpen(false);
      if (e.code === "not_enough_credits") setNeedCredits(1);
      else toast(t.paymentError);
    } finally {
      setBusy(false);
    }
  };

  const onBatchClick = async () => {
    const u = await ensureUser();
    if (u) setBatchOpen(true);
  };

  const startNew = () => {
    setIssued(null);
    setName("");
  };

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
          <button className="back-link" onClick={() => navigate(audience === "business" ? "/business" : "/")}>
            {lang === "ar" ? "→" : "←"} {audience === "business" ? t.businessBack : t.home}
          </button>
          <h1>{audience === "business" ? t.certTitleBusiness : t.certTitle}</h1>
          <p className="hint" style={{ fontSize: "1rem" }}>
            {audience === "business" ? t.certSubtitleBusiness : t.certSubtitle}
          </p>
        </div>
        <div className="credit-pill">
          {user ? (
            <>
              <span>
                {t.yourBalance}: <strong>{user.credits}</strong> {user.credits === 1 ? t.certOne : t.certMany}
              </span>
              <button className="btn btn-small btn-secondary" onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}>
                {t.buyCredits}
              </button>
            </>
          ) : (
            <>
              <span>{t.freeCertsOffer}</span>
              <button className="btn btn-small btn-primary" onClick={() => openAuth("signup")}>
                {t.authSignup}
              </button>
            </>
          )}
        </div>
      </div>

      {issued && (
        <div className="issued-banner" role="status">
          <div>
            <strong>{t.certIssuedTitle}</strong>
            <span>
              {t.certSerial}: <bdi>{issued.serial}</bdi>
            </span>
          </div>
          <a className="btn btn-small btn-secondary" href={`#/v/${issued.serial}`} target="_blank" rel="noreferrer">
            {t.certVerifyPage}
          </a>
        </div>
      )}

      <div className="editor">
        <div className="panel stage-wrap">
          <CardStage draw={draw} label={title} />
        </div>

        <div className="controls">
          <fieldset className="lock-fieldset" disabled={!!issued}>
          {issued && <p className="locked-note">{t.certLockedNote}</p>}
          <EditorSteps>
          <Step label={t.certDesign}>
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
          </Step>

          <Step label={t.content}>
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
          </Step>

          <Step label={t.signatureSection}>
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

            <Field label={audience === "business" ? t.companyLogo : t.schoolLogo}>
              <LogoList
                logos={logos}
                onChange={setLogos}
                describe={(i) => (i === 0 ? t.logoBesideHeader : t.logoOpposite)}
                hint={audience === "business" ? t.companyLogosHint : t.certLogosHint}
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
          </Step>
          </EditorSteps>

          </fieldset>

          <section className="panel control-block actions">
            {issued ? (
              <>
                <button className="btn btn-primary" onClick={onPdf} disabled={busy}>
                  {t.downloadPdf}
                </button>
                <button className="btn btn-secondary" onClick={onPng} disabled={busy}>
                  {t.downloadPng}
                </button>
                <button className="btn btn-secondary" onClick={onShare} disabled={busy}>
                  {t.share}
                </button>
                <button className="btn btn-secondary" style={{ gridColumn: "1 / -1" }} onClick={startNew}>
                  {t.certNew}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" style={{ gridColumn: "1 / -1" }} onClick={onIssueClick} disabled={busy}>
                  {t.certIssue}
                </button>
                <button className="btn btn-secondary" style={{ gridColumn: "1 / -1" }} onClick={onBatchClick}>
                  {t.certBatch}
                </button>
                <p className="hint" style={{ gridColumn: "1 / -1", margin: 0 }}>
                  {t.certPreviewNote}
                </p>
              </>
            )}
          </section>
        </div>
      </div>

      <section className="cert-pricing" ref={pricingRef}>
        <div className="section-head">
          <h2>{t.pricingTitle}</h2>
          <p>{t.pricingSubtitle}</p>
        </div>
        <ol className="how-steps">
          {t.howSteps.map((s, i) => (
            <li key={i}>
              <span className="how-num">{i + 1}</span>
              <strong>{s[0]}</strong>
              <span>{s[1]}</span>
            </li>
          ))}
        </ol>
        <PackageCards />
      </section>

      <MobileActionBar label={issued ? t.downloadPdf : t.certIssue} onClick={issued ? onPdf : onIssueClick} disabled={busy} />

      {alert && <AlertModal title={alert.title} text={alert.text} buttonLabel={t.ok} onClose={() => setAlert(null)} />}

      {confirmOpen && (
        <ConfirmIssue
          t={t}
          name={name.trim()}
          title={title}
          credits={user?.credits ?? 0}
          busy={busy}
          onConfirm={confirmIssue}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {needCredits !== null && (
        <Modal title={t.needCreditsTitle} onClose={() => setNeedCredits(null)}>
          <p>{t.needCreditsText(needCredits, user?.credits ?? 0)}</p>
          <PackageCards compact />
        </Modal>
      )}

      {batchOpen && (
        <BatchDialog
          title={t.certBatch}
          intro={t.certBatchIntroPaid}
          onClose={() => setBatchOpen(false)}
          outputName="certificates.pdf"
          actionLabel={(n) => (n ? t.certIssueN(n) : t.generate)}
          build={async (names, onProgress) => {
            if ((user?.credits ?? 0) < names.length) {
              const err = new Error("credits");
              err.userMessage = t.needCreditsBatch(names.length, user?.credits ?? 0);
              throw err;
            }
            let data;
            try {
              data = await issueRequest(names);
            } catch (e) {
              const err = new Error(e.code);
              err.userMessage = e.code === "not_enough_credits" ? t.needCreditsBatch(names.length, user?.credits ?? 0) : t.paymentError;
              throw err;
            }
            const pages = [];
            for (let i = 0; i < data.certificates.length; i++) {
              onProgress(i + 1);
              const c = data.certificates[i];
              pages.push(
                await pdfPage(
                  await renderTo({ name: c.name, watermark: null, verify: { serial: c.serial, url: sitePage(`/v/${c.serial}`) } })
                )
              );
            }
            toast(t.certBatchIssued(names.length));
            return createImagePdf(pages);
          }}
        >
          <p className="hint">{t.certBatchCost(user?.credits ?? 0)}</p>
        </BatchDialog>
      )}
    </main>
  );
}

function ConfirmIssue({ t, name, title, credits, busy, onConfirm, onClose }) {
  return (
    <Modal
      title={t.certConfirmTitle}
      onClose={busy ? undefined : onClose}
      center
      actions={
        <>
          <button className="btn btn-primary" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? t.issuing : t.certConfirmButton}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            {t.cancel}
          </button>
        </>
      }
    >
      <p>
        <strong>{name}</strong> · {title}
      </p>
      <p>{t.certConfirmText}</p>
      <p className="hint">{t.certConfirmCost(credits)}</p>
    </Modal>
  );
}
