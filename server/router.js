// Cardify API. Runs as a Cloudflare Pages Function (functions/api/[[path]].js).
//
// Bindings (Cloudflare dashboard → your Pages project → Settings):
//   DB     D1 database (required)
//   MEDIA  R2 bucket for images and audio behind QR codes (optional)
// Variables:
//   ADMIN_EMAILS         comma-separated emails that can open the admin dashboard
//   MOYASAR_SECRET_KEY   from the Moyasar dashboard (sk_test_… or sk_live_…)
//   SITE_URL             optional, e.g. https://cardify.sa (defaults to the request origin)

import { SCHEMA } from "./schema.js";
import { createInvoice, fetchInvoice, paymentsEnabled } from "./moyasar.js";
import {
  HttpError,
  cleanText,
  fail,
  getCookie,
  hashPassword,
  isEmail,
  json,
  newId,
  newSerial,
  now,
  randomToken,
  readJson,
  sessionCookie,
  sha256,
  verifyPassword,
} from "./util.js";

const SESSION_DAYS = 30;
const MAX_RECIPIENTS = 500;
const MAX_DESIGN_BYTES = 1_500_000;
const MEDIA_LIMITS = { image: 5 * 1024 * 1024, audio: 10 * 1024 * 1024 };
const MEDIA_PER_USER = 30;
const MEDIA_TYPES = {
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  audio: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"],
};

const DEFAULT_PACKAGES = [
  // single = 10 SAR; packs get cheaper per certificate (−34%, −50%, −63%)
  ["شهادة واحدة", "Single certificate", 1, 1000, "", "", 1],
  ["باقة المعلم", "Teacher pack", 15, 9900, "الأكثر طلبًا", "Most popular", 2],
  ["باقة الفصل", "Class pack", 40, 19900, "", "", 3],
  ["المدارس والشركات", "Schools & companies", 120, 44900, "أوفر", "Best value", 4],
];
const DEFAULT_SETTINGS = { signup_bonus: "2" };

// ---------- database setup ----------

let schemaReady = null;

async function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = (async () => {
      const statements = SCHEMA.split(";")
        .map((s) => s.replace(/--[^\n]*/g, "").trim())
        .filter(Boolean);
      await db.batch(statements.map((s) => db.prepare(s)));
      const { n } = await db.prepare("SELECT COUNT(*) AS n FROM packages").first();
      if (!n) {
        await db.batch(
          DEFAULT_PACKAGES.map((p) =>
            db
              .prepare(
                "INSERT INTO packages (name_ar, name_en, credits, price, badge_ar, badge_en, sort) VALUES (?, ?, ?, ?, ?, ?, ?)"
              )
              .bind(...p)
          )
        );
      }
      await db.batch(
        Object.entries(DEFAULT_SETTINGS).map(([k, v]) =>
          db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").bind(k, v)
        )
      );
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

async function getSetting(db, key) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row ? row.value : DEFAULT_SETTINGS[key];
}

// ---------- users and sessions ----------

const adminEmails = (env) =>
  (env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const publicUser = (u, env) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  org: u.org,
  credits: u.credits,
  isAdmin: adminEmails(env).includes(u.email),
});

async function currentUser(request, env) {
  const token = getCookie(request, "cf_session");
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?"
  )
    .bind(await sha256(token), now())
    .first();
  return row || null;
}

async function requireUser(request, env) {
  const user = await currentUser(request, env);
  if (!user) fail(401, "login_required");
  return user;
}

async function requireAdmin(request, env) {
  const user = await requireUser(request, env);
  if (!adminEmails(env).includes(user.email)) fail(403, "admin_only");
  return user;
}

async function startSession(request, env, user) {
  const token = randomToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), user.id, now() + SESSION_DAYS * 86400000)
    .run();
  return json({ user: publicUser(user, env) }, 200, {
    "set-cookie": sessionCookie(request, token, SESSION_DAYS * 86400),
  });
}

