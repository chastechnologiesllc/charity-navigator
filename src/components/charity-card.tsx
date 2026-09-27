import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Charity } from "@/data/types";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";

export function CharityCard({ charity, className }: { charity: Charity; className?: string }) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <Link
        to="/charity/$slug"
        params={{ slug: charity.slug }}
        search={{ donate: undefined }}
        className="relative block aspect-16/9 overflow-hidden"
      >
        <img
          src={charity.photo}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-sm bg-paper/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
          {charity.cause}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <StarRating score={charity.overall} size={14} />
          <span className="text-sm font-semibold tabular-nums text-navy">{charity.overall}</span>
        </div>
        <Link
          to="/charity/$slug"
          params={{ slug: charity.slug }}
          search={{ donate: undefined }}
          className="font-display text-lg font-semibold leading-snug text-navy hover:text-primary"
        >
          {charity.name}
        </Link>
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin size={13} />
          {charity.city}, {charity.state}
        </p>
        <p className="line-clamp-3 text-sm leading-relaxed text-ink/80">{charity.mission}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <Link
            to="/charity/$slug"
            params={{ slug: charity.slug }}
            search={{ donate: undefined }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View rating
          </Link>
          <Link
            to="/charity/$slug"
            params={{ slug: charity.slug }}
            search={{ donate: "1" }}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
          >
            Choose amount
          </Link>
        </div>
      </div>
    </article>
  );
}
