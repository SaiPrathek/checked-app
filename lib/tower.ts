import { HOLD } from "./hold";
import type { HoldItem, Profile } from "./types";

/** Groq (Llama 3.3 70B) via its OpenAI-compatible endpoint — same provider as
 *  lib/actions/claude.ts, free-tier friendly and fast. */
export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/** Hard caps so a public endpoint can't be coaxed into huge generations. */
export const MAX_QUERY_LEN = 400;
export const MAX_SOURCES = 6;

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Resolve the source keys the client selected back into full Hold entries.
 * The client picks sources with searchHold (so what it *shows* and what the
 * model is *grounded on* are guaranteed identical), then sends the keys here.
 */
export function lookupSources(keys: string[]): HoldItem[] {
  const seen = new Set<string>();
  const out: HoldItem[] = [];
  for (const key of keys) {
    if (seen.has(key)) continue;
    const hit = HOLD.find((h) => h.item === key);
    if (hit) {
      out.push(hit);
      seen.add(key);
    }
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}

/** A one-line profile summary so answers can be personalized. Only set fields. */
export function profileSummary(p: Profile | undefined): string {
  if (!p) return "";
  const bits: string[] = [];
  if (p.university) bits.push(`studying at ${p.university}`);
  if (p.city) bits.push(`in ${p.city}${p.state ? `, ${p.state}` : ""}`);
  if (p.climate) bits.push(`${p.climate} climate`);
  if (p.intake) bits.push(`${p.intake} intake`);
  if (p.housing) bits.push(p.housing);
  if (p.roommates) bits.push(p.roommates === "roommates" ? "with roommates" : "living alone");
  if (p.dietPractice && p.dietPractice !== "none") bits.push(`${p.dietPractice} diet`);
  if (p.cuisine) bits.push(`${p.cuisine} Indian cuisine`);
  if (p.cooking) bits.push(`cooks ${p.cooking}`);
  if (p.beverage && p.beverage !== "none") bits.push(p.beverage.replace("-", " "));
  return bits.join(", ");
}

const SYSTEM_PROMPT = [
  "You are The Tower, an assistant for Indian students moving to the US for higher studies.",
  "You help with packing, bring-vs-buy decisions, customs, and settling-in questions.",
  "",
  "Rules — follow them strictly:",
  "- Answer ONLY using the numbered SOURCES provided. Do not add facts from outside them.",
  "- Cite the sources you rely on inline as [1], [2], etc., matching their numbers.",
  "- If the sources don't contain enough to answer, say plainly that The Hold doesn't have a",
  "  verified answer on that yet, and suggest checking with their university's international",
  "  student office. Do not guess or fill gaps from memory.",
  "- For visa, immigration, legal, tax, or medical questions, never state definitive rules —",
  "  briefly point them to official sources (USCIS, the U.S. Dept of State, their university ISS).",
  "- Never invent prices, weights, or customs rules that aren't in the sources.",
  "- Keep it to 2–4 sentences, plain and warm. No markdown headings or bullet lists.",
].join("\n");

/** Build the grounded chat messages. `sources` must be the exact entries shown to the user. */
export function buildTowerMessages(
  query: string,
  sources: HoldItem[],
  profile?: Profile,
): ChatMessage[] {
  const numbered = sources
    .map(
      (h, i) =>
        `[${i + 1}] ${h.item} — verdict: ${h.verdict} (confidence: ${h.confidence}). ${h.detail}`,
    )
    .join("\n");

  const summary = profileSummary(profile);
  const user = [
    summary ? `Student profile: ${summary}.\n` : "",
    "SOURCES:",
    numbered,
    "",
    `QUESTION: ${query}`,
  ].join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: user },
  ];
}
