import { useEffect, useState } from "react";
import { useApp } from "../context";
import { api } from "../lib/api";
import { formatDate } from "../lib/text";

/** Opened from the QR code on an issued certificate. */
export default function Verify({ serial }) {
  const { t, lang } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    api("GET", `/api/verify/${encodeURIComponent(serial)}`)
      .then(setData)
      .catch(() => setData({ valid: false, error: true }));
  }, [serial]);

  return (
    <main className="container section verify-page">
      <div className={`panel verify-card ${data ? (data.valid ? "is-valid" : "is-invalid") : ""}`}>
        {!data && <p>{t.verifyChecking}</p>}
        {data?.valid && (
          <>
            <div className="verify-icon" aria-hidden="true">
              ✓
            </div>
            <h1>{t.verifyValid}</h1>
            <dl className="verify-list">
              <dt>{t.verifyRecipient}</dt>
              <dd>{data.recipient}</dd>
              <dt>{t.verifyTitle}</dt>
              <dd>{data.title}</dd>
              {data.issuer && (
                <>
                  <dt>{t.verifyIssuer}</dt>
                  <dd>{data.issuer}</dd>
                </>
              )}
              <dt>{t.verifyDate}</dt>
              <dd>
                {formatDate(new Date(data.issuedAt), lang, "hijri")} · {formatDate(new Date(data.issuedAt), lang, "gregorian")}
              </dd>
              <dt>{t.certSerial}</dt>
              <dd>
                <bdi>{data.serial}</bdi>
              </dd>
            </dl>
            <p className="hint">{t.verifyNote}</p>
          </>
        )}
        {data && !data.valid && (
          <>
            <div className="verify-icon" aria-hidden="true">
              !
            </div>
            <h1>{data.error ? t.verifyError : t.verifyInvalid}</h1>
            <p>
              {t.certSerial}: <bdi>{serial}</bdi>
            </p>
            <p className="hint">{t.verifyInvalidNote}</p>
          </>
        )}
      </div>
    </main>
  );
}