async function signup(request, env) {
  const body = await readJson(request);
  const email = cleanText(body.email, 120).toLowerCase();
  const password = String(body.password || "");
  if (!isEmail(email)) fail(400, "bad_email");
  if (password.length < 8 || password.length > 200) fail(400, "weak_password");
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (exists) fail(409, "email_taken");

  const bonus = Math.max(0, parseInt(await getSetting(env.DB, "signup_bonus"), 10) || 0);
  const res = await env.DB.prepare(
    "INSERT INTO users (email, name, org, password, credits, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(email, cleanText(body.name, 80), cleanText(body.org, 120), await hashPassword(password), bonus, now())
    .run();
  const id = res.meta.last_row_id;
  if (bonus) {
    await env.DB.prepare("INSERT INTO credit_log (user_id, delta, reason, created_at) VALUES (?, ?, 'signup', ?)")
      .bind(id, bonus, now())
      .run();
  }
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  return startSession(request, env, user);
}

async function login(request, env) {
  const body = await readJson(request);
  const email = cleanText(body.email, 120).toLowerCase();
  const since = now() - 15 * 60000;
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND at > ?")
    .bind(email, since)
    .first();
  if (n >= 10) fail(429, "too_many_attempts");

  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user || !(await verifyPassword(String(body.password || ""), user.password))) {
    await env.DB.prepare("INSERT INTO login_attempts (email, at) VALUES (?, ?)").bind(email, now()).run();
    fail(401, "wrong_login");
  }
  await env.DB.prepare("DELETE FROM login_attempts WHERE email = ? OR at < ?").bind(email, since).run();
  return startSession(request, env, user);
}

async function logout(request, env) {
  const token = getCookie(request, "cf_session");
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": sessionCookie(request, "", 0) });
}

async function updateMe(request, env) {
  const user = await requireUser(request, env);
  const body = await readJson(request);
  const name = body.name === undefined ? user.name : cleanText(body.name, 80);
  const org = body.org === undefined ? user.org : cleanText(body.org, 120);
  await env.DB.prepare("UPDATE users SET name = ?, org = ? WHERE id = ?").bind(name, org, user.id).run();
  return json({ user: publicUser({ ...user, name, org }, env) });
}

async function changePassword(request, env) {
  const user = await requireUser(request, env);
  const body = await readJson(request);
  if (!(await verifyPassword(String(body.current || ""), user.password))) fail(401, "wrong_password");
  const next = String(body.next || "");
  if (next.length < 8 || next.length > 200) fail(400, "weak_password");
  await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(await hashPassword(next), user.id).run();
  return json({ ok: true });
}

// ---------- packages and payments ----------

const publicPackage = (p) => ({
  id: p.id,
  name: { ar: p.name_ar, en: p.name_en },
  badge: { ar: p.badge_ar, en: p.badge_en },
  credits: p.credits,
  price: p.price,
  active: !!p.active,
  sort: p.sort,
});

async function listPackages(env, all = false) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM packages ${all ? "" : "WHERE active = 1"} ORDER BY sort, price`
  ).all();
  return results.map(publicPackage);
}

const siteUrl = (request, env) => (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");

async function createOrder(request, env) {
  const user = await requireUser(request, env);
  if (!paymentsEnabled(env)) fail(503, "payments_off");
  const body = await readJson(request);
  const pkg = await env.DB.prepare("SELECT * FROM packages WHERE id = ? AND active = 1")
    .bind(Number(body.packageId))
    .first();
  if (!pkg) fail(404, "no_package");

  const id = newId("ord");
  const site = siteUrl(request, env);
  const invoice = await createInvoice(env, {
    amount: pkg.price,
    description: `Cardify — ${pkg.name_ar} (${pkg.credits})`,
    metadata: { order_id: id, user_id: String(user.id) },
    successUrl: `${site}/api/payments/return?order=${id}`,
    backUrl: `${site}/#/account`,
    callbackUrl: `${site}/api/payments/webhook`,
  });
  await env.DB.prepare(
    "INSERT INTO orders (id, user_id, package_id, package_name, credits, amount, status, invoice_id, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
  )
    .bind(id, user.id, pkg.id, pkg.name_ar, pkg.credits, pkg.price, invoice.id, now())
    .run();
  return json({ orderId: id, url: invoice.url });
}

