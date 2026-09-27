import { getCharity } from "@/data/charities";
import { dbSource, getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { matchesV4Charge } from "@/lib/flutterwave-v4-utils.mjs";
import type { ChargeAction, CheckoutInput, PaymentResult } from "@/lib/flutterwave";

const PAYMENT_CURRENCY = "USD" as const;
const FEE_RATE = 0.029;
const FEE_FIXED = 0.3;
const TOKEN_URL = "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_WEBHOOK_BYTES = 1_000_000;

type Authorization =
  | { type: "pin"; nonce: string; encryptedPin: string }
  | { type: "otp"; code: string }
  | {
      type: "avs";
      address: {
        city: string;
        country: string;
        line1: string;
        line2: string;
        postal_code: string;
        state: string;
      };
    };

type V4Charge = {
  id?: string;
  reference?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  next_action?: {
    type?: string;
    redirect_url?: { url?: string };
    authorization?: { type?: string };
  };
};

type V4Response<T> = {
  status?: string;
  message?: string;
  data?: T;
  error?: { type?: string; code?: string; message?: string };
};

class FlutterwaveApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly providerCode: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "FlutterwaveApiError";
  }
}

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;
let tokenRequest: Promise<string> | null = null;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function getCheckoutAmount(items: CheckoutInput["items"], coverFees: boolean) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const fee = coverFees && total > 0 ? total * FEE_RATE + FEE_FIXED : 0;
  return roundMoney(total + fee);
}

function validateCheckout(input: CheckoutInput) {
  if (!input.items.length || input.items.length > 25)
    return "Add at least one charity to your basket.";
  if (!input.customer.email.includes("@") || input.customer.email.length > 200)
    return "Enter a valid email address.";
  if (input.customer.name.trim().length > 120) return "Keep your name under 120 characters.";
  if (input.note.length > 500) return "Keep your note under 500 characters.";
  if (input.items.some((item) => item.frequency !== "once"))
    return "Monthly giving is not enabled in this USD card checkout yet. Please use one-time giving.";
  for (const item of input.items) {
    if (
      !getCharity(item.slug) ||
      !Number.isFinite(item.amount) ||
      item.amount < 1 ||
      item.amount > 100000
    )
      return "One or more basket entries is invalid.";
  }
  const amount = getCheckoutAmount(input.items, input.coverFees);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000)
    return "Enter a donation total between $1 and $100,000.";
  return null;
}

function appUrl() {
  const value = env("APP_URL");
  if (!value) throw new Error("APP_URL must be configured for payment returns.");
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("APP_URL must use HTTPS.");
    return url.origin;
  } catch {
    throw new Error("APP_URL must be a valid HTTPS URL.");
  }
}

function txRef() {
  return `cn-${crypto.randomUUID()}`;
}

function baseUrl() {
  return env("FLW_ENVIRONMENT") === "production"
    ? "https://f4bexperience.flutterwave.com"
    : "https://developersandbox-api.flutterwave.com";
}

function apiCredentials() {
  const clientId = env("FLW_CLIENT_ID");
  const clientSecret = env("FLW_CLIENT_SECRET");
  if (!clientId || !clientSecret)
    throw new Error("Flutterwave v4 Client ID and Client Secret are not configured.");
  return { clientId, clientSecret };
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (tokenRequest) return tokenRequest;
  if (!forceRefresh && tokenCache && tokenCache.expiresAt - Date.now() > 60_000)
    return tokenCache.accessToken;

  tokenRequest = (async () => {
    const { clientId, clientSecret } = apiCredentials();
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error_description?: string;
    };
    if (!response.ok || !body.access_token)
      throw new Error(body.error_description || "Flutterwave v4 authentication failed.");
    tokenCache = {
      accessToken: body.access_token,
      expiresAt: Date.now() + Math.max(60, body.expires_in ?? 600) * 1000,
    };
    return body.access_token;
  })().finally(() => {
    tokenRequest = null;
  });
  return tokenRequest;
}

async function v4Request<T>(
  path: string,
  init: RequestInit = {},
  retryAuth = true,
): Promise<V4Response<T>> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Trace-Id": crypto.randomUUID(),
      "X-Idempotency-Key": crypto.randomUUID(),
      ...(init.headers ?? {}),
    },
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status === 401 && retryAuth) {
    tokenCache = null;
    await getAccessToken(true);
    return v4Request<T>(path, init, false);
  }
  const body = (await response.json().catch(() => ({}))) as V4Response<T>;
  if (!response.ok) {
    const message = body.error?.message ?? body.message;
    throw new FlutterwaveApiError(
      response.status,
      body.error?.code,
      message
        ? `Flutterwave request failed (${response.status}): ${message}`
        : `Flutterwave request failed (${response.status}).`,
    );
  }
  return body;
}

