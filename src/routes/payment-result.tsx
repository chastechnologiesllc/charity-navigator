import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/payment-result")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: search.status === "successful" ? "successful" : "failed",
  }),
  component: PaymentResultPage,
});

function PaymentResultPage() {
  const { status } = Route.useSearch();
  const successful = status === "successful";
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">USD card donation</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-navy">
        {successful ? "Thank you for giving." : "We could not confirm that payment."}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
        {successful
          ? "Your payment was verified by Flutterwave. Your support helps a trusted organization continue its work."
          : "No donation was recorded. You can try again from your Giving Basket or keep browsing charities."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/basket" className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg">
          Return to basket
        </Link>
        <Link to="/search" className="inline-flex h-11 items-center rounded-md border border-line px-5 text-sm font-semibold text-navy">
          Browse charities
        </Link>
      </div>
    </main>
  );
}
