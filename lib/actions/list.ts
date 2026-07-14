"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems } from "@/lib/db/schema";
import { ensureUser } from "./user";
import type { Allocation, BagId } from "@/lib/types";

export interface ListRow {
  itemId: string;
  qty: number;
  allocation: Allocation;
}

function cleanAllocation(a: Allocation | null | undefined, qty: number): Allocation {
  const out: Allocation = {};
  let used = 0;
  for (const bag of ["cabin", "bag1", "bag2"] as BagId[]) {
    const n = Math.max(0, Math.floor(a?.[bag] ?? 0));
    const take = Math.min(n, qty - used);
    if (take > 0) {
      out[bag] = take;
      used += take;
    }
  }
  return out;
}

export async function getMyList(): Promise<ListRow[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const rows = await db
    .select({
      itemId: listItems.itemId,
      qty: listItems.qty,
      bag: listItems.bag,
      allocation: listItems.allocation,
    })
    .from(listItems)
    .where(eq(listItems.userId, userId));
  return rows.map((r) => {
    // migrate legacy single-bag rows on read: bag=X → all units in X
    const legacy: Allocation | null =
      !r.allocation && r.bag ? { [r.bag as BagId]: r.qty } : null;
    return {
      itemId: r.itemId,
      qty: r.qty,
      allocation: cleanAllocation((r.allocation as Allocation) ?? legacy, r.qty),
    };
  });
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
    allocation: null,
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
    .values({ userId, itemId, qty: clean, bag: null, allocation: null })
    .onConflictDoUpdate({
      target: [listItems.userId, listItems.itemId],
      set: { qty: sql`excluded.qty` },
    });
}

/** Persist one item's per-bag unit split. Empty allocation = unpacked. */
export async function setAllocation(
  itemId: string,
  allocation: Allocation,
): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  await db
    .insert(listItems)
    .values({ userId, itemId, bag: null, allocation })
    .onConflictDoUpdate({
      target: [listItems.userId, listItems.itemId],
      set: { allocation: sql`excluded.allocation`, bag: sql`NULL` },
    });
}

/** Persist a whole loadsheet (Auto-Pack result) in one round trip. */
export async function setAllocations(
  entries: { itemId: string; allocation: Allocation }[],
): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  for (const e of entries) {
    await db
      .insert(listItems)
      .values({ userId, itemId: e.itemId, bag: null, allocation: e.allocation })
      .onConflictDoUpdate({
        target: [listItems.userId, listItems.itemId],
        set: { allocation: sql`excluded.allocation`, bag: sql`NULL` },
      });
  }
}

/** Bulk-import a local list on first sign-in — used to migrate anonymous localStorage state. */
export async function importList(
  entries: { itemId: string; qty: number; allocation: Allocation }[],
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
        bag: null,
        allocation: e.allocation,
      })),
    )
    .onConflictDoNothing();
}
