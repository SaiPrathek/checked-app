import holdData from "@/data/hold.json";
import type { HoldItem } from "./types";

/**
 * The Hold — the canonical ground-truth corpus (generated from corpus/seed-items.json).
 * Every user-facing verdict traces back to here; see corpus/README.md for the flywheel.
 */
export const HOLD = (holdData as unknown as { items: HoldItem[] }).items;

export function getHoldItem(key: string): HoldItem | undefined {
  return HOLD.find((h) => h.item === key);
}
