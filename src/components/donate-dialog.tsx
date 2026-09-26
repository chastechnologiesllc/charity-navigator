import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { Charity } from "@/data/types";
import { useBasket, type Frequency } from "@/lib/basket-store";
import { formatUsd } from "@/lib/utils";
import { StarRating } from "./star-rating";

const PRESETS = [25, 50, 100, 250];

export function DonateDialog({
  charity,
  open,
  onClose,
}: {
  charity: Charity;
  open: boolean;
  onClose: () => void;
}) {
  const add = useBasket((s) => s.add);
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("once");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const value = custom ? Number(custom) || 0 : amount;

  function submit(goToBasket: boolean) {
    if (value < 1) return;
    add({ slug: charity.slug, amount: value, frequency });
    onClose();
    if (goToBasket) void navigate({ to: "/basket" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-navy/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-title"
        className="relative w-full max-w-md rounded-t-2xl bg-paper p-6 shadow-[var(--shadow-lift)] sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-navy"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Giving Basket</p>
        <h2 id="donate-title" className="mt-1 font-display text-2xl font-semibold text-navy">
          Donate to {charity.name}
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <StarRating score={charity.overall} />
          <span className="text-sm text-muted">
            {charity.overall} · {charity.city}, {charity.state}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setAmount(n);
                setCustom("");
              }}
              className={`h-11 rounded-md border text-sm font-semibold ${
                !custom && amount === n
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-line bg-canvas text-navy hover:border-primary"
              }`}
            >
              {formatUsd(n)}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm font-medium text-navy">
          Other amount
          <input
            type="number"
            min={1}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Enter amount"
            className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 text-base outline-none focus:border-primary"
          />
        </label>
        <div className="mt-4 flex rounded-md border border-line p-1">
          {(
            [
              ["once", "One-time"],
              ["monthly", "Monthly"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFrequency(id)}
              className={`h-9 flex-1 rounded-sm text-sm font-semibold ${
                frequency === id ? "bg-navy text-paper" : "text-muted hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={value < 1}
            onClick={() => submit(true)}
            className="h-11 rounded-md bg-primary text-sm font-semibold text-primary-fg hover:bg-primary-hover disabled:opacity-50"
          >
            Add {formatUsd(value)} {frequency === "monthly" ? "/ month" : ""} to basket
          </button>
          <button
            type="button"
            disabled={value < 1}
            onClick={() => submit(false)}
            className="h-11 rounded-md border border-line text-sm font-semibold text-navy hover:bg-canvas disabled:opacity-50"
          >
            Add and keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
