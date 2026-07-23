export type Category =
  | "documents"
  | "clothing"
  | "kitchen"
  | "food"
  | "medicines"
  | "electronics"
  | "bedding"
  | "toiletries"
  | "stationery"
  | "money"
  | "misc";

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
  tags?: string[];
  context?: {
    climate?: Record<string, string>;
    intake?: Record<string, string>;
    housing?: Record<string, string>;
    roommates?: Record<string, string>;
    dietPractice?: Record<string, string>;
    cuisine?: Record<string, string>;
    cooking?: Record<string, string>;
    beverage?: Record<string, string>;
    gender?: Record<string, string>;
  };
  price?: {
    inr?: number | null;
    usd?: number | null;
    note?: string;
    /** Where to buy it in the US. Affiliate link when a program tag is set;
     * a plain product/search URL otherwise. Drives the "Buy in the US" CTA. */
    buyUrl?: string | null;
    buyLabel?: string | null;
  } | null;
  weightNote?: string | null;
  communityStats?: unknown;
}

/**
 * A concrete, packable line-item shown in The Manifest and weighed in Weigh-In.
 * `baseQty` is the default recommended count if no profile dimension applies.
 * `qtyBy` lets the recommended count vary by profile dimension — the *first*
 * profile match (climate → intake → housing → roommates → diet practice →
 * cuisine → cooking → beverage → gender) wins, so define values
 * from most-specific to least. The user can always override in the UI.
 */
