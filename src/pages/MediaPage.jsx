import { useEffect, useState } from "react";
import { useApp } from "../context";
import { api } from "../lib/api";

/** The page a card's QR code opens when it holds an uploaded image or audio. */
export default function MediaPage({ id }) {
  const { t } = useApp();
  const [media, setMedia] = useState(null);

  useEffect(() => {
    api("GET", `/api/media/${encodeURIComponent(id)}`)
      .then(setMedia)
      .catch(() => setMedia({ missing: true }));
  }, [id]);

  return (
    <main className="container section media-page">
      <div className="panel media-card">
        {!media && <p>{t.verifyChecking}</p>}
        {media?.missing && <p>{t.mediaMissing}</p>}
        {media?.url && media.type.startsWith("image/") && <img src={media.url} alt="" />}
        {media?.url && media.type.startsWith("audio/") && (
          <>
            <div className="media-disc" aria-hidden="true">
              ♪
            </div>
            <p>{t.mediaListen}</p>
            <audio src={media.url} controls autoPlay preload="auto" />
          </>
        )}
        {media && !media.missing && !media.url && <p>{t.mediaMissing}</p>}
        <a className="btn btn-secondary" href="#/">
          {t.mediaMakeYours}
        </a>
      </div>
    </main>
  );
}
