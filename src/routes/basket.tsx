import { createFileRoute, Link } from "@tanstack/react-router";
import { getCharity } from "@/data/charities";
import { feeAmount, subtotal, useBasket } from "@/lib/basket-store";

export const Route = createFileRoute("/basket")({ component: BasketPage });

function BasketPage() {
  const { items, remove, clear, coverFees } = useBasket();
  const total = subtotal(items);
  const fees = coverFees ? feeAmount(items) : 0;
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Giving tools</p><h1 className="mt-2 font-display text-4xl font-semibold text-navy">Giving Basket</h1><p className="mt-4 text-lg text-muted">Review the charities you want to support in one place.</p>{items.length === 0 ? <div className="mt-8 rounded-xl border border-line bg-canvas p-8 text-center"><h2 className="font-display text-2xl font-semibold text-navy">Your basket is empty</h2><p className="mt-2 text-muted">Add a charity from a profile to start building your giving plan.</p><Link to="/search" className="mt-5 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg">Search charities</Link></div> : <div className="mt-8 space-y-4">{items.map((item) => { const charity = getCharity(item.slug); return <div key={item.slug} className="flex items-center justify-between rounded-xl border border-line bg-paper p-5"><div><h2 className="font-semibold text-navy">{charity?.name ?? item.slug}</h2><p className="mt-1 text-sm text-muted">${item.amount.toFixed(2)} · {item.frequency}</p></div><button type="button" onClick={() => remove(item.slug)} className="text-sm font-semibold text-primary hover:underline">Remove</button></div>; })}<div className="rounded-xl border border-line bg-canvas p-5"><div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>${total.toFixed(2)}</span></div><div className="mt-2 flex justify-between text-sm text-muted"><span>Fee coverage</span><span>${fees.toFixed(2)}</span></div><div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold text-navy"><span>Total</span><span>${(total + fees).toFixed(2)}</span></div><button type="button" onClick={clear} className="mt-5 text-sm font-semibold text-primary hover:underline">Clear basket</button></div></div>}</main>;
}
