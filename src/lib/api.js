// Talks to the Cardify API (/api/*, see server/router.js).
//
// When the site runs without the server (local `npm run dev`, or a static preview),
// the same calls are answered by a demo backend in the browser (lib/demoApi.js),
// so every page can still be tried. A "demo" banner is shown in that case.

import { demoRequest } from "./demoApi";

export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

let mode = null; // "live" | "demo"
let probing = null;

async function detect() {
  if (mode) return mode;
  if (!probing) {
    probing = fetch("/api/health", { credentials: "same-origin" })
      .then(async (r) => {
        const data = r.ok ? await r.json().catch(() => null) : null;
        mode = data?.ok ? "live" : "demo";
      })
      .catch(() => {
        mode = "demo";
      });
  }
  await probing;
  return mode;
}

export const isDemo = async () => (await detect()) === "demo";

export async function api(method, path, body) {
  if ((await detect()) === "demo") return demoRequest(method, path, body);
  const isForm = body instanceof FormData;
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body && !isForm ? { "content-type": "application/json" } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "server_error");
  return data;
}

/** Full URL of a page on this site, for QR codes (verification, media). */
export function sitePage(hashPath) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname.replace(/index\.html$/, "")}#${hashPath}`;
}

export const formatSar = (halalas, lang) => {
  const n = halalas / 100;
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return lang === "en" ? `SAR ${s}` : `${s} ر.س`;
};
