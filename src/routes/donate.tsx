import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MapPin, ShoppingBasket } from "lucide-react";
import { Logo } from "@/components/logo";
import { StarRating } from "@/components/star-rating";
import { getList, listCharities } from "@/data/lists";
import { formatUsd } from "@/lib/utils";
import { subtotal, useBasket } from "@/lib/basket-store";

const PRESETS = [25, 50, 100, 250];
const campaign = getList("immigrant-support");
const charities = campaign ? listCharities(campaign) : [];

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate to Immigrant Support | Charity Navigator" },
      {
        name: "description",
        content:
          "Choose a highly rated organization supporting immigrants and displaced communities, select a one-time gift, and continue directly to card checkout.",
      },
    ],
  }),
  component: DonateLandingPage,
});

function DonateLandingPage() {
  const navigate = useNavigate();
  const items = useBasket((state) => state.items);
  const add = useBasket((state) => state.add);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [customSelected, setCustomSelected] = useState(false);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);
  const selectedCharity = charities.find((charity) => charity.slug === selectedSlug);
  const enteredAmount = customSelected ? Number(customAmount) : amount;
  const validAmount =
    Number.isFinite(enteredAmount) && enteredAmount >= 1 && enteredAmount <= 100000;
  const giftAmount = validAmount ? Math.round(enteredAmount * 100) / 100 : 0;
  const basketTotal = subtotal(items);

  useEffect(() => setMounted(true), []);

  function submitGift(goToCheckout: boolean) {
    if (!selectedCharity || !validAmount) return;
    add({ slug: selectedCharity.slug, amount: giftAmount, frequency: "once" });

    if (goToCheckout) {
      void navigate({ to: "/basket" });
      return;
    }

    setNotice(
      `${formatUsd(giftAmount, 2)} added for ${selectedCharity.name}. Choose another organization or continue to payment.`,
    );
    setSelectedSlug("");
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitGift(true);
  }

  function chooseFromCard(slug: string) {
    setSelectedSlug(slug);
    setNotice("");
    document
      .getElementById("donation-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-dvh bg-paper pb-28">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <Link
            to="/basket"
            className="relative inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-navy hover:bg-canvas"
            aria-label={
              mounted && items.length > 0 ? `Giving Basket, ${items.length} gifts` : "Giving Basket"
            }
          >
            <ShoppingBasket size={18} />
            <span>Basket</span>
            {mounted && items.length > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-fg">
                {items.length}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <section className="border-b border-line bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Where to give now
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-navy sm:text-5xl">
              Immigrant Support in the United States
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Choose one of five highly rated U.S. charities supporting immigrants and displaced
              people. Pick a gift and continue straight to card checkout.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-navy sm:mt-6">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck size={17} className="text-primary" /> Five featured organizations
              </span>
              <span className="inline-flex items-center gap-2">
                <BadgeCheck size={17} className="text-primary" /> One-time USD gifts
              </span>
            </div>
          </div>

          <section
            id="donation-form"
            className="scroll-mt-24 rounded-2xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-6"
            aria-labelledby="donation-form-title"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Make your gift
              </p>
              <h2
                id="donation-form-title"
                className="mt-1 font-display text-2xl font-semibold text-navy"
              >
                Choose a charity and amount
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Your selected gift goes directly to the USD card checkout.
              </p>
            </div>

            <form className="mt-4 space-y-3" onSubmit={submitForm}>
              <label htmlFor="campaign-charity" className="block text-sm font-semibold text-navy">
                Organization
                <select
                  id="campaign-charity"
                  required
                  value={selectedSlug}
                  onChange={(event) => {
                    setSelectedSlug(event.target.value);
                    setNotice("");
                  }}
                  className="mt-1 h-11 w-full rounded-md border border-line bg-paper px-3 text-base font-normal outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select an organization
                  </option>
                  {charities.map((charity) => (
                    <option key={charity.slug} value={charity.slug}>
                      {charity.name} · {charity.overall}/100
                    </option>
                  ))}
                </select>
              </label>

              {selectedCharity ? (
                <p className="rounded-md bg-canvas px-3 py-2 text-sm leading-relaxed text-muted">
                  {selectedCharity.mission}
                </p>
              ) : null}

              <fieldset>
                <legend className="text-sm font-semibold text-navy">Gift amount · USD</legend>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                        setCustomSelected(false);
                      }}
                      aria-pressed={!customSelected && amount === preset}
                      className={`h-11 rounded-md border text-sm font-semibold transition-colors ${
                        !customSelected && amount === preset
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-line bg-paper text-navy hover:border-primary"
                      }`}
                    >
                      {formatUsd(preset)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSelected(true);
                      setCustomAmount("");
                    }}
                    aria-pressed={customSelected}
                    className={`h-11 rounded-md border text-sm font-semibold transition-colors ${
                      customSelected
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-line bg-paper text-navy hover:border-primary"
                    }`}
                  >
                    Other
                  </button>
                </div>
              </fieldset>

              <label
                htmlFor="campaign-custom-amount"
                className="block text-sm font-medium text-navy"
              >
                Other amount
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    $
                  </span>
                  <input
                    id="campaign-custom-amount"
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(event) => {
                      setCustomAmount(event.target.value);
                      setCustomSelected(true);
                    }}
                    placeholder="0.00"
                    className="h-11 w-full rounded-md border border-line bg-paper pl-7 pr-3 text-base outline-none focus:border-primary"
                  />
                </div>
              </label>

              <p className="text-xs text-muted">
                One-time gift. You can choose another organization before checkout.
              </p>
              {notice ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-md bg-canvas px-3 py-2 text-sm text-navy"
                >
                  {notice}
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={!selectedCharity || !validAmount}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Donate {validAmount ? formatUsd(giftAmount, 2) : ""}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  disabled={!selectedCharity || !validAmount}
                  onClick={() => submitGift(false)}
                  className="h-12 rounded-md border border-line px-4 text-sm font-semibold text-navy hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to basket &amp; choose another
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      <section id="campaign-charities" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Featured organizations
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-navy">
            Compare the organizations
          </h2>
          <p className="mt-2 text-muted">
            Sorted from highest to lowest Charity Navigator rating. Select Donate to choose an
            organization above; you can review its mission before continuing.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charities.map((charity, index) => {
            const isSelected = selectedSlug === charity.slug;
            return (
              <article
                key={charity.slug}
                className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-paper transition-shadow ${
                  isSelected
                    ? "border-primary ring-1 ring-primary shadow-[var(--shadow-card)]"
                    : "border-line shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)]"
                }`}
              >
                <div className="relative aspect-16/9 overflow-hidden">
                  <img
                    src={charity.photo}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-3 top-3 rounded-sm bg-paper/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
                    {index === 0 ? "Highest rated · " : ""}
                    {charity.cause}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <StarRating score={charity.overall} size={14} />
                    <span className="text-sm font-semibold tabular-nums text-navy">
                      {charity.overall}
                      <span className="text-xs font-medium text-muted">/100</span>
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug text-navy">
                    {charity.name}
                  </h3>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <MapPin size={13} /> {charity.city}, {charity.state}
                  </p>
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink/80">
                    {charity.mission}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <span className="text-xs font-medium text-muted">One-time USD gift</span>
                    <button
                      type="button"
                      onClick={() => chooseFromCard(charity.slug)}
                      aria-label={
                        isSelected ? `${charity.name} selected` : `Donate to ${charity.name}`
                      }
                      aria-pressed={isSelected}
                      className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
                    >
                      {isSelected ? "Selected" : "Donate"}
                      {!isSelected ? <ArrowRight size={15} /> : null}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          Charity Navigator ratings are informational and are not an endorsement. Review each
          organization’s mission and giving details before completing your gift.
        </p>
      </section>

      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Charity Navigator · Giving Basket</span>
          <span>Ratings are informational. Gifts are one-time USD donations.</span>
        </div>
      </footer>

      {mounted && items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lift)] backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">
                Basket · {items.length} {items.length === 1 ? "gift" : "gifts"}
              </p>
              <p className="text-xs text-muted">{formatUsd(basketTotal, 2)} in one-time gifts</p>
            </div>
            <Link
              to="/basket"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
            >
              Continue to payment <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
