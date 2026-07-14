"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems } from "@/lib/db/schema";
import { ensureUser } from "./user";
import type { BagId } from "@/lib/types";

export interface ListRow {
  itemId: string;
  bag: BagId | null;
}

export async function getMyList(): Promise<ListRow[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const rows = await db
    .select({ itemId: listItems.itemId, bag: listItems.bag })
    .from(listItems)
    .where(eq(listItems.userId, userId));
  return rows.map((r) => ({ itemId: r.itemId, bag: (r.bag ?? null) as BagId | null }));
}

/** Add the item to the user's list if absent, remove it if present. */
export async function toggleListItem(itemId: string): Promise<{ added: boolean }> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  const existing = await db
    .select({ itemId: listItems.itemId })
    .from(listItems)
    .where(and(eq(listItems.userId, userId), eq(listItems.itemId, itemId)));
  if (existing.length) {
    await db
      .delete(listItems)
      .where(and(eq(listItems.userId, userId), eq(listItems.itemId, itemId)));
    return { added: false };
  }
  await db.insert(listItems).values({ userId, itemId, bag: null });
  return { added: true };
}

export async function assignBag(itemId: string, bag: BagId | null): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  // upsert — if not in list yet, add it into the target bag
  await db
    .insert(listItems)
    .values({ userId, itemId, bag })
    .onConflictDoUpdate({
      target: [listItems.userId, listItems.itemId],
      set: { bag: sql`excluded.bag` },
    });
}

/** Bulk-import a local list on first sign-in — used to migrate anonymous localStorage state. */
export async function importList(
  entries: { itemId: string; bag: BagId | null }[],
): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  if (entries.length === 0) return;
  await db
    .insert(listItems)
    .values(entries.map((e) => ({ userId, itemId: e.itemId, bag: e.bag })))
    .onConflictDoNothing();
}
