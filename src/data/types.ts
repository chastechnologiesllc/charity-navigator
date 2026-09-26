export const CAUSES = [
  "Human Services",
  "Health",
  "International",
  "Environment",
  "Animals",
  "Education",
  "Community",
  "Arts & Culture",
  "Research & Public Policy",
] as const;

export type Cause = (typeof CAUSES)[number];

export type CharitySize = "small" | "mid" | "large";

export type Beacons = {
  impact: number | null;
  finance: number;
  leadership: number | null;
  culture: number | null;
};

export type Financials = {
  year: number;
  revenue: number;
  expenses: number;
  programPercent: number;
  adminPercent: number;
  fundraisingPercent: number;
  workingCapitalYears: number;
};

export type Charity = {
  slug: string;
  name: string;
  ein: string;
  city: string;
  state: string;
  founded: number;
  cause: Cause;
  tags: string[];
  mission: string;
  website: string;
  ceo: string;
  overall: number;
  beacons: Beacons;
  financials: Financials;
  photo: string;
  size: CharitySize;
  completeProfile: boolean;
  programs: string[];
};

export type CharityList = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  photo: string;
  photos?: string[];
  kind: "crisis" | "fund" | "theme";
  charitySlugs: string[];
};
