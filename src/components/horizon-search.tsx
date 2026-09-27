import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, LoaderCircle } from "lucide-react";
import { askHorizon, type HorizonResult } from "@/lib/horizon";
import { getCharity } from "@/data/charities";
import { StarRating } from "./star-rating";

export function HorizonSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HorizonResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await askHorizon({ data: { query: q } });
      if (!res.ok) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
      }
    } catch {
      setError("Horizon is unavailable right now. Try keyword search instead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I want to help veterans experiencing homelessness…"
          className="h-12 flex-1 rounded-md border border-line bg-paper px-4 text-base outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-navy px-5 text-sm font-semibold text-paper hover:bg-navy-mid disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Ask Horizon
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-poor">{error}</p> : null}
      {result ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-ink">{result.summary}</p>
          <ul className="mt-4 space-y-3">
            {result.matches.map((m) => {
              const c = getCharity(m.slug);
              if (!c) return null;
              return (
                <li key={m.slug}>
                  <Link
                    to="/charity/$slug"
                    params={{ slug: c.slug }}
                    search={{ donate: undefined }}
                    className="flex gap-4 rounded-lg border border-line bg-paper p-3 hover:border-primary"
                  >
                    <img
                      src={c.photo}
                      alt=""
                      className="hidden h-16 w-24 rounded-md object-cover sm:block"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold text-navy">{c.name}</span>
                        <StarRating score={c.overall} size={13} />
                        <span className="text-xs tabular-nums text-muted">{c.overall}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{m.reason}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
