import type { Charity } from "@/data/types";
import { scoredBeacons } from "@/lib/ratings";

export function BeaconPanel({ charity }: { charity: Charity }) {
  const beacons = scoredBeacons(charity);
  return (
    <div className="space-y-4">
      {beacons.map((b) => (
        <div key={b.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <p className={`text-sm font-semibold ${b.className}`}>{b.label}</p>
            <p className="text-sm font-semibold tabular-nums text-navy">
              {b.score == null ? "Not scored" : `${b.score}/100`}
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full ${b.bar}`}
              style={{ width: `${b.score ?? 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{b.copy}</p>
        </div>
      ))}
    </div>
  );
}
