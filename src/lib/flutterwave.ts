import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BasketItem } from "@/lib/basket-store";

export const PAYMENT_CURRENCY = "USD" as const;

const basketItemSchema = z.object({
  slug: z.string().min(1).max(120),
  amount: z.number().finite().min(1).max(100000),
  frequency: z.enum(["once", "monthly"]),
});

const encryptedCardSchema = z.object({
  nonce: z.string().regex(/^[A-Za-z0-9]{12}$/),
  encrypted_card_number: z.string().min(1).max(256),
  encrypted_expiry_month: z.string().min(1).max(128),
  encrypted_expiry_year: z.string().min(1).max(128),
  encrypted_cvv: z.string().min(1).max(128),
});

const checkoutSchema = z.object({
  items: z.array(basketItemSchema).min(1).max(25),
  coverFees: z.boolean(),
  note: z.string().max(500),
  anonymous: z.boolean(),
  customer: z.object({
    email: z.string().trim().email().max(200),
    name: z.string().trim().max(120),
  }),
  card: encryptedCardSchema,
});

const authorizationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pin"),
    nonce: z.string().regex(/^[A-Za-z0-9]{12}$/),
    encryptedPin: z.string().min(1).max(128),
  }),
  z.object({ type: z.literal("otp"), code: z.string().trim().min(4).max(12) }),
  z.object({
    type: z.literal("avs"),
    address: z.object({
      city: z.string().trim().min(1).max(80),
      country: z.string().trim().length(2),
      line1: z.string().trim().min(1).max(120),
      line2: z.string().trim().max(120),
      postal_code: z.string().trim().min(1).max(20),
      state: z.string().trim().min(1).max(80),
    }),
  }),
]);

export type CheckoutInput = {
  items: BasketItem[];
  coverFees: boolean;
  note: string;
  anonymous: boolean;
  customer: { email: string; name: string };
  card: {
    nonce: string;
    encrypted_card_number: string;
    encrypted_expiry_month: string;
    encrypted_expiry_year: string;
    encrypted_cvv: string;
  };
};

export type ChargeAction =
  | { kind: "success" }
  | { kind: "redirect"; url: string }
  | { kind: "authorize"; type: "pin" | "otp" | "avs" }
  | { kind: "pending" };

export type PaymentResult =
  { ok: true; reference: string; action: ChargeAction } | { ok: false; error: string };

const referenceSchema = z.string().regex(/^cn-[0-9a-f-]{36}$/i);

export const getFlutterwaveCheckoutConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { getFlutterwavePublicConfig } = await import("./flutterwave.server.ts");
  return getFlutterwavePublicConfig();
});

export const initiateFlutterwavePayment = createServerFn({ method: "POST" })
  .validator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }): Promise<PaymentResult> => {
    const { createFlutterwavePayment } = await import("./flutterwave.server.ts");
    return createFlutterwavePayment(data);
  });

export const authorizeFlutterwavePayment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        reference: referenceSchema,
        authorization: authorizationSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PaymentResult> => {
    const { authorizeFlutterwavePayment: authorize } = await import("./flutterwave.server.ts");
    return authorize(data.reference, data.authorization);
  });

export const getFlutterwavePaymentStatus = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ reference: referenceSchema }).parse(input))
  .handler(async ({ data }) => {
    const { getFlutterwavePaymentStatus: getStatus } = await import("./flutterwave.server.ts");
    return getStatus(data.reference);
  });
