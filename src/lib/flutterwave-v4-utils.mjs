import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify Flutterwave v4's base64 HMAC-SHA256 signature over the exact raw body.
 * @param {Uint8Array} rawBody
 * @param {string | null} signature
 * @param {string | undefined} secret
 */
export function isValidV4WebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  if (supplied.toString("base64") !== signature) return false;
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * Convert a decimal payment amount to integer minor units without float math.
 * @param {number | string} value
 */
export function amountToMinorUnits(value) {
  const text = typeof value === "number" ? value.toFixed(2) : String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2)));
  return Number.isSafeInteger(cents) ? cents : null;
}

/**
 * Check the fields that must match a locally-created v4 payment intent.
 * @param {{id?: unknown, reference?: unknown, amount?: number | string, currency?: unknown, status?: unknown}} charge
 * @param {{reference: string, amount: number, currency: string, chargeId?: string | null}} expected
 */
export function matchesV4Charge(charge, expected) {
  const actualCents = charge.amount === undefined ? null : amountToMinorUnits(charge.amount);
  const expectedCents = amountToMinorUnits(expected.amount);
  return Boolean(
    charge.status === "succeeded" &&
    charge.reference === expected.reference &&
    String(charge.currency ?? "").toUpperCase() === expected.currency.toUpperCase() &&
    actualCents !== null &&
    actualCents === expectedCents &&
    (!expected.chargeId || charge.id === expected.chargeId),
  );
}