function toAction(data: V4Charge): ChargeAction {
  if (data.status === "succeeded") return { kind: "success" };
  const action = data.next_action;
  const type = action?.type;
  if (type === "redirect_url") {
    const redirect = action?.redirect_url?.url;
    if (redirect) {
      try {
        if (new URL(redirect).protocol === "https:") return { kind: "redirect", url: redirect };
      } catch {
        /* return a safe pending state for malformed provider data */
      }
    }
  }
  const authorizationType = action?.authorization?.type;
  if (authorizationType === "pin" || type === "requires_pin")
    return { kind: "authorize", type: "pin" };
  if (authorizationType === "otp" || type === "requires_otp")
    return { kind: "authorize", type: "otp" };
  if (authorizationType === "avs" || type === "requires_additional_fields")
    return { kind: "authorize", type: "avs" };
  return { kind: "pending" };
}

function publicError(error: unknown) {
  if (error instanceof FlutterwaveApiError) {
    if ([401, 403].includes(error.statusCode))
      return "Payment service authorization failed. Please contact support.";
    const reason = error.message
      .replace(/^Flutterwave request failed \(\d+\):?\s*/i, "")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\b\d{12,19}\b/g, "[redacted]")
      .trim()
      .slice(0, 320);
    const code = error.providerCode ? ` (${error.providerCode})` : "";
    return `Payment details were rejected${code}${reason ? `: ${reason}` : "."}`;
  }
  return "Secure checkout is not available right now. Please try again later.";
}

export function getFlutterwavePublicConfig() {
  return {
    configured: Boolean(
      env("FLW_CLIENT_ID") &&
      env("FLW_CLIENT_SECRET") &&
      env("FLW_ENCRYPTION_KEY") &&
      env("APP_URL") &&
      env("DATABASE_URL"),
    ),
    environment: env("FLW_ENVIRONMENT") === "production" ? "production" : "test",
    encryptionKey: env("FLW_ENCRYPTION_KEY") ?? null,
  };
}

async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function createFlutterwavePayment(input: CheckoutInput): Promise<PaymentResult> {
  const validationError = validateCheckout(input);
  if (validationError) return { ok: false, error: validationError };
  if (dbSource !== "neon")
    return {
      ok: false,
      error: "Payments are disabled until a production DATABASE_URL is configured.",
    };
  if (
    !env("FLW_CLIENT_ID") ||
    !env("FLW_CLIENT_SECRET") ||
    !env("FLW_ENCRYPTION_KEY") ||
    !env("APP_URL")
  ) {
    return { ok: false, error: "Flutterwave v4 checkout is not configured yet." };
  }

  const amount = getCheckoutAmount(input.items, input.coverFees);
  const reference = txRef();
  // Stable per intent; providers safely collapse retries of this charge request.
  const chargeIdempotencyKey = reference;
  const sql = await getSql();
  await sql`
    insert into payment_intents
      (id, tx_ref, amount, currency, customer_email, customer_name, items_json, note, anonymous)
    values
      (${crypto.randomUUID()}, ${reference}, ${amount.toFixed(2)}, ${PAYMENT_CURRENCY},
       ${input.customer.email.trim().toLowerCase()}, ${input.customer.name.trim() || null},
       ${JSON.stringify(input.items)}, ${input.note.trim() || null}, ${input.anonymous})
  `;

  try {
    const nameParts = input.customer.name.trim().split(/\s+/).filter(Boolean);
    const customerName = {
      first: nameParts[0] ?? "Supporter",
      ...(nameParts.length > 2 ? { middle: nameParts.slice(1, -1).join(" ") } : {}),
      ...(nameParts.length > 1 ? { last: nameParts.at(-1) ?? "" } : {}),
    };
    const response = await v4Request<V4Charge>("/orchestration/direct-charges", {
      method: "POST",
      headers: {
        "X-Trace-Id": crypto.randomUUID(),
        "X-Idempotency-Key": chargeIdempotencyKey,
      },
      body: JSON.stringify({
        amount,
        currency: PAYMENT_CURRENCY,
        reference,
        payment_method: { type: "card", card: input.card },
        redirect_url: `${appUrl()}/api/flutterwave/callback?reference=${encodeURIComponent(reference)}`,
        customer: {
          email: input.customer.email.trim().toLowerCase(),
          name: customerName,
        },
        meta: {
          charity_slugs: input.items.map((item) => item.slug).join(","),
          anonymous: String(input.anonymous),
        },
      }),
    });
    const charge = response.data;
    if (!charge?.id) throw new Error("Flutterwave returned an incomplete charge response.");
    await sql`
      update payment_intents
      set flutterwave_charge_id = ${charge.id}, updated_at = current_timestamp
      where tx_ref = ${reference}
    `;
    if (charge.status === "succeeded") await verifyFlutterwavePayment(charge.id, reference);
    else if (charge.status === "failed" || charge.status === "cancelled")
      await applyChargeStatus(reference, charge);
    return { ok: true, reference, action: toAction(charge) };
  } catch (error) {
    await sql`update payment_intents set status = 'checkout_error', updated_at = current_timestamp where tx_ref = ${reference} and status <> 'successful'`;
    console.error(
      "[flutterwave-v4] charge initiation failed",
      error instanceof Error ? error.message : "unknown error",
    );
    if (
      error instanceof FlutterwaveApiError &&
      [400, 401, 403, 404, 422].includes(error.statusCode)
    ) {
      await sql`update payment_intents set status = 'checkout_error', updated_at = current_timestamp where tx_ref = ${reference} and status <> 'successful'`;
      return { ok: false, error: publicError(error) };
    }
    // The provider may have accepted a charge even if its response was lost.
    // Route to status reconciliation instead of prompting a fresh payment.
    return { ok: true, reference, action: { kind: "pending" } };
  }
}

