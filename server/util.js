// Small helpers shared by the API (runs on Cloudflare Workers / Pages Functions).

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export const fail = (status, code, message) => {
  throw new HttpError(status, code, message);
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export async function readJson(request, maxBytes = 2_000_000) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) fail(415, "json_required");
  const text = await request.text();
  if (text.length > maxBytes) fail(413, "too_large");
  try {
    return JSON.parse(text || "{}");
  } catch {
    fail(400, "bad_json");
  }
}

export const now = () => Date.now();

const enc = new TextEncoder();

export function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
export const randomToken = (n = 32) => b64url(randomBytes(n));

// Serial numbers: easy to read aloud, no 0/O or 1/I.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function randomCode(len) {
  const bytes = randomBytes(len);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
export const newSerial = () => {
  const c = randomCode(8);
  return `CF-${c.slice(0, 4)}-${c.slice(4)}`;
};
export const newId = (prefix) => `${prefix}_${randomCode(12)}`;

export async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return b64url(new Uint8Array(digest));
}

// Passwords: PBKDF2-SHA256 (Workers allow up to 100,000 iterations).
const ITERATIONS = 100000;

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password, stored) {
  const [kind, iter, salt, hash] = (stored || "").split("$");
  if (kind !== "pbkdf2") return false;
  const test = await pbkdf2(password, b64urlDecode(salt), Number(iter));
  const want = b64urlDecode(hash);
  if (test.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < test.length; i++) diff |= test[i] ^ want[i];
  return diff === 0;
}

export function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function sessionCookie(request, token, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `cf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export const cleanText = (value, max) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 120;
