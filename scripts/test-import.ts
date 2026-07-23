/**
 * Import parser/matcher checks — run with: npx tsx scripts/test-import.ts
 * Exits non-zero on any failure. Covers lib/import.ts (fallback path).
 */
import { parseRows, localMatch } from "@/lib/import";
import { PACKING_ITEMS } from "@/lib/packing-items";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const one = (raw: string) => parseRows(raw)[0];

console.log("parseRows · formats");
{
  check("tab-separated (Excel paste)", (() => { const r = one("Pressure cooker\t2"); return r?.name === "Pressure cooker" && r.qty === 2; })());
  check("csv name,qty", (() => { const r = one("Winter jacket, 1"); return r?.name === "Winter jacket" && r.qty === 1; })());
  check("csv qty,name", (() => { const r = one("3, T-shirts"); return r?.name === "T-shirts" && r.qty === 3; })());
  check("leading qty", (() => { const r = one("5 t-shirts"); return r?.name === "t-shirts" && r.qty === 5; })());
  check("leading qty with x", (() => { const r = one("3 x towels"); return r?.name === "towels" && r.qty === 3; })());
  check("trailing x-qty", (() => { const r = one("towels x2"); return r?.name === "towels" && r.qty === 2; })());
  check("trailing dash qty", (() => { const r = one("towels - 3"); return r?.name === "towels" && r.qty === 3; })());
  check("trailing colon qty", (() => { const r = one("socks: 4"); return r?.name === "socks" && r.qty === 4; })());
  check("trailing paren qty", (() => { const r = one("socks (6)"); return r?.name === "socks" && r.qty === 6; })());
  check("plain line → qty 1", (() => { const r = one("Yoga mat"); return r?.name === "Yoga mat" && r.qty === 1; })());
  check("dash bullet stripped", (() => { const r = one("- Passport"); return r?.name === "Passport" && r.qty === 1; })());
  check("numbered marker (not qty)", (() => { const r = one("1. Cooker"); return r?.name === "Cooker" && r.qty === 1; })());
  check("qty clamped to 99", (() => { const r = one("999 socks"); return r?.qty === 99; })());
}

console.log("parseRows · whole documents");
{
  const rows = parseRows("Item, Quantity\nPassport\n5 t-shirts\n\ntowels x2\n• Spices");
  check("skips header row", !rows.some((r) => /^item$/i.test(r.name)));
  check("skips blank lines", rows.length === 4, `got ${rows.length}`);
  check("bullet + trailing all parsed", rows[2]?.name === "towels" && rows[2]?.qty === 2);
  check("names cleaned (bullet)", rows[3]?.name === "Spices");
  check("too-short names dropped", parseRows("a\nok item").length === 1);
}

console.log("localMatch · catalog vs custom");
{
  const known = PACKING_ITEMS[0];
  const m = localMatch([{ name: known.name, qty: 2 }])[0];
  check("exact catalog name → matched (not custom)", m.custom === false && m.matchedId !== null, JSON.stringify({ custom: m.custom, id: m.matchedId }));
  check("matched keeps qty", m.qty === 2);
  check("matched carries catalog category", m.category === known.category);

  const g = localMatch([{ name: "Zqxwv Flibberdoodle", qty: 3 }])[0];
  check("gibberish → custom", g.custom === true && g.matchedId === null);
  check("custom defaults to misc/either", g.category === "misc" && g.verdict === "either");
  check("custom keeps qty", g.qty === 3);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
