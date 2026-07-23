"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";

/** Per-day caps for each Groq-backed feature. Tune as real usage/cost lands. */
const AI_LIMITS = {
  tower: 30,
  import: 10,
  classify: 40,
} as const;

type AiFeature = keyof typeof AI_LIMITS;

/** UTC "YYYY-MM-DD" — the bucket key for a user's daily allowance. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically increment a signed-in user's daily AI counter and report whether
 * they're still under the cap. One round-trip (upsert … returning).
 *
 * Fails OPEN: if the counter write errors (e.g. transient DB blip) we allow the
 * call — the per-request `max_tokens` ceiling still bounds cost, and blocking a
 * legitimate user on an infra hiccup is the worse failure. Abuse protection
 * degrades gracefully, it never hard-locks the feature.
 */
export async function bumpAiUsage(
  userId: string,
  feature: AiFeature,
): Promise<{ ok: boolean; count: number; limit: number }> {
  const limit = AI_LIMITS[feature];
  try {
    const [row] = await db
      .insert(aiUsage)
      .values({ userId, day: today(), feature, count: 1 })
      .onConflictDoUpdate({
        target: [aiUsage.userId, aiUsage.day, aiUsage.feature],
        set: { count: sql`${aiUsage.count} + 1` },
      })
      .returning({ count: aiUsage.count });
    const count = row?.count ?? 1;
    return { ok: count <= limit, count, limit };
  } catch (e) {
    console.error("bumpAiUsage", feature, e);
    return { ok: true, count: 0, limit }; // fail open
  }
}
