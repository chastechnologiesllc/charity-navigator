import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/flutterwave/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const reference = url.searchParams.get("reference");
        if (!reference || !/^cn-[0-9a-f-]{36}$/i.test(reference)) {
          return Response.redirect(new URL("/payment-result", url.origin), 303);
        }
        const chargeId = url.searchParams.get("charge_id") ?? url.searchParams.get("id");
        if (chargeId && /^[A-Za-z0-9_-]{1,128}$/.test(chargeId)) {
          try {
            const { verifyFlutterwavePayment } = await import("@/lib/flutterwave.server");
            await verifyFlutterwavePayment(chargeId, reference);
          } catch {
            // The result page will show pending and can retry reconciliation.
          }
        }
        // The return query is never treated as proof of payment. The result page
        // performs a server-side v4 charge verification using this opaque ref.
        return Response.redirect(
          new URL(`/payment-result?reference=${encodeURIComponent(reference)}`, url.origin),
          303,
        );
      },
    },
  },
});
