import { Star } from "lucide-react";
import { starsFromScore } from "@/lib/ratings";
import { cn } from "@/lib/utils";

export function StarRating({
  score,
  size = 16,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const filled = starsFromScore(score);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${filled} out of 4 stars`}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.6}
          className={i < filled ? "fill-star text-star" : "fill-transparent text-line"}
        />
      ))}
    </span>
  );
}
