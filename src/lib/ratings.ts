import type { Charity } from "@/data/types";

export function starsFromScore(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score >= 90) return 4;
  if (score >= 75) return 3;
  if (score >= 60) return 2;
  if (score >= 50) return 1;
  return 0;
}

export function ratingLabel(score: number): string {
  if (score >= 90) return "Great";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs improvement";
  if (score >= 50) return "Poor";
  return "Very poor";
}

export function ratingTone(score: number): "good" | "ok" | "warn" | "poor" {
  if (score >= 90) return "good";
  if (score >= 75) return "ok";
  if (score >= 60) return "warn";
  return "poor";
}

export const BEACON_META = [
  {
    key: "impact" as const,
    label: "Impact & Measurement",
    short: "Impact",
    color: "var(--color-beacon-impact)",
    className: "text-beacon-impact",
    bar: "bg-beacon-impact",
    copy: "Cost-effectiveness of programs and the organization’s capacity to measure its own results.",
  },
  {
    key: "finance" as const,
    label: "Accountability & Finance",
    short: "Finance",
    color: "var(--color-beacon-finance)",
    className: "text-beacon-finance",
    bar: "bg-beacon-finance",
    copy: "Financial health, sustainability, and accountability using IRS Form 990 filings.",
  },
  {
    key: "leadership" as const,
    label: "Leadership & Adaptability",
    short: "Leadership",
    color: "var(--color-beacon-leadership)",
    className: "text-beacon-leadership",
    bar: "bg-beacon-leadership",
    copy: "Leadership capacity, strategic planning, and ability to adapt to change.",
  },
  {
    key: "culture" as const,
    label: "Culture & Community",
    short: "Culture",
    color: "var(--color-beacon-culture)",
    className: "text-beacon-culture",
    bar: "bg-beacon-culture",
    copy: "Constituent feedback, equity strategies, and how the organization listens to the people it serves.",
  },
];

export function scoredBeacons(charity: Charity) {
  return BEACON_META.map((b) => ({
    ...b,
    score: charity.beacons[b.key],
  }));
}
