import { createFileRoute } from "@tanstack/react-router";
import { verifyFlutterwavePayment } from "@/lib/flutterwave.server";

export const Route = createFileRoute("/api/flutterwave/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const reference = url.searchParams.get("reference") ?? url.searchParams.get("tx_ref");
        const transactionId = url.searchParams.get("order_id") ?? url.searchParams.get("transaction_id");
        let result = "failed";
        if (status === "successful" && reference && transactionId) {
          const verified = await verifyFlutterwavePayment(transactionId, reference);
          result = verified.ok ? "successful" : "failed";
        }
        return Response.redirect(new URL(`/payment-result?status=${result}`, url.origin), 303);
      },
    },
  },
});