/** Asks Moyasar about the order's invoice and adds the credits once. Returns the order status. */
async function settleOrder(env, order) {
  if (order.status === "paid") return "paid";
  const invoice = await fetchInvoice(env, order.invoice_id);
  if (invoice.status !== "paid") return invoice.status === "expired" ? "failed" : order.status;
  if (Number(invoice.amount) !== order.amount || (invoice.currency && invoice.currency !== "SAR")) {
    await env.DB.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").bind(order.id).run();
    return "failed";
  }
  // Only the request that flips pending → paid adds the credits.
  const res = await env.DB.prepare("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ? AND status != 'paid'")
    .bind(now(), order.id)
    .run();
  if (res.meta.changes === 1) {
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").bind(order.credits, order.user_id),
      env.DB.prepare(
        "INSERT INTO credit_log (user_id, delta, reason, ref, created_at) VALUES (?, ?, 'purchase', ?, ?)"
      ).bind(order.user_id, order.credits, order.id, now()),
    ]);
  }
  return "paid";
}

async function paymentReturn(request, env) {
  const id = new URL(request.url).searchParams.get("order") || "";
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  let status = "failed";
  if (order) {
    try {
      status = await settleOrder(env, order);
    } catch {
      status = "pending";
    }
  }
  return Response.redirect(`${siteUrl(request, env)}/#/account?payment=${status}`, 302);
}

async function paymentWebhook(request, env) {
  // We don't trust the body: we only read the invoice id from it and ask Moyasar ourselves.
  const body = await request.json().catch(() => ({}));
  const invoiceId = body?.id || body?.data?.id || body?.invoice_id || body?.data?.invoice_id;
  if (!invoiceId) return json({ ok: true });
  const order = await env.DB.prepare("SELECT * FROM orders WHERE invoice_id = ?").bind(String(invoiceId)).first();
  if (order) await settleOrder(env, order);
  return json({ ok: true });
}

async function myOrders(request, env) {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare(
    "SELECT id, package_name, credits, amount, status, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
  )
    .bind(user.id)
    .all();
  // pending orders get a second chance to settle (e.g. the customer closed the tab after paying)
  for (const o of results) {
    if (o.status === "pending" && paymentsEnabled(env) && now() - o.created_at < 3 * 3600000) {
      const full = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(o.id).first();
      o.status = await settleOrder(env, full).catch(() => o.status);
    }
  }
  return json({ orders: results });
}

// ---------- certificates ----------

async function issueCertificates(request, env) {
  const user = await requireUser(request, env);
  const body = await readJson(request, MAX_DESIGN_BYTES + 200_000);
  const names = (Array.isArray(body.recipients) ? body.recipients : [])
    .map((n) => cleanText(n, 80))
    .filter(Boolean);
  if (!names.length) fail(400, "no_names");
  if (names.length > MAX_RECIPIENTS) fail(400, "too_many_names");
  const design = JSON.stringify(body.design || {});
  if (design.length > MAX_DESIGN_BYTES) fail(413, "design_too_large");
  const title = cleanText(body.title, 120);
  const issuer = cleanText(body.issuer || user.org, 120);
  const count = names.length;

  // Take the credits first; only succeeds if the balance is enough.
  const take = await env.DB.prepare("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?")
    .bind(count, user.id, count)
    .run();
  if (take.meta.changes !== 1) fail(402, "not_enough_credits");

  const batchId = newId("bat");
  const at = now();
  const certificates = names.map((name) => ({ serial: newSerial(), name }));
  try {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO batches (id, user_id, title, issuer, design, count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(batchId, user.id, title, issuer, design, count, at),
      ...certificates.map((c) =>
        env.DB.prepare(
          "INSERT INTO certificates (serial, batch_id, user_id, recipient, issued_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(c.serial, batchId, user.id, c.name, at)
      ),
      env.DB.prepare("INSERT INTO credit_log (user_id, delta, reason, ref, created_at) VALUES (?, ?, 'issue', ?, ?)").bind(
        user.id,
        -count,
        batchId,
        at
      ),
    ]);
  } catch (e) {
    await env.DB.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").bind(count, user.id).run();
    throw e;
  }
  return json({
    batchId,
    issuedAt: at,
    issuer,
    certificates,
    credits: user.credits - count,
  });
}