export interface PackingItem {
  id: string;
  name: string;
  /**
   * Links to HoldItem.item for verdict, reasoning, context and citations.
   * Optional — items sourced from the packing-list checklist (no Hold entry)
   * carry their own `verdict` + `detail` inline instead.
   */
  holdKey?: string;
  /** Inline verdict when there's no Hold entry (else The Hold's verdict wins). */
  verdict?: Verdict;
  /** Inline explanation when there's no Hold entry (shown in the "Why?" panel). */
  detail?: string;
  /** Icon registry key (see components/item-icon.tsx); falls back to a category glyph. */
  icon?: string;
  category: Category;
  /** rough per-unit weight (kg); Weigh-In multiplies by the user's chosen qty */
  weightKg: number;
  /** suggested-on-list by default (true for bring/either essentials) */
  suggested?: boolean;
  /** Default recommended quantity when no profile override applies. Defaults to 1 if omitted. */
  baseQty?: number;
  /**
   * Profile-dependent quantity overrides (legacy, first-match-wins).
   * Kept for backward compat; new items should prefer `deltaBy`.
   */
  qtyBy?: {
    climate?: Partial<Record<NonNullable<Profile["climate"]>, number>>;
    intake?: Partial<Record<NonNullable<Profile["intake"]>, number>>;
    housing?: Partial<Record<NonNullable<Profile["housing"]>, number>>;
    roommates?: Partial<Record<NonNullable<Profile["roommates"]>, number>>;
    dietPractice?: Partial<Record<NonNullable<Profile["dietPractice"]>, number>>;
    cuisine?: Partial<Record<NonNullable<Profile["cuisine"]>, number>>;
    cooking?: Partial<Record<NonNullable<Profile["cooking"]>, number>>;
    beverage?: Partial<Record<NonNullable<Profile["beverage"]>, number>>;
    gender?: Partial<Record<NonNullable<Profile["gender"]>, number>>;
    workExperience?: Partial<Record<NonNullable<Profile["workExperience"]>, number>>;
    wearsGlasses?: Partial<Record<NonNullable<Profile["wearsGlasses"]>, number>>;
    license?: Partial<Record<NonNullable<Profile["license"]>, number>>;
  };
  /**
   * Additive quantity deltas — every matching dimension contributes.
   * recommendedQty = clamp(baseQty + Σ deltaBy[dim][profile[dim]], minQty ?? 0, maxQty ?? 999).
   * Use negative deltas to subtract (e.g. warm climate → −4 sweaters).
   */
  deltaBy?: {
    climate?: Partial<Record<NonNullable<Profile["climate"]>, number>>;
    intake?: Partial<Record<NonNullable<Profile["intake"]>, number>>;
    housing?: Partial<Record<NonNullable<Profile["housing"]>, number>>;
    roommates?: Partial<Record<NonNullable<Profile["roommates"]>, number>>;
    dietPractice?: Partial<Record<NonNullable<Profile["dietPractice"]>, number>>;
    cuisine?: Partial<Record<NonNullable<Profile["cuisine"]>, number>>;
    cooking?: Partial<Record<NonNullable<Profile["cooking"]>, number>>;
    beverage?: Partial<Record<NonNullable<Profile["beverage"]>, number>>;
    gender?: Partial<Record<NonNullable<Profile["gender"]>, number>>;
    workExperience?: Partial<Record<NonNullable<Profile["workExperience"]>, number>>;
    wearsGlasses?: Partial<Record<NonNullable<Profile["wearsGlasses"]>, number>>;
    license?: Partial<Record<NonNullable<Profile["license"]>, number>>;
  };
  /** Clamp bounds for the additive model; defaults 0 and 999. */
  minQty?: number;
  maxQty?: number;
  /**
   * Profile-driven verdict shifts (first-match-wins in the same dimension order).
   * Overrides the Hold's default verdict when a dimension matches — e.g. a
   * heavy coat is "bring-from-india" for cold+spring but "skip" for warm.
   */
  verdictBy?: {
    climate?: Partial<Record<NonNullable<Profile["climate"]>, Verdict>>;
    intake?: Partial<Record<NonNullable<Profile["intake"]>, Verdict>>;
    housing?: Partial<Record<NonNullable<Profile["housing"]>, Verdict>>;
    roommates?: Partial<Record<NonNullable<Profile["roommates"]>, Verdict>>;
    dietPractice?: Partial<Record<NonNullable<Profile["dietPractice"]>, Verdict>>;
    cuisine?: Partial<Record<NonNullable<Profile["cuisine"]>, Verdict>>;
    cooking?: Partial<Record<NonNullable<Profile["cooking"]>, Verdict>>;
    beverage?: Partial<Record<NonNullable<Profile["beverage"]>, Verdict>>;
    gender?: Partial<Record<NonNullable<Profile["gender"]>, Verdict>>;
    workExperience?: Partial<Record<NonNullable<Profile["workExperience"]>, Verdict>>;
    wearsGlasses?: Partial<Record<NonNullable<Profile["wearsGlasses"]>, Verdict>>;
    license?: Partial<Record<NonNullable<Profile["license"]>, Verdict>>;
  };
  /** Do not show items irrelevant to this profile in the main Manifest. */
  visibleIf?: (profile: Profile) => boolean;
  /** Household item that should be coordinated instead of duplicated. */
  shareable?: boolean;
  /** Optional profile-aware display label. */
  nameFor?: (profile: Profile) => string;
  /** Rough per-unit packed volume in litres (drives the space meters + Auto-Pack). */
  volumeL?: number;
  /**
   * Airline/TSA transport rule for Auto-Pack and edit warnings.
   * cabin "must"  → may ONLY travel in the cabin (documents, cash, lithium electronics, prescription meds)
   * cabin "never" → may NOT travel in the cabin (blades, pressure cooker, >100ml liquids, bulk powders)
   * cabin "prefer"→ allowed anywhere, cabin preferred when space permits
   * omitted       → allowed anywhere, checked preferred
   */
  transport?: { cabin: "must" | "never" | "prefer"; note?: string };
  /**
   * Units Auto-Pack seeds into the cabin for resilience even when checked is
   * preferred (e.g. 2 outfits in case checked bags are delayed).
   */
  cabinSeed?: number;
}

/** Units of one item per bag; units not allocated to any bag are unpacked. */
export type Allocation = Partial<Record<BagId, number>>;

/** Total units of an item currently allocated across all bags. */
export function allocatedUnits(a: Allocation | undefined): number {
  if (!a) return 0;
  return (a.bag1 ?? 0) + (a.bag2 ?? 0) + (a.cabin ?? 0) + (a.backpack ?? 0);
}

