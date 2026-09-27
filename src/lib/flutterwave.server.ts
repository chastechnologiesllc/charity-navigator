import { createHmac, timingSafeEqual } from "node:crypto";
import { getCharity } from "@/data/charities";
import { dbSource, getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import type { CheckoutInput, PaymentResult } from "@/lib/flutterwave";

const PAYMENT_CURRENCY = "USD" as const;
const FEE_RATE = 0.029;
const FEE_FIXED = 0.3;
const FLUTTERWAVE_TOKEN_URL = "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";
const FLUTTERWAVE_V4_LIVE_URL = "https://api.flutterwave.com/v4";
const FLUTTERWAVE_V4_SANDBOX_URL = "https://developersandbox-api.flutterwave.com";

let accessToken: { value: string; expiresAt: number } | undefined;

function roundMoney(value: number) { return Math.round(value * 100) / 100; }
function getCheckoutAmount(items: CheckoutInput["items"], coverFees: boolean) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const fee = coverFees && total > 0 ? total * FEE_RATE + FEE_FIXED : 0;
  return roundMoney(total + fee);
}
function validateCheckout(input: CheckoutInput) {
  if (!input.items.length || input.items.length > 25) return "Add at least one charity to your basket.";
  if (!input.customer.email.includes("@") || input.customer.email.length > 200) return "Enter a valid email address.";
  if (input.customer.name.trim().length > 120) return "Keep your name under 120 characters.";
  if (input.note.length > 500) return "Keep your note under 500 characters.";
  if (input.items.some((item) => item.frequency !== "once")) return "Monthly giving is not enabled in this USD card checkout yet. Please use one-time giving.";
  for (const item of input.items) {
    if (!getCharity(item.slug) || !Number.isFinite(item.amount) || item.amount < 1 || item.amount > 100000) return "One or more basket entries is invalid.";
  }
  const amount = getCheckoutAmount(input.items, input.coverFees);
  if (amount < 1 || amount > 100000) return "Enter a donation total between $1 and $100,000.";
  return null;
}
function appUrl() { return env("APP_URL") ?? "https://charity-navigator-nu.vercel.app"; }
function txRef() { return `cn-${Date.now()}-${crypto.randomUUID()}`; }
function apiBaseUrl() { return env("FLW_ENVIRONMENT") === "sandbox" ? FLUTTERWAVE_V4_SANDBOX_URL : FLUTTERWAVE_V4_LIVE_URL; }

async function getAccessToken() {
  const clientId = env("FLW_CLIENT_ID");
  const clientSecret = env("FLW_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000) return accessToken.value;
  const response = await fetch(FLUTTERWAVE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!response.ok || !body.access_token) return null;
  accessToken = { value: body.access_token, expiresAt: Date.now() + Math.max(60, (body.expires_in ?? 600) - 60) * 1000 };
  return accessToken.value;
}

type V4Response<T> = { status?: string; message?: string; data?: T; error?: { message?: string } };
type V4Order = { id?: string; amount?: number; currency?: string; reference?: string; status?: string; redirect_url?: string };
async function v4Request<T>(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) return { response: null, body: null as V4Response<T> | null };
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
  return { response, body: (await response.json()) as V4Response<T> };
}

