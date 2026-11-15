// A pretend backend that lives in the browser, used only when the real server
// (Cloudflare Functions) isn't there. It mirrors server/router.js closely enough to try
// every screen: accounts, credits, packages, payments (simulated), issuing and verifying.
// Data is kept in this browser only. Every demo account is also an admin.

const KEY = "cardify-demo-v2";

const fresh = () => ({
  users: [],
  session: null,
  packages: [
    { id: 1, name: { ar: "شهادة واحدة", en: "Single certificate" }, badge: { ar: "", en: "" }, credits: 1, price: 1000, active: true, sort: 1 },
    { id: 2, name: { ar: "باقة المعلم", en: "Teacher pack" }, badge: { ar: "الأكثر طلبًا", en: "Most popular" }, credits: 15, price: 9900, active: true, sort: 2 },
    { id: 3, name: { ar: "باقة الفصل", en: "Class pack" }, badge: { ar: "", en: "" }, credits: 40, price: 19900, active: true, sort: 3 },
    { id: 4, name: { ar: "المدارس والشركات", en: "Schools & companies" }, badge: { ar: "أوفر", en: "Best value" }, credits: 120, price: 44900, active: true, sort: 4 },
  ],
  orders: [],
  batches: [],
  certificates: [],
  media: [],
  settings: { signup_bonus: 2 },
  nextId: 1,
});

let state = null;
const mediaUrls = new Map(); // id → object URL (this tab only)

function load() {
  if (state) return state;
  try {
    state = JSON.parse(localStorage.getItem(KEY)) || fresh();
  } catch {
    state = fresh();
  }
  return state;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

class DemoError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code) => {
  throw new DemoError(status, code);
};

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const code = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => ALPHABET[b % 32]).join("");
const serial = () => {
  const c = code(8);
  return `CF-${c.slice(0, 4)}-${c.slice(4)}`;
};

const pub = (u) => ({ id: u.id, email: u.email, name: u.name, org: u.org, credits: u.credits, isAdmin: true });
const me = () => state.users.find((u) => u.id === state.session) || null;
const need = () => me() || fail(401, "login_required");

export async function demoRequest(method, fullPath, body) {
  load();
  await new Promise((r) => setTimeout(r, 120));
  const [path, qs] = fullPath.split("?");
  const query = new URLSearchParams(qs || "");
  const result = route(method, path, body || {}, query);
  save();
  return JSON.parse(JSON.stringify(result));
}

