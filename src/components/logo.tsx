import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5 no-underline", className)}
      aria-label="Charity Navigator home"
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle
          cx="18"
          cy="18"
          r="17"
          fill={inverted ? "#3f5df5" : "#001936"}
        />
        <circle cx="18" cy="18" r="12.5" stroke={inverted ? "#fff" : "#8aa4ff"} strokeWidth="1.2" />
        <path
          d="M18 6.5 L20.4 15.4 L29.5 18 L20.4 20.6 L18 29.5 L15.6 20.6 L6.5 18 L15.6 15.4 Z"
          fill={inverted ? "#fff" : "#3f5df5"}
        />
        <circle cx="18" cy="18" r="2.2" fill={inverted ? "#001936" : "#fff"} />
      </svg>
      <span
        className={cn(
          "font-display text-[15px] font-semibold leading-tight tracking-tight",
          inverted ? "text-paper" : "text-navy",
        )}
      >
        Charity
        <br />
        Navigator
      </span>
    </Link>
  );
}
