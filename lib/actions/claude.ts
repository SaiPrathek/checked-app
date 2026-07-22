"use server";

import type { Category, Verdict } from "@/lib/types";

// Some hosts have slow/broken IPv6 routing, which stalls Node's default
// dual-stack (Happy Eyeballs) connection attempts. Prefer IPv4 to avoid
// spurious ETIMEDOUT failures reaching the classifier API.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dns").setDefaultResultOrder("ipv4first");
} catch {
  /* not available in this runtime (e.g. edge) — safe to ignore */
}

/**
 * Structured guess for a user-typed item. Every field can be missing when the
 * classifier is unsure or when the API key isn't configured — the UI treats
 * this as a prefill only; the user can override every field before saving.
 */
export interface ClassifiedItem {
  name?: string; // normalized/canonicalized name
  category?: Category;
  weightKg?: number;
  volumeL?: number;
  transport?: { cabin: "must" | "never" | "prefer"; note?: string };
  verdict?: Verdict;
  note?: string; // one-sentence bring/buy rationale for the student
  aiFilled: boolean;
}

const CATEGORIES: Category[] = [
  "documents", "clothing", "kitchen", "food", "medicines",
  "electronics", "bedding", "toiletries", "stationery", "money", "misc",
];
const VERDICTS: Verdict[] = ["bring-from-india", "buy-in-us", "either", "skip"];

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT =
  "You classify packing items for an Indian student moving to the US for a masters degree. " +
  "Respond with ONLY a JSON object (no prose, no markdown) with these fields:\n" +
  `- canonicalName: string — a normalized item name\n` +
  `- category: one of ${CATEGORIES.join(", ")}\n` +
  `- weightKg: number — rough per-unit weight in kilograms\n` +
  `- volumeL: number — rough per-unit packed volume in litres\n` +
  `- cabin: one of must, never, prefer, either — TSA cabin rule (lithium electronics, meds, docs, cash → must; blades, cookers, liquids >100 ml, powders >350 ml → never; jackets, adapters → prefer; else either)\n` +
  `- cabinNote: string — short note explaining the cabin rule (optional)\n` +
  `- verdict: one of ${VERDICTS.join(", ")} — whether it's worth packing from India\n` +
  `- rationale: string — one sentence on why bring, buy, or skip`;

/**
 * Ask a hosted LLM to fill in the structured fields for a user-typed item name.
 * Uses Groq (Llama 3.3 70B) via its OpenAI-compatible endpoint — free-tier
 * friendly and fast. Returns aiFilled=false when the API key is missing or the
 * call fails, so the UI can still show the empty form for manual entry.
 */
export async function classifyCustomItem(rawName: string): Promise<ClassifiedItem> {
  const name = rawName.trim();
  if (!name) return { aiFilled: false };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { aiFilled: false };

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Classify this item: "${name}"` },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error("classifyCustomItem groq", res.status, await res.text());
      return { aiFilled: false };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { aiFilled: false };

    const input = JSON.parse(content) as {
      canonicalName?: string;
      category?: string;
      weightKg?: number;
      volumeL?: number;
      cabin?: string;
      cabinNote?: string;
      verdict?: string;
      rationale?: string;
    };

    const category = CATEGORIES.includes(input.category as Category)
      ? (input.category as Category)
      : undefined;
    const verdict = VERDICTS.includes(input.verdict as Verdict)
      ? (input.verdict as Verdict)
      : undefined;
    const cabin =
      input.cabin === "must" || input.cabin === "never" || input.cabin === "prefer"
        ? input.cabin
        : undefined;

    return {
      name: input.canonicalName?.trim() || name,
      category,
      weightKg: typeof input.weightKg === "number" ? Math.max(0.01, input.weightKg) : undefined,
      volumeL: typeof input.volumeL === "number" ? Math.max(0.05, input.volumeL) : undefined,
      transport: cabin ? { cabin, note: input.cabinNote?.trim() || undefined } : undefined,
      verdict,
      note: input.rationale?.trim() || undefined,
      aiFilled: true,
    };
  } catch (e) {
    console.error("classifyCustomItem", e);
    return { aiFilled: false };
  }
}
