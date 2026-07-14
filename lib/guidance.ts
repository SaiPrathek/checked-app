import type { HoldItem, PackingItem, Profile, Verdict } from "./types";

export interface ResolvedGuidance {
  verdict: Verdict;
  /** true when the verdict was shifted from the Hold default by the user's profile */
  shifted: boolean;
  /** profile-specific notes pulled from The Hold's context map, plus verdict-shift note */
  personalNotes: string[];
}

/** One profile dimension that changed the recommended quantity, with its delta or absolute value. */
export interface QtyDriver {
  dimension: keyof NonNullable<PackingItem["deltaBy"]>;
  value: string; // the specific profile value, e.g. "cold" or "apartment"
  delta: number; // positive or negative; for qtyBy (absolute) this is the resolved-vs-base delta
  absolute?: boolean; // true when the driver came from qtyBy (override), not deltaBy (additive)
}

/** Dimension precedence — first-match-wins for verdict shifts and legacy qtyBy. */
const DIM_ORDER = [
  "climate",
  "intake",
  "housing",
  "roommates",
  "dietPractice",
  "cuisine",
  "cooking",
  "beverage",
  "gender",
] as const;

function profileValue(profile: Profile, dim: (typeof DIM_ORDER)[number]): string | undefined {
  return profile[dim] ?? undefined;
}

/**
 * Resolves a Hold verdict against the user's Check-In profile.
 * Applies `verdictBy` shifts first (first matching dimension wins), then falls
 * back to the Hold's default. Also collects `context` notes as personal notes.
 */
export function resolveGuidance(
  hold: HoldItem,
  profile: Profile,
  item?: PackingItem,
): ResolvedGuidance {
  const personalNotes: string[] = [];
  const ctx = hold.context ?? {};
  let verdict: Verdict = hold.verdict;
  let shifted = false;

  const shiftMap = item?.verdictBy;
  if (shiftMap) {
    for (const dim of DIM_ORDER) {
      const v = profileValue(profile, dim);
      if (!v) continue;
      const shifted_v = (shiftMap[dim] as Record<string, Verdict> | undefined)?.[v];
      if (shifted_v !== undefined && shifted_v !== hold.verdict) {
        verdict = shifted_v;
        shifted = true;
        break;
      }
    }
  }

  for (const dim of DIM_ORDER) {
    const v = profileValue(profile, dim);
    if (!v) continue;
    const note = (ctx[dim] as Record<string, string> | undefined)?.[v];
    if (note) personalNotes.push(note);
  }

  return { verdict, shifted, personalNotes };
}

/**
 * Recommended quantity — multi-factor additive model.
 *   qty = clamp(baseQty + Σ deltaBy[dim][profile[dim]], minQty, maxQty)
 * `qtyBy` (legacy, first-match-wins) still overrides the base if present.
 * User overrides in the store always win over this.
 */
export function recommendedQty(item: PackingItem, profile: Profile): number {
  const drivers = qtyDrivers(item, profile);
  const base = item.baseQty ?? 1;

  // legacy qtyBy override (first match wins)
  const q = item.qtyBy;
  if (q) {
    for (const dim of DIM_ORDER) {
      const v = profileValue(profile, dim);
      if (!v) continue;
      const abs = (q[dim] as Record<string, number> | undefined)?.[v];
      if (abs !== undefined) return abs;
    }
  }

  const delta = drivers.reduce((s, d) => s + d.delta, 0);
  const min = item.minQty ?? 0;
  const max = item.maxQty ?? 999;
  return Math.max(min, Math.min(max, base + delta));
}

/**
 * Return the profile-driven contributions to recommendedQty, in dimension order.
 * Empty when no `deltaBy` entries match — the item is at its baseQty.
 */
export function qtyDrivers(item: PackingItem, profile: Profile): QtyDriver[] {
  const out: QtyDriver[] = [];
  const d = item.deltaBy;
  if (!d) return out;
  for (const dim of DIM_ORDER) {
    const v = profileValue(profile, dim);
    if (!v) continue;
    const delta = (d[dim] as Record<string, number> | undefined)?.[v];
    if (delta !== undefined && delta !== 0) {
      out.push({ dimension: dim, value: v, delta });
    }
  }
  return out;
}

/** Human-readable label for a driver dimension. */
export function driverLabel(driver: QtyDriver): string {
  const map: Record<QtyDriver["dimension"], (v: string) => string> = {
    climate: (v) => `${v} climate`,
    intake: (v) => `${v} intake`,
    housing: (v) => (v === "apartment" ? "apartment" : "dorm"),
    roommates: (v) => (v === "roommates" ? "with roommates" : "living alone"),
    dietPractice: (v) => v,
    cuisine: (v) => `${v} Indian cuisine`,
    cooking: (v) => `cooks ${v}`,
    beverage: (v) => (v === "both" ? "coffee & chai" : v),
    gender: (v) => v,
  };
  return map[driver.dimension](driver.value);
}

export function isItemVisible(item: PackingItem, profile: Profile): boolean {
  return item.visibleIf ? item.visibleIf(profile) : true;
}

export function itemName(item: PackingItem, profile: Profile): string {
  return item.nameFor?.(profile) ?? item.name;
}

/** Naive local retrieval over The Hold for The Tower (routed-RAG placeholder). */
export function searchHold(hold: HoldItem[], query: string): HoldItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  const scored = hold.map((h) => {
    const haystack = `${h.item} ${h.category} ${h.detail}`.toLowerCase();
    let score = 0;
    for (const t of terms) if (haystack.includes(t)) score += haystack.includes(` ${t}`) ? 2 : 1;
    if (h.item.toLowerCase().includes(q)) score += 5;
    return { h, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.h);
}