async function getStoredIntent(reference: string) {
  const sql = await getSql();
  const rows = await sql<{
    amount: string;
    currency: string;
    status: string;
    flutterwave_charge_id: string | null;
  }>`
    select amount, currency, status, flutterwave_charge_id from payment_intents where tx_ref = ${reference} limit 1
  `;
  return rows[0] ?? null;
}

async function applyChargeStatus(reference: string, charge: V4Charge): Promise<boolean> {
  const intent = await getStoredIntent(reference);
  if (!intent) return false;
  const chargeId = typeof charge.id === "string" ? charge.id : intent.flutterwave_charge_id;
  const matches = matchesV4Charge(charge, {
    reference,
    amount: Number(intent.amount),
    currency: intent.currency,
    chargeId: intent.flutterwave_charge_id,
  });
  const sql = await getSql();
  if (matches && chargeId) {
    await sql`
      update payment_intents
      set status = 'successful', flutterwave_charge_id = ${chargeId}, updated_at = current_timestamp
      where tx_ref = ${reference} and status <> 'successful'
    `;
    return true;
  }
  if (charge.status === "failed" || charge.status === "cancelled") {
    await sql`
      update payment_intents set status = 'failed', updated_at = current_timestamp
      where tx_ref = ${reference} and status <> 'successful'
    `;
  }
  return false;
}

export async function verifyFlutterwavePayment(chargeId: string, reference: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(chargeId))
    return { ok: false as const, error: "Invalid Flutterwave charge identifier." };
  if (dbSource !== "neon")
    return { ok: false as const, error: "Payment verification is not configured." };
  const intent = await getStoredIntent(reference);
  if (!intent) return { ok: false as const, error: "Payment reference not found." };
  if (intent.flutterwave_charge_id && intent.flutterwave_charge_id !== chargeId)
    return { ok: false as const, error: "Payment identifier mismatch." };

  const response = await v4Request<V4Charge>(`/charges/${encodeURIComponent(chargeId)}`, {
    method: "GET",
    headers: {
      "X-Trace-Id": crypto.randomUUID(),
      "X-Idempotency-Key": `verify-${reference}-${chargeId}`,
    },
  });
  const charge = response.data;
  if (!charge || charge.id !== chargeId)
    return { ok: false as const, error: "Flutterwave charge was not found." };
  const ok = await applyChargeStatus(reference, charge);
  return ok
    ? { ok: true as const }
    : { ok: false as const, error: "Flutterwave has not confirmed the expected payment." };
}

