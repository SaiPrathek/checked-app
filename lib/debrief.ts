/**
 * Shared, non-server Debrief symbols. Kept out of lib/actions/debrief.ts
 * because "use server" files may only export async functions.
 */
export const DEBRIEF_VERDICTS = [
  "worth-it",
  "useless",
  "should-buy-there",
  "wish-brought-more",
] as const;

export type DebriefVerdict = (typeof DEBRIEF_VERDICTS)[number];

export const DEBRIEF_LABEL: Record<DebriefVerdict, string> = {
  "worth-it": "Worth it",
  useless: "Useless",
  "should-buy-there": "Should've bought there",
  "wish-brought-more": "Wish I'd brought more",
};

/** Minimum responses for a community stat to surface publicly. */
export const STAT_THRESHOLD = 3;

export interface Stat {
  item: string;
  total: number;
  counts: Record<DebriefVerdict, number>;
  /** highest-share verdict + its percentage; null if no responses */
  top: { verdict: DebriefVerdict; pct: number } | null;
}
