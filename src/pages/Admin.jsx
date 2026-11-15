import { useEffect, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { api, formatSar } from "../lib/api";
import { formatDate } from "../lib/text";
import { Field } from "../components/Controls";

const TABS = ["overview", "users", "orders", "packages", "settings"];

export default function Admin() {
  const { t, user } = useApp();
  const [tab, setTab] = useState("overview");

  if (user === undefined) return <main className="container section" />;
  if (!user?.isAdmin) {
    return (
      <main className="container section">
        <div className="panel empty-state">
          <h1>{t.adminTitle}</h1>
          <p>{t.adminOnly}</p>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            {t.home}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container section admin-page">
      <div className="editor-head">
        <div>
          <h1>{t.adminTitle}</h1>
          <p className="hint" style={{ fontSize: "1rem" }}>
            {t.adminSubtitle}
          </p>
        </div>
        <button className="btn btn-ghost btn-small" onClick={() => navigate("/account")}>
          {t.accountTitle}
        </button>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map((id) => (
          <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {t.adminTabs[id]}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "users" && <Users />}
      {tab === "orders" && <Orders />}
      {tab === "packages" && <Packages />}
      {tab === "settings" && <SettingsTab />}
    </main>
  );
}

function Overview() {
  const { t, lang } = useApp();
  const [s, setS] = useState(null);
  useEffect(() => {
    api("GET", "/api/admin/stats").then(setS).catch(() => setS({ error: true }));
  }, []);
  if (!s) return <p className="hint">…</p>;
  if (s.error) return <p className="form-error">{t.paymentError}</p>;

  // last 30 days of revenue as simple bars
  const today = Math.floor(Date.now() / 86400000);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = today - 29 + i;
    const row = s.daily.find((x) => x.day === d);
    return { d, total: row ? row.total : 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  const tiles = [
    [t.statRevenue30, formatSar(s.revenue30, lang), `${t.statTotal}: ${formatSar(s.revenue, lang)}`],
    [t.statOrders30, s.orders30, `${t.statTotal}: ${s.orders}`],
    [t.statCerts30, s.certificates30, `${t.statTotal}: ${s.certificates} · ${t.statCards30}: ${s.cards30 ?? 0}`],
    [t.statUsers, s.users, `${t.statUnused}: ${s.unusedCredits}`],
  ];

  return (
    <>
      {(!s.payments || !s.media) && (
        <div className="notice notice-warn">
          {!s.payments && <p>{t.setupPayments}</p>}
          {!s.media && <p>{t.setupMedia}</p>}
        </div>
      )}
      <div className="stat-row stat-row-4">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="panel stat">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
          </div>
        ))}
      </div>
      <div className="panel chart-panel">
        <h3>{t.statChart}</h3>
        <div className="bars" role="img" aria-label={t.statChart}>
          {days.map((d) => (
            <div key={d.d} className="bar-col" title={`${formatDate(new Date(d.d * 86400000), lang, "gregorian")}: ${formatSar(d.total, lang)}`}>
              <div className="bar" style={{ height: `${(d.total / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Users() {
  const { t, lang, toast } = useApp();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState(null);
  const [edit, setEdit] = useState(null); // { id, delta, note }

  const load = (query = q) =>
    api("GET", `/api/admin/users?q=${encodeURIComponent(query)}`)
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  useEffect(() => {
    load("");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCredits = async () => {
    const delta = parseInt(edit.delta, 10);
    if (!delta) return;
    const d = await api("POST", `/api/admin/users/${edit.id}/credits`, { delta, note: edit.note });
    setUsers((list) => list.map((u) => (u.id === edit.id ? { ...u, credits: d.credits } : u)));
    setEdit(null);
    toast(t.savedChanges);
  };

  return (
    <div className="panel list-panel">
      <form
        className="row search-row"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input className="input" value={q} placeholder={t.searchUsers} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-secondary" type="submit">
          {t.search}
        </button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t.authEmail}</th>
              <th>{t.authOrg}</th>
              <th>{t.yourBalance}</th>
              <th>{t.issuedCount}</th>
              <th>{t.statSpent}</th>
              <th>{t.joined}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id}>
                <td dir="ltr">{u.email}</td>
                <td>{u.org || u.name}</td>
                <td>
                  <strong>{u.credits}</strong>
                </td>
                <td>{u.issued}</td>
                <td>{formatSar(u.spent, lang)}</td>
                <td>{formatDate(new Date(u.created_at), lang, "gregorian")}</td>
                <td>
                  {edit?.id === u.id ? (
                    <div className="credit-edit">
                      <input
                        className="input"
                        type="number"
                        value={edit.delta}
                        placeholder="+5 / -2"
                        aria-label={t.creditChange}
                        onChange={(e) => setEdit({ ...edit, delta: e.target.value })}
                      />
                      <input
                        className="input"
                        value={edit.note}
                        placeholder={t.creditNote}
                        onChange={(e) => setEdit({ ...edit, note: e.target.value })}
                      />
                      <button className="btn btn-small btn-primary" onClick={saveCredits}>
                        {t.save}
                      </button>
                      <button className="btn btn-small btn-ghost" onClick={() => setEdit(null)}>
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-small btn-secondary" onClick={() => setEdit({ id: u.id, delta: "", note: "" })}>
                      {t.creditChange}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users?.length === 0 && <p className="hint">{t.noResults}</p>}
    </div>
  );
}

function Orders() {
  const { t, lang } = useApp();
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    api("GET", "/api/admin/orders").then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, []);
  return (
    <div className="panel list-panel">
      {orders?.length === 0 && <p className="hint">{t.noOrders}</p>}
      {orders?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t.orderDate}</th>
                <th>{t.authEmail}</th>
                <th>{t.orderPackage}</th>
                <th>{t.orderAmount}</th>
                <th>{t.orderStatus}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{formatDate(new Date(o.created_at), lang, "gregorian")}</td>
                  <td dir="ltr">{o.email}</td>
                  <td>
                    {o.package_name} ({o.credits})
                  </td>
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
  );
}

const emptyPackage = { name: { ar: "", en: "" }, badge: { ar: "", en: "" }, credits: 10, price: 1500, active: true, sort: 10 };

function Packages() {
  const { t, lang, toast } = useApp();
  const [list, setList] = useState(null);
  const [edit, setEdit] = useState(null); // package being edited (id null = new)
  const [error, setError] = useState("");

  useEffect(() => {
    api("GET", "/api/admin/packages").then((d) => setList(d.packages));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = { ...edit, price: Math.round(Number(edit.priceSar) * 100) };
      const d = edit.id
        ? await api("PATCH", `/api/admin/packages/${edit.id}`, body)
        : await api("POST", "/api/admin/packages", body);
      setList(d.packages);
      setEdit(null);
      toast(t.savedChanges);
    } catch (err) {
      setError(t.packageErrors[err.code] || t.paymentError);
    }
  };

  const toggleActive = async (p) => {
    const d = await api("PATCH", `/api/admin/packages/${p.id}`, { ...p, active: !p.active });
    setList(d.packages);
  };

  return (
    <div className="panel list-panel">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t.packageName}</th>
              <th>{t.orderCredits}</th>
              <th>{t.packagePrice}</th>
              <th>{t.perCertificate}</th>
              <th>{t.packageActive}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list?.map((p) => (
              <tr key={p.id} className={p.active ? "" : "row-muted"}>
                <td>
                  {p.name[lang]} {p.badge[lang] && <span className="badge">{p.badge[lang]}</span>}
                </td>
                <td>{p.credits}</td>
                <td>{formatSar(p.price, lang)}</td>
                <td>{(p.price / p.credits / 100).toFixed(2)}</td>
                <td>
                  <label className="check">
                    <input type="checkbox" checked={p.active} onChange={() => toggleActive(p)} />
                  </label>
                </td>
                <td>
                  <button className="btn btn-small btn-secondary" onClick={() => setEdit({ ...p, priceSar: p.price / 100 })}>
                    {t.edit}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!edit && (
        <button className="btn btn-secondary" onClick={() => setEdit({ ...emptyPackage, priceSar: 15 })}>
          + {t.addPackage}
        </button>
      )}
      {edit && (
        <form className="package-form" onSubmit={save}>
          <div className="row-2">
            <Field label={`${t.packageName} (عربي)`}>
              <input className="input" required value={edit.name.ar} onChange={(e) => setEdit({ ...edit, name: { ...edit.name, ar: e.target.value } })} />
            </Field>
            <Field label={`${t.packageName} (English)`}>
              <input className="input" dir="ltr" value={edit.name.en} onChange={(e) => setEdit({ ...edit, name: { ...edit.name, en: e.target.value } })} />
            </Field>
            <Field label={t.orderCredits}>
              <input className="input" type="number" min="1" required value={edit.credits} onChange={(e) => setEdit({ ...edit, credits: e.target.value })} />
            </Field>
            <Field label={`${t.packagePrice} (ر.س)`} hint={t.packagePriceHint}>
              <input className="input" type="number" min="1" step="0.5" required value={edit.priceSar} onChange={(e) => setEdit({ ...edit, priceSar: e.target.value })} />
            </Field>
            <Field label={`${t.packageBadge} (عربي)`}>
              <input className="input" value={edit.badge.ar} placeholder="الأكثر طلبًا" onChange={(e) => setEdit({ ...edit, badge: { ...edit.badge, ar: e.target.value } })} />
            </Field>
            <Field label={t.packageSort}>
              <input className="input" type="number" value={edit.sort} onChange={(e) => setEdit({ ...edit, sort: e.target.value })} />
            </Field>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="row">
            <button className="btn btn-primary" type="submit">
              {t.save}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setEdit(null)}>
              {t.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SettingsTab() {
  const { t, toast } = useApp();
  const [bonus, setBonus] = useState("");
  useEffect(() => {
    api("GET", "/api/admin/settings").then((d) => setBonus(String(d.signup_bonus)));
  }, []);
  const save = async (e) => {
    e.preventDefault();
    const d = await api("PATCH", "/api/admin/settings", { signup_bonus: Number(bonus) });
    setBonus(String(d.signup_bonus));
    toast(t.savedChanges);
  };
  return (
    <form className="panel control-block settings-narrow" onSubmit={save}>
      <Field label={t.signupBonus} hint={t.signupBonusHint} htmlFor="bonus">
        <input id="bonus" className="input" type="number" min="0" max="100" value={bonus} onChange={(e) => setBonus(e.target.value)} />
      </Field>
      <button className="btn btn-primary" type="submit">
        {t.save}
      </button>
    </form>
  );
}
