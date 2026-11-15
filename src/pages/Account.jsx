import { useEffect, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { api, formatSar, sitePage } from "../lib/api";
import { formatDate } from "../lib/text";
import { ensureFonts } from "../engine/fonts";
import { renderCertificate, CERT_SIZE } from "../engine/certRenderer";
import { hydrateDesign } from "../engine/certDesign";
import { blobToBytes, canvasToBlob, downloadBlob, safeFilename } from "../lib/files";
import { createImagePdf } from "../lib/pdf";
import PackageCards from "../components/PackageCards";
import { Field } from "../components/Controls";

const TABS = ["overview", "certificates", "orders", "settings"];

/** Draws the certificates of an issue again from the saved design, as one PDF. */
export async function downloadBatchPdf(batchId, onlySerial, onProgress) {
  const data = await api("GET", `/api/certificates/batch/${batchId}`);
  await ensureFonts();
  const base = await hydrateDesign(data.design);
  const list = onlySerial ? data.certificates.filter((c) => c.serial === onlySerial) : data.certificates;
  const pages = [];
  for (let i = 0; i < list.length; i++) {
    onProgress?.(i + 1, list.length);
    const c = list[i];
    const canvas = document.createElement("canvas");
    renderCertificate(canvas, { ...base, name: c.name, verify: { serial: c.serial, url: sitePage(`/v/${c.serial}`) } });
    pages.push({
      jpeg: await blobToBytes(await canvasToBlob(canvas, "image/jpeg", 0.92)),
      width: CERT_SIZE.w,
      height: CERT_SIZE.h,
    });
  }
  const name = onlySerial ? safeFilename(list[0]?.name, "certificate") : safeFilename(data.batch.title, "certificates");
  downloadBlob(createImagePdf(pages), `${name}.pdf`);
}

export default function Account({ query }) {
  const { t, lang, user, setUser, refreshUser, openAuth, signOut, toast } = useApp();
  const [tab, setTab] = useState("overview");
  const [batches, setBatches] = useState(null);
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null); // batch id expanded
  const [openList, setOpenList] = useState(null);
  const [working, setWorking] = useState(null);

  useEffect(() => {
    if (query?.payment) refreshUser();
  }, [query?.payment, refreshUser]);

  useEffect(() => {
    if (!user) return;
    api("GET", "/api/certificates").then((d) => setBatches(d.batches)).catch(() => setBatches([]));
    api("GET", "/api/orders").then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, [user?.id, user?.credits]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user === undefined) return <main className="container section" />;
  if (!user) {
    return (
      <main className="container section">
        <div className="panel empty-state">
          <h1>{t.accountTitle}</h1>
          <p>{t.accountSignedOut}</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => openAuth("login")}>
              {t.authLogin}
            </button>
            <button className="btn btn-secondary" onClick={() => openAuth("signup")}>
              {t.authSignup}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const toggle = async (id) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    setOpenList(null);
    const d = await api("GET", `/api/certificates/batch/${id}`);
    setOpenList(d.certificates);
  };

  const download = async (batchId, serial) => {
    setWorking(serial || batchId);
    try {
      await downloadBatchPdf(batchId, serial);
      toast(t.saved);
    } catch {
      toast(t.fileError);
    } finally {
      setWorking(null);
    }
  };

  const payment = query?.payment;

  return (
    <main className="container section account-page">
      <div className="editor-head">
        <div>
          <h1>{t.accountTitle}</h1>
          <p className="hint" style={{ fontSize: "1rem" }}>
            {user.name || user.email}
            {user.org ? ` · ${user.org}` : ""}
          </p>
        </div>
        <div className="row">
          {user.isAdmin && (
            <button className="btn btn-secondary btn-small" onClick={() => navigate("/admin")}>
              {t.adminTitle}
            </button>
          )}
          <button className="btn btn-ghost btn-small" onClick={signOut}>
            {t.signOut}
          </button>
        </div>
      </div>

      {payment && (
        <div className={`notice ${payment === "paid" ? "notice-ok" : "notice-warn"}`} role="status">
          {payment === "paid" ? t.paymentPaid : payment === "pending" ? t.paymentPending : t.paymentFailed}
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((id) => (
          <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {t.accountTabs[id]}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="stat-row">
            <div className="panel stat">
              <span>{t.yourBalance}</span>
              <strong>{user.credits}</strong>
              <small>{user.credits === 1 ? t.certOne : t.certMany}</small>
            </div>
            <div className="panel stat">
              <span>{t.issuedCount}</span>
              <strong>{batches ? batches.reduce((a, b) => a + b.count, 0) : "…"}</strong>
              <small>{t.certMany}</small>
            </div>
            <div className="panel stat stat-action">
              <span>{t.issueMore}</span>
              <button className="btn btn-primary" onClick={() => navigate("/certificates")}>
                {t.certIssue}
              </button>
            </div>
          </div>
          <h2 className="sub-title">{t.buyCredits}</h2>
          <PackageCards />
        </>
      )}

      {tab === "certificates" && (
        <div className="panel list-panel">
          {!batches && <p className="hint">…</p>}
          {batches?.length === 0 && (
            <div className="empty-state">
              <p>{t.noCertificates}</p>
              <button className="btn btn-primary" onClick={() => navigate("/certificates")}>
                {t.certIssue}
              </button>
            </div>
          )}
          {batches?.map((b) => (
            <div key={b.id} className="batch-row">
              <div className="batch-head">
                <button className="batch-toggle" onClick={() => toggle(b.id)} aria-expanded={open === b.id}>
                  <strong>{b.title || t.certTitle}</strong>
                  <span>
                    {b.count} {b.count === 1 ? t.certOne : t.certMany} · {formatDate(new Date(b.created_at), lang, "gregorian")}
                  </span>
                </button>
                <button className="btn btn-small btn-secondary" onClick={() => download(b.id)} disabled={working !== null}>
                  {working === b.id ? t.preparing : t.downloadPdf}
                </button>
              </div>
              {open === b.id && (
                <ul className="cert-list">
                  {!openList && <li className="hint">…</li>}
                  {openList?.map((c) => (
                    <li key={c.serial}>
                      <span>{c.name}</span>
                      <bdi className="serial">{c.serial}</bdi>
                      <a href={`#/v/${c.serial}`} className="link">
                        {t.certVerifyPage}
                      </a>
                      <button className="btn btn-small btn-ghost" onClick={() => download(b.id, c.serial)} disabled={working !== null}>
                        {working === c.serial ? t.preparing : "PDF"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="panel list-panel">
          {orders?.length === 0 && <p className="hint">{t.noOrders}</p>}
          {orders && orders.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t.orderDate}</th>
                    <th>{t.orderPackage}</th>
                    <th>{t.orderCredits}</th>
                    <th>{t.orderAmount}</th>
                    <th>{t.orderStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{formatDate(new Date(o.created_at), lang, "gregorian")}</td>
                      <td>{o.package_name}</td>
                      <td>{o.credits}</td>
                      <td>{formatSar(o.amount, lang)}</td>
                      <td>
                        <span className={`badge badge-${o.status}`}>{t.orderStatuses[o.status] || o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "settings" && <Settings t={t} user={user} setUser={setUser} toast={toast} />}
    </main>
  );
}

function Settings({ t, user, setUser, toast }) {
  const [name, setName] = useState(user.name);
  const [org, setOrg] = useState(user.org);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    const d = await api("PATCH", "/api/me", { name, org });
    setUser(d.user);
    toast(t.savedChanges);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api("POST", "/api/me/password", { current, next });
      setCurrent("");
      setNext("");
      toast(t.savedChanges);
    } catch (err) {
      setMsg(t.authErrors[err.code] || t.authErrors.server_error);
    }
  };

  return (
    <div className="settings-grid">
      <form className="panel control-block" onSubmit={saveProfile}>
        <h3>{t.profile}</h3>
        <Field label={t.authEmail}>
          <input className="input" value={user.email} dir="ltr" disabled />
        </Field>
        <Field label={t.authName} htmlFor="p-name">
          <input id="p-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t.authOrg} htmlFor="p-org" hint={t.orgHint}>
          <input id="p-org" className="input" value={org} maxLength={120} onChange={(e) => setOrg(e.target.value)} />
        </Field>
        <button className="btn btn-primary" type="submit">
          {t.save}
        </button>
      </form>
      <form className="panel control-block" onSubmit={savePassword}>
        <h3>{t.changePassword}</h3>
        <Field label={t.currentPassword} htmlFor="p-cur">
          <input id="p-cur" className="input" type="password" dir="ltr" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label={t.newPassword} htmlFor="p-new" hint={t.authPasswordHint}>
          <input id="p-new" className="input" type="password" dir="ltr" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        {msg && <p className="form-error">{msg}</p>}
        <button className="btn btn-secondary" type="submit">
          {t.changePassword}
        </button>
      </form>
    </div>
  );
}
