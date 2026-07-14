"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems } from "@/lib/db/schema";
import { ensureUser } from "./user";
import type { BagId } from "@/lib/types";

export interface ListRow {
  itemId: string;
  qty: number;
  bag: BagId | null;
}

export async function getMyList(): Promise<ListRow[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const rows = await db
    .select({ itemId: listItems.itemId, qty: listItems.qty, bag: listItems.bag })
    .from(listItems)
    .where(eq(listItems.userId, userId));
  return rows.map((r) => ({
    itemId: r.itemId,
    qty: r.qty,
    bag: (r.bag ?? null) as BagId | null,
  }));
}

/**
 * Add the item to the user's list if absent, remove it if present.
 * When adding, initialQty seeds the qty column (from recommendedQty()); default 1.
 */
export async function toggleListItem(
  itemId: string,
  initialQty = 1,
): Promise<{ added: boolean }> {
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
  await db.insert(listItems).values({
    userId,
    itemId,
    qty: Math.max(1, Math.floor(initialQty)),
    bag: null,
  });
  return { added: true };
}

export async function setQty(itemId: string, qty: number): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  const clean = Math.max(0, Math.floor(qty));
  if (clean === 0) {
    // qty=0 means "not on my list" — delete the row so the checkbox reads unchecked
    await db
      .delete(listItems)
      .where(and(eq(listItems.userId, userId), eq(listItems.itemId, itemId)));
    return;
  }
  await db
    .insert(listItems)
    .values({ userId, itemId, qty: clean, bag: null })
    .onConflictDoUpdate({
      target: [listItems.userId, listItems.itemId],
      set: { qty: sql`excluded.qty` },
    });
}

export async function assignBag(itemId: string, bag: BagId | null): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
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
  entries: { itemId: string; qty: number; bag: BagId | null }[],
): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  if (entries.length === 0) return;
  await db
    .insert(listItems)
    .values(
      entries.map((e) => ({
        userId,
        itemId: e.itemId,
        qty: Math.max(1, Math.floor(e.qty)),
        bag: e.bag,
      })),
    )
    .onConflictDoNothing();
}
