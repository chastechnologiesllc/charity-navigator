import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Frequency = "once" | "monthly";

export type BasketItem = {
  slug: string;
  amount: number;
  frequency: Frequency;
};

type BasketState = {
  items: BasketItem[];
  coverFees: boolean;
  tribute: string;
  anonymous: boolean;
  add: (item: BasketItem) => void;
  update: (slug: string, patch: Partial<BasketItem>) => void;
  remove: (slug: string) => void;
  clear: () => void;
  setCoverFees: (v: boolean) => void;
  setTribute: (v: string) => void;
  setAnonymous: (v: boolean) => void;
};

export const FEE_RATE = 0.029;
export const FEE_FIXED = 0.3;

export function subtotal(items: BasketItem[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

export function feeAmount(items: BasketItem[]) {
  const sub = subtotal(items);
  if (sub <= 0) return 0;
  return Math.round((sub * FEE_RATE + FEE_FIXED) * 100) / 100;
}

export const useBasket = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      coverFees: true,
      tribute: "",
      anonymous: false,
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.slug === item.slug);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.slug === item.slug
                  ? { ...i, amount: i.amount + item.amount, frequency: item.frequency }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),
      update: (slug, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.slug === slug ? { ...i, ...patch } : i)),
        })),
      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [], tribute: "" }),
      setCoverFees: (v) => set({ coverFees: v }),
      setTribute: (v) => set({ tribute: v }),
      setAnonymous: (v) => set({ anonymous: v }),
    }),
    { name: "cn-giving-basket" },
  ),
);
