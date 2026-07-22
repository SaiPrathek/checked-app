"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { checklistChecks } from "@/lib/db/schema";
import { ensureUser } from "./user";

/** Keys the user has ticked off (row presence = checked). */
export async function getMyChecklist(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const rows = await db
    .select({ key: checklistChecks.key })
    .from(checklistChecks)
    .where(eq(checklistChecks.userId, userId));
  return rows.map((r) => r.key);
}

/** Tick (insert) or untick (delete) a single checklist row. */
export async function setChecklistCheck(key: string, checked: boolean): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  if (checked) {
    await db
      .insert(checklistChecks)
      .values({ userId, key })
      .onConflictDoNothing({ target: [checklistChecks.userId, checklistChecks.key] });
  } else {
    await db
      .delete(checklistChecks)
      .where(and(eq(checklistChecks.userId, userId), eq(checklistChecks.key, key)));
  }
}

/** Bulk tick/untick — used by Check all / Clear on a category. */
export async function setChecklistChecks(keys: string[], checked: boolean): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  if (keys.length === 0) return;
  if (checked) {
    await db
      .insert(checklistChecks)
      .values(keys.map((key) => ({ userId, key })))
      .onConflictDoNothing({ target: [checklistChecks.userId, checklistChecks.key] });
  } else {
    await db
      .delete(checklistChecks)
      .where(and(eq(checklistChecks.userId, userId), inArray(checklistChecks.key, keys)));
  }
}
