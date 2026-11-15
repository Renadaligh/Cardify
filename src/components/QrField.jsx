import { useState } from "react";
import { useApp } from "../context";
import { api } from "../lib/api";
import { QR_TYPES, defaultCaption } from "../lib/qrContent";
import { Field, FileButton } from "./Controls";

/**
 * Lets the user put a QR code on the card: a song (link or uploaded audio), a location,
 * a photo (uploaded), any link, WhatsApp, or a short message.
 * Uploads need an account and go to the server (Cloudflare R2).
 */
export default function QrField({ value, onChange, cardLang, types }) {
  const { t, lang, user, openAuth, toast } = useApp();
  const [uploading, setUploading] = useState(false);
  const q = value;
  const set = (patch) => onChange({ ...q, ...patch });
  const list = types ? QR_TYPES.filter((x) => types.includes(x.id)) : QR_TYPES;

  const upload = async (file, kind) => {
    let u = user;
    if (!u) u = await openAuth("signup", t.qrLoginReason);
    if (!u) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const d = await api("POST", "/api/media", fd);
      set({ mediaPage: d.page, mediaName: file.name });
      toast(t.qrUploaded);
    } catch (e) {
      toast(t.qrUploadErrors[e.code] || t.qrUploadErrors.default);
    } finally {
      setUploading(false);
    }
    return kind;
  };

  return (
    <div className="qr-field">
      <div className="chips chips-start" role="group" aria-label={t.qrType}>
        {list.map((x) => (
          <button
            key={x.id}
            type="button"
            className="chip"
            aria-pressed={q.type === x.id}
            onClick={() => set({ type: x.id, caption: null })}
          >
            {x[lang]}
          </button>
        ))}
      </div>

      {q.type === "song" && (
        <>
          <Field label={t.qrSongLink} htmlFor="qr-url" hint={t.qrSongHint}>
            <input
              id="qr-url"
              className="input"
              dir="ltr"
              inputMode="url"
              value={q.url}
              placeholder="https://open.spotify.com/…"
              disabled={!!q.mediaPage}
              onChange={(e) => set({ url: e.target.value })}
            />
          </Field>
          <MediaUpload
            t={t}
            q={q}
            accept="audio/*"
            label={t.qrUploadAudio}
            uploading={uploading}
            onFile={(f) => upload(f, "audio")}
            onClear={() => set({ mediaPage: "", mediaName: "" })}
          />
        </>
      )}

      {(q.type === "map" || q.type === "link") && (
        <Field label={q.type === "map" ? t.qrMapLink : t.qrLink} htmlFor="qr-url" hint={q.type === "map" ? t.invMapHint : undefined}>
          <input
            id="qr-url"
            className="input"
            dir="ltr"
            inputMode="url"
            value={q.url}
            placeholder={q.type === "map" ? "https://maps.app.goo.gl/…" : "https://…"}
            onChange={(e) => set({ url: e.target.value })}
          />
        </Field>
      )}

      {q.type === "image" && (
        <MediaUpload
          t={t}
          q={q}
          accept="image/png,image/jpeg,image/webp,image/gif"
          label={t.qrUploadImage}
          uploading={uploading}
          onFile={(f) => upload(f, "image")}
          onClear={() => set({ mediaPage: "", mediaName: "" })}
        />
      )}

      {q.type === "whatsapp" && (
        <>
          <Field label={t.qrPhone} htmlFor="qr-phone">
            <input
              id="qr-phone"
              className="input"
              dir="ltr"
              inputMode="tel"
              value={q.phone}
              placeholder="05xxxxxxxx"
              onChange={(e) => set({ phone: e.target.value })}
            />
          </Field>
          <Field label={t.qrWaMessage} htmlFor="qr-wa">
            <input id="qr-wa" className="input" value={q.text} maxLength={120} onChange={(e) => set({ text: e.target.value })} />
          </Field>
        </>
      )}

      {q.type === "text" && (
        <Field label={t.qrMessage} htmlFor="qr-text" hint={t.qrMessageHint}>
          <textarea id="qr-text" className="textarea" rows={3} maxLength={300} value={q.text} onChange={(e) => set({ text: e.target.value })} />
        </Field>
      )}

      {q.type !== "none" && (
        <div className="row-2">
          <Field label={t.qrCaption} htmlFor="qr-cap">
            <input
              id="qr-cap"
              className="input"
              maxLength={40}
              value={q.caption ?? defaultCaption(q.type, cardLang)}
              onChange={(e) => set({ caption: e.target.value })}
            />
          </Field>
          <Field label={`${t.qrSize} (${Math.round((q.scale || 1) * 100)}%)`} htmlFor="qr-scale">
            <input
              id="qr-scale"
              type="range"
              min="0.7"
              max="1.6"
              step="0.05"
              value={q.scale || 1}
              onChange={(e) => set({ scale: Number(e.target.value) })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function MediaUpload({ t, q, accept, label, uploading, onFile, onClear }) {
  if (q.mediaPage) {
    return (
      <div className="media-chip">
        <span>✓ {q.mediaName || t.qrUploaded}</span>
        <button type="button" className="btn btn-small btn-ghost" onClick={onClear}>
          {t.clear}
        </button>
      </div>
    );
  }
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <FileButton label={uploading ? t.qrUploading : label} accept={accept} onFile={onFile} />
      <span className="hint" style={{ margin: 0 }}>
        {t.qrUploadHint}
      </span>
    </div>
  );
}
