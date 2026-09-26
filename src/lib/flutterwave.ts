import { createServerFn } from "@tanstack/react-start";
import type { BasketItem } from "@/lib/basket-store";

export const PAYMENT_CURRENCY = "USD" as const;

export type CheckoutInput = {
  items: BasketItem[];
  coverFees: boolean;
  note: string;
  anonymous: boolean;
  customer: { email: string; name: string };
};

export type PaymentResult =
  | { ok: true; link: string; txRef: string }
  | { ok: false; error: string };

export const initiateFlutterwavePayment = createServerFn({ method: "POST" })
  .validator((input: CheckoutInput) => input)
  .handler(async ({ data }): Promise<PaymentResult> => {
    const { createFlutterwavePayment } = await import("./flutterwave.server.ts");
    return createFlutterwavePayment(data);
  });
