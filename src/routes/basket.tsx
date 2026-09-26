import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCharity } from "@/data/charities";
import { feeAmount, subtotal, useBasket } from "@/lib/basket-store";
import { initiateFlutterwavePayment } from "@/lib/flutterwave";

export const Route = createFileRoute("/basket")({ component: BasketPage });

function BasketPage() {
  const { items, remove, clear, coverFees, setCoverFees, tribute, setTribute, anonymous, setAnonymous } = useBasket();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const total = subtotal(items);
  const fees = coverFees ? feeAmount(items) : 0;
  const grandTotal = total + fees;
  const hasMonthly = items.some((item) => item.frequency === "monthly");

  async function startCheckout() {
    setError("");
    setStarting(true);
    try {
      const result = await initiateFlutterwavePayment({
        data: {
          items,
          coverFees,
          note: tribute,
          anonymous,
          customer: { email, name },
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.link);
    } catch {
      setError("We could not start the secure checkout. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Giving tools</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-navy">Giving Basket</h1>
      <p className="mt-4 text-lg text-muted">Review your support and complete one secure USD card donation.</p>
      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-canvas p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-navy">Your basket is empty</h2>
          <p className="mt-2 text-muted">Add a charity from a profile to start building your giving plan.</p>
          <Link to="/search" className="mt-5 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg">Search charities</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            {items.map((item) => {
              const charity = getCharity(item.slug);
              return (
                <div key={item.slug} className="flex items-center justify-between rounded-xl border border-line bg-paper p-5">
                  <div>
                    <h2 className="font-semibold text-navy">{charity?.name ?? item.slug}</h2>
                    <p className="mt-1 text-sm text-muted">${item.amount.toFixed(2)} · {item.frequency === "monthly" ? "monthly" : "one-time"}</p>
                  </div>
                  <button type="button" onClick={() => remove(item.slug)} className="text-sm font-semibold text-primary hover:underline">Remove</button>
                </div>
              );
            })}
            <div className="rounded-xl border border-line bg-canvas p-5">
              <label className="flex items-center gap-3 text-sm text-navy">
                <input type="checkbox" checked={coverFees} onChange={(event) => setCoverFees(event.target.checked)} />
                Cover payment processing fees
              </label>
              <label className="mt-5 block text-sm font-medium text-navy">
                Note to the giving team <span className="font-normal text-muted">(optional)</span>
                <textarea value={tribute} onChange={(event) => setTribute(event.target.value)} maxLength={500} rows={3} placeholder="Share what inspired this gift" className="mt-1 w-full rounded-md border border-line bg-paper p-3 outline-none focus:border-primary" />
              </label>
              <label className="mt-4 flex items-center gap-3 text-sm text-navy">
                <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                Keep my gift anonymous
              </label>
              <button type="button" onClick={clear} className="mt-5 text-sm font-semibold text-primary hover:underline">Clear basket</button>
            </div>
          </section>

          <aside className="h-fit rounded-xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Secure checkout</p>
              <p className="mt-1 font-semibold text-navy">USD · Cards only</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">You will continue to Flutterwave’s hosted card checkout. We never collect card numbers on this site.</p>
            </div>
            <div className="mt-6 flex justify-between text-sm text-muted"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="mt-2 flex justify-between text-sm text-muted"><span>Fee coverage</span><span>${fees.toFixed(2)}</span></div>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-semibold text-navy"><span>Total</span><span>${grandTotal.toFixed(2)} USD</span></div>
            {hasMonthly ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Monthly items need to be changed to one-time before this USD card checkout can continue.</p> : null}
            <label className="mt-6 block text-sm font-medium text-navy">Your name <span className="font-normal text-muted">(optional)</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary" /></label>
            <label className="mt-4 block text-sm font-medium text-navy">Receipt email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary" /></label>
            {error ? <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
            <button type="button" disabled={starting || hasMonthly || !email.includes("@")} onClick={() => void startCheckout()} className="mt-6 h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-fg hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{starting ? "Opening secure checkout…" : `Donate $${grandTotal.toFixed(2)} by card`}</button>
            <p className="mt-3 text-center text-xs leading-relaxed text-muted">By continuing, you agree to complete the payment on Flutterwave’s secure hosted page.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
