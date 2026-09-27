import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getFlutterwavePaymentStatus } from "@/lib/flutterwave";

export const Route = createFileRoute("/payment-result")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === "string" ? search.reference : "",
  }),
  component: PaymentResultPage,
});

type ResultStatus = "checking" | "successful" | "failed" | "pending" | "unavailable" | "not_found";

function PaymentResultPage() {
  const { reference } = Route.useSearch();
  const [status, setStatus] = useState<ResultStatus>("checking");
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!reference || !/^cn-[0-9a-f-]{36}$/i.test(reference)) {
      setStatus("not_found");
      return;
    }
    setChecking(true);
    setStatus((current) => (current === "successful" ? current : "checking"));
    try {
      const result = await getFlutterwavePaymentStatus({ data: { reference } });
      setStatus(result.status);
    } catch {
      setStatus("unavailable");
    } finally {
      setChecking(false);
    }
  }, [reference]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const successful = status === "successful";
  const failed = status === "failed";
  const title = successful
    ? "Thank you for giving."
    : failed
      ? "This payment did not complete."
      : status === "not_found"
        ? "We could not find that payment."
        : status === "unavailable"
          ? "We could not check the payment yet."
          : "We are confirming your payment.";
  const description = successful
    ? "Your payment was confirmed against the recorded donation. Your support helps a trusted organization continue its work."
    : failed
      ? "No successful donation was recorded. You can try again from your Giving Basket or keep browsing charities."
      : status === "not_found"
        ? "This payment reference is missing or invalid. Return to your basket to start a new donation."
        : status === "unavailable"
          ? "The payment service is temporarily unavailable. Check again in a moment; do not retry the payment until its status is clear."
          : "The payment may still be processing. We will only show a confirmation after the payment service verifies the amount and final status.";

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Giving Basket · USD card donation
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-navy">{title}</h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">{description}</p>
      {status === "pending" || status === "unavailable" ? (
        <button
          type="button"
          onClick={() => void checkStatus()}
          disabled={checking}
          className="mt-6 inline-flex h-11 items-center rounded-md border border-line px-5 text-sm font-semibold text-navy disabled:opacity-50"
        >
          {checking ? "Checking…" : "Check payment status"}
        </button>
      ) : null}
      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/basket"
          className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg"
        >
          Return to basket
        </Link>
        <Link
          to="/search"
          className="inline-flex h-11 items-center rounded-md border border-line px-5 text-sm font-semibold text-navy"
        >
          Browse charities
        </Link>
      </div>
    </main>
  );
}
