import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

const COLS = [
  {
    title: "Discover",
    links: [
      { label: "Search charities", to: "/search" },
      { label: "Curated lists", to: "/discover" },
      { label: "Highly rated", to: "/lists/highly-rated" },
      { label: "End Hunger Fund", to: "/lists/end-hunger" },
    ],
  },
  {
    title: "Ratings",
    links: [
      { label: "Encompass methodology", to: "/methodology" },
      { label: "Four beacons", to: "/methodology" },
      { label: "What stars mean", to: "/methodology" },
    ],
  },
  {
    title: "Give",
    links: [
      { label: "Giving Basket", to: "/basket" },
      { label: "Giving 101", to: "/giving-101" },
      { label: "Donor resources", to: "/donor-resources" },
      { label: "Support our work", to: "/charity/charity-navigator" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Who we are", to: "/about" },
      { label: "Our values", to: "/about" },
      { label: "History", to: "/about" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-1">
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
            A research tool for anyone looking to make a difference. Unbiased ratings so you can give with confidence.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper/50">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-paper/85 hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-paper/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 Charity Navigator. 501(c)(3) nonprofit. EIN 13-4148824.</p>
          <p>Ratings are informational. This is an independent recreation for demonstration.</p>
        </div>
      </div>
    </footer>
  );
}