export interface Profile {
  name?: string;
  university?: string;
  city?: string; // derived
  state?: string; // derived
  region?: "northeast" | "midwest" | "south" | "west"; // derived
  climate?: "cold" | "warm" | "mixed"; // derived; region fallback
  intake?: "fall" | "spring";
  housing?: "dorm" | "apartment";
  roommates?: "alone" | "roommates";
  gender?: "male" | "female" | "nonbinary" | "na";
  dietPractice?: "veg" | "jain" | "halal" | "eggetarian" | "none";
  cuisine?: "south" | "north" | "west" | "east";
  cooking?: "daily" | "weekly" | "rarely";
  beverage?: "filter-coffee" | "chai" | "both" | "none";
  /** Optional background toggles that tailor document & misc counts. */
  workExperience?: "yes" | "no";
  wearsGlasses?: "yes" | "no";
  license?: "yes" | "no";
  completed?: boolean;
}

/**
 * A user-defined item that lives alongside PACKING_ITEMS but isn't in The Hold.
 * Persisted per user; itemId in list_items/allocation uses the `custom:<id>` prefix.
 */
export interface CustomItem {
  id: string; // stored id — always prefixed with "custom:"
  name: string;
  category: Category;
  weightKg: number;
  volumeL?: number;
  transport?: { cabin: "must" | "never" | "prefer"; note?: string };
  verdict?: Verdict; // AI or user-declared; no Hold entry
  note?: string; // AI-generated rationale or user note
  aiFilled?: boolean; // true when Checked AI classified this item
  createdAt?: string;
}

/** Everything Weigh-In and the loadsheet need — satisfied by both PackingItem and CustomItem. */
export interface Packable {
  id: string;
  name: string;
  category: Category;
  weightKg: number;
  volumeL?: number;
  transport?: { cabin: "must" | "never" | "prefer"; note?: string };
  cabinSeed?: number;
  /** Icon registry key (see components/item-icon.tsx); falls back to a category glyph. */
  icon?: string;
}

export function isCustomItemId(id: string): boolean {
  return id.startsWith("custom:");
}

export type BagId = "bag1" | "bag2" | "cabin" | "backpack";

/** checked = goes in the hold (23 kg, no liquid/blade rules); cabin = carried on (7 kg, TSA rules apply). */
export type BagClass = "checked" | "cabin";

export interface BagDef {
  id: BagId;
  label: string;
  limitKg: number;
  class: BagClass;
  /** false → always present and cannot be removed */
  removable: boolean;
  /**
   * Personal item that rides under the seat — the quick-access bag.
   * Auto-Pack fills it first with must-carry essentials (laptop, documents,
   * meds, cash) and a spare outfit, and keeps bulky cabin items out of it.
   */
  quickAccess?: boolean;
}

/** Every bag the app knows about. Which are *active* is per-user (see store.activeBags). */
export const BAG_CATALOG: BagDef[] = [
  { id: "bag1", label: "Checked Bag 1", limitKg: 23, class: "checked", removable: true },
  { id: "bag2", label: "Checked Bag 2", limitKg: 23, class: "checked", removable: true },
  { id: "cabin", label: "Cabin", limitKg: 7, class: "cabin", removable: true },
  { id: "backpack", label: "Backpack", limitKg: 7, class: "cabin", removable: true, quickAccess: true },
];

/** Default fleet for a new user: two checked bags + cabin (no backpack). */
export const DEFAULT_ACTIVE_BAGS: BagId[] = ["bag1", "bag2", "cabin"];

const BAG_DEF_BY_ID = new Map(BAG_CATALOG.map((b) => [b.id, b]));

export function bagDef(id: BagId): BagDef {
  const def = BAG_DEF_BY_ID.get(id);
  if (!def) throw new Error(`unknown bag ${id}`);
  return def;
}

/** Order bag ids in canonical display order (catalog order). */
export function orderBags(ids: BagId[]): BagId[] {
  return BAG_CATALOG.filter((b) => ids.includes(b.id)).map((b) => b.id);
}
