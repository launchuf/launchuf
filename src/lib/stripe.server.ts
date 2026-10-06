// SERVER-ONLY Stripe-hjälpare (fetch mot Stripe REST API — fungerar i Cloudflare Workers).
import { getServerEnv } from "@/lib/env.server";
import { SITE_URL } from "@/lib/settings";

export function siteOrigin(): string {
  const configured = getServerEnv("PUBLIC_SITE_URL") ?? SITE_URL;
  const parsed = new URL(configured);
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if ((parsed.protocol !== "https:" && !isLocal) || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("PUBLIC_SITE_URL måste vara en HTTPS-origin utan sökväg.");
  }
  return parsed.origin;
}

export function stripeKey(): string | null {
  return getServerEnv("STRIPE_SECRET_KEY") ?? null;
}

export type StripeSession = {
  id?: string;
  url?: string;
  status?: string;
  payment_status?: string;
  client_reference_id?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_intent?: string | null;
  error?: { message?: string };
};

export async function createCheckoutSession(args: {
  orderNumber: string;
  email: string;
  lines: Array<{ name: string; description?: string; amountKr: number }>;
}): Promise<StripeSession & { ok: boolean }> {
  const key = stripeKey();
  if (!key) return { ok: false, error: { message: "STRIPE_SECRET_KEY saknas" } };
  const origin = siteOrigin();
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("locale", "sv");
  body.set("customer_email", args.email);
  body.set("client_reference_id", args.orderNumber);
  body.set("metadata[order_number]", args.orderNumber);
  body.set("success_url", `${origin}/betalning/lyckad?order=${encodeURIComponent(args.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/betalning/misslyckad?order=${encodeURIComponent(args.orderNumber)}`);
  args.lines.forEach((line, i) => {
    body.set(`line_items[${i}][quantity]`, "1");
    body.set(`line_items[${i}][price_data][currency]`, "sek");
    body.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(line.amountKr * 100)));
    body.set(`line_items[${i}][price_data][product_data][name]`, line.name);
    if (line.description) body.set(`line_items[${i}][price_data][product_data][description]`, line.description.slice(0, 300));
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const session = (await res.json().catch(() => ({}))) as StripeSession;
  return { ...session, ok: res.ok && Boolean(session.id && session.url) };
}

export async function retrieveSession(sessionId: string): Promise<StripeSession & { ok: boolean }> {
  const key = stripeKey();
  if (!key) return { ok: false, error: { message: "STRIPE_SECRET_KEY saknas" } };
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const session = (await res.json().catch(() => ({}))) as StripeSession;
  return { ...session, ok: res.ok };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verifierar Stripe-webhook-signatur (HMAC-SHA256, Web Crypto) och returnerar eventet. */
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) throw new Error("Saknar stripe-signature");
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t" && v) timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) throw new Error("Felformaterad signatur");
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSec) throw new Error("Signaturen är för gammal");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (!signatures.some((sig) => timingSafeEqual(sig, expected))) throw new Error("Signaturen matchar inte");
  return JSON.parse(payload) as { type: string; data: { object: StripeSession } };
}
