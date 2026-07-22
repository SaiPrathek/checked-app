"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customItems } from "@/lib/db/schema";
import { ensureUser } from "./user";
import type { Category, CustomItem, Verdict } from "@/lib/types";

function toCustomItem(row: typeof customItems.$inferSelect): CustomItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    weightKg: Number(row.weightKg),
    volumeL: row.volumeL == null ? undefined : Number(row.volumeL),
    transport: (row.transport as CustomItem["transport"]) ?? undefined,
    verdict: (row.verdict as Verdict | null) ?? undefined,
    note: row.note ?? undefined,
    aiFilled: row.aiFilled,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getMyCustomItems(): Promise<CustomItem[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const rows = await db
    .select()
    .from(customItems)
    .where(eq(customItems.userId, userId));
  return rows.map(toCustomItem);
}

export async function saveCustomItem(item: CustomItem): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  const values = {
    userId,
    id: item.id,
    name: item.name.trim(),
    category: item.category,
    weightKg: item.weightKg.toString(),
    volumeL: item.volumeL == null ? null : item.volumeL.toString(),
    transport: item.transport ?? null,
    verdict: item.verdict ?? null,
    note: item.note ?? null,
    aiFilled: item.aiFilled ?? false,
  };
  await db
    .insert(customItems)
    .values(values)
    .onConflictDoUpdate({
      target: [customItems.userId, customItems.id],
      set: {
        name: values.name,
        category: values.category,
        weightKg: values.weightKg,
        volumeL: values.volumeL,
        transport: values.transport,
        verdict: values.verdict,
        note: values.note,
        aiFilled: values.aiFilled,
      },
    });
}

export async function deleteCustomItem(id: string): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  await db
    .delete(customItems)
    .where(and(eq(customItems.userId, userId), eq(customItems.id, id)));
}
