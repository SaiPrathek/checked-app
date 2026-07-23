"use server";

import { auth } from "@clerk/nextjs/server";
import {
  catalogForPrompt,
  MAX_IMPORT_CHARS,
  MAX_IMPORT_ROWS,
  type ImportMatch,
} from "@/lib/import";
import { bumpAiUsage } from "@/lib/actions/ai-usage";
import { PACKING_ITEMS } from "@/lib/packing-items";
import type { Category, Verdict } from "@/lib/types";

// Prefer IPv4 to dodge stalled dual-stack connects on some hosts (mirrors
// lib/actions/claude.ts).
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dns").setDefaultResultOrder("ipv4first");
} catch {
  /* not available in this runtime */
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const CATEGORIES: Category[] = [
  "documents", "clothing", "kitchen", "food", "medicines",
  "electronics", "bedding", "toiletries", "stationery", "money", "misc",
];
const VERDICTS: Verdict[] = ["bring-from-india", "buy-in-us", "either", "skip"];
const CATALOG_IDS = new Set(PACKING_ITEMS.map((i) => i.id));
const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));

const clampQty = (n: unknown) =>
  Math.max(1, Math.min(99, Math.floor(typeof n === "number" ? n : 1) || 1));

const SYSTEM_PROMPT =
  "You help an Indian student moving to the US turn a list of things they've " +
  "already packed into a structured packing manifest.\n" +
  "You are given a CATALOG (tab-separated: id, name, category) and the user's raw list.\n" +
  "Parse the raw list into individual items with a quantity each, then for EACH item:\n" +
  "- If it clearly corresponds to a catalog entry, set matchedId to that catalog id.\n" +
  "- Otherwise set matchedId to null and fill category (one of the catalog categories), " +
  "a rough per-unit weightKg, and a verdict (bring-from-india | buy-in-us | either | skip).\n" +
  "Respond with ONLY a JSON object: { \"items\": [ { \"name\": string, \"qty\": number, " +
  "\"matchedId\": string|null, \"category\": string, \"weightKg\": number, \"verdict\": string } ] }.\n" +
  "Keep quantities the user gave; default to 1. Do not invent items that aren't in the list.";

/**
 * AI-parse a pasted packing list and match each line to the catalog.
 * Returns null when the key is missing or the call fails, so the client can
 * fall back to the deterministic parseRows + localMatch path.
 */
export async function aiMatchImport(raw: string): Promise<ImportMatch[] | null> {
  const text = (raw ?? "").slice(0, MAX_IMPORT_CHARS).trim();
  if (!text) return [];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Sign-in-gated + daily-capped; null makes the caller fall back to the
  // deterministic local parseRows + localMatch path.
  const { userId } = await auth();
  if (!userId) return null;
  const usage = await bumpAiUsage(userId, "import");
  if (!usage.ok) return null;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `CATALOG:\n${catalogForPrompt()}\n\nRAW LIST:\n${text}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      console.error("aiMatchImport groq", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      items?: {
        name?: string;
        qty?: number;
        matchedId?: string | null;
        category?: string;
        weightKg?: number;
        verdict?: string;
      }[];
    };
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, MAX_IMPORT_ROWS) : [];
    if (items.length === 0) return null; // let the caller fall back

    return items
      .filter((it) => (it.name ?? "").trim().length >= 2)
      .map((it): ImportMatch => {
        const name = (it.name ?? "").trim();
        const qty = clampQty(it.qty);
        const matchedId =
          it.matchedId && CATALOG_IDS.has(it.matchedId) ? it.matchedId : null;

        if (matchedId) {
          const cat = byId.get(matchedId)!;
          return {
            raw: name,
            qty,
            matchedId,
            matchedName: cat.name,
            custom: false,
            name: cat.name,
            category: cat.category,
            weightKg: cat.weightKg,
            confidence: "high",
          };
        }

        const category = CATEGORIES.includes(it.category as Category)
          ? (it.category as Category)
          : "misc";
        const verdict = VERDICTS.includes(it.verdict as Verdict)
          ? (it.verdict as Verdict)
          : "either";
        return {
          raw: name,
          qty,
          matchedId: null,
          custom: true,
          name,
          category,
          weightKg:
            typeof it.weightKg === "number" ? Math.max(0.01, it.weightKg) : 0.3,
          verdict,
          confidence: "high",
        };
      });
  } catch (e) {
    console.error("aiMatchImport", e);
    return null;
  }
}
