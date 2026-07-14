import {
  BAG_CATALOG,
  bagDef,
  allocatedUnits,
  type Allocation,
  type BagClass,
  type BagId,
  type PackingItem,
} from "./types";

/**
 * Loadsheet — Checked's auto-packing planner (named for the weight-and-balance
 * document airline load planners produce).
 *
 * Works over whatever fleet of bags the user has enabled — any number of
 * checked bags plus any number of cabin-class bags (cabin, backpack).
 * Constraint families:
 *   1. Transport rules  — cabin-must (documents, lithium electronics, meds)
 *      go to a cabin-class bag; cabin-never (blades, cookers, liquids, bulk
 *      powders) go to checked only; cabin-prefer prefers cabin-class.
 *   2. Weight limits    — per bag (23 kg checked, 7 kg cabin/backpack).
 *   3. Volume limits    — usable litres from each bag's dimensions.
 *   4. Resilience       — seeds a couple of outfits into a cabin-class bag so
 *      a delayed checked bag doesn't strand the student.
 *
 * Multi-unit lines split freely across bags. Deterministic.
 */

export interface BagSpec {
  id: BagId;
  limitKg: number;
  class: BagClass;
  /** personal item under the seat — filled first with quick-access essentials */
  quickAccess?: boolean;
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
  unplaced: { itemId: string; name: string; units: number }[];
  notes: LoadsheetNote[];
  totals: Record<string, { kg: number; volL: number }>;
}

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

/**
 * Order cabin-class bags by role. quickFirst=true puts the personal item
 * (backpack) first — for must-carry essentials and the resilience seed, which
 * belong under the seat. quickFirst=false puts the overhead roller first — for
 * bulky cabin-prefer items, keeping the small quick-access bag uncluttered.
 * Stable sort, so catalog order breaks ties (deterministic).
 */
function cabinByRole(cabinBags: BagState[], quickFirst: boolean): BagState[] {
  const key = (b: BagState) => (b.quickAccess ? 0 : 1);
  return [...cabinBags].sort((a, b) => (quickFirst ? key(a) - key(b) : key(b) - key(a)));
}

/** Fill a list of bags in order with as many units as fit; returns units left. */
function fillInto(
  alloc: Record<string, Allocation>,
  bags: BagState[],
  item: PackingItem,
  units: number,
): number {
  const vL = unitVolumeL(item);
  let remaining = units;
  for (const bag of bags) {
    if (remaining <= 0) break;
    const n = unitsThatFit(bag, item.weightKg, vL, remaining);
    if (n > 0) {
      place(alloc, bag, item.id, n, item.weightKg, vL);
      remaining -= n;
    }
  }
  return remaining;
}

