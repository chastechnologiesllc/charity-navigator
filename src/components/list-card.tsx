import { Link } from "@tanstack/react-router";
import type { CharityList } from "@/data/types";
import { cn } from "@/lib/utils";

export function ListCard({
  list,
  className,
}: {
  list: CharityList;
  className?: string;
}) {
  return (
    <Link
      to="/lists/$slug"
      params={{ slug: list.slug }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="relative aspect-16/9 overflow-hidden">
        <img
          src={list.photo}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-sm bg-navy/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-paper">
          {list.kicker}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-xl font-semibold leading-snug text-navy group-hover:text-primary">
          {list.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{list.description}</p>
      </div>
    </Link>
  );
}
