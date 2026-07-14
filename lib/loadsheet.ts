import {
  BAGS,
  allocatedUnits,
  type Allocation,
  type BagId,
  type PackingItem,
} from "./types";

/**
 * Loadsheet — Checked's auto-packing planner (named for the weight-and-balance
 * document airline load planners produce).
 *
 * Distributes every listed unit across Cabin / Checked Bag 1 / Checked Bag 2
 * under four constraint families:
 *   1. Transport rules  — cabin-must (documents, lithium electronics, meds),
 *      cabin-never (blades, cookers, liquids, bulk powders), cabin-prefer.
 *   2. Weight limits    — 23 kg per checked bag, 7 kg cabin.
 *   3. Volume limits    — usable litres from each bag's dimensions.
 *   4. Resilience       — seeds a couple of outfits into the cabin so a
 *      delayed checked bag doesn't leave the student with nothing to wear.
 *
 * Multi-unit lines (14 clothing sets, 5 thermals, 8 spice bags…) split freely
 * across bags — placement is per unit, with a cohesion preference so an item's
 * units stay together when they fit.
 *
 * Deterministic: same inputs → same loadsheet.
 */

export interface BagSpec {
  id: BagId;
  limitKg: number;
  /** usable capacity in litres (dimensions × fill efficiency) */
  capacityL: number;
}

export interface LoadsheetLine {
  item: PackingItem;
  qty: number;
}

export interface LoadsheetNote {
  level: "info" | "warn";
  text: string;
}

export interface LoadsheetResult {
  alloc: Record<string, Allocation>;
  /** units that could not be placed anywhere within limits */
  unplaced: { itemId: string; name: string; units: number }[];
  notes: LoadsheetNote[];
  /** final per-bag totals for display */
  totals: Record<BagId, { kg: number; volL: number }>;
}

const CHECKED: BagId[] = ["bag1", "bag2"];

/** Fallback per-unit volume when an item doesn't declare one. */
export function unitVolumeL(item: PackingItem): number {
  return item.volumeL ?? Math.max(0.2, item.weightKg * 2.5);
}

interface BagState extends BagSpec {
  kg: number;
  volL: number;
}

function fits(bag: BagState, wKg: number, vL: number): boolean {
  return bag.kg + wKg <= bag.limitKg + 1e-9 && bag.volL + vL <= bag.capacityL + 1e-9;
}

function place(
  alloc: Record<string, Allocation>,
  bag: BagState,
  itemId: string,
  units: number,
  wKg: number,
  vL: number,
) {
  if (units <= 0) return;
  const a = (alloc[itemId] ??= {});
  a[bag.id] = (a[bag.id] ?? 0) + units;
  bag.kg += wKg * units;
  bag.volL += vL * units;
}

/** How many units fit in this bag given per-unit weight/volume. */
function unitsThatFit(bag: BagState, wKg: number, vL: number, want: number): number {
  const byWeight = wKg > 0 ? Math.floor((bag.limitKg - bag.kg + 1e-9) / wKg) : want;
  const byVolume = vL > 0 ? Math.floor((bag.capacityL - bag.volL + 1e-9) / vL) : want;
  return Math.max(0, Math.min(want, byWeight, byVolume));
}

