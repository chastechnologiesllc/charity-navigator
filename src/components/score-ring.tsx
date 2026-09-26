import { cn } from "@/lib/utils";
import { ratingLabel } from "@/lib/ratings";

export function ScoreRing({
  score,
  size = 88,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const p = Math.max(0, Math.min(100, score));
  const style = {
    width: size,
    height: size,
    background: `conic-gradient(var(--color-primary) ${p * 3.6}deg, var(--color-track) 0)`,
  } as const;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div className="rounded-full" style={style} />
      <div
        className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-paper"
      >
        <span className="font-display text-[1.35rem] font-semibold leading-none text-navy tabular-nums">
          {Math.round(score)}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          {ratingLabel(score)}
        </span>
      </div>
    </div>
  );
}
