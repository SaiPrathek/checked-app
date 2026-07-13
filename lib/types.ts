export type Category =
  | "documents"
  | "clothing"
  | "kitchen"
  | "food"
  | "medicines"
  | "electronics"
  | "bedding"
  | "toiletries"
  | "money";

export type Verdict = "bring-from-india" | "buy-in-us" | "either" | "skip";

export const VERDICT_LABEL: Record<Verdict, string> = {
  "bring-from-india": "Bring from India",
  "buy-in-us": "Buy in the US",
  either: "Either / your call",
  skip: "Skip",
};

/** A canonical verdict from The Hold (corpus/seed-items.json). */
export interface HoldItem {
  item: string;
  category: Category;
  verdict: Verdict;
  confidence: "high" | "medium" | "low";
  contested: boolean;
  detail: string;
  support?: Record<string, number>;
  claimIds?: string[];
  context?: {
    climate?: Record<string, string>;
    intake?: Record<string, string>;
    diet?: Record<string, string>;
    housing?: Record<string, string>;
  };
  price?: { inr?: number | null; usd?: number | null; note?: string } | null;
  weightNote?: string | null;
  communityStats?: unknown;
}

/** A concrete, packable line-item shown in The Manifest and weighed in Weigh-In. */
export interface PackingItem {
  id: string;
  name: string;
  /** links to HoldItem.item for verdict, reasoning, context and citations */
  holdKey: string;
  category: Category;
  /** rough weight estimate (kg) for the Weigh-In simulator */
  weightKg: number;
  /** suggested-on-list by default (true for bring/either essentials) */
  suggested?: boolean;
}

export interface Profile {
  name?: string;
  university?: string;
  city?: string;
  climate?: "cold" | "warm" | "mixed";
  intake?: "fall" | "spring";
  housing?: "dorm" | "apartment";
  diet?: "veg-cooking-heavy" | "eats-out" | "mixed";
  completed?: boolean;
}

export type BagId = "bag1" | "bag2" | "cabin";

export const BAGS: { id: BagId; label: string; limitKg: number }[] = [
  { id: "bag1", label: "Checked Bag 1", limitKg: 23 },
  { id: "bag2", label: "Checked Bag 2", limitKg: 23 },
  { id: "cabin", label: "Cabin", limitKg: 7 },
];
