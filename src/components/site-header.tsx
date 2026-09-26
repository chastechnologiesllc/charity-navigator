import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBasket, X, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { useBasket } from "@/lib/basket-store";

const NAV = [
  {
    label: "Discover",
    href: "/discover",
    items: [
      { label: "Discover Charities", href: "/discover", hint: "Curated lists by cause and crisis" },
      { label: "Highly Rated", href: "/lists/highly-rated", hint: "Perfect and near-perfect scores" },
      { label: "Causeway Funds", href: "/discover", hint: "Analyst-curated giving portfolios" },
      { label: "Search all charities", href: "/search", hint: "Browse by name, EIN, or cause" },
    ],
  },
  {
    label: "Ratings",
    href: "/methodology",
    items: [
      { label: "How we rate", href: "/methodology", hint: "Encompass Rating System" },
      { label: "What the stars mean", href: "/methodology", hint: "0–4 stars from a 0–100 score" },
    ],
  },
  {
    label: "Donor Resources",
    href: "/donor-resources",
    items: [
      { label: "Giving 101", href: "/giving-101", hint: "Start here if you’re new to giving" },
      { label: "Donor tools", href: "/donor-resources", hint: "Maximize every donation" },
      { label: "Giving Basket", href: "/basket", hint: "Give to several charities at once" },
    ],
  },
  {
    label: "About Us",
    href: "/about",
    items: [
      { label: "Our mission", href: "/about", hint: "Make impactful giving easier for all" },
      { label: "History", href: "/about", hint: "From 2001 to Encompass" },
    ],
  },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const count = useBasket((s) => s.items.length);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    void navigate({ to: "/search", search: { q: q || undefined } });
    setSearchOpen(false);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <div key={item.label} className="group relative">
              <Link
                to={item.href}
                className="inline-flex h-10 items-center gap-1 rounded-md px-3 text-[15px] font-semibold text-navy hover:bg-canvas"
              >
                {item.label}
                <ChevronDown size={14} className="text-muted" />
              </Link>
              <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-1 rounded-lg border border-line bg-paper p-2 opacity-0 shadow-[var(--shadow-lift)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {item.items.map((sub) => (
                  <Link
                    key={sub.label}
                    to={sub.href}
                    className="block rounded-md px-3 py-2.5 hover:bg-canvas"
                  >
                    <div className="text-sm font-semibold text-navy">{sub.label}</div>
                    <div className="text-xs text-muted">{sub.hint}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-md text-navy hover:bg-canvas"
            aria-label="Open search"
          >
            <Search size={20} />
          </button>
          <Link
            to="/basket"
            className="relative inline-flex size-10 items-center justify-center rounded-md text-navy hover:bg-canvas"
            aria-label="Giving Basket"
          >
            <ShoppingBasket size={20} />
            {mounted && count > 0 ? (
              <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-fg">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            to="/charity/$slug"
            params={{ slug: "charity-navigator" }}
            search={{ donate: "1" }}
            className="hidden h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover sm:inline-flex"
          >
            Donate
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md text-navy hover:bg-canvas lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {searchOpen ? (
        <form
          onSubmit={onSearch}
          className="border-t border-line bg-paper px-4 py-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl gap-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search charities by name, cause, or EIN"
              className="h-11 flex-1 rounded-md border border-line bg-canvas px-4 text-base outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="h-11 rounded-md bg-navy px-5 text-sm font-semibold text-paper"
            >
              Search
            </button>
          </div>
        </form>
      ) : null}
      {open ? (
        <div className="border-t border-line bg-paper px-4 py-4 lg:hidden">
          {NAV.map((item) => (
            <div key={item.label} className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {item.label}
              </p>
              {item.items.map((sub) => (
                <Link
                  key={sub.label}
                  to={sub.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-[15px] font-semibold text-navy hover:bg-canvas"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            to="/charity/$slug"
            params={{ slug: "charity-navigator" }}
            search={{ donate: "1" }}
            onClick={() => setOpen(false)}
            className="mt-2 flex h-11 items-center justify-center rounded-md bg-primary font-semibold text-primary-fg"
          >
            Donate to Charity Navigator
          </Link>
        </div>
      ) : null}
    </header>
  );
}
