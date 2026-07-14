/**
 * Loadsheet algorithm checks — run with: npx tsx scripts/test-loadsheet.ts
 * Exits non-zero on any failure.
 */
import { PACKING_ITEMS } from "@/lib/packing-items";
import { computeLoadsheet, bagSpecsFrom, unitVolumeL, type LoadsheetLine } from "@/lib/loadsheet";
import { allocatedUnits, type BagId } from "@/lib/types";

const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));
const DIMS = {
  bag1: { w: 71, h: 48, d: 30 },
  bag2: { w: 61, h: 43, d: 26 },
  cabin: { w: 55, h: 40, d: 20 },
};

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function lines(entries: [string, number][]): LoadsheetLine[] {
  return entries.map(([id, qty]) => {
    const item = byId.get(id);
    if (!item) throw new Error(`unknown item ${id}`);
    return { item, qty };
  });
}

// ─── Scenario 1: realistic full load (cold climate, cooks daily) ─────────────
console.log("Scenario 1 · full realistic load");
{
  const input = lines([
    ["passport", 1], ["doc-copies", 1], ["photos", 10], ["rx", 1], ["otc-kit", 1],
    ["glasses", 2], ["transit-jacket", 1], ["thermals", 5], ["everyday-clothes", 14],
    ["shoes", 2], ["formal", 1], ["ethnic", 1], ["cooker", 1], ["tava", 1],
    ["kitchen-basics", 1], ["spice-south", 1], ["filter-coffee-kit", 1],
    ["pickles-podis", 2], ["instant", 12], ["snacks", 3], ["rice-dal", 3],
    ["laptop", 1], ["phone", 1], ["adapter", 2], ["toiletries", 1], ["forex", 1],
  ]);
  const r = computeLoadsheet(input, bagSpecsFrom(DIMS));

  // every unit placed
  const totalUnits = input.reduce((s, l) => s + l.qty, 0);
  const placedUnits = Object.values(r.alloc).reduce((s, a) => s + allocatedUnits(a), 0);
  check("all units placed", placedUnits === totalUnits && r.unplaced.length === 0,
    `placed ${placedUnits}/${totalUnits}, unplaced=${JSON.stringify(r.unplaced)}`);

  // hard rules
  check("passport in cabin only", (r.alloc["passport"]?.cabin ?? 0) === 1 && !r.alloc["passport"]?.bag1 && !r.alloc["passport"]?.bag2);
  check("laptop in cabin", (r.alloc["laptop"]?.cabin ?? 0) === 1);
  check("cooker NOT in cabin", !r.alloc["cooker"]?.cabin);
  check("kitchen-basics (knife) NOT in cabin", !r.alloc["kitchen-basics"]?.cabin);
  check("toiletries (liquids) NOT in cabin", !r.alloc["toiletries"]?.cabin);
  check("spice kit NOT in cabin", !r.alloc["spice-south"]?.cabin);

  // resilience seeding
  check("2 outfits seeded in cabin", (r.alloc["everyday-clothes"]?.cabin ?? 0) >= 2,
    `cabin clothes = ${r.alloc["everyday-clothes"]?.cabin}`);

  // limits respected
  for (const b of ["bag1", "bag2", "cabin"] as BagId[]) {
    const limit = b === "cabin" ? 7 : 23;
    check(`${b} within weight limit`, r.totals[b].kg <= limit + 1e-9, `${r.totals[b].kg.toFixed(1)} kg`);
  }

  // balance between checked bags
  const gap = Math.abs(r.totals.bag1.kg - r.totals.bag2.kg);
  check("checked bags balanced (≤3kg gap)", gap <= 3, `gap ${gap.toFixed(1)} kg`);
  console.log(`    bag1 ${r.totals.bag1.kg.toFixed(1)}kg/${r.totals.bag1.volL.toFixed(0)}L · bag2 ${r.totals.bag2.kg.toFixed(1)}kg/${r.totals.bag2.volL.toFixed(0)}L · cabin ${r.totals.cabin.kg.toFixed(1)}kg/${r.totals.cabin.volL.toFixed(0)}L`);
}

// ─── Scenario 2: splitting — heavy multi-unit line forces a split ────────────
console.log("Scenario 2 · forced split of a multi-unit line");
{
  // 30 kg of rice can't fit in one 23 kg bag → must split
  const input = lines([["rice-dal", 30]]);
  const r = computeLoadsheet(input, bagSpecsFrom(DIMS));
  const a = r.alloc["rice-dal"] ?? {};
  check("split across both checked bags", (a.bag1 ?? 0) > 0 && (a.bag2 ?? 0) > 0,
    JSON.stringify(a));
  check("no checked bag over 23kg", (a.bag1 ?? 0) <= 23 && (a.bag2 ?? 0) <= 23);
  check("all 30 units placed (7 spill to cabin ok — rice allowed in cabin)",
    allocatedUnits(a) + (r.unplaced[0]?.units ?? 0) === 30);
}

// ─── Scenario 3: overflow — more than the three bags can hold ────────────────
console.log("Scenario 3 · genuine overflow → unplaced + warning");
{
  const input = lines([["rice-dal", 60]]); // 60 kg into 23+23+7
  const r = computeLoadsheet(input, bagSpecsFrom(DIMS));
  const placed = allocatedUnits(r.alloc["rice-dal"]);
  check("places up to capacity", placed >= 50 && placed <= 53, `placed ${placed}`);
  check("reports unplaced remainder", (r.unplaced[0]?.units ?? 0) === 60 - placed);
  check("emits overflow warning", r.notes.some((n) => n.level === "warn" && n.text.includes("Couldn't fit")));
}

// ─── Scenario 4: cabin-banned item with no checked space ─────────────────────
console.log("Scenario 4 · cabin-banned overflow never leaks into cabin");
{
  const input = lines([["rice-dal", 44], ["cooker", 3]]); // fills checked, cookers compete
  const r = computeLoadsheet(input, bagSpecsFrom(DIMS));
  check("no cooker in cabin even under pressure", !r.alloc["cooker"]?.cabin,
    JSON.stringify(r.alloc["cooker"]));
}

// ─── Scenario 5: determinism ─────────────────────────────────────────────────
console.log("Scenario 5 · deterministic output");
{
  const input = lines([["everyday-clothes", 14], ["shoes", 2], ["cooker", 1], ["laptop", 1]]);
  const a = JSON.stringify(computeLoadsheet(input, bagSpecsFrom(DIMS)).alloc);
  const b = JSON.stringify(computeLoadsheet(input, bagSpecsFrom(DIMS)).alloc);
  check("same input → same loadsheet", a === b);
}

// ─── Scenario 6: volume constraint binds before weight ───────────────────────
console.log("Scenario 6 · volume-limited packing");
{
  // bedding is light (2.5kg) but bulky (12L): a tiny bag should refuse by volume
  const tiny = bagSpecsFrom({ bag1: { w: 40, h: 30, d: 15 }, bag2: { w: 40, h: 30, d: 15 }, cabin: { w: 30, h: 20, d: 10 } });
  const input = lines([["bedding", 6]]); // 72L into ~15.3L bags
  const r = computeLoadsheet(input, tiny);
  const placed = allocatedUnits(r.alloc["bedding"]);
  check("volume caps placement", placed <= 2, `placed ${placed}`);
  check("unplaced reported", (r.unplaced[0]?.units ?? 0) === 6 - placed);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
