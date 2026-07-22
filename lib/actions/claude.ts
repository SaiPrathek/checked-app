"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { Category, Verdict } from "@/lib/types";

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

/**
 * Ask Claude to fill in the structured fields for a user-typed item name.
 * Uses Haiku 4.5 — the item classification task is cheap and speed matters
 * more than nuance in the UI. Returns aiFilled=false when the API key is
 * missing or the call fails, so the UI can still show the empty form.
 */
export async function classifyCustomItem(rawName: string): Promise<ClassifiedItem> {
  const name = rawName.trim();
  if (!name) return { aiFilled: false };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { aiFilled: false };

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system:
        "You classify packing items for an Indian student moving to the US for a masters degree. " +
        "For each item, return: category (one of: documents, clothing, kitchen, food, medicines, " +
        "electronics, bedding, toiletries, stationery, money, misc), an estimated per-unit weightKg, volumeL, " +
        "whether it must/never/prefers the cabin per TSA rules (lithium electronics, meds, docs, " +
        "cash → must; blades, cookers, liquids >100 ml, powders >350 ml → never; jackets, " +
        "adapters → prefer; else omit), a verdict (bring-from-india, buy-in-us, either, or skip) " +
        "reflecting whether it's worth packing from India, and a one-sentence rationale. " +
        "Return only valid JSON matching the schema — no prose, no markdown fences.",
      messages: [
        {
          role: "user",
          content: `Classify this item: "${name}"`,
        },
      ],
      tools: [
        {
          name: "classify_item",
          description: "Record the structured fields for a packing item.",
          input_schema: {
            type: "object" as const,
            properties: {
              canonicalName: { type: "string", description: "Normalized item name" },
              category: { type: "string", enum: CATEGORIES },
              weightKg: { type: "number", description: "Rough per-unit weight in kilograms" },
              volumeL: { type: "number", description: "Rough per-unit packed volume in litres" },
              cabin: {
                type: "string",
                enum: ["must", "never", "prefer", "either"],
                description: "TSA cabin rule; use 'either' when no strong preference",
              },
              cabinNote: { type: "string", description: "Optional short note explaining the cabin rule" },
              verdict: { type: "string", enum: VERDICTS },
              rationale: { type: "string", description: "One sentence: why bring, buy, or skip" },
            },
            required: ["category", "weightKg", "verdict", "rationale"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "classify_item" },
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return { aiFilled: false };
    const input = toolUse.input as {
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
