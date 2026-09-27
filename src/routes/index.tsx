import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { DISCOVER_LISTS, CAUSEWAY_LISTS, listCharities } from "@/data/lists";
import { ListCard } from "@/components/list-card";
import { CharityCard } from "@/components/charity-card";
import { HorizonSearch } from "@/components/horizon-search";

export const Route = createFileRoute("/")({ component: Home });

const STATS = [
  { value: "25+", label: "Years" },
  { value: "8M+", label: "Visitors annually" },
  { value: "245K+", label: "Charities rated" },
  { value: "$338M+", label: "Donated via Giving Basket" },
];

const BASICS = [
  {
    title: "Giving 101",
    body: "Just starting out with giving? Look here for questions to ask a charity, strategies for maximizing your donation, and more.",
    to: "/giving-101",
  },
  {
    title: "Where to Give",
    body: "Discover and support organizations responding to current events and crises.",
    to: "/discover",
  },
  {
    title: "Donor Tools",
    body: "Whether you’re a new donor or a seasoned philanthropist, use these tools to help make the most of your giving.",
    to: "/donor-resources",
  },
];

const HOME_FEATURED_LIST = DISCOVER_LISTS.find((list) => list.slug === "immigrant-support");
const HOME_FEATURED_CHARITIES = HOME_FEATURED_LIST ? listCharities(HOME_FEATURED_LIST) : [];

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"search" | "horizon">("search");
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    void navigate({ to: "/search", search: { q: q.trim() || undefined } });
  }

  return (
    <div>
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your guide to intelligent giving
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-6xl">
            Search for Charities
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Explore charities that match your passions, view their ratings, and support them with
            your donation.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="mb-3 inline-flex rounded-md border border-line bg-paper p-1">
              <button
                type="button"
                onClick={() => setMode("search")}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-4 text-sm font-semibold ${
                  mode === "search" ? "bg-navy text-paper" : "text-muted"
                }`}
              >
                <Search size={14} />
                Search
              </button>
              <button
                type="button"
                onClick={() => setMode("horizon")}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-4 text-sm font-semibold ${
                  mode === "horizon" ? "bg-navy text-paper" : "text-muted"
                }`}
              >
                <Sparkles size={14} />
                Ask Horizon
              </button>
            </div>
            {mode === "search" ? (
              <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  aria-label="Search charities by name, cause, city, or EIN"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, cause, city, or EIN"
                  className="h-16 sm:flex-1 rounded-md border border-line bg-paper px-5 text-lg outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="h-13 rounded-md bg-primary px-6 text-base font-semibold text-primary-fg hover:bg-primary-hover"
                >
                  Search
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-line bg-paper p-4 text-left">
                <p className="mb-3 text-sm text-muted">
                  Try our AI-powered tool for personalized recommendations and data-driven insights.
                </p>
                <HorizonSearch />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              to="/discover"
              className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-paper px-7 text-base font-semibold text-navy hover:bg-canvas"
            >
              Explore charities
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Where to give now
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-navy">
              Immigrant Support in the United States
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              These featured organizations are sorted from highest to lowest rating. Choose a gift
              amount or add it to your basket and keep browsing.
            </p>
          </div>
          <Link
            to="/discover"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Browse all giving guides <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURED_CHARITIES.map((charity) => (
            <CharityCard key={charity.slug} charity={charity} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Expertly curated
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Curated giving guides</h2>
          </div>
          <Link
            to="/discover"
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {DISCOVER_LISTS.map((list) => (
            <ListCard key={list.slug} list={list} />
          ))}
        </div>
        <Link
          to="/discover"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary sm:hidden"
        >
          View all <ArrowRight size={14} />
        </Link>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Analyst curated
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold">Causeway Funds</h2>
            </div>
            <Link
              to="/discover"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {CAUSEWAY_LISTS.map((list) => (
              <ListCard key={list.slug} list={list} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Who we are</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Charity Navigator is a research tool for anyone looking to make a difference.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            You can use Charity Navigator to find and support thousands of charities that align with
            your passions and values. We use data from the IRS, partners, and the charities
            themselves to power our unbiased ratings so that you can give with confidence.
          </p>
          <Link
            to="/about"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Learn more about us <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-canvas px-5 py-6">
              <p className="font-display text-3xl font-semibold text-navy tabular-nums">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold">Donor Basics</h2>
            <Link
              to="/donor-resources"
              className="text-sm font-semibold text-primary hover:underline"
            >
              See more
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {BASICS.map((b) => (
              <Link
                key={b.title}
                to={b.to}
                className="rounded-xl border border-line bg-paper p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)]"
              >
                <h3 className="font-display text-xl font-semibold text-navy">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy text-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper/55">
              The smart, easy way to give
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-paper sm:text-4xl">
              Donate with the Giving Basket
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-paper/75">
              Charity Navigator’s Giving Basket empowers you to support multiple charities in one
              convenient checkout while controlling how much of your information you share with each
              organization.
            </p>
            <Link
              to="/basket"
              className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
            >
              Learn more
            </Link>
          </div>
          <img
            src="/images/hunger.jpg"
            alt="Volunteers packing donations"
            className="h-72 w-full rounded-xl object-cover sm:h-80"
          />
        </div>
      </section>
    </div>
  );
}
