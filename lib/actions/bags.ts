"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureUser } from "./user";
import { BAG_CATALOG, type BagId } from "@/lib/types";

const VALID = new Set(BAG_CATALOG.map((b) => b.id));

function sanitize(active: BagId[]): BagId[] {
  const seen = new Set<BagId>();
  for (const id of active) if (VALID.has(id)) seen.add(id);
  return BAG_CATALOG.filter((b) => seen.has(b.id)).map((b) => b.id);
}

export async function getMyBagConfig(): Promise<BagId[] | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db
    .select({ bagConfig: profiles.bagConfig })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (!row?.bagConfig) return null;
  const active = sanitize(row.bagConfig as BagId[]);
  return active.length ? active : null;
}

export async function saveBagConfig(active: BagId[]): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  const clean = sanitize(active);
  await db
    .insert(profiles)
    .values({ userId, bagConfig: clean })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { bagConfig: sql`excluded.bag_config`, updatedAt: sql`now()` },
    });
}
