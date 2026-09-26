import { createFileRoute, Link } from "@tanstack/react-router";
import { CHARITIES, searchCharities } from "@/data/charities";
import { CAUSES } from "@/data/types";
import { CharityCard } from "@/components/charity-card";
import { HorizonSearch } from "@/components/horizon-search";
import { starsFromScore } from "@/lib/ratings";

type Search = {
  q?: string;
  cause?: string;
  rating?: string;
  size?: string;
  sort?: string;
  mode?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cause: typeof s.cause === "string" ? s.cause : undefined,
    rating: typeof s.rating === "string" ? s.rating : undefined,
    size: typeof s.size === "string" ? s.size : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    mode: typeof s.mode === "string" ? s.mode : undefined,
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, cause, rating, size, sort, mode } = Route.useSearch();
  const navigate = Route.useNavigate();

  const searched = q ? searchCharities(q) : CHARITIES;
  const filtered = searched.filter((c) => {
    if (cause && c.cause !== cause) return false;
    if (size && c.size !== size) return false;
    if (rating === "4" && starsFromScore(c.overall) < 4) return false;
    if (rating === "3" && starsFromScore(c.overall) < 3) return false;
    if (rating === "complete" && !c.completeProfile) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "finance") return b.financials.programPercent - a.financials.programPercent;
    return b.overall - a.overall;
  });

  function patch(next: Partial<Search>) {
    void navigate({
      search: (prev) => ({ ...prev, ...next }),
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Directory</p>
      <h1 className="mt-1 font-display text-4xl font-semibold">Search charities</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {sorted.length} of {CHARITIES.length} rated organizations
        {q ? ` matching “${q}”` : ""}.
      </p>

      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          patch({ q: String(fd.get("q") || "") || undefined });
        }}
      >
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Name, cause, city, or EIN"
          className="h-12 flex-1 rounded-md border border-line bg-paper px-4 text-base outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="h-12 rounded-md bg-primary px-6 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
        >
          Search
        </button>
      </form>

      <details className="mt-8 rounded-xl border border-line bg-canvas p-4" open={mode === "horizon"}>
        <summary className="cursor-pointer font-display text-lg font-semibold text-navy">
          Ask Horizon for personalized recommendations
        </summary>
        <div className="mt-4">
          <HorizonSearch initialQuery={q ?? ""} />
        </div>
      </details>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <FilterGroup label="Cause">
            <FilterChip active={!cause} onClick={() => patch({ cause: undefined })}>
              All
            </FilterChip>
            {CAUSES.map((c) => (
              <FilterChip key={c} active={cause === c} onClick={() => patch({ cause: c })}>
                {c}
              </FilterChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Rating">
            <FilterChip active={!rating} onClick={() => patch({ rating: undefined })}>
              Any
            </FilterChip>
            <FilterChip active={rating === "4"} onClick={() => patch({ rating: "4" })}>
              4 stars
            </FilterChip>
            <FilterChip active={rating === "3"} onClick={() => patch({ rating: "3" })}>
              3 stars & up
            </FilterChip>
            <FilterChip active={rating === "complete"} onClick={() => patch({ rating: "complete" })}>
              Complete profile
            </FilterChip>
          </FilterGroup>
          <FilterGroup label="Size">
            <FilterChip active={!size} onClick={() => patch({ size: undefined })}>
              Any
            </FilterChip>
            {(["small", "mid", "large"] as const).map((s) => (
              <FilterChip key={s} active={size === s} onClick={() => patch({ size: s })}>
                {s === "mid" ? "Mid-size" : s[0].toUpperCase() + s.slice(1)}
              </FilterChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Sort">
            <FilterChip active={!sort || sort === "score"} onClick={() => patch({ sort: undefined })}>
              Highest rated
            </FilterChip>
            <FilterChip active={sort === "name"} onClick={() => patch({ sort: "name" })}>
              Name
            </FilterChip>
            <FilterChip active={sort === "finance"} onClick={() => patch({ sort: "finance" })}>
              Program %
            </FilterChip>
          </FilterGroup>
        </aside>
        <div>
          {sorted.length === 0 ? (
            <div className="rounded-xl border border-line bg-canvas px-6 py-16 text-center">
              <p className="font-display text-xl font-semibold text-navy">No matching charities</p>
              <p className="mt-2 text-sm text-muted">Try a broader cause or clear your filters.</p>
              <Link to="/search" className="mt-4 inline-block text-sm font-semibold text-primary">
                Clear search
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {sorted.map((c) => (
                <CharityCard key={c.slug} charity={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-full px-3 text-xs font-semibold ${
        active ? "bg-navy text-paper" : "bg-paper text-navy ring-1 ring-line hover:ring-primary"
      }`}
    >
      {children}
    </button>
  );
}
