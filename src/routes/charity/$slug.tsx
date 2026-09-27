import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { getCharity, similarCharities } from "@/data/charities";
import { CharityCard } from "@/components/charity-card";
import { StarRating } from "@/components/star-rating";
import { DonateDialog } from "@/components/donate-dialog";

export const Route = createFileRoute("/charity/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    donate: typeof search.donate === "string" ? search.donate : undefined,
  }),
  component: CharityDetailPage,
});

function CharityDetailPage() {
  const { slug } = Route.useParams();
  const { donate } = Route.useSearch();
  const charity = getCharity(slug);
  const [donateOpen, setDonateOpen] = useState(donate === "1");

  if (!charity) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy">Charity not found</h1>
        <Link
          to="/search"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg"
        >
          Search charities
        </Link>
      </main>
    );
  }

  return (
    <main>
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft size={15} /> Back to search
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <img
              src={charity.photo}
              alt=""
              className="aspect-16/9 w-full rounded-xl object-cover shadow-[var(--shadow-lift)]"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {charity.cause}
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">
                {charity.name}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-muted">
                <MapPin size={15} /> {charity.city}, {charity.state}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <StarRating score={charity.overall} size={19} />
                <span className="font-semibold text-navy">{charity.overall}/100</span>
              </div>
              <p className="mt-5 text-lg leading-relaxed text-muted">{charity.mission}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setDonateOpen(true)}
                  className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
                >
                  Donate
                </button>
                <a
                  href={charity.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-paper px-5 text-sm font-semibold text-navy hover:bg-canvas"
                >
                  Visit website <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-line bg-paper p-6">
          <h2 className="font-display text-2xl font-semibold text-navy">Programs</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {charity.programs.map((program) => (
              <li key={program} className="rounded-md bg-canvas px-4 py-3 text-sm text-ink">
                {program}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-paper p-6">
          <h2 className="font-display text-2xl font-semibold text-navy">Financial snapshot</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Program spending</dt>
              <dd className="mt-1 font-semibold text-navy">{charity.financials.programPercent}%</dd>
            </div>
            <div>
              <dt className="text-muted">Reporting year</dt>
              <dd className="mt-1 font-semibold text-navy">{charity.financials.year}</dd>
            </div>
            <div>
              <dt className="text-muted">Founded</dt>
              <dd className="mt-1 font-semibold text-navy">{charity.founded}</dd>
            </div>
            <div>
              <dt className="text-muted">EIN</dt>
              <dd className="mt-1 font-semibold text-navy">{charity.ein}</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-navy">Similar charities</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {similarCharities(charity).map((item) => (
            <CharityCard key={item.slug} charity={item} />
          ))}
        </div>
      </section>
      <DonateDialog charity={charity} open={donateOpen} onClose={() => setDonateOpen(false)} />
    </main>
  );
}
