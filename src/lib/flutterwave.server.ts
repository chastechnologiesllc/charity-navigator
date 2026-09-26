import { getCharity } from "@/data/charities";
import { dbSource, getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import type { CheckoutInput, PaymentResult } from "@/lib/flutterwave";

const PAYMENT_CURRENCY = "USD" as const;
const FEE_RATE = 0.029;
const FEE_FIXED = 0.3;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

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

function appUrl() {
  return env("APP_URL") ?? "https://charity-navigator-nu.vercel.app";
}

function txRef() {
  return `cn-${Date.now()}-${crypto.randomUUID()}`;
}

type FlutterwaveResponse = { status?: string; message?: string; data?: { link?: string } };

export async function createFlutterwavePayment(data: CheckoutInput): Promise<PaymentResult> {
  const validationError = validateCheckout(data);
  if (validationError) return { ok: false, error: validationError };
  if (dbSource !== "neon") return { ok: false, error: "Payments are disabled until a production DATABASE_URL is configured." };
  const secretKey = env("FLW_SECRET_KEY");
  if (!secretKey) return { ok: false, error: "Flutterwave live checkout is not configured yet." };

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

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: reference,
      amount: amount.toFixed(2),
      currency: PAYMENT_CURRENCY,
      redirect_url: `${appUrl()}/api/flutterwave/callback`,
      payment_options: "card",
      customer: { email: data.customer.email.trim().toLowerCase(), name: data.customer.name.trim() || "Supporter" },
      customizations: { title: "Charity Navigator", description: "USD card donation", logo: `${appUrl()}/images/logo-mark.svg` },
      meta: { charity_slugs: data.items.map((item) => item.slug), note: data.note.trim().slice(0, 500), anonymous: data.anonymous },
      configurations: { session_duration: 30, max_retry_attempt: 3 },
    }),
  });
  const body = (await response.json()) as FlutterwaveResponse;
  if (!response.ok || body.status !== "success" || !body.data?.link) {
    await sql`update payment_intents set status = 'checkout_error', updated_at = current_timestamp where tx_ref = ${reference}`;
    return { ok: false, error: body.message || "Flutterwave could not create the checkout." };
  }
  return { ok: true, link: body.data.link, txRef: reference };
}

export async function verifyFlutterwavePayment(transactionId: string, reference: string) {
  const secretKey = env("FLW_SECRET_KEY");
  if (!secretKey || dbSource !== "neon") return { ok: false as const, error: "Payment verification is not configured." };
  const sql = await getSql();
  const intents = await sql<{ amount: string; currency: string; status: string }>`
    select amount, currency, status from payment_intents where tx_ref = ${reference} limit 1
  `;
  const intent = intents[0];
  if (!intent) return { ok: false as const, error: "Payment reference not found." };

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
  });
  const body = (await response.json()) as { data?: { tx_ref?: string; status?: string; amount?: number; currency?: string } };
  const payment = body.data;
  const valid = response.ok && payment?.status === "successful" && payment.tx_ref === reference && payment.currency === PAYMENT_CURRENCY && Number(payment.amount) >= Number(intent.amount);
  if (!valid) return { ok: false as const, error: "Flutterwave could not verify this payment." };

  await sql`update payment_intents set status = 'successful', flutterwave_transaction_id = ${transactionId}, updated_at = current_timestamp where tx_ref = ${reference}`;
  return { ok: true as const };
}

export async function handleFlutterwaveWebhook(request: Request) {
  const secretHash = env("FLW_SECRET_HASH");
  const signature = request.headers.get("verif-hash");
  if (!secretHash || !signature || signature !== secretHash) return new Response("Unauthorized", { status: 401 });
  const payload = (await request.json()) as { event?: string; data?: { id?: number; tx_ref?: string } };
  if (dbSource !== "neon") return new Response("Database not configured", { status: 503 });
  const sql = await getSql();
  await sql`insert into payment_events (id, tx_ref, event_type, payload_json) values (${crypto.randomUUID()}, ${payload.data?.tx_ref ?? null}, ${payload.event ?? null}, ${JSON.stringify(payload)})`;
  if (payload.data?.id && payload.data.tx_ref) await verifyFlutterwavePayment(String(payload.data.id), payload.data.tx_ref);
  return new Response("ok", { status: 200 });
}
