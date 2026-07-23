import { PACKING_ITEMS } from "./packing-items";
import type { Category, Verdict } from "./types";

/**
 * Import-a-packing-list logic. The primary path is the AI matcher
 * (lib/actions/import.ts), which parses messy pasted text AND matches each line
 * to the catalog in one shot. Everything here is the deterministic fallback used
 * when the AI key is missing or the call fails — plus the shared types. Pure and
 * unit-tested in scripts/test-import.ts.
 */

export interface ParsedRow {
  name: string;
  qty: number;
}

export interface ImportMatch {
  /** the original line/name as parsed */
  raw: string;
  qty: number;
  /** catalog PackingItem id when matched, else null */
  matchedId: string | null;
  matchedName?: string;
  /** true when this becomes a new custom item rather than a catalog match */
  custom: boolean;
  /** display + save name (catalog name when matched, else cleaned input) */
  name: string;
  category: Category;
  weightKg?: number;
  verdict?: Verdict;
  /** how sure we are of the match — drives a review hint in the UI */
  confidence: "high" | "low";
}

export const MAX_IMPORT_ROWS = 80;
export const MAX_IMPORT_CHARS = 8000;

const CATALOG = PACKING_ITEMS.map((i) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  weightKg: i.weightKg,
}));

/** Catalog rendered for the AI prompt: "id\tname\tcategory" per line. */
export function catalogForPrompt(): string {
  return CATALOG.map((i) => `${i.id}\t${i.name}\t${i.category}`).join("\n");
}

const clampQty = (n: number) => Math.max(1, Math.min(99, Math.floor(n) || 1));

const titleCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Parse messy pasted text into {name, qty} rows. Handles Excel/Sheets paste
 * (tab-separated), CSV, "3 x name", "name - 3", "name (2)", bullets and
 * numbered lists, and plain lines (qty defaults to 1).
 */
export function parseRows(raw: string): ParsedRow[] {
  if (!raw) return [];
  const out: ParsedRow[] = [];
  for (const line0 of raw.split(/\r?\n/)) {
    let line = line0.trim();
    if (!line) continue;
    // skip an obvious header row ("item, quantity")
    if (/^(item|name|thing)s?\b.*\b(qty|quantity|count|no\.?|number)\b/i.test(line)) continue;

    let name = "";
    let qty = 1;

    // 1) delimited: Excel/Sheets paste (tab) or CSV
    const delim = line.includes("\t") ? "\t" : line.includes(",") ? "," : null;
    if (delim) {
      const fields = line
        .split(delim)
        .map((f) => f.trim().replace(/^["']|["']$/g, "").trim())
        .filter(Boolean);
      if (fields.length >= 2) {
        const numIdx = fields.findIndex((f) => /^\d{1,3}$/.test(f));
        if (numIdx >= 0) {
          qty = clampQty(parseInt(fields[numIdx], 10));
          name = fields.filter((_, i) => i !== numIdx).join(" ").trim();
        } else {
          name = fields[0];
        }
      } else if (fields.length === 1) {
        line = fields[0];
      }
    }

    // 2) plain line: strip list markers, then look for a leading or trailing qty
    if (!name) {
      const s = line
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+[.)]\s+/, "")
        .trim();

      const lead = s.match(/^(\d{1,3})\s*[x×]?\s+(\D.*)$/i);
      const trail = s.match(/^(.+?)[\s:\-–—(]+[x×]?\s*(\d{1,3})\)?$/i);
      if (lead) {
        qty = clampQty(parseInt(lead[1], 10));
        name = lead[2].trim();
      } else if (trail) {
        name = trail[1].trim();
        qty = clampQty(parseInt(trail[2], 10));
      } else {
        name = s;
      }
    }

    name = name.replace(/\s+/g, " ").trim();
    if (name.length < 2) continue;
    out.push({ name, qty });
    if (out.length >= MAX_IMPORT_ROWS) break;
  }
  return out;
}

const STOP = new Set(["the", "a", "an", "and", "for", "of", "with", "my", "in", "to"]);
const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));

/** Best catalog match for a free-text name via token overlap; null if too weak. */
function bestCatalogMatch(name: string) {
  const q = tokens(name);
  if (q.length === 0) return null;
  const ql = name.toLowerCase();
  let best: (typeof CATALOG)[number] | null = null;
  let bestScore = 0;
  for (const item of CATALOG) {
    const t = tokens(item.name);
    const shared = q.filter((x) => t.includes(x)).length;
    const nl = item.name.toLowerCase();
    const substr = nl.includes(ql) || ql.includes(nl.split(" ")[0]) ? 1 : 0;
    const score = shared * 2 + substr;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  // require a real signal: at least one shared token AND either 2+ tokens or a substring hit
  return bestScore >= 2 ? best : null;
}

/** Deterministic fallback matcher (no AI): catalog match by tokens, else custom. */
export function localMatch(rows: ParsedRow[]): ImportMatch[] {
  return rows.map((r) => {
    const hit = bestCatalogMatch(r.name);
    if (hit) {
      return {
        raw: r.name,
        qty: r.qty,
        matchedId: hit.id,
        matchedName: hit.name,
        custom: false,
        name: hit.name,
        category: hit.category,
        weightKg: hit.weightKg,
        confidence: "low",
      };
    }
    return {
      raw: r.name,
      qty: r.qty,
      matchedId: null,
      custom: true,
      name: titleCase(r.name),
      category: "misc",
      weightKg: 0.3,
      verdict: "either",
      confidence: "low",
    };
  });
}
