import type { HoldItem, PackingItem, Profile, Verdict } from "./types";

export interface ResolvedGuidance {
  verdict: Verdict;
  /** profile-specific notes pulled from The Hold's context map */
  personalNotes: string[];
}

/**
 * Resolves a canonical Hold verdict against the user's Check-In profile.
 * v0 keeps the base verdict and surfaces the matching context note(s) as
 * "For you" guidance — it never fabricates a verdict the corpus doesn't hold.
 * Aggregation that shifts verdicts by community Debrief data comes later.
 */
export function resolveGuidance(hold: HoldItem, profile: Profile): ResolvedGuidance {
  const personalNotes: string[] = [];
  const ctx = hold.context ?? {};

  if (profile.climate && ctx.climate?.[profile.climate]) {
    personalNotes.push(ctx.climate[profile.climate]);
  }
  if (profile.intake && ctx.intake?.[profile.intake]) {
    personalNotes.push(ctx.intake[profile.intake]);
  }
  if (profile.housing && ctx.housing?.[profile.housing]) {
    personalNotes.push(ctx.housing[profile.housing]);
  }
  if (profile.roommates && ctx.roommates?.[profile.roommates])
    personalNotes.push(ctx.roommates[profile.roommates]);
  if (profile.dietPractice && ctx.dietPractice?.[profile.dietPractice])
    personalNotes.push(ctx.dietPractice[profile.dietPractice]);
  if (profile.cuisine && ctx.cuisine?.[profile.cuisine])
    personalNotes.push(ctx.cuisine[profile.cuisine]);
  if (profile.cooking && ctx.cooking?.[profile.cooking])
    personalNotes.push(ctx.cooking[profile.cooking]);
  if (profile.beverage && ctx.beverage?.[profile.beverage])
    personalNotes.push(ctx.beverage[profile.beverage]);
  if (profile.gender && ctx.gender?.[profile.gender])
    personalNotes.push(ctx.gender[profile.gender]);

  return { verdict: hold.verdict, personalNotes };
}

/**
 * Recommended quantity for a packing item given the user's profile.
 * Precedence: climate → intake → housing → roommates → diet practice → cuisine
 * → cooking → beverage → gender → baseQty → 1.
 * The user's UI value in the store overrides this whenever set.
 */
export function recommendedQty(item: PackingItem, profile: Profile): number {
  const q = item.qtyBy;
  if (q) {
    if (profile.climate && q.climate?.[profile.climate] !== undefined)
      return q.climate[profile.climate]!;
    if (profile.intake && q.intake?.[profile.intake] !== undefined)
      return q.intake[profile.intake]!;
    if (profile.housing && q.housing?.[profile.housing] !== undefined)
      return q.housing[profile.housing]!;
    if (profile.roommates && q.roommates?.[profile.roommates] !== undefined)
      return q.roommates[profile.roommates]!;
    if (profile.dietPractice && q.dietPractice?.[profile.dietPractice] !== undefined)
      return q.dietPractice[profile.dietPractice]!;
    if (profile.cuisine && q.cuisine?.[profile.cuisine] !== undefined)
      return q.cuisine[profile.cuisine]!;
    if (profile.cooking && q.cooking?.[profile.cooking] !== undefined)
      return q.cooking[profile.cooking]!;
    if (profile.beverage && q.beverage?.[profile.beverage] !== undefined)
      return q.beverage[profile.beverage]!;
    if (profile.gender && q.gender?.[profile.gender] !== undefined)
      return q.gender[profile.gender]!;
  }
  return item.baseQty ?? 1;
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