export async function authorizeFlutterwavePayment(
  reference: string,
  authorization: Authorization,
): Promise<PaymentResult> {
  if (dbSource !== "neon") return { ok: false, error: "Payment authorization is not configured." };
  try {
    const intent = await getStoredIntent(reference);
    if (!intent?.flutterwave_charge_id)
      return { ok: false, error: "Payment session was not found. Please start checkout again." };
    if (intent.status === "successful") return { ok: true, reference, action: { kind: "success" } };

    const authBody =
      authorization.type === "pin"
        ? {
            type: "pin",
            pin: { nonce: authorization.nonce, encrypted_pin: authorization.encryptedPin },
          }
        : authorization.type === "otp"
          ? { type: "otp", otp: { code: authorization.code } }
          : { type: "avs", avs: { address: authorization.address } };
    const response = await v4Request<V4Charge>(
      `/charges/${encodeURIComponent(intent.flutterwave_charge_id)}`,
      {
        method: "PUT",
        headers: {
          "X-Trace-Id": crypto.randomUUID(),
          "X-Idempotency-Key": `${reference}-auth-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ authorization: authBody }),
      },
    );
    const charge = response.data;
    if (!charge?.id)
      return { ok: false, error: "Flutterwave returned an incomplete authorization response." };
    if (charge.status === "succeeded") await verifyFlutterwavePayment(charge.id, reference);
    return { ok: true, reference, action: toAction(charge) };
  } catch (error) {
    console.error(
      "[flutterwave-v4] authorization failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return { ok: false, error: publicError(error) };
  }
}

export async function getFlutterwavePaymentStatus(reference: string) {
  if (dbSource !== "neon") return { status: "unavailable" as const };
  const intent = await getStoredIntent(reference);
  if (!intent) return { status: "not_found" as const };
  if (intent.status !== "successful" && intent.flutterwave_charge_id) {
    try {
      await verifyFlutterwavePayment(intent.flutterwave_charge_id, reference);
    } catch (error) {
      console.error(
        "[flutterwave-v4] status reconciliation failed",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }
  const fresh = await getStoredIntent(reference);
  return {
    status:
      fresh?.status === "successful"
        ? ("successful" as const)
        : fresh?.status === "failed"
          ? ("failed" as const)
          : ("pending" as const),
  };
}

export async function handleFlutterwaveWebhook(request: Request) {
  const secret = env("FLW_SECRET_HASH");
  if (!secret) return new Response("Webhook is not configured", { status: 503 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_WEBHOOK_BYTES) return new Response("Payload too large", { status: 413 });
  const rawBody = await readBoundedBody(request, MAX_WEBHOOK_BYTES);
  if (!rawBody) return new Response("Payload too large", { status: 413 });
  const signature = request.headers.get("flutterwave-signature");
  const { isValidV4WebhookSignature } = await import("./flutterwave-v4-utils.mjs");
  if (!isValidV4WebhookSignature(rawBody, signature, secret))
    return new Response("Unauthorized", { status: 401 });

  let payload: {
    id?: unknown;
    webhook_id?: unknown;
    type?: unknown;
    timestamp?: unknown;
    data?: V4Charge;
  };
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody)) as typeof payload;
  } catch {
    return new Response("Malformed JSON", { status: 400 });
  }
  const eventId = typeof payload.id === "string" ? payload.id : payload.webhook_id;
  if (
    typeof eventId !== "string" ||
    typeof payload.type !== "string" ||
    !payload.data ||
    typeof payload.data.id !== "string" ||
    typeof payload.data.reference !== "string"
  ) {
    return new Response("Malformed Flutterwave event", { status: 400 });
  }
  if (dbSource !== "neon") return new Response("Database not configured", { status: 503 });

  const sql = await getSql();
  const minimalPayload = JSON.stringify({
    id: eventId,
    type: payload.type,
    timestamp: payload.timestamp,
    data: {
      id: payload.data.id,
      reference: payload.data.reference,
      status: payload.data.status,
      amount: payload.data.amount,
      currency: payload.data.currency,
    },
  });
  await sql`
    insert into payment_events (id, provider_event_id, tx_ref, event_type, payload_json)
    values (${crypto.randomUUID()}, ${eventId}, ${payload.data.reference}, ${payload.type}, ${minimalPayload})
    on conflict (provider_event_id) where provider_event_id is not null do nothing
  `;

  if (payload.type.startsWith("charge.")) {
    try {
      const result = await verifyFlutterwavePayment(payload.data.id, payload.data.reference);
      if (!result.ok && result.error === "Flutterwave has not confirmed the expected payment.") {
        // A signed but non-terminal/mismatched event cannot safely confirm value;
        // it is acknowledged after storing the minimum audit record.
        return new Response("ok", { status: 200 });
      }
    } catch (error) {
      console.error(
        "[flutterwave-v4] webhook charge verification failed",
        error instanceof Error ? error.message : "unknown error",
      );
      return new Response("Temporary verification failure", { status: 503 });
    }
  }
  return new Response("ok", { status: 200 });
}
