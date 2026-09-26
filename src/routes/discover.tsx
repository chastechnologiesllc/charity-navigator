import { createFileRoute } from "@tanstack/react-router";
import { ListCard } from "@/components/list-card";
import { CAUSEWAY_LISTS, DISCOVER_LISTS, THEME_LISTS } from "@/data/lists";

export const Route = createFileRoute("/discover")({ component: DiscoverPage });

function Collection({ title, eyebrow, lists }: { title: string; eyebrow: string; lists: typeof DISCOVER_LISTS }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-navy">{title}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => <ListCard key={list.slug} list={list} />)}
      </div>
    </section>
  );
}

function DiscoverPage() {
  return (
    <main>
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Curated giving guides</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">Discover charities</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">Explore current-response lists, analyst-curated funds, and cause-based collections.</p>
        </div>
      </section>
      <Collection title="Where to Give Now" eyebrow="Crisis response" lists={DISCOVER_LISTS} />
      <div className="border-t border-line bg-canvas"><Collection title="Causeway Funds" eyebrow="Analyst curated" lists={CAUSEWAY_LISTS} /></div>
      <Collection title="By Cause" eyebrow="Explore causes" lists={THEME_LISTS} />
    </main>
  );
}