export async function createFlutterwavePayment(data: CheckoutInput): Promise<PaymentResult> {
  const validationError = validateCheckout(data);
  if (validationError) return { ok: false, error: validationError };
  if (dbSource !== "neon") return { ok: false, error: "Payments are disabled until a production DATABASE_URL is configured." };
  const clientId = env("FLW_CLIENT_ID");
  const clientSecret = env("FLW_CLIENT_SECRET");
  const customerId = env("FLW_V4_CUSTOMER_ID");
  const paymentMethodId = env("FLW_V4_PAYMENT_METHOD_ID");
  if (!clientId || !clientSecret) return { ok: false, error: "Flutterwave v4 is not configured: add FLW_CLIENT_ID and FLW_CLIENT_SECRET on the server." };
  if (!customerId || !paymentMethodId) return { ok: false, error: "Flutterwave v4 is not configured: add FLW_V4_CUSTOMER_ID and FLW_V4_PAYMENT_METHOD_ID for the v4 order flow." };

  const amount = getCheckoutAmount(data.items, data.coverFees);
  const reference = txRef();
  const sql = await getSql();
  await sql`
    insert into payment_intents
      (id, tx_ref, amount, currency, customer_email, customer_name, items_json, note, anonymous)
    values
      (${crypto.randomUUID()}, ${reference}, ${amount.toFixed(2)}, ${PAYMENT_CURRENCY},
       ${data.customer.email.trim().toLowerCase()}, ${data.customer.name.trim() || null},
       ${JSON.stringify(data.items)}, ${data.note.trim() || null}, ${data.anonymous})
  `;

  const { response, body } = await v4Request<V4Order>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount, currency: PAYMENT_CURRENCY, reference, customer_id: customerId, payment_method_id: paymentMethodId,
      redirect_url: `${appUrl()}/api/flutterwave/callback`,
      meta: { charity_slugs: data.items.map((item) => item.slug), note: data.note.trim().slice(0, 500), anonymous: data.anonymous },
    }),
  });
  const order = body?.data;
  if (!response?.ok || !order?.id || !order.redirect_url) {
    await sql`update payment_intents set status = 'checkout_error', updated_at = current_timestamp where tx_ref = ${reference}`;
    return { ok: false, error: body?.error?.message || body?.message || "Flutterwave v4 could not create the order." };
  }
  return { ok: true, link: order.redirect_url, txRef: reference };
}

export async function verifyFlutterwavePayment(orderId: string, reference: string) {
  if (dbSource !== "neon") return { ok: false as const, error: "Payment verification is not configured." };
  const sql = await getSql();
  const intents = await sql<{ amount: string; currency: string; status: string }>`select amount, currency, status from payment_intents where tx_ref = ${reference} limit 1`;
  const intent = intents[0];
  if (!intent) return { ok: false as const, error: "Payment reference not found." };
  const { response, body } = await v4Request<V4Order>(`/orders/${encodeURIComponent(orderId)}`);
  const payment = body?.data;
  const valid = response?.ok && ["completed", "succeeded", "successful"].includes(payment?.status ?? "") && payment?.reference === reference && payment?.currency === PAYMENT_CURRENCY && Number(payment?.amount) >= Number(intent.amount);
  if (!valid) return { ok: false as const, error: "Flutterwave could not verify this payment." };
  await sql`update payment_intents set status = 'successful', flutterwave_transaction_id = ${orderId}, updated_at = current_timestamp where tx_ref = ${reference}`;
  return { ok: true as const };
}

function validWebhookSignature(rawBody: string, signature: string | null, secretHash: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secretHash).update(rawBody).digest("base64");
  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  return received.length === calculated.length && timingSafeEqual(received, calculated);
}
export async function handleFlutterwaveWebhook(request: Request) {
  const secretHash = env("FLW_SECRET_HASH");
  const rawBody = await request.text();
  if (!secretHash || !validWebhookSignature(rawBody, request.headers.get("flutterwave-signature"), secretHash)) return new Response("Unauthorized", { status: 401 });
  const payload = JSON.parse(rawBody) as { type?: string; data?: { id?: string; reference?: string; status?: string } };
  if (dbSource !== "neon") return new Response("Database not configured", { status: 503 });
  const sql = await getSql();
  await sql`insert into payment_events (id, tx_ref, event_type, payload_json) values (${crypto.randomUUID()}, ${payload.data?.reference ?? null}, ${payload.type ?? null}, ${JSON.stringify(payload)})`;
  if (payload.data?.id && payload.data.reference) await verifyFlutterwavePayment(payload.data.id, payload.data.reference);
  return new Response("ok", { status: 200 });
}
