import { charitiesBySlugs } from "./charities";
import type { CharityList } from "./types";

export const LISTS: CharityList[] = [
  {
    slug: "911-relief",
    title: "25th Anniversary 9/11 Relief & Support",
    kicker: "Where to Give Now",
    description:
      "Support highly rated organizations dedicated to uplifting impacted families, protecting first responders and fostering national unity in memory of September 11.",
    photo: "/images/veterans.jpg",
    kind: "crisis",
    charitySlugs: [
      "american-red-cross",
      "team-rubicon",
      "wounded-warrior-project",
      "dav",
      "habitat-for-humanity",
    ],
  },
  {
    slug: "venezuela-earthquake",
    title: "Venezuela Earthquake Relief",
    kicker: "Where to Give Now",
    description:
      "Support trusted nonprofits delivering lifesaving aid and helping communities recover after the Venezuela earthquake.",
    photo: "/images/disaster.jpg",
    kind: "crisis",
    charitySlugs: [
      "direct-relief",
      "doctors-without-borders",
      "world-central-kitchen",
      "care-usa",
      "international-rescue-committee",
    ],
  },
  {
    slug: "immigrant-support",
    title: "Immigrant Support in the United States",
    kicker: "Where to Give Now",
    description:
      "These highly rated U.S.-based charities are providing critical support to immigrants, asylum seekers, and displaced individuals navigating life in the United States.",
    photo: "/images/community.jpg",
    kind: "crisis",
    charitySlugs: [
      "international-rescue-committee",
      "hias",
      "care-usa",
      "habitat-for-humanity",
      "city-harvest",
    ],
  },
  {
    slug: "womens-health",
    title: "Women's Health & Wellbeing Fund",
    kicker: "Causeway Fund",
    description:
      "Support our analyst-curated group of nonprofits advancing proven solutions for women’s health, from reproductive and maternal care to mental health, prevention, and other historically underfunded needs.",
    photo: "/images/health.jpg",
    kind: "fund",
    charitySlugs: [
      "planned-parenthood",
      "bcrf",
      "st-jude",
      "american-cancer-society",
      "alzheimers-association",
    ],
  },
  {
    slug: "end-hunger",
    title: "End Hunger Fund",
    kicker: "Causeway Fund",
    description:
      "Hunger and food insecurity remain critical challenges in the United States, affecting millions. Our End Hunger Fund highlights organizations that provide both immediate food relief and long-term strategies.",
    photo: "/images/hunger.jpg",
    kind: "fund",
    charitySlugs: [
      "feeding-america",
      "city-harvest",
      "heifer-international",
      "world-central-kitchen",
      "givedirectly",
    ],
  },
  {
    slug: "end-homelessness",
    title: "End Homelessness Fund",
    kicker: "Causeway Fund",
    description:
      "Our End Homelessness Fund supports charities that address the causes of homelessness and implement solutions to increase the availability of affordable housing.",
    photo: "/images/housing.jpg",
    kind: "fund",
    charitySlugs: [
      "habitat-for-humanity",
      "covenant-house",
      "salvation-army",
      "city-harvest",
      "boys-and-girls-clubs",
    ],
  },
  {
    slug: "homeless-basic-needs-help",
    title: "U.S. Homelessness & Basic Needs Help",
    kicker: "Get Help Now",
    description:
      "A starting point for anyone in the United States experiencing homelessness, housing instability, hunger, or another urgent hardship. These organizations connect people with shelter, housing support, food, and practical assistance regardless of race or background.",
    photo: "/images/homeless-support.jpg",
    kind: "crisis",
    charitySlugs: [
      "salvation-army",
      "covenant-house",
      "habitat-for-humanity",
      "feeding-america",
      "american-red-cross",
    ],
  },
  {
    slug: "highly-rated",
    title: "Charities with Perfect and Near-Perfect Scores",
    kicker: "Best Charities",
    description:
      "Explore charities that earn exceptional Encompass scores across Impact, Finance, Leadership, and Culture. These organizations outperform peers on effectiveness and accountability.",
    photo: "/images/community.jpg",
    kind: "theme",
    charitySlugs: [
      "direct-relief",
      "givedirectly",
      "feeding-america",
      "dav",
      "bcrf",
      "donorschoose",
      "smile-train",
      "charity-navigator",
    ],
  },
  {
    slug: "animals",
    title: "Animal Welfare",
    kicker: "By Cause",
    description:
      "Highly rated organizations preventing cruelty, supporting no-kill communities, and caring for companion animals nationwide.",
    photo: "/images/animals.jpg",
    kind: "theme",
    charitySlugs: ["best-friends", "aspca", "humane-society"],
  },
  {
    slug: "environment",
    title: "Climate & Conservation",
    kicker: "By Cause",
    description:
      "Trusted nonprofits protecting land, water, wildlife, and the climate systems we all depend on.",
    photo: "/images/environment.jpg",
    kind: "theme",
    charitySlugs: ["nature-conservancy", "environmental-defense-fund", "wwf", "water-org"],
  },
  {
    slug: "veterans",
    title: "Veterans & First Responders",
    kicker: "By Cause",
    description:
      "Organizations helping veterans, disabled service members, and disaster responders continue their service at home.",
    photo: "/images/veterans.jpg",
    kind: "theme",
    charitySlugs: ["dav", "team-rubicon", "wounded-warrior-project", "american-red-cross"],
  },
  {
    slug: "education",
    title: "Education & Opportunity",
    kicker: "By Cause",
    description:
      "Charities expanding access to great classrooms, literacy, and after-school programs for kids who need them most.",
    photo: "/images/education.jpg",
    kind: "theme",
    charitySlugs: ["donorschoose", "room-to-read", "teach-for-america", "boys-and-girls-clubs"],
  },
];

const listBySlug = new Map(LISTS.map((l) => [l.slug, l]));

export function getList(slug: string) {
  return listBySlug.get(slug);
}

export function listCharities(list: CharityList) {
  return charitiesBySlugs(list.charitySlugs);
}

export const DISCOVER_LISTS = LISTS.filter((l) => l.kind === "crisis");
export const CAUSEWAY_LISTS = LISTS.filter((l) => l.kind === "fund");
export const THEME_LISTS = LISTS.filter((l) => l.kind === "theme");
