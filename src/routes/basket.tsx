import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCharity } from "@/data/charities";
import { feeAmount, subtotal, useBasket } from "@/lib/basket-store";
import {
  authorizeFlutterwavePayment,
  getFlutterwaveCheckoutConfig,
  initiateFlutterwavePayment,
  type ChargeAction,
} from "@/lib/flutterwave";
import { encryptCardDetails, encryptPin } from "@/lib/flutterwave-encryption";

export const Route = createFileRoute("/basket")({ component: BasketPage });

type CheckoutConfig = Awaited<ReturnType<typeof getFlutterwaveCheckoutConfig>>;
type AuthorizationKind = "pin" | "otp" | "avs";

function BasketPage() {
  const {
    items,
    remove,
    clear,
    coverFees,
    setCoverFees,
    tribute,
    setTribute,
    anonymous,
    setAnonymous,
  } = useBasket();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [address, setAddress] = useState({
    city: "",
    country: "US",
    line1: "",
    line2: "",
    postal_code: "",
    state: "",
  });
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [authorizationKind, setAuthorizationKind] = useState<AuthorizationKind | null>(null);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const total = subtotal(items);
  const fees = coverFees ? feeAmount(items) : 0;
  const grandTotal = total + fees;
  const hasMonthly = items.some((item) => item.frequency === "monthly");

  useEffect(() => {
    let active = true;
    void getFlutterwaveCheckoutConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => {
        if (active) setConfig(null);
      })
      .finally(() => {
        if (active) setLoadingConfig(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleAction(result: { reference: string; action: ChargeAction }) {
    setReference(result.reference);
    setError("");
    if (result.action.kind === "redirect") {
      window.location.assign(result.action.url);
      return;
    }
    if (result.action.kind === "authorize") {
      setAuthorizationKind(result.action.type);
      return;
    }
    if (result.action.kind === "success" || result.action.kind === "pending") {
      window.location.assign(`/payment-result?reference=${encodeURIComponent(result.reference)}`);
    }
  }

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!config?.configured || !config.encryptionKey) {
      setError("V4 card checkout is not configured. Please contact the site team.");
      return;
    }
    setStarting(true);
    try {
      const expiryDigits = expiry.replace(/\D/g, "");
      const expiryMonth = expiryDigits.slice(0, 2);
      const expiryYear = expiryDigits.slice(2);
      const card = await encryptCardDetails(
        { number: cardNumber, expiryMonth, expiryYear, cvv },
        config.encryptionKey,
      );
      setCardNumber("");
      setExpiry("");
      setCvv("");
      const result = await initiateFlutterwavePayment({
        data: {
          items,
          coverFees,
          note: tribute,
          anonymous,
          customer: {
            email,
            name,
          },
          card,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      handleAction(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not start the secure checkout. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function submitAuthorization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference || !authorizationKind || !config?.encryptionKey) return;
    setError("");
    setStarting(true);
    try {
      const authorization =
        authorizationKind === "pin"
          ? { type: "pin" as const, ...(await encryptPin(pin, config.encryptionKey)) }
          : authorizationKind === "otp"
            ? { type: "otp" as const, code: otp.trim() }
            : { type: "avs" as const, address };
      const result = await authorizeFlutterwavePayment({ data: { reference, authorization } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPin("");
      setOtp("");
      setAuthorizationKind(null);
      handleAction(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not authorize this payment. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Giving tools</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-navy">Giving Basket</h1>
      <p className="mt-4 text-lg text-muted">
        Review your support and complete one secure USD card donation.
      </p>
      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-canvas p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-navy">Your basket is empty</h2>
          <p className="mt-2 text-muted">
            Add a charity from a profile to start building your giving plan.
          </p>
          <Link
            to="/search"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg"
          >
            Search charities
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            {items.map((item) => {
              const charity = getCharity(item.slug);
              return (
                <div
                  key={item.slug}
                  className="flex items-center justify-between rounded-xl border border-line bg-paper p-5"
                >
                  <div>
                    <h2 className="font-semibold text-navy">{charity?.name ?? item.slug}</h2>
                    <p className="mt-1 text-sm text-muted">
                      ${item.amount.toFixed(2)} ·{" "}
                      {item.frequency === "monthly" ? "monthly" : "one-time"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.slug)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
            <div className="rounded-xl border border-line bg-canvas p-5">
              <label className="flex items-center gap-3 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(event) => setCoverFees(event.target.checked)}
                />
                Cover payment processing fees
              </label>
              <label className="mt-5 block text-sm font-medium text-navy">
                Note to the giving team <span className="font-normal text-muted">(optional)</span>
                <textarea
                  value={tribute}
                  onChange={(event) => setTribute(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Share what inspired this gift"
                  className="mt-1 w-full rounded-md border border-line bg-paper p-3 outline-none focus:border-primary"
                />
              </label>
              <label className="mt-4 flex items-center gap-3 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(event) => setAnonymous(event.target.checked)}
                />
                Keep my gift anonymous
              </label>
              <button
                type="button"
                onClick={clear}
                className="mt-5 text-sm font-semibold text-primary hover:underline"
              >
                Clear basket
              </button>
            </div>
          </section>

          <aside className="h-fit rounded-xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]">
            <div className="mt-6 flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-muted">
              <span>Fee coverage</span>
              <span>${fees.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-semibold text-navy">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)} USD</span>
            </div>
            {hasMonthly ? (
              <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                Monthly items need to be changed to one-time before this USD card checkout can
                continue.
              </p>
            ) : null}

            {authorizationKind ? (
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => void submitAuthorization(event)}
              >
                <h2 className="font-semibold text-navy">Complete card authorization</h2>
                {authorizationKind === "pin" ? (
                  <label className="block text-sm font-medium text-navy">
                    Card PIN
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="off"
                      value={pin}
                      onChange={(event) => setPin(event.target.value)}
                      minLength={4}
                      maxLength={6}
                      className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                    />
                  </label>
                ) : null}
                {authorizationKind === "otp" ? (
                  <label className="block text-sm font-medium text-navy">
                    One-time passcode
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      minLength={4}
                      maxLength={12}
                      className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                    />
                  </label>
                ) : null}
                {authorizationKind === "avs" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(["line1", "line2", "city", "state", "postal_code", "country"] as const).map(
                      (field) => (
                        <label
                          key={field}
                          className="block text-sm font-medium capitalize text-navy"
                        >
                          {field.replace("_", " ")}
                          <input
                            required={field !== "line2"}
                            maxLength={field === "country" ? 2 : 120}
                            value={address[field]}
                            onChange={(event) =>
                              setAddress((current) => ({ ...current, [field]: event.target.value }))
                            }
                            className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                          />
                        </label>
                      ),
                    )}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={starting}
                  className="h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-fg disabled:opacity-50"
                >
                  {starting ? "Submitting…" : "Continue authorization"}
                </button>
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => {
                    setAuthorizationKind(null);
                    setReference("");
                  }}
                  className="w-full text-sm font-semibold text-primary hover:underline"
                >
                  Cancel and return to basket
                </button>
              </form>
            ) : (
              <form className="mt-6" onSubmit={(event) => void startCheckout(event)}>
                <label className="block text-sm font-medium text-navy">
                  Cardholder name <span className="font-normal text-muted">(optional)</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={120}
                    autoComplete="name"
                    className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-navy">
                  Receipt email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-navy">
                  Card number
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value)}
                    maxLength={23}
                    placeholder="1234 5678 9012 3456"
                    className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                  />
                </label>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-navy">
                    Expiry date
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                        setExpiry(
                          digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                        );
                      }}
                      maxLength={5}
                      placeholder="MM/YY"
                      className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block text-sm font-medium text-navy">
                    CVV
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value)}
                      maxLength={4}
                      className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 outline-none focus:border-primary"
                    />
                  </label>
                </div>
                {error ? (
                  <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
                    {error}
                  </p>
                ) : null}
                {!loadingConfig && !config?.configured ? (
                  <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                    Card payments are temporarily unavailable. Please try again later.
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={
                    starting ||
                    loadingConfig ||
                    !config?.configured ||
                    hasMonthly ||
                    !email.includes("@")
                  }
                  className="mt-6 h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-fg hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting
                    ? "Encrypting and starting payment…"
                    : `Donate $${grandTotal.toFixed(2)} by card`}
                </button>
              </form>
            )}
            {error && authorizationKind ? (
              <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </main>
  );
}