// Paid greeting cards (company occasions): just takes the credits, nothing is stored.
async function chargeCards(request, env) {
  const user = await requireUser(request, env);
  const body = await readJson(request);
  const count = parseInt(body.count, 10);
  if (!(count >= 1 && count <= MAX_RECIPIENTS)) fail(400, "bad_count");
  const take = await env.DB.prepare("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?")
    .bind(count, user.id, count)
    .run();
  if (take.meta.changes !== 1) fail(402, "not_enough_credits");
  await env.DB.prepare("INSERT INTO credit_log (user_id, delta, reason, ref, created_at) VALUES (?, ?, 'card', ?, ?)")
    .bind(user.id, -count, cleanText(body.occasion, 60), now())
    .run();
  return json({ credits: user.credits - count });
}

async function myBatches(request, env) {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare(
    "SELECT id, title, issuer, count, created_at FROM batches WHERE user_id = ? ORDER BY created_at DESC LIMIT 200"
  )
    .bind(user.id)
    .all();
  return json({ batches: results });
}

async function getBatch(request, env, id) {
  const user = await requireUser(request, env);
  const batch = await env.DB.prepare("SELECT * FROM batches WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  if (!batch) fail(404, "not_found");
  const { results } = await env.DB.prepare(
    "SELECT serial, recipient AS name FROM certificates WHERE batch_id = ? ORDER BY rowid"
  )
    .bind(id)
    .all();
  return json({
    batch: { id: batch.id, title: batch.title, issuer: batch.issuer, count: batch.count, createdAt: batch.created_at },
    design: JSON.parse(batch.design),
    certificates: results,
  });
}

async function verify(env, serial) {
  const row = await env.DB.prepare(
    "SELECT c.serial, c.recipient, c.issued_at, b.title, b.issuer FROM certificates c JOIN batches b ON b.id = c.batch_id WHERE c.serial = ?"
  )
    .bind(serial.toUpperCase())
    .first();
  if (!row) return json({ valid: false });
  return json({
    valid: true,
    serial: row.serial,
    recipient: row.recipient,
    title: row.title,
    issuer: row.issuer,
    issuedAt: row.issued_at,
  });
}

// ---------- media behind QR codes (R2) ----------

async function uploadMedia(request, env) {
  const user = await requireUser(request, env);
  if (!env.MEDIA) fail(503, "media_off");
  const form = await request.formData().catch(() => fail(400, "bad_form"));
  const file = form.get("file");
  if (!file || typeof file === "string") fail(400, "no_file");
  // Only plain images and audio (no SVG or HTML, which could run scripts on our site).
  const kind = MEDIA_TYPES.image.includes(file.type) ? "image" : MEDIA_TYPES.audio.includes(file.type) ? "audio" : null;
  if (!kind) fail(415, "bad_type");
  if (file.size > MEDIA_LIMITS[kind]) fail(413, "file_too_large");
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM media WHERE user_id = ?").bind(user.id).first();
  if (n >= MEDIA_PER_USER) fail(429, "media_quota");

  const id = newId("m").toLowerCase();
  // R2 needs the length up front, so the (small) file is read into memory first.
  await env.MEDIA.put(id, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  await env.DB.prepare("INSERT INTO media (id, user_id, type, size, name, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, file.type, file.size, cleanText(file.name, 120), now())
    .run();
  return json({ id, type: file.type, page: `${siteUrl(request, env)}/#/m/${id}` });
}

async function mediaInfo(env, id) {
  const row = await env.DB.prepare("SELECT id, type FROM media WHERE id = ?").bind(id).first();
  if (!row) fail(404, "not_found");
  return json({ id: row.id, type: row.type, url: `/api/media/${row.id}/file` });
}

async function mediaFile(env, id) {
  if (!env.MEDIA) fail(503, "media_off");
  const obj = await env.MEDIA.get(id);
  if (!obj) fail(404, "not_found");
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}

// ---------- admin ----------

async function adminStats(request, env) {
  await requireAdmin(request, env);
  const one = (sql, ...b) =>
    env.DB.prepare(sql)
      .bind(...b)
      .first();
  const day30 = now() - 30 * 86400000;
  const [users, paid, paid30, certs, certs30, credits, cards30] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM users"),
    one("SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid'"),
    one("SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid' AND paid_at > ?", day30),
    one("SELECT COUNT(*) AS n FROM certificates"),
    one("SELECT COUNT(*) AS n FROM certificates WHERE issued_at > ?", day30),
    one("SELECT COALESCE(SUM(credits), 0) AS n FROM users"),
    one("SELECT COALESCE(-SUM(delta), 0) AS n FROM credit_log WHERE reason = 'card' AND created_at > ?", day30),
  ]);
  const { results: daily } = await env.DB.prepare(
    "SELECT CAST((paid_at / 86400000) AS INTEGER) AS day, SUM(amount) AS total, COUNT(*) AS n FROM orders WHERE status = 'paid' AND paid_at > ? GROUP BY day ORDER BY day"
  )
    .bind(day30)
    .all();
  return json({
    users: users.n,
    revenue: paid.total,
    orders: paid.n,
    revenue30: paid30.total,
    orders30: paid30.n,
    certificates: certs.n,
    certificates30: certs30.n,
    unusedCredits: credits.n,
    cards30: cards30.n,
    daily,
    payments: paymentsEnabled(env),
    media: Boolean(env.MEDIA),
  });
}

async function adminUsers(request, env) {
  await requireAdmin(request, env);
  const q = `%${cleanText(new URL(request.url).searchParams.get("q"), 80)}%`;
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.org, u.credits, u.created_at,
       (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) AS issued,
       (SELECT COALESCE(SUM(amount), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid') AS spent
     FROM users u WHERE u.email LIKE ? OR u.name LIKE ? OR u.org LIKE ? ORDER BY u.created_at DESC LIMIT 200`
  )
    .bind(q, q, q)
    .all();
  return json({ users: results });
}

async function adminCredits(request, env, id) {
  const admin = await requireAdmin(request, env);
  const body = await readJson(request);
  const delta = parseInt(body.delta, 10);
  if (!delta || Math.abs(delta) > 100000) fail(400, "bad_delta");
  const res = await env.DB.prepare("UPDATE users SET credits = MAX(0, credits + ?) WHERE id = ?").bind(delta, id).run();
  if (res.meta.changes !== 1) fail(404, "not_found");
  await env.DB.prepare("INSERT INTO credit_log (user_id, delta, reason, ref, created_at) VALUES (?, ?, 'admin', ?, ?)")
    .bind(id, delta, cleanText(`${admin.email}: ${body.note || ""}`, 200), now())
    .run();
  const user = await env.DB.prepare("SELECT credits FROM users WHERE id = ?").bind(id).first();
  return json({ credits: user.credits });
}

async function adminOrders(request, env) {
  await requireAdmin(request, env);
  const { results } = await env.DB.prepare(
    "SELECT o.id, o.package_name, o.credits, o.amount, o.status, o.created_at, o.paid_at, u.email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 300"
  ).all();
  return json({ orders: results });
}

function packageFields(body) {
  const credits = parseInt(body.credits, 10);
  const price = Math.round(Number(body.price));
  if (!(credits > 0 && credits <= 100000)) fail(400, "bad_credits");
  if (!(price >= 100 && price <= 10_000_000)) fail(400, "bad_price"); // Moyasar minimum is 1 SAR
  return [
    cleanText(body.name?.ar, 60) || "باقة",
    cleanText(body.name?.en, 60) || "Pack",
    credits,
    price,
    cleanText(body.badge?.ar, 30),
    cleanText(body.badge?.en, 30),
    body.active === false ? 0 : 1,
    parseInt(body.sort, 10) || 0,
  ];
}

async function adminPackages(request, env, id) {
  await requireAdmin(request, env);
  if (request.method === "GET") return json({ packages: await listPackages(env, true) });
  const body = await readJson(request);
  if (request.method === "POST") {
    await env.DB.prepare(
      "INSERT INTO packages (name_ar, name_en, credits, price, badge_ar, badge_en, active, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(...packageFields(body))
      .run();
  } else if (request.method === "PATCH" && id) {
    await env.DB.prepare(
      "UPDATE packages SET name_ar = ?, name_en = ?, credits = ?, price = ?, badge_ar = ?, badge_en = ?, active = ?, sort = ? WHERE id = ?"
    )
      .bind(...packageFields(body), id)
      .run();
  } else fail(405, "method");
  return json({ packages: await listPackages(env, true) });
}

async function adminSettings(request, env) {
  await requireAdmin(request, env);
  if (request.method === "PATCH") {
    const body = await readJson(request);
    if (body.signup_bonus !== undefined) {
      const v = Math.max(0, Math.min(100, parseInt(body.signup_bonus, 10) || 0));
      await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('signup_bonus', ?)").bind(String(v)).run();
    }
  }
  return json({ signup_bonus: Number(await getSetting(env.DB, "signup_bonus")) });
}

// ---------- routing ----------

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin form posts and server calls
  return origin === new URL(request.url).origin;
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const m = request.method;
  try {
    if (!env.DB) fail(503, "db_missing", "Add a D1 binding named DB in the Pages project settings.");
    await ensureSchema(env.DB);
    if (m !== "GET" && m !== "HEAD" && path !== "/api/payments/webhook" && !sameOrigin(request)) {
      fail(403, "bad_origin");
    }

    let p;
    if (path === "/api/health") return json({ ok: true, payments: paymentsEnabled(env), media: Boolean(env.MEDIA) });
    if (path === "/api/auth/signup" && m === "POST") return await signup(request, env);
    if (path === "/api/auth/login" && m === "POST") return await login(request, env);
    if (path === "/api/auth/logout" && m === "POST") return await logout(request, env);
    if (path === "/api/me" && m === "GET") {
      const user = await currentUser(request, env);
      return json({ user: user ? publicUser(user, env) : null });
    }
    if (path === "/api/me" && m === "PATCH") return await updateMe(request, env);
    if (path === "/api/me/password" && m === "POST") return await changePassword(request, env);

    if (path === "/api/packages" && m === "GET")
      return json({ packages: await listPackages(env), payments: paymentsEnabled(env) });
    if (path === "/api/orders" && m === "POST") return await createOrder(request, env);
    if (path === "/api/orders" && m === "GET") return await myOrders(request, env);
    if (path === "/api/payments/return" && m === "GET") return await paymentReturn(request, env);
    if (path === "/api/payments/webhook" && m === "POST") return await paymentWebhook(request, env);

    if (path === "/api/certificates/issue" && m === "POST") return await issueCertificates(request, env);
    if (path === "/api/certificates" && m === "GET") return await myBatches(request, env);
    if (path === "/api/cards/charge" && m === "POST") return await chargeCards(request, env);
    if ((p = path.match(/^\/api\/certificates\/batch\/([\w-]+)$/)) && m === "GET") return await getBatch(request, env, p[1]);
    if ((p = path.match(/^\/api\/verify\/([\w-]+)$/)) && m === "GET") return await verify(env, p[1]);

    if (path === "/api/media" && m === "POST") return await uploadMedia(request, env);
    if ((p = path.match(/^\/api\/media\/([\w-]+)$/)) && m === "GET") return await mediaInfo(env, p[1]);
    if ((p = path.match(/^\/api\/media\/([\w-]+)\/file$/)) && m === "GET") return await mediaFile(env, p[1]);

    if (path === "/api/admin/stats") return await adminStats(request, env);
    if (path === "/api/admin/users") return await adminUsers(request, env);
    if ((p = path.match(/^\/api\/admin\/users\/(\d+)\/credits$/)) && m === "POST")
      return await adminCredits(request, env, Number(p[1]));
    if (path === "/api/admin/orders") return await adminOrders(request, env);
    if (path === "/api/admin/packages") return await adminPackages(request, env);
    if ((p = path.match(/^\/api\/admin\/packages\/(\d+)$/))) return await adminPackages(request, env, Number(p[1]));
    if (path === "/api/admin/settings") return await adminSettings(request, env);

    fail(404, "not_found");
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status);
    console.error(e);
    return json({ error: "server_error" }, 500);
  }
}