export function computeLoadsheet(
  lines: LoadsheetLine[],
  bagSpecs: BagSpec[],
): LoadsheetResult {
  const states = bagSpecs.map<BagState>((s) => ({ ...s, kg: 0, volL: 0 }));
  const byId = new Map(states.map((s) => [s.id, s]));
  const cabinBags = states.filter((s) => s.class === "cabin");
  const checkedBags = states.filter((s) => s.class === "checked");
  const alloc: Record<string, Allocation> = {};
  const unplaced: LoadsheetResult["unplaced"] = [];
  const notes: LoadsheetNote[] = [];
  const ruleNotes = new Set<string>();

  const hasCabin = cabinBags.length > 0;
  const hasChecked = checkedBags.length > 0;
  // Under-the-seat essentials go to the personal item (backpack) first;
  // bulky cabin items go to the overhead roller first.
  const quickAccessFirst = cabinByRole(cabinBags, true);
  const rollerFirst = cabinByRole(cabinBags, false);
  const hasBackpack = cabinBags.some((b) => b.quickAccess);

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
    const target = hasCabin ? quickAccessFirst : checkedBags; // backpack first, else forced to checked
    const left = fillInto(alloc, target, l.item, l.qty);
    if (left > 0) unplaced.push({ itemId: l.item.id, name: l.item.name, units: left });
    if (!hasCabin) {
      ruleNotes.add(`${l.item.name} should ride in a cabin bag — add a Cabin or Backpack to carry it on.`);
    } else if (l.item.transport.note) {
      ruleNotes.add(`${l.item.name} → cabin: ${l.item.transport.note}`);
    }
  }
  const cabinKg = cabinBags.reduce((s, b) => s + b.kg, 0);
  const cabinLimit = cabinBags.reduce((s, b) => s + b.limitKg, 0);
  if (hasCabin && cabinKg > cabinLimit) {
    notes.push({
      level: "warn",
      text: `Cabin must-carry items weigh ${cabinKg.toFixed(1)} kg (cabin allowance ${cabinLimit} kg). Wear your heaviest layers or add a backpack.`,
    });
  }

  // ── Phase 2 · resilience seeding (e.g. 2 outfits in a cabin-class bag) ─────
  let seeded = false;
  if (hasCabin && hasChecked) {
    for (const l of sorted) {
      const seed = l.item.cabinSeed ?? 0;
      if (seed <= 0 || l.item.transport?.cabin === "never") continue;
      const already = allocatedUnits(alloc[l.item.id]);
      const wantable = Math.min(seed, l.qty - already);
      if (wantable <= 0) continue;
      const left = fillInto(alloc, quickAccessFirst, l.item, wantable);
      if (left < wantable) seeded = true;
    }
  }
  if (seeded) {
    notes.push({
      level: "info",
      text: hasBackpack
        ? "Seeded a spare outfit into your backpack — quick to reach, and if a checked bag is delayed you're covered for the first days."
        : "Seeded spare clothes into your cabin bag — if a checked bag is delayed, you're covered for the first days.",
    });
  }

  // ── Phase 3 · cabin-prefer: glasses, jackets, adapters — cabin first ──────
  for (const l of sorted) {
    if (l.item.transport?.cabin !== "prefer" || !hasCabin) continue;
    const already = allocatedUnits(alloc[l.item.id]);
    const remaining = l.qty - already;
    if (remaining <= 0) continue;
    const before = remaining;
    const left = fillInto(alloc, rollerFirst, l.item, remaining);
    if (left < before && l.item.transport.note) {
      ruleNotes.add(`${l.item.name} → cabin: ${l.item.transport.note}`);
    }
    // leftover falls through to checked in phase 4
  }

  // ── Phase 4 · everything remaining → checked (worst-fit-decreasing) ───────
  for (const l of sorted) {
    const vL = unitVolumeL(l.item);
    let remaining = l.qty - allocatedUnits(alloc[l.item.id]);
    if (remaining <= 0) continue;

    // worst-fit: always target the checked bag with the most remaining weight
    // headroom, so the two (or more) checked bags stay balanced.
    while (remaining > 0 && hasChecked) {
      const roomiest = [...checkedBags].sort(
        (a, b) => (b.limitKg - b.kg) - (a.limitKg - a.kg) || a.id.localeCompare(b.id),
      )[0];
      const n = unitsThatFit(roomiest, l.item.weightKg, vL, remaining);
      if (n <= 0) break;
      place(alloc, roomiest, l.item.id, n, l.item.weightKg, vL);
      remaining -= n;
    }
    if (remaining < l.qty && remaining === 0 && l.qty > 1 && checkedBags.length > 1) {
      const spread = checkedBags.filter((b) => (alloc[l.item.id]?.[b.id] ?? 0) > 0).length;
      if (spread > 1) ruleNotes.add(`${l.item.name} split across bags to stay under the limits.`);
    }

    // overflow → cabin-class (roller first), unless banned there
    if (remaining > 0 && l.item.transport?.cabin !== "never" && hasCabin) {
      remaining = fillInto(alloc, rollerFirst, l.item, remaining);
    }

    if (remaining > 0) {
      unplaced.push({ itemId: l.item.id, name: l.item.name, units: remaining });
    }
    if (l.item.transport?.cabin === "never" && l.item.transport.note) {
      ruleNotes.add(`${l.item.name} → checked only: ${l.item.transport.note}`);
    }
  }

  // ── Phase 5 · rebalance checked bags (move splittable units heavy→light) ──
  if (checkedBags.length > 1) {
    let guard = 128;
    while (guard-- > 0) {
      const sortedByKg = [...checkedBags].sort((a, b) => b.kg - a.kg);
      const heavy = sortedByKg[0];
      const light = sortedByKg[sortedByKg.length - 1];
      if (heavy.kg - light.kg <= 2) break;
      let best: { l: LoadsheetLine; vL: number } | null = null;
      for (const l of sorted) {
        const inHeavy = alloc[l.item.id]?.[heavy.id] ?? 0;
        if (inHeavy <= 0) continue;
        const vL = unitVolumeL(l.item);
        if (!fits(light, l.item.weightKg, vL)) continue;
        const gapNow = heavy.kg - light.kg;
        const gapAfter = Math.abs(
          heavy.kg - l.item.weightKg - (light.kg + l.item.weightKg),
        );
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
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  for (const t of ruleNotes) notes.push({ level: "info", text: t });
  if (sorted.some((l) => l.item.id === "heavy-coat" || l.item.id === "transit-jacket")) {
    notes.push({
      level: "info",
      text: "Wear your heaviest jacket on the flight — it's free weight the scale never sees.",
    });
  }
  for (const u of unplaced) {
    notes.push({
      level: "warn",
      text: `Couldn't fit ${u.units} × ${u.name} — reduce the quantity, add or resize a bag, or leave it for the US.`,
    });
  }
  for (const b of states) {
    if (b.kg > b.limitKg)
      notes.push({
        level: "warn",
        text: `${bagDef(b.id).label} is over its weight limit by ${(b.kg - b.limitKg).toFixed(1)} kg.`,
      });
  }

  const totals: Record<string, { kg: number; volL: number }> = {};
  for (const b of states) totals[b.id] = { kg: b.kg, volL: b.volL };

  return { alloc, unplaced, notes, totals };
}

/**
 * Rule check for MANUAL placements — the user is sovereign, but we warn.
 * Uses the bag's class so it's correct for cabin AND backpack.
 */
export function placementWarning(item: PackingItem, bag: BagId): string | null {
  const t = item.transport;
  if (!t) return null;
  const isCabinClass = bagDef(bag).class === "cabin";
  if (t.cabin === "never" && isCabinClass) {
    return `${item.name} isn't allowed in a carry-on${t.note ? ` — ${t.note}` : ""}.`;
  }
  if (t.cabin === "must" && !isCabinClass) {
    return `${item.name} should stay in your cabin bag${t.note ? ` — ${t.note}` : ""}.`;
  }
  return null;
}

/** Build bag specs for a fleet of active bags from their dimensions (w×h×d cm, 85% usable). */
export function bagSpecsFrom(
  activeBags: BagId[],
  dims: Record<BagId, { w: number; h: number; d: number }>,
): BagSpec[] {
  return BAG_CATALOG.filter((b) => activeBags.includes(b.id)).map((b) => {
    const d = dims[b.id];
    return {
      id: b.id,
      limitKg: b.limitKg,
      class: b.class,
      quickAccess: b.quickAccess,
      capacityL: d ? ((d.w * d.h * d.d) / 1000) * 0.85 : 0,
    };
  });
}