export function computeLoadsheet(
  lines: LoadsheetLine[],
  bagSpecs: BagSpec[],
): LoadsheetResult {
  const bags = new Map<BagId, BagState>(
    bagSpecs.map((s) => [s.id, { ...s, kg: 0, volL: 0 }]),
  );
  const cabin = bags.get("cabin")!;
  const alloc: Record<string, Allocation> = {};
  const unplaced: LoadsheetResult["unplaced"] = [];
  const notes: LoadsheetNote[] = [];
  const ruleNotes = new Set<string>();

  // Stable input order: heaviest total line first, id tiebreak (determinism).
  const sorted = [...lines]
    .filter((l) => l.qty > 0)
    .sort((a, b) => {
      const dw = b.item.weightKg * b.qty - a.item.weightKg * a.qty;
      return dw !== 0 ? dw : a.item.id.localeCompare(b.item.id);
    });

  // ── Phase 1 · cabin-must: documents, cash, lithium electronics, meds ──────
  for (const l of sorted) {
    if (l.item.transport?.cabin !== "must") continue;
    place(alloc, cabin, l.item.id, l.qty, l.item.weightKg, unitVolumeL(l.item));
    if (l.item.transport.note) ruleNotes.add(`${l.item.name} → cabin: ${l.item.transport.note}`);
  }
  if (cabin.kg > cabin.limitKg) {
    notes.push({
      level: "warn",
      text: `Cabin must-carry items alone weigh ${cabin.kg.toFixed(1)} kg (limit ${cabin.limitKg} kg). Wear your heaviest layers and move chargers to a personal-item backpack.`,
    });
  }

  // ── Phase 2 · resilience seeding (e.g. 2 outfits in cabin) ────────────────
  let seededOutfits = false;
  for (const l of sorted) {
    const seed = l.item.cabinSeed ?? 0;
    if (seed <= 0 || l.item.transport?.cabin === "never") continue;
    const already = allocatedUnits(alloc[l.item.id]);
    const wantable = Math.min(seed, l.qty - already);
    const n = unitsThatFit(cabin, l.item.weightKg, unitVolumeL(l.item), wantable);
    if (n > 0) {
      place(alloc, cabin, l.item.id, n, l.item.weightKg, unitVolumeL(l.item));
      seededOutfits = true;
    }
  }
  if (seededOutfits) {
    notes.push({
      level: "info",
      text: "Seeded spare clothes into your cabin bag — if a checked bag is delayed, you're covered for the first days.",
    });
  }

  // ── Phase 3 · cabin-prefer: glasses, jackets — cabin first, checked spill ─
  for (const l of sorted) {
    if (l.item.transport?.cabin !== "prefer") continue;
    const vL = unitVolumeL(l.item);
    let remaining = l.qty - allocatedUnits(alloc[l.item.id]);
    const inCabin = unitsThatFit(cabin, l.item.weightKg, vL, remaining);
    place(alloc, cabin, l.item.id, inCabin, l.item.weightKg, vL);
    remaining -= inCabin;
    if (remaining > 0) {
      // spill to checked below via phase 4 (transport allows it)
    }
    if (l.item.transport.note && inCabin > 0)
      ruleNotes.add(`${l.item.name} → cabin: ${l.item.transport.note}`);
  }

  // ── Phase 4 · everything remaining → checked bags (worst-fit-decreasing) ──
  // Worst-fit (bag with most remaining weight) naturally balances the two
  // checked bags; per-item cohesion keeps an item's units together when the
  // roomier bag can hold them all.
  for (const l of sorted) {
    const vL = unitVolumeL(l.item);
    let remaining = l.qty - allocatedUnits(alloc[l.item.id]);
    if (remaining <= 0) continue;

    const checkedByRoom = () =>
      CHECKED.map((id) => bags.get(id)!).sort(
        (a, b) => (b.limitKg - b.kg) - (a.limitKg - a.kg) || a.id.localeCompare(b.id),
      );

    for (const bag of checkedByRoom()) {
      if (remaining <= 0) break;
      const n = unitsThatFit(bag, l.item.weightKg, vL, remaining);
      if (n > 0) {
        place(alloc, bag, l.item.id, n, l.item.weightKg, vL);
        remaining -= n;
        if (n < l.qty && remaining === 0 && l.qty > 1) {
          ruleNotes.add(`${l.item.name} split across bags to stay under the limits.`);
        }
      }
    }

    // overflow → cabin, unless the item is banned there
    if (remaining > 0 && l.item.transport?.cabin !== "never") {
      const n = unitsThatFit(cabin, l.item.weightKg, vL, remaining);
      if (n > 0) {
        place(alloc, cabin, l.item.id, n, l.item.weightKg, vL);
        remaining -= n;
      }
    }

    if (remaining > 0) {
      unplaced.push({ itemId: l.item.id, name: l.item.name, units: remaining });
    }
    if (l.item.transport?.cabin === "never" && l.item.transport.note) {
      ruleNotes.add(`${l.item.name} → checked only: ${l.item.transport.note}`);
    }
  }

  // ── Phase 5 · rebalance the two checked bags (move splittable units) ──────
  const b1 = bags.get("bag1")!;
  const b2 = bags.get("bag2")!;
  let guard = 64;
  while (Math.abs(b1.kg - b2.kg) > 2 && guard-- > 0) {
    const heavy = b1.kg > b2.kg ? b1 : b2;
    const light = heavy === b1 ? b2 : b1;
    // find the heaviest single unit in `heavy` that improves balance and fits `light`
    let best: { l: LoadsheetLine; vL: number } | null = null;
    for (const l of sorted) {
      const inHeavy = alloc[l.item.id]?.[heavy.id] ?? 0;
      if (inHeavy <= 0) continue;
      const vL = unitVolumeL(l.item);
      if (!fits(light, l.item.weightKg, vL)) continue;
      // moving one unit must strictly reduce the gap
      const gapNow = Math.abs(heavy.kg - light.kg);
      const gapAfter = Math.abs(heavy.kg - l.item.weightKg - (light.kg + l.item.weightKg));
      if (gapAfter >= gapNow) continue;
      if (!best || l.item.weightKg > best.l.item.weightKg) best = { l, vL };
    }
    if (!best) break;
    const a = alloc[best.l.item.id]!;
    a[heavy.id]! -= 1;
    if (a[heavy.id] === 0) delete a[heavy.id];
    heavy.kg -= best.l.item.weightKg;
    heavy.volL -= best.vL;
    place(alloc, light, best.l.item.id, 1, best.l.item.weightKg, best.vL);
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  for (const t of ruleNotes) notes.push({ level: "info", text: t });
  const coat = sorted.find((l) => l.item.id === "heavy-coat" || l.item.id === "transit-jacket");
  if (coat) {
    notes.push({
      level: "info",
      text: "Wear your heaviest jacket on the flight — it's free weight the scale never sees.",
    });
  }
  for (const u of unplaced) {
    notes.push({
      level: "warn",
      text: `Couldn't fit ${u.units} × ${u.name} anywhere — reduce the quantity, pick a bigger case, or leave it for the US.`,
    });
  }
  for (const id of ["bag1", "bag2", "cabin"] as BagId[]) {
    const b = bags.get(id)!;
    if (b.kg > b.limitKg)
      notes.push({
        level: "warn",
        text: `${id === "cabin" ? "Cabin" : id === "bag1" ? "Checked Bag 1" : "Checked Bag 2"} is over its weight limit by ${(b.kg - b.limitKg).toFixed(1)} kg.`,
      });
  }

  return {
    alloc,
    unplaced,
    notes,
    totals: {
      bag1: { kg: b1.kg, volL: b1.volL },
      bag2: { kg: b2.kg, volL: b2.volL },
      cabin: { kg: cabin.kg, volL: cabin.volL },
    },
  };
}

/**
 * Rule check for MANUAL placements — the user is sovereign, but we warn.
 * Returns a human-readable warning when `bag` violates the item's transport
 * rule, else null.
 */
export function placementWarning(item: PackingItem, bag: BagId): string | null {
  const t = item.transport;
  if (!t) return null;
  if (t.cabin === "never" && bag === "cabin") {
    return `${item.name} isn't allowed in the cabin${t.note ? ` — ${t.note}` : ""}.`;
  }
  if (t.cabin === "must" && bag !== "cabin") {
    return `${item.name} should stay in your cabin bag${t.note ? ` — ${t.note}` : ""}.`;
  }
  return null;
}

/** Default bag specs from BAGS + dimensions (w×h×d cm, 85% usable). */
export function bagSpecsFrom(
  dims: Record<BagId, { w: number; h: number; d: number }>,
): BagSpec[] {
  return BAGS.map((b) => ({
    id: b.id,
    limitKg: b.limitKg,
    capacityL: ((dims[b.id].w * dims[b.id].h * dims[b.id].d) / 1000) * 0.85,
  }));
}
