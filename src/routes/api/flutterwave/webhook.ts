import { createFileRoute } from "@tanstack/react-router";
import { handleFlutterwaveWebhook } from "@/lib/flutterwave.server";

export const Route = createFileRoute("/api/flutterwave/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handleFlutterwaveWebhook(request),
    },
  },
});
