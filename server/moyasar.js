// Moyasar payments through hosted invoices.
//
// Flow: the server creates an invoice for the package price → the customer pays on
// Moyasar's page (mada, Visa/Mastercard, Apple Pay, STC Pay — whatever is enabled in
// your Moyasar account) → Moyasar sends them back to /api/payments/return and also
// notifies /api/payments/webhook. In both cases the server asks Moyasar directly
// whether the invoice is paid before adding credits, so nothing from the browser is trusted.

const API = "https://api.moyasar.com/v1";

const auth = (env) => `Basic ${btoa(`${env.MOYASAR_SECRET_KEY}:`)}`;

export const paymentsEnabled = (env) => Boolean(env.MOYASAR_SECRET_KEY);

export async function createInvoice(env, { amount, description, metadata, successUrl, backUrl, callbackUrl }) {
  const res = await fetch(`${API}/invoices`, {
    method: "POST",
    headers: { authorization: auth(env), "content-type": "application/json" },
    body: JSON.stringify({
      amount,
      currency: "SAR",
      description,
      metadata,
      success_url: successUrl,
      back_url: backUrl,
      callback_url: callbackUrl,
      expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`Moyasar invoice failed (${res.status}): ${data.message || JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

export async function fetchInvoice(env, id) {
  const res = await fetch(`${API}/invoices/${encodeURIComponent(id)}`, {
    headers: { authorization: auth(env) },
  });
  if (!res.ok) throw new Error(`Moyasar fetch failed (${res.status})`);
  return res.json();
}
