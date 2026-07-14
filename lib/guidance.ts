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
  if (profile.diet && ctx.diet?.[profile.diet]) {
    personalNotes.push(ctx.diet[profile.diet]);
  }

  return { verdict: hold.verdict, personalNotes };
}

/**
 * Recommended quantity for a packing item given the user's profile.
 * Precedence: climate → intake → housing → diet → baseQty → 1.
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
    if (profile.diet && q.diet?.[profile.diet] !== undefined)
      return q.diet[profile.diet]!;
  }
  return item.baseQty ?? 1;
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
