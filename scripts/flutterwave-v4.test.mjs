import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  amountToMinorUnits,
  isValidV4WebhookSignature,
  matchesV4Charge,
} from "../src/lib/flutterwave-v4-utils.mjs";

const rawBody = Buffer.from('{"type":"charge.completed","data":{"status":"succeeded"}}');
const secret = "a-long-random-webhook-secret";
const signature = createHmac("sha256", secret).update(rawBody).digest("base64");

test("accepts only a v4 signature over the exact raw request body", () => {
  assert.equal(isValidV4WebhookSignature(rawBody, signature, secret), true);
  assert.equal(isValidV4WebhookSignature(Buffer.from(`${rawBody} `), signature, secret), false);
  assert.equal(isValidV4WebhookSignature(rawBody, "not-a-signature", secret), false);
  assert.equal(isValidV4WebhookSignature(rawBody, signature, undefined), false);
});

test("converts decimal amounts to exact minor units", () => {
  assert.equal(amountToMinorUnits(12.3), 1230);
  assert.equal(amountToMinorUnits("12.30"), 1230);
  assert.equal(amountToMinorUnits("12.301"), null);
  assert.equal(amountToMinorUnits("-1.00"), null);
});

test("requires matching reference, exact amount, currency, status, and charge ID", () => {
  const expected = { reference: "cn-test", amount: 10.25, currency: "USD", chargeId: "chg_123" };
  const charge = {
    id: "chg_123",
    reference: "cn-test",
    amount: 10.25,
    currency: "USD",
    status: "succeeded",
  };
  assert.equal(matchesV4Charge(charge, expected), true);
  assert.equal(matchesV4Charge({ ...charge, amount: 10.26 }, expected), false);
  assert.equal(matchesV4Charge({ ...charge, reference: "other" }, expected), false);
  assert.equal(matchesV4Charge({ ...charge, currency: "EUR" }, expected), false);
  assert.equal(matchesV4Charge({ ...charge, status: "pending" }, expected), false);
  assert.equal(matchesV4Charge({ ...charge, id: "chg_other" }, expected), false);
});