function route(method, path, body, query) {
  let m;
  const s = state;
  const key = `${method} ${path}`;

  if (key === "GET /api/health") return { ok: true, demo: true, payments: true, media: true };
  if (key === "POST /api/auth/signup") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail(400, "bad_email");
    if (String(body.password || "").length < 8) fail(400, "weak_password");
    if (s.users.some((u) => u.email === email)) fail(409, "email_taken");
    const u = { id: s.nextId++, email, password: body.password, name: body.name || "", org: body.org || "", credits: s.settings.signup_bonus, created_at: Date.now() };
    s.users.push(u);
    s.session = u.id;
    return { user: pub(u) };
  }
  if (key === "POST /api/auth/login") {
    const u = s.users.find((x) => x.email === String(body.email || "").trim().toLowerCase());
    if (!u || u.password !== body.password) fail(401, "wrong_login");
    s.session = u.id;
    return { user: pub(u) };
  }
  if (key === "POST /api/auth/logout") {
    s.session = null;
    return { ok: true };
  }
  if (key === "GET /api/me") return { user: me() ? pub(me()) : null };
  if (key === "PATCH /api/me") {
    const u = need();
    if (body.name !== undefined) u.name = body.name;
    if (body.org !== undefined) u.org = body.org;
    return { user: pub(u) };
  }
  if (key === "POST /api/me/password") {
    const u = need();
    if (u.password !== body.current) fail(401, "wrong_password");
    if (String(body.next || "").length < 8) fail(400, "weak_password");
    u.password = body.next;
    return { ok: true };
  }

  if (key === "GET /api/packages") return { packages: s.packages.filter((p) => p.active).sort((a, b) => a.sort - b.sort), payments: true };
  if (key === "POST /api/orders") {
    const u = need();
    const p = s.packages.find((x) => x.id === Number(body.packageId) && x.active) || fail(404, "no_package");
    const id = `ord_${code(10)}`;
    // Demo: the payment succeeds straight away.
    s.orders.unshift({ id, user_id: u.id, package_name: p.name.ar, credits: p.credits, amount: p.price, status: "paid", created_at: Date.now(), paid_at: Date.now() });
    u.credits += p.credits;
    return { orderId: id, url: `#/account?payment=paid` };
  }
  if (key === "GET /api/orders") return { orders: s.orders.filter((o) => o.user_id === need().id) };

  if (key === "POST /api/certificates/issue") {
    const u = need();
    const names = (body.recipients || []).map((n) => String(n).trim()).filter(Boolean);
    if (!names.length) fail(400, "no_names");
    if (u.credits < names.length) fail(402, "not_enough_credits");
    u.credits -= names.length;
    const id = `bat_${code(10)}`;
    const at = Date.now();
    const certificates = names.map((name) => ({ serial: serial(), name }));
    const issuer = body.issuer || u.org;
    s.batches.unshift({ id, user_id: u.id, title: body.title || "", issuer, design: body.design, count: names.length, created_at: at });
    certificates.forEach((c) => s.certificates.push({ ...c, batch_id: id, user_id: u.id, issued_at: at }));
    return { batchId: id, issuedAt: at, issuer, certificates, credits: u.credits };
  }
  if (key === "GET /api/certificates") {
    const u = need();
    return { batches: s.batches.filter((b) => b.user_id === u.id).map(({ design, ...b }) => b) };
  }
  if ((m = path.match(/^\/api\/certificates\/batch\/([\w-]+)$/)) && method === "GET") {
    const u = need();
    const b = s.batches.find((x) => x.id === m[1] && x.user_id === u.id) || fail(404, "not_found");
    return {
      batch: { id: b.id, title: b.title, issuer: b.issuer, count: b.count, createdAt: b.created_at },
      design: b.design,
      certificates: s.certificates.filter((c) => c.batch_id === b.id).map(({ serial, name }) => ({ serial, name })),
    };
  }
  if ((m = path.match(/^\/api\/verify\/([\w-]+)$/))) {
    const c = s.certificates.find((x) => x.serial === m[1].toUpperCase());
    if (!c) return { valid: false };
    const b = s.batches.find((x) => x.id === c.batch_id);
    return { valid: true, serial: c.serial, recipient: c.name, title: b.title, issuer: b.issuer, issuedAt: c.issued_at };
  }

  if (key === "POST /api/media") {
    const u = need();
    const file = body.get("file");
    if (!/^(image\/(png|jpeg|webp|gif)|audio\/)/.test(file?.type || "")) fail(415, "bad_type");
    if (file.size > (file.type.startsWith("audio") ? 10 : 5) * 1024 * 1024) fail(413, "file_too_large");
    const id = `m_${code(12)}`.toLowerCase();
    mediaUrls.set(id, URL.createObjectURL(file));
    s.media.push({ id, user_id: u.id, type: file.type });
    return { id, type: file.type, page: `${location.origin}${location.pathname}#/m/${id}` };
  }
  if ((m = path.match(/^\/api\/media\/([\w-]+)$/))) {
    const row = s.media.find((x) => x.id === m[1]) || fail(404, "not_found");
    return { id: row.id, type: row.type, url: mediaUrls.get(row.id) || null };
  }

  if (path.startsWith("/api/admin/")) {
    need();
    if (path === "/api/admin/stats") {
      const paid = s.orders.filter((o) => o.status === "paid");
      const day30 = Date.now() - 30 * 86400000;
      const byDay = {};
      paid.filter((o) => o.paid_at > day30).forEach((o) => {
        const d = Math.floor(o.paid_at / 86400000);
        byDay[d] = byDay[d] || { day: d, total: 0, n: 0 };
        byDay[d].total += o.amount;
        byDay[d].n += 1;
      });
      return {
        users: s.users.length,
        revenue: paid.reduce((a, o) => a + o.amount, 0),
        orders: paid.length,
        revenue30: paid.filter((o) => o.paid_at > day30).reduce((a, o) => a + o.amount, 0),
        orders30: paid.filter((o) => o.paid_at > day30).length,
        certificates: s.certificates.length,
        certificates30: s.certificates.filter((c) => c.issued_at > day30).length,
        unusedCredits: s.users.reduce((a, u) => a + u.credits, 0),
        daily: Object.values(byDay).sort((a, b) => a.day - b.day),
        payments: true,
        media: true,
      };
    }
    if (path === "/api/admin/users") {
      const q = (query.get("q") || "").toLowerCase();
      return {
        users: s.users
          .filter((u) => !q || `${u.email} ${u.name} ${u.org}`.toLowerCase().includes(q))
          .map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            org: u.org,
            credits: u.credits,
            created_at: u.created_at,
            issued: s.certificates.filter((c) => c.user_id === u.id).length,
            spent: s.orders.filter((o) => o.user_id === u.id && o.status === "paid").reduce((a, o) => a + o.amount, 0),
          })),
      };
    }
    if ((m = path.match(/^\/api\/admin\/users\/(\d+)\/credits$/))) {
      const u = s.users.find((x) => x.id === Number(m[1])) || fail(404, "not_found");
      u.credits = Math.max(0, u.credits + (parseInt(body.delta, 10) || 0));
      return { credits: u.credits };
    }
    if (path === "/api/admin/orders") {
      return { orders: s.orders.map((o) => ({ ...o, email: s.users.find((u) => u.id === o.user_id)?.email })) };
    }
    if (path === "/api/admin/packages" || (m = path.match(/^\/api\/admin\/packages\/(\d+)$/))) {
      if (method !== "GET") {
        const price = Math.round(Number(body.price));
        const credits = parseInt(body.credits, 10);
        if (!(price >= 100)) fail(400, "bad_price");
        if (!(credits > 0)) fail(400, "bad_credits");
        const data = { name: body.name, badge: body.badge || { ar: "", en: "" }, credits, price, active: body.active !== false, sort: parseInt(body.sort, 10) || 0 };
        if (method === "POST") s.packages.push({ id: s.nextId++, ...data });
        else Object.assign(s.packages.find((p) => p.id === Number(m[1])) || fail(404, "not_found"), data);
      }
      return { packages: [...s.packages].sort((a, b) => a.sort - b.sort) };
    }
    if (path === "/api/admin/settings") {
      if (method === "PATCH" && body.signup_bonus !== undefined) s.settings.signup_bonus = Math.max(0, parseInt(body.signup_bonus, 10) || 0);
      return { signup_bonus: s.settings.signup_bonus };
    }
  }
  fail(404, "not_found");
}

export const demoErrorStatus = (e) => (e instanceof DemoError ? e.status : null);
