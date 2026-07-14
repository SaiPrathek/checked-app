"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { debriefResponses } from "@/lib/db/schema";
import { ensureUser } from "./user";
import {
  DEBRIEF_VERDICTS,
  STAT_THRESHOLD,
  type DebriefVerdict,
  type Stat,
} from "@/lib/debrief";

export async function submitDebrief(
  item: string,
  verdict: DebriefVerdict,
  note?: string,
): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  if (!DEBRIEF_VERDICTS.includes(verdict))
    throw new Error("Invalid Debrief verdict");
  await db
    .insert(debriefResponses)
    .values({ userId, item, verdict, note: note ?? null })
    .onConflictDoUpdate({
      target: [debriefResponses.userId, debriefResponses.item],
      set: {
        verdict: sql`excluded.verdict`,
        note: sql`excluded.note`,
        submittedAt: sql`now()`,
      },
    });
}

export async function deleteDebrief(item: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  await db
    .delete(debriefResponses)
    .where(and(eq(debriefResponses.userId, userId), eq(debriefResponses.item, item)));
}

/** The current user's own Debriefs, keyed by hold item. */
export async function getMyDebriefs(): Promise<Record<string, DebriefVerdict>> {
  const { userId } = await auth();
  if (!userId) return {};
  const rows = await db
    .select({ item: debriefResponses.item, verdict: debriefResponses.verdict })
    .from(debriefResponses)
    .where(eq(debriefResponses.userId, userId));
  const map: Record<string, DebriefVerdict> = {};
  for (const r of rows) map[r.item] = r.verdict as DebriefVerdict;
  return map;
}

/**
 * Aggregate community stats for a set of Hold items. Only returns stats
 * for items that meet STAT_THRESHOLD — sub-threshold items are omitted.
 * Pass no filter to fetch all items.
 */
export async function getCommunityStats(items?: string[]): Promise<Stat[]> {
  const rows = items?.length
    ? await db
        .select({
          item: debriefResponses.item,
          verdict: debriefResponses.verdict,
          count: sql<number>`count(*)::int`,
        })
        .from(debriefResponses)
        .where(inArray(debriefResponses.item, items))
        .groupBy(debriefResponses.item, debriefResponses.verdict)
    : await db
        .select({
          item: debriefResponses.item,
          verdict: debriefResponses.verdict,
          count: sql<number>`count(*)::int`,
        })
        .from(debriefResponses)
        .groupBy(debriefResponses.item, debriefResponses.verdict);

  const byItem = new Map<string, Stat>();
  for (const r of rows) {
    let s = byItem.get(r.item);
    if (!s) {
      s = {
        item: r.item,
        total: 0,
        counts: {
          "worth-it": 0,
          useless: 0,
          "should-buy-there": 0,
          "wish-brought-more": 0,
        },
        top: null,
      };
      byItem.set(r.item, s);
    }
    const v = r.verdict as DebriefVerdict;
    s.counts[v] = r.count;
    s.total += r.count;
  }
  const out: Stat[] = [];
  for (const s of byItem.values()) {
    if (s.total < STAT_THRESHOLD) continue;
    let top: Stat["top"] = null;
    for (const v of DEBRIEF_VERDICTS) {
      const pct = Math.round((s.counts[v] / s.total) * 100);
      if (!top || pct > top.pct) top = { verdict: v, pct };
    }
    s.top = top;
    out.push(s);
  }
  return out;
}
