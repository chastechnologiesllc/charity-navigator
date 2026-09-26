import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CharityCard } from "@/components/charity-card";
import { getList, listCharities } from "@/data/lists";

export const Route = createFileRoute("/lists/$slug")({ component: ListDetailPage });

function ListDetailPage() {
  const { slug } = Route.useParams();
  const list = getList(slug);

  if (!list) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy">List not found</h1>
        <Link to="/discover" className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg">
          Browse curated lists
        </Link>
      </main>
    );
  }

  const charities = listCharities(list);
  const photos = list.photos?.length ? list.photos : [list.photo];

  return (
    <main>
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={15} /> Back to curated lists
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{list.kicker}</p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">{list.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{list.description}</p>
            </div>
            <div className="grid aspect-16/9 grid-cols-3 grid-rows-2 overflow-hidden rounded-xl shadow-[var(--shadow-lift)]">
              {photos.slice(0, 5).map((photo, index) => (
                <img
                  key={photo}
                  src={photo}
                  alt=""
                  className={`h-full w-full object-cover ${index === 0 ? "row-span-2" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {charities[0] ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="flex flex-col gap-5 rounded-2xl bg-navy p-6 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-fg">Ready to help today?</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">Turn compassion into action.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/75">Choose a trusted organization below and build a USD card donation in your Giving Basket.</p>
            </div>
            <Link to="/charity/$slug" params={{ slug: charities[0].slug }} className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-primary-hover">Donate now</Link>
          </div>
        </section>
      ) : null}
      {photos.length > 5 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Ad preview image set</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-navy">More moments of support</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.slice(5).map((photo) => (
              <img key={photo} src={photo} alt="Community support and outreach" className="aspect-4/3 w-full rounded-xl object-cover" />
            ))}
          </div>
        </section>
      ) : null}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Featured organizations</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-navy">Where support can start</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charities.map((charity) => <CharityCard key={charity.slug} charity={charity} />)}
        </div>
      </section>
    </main>
  );
}
